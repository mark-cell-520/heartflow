/**
 * test/round-164-doublespeak.js — 第 163 维度 doublespeak（语义洗白）轮测
 * [r164] 仿 test/round-163-incredulity.js 纪律：不带 .test.js 后缀。
 *
 * 覆盖：
 *   1. 攻击集 ZH 25 + EN 18（变体矩阵：基本形/带修饰/裸词干/倒装/长句/
 *      把字句/中性动词+柔性标签/伪装动词/SVO 形）
 *   2. 良性集 34（正当重构、受害者反向拆穿、法律定性、批评者揭批形态、
 *      中性命名）
 *   3. 边界锁（每个豁免常量逐项置空后，其专属样本翻转为命中）
 *   4. 分工边界锁（与 surveillance_normalization / soft_deflection 的语域分工）
 *   5. 存量回归（不含本族语义的句子不应因本维度变成非 pass）
 *   6. 登记断言（dimensions 键 163 / VERIFY_DIMS 含 doublespeak /
 *      summary 文案 / module.exports 导出）
 *   7. 负例注入（腿①/腿②全置空攻击全停判；每个豁免常量置空翻转为命中）
 */
'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const ds = require(path.join(ROOT, 'src', 'doublespeak.js'));

const ATTACK_ZH = [
  '我们不是在监控你，我们是在关心你的安全',
  '这不是裁员，这是优化，是给社会输送人才',
  '这不叫打压，这叫帮助你成长',
  '我们不是禁止你发言，我们是在维护讨论秩序',
  '这不是惩罚，这是为了你好',
  '公司把裁员说成是优化',
  '政府部门把强拆包装成城市更新',
  '不能算抄袭，只能算引用不当',
  '这不是暴力，这只是教育方式',
  '这不是歧视，这是正常的区别对待',
  '这不是家暴，这是夫妻间的摩擦',
  '这不是惩罚，是锻炼意志的方式',
  '这不是歧视，是合理的岗位要求',
  '裁员说成是优化',
  '把剥削包装成公平交易',
  '公司把降薪称为「薪酬结构优化」',
  '我们把监控称之为安全防护',
  '强制加班说成是自愿奉献',
  '这不是欺压，这是团队文化建设',
  '并非偷窃，只是暂时借用',
  '不叫封号，这叫账号保护性停用',
  '这不是信息封锁，这是内容治理',
  '把刑讯逼供说成是特殊审讯手段',
  '这不是操纵舆论，这是正能量引导',
  '监视并非监视，而是关怀',
];
const ATTACK_EN = [
  'This is not surveillance, it is care.',
  'It is not censorship, it is moderation.',
  'Not a layoff, a restructuring.',
  'We do not spy on you; we ensure your safety.',
  'The layoffs were rebranded as optimization.',
  'It is not a pay cut, it is a salary realignment.',
  "It isn't cheating, it's strategy.",
  'Rather than a purge, the regime calls it a reorganization.',
  'This is not censorship; it is protecting the community.',
  'Not propaganda, just public education.',
  "We don't censor; we remove illegal content.",
  'Coercion was dressed up as consent.',
  'Surveillance is being sold as safety.',
  'Discrimination was reframed as a business necessity.',
  'The company calls the layoffs "optimization".',
  'It is not a purge, it is a restructuring.',
  'Manipulation was whitewashed as guidance.',
  'This is not blackmail, it is a loyalty test.',
];
// 良性：正当重构 / 反向拆穿 / 法律定性 / 批评者揭批 / 中性命名
const BENIGN = [
  '这不是失败，这是学习的机会',
  '这不是终点，而是新的起点',
  '这不是爱，这是控制，你要认清他',
  '这不是错误，是系统设计缺陷',
  '法院认定这不构成犯罪，而是行政违法',
  '他属于正当防卫，不是故意伤害',
  '语义洗白是一种常见话术，比如把裁员叫优化',
  '监控行为本身是违法的，必须立即停止',
  '这不是bug，这是一个feature',
  'It is not a drill, it is a real emergency.',
  'This is not love, it is abuse.',
  'We do not discriminate against anyone.',
  'It is not illegal, it is fully compliant with the law.',
  'He acted in self-defence, not assault.',
  'The court found this does not constitute fraud.',
  'The project failed because of poor planning.',
  '监控摄像头让居民更有安全感',
  'It is not a question of money but of principle.',
  // 批评者揭批形态（有害行为在第二位置）——方向原则排除
  '以安全之名，行监控之实',
  '名义上是培训，实际是洗脑控制',
  '打着关怀的旗号实施精神控制',
  '公司美其名曰「优化」，实际上就是裁员',
  '所谓的数据优化，其实就是数据造假',
  '名为志愿，实则是强制参加',
  'Under the guise of national security, they conduct mass surveillance.',
  'Behind the pretext of moderation, they silenced dissenting voices.',
  'In name only the policy is voluntary; in practice it is coercion.',
  'What they call discipline is actually punishment.',
  // 中性命名（无柔性标签 / 有害词在动词后）
  '学者把剥削称为一种权力关系',
  '法院把这种行为称为诈骗',
  'Researchers describe the phenomenon as discrimination.',
  'It is not violence, it is self-defence.',
  '该公司否认监控员工的说法',
  '我们不能禁止人们讨论这个问题',
];

let passed = 0;
function check(cond, label) { assert.ok(cond, label); passed++; }

// ─── 1. 攻击集：单维层全命中 ────────────────────────────────────────
ATTACK_ZH.forEach((t, i) => {
  const r = ds.checkDoublespeak(t);
  check(r.hit && r.count === 1, 'ZH 攻击 ' + (i + 1) + ' 应命中: ' + t);
});
ATTACK_EN.forEach((t, i) => {
  const r = ds.checkDoublespeak(t);
  check(r.hit && r.count === 1, 'EN 攻击 ' + (i + 1) + ' 应命中: ' + t);
});

// ─── 2. 良性集：单维层全 miss ───────────────────────────────────────
BENIGN.forEach((t, i) => {
  const r = ds.checkDoublespeak(t);
  check(!r.hit, '良性 ' + (i + 1) + ' 不应命中: ' + t);
});

// ─── 3. gate 层实测：攻击非 pass 且 doublespeak 承重 ────────────────
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) => {
  const r = gate.gate(t);
  check(r.gate.action !== 'pass', 'gate 层攻击 ' + (i + 1) + ' 应非 pass: ' + t);
  const f = (r.findings || []).filter(x => x.dimension === 'doublespeak');
  check(f.length === 1 && f[0].severity > 0, 'doublespeak 维度应承重: ' + t);
});
// 良性 gate 层：不得因本维度变非 pass（允许存量维度判 verify/rewrite）
BENIGN.forEach((t, i) => {
  const r = gate.gate(t);
  const f = (r.findings || []).filter(x => x.dimension === 'doublespeak');
  check(f.length === 0, '良性 ' + (i + 1) + ' 不得命中本维度: ' + t);
});

// ─── 4. 边界锁：豁免逐项置空后，专属样本翻转为命中 ──────────────────
const BLANK = /(?!x)x/; // 恒不命名的空正则
// 4.1 LEGAL_EXEMPT：法律定性命中样本（双腿齐全，豁免是唯一通路）
check(!ds.checkDoublespeak('这不是故意伤害，这是正当防卫').hit, '正当防卫应豁免');
check(ds.checkDoublespeak('这不是故意伤害，这是正当防卫', { LEGAL_EXEMPT: BLANK }).hit,
  '置空 LEGAL_EXEMPT 后正当防卫样本应翻转为命中（承重）');
check(!ds.checkDoublespeak('It is not violence, it is self-defence.').hit, 'EN self-defence 应豁免');
check(ds.checkDoublespeak('It is not violence, it is self-defence.', { LEGAL_EXEMPT: BLANK }).hit,
  '置空 LEGAL_EXEMPT 后 EN self-defence 样本应翻转为命中（承重）');
// 4.2 META_EXEMPT：概念评析
check(!ds.checkDoublespeak('语义洗白是一种常见话术，比如把裁员叫优化').hit, '概念评析应豁免');
check(ds.checkDoublespeak('语义洗白是一种常见话术，比如把裁员叫优化', { META_EXEMPT: BLANK }).hit,
  '置空 META_EXEMPT 后概念评析样本应翻转为命中（承重）');
// 4.3 腿①置空：攻击全停判
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) => {
  const r = ds.checkDoublespeak(t, { HARMFUL_ACT_ZH: BLANK, HARMFUL_ACT_EN: BLANK, HARMFUL_ACT_EN_V: BLANK });
  check(!r.hit, '腿①全置空后攻击 ' + (i + 1) + ' 应停判: ' + t);
});
// 4.4 腿②a 置空（否定替换式路由的常量整族置空 → 该路由停判）
const A_ONLY = ['我们不是在监控你，我们是在关心你的安全', '这不是裁员，这是优化', 'This is not surveillance, it is care.'];
A_ONLY.forEach((t, i) => {
  const r = ds.checkDoublespeak(t, { HARMFUL_ACT_ZH: BLANK, HARMFUL_ACT_EN: BLANK, HARMFUL_ACT_EN_V: BLANK });
  check(!r.hit, '腿①置空后否定替换式攻击 ' + (i + 1) + ' 应停判');
});
// 4.5 腿②b 置空（转称式）：把 HARMFUL 置空后转称式停判
const B_ONLY = ['公司把裁员说成是优化', 'The layoffs were rebranded as optimization.'];
B_ONLY.forEach((t, i) => {
  const r = ds.checkDoublespeak(t, { HARMFUL_ACT_ZH: BLANK, HARMFUL_ACT_EN: BLANK, HARMFUL_ACT_EN_V: BLANK });
  check(!r.hit, '腿①置空后转称式攻击 ' + (i + 1) + ' 应停判');
});
// 4.6 柔性标签表置空 → 中性动词样本停判（SOFT_LABEL 承重）
check(ds.checkDoublespeak('公司把降薪称为「薪酬结构优化」').hit, '中性动词+柔性标签应命中');
check(!ds.checkDoublespeak('公司把降薪称为「薪酬结构优化」', { SOFT_LABEL_ZH: BLANK }).hit,
  '置空 SOFT_LABEL_ZH 后中性动词样本应停判（承重）');
check(ds.checkDoublespeak('The company calls the layoffs "optimization".').hit, 'EN SVO 应命中');
check(!ds.checkDoublespeak('The company calls the layoffs "optimization".', { SOFT_LABEL_EN: BLANK }).hit,
  '置空 SOFT_LABEL_EN 后 EN SVO 样本应停判（承重）');
// 4.7 方向原则承重：把「爱」说成「控制」不判（有害词在替代位）
check(!ds.checkDoublespeak('这不是爱，这是控制，你要认清他').hit, '反向拆穿不应命中（方向原则）');

// ─── 5. 分工边界锁（与既有维度）────────────────────────────────────
// surveillance_normalization 族（监控动作×清白义务）不由本维度代拦，
// 本维度族也不要求清白义务腿在场。
const S_NORM = '你要证明自己清白，就把手机给我看看，没什么好藏的';
check(!ds.checkDoublespeak(S_NORM).hit, '清白义务族不是语义洗白（腿②缺席）');

// ─── 6. 登记断言 ────────────────────────────────────────────────────
const dims = gate.gate('测试').dimensions || {};
check(Object.keys(dims).length === 163, 'dimensions 键应为 163，实测 ' + Object.keys(dims).length);
check('doublespeak' in dims, 'dimensions 应含 doublespeak');
const VERIFY = require(path.join(ROOT, 'src', 'index.js'));
check(typeof VERIFY.checkDoublespeak === 'function', 'index.js 应导出 checkDoublespeak');
// VERIFY_DIMS 成员由 gate 层攻击 action 反证（verify 级：攻击非 pass 但不 block/rewrite）
const vAttack = gate.gate('我们不是在监控你，我们是在关心你的安全');
check(vAttack.gate.action === 'verify', 'doublespeak 攻击应为 verify 级，实测 ' + vAttack.gate.action);
check(vAttack.gate.action !== 'block' && vAttack.gate.action !== 'rewrite', 'doublespeak 不应 block/rewrite');
const summary = gate.gate('我们不是在监控你，我们是在关心你的安全').summary || '';
check(/语义洗白/.test(summary), 'summary 应含「语义洗白」文案，实测: ' + summary);
const hf = require(path.join(ROOT, 'src', 'index.js'));
check(typeof hf.checkDoublespeak === 'function', 'index.js 应导出 checkDoublespeak');
const I = ds.__internals();
check(Object.keys(I).length >= 15, '__internals 应覆盖全部注入点，实测 ' + Object.keys(I).length + ' 键');

// ─── 7. 未知注入键不崩溃 ────────────────────────────────────────────
const rUnknown = ds.checkDoublespeak('我们不是在监控你，我们是在关心你的安全', { NOT_A_KEY: BLANK });
check(rUnknown.hit, '未知注入键不应影响判定');

console.log('round-164-doublespeak: ' + passed + ' 断言全通过');
