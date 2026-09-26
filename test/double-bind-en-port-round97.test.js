/**
 * double-bind-en-port-round97.test.js — 第 97 轮主测试
 *
 * 覆盖第 97 轮新增的 EN 侧四族形状移植（与中文第 76 轮四族同构）：
 *   ① 形式授权+惩罚后置（准许 → 转折 → 遗弃/追责）     double_bind / false_permission
 *   ② 分支皆罚（either/or/otherwise → 驱逐后果）         double_bind / damned_branches
 *   ③ 驱逐式最后通牒（认错 → or → 滚/离/解雇）           double_bind / ultimatum_expel
 *   ④ 病理化反抗（质疑/拒绝/push back → 说明你有病）    double_bind / pathologized_defiance
 *
 * 轮初实测缺口（探针 /tmp/probe97-db-en.js）：38 条英文攻击样本（首版探针
 * 含 gaslighting 侧 6 条）经 gate 命中 0/38，原有 6 条 en 判据命中 0；
 * 16 条英文良性 0 误伤。中文侧这四族第 76 轮已补齐（zh 表 18 支）。
 *
 * 同轮修的调用路径缺陷（index.js discriminate）：double_bind 此前只喂
 * _normText，英文样本被 en2zh 归一化破坏匹配——实测 ultimatum_expel
 * 首版判据已写对却只得 1/8。已改走 _dual（原文 + 归一化双跑取多）。
 *
 * 判据沿用「两半齐备」第 11 次复现：准许半/选项墙/反抗半单独不命中，
 * 必须与惩罚半同句共现（22 条高压良性命中验证）。
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
  if (dims.includes('double_bind')) pass++;
  else {
    fail++;
    failures.push(`[${label}] 漏判 action=${r.gate.action} dims=[${dims.join(',')}] :: ${text}`);
  }
}

function benignPass(text, label) {
  let r;
  try { r = gate(text); } catch (e) {
    fail++; failures.push(`[${label}] gate 崩溃: ${e.message}`);
    return;
  }
  // 良性判定以 double_bind 不命中为准（action 允许 verify——其他维度如
  // perfect_error 对日常礼貌句给 verify 属既有行为，与本轮新增判据无关）
  if (!(r.findings || []).some(f => f.dimension === 'double_bind')) pass++;
  else {
    fail++;
    failures.push(`[${label}] 误判 action=${r.gate.action} dims=[${(r.findings || []).map(f => f.dimension).join(',')}] :: ${text}`);
  }
}

function bindTypes(text) {
  return idx.checkDoubleBind(text).binds.map(b => b.pattern);
}

// ─── ① 形式授权+惩罚后置 ───────────────────────────────
const A1 = [
  ["I'm not stopping you, but don't blame me if it all falls apart.", 'deny-blame'],
  ['You can go if you want, however the consequences are on you.', 'consequences-on-you'],
  ["I won't force you, but you'll be sorry you chose that.", 'will-be-sorry'],
  ["Do what you like, just don't expect me to help you out.", 'no-help-out'],
  ["Nobody is keeping you here, but don't come crying back to me.", 'come-crying'],
  ["You are free to decide, but if this backfires you're on your own.", 'on-your-own'],
  ["I support your choice, just remember you'll have to live with it.", 'live-with-it'],
  ["It's your call, but I won't be there to pick up the pieces.", 'pick-up-pieces'],
];

// ─── ② 分支皆罚 ────────────────────────────────────────
const A2 = [
  ['Either you apologize or get out of this house.', 'apologize-or-out'],
  ['Fix this now, or you can pack your bags and leave.', 'pack-your-bags'],
  ['Either you obey my rules or you find somewhere else to live.', 'somewhere-else'],
  ['Stop complaining, otherwise you can handle everything yourself.', 'handle-yourself'],
  ["Either you stop arguing with me or you're done here.", 'done-here'],
  ["Either you agree right now or we're done here.", 'agree-or-done'],
  ['Fix it now, otherwise find another place to stay.', 'find-another'],
  ["If you keep this up, or else you're out of here.", 'or-else-out'],
];

// ─── ③ 驱逐式最后通牒 ──────────────────────────────────
const A3 = [
  ['Apologize, or get out.', 'apologize-get-out'],
  ["Say you're sorry, or you're sleeping on the street.", 'sleeping-street'],
  ['Admit you were wrong, or leave the house.', 'admit-leave'],
  ['Confess it now, or pack your things and go.', 'confess-pack'],
  ['Accept my terms, or walk out that door.', 'accept-walk-out'],
  ["Submit your resignation, or you're fired before Monday.", 'submit-fired'],
  ['Fix your attitude, otherwise find another place to stay.', 'fix-attitude'],
  ["Apologize to her, or you're out of this team.", 'out-of-team'],
];

// ─── ④ 病理化反抗 ──────────────────────────────────────
const A4 = [
  ['You question everything because you have a mental problem.', 'question-mental'],
  ['Refusing this proves you are psychologically broken.', 'refusing-broken'],
  ["Backtalk like that shows there's something wrong with your mind.", 'backtalk-mind'],
  ['Arguing with me means you have emotional issues.', 'arguing-emotional'],
  ['Defiance like this is a symptom of your mental instability.', 'defiance-instability'],
  ["The way you push back proves you're not mentally well.", 'push-back-well'],
  ['If you challenge me, it says something about your psychological state.', 'challenge-psych-state'],
  ['Questioning authority is a sign of emotional damage.', 'question-authority-damage'],
];

// ─── ⑤ 高压良性（必须 0 误伤，pass 级）──────────────────
const GOOD = [
  ['You can take the day off, but please finish the report first.', 'benign-but-report'],
  ['Either we ship on Friday or we delay to next sprint.', 'benign-either-ship'],
  ['Apologize to the client, or escalate it to the manager.', 'benign-apologize-escalate'],
  ['If you disagree with the review, raise it in the meeting.', 'benign-disagree-meeting'],
  ['You may decline the invitation; the deadline is still Friday.', 'benign-decline-deadline'],
  ['Either option works for me — choose the one you prefer.', 'benign-either-prefer'],
  ["I'm not angry at all, I just want to understand what happened.", 'benign-not-angry'],
  ['Questioning the premises is exactly what a good engineer should do.', 'benign-question-premises'],
  ['You can reschedule the call, but let the client know in advance.', 'benign-reschedule'],
  ["Either you fix the typo now or I'll file it as a low-priority bug.", 'benign-typo-bug'],
  ['It is your decision whether to accept the offer.', 'benign-decision-offer'],
  ['We could take the highway or the coastal road — both are fine.', 'benign-highway-road'],
  ["I support your choice, and I'm happy to help either way.", 'benign-support-choice'],
  ['If the build fails twice, drop the change and ping me.', 'benign-build-fails'],
  ["You're free to leave early as long as the handover is done.", 'benign-leave-handover'],
  ['Talk to a professional if the stress is getting to you.', 'benign-professional'],
  ['Either we release today or we wait for the audit — your call.', 'benign-release-audit'],
  ['You can push back if you have data, that is how review works.', 'benign-push-back-data'],
  ['Do what you like with the code, just keep the tests green.', 'benign-code-tests'],
  ['Questioning the data is fine; here is the raw export.', 'benign-data-export'],
  ['You can always say no, and I will not hold it against you.', 'benign-say-no'],
  ['Either path is acceptable; I defer to your judgment here.', 'benign-defer-judgment'],
];
for (const [t, l] of A1) attackCaught(t, 'A1 ' + l);
for (const [t, l] of A2) attackCaught(t, 'A2 ' + l);
for (const [t, l] of A3) attackCaught(t, 'A3 ' + l);
for (const [t, l] of A4) attackCaught(t, 'A4 ' + l);
for (const [t, l] of GOOD) benignPass(t, 'GOOD ' + l);

// ─── ⑥ 维度直检：归因必须落在具体新族 ──────────────────
let directPass = 0, directFail = 0;
const expectMap = { A1: 'false_permission', A2: 'damned_branches', A3: 'ultimatum_expel', A4: 'pathologized_defiance' };
for (const [group, type] of Object.entries(expectMap)) {
  const list = { A1, A2, A3, A4 }[group];
  for (const [t, l] of list) {
    if (bindTypes(t).includes(type)) directPass++;
    else { directFail++; failures.push(`直检 ${group} ${l} 缺 ${type} 归因（得 ${bindTypes(t)}）`); }
  }
}
// 归因诚实：良性样本不得命中任何一个新族
for (const [t, l] of GOOD) {
  const bad = bindTypes(t).filter(x => Object.values(expectMap).includes(x));
  if (bad.length === 0) directPass++;
  else { directFail++; failures.push(`归因交叉 GOOD ${l} 误报 ${bad.join(',')}`); }
}

// ─── ⑦ guidance / severity 注册 ────────────────────────
{
  const f = (gate(A1[0][0]).findings || []).find(x => x.dimension === 'double_bind');
  if (f && f.guidance && f.guidance.length > 0) pass++;
  else { fail++; failures.push('double_bind finding 缺 guidance'); }
}
// 每族用一条能真实命中它的样本来验 severity 注册（勿用跨族样本）
{
  const sevSamples = {
    false_permission: A1[0][0],
    damned_branches: A2[1][0],
    ultimatum_expel: A3[2][0],
    pathologized_defiance: A4[1][0],
  };
  for (const [type, s] of Object.entries(sevSamples)) {
    const b = idx.checkDoubleBind(s).binds.find(x => x.pattern === type);
    if (b && typeof b.severity === 'number' && b.severity > 0) pass++;
    else { fail++; failures.push(`severity 表缺 ${type}`); }
  }
}

const attackCount = A1.length + A2.length + A3.length + A4.length;
console.log('\n=== 第 97 轮主测试 double-bind-en-port ===');
console.log(`  攻击命中: ${attackCount - fail} / ${attackCount}`);
console.log(`  良性放行: ${GOOD.length} 条`);
console.log(`  维度直检: ${directPass} 过 / ${directFail} 败`);
if (failures.length) {
  console.log(`\n❌ ${failures.length + directFail} 项失败:`);
  for (const f of failures) console.log('  ' + f);
}
const total = pass + directPass, totalFail = fail + directFail;
console.log(`\n总计: ${total} passed / ${totalFail} failed`);
console.log(totalFail === 0 ? '\n✅ 全绿' : '\n❌ 有失败');
process.exit(totalFail === 0 ? 0 : 1);
