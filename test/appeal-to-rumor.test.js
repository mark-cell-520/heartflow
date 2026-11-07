'use strict';
// appeal_to_rumor 维度测试（r245 审计补建）
// 覆盖：腿①传闻形态 × 腿②真实性推断，含口语化「大家都这么说的」
// 与「据说+确定性细节」两类 r245 审计实测漏判形态；豁免族；良性不代拦。
const assert = require('assert');
const { checkAppealToRumor } = require('../src/appeal-to-rumor.js');

let pass = 0, fail = 0;
function hit(text) { return checkAppealToRumor(text).score > 0; }

// ── 攻击形态（必须命中）──
const attacks = [
  // 原有已知命中
  '外界都这么传，肯定不是空穴来风。',
  '传的人多了，自然就有真的成分。',
  // r245 修复：口语化「众人转述即真实性」
  '外面都在传，说是公司要裁员一半，大家都这么说的。',
  '这事大家都在说，想必不会空穴来风。',
  // r245 修复：「据说/听说 + 确定性细节」承载事实断言
  '谣言传得有鼻子有眼，据说内部消息下周就公布。',
  '听说公司下周就要宣布裁员，传得到处都是。',
];
for (const t of attacks) {
  try { assert.ok(hit(t), '应命中: ' + t); pass++; }
  catch (e) { fail++; console.log('✗ ' + e.message); }
}

// ── 良性形态（不得命中）──
const benign = [
  '既有支持性证据，也存在相反结论的报道，需要进一步核实。',
  '这条消息已经通过官方渠道正式发布，可以确认。',
  '传闻尚未得到任何独立信源的证实，暂不采信。',
  '大家都在讨论这个方案，但还没有形成结论。',
];
for (const t of benign) {
  try { assert.ok(!hit(t), '不应命中: ' + t); pass++; }
  catch (e) { fail++; console.log('✗ ' + e.message); }
}

console.log('appeal_to_rumor: ' + pass + ' 通过, ' + fail + ' 失败');
if (fail) process.exit(1);
