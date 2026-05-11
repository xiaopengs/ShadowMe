#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $(date '+%H:%M:%S') $1"
}

log_warn() {
  echo -e "${YELLOW}⚠️${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
  echo -e "${RED}❌${NC} $(date '+%H:%M:%S') $1"
}

log_task() {
  echo -e "${CYAN}📋${NC} $(date '+%H:%M:%S') $1"
}

# API request helper
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

# Send protocol message
send_message() {
  local msg_type=$1
  local data=$2
  
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local msg_data="{\"type\":\"${msg_type}\",\"timestamp\":\"${timestamp}\",\"messageId\":\"${msg_type}-$(date +%s)\",\"senderId\":\"shadow-1\",${data}}"
  
  api_request "POST" "/api/webhook/cc" "$msg_data" >/dev/null 2>&1
}

# Take a task
take_task() {
  local task_id=$1
  
  log_task "Taking task ${task_id}..."
  
  local response
  response=$(api_request "POST" "/api/tasks/${task_id}/take")
  
  if echo "$response" | grep -q '"id"'; then
    log_success "Task taken"
    send_message "task.assign" "\"taskId\":\"${task_id}\""
    return 0
  else
    log_error "Failed to take task"
    return 1
  fi
}

# One-time scan for existing pending tasks on startup
scan_existing_tasks() {
  log_info "Scanning for existing pending tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=pending")
  
  # Check if there are tasks (simple grep for "id" field)
  local task_count
  task_count=$(echo "$response" | grep -o '"status":"pending"' | wc -l)
  
  if [ "$task_count" -eq 0 ]; then
    log_info "No existing pending tasks"
    return
  fi
  
  log_info "Found ${task_count} pending task(s), processing..."
  
  # Use shadowme-tools to handle each task
  if command -v jq &> /dev/null; then
    local task_ids
    task_ids=$(echo "$response" | jq -r '.tasks[]?.id // empty' 2>/dev/null)
    
    for task_id in $task_ids; do
      take_task "$task_id"
    done
  fi
}

# SSE event-driven task listener
# Uses curl to listen to SSE stream and react to task.created events
listen_sse() {
  log_info "Connecting to SSE stream..."
  
  local sse_url="${SHADOWME_URL}/api/sse?channels=task,shadow,stats"
  local headers=("-H" "Accept: text/event-stream")
  [ -n "$SHADOWME_API_KEY" ] && headers+=("-H" "x-cc-api-key: $SHADOWME_API_KEY")
  
  # Use curl with streaming to listen for SSE events
  curl -N "${headers[@]}" "$sse_url" 2>/dev/null | while IFS= read -r line; do
    # Parse SSE event lines
    case "$line" in
      event:\ task.created)
        log_task "SSE: task.created event received!"
        # Next data line will contain the task info
        read -r data_line
        if [[ "$data_line" == data:* ]]; then
          local task_data="${data_line#data: }"
          
          # Extract task ID using simple parsing (jq if available)
          local task_id=""
          if command -v jq &> /dev/null; then
            task_id=$(echo "$task_data" | jq -r '.data.task.id // .data.id // empty' 2>/dev/null)
          else
            # Simple grep-based extraction
            task_id=$(echo "$task_data" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
          fi
          
          if [ -n "$task_id" ]; then
            log_task "New task detected via SSE: [${task_id:0:8}]"
            take_task "$task_id"
          fi
        fi
        ;;
      event:\ shadow:status)
        # Shadow status update — no action needed
        ;;
      event:\ connected)
        log_success "SSE connected"
        ;;
      :*)
        # Heartbeat comment — ignore
        ;;
    esac
  done
}

# Main
main() {
  log_info "🚀 ShadowMe Executor starting (SSE event-driven mode)..."
  log_info "Board URL: ${SHADOWME_URL}"
  log_info "Press Ctrl+C to stop"
  echo ""
  
  # 1. One-time scan for existing tasks
  scan_existing_tasks
  
  # 2. Send initial heartbeat
  send_message "sync.heartbeat" "\"status\":\"online\""
  
  # 3. Listen to SSE for new tasks (event-driven, no polling)
  log_info "Listening for task.created events via SSE..."
  listen_sse
}

# Handle signals
trap 'echo ""; log_info "Shutting down..."; exit 0' INT TERM

main
