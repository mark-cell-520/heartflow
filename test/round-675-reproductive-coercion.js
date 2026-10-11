/**
 * test/round-675-reproductive-coercion.js
 *
 * [r675] 第 120 维度 reproductive_coercion（生育胁迫）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 25 条（探测器原始漏判 7 条 + 同族已覆盖 1 条 + 句式
 * 变体 17 条）、良性 26 条（探测器原始 6 条 + 正当生育讨论/医学咨询/
 * 概念分析/句首咨询/边界锁 20 条）、既有维度覆盖族 5 条（gate 层
 * 非 pass，新维度不要求单维命中）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkReproductiveCoercion, __internals } = require(path.join(HF, 'src/reproductive-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（25 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 7 条（r675 在 119 维引擎复量：gate action === pass）
  '怀了孕我才娶你，这是规矩。',
  '你先把工作辞了，孩子生下来再说。',
  '不生个儿子，你在我们家永远抬不起头。',
  'You will not be a real woman until you give me a child.',
  '不生孩子就离婚，我找别人生。',
  '你敢把孩子打掉，我这辈子都不会原谅你。',
  "A real wife puts her husband's family line first.",
  // 同族已被 fallacies 覆盖的 1 条（B3 词表含「不孝」后新维度亦独立命中）
  '你不生孩子就是不孝，我们家就断后了。',
  // B1 婚姻条件化变体 3 条
  '怀孕了才肯领证，少一分彩礼都不行。',
  '等她生了儿子再过门，这是老规矩。',
  'I will only marry you after you give birth to a son.',
  // B2 关系终止要挟变体 3 条
  '不生出儿子就离婚，你自己选。',
  '再不生二胎，咱们就散。',
  "If you don't give me a child, I will find someone who will.",
  // B3 价值否定绑定变体 5 条
  '生不出儿子，你在婆家永远抬不起头。',
  '不生孩子，你算什么女人。',
  '没生儿子，她一辈子在村里直不起腰。',
  'Until you bear a son, you are not a complete woman.',
  'A true wife always puts the family line first.',
  // B4 终止妊娠禁止 + 情感惩罚变体 2 条
  '你敢去堕胎，我这辈子都不会原谅你。',
  '要是敢流掉孩子，你永远别回来。',
  // B5 牺牲要求变体 4 条
  '你先把工作辞了，安心在家生孩子。',
  '你必须放弃事业，孩子生下来要紧。',
  '你就在家生孩子带孩子，别的事不用管。',
  'You should quit your job and stay home to have the baby.',
];

// ─── B 组：良性样本（26 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '生育意愿是伴侣双方需要充分沟通的重要议题。',
  '家庭中关于生育的决策应尊重双方的身体自主权。',
  '婚前讨论生育计划有助于减少婚后矛盾。',
  'Reproductive choices should be made jointly and freely.',
  '长辈对家族延续的期待需要理解但不应成为压力。',
  '生育健康咨询可以帮助伴侣做出合适的选择。',
  // 正当生育讨论与个人选择
  '不结婚也可以生孩子，这是个人选择。',
  '很多夫妻选择丁克，不生孩子也过得很幸福。',
  '父母催婚催育是常见的社会现象。',
  '我们把生育计划推迟到事业稳定之后。',
  'We discussed our childbearing plans before marriage.',
  // 医学与健康咨询
  '产检记录要妥善保存。',
  '不孕不育可以寻求辅助生殖技术帮助。',
  '产前检查可以筛查胎儿的发育异常。',
  '哺乳期妈妈需要注意营养均衡。',
  '试管婴儿技术帮助很多不孕夫妇圆了父母梦。',
  // 概念分析与规范陈述
  '生育胁迫是违法行为，受害者可以报警。',
  'Reproductive coercion is recognized as a form of abuse.',
  '以生育相要挟是情感操控的常见手段。',
  // 句首咨询
  '如何判断自己是否遭遇生育胁迫？',
  'How is reproductive coercion defined in psychology?',
  // 边界锁：单腿信号
  '她是这家公司的唯一法定继承人。',
  '孩子生下来要按时接种疫苗。',
  '她怀孕后辞掉了工作，因为孕反应很严重。',
  '生完孩子我打算辞职休息半年，在家带娃。',
];

// ─── E 组：既有维度覆盖族（5 条，新维度不要求单维命中，gate 层应非 pass）
const COVERED = [
  '我妈说两年内必须抱上孙子，你自己看着办。',
  '你要是真爱我，就会愿意为我生个孩子。',
  '你年龄再大就生不出来了，现在必须听我的。',
  '我妈说了，孩子必须跟她姓，不然就别进这个门。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：25 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkReproductiveCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：26 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkReproductiveCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      if (dims.length === 1 && dims[0] === 'reproductive_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 既有维度覆盖族 gate 层仍非 pass（不因新维度降级）', () => {
  let pass = 0;
  for (const t of COVERED) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'pass') { pass++; console.log('  PASS: ' + t); }
  }
  assertEqual(pass, 0, 'A5 既有覆盖族不应退化为 pass');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.reproductive_coercion;
  assert(v, 'B1 dimensions 缺 reproductive_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'reproductive_coercion');
  assert(found, 'B2 findings 应含 reproductive_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/生育胁迫/.test(s), 'B3 summary 应含「生育胁迫」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'reproductive_coercion':"), 'B4 DIM_GUIDANCE 缺 reproductive_coercion 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'reproductive_coercion',"), 'B5 VERIFY_DIMS 缺 reproductive_coercion');
});

test('B6 module.exports 导出 checkReproductiveCoercion', () => {
  assertEqual(typeof idx.checkReproductiveCoercion, 'function', 'B6 index.js 应导出 checkReproductiveCoercion');
});

test('B7 维度总数 120', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 120, 'B7 dimensions 键数应为 120');
});

test('C1 边界锁：单有生育语境（腿 A）不判', () => {
  assert(!checkReproductiveCoercion('生育意愿是伴侣双方需要充分沟通的重要议题。').hit, 'C1a');
  assert(!checkReproductiveCoercion('孩子生下来要按时接种疫苗。').hit, 'C1b');
  assert(!checkReproductiveCoercion('她是这家公司的唯一法定继承人。').hit, 'C1c');
  assert(!checkReproductiveCoercion('The heir to the company announced the merger.').hit, 'C1d');
});

test('C2 边界锁：单有绑定结构（腿 B 形状）不判', () => {
  assert(!checkReproductiveCoercion('不听话就离婚，这日子没法过了。').hit, 'C2a');
  assert(!checkReproductiveCoercion('先把旧版本删了再说。').hit, 'C2b');
  assert(!checkReproductiveCoercion('不提交代码就别想下班。').hit, 'C2c');
});

test('C3 边界锁：医学与健康咨询不判（守门 MEDICAL）', () => {
  assert(!checkReproductiveCoercion('生育健康咨询可以帮助伴侣做出合适的选择。').hit, 'C3a');
  assert(!checkReproductiveCoercion('产前检查可以筛查胎儿的发育异常。').hit, 'C3b');
  assert(!checkReproductiveCoercion('不孕不育可以寻求辅助生殖技术帮助。').hit, 'C3c');
  // 穿透型样本：腿 A（怀孕）× 腿 B（才娶）命中，靠 MEDICAL 守门拦下
  assert(!checkReproductiveCoercion('怀孕了才去医院建卡，医生说要趁早。').hit, 'C3d');
});

test('C4 边界锁：概念分析语境不判（守门 ANALYSIS）', () => {
  assert(!checkReproductiveCoercion('生育胁迫是违法行为，受害者可以报警。').hit, 'C4a');
  assert(!checkReproductiveCoercion('Reproductive coercion is recognized as a form of abuse.').hit, 'C4b');
  assert(!checkReproductiveCoercion('以生育相要挟是情感操控的常见手段。').hit, 'C4c');
});

test('C5 边界锁：正当生育讨论不判（守门 LEGIT）', () => {
  assert(!checkReproductiveCoercion('生育意愿是伴侣双方需要充分沟通的重要议题。').hit, 'C5a');
  assert(!checkReproductiveCoercion('Reproductive choices should be made jointly and freely.').hit, 'C5b');
  assert(!checkReproductiveCoercion('家庭中关于生育的决策应尊重双方的身体自主权。').hit, 'C5c');
});

test('C6 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkReproductiveCoercion('如何判断自己是否遭遇生育胁迫？').hit, 'C6a');
  assert(!checkReproductiveCoercion('How is reproductive coercion defined in psychology?').hit, 'C6b');
});

test('C7 边界锁：姓名绑定非生育（腿 A 不含姓氏）', () => {
  // 既有维度已拦（thirdparty_harm_coercion），新维度单维不命中
  assert(!checkReproductiveCoercion('我妈说了，孩子必须跟她姓，不然就别进这个门。').hit, 'C7a');
});

test('C8 边界锁：自主辞职计划非胁迫（B5 祈使词必填）', () => {
  assert(!checkReproductiveCoercion('生完孩子我打算辞职休息半年，在家带娃。').hit, 'C8a');
  assert(!checkReproductiveCoercion('她怀孕后辞掉了工作，因为孕反应很严重。').hit, 'C8b');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['PREG_ZH', 'REPRO_ACT_ZH', 'ABORT_ZH', 'INFERTILE_ZH', 'REPRO_EN', 'MARRIAGE_COND_ZH', 'SEVERANCE_COND_ZH', 'VALUE_BIND_ZH', 'ABORT_BAN_ZH', 'SACRIFICE_ZH', 'MEDICAL_ZH', 'ANALYSIS_ZH', 'LEGIT_ZH', 'QUESTION_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：腿 A 五组全置空则攻击全 miss', () => {
  let hit = 0;
  const inject = { PREG_ZH: /(?!)/, REPRO_ACT_ZH: /(?!)/, ABORT_ZH: /(?!)/, INFERTILE_ZH: /(?!)/, REPRO_EN: /(?!)/ };
  for (const t of ATTACK) { if (checkReproductiveCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D2 腿 A 全摘除后应 0 命中');
});

test('D3 inject 变异注入：腿 B 五组全置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  const inject = { MARRIAGE_COND_ZH: /(?!)/, SEVERANCE_COND_ZH: /(?!)/, VALUE_BIND_ZH: /(?!)/, ABORT_BAN_ZH: /(?!)/, SACRIFICE_ZH: /(?!)/ };
  for (const t of ATTACK) { if (checkReproductiveCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D3 腿 B 全摘除后应 0 命中');
});

test('D4 inject 变异注入：B1 单支摘除后 B1 样本 miss 而其他族仍 hit', () => {
  const b1 = ['怀了孕我才娶你，这是规矩。', '怀孕了才肯领证，少一分彩礼都不行。', '等她生了儿子再过门，这是老规矩。'];
  let miss = 0, hit = 0;
  for (const t of b1) { if (!checkReproductiveCoercion(t, { MARRIAGE_COND_ZH: /(?!)/ }).hit) miss++; }
  for (const t of ATTACK) { if (checkReproductiveCoercion(t, { MARRIAGE_COND_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(miss, b1.length, 'D4 B1 摘除后 B1 样本应全 miss');
  assert(hit > 0, 'D4 B1 摘除后其他族应仍命中（证明各族是独立通路）');
  console.log('  B1 摘除后其他族仍命中 ' + hit + '/' + ATTACK.length);
});

test('D5 inject 变异注入：B4 单支摘除后 B4 样本 miss', () => {
  const b4 = ['你敢把孩子打掉，我这辈子都不会原谅你。', '你敢去堕胎，我这辈子都不会原谅你。', '要是敢流掉孩子，你永远别回来。'];
  let miss = 0;
  for (const t of b4) { if (!checkReproductiveCoercion(t, { ABORT_BAN_ZH: /(?!)/ }).hit) miss++; }
  assertEqual(miss, b4.length, 'D5 B4 摘除后 B4 样本应全 miss');
});

test('D6 inject 变异注入：四类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { MEDICAL_ZH: /./, ANALYSIS_ZH: /./, LEGIT_ZH: /./, QUESTION_ZH: /./ };
  for (const t of ATTACK) { if (checkReproductiveCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D6 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkReproductiveCoercion('短').hit, 'E2a');
  assert(!checkReproductiveCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
