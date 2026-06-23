#!/bin/bash
# ============================================================================
# setup.sh — E2E test environment setup
# ============================================================================
# 1. Seeds the database with test data
# 2. Starts Expo dev server
# 3. Boots iOS Simulator (optional)
#
# Prerequisites:
#   - Maestro CLI installed: curl -Ls "https://get.maestro.mobile.dev" | bash
#   - psql client with access to DATABASE_URL
#   - Node.js / npx expo
#
# Usage:
#   chmod +x e2e/scripts/setup.sh
#   DATABASE_URL="postgresql://..." ./e2e/scripts/setup.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$E2E_DIR")"

echo "=== DA1 E2E Setup ==="
echo ""

# --- Step 1: Seed database ---
echo "[1/3] Seeding E2E test data..."
if [ -z "$DATABASE_URL" ]; then
  echo "  WARNING: DATABASE_URL not set. Skipping DB seed."
  echo "  Set DATABASE_URL and re-run to seed test data."
else
  psql "$DATABASE_URL" -f "$SCRIPT_DIR/seed-e2e.sql"
  echo "  Done. E2E test data seeded (IDs 800000-800099)."
fi

# --- Step 2: Start Expo dev server ---
echo "[2/3] Starting Expo dev server..."
cd "$PROJECT_DIR"
npx expo start --ios --port 8081 &
EXPO_PID=$!
echo "  Expo PID: $EXPO_PID"
echo "  Wait for Metro bundler to be ready..."

# Wait for Metro to be ready (poll the status endpoint)
for i in $(seq 1 30); do
  if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "  Metro bundler ready."
    break
  fi
  sleep 2
done

# --- Step 3: Boot iOS Simulator (optional) ---
echo "[3/3] Booting iOS Simulator..."
if xcrun simctl list devices booted | grep -q "iPhone"; then
  echo "  Simulator already booted."
else
  # Boot the first available iPhone simulator
  SIMULATOR_ID=$(xcrun simctl list devices available iPhone | grep -m 1 "iPhone" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
  if [ -n "$SIMULATOR_ID" ]; then
    xcrun simctl boot "$SIMULATOR_ID"
    open -a Simulator
    echo "  Booting simulator: $SIMULATOR_ID"
  else
    echo "  No iPhone simulator found. Open Simulator.app manually."
  fi
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Verify Expo Go is installed on the simulator"
echo "  2. Run tests: maestro test e2e/flows/suite01-auth/"
echo "  3. Or run all:   ./e2e/scripts/run-all.sh"
echo ""
echo "To teardown: DATABASE_URL=\"\$DATABASE_URL\" ./e2e/scripts/teardown.sh"
echo ""
echo "Environment variables for tests:"
echo "  EXPO_PUBLIC_API_URL=http://localhost:8000"
echo "  E2E_USER_DOCUMENTO=12345678"
echo "  E2E_ADMIN_DOCUMENTO=00000003"
