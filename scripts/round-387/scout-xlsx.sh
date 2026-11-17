#!/usr/bin/env bash
# r387: 下载 Science_Scan 的 non-significant 误读措辞表(xlsx)并解出 sharedStrings
set -uo pipefail
cd /data/home/heartflow
OUT=coordination/agent4/scout
mkdir -p "$OUT"
timeout 60 curl -sSL --max-time 55 -H 'User-Agent: heartflow-agent4-scout/1.0' \
  "https://raw.githubusercontent.com/Tessavana/Science_Scan/HEAD/Website/RuleBased%20Website/Nonsignificant%20incorrect2.xlsx" \
  -o "$OUT/nonsignificant-incorrect2.xlsx" 2>/dev/null
echo "xlsx bytes: $(wc -c < "$OUT/nonsignificant-incorrect2.xlsx")"
python3 - "$OUT/nonsignificant-incorrect2.xlsx" "$OUT/nonsignificant-phrases.txt" <<'PY'
import sys, zipfile, re, xml.etree.ElementTree as ET
src, dst = sys.argv[1], sys.argv[2]
try:
    z = zipfile.ZipFile(src)
except Exception as e:
    print('open-fail', e); sys.exit()
names = z.namelist()
if 'xl/sharedStrings.xml' not in names:
    print('no sharedStrings; names=', names[:20]); sys.exit()
xml = z.read('xl/sharedStrings.xml').decode('utf-8', 'replace')
ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
root = ET.fromstring(xml)
out = []
for si in root.findall(ns+'si'):
    parts = [t.text or '' for t in si.iter(ns+'t')]
    s = ''.join(parts).strip()
    if s: out.append(s)
with open(dst, 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print('phrases extracted:', len(out))
PY
echo "--- 前 80 条 ---"
head -80 "$OUT/nonsignificant-phrases.txt" 2>/dev/null
