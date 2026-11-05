#!/usr/bin/env bash
# hf4-scout.sh — 4 号确定性海外资源扫描（不调 LLM，输出即事实）
# 用法: hf4-scout.sh [topic]
# 只做：arXiv API / GitHub API / Semantic Scholar API 的原始查询，输出结构化结果。
# 空返必须明确写"空返"，严禁编造命中。
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/hf4-common.sh"

OUT_DIR="${OUT_DIR:-coordination/agent4/scout}"
mkdir -p "$OUT_DIR" 2>/dev/null || true
STAMP=$(date -u +%Y%m%d-%H%M%S)
TOPIC="${1:-cognitive bias reasoning}"

need_repo

fetch() { # url outfile label
  local url="$1" out="$2" label="$3"
  log "查询 $label: $url"
  if timeout 45 curl -sSL --max-time 40 -H 'Accept: application/json' \
      -H 'User-Agent: heartflow-agent4-scout/1.0' "$url" -o "$out" 2>/dev/null \
      && [ -s "$out" ]; then
    local n
    n=$(python3 -c "
import json,sys
try:
    d=json.load(open('$out',encoding='utf-8'))
except Exception:
    print('parse-fail'); sys.exit()
def cnt(o):
    if isinstance(o,dict):
        for k in ('entries','items','totalResults','total_count','data'):
            if k in o: return len(o[k]) if isinstance(o[k],list) else o[k]
    if isinstance(o,list): return len(o)
    return '?'
print(cnt(d))
" 2>/dev/null || echo '?')
    log "  → $label 返回条目数: $n"
    return 0
  fi
  log "  → $label 空返或失败（超时/网络/限流）"
  return 1
}

enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
T=$(enc "$TOPIC")

log "=== 4 号海外扫描 topic=$TOPIC stamp=$STAMP ==="

# ① arXiv API（Atom XML）
fetch "http://export.arxiv.org/api/query?search_query=all:${T}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending" \
      "$OUT_DIR/arxiv-$STAMP.xml" "arXiv"

# ② GitHub API（仓库 + 代码搜索，无 token 时限流严）
fetch "https://api.github.com/search/repositories?q=${T}&sort=updated&per_page=15" \
      "$OUT_DIR/github-repos-$STAMP.json" "GitHub repos"

# ③ Semantic Scholar API
fetch "https://api.semanticscholar.org/graph/v1/paper/search?query=${T}&limit=15&fields=title,year,abstract,url,citationCount" \
      "$OUT_DIR/s2-$STAMP.json" "Semantic Scholar"

log "=== 扫描结束，原始文件已存 $OUT_DIR/ ==="
log "下一步由 agent 读这些文件提炼候选方向；空返即空返，按既有形态自建，不编造命中。"
