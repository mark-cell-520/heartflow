#!/usr/bin/env node
/* r623 零引用候选汇总打印（避免内联 node -e 触发安全扫描） */
'use strict';
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('/tmp/r623-semantic2.json', 'utf8'));
console.log('scanned:', s.scanned_files, '| modules_with_judge:', s.modules_with_judge_methods, '| zero_ref:', s.zero_ref_modules);
console.log('=== zero_ref candidates ===');
for (const c of s.zero_ref_candidates) {
  const dm = c.judge_methods.filter(m =>
    /detect|score|assess|evaluat|judge|rate|anomal|suspect|verdict/.test(m.toLowerCase()));
  console.log(
    c.file.padEnd(50),
    'judge=' + String(c.judge_method_count).padStart(2),
    '| total=' + String(c.methods_total).padStart(3),
    '|', dm.slice(0, 5).join(','));
}
console.log('=== non-zero-ref sample (first 15) ===');
for (const c of (s.ref_but_maybe_unused || []).slice(0, 15)) {
  console.log(c.file.padEnd(50), 'ref=' + c.ref_count, '| judge=' + c.judge_method_count);
}
