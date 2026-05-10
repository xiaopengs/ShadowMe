#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# Load config
CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

SHADOWME_URL="${SHADOWME_URL:-${SHADOW_BOARD_URL:-http://localhost:3000}}"
SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOW_API_KEY:-}}"
SHADOWME_URL="${SHADOWME_URL%/}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

api_request() {
  local method=$1
  local path=$2
  local data=${3:-}

  local url="${SHADOWME_URL}${path}"
  local opts=("-s" "-H" "Accept: application/json")
  
  [ -n "$SHADOWME_API_KEY" ] && opts+=("-H" "x-cc-api-key: $SHADOWME_API_KEY")
  opts+=("-X" "$method")

  if [ -n "$data" ]; then
    opts+=("-H" "Content-Type: application/json" "-d" "$data")
  fi

  curl "${opts[@]}" "$url"
}

cmd_help() {
  echo "
🔮 ShadowMe Simple CLI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  help              - Show this help message
  status            - Show current status
  tasks             - List pending tasks
  take <taskId>     - Take a specific task
  info <taskId>     - Show task details
  complete <taskId> [summary] - Complete a task

Examples:
  # Check pending tasks
  shadowme-simple tasks
  
  # Take a task
  shadowme-simple take 39f007dc-30cb-4c9c-88fc-f1a210328f34
  
  # Complete a task
  shadowme-simple complete 39f007dc-30cb-4c9c-88fc-f1a210328f34 \"Task completed\"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
}

cmd_status() {
  log_info "Checking ShadowMe status..."
  
  echo "
🟢 ShadowMe Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Board URL: ${SHADOWME_URL}
  API Key: ${SHADOWME_API_KEY:+Configured}${SHADOWME_API_KEY:-Not set (dev mode)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  
  echo "Fetching tasks..."
  api_request "GET" "/api/tasks"
}

cmd_tasks() {
  log_info "Fetching pending tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=pending")
  
  echo "
📋 Pending Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  echo "$response"
}

cmd_take() {
  local taskId=$1
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    return 1
  fi
  
  log_info "Taking task ${taskId}..."
  
  local response
  response=$(api_request "POST" "/api/tasks/${taskId}/take")
  
  echo "$response"
  
  # Send task.assign message
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local msg_data="{\"type\":\"task.assign\",\"taskId\":\"${taskId}\",\"taskTitle\":\"Task\",\"timestamp\":\"${timestamp}\",\"messageId\":\"assign-$(date +%s)\",\"senderId\":\"shadow-1\"}"
  
  api_request "POST" "/api/webhook/cc" "$msg_data" >/dev/null 2>&1 || true
  
  log_success "Task taken"
}

cmd_info() {
  local taskId=$1
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    return 1
  fi
  
  log_info "Fetching task ${taskId}..."
  
  api_request "GET" "/api/tasks/${taskId}"
}

cmd_complete() {
  local taskId=$1
  local summary=${2:-"Task completed"}
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    return 1
  fi
  
  log_info "Completing task ${taskId}..."
  
  local result_data="{\"result\":{\"type\":\"text\",\"summary\":\"${summary}\"}}"
  local response
  response=$(api_request "POST" "/api/tasks/${taskId}/complete" "$result_data")
  
  echo "$response"
  
  # Send task.complete message
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local msg_data="{\"type\":\"task.complete\",\"taskId\":\"${taskId}\",\"summary\":\"${summary}\",\"timestamp\":\"${timestamp}\",\"messageId\":\"complete-$(date +%s)\",\"senderId\":\"shadow-1\"}"
  
  api_request "POST" "/api/webhook/cc" "$msg_data" >/dev/null 2>&1 || true
  
  log_success "Task completed"
}

# Main command dispatcher
case "${1:-help}" in
  help)
    cmd_help
    ;;
  status)
    cmd_status
    ;;
  tasks)
    cmd_tasks
    ;;
  take)
    cmd_take "${2:-}"
    ;;
  info)
    cmd_info "${2:-}"
    ;;
  complete)
    cmd_complete "${2:-}" "${3:-}"
    ;;
  *)
    cmd_help
    ;;
esac
