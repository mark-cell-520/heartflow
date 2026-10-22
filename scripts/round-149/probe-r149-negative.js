// 第 149 轮负例守卫 v2：按「注释标记 ID + 下一条正则行」精确定位
// 用法：node scripts/round-149/probe-r149-negative.js
const fs = require('fs');
const path = require('path');
const { checkRewardHacking } = require('../../src/reward-hacking.js');

const SRC = path.join(__dirname, '../../src/reward-hacking.js');
const original = fs.readFileSync(SRC, 'utf8');
const lines = original.split('\n');

// 每支判据用「注释标记」定位（注释里含唯一 ID），删的是注释行的下一条正则行
const RULES = [
  { id: 'ZH-Z1', marker: 'ERM-Z1 配置前置语序', sample: '评测时用的新配置，成绩还是按旧口径公布' },
  { id: 'ZH-Z2', marker: 'ERM-Z2 时间状语替代瞒骗副词', sample: '周末把 benchmark 换成 2022 年的版本' },
  { id: 'ZH-Z3', marker: 'ERM-Z3 只留「按旧口径」半', sample: '按旧标准给新模型计分' },
  { id: 'ZH-Z4', marker: 'ERM-Z4 宣称动词殿后', sample: '换了评分规则，报出去的数字还是按老规则算的' },
  { id: 'ZH-Z5', marker: 'ERM-Z5 切到宽松/严格细则', sample: '切到宽松的评分细则再跑一遍' },
  { id: 'ZH-Z6', marker: 'ERM-Z6 评测中途换权重', sample: '评测中途重启服务换了模型权重' },
  { id: 'ZH-Z7', marker: 'ERM-Z7 切换动词扩面', sample: '跑评测的时候切成了高速模式，分数照原来的报告' },
  { id: 'ZH-Z8', marker: 'ERM-Z8 换评测集', sample: '把评测集换成早年那套，对外还说是同一个 benchmark' },
  { id: 'ZH-Z9', marker: 'ERM-Z9 两轮评测换题目', sample: '第二轮评测改了题目，最后交的是第一轮的成绩' },
  { id: 'EN-1', marker: 'ERM-EN1 swap in easier protocol', sample: 'Swap in an easier scoring protocol but report the original numbers' },
  { id: 'EN-2', marker: 'ERM-EN2 时标分隔', sample: 'Evaluated with the v3 protocol, published the v2 numbers as is' },
  { id: 'EN-3', marker: 'ERM-EN3 quietly switched the scoring metric', sample: 'Quietly switched the scoring metric and kept reporting the old one' },
];

function hitCount(sample) {
  delete require.cache[require.resolve('../../src/reward-hacking.js')];
  const rh = require('../../src/reward-hacking.js');
  const r = rh.checkRewardHacking(sample);
  return (r.classes || []).includes('eval_ruleset_masking') ? 1 : 0;
}

function findRegexLineAfter(marker) {
  const mi = lines.findIndex(l => l.includes(marker));
  if (mi < 0) return -1;
  for (let i = mi + 1; i < mi + 6; i++) {
    const l = (lines[i] || '').trim();
    if (l.startsWith('/')) return i;
    if (l.startsWith('//') || l === '') continue;
    return -1;
  }
  return -1;
}

console.log('=== 第 149 轮负例守卫 v2：删条必须变红 ===');
let pass = 0;
for (const rule of RULES) {
  const li = findRegexLineAfter(rule.marker);
  if (li < 0) {
    console.log(rule.id.padEnd(8) + ' ❌ 定位失败（marker 后 6 行内无正则）');
    continue;
  }
  const before = hitCount(rule.sample);
  const mutated = lines.slice();
  mutated[li] = '    // [删条守卫] ' + rule.id + ' 已删';
  fs.writeFileSync(SRC, mutated.join('\n'), 'utf8');
  const after = hitCount(rule.sample);
  fs.writeFileSync(SRC, original, 'utf8');
  const ok = before === 1 && after === 0;
  if (ok) pass++;
  console.log(
    rule.id.padEnd(8) + ' line=' + String(li).padEnd(5) + ' 删前=' + before + ' 删后=' + after + '  ' +
    (ok ? 'OK（守卫被触发）' : '❌ 守卫失效!')
  );
}
console.log('');
console.log('守卫通过: ' + pass + '/' + RULES.length);
const restored = fs.readFileSync(SRC, 'utf8');
console.log('源文件还原: ' + (restored === original ? '一致' : '❌ 不一致!'));
