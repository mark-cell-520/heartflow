const BATCH_PATTERNS = [
  { pat: /batch\s+\w+/i, label: 'batch' },
  { pat: /bulk\s+\w+/i, label: 'bulk' },
  { pat: /all\s+\w+/i, label: 'all' }
];

const text = 'batch process all records.';
const issues = [];

for (const { pat, label } of BATCH_PATTERNS) {
  const copy = new RegExp(pat.source, pat.flags);
  let m;
  let count = 0;
  while ((m = copy.exec(text)) !== null) {
    count++;
    if (count > 10) {
      console.log(`INFINITE LOOP on ${label} at position ${m.index}`);
      process.exit(1);
    }
    const window = text.slice(Math.max(0, m.index - 150), Math.min(text.length, m.index + 150));
    const hasScope = /\d+\s*(items?|records?|files?)/i.test(window);
    const hasBackup = /\.bak|backup|rollback/i.test(window);
    if (!hasScope || !hasBackup) {
      issues.push({
        type: 'batch_no_scope_or_backup',
        severity: 0.6,
        claim: m[0],
        position: m.index,
        detail: `${label} "${m[0]}" missing scope or backup`
      });
    }
  }
  console.log(`${label}: ${count} matches`);
}

console.log(JSON.stringify(issues, null, 2));
