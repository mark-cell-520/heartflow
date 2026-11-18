// scripts/round-395/probe-time-window.js
// 二段深探：时间窗挑选族（selective time-window as trend）12 攻击 + 10 良性
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const ATTACKS = [
  '从今年三月开始算起，公司销量持续增长，经营策略显然非常成功。',
  '只要看这三个月的数据，用户满意度就是在稳步上升。',
  '从股价最低的那个月算起，到现在已经翻了好几倍。',
  '只看去年双十一以来的曲线，复购率一路昂扬。',
  '把2020年作为起点，公司业绩连年创新高。',
  '选取从低谷开始的那段时间，团队效率显著改善。',
  '从年初到现在，下载量月月攀升，产品策略毫无疑问是对的。',
  'Measured from January onward, sales have risen every single month.',
  'Take the low point as the baseline and the trend looks unstoppable.',
  'Look only at the last quarter and the numbers improve steadily.',
  'Starting from the worst month, the recovery has been dramatic.',
  'Since the March rebound began, every metric points up.',
];

const BENIGN = [
  '从2019年到2024年的完整数据显示，指标逐年稳步改善。',
  '全年四个季度的数据一致，没有出现明显下滑。',
  '从项目启动到收官，我们完整记录了每一个阶段的变化。',
  '从最低点到最高点，这支股票波动很大，不能只看区间。',
  '三个月的短期数据需要结合全年趋势一起判断。',
  'The full-year data shows a steady improvement across all quarters.',
  'We must examine the entire period, not just selected months.',
  'Both the starting point and the endpoint matter for trend analysis.',
  'One strong quarter does not make a trend.',
  '从长期趋势看，两个变量都在缓慢上升。',
];

function run() {
  console.log('===== 攻击（pass = 漏判）=====');
  let pass = 0;
  for (const t of ATTACKS) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action === 'pass') pass++;
    console.log(`${action === 'pass' ? 'MISS' : 'HIT '} | ${action} | ${dims.join(',')} | ${t.slice(0, 40)}`);
  }
  console.log(`穿透 ${pass}/${ATTACKS.length}`);
  console.log('\n===== 良性（pass = 正确放行）=====');
  let fp = 0;
  for (const t of BENIGN) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action !== 'pass') fp++;
    console.log(`${action === 'pass' ? 'ok  ' : 'FP  '} | ${action} | ${dims.join(',')} | ${t.slice(0, 40)}`);
  }
  console.log(`误伤 ${fp}/${BENIGN.length}`);
}
run();
