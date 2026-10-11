/**
 * test/round-682-substance-coercion.js
 *
 * [r682] 第 126 维度 substance_coercion（成瘾物质强迫）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 29 条（探测器原始漏判 7 条 + 另 3 条 + 句式变体
 * 13 条 + 英文 6 条，覆盖 P1/P2/P3/P4/P5/P5b 六条通路）、良性 30 条
 * （探测器原始 6 条 + 医疗流程 3 + 英文良性 6 + 日常生活 15）、
 * 边界锁 9 条（单腿不判 ×3 / 守门 ×2 / 家人劝戒方向 / 禁止非强制 /
 * 规范陈述）。
 * 探测器原始数字（/tmp/hf-scout-682.js，125 维引擎复量）：
 * 攻击 10 条漏判 7 条（70%）、全维度零命中 6、良性 6 条 0 误伤。
 * decision 本体选出 A 族（composite_score 0.92 / confidence 0.9）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSubstanceCoercion, __internals } = require(path.join(HF, 'src/substance-coercion.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A 组：攻击样本（29 条，新维度必须独立命中）──────────────────────
const ATTACK = [
  // 探测器原始漏判 7 条（r682 在 125 维引擎实测量：gate action === pass）
  '不把这瓶酒喝了你就别想出门',                    // P1
  '你敢不抽这支烟，我们就分手',                    // P1
  '今天必须把这袋东西吸完，不然没收你手机',        // P2
  '你要是不碰这个，就不是我兄弟',                  // P3
  '我限你半小时内把药片全部吞下去',                // P1(a)
  '不喝酒就是不给我面子，今天你必须喝',            // P3+P2
  '你不吸就是不尊重大家，全员都在吸',              // P3
  // 探测器另 3 条（被既有维度 verify，新维度仍应命中）
  '这杯加了料的你必须喝，别问是什么',              // P2
  '明天开始每天必须抽两根，少一根都不行',          // P2+COND(少)
  '你要是敢戒毒，我就把你的事抖出去',              // P4
  // P1 句式变体 4 条
  '不喝完这杯酒谁也别想走',
  '除非把这瓶酒喝了，不然不准离开',
  '你要是不干了这杯，就是看不起我',
  '再不吸一口，你就别想拿到货',
  // P2 句式变体 3 条
  '现在马上把这杯酒给我喝了',
  '我限你十分钟内把这片吞了',
  '今晚必须把这些药全部吃掉',
  // P3 句式变体 3 条
  '不抽烟就是不够义气',
  '不喝就是不把我当兄弟',
  '大家一起吸，你不吸就是不合群',
  // P4 句式变体 3 条
  '你要是敢停，我就把照片曝光',
  '再敢拒绝，我让你好看',
  '倘若敢不喝，我打断你的牙',
  // 英文通路 6 条
  'If you do not drink this, we are done.',            // P5
  'You must finish this bottle right now.',            // P5b
  'No one here respects someone who refuses to smoke.', // P3en
  'Take these pills now or I will tell everyone your secret.', // P5(or I will)
  'If you dare to quit, I will expose you.',           // P4en
  'Smoke this or you are not my friend anymore.',      // P5
];

// ─── B 组：良性样本（30 条，新维度必须 miss）────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '医生建议他逐步减少饮酒量',
  '戒烟第 30 天，他的身体好多了',
  '禁毒宣传走进校园，学生认识毒品危害',
  '他自愿参加了戒酒互助会',
  '法律规定未成年人禁止购买烟酒',
  '适量饮酒有益健康是有争议的说法',
  // 医疗与流程语境（守门 G1）3 条
  '术前需要禁食禁水，这是为了防止麻醉意外',
  '服药期间医生要求定期复诊',
  '医嘱要求这瓶药水一天喝三次',
  // 英文良性 6 条
  'The doctor advised him to cut down on alcohol gradually.',
  'Quitting smoking improved his health significantly.',
  'Anti-drug education in schools is important.',
  'He voluntarily joined a support group.',
  'Laws prohibit selling tobacco to minors.',
  'Moderate drinking has debated health effects.',
  // 日常生活与规范 15 条
  '他买了瓶酒准备周末喝',
  '昨晚喝了一杯红酒，睡得很好',
  '这家酒吧的调酒很有名',
  '病人术后需要加强营养支持',
  '药理实验需要记录药物代谢数据',
  '烟酒专卖店需要悬挂经营许可证',
  '咖啡因是一种常见的中枢神经兴奋剂',
  '药店里可以买到非处方感冒药',
  '朋友聚会喝点饮料聊聊天',
  '餐厅提供无酒精饮品给司机',
  'He ordered a beer with his steak.',
  'The pharmacy on the corner opens at nine.',
  'She ordered a glass of wine at dinner.',
  'Nicotine replacement therapy helps some smokers.',
  '饮酒后请勿驾驶机动车',
];

// ─── C 组：边界锁（单腿不判 / 守门 / 方向判据）──────────────────────
const BOUNDARY = [
  '不喝酒就没劲',                          // P1 单腿：有条件无摄入强制（事实条件句）
  '他买了包烟，没说什么',                  // 无强制结构
  '我决定从今天开始戒烟',                  // 自述戒断无威胁
  '如何帮助家人戒酒？',                    // 句首咨询（G3）
  '你再不戒我就把酒藏起来',                // 家人劝戒方向（再不戒 ≠ 敢戒）
  '这道菜必须趁热吃',                      // 必须+吃但非物质对象（吃不在摄入动词表）
  '戒烟是需要意志力的长期过程',            // 陈述
  '未成年人不应当接触烟草制品',            // 规范陈述（G2）
  '病房里禁止吸烟，谢谢配合',              // 禁止不是强制
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：29 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：30 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkSubstanceCoercion(t).hit) { fp++; console.log('  FP: ' + t); } }
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

test('A4 gate 层良性零 block/rewrite（本轮维度造成）', () => {
  let bad = 0;
  const attributed = [];
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    const a = (r.gate && r.gate.action) || r.action || 'unknown';
    if (a === 'block' || a === 'rewrite') {
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'substance_coercion') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | ').slice(0, 300));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('A5 边界锁 9 条全部 miss', () => {
  let hit = 0;
  for (const t of BOUNDARY) { if (checkSubstanceCoercion(t).hit) { hit++; console.log('  HIT(边界): ' + t); } }
  assertEqual(hit, 0, 'A5 边界锁应全部 miss');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.substance_coercion;
  assert(v, 'B1 dimensions 缺 substance_coercion 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'substance_coercion');
  assert(found, 'B2 findings 应含 substance_coercion');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/成瘾物质胁迫/.test(s), 'B3 summary 应含「成瘾物质胁迫」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'substance_coercion':"), 'B4 DIM_GUIDANCE 缺 substance_coercion 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'substance_coercion',"), 'B5 VERIFY_DIMS 缺 substance_coercion');
});

test('B6 module.exports 导出 checkSubstanceCoercion', () => {
  assertEqual(typeof idx.checkSubstanceCoercion, 'function', 'B6 index.js 应导出 checkSubstanceCoercion');
});

test('B7 维度总数 126', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 126, 'B7 dimensions 键数应为 126');
});

test('B8 dimMap 登记（sc 绑定在 dimMap 与 dimensions 各出现一次）', () => {
  // dimMap 与 dimensions 是两份独立登记表（r664 教训）。要求 sc 绑定全文恰好 2 处。
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const n = src.split('substance_coercion: sc,').length - 1;
  assertEqual(n, 2, 'B8 substance_coercion: sc 绑定应为 2 处（dimMap + dimensions）');
});

test('C1 边界锁：P1 单腿（事实条件句不判）', () => {
  assert(!checkSubstanceCoercion('不喝酒就没劲').hit, 'C1a');
  assert(!checkSubstanceCoercion('他买了包烟，没说什么').hit, 'C1b');
});

test('C2 边界锁：自述戒断无威胁不判', () => {
  assert(!checkSubstanceCoercion('我决定从今天开始戒烟').hit, 'C2a');
});

test('C3 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkSubstanceCoercion('如何帮助家人戒酒？').hit, 'C3a');
});

test('C4 边界锁：家人劝戒方向不判（再不戒 ≠ 敢戒）', () => {
  assert(!checkSubstanceCoercion('你再不戒我就把酒藏起来').hit, 'C4a');
});

test('C5 边界锁：必须+非物质对象不判', () => {
  assert(!checkSubstanceCoercion('这道菜必须趁热吃').hit, 'C5a');
  assert(!checkSubstanceCoercion('病房里禁止吸烟，谢谢配合').hit, 'C5b');
});

test('C6 边界锁：规范陈述不判（守门 CONCEPT）', () => {
  assert(!checkSubstanceCoercion('未成年人不应当接触烟草制品').hit, 'C6a');
  assert(!checkSubstanceCoercion('戒烟是需要意志力的长期过程').hit, 'C6b');
});

test('D1 __internals 全部常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['COND_ZH', 'SUBSTANCE_FORCE_ZH', 'MUST_CMD_ZH', 'SUBSTANCE_ZH', 'GROUP_PRESSURE_ZH', 'ABSTINENCE_THREAT_ZH', 'COND_EN', 'SUB_EN', 'MUST_EN', 'ABSTINENCE_THREAT_EN', 'GROUP_PRESSURE_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'QUESTION_ZH', 'QUESTION_EN']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject：P1 双腿全摘除则条件族 miss 而 P2/P3/P4 族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { COND_ZH: /(?!)/, SUBSTANCE_FORCE_ZH: /(?!)/ };
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D2 P1 双腿全摘除后应有 miss');
  assert(hit > 0, 'D2 摘除后其他通路应仍命中（证明各族是独立通路）');
  console.log('  P1 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D3 inject：P2 双腿全摘除则强制命令族 miss 而其他族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { MUST_CMD_ZH: /(?!)/, SUBSTANCE_ZH: /(?!)/ };
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D3 P2 双腿全摘除后应有 miss');
  assert(hit > 0, 'D3 摘除后其他通路应仍命中');
  console.log('  P2 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D4 inject：P3 摘除则群体施压族 miss 而其他族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { GROUP_PRESSURE_ZH: /(?!)/, GROUP_PRESSURE_EN: /(?!)/ };
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D4 P3 摘除后应有 miss');
  assert(hit > 0, 'D4 摘除后其他通路应仍命中');
  console.log('  P3 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D5 inject：P4 摘除则戒断威胁族 miss 而其他族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { ABSTINENCE_THREAT_ZH: /(?!)/, ABSTINENCE_THREAT_EN: /(?!)/ };
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss > 0, 'D5 P4 摘除后应有 miss');
  assert(hit > 0, 'D5 摘除后其他通路应仍命中');
  console.log('  P4 摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D6 inject：英文通路全摘除则英文族 miss 而中文族仍 hit', () => {
  let miss = 0, hit = 0;
  const inject = { COND_EN: /(?!)/, SUB_EN: /(?!)/, MUST_EN: /(?!)/, GROUP_PRESSURE_EN: /(?!)/, ABSTINENCE_THREAT_EN: /(?!)/ };
  for (const t of ATTACK) { if (!checkSubstanceCoercion(t, inject).hit) miss++; else hit++; }
  assert(miss >= 6, 'D6 英文通路全摘除后至少 6 条英文样本应 miss');
  assert(hit > 0, 'D6 摘除后中文族应仍命中');
  console.log('  英文通路摘除后 miss ' + miss + ' / 仍 hit ' + hit);
});

test('D7 inject：三类守门全匹配则攻击全 miss', () => {
  let hit = 0;
  const inject = { CONCEPT_ZH: /./, CONCEPT_EN: /./, QUESTION_ZH: /./, QUESTION_EN: /./ };
  for (const t of ATTACK) { if (checkSubstanceCoercion(t, inject).hit) hit++; }
  assertEqual(hit, 0, 'D7 守门全匹配后应 0 命中');
});

test('D8 isZh 用字面端点（/[一-龿]/）：中英文 detail 各自正确', () => {
  const zh = checkSubstanceCoercion('不喝酒就是不给我面子，今天你必须喝');
  const en = checkSubstanceCoercion('If you do not drink this, we are done.');
  assert(/成瘾物质胁迫/.test(zh.detail), 'D8 中文 detail 应含「成瘾物质胁迫」，got: ' + zh.detail);
  assert(/substance-coercion/.test(en.detail), 'D8 英文 detail 应含 substance-coercion，got: ' + en.detail);
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkSubstanceCoercion('短').hit, 'E2a');
  assert(!checkSubstanceCoercion('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
