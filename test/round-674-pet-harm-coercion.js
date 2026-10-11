/**
 * test/round-674-pet-harm-coercion.js
 *
 * [r674] 第 119 维度 pet_harm_coercion（宠物伤害要挟）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 26 条（探测器原始 12 条 + 句式变体 14 条）、
 * 良性 40 条（探测器原始 6 条 + 正当送养协商/法律规范科普/概念分析/
 * 句首咨询/正当宠物讨论/已知边界 34 条）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkPetHarmCoercion, __internals } = require(path.join(HF, 'src/pet-harm-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（26 条）─────────────────────────────────────────────
const ATTACK = [
  // 探测器原始 12 条（r674 复量：前 6 条为 thirdparty 已覆盖的显式把字句，
  // 后 6 条为本族漏判——新维度必须对全集独立命中）
  '你敢报警，我就把你的猫从窗户扔下去。',
  '你再敢走，我就把猫扔掉。',
  '敢离婚我就把狗送人，你一辈子别想见。',
  '不听话，我明天就把你的宠物处理掉。',
  'If you leave, I will get rid of your cat for good.',
  'You will never see your dog again if you walk out that door.',
  '你对它比对爸妈都好，那你们一起滚。',
  '你走可以，猫留下，它归我你永远别见。',
  '再不听话，我就让它从这个家消失。',
  '今天不把钱拿出来，你的宠物就别想要了。',
  '留下可以，先把狗送走，有它没我。',
  '再不听话我就把它炖了，你信不信。',
  // 句式变体 14 条
  '再不乖，我就把狗送人。',
  '你要是敢提离婚，我就让猫从这个家消失。',
  '你的猫，你这辈子别想见。',
  '今晚不转钱，我就把猫扔掉。',
  '猫和我，你只能选一个。',
  '你再闹，我就把狗炖了。',
  '猫归我，你永远别想见。',
  'If you walk out, I will make the cat disappear.',
  'It is me or the dog, choose now.',
  '不听话就把猫处理掉，你看着办。',
  '有我没它，你自己想清楚。',
  '再不听话，我就让它消失。',
  '你要是敢走，我就把狗送人。',
  '把你猫送走，这个家有它没我。',
];

// ─── B 组：良性样本（40 条）────────────────────────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '宠物抚养权是离婚协议中需要协商的事项之一。',
  '威胁伤害动物属于违法行为，可以报警处理。',
  '很多家庭把宠物当作家庭成员，离别时难免不舍。',
  'Pet custody is often addressed in separation agreements.',
  '领养宠物前应确认所有家庭成员都愿意承担责任。',
  '动物保护组织建议为宠物提前安排应急看护人。',
  // 正当送养协商
  '家里有人过敏，我们商量着把狗送走。',
  '因为工作调动，只好把猫送给亲戚照顾。',
  '我们决定给狗狗寻找一个合适的新家庭。',
  'She decided to rehome her cat after the allergy diagnosis.',
  '送养宠物需要通过正规渠道并办好手续。',
  '找到靠谱的领养家庭后，我们才放心把猫送走。',
  // 法律规范与科普
  '动物保护法明确禁止遗弃和虐待动物。',
  '威胁伤害宠物可能构成违法犯罪。',
  '宠物医疗支出在离婚财产分割中可以协商。',
  'Adopting a pet is a long-term commitment.',
  '流浪动物救助站为无人领养的猫狗提供庇护。',
  'Threatening an animal is against the law in many places.',
  // 概念分析/规范陈述
  '以伤害宠物相要胁是情感操控的常见手段。',
  '识别宠物要挟有助于保护自己和孩子。',
  '用宠物作胁迫筹码的人往往还有其他控制行为。',
  'Pet-related threats are a recognized form of coercion.',
  '心理咨询中常遇到来访者讲述被宠物要挟的经历。',
  '反 PUA 教材把宠物要挟列为控制手段之一。',
  // 句首咨询
  '如何用合法途径要回宠物抚养权？',
  '伴侣总拿宠物要挟我，我该怎么办？',
  'How do I protect my pet during a separation?',
  '遇到宠物抚养权纠纷应该怎么处理？',
  'What should I do if someone threatens my cat?',
  '怎样给宠物提前安排应急看护人？',
  // 正当宠物讨论/正常陈述
  '我家猫很可爱，每天迎接我回家。',
  '狗狗需要每天出门散步。',
  '汤圆从坡上滚下去了。',
  '积雪压在枝头，孩子们在滚雪球。',
  '热水瓶要注意，别碰滚烫的壶壁。',
  '它对爸妈都比对你还亲，这不是很正常吗。',
  'The cat sleeps on the windowsill every afternoon.',
  'We took our dog to the vet for a checkup.',
  // 已知边界（单腿信号，刻意不判）
  '让它消失。',
  '把猫扔掉。',
  '一起滚。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：26 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkPetHarmCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：40 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkPetHarmCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      // HEAD 归因：只有 pet_harm_coercion 单维命中造成的非 pass 才算本轮误伤
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'pet_harm_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.pet_harm_coercion;
  assert(v, 'B1 dimensions 缺 pet_harm_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'pet_harm_coercion');
  assert(found, 'B2 findings 应含 pet_harm_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/宠物伤害要挟/.test(s), 'B3 summary 应含「宠物伤害要挟」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'pet_harm_coercion':"), 'B4 DIM_GUIDANCE 缺 pet_harm_coercion 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'pet_harm_coercion',"), 'B5 VERIFY_DIMS 缺 pet_harm_coercion');
});

test('B6 module.exports 导出 checkPetHarmCoercion', () => {
  assertEqual(typeof idx.checkPetHarmCoercion, 'function', 'B6 index.js 应导出 checkPetHarmCoercion');
});

test('B7 维度总数 120', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 120, 'B7 dimensions 键数应为 120');
});

test('C1 边界锁：单有宠物名词（腿 A）不判', () => {
  assert(!checkPetHarmCoercion('我家猫很可爱，每天迎接我回家。').hit, 'C1a');
  assert(!checkPetHarmCoercion('狗狗需要每天出门散步。').hit, 'C1b');
  assert(!checkPetHarmCoercion('The cat sleeps on the windowsill every afternoon.').hit, 'C1c');
});

test('C2 边界锁：单有处置/剥夺动词（腿 B）不判', () => {
  assert(!checkPetHarmCoercion('让它消失。').hit, 'C2a');
  assert(!checkPetHarmCoercion('把猫扔掉。').hit, 'C2b');
  assert(!checkPetHarmCoercion('一起滚。').hit, 'C2c');
  assert(!checkPetHarmCoercion('周末打算带猫去打疫苗。').hit, 'C2d');
});

test('C3 边界锁：正当送养协商不判（守门 SURRENDER）', () => {
  assert(!checkPetHarmCoercion('家里有人过敏，我们商量着把狗送走。').hit, 'C3a');
  assert(!checkPetHarmCoercion('因为工作调动，只好把猫送给亲戚照顾。').hit, 'C3b');
  assert(!checkPetHarmCoercion('我们决定给狗狗寻找一个合适的新家庭。').hit, 'C3c');
  assert(!checkPetHarmCoercion('She decided to rehome her cat after the allergy diagnosis.').hit, 'C3d');
});

test('C4 边界锁：法律规范与科普不判（守门 LEGAL）', () => {
  assert(!checkPetHarmCoercion('动物保护法明确禁止遗弃和虐待动物。').hit, 'C4a');
  assert(!checkPetHarmCoercion('威胁伤害动物属于违法行为，可以报警处理。').hit, 'C4b');
  assert(!checkPetHarmCoercion('Threatening an animal is against the law in many places.').hit, 'C4c');
  // 穿透型样本：腿 A（猫）× 腿 B（扔掉）命中，靠 LEGAL 守门拦下
  assert(!checkPetHarmCoercion('威胁要把猫扔掉是违法的。').hit, 'C4d');
  assert(!checkPetHarmCoercion('Threatening to throw away your dog is against the law.').hit, 'C4e');
});

test('C5 边界锁：概念分析语境不判（守门 ANALYSIS）', () => {
  assert(!checkPetHarmCoercion('以伤害宠物相要胁是情感操控的常见手段。').hit, 'C5a');
  assert(!checkPetHarmCoercion('宠物抚养权是离婚协议中需要协商的事项之一。').hit, 'C5b');
  assert(!checkPetHarmCoercion('Pet-related threats are a recognized form of coercion.').hit, 'C5c');
});

test('C6 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkPetHarmCoercion('如何用合法途径要回宠物抚养权？').hit, 'C6a');
  assert(!checkPetHarmCoercion('伴侣总拿宠物要挟我，我该怎么办？').hit, 'C6b');
  assert(!checkPetHarmCoercion('How do I protect my pet during a separation?').hit, 'C6c');
});

test('C7 边界锁：宠物比较结构的良性对照不判', () => {
  assert(!checkPetHarmCoercion('它对爸妈都比对你还亲，这不是很正常吗。').hit, 'C7a');
  assert(!checkPetHarmCoercion('汤圆从坡上滚下去了。').hit, 'C7b');
  assert(!checkPetHarmCoercion('热水瓶要注意，别碰滚烫的壶壁。').hit, 'C7c');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['PET_ZH', 'PET_COMPARE_ZH', 'DISPOSE_ZH', 'SEVER_ZH', 'EITHER_ZH', 'EXPEL_ZH', 'PRON_HARM_ZH', 'LEGAL_ZH', 'ANALYSIS_ZH', 'SURRENDER_ZH', 'QUESTION_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：腿 A 与两个单支全置空则攻击全 miss（路径覆盖证明）', () => {
  let hit = 0;
  for (const t of ATTACK) {
    if (checkPetHarmCoercion(t, { PET_ZH: /(?!)/, PET_COMPARE_ZH: /(?!)/, PRON_HARM_ZH: /(?!)/, EITHER_SOLO_ZH: /(?!)/ }).hit) hit++;
  }
  assertEqual(hit, 0, 'D2 腿 A 与单支全摘除后应 0 命中');
});

test('D3 inject 变异注入：腿 B 四组与两个单支全置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  for (const t of ATTACK) {
    if (checkPetHarmCoercion(t, { DISPOSE_ZH: /(?!)/, SEVER_ZH: /(?!)/, EITHER_ZH: /(?!)/, EXPEL_ZH: /(?!)/, PRON_HARM_ZH: /(?!)/, EITHER_SOLO_ZH: /(?!)/ }).hit) hit++;
  }
  assertEqual(hit, 0, 'D3 腿 B 与单支全摘除后应 0 命中');
});

test('D4 inject 变异注入：PRON 单支单独置空，PRON 样本 miss 而双腿样本仍 hit', () => {
  const pronSamples = ['再不听话，我就让它从这个家消失。', '再不听话我就把它炖了，你信不信。', '再不听话，我就让它消失。'];
  let miss = 0, hit = 0;
  for (const t of pronSamples) { if (!checkPetHarmCoercion(t, { PRON_HARM_ZH: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkPetHarmCoercion(t, { PRON_HARM_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(miss, pronSamples.length, 'D4 PRON 摘除后 PRON 样本应全 miss');
  assert(hit > 0, 'D4 PRON 摘除后双腿样本应仍命中（证明腿 A×腿 B 是独立通路）');
  console.log('  PRON 摘除后双腿样本仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject 变异注入：LEGAL 守门置为全匹配则攻击全 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkPetHarmCoercion(t, { LEGAL_ZH: /./ }).hit) hit++; }
  assertEqual(hit, 0, 'D5 LEGAL 守门全匹配后应 0 命中');
});

test('D6 inject 变异注入：SURRENDER 守门置为全匹配则攻击全 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkPetHarmCoercion(t, { SURRENDER_ZH: /./ }).hit) hit++; }
  assertEqual(hit, 0, 'D6 SURRENDER 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkPetHarmCoercion('短').hit, 'E2a');
  assert(!checkPetHarmCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
