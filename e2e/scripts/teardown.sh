#!/bin/bash
# ============================================================================
# teardown.sh — E2E test environment teardown
# ============================================================================
# Rolls back the E2E seed data from the database.
#
# Usage:
#   DATABASE_URL="postgresql://..." ./e2e/scripts/teardown.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== DA1 E2E Teardown ==="

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set."
  echo "Usage: DATABASE_URL=\"postgresql://...\" $0"
  exit 1
fi

echo "Rolling back E2E seed data..."
psql "$DATABASE_URL" -f "$SCRIPT_DIR/rollback-e2e.sql"
echo "Done. E2E test data cleaned up."
