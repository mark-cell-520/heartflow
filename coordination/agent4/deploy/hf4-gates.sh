#!/usr/bin/env bash
# hf4-gates.sh — 4 号四门禁复跑（本地口径守门，不等 CI）
# 用法: hf4-gates.sh [--json]
# 输出: 每门禁一行 PASS/FAIL + 实测数字；--json 输出结构化结果供上层判断
# 基线来自 coordination/DEPLOY-agent2.md，可能与当前实际不一致——
# 不一致时如实报告，不修改测试断言迁就代码。
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"
need_repo

JSON=0
[ "${1:-}" = "--json" ] && JSON=1

# 基线期望（可被环境变量覆盖，用于门禁数字随版本前进时更新）
EXP_VERIFY="${EXP_VERIFY:-16}"
EXP_GUARD_ABILITIES="${EXP_GUARD_ABILITIES:-20}"
EXP_DOC_NUMBERS="${EXP_DOC_NUMBERS:-24}"
EXP_RECALL="${EXP_RECALL:-52}"
EXP_FALSE_BLOCK="${EXP_FALSE_BLOCK:-302}"
EXP_TOTAL_BENIGN="${EXP_TOTAL_BENIGN:-326}"

run_gate() {
  local name="$1" cmd="$2"
  local out rc
  out=$(timeout 300 bash -c "$cmd" 2>&1); rc=$?
  GATE_OUT="$out"; GATE_RC=$rc
}

declare -a R_NAME R_RC R_DETAIL
idx=0

record() { R_NAME[$idx]="$1"; R_RC[$idx]="$2"; R_DETAIL[$idx]="$3"; idx=$((idx+1)); }

extract() { # 从输出里抓数字，抓不到写 raw
  echo "$1" | grep -Eo '[0-9]+[^ ]*' | tr '\n' ' ' | cut -c1-160
}

# 1) bin/verify.js
run_gate "bin/verify.js" "node bin/verify.js"
if [ $GATE_RC -eq 0 ]; then
  p=$(echo "$GATE_OUT" | grep -Eo '[0-9]+ passed' | head -1 | grep -Eo '[0-9]+')
  f=$(echo "$GATE_OUT" | grep -Eo '[0-9]+ failed' | head -1 | grep -Eo '[0-9]+')
  if [ "${f:-0}" = "0" ] && [ "${p:-0}" -ge "$EXP_VERIFY" ]; then
    record "bin/verify.js" PASS "passed=${p:-?} failed=${f:-0}"
  else
    record "bin/verify.js" FAIL "passed=${p:-?} failed=${f:-?} (期望 passed>=$EXP_VERIFY failed=0)"
  fi
else
  record "bin/verify.js" FAIL "exit=$GATE_RC $(extract "$GATE_OUT")"
fi

# 2) scripts/guard-abilities.js
# 输出有两组数字，别混：
#   "全部 20 项能力检查通过" = 能力检查项数（固定 20）
#   "维度登记: dimensions 键: 211 个" = 判别维度数（随升级增长）
# 门禁判据 = 能力检查项数与"全部 N 项通过"一致。
run_gate "scripts/guard-abilities.js" "node scripts/guard-abilities.js"
if [ $GATE_RC -eq 0 ]; then
  total=$(echo "$GATE_OUT" | grep -Eo '全部 [0-9]+ 项能力检查通过' | head -1 | grep -Eo '[0-9]+')
  dims=$(echo "$GATE_OUT" | grep -Eo 'dimensions 键: [0-9]+' | head -1 | grep -Eo '[0-9]+')
  # 回退：从最后汇总行取 "✅ 全部 N 项"
  [ -z "$total" ] && total=$(echo "$GATE_OUT" | grep -Eo '全部 [0-9]+ 项' | tail -1 | grep -Eo '[0-9]+')
  if [ "${total:-0}" = "$EXP_GUARD_ABILITIES" ]; then
    record "scripts/guard-abilities.js" PASS "能力检查 ${total}/${total} 全通过；判别维度 ${dims:-?} 个"
  else
    record "scripts/guard-abilities.js" FAIL "能力检查 ${total:-?} 项通过（期望 ${EXP_GUARD_ABILITIES} 项）；维度 ${dims:-?}"
  fi
else
  record "scripts/guard-abilities.js" FAIL "exit=$GATE_RC $(extract "$GATE_OUT")"
fi

# 3) test/doc-numbers-accuracy.test.js
run_gate "test/doc-numbers-accuracy.test.js" "node test/doc-numbers-accuracy.test.js"
if [ $GATE_RC -eq 0 ]; then
  # 实际输出格式："结果: 24 通过, 0 失败, 共 24 个"（中文，非 node:test 的 # pass）
  p=$(echo "$GATE_OUT" | grep -Eo '[0-9]+ 通过' | head -1 | grep -Eo '[0-9]+')
  f=$(echo "$GATE_OUT" | grep -Eo '[0-9]+ 失败' | head -1 | grep -Eo '[0-9]+')
  # 兼容 node:test 格式作为回退
  [ -z "$p" ] && p=$(echo "$GATE_OUT" | grep -Eo '# pass [0-9]+' | grep -Eo '[0-9]+' | head -1)
  [ -z "$f" ] && f=$(echo "$GATE_OUT" | grep -Eo '# fail [0-9]+' | grep -Eo '[0-9]+' | head -1)
  if [ "${f:-0}" = "0" ] && [ "${p:-0}" -ge "$EXP_DOC_NUMBERS" ]; then
    record "test/doc-numbers-accuracy.test.js" PASS "通过=${p:-?} 失败=${f:-0}"
  else
    record "test/doc-numbers-accuracy.test.js" FAIL "通过=${p:-?} 失败=${f:-?} (期望 通过>=$EXP_DOC_NUMBERS 失败=0)"
  fi
else
  record "test/doc-numbers-accuracy.test.js" FAIL "exit=$GATE_RC $(extract "$GATE_OUT")"
fi

# 4) scripts/bidirectional-guard.js
run_gate "scripts/bidirectional-guard.js" "node scripts/bidirectional-guard.js"
if [ $GATE_RC -eq 0 ]; then
  rec=$(echo "$GATE_OUT" | grep -Eo '召回[^0-9]*[0-9]+ */ *[0-9]+' | head -1 | grep -Eo '[0-9]+ */ *[0-9]+' | tr -d ' ')
  fp=$(echo "$GATE_OUT" | grep -Eo '误拦[^0-9]*[0-9]+ */ *[0-9]+' | head -1 | grep -Eo '[0-9]+ */ *[0-9]+' | tr -d ' ')
  rn="${rec%%/*}"; rt="${rec##*/}"
  fn="${fp%%/*}"; ft="${fp##*/}"
  if [ "${rn:-0}" -ge "$EXP_RECALL" ] && [ "${fn:-999}" -le "$EXP_FALSE_BLOCK" ]; then
    record "scripts/bidirectional-guard.js" PASS "召回=${rn:-?}/${rt:-?} 误拦=${fn:-?}/${ft:-?}"
  else
    record "scripts/bidirectional-guard.js" FAIL "召回=${rn:-?}/${rt:-?} 误拦=${fn:-?}/${ft:-?} (期望 召回>=$EXP_RECALL 误拦<=$EXP_FALSE_BLOCK)"
  fi
else
  record "scripts/bidirectional-guard.js" FAIL "exit=$GATE_RC $(extract "$GATE_OUT")"
fi

allpass=1
if [ $JSON -eq 1 ]; then
  printf '{\n'
  printf '  "agent": "%s",\n' "$HF_AGENT"
  printf '  "version": "%s",\n' "$(cat VERSION 2>/dev/null || echo '?')"
  printf '  "gates": [\n'
  for i in $(seq 0 $((idx-1))); do
    sep=","; [ $i -eq $((idx-1)) ] && sep=""
    printf '    {"name": "%s", "status": "%s", "detail": "%s"}%s\n' "${R_NAME[$i]}" "${R_RC[$i]}" "${R_DETAIL[$i]//\"/\\\"}" "$sep"
    [ "${R_RC[$i]}" = "PASS" ] || allpass=0
  done
  printf '  ],\n  "all_pass": %s\n' "$([ $allpass -eq 1 ] && echo true || echo false)"
  printf '}\n'
else
  log "VERSION=$(cat VERSION 2>/dev/null || echo '?')"
  for i in $(seq 0 $((idx-1))); do
    log "${R_RC[$i]}  ${R_NAME[$i]}  —  ${R_DETAIL[$i]}"
    [ "${R_RC[$i]}" = "PASS" ] || allpass=0
  done
  if [ $allpass -eq 1 ]; then log "四门禁全绿"; else log "门禁存在 FAIL——停下报告，不 commit"; fi
fi
exit $((1-allpass))
