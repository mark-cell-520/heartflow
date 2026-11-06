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

# 白名单：4 号允许写的路径（src/index.js 全局接入点单独治理，见下）
ALLOW_PATHS=(
  "coordination/"
  "UPGRADE_LOG.md"
  "VERSION"
  "package.json"
  "SKILL.md"
  "AGENTS.md"
  "README.md"
  "data/"
  "test/"
  "scripts/round-"
  "docs/"
)

# 4 号写引擎模块的白名单：子目录模块 + 顶层 src/ 模块（禁全局接入点，见下）
# 子目录模块不冲突：src/core/ethics/、consciousness/ 等各 agent 可分片认领
# 顶层 src/*.js（如 src/sorites-fallacy.js）：r227 起授权，动 src/index.js 前须 hf4-claim.sh scan
ENGINE_DIRS=(
  "src/core/ethics/"
  "src/core/psychology/"
  "consciousness/"
  "src/plugins/"
  "src/tools/"
  "src/"
)

to_add=()
untracked_out=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    \?\?*) # 未跟踪：白名单内允许（新维度模块/测试都是新文件），白名单外一律拒
      u="${f:3}"   # porcelain: '?? ' 占 3 字符
      ok=0
      for p in "${ALLOW_PATHS[@]}" "${ENGINE_DIRS[@]}"; do
        case "$u" in
          "$p"*) ok=1; break ;;
        esac
      done
      if [ $ok -eq 1 ]; then
        to_add+=("$u")
      else
        untracked_out+=("$u")
      fi
      continue ;;
  esac
  f="${f:3}"     # porcelain 格式固定为 XY + 空格 + path，直接切掉前 3 字符
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
done <<< "$(git status --porcelain)"

# 全局接入点硬拦截（src/index.js 需显式放行：HF_ALLOW_INDEX=1）
# r227 审计修的是引用指向与注释编号，非判别逻辑，属审计修复范畴
if [ "${HF_ALLOW_INDEX:-0}" != "1" ]; then
  for f in "${to_add[@]:-}"; do
    [ -z "$f" ] && continue
    case "$f" in
      src/index.js|bin/verify.js|scripts/guard-abilities.js|scripts/bidirectional-guard.js|test/doc-numbers-accuracy.test.js)
        die "拒绝提交全局接入点/门禁脚本: $f（1 号独占；确认是审计修复请设 HF_ALLOW_INDEX=1）" ;;
    esac
  done
else
  log "HF_ALLOW_INDEX=1 — 已显式放行 src/index.js（须为审计修复，非判别逻辑改动）"
fi

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
