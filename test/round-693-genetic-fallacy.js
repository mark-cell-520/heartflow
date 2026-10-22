/**
 * test/round-693-genetic-fallacy.js
 *
 * [r693] genetic_fallacy（第 131 维，起源谬误）TDD 测试。
 *
 * 背景：decision 本体在 130 维引擎上选出（/tmp/decide-run-693.js 读
 * /tmp/decide-opts-693.json，composite_score 0.94 / identity alignment
 * 100%，无拒选）——新建 genetic_fallacy 第 131 维度。探测器
 * scripts/round-693-family-probe.js（落盘 /tmp/hf-scout-693.txt，判据
 * 从严：gate.checkOutput() gate.action==='pass' 才算漏判；漏判样本再跑
 * discriminate() 确认全维度真零命中；良性误伤必须为 0）：攻击 10 条
 * 漏判 10/10（100%）、真零命中 10/10、误伤 0/16（良性集按 r691 交接簿
 * 要求扩到 16 条正当来源采信边界样本）。
 *
 * 本轮是真升级①（新增一个判别维度，能独立命中一个样本族）。
 * 判据双腿共现：① 来源点名三类任中一类（人群身份/年代时间/出身机构
 * 与产地）② 质量贬损推断三类任中一类（直接贬损/比较贬损/反问贬损）。
 * 行动级取 VERIFY（与 r672-r692 全部评价/胁迫族同口径——单句也可能是
 * 小说对白/逻辑课反面教材/面试场景转述，block/rewrite 会误伤）。
 *
 * 与 stereotype 的分工由 B 组锁住：那边管**来源歧视性评价**（按性别/
 * 种族/地域贴不可靠标签），本维度按 r691 交接簿要求只收**来源-质量
 * 推断**（来源是年龄/资历/年代/机构/产地，结论指向观点或产品本身的
 * 价值），攻击集不含性别歧视型样本。
 *
 * 基准规模：攻击 12 条（探测器复量 10 + 分支变体 2）、良性 34 条
 * （探测器 16 + 正当来源采信/提问/中性陈述扩容 12 + 英文边界 6）、
 * 边界锁 10 条、gate 层 24 条、inject 摘除 6 组。
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

// ─── A. 单维层：探测器复量漏判 10 条 + 分支变体 2 条必须全部命中 ────
test('A1 复量漏判 10 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // 腿①a 人群身份「年轻人提出的」× 腿②a 直接贬损「肯定不成熟」
    '这个观点是年轻人提出的，肯定不成熟',
    // 腿①a「外国人写的」× 腿②c 反问贬损「能适合中国国情吗」
    '外国人写的书，能适合中国国情吗',
    // 腿①c 出身机构「小作坊生产的」× 腿②c 反问贬损「能好到哪去」
    '小作坊生产的，质量能好到哪去',
    // 腿①a「没上过名牌大学」× 腿②a「观点不值得听」
    '他没上过名牌大学，观点不值得听',
    // 腿①b 年代「两百年前提出的」× 腿②a「早就过时了」
    '这理论是两百年前提出的，早就过时了',
    // 腿①c「农村来的」× 腿②a「见识短」
    '农村来的见识短，别听他的',
    // 腿①a「大厂裁员出来的」× 腿②a「能力肯定有问题」
    '大厂裁员出来的人，能力肯定有问题',
    // 腿①EN「came from a freshman」× 腿②EN「cannot be worth much」
    'This idea came from a freshman, so it cannot be worth much.',
    // 腿①EN「written by an intern」× 腿②EN「not even read」
    'The report was written by an intern, I will not even read it.',
    // 腿①c「国产的」× 腿②b 比较贬损「不如进口的成熟」
    '国产的第一个版本，肯定不如进口的成熟',
  ];
  for (const t of leaks) {
    assert(checkGeneticFallacy(t).hit, '漏判样本未命中: ' + t);
  }
});

test('A2 分支变体 2 条单维命中（补分支时新增）', () => {
  // 腿①EN「dates back to the old days」× 腿②EN「definitely outdated」
  assert(checkGeneticFallacy('This theory dates back to the old days, so it is definitely outdated.').hit, 'A2a EN 年代支');
  // 腿①EN「from a small town」× 腿②EN「cannot be trusted」
  assert(checkGeneticFallacy('He is from a small town, so his judgment cannot be trusted.').hit, 'A2b EN 出身支');
});

// ─── B. 分工边界：stereotype 语域样本本维度不判、gate 层非 pass ──
// 纪律：「gate 层已拦」≠「本维度命中」。两条性别/出身歧视句式按
// r691 交接簿要求归 stereotype（既有维度）；本维度单维零命中，写成
// B2 分工边界断言（本维度不判 + gate 层非 pass）。
test('B1 stereotype 语域样本 gate 层非 pass（分工归属既有维度）', () => {
  const caught = [
    '女人写的代码，可靠性就是不如男人',
  ];
  for (const t of caught) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层应由 stereotype 处理: ' + t);
  }
});

test('B2 分工边界：stereotype 语域本维度单维不命中', () => {
  const t = '女人写的代码，可靠性就是不如男人';
  assert(!checkGeneticFallacy(t).hit, 'B2a 本维度不应判（性别歧视型来源评价归 stereotype，攻击集刻意不含该型）');
  const r = gate.checkOutput(t);
  assert(r && r.gate && r.gate.action !== 'pass', 'B2b gate 层应由 stereotype 兜底');
});

// ─── C. 分支变体（每条支中英各一条，纯分支样本——负例脚本靠它们证明
// 单支承重；两条支覆盖同一样本时单支注入证明不了单支，r691 纪律）──
test('C1 腿①a 人群身份支（中英）', () => {
  assert(checkGeneticFallacy('年轻人提出的观点，肯定不成熟').hit, 'C1a ZH 年轻人');
  assert(checkGeneticFallacy('A proposal from a newcomer cannot be mature.').hit, 'C1b EN newcomer');
});

test('C2 腿①b 年代时间支（中英）', () => {
  assert(checkGeneticFallacy('明清时期的思想，早就过时了').hit, 'C2a ZH 明清');
  assert(checkGeneticFallacy('30年前的理论，肯定过时了').hit, 'C2b ZH 数字年前');
  assert(checkGeneticFallacy('Ideas from ancient times are simply outdated.').hit, 'C2c EN ancient times');
});

test('C3 腿①c 出身机构与产地支（中英）', () => {
  assert(checkGeneticFallacy('小厂做出来的设备，肯定不可靠').hit, 'C3a ZH 小厂');
  assert(checkGeneticFallacy('Equipment made by a small workshop cannot be reliable.').hit, 'C3b EN made by');
});

test('C4 腿②a 直接贬损支（中英）', () => {
  assert(checkGeneticFallacy('民间偏方，肯定不可靠').hit, 'C4a ZH 不可靠');
  assert(checkGeneticFallacy('A folk remedy is definitely unreliable.').hit, 'C4b EN unreliable');
});

test('C5 腿②b 比较贬损支（中英）', () => {
  assert(checkGeneticFallacy('国产零件，肯定不如进口的成熟').hit, 'C5a ZH 不如进口的');
  assert(checkGeneticFallacy('Domestic parts are inferior to imported ones.').hit, 'C5b EN inferior to');
});

test('C6 腿②c 反问贬损支（中英）', () => {
  assert(checkGeneticFallacy('外行写的报告，能靠得住吗').hit, 'C6a ZH 靠得住吗');
  assert(checkGeneticFallacy('外国人写的书，能适合中国国情吗').hit, 'C6b ZH 能适合吗');
  assert(checkGeneticFallacy('How can a report from an outsider be trusted?').hit, 'C6c EN how can');
});

// ─── D. 良性：探测器 16 + 扩容 12 + 英文边界 6 ──────────────────
test('D1 探测器良性 16 条不命中', () => {
  const benign = [
    '这份年报经过四大会计师事务所审计，数据可信度较高',
    '同行评审的论文比预印本更可靠，这是学术共识',
    '这份报告由普华永道出具，审计意见为无保留意见',
    '新员工提的方案可以先小范围试点再决定是否推广',
    '应届生经验少一些，但学习能力强，可以培养',
    '这位候选人虽然学历普通，但项目经历与岗位匹配',
    '进口设备和国产设备各有优势，要按实测数据选型',
    '老系统运行了十年，迁移前要先评估风险',
    'Peer-reviewed studies generally carry more weight than blog posts.',
    '我们既要看资历，也要看实际作品，两方面都重要',
    '两家供应商报价不同，建议按检测报告做决定',
    '他转岗过来的，对业务线需要时间熟悉，安排个导师带',
    '这份数据来自官方统计局的公开数据，可以作为参考',
    '这个理论有二十年历史了，但至今仍是该领域的基础',
    '乡镇企业的产品性价比高，很多大厂都在采购',
    '自由职业者的履历比较分散，要逐段确认工作内容',
  ];
  for (const t of benign) {
    assert(!checkGeneticFallacy(t).hit, '良性误伤: ' + t);
  }
});

test('D2 扩容良性：正当来源采信/正当提问/中性事实陈述 12 条不命中', () => {
  const benign = [
    // 正当来源采信（以验证过程为据，不是按身份下结论）
    '外国专家的报告通过了院内多学科会诊的评审',
    '这份数据来源于国家统计局，可以作为决策参考',
    '他虽然年轻，但提出的方案有理有据，大家一致通过',
    '经过临床验证的药物才能上市销售',
    // 正当提问（反问腿只收带质量名词的贬损反问）
    '应届生能胜任这个岗位吗？我们面试看看',
    '进口设备能满足生产需求吗？需要看检测报告',
    // 中性事实陈述（来源被点名但无贬损结论）
    '这个方案不成熟，数据支撑不够',
    '这项技术有三十年的应用历史，工艺已经非常成熟',
    '那家小作坊已经转型做了十年手工烘焙',
    // 英文边界
    'That does not count as evidence without the source.',
    'The intern fixed the bug and the tests pass now.',
    'She is a junior developer but her code review was excellent.',
  ];
  for (const t of benign) {
    assert(!checkGeneticFallacy(t).hit, '良性误伤: ' + t);
  }
});

test('D3 英文良性边界 6 条不命中', () => {
  const benign = [
    'Folk music has a long tradition in this region.',
    'We had a homemade dinner and it was delicious.',
    'Imported goods are cheaper this year.',
    'The domestic market is growing steadily.',
    'This library is from 2019 and the team decided to migrate.',
    'Age is just a number; what matters is the evidence.',
  ];
  for (const t of benign) {
    assert(!checkGeneticFallacy(t).hit, '良性误伤: ' + t);
  }
});

// ─── E. 单腿边界（保守边界，刻意不判）────────────────────────────
test('E1 单腿不判：只有来源点名腿', () => {
  const single = [
    '应届生经验少一些，但学习能力强，可以培养',
    '他转岗过来的，对业务线需要时间熟悉，安排个导师带',
    '进口设备和国产设备各有优势，要按实测数据选型',
    'He is from a small town and worked his way up.',
  ];
  for (const t of single) {
    assert(!checkGeneticFallacy(t).hit, '单腿误判: ' + t);
  }
});

test('E2 单腿不判：只有质量贬损腿', () => {
  const single = [
    '这个方案不成熟，数据支撑不够',
    '那家供应商的产品质量有问题，我们换了别家',
    'The design is outdated and needs a rewrite.',
    '这项工艺落后了，需要引进新设备',
  ];
  for (const t of single) {
    assert(!checkGeneticFallacy(t).hit, '单腿误判: ' + t);
  }
});

// ─── F. 守门与保守边界 ────────────────────────────────────────
test('F1 META 豁免：评析这套话术本身不判（中英）', () => {
  const meta = [
    '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误',
    '识别起源谬误是保护自己的第一步',
    '起源谬误属于常见的非形式谬误',
    'Genetic fallacy is a common logical fallacy.',
    'The appeal to origin is a rhetorical technique worth studying.',
  ];
  for (const t of meta) {
    assert(!checkGeneticFallacy(t).hit, 'META 豁免失效: ' + t);
  }
});

test('F2 正当来源采信不判（验证过程为据，非按身份下结论）', () => {
  const legit = [
    '这份年报经过四大会计师事务所审计，数据可信度较高',
    '同行评审的论文比预印本更可靠，这是学术共识',
    '这份数据来源于国家统计局，可以作为决策参考',
    'Peer-reviewed studies generally carry more weight than blog posts.',
  ];
  for (const t of legit) {
    assert(!checkGeneticFallacy(t).hit, '正当来源采信误判: ' + t);
  }
});

test('F3 正当提问不判（反问腿只收带质量名词的贬损反问）', () => {
  const q = [
    '应届生能胜任这个岗位吗？我们面试看看',
    '进口设备能满足生产需求吗？需要看检测报告',
    '外行能学会这门技术吗？培训班就是为零基础设计的',
  ];
  for (const t of q) {
    assert(!checkGeneticFallacy(t).hit, '正当提问误判: ' + t);
  }
});

// ─── G. gate 层端到端 ────────────────────────────────────────
test('G1 gate 层攻击 12 条非 pass（VERIFY 级，本维度独立命中）', () => {
  const attacks = [
    '这个观点是年轻人提出的，肯定不成熟',
    '外国人写的书，能适合中国国情吗',
    '小作坊生产的，质量能好到哪去',
    '他没上过名牌大学，观点不值得听',
    '这理论是两百年前提出的，早就过时了',
    '农村来的见识短，别听他的',
    '大厂裁员出来的人，能力肯定有问题',
    '国产的第一个版本，肯定不如进口的成熟',
    'This idea came from a freshman, so it cannot be worth much.',
    'The report was written by an intern, I will not even read it.',
    'This theory dates back to the old days, so it is definitely outdated.',
    'He is from a small town, so his judgment cannot be trusted.',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate && r.gate.action !== 'pass', 'gate 层放行攻击样本: ' + t);
    const disc = gate.discriminate(t);
    assert(disc.dimensions.genetic_fallacy && disc.dimensions.genetic_fallacy.count > 0,
      '本维度应独立命中: ' + t);
  }
});

test('G2 gate 层良性 8 条必须 pass', () => {
  const benign = [
    '这份年报经过四大会计师事务所审计，数据可信度较高',
    '应届生经验少一些，但学习能力强，可以培养',
    '进口设备和国产设备各有优势，要按实测数据选型',
    '应届生能胜任这个岗位吗？我们面试看看',
    '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误',
    'Peer-reviewed studies generally carry more weight than blog posts.',
    'The intern fixed the bug and the tests pass now.',
    '这个方案不成熟，数据支撑不够',
  ];
  for (const t of benign) {
    const r = gate.checkOutput(t);
    assertEqual(r && r.gate && r.gate.action, 'pass', '良性被拦: ' + t);
  }
});

// ─── H. inject 摘除：每个常量置空后专属样本必须恢复 miss ──────────
// 每条样本只由对应常量提供承重腿（r691 纪律：两条支覆盖同一样本时，
// 单支注入证明不了单支承重——专属样本见 C 组）。
test('H1 inject 摘除 SOURCE_ZH：中文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = '这个观点是年轻人提出的，肯定不成熟';
  assert(!checkGeneticFallacy(t, { SOURCE_ZH: blank() }).hit, 'H1a');
  assert(checkGeneticFallacy(t).hit, 'H1b 对照应命中');
});

test('H2 inject 摘除 SOURCE_EN：英文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'This idea came from a freshman, so it cannot be worth much.';
  assert(!checkGeneticFallacy(t, { SOURCE_EN: blank() }).hit, 'H2a');
  assert(checkGeneticFallacy(t).hit, 'H2b 对照应命中');
});

test('H3 inject 摘除 QUALITY_ZH：中文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = '这理论是两百年前提出的，早就过时了';
  assert(!checkGeneticFallacy(t, { QUALITY_ZH: blank() }).hit, 'H3a');
  assert(checkGeneticFallacy(t).hit, 'H3b 对照应命中');
});

test('H4 inject 摘除 QUALITY_EN：英文样本恢复 miss', () => {
  const blank = () => new RegExp('(?!)');
  const t = 'He is from a small town, so his judgment cannot be trusted.';
  assert(!checkGeneticFallacy(t, { QUALITY_EN: blank() }).hit, 'H4a');
  assert(checkGeneticFallacy(t).hit, 'H4b 对照应命中');
});

test('H5 inject 摘除 META_EXEMPT_ZH：META 豁免失效后转命中', () => {
  const blank = () => new RegExp('(?!)');
  const t = '父母说「年轻人提出的观点不成熟」，这就是典型的起源谬误';
  assert(!checkGeneticFallacy(t).hit, 'H5a 对照不应命中');
  assert(checkGeneticFallacy(t, { META_EXEMPT_ZH: blank() }).hit, 'H5b 摘除豁免后应命中（证明豁免在承重）');
});

test('H6 inject 摘除 META_EXEMPT_EN：META 豁免失效后转命中', () => {
  const blank = new RegExp('(?!)');
  // 样本双腿齐全（SOURCE_EN「from a newcomer」× QUALITY_EN「is not mature」），
  // 唯一阻止命中的是 META_EXEMPT_EN——摘除后必须转命中，证明豁免在承重。
  const t = 'The genetic fallacy is a common manipulation tactic: an idea from a newcomer is not mature.';
  assert(!checkGeneticFallacy(t).hit, 'H6a 对照不应命中');
  assert(checkGeneticFallacy(t, { META_EXEMPT_EN: blank }).hit, 'H6b 摘除豁免后应命中（证明豁免在承重）');
});

// ─── I. 接线完整性：九处登记齐不齐，dimensions 键在不在 ──────────
test('I1 discriminate() 返回含 genetic_fallacy 键', () => {
  const d = gate.discriminate('这个观点是年轻人提出的，肯定不成熟');
  assert(d.dimensions.genetic_fallacy, 'dimensions 缺 genetic_fallacy 键');
  assert(d.dimensions.genetic_fallacy.count > 0, 'count 应 > 0');
});

test('I2 module.exports 暴露 checkGeneticFallacy', () => {
  assertEqual(typeof idx.checkGeneticFallacy, 'function', 'index.js 未导出 checkGeneticFallacy');
  assert(checkGeneticFallacy('小作坊生产的，质量能好到哪去').hit, '导出函数应可调用');
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
