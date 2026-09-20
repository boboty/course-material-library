#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
(.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000) &
backend_pid=$!
(cd web && exec ./node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort) &
frontend_pid=$!
cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT
trap "exit 0" INT TERM
while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done
echo "Backend or frontend exited" >&2
exit 1
