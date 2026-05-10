#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

SHADOWME_URL="${SHADOWME_URL:-${SHADOW_BOARD_URL:-http://localhost:3000}}"
SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOW_API_KEY:-}}"
SHADOWME_URL="${SHADOWME_URL%/}"

STATUS="online"
[ -n "${CURRENT_TASK_ID:-}" ] && STATUS="busy"

curl -s -X POST "${SHADOWME_URL}/api/shadow/status" \
  -H "Content-Type: application/json" \
  ${SHADOWME_API_KEY:+-H "x-cc-api-key: $SHADOWME_API_KEY"} \
  -d "{\"status\":\"${STATUS}\",\"lastHeartbeat\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  > /dev/null 2>&1 || true
