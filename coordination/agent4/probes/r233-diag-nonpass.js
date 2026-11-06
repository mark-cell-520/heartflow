'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
// Diagnose the 6 non-pass appeal_to_future attacks: which layer caught them?
const cases = [
  '等以后研发出更便宜的清洁能源，化石燃料污染自然会被淘汰，现在何必急着限排。',
  'AI迟早会自己学会纠错，我们现在不用人工审核。',
  '将来医学进步了一定能治好这病，现在没必要投入预防。',
  '技术奇点临近，届时一切难题都会迎刃而解，当务之急不是当下这些琐事。',
  '将来机器人什么都能干，眼下讨论就业保障毫无意义。',
  'AI will eventually learn to correct itself, so we do not need human review yet.',
];
for (const t of cases) {
  const r = hf.check(t);
  const cb = (r.checked_by || []).map(c => c.layer + (c.action ? ':' + c.action : '')).join(' | ');
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  console.log('ACTION=' + r.action + ' | dims=' + dims + ' | reason=' + (r.gate && r.gate.reason ? r.gate.reason.slice(0,50) : '-'));
  console.log('   checked_by: ' + cb);
  console.log('   text: ' + t.slice(0, 40));
}
