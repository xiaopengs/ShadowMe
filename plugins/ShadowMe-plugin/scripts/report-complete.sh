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
SUMMARY="${1:-Task completed}"

COMMIT_SHA=""
if command -v git &> /dev/null && git rev-parse HEAD &> /dev/null 2>&1; then
  COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "")
fi

BODY=$(cat <<EOF
{
  "type": "task.complete",
  "taskId": "$TASK_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": "$SUMMARY"
  ${COMMIT_SHA:+, "commitSha": "$COMMIT_SHA"}
}
EOF
)

curl -s -X POST "${SHADOWME_URL}/api/webhook/cc" \
  -H "Content-Type: application/json" \
  ${SHADOWME_API_KEY:+-H "x-cc-api-key: $SHADOWME_API_KEY"} \
  -d "$BODY" \
  > /dev/null 2>&1 || true
