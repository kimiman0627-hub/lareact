#!/usr/bin/env bash
# =============================================================================
# Cloudflare Tunnel 로 도메인을 미니PC 에 연결
#  - 공유기 포트포워딩 불필요, HTTPS 자동 (Cloudflare 가 처리)
#
# 사용법 (미니PC 에서 kim 계정으로, sudo 붙이지 말 것):
#   bash ~/www/lareact/deploy/cloudflare-tunnel.sh krlived.com
#
# 여러 번 실행해도 안전함. 기존 DNS 레코드를 덮어쓰기 전에는 y/N 으로 물어봄.
# =============================================================================
set -euo pipefail

DOMAIN="${1:?사용법: bash cloudflare-tunnel.sh <도메인>  (예: krlived.com)}"
TUNNEL_NAME="${TUNNEL_NAME:-lareact}"
APP_DIR="${APP_DIR:-$HOME/www/lareact}"
HOSTS=("$DOMAIN" "www.$DOMAIN")

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
[[ $EUID -ne 0 ]] || { echo "sudo 없이 kim 계정으로 실행하세요. (필요할 때 비밀번호를 물어봅니다)"; exit 1; }

# -----------------------------------------------------------------------------
log "1. cloudflared 설치"
if ! command -v cloudflared >/dev/null; then
    ARCH="$(dpkg --print-architecture)"   # amd64 / arm64
    curl -fsSL -o /tmp/cloudflared.deb \
        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"
    sudo dpkg -i /tmp/cloudflared.deb
    rm -f /tmp/cloudflared.deb
fi
cloudflared --version

# -----------------------------------------------------------------------------
log "2. Cloudflare 계정 인증"
if [[ ! -f "$HOME/.cloudflared/cert.pem" ]]; then
    echo "잠시 후 https://dash.cloudflare.com/argotunnel?... 로 시작하는 주소가 나옵니다."
    echo "그 주소를 PC 크롬 주소창에 붙여넣고 → ${DOMAIN} 선택 → Authorize 클릭."
    echo "브라우저에서 완료하면 여기 화면이 자동으로 다음 단계로 넘어갑니다."
    cloudflared tunnel login
else
    echo "이미 인증됨 ($HOME/.cloudflared/cert.pem)"
fi

# -----------------------------------------------------------------------------
log "3. 터널 생성 (${TUNNEL_NAME})"
get_tunnel_id() {
    cloudflared tunnel list --name "$TUNNEL_NAME" -o json 2>/dev/null \
        | grep -oE '"id": *"[0-9a-f-]{36}"' | head -1 | cut -d'"' -f4 || true
}
TUNNEL_ID="$(get_tunnel_id)"
if [[ -z "$TUNNEL_ID" ]]; then
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID="$(get_tunnel_id)"
fi
[[ -n "$TUNNEL_ID" ]] || { echo "터널 ID 를 찾지 못했습니다."; exit 1; }
CRED="$HOME/.cloudflared/${TUNNEL_ID}.json"
[[ -f "$CRED" ]] || { echo "터널 인증 파일이 없습니다: $CRED"; echo "다른 PC 에서 만든 터널이면 TUNNEL_NAME=다른이름 으로 다시 실행하세요."; exit 1; }
echo "터널 ID: $TUNNEL_ID"

# -----------------------------------------------------------------------------
log "4. 터널 설정 파일 (/etc/cloudflared/config.yml)"
sudo mkdir -p /etc/cloudflared
sudo cp "$CRED" "/etc/cloudflared/${TUNNEL_ID}.json"
sudo chmod 600 "/etc/cloudflared/${TUNNEL_ID}.json"
{
    echo "tunnel: ${TUNNEL_ID}"
    echo "credentials-file: /etc/cloudflared/${TUNNEL_ID}.json"
    echo "ingress:"
    for h in "${HOSTS[@]}"; do
        echo "  - hostname: ${h}"
        echo "    service: http://localhost:80"
    done
    echo "  - service: http_status:404"
} | sudo tee /etc/cloudflared/config.yml >/dev/null
cat /etc/cloudflared/config.yml
sudo cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate

# -----------------------------------------------------------------------------
log "5. DNS 연결 (도메인 → 이 터널)"
for h in "${HOSTS[@]}"; do
    if OUT="$(cloudflared tunnel route dns "$TUNNEL_NAME" "$h" 2>&1)"; then
        echo "$OUT"
        continue
    fi
    if grep -qi "already exist" <<<"$OUT"; then
        echo
        echo "⚠️  ${h} 에 이미 DNS 레코드가 있습니다 (예전 서버를 가리키는 레코드)."
        echo "    덮어쓰면 ${h} 접속이 이 미니PC 로 바뀌고, 예전 레코드는 사라집니다."
        read -rp "    ${h} 레코드를 이 터널로 덮어쓸까요? [y/N] " ans
        if [[ "$ans" =~ ^[Yy]$ ]]; then
            cloudflared tunnel route dns --overwrite-dns "$TUNNEL_NAME" "$h"
        else
            echo "    ${h} 는 건너뜀"
        fi
    else
        echo "$OUT"; exit 1
    fi
done

# -----------------------------------------------------------------------------
log "6. 서비스 등록 (재부팅 후에도 자동 실행)"
if ! systemctl cat cloudflared >/dev/null 2>&1; then
    sudo cloudflared service install
fi
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sleep 3
systemctl --no-pager --lines=5 status cloudflared || true

# -----------------------------------------------------------------------------
log "7. 앱 주소(APP_URL) 를 https://${DOMAIN} 로 변경"
if [[ -f "$APP_DIR/.env" ]]; then
    sed -i -E "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" "$APP_DIR/.env"
    (cd "$APP_DIR" && php artisan config:clear)
fi

# -----------------------------------------------------------------------------
log "8. 접속 확인"
sleep 5
for h in "${HOSTS[@]}"; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${h}/" || true)"
    echo "  https://${h}  →  HTTP ${code}"
done
echo
echo "200 이 나오면 완료입니다. 000 이나 5xx 면 1~2분 뒤 다시 확인하거나 아래 로그를 보세요:"
echo "  sudo journalctl -u cloudflared -n 50 --no-pager"
