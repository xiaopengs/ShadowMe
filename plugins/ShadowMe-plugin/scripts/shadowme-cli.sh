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

CURL_OPTS=("-s" "-H" "Accept: application/json")
[ -n "$SHADOWME_API_KEY" ] && CURL_OPTS+=("-H" "x-cc-api-key: $SHADOWME_API_KEY")

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
  local opts=("${CURL_OPTS[@]}" "-X" "$method")

  if [ -n "$data" ]; then
    opts+=("-H" "Content-Type: application/json" "-d" "$data")
  fi

  curl "${opts[@]}" "$url"
}

cmd_help() {
  echo "
🔮 ShadowMe CLI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: shadowme <command> [options]

Commands:
  help              - Show this help message
  status            - Show current status
  tasks [status]    - List tasks (default: pending)
  take <taskId>     - Take a specific task
  info <taskId>     - Show task details
  complete <taskId> [summary] - Complete a task
  monitor           - Start monitoring for new tasks
  heartbeat         - Send heartbeat
  send <type> <data> - Send a protocol message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
}

cmd_status() {
  log_info "Checking ShadowMe status..."
  
  local tasks
  tasks=$(api_request "GET" "/api/tasks")
  
  local pending_count
  pending_count=$(echo "$tasks" | jq -r '.tasks | map(select(.status == "pending")) | length' 2>/dev/null || echo "0")
  
  local in_progress_count
  in_progress_count=$(echo "$tasks" | jq -r '.tasks | map(select(.status == "in_progress")) | length' 2>/dev/null || echo "0")

  echo "
🟢 ShadowMe Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Board URL: ${SHADOWME_URL}
  API Key: ${SHADOWME_API_KEY:+Configured}${SHADOWME_API_KEY:-Not set (dev mode)}
  Pending Tasks: ${pending_count}
  In Progress: ${in_progress_count}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
}

cmd_tasks() {
  local status=${1:-pending}
  
  log_info "Fetching ${status} tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=${status}")
  
  local tasks
  tasks=$(echo "$response" | jq -r '.tasks // []')
  
  local count
  count=$(echo "$tasks" | jq -r 'length')
  
  if [ "$count" -eq 0 ]; then
    log_success "No ${status} tasks found"
    return 0
  fi

  echo "
📋 ${status^} Tasks (${count})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  
  echo "$tasks" | jq -r '.[] | "  [\(.id | .[0:8])] \(.title)\n    Type: \(.type) | Priority: \(.priority)\n    Created by: \(.createdBy)\n"'
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
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    local title
    title=$(echo "$response" | jq -r '.title')
    log_success "Task taken: ${title}"
    
    # Send task.assign message
    local msg_data
    msg_data=$(jq -n \
      --arg type "task.assign" \
      --arg taskId "$taskId" \
      --arg taskTitle "$title" \
      --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      --arg messageId "assign-$(date +%s)" \
      --arg senderId "shadow-1" \
      '{
        type: $type,
        taskId: $taskId,
        taskTitle: $taskTitle,
        timestamp: $timestamp,
        messageId: $messageId,
        senderId: $senderId
      }')
    
    api_request "POST" "/api/webhook/cc" "$msg_data" >/dev/null
    
    echo "$response" | jq -r '"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task Details:
  Title: \(.title)
  Type: \(.type)
  Priority: \(.priority)
  Description:
\(.description)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'
  else
    log_error "Failed to take task"
    echo "$response"
    return 1
  fi
}

cmd_info() {
  local taskId=$1
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    return 1
  fi
  
  log_info "Fetching task ${taskId}..."
  
  local response
  response=$(api_request "GET" "/api/tasks/${taskId}")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    echo "$response" | jq -r '"
📋 Task Details: \(.id)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Title: \(.title)
  Type: \(.type)
  Priority: \(.priority)
  Status: \(.status)
  Created by: \(.createdBy)
  Created at: \(.createdAt)
  \((.startedAt // "") as $s | if $s != "" then "Started at: \($s)" else "" end)
  \((.completedAt // "") as $c | if $c != "" then "Completed at: \($c)" else "" end)

Description:
\(.description)

Tags: \((.tags // []) | join(", "))
\((.expectedDelivery // "") as $e | if $e != "" then "Expected Delivery: \($e)" else "" end)
\((.result // "") as $r | if $r != "" then "
Result:
  Type: \($r.type)
  Summary: \($r.summary)
  \((($r.url // "") as $u | if $u != "" then "URL: \($u)" else "" end))
" else "" end)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'
  else
    log_error "Task not found"
    return 1
  fi
}

cmd_complete() {
  local taskId=$1
  local summary=${2:-"Task completed"}
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    return 1
  fi
  
  log_info "Completing task ${taskId}..."
  
  local result_data
  result_data=$(jq -n \
    --arg type "text" \
    --arg summary "$summary" \
    '{result: {type: $type, summary: $summary}}')
  
  local response
  response=$(api_request "POST" "/api/tasks/${taskId}/complete" "$result_data")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    local title
    title=$(echo "$response" | jq -r '.title')
    log_success "Task completed: ${title}"
    
    # Send task.complete message
    local msg_data
    msg_data=$(jq -n \
      --arg type "task.complete" \
      --arg taskId "$taskId" \
      --arg summary "$summary" \
      --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      --arg messageId "complete-$(date +%s)" \
      --arg senderId "shadow-1" \
      '{
        type: $type,
        taskId: $taskId,
        summary: $summary,
        timestamp: $timestamp,
        messageId: $messageId,
        senderId: $senderId
      }')
    
    api_request "POST" "/api/webhook/cc" "$msg_data" >/dev/null
  else
    log_error "Failed to complete task"
    echo "$response"
    return 1
  fi
}

cmd_monitor() {
  log_info "Starting task monitor... (Press Ctrl+C to stop)"
  log_info "Checking for new tasks every 10 seconds"
  
  trap 'echo ""; log_info "Stopping monitor..."; exit 0' INT TERM
  
  declare -A seen_tasks
  
  while true; do
    local tasks
    tasks=$(api_request "GET" "/api/tasks?status=pending")
    
    local task_count
    task_count=$(echo "$tasks" | jq -r '.tasks | length' 2>/dev/null || echo "0")
    
    if [ "$task_count" -gt 0 ]; then
      while IFS= read -r task; do
        local task_id
        task_id=$(echo "$task" | jq -r '.id')
        local task_title
        task_title=$(echo "$task" | jq -r '.title')
        
        if [ -z "${seen_tasks[$task_id]:-}" ]; then
          seen_tasks[$task_id]=1
          log_info "New task detected: ${task_title} [${task_id:0:8}]"
          
          # Auto take the task
          cmd_take "$task_id"
        fi
      done < <(echo "$tasks" | jq -c '.tasks[]')
    fi
    
    # Send heartbeat
    local heartbeat_data
    heartbeat_data=$(jq -n \
      --arg type "sync.heartbeat" \
      --arg status "online" \
      --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      --arg messageId "heartbeat-$(date +%s)" \
      --arg senderId "shadow-1" \
      '{
        type: $type,
        status: $status,
        timestamp: $timestamp,
        messageId: $messageId,
        senderId: $senderId
      }')
    
    api_request "POST" "/api/webhook/cc" "$heartbeat_data" >/dev/null 2>&1 || true
    
    sleep 10
  done
}

cmd_heartbeat() {
  log_info "Sending heartbeat..."
  
  local heartbeat_data
  heartbeat_data=$(jq -n \
    --arg type "sync.heartbeat" \
    --arg status "online" \
    --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg messageId "heartbeat-$(date +%s)" \
    --arg senderId "shadow-1" \
    '{
      type: $type,
      status: $status,
      timestamp: $timestamp,
      messageId: $messageId,
      senderId: $senderId
    }')
  
  api_request "POST" "/api/webhook/cc" "$heartbeat_data"
  log_success "Heartbeat sent"
}

cmd_send() {
  local msg_type=$1
  local data=$2
  
  if [ -z "$msg_type" ] || [ -z "$data" ]; then
    log_error "Message type and data are required"
    return 1
  fi
  
  log_info "Sending ${msg_type} message..."
  
  local full_data
  full_data=$(echo "$data" | jq --arg type "$msg_type" --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" --arg mid "msg-$(date +%s)" --arg sid "shadow-1" '. + {type: $type, timestamp: $ts, messageId: $mid, senderId: $sid}')
  
  api_request "POST" "/api/webhook/cc" "$full_data"
  log_success "Message sent"
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
    cmd_tasks "${2:-}"
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
  monitor)
    cmd_monitor
    ;;
  heartbeat)
    cmd_heartbeat
    ;;
  send)
    cmd_send "${2:-}" "${3:-}"
    ;;
  *)
    cmd_help
    ;;
esac
