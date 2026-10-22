/**
 * test/round-678-legal-status-coercion.js
 *
 * [r678] 第 122 维度 legal_status_coercion（法律身份胁迫）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 20 条（探测器原始漏判 9 条 + 句式变体 11 条）、
 * 良性 15 条（探测器原始 6 条 + 权利说明/求助指引/法律程序/边界锁 9 条）、
 * 边界锁 8 条（单腿不判 ×4 / 概念规范 ×2 / 句首咨询 ×2）。
 * 探测器原始数字（scripts/round-678-family-probe.js，121 维引擎）：
 * 攻击 10 条漏判 9 条（90%）、全维度零命中 9、良性 6 条 0 误伤。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkLegalStatusCoercion, __internals } = require(path.join(HF, 'src/legal-status-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（20 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 9 条（r678 在 121 维引擎实测量：gate action === pass）
  '你敢离婚，我就让你遣返回国，你试试。',
  '在这个城市我有人，你敢走我就让你混不下去。',
  '报警？警察认识我，你告不倒我。',
  '你的签证在我手里，不听话就给你断了。',
  '离开我，我让你在这个行业永远找不到工作。',
  'If you leave, I will make sure you are deported. Remember that.',
  '你没有身份，离开我你连饭都吃不上，还敢闹？',
  '我认识法官，你打官司必输，趁早死了这条心。',
  '你的户籍材料在我这，不听话你哪儿都去不了。',
  '我去你单位闹，让所有人都知道你是什么东西。',
  // 句式变体 10 条
  '你再敢提离婚，我就去法院起诉你，让你身败名裂。',
  '护照我先扣着，你这次出差想都别想。',
  '你敢报警试试，看守所里的兄弟我都打点好了。',
  '我舅舅是律师，你告不赢的，省点力气吧。',
  '你那个绿卡是我办的，我想收回来就收回来。',
  '在这个圈子里我一句话，你就接不到任何活。',
  '明天我去你公司找你领导，谈谈你的真面目。',
  'If you try to leave, I will make sure you never work in this town again.',
  'Reporting me is useless; the police know me here.',
  'I have your passport locked up; you are not going anywhere.',
];

// ─── B 组：良性样本（15 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '移民身份不应成为亲密关系中威胁对方的筹码。',
  '威胁、恐吓他人属于违法行为，可以报警处理。',
  'Using immigration status to control a partner is a form of abuse.',
  '劳动者权益受法律保护，任何人不得非法阻碍就业。',
  '司法公正不受个人关系影响，当事人有权依法诉讼。',
  '家庭暴力受害者可以向法院申请人身安全保护令。',
  // 权利说明 / 求助指引 / 法律程序
  '护照和身份证是重要个人证件，应当妥善保管。',
  '遇到威胁时请及时报警，并保留相关证据。',
  'If you feel unsafe, contact the police or a local support organization.',
  '签证申请需要准备充分的材料，建议咨询正规移民律师。',
  '用人单位不得因员工举报违法行为而打击报复。',
  '跨国婚姻中，双方应当了解彼此的法律权利与义务。',
  'Visa applications require proper documentation and legal counsel.',
  'The court may issue a restraining order to protect victims of abuse.',
  'If you go to court, you will need to bring all the documents.',
];

// ─── C 组：边界锁（单腿不判 / 守门）────────────────────────────────
const BOUNDARY = [
  // 单腿 A：法律身份对象存在，无胁迫句式
  '签证还有三个月到期，我需要准备续签材料。',
  '法院的判决书下周下来，律师说胜算很大。',
  // 单腿 B：胁迫句式存在，无法律身份对象
  '不听话就不给你糖吃，这是家里说好的。',
  '再不写完作业，今晚就不准看电视。',
  // G1 概念/规范陈述
  '以移民身份相要挟是情感操控的常见手段，受害者应当及时求助。',
  'Using threats to control a partner is considered a form of abuse.',
  // G2 句首咨询
  '如何应对伴侣以遣返相威胁？我可以报警吗？',
  'What should I do if my partner threatens to deport me?',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：20 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkLegalStatusCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：15 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkLegalStatusCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      if (dims.length === 1 && dims[0] === 'legal_status_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 边界锁 8 条全部 miss', () => {
  let hit = 0;
  for (const t of BOUNDARY) { if (checkLegalStatusCoercion(t).hit) { hit++; console.log('  HIT(边界): ' + t); } }
  assertEqual(hit, 0, 'A5 边界锁应全部 miss');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.legal_status_coercion;
  assert(v, 'B1 dimensions 缺 legal_status_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'legal_status_coercion');
  assert(found, 'B2 findings 应含 legal_status_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/法律身份胁迫/.test(s), 'B3 summary 应含「法律身份胁迫」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'legal_status_coercion':"), 'B4 DIM_GUIDANCE 缺 legal_status_coercion 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'legal_status_coercion',"), 'B5 VERIFY_DIMS 缺 legal_status_coercion');
});

test('B6 module.exports 导出 checkLegalStatusCoercion', () => {
  assertEqual(typeof idx.checkLegalStatusCoercion, 'function', 'B6 index.js 应导出 checkLegalStatusCoercion');
});

test('B7 维度总数 122', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 122, 'B7 dimensions 键数应为 122');
});

test('B8 dimMap 登记（lsc 绑定在 dimMap 与 dimensions 各出现一次）', () => {
  // dimMap（1669 行对象）与 dimensions（return 对象）是两份独立登记表，
  // r664 教训：漏 dimMap 时 findings 的 detail 计数兜底为 1、不阻断判定，
  // 只有静态断言能守住它。要求 lsc 绑定全文恰好 2 处。
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const n = src.split('legal_status_coercion: lsc,').length - 1;
  assertEqual(n, 2, 'B8 legal_status_coercion: lsc 绑定应为 2 处（dimMap + dimensions）');
});

test('C1 边界锁：单腿 A（法律身份对象）不判', () => {
  assert(!checkLegalStatusCoercion('签证还有三个月到期，我需要准备续签材料。').hit, 'C1a');
  assert(!checkLegalStatusCoercion('法院的判决书下周下来，律师说胜算很大。').hit, 'C1b');
});

test('C2 边界锁：单腿 B（胁迫句式）不判', () => {
  assert(!checkLegalStatusCoercion('不听话就不给你糖吃，这是家里说好的。').hit, 'C2a');
  assert(!checkLegalStatusCoercion('再不写完作业，今晚就不准看电视。').hit, 'C2b');
});

test('C3 边界锁：概念/规范陈述不判（守门 CONCEPT）', () => {
  assert(!checkLegalStatusCoercion('以移民身份相要挟是情感操控的常见手段，受害者应当及时求助。').hit, 'C3a');
  assert(!checkLegalStatusCoercion('Using threats to control a partner is considered a form of abuse.').hit, 'C3b');
});

test('C4 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkLegalStatusCoercion('如何应对伴侣以遣返相威胁？我可以报警吗？').hit, 'C4a');
  assert(!checkLegalStatusCoercion('What should I do if my partner threatens to deport me?').hit, 'C4b');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['IDENT_ZH', 'IDENT_EN', 'LEGAL_ZH', 'LEGAL_EN', 'CAREER_ZH', 'CAREER_EN', 'THREAT_ZH', 'THREAT_EN', 'COND_ZH', 'COND_EN', 'BLOCKHELP_ZH', 'BLOCKHELP_EN', 'WITHHOLD_ZH', 'WITHHOLD_EN', 'CAREERLOCK_ZH', 'WORKPRESSURE_ZH', 'SURVIVAL_ZH', 'SURVIVAL_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'QUESTION_ZH', 'QUESTION_EN']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：腿 A 三组全置空则攻击全 miss', () => {
  let hit = 0;
  const inject = { IDENT_ZH: /(?!)/, IDENT_EN: /(?!)/, LEGAL_ZH: /(?!)/, LEGAL_EN: /(?!)/, CAREER_ZH: /(?!)/, CAREER_EN: /(?!)/ };
  for (const t of ATTACK) { if (checkLegalStatusCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D2 腿 A 全摘除后应 0 命中');
});

test('D3 inject 变异注入：腿 B 七组全置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  const inject = { THREAT_ZH: /(?!)/, THREAT_EN: /(?!)/, COND_ZH: /(?!)/, COND_EN: /(?!)/, BLOCKHELP_ZH: /(?!)/, BLOCKHELP_EN: /(?!)/, WITHHOLD_ZH: /(?!)/, WITHHOLD_EN: /(?!)/, CAREERLOCK_ZH: /(?!)/, WORKPRESSURE_ZH: /(?!)/, SURVIVAL_ZH: /(?!)/, SURVIVAL_EN: /(?!)/ };
  for (const t of ATTACK) { if (checkLegalStatusCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D3 腿 B 全摘除后应 0 命中');
});

test('D4 inject 变异注入：BLOCKHELP 单支摘除后求助阻断族 miss 而其他族仍 hit', () => {
  // BLOCKHELP 单通路样本（「报警？警察认识我」「我认识法官，你打官司必输」）
  const bh = ['报警？警察认识我，你告不倒我。', '我认识法官，你打官司必输，趁早死了这条心。', '我舅舅是律师，你告不赢的，省点力气吧。'];
  let miss = 0, hit = 0;
  for (const t of bh) { if (!checkLegalStatusCoercion(t, { BLOCKHELP_ZH: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkLegalStatusCoercion(t, { BLOCKHELP_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(miss, bh.length, 'D4 BLOCKHELP 摘除后求助阻断族应全 miss');
  assert(hit > 0, 'D4 BLOCKHELP 摘除后其他族应仍命中（证明各族是独立通路）');
  console.log('  BLOCKHELP 摘除后其他族仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject 变异注入：两类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { CONCEPT_ZH: /./, CONCEPT_EN: /./, QUESTION_ZH: /./, QUESTION_EN: /./ };
  for (const t of ATTACK) { if (checkLegalStatusCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D5 守门全匹配后应 0 命中');
});

test('D6 isZh 用字面端点（/[一-龿]/）：中英文 detail 各自正确', () => {
  const zh = checkLegalStatusCoercion('你敢离婚，我就让你遣返回国，你试试。');
  const en = checkLegalStatusCoercion('If you leave, I will make sure you are deported.');
  assert(/法律身份胁迫/.test(zh.detail), 'D6 中文 detail 应含「法律身份胁迫」，got: ' + zh.detail);
  assert(/legal-status-coercion/.test(en.detail), 'D6 英文 detail 应含 legal-status-coercion，got: ' + en.detail);
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkLegalStatusCoercion('短').hit, 'E2a');
  assert(!checkLegalStatusCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
