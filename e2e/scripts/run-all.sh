#!/bin/bash
# ============================================================================
# run-all.sh — Run all E2E test suites with Maestro
# ============================================================================
# Runs each suite sequentially. Stops on first failure.
#
# Prerequisites:
#   - ./e2e/scripts/setup.sh completed
#   - Maestro CLI installed
#   - EXPO_PUBLIC_API_URL set (defaults to http://localhost:8000)
#
# Usage:
#   chmod +x e2e/scripts/run-all.sh
#   EXPO_PUBLIC_API_URL=http://localhost:8000 ./e2e/scripts/run-all.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$E2E_DIR")"

cd "$PROJECT_DIR"

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:8000}"
export E2E_USER_DOCUMENTO="${E2E_USER_DOCUMENTO:-12345678}"
export E2E_USER_PASSWORD="${E2E_USER_PASSWORD:-password123}"
export E2E_NOAPROBADO_DOCUMENTO="${E2E_NOAPROBADO_DOCUMENTO:-99999991}"
export E2E_NOAPROBADO_PASSWORD="${E2E_NOAPROBADO_PASSWORD:-password123}"
export E2E_BLOQUEADO_DOCUMENTO="${E2E_BLOQUEADO_DOCUMENTO:-99999992}"
export E2E_BLOQUEADO_PASSWORD="${E2E_BLOQUEADO_PASSWORD:-password123}"
export E2E_ADMIN_DOCUMENTO="${E2E_ADMIN_DOCUMENTO:-00000003}"
export E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-12345678}"
export E2E_SUBASTA_ID_ABIERTA="${E2E_SUBASTA_ID_ABIERTA:-800010}"
export E2E_SUBASTA_ID_EN_VIVO="${E2E_SUBASTA_ID_EN_VIVO:-800011}"
export E2E_SUBASTA_ID_FINALIZADA="${E2E_SUBASTA_ID_FINALIZADA:-800012}"

echo "=== DA1 E2E Test Runner ==="
echo "API URL: $EXPO_PUBLIC_API_URL"
echo ""

SUITES=(
  "suite01-auth"
  "suite02-subastas-invitado"
  "suite03-subastas-autenticado"
  "suite04-perfil"
  "suite05-consignar"
  "suite06-admin"
  "suite07-red-offline"
  "suite08-navegacion-ux"
)

PASSED=0
FAILED=0
TOTAL=${#SUITES[@]}

for suite in "${SUITES[@]}"; do
  SUITE_PATH="$E2E_DIR/flows/$suite"
  SUITE_NAME=$(echo "$suite" | sed 's/suite[0-9]*-//' | tr '-' ' ')

  echo "--- [$((PASSED + FAILED + 1))/$TOTAL] Running: $SUITE_NAME ---"

  if maestro test "$SUITE_PATH" 2>&1; then
    PASSED=$((PASSED + 1))
    echo "  PASSED: $suite"
  else
    FAILED=$((FAILED + 1))
    echo "  FAILED: $suite"
  fi
  echo ""
done

echo "=== Results ==="
echo "Passed: $PASSED / $TOTAL"
echo "Failed: $FAILED / $TOTAL"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
