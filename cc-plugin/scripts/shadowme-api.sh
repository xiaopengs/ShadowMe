#!/bin/bash
#===============================================================================
# ShadowMe API 调用封装脚本
# 
# 用法:
#   shadowme-api.sh <METHOD> <PATH> [BODY]
#   shadowme-api.sh GET /api/tasks
#   shadowme-api.sh POST /api/tasks '{"title":"test"}'
#   shadowme-api.sh PATCH /api/tasks/1 '{"status":"done"}'
#
# 环境变量:
#   SHADOWME_URL      - ShadowMe 服务器地址
#   SHADOWME_API_KEY  - API Key
#   SHADOWME_CONFIG   - 配置文件路径 (默认: ~/.shadowme/config)
#===============================================================================

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

# 默认配置路径
CONFIG_FILE="${SHADOWME_CONFIG:-${HOME}/.shadowme/config}"

#===============================================================================
# 加载配置
#===============================================================================
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
    
    # 环境变量覆盖
    SHADOWME_URL="${SHADOWME_URL:-${SHADOWME_URL:-}}"
    SHADOWME_API_KEY="${SHADOWME_API_KEY:-${SHADOWME_API_KEY:-}}"
}

#===============================================================================
# 配置检查
#===============================================================================
check_config() {
    if [ -z "$SHADOWME_URL" ]; then
        echo '{"error": "SHADOWME_URL not configured", "code": "CONFIG_MISSING"}' >&2
        echo "Error: SHADOWME_URL not configured. Run /shadow-connect first." >&2
        exit 2
    fi
    
    # 清理 URL 末尾斜杠
    SHADOWME_URL="${SHADOWME_URL%/}"
}

#===============================================================================
# 发送请求
#===============================================================================
api_request() {
    local method="${1:-GET}"
    local path="${2:-/}"
    local body="${3:-}"
    
    # 构建 URL
    local url="${SHADOWME_URL}${path}"
    
    # 构建 curl 参数
    local curl_args=(
        -s                      # 静默模式
        -w "\n%{http_code}"     # 输出状态码
        -X "$method"            # HTTP 方法
        -H "Content-Type: application/json"  # 内容类型
        -H "Accept: application/json"        # 接受 JSON
    )
    
    # 添加 API Key 认证
    if [ -n "$SHADOWME_API_KEY" ]; then
        curl_args+=(-H "x-cc-api-key: $SHADOWME_API_KEY")
    fi
    
    # 添加请求体
    if [ -n "$body" ]; then
        curl_args+=(-d "$body")
    fi
    
    # 发送请求并捕获响应
    local response
    local status_code
    
    response=$(curl "${curl_args[@]}" "$url" 2>&1) || {
        echo "Error: Failed to connect to $url" >&2
        exit 5
    }
    
    # 分离状态码和响应体
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # 检查 HTTP 状态码
    case "$status_code" in
        2*)
            echo "$body"
            ;;
        401|403)
            echo "{\"error\": \"Authentication failed\", \"code\": \"AUTH_FAILED\", \"status\": $status_code}" >&2
            exit 4
            ;;
        404)
            echo "{\"error\": \"Resource not found\", \"code\": \"NOT_FOUND\", \"status\": $status_code}" >&2
            exit 3
            ;;
        *)
            echo "{\"error\": \"API request failed\", \"code\": \"API_ERROR\", \"status\": $status_code, \"body\": $body}" >&2
            exit 3
            ;;
    esac
}

#===============================================================================
# 格式化输出
#===============================================================================
format_output() {
    local input
    input=$(cat)
    
    # 检查是否有 jq
    if command -v jq &> /dev/null; then
        echo "$input" | jq '.' 2>/dev/null || echo "$input"
    else
        echo "$input"
    fi
}

#===============================================================================
# 帮助信息
#===============================================================================
show_help() {
    cat << EOF
ShadowMe API 调用封装

用法:
    shadowme-api.sh <METHOD> <PATH> [BODY]
    shadowme-api.sh <COMMAND> [ARGS...]

方法:
    GET <PATH>              - GET 请求
    POST <PATH> [BODY]      - POST 请求
    PATCH <PATH> <BODY>     - PATCH 请求
    DELETE <PATH>           - DELETE 请求

快捷命令:
    shadowme-api.sh tasks [status]       - 获取任务列表
    shadowme-api.sh task <id>             - 获取任务详情
    shadowme-api.sh take <id>             - 领取任务
    shadowme-api.sh complete <id> <msg>   - 完成任务
    shadowme-api.sh status                - 获取影子状态
    shadowme-api.sh config                - 显示当前配置

示例:
    # 获取待领取任务
    shadowme-api.sh GET /api/tasks?status=pending

    # 领取任务
    shadowme-api.sh POST /api/tasks/TASK-001/take

    # 发送日志
    shadowme-api.sh POST /api/webhook/cc '{"type":"log","content":"Working..."}'

    # 使用快捷命令
    shadowme-api.sh tasks pending
    shadowme-api.sh take TASK-001
    shadowme-api.sh status

配置:
    默认读取 ~/.shadowme/config
    可通过环境变量覆盖:
        SHADOWME_URL
        SHADOWME_API_KEY

EOF
}

#===============================================================================
# 快捷命令处理
#===============================================================================
handle_command() {
    local cmd="${1:-}"
    shift
    
    case "$cmd" in
        tasks)
            local status="${1:-pending}"
            api_request "GET" "/api/tasks?status=$status" | format_output
            ;;
        task)
            local id="$1"
            [ -z "$id" ] && { echo "Error: task id required"; exit 1; }
            api_request "GET" "/api/tasks/$id" | format_output
            ;;
        take)
            local id="$1"
            [ -z "$id" ] && { echo "Error: task id required"; exit 1; }
            api_request "POST" "/api/tasks/$id/take" | format_output
            ;;
        complete)
            local id="$1"
            local summary="${2:-Completed}"
            [ -z "$id" ] && { echo "Error: task id required"; exit 1; }
            local body=$(cat << EOF
{
  "type": "task.complete",
  "taskId": "$id",
  "summary": "$summary",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
            api_request "POST" "/api/webhook/cc" "$body" | format_output
            ;;
        status)
            api_request "GET" "/api/shadow/status" | format_output
            ;;
        config)
            echo "SHADOWME_URL=$SHADOWME_URL"
            echo "SHADOWME_API_KEY=${SHADOWME_API_KEY:+***}"
            echo "CONFIG_FILE=$CONFIG_FILE"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: $cmd" >&2
            show_help
            exit 1
            ;;
    esac
}

#===============================================================================
# 主函数
#===============================================================================
main() {
    # 加载配置
    load_config
    
    # 如果没有参数，显示帮助
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 检查是否是快捷命令
    case "$1" in
        GET|POST|PATCH|DELETE)
            check_config
            api_request "$@"
            ;;
        tasks|task|take|complete|status|config|help)
            check_config
            handle_command "$@"
            ;;
        --help|-h)
            show_help
            ;;
        *)
            # 尝试作为快捷命令处理
            check_config
            handle_command "$@"
            ;;
    esac
}

# 运行主函数
main "$@"
