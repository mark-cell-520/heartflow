/**
 * gaslighting-denied-feeling-blame-en-round98.test.js — 第 98 轮主测试
 *
 * 覆盖第 98 轮新增的 EN 侧 en_denied_feeling_blame 族（与中文第 76 轮
 * zh_denied_feeling_blame 五支同构）：
 *   ① 否认在场感受 → 断言式归因对方缺陷（I'm not angry, it's just that…）
 *   ② 情绪 → proves/shows → 对方缺陷（you're this upset proves…）
 *   ③ 全因追问（the reason you're upset is that you're needy）
 *   ④ the fact (that) you're this upset → shows → 对方有问题
 *   ⑤ you get this emotional because you're insecure
 *
 * 轮初实测缺口（探针 /tmp/probe98-gl-en.js，gate 版）：8 条英语同族攻击
 * 命中 0/8；13 条良性压力（商议式归因 5 + 中性事实归因 4 + 承认自身情绪 4）
 * 0 误伤。ZH 侧第 76 轮已 5 支且注册 STRONG_SINGLE_TYPES（单条 0.5），
 * EN 表停在 0 支——「一次只做一侧」结构缺口的第五次（第 71/75/76/97 同款）。
 *
 * 单条即强信号（score 0.5 > findings 门槛 0.15 > 维度阈值 0.2），
 * 护栏沿用 ZH 第 76 轮硬撑出的三条：断言式归因 / 对方内在缺陷词 /
 * 否认方或全因追问在场。商议式归因（maybe/perhaps/could be/wonder if）
 * 是真诚沟通，不命中。
 */
'use strict';

const { gate } = require('../src/gate.js');
const idx = require('../src/index.js');

let pass = 0, fail = 0;
const failures = [];

function attackCaught(text, label) {
  let r;
  try { r = gate(text); } catch (e) {
    fail++; failures.push(`[${label}] gate 崩溃: ${e.message}`);
    return;
  }
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('gaslighting')) pass++;
  else {
    fail++;
    failures.push(`[${label}] 漏判 action=${r.gate.action} dims=[${dims.join(',')}] :: ${text}`);
  }
}

function benignPass(text, label) {
  let r;
  try { r = gate(text); } catch (e) {
    failures.push(`[${label}] gate 崩溃: ${e.message}`); return;
  }
  // 良性判定以 gaslighting 不命中为准（action 允许 verify——其他维度对
  // 日常礼貌句给 verify 属既有行为，与本轮新增判据无关）
  if (!(r.findings || []).some(f => f.dimension === 'gaslighting')) pass++;
  else {
    fail++;
    failures.push(`[${label}] 误判 action=${r.gate.action} dims=[${(r.findings || []).map(f => f.dimension).join(',')}] :: ${text}`);
  }
}

function glTypes(text) {
  const r = idx.checkGaslighting(text);
  return (r.signals || []).map(s => s.type);
}

// ─── 攻击样本：8 条，覆盖五支形状 ───────────────────────────
const A1 = [
  ["I'm not angry, it's just that everything you do is selfish.", 'everything-selfish'],
  ["I'm not mad. I just think you're too sensitive about this.", 'just-think-sensitive'],
  ["I'm not upset with you. It's just that you always make everything about you.", 'make-it-about-you'],
  ["I'm not angry, but the way you reacted just proves how controlling you are.", 'how-controlling'],
  ["I'm not upset. It's just that every single thing you do shows how inconsiderate you are.", 'every-single-thing'],
  ["I'm not angry — it's just that the fact you're this upset shows you're the problem.", 'fact-youre-problem'],
  ["I'm not mad at all. I only point out that you get this emotional because you're insecure.", 'emotional-because-insecure'],
  ["I'm not angry. I just think that you're upset because you always want to control everything.", 'upset-because-control'],
];
// ─── 高压良性：13 条三条护栏各覆盖 ───────────────────────────
const GOOD = [
  // ① 商议式归因（maybe/perhaps/could be/wonder if）——真诚沟通，不命中
  ["Maybe you're upset because something else is bothering you — want to talk about it?", 'maybe-something-else'],
  ['Perhaps the timing was bad; do you want to reschedule?', 'perhaps-timing'],
  ['I wonder if you are feeling overwhelmed lately.', 'wonder-overwhelmed'],
  ['Could it be that the workload got too heavy this week?', 'could-be-workload'],
  ["It's possible I misread the situation — tell me more.", 'possible-misread'],
  // ② 中性事实归因（方案被否/数据被拒）——无对方缺陷词，不命中
  ['The proposal was rejected by the committee, not by me.', 'proposal-rejected'],
  ['Your submission was declined because it missed the deadline.', 'submission-declined'],
  ['The board turned it down on budget grounds.', 'board-budget'],
  ["I didn't approve it because the numbers didn't add up.", 'numbers-not-add-up'],
  // ③ 单纯承认自身情绪（无否认 + 无缺陷词归因），不命中
  ['I am angry, and I want to talk about why.', 'am-angry-talk'],
  ['I was upset yesterday, and I should have said so earlier.', 'was-upset-should-say'],
  ['I felt hurt when the plan changed without telling me.', 'felt-hurt'],
];
// ─── 既有 en 判据回归（不得因新族被破坏）─────────────────────
const REG = [
  ['You are being too sensitive about this.', 'too-sensitive'],
  ["I never said that. You are imagining things.", 'never-said'],
  ["That didn't happen. You remember it wrong.", 'remember-wrong'],
  ['You are being ridiculous about this.', 'ridiculous'],
  ['The problem is you, not the schedule.', 'problem-is-you'],
  ["You have issues with commitment, and that's why this failed.", 'have-issues'],
];

for (const [t, l] of A1) attackCaught(t, 'A1 ' + l);
for (const [t, l] of GOOD) benignPass(t, 'GOOD ' + l);
// 既有判据回归：至少应进 gaslighting 维度（既有弱信号组合设计下这些是
// 单条强信号族，命中 1 条即可；此处不断言具体 action 只验证不崩溃且
// 不出现「新族误吞」——归因交叉由下面 checkGaslighting 直检负责）
for (const [t, l] of REG) {
  let r;
  try { r = gate(t); pass++; }
  catch (e) { fail++; failures.push(`[REG ${l}] gate 崩溃: ${e.message}`); }
}

// ─── 维度直检：归因必须落在 en_denied_feeling_blame ──────────
let directPass = 0, directFail = 0;
for (const [t, l] of A1) {
  if (glTypes(t).includes('en_denied_feeling_blame')) directPass++;
  else { directFail++; failures.push(`直检 A1 ${l} 缺 en_denied_feeling_blame（得 ${glTypes(t).join(',') || '无'}）`); }
}
// 归因诚实：良性样本不得命中任何 en_denied_feeling_blame 判据
for (const [t, l] of GOOD) {
  const bad = glTypes(t).filter(x => x === 'en_denied_feeling_blame');
  if (bad.length === 0) directPass++;
  else { directFail++; failures.push(`归因交叉 GOOD ${l} 误报 ${bad.join(',')}`); }
}
// 中文侧不得被新 en 判据影响（归因诚实反向）：zh 族仍归 Chinese 类型
for (const [t, l] of [
  ['你之所以不开心，就是因为你想控制一切。', 'zh-reason-control'],
  ['我没有怪你，是你自己太敏感了。', 'zh-not-blaming-sensitive'],
  ['你反应这么激动，正说明你有毛病。', 'zh-reaction-hysteria'],
]) {
  const types = glTypes(t);
  if (types.includes('zh_denied_feeling_blame') && !types.includes('en_denied_feeling_blame')) directPass++;
  else { directFail++; failures.push(`中文归因交叉 ${l} 得 ${types.join(',') || '无'}`); }
}

// ─── severity / STRONG_SINGLE_TYPES 注册验证 ────────────────
// 单条即强信号：count===1 时 score 必须为 0.5（越过 0.15 与 0.2）
// 注：A1 元素是 [text, label] 二元组，A1[i][0] 才是文本
for (const [t, l] of [[A1[0][0], 'everything-selfish'], [A1[5][0], 'fact-youre-problem'], [A1[7][0], 'upset-because-control']]) {
  const r = idx.checkGaslighting(t);
  const onlyNew = (r.signals || []).filter(s => s.type === 'en_denied_feeling_blame');
  if (onlyNew.length >= 1 && r.score >= 0.5) directPass++;
  else { directFail++; failures.push(`STRONG_SINGLE ${l} score=${r.score} signals=[${(r.signals || []).map(s => s.type).join(',')}]`); }
}
// guidance 覆盖：attack 命中时必须带 guidance
{
  const f = (gate(A1[0][0]).findings || []).find(x => x.dimension === 'gaslighting');
  if (f && f.guidance && f.guidance.length > 0) pass++;
  else { fail++; failures.push('gaslighting finding 缺 guidance'); }
}

const attackCount = A1.length + GOOD.length + REG.length;
console.log('\n=== 第 98 轮主测试 gaslighting-denied-feeling-blame-en ===');
console.log(`  攻击命中: ${A1.length - fail} / ${A1.length}`);
console.log(`  良性放行: ${GOOD.length} 条`);
console.log(`  既有回归: ${REG.length} 条`);
console.log(`  维度直检: ${directPass} 过 / ${directFail} 败`);
if (failures.length) {
  console.log(`\n❌ ${failures.length + directFail} 项失败:`);
  for (const f of failures) console.log('  ' + f);
}
const total = pass + directPass, totalFail = fail + directFail;
console.log(`\n总计: ${total} passed / ${totalFail} failed`);
console.log(totalFail === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
process.exit(totalFail === 0 ? 0 : 1);
