#!/usr/bin/env bash
# 确保 E2E 使用独立、已迁移到最新 head 的本地数据库。
# 安全门禁：
#   1) 数据库名必须符合安全字符集，且必须以 _e2e 结尾；
#   2) 明确拒绝 benyan、benyan_test、postgres 等非 E2E 名称；
#   3) 连接参数同样做格式校验，避免拼出畸形或注入式连接串；
#   4) 只用固定 SQL 文本，数据库名通过 psql 变量传入，不做字符串拼接。
set -euo pipefail
cd "$(dirname "$0")/.."

fail() {
  echo "e2e_db.sh: $1" >&2
  exit 1
}

e2e_db="${E2E_POSTGRES_DB:-benyan_e2e}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-benyan}"
PGPASSWORD="${PGPASSWORD:-benyan_local}"

# 1) 安全字符集 + 长度上限：仅允许小写字母、数字、下划线，且必须以字母开头
[[ "$e2e_db" =~ ^[a-z][a-z0-9_]{0,62}$ ]] || fail \
  "非法的 E2E 数据库名 '$e2e_db'：只允许小写字母、数字和下划线，且以字母开头（最长 63 字符）"

# 2) 必须是 E2E 专用库
[[ "$e2e_db" == *_e2e ]] || fail \
  "拒绝使用 '$e2e_db'：E2E 数据库名必须以 _e2e 结尾（默认 benyan_e2e）"

# 3) 显式拒绝开发库、测试库和系统库
for forbidden in benyan benyan_test benyan_dev postgres template0 template1; do
  [[ "$e2e_db" != "$forbidden" ]] || fail "拒绝使用 '$e2e_db'：该名称不是 E2E 专用数据库"
done

# 4) 连接参数校验，防止拼出畸形或注入式连接串
[[ "$PGHOST" =~ ^[A-Za-z0-9._-]+$ ]] || fail "非法的 PGHOST '$PGHOST'"
[[ "$PGPORT" =~ ^[0-9]{1,5}$ ]] || fail "非法的 PGPORT '$PGPORT'"
[[ "$PGUSER" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]] || fail "非法的 PGUSER '$PGUSER'"
[[ "$PGPASSWORD" =~ ^[A-Za-z0-9_.~-]+$ ]] || fail \
  "非法的 PGPASSWORD：只允许字母、数字和 _ . ~ -，避免污染连接串"

export PGHOST PGPORT PGUSER PGPASSWORD
command -v psql >/dev/null 2>&1 || fail "未找到 psql，无法准备 E2E 数据库"

# 数据库名已通过校验，并以 psql 变量传入（不参与 SQL 文本拼接）。
# 变量插值只在 stdin 模式下生效，因此不使用 -c。
if echo "select 1 from pg_database where datname = :'dbname'" \
    | psql -d postgres -v dbname="$e2e_db" -At | grep -q 1; then
  echo "e2e database $e2e_db already exists"
else
  echo "create database :\"dbname\"" \
    | psql -d postgres -v dbname="$e2e_db" >/dev/null
  echo "created e2e database $e2e_db"
fi

DATABASE_URL="postgresql+asyncpg://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${e2e_db}" \
  .venv/bin/alembic upgrade head
echo "e2e database $e2e_db is at alembic head"
