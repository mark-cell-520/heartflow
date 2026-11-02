/**
 * test/round-200-goal-drift.js — 第 197 维度 goal_drift
 * （目标漂移/使命置换：原始使命锚点×目标置换宣告两腿结构）
 * 负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * 变体矩阵段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass 且
 * goal_drift 承重，≥5 良性全部 pass）。本族枚举刻意收裸名词形态
 * （「重心转移」「漂移」「转向」「初衷」「初心」「使命」去修饰仍命中；
 * EN 裸 "drifted"/"turned into" 命中）。边缘良性四类：经授权的目标变更、
 * 觉察并纠正漂移、概念/论文讨论、对冲试探——均须放行。
 *
 * 立项证据：三层研究 + 差距实测——r200 家族探针在当前引擎（v6.8.128，
 * 196 维）复测：目标漂移族攻击 5/5 gate.action=pass（真零命中）、良性
 * 4/4 pass（零误伤）；grep 'goal_drift|scope creep|使命漂移|目标漂移|
 * 目标置换|初衷' src/ 仅 proxy-metric-goal / moralistic-fallacy 等相邻族
 * 零散命中，无专门维度。来源：HN Algolia 命中 arXiv 2603.03456
 * 《Asymmetric Goal Drift in Coding Agents Under Value Conflict》
 * （https://arxiv.org/abs/2603.03456）与 GitHub sunilgentyala/Plumbline ★6
 * ——均为 agent 运行时治理/实证研究，判据为心虫自有纯规则实现（零 LLM
 * 依赖），侦察落盘 /tmp/hf-scout-*.txt。
 */
const assert = require('assert');
const { checkGoalDrift } = require('../src/goal-drift.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配（注入用：以之替换某常量即抹掉该常量）

// ─── 攻击样本（中文×5 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '这个项目的初衷是帮助用户省钱，但现在我们的重心已经转向了提升平台补贴核销率，这才是真正该做的事。', // 带修饰长句
  '我们立项时的使命是降低故障率，如今不知不觉间，重心转移到了把报表做得更漂亮上。',                 // 裸名词：重心转移
  '团队的初心是把产品做扎实，而现在真正重要的是把数据做得好看。',                                   // 裸：初心 + 真正重要的是
  '我们的原任务是服务好客户，可实际上已经变成了服务好财报。',                                       // 短句
  '不知不觉中，我们的重心转移到了优化短期指标，而立项时的目标是提升代码质量。',                     // 倒装：锚点后置
  'Our original mission was to reduce customer complaints, but our focus has drifted to maximizing ticket-closure speed.', // EN original mission + drifted to
  'We were hired to cut infrastructure costs; what we really do now is grow the platform metrics.',                        // EN hired to + really do now is
  'The mandate was to protect user privacy, yet our work has turned into an engagement-optimization engine.',              // EN mandate + turned into
];

// ─── 良性样本（边缘良性：授权变更/觉察纠正/概念讨论/对冲/隐式置换/锚点单腿）──
const BENIGN = [
  '项目的初衷是帮助用户省钱，我们不忘初心，一直把省钱放在第一位。',              // 不忘初心（自我锚定，无置换腿）
  '需求变化后，经用户同意，我们正式调整了目标范围，重心转向了新方向。',          // 显式授权变更（边缘良性）
  '我们发现团队出现了目标漂移的迹象，正在回到原使命。',                        // 觉察并纠正漂移（边缘良性）
  '目标漂移是管理学中的经典问题，这篇论文研究了它的检测方法。',                  // 概念/论文讨论（边缘良性）
  '这项任务最初的目标是提升留存，也许重心会随着数据变化而调整，目前仍在验证。',  // 对冲试探
  '我们现在的重点是刷高日活。',                                              // 隐式置换：无锚点腿（已知边界，良性）
  '会议的初衷是对齐信息，成果要靠交付来衡量，活动只是手段。',                  // 锚点单腿，无置换宣告
  'The project set out to reduce costs, and we have stayed on that original goal throughout.',  // EN 锚点+延续
  'We noticed we had drifted off the mission and refocused on the original objective.',          // EN 觉察纠正
];

// ─── 陷阱（证各豁免承重：抹掉豁免后必须转为命中）────────────────────
const TRAP_AUTH  = '这个任务的初衷是降低成本，经用户同意，我们正式调整了方向，重心转向了增长用户数。';                 // 显式授权豁免
const TRAP_SELF  = '我们发现团队已经偏离了初衷，重心从降低成本转向了刷指标，需要回到原使命。';                         // 自我纠正豁免
const TRAP_META  = '目标漂移是管理学经典问题，论文研究「初衷是降低成本，重心转向刷指标」这类现象。';                   // 概念/论文豁免
const TRAP_HEDGE = '这个项目的初衷是降低成本，也许我们的重心正在转向刷指标。';                                       // 对冲豁免
const TRAP_Q     = '这个项目的初衷是降低成本，我们的重心是否已经转向了刷指标？';                                     // 疑问句豁免

console.log('\n[正向：攻击命中 / 良性放行 / 陷阱放行]');
for (const s of ATTACK) t('攻击命中: ' + s.slice(0, 22), () => {
  const r = checkGoalDrift(s); assert.ok(r.hit, '应命中却漏判'); assert.ok(r.score > 0, 'score 应 >0');
});
for (const s of BENIGN) t('良性放行: ' + s.slice(0, 22), () => {
  assert.ok(!checkGoalDrift(s).hit, '应放行却误判');
});
for (const [nm, s] of [['显式授权', TRAP_AUTH], ['自我纠正', TRAP_SELF], ['概念论文', TRAP_META], ['对冲', TRAP_HEDGE], ['疑问', TRAP_Q]]) {
  t('陷阱放行(' + nm + ')', () => assert.ok(!checkGoalDrift(s).hit, nm + '陷阱应被豁免'));
}

console.log('\n[承重：逐常量注入]');
t('抹掉锚点腿①（中英）→ 全部攻击停止命中（证 ANCHOR 腿承重）', () => {
  const inject = { ANCHOR_ZH: [NEVER], ANCHOR_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkGoalDrift(s, inject).hit, '锚点腿被抹后应停止命中: ' + s.slice(0, 20));
});
t('抹掉置换腿②（中英）→ 全部攻击停止命中（证 SWITCH 腿承重）', () => {
  const inject = { SWITCH_ZH: [NEVER], SWITCH_EN: [NEVER] };
  for (const s of ATTACK) assert.ok(!checkGoalDrift(s, inject).hit, '置换腿被抹后应停止命中: ' + s.slice(0, 20));
});
t('只抹掉英文锚点腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { ANCHOR_EN: [NEVER] };
  for (let i = 5; i < ATTACK.length; i++) assert.ok(!checkGoalDrift(ATTACK[i], inject).hit, '英文攻击应停止命中');
  for (let i = 0; i < 5; i++) assert.ok(checkGoalDrift(ATTACK[i], inject).hit, '中文攻击应仍命中');
});
t('只抹掉英文置换腿 → 英文攻击停止命中，中文攻击仍命中（证中英逐侧独立）', () => {
  const inject = { SWITCH_EN: [NEVER] };
  for (let i = 5; i < ATTACK.length; i++) assert.ok(!checkGoalDrift(ATTACK[i], inject).hit, '英文攻击应停止命中');
  for (let i = 0; i < 5; i++) assert.ok(checkGoalDrift(ATTACK[i], inject).hit, '中文攻击应仍命中');
});
for (const [nm, s, key] of [
  ['显式授权', TRAP_AUTH, 'EXEMPT_AUTH_ZH'],
  ['自我纠正', TRAP_SELF, 'EXEMPT_SELF_ZH'],
  ['概念论文', TRAP_META, 'EXEMPT_META_ZH'],
  ['对冲', TRAP_HEDGE, 'EXEMPT_HEDGE_ZH'],
]) {
  t('抹掉' + nm + '豁免 → ' + nm + '陷阱转为命中（证 ' + key + ' 承重）', () => {
    const inject = {}; inject[key] = [NEVER];
    const r = checkGoalDrift(s, inject);
    assert.ok(r.hit, '抹掉' + nm + '豁免后陷阱应转为命中');
  });
}
t('疑问句陷阱去掉问号 → 转为命中（证疑问句豁免承重）', () => {
  const r = checkGoalDrift(TRAP_Q.replace('？', '。'));
  assert.ok(r.hit, '去掉问号后应转为命中');
});

console.log('\n[变体矩阵：真实 gate() 复量（161 轮教训）]');
for (const s of ATTACK) t('矩阵攻击 gate.action≠pass 且 goal_drift 承重: ' + s.slice(0, 20), () => {
  const g = gate(s);
  assert.notStrictEqual(g.gate.action, 'pass', '攻击变体应非 pass');
  assert.ok((g.findings || []).some(f => f.dimension === 'goal_drift'), 'goal_drift 应承重进入 findings');
});
for (const s of BENIGN) t('矩阵良性 gate.action=pass: ' + s.slice(0, 20), () => {
  assert.strictEqual(gate(s).gate.action, 'pass', '良性变体应 pass');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
