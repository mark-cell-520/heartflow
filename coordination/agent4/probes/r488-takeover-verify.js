// r488-takeover-verify.js — 独立复验探针（样本全新构造，不抄 r486/r487 轮测）
// 背景：r486 claim（2026-11-27T03:37:00Z, expires 6h → 09:37Z 到期）已超期 7.5h 无 release，
//       工作区留未提交 WIP（src/bait-switch.js + 插件 + 三轮测 + r487 四探针）。本轮 r488 takeover。
// 目的（不信自报，先实测）：
//   ① 新族攻击命中（含我自建的全新样本：口语俗语族/隐喻族/被动族/长句倒装）
//   ② gate 层穿透口径：存量维度未拦而新维度补缺口的比例
//   ③ 良性零误伤（含边缘良性：正确多因陈述/正当商业披露/委托信任）
//   ④ 单腿不判
//   ⑤ 新腿承重（负例注入：摘除新族常量后该族不命中）
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'bait-switch.js'));
const check = mod.checkBaitSwitch;
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

console.log('=== r488 takeover 独立复验 ===\n');

// ① 攻击：r486/r487 轮测之外的全新样本（重点探口语俗语/隐喻/被动/长句形）
const attacks = [
  // 俗语/口语族
  '先把人养熟了再割，前期补贴都是钓饵。',
  '这就是先甜后苦：签约前什么都答应，签约后层层加码。',
  '低价接单，做完再补钱，客户已经没法换了。',
  '前期烧钱抢市场，等用户离不开了再收割。',
  '免费试用把人勾进来，试用期一过立马变脸。',
  // 被动/无主语族
  '条件在他入职之后被单方面修改，而他已经拒了别的 offer。',
  '报价在签约后被逐条加码，此时更换供应商的成本已经很高。',
  // 长句形
  '他们先用一份远低于市场价的报价赢得了这个项目，等我们的团队已经进场、设备和人员都到位之后，才开始以原材料上涨和工期紧张为由逐项追加费用，而这个时候项目已经进行到一半，我们根本不可能中途换人，只能接受这些原本没有谈过的额外条款。',
  // EN
  'They subsidized onboarding to pull users in, then raised prices once switching became painful.',
  'The signup bonus was the hook; the subscription fee tripled after the trial ended.',
  'A teaser rate won the account, and the real margin was added once the contract was non-cancellable.',
];
const aMiss = attacks.filter(t => check(t).hit !== true);
console.log('① 模块层攻击命中 ' + (attacks.length - aMiss.length) + '/' + attacks.length);
aMiss.forEach(t => console.log('   MISS: ' + t.slice(0, 60)));

// ② gate 穿透口径
const pen = [];
for (const t of attacks) {
  let g;
  try { g = gate(t); } catch (e) { console.log('   GATE-ERR ' + e.message); continue; }
  const action = g && g.gate && g.gate.action;
  if (action === 'pass') pen.push(t);
}
console.log('② gate.action=pass（存量未拦）: ' + pen.length + '/' + attacks.length);
pen.forEach(t => console.log('   PEN-GATE: ' + t.slice(0, 50)));

// ③ 良性（含边缘良性）
const benign = [
  '战争是多因共同造成的，把责任推给单一方并不符合史实。',   // 正确多因陈述（非本族）
  '平台对前三个月的新用户提供补贴，这一获客成本已写在公开财报里。', // 正当披露
  '订阅价格调整会提前三十天邮件通知，随时可以取消。',
  '试用期结束后按标准价续费，页面上有明确倒计时提示。',
  'Once users have invested in learning the tool, switching costs rise — a documented retention effect.',
  'The platform charges a flat monthly fee, and every feature is included.',
  '我们按最初的约定签了约，对方履约完全一致。',
  '促销价是限时的，活动结束后恢复原价，活动规则写得很清楚。',
  '低价竞标拿下项目后，我们通过优化流程保住了利润，没有加价。',
  'They offered a discount to win the deal and delivered everything as promised.',
];
const bFp = benign.filter(t => check(t).hit === true);
console.log('③ 良性 pass ' + (benign.length - bFp.length) + '/' + benign.length);
bFp.forEach(t => console.log('   FP: ' + t.slice(0, 60)));

// ④ 单腿不判
const oneLeg = [
  '我们给出了市场上最有竞争力的报价，全部费用明细已写明。',
  '落地阶段实际情况发生变化，我们按合同条款与对方重新协商了交付范围。',
  'I would rather not change the terms at all.',
  '补贴期结束后价格恢复到覆盖成本的水平，这是上市时就说好的。',
];
const legFp = oneLeg.filter(t => check(t).hit === true);
console.log('④ 单腿不判 ' + (oneLeg.length - legFp.length) + '/' + oneLeg.length);
legFp.forEach(t => console.log('   LEG-FP: ' + t.slice(0, 60)));

// ⑤ 新腿承重：摘除 r487 新族常量后，本族样本应不命中
const ints = mod.__internals();
console.log('\n⑤ 新腿承重（负例注入）:');
const newFamSamples = attacks.slice(0, 6); // 俗语/口语族
for (const key of ['BARE_BAIT_ZH', 'BARE_SWITCH_ZH']) {
  const inj = {};
  inj[key] = new RegExp('(?!x)x');
  const hits = newFamSamples.filter(t => check(t, inj).hit === true).length;
  console.log('   摘除 ' + key + ' 后俗语族命中: ' + hits + '/' + newFamSamples.length + (hits === 0 ? '  ✅承重' : '  ⚠️仍有其他腿代拦（需检查是否真由该族承重）'));
}
