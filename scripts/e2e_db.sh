#!/usr/bin/env bash
# 确保 E2E 使用独立、已迁移到最新 head 的本地数据库。
# 只操作专用 E2E 数据库，不连接任何真实业务数据库。
set -euo pipefail
cd "$(dirname "$0")/.."

e2e_db="${E2E_POSTGRES_DB:-benyan_e2e}"
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-benyan}"
export PGPASSWORD="${PGPASSWORD:-benyan_local}"

if psql -d postgres -Atc "select 1 from pg_database where datname = '$e2e_db'" | grep -q 1; then
  echo "e2e database $e2e_db already exists"
else
  psql -d postgres -c "create database $e2e_db" >/dev/null
  echo "created e2e database $e2e_db"
fi

DATABASE_URL="postgresql+asyncpg://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${e2e_db}" \
  .venv/bin/alembic upgrade head
echo "e2e database $e2e_db is at alembic head"
