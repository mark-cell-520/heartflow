#!/usr/bin/env bash
# hf-preflight.sh — 心虫升级轮「开轮自检」（语法 + 现场 + 互斥）
#
# 存在理由（2026-11-24 r472 事故，一次真实的数据丢失级事件）：
#   「心虫全面升级」cron 20:46 轮在工具迭代预算耗尽时，最后一次 patch 的
#   old_string 吞掉了 EN_SIGNALS 对象字面量的收尾 }; 及其后一行注释，
#   src/index.js 语法破损且未提交。而四门禁只写在 prompt 的「阶段4 验证」
#   ——跑在轮末。预算爆在轮末之前，门禁从未执行，破损树被留在工作区，
#   下一个写入者（22:35 海外单元）直接在沙地上盖楼。
#   → 结论：门禁必须前移到开轮。先证明地面是实的，再动手。
#
# 本脚本不写任何文件、不 commit、不 push，只读。可安全反复调用。
#
# 用法：
#   bash hf-preflight.sh            # 完整自检
#   bash hf-preflight.sh --quiet    # 只在有问题时输出（供脚本内嵌调用）
#
# 退出码：
#   0 = 工作区语法干净，可以开工
#   1 = 语法破损——已打印破损文件/行号/原因；调用方必须停下，先修再动
#   2 = 环境问题（仓库不存在 / node 不可用 / 无法读取 git 状态）
#
# 设计约束：
#   - 绝不在本脚本里自动修复或自动 checkout。破损现场的处置权在轮次本身
#     （可能是别人半成品的一个 patch，自动回滚会销毁他人未提交产能）。
#   - 报错必须给出可执行信息：文件、行号、列号、原始 message，以及
#     「git show HEAD:<file>」取回原文的命令。

set -uo pipefail

QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1

HF="${HF_REPO:-/root/hermes1/skills/ai/mark-heartflow-skill}"
NODE="${HF_NODE:-/root/.local/bin/node}"
[ -x "$NODE" ] || NODE="$(command -v node 2>/dev/null || true)"

log() { [ "$QUIET" = "1" ] || echo "$@"; }
err() { echo "$@" >&2; }

# ─── 环境 ────────────────────────────────────────────────
if [ -z "$NODE" ]; then
  err "[preflight] FATAL: node 不可用（试过 $HF_NODE 与 PATH 里的 node）"
  exit 2
fi
if [ ! -d "$HF/.git" ]; then
  err "[preflight] FATAL: 仓库不存在或不是 git 仓库: $HF"
  exit 2
fi
cd "$HF" || { err "[preflight] FATAL: 无法 cd $HF"; exit 2; }

log "[preflight] repo=$HF HEAD=$(git rev-parse --short HEAD 2>/dev/null) VERSION=$(cat VERSION 2>/dev/null)"

# ─── 1. 语法闸：改动文件 + 核心入口 ───────────────────────
# 覆盖两类：① 本轮/上轮改过但未提交的（git status）；② 已提交但可能被
# 后续 patch 弄坏的（核心入口恒查）。只查 .js，不查 .md/.json——语法破损
# 只可能发生在代码文件，而 .json 破损会让 node --check 报无关的错。
CANDIDATES=$( {
  git status --porcelain 2>/dev/null | awk '{print $NF}' | grep -E '\.js$' || true
  echo "src/index.js"
  echo "src/gate.js"
  echo "src/mcp-server.js"
} | sort -u )

BROKEN=()
CHECKED=0
for f in $CANDIDATES; do
  [ -f "$f" ] || continue
  CHECKED=$((CHECKED + 1))
  if ! OUT=$("$NODE" --check "$f" 2>&1); then
    BROKEN+=("$f")
    err "[preflight] ❌ 语法破损: $f"
    echo "$OUT" | head -6 | sed 's/^/             /' >&2
  fi
done

if [ "${#BROKEN[@]}" -gt 0 ]; then
  err ""
  err "[preflight] ⛔ 语法闸拦截：${#BROKEN[@]} 个文件破损（共检查 $CHECKED 个）。"
  err "[preflight]    必须停在开轮，先修再动手。修复后重跑本脚本确认 exit 0。"
  err "[preflight]    取回原文用: git show HEAD:<file> > <file>"
  err "[preflight]    若是他人半成品 patch，不要自动 checkout——先确认归属。"
  exit 1
fi
log "[preflight] ✅ 语法闸通过（$CHECKED 个 .js 文件，含 src/index.js / gate.js / mcp-server.js）"

# ─── 2. 现场报告（只读，不拦截） ─────────────────────────
UNCOMMITTED=$(git status --porcelain 2>/dev/null)
if [ -n "$UNCOMMITTED" ]; then
  log "[preflight] ⚠️  工作区有未提交改动（可能是上一轮 WIP 或他轮产能，勿删勿顺手提交）:"
  echo "$UNCOMMITTED" | head -20 | sed 's/^/             /'
else
  log "[preflight] 工作区干净"
fi

# 远端位置（本地缓存引用，只作参考；真实位置以 fresh fetch 为准）
BEHIND=$(git rev-list --count HEAD..heartflow/main 2>/dev/null || echo "?")
AHEAD=$(git rev-list --count heartflow/main..HEAD 2>/dev/null || echo "?")
log "[preflight] 相对 heartflow/main：本地领先 $AHEAD / 落后 $BEHIND（本地缓存，推送前须 fresh fetch）"

# ─── 3. 轮次互斥（宪法 §1.1 的真源：coordination/claims.jsonl） ──────
# 不用另造锁文件——宪法 §1.1「同一时间只允许一个 agent 持有写轮次」的真相
# 就在 claims.jsonl 里，再维护一个锁只会多一个会漂移的副本。
# 解析逻辑照搬 hf4-claim.sh scan（已生产验证）：按 round 取最后一条记录，
# status 非 completed/released/abandoned/closed 且未过 expires_hours = 活跃。
# 这是提示级而非硬闸：prompt 驱动的轮次每条命令是独立进程，无法跨命令持锁。
# 但它把「有没有别人在写」从模型的记忆变成了可执行的 exit code + 明文。
if [ -f coordination/claims.jsonl ]; then
  CLAIM_OUT=$(python3 - <<'PY' 2>/dev/null
import json, datetime
now = datetime.datetime.now(datetime.timezone.utc)
last = {}
for ln in open('coordination/claims.jsonl', encoding='utf-8', errors='replace'):
    ln = ln.strip()
    if not ln:
        continue
    try:
        o = json.loads(ln)
    except Exception:
        continue
    last[str(o.get('round', ''))] = o
active = []
for r, o in sorted(last.items(), key=lambda kv: kv[0]):
    st = str(o.get('status', 'active'))
    if st in ('completed', 'released', 'abandoned', 'closed'):
        continue
    try:
        eh = float(o.get('expires_hours') or 6)
    except Exception:
        eh = 6.0
    try:
        dt = datetime.datetime.fromisoformat(str(o.get('claim_at', '')).replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        exp = dt + datetime.timedelta(hours=eh)
    except Exception:
        exp = now
    if now < exp:
        active.append(f"{r}|{o.get('agent','?')}|{o.get('kind','?')}|{o.get('direction','?')}")
for a in active:
    print(a)
PY
)
  if [ -n "$CLAIM_OUT" ]; then
    log "[preflight] 🔒 宪法 §1.1：检测到未释放的活跃写轮次——"
    echo "$CLAIM_OUT" | while IFS='|' read -r r ag kd dr; do
      log "             round=$r agent=$ag kind=$kd dir=$dr"
    done
    log "[preflight]    → 同一时间只允许一个写轮次。本轮应降级为 research 轮"
    log "[preflight]      （只读 + 报告 + 探针），或等其 release 后再写。"
    log "[preflight]    → 若该轮次已掉线（无 release 且超期），可 takeover，"
    log "[preflight]      但要在最终报告注明接手了哪个 round。"
  else
    log "[preflight] 🔓 claims.jsonl 无活跃写轮次（宪法 §1.1 允许你持写轮次）"
  fi
else
  log "[preflight] ⚠️  无 coordination/claims.jsonl——认领账本缺失，无法判互斥"
fi

log "[preflight] 自检完成，可以开工。"
exit 0
