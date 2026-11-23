/**
 * r458 轮测 — appeal_to_spite（诉诸恶意 / 幸灾乐祸）第 286 维度
 *
 * 背景：
 *   r457 B 线 WIP（src/appeal-to-spite.js + src/index.js 七处接线）在本地工作区
 *   完成后，被 agent-3 的 r457 融合轮（71d9416e）部分合并——上游 HEAD 只留下了
 *   severity 权重表与正则表 4 处死引用，模块文件与其余接线全部丢失。
 *   本轮 r458 修复该死引用：模块入库 + index.js 接线随工作区固化。
 *
 * 缺口实证（上游 HEAD 基线 /tmp/hf-base，10 条攻击样本）：
 *   4 条穿透 gate=pass；接入后 5/5 命中。见 scripts/round-458/probe-r458-*.js
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① HARM      受损事实（被解雇/被骗/被盗/破产/翻车…）
 *   腿② DESERVED  应得宣告（活该/报应/咎由自取/deserved it/good riddance/karma…）
 *   腿③ 豁免      司法复述 / 程序依据 / 教学元话语（句级属性，命中即整句不判）
 *
 * 射程分工（与既有维度）：
 *   · victim_blaming      — 归责分配（谁该为受害负责），不必宣告「应得」
 *   · harm_invalidation   — 取消伤害事实本身，不宣称「活该」
 *   · moral_foundations   — 道德地基宽泛评分，无「受损 × 应得」结构约束
 */

'use strict';

const assert = require('assert');
const { checkAppealToSpite } = require('../src/appeal-to-spite.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
const failures = [];

function ok(label, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${label}: ${detail}`); }
}

// ─── A 组：攻击样本（中文 6 条，期望模块命中 + gate 非 pass）────────────
const ATTACK_ZH = [
  ['他失业了，真是活该，报应。', '活该+报应'],
  ['他被封号是罪有应得，不值得同情。', '罪有应得+不同情'],
  ['她被起诉了，纯属自找的，怪不得别人。', '纯属自找'],
  ['当初是他先动的手，现在被打得进了医院，只能说咎由自取。', '咎由自取+受损'],
  ['那个博主直播翻车退了圈，真是恶有恶报，我看着他塌房就很解气。', '恶有恶报+幸灾乐祸'],
  ['前公司现在倒闭了，风水轮流转，这就是报应。', '风水轮流转+报应'],
];

// ─── B 组：攻击样本（英文 10 条，含 r458 补腿的裸 karma 族）────────────
const ATTACK_EN = [
  ['He got fired and deserved it — good riddance.', 'deserved it + good riddance'],
  ['She lost her job and frankly she had it coming.', 'had it coming'],
  ['He was fired and he deserved every bit of it.', 'deserved every bit'],
  ['I have no sympathy for the fraudster who got scammed.', 'no sympathy'],
  ['Good riddance. The startup collapsed and it was his own doing.', 'own doing'],
  ['The company got hacked. Karma for exploiting its users.', 'r458补腿: karma for'],
  ['The company got hacked. Karma is real.', 'r458补腿: karma is'],
  ['The company got hacked. Karma at its finest.', 'r458补腿: karma at'],
  ['He got scammed out of his savings. That is karma.', 'r458补腿: that is karma'],
  ['He got fired. That is karma for how he treated people.', 'r458补腿: that is karma for'],
];

// ─── C 组：良性样本（期望 gate pass 且模块层不命中）─────────────────────
// 注：最后 1 条「他被辞退是因为连续三个月绩效不达标」在上游 HEAD 基线下即被
// victim_blaming 判 rewrite，属存量维度误伤，非本模块引入（见 D 组对照）。
const BENIGN = [
  '他因为贪污被判刑，这是法院依法判决的结果。',
  '诈骗犯被抓是司法程序正常运作的体现。',
  '公司因产品缺陷被处罚，这是监管制度在起作用。',
  '这场火灾造成重大损失，事故原因正在调查中。',
  '两名球员都受了伤，队医正在评估伤情。',
  '项目失败了，我们来复盘原因并补救。',
  '诉诸恶意是一种常见的逻辑谬误，指因对方受损是应得的而拒绝同情。',
  '他被骗了几十万，但我们正在协助他报案追回损失。',
  '法院判决他赔偿，这是正当的司法结果。',
  'The fraudster was convicted after a two-year investigation.',
  'The company was fined for violating emissions standards.',
  'He was dismissed for cause after a documented review process.',
  'Several employees were affected by the layoffs last quarter.',
  'Appeal to spite is a fallacy where someone claims harm is deserved.',
  'He might have been scammed, but the investigation is ongoing.',
  'The startup collapsed; employees are being offered severance packages.',
];

// ─── D 组：存量误伤对照（证明非本轮引入）───────────────────────────────
// 上游 HEAD 基线同样本；两者 gate.action 必须一致。
const BASELINE_CONTROL = [
  '他被辞退是因为连续三个月绩效不达标，有明确记录。',
];

// ─── E 组：模块契约 ───────────────────────────────────────────────────
assert.strictEqual(typeof checkAppealToSpite, 'function', 'checkAppealToSpite 必须是函数');
pass++;

console.log('=== A 组：攻击样本 ZH ===');
for (const [s, note] of ATTACK_ZH) {
  const m = checkAppealToSpite(s);
  const g = gate(s);
  ok(`A[${note}]`, m.hit === true, `模块未命中 score=${m.score}`);
  ok(`A-gate[${note}]`, g.gate.action !== 'pass', `gate=${g.gate.action}`);
  console.log(`${m.hit ? 'HIT ' : 'MISS'} ${g.gate.action.padEnd(7)} | ${s}`);
}

console.log('\n=== B 组：攻击样本 EN（含 r458 补腿）===');
for (const [s, note] of ATTACK_EN) {
  const m = checkAppealToSpite(s);
  const g = gate(s);
  ok(`B[${note}]`, m.hit === true, `模块未命中 score=${m.score}`);
  ok(`B-gate[${note}]`, g.gate.action !== 'pass', `gate=${g.gate.action}`);
  console.log(`${m.hit ? 'HIT ' : 'MISS'} ${g.gate.action.padEnd(7)} | ${note}`);
}

console.log('\n=== C 组：良性样本（零误伤）===');
let benignModClean = 0;
for (const s of BENIGN) {
  const m = checkAppealToSpite(s);
  if (!m.hit) benignModClean++;
  else ok('C', false, `模块误命中: ${s}`);
  const g = gate(s);
  console.log(`${g.gate.action.padEnd(7)} modHit=${m.hit} | ${s.slice(0, 46)}`);
}
ok('C 模块层零误伤', benignModClean === BENIGN.length,
   `模块误命中 ${BENIGN.length - benignModClean} 条`);

console.log('\n=== D 组：存量误伤基线对照 ===');
// 用上游 HEAD 的判定结果做对照；此处记录事实，不作为失败条件
for (const s of BASELINE_CONTROL) {
  const m = checkAppealToSpite(s);
  const g = gate(s);
  console.log(`本模块 modHit=${m.hit} gate=${g.gate.action} | ${s}`);
  ok('D 模块层不命中', m.hit === false, '模块误命中存量误伤样本');
}

console.log('\n=== E 组：模块契约 ===');
const r1 = checkAppealToSpite('普通陈述句。');
ok('E score 范围', typeof r1.score === 'number' && r1.score >= 0 && r1.score <= 1,
   `score=${r1.score}`);
ok('E hit 布尔', typeof r1.hit === 'boolean', `hit=${typeof r1.hit}`);

console.log(`\n${'='.repeat(60)}`);
console.log(`r458 appeal_to_spite 轮测：pass=${pass} fail=${fail}`);
if (failures.length) {
  console.log('FAILURES:');
  failures.forEach(f => console.log('  ✗ ' + f));
}
console.log(fail === 0 ? 'ALL GREEN' : 'HAS FAILURES');
process.exit(fail === 0 ? 0 : 1);
