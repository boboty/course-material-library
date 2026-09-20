#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/dev.sh &
stack_pid=$!
cleanup() {
  kill "$stack_pid" 2>/dev/null || true
  wait "$stack_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
for i in {1..100}; do
  if ! kill -0 "$stack_pid" 2>/dev/null; then echo "Stack exited before readiness" >&2; exit 1; fi
  if curl --silent --fail --output /dev/null http://127.0.0.1:5173/; then break; fi
  sleep 0.2
done
ready=false
for i in {1..100}; do
  if ! kill -0 "$stack_pid" 2>/dev/null; then echo "Stack exited before backend readiness" >&2; exit 1; fi
  if curl --silent --fail --output /dev/null http://127.0.0.1:5173/api/v1/health; then ready=true; break; fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then echo "Backend did not become ready through Vite proxy" >&2; exit 1; fi
cd web
npm run e2e
