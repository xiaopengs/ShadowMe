#!/bin/bash
#===============================================================================
# ShadowMe 任务轮询脚本
# 
# 用法:
#   poll-tasks.sh                    # 单次轮询
#   poll-tasks.sh --continuous       # 持续轮询
#   poll-tasks.sh --interval=30      # 每30秒轮询
#   poll-tasks.sh --filter=high      # 按优先级过滤
#===============================================================================

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 默认配置
CONFIG_FILE="${HOME}/.shadowme/config"
POLL_INTERVAL=60
CONTINUOUS=false
FILTER=""

#===============================================================================
# 加载配置
#===============================================================================
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
}

#===============================================================================
# 解析参数
#===============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --continuous)
                CONTINUOUS=true
                shift
                ;;
            --interval=*)
                POLL_INTERVAL="${1#*=}"
                shift
                ;;
            --filter=*)
                FILTER="${1#*=}"
                shift
                ;;
            --help|-h)
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
ShadowMe 任务轮询脚本

用法:
    poll-tasks.sh [OPTIONS]

选项:
    --continuous          # 持续轮询模式
    --interval=<秒>       # 轮询间隔（默认: 60秒）
    --filter=<优先级>     # 按优先级过滤 (high/medium/low)
    --help, -h            # 显示帮助

示例:
    # 单次轮询
    poll-tasks.sh

    # 每30秒轮询一次
    poll-tasks.sh --continuous --interval=30

    # 只看高优先级任务
    poll-tasks.sh --filter=high

环境变量:
    SHADOWME_URL      - ShadowMe 服务器地址
    SHADOWME_API_KEY  - API Key

EOF
}

#===============================================================================
# 获取任务列表
#===============================================================================
fetch_tasks() {
    local status="${1:-pending}"
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    if [ ! -f "$api_script" ]; then
        echo "Error: shadowme-api.sh not found" >&2
        exit 1
    fi
    
    # 获取任务
    local response
    response=$("$api_script" GET "/api/tasks?status=$status" 2>/dev/null) || {
        echo "Error: Failed to fetch tasks" >&2
        return 1
    }
    
    echo "$response"
}

#===============================================================================
# 过滤任务
#===============================================================================
filter_tasks() {
    local tasks="$1"
    
    if [ -z "$FILTER" ]; then
        echo "$tasks"
        return
    fi
    
    # 使用 jq 过滤（如果可用）
    if command -v jq &> /dev/null; then
        echo "$tasks" | jq --arg filter "$FILTER" '[.[] | select(.priority == $filter)]'
    else
        echo "$tasks"
    fi
}

#===============================================================================
# 格式化任务列表
#===============================================================================
format_tasks() {
    local tasks="$1"
    
    # 检查是否有 jq
    if command -v jq &> /dev/null; then
        local count
        count=$(echo "$tasks" | jq 'length' 2>/dev/null || echo "0")
        
        if [ "$count" -eq 0 ]; then
            echo "📭 暂无待领取的任务"
            return
        fi
        
        echo "📋 ShadowMe 待领取任务 (共 $count 个)"
        echo "━"$(printf '%.0s─' {1..50})
        echo ""
        
        # 格式化输出
        echo "$tasks" | jq -r '
            to_entries[] | 
            "[\(.key + 1)] \(.value.id) | \(.value.priority // "normal") | \(.value.title)" +
            (if .value.description then "\n     \(.value.description[0:80])..." else "" end)
        '
        
        echo ""
        echo "使用 /shadow-take <task-id> 领取任务"
    else
        # 无 jq 时的简化输出
        echo "$tasks"
    fi
}

#===============================================================================
# 单次轮询
#===============================================================================
poll_once() {
    echo "🔍 正在拉取待领取任务..."
    echo ""
    
    local tasks
    tasks=$(fetch_tasks "pending")
    
    # 应用过滤器
    if [ -n "$FILTER" ]; then
        tasks=$(filter_tasks "$tasks")
    fi
    
    # 格式化输出
    format_tasks "$tasks"
}

#===============================================================================
# 持续轮询
#===============================================================================
poll_continuous() {
    echo "🔄 启动持续轮询模式 (间隔: ${POLL_INTERVAL}秒)"
    echo "按 Ctrl+C 停止"
    echo ""
    
    while true; do
        clear
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔄 ShadowMe 轮询 $(date '+%Y-%m-%d %H:%M:%S')"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        poll_once
        
        echo ""
        echo "⏳ 下次轮询: ${POLL_INTERVAL}秒后..."
        sleep "$POLL_INTERVAL"
    done
}

#===============================================================================
# 主函数
#===============================================================================
main() {
    parse_args "$@"
    load_config
    
    if [ -z "$SHADOWME_URL" ]; then
        echo "Error: SHADOWME_URL not configured. Run /shadow-connect first." >&2
        exit 2
    fi
    
    if [ "$CONTINUOUS" = true ]; then
        poll_continuous
    else
        poll_once
    fi
}

# 运行
main "$@"
