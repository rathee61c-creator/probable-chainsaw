#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4173}"
OUT_DIR="${OUT_DIR:-/tmp}"
VIEWPORT="${VIEWPORT:-1440,1100}"

if ! command -v google-chrome >/dev/null 2>&1 && ! command -v google-chrome-stable >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Google Chrome is required for screenshots in this environment.

Playwright's bundled Chromium download can be blocked by network/proxy rules,
so this project uses the installed Chrome channel instead of running
`playwright install chromium`.

Install Chrome first, then rerun this script. On Ubuntu, one option is:
  curl -L https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /tmp/google-chrome.deb
  sudo apt-get install -y /tmp/google-chrome.deb
MSG
  exit 1
fi

mkdir -p "$OUT_DIR"
python3 -m http.server "$PORT" --directory "$ROOT_DIR" >/tmp/guesthouse-screenshot-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for attempt in {1..30}; do
  if python3 - <<PY >/dev/null 2>&1
from urllib.request import urlopen
urlopen('http://127.0.0.1:${PORT}/index.html', timeout=1).close()
PY
  then
    break
  fi
  sleep 0.25
  if [[ "$attempt" == "30" ]]; then
    echo "The local screenshot server did not start on port $PORT." >&2
    exit 1
  fi
done

npx --yes playwright@latest screenshot --channel chrome --viewport-size="$VIEWPORT" \
  "http://127.0.0.1:${PORT}/index.html" "$OUT_DIR/guest-request-page.png"
npx --yes playwright@latest screenshot --channel chrome --viewport-size="$VIEWPORT" \
  "http://127.0.0.1:${PORT}/admin.html" "$OUT_DIR/admin-allotment-page.png"

echo "Screenshots saved to:"
echo "  $OUT_DIR/guest-request-page.png"
echo "  $OUT_DIR/admin-allotment-page.png"
