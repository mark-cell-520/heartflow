#!/bin/sh
# Local PR commenter — replaces external action mark-HeartFlow/mark-heartflow-skill/.github/comment-action@main
REPORT_PATH="${1:-heartflow-audit-report.md}"
if [ ! -f "$REPORT_PATH" ]; then
  echo "Report not found: $REPORT_PATH"
  exit 0
fi

# In a real PR comment we'd use gh or the GitHub API; here we just print for logs.
# This step is optional and must not fail the workflow.
echo "===== Audit report (would be posted as PR comment) ====="
cat "$REPORT_PATH"
echo "===== End audit report ====="
