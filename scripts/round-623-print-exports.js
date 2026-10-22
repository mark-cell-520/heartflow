#!/usr/bin/env node
/* r623 exports 扫描结果摘要 */
'use strict';
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/tmp/r623-exports.json', 'utf8'));
console.log('scanned_src_files:', d.scanned_src_files, '| zero_ref_modules:', d.zero_ref_modules);
// GET/HFS = 有语义的函数名
const JUDGE = /detect|score|assess|evaluat|judge|discrimin|verdict|validat|anomal|mislead|fallac|bias|coerc|manipul|risk|unsupported|overclaim|check|grade|flag/;
const rows = d.out.filter(m => m.zero_ref.some(n => JUDGE.test(n)));
console.log('--- zero-ref modules with judge-ish export names:', rows.length);
for (const m of rows.slice(0, 60)) {
  console.log(m.file.padEnd(54), 'zero=' + String(m.zero_ref.length).padStart(3),
    '|', m.zero_ref.filter(n => JUDGE.test(n)).slice(0, 6).join(','));
}
console.log('--- all zero-ref modules (first 60) ---');
for (const m of d.out.slice(0, 60)) {
  console.log(m.file.padEnd(54), 'zero=' + String(m.zero_ref.length).padStart(3),
    '|', m.zero_ref.slice(0, 6).join(','));
}
