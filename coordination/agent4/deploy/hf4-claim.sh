#!/usr/bin/env bash
# hf4-claim.sh — 4 号轮次认领（claim-before-write）
# 用法:
#   hf4-claim.sh scan                      # 只看：下一轮号 + 当前活跃轮次，不写任何文件
#   hf4-claim.sh claim <kind> <direction>   # 认领（kind: dimension|fix|research）
#   hf4-claim.sh release <round>            # 释放
#   hf4-claim.sh takeover <round>           # 接手他人过期轮次
# 宪法来源：COORDINATION.md §1.1 轮次号认领制
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"

cmd="${1:-scan}"

case "$cmd" in
  scan)
    need_repo
    log "下一轮次号: $(next_round)"
    log "当前 UPGRADE_LOG 最大轮: $(grep -c '^## r' UPGRADE_LOG.md 2>/dev/null || echo 0) 个 r 头"
    log "当前 VERSION: $(cat VERSION 2>/dev/null || echo '?')"
    log "--- 近 6 小时 heartflow/main ---"
    timeout 90 git fetch "$HF_REMOTE" "$HF_BRANCH" --quiet 2>/dev/null \
      && git log --since='6 hours ago' --oneline "$HF_REMOTE/$HF_BRANCH" | head -30 \
      || log "（fetch 失败或超时——不猜，继续用本地基线）"
    log "--- claims.jsonl 末尾 10 条 ---"
    tail -10 coordination/claims.jsonl 2>/dev/null || log "（无认领账本）"
    log "--- 活跃轮次 ---"
    if [ -f coordination/claims.jsonl ]; then
      python3 - <<'PY'
import json,datetime,os
now=datetime.datetime.now(datetime.timezone.utc)
last={}
for ln in open('coordination/claims.jsonl',encoding='utf-8',errors='replace'):
    ln=ln.strip()
    if not ln: continue
    try: o=json.loads(ln)
    except Exception: continue
    last[str(o.get('round',''))]=o
active=False
for r,o in sorted(last.items(), key=lambda kv:kv[0]):
    st=str(o.get('status','active'))
    if st in ('completed','released','abandoned'): continue
    try: eh=float(o.get('expires_hours') or 6)
    except Exception: eh=6.0
    try:
        dt=datetime.datetime.fromisoformat(str(o.get('claim_at','')).replace('Z','+00:00'))
        if dt.tzinfo is None: dt=dt.replace(tzinfo=datetime.timezone.utc)
        exp=dt+datetime.timedelta(hours=eh)
    except Exception: exp=now
    tag='活跃' if now<exp else '已过期(可接手)'
    print(f"  {r}  {o.get('agent','?')}  kind={o.get('kind','?')}  {tag}  dir={o.get('direction','?')}")
    active=True
if not active: print('  （无活跃轮次）')
PY
    fi
    exit 0
    ;;

  claim)
    kind="${2:-research}"
    direction="${3:-待定}"
    round="$(next_round)"
    # 认领前再确认一次无人抢占：若该轮已被他人活跃持有，换号
    guard=0
    while round_is_active "$round" && [ $guard -lt 5 ]; do
      log "$round 已被活跃持有，递增重试"
      round="r$(( ${round#r} + 1 ))"
      guard=$((guard+1))
    done
    [ $guard -ge 5 ] && die "连续 5 个轮次号被占，放弃本轮，等下一周期"
    line=$(printf '{"round":"%s","agent":"%s","kind":"%s","direction":"%s","claim_at":"%s","expires_hours":6,"status":"active"}' \
      "$round" "$HF_AGENT" "$kind" "$direction" "$(utcnow)")
    claim_append "$line"
    log "已认领 $round (kind=$kind, direction=$direction)"
    echo "$round"
    exit 0
    ;;

  release)
    round="${2:?需要 round}"
    claim_append "$(printf '{"round":"%s","agent":"%s","kind":"release","claim_at":"%s"}' "$round" "$HF_AGENT" "$(utcnow)")"
    log "已释放 $round"
    exit 0
    ;;

  takeover)
    round="${2:?需要 round}"
    if round_is_active "$round"; then
      die "$round 仍在活跃期内，不允许接手"
    fi
    claim_append "$(printf '{"round":"%s","agent":"%s","kind":"takeover","claim_at":"%s"}' "$round" "$HF_AGENT" "$(utcnow)")"
    log "已接手 $round（接手前必须先读它的 UPGRADE_LOG 条目）"
    exit 0
    ;;

  *) die "未知子命令: $cmd（scan|claim|release|takeover）" ;;
esac
