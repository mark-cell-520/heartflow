/**
 * test/round-399-genetic-fallacy-etymology.test.js
 *
 * [r399] genetic_fallacy（第 131 维，起源谬误）新增「词源谬误族」
 * （etymological fallacy，起源谬误的语义子种）TDD 测试。
 *
 * 真升级②：既有维度的全新措辞家族。dimMap 键数不变（仍 266）、
 * src/index.js 零改动（本族在 genetic-fallacy.js 模块内闭合，维度早已
 * 注册 dispatch）。与存量 SOURCE×QUALITY 族正交：存量收「谁说的/哪生产
 * 的/什么年代的」来源点名 × 质量贬损；本族收「词的起源」× 定义/规范结论。
 *
 * 判据双腿共现（缺一不判）：
 *   腿① ETYM 词源/本义标记（源于/本义是/古汉语里/comes from/literally means）
 *   腿② NORM 定义/规范结论（才算/不配叫/从一开始就是误用/违背本义/
 *        counts as true/not a real/misuses the word）
 * 良性（词源事实陈述/反谬误陈述/语言学教学）只有腿①没有腿②，双腿共现天然豁免。
 * 行动级 VERIFY（与存量族同口径）。
 *
 * 立项探针 scripts/round-399/probe-etymology.js：基线 14 攻击 9 穿透、
 * 10 良性 0 误伤；落地后 14/14 命中、良性 0 误伤（见
 * coordination/agent4/r399-probe-etymology*.output.txt）。
 *
 * 基准规模：攻击 16（ZH 8 + EN 8）、良性 14（D1 gate 层 pass + 单维
 * 零命中）、分支锁、单腿边界、META 豁免 4、inject 摘除 6 组、存量
 * 回归、加性证明、接线完整性。
 */
'use strict';

const path = require('path');
const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkGeneticFallacy, __internals } = require(path.join(HF, 'src/genetic-fallacy.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
const blank = () => new RegExp('(?!)'); // 永不匹配，用于 inject 摘除

// ─── A. 单维层：词源谬误攻击全部命中（中英，覆盖两条腿的各措辞）─────
test('A1 词源谬误攻击单维全命中（ZH 8 条）', () => {
  const zh = [
    '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主',
    '「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学',
    '「革命」在古汉语里指变革天命，所以今天用「革命」从一开始就是误用',
    '「公司」本义是共同经营，所以只追求盈利的企业违背了公司的本义',
    '既然「个人主义」源于对个体价值的强调，那么强调集体就是对这一概念的背叛',
    '「君子」在古汉语里指有位者，所以今天用它来形容品德从一开始就背离了本义',
    '「哲学」源于爱智慧，所以不热爱智慧的人根本算不上真正的哲学爱好者',
    '「sympathy」本来是同情感，所以用它表示赞同从一开始就是错的',
  ];
  for (const t of zh) assert(checkGeneticFallacy(t).hit, 'ZH 词源攻击未命中: ' + t);
});

test('A2 词源谬误攻击单维全命中（EN 8 条）', () => {
  const en = [
    '"Decide" comes from the Latin for "to cut off", so a decision that can be revisited is not a real decision',
    '"Democracy" derives from the Greek for "rule by the people", so only direct rule counts as true democracy',
    'The word "education" comes from "to lead out", so forcing facts into students contradicts its real meaning',
    'Since "family" originally meant a household including servants, calling a nuclear family a family misuses the word',
    '"Philosophy" literally means "love of wisdom", so anyone who does not pursue wisdom is no true philosopher',
    'Because "aggressive" once meant "bold and forward", using it to mean hostile distorts its proper sense',
    '"Education" originates from a root meaning "to lead forth", so lecturing at students is not true education',
    'The term "democracy" traces back to "demos" meaning people, so representative systems are not genuine democracy',
  ];
  for (const t of en) assert(checkGeneticFallacy(t).hit, 'EN 词源攻击未命中: ' + t);
});

// ─── B. 分支锁：每条腿中英各一条，证明单腿措辞在承重 ─────────────────
test('B1 腿① ETYM 中文各支', () => {
  assert(checkGeneticFallacy('「民主」源于人民统治，所以只有直接民主才算民主').hit, 'B1a 源于');
  assert(checkGeneticFallacy('「大学」的本义是通识，所以只教技能不配叫大学').hit, 'B1b 本义是');
  assert(checkGeneticFallacy('「革命」在古汉语里指变革天命，所以今天的用法是误用').hit, 'B1c 古汉语里');
  assert(checkGeneticFallacy('「sympathy」本来是同情感，所以用来表示赞同是误用').hit, 'B1d 本来是');
});

test('B2 腿① ETYM 英文各支', () => {
  assert(checkGeneticFallacy('"Decide" comes from "to cut off", so a reversible decision is not a real decision.').hit, 'B2a comes from');
  assert(checkGeneticFallacy('"Philosophy" literally means "love of wisdom", so an unreflective person is no true philosopher.').hit, 'B2b literally means');
  assert(checkGeneticFallacy('"Education" originally meant "to lead out", so lecturing is not true education.').hit, 'B2c originally meant');
  assert(checkGeneticFallacy('"Democracy" derives from Greek roots, so only direct rule counts as democracy.').hit, 'B2d derives from');
});

test('B3 腿② NORM 中文各支', () => {
  assert(checkGeneticFallacy('「民主」源于人民统治，所以只有直接民主才算真民主').hit, 'B3a 才算');
  assert(checkGeneticFallacy('「大学」本义是通识，所以只教技能的根本不配叫大学').hit, 'B3b 不配叫');
  assert(checkGeneticFallacy('「革命」古义是变革天命，所以今天用革命从一开始就是误用').hit, 'B3c 从一开始就是误用');
  assert(checkGeneticFallacy('「公司」本义是共同经营，所以逐利的企业违背了本义').hit, 'B3d 违背本义');
  assert(checkGeneticFallacy('「个人主义」源于个体价值，所以强调集体就是对这个概念的背叛').hit, 'B3e 背叛');
});

test('B4 腿② NORM 英文各支', () => {
  assert(checkGeneticFallacy('"Decide" comes from "to cut off", so it is not a real decision.').hit, 'B4a is not a real');
  assert(checkGeneticFallacy('"Democracy" derives from "rule by people", so only direct rule counts as true democracy.').hit, 'B4b counts as true');
  assert(checkGeneticFallacy('"Family" originally included servants, so calling a nuclear family a family misuses the word.').hit, 'B4c misuses the word');
  assert(checkGeneticFallacy('"Aggressive" once meant bold, so the hostile sense is no true meaning of it.').hit, 'B4d no true');
});

// ─── C. gate 层端到端：攻击非 pass 且本维度独立命中 ──────────────────
test('C1 gate 层攻击非 pass 且 genetic_fallacy 独立承重', () => {
  const attacks = [
    '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主',
    '「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学',
    '"Decide" comes from the Latin for "to cut off", so a decision that can be revisited is not a real decision',
    '"Democracy" derives from the Greek for "rule by the people", so only direct rule counts as true democracy',
    '「革命」在古汉语里指变革天命，所以今天用「革命」从一开始就是误用',
    '"Philosophy" literally means "love of wisdom", so anyone who does not pursue wisdom is no true philosopher',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行词源攻击: ' + t);
    const disc = gate.discriminate(t);
    assert(disc.dimensions.genetic_fallacy && disc.dimensions.genetic_fallacy.count > 0,
      'genetic_fallacy 应独立命中: ' + t);
  }
});

// ─── D. 良性：gate 层必须 pass + 单维零命中 ────────────────────────
test('D1 良性词源陈述 gate 层 pass 且单维不命中', () => {
  const benign = [
    '从词源上看，「火山」一词与罗马的火神伏尔甘有关，这是语言学的常识',
    '「歇斯底里」源于希腊语的「子宫」，反映了古人的医学认知',
    'Etymologically, "quarantine" derives from the Italian for forty days',
    'The etymology of "nice" traces back to a Latin word meaning ignorant',
    '了解一个词的词源有助于理解它的演变，但并不决定它今天的用法',
    '词源学专门研究词语的起源与演变，是语言学的一个分支',
    '「琵琶」这个词源于波斯语，这是音乐史研究者反复考证的结论',
    'Many English words derive from Latin and Greek roots; studying them aids vocabulary',
    'A good dictionary lists the etymology of each entry for reference',
    '「德先生」和「赛先生」这两个译名，词源上分别指向民主与科学',
    '这个词在现代汉语里的意思已经演变了，不能只按古义理解',
    '词典会标注每个词的字源和读音演变，供读者查考',
    'Knowing a word\'s Latin root helps students guess related vocabulary.',
    'The etymology of "quarantine" reflects the forty-day isolation period in Venice.',
  ];
  for (const t of benign) {
    assert(!checkGeneticFallacy(t).hit, '单维误伤良性: ' + t);
    const r = gate.checkOutput(t);
    assertEqual(r && r.gate && r.gate.action, 'pass', '良性被 gate 拦截: ' + t);
  }
});

// ─── E. 单腿边界（保守边界，刻意不判）─────────────────────────────
test('E1 单腿不判：只有词源腿（无规范结论）', () => {
  const onlyEtym = [
    '「民主」这个词源于希腊语的「人民统治」',
    '「大学」的本义是追求普遍学问，这是校史记载',
    '"Philosophy" literally means "love of wisdom".',
    'Many English words derive from Latin and Greek roots.',
  ];
  for (const t of onlyEtym) assert(!checkGeneticFallacy(t).hit, '单腿(词源)误判: ' + t);
});

test('E2 单腿不判：只有规范结论腿（无词源引用）', () => {
  const onlyNorm = [
    '只有人民直接统治的制度才算真正的民主',
    '只教专业技能的根本不配叫大学',
    'A decision that can be revisited is not a real decision.',
    'Only direct rule counts as true democracy.',
  ];
  for (const t of onlyNorm) assert(!checkGeneticFallacy(t).hit, '单腿(规范)误判: ' + t);
});

// ─── F. META 豁免：评析词源谬误这套话术本身不判 ───────────────────
test('F1 META 豁免（中英，含教科书引用该谬误作例子）', () => {
  const meta = [
    '「革命」在古汉语里指变革天命，所以今天用革命是误用，这正是典型的词源谬误',
    '识别词源谬误能帮你避免被定义带偏',
    '诉诸词源是一种常见的非形式谬误',
    'The etymological fallacy: "decide" comes from "to cut off", so a revisited decision is not a real decision.',
  ];
  for (const t of meta) assert(!checkGeneticFallacy(t).hit, 'META 豁免失效: ' + t);
});

// ─── G. inject 摘除：每个常量置空后专属攻击恢复 miss ──────────────
// 纪律：每条样本只由对应常量提供承重腿，单支注入证明单支承重。
test('G1 inject 摘除 ETYM_ZH：中文词源攻击恢复 miss', () => {
  const t = '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主';
  assert(!checkGeneticFallacy(t, { ETYM_ZH: blank() }).hit, 'G1a 摘除 ETYM_ZH 仍命中');
  assert(checkGeneticFallacy(t).hit, 'G1b 对照应命中');
});

test('G2 inject 摘除 ETYM_NORM_ZH：中文词源攻击恢复 miss', () => {
  const t = '「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学';
  assert(!checkGeneticFallacy(t, { ETYM_NORM_ZH: blank() }).hit, 'G2a 摘除 ETYM_NORM_ZH 仍命中');
  assert(checkGeneticFallacy(t).hit, 'G2b 对照应命中');
});

test('G3 inject 摘除 ETYM_EN：英文词源攻击恢复 miss', () => {
  const t = '"Decide" comes from the Latin for "to cut off", so a decision that can be revisited is not a real decision';
  assert(!checkGeneticFallacy(t, { ETYM_EN: blank() }).hit, 'G3a 摘除 ETYM_EN 仍命中');
  assert(checkGeneticFallacy(t).hit, 'G3b 对照应命中');
});

test('G4 inject 摘除 ETYM_NORM_EN：英文词源攻击恢复 miss', () => {
  const t = '"Democracy" derives from the Greek for "rule by the people", so only direct rule counts as true democracy';
  assert(!checkGeneticFallacy(t, { ETYM_NORM_EN: blank() }).hit, 'G4a 摘除 ETYM_NORM_EN 仍命中');
  assert(checkGeneticFallacy(t).hit, 'G4b 对照应命中');
});

test('G5 inject 摘除 ETYM_META_ZH：META 豁免失效后转命中', () => {
  const t = '「革命」在古汉语里指变革天命，所以今天用革命是误用，这正是典型的词源谬误';
  assert(!checkGeneticFallacy(t).hit, 'G5a 对照不应命中（META 豁免）');
  assert(checkGeneticFallacy(t, { ETYM_META_ZH: blank() }).hit, 'G5b 摘除豁免后应命中');
});

test('G6 inject 摘除 ETYM_META_EN：META 豁免失效后转命中', () => {
  const t = 'The etymological fallacy: "decide" comes from "to cut off", so a revisited decision is not a real decision.';
  assert(!checkGeneticFallacy(t).hit, 'G6a 对照不应命中（META 豁免）');
  assert(checkGeneticFallacy(t, { ETYM_META_EN: blank() }).hit, 'G6b 摘除豁免后应命中');
});

// ─── H. 加性证明：新族与存量族互不承重（接线零改动纪律）────────────
test('H1 摘除存量 SOURCE_ZH 不影响词源族命中', () => {
  const t = '「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主';
  assert(checkGeneticFallacy(t, { SOURCE_ZH: blank() }).hit, 'H1 摘 SOURCE_ZH 后词源族应仍命中');
});

test('H2 摘除词源族常量不影响存量起源谬误命中', () => {
  const t = '这个观点是年轻人提出的，肯定不成熟';
  assert(checkGeneticFallacy(t, { ETYM_ZH: blank(), ETYM_NORM_ZH: blank() }).hit,
    'H2 摘词源常量后存量起源谬误应仍命中');
});

// ─── I. 存量回归：round-693 SOURCE×QUALITY 族不回归 ────────────────
test('I1 存量起源谬误样本仍命中（SOURCE×QUALITY 路由未破坏）', () => {
  const old = [
    '这个观点是年轻人提出的，肯定不成熟',
    '外国人写的书，能适合中国国情吗',
    '小作坊生产的，质量能好到哪去',
    '这理论是两百年前提出的，早就过时了',
    'This idea came from a freshman, so it cannot be worth much.',
    'He is from a small town, so his judgment cannot be trusted.',
  ];
  for (const t of old) assert(checkGeneticFallacy(t).hit, '存量起源谬误回归: ' + t);
});

test('I2 存量良性不误伤（round-693 D 组抽样）', () => {
  const benign = [
    '这份年报经过四大会计师事务所审计，数据可信度较高',
    '进口设备和国产设备各有优势，要按实测数据选型',
    '这个方案不成熟，数据支撑不够',
    'Peer-reviewed studies generally carry more weight than blog posts.',
    '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误',
  ];
  for (const t of benign) assert(!checkGeneticFallacy(t).hit, '存量良性误伤: ' + t);
});

// ─── J. 接线完整性 ─────────────────────────────────────────────
test('J1 discriminate() 返回含 genetic_fallacy 键且词源攻击 count>0', () => {
  const d = gate.discriminate('「民主」这个词源于希腊语的「人民统治」，所以只有人民直接统治的制度才算真正的民主');
  assert(d.dimensions.genetic_fallacy, 'dimensions 缺 genetic_fallacy 键');
  assert(d.dimensions.genetic_fallacy.count > 0, 'count 应 > 0');
});

test('J2 __internals 暴露 6 个新常量', () => {
  const I = __internals();
  for (const k of ['ETYM_ZH', 'ETYM_EN', 'ETYM_NORM_ZH', 'ETYM_NORM_EN', 'ETYM_META_ZH', 'ETYM_META_EN']) {
    assert(I[k], '__internals 缺 ' + k);
  }
});

test('J3 index.js 导出 checkGeneticFallacy 可调用', () => {
  assertEqual(typeof idx.checkGeneticFallacy, 'function', 'index.js 未导出 checkGeneticFallacy');
  assert(checkGeneticFallacy('「大学」的本义是追求普遍学问，所以现在只教专业技能的根本不配叫大学').hit, '导出函数应可调用');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
