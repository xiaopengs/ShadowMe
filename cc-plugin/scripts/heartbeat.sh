#!/bin/bash
#===============================================================================
# ShadowMe 心跳发送脚本
# 
# 用法:
#   heartbeat.sh
#   heartbeat.sh --interval <seconds>
#===============================================================================

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 配置
CONFIG_FILE="${HOME}/.shadowme/config"
LAST_HEARTBEAT_FILE="${HOME}/.shadowme/.last_heartbeat"
MIN_INTERVAL=60  # 最小心跳间隔（秒）

#===============================================================================
# 加载配置
#===============================================================================
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
}

#===============================================================================
# 检查是否应该发送心跳
#===============================================================================
should_send() {
    if [ ! -f "$LAST_HEARTBEAT_FILE" ]; then
        return 0
    fi
    
    local last_heartbeat
    last_heartbeat=$(cat "$LAST_HEARTBEAT_FILE")
    local now
    now=$(date +%s)
    local elapsed=$((now - last_heartbeat))
    
    [ $elapsed -ge $MIN_INTERVAL ]
}

#===============================================================================
# 发送心跳
#===============================================================================
send_heartbeat() {
    local api_script="${SCRIPT_DIR}/shadowme-api.sh"
    
    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local message_id
    message_id="hb-$(date +%s)"
    
    # 获取当前状态
    local current_task=""
    local current_task_file="${HOME}/.shadowme/current-task"
    
    if [ -f "$current_task_file" ]; then
        current_task=$(cat "$current_task_file" | jq -r '.id // empty' 2>/dev/null)
        if [ -z "$current_task" ]; then
            current_task=$(cat "$current_task_file")
        fi
    fi
    
    # 获取 git 状态
    local git_branch=""
    local git_status="clean"
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        
        if git status --porcelain | grep -q .; then
            git_status="dirty"
        fi
    fi
    
    # 构建心跳消息
    local body=$(cat << EOF
{
  "type": "sync.heartbeat",
  "timestamp": "${timestamp}",
  "messageId": "${message_id}",
  "senderId": "${SHADOWME_SHADOW_ID:-$(hostname)}",
  "status": "online",
  "currentTask": "${current_task}",
  "metadata": {
    "hostname": "$(hostname)",
    "cwd": "$(pwd)",
    "gitBranch": "${git_branch}",
    "gitStatus": "${git_status}",
    "uptime": "$(uptime -p 2>/dev/null || echo 'unknown')",
    "load": "$(cat /proc/loadavg 2>/dev/null | awk '{print $1}' || echo 'unknown')"
  }
}
EOF
)
    
    # 发送心跳
    if [ -f "$api_script" ]; then
        local response
        response=$("$api_script" POST "/api/webhook/cc" "$body" 2>&1) || {
            echo "Warning: Failed to send heartbeat" >&2
            return 1
        }
        
        # 检查响应
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            echo "Warning: Heartbeat rejected by server" >&2
            return 1
        fi
    else
        # 直接使用 curl
        if [ -z "$SHADOWME_URL" ]; then
            return 1
        fi
        
        curl -s -X POST "${SHADOWME_URL}/api/webhook/cc" \
            -H "Content-Type: application/json" \
            -H "x-cc-api-key: ${SHADOWME_API_KEY:-}" \
            -d "$body" > /dev/null 2>&1 || {
            echo "Warning: Failed to send heartbeat via curl" >&2
            return 1
        }
    fi
    
    # 更新心跳时间
    date +%s > "$LAST_HEARTBEAT_FILE"
    
    echo "💓 心跳已发送: $timestamp"
    return 0
}

#===============================================================================
# 解析参数
#===============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --interval)
                MIN_INTERVAL="$2"
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
ShadowMe 心跳发送脚本

用法:
    heartbeat.sh [OPTIONS]

选项:
    --interval <seconds>  # 最小心跳间隔（默认: 60秒）
    --help, -h            # 显示帮助

说明:
    - 心跳间隔默认 60 秒，避免过于频繁
    - 会自动检查并跳过重复心跳
    - 会记录最后心跳时间到 ~/.shadowme/.last_heartbeat

EOF
}

#===============================================================================
# 主函数
#===============================================================================
main() {
    parse_args "$@"
    load_config
    
    # 检查配置
    if [ -z "$SHADOWME_URL" ]; then
        #Silent fail for background heartbeat
        exit 0
    fi
    
    # 检查是否应该发送
    if ! should_send; then
        exit 0
    fi
    
    # 发送心跳
    send_heartbeat
}

# 运行
main "$@"
