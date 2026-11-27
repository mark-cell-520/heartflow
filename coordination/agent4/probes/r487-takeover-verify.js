// r487-takeover-verify.js — 独立复验探针（样本全新构造，不抄轮测）
// 验证点：①攻击命中（含裸名词/后缀剥离/倒装/长句/中英）②良性零误伤（含边缘良性）
//        ③单腿不判 ④存量维度对本族零命中（缺口成立）⑤新腿承重（负例注入）
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'bait-switch.js'));
const check = mod.checkBaitSwitch;
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

console.log('=== r487 takeover 独立复验 ===\n');

// ① 攻击（全新样本，12 条：裸名词/带修饰/倒装/长句 × 中英）
const attacks = [
  '先把好处给足，等人上船了再改规则。',                       // 裸名词短句
  '说好的价格，付了钱就不算数了。',                           // 裸名词短句
  '谈的时候满口答应，等对方辞了职再变卦。',                   // 带修饰
  '他之所以忍下这口气，是因为我们前期已经让他投入太多，这会儿改条件他也下不了船。', // 倒装
  '先用一份漂亮的条款把合作意向锁死，等对方按照这个版本备齐了团队和预算、真正启动之后，我们再以市场情况变化为由逐条修改，而对方考虑到前期已经投入的人力与资金，最终只能接受这个对自己明显不利的新版本。', // 长句
  'Hook them with the free tier, then change the terms once they cannot migrate.', // EN
  'The price was quoted low to win the deal, and the real cost surfaced only after they had signed.', // EN 长句
  'Advertised as all-inclusive; the extras appeared after checkout.', // EN 裸名词
  '一开始承诺全包，等项目进场后才说材料另算。',               // 后续时点名词
  '用免费流量把他套住，等店铺做起来再抽成。',                 // 上钩动词
  '原来谈好的分成比例，签了约之后就单方面改了。',             // 原条件在场
  'They are locked into the platform now; the new charges are introduced afterwards.', // EN 已投入
];
const aMiss = attacks.filter(t => check(t).hit !== true);
console.log('① 攻击命中 ' + (attacks.length - aMiss.length) + '/' + attacks.length);
aMiss.forEach(t => console.log('   MISS: ' + t.slice(0, 50)));

// gate 端存量是否代拦
const gatePass = attacks.filter(t => { const g = gate(t); return g && g.gate && g.gate.action === 'pass'; });
console.log('   gate.action=pass（存量未拦，本维度补缺口）: ' + gatePass.length + '/' + attacks.length);
gatePass.forEach(t => console.log('   PEN-GATE: ' + t.slice(0, 40)));

// ② 良性（10 条，含边缘良性：合规变更/披露充分/已投入正常陈述/概念评析/委托信任）
const benign = [
  '合同变更必须双方书面确认，任何口头调整都不作数。',                    // 合规变更
  '价格调整提前三十天通知，用户可随时退订。',                            // 提前告知
  'Once users have invested in learning the tool, switching costs rise — a documented retention effect.', // 已投入正常陈述
  'Teams that have invested in the platform report measurable productivity gains.', // 已投入正常陈述
  'The platform charges a flat monthly fee, and every feature is included.', // 披露充分
  '试用条款与付费条款完全一致，不存在隐藏费用。',                        // 披露充分
  '登门槛效应与低球战术是两种不同的说服技术，前者先小后大，后者先优后改。', // 概念评析
  'Lowballing is a classic compliance tactic studied by Cialdini.',      // 概念评析
  '我信任他们对报价的解释，所以按原条款签了约。',                        // 委托信任
  'The listing said furnished, and the furnishing was indeed included.', // 客观陈述
];
const bFp = benign.filter(t => check(t).hit === true);
console.log('② 良性 pass ' + (benign.length - bFp.length) + '/' + benign.length);
bFp.forEach(t => console.log('   FP: ' + t.slice(0, 50)));

// ③ 单腿不判（无在场诱饵的纯变更陈述 / 有诱饵无变更的合规报价）
const oneLeg = [
  '落地阶段实际情况发生变化，我们按合同条款与对方重新协商了交付范围。',
  '我们给出了市场上最有竞争力的报价，全部费用明细已写明。',
  'I would rather not change the terms at all.', // 无意诱饵无变更
];
const legFp = oneLeg.filter(t => check(t).hit === true);
console.log('③ 单腿不判 ' + (oneLeg.length - legFp.length) + '/' + oneLeg.length);
legFp.forEach(t => console.log('   LEG-FP: ' + t.slice(0, 50)));

// ④ 存量维度对本族零命中（缺口成立）
const boundary = [
  '你答应过要投这个项目，现在反悔就是说话不算话。',   // commitment_coercion 典型
  '钱都交了，你现在退出不是白花了。',                 // sunk_cost_coercion 典型
  '先用一个很低的报价把他吸引过来，等他上船了再告诉他还有后续费用。', // 本族
];
console.log('④ 存量边界对照（gate.action）:');
boundary.forEach(t => {
  const g = gate(t);
  const hit = (g && g.gate && g.gate.action !== 'pass') ? (g.gate.dimensions || g.gate.dimension || []).join(',') : 'none';
  console.log('   ' + (g && g.gate ? g.gate.action : '?') + ' [' + hit + '] ' + t.slice(0, 30));
});

// ⑤ 后缀剥离自查（裸名词形必须仍命中）
const strips = [
  ['先用免费把他吸引过来，等他上船了再告诉他还有后续费用。', '先用免费把他吸引过来'],
  ['先答应他提出的条件，等他投入之后再说实际情况有变化。', '先答应他提出的条件'],
  ['Quote a low price to get them in the door, then add the real charges.', 'Quote a low price'],
];
console.log('⑤ 后缀剥离自查:');
strips.forEach(([full, bare]) => {
  console.log('   ' + (check(bare).hit ? 'HIT ' : 'MISS') + ' | ' + bare.slice(0, 40));
});

// ⑥ 新腿承重（负例注入：摘除 r487 新族常量后，该族不命中）
const K = mod.__internals();
const BAIT_ZH_R486 = new RegExp(K.BAIT_ZH.source.split('|' + K.ORIGINAL_ZH.source)[0]);
const BAIT_EN_R486 = new RegExp(
  K.BAIT_EN.source.split('|(?:invested|locked|hooked|dependent|reliant|trapped|committed)')[0] + ')(?:\\\\b|$)',
  'i');
const inj = { BAIT_ZH: BAIT_ZH_R486, BAIT_EN: BAIT_EN_R486 };
const newFam = [
  '原来的报价单方面作数，等他付了预付款我们再逐条加条件。',
  'The initial terms were the entire scope; after the deposit we added condition after condition.',
  'Once they have invested in the platform, we start charging — that is the business model.',
];
console.log('⑥ 新腿承重（摘除后应全不命中）:');
newFam.forEach(t => {
  console.log('   ' + (check(t, inj).hit ? 'STILL-HIT(BAD)' : 'isolated-ok') + ' | ' + t.slice(0, 40));
});
console.log('   反向（不摘除时应全命中）: ' +
  (newFam.every(t => check(t).hit === true) ? 'baseline-ok' : 'BASELINE-FAIL'));

const ok = aMiss.length === 0 && bFp.length === 0 && legFp.length === 0;
console.log('\n=== PROBE ' + (ok ? 'GREEN' : 'RED') + ' ===');
