#!/usr/bin/env bash
# r387: 读取 Tessavana/Science_Scan 等仓库文件树 + README
set -uo pipefail
cd /data/home/heartflow
OUT=coordination/agent4/scout
mkdir -p "$OUT"
for r in "Tessavana/Science_Scan" "Tessavana/NLP-data" "Dekic648/significance-translator"; do
  echo "### $r"
  timeout 40 curl -sSL --max-time 35 -H 'Accept: application/json' \
    -H 'User-Agent: heartflow-agent4-scout/1.0' \
    "https://api.github.com/repos/$r/git/trees/HEAD?recursive=1" -o "$OUT/tree-$(echo $r|tr '/' '-').json" 2>/dev/null
  python3 - "$OUT/tree-$(echo $r|tr '/' '-').json" <<'PY'
import json,sys
p=sys.argv[1]
try: d=json.load(open(p,encoding='utf-8'))
except Exception as e: print('  parse-fail',e); sys.exit()
if 'tree' not in d: print('  err:',str(d)[:200]); sys.exit()
for t in d['tree'][:80]:
    if t['type']=='blob': print('  ',t['path'], t.get('size',''))
PY
done
