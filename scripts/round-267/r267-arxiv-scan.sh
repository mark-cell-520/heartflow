#!/bin/bash
# r267 海外扫描：行为经济学偏误 / 认知偏误检测判别规则
cd /root/hermes1/skills/ai/mark-heartflow-skill
mkdir -p coordination/agent4/scout
run() {
  local q="$1"; local out="$2"
  curl -s --max-time 90 "https://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending" -o "$out"
  local n=$(grep -c "<entry>" "$out" 2>/dev/null || echo 0)
  echo "$out -> $n entries"
}
run "abs:%22cognitive%20bias%22%20AND%20abs:%22LLM%22" coordination/agent4/scout/arxiv-r267-cognitive-bias-llm.xml
run "abs:%22anchoring%20bias%22" coordination/agent4/scout/arxiv-r267-anchoring.xml
run "abs:%22behavioral%20bias%22%20AND%20abs:%22detection%22" coordination/agent4/scout/arxiv-r267-behavioral-detection.xml
run "abs:%22loss%20aversion%22%20AND%20abs:%22language%22" coordination/agent4/scout/arxiv-r267-loss-aversion.xml
run "abs:%22omission%20bias%22" coordination/agent4/scout/arxiv-r267-omission-bias.xml
