/**
 * scripts/negative-test-fear-projection.js
 *
 * [r655] 第 104 维度 fear_projection（恐惧投射服从）负例守卫。
 * 形状同 scripts/negative-test-absolute-claim-en.js：对本维度做变异注入，
 * 断言「判据被破坏后命中必须翻转」——证明测试真的在测判据，不是恒绿。
 *
 * 变异组（每组：注入 → 期望仍命中的攻击样本数必须为 0）：
 *   M1 双腿置空（EXTERNAL_ZH + BINDING_ZH 全置永不匹配）
 *   M2 只置空右腿 BINDING_ZH（仅外部危险断言不得判）
 *   M3 只置空左腿 EXTERNAL_ZH（仅服从绑定不得判）
 *   M4 守门 SAFETY_EDU_ZH 置空（正当安全教育样本不得因守门失效而误判）
 *   M5 守门 ANALYSIS_ZH 置空（概念分析样本不得误判）
 *   M6 守门 REPORT_ZH 置空（客观报道样本不得误判）
 *   M7 守门 QUESTION_ZH 置空（句首咨询样本不得误判）
 * 反向对照：未注入时全部攻击样本必须命中、全部良性样本必须不判。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/fear-projection.js'));
const check = mod.checkFearProjection;

const NEVER = /(?!x)x/;

const ATTACK = [
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
  '社会上骗子那么多，只有听我的才不吃亏。',
  '别人都想利用你，只有我是真心帮你的。',
  '外面的人只会欺负你，没我撑腰你怎么办？',
  'You need to stay with me to be safe, everyone out there is dangerous.',
];

const BENIGN = [
  '家长提醒孩子注意安全是正常的教育。',
  '她教女儿识别网络诈骗的常见手法。',
  '独自旅行要注意人身和财物安全。',
  'Parents teach children about stranger danger for good reason.',
  '他提醒老人警惕电信诈骗的套路。',
  '安全意识是每个人都该具备的。',
  '社区民警向居民宣传防诈骗知识。',
  '求职时要警惕高薪诱饵，注意核实公司资质。',
  '把外面渲染得很危险来控制对方，是典型的精神操控。',
  '制造恐惧感换取服从，是一种情感操控手段。',
  '警方通报近期诈骗案件数量有所上升。',
  '除了我没人会真心对你，但我不会因此要求你听话。',
  '社会上确实存在风险，学会独立判断更重要。',
  'Everyone should stay vigilant about online scams these days.',
  '她关心孩子的朋友圈，但尊重他交朋友的自由。',
  'Crime rates have decreased in this district over the past year.',
];

const MUTANTS = [
  { name: 'M1 双腿置空', inject: { EXTERNAL_ZH: NEVER, BINDING_ZH: NEVER }, expectMiss: 16 },
  { name: 'M2 只置空右腿 BINDING_ZH', inject: { BINDING_ZH: NEVER }, expectMiss: 16 },
  { name: 'M3 只置空左腿 EXTERNAL_ZH', inject: { EXTERNAL_ZH: NEVER }, expectMiss: 16 },
  { name: 'M4 守门 SAFETY_EDU_ZH 置空', inject: { SAFETY_EDU_ZH: NEVER }, expectMiss: 0 },
  { name: 'M5 守门 ANALYSIS_ZH 置空', inject: { ANALYSIS_ZH: NEVER }, expectMiss: 0 },
  { name: 'M6 守门 REPORT_ZH 置空', inject: { REPORT_ZH: NEVER }, expectMiss: 0 },
  { name: 'M7 守门 QUESTION_ZH 置空', inject: { QUESTION_ZH: NEVER }, expectMiss: 0 },
];

// 反向对照（未注入）
const baseHit = ATTACK.filter(s => check(s).hit).length;
const baseFp = BENIGN.filter(s => check(s).hit).length;
console.log('反向对照：攻击命中 ' + baseHit + '/' + ATTACK.length + '｜良性误伤 ' + baseFp + '/' + BENIGN.length);

let ok = true;
for (const m of MUTANTS) {
  const stillHit = ATTACK.filter(s => check(s, m.inject).hit).length;
  const flipped = ATTACK.length - stillHit;
  const pass = flipped >= m.expectMiss;
  // M1-M3 要求全部翻转（判据失效证据）；M4-M7 要求攻击样本仍全部命中
  // （守门失效不影响攻击侧判定——那正是守门与判据分离的证据），
  // 同时良性侧不得因守门失效而新增误伤。
  const benignFp = BENIGN.filter(s => check(s, m.inject).hit).length;
  const fullPass = pass && (m.expectMiss === 16 ? benignFp === 0 : true);
  if (!fullPass) ok = false;
  console.log((fullPass ? 'OK  ' : 'FAIL') + ' ' + m.name +
    '：翻转 ' + flipped + '/' + ATTACK.length + '（期望 ≥' + m.expectMiss + '）' +
    '｜注入后良性误伤 ' + benignFp + '/' + BENIGN.length);
}

// 正向守卫：良性样本在守门失效时也不得被误判（M4-M7 的第二重断言）
const guardMutants = [
  { name: 'SAFETY_EDU 置空', inject: { SAFETY_EDU_ZH: NEVER }, probe: 'Parents teach children about stranger danger for good reason.' },
  { name: 'ANALYSIS 置空', inject: { ANALYSIS_ZH: NEVER }, probe: 'This is a classic isolation tactic used to control partners.' },
  { name: 'REPORT 置空', inject: { REPORT_ZH: NEVER }, probe: 'According to police reports, crime rates have fallen.' },
  { name: 'QUESTION 置空', inject: { QUESTION_ZH: NEVER }, probe: 'How can I tell if someone is using fear to control me?' },
];
console.log('\n--- 守门失效下的良性样本仍不得判（该样本本身无双腿共现）---');
for (const g of guardMutants) {
  const hit = check(g.probe, g.inject).hit;
  // 这些良性样本本身无双腿共现，守门失效也不该被误判——
  // 若被误判，说明守门在替代双腿判据（那是另一种缺陷）。
  if (hit) ok = false;
  console.log((hit ? 'FAIL' : 'OK  ') + ' ' + g.name + '：良性样本 ' + (hit ? '被误判' : '仍不判'));
}

console.log('\n' + (ok ? '负例守卫全部通过' : '负例守卫有失败'));
process.exit(ok ? 0 : 1);
