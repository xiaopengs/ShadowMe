#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

SHADOWME_URL="${SHADOWME_URL:-${SHADOW_BOARD_URL:-http://localhost:3000}}"
SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOW_API_KEY:-}}"
SHADOWME_URL="${SHADOWME_URL%/}"

STATUS="${1:-pending}"

curl -s "${SHADOWME_URL}/api/tasks?status=${STATUS}" \
  -H "Accept: application/json" \
  ${SHADOWME_API_KEY:+-H "x-cc-api-key: $SHADOWME_API_KEY"} \
  2>/dev/null || echo '{"tasks":[]}'
