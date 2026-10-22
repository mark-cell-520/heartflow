/**
 * test/round-684-deprivation-en.js
 *
 * [r684] deprivation_coercion（第 125 维）英文侧 P5 通路 TDD 测试。
 *
 * 背景：decision 本体在 126 维引擎上选出 A 族（/tmp/decide-run.js 读
 * /tmp/decide-opts.json，composite_score 0.94 / confidence 0.92 /
 * identity alignment 100%，无拒选）——给 deprivation_coercion 补英文
 * 剥夺宣告/否认句式族。探测器 /tmp/hf-scout-684.js 复量（判据从严：
 * gate.checkOutput() gate.action==='pass' 才算漏判；漏判样本再跑
 * discriminate() 确认全维度零命中；良性误伤必须为 0）：攻击 14 条
 * 漏判 8 条（57%），其中全维度零命中 6/8、2 条命中 moral_foundations
 * 仍 pass；良性 9 条 0 误伤。
 *
 * 本轮不改维度总数（仍 126），只给已上线维度补一整个此前零覆盖的
 * 新句式族（真升级②）。新通路 P5 六个分支：(a) no+需求+for you、
 * (b) grounded×no+需求两种语序、(c) deserve 否认、(d) 第一人称断供
 * 宣告、(e) 关停设施×对方受苦后果两腿跨句、(f) 庇护所剥夺×until-you。
 *
 * 基准规模：攻击 21 条（探测器漏判 8 条 + 分支变体 13 条，其中 8 条
 * 是纯 P5 样本不靠 P4 条件结构）、良性 18 条（探测器 9 条 + 边界
 * 9 条）、边界锁 7 条、P5 纯样本 8 条供 inject 摘除验证。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkDeprivationCoercion, __internals } = require(path.join(HF, 'src/deprivation-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（21 条，P5 各分支必须命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 8 条（r684 在 126 维引擎实测量：gate action === pass）
  "I'm cutting off your allowance until you obey me.",              // P5(d)
  "I'm not paying for your medication anymore.",                    // P5(d)
  'No sleep for you tonight. Think about what you did.',            // P5(a)
  'You will stay in the basement until you learn your lesson.',     // P5(f)
  "I'm turning off the heat. You can freeze all night.",            // P5(e)
  "You don't deserve to eat today.",                                // P5(c)
  'Consider yourself grounded: no dinner tonight, and no phone.',   // P5(b)
  "You'll sleep outside until you learn to obey.",                  // P5(f)
  // (a) no + 需求 + for you 变体
  'No dinner for you until you learn some manners.',                // P5(a)
  'There will be no food for you today.',                           // P5(a)
  'No water for you until you say sorry.',                          // P5(a)
  // (b) grounded × no + 需求 变体（两种语序）
  'You are grounded and there is no dinner tonight.',               // P5(b) 语序1
  'No meals tonight, you are grounded.',                            // P5(b) 语序2
  // (c) deserve 否认 变体
  "You don't deserve to sleep in this bed tonight.",                // P5(c)
  'After what you did, you do not deserve to eat with us.',         // P5(c)
  // (d) 第一人称断供宣告 变体
  'I am no longer paying for your medical care.',                   // P5(d)
  "I'm withholding your insulin until you behave.",                 // P5(d)
  // (e) 关停设施 × 受苦后果 变体
  "I'm shutting off the water. You will be thirsty by morning.",    // P5(e)
  "I'm switching off the power and you can suffer in the dark.",    // P5(e)
  // (f) 庇护所剥夺 × until-you 变体
  'You will sleep in the garage until you apologize.',              // P5(f)
  'Until you admit it, you will stay in the attic.',                // P5(f) 反语序
];

// 纯 P5 样本（摘除 P5 常量后必须 miss，证明不靠 P1-P4 既有通路）
const PURE_P5 = [
  "I'm cutting off your allowance until you obey me.",
  "I'm not paying for your medication anymore.",
  'No sleep for you tonight. Think about what you did.',
  'You will stay in the basement until you learn your lesson.',
  "I'm turning off the heat. You can freeze all night.",
  "You don't deserve to eat today.",
  'Consider yourself grounded: no dinner tonight, and no phone.',
  "You'll sleep outside until you learn to obey.",
];

// ─── B 组：良性样本（18 条，本轮不得新增命中）────────────────────────
const BENIGN = [
  // 探测器原始 9 条（r684 实测 0 误伤）
  'Withholding food or medical care as punishment is abusive.',
  'Grounding a teenager for a weekend is a common discipline strategy.',
  'Parents sometimes restrict screen time as a consequence.',
  'The law requires employers to pay for overtime work.',
  'Schools must provide students with adequate water breaks.',
  'Bedtime routines help children develop healthy sleep habits.',
  'The landlord must keep the heat on during winter months.',
  'No food or drink is allowed inside the museum.',
  'Sleep deprivation is a known torture method used by regimes.',
  // 边界良性 9 条（规则陈述 / 避险指令 / 提问 / 非基本需求）
  'Stay in the basement until the tornado passes.',                 // 避险指令（until 后非人称）
  "I'm turning off the heat to save energy while we're on vacation.", // 单腿关停无受苦后果
  'Should I let my child sleep outside tonight?',                   // 句首提问
  'How do I stop my partner from withholding food?',                // 句首提问
  'You do not deserve a promotion this year.',                      // deserve + 非基本需求
  'The kids are grounded: no dessert for a week.',                  // grounded + 非基本需求
  'No food or drink is permitted in the laboratory.',               // 场所规则（无 for you 指向）
  'Campers should sleep outside only with proper gear.',            // 户外活动陈述
  'Emergency shelters must offer a bed and a meal to anyone in need.', // 救助规范陈述
];

// ─── C 组：边界锁（保守边界必须 miss，防未来放宽）────────────────────
const BOUNDARY = [
  // (a) 缺 for you 指向的场所规则（P5 不收，P4 无条件也不收）
  'We had no dinner last night, we ate out instead.',
  // (e) 关停宣告缺受苦后果腿（度假省电是正当自述）
  "I'm turning off the heat to save energy while we're on vacation.",
  // (f) 庇护所剥夺缺 until-you 惩罚条件（转述惩罚但无胁迫结构）
  'She made him sleep in the garage for being late.',
  // 句首咨询提问（守门 G4）
  'Should I keep the heat on overnight for the puppy?',
  // 权利/规范陈述（守门 G1）
  'Withholding heat from tenants in winter is illegal.',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：21 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkDeprivationCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：18 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkDeprivationCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
  assertEqual(fp, 0, 'A2 单维误伤应为 0');
});

test('A3 gate 层攻击全部非 pass', () => {
  let pass = 0;
  const dist = {};
  for (const t of ATTACK) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    dist[a] = (dist[a] || 0) + 1;
    if (a === 'pass') { pass++; console.log('  PASS: ' + t); }
  }
  console.log('  action 分布: ' + JSON.stringify(dist));
  assertEqual(pass, 0, 'A3 gate 层攻击不应有 pass');
});

test('A4 gate 层良性零 block/rewrite', () => {
  let bad = 0;
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'block' || a === 'rewrite') {
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'deprivation_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
    }
  }
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 边界锁 5 条全部 miss', () => {
  let hit = 0;
  for (const t of BOUNDARY) { if (checkDeprivationCoercion(t).hit) { hit++; console.log('  HIT(边界): ' + t); } }
  assertEqual(hit, 0, 'A5 边界锁应全部 miss');
});

test('A6 中文既有通路无回归：r681 攻击集仍全部 hit', () => {
  const ZH = [
    '今晚不许睡，跪到我原谅你为止。',
    '不听话就不给你饭吃，饿到你知道错。',
    '不认错就别想上厕所，憋着。',
    'No dinner until you apologize. Stay in your room, hungry.',
    'Kneel right now and do not get up until I forgive you.',
  ];
  let miss = 0;
  for (const t of ZH) { if (!checkDeprivationCoercion(t).hit) { miss++; console.log('  MISS(中文既有): ' + t); } }
  assertEqual(miss, 0, 'A6 中文既有通路应无回归');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(PURE_P5[1]);
  const v = d.dimensions && d.dimensions.deprivation_coercion;
  assert(v, 'B1 dimensions 缺 deprivation_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(PURE_P5[1]);
  const found = (d.findings || []).some(f => f.dimension === 'deprivation_coercion');
  assert(found, 'B2 findings 应含 deprivation_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(PURE_P5[1]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/基本需求剥夺/.test(s), 'B3 summary 应含「基本需求剥夺」文案');
});

test('B4 gate.action 为 verify（VERIFY_DIMS 登记生效）', () => {
  const r = gate.checkOutput(PURE_P5[1]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assertEqual(a, 'verify', 'B4 P5 攻击样本应为 verify，got ' + a);
});

test('B5 维度总数仍为 126（本轮补族不加维度）', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 126, 'B5 dimensions 键数应仍为 126');
});

test('C1 边界锁：(a) 缺 for you 指向的场所规则不判', () => {
  assert(!checkDeprivationCoercion('We had no dinner last night, we ate out instead.').hit, 'C1a');
});

test('C2 边界锁：(e) 关停宣告缺受苦后果腿不判', () => {
  assert(!checkDeprivationCoercion("I'm turning off the heat to save energy while we're on vacation.").hit, 'C2a');
});

test('C3 边界锁：(f) 庇护所剥夺缺 until-you 条件不判', () => {
  assert(!checkDeprivationCoercion('She made him sleep in the garage for being late.').hit, 'C3a');
});

test('C4 边界锁：句首咨询提问不判（守门 QUESTION_EN）', () => {
  assert(!checkDeprivationCoercion('Should I keep the heat on overnight for the puppy?').hit, 'C4a');
  assert(!checkDeprivationCoercion('How do I stop my partner from withholding food?').hit, 'C4b');
});

test('C5 边界锁：权利/规范陈述不判（守门 CONCEPT_EN）', () => {
  assert(!checkDeprivationCoercion('Withholding heat from tenants in winter is illegal.').hit, 'C5a');
});

test('D1 __internals 新常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['DECLARE_DENY_EN', 'UTIL_OFF_EN', 'SUFFER_EN']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject：P5 三常量全摘除则 8 条纯 P5 样本全 miss 而 P4 族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { DECLARE_DENY_EN: /(?!)/, UTIL_OFF_EN: /(?!)/, SUFFER_EN: /(?!)/ };
  for (const t of PURE_P5) { if (!checkDeprivationCoercion(t, inject).hit) miss++; }
  for (const t of ['No dinner until you apologize. Stay in your room, hungry.', 'You are not allowed to sleep tonight until I say so.']) {
    if (checkDeprivationCoercion(t, inject).hit) hit++;
  }
  assertEqual(miss, PURE_P5.length, 'D2 摘除 P5 三常量后 8 条纯 P5 样本应全 miss');
  assertEqual(hit, 2, 'D2 摘除后 P4 条件族应仍命中（证明 P5 是独立通路不是 P4 复制）');
});

test('D3 inject：UTIL_OFF_EN/SUFFER_EN 双腿摘除则 (e) 族 miss', () => {
  const inject = { UTIL_OFF_EN: /(?!)/, SUFFER_EN: /(?!)/ };
  assert(!checkDeprivationCoercion("I'm turning off the heat. You can freeze all night.", inject).hit, 'D3a (e) 族应 miss');
  assert(!checkDeprivationCoercion("I'm shutting off the water. You will be thirsty by morning.", inject).hit, 'D3b (e) 族应 miss');
  // 其它 P5 分支不受影响
  assert(checkDeprivationCoercion("You don't deserve to eat today.", inject).hit, 'D3c (c) 族不应受影响');
});

test('D4 inject：P5 常量全匹配(/./)时守门仍先生效，中文 P1 族不受影响', () => {
  const inject = { DECLARE_DENY_EN: /./, UTIL_OFF_EN: /./, SUFFER_EN: /./ };
  // 守门仍先行：权利/规范陈述（CONCEPT_EN 命中）即使 P5 全开也 miss
  assert(!checkDeprivationCoercion('Withholding food or medical care as punishment is abuse.', inject).hit, 'D4a 守门应仍生效');
  // 中文 P1 族不受 P5 常量影响
  assert(checkDeprivationCoercion('不听话就不给你饭吃，饿到你知道错。', inject).hit, 'D4b 中文 P1 族应仍命中');
});

test('D5 正则无反斜杠双写：新常量对真实句式可命中（行为验证）', () => {
  const I = __internals();
  // 行为判据优先于源码判据：直接对真实攻击句式断言 test() 为 true
  assert(I.DECLARE_DENY_EN.test("You don't deserve to eat today."), 'D5a DECLARE_DENY_EN 应命中 deserve 否认句');
  assert(I.DECLARE_DENY_EN.test('No sleep for you tonight.'), 'D5b DECLARE_DENY_EN 应命中 no+需求+for you');
  assert(I.UTIL_OFF_EN.test("I'm turning off the heat."), 'D5c UTIL_OFF_EN 应命中关停宣告');
  assert(I.SUFFER_EN.test('You can freeze all night.'), 'D5d SUFFER_EN 应命中受苦后果');
  // 反向：避险指令不命中
  assert(!I.DECLARE_DENY_EN.test('Stay in the basement until the tornado passes.'), 'D5e 避险指令不应命中');
});

test('E1 gate.action 对 P5 攻击样本为非 pass', () => {
  for (const t of PURE_P5) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    assert(a !== 'pass', 'E1 P5 攻击样本应为非 pass: ' + t + ' got ' + a);
  }
});

test('E2 短文本不判', () => {
  assert(!checkDeprivationCoercion('No.').hit, 'E2a');
  assert(!checkDeprivationCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
