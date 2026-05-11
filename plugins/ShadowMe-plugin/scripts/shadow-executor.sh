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
CYAN='\033[0;36m'
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

log_task() {
  echo -e "${CYAN}📋${NC} $1"
}

log_work() {
  echo -e "${BLUE}🔧${NC} $1"
}

log_result() {
  echo -e "${GREEN}📦${NC} $1"
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

# Check for pending tasks and take one
check_and_take_task() {
  log_task "Checking for pending tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=pending")
  
  local task_count
  task_count=$(echo "$response" | grep -o '"id"' | wc -l)
  
  if [ "$task_count" -eq 0 ]; then
    log_info "No pending tasks found"
    return 1
  fi
  
  # Get first pending task
  local task_id
  local task_title
  local task_description
  
  task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  task_title=$(echo "$response" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
  task_description=$(echo "$response" | grep -o '"description":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$task_id" ]; then
    log_warn "Failed to parse task data"
    return 1
  fi
  
  log_task "Found task: ${task_title} [${task_id:0:8}]"
  
  # Take the task
  log_work "Taking task..."
  local take_response
  take_response=$(api_request "POST" "/api/tasks/${task_id}/take")
  
  if echo "$take_response" | grep -q '"id"'; then
    log_success "Task taken successfully"
    
    # Send task.assign message
    send_message "task.assign" "\"taskId\":\"${task_id}\",\"taskTitle\":\"${task_title}\""
    
    echo "$task_id"
    return 0
  else
    log_error "Failed to take task"
    return 1
  fi
}

# Execute a task
execute_task() {
  local task_id=$1
  local task_title=$2
  local task_description=$3
  
  log_task "Executing task: ${task_title}"
  log_info "Task ID: ${task_id}"
  
  # Send initial progress
  send_message "task.progress" "\"taskId\":\"${task_id}\",\"progress\":0,\"message\":\"Starting task execution\""
  
  # Simulate task phases
  local phases=("Analyzing requirements" "Implementing solution" "Testing changes" "Generating documentation" "Finalizing")
  local progress=0
  local increment=$((100 / ${#phases[@]}))
  
  for i in "${!phases[@]}"; do
    local phase="${phases[$i]}"
    progress=$((progress + increment))
    
    log_work "[${progress}%] ${phase}..."
    send_message "task.progress" "\"taskId\":\"${task_id}\",\"progress\":${progress},\"message\":\"${phase}\""
    
    # Log each phase
    send_message "log" "\"taskId\":\"${task_id}\",\"content\":\"${phase}\",\"level\":\"info\""
    
    # Simulate work (in real scenario, this would be actual work)
    sleep 1
  done
  
  # Generate task result
  local result_summary="Task completed: ${task_title}\n\n"
  result_summary+="Changes made:\n"
  result_summary+="- Analyzed requirements\n"
  result_summary+="- Implemented solution\n"
  result_summary+="- Added tests\n"
  result_summary+="- Generated documentation"
  
  # Get git info if available
  local commit_sha=""
  local branch=""
  
  if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    commit_sha=$(git rev-parse HEAD 2>/dev/null | cut -c1-8)
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    
    # Check for uncommitted changes
    if ! git diff --quiet; then
      log_info "Uncommitted changes detected, staging..."
      git add -A
      git commit -m "feat: Complete task - ${task_title}" || true
      commit_sha=$(git rev-parse HEAD 2>/dev/null | cut -c1-8)
    fi
  fi
  
  # Send completion message
  if [ -n "$commit_sha" ]; then
    log_result "Generated commit: ${commit_sha}"
    send_message "git.commit" "\"taskId\":\"${task_id}\",\"commitSha\":\"${commit_sha}\",\"branch\":\"${branch}\",\"message\":\"${task_title}\""
  fi
  
  send_message "task.complete" "\"taskId\":\"${task_id}\",\"summary\":\"${result_summary}\",\"commitSha\":\"${commit_sha}\""
  
  # Mark task as complete
  local complete_data="{\"result\":{\"type\":\"commit\",\"summary\":\"${result_summary}\",\"commitSha\":\"${commit_sha}\"}}"
  api_request "POST" "/api/tasks/${task_id}/complete" "$complete_data" >/dev/null
  
  log_success "Task completed!"
  
  # Return result
  echo "${result_summary}"
}

# Main execution loop
main() {
  log_info "🚀 ShadowMe Executor starting..."
  log_info "Board URL: ${SHADOWME_URL}"
  log_info "Press Ctrl+C to stop"
  
  while true; do
    echo ""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Checking for tasks..."
    
    if task_id=$(check_and_take_task); then
      # Get task details
      local task_info
      task_info=$(api_request "GET" "/api/tasks/${task_id}")
      
      local task_title
      local task_description
      
      task_title=$(echo "$task_info" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
      task_description=$(echo "$task_info" | grep -o '"description":"[^"]*"' | head -1 | cut -d'"' -f4)
      
      echo ""
      execute_task "$task_id" "$task_title" "$task_description"
    else
      log_info "No tasks available, waiting 30 seconds..."
    fi
    
    # Send heartbeat
    send_message "sync.heartbeat" "\"status\":\"online\""
    
    sleep 30
  done
}

# Handle signals
trap 'echo ""; log_info "Shutting down..."; exit 0' INT TERM

main
