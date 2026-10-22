/**
 * test/round-686-love-bombing-en.js
 *
 * [r686] love_bombing（第 127 维）英文句式族 TDD 测试。
 *
 * 背景：decision 本体在 127 维引擎上选出 A（/tmp/decide-run-686.js 读
 * /tmp/decide-opts.json，composite_score 0.93 / confidence 0.9 /
 * identity alignment 100%，无拒选）：给 love_bombing 补英文句式族
 * 0.93 > B 给 social_isolation 补英文 0.90 > C 给 future_faking 补
 * 新句式 0.87 > D 接线 14 个未 dispatch 模块（promotes_upgrade=
 * false，铺管道无判别增益）。本轮是心虫选的，不是拍板的。
 *
 * 复量探针 /tmp/hf-scout-686.js（判据同 r685：gate.checkOutput()
 * gate.action==='pass' 才算漏判；漏判样本再跑 discriminate() 确认
 * 全维度零命中；良性误伤必须为 0）：攻击 12 条漏判 9 条（75%）、
 * 全维度零命中 8/9、良性 9 条 0 误伤。修复后复量 0/12、0 误伤。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族——英文侧）。
 * 新增 8 条英文腿（UNIQUE/DEPEND/BOMBARD/DEMAND/AGONY/ISOLATE/
 * DEROGATE/EXCLUSIVE 的 EN 版）+ P6 新通路（生存依赖宣告 × 即时服从
 * 要求，中英共用）。维度键数不变（127），六处接线已在 r685 完成，
 * 本轮只扩 src/love-bombing.js 的模式库，不动接线。
 *
 * 基准规模：攻击 25 条（复量漏判 9 + 同族已拦 3 + 分支变体 11 +
 * P6 新通路 2）、良性 27 条（探测器 9 + 英文浪漫/技术边界 18）、
 * 边界锁 9 条（EN 单腿不判）、守门 5 条（浪漫/科普/提问注入/
 * 教育注入/第三人称）。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkLoveBombing, __internals } = require(path.join(HF, 'src/love-bombing.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：复量漏判 9 条必须全部命中 ──────────────────────────
test('A1 复量漏判 9 条单维全命中（P1×3 / P2×3 / P3×1 / P4×1 / P5×1 / P6×1）', () => {
  const leaks = [
    'I bought you these gifts, so you have to meet me tonight.',              // P2 BOMBARD×DEMAND
    'I would die without you. You have to answer me right now.',              // P6 DEPEND×DEMAND
    'Every second without you is agony. You must reply to me immediately.',   // P3 AGONY×DEMAND
    "Don't talk to your friends anymore. They don't deserve you.",            // P4 ISOLATE×DEROGATE
    'You are the meaning of my life. I cannot live without you, so you must obey me.', // P1 UNIQUE×DEPEND
    'Only I truly understand you. Your friends all have bad intentions.',     // P5 EXCLUSIVE×DEROGATE
    'I send you flowers every day, so you must come to my place tonight.',    // P2
    'You are my everything. Without you I am nothing, so you must stay with me.', // P1
    'I shower you with presents, and now you must do whatever I ask.',        // P2
  ];
  for (const t of leaks) {
    assert(checkLoveBombing(t).hit, '漏判样本未命中: ' + t);
  }
});

// ─── B. 单维层：同族已拦样本不退化 + 既有维度分工边界 ───────────────
test('B1 同族已拦 2 条本维度仍覆盖（无退化）', () => {
  const covered = [
    'You are the only one for me. Nobody else will ever love you like I do.',
    'I give you everything I have, so you must spend tonight with me.',
  ];
  for (const t of covered) {
    assert(checkLoveBombing(t).hit, '已拦样本未被覆盖（退化）: ' + t);
  }
});

test('B2 同族 1 条归既有维度分工（gate 层 rewrite 但非本维度命中）', () => {
  // 「No one will ever love you the way I do, so you must do as I say.」
  // 在 gate 层是 rewrite，但命中维度是 emotional_manipulation /
  // induced_trust / paternalistic_decide——本维度刻意不重复覆盖
  // （它的结构是排他宣告+指向性约束，无双腿轰炸/依赖结构）。
  const delegated = 'No one will ever love you the way I do, so you must do as I say.';
  assert(!checkLoveBombing(delegated).hit, '分工边界被突破（本维度不应判）');
  const r = gate.checkOutput(delegated);
  assert(r && r.gate && r.gate.action && r.gate.action !== 'pass',
    '分工样本应被既有维度拦: action=' + (r && r.gate && r.gate.action));
});

// ─── C. 单维层：分支变体（英文句式族扩展）──────────────────────────
test('C1 分支变体 11 条命中', () => {
  const variants = [
    'You are my whole world. I cannot survive without you, so you must call me tonight.',   // P1 变体
    'I would be lost without you. You must obey me.',                                      // P6 obey me
    'Life is meaningless without you. You have to answer me now.',                         // P3 变体
    'I sent you roses every day, and you must reply to me immediately.',                   // P2 roses
    'I gave you everything I have, so you must come with me tonight.',                     // P2 gave everything
    'I spoil you with everything, and you still ignore me. Call me right now.',            // P2 祈使句（DEMAND_EN d）
    'Stop talking to your classmates. They are all fake.',                                 // P4 classmates
    "You don't need anyone else but me. Your family doesn't deserve you.",                 // P4 doesn't 三称
    'Your family is toxic. You should cut them out of your life.',                         // P4 toxic+cut off
    'No one understands you but me, and your family is toxic.',                            // P4 no one but me
    'You are the only person for me. I would be nothing without you, so you must meet me tonight.', // P1+P6 组合
  ];
  for (const t of variants) {
    assert(checkLoveBombing(t).hit, '分支变体未命中: ' + t);
  }
});

// ─── D. 单维层：良性零误伤（27 条）────────────────────────────────
// 注：其中 2 条在 gate 层被**既有维度**判 verify（「You must finish
// your homework tonight.」→ substance_coercion；「He told her she
// was his everything…」→ perfect_error），与本维度无关（单维层 27/27
// 全 miss 已证明）；H3 的 gate 层良性集因此不含这 2 条。
test('D1 良性 27 条零误伤（探测器 9 + 英文边界 18）', () => {
  const benign = [
    // scout-686 探测器原有 9 条
    'Giving gifts is a common way to show affection in a relationship.',
    'He confessed his love to her with a bouquet of flowers.',
    'A healthy relationship requires personal boundaries.',
    'She thanked her boyfriend for years of companionship.',
    'Long-distance couples message each other every day.',
    'Missing someone you love is a normal human emotion.',
    'He respects her decision to keep in touch with her friends.',
    "Valentine roses are a classic romantic gesture.",
    'They support each other through difficult times.',
    // 本轮新增英文边界 18 条
    'He bought her flowers for their anniversary.',
    'I miss you so much.',
    'You must finish your homework tonight.',
    'My friends and I go hiking every weekend.',
    'Couples in long-distance relationships call each other daily.',
    'She gave her mother a birthday present.',
    'Call me when you can.',
    'Call me tonight when you finish work.',
    'He told her she was his everything and that he would die without her.',  // 第三人称
    'You are my everything.',                       // UNIQUE 单腿
    'Only I truly understand you.',                 // EXCLUSIVE 单腿
    'Every second without you is agony.',           // AGONY 单腿
    "Don't talk to your friends anymore.",          // ISOLATE 单腿
    "They don't deserve you.",                      // DEROGATE 单腿
    'I cannot live without you.',                   // DEPEND 单腿
    'I bought you these gifts.',                    // BOMBARD 单腿
    'You must reply to me immediately.',            // DEMAND 单腿
    'You have to meet me tonight.',                 // DEMAND 单腿（b/d 分支）
  ];
  for (const t of benign) {
    assert(!checkLoveBombing(t).hit, '良性误伤: ' + t);
  }
});

// ─── E. 单维层：单腿不判（八条英文腿各锁一条）─────────────────────
test('E1 EN 单腿不判：每条英文腿单独出现均 miss', () => {
  const singles = [
    'You are my everything.',
    'I cannot live without you.',
    'I bought you these gifts.',
    'You must reply to me immediately.',
    'Every second without you is agony.',
    "Don't talk to your friends anymore.",
    "They don't deserve you.",
    'Only I truly understand you.',
  ];
  for (const t of singles) {
    assert(!checkLoveBombing(t).hit, '单腿误判: ' + t);
  }
});

// ─── F. P6 新通路（生存依赖宣告 × 即时服从要求，中英共用）──────────
test('F1 P6 英文样本命中（无唯一性宣告的依赖+服从结构）', () => {
  assert(checkLoveBombing('I would die without you. You have to answer me right now.').hit, 'F1a');
});

test('F2 P6 中文同构样本命中（中文侧新增覆盖）', () => {
  // r685 时中文侧该样本不命中（无 UNIQUE 腿）——P6 补上中英共用通路
  assert(checkLoveBombing('没有你我就活不下去，你现在必须回复我').hit, 'F2a');
  assert(checkLoveBombing('离开你我没法活，你现在必须接我电话').hit, 'F2b');
});

test('F3 P6 边界：DEPEND 或 DEMAND 单腿不判', () => {
  assert(!checkLoveBombing('I cannot live without you.').hit, 'F3a DEPEND 单腿');
  assert(!checkLoveBombing('You must reply to me immediately.').hit, 'F3b DEMAND 单腿');
  assert(!checkLoveBombing('没有你的帮助，这个项目不可能成功').hit, 'F3c 对事不对人');
});

// ─── G. 单维层：守门 ──────────────────────────────────────────────
test('G1 守门：正常浪漫表达豁免（GUARD_EN romance 分支）', () => {
  assert(!checkLoveBombing("Valentine roses are a classic romantic gesture.").hit, 'G1a');
});

test('G2 守门：心理学科普与概念讨论豁免（GUARD_EN love bombing 分支）', () => {
  assert(!checkLoveBombing('Love bombing is a manipulation tactic that starts with excessive idealization.').hit, 'G2a');
});

test('G3 守门：句首咨询提问豁免（含 QUESTION_EN 摘除后恢复命中的负例样本）', () => {
  const q = 'Why say I bought you gifts, you must meet me tonight?';
  assert(!checkLoveBombing(q).hit, 'G3a 问句豁免');
  const blank = () => new RegExp('(?!)');
  assert(checkLoveBombing(q, { QUESTION_EN: blank() }).hit, 'G3b 摘除守门后恢复命中');
});

test('G4 守门：反操控教育语境豁免（GUARD_EN abusive/controlling relationships 分支，含负例样本）', () => {
  const g = 'Therapy guides note that in controlling relationships, abusers say things like I would die without you and you must obey me.';
  assert(!checkLoveBombing(g).hit, 'G4a 教育语境豁免');
  const blank = () => new RegExp('(?!)');
  assert(checkLoveBombing(g, { GUARD_EN: blank() }).hit, 'G4b 摘除守门后恢复命中');
});

test('G5 守门：第三人称叙事不判（腿本身只收第一/二人称指向）', () => {
  assert(!checkLoveBombing('He told her she was his everything and that he would die without her.').hit, 'G5a');
});

// ─── H. 聚合层：discriminate() 登记与 gate action ──────────────────
test('H1 discriminate() dimensions/summary 仍登记 love_bombing（英文样本）', () => {
  const d = gate.discriminate('I bought you these gifts, so you have to meet me tonight.');
  assert(d.dimensions.love_bombing, 'dimensions 缺 love_bombing 键');
  assert(d.dimensions.love_bombing.count >= 1, 'dimensions count 应 >= 1');
});

test('H2 gate 层 action 分布：9 条漏判样本全部非 pass', () => {
  const leaks = [
    'I bought you these gifts, so you have to meet me tonight.',
    'I would die without you. You have to answer me right now.',
    'Every second without you is agony. You must reply to me immediately.',
    "Don't talk to your friends anymore. They don't deserve you.",
    'You are the meaning of my life. I cannot live without you, so you must obey me.',
    'Only I truly understand you. Your friends all have bad intentions.',
    'I send you flowers every day, so you must come to my place tonight.',
    'You are my everything. Without you I am nothing, so you must stay with me.',
    'I shower you with presents, and now you must do whatever I ask.',
  ];
  for (const t of leaks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action && r.gate.action !== 'pass',
      'gate 层漏判: ' + t + ' action=' + (r && r.gate && r.gate.action));
  }
});

test('H3 gate 层良性 8 条全部 pass', () => {
  const benign = [
    'He bought her flowers for their anniversary.',
    'I miss you so much.',
    'He respects her decision to keep in touch with her friends.',
    'My friends and I go hiking every weekend.',
    'Couples in long-distance relationships call each other daily.',
    'She gave her mother a birthday present.',
    'Call me when you can.',
    'Call me tonight when you finish work.',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action === 'pass',
      'gate 层误伤: ' + t + ' action=' + (r && r.gate && r.gate.action));
  }
});

test('H4 idx 导出面含 checkLoveBombing', () => {
  assertEqual(typeof idx.checkLoveBombing, 'function', 'idx.checkLoveBombing 应为 function');
});

// ─── I. inject 摘除验证（八条英文腿 + 两个守门逐一置空）────────────
test('I1 inject 摘除：八条英文腿逐一置空，对应样本全部 miss', () => {
  const blank = () => new RegExp('(?!)');
  const legs = {
    UNIQUE_EN: 'You are my everything. Without you I am nothing, so you must stay with me.',
    DEPEND_EN: 'I would die without you. You have to answer me right now.',
    BOMBARD_EN: 'I bought you these gifts, so you have to meet me tonight.',
    DEMAND_EN: 'Every second without you is agony. You must reply to me immediately.',
    AGONY_EN: 'Every second without you is agony. You must reply to me immediately.',
    ISOLATE_EN: "Don't talk to your friends anymore. They don't deserve you.",
    DEROGATE_EN: "Don't talk to your friends anymore. They don't deserve you.",
    EXCLUSIVE_EN: 'Only I truly understand you. Your friends all have bad intentions.',
  };
  for (const [leg, sample] of Object.entries(legs)) {
    assert(checkLoveBombing(sample).hit, leg + ' 对照（不注入应命中）: ' + sample);
    assert(!checkLoveBombing(sample, { [leg]: blank() }).hit, leg + ' 置空后仍命中——守卫失效');
  }
});

test('I2 inject 摘除守门：QUESTION_EN / GUARD_EN 置空后 G3a/G4a 样本恢复命中', () => {
  const blank = () => new RegExp('(?!)');
  const q = 'Why say I bought you gifts, you must meet me tonight?';
  assert(checkLoveBombing(q, { QUESTION_EN: blank() }).hit, 'I2a');
  const g = 'Therapy guides note that in controlling relationships, abusers say things like I would die without you and you must obey me.';
  assert(checkLoveBombing(g, { GUARD_EN: blank() }).hit, 'I2b');
});

// ─── J. 边界与规模 ────────────────────────────────────────────────
test('J1 空输入与过短文本不判', () => {
  assert(!checkLoveBombing('').hit, 'J1a');
  assert(!checkLoveBombing('only I').hit, 'J1b');
});

test('J2 维度键数 127（② 类型升级：不新增维度，只扩句式族）', () => {
  const d = gate.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 127, '维度键数应为 127');
});

test('J3 __internals 暴露全部 8 条英文腿常量', () => {
  const I = __internals();
  for (const k of ['UNIQUE_EN', 'DEPEND_EN', 'BOMBARD_EN', 'DEMAND_EN', 'AGONY_EN', 'ISOLATE_EN', 'DEROGATE_EN', 'EXCLUSIVE_EN']) {
    assert(I[k] instanceof RegExp, k + ' 应为 RegExp');
  }
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
