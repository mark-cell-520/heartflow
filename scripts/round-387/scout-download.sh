#!/usr/bin/env bash
# r387: 下载 Science_Scan 规则式检测器源码与 README 作海外参考
set -uo pipefail
cd /data/home/heartflow
OUT=coordination/agent4/scout
mkdir -p "$OUT"
dl() { # repo path outfile
  timeout 45 curl -sSL --max-time 40 -H 'User-Agent: heartflow-agent4-scout/1.0' \
    "https://raw.githubusercontent.com/$1/HEAD/$2" -o "$OUT/$3" 2>/dev/null
  echo "$3 : $(wc -c < "$OUT/$3" 2>/dev/null || echo 0) bytes"
}
dl "Tessavana/Science_Scan" "README.md" "sciencescan-README.md"
dl "Tessavana/Science_Scan" "Website/RuleBased%20Website/App.py" "sciencescan-rulebased-App.py"
dl "Tessavana/Science_Scan" "Dataset%20creation/NLP%20Dataset%20creation%20engine.py" "sciencescan-dataset-engine.py"
dl "Dekic648/significance-translator" "README.md" "sigtranslator-README.md"
