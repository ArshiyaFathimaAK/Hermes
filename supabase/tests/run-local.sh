#!/usr/bin/env bash
# Runs every migration and the policy tests in a throwaway local Postgres. Touches nothing in Supabase.
# Needs PostgreSQL 17 or newer installed (initdb, pg_ctl, psql on the PATH). macOS or Linux.
#   bash supabase/tests/run-local.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
PORT="${PORT:-5499}"
trap 'pg_ctl -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

initdb -D "$WORK/data" -U postgres -A trust >/dev/null
pg_ctl -D "$WORK/data" -o "-k '' -p $PORT -c listen_addresses=127.0.0.1" -l "$WORK/log" -w start >/dev/null
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$PORT" -U postgres)

"${PSQL[@]}" -f "$HERE/supabase-stub.sql"
for migration in "$HERE"/../migrations/*.sql; do
  echo "applied $(basename "$migration")"
  "${PSQL[@]}" -f "$migration"
done
"${PSQL[@]}" -P footer=off -P tuples_only=on -f "$HERE/policies-test.sql" 2>&1 \
  | sed -n 's/.*NOTICE:  //p; s/.*ERROR:  /ERROR: /p; /ALL TESTS PASSED/p'
