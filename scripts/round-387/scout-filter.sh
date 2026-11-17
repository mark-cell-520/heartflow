#!/usr/bin/env bash
# 从 scout tree JSON 中筛出非 PDF 的可读文件
set -uo pipefail
cd /data/home/heartflow
for f in coordination/agent4/scout/tree-Tessavana-*.json; do
  echo "### $f"
  python3 - "$f" <<'PY'
import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
if 'tree' not in d: print('  err',str(d)[:150]); sys.exit()
n=0
for t in d['tree']:
    p=t['path']
    if t['type']=='blob' and not p.lower().endswith('.pdf'):
        print('  ',p,t.get('size',''))
        n+=1
        if n>60: break
PY
done
