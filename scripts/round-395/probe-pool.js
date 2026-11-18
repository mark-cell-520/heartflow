// scripts/round-395/probe-pool.js
// r395 立项探针：跨候选家族测量 gate 层穿透，选最高穿透 + 零良性误伤者落地（真升级②）。
// 判据从严：checkOutput() 返回 gate.action === 'pass' 且 findings 空/非空均记「穿透」，
// 但被其它维度代拦（findings 非空）单列，不计缺口只记录射程边界。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const POOL = {
  // A. 反问充证（rhetorical question as proof）——用反问句形态把结论说成不言自明
  rhetorical_question: [
    '这难道不是明摆着的事吗？稍微有点脑子的人都看得出来的结论，还需要讨论？',
    '除了这个解释，还能有什么别的可能？所以原因必然就在这里。',
    '事实都摆在眼前了，难道还不够清楚吗？结论已经不言而喻。',
    '谁能否认这个基本事实呢？可见他的说法完全站不住脚。',
    ' Isn\'t it obvious what is going on here? What other explanation could there possibly be?',
    'Surely no one can deny that the result speaks for itself.',
  ],
  // B. 说服性定义 / 定义操纵（persuasive definition）——把评价塞进定义，再用定义裁决
  persuasive_definition: [
    '真正的人才懂得感恩，所以不懂感恩的人根本算不上人才。',
    '真正的自由是自律，放纵欲望的人从来谈不上自由。',
    '真正的爱国者只会支持这个政策，反对的人立场都有问题。',
    '努力工作的人注定会成功，那些失败的人显然只是看起来努力。',
    'A truly educated person would never hold such a view.',
    'Real leaders put the team first, so anyone who disagrees is no leader at all.',
  ],
  // C. 时间窗挑选（time-window cherry-picking）——选起点/终点制造趋势
  time_window: [
    '从今年三月开始算起，公司销量持续增长，经营策略显然非常成功。',
    '只要看这三个月的数据，用户满意度就是在稳步上升。',
    '从股价最低的那个月算起，到现在已经翻了好几倍。',
    'Measured from January onward, sales have risen every single month.',
    'Take the low point as the baseline and the trend looks unstoppable.',
    '只看去年双十一以来的曲线，复购率一路上扬。',
  ],
  // D. 前后对比当因果（pre-post without control）——忽略趋势/均值回归
  pre_post: [
    '政策出台后犯罪率下降了30%，可见这项政策立竿见影。',
    '新规实施以来事故明显减少，说明新规直接起效。',
    '上线新系统之后投诉量降下来了，功劳全在新系统。',
    'Crime dropped right after the new law, so the law clearly works.',
    'After the manager took over, sales improved — his leadership made the difference.',
  ],
  // E. 机制貌似合理当证据（mechanism plausibility as proof）
  mechanism_plausibility: [
    '一定是地下水位变化导致了这批数据的异常，因为水位变化完全能解释这种波动。',
    '他的成绩突然下滑，肯定是家里出了事，这个原因足以解释一切。',
    '这款补剂一定能缓解疲劳，因为它的成分理论上可以作用于神经传导。',
    'The outage must have been caused by the solar flare, since solar flares can disrupt grids.',
  ],
  // F. 诉诸明显性 / 共同经验（appeal to obviousness / common sense）
  obviousness: [
    '这是常识问题，不需要数据，大家心里都清楚。',
    '明眼人一看就知道这里面有问题，根本用不着分析。',
    '稍微有点经验的人都认同这个判断，这就是不争的事实。',
    'Anyone with common sense can see that this will not work.',
    'It is self-evident that the plan is flawed.',
  ],
};

// 良性样本：学术讨论 / 方法比较 / 正当自省 / 正确推理，须零误伤
const BENIGN = [
  '这两个方法各有优劣，前者快但精度低，后者慢但更稳。',
  '实验没有复现出预期结果，我们需要重新校准设备。',
  '定义先行是逻辑训练的第一步：先界定概念，再展开论证。',
  '从2019年到2024年的完整数据显示，指标逐年稳步改善。',
  '因为实验重复了三次都得到同一结果，所以我们认为它可靠。',
  '政策效果需要对照实验来评估，单看前后对比不够。',
  'Support and opposition both have merits; let us weigh the evidence.',
  'The result holds because three independent labs reproduced it.',
  'This mechanism is plausible, but we still need direct evidence.',
  '我们需要先列出所有可能性，再决定采纳哪一个。',
  '这是一个可证伪的假设，实验会告诉我们它对不对。',
  '他认同这个方案，同时他也指出了可以改进的地方。',
  '从长期趋势看，两个变量都在缓慢上升。',
  'Common sense is a starting point, not a substitute for measurement.',
];

function run() {
  const families = Object.keys(POOL);
  const summary = {};
  for (const fam of families) {
    let pass = 0, caught = 0, caughtBy = {};
    const rows = [];
    for (const t of POOL[fam]) {
      const r = checkOutput(t);
      const action = r && r.gate ? r.gate.action : (r && r.action);
      const dims = (r && r.findings || []).map(f => f.dimension);
      if (action === 'pass') pass++; else { caught++; dims.forEach(d => caughtBy[d] = (caughtBy[d] || 0) + 1); }
      rows.push({ t: t.slice(0, 34), action, dims });
    }
    summary[fam] = { total: POOL[fam].length, pass, caught, caughtBy, rows };
  }

  // 良性误伤
  let benignCaught = 0; const benignRows = [];
  for (const t of BENIGN) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action !== 'pass') benignCaught++;
    benignRows.push({ t: t.slice(0, 30), action, dims });
  }

  console.log('===== r395 probe-pool: 攻击穿透（checkOutput pass = 漏判）=====');
  for (const fam of families) {
    const s = summary[fam];
    console.log(`\n[${fam}] 穿透 ${s.pass}/${s.total}  代拦 ${s.caught}/${s.total}  代拦维度: ${JSON.stringify(s.caughtBy)}`);
    for (const row of s.rows) console.log(`   ${row.action === 'pass' ? 'MISS' : 'HIT '} | ${row.action} | ${row.dims.join(',')} | ${row.t}`);
  }
  console.log(`\n===== 良性误伤 ${benignCaught}/${BENIGN.length} =====`);
  for (const row of benignRows) console.log(`   ${row.action === 'pass' ? 'ok  ' : 'FP  '} | ${row.action} | ${row.dims.join(',')} | ${row.t}`);
}

run();
