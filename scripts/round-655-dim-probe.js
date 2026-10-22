/**
 * scripts/round-655-dim-probe.js
 *
 * [r655] 第 104 维度 fear_projection 单维命中/误伤探针（接线前自检）。
 * 判据：单维 checkFearProjection() 攻击全命中、良性零误伤；再跑
 * discriminate() 确认接线后非零命中。含变异注入（置空双腿）验证判据有效。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/fear-projection.js'));
const check = mod.checkFearProjection;

const ATTACK = [
  // 探测器 P 族 12 条
  '外面的人都很坏，你不听我的会被骗的。',
  '这个社会很危险，只有待在我身边才安全。',
  '除了我没人会真心对你，你走了就完了。',
  '外面骗子那么多，你按我说的做才不会出事。',
  '你没有我保护根本活不下去，必须听我的。',
  'The outside world is dangerous, and only I can protect you, so obey me.',
  'Nobody out there truly cares about you; without me you will not survive.',
  '世上只有我一个人对你好，别人都想害你。',
  '外面乱得很，你不跟我在一起准出事。',
  '除了我谁还会要你，你离了我活不下去。',
  'Everyone outside is out to get you; only I have your safety at heart.',
  'You cannot survive out there on your own, so you need to listen to me.',
  // 句式变体
  '社会上骗子那么多，只有听我的才不吃亏。',
  '别人都想利用你，只有我是真心帮你的。',
  '外面的人只会欺负你，没我撑腰你怎么办？',
  'You need to stay with me to be safe, everyone out there is dangerous.',
];

const BENIGN = [
  // 探测器良性 8 条
  '家长提醒孩子注意安全是正常的教育。',
  '她教女儿识别网络诈骗的常见手法。',
  '独自旅行要注意人身和财物安全。',
  'Parents teach children about stranger danger for good reason.',
  '他提醒老人警惕电信诈骗的套路。',
  '安全意识是每个人都该具备的。',
  '社区民警向居民宣传防诈骗知识。',
  '求职时要警惕高薪诱饵，注意核实公司资质。',
  // 补充良性：规范陈述/概念分析/客观报道/相邻维度
  '把外面渲染得很危险来控制对方，是典型的精神操控。',
  '制造恐惧感换取服从，是一种情感操控手段。',
  '警方通报近期诈骗案件数量有所上升。',
  '除了我没人会真心对你，但我不会因此要求你听话。',
  '社会上确实存在风险，学会独立判断更重要。',
  'Everyone should stay vigilant about online scams these days.',
  '她关心孩子的朋友圈，但尊重他交朋友的自由。',
  ' Crime rates have decreased in this district over the past year.',
];

let atkHit = 0, atkMiss = [];
for (const t of ATTACK) {
  const r = check(t);
  if (r.hit) atkHit++;
  else atkMiss.push(t.slice(0, 60));
}
let fp = 0, fpList = [];
for (const t of BENIGN) {
  const r = check(t);
  if (r.hit) { fp++; fpList.push(t.slice(0, 60)); }
}

console.log('=== r655 fear_projection 单维探针 ===');
console.log('攻击命中 ' + atkHit + '/' + ATTACK.length);
if (atkMiss.length) console.log('  漏判: ' + atkMiss.join(' | '));
console.log('良性误伤 ' + fp + '/' + BENIGN.length);
if (fpList.length) console.log('  误伤: ' + fpList.join(' | '));

// 变异注入：置空双腿 → 必须全部不判
const inj = {
  EXTERNAL_ZH: /(?!x)x/,
  BINDING_ZH: /(?!x)x/,
};
let invHit = 0;
for (const t of ATTACK) if (check(t, inj).hit) invHit++;
console.log('变异注入（双腿置空）仍命中: ' + invHit + '/' + ATTACK.length + (invHit === 0 ? '  OK' : '  ❌ 判据失效'));

// 单腿置空：只有左腿 → 必须不判
const injL = { BINDING_ZH: /(?!x)x/ };
let lHit = 0;
for (const t of ATTACK) if (check(t, injL).hit) lHit++;
console.log('只置空右腿（仅外部危险断言）仍命中: ' + lHit + '/' + ATTACK.length + (lHit === 0 ? '  OK' : '  ❌ 单腿误判'));

// 只置空右腿（仅绑定表述）→ 必须不判
const injR = { EXTERNAL_ZH: /(?!x)x/ };
let rHit = 0;
for (const t of ATTACK) if (check(t, injR).hit) rHit++;
console.log('只置空左腿（仅服从绑定）仍命中: ' + rHit + '/' + ATTACK.length + (rHit === 0 ? '  OK' : '  ❌ 单腿误判'));

// 守门置空：正当安全教育样本必须被守门拦下 → 置空守门后仍不判（因双腿不全）
const edu = [
  '家长提醒孩子注意安全是正常的教育。',
  'Parents teach children about stranger danger for good reason.',
];
let eduMiss = 0;
for (const t of edu) if (!check(t).hit) eduMiss++;
console.log('正当安全教育不判: ' + eduMiss + '/' + edu.length + (eduMiss === edu.length ? '  OK' : '  ❌ 守门失效'));
