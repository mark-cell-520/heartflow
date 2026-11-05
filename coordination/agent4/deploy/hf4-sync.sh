#!/usr/bin/env bash
# hf4-sync.sh — 4 号拉取同步（pull --rebase）+ 冲突检测
# 用法: hf4-sync.sh
# 规则：rebase 优先；冲突时保留现场并退出非零，由调用方决定（绝不自动解冲突猜内容）
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"
need_repo

cur=$(git rev-parse --abbrev-ref HEAD)
[ "$cur" = "$HF_BRANCH" ] || die "当前分支 $cur != $HF_BRANCH"

if ! timeout 120 git fetch "$HF_REMOTE" "$HF_BRANCH" --quiet; then
  log "fetch 失败（网络/超时）——保留本地状态，退出"
  exit 3
fi

behind=$(git rev-list --count "HEAD..$HF_REMOTE/$HF_BRANCH" 2>/dev/null || echo "?")
ahead=$(git rev-list --count "$HF_REMOTE/$HF_BRANCH..HEAD" 2>/dev/null || echo "?")
log "本地 ahead=$ahead behind=$behind（相对 $HF_REMOTE/$HF_BRANCH）"

if [ "$behind" = "0" ]; then
  log "已是最新，无需同步"
  exit 0
fi

# 有本地未提交改动时先 stash（rebase 要求干净工作区）
stashed=0
if [ -n "$(git status --short | grep -v '^??')" ]; then
  git stash push -m "hf4-sync auto-stash $(utcnow)" >/dev/null 2>&1 && stashed=1 \
    && log "已 stash 本地未提交改动" || log "stash 失败"
fi

if timeout 180 git pull --rebase "$HF_REMOTE" "$HF_BRANCH"; then
  log "rebase 成功"
  [ $stashed -eq 1 ] && git stash pop && log "已恢复 stash"
  exit 0
else
  log "rebase 冲突 —— 中止 rebase 保留本地提交，现场如下："
  git rebase --abort 2>/dev/null
  git status --short | head -20
  [ $stashed -eq 1 ] && git stash pop 2>/dev/null && log "已恢复 stash"
  log "→ 需人工/agent 读取双方内容后决定，严禁 push --force 覆盖他人"
  exit 4
fi
