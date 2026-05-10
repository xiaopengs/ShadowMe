#!/bin/bash
#===============================================================================
# ShadowMe 任务完成上报脚本
# 
# 用法:
#   report-complete.sh --task-id <id> --summary <summary> [OPTIONS]
#   report-complete.sh --task-id TASK-001 --summary "重构完成"
#   report-complete.sh --commit-sha <sha> --files <files>
#===============================================================================

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 配置
CONFIG_FILE="${HOME}/.shadowme/config"
CURRENT_TASK_FILE="${HOME}/.shadowme/current-task"

# 参数
TASK_ID=""
SUMMARY=""
COMMIT_SHA=""
FILES_CHANGED=""
COMMIT_MESSAGE=""

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
    if [ -f "$CURRENT_TASK_FILE" ]; then
        TASK_ID=$(cat "$CURRENT_TASK_FILE" | jq -r '.id // empty' 2>/dev/null)
        if [ -z "$TASK_ID" ]; then
            TASK_ID=$(cat "$CURRENT_TASK_FILE")
        fi
    fi
}

#===============================================================================
# Git 操作
#===============================================================================
git_commit_and_push() {
    echo "📦 检查 Git 变更..."
    
    # 检查 git 仓库
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "⚠️  当前目录不是 Git 仓库"
        return 1
    fi
    
    # 检查变更
    if ! git status --porcelain | grep -q .; then
        echo "📝 无需提交的变更"
        COMMIT_SHA=""
        return 0
    fi
    
    echo "🔄 发现变更，正在提交..."
    
    # 添加所有变更
    git add -A
    
    # 获取变更文件列表
    FILES_CHANGED=$(git diff --cached --name-only | tr '\n' ',' | sed 's/,$//')
    
    # 创建提交
    COMMIT_MESSAGE="[ShadowMe ${TASK_ID}] ${SUMMARY}"
    if git commit -m "$COMMIT_MESSAGE"; then
        COMMIT_SHA=$(git rev-parse HEAD)
        echo "✅ 已提交: $COMMIT_SHA"
        echo "📝 $COMMIT_MESSAGE"
        
        # 尝试推送
        if git push origin HEAD 2>/dev/null; then
            echo "✅ 已推送到远程"
        else
            echo "⚠️  推送失败，请手动推送"
        fi
    else
        echo "❌ 提交失败"
        return 1
    fi
    
    return 0
}

#===============================================================================
# 获取任务详情
#===============================================================================
get_task_info() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    if [ -f "$api_script" ] && [ -n "$TASK_ID" ]; then
        "$api_script" GET "/api/tasks/$TASK_ID" 2>/dev/null | jq -r '.title // empty'
    fi
}

#===============================================================================
# 计算任务耗时
#===============================================================================
calculate_duration() {
    if [ -f "$CURRENT_TASK_FILE" ]; then
        local start_time
        start_time=$(cat "$CURRENT_TASK_FILE" | jq -r '.startTime // empty' 2>/dev/null)
        
        if [ -n "$start_time" ]; then
            local start_epoch
            start_epoch=$(date -d "$start_time" +%s 2>/dev/null || echo "")
            
            if [ -n "$start_epoch" ]; then
                local now_epoch
                now_epoch=$(date +%s)
                local duration=$((now_epoch - start_epoch))
                
                # 格式化为人类可读
                if [ $duration -lt 60 ]; then
                    echo "${duration}秒"
                elif [ $duration -lt 3600 ]; then
                    echo "$((duration / 60))分钟"
                else
                    echo "$((duration / 3600))小时$(((duration % 3600) / 60))分钟"
                fi
                return
            fi
        fi
    fi
    echo "未知"
}

#===============================================================================
# 标记任务完成
#===============================================================================
mark_complete() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    if [ -f "$api_script" ] && [ -n "$TASK_ID" ]; then
        "$api_script" POST "/api/tasks/$TASK_ID/complete" > /dev/null 2>&1 || {
            echo "Warning: Failed to mark task complete via API"
        }
    fi
}

#===============================================================================
# 发送完成消息
#===============================================================================
send_complete_message() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local message_id
    message_id="complete-${TASK_ID}-$(date +%s)"
    
    # 计算耗时
    local duration
    duration=$(calculate_duration)
    
    # 构建消息体
    local body=$(cat << EOF
{
  "type": "task.complete",
  "taskId": "${TASK_ID}",
  "timestamp": "${timestamp}",
  "messageId": "${message_id}",
  "senderId": "${SHADOWME_SHADOW_ID:-$(hostname)}",
  "summary": "${SUMMARY}",
  "commitSha": "${COMMIT_SHA}",
  "duration": "${duration}",
  "filesChanged": "${FILES_CHANGED}",
  "metadata": {
    "cwd": "$(pwd)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'none')"
  }
}
EOF
)
    
    if [ -f "$api_script" ]; then
        "$api_script" POST "/api/webhook/cc" "$body" > /dev/null 2>&1 || {
            echo "Warning: Failed to send complete message"
        }
    fi
}

#===============================================================================
# 清理状态
#===============================================================================
cleanup() {
    # 备份当前任务信息
    if [ -f "$CURRENT_TASK_FILE" ]; then
        local backup_dir="${HOME}/.shadowme/.history"
        mkdir -p "$backup_dir"
        
        local backup_file="${backup_dir}/${TASK_ID}_$(date +%Y%m%d_%H%M%S).json"
        cp "$CURRENT_TASK_FILE" "$backup_file"
        
        # 删除当前任务记录
        rm -f "$CURRENT_TASK_FILE"
    fi
}

#===============================================================================
# 显示完成报告
#===============================================================================
show_report() {
    echo ""
    echo "┌─────────────────────────────────────────┐"
    echo "│  ✅ 任务已完成: ${TASK_ID}" 
    echo "├─────────────────────────────────────────┤"
    echo "│  摘要: ${SUMMARY}"
    echo "│  Commit: ${COMMIT_SHA:-无}"
    echo "│  耗时: ${duration}"
    echo "│  文件: ${FILES_CHANGED:-无}"
    echo "└─────────────────────────────────────────┘"
    echo ""
    echo "💡 提示: 使用 /shadow-poll 拉取新任务"
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
            --summary)
                SUMMARY="$2"
                shift 2
                ;;
            --commit-sha)
                COMMIT_SHA="$2"
                shift 2
                ;;
            --files)
                FILES_CHANGED="$2"
                shift 2
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
ShadowMe 任务完成上报脚本

用法:
    report-complete.sh --task-id <id> --summary <summary> [OPTIONS]

选项:
    --task-id <id>      # 任务 ID
    --summary <text>    # 完成摘要（必填）
    --commit-sha <sha>  # Git commit SHA
    --files <files>     # 变更文件列表
    --help, -h          # 显示帮助

示例:
    # 基本用法
    report-complete.sh --task-id TASK-001 --summary "重构完成"

    # 完整信息
    report-complete.sh \\
        --task-id TASK-001 \\
        --summary "提取了5个公共组件" \\
        --commit-sha a1b2c3d4 \\
        --files "src/utils.js,src/components/Button.js"

EOF
}

#===============================================================================
# 主函数
#===============================================================================
main() {
    parse_args "$@"
    load_config
    
    # 获取当前任务（如果未指定）
    if [ -z "$TASK_ID" ]; then
        get_current_task
    fi
    
    if [ -z "$TASK_ID" ]; then
        echo "Error: No active task. Use /shadow-take first." >&2
        exit 1
    fi
    
    if [ -z "$SUMMARY" ]; then
        echo "Error: --summary is required" >&2
        exit 1
    fi
    
    # Git 提交（如果尚未提交）
    if [ -z "$COMMIT_SHA" ]; then
        git_commit_and_push || true
    fi
    
    # 标记完成
    mark_complete
    
    # 发送完成消息
    send_complete_message
    
    # 清理状态
    cleanup
    
    # 显示报告
    duration=$(calculate_duration)
    show_report
}

# 运行
main "$@"
