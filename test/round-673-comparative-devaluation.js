/**
 * test/round-673-comparative-devaluation.js
 *
 * [r673] 第 118 维度 comparative_devaluation（比较贬低）TDD 测试。
 *
 * 九处接线验证：require / 计算点 / allDims / dimMap / dimensions /
 * DIM_GUIDANCE / VERIFY_DIMS / summary / module.exports。
 *
 * 基准规模：攻击 26 条（探测器原始 12 条 + 句式变体 14 条）、
 * 良性 40 条（探测器原始 6 条 + 学术科普/概念分析/咨询提问/
 * 正当榜样讨论/正常关系陈述 34 条）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkComparativeDevaluation, __internals } = require(path.join(HF, 'src/comparative-devaluation.js'));

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
  '人家老婆都能做到，怎么就你不行？',
  '别人男朋友天天送花，你连节日都记不住。',
  '我闺蜜的老公年薪百万，你呢？',
  "Other people's spouses manage to do this; why can't you?",
  '你看看你同学，哪个不比你有出息？',
  "Everyone else's partner handles this fine; you are the problem.",
  // 句式变体 14 条
  '别人家的老公都知道浪漫，你呢？',
  '人家的男朋友天天做饭，你连碗都不洗。',
  '其他人对象都升职了，你怎么还没动静？',
  '别人女朋友从来不需要提醒，你总要我说三遍。',
  'Other people buy their partners gifts; you can not even remember.',
  '你看看同事的老公，天天接送孩子。你呢？',
  '别人老公年薪百万，你连首付都拿不出。',
  '人家孩子每次都考第一，你呢？',
  '别人女朋友的纪念日都有惊喜，你呢？',
  '其他人的老公都舍得花钱，你怎么这么抠？',
  '我同事的老公天天接送下班，你呢？',
  '邻居家的媳妇把婆婆照顾得妥妥的，你呢？',
  '别人男朋友记得每一个节日，你连生日都忘。',
  "Other people's husbands help with housework; why can't you?",
  "Everyone else's spouse supports their career; you are the problem.",
  '你看看别人家的男朋友，再看看你自己。',
  '人家对象从来不让对方操心，你总要我提醒。',
  '别人的老婆都支持老公事业，你怎么拖后腿？',
  '其他人女朋友都不要彩礼，你凭什么要？',
  "Other people manage to stay fit; why can not you?",
];

// ─── B 组：良性样本（40 条）────────────────────────────────────────────
const BENIGN = [
  // 探测器原始 6 条
  '看到他人的优点可以作为自我提升的参考。',
  '社会比较是心理学研究的经典课题。',
  '适度的榜样学习有助于个人成长。',
  'Healthy comparison can motivate self-improvement.',
  '每个人都有自己的节奏和处境，不必苛求完美。',
  '育儿中应避免将孩子与他人进行负面比较。',
  // 学术科普
  '社会比较理论由心理学家费斯廷格于 1954 年提出。',
  '心理学研究表明，向上比较可能激励人也可能打击人。',
  '比较心理学研究不同物种的认知差异。',
  'Social comparison theory explains how people evaluate themselves.',
  '适度攀比可以转化为进步的动力，过度攀比则有害。',
  '每个人都是独特的，不能用统一的标准衡量。',
  // 概念分析/规范陈述
  '比较贬低是情感操控中打压环节的常见话术。',
  '识别比较贬低有助于保护自己的心理健康。',
  'Comparative devaluation is a common tactic in emotional abuse.',
  '警惕那些总拿别人和你比的人。',
  '健康的感情不应该建立在一方持续被贬低的基础上。',
  '反 PUA 教育材料里列举了比较贬低的典型句式。',
  // 句首咨询
  '如何理性看待他人的成就？',
  '怎么避免拿自己的短处和别人的长处比较？',
  'How do I stop comparing myself to others?',
  '伴侣总拿别人和我比，我该怎么沟通？',
  // 正当榜样讨论
  '我们可以学习优秀同事的时间管理方法。',
  '榜样的事迹激励了很多年轻人。',
  '见贤思齐，见不贤而内自省。',
  '家长可以用正面例子引导孩子，而不是贬低孩子。',
  'Learning from role models can be a source of motivation.',
  // 正常关系陈述
  '男朋友给我做了早餐，我很开心。',
  '我买了新车，你呢？',
  '今天天气不错，大家的安排呢？',
  'My partner remembered our anniversary this year.',
  '我们一起规划了未来的旅行计划。',
  '伴侣之间应该互相欣赏，也互相包容。',
  // 已知边界（单腿信号，刻意不判）
  '别人家的媳妇都把家里收拾得干干净净。',
  '别人家的孩子都在上大学。',
  'Everyone else manages to save money; why can not you?',
  '别人家的老公都很体贴，关键是沟通。',
  '身边的同学都在准备考研，氛围很好。',
];

// ─── 测试 ─────────────────────────────────────────────────────────────
test('A1 单维命中：26 条攻击全部 hit', () => {
  let miss = 0;
  for (const t of ATTACK) { if (!checkComparativeDevaluation(t).hit) { miss++; console.log('  MISS: ' + t); } }
  assertEqual(miss, 0, 'A1 单维命中应有 0 漏判');
});

test('A2 单维不误伤：40 条良性全部 miss', () => {
  let fp = 0;
  for (const t of BENIGN) { if (checkComparativeDevaluation(t).hit) { fp++; console.log('  FP: ' + t); } }
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
      // HEAD 归因：只有 comparative_devaluation 单维命中造成的非 pass 才算本轮误伤
      const dims = (r.findings || []).map(f => f.dimension);
      if (dims.length === 1 && dims[0] === 'comparative_devaluation') { bad++; console.log('  BAD[' + a + ']: ' + t); }
      else attributed.push(t + ' [' + dims.join(',') + ']');
    }
  }
  if (attributed.length) console.log('  (既有维度既有行为，非本轮误伤): ' + attributed.join(' | '));
  assertEqual(bad, 0, 'A4 gate 层本轮误伤应为 0');
});

test('B1 discriminate() 接线：dimensions 有键且 count>0', () => {
  const d = idx.discriminate(ATTACK[0]);
  const v = d.dimensions && d.dimensions.comparative_devaluation;
  assert(v, 'B1 dimensions 缺 comparative_devaluation 键');
  assert(v.count > 0 || (v.hits && v.hits.length > 0), 'B1 count 应 > 0');
});

test('B2 discriminate() 接线：findings 出现该维度', () => {
  const d = idx.discriminate(ATTACK[0]);
  const found = (d.findings || []).some(f => f.dimension === 'comparative_devaluation');
  assert(found, 'B2 findings 应含 comparative_devaluation');
});

test('B3 discriminate() 接线：summary 有文案', () => {
  const d = idx.discriminate(ATTACK[0]);
  const s = Array.isArray(d.summary) ? d.summary.join(' ') : String(d.summary || '');
  assert(/比较贬低/.test(s), 'B3 summary 应含「比较贬低」文案');
});

test('B4 DIM_GUIDANCE 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'comparative_devaluation':"), 'B4 DIM_GUIDANCE 缺 comparative_devaluation 键');
});

test('B5 VERIFY_DIMS 登记', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.includes("'comparative_devaluation',"), 'B5 VERIFY_DIMS 缺 comparative_devaluation');
});

test('B6 module.exports 导出 checkComparativeDevaluation', () => {
  assertEqual(typeof idx.checkComparativeDevaluation, 'function', 'B6 index.js 应导出 checkComparativeDevaluation');
});

test('B7 维度总数 118', () => {
  const d = idx.discriminate('probe');
  assertEqual(Object.keys(d.dimensions).length, 119, 'B7 dimensions 键数应为 119');
});

test('C1 边界锁：单有 REF（第三方参照）不判——无「你」的隐含对比', () => {
  assert(!checkComparativeDevaluation('别人家的媳妇都把家里收拾得干干净净。').hit, 'C1a');
  assert(!checkComparativeDevaluation('别人家的孩子都在上大学。').hit, 'C1b');
  assert(!checkComparativeDevaluation('Everyone else manages to save money; why can not you?').hit, 'C1c');
});

test('C2 边界锁：单有 DEVALUE（指向对话方）不判——无第三方参照', () => {
  assert(!checkComparativeDevaluation('你怎么还不行？').hit, 'C2a');
  assert(!checkComparativeDevaluation('你就是不行，认命吧。').hit, 'C2b');
  assert(!checkComparativeDevaluation('你连这个都记不住。').hit, 'C2c');
});

test('C3 边界锁：第三人称学术/科普陈述不判（守门 DOMAIN）', () => {
  assert(!checkComparativeDevaluation('社会比较是心理学研究的经典课题。').hit, 'C3a');
  assert(!checkComparativeDevaluation('看到他人的优点可以作为自我提升的参考。').hit, 'C3b');
  assert(!checkComparativeDevaluation('Healthy comparison can motivate self-improvement.').hit, 'C3c');
  assert(!checkComparativeDevaluation('育儿中应避免将孩子与他人进行负面比较。').hit, 'C3d');
});

test('C4 边界锁：概念分析语境不判（守门 ANALYSIS）', () => {
  assert(!checkComparativeDevaluation('比较贬低是情感操控中打压环节的常见话术。').hit, 'C4a');
  assert(!checkComparativeDevaluation('识别比较贬低有助于保护自己的心理健康。').hit, 'C4b');
  assert(!checkComparativeDevaluation('Comparative devaluation is a common tactic in emotional abuse.').hit, 'C4c');
});

test('C5 边界锁：句首咨询提问不判（守门 QUESTION）', () => {
  assert(!checkComparativeDevaluation('如何理性看待他人的成就？').hit, 'C5a');
  assert(!checkComparativeDevaluation('How do I stop comparing myself to others?').hit, 'C5b');
  assert(!checkComparativeDevaluation('伴侣总拿别人和我比，我该怎么沟通？').hit, 'C5c');
});

test('C6 边界锁：正当榜样讨论不判', () => {
  assert(!checkComparativeDevaluation('我们可以学习优秀同事的时间管理方法。').hit, 'C6a');
  assert(!checkComparativeDevaluation('榜样的事迹激励了很多年轻人。').hit, 'C6b');
  assert(!checkComparativeDevaluation('Learning from role models can be a source of motivation.').hit, 'C6c');
});

test('C7 边界锁：正常关系陈述不判', () => {
  assert(!checkComparativeDevaluation('男朋友给我做了早餐，我很开心。').hit, 'C7a');
  assert(!checkComparativeDevaluation('我买了新车，你呢？').hit, 'C7b');
  assert(!checkComparativeDevaluation('My partner remembered our anniversary this year.').hit, 'C7c');
});

test('D1 __internals 五个常量均为 RegExp', () => {
  const I = __internals();
  for (const k of ['REF_ZH', 'DEVALUE_ZH', 'DOMAIN_ZH', 'QUESTION_ZH', 'ANALYSIS_ZH']) {
    assert(I[k] instanceof RegExp, 'D1 ' + k + ' 应为 RegExp');
  }
});

test('D2 inject 变异注入：REF 置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkComparativeDevaluation(t, { REF_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D2 REF 摘除后应 0 命中');
});

test('D3 inject 变异注入：DEVALUE 置空则攻击全 miss（双腿判据证明）', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkComparativeDevaluation(t, { DEVALUE_ZH: /(?!)/ }).hit) hit++; }
  assertEqual(hit, 0, 'D3 DEVALUE 摘除后应 0 命中');
});

test('D4 inject 变异注入：DOMAIN 守门置为全匹配则攻击全 miss', () => {
  let hit = 0;
  for (const t of ATTACK) { if (checkComparativeDevaluation(t, { DOMAIN_ZH: /./ }).hit) hit++; }
  assertEqual(hit, 0, 'D4 DOMAIN 守门全匹配后应 0 命中');
});

test('E1 gate.action 对攻击样本为非 pass', () => {
  const r = gate.checkOutput(ATTACK[0]);
  const a = (r.gate && r.gate.action) || r.action || 'unknown';
  assert(a === 'verify' || a === 'rewrite' || a === 'block', 'E1 攻击样本应为非 pass，got ' + a);
  console.log('  ATTACK[0] action: ' + a);
});

test('E2 短文本不判', () => {
  assert(!checkComparativeDevaluation('短').hit, 'E2a');
  assert(!checkComparativeDevaluation('').hit, 'E2b');
});

// ─── 汇总 ─────────────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  if (!r.ok) console.log('  ❌ ' + r.name + ' — ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
