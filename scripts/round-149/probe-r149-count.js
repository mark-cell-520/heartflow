// 第 149 轮探针 B：中英两张表按族统计条数（唯一真相）
const rh = require('../../src/reward-hacking.js');

const focus = ['condition_tuning', 'eval_ruleset_masking', 'covert_deception', 'eval_input_shortcut',
  'proxy_fetch_code', 'test_gaming', 'task_substitution', 'metric_substitution', 'reward_function_edit',
  'self_referential_loop', 'check_suppression', 'binary_overwrite', 'metric_denominator_gaming',
  'report_fudging', 'measurement_rigging'];

function stat(name, table) {
  const out = {};
  for (const [k, v] of Object.entries(table)) {
    if (Array.isArray(v)) out[k] = v.length;
  }
  return out;
}
const zh = stat('zh', rh.REWARD_HACKING_ZH);
const en = stat('en', rh.REWARD_HACKING_EN);

console.log('=== 中文表（REWARD_HACKING_ZH）===');
console.log('族数 ' + Object.keys(zh).length + ' | 总支数 ' + Object.values(zh).reduce((a, b) => a + b, 0));
console.log('=== 英文表（REWARD_HACKING_EN）===');
console.log('族数 ' + Object.keys(en).length + ' | 总支数 ' + Object.values(en).reduce((a, b) => a + b, 0));

console.log('');
console.log('=== 逐族对比（按 EN 支数降序）===');
console.log('族名'.padEnd(30) + '中文  英文  差值');
const all = [...new Set([...Object.keys(zh), ...Object.keys(en)])];
const rows = all.map(n => ({ n, z: zh[n] || 0, e: en[n] || 0 }))
  .sort((a, b) => b.e - a.e);
for (const r of rows) {
  const diff = r.e - r.z;
  const star = focus.includes(r.n) ? ' <<<' : '';
  const flag = diff > 0 ? '  ⚠️EN多' : (diff < 0 ? '  (ZH多)' : '');
  console.log(r.n.padEnd(30) + String(r.z).padStart(3) + String(r.e).padStart(5) + String(diff).padStart(6) + flag + star);
}
