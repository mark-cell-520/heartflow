/**
 * test/round-680-medical-coercion.js
 *
 * [r680] 第 124 维度 medical_coercion（医疗自主胁迫）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 20 条（探测器原始漏判 8 条 + 句式变体 12 条，覆盖
 * P1/P2/P2c/P3/P4/P5 六条通路）、良性 15 条（探测器原始 6 条 +
 * 医嘱/权利/术前禁食/自述/提问边界 9 条）、边界锁 9 条（单腿不判 ×5 /
 * 概念规范 ×2 / 句首咨询 ×2）。
 * 探测器原始数字（scripts/round-680-family-probe.js，123 维引擎复量）：
 * 攻击 10 条漏判 8 条（80%）、全维度零命中 8、良性 6 条 0 误伤。
 * 另 2 条分别被 liberty_restriction / sarcasm 判 verify，新维度仍命中。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkMedicalCoercion, __internals } = require(path.join(HF, 'src/medical-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（20 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 8 条（r680 在 123 维引擎实测量：gate action === pass）
  '不许你去医院，那些医生都是骗子。',                          // P1
  '我让你停药你就得停，不吃出问题我负责。',                    // P2
  '信我的方子，再敢偷偷买药我打断你的腿。',                    // P2c + P3
  '你抑郁症就是矫情，不许看心理医生。',                        // P1
  '这个孩子必须信教治病，打针吃药都不许。',                    // P1 + P2c
  'Do not see a doctor; faith alone will cure you, trust me.', // P1 + P2c(en)
  '怀孕了也不许产检，我们家族都是这么生的。',                  // P1
  '你的病都是自己想出来的，回去睡觉就好。',                    // P5
  // 另 2 条探测器样本（分别被 liberty_restriction / sarcasm verify，新维度应同时命中）
  '我把你的医保卡和药都锁起来了，你急也没用。',                // P4
  '医生说的话你敢信？再提去医院就滚出去。',                    // P3
  // 句式变体 10 条（同族不同句式：语序/口语把字句/英文变体）
  '从今天起禁止吃任何药。',                                    // P1 通用形
  '产检别想了，我们没钱。',                                    // P1 语序 B
  '听我的，把药停了，那个没什么用。',                          // P2 把字句
  '我说了算，你的治疗方案由我定。',                            // P2 单方管辖
  'I told you to stop taking your medication, now do it.',     // P2(en)
  'You will do as I say about your treatment.',                // P2(en)
  'God will heal you, hospitals are a scam.',                  // P2c(en)
  '再敢提看心理医生，我就把你手机砸了。',                      // P3
  '你的病历和处方我都收走了，急什么。',                        // P4
  '你就是懒，不是抑郁，回去睡觉就行。',                        // P5 松腿×强阻断
];

// ─── B 组：良性样本（15 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '患者有权自主选择医疗机构和治疗方案。',
  '监护人应当为未成年人提供必要的医疗救治。',
  'Patients have the right to refuse treatment after informed consent.',
  '延误治疗可能加重病情，身体不适应及时就医。',
  '医保卡由本人保管，任何人不得非法扣押。',
  '宗教信仰自由，但不得以此拒绝必要的医疗救助。',
  // 医嘱 / 医疗流程 / 自述 / 提问边界 9 条
  '这个药不能停，要按疗程服完。',
  '术前禁食禁水，第二天早上不要吃饭。',
  '体检前需要空腹，忌饮酒。',
  '身体不适应及时就医，不要拖延。',
  '建议尽快去医院做个检查。',
  '我把药停了两个月，感觉好多了。',
  '她自己停药了，因为副作用太大。',
  '如何说服家人去医院看病？',
  'What should I do if my partner refuses to see a doctor?',
];

// ─── C 组：边界锁（单腿不判 / 守门）────────────────────────────────
const BOUNDARY = [
  // P1 单腿：禁止动词但对象非医疗（宿舍规定）
  '不许抽烟，这是宿舍规定。',
  // P2 单腿：医疗覆决定但无控制者嗓音（自述）
  '他自己把药停了，没告诉任何人。',
  // P5 松腿单出现：医生安慰（无强阻断腿）
  '你没病，注意观察几天，有变化再来。',
  '他没病，不用治了，回家吧。',
  // P4 无归属标记（医院正当保管）
  '医院把病历锁在档案室里，防止丢失。',
  // P3 单腿：威胁但无医疗行为
  '再敢乱来，我就揍你。',
  // 概念/规范陈述（守门 G1/G2）
  '非法扣押他人医保卡属于违法行为。',
  '宗教信仰自由受法律保护，任何人不得干涉。',
  // 句首咨询提问（守门 G4）
  '该不该带父母做体检？',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：20 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkMedicalCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：15 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkMedicalCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
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

test('A4 gate 层良性零 block/rewrite（除既有维度既有行为）', () => {
  let bad = 0;
  const attributed = [];
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'block' || a === 'rewrite') {
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'medical_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 边界锁 9 条全部 miss', () => {
  let hit = 0;
  for (const t of BOUNDARY) { if (checkMedicalCoercion(t).hit) { hit++; console.log('  HIT(边界): ' + t); } }
  assertEqual(hit, 0, 'A5 边界锁应全部 miss');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.medical_coercion;
  assert(v, 'B1 dimensions 缺 medical_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'medical_coercion');
  assert(found, 'B2 findings 应含 medical_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/医疗自主胁迫/.test(s), 'B3 summary 应含「医疗自主胁迫」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'medical_coercion':"), 'B4 DIM_GUIDANCE 缺 medical_coercion 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'medical_coercion',"), 'B5 VERIFY_DIMS 缺 medical_coercion');
});

test('B6 module.exports 导出 checkMedicalCoercion', () => {
  assertEqual(typeof idx.checkMedicalCoercion, 'function', 'B6 index.js 应导出 checkMedicalCoercion');
});

test('B7 维度总数 124', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 124, 'B7 dimensions 键数应为 124');
});

test('B8 dimMap 登记（mdc 绑定在 dimMap 与 dimensions 各出现一次）', () => {
  // dimMap 与 dimensions 是两份独立登记表（r664 教训：漏 dimMap 时 detail
  // 计数兜底为 1、不阻断判定，只有静态断言能守住）。要求 mdc 绑定全文恰好 2 处。
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const n = src.split('medical_coercion: mdc,').length - 1;
  assertEqual(n, 2, 'B8 medical_coercion: mdc 绑定应为 2 处（dimMap + dimensions）');
});

test('C1 边界锁：P1 单腿（禁止动词 + 非医疗对象）不判', () => {
  assert(!checkMedicalCoercion('不许抽烟，这是宿舍规定。').hit, 'C1a');
});

test('C2 边界锁：P2 单腿（医疗覆决定无控制者嗓音）不判', () => {
  assert(!checkMedicalCoercion('他自己把药停了，没告诉任何人。').hit, 'C2a');
});

test('C3 边界锁：P5 松腿单出现（医生安慰无强阻断）不判', () => {
  assert(!checkMedicalCoercion('你没病，注意观察几天，有变化再来。').hit, 'C3a');
  assert(!checkMedicalCoercion('他没病，不用治了，回家吧。').hit, 'C3b');
});

test('C4 边界锁：P4 无归属标记（医院正当保管）不判', () => {
  assert(!checkMedicalCoercion('医院把病历锁在档案室里，防止丢失。').hit, 'C4a');
});

test('C5 边界锁：P3 单腿（威胁无医疗行为）不判', () => {
  assert(!checkMedicalCoercion('再敢乱来，我就揍你。').hit, 'C5a');
});

test('C6 边界锁：概念/规范陈述不判（守门 CONCEPT）', () => {
  assert(!checkMedicalCoercion('非法扣押他人医保卡属于违法行为。').hit, 'C6a');
  assert(!checkMedicalCoercion('宗教信仰自由受法律保护，任何人不得干涉。').hit, 'C6b');
});

test('C7 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkMedicalCoercion('该不该带父母做体检？').hit, 'C7a');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['FORBID_ZH', 'FORBID_EN', 'OVERRIDE_VOICE_ZH', 'MEDICAL_OVERRIDE_ZH', 'RITUAL_ZH', 'OVERRIDE_VOICE_EN', 'MEDICAL_OVERRIDE_EN', 'RITUAL_EN', 'BLOCK_THREAT_ZH', 'BLOCK_THREAT_EN', 'RESOURCE_ZH', 'RESOURCE_EN', 'DENY_ILL_ZH', 'DENY_ILL_LOOSE_ZH', 'DENY_CARE_ZH', 'DENY_CARE_STRONG_ZH', 'DENY_ILL_EN', 'DENY_CARE_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'QUESTION_ZH', 'QUESTION_EN']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject：P1/P2c/P3/P4 四组全摘除则独立通路族 miss 而 P2/P5 族仍 hit', () => {
  // P1/P2c/P3/P4 与 P2/P5 是独立通路（强制医疗决定与病情否定不依赖
  // 禁止动词/替代疗法/阻断威胁/资源控制词），摘前四组只应放倒对应族。
  let miss = 0, hit = 0;
  const inject = {
    FORBID_ZH: /(?!)/, FORBID_EN: /(?!)/,
    RITUAL_ZH: /(?!)/, RITUAL_EN: /(?!)/,
    BLOCK_THREAT_ZH: /(?!)/, BLOCK_THREAT_EN: /(?!)/,
    RESOURCE_ZH: /(?!)/, RESOURCE_EN: /(?!)/,
  };
  for (const t of ATTACK) { if (!checkMedicalCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D2 前四组全摘除后应有 miss');
  assert(hit > 0, 'D2 摘除后 P2/P5 族应仍命中（证明各族是独立通路）');
  console.log('  P1/P2c/P3/P4 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D3 inject：P2/P5 相关组全摘除则双腿族 miss 而 P1/P2c/P3/P4 族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = {
    OVERRIDE_VOICE_ZH: /(?!)/, OVERRIDE_VOICE_EN: /(?!)/,
    MEDICAL_OVERRIDE_ZH: /(?!)/, MEDICAL_OVERRIDE_EN: /(?!)/,
    DENY_ILL_ZH: /(?!)/, DENY_ILL_LOOSE_ZH: /(?!)/,
    DENY_CARE_ZH: /(?!)/, DENY_CARE_STRONG_ZH: /(?!)/,
    DENY_ILL_EN: /(?!)/, DENY_CARE_EN: /(?!)/,
  };
  for (const t of ATTACK) { if (!checkMedicalCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D3 双腿族相关组全摘除后应有 miss');
  assert(hit > 0, 'D3 摘除后 P1/P2c/P3/P4 族应仍命中（证明各族是独立通路）');
  console.log('  P2/P5 相关组摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D4 inject：OVERRIDE_VOICE 单支摘除后 P2 单通路样本 miss 而其他族仍 hit', () => {
  // P2 单通路样本（控制者嗓音 × 医疗覆决定，不触及其他五组通路）
  const p2 = ['听我的，把药停了，那个没什么用。', '我说了算，你的治疗方案由我定。', 'I told you to stop taking your medication, now do it.'];
  let miss = 0, hit = 0;
  for (const t of p2) { if (!checkMedicalCoercion(t, { OVERRIDE_VOICE_ZH: /(?!)/, OVERRIDE_VOICE_EN: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkMedicalCoercion(t, { OVERRIDE_VOICE_ZH: /(?!)/, OVERRIDE_VOICE_EN: /(?!)/ }).hit) hit++; }
  assertEqual(miss, p2.length, 'D4 OVERRIDE_VOICE 摘除后 P2 样本应全 miss');
  assert(hit > 0, 'D4 OVERRIDE_VOICE 摘除后其他族应仍命中（证明各族是独立通路）');
  console.log('  OVERRIDE_VOICE 摘除后其他族仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject：三类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { CONCEPT_ZH: /./, CONCEPT_EN: /./, QUESTION_ZH: /./, QUESTION_EN: /./ };
  for (const t of ATTACK) { if (checkMedicalCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D5 守门全匹配后应 0 命中');
});

test('D6 isZh 用字面端点（/[一-龿]/）：中英文 detail 各自正确', () => {
  const zh = checkMedicalCoercion('不许你去医院，那些医生都是骗子。');
  const en = checkMedicalCoercion('Do not see a doctor; faith alone will cure you, trust me.');
  assert(/医疗自主胁迫/.test(zh.detail), 'D6 中文 detail 应含「医疗自主胁迫」，got: ' + zh.detail);
  assert(/medical-coercion/.test(en.detail), 'D6 英文 detail 应含 medical-coercion，got: ' + en.detail);
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkMedicalCoercion('短').hit, 'E2a');
  assert(!checkMedicalCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
