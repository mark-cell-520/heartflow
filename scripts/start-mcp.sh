#!/usr/bin/env bash
# HeartFlow MCP 启动脚本
# 确保 v6 MCP（SSE 服务器，182 个工具）跑在 hermes config.yaml 配的端口上
#
# [2026-10-15 global-fix] 三处运行 bug 修复：
#   1. node 路径写死 /tmp/nodejs/bin/node —— 该路径在本机不存在，脚本一直起不来。
#      改为自动探测：/root/.local/bin/node → command -v node。
#   2. 默认端口 8588 与 hermes config.yaml 的 mcp_servers.heartflow（127.0.0.1:8099）
#      不一致，改默认 8099（仍可用 $1 覆盖）。
#   3. 清理旧进程用 fuser，但本机没有 fuser，那步一直是静默空转。
#      改用按命令行模式匹配的 pkill，且只在端口被占用时才动手。
#
# 用法：scripts/start-mcp.sh [端口]   默认 8099
# 说明：exec 前台运行，适合直接跑或交给 supervisord 托管。

set -u

REPO=/root/.hermes/skills/ai/mark-heartflow-skill
PORT="${1:-8099}"

# 1. 定位 node
NODE=""
for cand in /root/.local/bin/node /usr/local/bin/node /usr/bin/node; do
    [ -x "$cand" ] && NODE="$cand" && break
done
if [ -z "$NODE" ]; then
    NODE="$(command -v node 2>/dev/null || true)"
fi
if [ -z "$NODE" ]; then
    echo "start-mcp: 找不到 node 可执行文件" >&2
    exit 1
fi

cd "$REPO" || exit 1

# 2. 端口已被占用才清理旧实例（避免误杀无关进程）
if command -v ss >/dev/null 2>&1; then
    if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
        echo "start-mcp: 端口 ${PORT} 已占用，停掉旧 mcp-server 实例"
        pkill -f "mcp-server.js --port ${PORT}" 2>/dev/null || true
        sleep 2
    fi
fi

# 3. 启动（exec 前台，supervisord 可直接托管）
exec "$NODE" src/mcp-server.js --port "$PORT"
