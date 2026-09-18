#!/bin/sh
set -e
echo "Running HeartFlow audit..."
node .github/audit-runner.js || echo "Audit runner failed; generating empty report for workflow continuity"
cat > heartflow-audit-report.md <<'EOF'
# HeartFlow Audit Report

- Audit runner failed or produced no output.
EOF
echo "report=heartflow-audit-report.md"
