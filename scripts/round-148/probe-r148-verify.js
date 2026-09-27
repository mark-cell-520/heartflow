// 第 148 轮探针 v7：用 run-all 同口径确认 r120 与新测试全绿
'use strict';
const { execFileSync } = require('child_process');
const files = [
  'test/reward-hacking-self-referential-r120.test.js',
  'test/reward-hacking-srl-zh-r148.test.js',
];
for (const f of files) {
  try {
    const out = execFileSync('node', [f], { encoding: 'utf8', timeout: 100000 });
    console.log(`✅ ${f}`);
    const lines = out.split('\n').filter(l => l.includes('通过') || l.includes('断言') || l.includes('结果'));
    for (const l of lines) console.log('   ' + l.trim());
  } catch (e) {
    console.log(`❌ ${f}`);
    console.log((e.stdout || '') + (e.stderr || ''));
  }
}
