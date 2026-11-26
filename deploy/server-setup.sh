#!/usr/bin/env bash
# =============================================================================
# lareact 미니PC 서버 초기 세팅 스크립트 (Ubuntu 22.04 / 24.04 기준)
#
# 사용법 (서버에서, sudo 가능한 계정으로):
#   git clone https://github.com/kimiman0627-hub/lareact.git ~/www/lareact
#   sudo APP_USER=kim DOMAIN=example.com bash ~/www/lareact/deploy/server-setup.sh
#
# 여러 번 실행해도 안전하도록(idempotent) 작성됨.
# 환경변수로 동작을 바꿀 수 있음 (아래 기본값 참고).
# =============================================================================
set -euo pipefail

APP_USER="${APP_USER:-kim}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/www/lareact}"
REPO_URL="${REPO_URL:-https://github.com/kimiman0627-hub/lareact.git}"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-_}"                 # 도메인 없으면 "_" (IP 로 접속)
PHP_VER="${PHP_VER:-}"                # 비우면 OS 기본 PHP 버전 자동 감지 (8.2 이상 필요)
NODE_MAJOR="${NODE_MAJOR:-22}"
DB_NAME="${DB_NAME:-lareact}"
DB_USER="${DB_USER:-lareact}"
DB_PASS="${DB_PASS:-}"                # 비우면 자동 생성 (최초 1회, .env 에 저장)
INSTALL_ES="${INSTALL_ES:-0}"         # 1 이면 Docker + Elasticsearch(nori) 설치
ENABLE_UFW="${ENABLE_UFW:-1}"

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
as_app() { sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && $*"; }

[[ $EUID -eq 0 ]] || { echo "sudo 로 실행하세요."; exit 1; }
id "$APP_USER" >/dev/null 2>&1 || { echo "사용자 $APP_USER 가 없습니다. (APP_USER=... 로 지정)"; exit 1; }
. /etc/os-release
[[ "$ID" == "ubuntu" ]] || echo "경고: Ubuntu 가 아닙니다($ID). 패키지 이름이 다를 수 있습니다."

export DEBIAN_FRONTEND=noninteractive

# -----------------------------------------------------------------------------
log "1. 기본 패키지"
apt-get update -y
apt-get install -y software-properties-common ca-certificates curl gnupg git unzip \
    nginx postgresql postgresql-contrib redis-server supervisor acl openssl

# PHP 설치
# - 기본: OS 기본 PHP 를 버전 없는 패키지 이름(php-fpm, php-pgsql ...)으로 설치 → 설치 후 실제 버전 확인
# - OS 기본 PHP 가 8.2 미만이면 (Ubuntu 22.04 = 8.1) ondrej PPA 에서 8.3 설치
# - PHP_VER=8.x 로 직접 지정하면 그 버전 패키지 설치
ver_ge_82() { [[ "$(printf '%s\n8.2\n' "$1" | sort -V | head -1)" == "8.2" ]]; }
PHP_PKGS=(fpm cli pgsql mbstring xml curl zip gd intl bcmath redis)
# 후보 버전 예: "2:8.3+93ubuntu2" → 8.3
DEFAULT_PHP="$(LC_ALL=C apt-cache policy php-fpm 2>/dev/null \
    | sed -nE 's/^[[:space:]]*Candidate: ([0-9]+:)?([0-9]+\.[0-9]+).*/\2/p' | head -1 || true)"
echo "OS: $PRETTY_NAME / OS 기본 PHP: ${DEFAULT_PHP:-찾을 수 없음}"

if [[ -z "$PHP_VER" && -n "$DEFAULT_PHP" ]] && ver_ge_82 "$DEFAULT_PHP"; then
    apt-get install -y "${PHP_PKGS[@]/#/php-}"
else
    if [[ -z "$PHP_VER" ]]; then
        if [[ "$ID" != "ubuntu" || "${VERSION_CODENAME:-}" != "jammy" ]]; then
            echo "PHP 8.2 이상을 OS 기본 저장소에서 찾지 못했습니다. 아래 결과를 확인하세요:"
            LC_ALL=C apt-cache policy php-fpm
            exit 1
        fi
        PHP_VER=8.3
        add-apt-repository -y ppa:ondrej/php
        apt-get update -y
    fi
    apt-get install -y "${PHP_PKGS[@]/#/php${PHP_VER}-}"
fi
PHP_VER="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
ver_ge_82 "$PHP_VER" || { echo "설치된 PHP $PHP_VER 은 8.2 미만입니다."; exit 1; }
[[ -d "/etc/php/${PHP_VER}/fpm/pool.d" ]] || { echo "/etc/php/${PHP_VER}/fpm 이 없습니다. php${PHP_VER}-fpm 설치를 확인하세요."; exit 1; }
echo "설치된 PHP: $PHP_VER"

# -----------------------------------------------------------------------------
log "2. Composer"
if ! command -v composer >/dev/null; then
    EXPECTED="$(curl -fsSL https://composer.github.io/installer.sig)"
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    ACTUAL="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
    [[ "$EXPECTED" == "$ACTUAL" ]] || { echo "Composer 설치파일 체크섬 불일치"; exit 1; }
    php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm -f /tmp/composer-setup.php
fi

# -----------------------------------------------------------------------------
log "3. Node.js ${NODE_MAJOR}.x (Vite 7 은 Node 20.19+ 필요)"
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
fi

# -----------------------------------------------------------------------------
log "4. 소스 체크아웃 ($APP_DIR)"
sudo -u "$APP_USER" mkdir -p "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
    sudo -u "$APP_USER" git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
else
    sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

# -----------------------------------------------------------------------------
log "5. PostgreSQL DB/계정"
ENV_FILE="$APP_DIR/.env"
if [[ -z "$DB_PASS" && -f "$ENV_FILE" ]]; then
    DB_PASS="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)"
fi
NEW_DB_PASS=0
if [[ -z "$DB_PASS" || "$DB_PASS" == "null" ]]; then DB_PASS="$(openssl rand -hex 16)"; NEW_DB_PASS=1; fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
    || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

# -----------------------------------------------------------------------------
log "6. .env (운영용)"
if [[ ! -f "$ENV_FILE" ]]; then
    sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$ENV_FILE"
fi
chmod 600 "$ENV_FILE"
set_env() {  # set_env KEY VALUE : 있으면 교체(주석 처리된 키 포함), 없으면 추가
    local k="$1" v="$2"
    if grep -qE "^#?[[:space:]]*${k}=" "$ENV_FILE"; then
        sed -i -E "s|^#?[[:space:]]*${k}=.*|${k}=${v}|" "$ENV_FILE"
    else
        echo "${k}=${v}" >> "$ENV_FILE"
    fi
}
if [[ "$DOMAIN" == "_" ]]; then
    APP_URL_VAL="http://$(hostname -I | awk '{print $1}')"
else
    APP_URL_VAL="https://${DOMAIN}"
fi
set_env APP_ENV production
set_env APP_DEBUG false
grep -qE '^APP_URL=http://localhost$' "$ENV_FILE" && set_env APP_URL "$APP_URL_VAL"
set_env LOG_CHANNEL daily
set_env LOG_LEVEL warning
set_env DB_CONNECTION pgsql
set_env DB_HOST 127.0.0.1
set_env DB_PORT 5432
set_env DB_DATABASE "$DB_NAME"
set_env DB_USERNAME "$DB_USER"
set_env DB_PASSWORD "$DB_PASS"
set_env REDIS_CLIENT phpredis
set_env ELASTICSEARCH_HOST http://127.0.0.1:9200
chown "$APP_USER":"$APP_USER" "$ENV_FILE"

# -----------------------------------------------------------------------------
log "7. 의존성 설치 / 빌드 / 마이그레이션"
as_app "composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev"
grep -qE '^APP_KEY=.+' "$ENV_FILE" || as_app "php artisan key:generate --force"
as_app "npm ci && npm run build"
as_app "php artisan migrate --force"
as_app "php artisan storage:link || true"
as_app "php artisan optimize:clear"

# -----------------------------------------------------------------------------
log "8. PHP-FPM 전용 풀 (앱 사용자 권한으로 실행 → storage 쓰기 권한 문제 방지)"
cat > "/etc/php/${PHP_VER}/fpm/pool.d/lareact.conf" <<POOL
[lareact]
user = ${APP_USER}
group = ${APP_USER}
listen = /run/php/lareact.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660
pm = dynamic
pm.max_children = 10
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
pm.max_requests = 500
php_admin_value[upload_max_filesize] = 50M
php_admin_value[post_max_size] = 55M
php_admin_value[memory_limit] = 256M
php_admin_value[date.timezone] = Asia/Seoul
POOL
systemctl enable "php${PHP_VER}-fpm"
systemctl restart "php${PHP_VER}-fpm"

# nginx(www-data)가 홈 디렉토리를 지나 public/ 과 업로드 파일을 읽을 수 있도록 ACL 부여
setfacl -m u:www-data:x "/home/${APP_USER}" "$(dirname "$APP_DIR")"
setfacl -m u:www-data:rX "$APP_DIR" "$APP_DIR/storage" "$APP_DIR/storage/app"
setfacl -R -m u:www-data:rX -m d:u:www-data:rX "$APP_DIR/public" "$APP_DIR/storage/app/public"

# -----------------------------------------------------------------------------
log "9. Nginx"
sed -e "s|__APP_DIR__|${APP_DIR}|g" -e "s|__DOMAIN__|${DOMAIN}|g" -e "s|__PHP_SOCK__|/run/php/lareact.sock|g" \
    "$APP_DIR/deploy/nginx/lareact.conf" > /etc/nginx/sites-available/lareact
ln -sf /etc/nginx/sites-available/lareact /etc/nginx/sites-enabled/lareact
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

# -----------------------------------------------------------------------------
log "10. 큐 워커 (Supervisor)"
sed -e "s|__APP_DIR__|${APP_DIR}|g" -e "s|__APP_USER__|${APP_USER}|g" \
    "$APP_DIR/deploy/supervisor/lareact-worker.conf" > /etc/supervisor/conf.d/lareact-worker.conf
systemctl enable --now supervisor
supervisorctl reread
supervisorctl update
supervisorctl restart 'lareact-worker:*' || true

# -----------------------------------------------------------------------------
log "11. 스케줄러 (cron → 크롤링 / AI 요약 / Threads·Blogger 발행)"
CRON_LINE="* * * * * cd ${APP_DIR} && php artisan schedule:run >> /dev/null 2>&1"
( crontab -u "$APP_USER" -l 2>/dev/null | grep -vF "artisan schedule:run" || true; echo "$CRON_LINE" ) | crontab -u "$APP_USER" -
timedatectl set-timezone Asia/Seoul || true

# -----------------------------------------------------------------------------
if [[ "$INSTALL_ES" == "1" ]]; then
    log "12. Docker + Elasticsearch (nori)"
    if ! command -v docker >/dev/null; then
        curl -fsSL https://get.docker.com | sh
        usermod -aG docker "$APP_USER"
    fi
    sysctl -w vm.max_map_count=262144
    grep -q '^vm.max_map_count' /etc/sysctl.conf || echo "vm.max_map_count=262144" >> /etc/sysctl.conf
    (cd "$APP_DIR" && docker compose -f docker-compose.elasticsearch.yml up -d --build)
    echo "주의: 9200 포트는 공유기에서 절대 포트포워딩 하지 말 것 (인증 없음)"
fi

# -----------------------------------------------------------------------------
if [[ "$ENABLE_UFW" == "1" ]]; then
    log "13. 방화벽 (ufw: SSH, HTTP, HTTPS 만 허용)"
    apt-get install -y ufw
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
fi

# -----------------------------------------------------------------------------
log "완료!"
echo "  앱 경로   : $APP_DIR"
echo "  접속 주소 : $(grep -E '^APP_URL=' "$ENV_FILE" | cut -d= -f2-)"
[[ "$NEW_DB_PASS" == "1" ]] && echo "  DB 비밀번호는 새로 생성되어 .env 의 DB_PASSWORD 에 저장됨"
echo
echo "다음 단계 (deploy/README.md 참고):"
echo "  1) $ENV_FILE 에 API 키 등 나머지 값 입력 (NCP, ANTHROPIC, BLOGGER, KAKAO ...)"
echo "  2) 관리자 계정:  cd $APP_DIR && php artisan db:seed --class=AdminSeeder --force"
echo "     → 기본 비밀번호(admin1234)는 로그인 후 즉시 변경"
echo "  3) 자동 배포 러너 등록:  bash deploy/install-runner.sh <토큰>"
