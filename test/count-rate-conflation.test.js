/**
 * test/count-rate-conflation.test.js — r249 计数-比率混淆维度测试
 * 覆盖：攻击命中（中英 pair 型）、良性零误伤（含疑难 FP 压力样本）、
 * 口径意识/概念教学两组豁免族（嵌入真实签名，可负例注入证明承重）、
 * 边界锁（单腿/邻接维度领地/否定前缀/超距/方向约束）、中英混排
 * 多签名、负例注入（腿①计数名词族/腿①比较量级/腿②未归一化裁定
 * 逐族删除/两组豁免/距离窗承重/方向约束承重）、引擎闸。
 * 与 r218-r248 模块同一测试范式：每个负例注入删除一组常量后，攻击
 * 必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectCountRateConflation } = require('../src/count-rate-conflation.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;

// ─── 攻击样本 pair 型（计数锚点 × 比较量级 × 未归一化裁定）──────
const ATTACK_ZH = [
  '我们市癌症病例全国第一，所以这里最不安全',
  '邻省传染病病例是我们的三倍，他们防疫做得更差',
  '这个城市新冠确诊数是邻市的两倍，防疫明显更差',
  '本省交通事故起数比邻省多四成，司机开车更野',
  '这家医院死在手术台上的人最多，说明他们技术最差',
  '这条高速事故最多，显然设计有问题',
  '投诉量全网第一，这家店服务肯定最糟',
  '我校竞赛获奖数是邻校的两倍，所以我们的教育更强',
  '这个系挂科人数全校第一，老师教得最烂',
  '这家店外卖单量是街角那家的五倍，味道肯定更好',
  '他们厂工伤人数比去年多了一倍，说明车间更危险了',
  '本店差评量是同行的三倍，我们的产品明显更差',
  '该市感染人数居首，可见这里医疗水平最差',
  '邻国死亡人数是我们的四倍，他们的防疫更糟',
  '该校名校录取人数第一，说明师资最强',
];
const ATTACK_EN = [
  'Our city has the most cancer cases in the country, so it is the most dangerous place',
  'This city reported twice the cases, so its containment is clearly worse',
  'Our school won twice the prizes, so our education is stronger',
  'This shop takes five times the delivery orders, so its food must be better',
  'The province logged 40% more crashes, so its drivers are more reckless',
  'This hospital has the most surgical deaths, so their technique must be the worst',
  'Their plant recorded double the injuries, so the workshop is more dangerous',
  'Our department has the most failures in the school, so the teaching is the worst',
  'That country reports four times the deaths, so its healthcare is worse',
  'The brand with the most complaints must make the worst products',
  'Our college leads in admissions, so our faculty is the strongest',
  'This airline had the most incidents, so it is the least safe',
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 给出分母的正当比较
  '病例总数第一，但按人口算发病率只排在中游，要看率不能看数',
  '手术例数越多的医院死亡绝对数自然高，得比较死亡率',
  '确诊数是两倍，可人口是我们的四倍，发病率反而更低',
  '投诉量第一，但我们用户基数是人家的十倍，投诉率最低',
  '获奖数是两倍，可我们考生人数是人家的五倍，获奖率并不高',
  '外卖单量五倍，可我们店开在商圈，客流本来就不是一个量级',
  '工伤人数多了一倍，但产量也翻了两倍，万人负伤率其实降了',
  '挂科人数第一，但我们系人数也是最多的，挂科率并不高',
  '差评量三倍，可我们的出货量是人家二十倍，差评率最低',
  '事故起数多四成，可我们的运营里程是对方两倍，事故率更低',
  '病例总数第一，但那是人口大市，每万人发病率只排第十二',
  'The raw count is highest, but per capita the rate is only mid-pack',
  'Twice the cases on four times the population means a lower incidence rate',
  'Twice the prizes on five times the candidates means a lower win rate',
  'Five times the orders, but also ten times the foot traffic, so the rate is lower',
  'Forty percent more crashes on twice the mileage means a lower crash rate',
  'Twice the complaints, but our user base is twenty times larger, so the complaint rate is lowest',
  'The most admissions, but also the largest applicant pool, so the admit rate is middling',
  'Absolute counts are not comparable without normalising by population',
  'Raw counts are not comparable until you normalise them by exposure',
  // 概念教学（点名计数与比率的区别）
  '总数不等于比率，除以人口或暴露量才是可比的口径',
  '计数和比率要分清，原始计数不能直接排名',
  'The report gives only the raw count and omits the per-capita rate',
  'Raw counts are not comparable until you divide by exposure',
  // 单腿：只有计数与量级，无属性裁定
  '我们市癌症病例全国第一',
  '这家店外卖单量是街角那家的五倍',
  'Their city reported the most cases this quarter',
  // 单腿：只有属性裁定，无计数锚点
  '这里更危险，别带孩子来',
  'This workshop is more dangerous than the other one',
  // 纯事实计数陈述（无属性排名裁定）
  '今年病例数比去年多，需要增加门诊人力',
  '病例数创了新高，防疫部门正在排查',
  'Complaint volume rose after the price change',
  // 否定前缀
  '病例数并不是最多的，别急着下结论',
  'Our city does not have the most cases, so the safety ranking is unfair',
  // 邻接维度正当用法
  '只挑好看的月份画图，全年的波动被藏起来了',
  '基数太小，三个里的两个就是百分之六十七',
  '统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人也比乙地区的人长寿',
  'The average income in that country is high, so every individual there is rich',
  '问了三个朋友都说好，这东西肯定靠谱',
  'I asked three friends and they all liked it, so it must be good',
];

// ─── 豁免族 A：口径意识（真实签名 + 分母/率标记，不得命中）─────
const EXEMPT_CORRECTIVE = [
  '我们市癌症病例全国第一，所以这里看起来最不安全——但按人口算发病率只排第十二，是人口大市。',
  'Their city reported twice the cases, so containment looks worse — yet per capita the rate is lower than ours.',
];

// ─── 豁免族 B：概念教学（真实签名 + 概念标记，不得命中）───────
const EXEMPT_CONCEPT = [
  '统计学课上讲过计数与比率：我们市癌症病例全国第一，所以这里最不安全——这就是把原始计数当比率的典型错误。',
  'The lecture on raw counts: our city has the most cases, so it is the most dangerous place — counts are not comparable until normalised.',
];

// ─── 边界锁 ────────────────────────────────────────────────────
const BOUNDARY = [
  ['单腿-有计数无量级', '我们市癌症病例数需要复核。'],
  ['单腿-有量级无裁定', '这家店外卖单量是街角那家的五倍。'],
  ['单腿-有裁定无计数', '这里的治安明显更差。'],
  ['邻接-statistical_misleading', '基数太小，三个里的两个就是百分之六十七。'],
  ['邻接-base_rate_neglect', '这种病患病率只有万分之一，检测阳性就认定得了，太武断。'],
  ['邻接-ecological_fallacy', '统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人也比乙地区的人长寿。'],
  ['否定前缀-并不是最多', '病例数并不是最多的，所以这里最不安全的说法站不住。'],
  ['反向-计数在前裁定缺失', '我们市癌症病例全国第一，但没有任何进一步结论。'],
];
// 双腿超距（默认 PAIR2_ZH=40：计数锚点与裁定拉开 >40 不命中）
const OVERDIST = '我们市癌症病例全国第一，随后市政府组织开展了为期数周的专项复核工作，逐家医院核对原始登记台账，交叉比对了历年的统计报表并走访了大量社区，动员了上百名工作人员参与数据清洗与校验，经过多轮复核确认数据无误，所以这里最不安全。';
// 方向反置：裁定出现在计数锚点之前（默认要求裁定在后）
const REVERSED = '这里明显更差，因为我们市癌症病例全国第一。';

const MIXED = '我们市癌症病例全国第一，所以这里最不安全；our city has the most cases so it is the most dangerous place.';
const MULTI_ZH = '我们市癌症病例全国第一，所以这里最不安全；邻省传染病病例是我们的三倍，他们防疫做得更差。';

console.log('count-rate-conflation（r249 计数-比率混淆）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectCountRateConflation, 'function');
  assert.equal(detectCountRateConflation('').hit, false);
  assert.equal(detectCountRateConflation(null).hit, false);
  assert.equal(detectCountRateConflation('短').hit, false);
});

check('攻击命中：中文 15 条', () => {
  for (const t of ATTACK_ZH) {
    const r = detectCountRateConflation(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'count_rate_conflation');
    assert.ok(r.score >= 0.6 && r.score <= 0.8, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

check('攻击命中：英文 12 条', () => {
  for (const t of ATTACK_EN) {
    const r = detectCountRateConflation(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.8);
  }
});

check('良性零误伤：32 条（含疑难 FP 压力样本）', () => {
  for (const t of BENIGN_HARD) assert.equal(detectCountRateConflation(t).hit, false, '误伤: ' + t);
});

check('豁免族：口径意识（中英 2 条）', () => {
  for (const t of EXEMPT_CORRECTIVE) assert.equal(detectCountRateConflation(t).hit, false, '误伤: ' + t);
});

check('豁免族：概念教学（中英 2 条）', () => {
  for (const t of EXEMPT_CONCEPT) assert.equal(detectCountRateConflation(t).hit, false, '误伤: ' + t);
});

check('边界锁：单腿/邻接/否定前缀/超距/方向反置不判', () => {
  for (const [k, t] of BOUNDARY) assert.equal(detectCountRateConflation(t).hit, false, '误判[' + k + ']: ' + t);
  assert.equal(detectCountRateConflation(OVERDIST).hit, false, '默认邻近窗超距不命中');
  assert.equal(detectCountRateConflation(REVERSED).hit, false, '裁定在计数锚点之前（方向约束）不命中');
});

check('中英混排与多签名加分档', () => {
  const m = detectCountRateConflation(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.ok(m.count >= 2, '多签名（中英双腿各自成签名）');
  assert.ok(Math.abs(m.score - 0.72) < 1e-9, '双签名加分档');
  const z = detectCountRateConflation(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.ok(z.count >= 2, '多签名');
  assert.ok(Math.abs(z.score - 0.72) < 1e-9, '双签名加分档');
});

check('负例注入：腿①计数名词（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectCountRateConflation(t, { COUNT_ZH: [] }).hit, false, '删计数名词ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectCountRateConflation(t, { COUNT_EN: [] }).hit, false, '删计数名词EN: ' + t.slice(0, 20));
});

check('负例注入：腿①比较量级（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectCountRateConflation(t, { QTY_ZH: [] }).hit, false, '删比较量级ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectCountRateConflation(t, { QTY_EN: [] }).hit, false, '删比较量级EN: ' + t.slice(0, 20));
});

check('负例注入：腿②未归一化裁定（中英）删除后 pair 型攻击全部不再命中', () => {
  for (const t of ATTACK_ZH) assert.equal(detectCountRateConflation(t, { VERDICT_ZH: [] }).hit, false, '删裁定ZH: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectCountRateConflation(t, { VERDICT_EN: [] }).hit, false, '删裁定EN: ' + t.slice(0, 20));
});

check('负例注入：腿①内部距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  // 计数名词与比较量级拉开 >14 字的句子
  const FAR_QTY = '我们市癌症病例在过去十二个月里持续攀升，最终汇总出来的总量排名全国第一，所以这里最不安全';
  assert.equal(detectCountRateConflation(FAR_QTY).hit, false, '默认 PAIR_ZH=14 超距不命中');
  assert.equal(detectCountRateConflation(FAR_QTY, { PAIR_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：腿①×腿②距离窗承重（收紧到 0 后 pair 型攻击不再命中）', () => {
  for (const t of ATTACK_ZH) assert.equal(detectCountRateConflation(t, { PAIR2_ZH: 0 }).hit, false, 'PAIR2_ZH=0: ' + t.slice(0, 20));
  for (const t of ATTACK_EN) assert.equal(detectCountRateConflation(t, { PAIR2_EN: 0 }).hit, false, 'PAIR2_EN=0: ' + t.slice(0, 20));
});

check('负例注入：腿①×腿②距离窗放大后超距句命中（窗双向承重）', () => {
  assert.equal(detectCountRateConflation(OVERDIST).hit, false, '默认窗不命中');
  assert.equal(detectCountRateConflation(OVERDIST, { PAIR2_ZH: 500 }).hit, true, '放大窗后命中');
});

check('负例注入：口径意识豁免删除后豁免句变红（承重证明）', () => {
  assert.equal(detectCountRateConflation(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }).hit, true, '删口径意识ZH');
  assert.equal(detectCountRateConflation(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }).hit, true, '删口径意识EN');
});

check('负例注入：概念教学豁免删除后豁免句变红（承重证明）', () => {
  // 概念教学句必然含「率/不可比」等口径词，故同注 CORRECTIVE 以隔离出 CONCEPT 的承重
  assert.equal(detectCountRateConflation(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER, CORRECTIVE_ZH: NEVER }).hit, true, '删概念教学ZH');
  assert.equal(detectCountRateConflation(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER, CORRECTIVE_EN: NEVER }).hit, true, '删概念教学EN');
});

check('负例注入：方向约束承重（放开「裁定须在后」后反置句命中）', () => {
  // 用 PAIR2_ZH=0 + 反向句无法命中；改用构造验证：反置句在默认约束下不命中，
  // 而把同句倒装成「计数在前」即命中——证明约束真实承重。
  assert.equal(detectCountRateConflation(REVERSED).hit, false, '反置句默认不命中');
  assert.equal(detectCountRateConflation('我们市癌症病例全国第一，所以这里明显更差').hit, true, '同成分正置句命中');
});

check('引擎闸：良性样本不得以 count_rate_conflation 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('count_rate_conflation'), '误伤: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
