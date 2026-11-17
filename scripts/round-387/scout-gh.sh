#!/usr/bin/env bash
# r387 定向扫描：写文件避免命令行解析限制
set -uo pipefail
cd /data/home/heartflow
OUT=coordination/agent4/scout
mkdir -p "$OUT"
enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }

for t in "base rate fallacy" "Simpson paradox" "confidence interval misinterpretation" "p-value misinterpretation"; do
  echo "### GitHub: $t"
  timeout 45 curl -sSL --max-time 40 -H 'Accept: application/json' \
    -H 'User-Agent: heartflow-agent4-scout/1.0' \
    "https://api.github.com/search/repositories?q=$(enc "$t")&per_page=10" -o "$OUT/gh-$(echo "$t"|tr ' ' '-').json" 2>/dev/null
  python3 -c "
import json,sys
try: d=json.load(open('$OUT/gh-$(echo "$t"|tr ' ' '-').json',encoding='utf-8'))
except Exception as e: print(' parse-fail',e); sys.exit()
print(' total_count=',d.get('total_count'))
for i in d.get('items',[])[:10]: print('  ',i['full_name'],'star',i['stargazers_count'],'|',(i.get('description') or '')[:90])
"
done
