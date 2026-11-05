#!/usr/bin/env bash
# hf4-status.sh — 4 号状态快照（cron 每轮开头跑，5 秒内出结果）
# 用法: hf4-status.sh
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"
need_repo

log "=== 4 号状态快照 ==="
log "时间(UTC): $(utcnow)"
log "VERSION: $(cat VERSION 2>/dev/null || echo '?')"
log "分支: $(git rev-parse --abbrev-ref HEAD)  HEAD: $(git rev-parse --short HEAD)"
log "UPGRADE_LOG 轮次数: $(grep -c '^## r' UPGRADE_LOG.md 2>/dev/null || echo 0)"
log "下一可用轮次: $(next_round)"

log "--- 本地未推送 commit（ahead of remote）---"
timeout 90 git fetch "$HF_REMOTE" "$HF_BRANCH" --quiet 2>/dev/null || log "（fetch 失败，仅看本地）"
ahead=$(git rev-list --count "$HF_REMOTE/$HF_BRANCH..HEAD" 2>/dev/null || echo "?")
behind=$(git rev-list --count "HEAD..$HF_REMOTE/$HF_BRANCH" 2>/dev/null || echo "?")
log "ahead=$ahead behind=$behind"
[ "$ahead" != "0" ] && [ "$ahead" != "?" ] && git log --oneline "$HF_REMOTE/$HF_BRANCH..HEAD" | head -20

log "--- 未提交改动（非 ??）---"
git status --short | grep -v '^??' | head -20 || log "（无）"

log "--- 他人近 24h commit ---"
git log --since='24 hours ago' --oneline "$HF_REMOTE/$HF_BRANCH" 2>/dev/null | head -30 || log "（无）"

log "--- claims 末尾 5 条 ---"
tail -5 coordination/claims.jsonl 2>/dev/null || log "（无认领账本）"

log "--- 4 号自己的报告目录 ---"
ls -1 coordination/agent4/ 2>/dev/null || log "（空）"

log "=== 快照结束 ==="
