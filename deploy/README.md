# 미니PC 서버 배포 가이드

로컬(Windows)에서 개발하고, `main` 브랜치에 push 하면 미니PC 서버에 자동 배포되는 구조입니다.

```
[로컬 PC] 개발 → git push origin main
      │
      ▼
[GitHub Actions] test 잡 (GitHub 클라우드에서 PHPUnit + PostgreSQL)
      │ 통과 시
      ▼
[미니PC self-hosted runner] deploy 잡 → git pull → composer/npm build → migrate → queue:restart
      │
      ▼
[미니PC] Nginx + PHP-FPM + PostgreSQL + Supervisor(큐) + cron(스케줄러)
      │
      ▼
[외부 접속] Cloudflare Tunnel (권장) 또는 공유기 포트포워딩
```

러너가 미니PC 에서 GitHub 로 **바깥쪽 연결**만 하므로, 배포를 위해 공유기 포트를 열 필요가 없습니다.

---

## 0. 미니PC 준비 (최초 1회)

1. **Ubuntu Server 24.04 LTS** 설치 (22.04 도 가능), 사용자 `kim` 생성
2. 공유기 관리 페이지에서 미니PC 에 **고정 IP(DHCP 예약)** 지정 — 예: `192.168.219.128`
3. 로컬 PC 에서 SSH 키 등록 (PowerShell):

   ```powershell
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh kim@192.168.219.128 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```

   이후 `ssh kim@192.168.219.128` 이 비밀번호 없이 접속되면 OK.
   편하게 쓰려면 로컬 `~/.ssh/config` 에 추가:

   ```
   Host minipc
       HostName 192.168.219.128
       User kim
       IdentityFile ~/.ssh/id_ed25519
   ```

## 1. 서버 세팅 (최초 1회)

미니PC 에 SSH 접속 후:

```bash
git clone https://github.com/kimiman0627-hub/lareact.git ~/www/lareact
sudo APP_USER=kim bash ~/www/lareact/deploy/server-setup.sh
```

도메인이 있으면 `DOMAIN=example.com`, Elasticsearch 까지 설치하려면 `INSTALL_ES=1` 을 앞에 붙입니다.

```bash
sudo APP_USER=kim DOMAIN=example.com INSTALL_ES=1 bash ~/www/lareact/deploy/server-setup.sh
```

스크립트가 하는 일:

| 항목 | 내용 |
|------|------|
| 패키지 | Nginx, PHP-FPM (OS 기본 버전, 8.2 이상), PostgreSQL, Redis, Supervisor, Node 22, Composer |
| DB | `lareact` DB/계정 생성, 비밀번호 자동 생성 후 `.env` 에 저장 |
| `.env` | `.env.example` 복사 후 운영값(APP_ENV=production, APP_DEBUG=false, pgsql 등) 설정 |
| 빌드 | `composer install --no-dev`, `npm ci && npm run build`, `migrate`, `storage:link` |
| PHP-FPM | `kim` 권한 전용 풀 → `storage/` 쓰기 권한 문제 없음 |
| Nginx | `deploy/nginx/lareact.conf` 설치 |
| 큐 | Supervisor 로 `queue:work` 상시 실행 |
| 스케줄러 | `kim` crontab 에 `schedule:run` 등록 (크롤링, AI 요약, Threads/Blogger 발행) |
| 방화벽 | ufw: SSH, 80, 443 만 허용 |

세팅 후:

```bash
cd ~/www/lareact
nano .env                                              # API 키 입력 (아래 표)
php artisan config:clear
php artisan db:seed --class=AdminSeeder --force        # 관리자 계정 생성
```

> ⚠️ `AdminSeeder` 는 `admin@gmail.com / admin1234` 로 생성합니다. 외부 공개 전에 반드시 비밀번호를 바꾸세요.

`.env` 에 채워야 할 값:

| 키 | 용도 |
|----|------|
| `APP_URL` | 실제 접속 주소 (예: `https://example.com`) |
| `FILE_STORAGE`, `NCP_STORAGE_*`, `NCP_CDN_URL` | 파일 저장소 (LOCAL 이면 미니PC 디스크 사용) |
| `ANTHROPIC_API_KEY` | AI 게시글 요약 |
| `BLOGGER_*` | Google Blogger 자동 발행 |
| `KAKAO_JS_KEY` | 카카오 공유 (변경 시 `npm run build` 다시 필요) |
| `BOBAEDREAM_PROXY` | 보배드림 크롤링 프록시 |

## 2. 자동 배포 러너 등록 (최초 1회)

로컬 PC 에서 등록 토큰 발급 (1시간 유효):

```bash
gh api -X POST repos/kimiman0627-hub/lareact/actions/runners/registration-token -q .token
```

미니PC 에서 (`kim` 사용자, sudo 아님):

```bash
bash ~/www/lareact/deploy/install-runner.sh <위에서 받은 토큰>
```

GitHub → 저장소 Settings → Actions → Runners 에서 `minipc-...` 가 **Idle** 이면 완료입니다.

> 예전 NCP 서버용 러너 `ncp-server` 가 offline 상태로 남아 있습니다. 더 이상 안 쓰면 같은 화면에서 삭제하세요.
> deploy 잡은 이제 `minipc` 라벨 러너에서만 실행됩니다.

## 3. 외부에서 접속하기

### A. Cloudflare Tunnel (권장)

- 공유기 포트포워딩 불필요, 집 IP 노출 안 됨, HTTPS 인증서 자동
- 도메인을 Cloudflare 에 등록해야 함

```bash
# 미니PC 에서
curl -fsSL -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

Cloudflare 대시보드 → Zero Trust → Networks → Tunnels → Create tunnel → 표시되는
`sudo cloudflared service install <토큰>` 명령을 미니PC 에서 실행 → Public Hostname 에
`example.com` → `http://localhost:80` 추가.

그 다음 `.env` 의 `APP_URL=https://example.com` 으로 바꾸고 `php artisan config:clear`.
Nginx 설정이 터널의 `X-Forwarded-Proto: https` 를 PHP 에 넘기므로 Laravel 쪽 추가 설정은 필요 없습니다.

### B. 공유기 포트포워딩 + Let's Encrypt

1. 공유기에서 외부 80, 443 → `192.168.219.128` 80, 443 포워딩
2. 도메인 A 레코드를 집 공인 IP 로 지정 (유동 IP 면 DDNS 필요)
3. 인증서:

   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com
   ```

## 4. 일상 개발 흐름

```bash
# 로컬
git checkout -b feature/xxx
php artisan serve        # http://localhost:8000
npm run dev
# ... 개발 & 테스트 ...
git push origin feature/xxx   # PR 생성 → test 잡만 실행
# PR 머지 (또는 main 에 push) → test 통과 후 미니PC 에 자동 배포
```

배포 진행 상황은 GitHub → Actions 탭에서 확인합니다.

## 5. 문제 해결

```bash
tail -f ~/www/lareact/storage/logs/laravel-$(date +%F).log   # 앱 로그
tail -f ~/www/lareact/storage/logs/worker.log                # 큐 워커 로그
sudo tail -f /var/log/nginx/error.log                        # Nginx 에러
sudo supervisorctl status                                    # 큐 워커 상태
sudo systemctl status nginx postgresql "php*-fpm"            # 서비스 상태
sudo systemctl status 'actions.runner.*'                     # 배포 러너 상태
crontab -l                                                   # 스케줄러 등록 확인
php artisan schedule:list                                    # 스케줄 목록
```

- **배포 후 502 Bad Gateway**: `sudo systemctl restart php*-fpm`
- **이미지가 안 보임**: `php artisan storage:link` 실행 여부, `ls -la public/storage` 확인
- **배포 잡이 Queued 에서 멈춤**: 러너 offline → `sudo systemctl restart 'actions.runner.*'`
- **서버에서 직접 파일을 수정한 경우**: `git pull --ff-only` 가 실패합니다. 서버에서는 수정하지 말고 로컬에서 수정 후 push 하세요.
