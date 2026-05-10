#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

SHADOWME_URL="${SHADOWME_URL:-${SHADOW_BOARD_URL:-http://localhost:3000}}"
SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOW_API_KEY:-}}"
SHADOWME_URL="${SHADOWME_URL%/}"

TASK_ID="${CURRENT_TASK_ID:-}"
MESSAGE="${1:-Progress update}"
PROGRESS="${2:-}"

[ -z "$SHADOWME_URL" ] && exit 0

BODY=$(cat <<EOF
{
  "type": "task.progress",
  "taskId": "$TASK_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "message": "$MESSAGE"
  ${PROGRESS:+, "progress": $PROGRESS}
}
EOF
)

curl -s -X POST "${SHADOWME_URL}/api/webhook/cc" \
  -H "Content-Type: application/json" \
  ${SHADOWME_API_KEY:+-H "x-cc-api-key: $SHADOWME_API_KEY"} \
  -d "$BODY" \
  > /dev/null 2>&1 || true
