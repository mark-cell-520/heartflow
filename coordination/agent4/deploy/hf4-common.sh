#!/usr/bin/env bash
# hf4-common.sh — 4 号（海外产能单元）公共库。被 hf4-*.sh source。
# 铁律：本文件及所有 hf4-* 脚本不得包含任何 key/token/密码/连接串。
set -uo pipefail

HF_REPO="${HF_REPO:-/root/hermes1/skills/ai/mark-heartflow-skill}"
HF_REMOTE="${HF_REMOTE:-heartflow}"
HF_BRANCH="${HF_BRANCH:-main}"
HF_AGENT="${HF_AGENT:-agent-4}"
HF_LOG_TAG="${HF_LOG_TAG:-hf4}"

# 所有 git/网络操作默认 180s 超时：cron 无人值守，挂起会永久阻塞整轮。
export GIT_HTTP_LOW_SPEED_LIMIT=1000
export GIT_HTTP_LOW_SPEED_TIME=60

log() { echo "[$HF_LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
die() { log "FATAL: $*"; exit 1; }

need_repo() {
  [ -d "$HF_REPO/.git" ] || die "仓库不存在: $HF_REPO（设 HF_REPO 覆盖）"
  cd "$HF_REPO" || die "无法进入 $HF_REPO"
}

# 原子追加一行 JSON 到 coordination/claims.jsonl（flock 防并发半行）
claim_append() {
  local line="$1"
  need_repo
  mkdir -p coordination
  flock coordination/claims.jsonl.lock \
    bash -c 'printf "%s\n" "$1" >> coordination/claims.jsonl' _ "$line" \
    || die "认领账本追加失败"
}

# 从 claims.jsonl 取某轮最后一条记录
claim_last() {
  local round="$1"
  need_repo
  [ -f coordination/claims.jsonl ] || return 0
  python3 - "$round" <<'PY'
import json,sys
r=sys.argv[1]
last=None
for ln in open('coordination/claims.jsonl',encoding='utf-8'):
    ln=ln.strip()
    if not ln: continue
    try: o=json.loads(ln)
    except Exception: continue
    if str(o.get('round',''))==r: last=o
if last: print(json.dumps(last,ensure_ascii=False))
PY
}

# 全局下一轮次号。
# 算法（抗遗留尖峰）：收集 UPGRADE_LOG 的 `## rNNN` 头 + claims.jsonl 的 round，
# 取"有邻居支撑"的最大值 +1。孤立尖峰（如历史遗留的 r607，前后 100 内无其他轮次）
# 会被拒绝，否则会把轮次号推到 608 而与他人实际轮次（r216 后接 r217）错位。
# 可用 HF_NEXT_ROUND 强制覆盖。
next_round() {
  if [ -n "${HF_NEXT_ROUND:-}" ]; then echo "$HF_NEXT_ROUND"; return 0; fi
  need_repo
  python3 - <<'PY'
import json,re,os,sys

vals=set()
if os.path.exists('UPGRADE_LOG.md'):
    for ln in open('UPGRADE_LOG.md',encoding='utf-8',errors='replace'):
        m=re.match(r'^##\s*r(\d+)\b',ln)
        if m: vals.add(int(m.group(1)))
if os.path.exists('coordination/claims.jsonl'):
    for ln in open('coordination/claims.jsonl',encoding='utf-8',errors='replace'):
        ln=ln.strip()
        if not ln: continue
        try: o=json.loads(ln)
        except Exception: continue
        m=re.search(r'(\d+)',str(o.get('round','')))
        if m: vals.add(int(m.group(1)))

if not vals:
    print("r1"); sys.exit()

s=sorted(vals)
WINDOW=int(os.environ.get('HF_ROUND_WINDOW','100'))
best=None
for v in s:
    lo=[x for x in s if v-WINDOW <= x < v]
    # 至少有 2 个更早的邻近轮次才算"在当前序列中"，孤立尖峰不算
    if len(lo) >= 2:
        best=v
if best is None:
    best=s[-1]   # 序列尚短，退回纯最大值
print(f"r{best+1}")
PY
}

# 轮次是否已被他人活跃持有（未 release / 未 completed / 未过期）
round_is_active() {
  local round="$1" now hours
  need_repo
  now=$(date +%s)
  python3 - "$round" "$now" <<'PY'
import json,sys,os,datetime
r=sys.argv[1]; now=int(sys.argv[2])
last=None
if os.path.exists('coordination/claims.jsonl'):
    for ln in open('coordination/claims.jsonl',encoding='utf-8',errors='replace'):
        ln=ln.strip()
        if not ln: continue
        try: o=json.loads(ln)
        except Exception: continue
        if str(o.get('round',''))==r: last=o
if not last: sys.exit(1)
st=str(last.get('status','active'))
if st in ('completed','released','abandoned'): sys.exit(1)
eh=last.get('expires_hours')
try: eh=float(eh) if eh is not None else 6.0
except Exception: eh=6.0
ca=last.get('claim_at','')
exp=now
if ca:
    try:
        dt=datetime.datetime.fromisoformat(ca.replace('Z','+00:00'))
        if dt.tzinfo is None: dt=dt.replace(tzinfo=datetime.timezone.utc)
        exp=int(dt.timestamp())+int(eh*3600)
    except Exception: exp=now
sys.exit(0 if now<exp else 1)
PY
}

utcnow() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# 隐私闸：与 /root/hermes1/scripts/hf-daily-push.sh 同口径
# 规则：文件名精确模式 + diff 内容秘密格式扫描。命中即拒推。
SECRET_FILE_RE='(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore|asc|gpg)$|id_rsa|id_ed25519|credentials|\.netrc|\.npmrc|\.pypirc)'
SECRET_TEXT_RE='(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|hf_[A-Za-z0-9]{34})'

privacy_scan() {
  # $1 = 扫描范围：'staged' 或 'range:<rev>'
  need_repo
  local scope="$1" hits=0 files
  if [ "$scope" = "staged" ]; then
    files=$(git diff --cached --name-only)
    [ -z "$files" ] && { log "隐私闸: 暂存区为空"; return 0; }
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      if printf '%s' "$f" | grep -Eq "$SECRET_FILE_RE"; then
        log "隐私闸命中（文件名）: $f"; hits=1
      fi
    done <<< "$files"
    if git diff --cached -U0 | grep -E '^\+' | grep -v '^\+\+\+' | grep -Eq "$SECRET_TEXT_RE"; then
      log "隐私闸命中（暂存 diff 内容含秘密格式）"; hits=1
    fi
  else
    local range="${scope#range:}"
    files=$(git diff --name-only "$range")
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      if printf '%s' "$f" | grep -Eq "$SECRET_FILE_RE"; then
        log "隐私闸命中（文件名）: $f"; hits=1
      fi
    done <<< "$files"
    if git diff -U0 "$range" | grep -E '^\+' | grep -v '^\+\+\+' | grep -Eq "$SECRET_TEXT_RE"; then
      log "隐私闸命中（提交 diff 内容含秘密格式）"; hits=1
    fi
  fi
  return $hits
}
