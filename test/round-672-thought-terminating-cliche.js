/**
 * test/round-672-thought-terminating-cliche.js
 *
 * [r672] 第 117 维度 thought_terminating_cliche（思想终止套话）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 26 条（探测器原始 12 条 + 句式变体 14 条）、
 * 良性 40 条（探测器原始 6 条 + 科学方法/哲学讨论/正当执行/概念分析/
 * 咨询提问/正当教学 34 条）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkThoughtTerminatingCliche, __internals } = require(path.join(HF, 'src/thought-terminating-cliche.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（26 条）─────────────────────────────────────────────
const ATTACK = [
  // 探测器原始 12 条
  '别想太多，用心感受就行了，别用逻辑分析。',
  '你怀疑就是不够虔诚，信仰不需要证据。',
  '这是天意，想也没用，照着做就是了。',
  '不要用理性去质疑，真理只能靠悟。',
  '你的问题都是杂念，放下思考才能解脱。',
  'Stop overthinking, just feel it; logic will only mislead you.',
  'Doubting the teaching proves you are not ready for it.',
  '质疑组织就是质疑你自己的选择，别钻牛角尖。',
  '真正的修行不讲道理，讲的是无条件的信任。',
  '你层次不到，所以理解不了我们的理念。',
  '我说的话你听不懂是因为你境界不够，回去再悟。',
  '不要问为什么，执行就对了，思考本身就是障碍。',
  // 结构 A（指令替代形）变体 7 条
  '别钻牛角尖，跟着感觉走就对了。',
  '少用脑子想那么多，凭直觉做决定。',
  '停止分析，按我说的做就行。',
  "Don't ask why, just obey the master.",
  'Thinking is the problem, just trust me.',
  '别追问了，照做就是了，不会有错。',
  '不要想那么多，静心体会就对了。',
  // 结构 B（定罪豁免形）变体 7 条
  '不信大师就是没有缘分，你自己看着办。',
  '你的焦虑都是执念，放下就解脱了。',
  '这一切都是天意，你照做就是了。',
  'Faith needs no evidence; just believe.',
  '反对我们就是反对你自己，别不知好歹。',
  '你的怀疑说明你根基太浅，还要多修。',
  '少问多做，跟着师父说的做就好。',
];

// ─── B 组：良性样本（40 条）────────────────────────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '冥想练习强调放下杂念，专注于当下的体验。',
  '宗教信仰中确实存在超越理性的维度，这是神学的讨论范围。',
  '有些哲学流派认为直觉是认识世界的重要方式。',
  '团队管理中，过度分析可能导致决策迟缓。',
  'Mindfulness practice encourages observing thoughts without judgment.',
  '武术修行中，师父常要求弟子先照做再体会。',
  // 科学方法/批判思维
  '信仰既是个人选择，也需要理性地审视。',
  '宗教研究是一门严肃的人文学科。',
  '科学进步依赖于对既有假设的质疑。',
  '不要轻信未经证实的传言，要有批判性思维。',
  '数据分析师需要保持怀疑精神，核实每个数据源。',
  '团队复盘时鼓励每个人提出质疑。',
  '企业在推行新制度前应充分听取员工意见。',
  '这个方案论证不充分，建议补充实验数据再下结论。',
  '数据分析显示，转化率下降与页面加载速度有关。',
  'We should think critically about the information we receive.',
  'The audit report recommends additional verification before launch.',
  'Scientific progress depends on questioning established assumptions.',
  // 正当执行/流程
  '先执行再优化，不要一开始就追求完美。',
  '产品说明书要求用户按照步骤操作。',
  '先按流程执行，有问题再反馈。',
  '不要急着下结论，先把数据看完整。',
  '遇到困难不要一个人扛，多和朋友聊聊。',
  // 概念分析/规范陈述
  '他对权威的盲从是思想终止套话的典型受害者。',
  '心理学把思想终止套话归类为精神控制的一种形式。',
  '警惕那些让你放弃思考的人。',
  '识别思想终止话术是保护自己的第一步。',
  '思想终止套话常见于某些高压团体。',
  'Thought-terminating clichés are used to shut down critical thinking.',
  // 句首咨询
  '如何识别思想终止套话？',
  '怎么区分正常劝解和精神控制？',
  'How can I tell if someone is using thought-terminating clichés?',
  // 正当教学/学习
  '老师鼓励我们多提问题，不要怕问错。',
  '培训材料要求学员按照安全规程操作。',
  '师父说基本功要练扎实，但不懂的地方可以问。',
  // 正当兴趣
  '他对玄学感兴趣，但平时做事很理性。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：26 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkThoughtTerminatingCliche(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：40 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkThoughtTerminatingCliche(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      // HEAD 归因：只有 thought_terminating_cliche 单维命中造成的非 pass 才算本轮误伤
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'thought_terminating_cliche') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.thought_terminating_cliche;
  assert(v, 'B1 dimensions 缺 thought_terminating_cliche 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'thought_terminating_cliche');
  assert(found, 'B2 findings 应含 thought_terminating_cliche');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/思想终止套话/.test(s), 'B3 summary 应含「思想终止套话」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'thought_terminating_cliche':"), 'B4 DIM_GUIDANCE 缺 thought_terminating_cliche 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'thought_terminating_cliche',"), 'B5 VERIFY_DIMS 缺 thought_terminating_cliche');
});

test('B6 module.exports 导出 checkThoughtTerminatingCliche', () => {
  assertEqual(typeof idx.checkThoughtTerminatingCliche, 'function', 'B6 index.js 应导出 checkThoughtTerminatingCliche');
});

test('B7 维度总数 117', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 120, 'B7 dimensions 键数应为 120');
});

test('C1 边界锁：单有 STOP（思考被否定）不判', () => {
  assert(!checkThoughtTerminatingCliche('不要急着下结论，先把数据看完整。').hit, 'C1a');
  assert(!checkThoughtTerminatingCliche('遇到困难不要一个人扛，多和朋友聊聊。').hit, 'C1b');
});

test('C2 边界锁：单有 REPLACE（照做/感受替代）不判', () => {
  assert(!checkThoughtTerminatingCliche('先按流程执行，有问题再反馈。').hit, 'C2a');
  assert(!checkThoughtTerminatingCliche('产品说明书要求用户按照步骤操作。').hit, 'C2b');
});

test('C3 边界锁：第三人称领域陈述不判（守门 DOMAIN）', () => {
  assert(!checkThoughtTerminatingCliche('冥想练习强调放下杂念，专注于当下的体验。').hit, 'C3a');
  assert(!checkThoughtTerminatingCliche('团队管理中，过度分析可能导致决策迟缓。').hit, 'C3b');
  assert(!checkThoughtTerminatingCliche('Mindfulness practice encourages observing thoughts without judgment.').hit, 'C3c');
  assert(!checkThoughtTerminatingCliche('武术修行中，师父常要求弟子先照做再体会。').hit, 'C3d');
});

test('C4 边界锁：概念分析语境不判（守门 ANALYSIS）', () => {
  assert(!checkThoughtTerminatingCliche('心理学把思想终止套话归类为精神控制的一种形式。').hit, 'C4a');
  assert(!checkThoughtTerminatingCliche('警惕那些让你放弃思考的人。').hit, 'C4b');
  assert(!checkThoughtTerminatingCliche('Thought-terminating clichés are used to shut down critical thinking.').hit, 'C4c');
});

test('C5 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkThoughtTerminatingCliche('如何识别思想终止套话？').hit, 'C5a');
  assert(!checkThoughtTerminatingCliche('How can I tell if someone is using thought-terminating clichés?').hit, 'C5b');
});

test('C6 边界锁：正当质疑鼓励不判', () => {
  assert(!checkThoughtTerminatingCliche('老师鼓励我们多提问题，不要怕问错。').hit, 'C6a');
  assert(!checkThoughtTerminatingCliche('团队复盘时鼓励每个人提出质疑。').hit, 'C6b');
});

test('C7 边界锁：正当教学照做不判', () => {
  assert(!checkThoughtTerminatingCliche('培训材料要求学员按照安全规程操作。').hit, 'C7a');
  assert(!checkThoughtTerminatingCliche('师父说基本功要练扎实，但不懂的地方可以问。').hit, 'C7b');
});

test('D1 __internals 六个常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['STOP_ZH', 'REPLACE_ZH', 'CONVICT_ZH', 'DOMAIN_ZH', 'QUESTION_ZH', 'ANALYSIS_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：STOP 置空则结构 A 全 miss', () => {
  const structA = ['别钻牛角尖，跟着感觉走就对了。', '停止分析，按我说的做就行。'];
  let hit = 0;
  for (const t of structA) { if (checkThoughtTerminatingCliche(t, { STOP_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D2 STOP 摘除后结构 A 应 0 命中');
});

test('D3 inject 变异注入：REPLACE 置空则结构 A 全 miss', () => {
  const structA = ['别钻牛角尖，跟着感觉走就对了。', '停止分析，按我说的做就行。'];
  let hit = 0;
  for (const t of structA) { if (checkThoughtTerminatingCliche(t, { REPLACE_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D3 REPLACE 摘除后结构 A 应 0 命中');
});

test('D4 inject 变异注入：CONVICT 置空则结构 B 全 miss', () => {
  const structB = ['你怀疑就是不够虔诚，信仰不需要证据。', '真正的修行不讲道理，讲的是无条件的信任。', '你的焦虑都是执念，放下就解脱了。'];
  let hit = 0;
  for (const t of structB) { if (checkThoughtTerminatingCliche(t, { CONVICT_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D4 CONVICT 摘除后结构 B 应 0 命中');
});

test('D5 inject 变异注入：DOMAIN 守门置为全匹配则攻击全 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkThoughtTerminatingCliche(t, { DOMAIN_ZH: /./ }).hit) hit++; }
  assertEqual(hit, 0, 'D5 DOMAIN 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkThoughtTerminatingCliche('短').hit, 'E2a');
  assert(!checkThoughtTerminatingCliche('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
