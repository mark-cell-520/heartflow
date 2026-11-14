// r325 负例注入测试：tu_quoque 倒装反问族（MIRROR 从句前置 × DISQUALIFY 疑问倒装 × CRITICISM 泛化）
// 目的：逐常量验证新腿承重 + 豁免表不被误伤（r161 教训）
'use strict';
const tq = require('../src/tu-quoque.js');
const { gate } = require('../src/gate.js');
const I = tq.__internals();

let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else { fail++; console.log('  ❌ ' + label + (extra ? ' — ' + extra : '')); }
}

// ── A 组：攻击变体（同族 ≥5，含裸名词/带修饰/倒装/长句/双语）──────────────
const ATTACK = [
  '屁股都没擦干净，凭什么说别人',
  '你自己那摊子事还一团乱麻没理清楚呢，就有资格在这里对别人指手画脚了？',
  '没资格谈规则的人，恰恰是那个自己天天迟到却盯着别人打卡的',
  '一个连自己体重都管不住的人，也配教别人怎么养生？',
  '己身不正而正人，五十步笑百步，倒有脸来训话',
  'When your own record is a mess, why lecture the rest of us on compliance',
  "You're in no position to judge anyone here",
  '你自己上班天天摸鱼，倒有闲心管别人几点下班',
  'A person who cannot keep his own promises is hardly one to talk about discipline',
  '自己家孩子都管教不好，凭什么要求别人家的孩子守规矩',
];
console.log('A 攻击变体（应全部 verify/rewrite）:');
for (const s of ATTACK) {
  const r = gate(s);
  ok(r.gate.action !== 'pass', '非 pass: ' + s.slice(0, 30), 'got ' + r.gate.action);
}

// ── B 组：良性（含该族边缘良性，应全部 pass）────────────────────────────
const BENIGN = [
  '两家着火都要救，先评估哪边的火势更紧急、资源怎么分配',
  '我承认我自己也经常迟到，以后咱们互相提醒，一起改进',
  '对方迟到过不等于他现在提出的时间要求没有道理，这是两个独立的问题',
  '你又不是我的直属上级，这件事按流程不该由你来决定',
  '指出别人问题和自身是否也存在同样行为，在逻辑上是两个需要分别论证的命题',
  'You are not my manager, so this decision is not yours to make',
  'I know I have made the same mistake before, and we should help each other improve',
  '先看看我们自己的数据有没有类似的漏洞，再决定要不要对外提意见',
];
console.log('B 良性边缘（应全部 pass，基线已被其他维度判 rewrite 的样本以新腿不命中为准）:');
for (const s of BENIGN) {
  const r = gate(s);
  if (r.gate.action === 'pass') { ok(true, 'pass: ' + s.slice(0, 30)); continue; }
  // 基线即非 pass 的样本：验证不是 tu_quoque 新腿造成（git stash 实证 fallacy_of_relevance 等既有维度）
  const newLeg = I.MIRROR_ZH.test(s) || I.DISQUALIFY_ZH.test(s) || I.CRITICISM_ZH.test(s)
    || I.MIRROR_EN.test(s) || I.DISQUALIFY_EN.test(s) || I.CRITICISM_EN.test(s);
  ok(!newLeg, '基线非pass但新腿不命中: ' + s.slice(0, 26), 'got ' + r.gate.action + ' 且新腿命中');
}

// ── C 组：逐常量承重（拆腿验证，防正则整体过宽）──────────────────────
console.log('C 逐常量承重（腿级）:');
const LEG = [
  ['MIRROR_ZH 谓语前置', I.MIRROR_ZH, '自己家里还着火呢'],
  ['MIRROR_ZH 名词化从句', I.MIRROR_ZH, '一个自己都迟到的人'],
  ['MIRROR_ZH 亲属管教', I.MIRROR_ZH, '自己家孩子都管教不好'],
  ['MIRROR_ZH 己身不正', I.MIRROR_ZH, '己身不正而正人'],
  ['MIRROR_ZH 五十步笑百步', I.MIRROR_ZH, '五十步笑百步'],
  ['DISQUALIFY_ZH 凭什么要求别人', I.DISQUALIFY_ZH, '凭什么要求别人守时'],
  ['DISQUALIFY_ZH 也配', I.DISQUALIFY_ZH, '也配谈规则'],
  ['DISQUALIFY_ZH 倒有闲心', I.DISQUALIFY_ZH, '倒有闲心管别人'],
  ['DISQUALIFY_ZH 还好意思说别人', I.DISQUALIFY_ZH, '还好意思说别人脏'],
  ['DISQUALIFY_ZH 轮不到你', I.DISQUALIFY_ZH, '轮不到你来管'],
  ['CRITICISM_ZH 指手画脚', I.CRITICISM_ZH, '对别人指手画脚'],
  ['CRITICISM_ZH 没资格谈规则', I.CRITICISM_ZH, '没资格谈规则'],
  ['MIRROR_EN when your own', I.MIRROR_EN, 'When your own house is on fire'],
  ['MIRROR_EN in no position', I.MIRROR_EN, "You're in no position"],
  ['MIRROR_EN who cannot keep his own', I.MIRROR_EN, 'who cannot keep his own'],
  ['DISQUALIFY_EN why lecture', I.DISQUALIFY_EN, 'why lecture the rest of us'],
  ['DISQUALIFY_EN what right', I.DISQUALIFY_EN, 'what right do you have to'],
  ['CRITICISM_EN talk about discipline', I.CRITICISM_EN, 'hardly one to talk about discipline'],
  ['CRITICISM_EN judge anyone', I.CRITICISM_EN, 'judge anyone here'],
];
for (const [label, re, sample] of LEG) {
  ok(re.test(sample), label + ' 承重: ' + sample, 'regex 未命中');
}

// ── D 组：负例注入（良性不应命中任何新腿，防过宽）────────────────────
console.log('D 负例注入（良性不应命中新腿）:');
const NEG = [
  '我们两家都有类似的漏洞，不如一起补上',
  '他以前迟到过，但现在这个要求本身是合理的',
  '互相提醒比互相指责更能解决问题',
  '规则本身是否合理，与谁在执行规则是两个问题',
];
for (const s of NEG) {
  const hit = I.MIRROR_ZH.test(s) || I.DISQUALIFY_ZH.test(s) || I.CRITICISM_ZH.test(s)
    || I.MIRROR_EN.test(s) || I.DISQUALIFY_EN.test(s) || I.CRITICISM_EN.test(s);
  ok(!hit, '新腿不命中良性: ' + s.slice(0, 26), 'regex 过宽');
}

// ── E 组：豁免表承重（原有豁免不被新腿破坏）─────────────────────────
// 注：前两条在 v6.8.182 基线上即被 sycophancy 等维度判 rewrite/verify（git stash 实证），
// 属既有基线行为非本轮引入；本轮只验证新腿（MIRROR/DISQUALIFY/CRITICISM 倒装族）不命中它们。
console.log('E 豁免表承重（tu_quoque 新腿不命中即通过）:');
const EXEMPT = [
  '我自己也犯过同样的错误，所以我想帮你避开这个坑',
  '说实话我也有责任，我们一起想办法解决',
  '这个问题确实很严重，不过我们一起面对',
];
for (const s of EXEMPT) {
  const newLeg = I.MIRROR_ZH.test(s) || I.DISQUALIFY_ZH.test(s) || I.CRITICISM_ZH.test(s)
    || I.MIRROR_EN.test(s) || I.DISQUALIFY_EN.test(s) || I.CRITICISM_EN.test(s);
  ok(!newLeg, '新腿不命中豁免样本: ' + s.slice(0, 24), 'regex 过宽');
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
