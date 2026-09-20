#!/usr/bin/env bash
# E2E 数据库名安全门禁的脚本级验证。
# 只验证拒绝路径与默认路径参数，不创建或删除任何数据库。
set -euo pipefail
cd "$(dirname "$0")/.."

script="./scripts/e2e_db.sh"
failures=0

expect_rejected() {
  local name="$1"
  local label="$2"
  local output status
  set +e
  output="$(E2E_POSTGRES_DB="$name" "$script" 2>&1)"
  status=$?
  set -e
  if [[ $status -eq 1 ]]; then
    echo "rejected as expected: $label"
  else
    echo "FAIL: $label should be rejected (exit $status)" >&2
    failures=$((failures + 1))
  fi
  if [[ "$output" == *"e2e_db.sh:"* ]]; then
    :
  else
    echo "FAIL: $label did not produce a clear e2e_db.sh error message" >&2
    failures=$((failures + 1))
  fi
}

# 误指开发库 / 测试库 / 系统库
expect_rejected "benyan" "development database"
expect_rejected "benyan_test" "test database"
expect_rejected "benyan_dev" "development database alias"
expect_rejected "postgres" "system database"
expect_rejected "template1" "system template database"

# 不以 _e2e 结尾
expect_rejected "benyan_acceptance" "non e2e suffix"
expect_rejected "benyan_e2e_prod" "non e2e suffix with e2e inside"

# 非法字符与 SQL 注入尝试
expect_rejected "benyan_e2e;drop database benyan" "SQL injection attempt"
expect_rejected "benyan_e2e';drop--" "quote injection attempt"
expect_rejected "benyan-e2e" "hyphenated name"
expect_rejected "benyan e2e" "whitespace in name"
expect_rejected " " "whitespace only name"
expect_rejected "Benyan_e2e" "uppercase name"
expect_rejected "1benyan_e2e" "leading digit"
expect_rejected "benyan_e2e\$(whoami)" "command substitution attempt"
expect_rejected "benyan_e2e\`id\`" "backtick attempt"
expect_rejected "бenyan_e2e" "non-ascii name"

# 连接参数注入
set +e
output="$(PGPASSWORD="benyan_local@evil" E2E_POSTGRES_DB="benyan_check_e2e" "$script" 2>&1)"
status=$?
set -e
if [[ $status -eq 1 && "$output" == *"PGPASSWORD"* ]]; then
  echo "rejected as expected: unsafe PGPASSWORD"
else
  echo "FAIL: unsafe PGPASSWORD should be rejected before connecting" >&2
  failures=$((failures + 1))
fi

set +e
output="$(PGHOST="localhost;drop" E2E_POSTGRES_DB="benyan_check_e2e" "$script" 2>&1)"
status=$?
set -e
if [[ $status -eq 1 && "$output" == *"PGHOST"* ]]; then
  echo "rejected as expected: unsafe PGHOST"
else
  echo "FAIL: unsafe PGHOST should be rejected before connecting" >&2
  failures=$((failures + 1))
fi

# 拒绝路径不得创建任何数据库
export PGPASSWORD="${PGPASSWORD:-benyan_local}"
if command -v psql >/dev/null 2>&1; then
  leftovers="$(psql -h "${PGHOST:-localhost}" -U "${PGUSER:-benyan}" -d postgres -Atc \
    "select count(*) from pg_database where datname in ('benyan_acceptance','benyan_e2e_prod')" 2>/dev/null || echo "skip")"
  if [[ "$leftovers" == "0" || "$leftovers" == "skip" ]]; then
    echo "no database created by rejected names"
  else
    echo "FAIL: rejected names created databases (count=$leftovers)" >&2
    failures=$((failures + 1))
  fi
fi

if [[ $failures -ne 0 ]]; then
  echo "e2e db guard verification failed: $failures problem(s)" >&2
  exit 1
fi
echo "e2e db guard verification PASS"
