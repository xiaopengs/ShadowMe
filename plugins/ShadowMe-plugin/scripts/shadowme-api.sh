#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"

if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

SHADOWME_URL="${SHADOWME_URL:-${SHADOW_BOARD_URL:-http://localhost:3000}}"
SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOW_API_KEY:-}}"
SHADOWME_URL="${SHADOWME_URL%/}"

if [ -z "$SHADOWME_URL" ]; then
  echo '{"error": "SHADOWME_URL not configured"}' >&2
  exit 2
fi

api_request() {
  local method="${1:-GET}"
  local path="${2:-/}"
  local body="${3:-}"
  local url="${SHADOWME_URL}${path}"
  
  local curl_args=(-s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -H "Accept: application/json")
  
  if [ -n "$SHADOWME_API_KEY" ]; then
    curl_args+=(-H "x-cc-api-key: $SHADOWME_API_KEY")
  fi
  
  if [ -n "$body" ]; then
    curl_args+=(-d "$body")
  fi
  
  local response
  response=$(curl "${curl_args[@]}" "$url" 2>&1) || {
    echo "Error: Failed to connect to $url" >&2
    exit 5
  }
  
  local status_code
  status_code=$(echo "$response" | tail -n1)
  local resp_body
  resp_body=$(echo "$response" | sed '$d')
  
  case "$status_code" in
    2*) echo "$resp_body" ;;
    401|403) echo "{\"error\": \"Auth failed\", \"status\": $status_code}" >&2; exit 4 ;;
    404) echo "{\"error\": \"Not found\", \"status\": $status_code}" >&2; exit 3 ;;
    *) echo "{\"error\": \"API failed\", \"status\": $status_code}" >&2; exit 3 ;;
  esac
}

case "${1:-help}" in
  GET|POST|PATCH|DELETE) api_request "$@" ;;
  tasks) api_request "GET" "/api/tasks?status=${2:-pending}" ;;
  task) api_request "GET" "/api/tasks/$2" ;;
  take) api_request "POST" "/api/tasks/$2/take" ;;
  complete) api_request "POST" "/api/tasks/$2/complete" "{\"result\":{\"type\":\"text\",\"summary\":\"${3:-Completed}\"}}" ;;
  status) api_request "GET" "/api/status" ;;
  shadow) api_request "GET" "/api/shadow/status" ;;
  heartbeat) api_request "POST" "/api/shadow/status" "{\"status\":\"online\",\"lastHeartbeat\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" ;;
  help|--help|-h)
    echo "Usage: shadowme-api.sh <COMMAND>"
    echo ""
    echo "Commands:"
    echo "  tasks [status]    List tasks (default: pending)"
    echo "  task <id>         Get task details"
    echo "  take <id>         Take a task"
    echo "  complete <id> [s] Complete a task"
    echo "  status            Board status"
    echo "  shadow            Shadow status"
    echo "  heartbeat         Send heartbeat"
    echo ""
    echo "Or use HTTP methods directly:"
    echo "  shadowme-api.sh GET /api/tasks"
    echo "  shadowme-api.sh POST /api/tasks '{...}'"
    ;;
  *) echo "Unknown command: $1" >&2; exit 1 ;;
esac
