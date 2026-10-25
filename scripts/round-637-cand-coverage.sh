#!/bin/bash
# r637 探针 5：候选零可达能力在 git log / dispatch / MCP 三层的历史覆盖率
cd "$(dirname "$0")/.." || exit 1
for k in aiSelfPositioning fieldInjector associativeEngine globalWorkspace memoryKernel memoryIndex dreamConsolidation decisionFeedback gapExecutor hypothesisDriver outputChecklist agentCard postTraining decisionExecutor selfDiagnosis whatLearned diagnostic core; do
  g=$(git log --oneline -400 | grep -ci "$k" || true)
  t=$(ls test/ | grep -ci "$k" || true)
  m=$(grep -ci "$k" src/mcp-server.js || true)
  echo "$k gitlog=$g testfile=$t mcp=$m"
done
