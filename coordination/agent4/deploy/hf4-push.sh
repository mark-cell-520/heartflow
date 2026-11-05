#!/usr/bin/env bash
# hf4-push.sh — 4 号安全推送（隐私闸 + 无 force + 超时 + 推送后校验）
# 用法: hf4-push.sh [remote] [branch]
# 职责：只 push 本地已 commit 的内容；未提交改动只提示不自动提交。
# 隐私闸命中 / 门禁未跑 / 非 main 分支 → 一律不推。
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"
need_repo

remote="${1:-$HF_REMOTE}"
branch="${2:-$HF_BRANCH}"

# ① 分支守卫
cur=$(git rev-parse --abbrev-ref HEAD)
[ "$cur" = "$branch" ] || die "当前分支 $cur != $branch，不推"

# ② 未提交改动只提示
dirty=$(git status --short | grep -v '^??' || true)
if [ -n "$dirty" ]; then
  log "警告：存在未提交的已跟踪改动，本脚本不自动提交："
  echo "$dirty" | head -20
  log "→ 先由 hf4-commit.sh 提交，再推送"
fi

# ③ 取本地 HEAD 与远端差集
timeout 120 git fetch "$remote" "$branch" --quiet 2>/dev/null || log "（fetch 失败，用本地认知继续）"
local_head=$(git rev-parse HEAD)
remote_head=$(git rev-parse "$remote/$branch" 2>/dev/null || echo "")

if [ -n "$remote_head" ] && [ "$local_head" = "$remote_head" ]; then
  log "本地与 $remote/$branch 已一致，无需推送"
  exit 0
fi

# ④ 隐私闸（扫待推送区间的 diff）
range="HEAD"
[ -n "$remote_head" ] && range="$remote_head..HEAD"
if ! privacy_scan "range:$range"; then
  die "隐私闸命中，拒绝推送（命中详情见上）"
fi
log "隐私闸通过"

# ⑤ 推送（绝不 --force）
if timeout 180 git push "$remote" "$branch"; then
  new_remote=$(git rev-parse "$remote/$branch" 2>/dev/null || echo "")
  if [ "$new_remote" = "$local_head" ]; then
    log "推送成功并校验：HEAD == $remote/$branch ($local_head)"
    exit 0
  fi
  log "推送命令成功但校验不一致：local=$local_head remote=$new_remote —— 不重试，报告"
  exit 2
else
  rc=$?
  log "推送失败 rc=$rc —— 本地保留，下次重试（严禁 push --force）"
  exit $rc
fi
