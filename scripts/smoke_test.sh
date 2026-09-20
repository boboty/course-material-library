#!/usr/bin/env bash
set -euo pipefail

port="$(.venv/bin/python - <<'PY'
import socket
with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
)"
log_file="$(mktemp)"
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$port" >"$log_file" 2>&1 &
server_pid=$!

cleanup() {
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
    rm -f "$log_file"
}
trap cleanup EXIT

ready=false
for _ in {1..50}; do
    if ! kill -0 "$server_pid" 2>/dev/null; then
        cat "$log_file"
        exit 1
    fi
    if curl --silent --output /dev/null "http://127.0.0.1:$port/api/v1/health"; then
        ready=true
        break
    fi
    sleep 0.1
done
if [[ "$ready" != true ]]; then
    cat "$log_file"
    echo "Uvicorn did not become ready" >&2
    exit 1
fi

SMOKE_PORT="$port" .venv/bin/python - <<'PY'
import json
import os
from urllib.error import HTTPError
from urllib.request import urlopen

base = f"http://127.0.0.1:{os.environ['SMOKE_PORT']}"
with urlopen(f"{base}/api/v1/health") as response:
    assert response.status == 200
    assert json.load(response) == {"status": "ok"}
    assert response.headers.get("X-Request-ID")
print("health: HTTP 200, JSON and X-Request-ID PASS")

try:
    urlopen(f"{base}/api/v1/not-found")
except HTTPError as response:
    assert response.code == 404
    body = json.load(response)
    request_id = response.headers.get("X-Request-ID")
    assert request_id
    assert body == {"error": {
        "code": "NOT_FOUND",
        "message": "Resource not found",
        "request_id": request_id,
    }}
    print("not-found: HTTP 404, error JSON and request ID match PASS")
else:
    raise AssertionError("Expected HTTP 404")
PY
