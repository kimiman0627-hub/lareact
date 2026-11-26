#!/usr/bin/env bash
# =============================================================================
# GitHub Actions self-hosted runner 설치 (미니PC 자동 배포용)
#
# 1) 로컬 PC 에서 등록 토큰 발급 (1시간 유효):
#      gh api -X POST repos/kimiman0627-hub/lareact/actions/runners/registration-token -q .token
#    또는 GitHub → 저장소 Settings → Actions → Runners → New self-hosted runner 화면의 토큰
#
# 2) 미니PC 에서 앱 사용자(kim)로 실행 (root 아님):
#      bash ~/www/lareact/deploy/install-runner.sh <토큰>
#
# 러너는 'minipc' 라벨로 등록되며, deploy.yml 의 deploy 잡이 이 라벨을 사용함.
# =============================================================================
set -euo pipefail

TOKEN="${1:?사용법: bash install-runner.sh <registration-token>}"
REPO_URL="${REPO_URL:-https://github.com/kimiman0627-hub/lareact}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
RUNNER_NAME="${RUNNER_NAME:-minipc-$(hostname)}"
LABELS="${LABELS:-minipc}"

[[ $EUID -ne 0 ]] || { echo "root 가 아닌 앱 사용자(kim)로 실행하세요."; exit 1; }

case "$(uname -m)" in
    x86_64)  ARCH=x64 ;;
    aarch64) ARCH=arm64 ;;
    *) echo "지원하지 않는 아키텍처: $(uname -m)"; exit 1 ;;
esac

VERSION="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | grep -oP '"tag_name":\s*"v\K[^"]+')"
echo "==> actions/runner v${VERSION} (${ARCH}) → ${RUNNER_DIR}"

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
if [[ ! -f ./config.sh ]]; then
    curl -fsSL -o runner.tar.gz \
        "https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-${ARCH}-${VERSION}.tar.gz"
    tar xzf runner.tar.gz
    rm -f runner.tar.gz
    sudo ./bin/installdependencies.sh
fi

./config.sh --unattended --replace \
    --url "$REPO_URL" \
    --token "$TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$LABELS" \
    --work _work

# systemd 서비스로 등록 → 재부팅 후에도 자동 실행
sudo ./svc.sh install "$USER"
sudo ./svc.sh start
sudo ./svc.sh status --no-pager || true

echo
echo "==> 완료. GitHub 저장소 Settings → Actions → Runners 에서 '${RUNNER_NAME}' 이 Idle 인지 확인하세요."
