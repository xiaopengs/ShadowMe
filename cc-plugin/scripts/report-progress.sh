#!/bin/bash
#===============================================================================
# ShadowMe 进度上报脚本
# 
# 用法:
#   report-progress.sh --task-id <id> --progress <0-100> [OPTIONS]
#   report-progress.sh --task-id TASK-001 --progress 50 --message "处理中..."
#   report-progress.sh --throttled    # 节流模式（根据时间间隔）
#   report-progress.sh --final        # 会话结束时调用
#===============================================================================

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 配置
CONFIG_FILE="${HOME}/.shadowme/config"
LAST_REPORT_FILE="${HOME}/.shadowme/.last_progress_report"
THROTTLE_INTERVAL=30  # 最小上报间隔（秒）

# 参数
TASK_ID=""
PROGRESS=""
MESSAGE=""
THROTTLED=false
FINAL=false

#===============================================================================
# 加载配置
#===============================================================================
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
}

#===============================================================================
# 读取当前任务
#===============================================================================
get_current_task() {
    local current_task_file="${HOME}/.shadowme/current-task"
    
    if [ -f "$current_task_file" ]; then
        TASK_ID=$(cat "$current_task_file" | jq -r '.id // empty' 2>/dev/null)
        PROGRESS=$(cat "$current_task_file" | jq -r '.progress // 0' 2>/dev/null)
    fi
}

#===============================================================================
# 节流检查
#===============================================================================
should_report() {
    # 如果不是节流模式，直接返回 true
    [ "$THROTTLED" = false ] && return 0
    
    # 检查上次上报时间
    if [ ! -f "$LAST_REPORT_FILE" ]; then
        return 0
    fi
    
    local last_report
    last_report=$(cat "$LAST_REPORT_FILE")
    local now
    now=$(date +%s)
    local elapsed=$((now - last_report))
    
    [ $elapsed -ge $THROTTLE_INTERVAL ]
}

#===============================================================================
# 更新节流时间
#===============================================================================
update_throttle() {
    date +%s > "$LAST_REPORT_FILE"
}

#===============================================================================
# 生成消息 ID
#===============================================================================
generate_message_id() {
    echo "prog-${TASK_ID}-$(date +%s)"
}

#===============================================================================
# 发送进度消息
#===============================================================================
send_progress() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    # 构建消息体
    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local message_id
    message_id=$(generate_message_id)
    
    local body=$(cat << EOF
{
  "type": "task.progress",
  "taskId": "${TASK_ID}",
  "timestamp": "${timestamp}",
  "messageId": "${message_id}",
  "senderId": "${SHADOWME_SHADOW_ID:-$(hostname)}",
  "progress": ${PROGRESS:-0},
  "message": "${MESSAGE:-Working...}",
  "metadata": {
    "cwd": "$(pwd)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'none')"
  }
}
EOF
)
    
    # 发送到 webhook
    if [ -f "$api_script" ]; then
        "$api_script" POST "/api/webhook/cc" "$body" > /dev/null 2>&1 || {
            echo "Warning: Failed to send progress to ShadowMe" >&2
        }
    fi
    
    # 同时更新当前任务文件
    local current_task_file="${HOME}/.shadowme/current-task"
    if [ -f "$current_task_file" ]; then
        local temp_file
        temp_file=$(mktemp)
        cat "$current_task_file" | jq --arg progress "$PROGRESS" --arg message "$MESSAGE" \
            '.progress = ($progress | tonumber) | .lastMessage = $message | .lastUpdate = "'$timestamp'"' \
            > "$temp_file"
        mv "$temp_file" "$current_task_file"
    fi
    
    echo "✅ 进度已上报: ${PROGRESS}% - ${MESSAGE}"
}

#===============================================================================
# 发送日志消息
#===============================================================================
send_log() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local message_id
    message_id=$(generate_message_id)
    
    local body=$(cat << EOF
{
  "type": "log",
  "timestamp": "${timestamp}",
  "messageId": "${message_id}",
  "senderId": "${SHADOWME_SHADOW_ID:-$(hostname)}",
  "taskId": "${TASK_ID}",
  "content": "${MESSAGE}",
  "level": "info",
  "metadata": {
    "cwd": "$(pwd)"
  }
}
EOF
)
    
    if [ -f "$api_script" ]; then
        "$api_script" POST "/api/webhook/cc" "$body" > /dev/null 2>&1
    fi
    
    echo "📝 日志已发送: ${MESSAGE}"
}

#===============================================================================
# 最终进度报告
#===============================================================================
send_final_report() {
    get_current_task
    
    if [ -z "$TASK_ID" ]; then
        # 没有活跃任务，发送心跳
        "${SCRIPT_DIR}/heartbeat.sh"
        return
    fi
    
    # 获取 git 状态
    local git_status=""
    if git status --porcelain 2>/dev/null | grep -q .; then
        git_status="有未提交变更"
    else
        git_status="无变更"
    fi
    
    MESSAGE="会话结束，当前进度 ${PROGRESS}%。${git_status}。"
    send_progress
}

#===============================================================================
# 解析参数
#===============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --task-id)
                TASK_ID="$2"
                shift 2
                ;;
            --progress)
                PROGRESS="$2"
                shift 2
                ;;
            --message)
                MESSAGE="$2"
                shift 2
                ;;
            --throttled)
                THROTTLED=true
                shift
                ;;
            --final)
                FINAL=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1" >&2
                exit 1
                ;;
        esac
    done
}

#===============================================================================
# 显示帮助
#===============================================================================
show_help() {
    cat << EOF
ShadowMe 进度上报脚本

用法:
    report-progress.sh --task-id <id> --progress <0-100> [OPTIONS]
    report-progress.sh --throttled
    report-progress.sh --final

选项:
    --task-id <id>      # 任务 ID
    --progress <0-100>  # 进度百分比
    --message <msg>     # 进度消息
    --throttled         # 节流模式（避免频繁上报）
    --final             # 会话结束时调用
    --help, -h          # 显示帮助

示例:
    # 上报进度
    report-progress.sh --task-id TASK-001 --progress 50 --message "正在处理..."

    # 节流模式（自动避免频繁上报）
    report-progress.sh --task-id TASK-001 --progress 75 --message "接近完成" --throttled

    # 会话结束时调用
    report-progress.sh --final

EOF
}

#===============================================================================
# 主函数
#===============================================================================
main() {
    parse_args "$@"
    load_config
    
    # 最终报告模式
    if [ "$FINAL" = true ]; then
        send_final_report
        exit 0
    fi
    
    # 获取当前任务（如果未指定）
    if [ -z "$TASK_ID" ]; then
        get_current_task
    fi
    
    if [ -z "$TASK_ID" ]; then
        echo "Warning: No active task. Use /shadow-take first." >&2
        exit 1
    fi
    
    # 节流检查
    if [ "$THROTTLED" = true ]; then
        if ! should_report; then
            exit 0
        fi
    fi
    
    # 发送进度
    send_progress
    
    # 更新节流时间
    update_throttle
}

# 运行
main "$@"
