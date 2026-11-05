#!/usr/bin/env bash
# hf4-commit.sh — 4 号提交（commit 落盘 + claims 状态推进）
# 用法:
#   hf4-commit.sh <round> <type> <message>
#     type: dimension | fix | research | claim | release
# 规则:
#   - 只 add 与心虫相关的路径（白名单），绝不 add 未跟踪的探针垃圾
#   - commit message 必须含 round + type + VERSION
#   - 提交前跑隐私闸（staged）
#   - research 类型允许零引擎改动（只产 coordination/ 报告），此时走 --allow-empty
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"
need_repo

round="${1:?用法: hf4-commit.sh <round> <type> <message>}"
ctype="${2:?type: dimension|fix|research}"
msg="${3:-}"

# 白名单：4 号允许写的路径（不含 src/index.js 全局接入点——那是 1 号独占）
ALLOW_PATHS=(
  "coordination/"
  "UPGRADE_LOG.md"
  "VERSION"
  "package.json"
  "SKILL.md"
  "AGENTS.md"
  "README.md"
)

# 4 号写引擎模块的白名单：只允许子目录模块，禁止全局接入点
# （子目录模块不冲突：src/core/ethics/、consciousness/ 等各 agent 可分片认领）
ENGINE_DIRS=(
  "src/core/ethics/"
  "src/core/psychology/"
  "consciousness/"
  "src/plugins/"
  "src/tools/"
)

to_add=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    \?\?*) continue ;;  # 未跟踪一律不 add
  esac
  f="${f# ?}"
  f="${f#M }"; f="${f#A }"; f="${f#D }"; f="${f#R }"
  # 取 rename 后的路径
  f="${f##* -> }"
  ok=0
  for p in "${ALLOW_PATHS[@]}" "${ENGINE_DIRS[@]}"; do
    case "$f" in
      "$p"*) ok=1; break ;;
    esac
  done
  if [ $ok -eq 1 ]; then
    to_add+=("$f")
  else
    log "跳过（不在 4 号白名单）: $f"
  fi
done <<< "$(git status --short)"

# 全局接入点硬拦截
for f in "${to_add[@]:-}"; do
  [ -z "$f" ] && continue
  case "$f" in
    src/index.js|bin/verify.js|scripts/guard-abilities.js|scripts/bidirectional-guard.js|test/doc-numbers-accuracy.test.js)
      die "拒绝提交全局接入点/门禁脚本: $f（1 号独占）" ;;
  esac
done

if [ ${#to_add[@]} -eq 0 ]; then
  if [ "$ctype" = "research" ]; then
    log "无白名单内改动（research 轮允许）→ 空提交仅记录轮次"
    git commit --allow-empty -m "$(printf '%s: %s by %s\n\n%s' "$round" "$ctype" "$HF_AGENT" "$msg")"
    exit $?
  fi
  die "无可提交内容（且非 research 轮）"
fi

git add -- "${to_add[@]}"

# 隐私闸（暂存区）
if ! privacy_scan staged; then
  git reset -q
  die "隐私闸命中，已 unstage，拒绝提交"
fi

ver=$(cat VERSION 2>/dev/null || echo '?')
full_msg=$(printf '%s: %s by %s (v%s)\n\n%s' "$round" "$ctype" "$HF_AGENT" "$ver" "$msg")
git commit -m "$full_msg" || die "commit 失败"
log "已提交 $round ($ctype, v$ver): $(git rev-parse --short HEAD)"
