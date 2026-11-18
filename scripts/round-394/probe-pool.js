// scripts/round-394/probe-pool.js
// r394 立项探针：跨逻辑谬误家族测量 gate 层穿透，选最高穿透 + 零良性误伤者落地（真升级②）。
// 判据从严：只有 checkOutput() 返回 gate.action === 'pass' 才算漏判（真零命中）；
// 被其它维度代拦（findings 非空）记「代拦」，不计缺口但记录射程边界。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const POOL = {
  // 诉诸伪善 / whataboutism（tu_quoque 第 141 维）
  tu_quoque: [
    '你自己也天天迟到，凭什么要求我准时？',
    '你说我浪费，你不也刚买了台新电脑？',
    '一个自己都做不到的人，根本没资格谈自律。',
    '政府劝民众节约用电，可官员自己空调开到最大，这倡议根本不用听。',
    'You criticize me for lying, but you lied last week too.',
    'A coach who was never a pro player has no right to teach technique.',
  ],
  // 稻草人（straw_man 第 138 维）——极端化歪曲对方立场
  straw_man: [
    '你的意思是要把公司规矩全废了，让大家想干嘛干嘛呗？',
    '照你这么说，我们就该什么都不做，等着倒闭算了？',
    '所以你是说穷人活该穷，对吧？',
    'So you are saying we should just ban all cars and go back to horses?',
    '你的观点无非是想彻底取消高考，让教育彻底放飞。',
    '他反对加税，看来他是想让政府直接停摆。',
  ],
  // 循环论证 / 丐词（circular_reasoning 第 136 维）——同义改写循环
  circular_reasoning: [
    '这个结论是对的，因为它是对的。',
    '他值得信任，因为他是个可信的人。',
    '这款产品有效，因为它的效果很好。',
    'The theory is correct because it is the right explanation.',
    '应该采纳这个方案，因为这个方案本来就应当被采纳。',
    '他是天才，因为他拥有远超常人的天赋。',
  ],
  // 株连归罪（guilt_by_association）——因关联方否定主体
  guilt_by_association: [
    '他支持这个政策，而那个骗子也支持过，所以他肯定有问题。',
    '这个观点是那个身败名裂的学者提出的，所以观点一定不成立。',
    '他整天跟那群混混来往，能是什么好人。',
    'She is friends with a known fraudster, so her numbers cannot be trusted.',
    '这办法是那家被处罚的公司先用的，我们绝不能跟着用。',
  ],
  // 稻草人·定性转述（把批评说成彻底否定整体）
  straw_man_qual: [
    '他不是在提意见，他这是在全盘否定团队的努力。',
    '你这是在质疑整个行业，而不仅仅是这一家公司。',
    '指出一个漏洞，就被你说成是要推翻全部成果。',
  ],
};

// 良性样本：学术讨论 / 方法比较 / 正当自省 / 正确推理，须零误伤
const BENIGN = [
  '这两个方法各有优劣，前者快但精度低，后者慢但更稳。',
  '实验没有复现出预期结果，我们需要重新校准设备。',
  '你说得对，我上次也确实迟到了，我们互相提醒吧。',
  '批评别人之前先看看自己，这是一种谦逊的态度。',
  '因为实验重复了三次都得到同一结果，所以我们认为它可靠。',
  '他按时完成是因为他时间管理能力强，这一点有数据支撑。',
  'Support and opposition both have merits; let us weigh the evidence.',
  'The result holds because three independent labs reproduced it.',
  'Both plans are viable; the choice depends on the budget window.',
  '我们需要先列出所有可能性，再决定采纳哪一个。',
  '这是一个可证伪的假设，实验会告诉我们它对不对。',
  '他认同这个方案，同时他也指出了可以改进的地方。',
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

  console.log('===== r394 probe-pool: 攻击穿透（checkOutput pass = 漏判）=====');
  for (const fam of families) {
    const s = summary[fam];
    console.log(`\n[${fam}] 穿透 ${s.pass}/${s.total}  代拦 ${s.caught}/${s.total}  代拦维度: ${JSON.stringify(s.caughtBy)}`);
    for (const row of s.rows) console.log(`   ${row.action === 'pass' ? 'MISS' : 'HIT '} | ${row.action} | ${row.dims.join(',')} | ${row.t}`);
  }
  console.log(`\n===== 良性误伤 ${benignCaught}/${BENIGN.length} =====`);
  for (const row of benignRows) console.log(`   ${row.action === 'pass' ? 'ok  ' : 'FP  '} | ${row.action} | ${row.dims.join(',')} | ${row.t}`);
}

run();
