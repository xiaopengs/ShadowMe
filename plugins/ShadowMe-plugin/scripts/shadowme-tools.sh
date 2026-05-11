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
MAGENTA='\033[0;35m'
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
  echo -e "${MAGENTA}🔧${NC} $1"
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
  
  local response
  response=$(api_request "POST" "/api/webhook/cc" "$msg_data")
  
  if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    log_success "Message sent: ${msg_type}"
  else
    log_warn "Message sent (check response): ${msg_type}"
  fi
}

# === Commands ===

cmd_help() {
  echo "
🔮 ShadowMe CLI Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: shadowme <command> [args...]

Task Management:
  tasks [status]         List tasks (default: pending)
  take <taskId>          Take a specific task
  info <taskId>          Show task details
  start                  Start monitoring and auto-execute tasks
  status                 Show connection status

Progress Reporting:
  progress <taskId> <0-100> <message>
                         Report task progress
  log <taskId> <message> [level]
                         Send work log (level: info|warn|error)
  complete <taskId> [summary]
                         Complete a task

Git Integration:
  commit <taskId> <message> [files...]
                         Commit changes and report
  mr <taskId> <title> [source] [target]
                         Create MR and report

Utility:
  heartbeat              Send heartbeat
  help                   Show this help

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Examples:
  shadowme tasks
  shadowme take 39f007dc-30cb-4c9c-88fc-f1a210328f34
  shadowme progress 39f007dc-30cb-4c9c-88fc-f1a210328f34 50 \"Implementing feature\"
  shadowme log 39f007dc-30cb-4c9c-88fc-f1a210328f34 \"Analyzing code structure\" info
  shadowme commit 39f007dc-30cb-4c9c-88fc-f1a210328f34 \"feat: add feature X\"
  shadowme complete 39f007dc-30cb-4c9c-88fc-f1a210328f34 \"Feature implemented successfully\"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
}

cmd_status() {
  log_info "Checking ShadowMe status..."
  
  echo "
🟢 ShadowMe Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Board URL: ${SHADOWME_URL}
  API Key: ${SHADOWME_API_KEY:+Configured}${SHADOWME_API_KEY:-Not set (dev mode)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  
  # Test connection
  local response
  response=$(api_request "GET" "/api/status")
  
  if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    log_success "Connected to ShadowMe board"
  else
    log_error "Failed to connect to ShadowMe board"
  fi
}

cmd_tasks() {
  local status=${1:-pending}
  
  log_task "Fetching ${status} tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=${status}")
  
  if echo "$response" | jq -e '.tasks | length > 0' >/dev/null 2>&1; then
    echo "
📋 ${status^} Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
    echo "$response" | jq -r '.tasks[] | "
[\(.id | .[0:8])] \(.title)
  Type: \(.type) | Priority: \(.priority)
  Status: \(.status)
  Created by: \(.createdBy)
  Created at: \(.createdAt | sub("\\..*"; ""))
"
"
  else
    log_info "No ${status} tasks found"
  fi
}

cmd_take() {
  local taskId=$1
  
  if [ -z "$taskId" ]; then
    log_error "Task ID is required"
    echo "Usage: shadowme take <taskId>"
    return 1
  fi
  
  log_task "Taking task ${taskId}..."
  
  local response
  response=$(api_request "POST" "/api/tasks/${taskId}/take")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    local title
    title=$(echo "$response" | jq -r '.title')
    local task_type
    task_type=$(echo "$response" | jq -r '.type')
    local description
    description=$(echo "$response" | jq -r '.description // "No description"')
    
    log_success "Task taken: ${title}"
    
    # Send task.assign message
    send_message "task.assign" "\"taskId\":\"${taskId}\",\"taskTitle\":\"${title}\""
    
    echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Task Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ID:          ${taskId}
  Title:       ${title}
  Type:        ${task_type}
  Description: ${description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
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
    echo "Usage: shadowme info <taskId>"
    return 1
  fi
  
  log_info "Fetching task ${taskId}..."
  
  local response
  response=$(api_request "GET" "/api/tasks/${taskId}")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    echo "$response" | jq -r '
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Task: \(.id)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Title:       \(.title)
  Type:        \(.type)
  Priority:    \(.priority)
  Status:      \(.status)
  Created by:  \(.createdBy)
  Created at:  \(.createdAt | sub("\\..*"; ""))
  \((if .startedAt then "  Started at:  \(.startedAt | sub("\\..*"; ""))" else "" end)
  \((if .completedAt then "  Completed:  \(.completedAt | sub("\\..*"; ""))" else "" end)

Description:
\(.description // "No description")

\((if (.tags | length) > 0) then "Tags: \(.tags | join(", "))" else "" end)
\((if .expectedDelivery then "Expected: \(.expectedDelivery)" else "" end))
\((if .result then "
Result:
  Type:    \(.result.type)
  Summary: \(.result.summary)
  \((if .result.url then "URL: \(.result.url)" else "" end)
  \((if .result.commitSha then "Commit: \(.result.commitSha)" else "" end))
" else "" end))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"'
  else
    log_error "Task not found"
    return 1
  fi
}

cmd_progress() {
  local taskId=$1
  local progress=$2
  local message=$3
  
  if [ -z "$taskId" ] || [ -z "$progress" ] || [ -z "$message" ]; then
    log_error "Usage: shadowme progress <taskId> <0-100> <message>"
    return 1
  fi
  
  # Validate progress
  if ! [[ "$progress" =~ ^[0-9]+$ ]] || [ "$progress" -lt 0 ] || [ "$progress" -gt 100 ]; then
    log_error "Progress must be a number between 0 and 100"
    return 1
  fi
  
  log_work "Reporting progress: ${progress}% - ${message}"
  
  send_message "task.progress" "\"taskId\":\"${taskId}\",\"progress\":${progress},\"message\":\"${message}\""
}

cmd_log() {
  local taskId=$1
  local message=$2
  local level=${3:-info}
  
  if [ -z "$taskId" ] || [ -z "$message" ]; then
    log_error "Usage: shadowme log <taskId> <message> [level]"
    return 1
  fi
  
  # Validate level
  if ! [[ "$level" =~ ^(info|warn|error|debug)$ ]]; then
    log_warn "Invalid level '${level}', using 'info'"
    level="info"
  fi
  
  log_work "[${level}] ${message}"
  
  send_message "log" "\"taskId\":\"${taskId}\",\"content\":\"${message}\",\"level\":\"${level}\""
}

cmd_complete() {
  local taskId=$1
  local summary=${2:-"Task completed"}
  
  if [ -z "$taskId" ]; then
    log_error "Usage: shadowme complete <taskId> [summary]"
    return 1
  fi
  
  log_success "Completing task ${taskId}..."
  
  # Complete via API
  local result_data="{\"result\":{\"type\":\"text\",\"summary\":\"${summary}\"}}"
  local response
  response=$(api_request "POST" "/api/tasks/${taskId}/complete" "$result_data")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    log_success "Task completed"
    
    # Send task.complete message
    send_message "task.complete" "\"taskId\":\"${taskId}\",\"summary\":\"${summary}\""
    
    echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Task Completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary: ${summary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  else
    log_error "Failed to complete task"
    echo "$response"
    return 1
  fi
}

cmd_commit() {
  local taskId=$1
  local message=$2
  shift 2
  local files=("$@")
  
  if [ -z "$taskId" ] || [ -z "$message" ]; then
    log_error "Usage: shadowme commit <taskId> <message> [files...]"
    return 1
  fi
  
  # Check if git is available
  if ! command -v git &> /dev/null; then
    log_warn "Git not available, skipping commit"
    return 1
  fi
  
  # Check if we're in a git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_warn "Not in a git repository, skipping commit"
    return 1
  fi
  
  log_work "Committing changes..."
  
  # Stage files or all if none specified
  if [ ${#files[@]} -eq 0 ]; then
    git add -A
    log_info "Staged all changes"
  else
    for file in "${files[@]}"; do
      git add "$file"
      log_info "Staged: $file"
    done
  fi
  
  # Check if there are changes to commit
  if git diff --cached --quiet; then
    log_info "No changes to commit"
    return 0
  fi
  
  # Commit
  git commit -m "$message"
  
  local commit_sha
  commit_sha=$(git rev-parse HEAD | cut -c1-8)
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  
  log_success "Committed: ${commit_sha}"
  
  # Send git.commit message
  send_message "git.commit" "\"taskId\":\"${taskId}\",\"commitSha\":\"${commit_sha}\",\"branch\":\"${branch}\",\"message\":\"${message}\""
  
  echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Git Commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SHA:     ${commit_sha}
  Branch:  ${branch}
  Message: ${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
}

cmd_mr() {
  local taskId=$1
  local title=$2
  local sourceBranch=${3:-}
  local targetBranch=${4:-main}
  
  if [ -z "$taskId" ] || [ -z "$title" ]; then
    log_error "Usage: shadowme mr <taskId> <title> [source-branch] [target-branch]"
    return 1
  fi
  
  # Use current branch if not specified
  if [ -z "$sourceBranch" ]; then
    if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
      sourceBranch=$(git rev-parse --abbrev-ref HEAD)
    else
      log_error "Could not determine source branch"
      return 1
    fi
  fi
  
  log_work "Creating merge request..."
  
  # This would integrate with GitLab/GitHub API
  # For now, just send the message
  log_info "MR creation requires GitLab/GitHub integration"
  log_info "Source: ${sourceBranch} -> ${targetBranch}"
  
  # Send git.mr_created message
  send_message "git.mr_created" "\"taskId\":\"${taskId}\",\"title\":\"${title}\",\"sourceBranch\":\"${sourceBranch}\",\"targetBranch\":\"${targetBranch}\""
}

cmd_heartbeat() {
  log_info "Sending heartbeat..."
  
  send_message "sync.heartbeat" "\"status\":\"online\""
}

cmd_start() {
  log_info "🚀 Starting ShadowMe auto-executor..."
  log_info "This will continuously check for tasks and execute them."
  log_info "Press Ctrl+C to stop"
  echo ""
  
  # Check for tasks once first
  log_task "Initial check for tasks..."
  
  local response
  response=$(api_request "GET" "/api/tasks?status=pending")
  
  if echo "$response" | jq -e '.tasks | length > 0' >/dev/null 2>&1; then
    local task_count
    task_count=$(echo "$response" | jq -r '.tasks | length')
    log_info "Found ${task_count} pending tasks"
    
    # Auto-take first task
    local first_task_id
    first_task_id=$(echo "$response" | jq -r '.tasks[0].id')
    
    log_task "Taking first task: ${first_task_id}"
    cmd_take "$first_task_id"
    
    echo "
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Next Steps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The task has been assigned to you. Now execute it:

1. Review the task details:
   shadowme info ${first_task_id}

2. Analyze and implement the solution

3. Report progress:
   shadowme progress ${first_task_id} <0-100> <message>

4. Commit changes:
   shadowme commit ${first_task_id} \"<commit message>\"

5. Complete the task:
   shadowme complete ${first_task_id} \"<summary>\"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
  else
    log_info "No pending tasks found. Waiting for new tasks..."
    log_info "The board will notify you when new tasks are available."
  fi
  
  # Send heartbeat
  cmd_heartbeat
}

# Main command dispatcher
case "${1:-help}" in
  help|--help|-h)
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
  progress)
    cmd_progress "${2:-}" "${3:-}" "${4:-}"
    ;;
  log)
    cmd_log "${2:-}" "${3:-}" "${4:-}"
    ;;
  complete)
    cmd_complete "${2:-}" "${3:-}"
    ;;
  commit)
    shift
    cmd_commit "$@"
    ;;
  mr)
    cmd_mr "${2:-}" "${3:-}" "${4:-}" "${5:-}"
    ;;
  heartbeat)
    cmd_heartbeat
    ;;
  start)
    cmd_start
    ;;
  *)
    log_error "Unknown command: $1"
    echo ""
    cmd_help
    ;;
esac
