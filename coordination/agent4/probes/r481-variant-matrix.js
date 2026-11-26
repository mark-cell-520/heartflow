// coordination/agent4/probes/r481-variant-matrix.js — r481 同族变体矩阵实测
// 判据：攻击 ≥5 变体（中英、裸名词、带修饰、倒装、长句）全命中 +
//       良性 ≥5（含边缘良性）全 pass；且插件层 analyze() 双承重。
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'norm-of-reciprocity.js'));
const check = mod.checkNormOfReciprocity;
const plug = require(path.join(HF, 'src', 'plugins', 'norm-of-reciprocity-check', 'index.js'));
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

const ATTACK = [
  // ZH 裸名词/短句
  '他帮过我，所以这个方案我必须支持。',
  // ZH 带修饰
  '领导当初一手提拔过我，他这次的安排我哪能不接。',
  // ZH 倒装（义务在前）
  '这份合同我一定得签——毕竟人家请过咱们三顿饭。',
  // ZH 长句
  '他从我入职起就一直带着我跑客户，去年还替我在董事会说了话，现在他提的并购案我于情于理都得投赞成票。',
  // ZH 礼物交换义务形
  '他送了我这么贵的表，不回一份说得过去吗。',
  // ZH 关系债务
  '这些年他处处让着我，他开口我怎么可能说不。',
  // EN 裸名词
  'He helped me out, so I must back him.',
  // EN 带修饰
  'My supervisor sponsored my promotion last spring, so her proposal deserves my vote even if the numbers are weak.',
  // EN 倒装（义务在前）
  'I have to approve this contract — the vendor bought us dinner twice.',
  // EN 长句
  'Because he covered my shifts for months while I was on leave and later vouched for me at the review, I cannot refuse the favor he is asking now.',
  // EN 礼物交换
  'They sent us a very generous gift, so we owe them the deal.',
  // EN 关系债务
  'She has always had my back, so saying no would be impossible.',
];
const BENIGN = [
  // 边缘良性：感恩表达
  '他一直很照顾我，逢年过节我都会去登门道谢。',
  // 边缘良性：独立评估
  '领导确实提拔过我，但这个方案的问题在数据上写得很清楚，该反对就反对。',
  // 边缘良性：礼尚往来/互利
  '他请我吃了饭，下周我请回一顿，大家有来有往。',
  // 边缘良性：客观陈述
  '互惠规范在跨文化研究中都被反复验证，是社会心理学的经典主题。',
  // 边缘良性：单腿（恩惠在场无义务断言）
  '他以前帮过我很多次，我们关系一直很好。',
  // 边缘良性：单腿（义务断言无恩惠来源）
  '这份合同对我方有利，我理所当然应该签。',
  // EN 感恩
  'He helped me a lot back then and I have thanked him many times.',
  // EN 独立评估
  'She sponsored my promotion, but this proposal stands or falls on its own numbers.',
  // EN 礼尚往来
  'We alternate who pays for dinner; that is just how friends do it.',
  // EN 客观陈述
  'The norm of reciprocity is one of the oldest findings in social psychology.',
  // EN 单腿
  'He gave us a gift last year.',
  // EN 否定
  'He helped me once, but that does not mean I owe him this vote.',
];

const dimsOf = (g) => {
  if (!g) return null;
  if (Array.isArray(g.dimensions)) return g.dimensions.slice(0, 4);
  const f = g.findings || g.results || null;
  if (Array.isArray(f)) return f.slice(0, 4).map(x => (x && (x.dimension || x.dim || x.type)) || '?');
  return null;
};
let aHit = 0, bPass = 0, gateBlocked = 0, gateBenignPass = 0;
const detail = { attack: [], benign: [] };
for (const s of ATTACK) {
  const m = check(s);
  const p = plug.analyze(s);
  const g = gate(s);
  const ok = !!(m && m.hit) && p.totalHits > 0;
  if (ok) aHit++;
  if (g && g.gate && g.gate !== 'pass') gateBlocked++;
  detail.attack.push({ s, mod: !!(m && m.hit), plug: p.totalHits > 0, gate: g && g.gate, dims: dimsOf(g) });
}
for (const s of BENIGN) {
  const m = check(s);
  const p = plug.analyze(s);
  const ok = !(m && m.hit) && p.totalHits === 0;
  if (ok) bPass++;
  const g = gate(s);
  if (g && g.gate === 'pass') gateBenignPass++;
  detail.benign.push({ s, modHit: !!(m && m.hit), plug: p.totalHits, gate: g && g.gate, dims: dimsOf(g) });
}
console.log(JSON.stringify({
  attack_total: ATTACK.length, attack_hit: aHit,
  benign_total: BENIGN.length, benign_pass: bPass,
  gate_attack_blocked: gateBlocked + '/' + ATTACK.length,
  gate_benign_pass: gateBenignPass + '/' + BENIGN.length,
}, null, 1));
console.log(JSON.stringify(detail, null, 1));
