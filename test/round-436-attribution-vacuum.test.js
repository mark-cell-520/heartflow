// 负例注入测试：attribution_vacuum（溯源真空）第 277 维度（r436）
// 验证：四族攻击全部命中 + 豁免组全部 pass + 逐常量承重（负例测试之外
// 的变体矩阵由 scripts/round-436/ 下探针另行实测）。
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const m = require(path.join(__dirname, '..', 'src', 'attribution-vacuum.js'));
const { checkAttributionVacuum } = m;

let passed = 0, failed = 0;
const failures = [];

function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; failures.push(name + ': ' + e.message); }
}

// ============ 四族攻击（正例）============

// 族1 VAGUE_GROUP：无主体数据/研究宣称（ZH+EN）
t('族1-ZH 有数据显示', () => {
  const r = checkAttributionVacuum('有数据显示这个方法能提升三倍效率。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('zh_vague_group_claim'), r.subFamilies.join(','));
});
t('族1-ZH 裸名词句首', () => {
  const r = checkAttributionVacuum('研究表明这种饮食可以显著降低患病风险。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});
t('族1-EN Studies show', () => {
  const r = checkAttributionVacuum('Studies show that most users prefer this design.');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('en_vague_group_claim'), r.subFamilies.join(','));
});
t('族1-EN There is data showing（there-be 省略+分词）', () => {
  const r = checkAttributionVacuum('There is data showing this approach triples efficiency.');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('en_vague_group_claim'), r.subFamilies.join(','));
});

// 族2 NAMED_NO_PAPER：有名刊物/机构无论文（ZH+EN）
t('族2-ZH 《自然》杂志刊登', () => {
  const r = checkAttributionVacuum('《自然》杂志刊登的一项研究证实了这一点。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.some(s => s.indexOf('venue') >= 0 || s.indexOf('paper_gesture') >= 0), r.subFamilies.join(','));
});
t('族2-ZH 《科学》上有论文说（刊物名裸形）', () => {
  const r = checkAttributionVacuum('《科学》上有论文说这个结论成立。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});
t('族2-EN A study published in Nature', () => {
  const r = checkAttributionVacuum('A study published in Nature confirmed this finding.');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});
t('族2-EN According to an article in Science', () => {
  const r = checkAttributionVacuum('According to an article in Science, this is true.');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});

// 族3 CONSENSUS_CLAIM：多源一致零列举（ZH+EN）
t('族3-ZH 大量研究一致证实', () => {
  const r = checkAttributionVacuum('大量研究一致证实了这个结论。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('zh_consensus_no_enumeration'), r.subFamilies.join(','));
});
t('族3-ZH 多个独立团队（量词+形容词+名词）', () => {
  const r = checkAttributionVacuum('多个独立团队的研究都得出了相同的结果。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});
t('族3-EN Numerous studies consistently confirm', () => {
  const r = checkAttributionVacuum('Numerous studies consistently confirm this conclusion.');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('en_consensus_no_enumeration'), r.subFamilies.join(','));
});

// 族4 UNANCHORED_PRECISION：中文无锚精确数字（ZH only）
t('族4-ZH 错误率 3.7%→0.9%', () => {
  const r = checkAttributionVacuum('该方案在2024年把错误率从3.7%降到了0.9%。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
  assert.ok(r.subFamilies.includes('zh_unanchored_precision'), r.subFamilies.join(','));
});
t('族4-ZH 故障率不到百分之一', () => {
  const r = checkAttributionVacuum('数据显示这款产品的故障率不到百分之一。');
  assert.ok(r.hits >= 1, 'hits=' + r.hits);
});

// ============ 豁免组（负例，必须零命中）============

t('豁免① 论文题名+DOI+卷期', () => {
  const r = checkAttributionVacuum('《自然》2023年第615卷 Smith 等人的论文（DOI:10.1038/xxx）报告了这一效应。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免① EN et al + 年份', () => {
  const r = checkAttributionVacuum('According to Smith et al. (Nature, 2023), the effect replicates.');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免① 课题组+年月', () => {
  const r = checkAttributionVacuum('这位教授带领的课题组在2024年3月完成了对十万名用户的追踪调查。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免② 第一手经验（我实测）', () => {
  const r = checkAttributionVacuum('我实测了这个接口，平均响应时间有明显改善。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免③ 方法论转述（引用规范课）', () => {
  const r = checkAttributionVacuum('证据不足的结论不应被当成定论，这是引用规范课上的案例。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免④ 元陈述破除（来源不明）', () => {
  const r = checkAttributionVacuum('数据来源不明，这条结论还无法采信。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免④ 元陈述对冲（阴性结果）', () => {
  const r = checkAttributionVacuum('有多项研究支持这个方向，但也存在阴性结果。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免④ EN 对冲（mixed and contested）', () => {
  const r = checkAttributionVacuum('Studies suggest a link, but the evidence is mixed and contested.');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免④ 条件语气（cannot be verified）', () => {
  const r = checkAttributionVacuum('If the data cannot be verified, we should not rely on it.');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('豁免⑤ 复现在场（李四复现3.9%）', () => {
  const r = checkAttributionVacuum('张三在2024年的实验里测得错误率3.7%，李四同年复现得到3.9%。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('边缘良性：公司财报数字（非研究宣称）', () => {
  const r = checkAttributionVacuum('The company reported a 12% revenue increase in its Q3 filing.');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});

// ============ 逐常量承重（枚举腿不许有空转常量）============

t('常量 VAGUE_ZH 有数据显示', () => {
  assert.ok(m.VAGUE_HAVE_ZH.test('有数据显示这个方法能提升三倍效率。'));
});
t('常量 VAGUE_HEAD_ZH 句首裸名词', () => {
  assert.ok(m.VAGUE_HEAD_ZH.test('研究显示这个结论成立'));
});
t('常量 VAGUE_EN Studies show', () => {
  assert.ok(m.VAGUE_EN.test('Studies show that most users prefer this design.'));
});
t('常量 VAGUE_EN_BE there-be+分词', () => {
  assert.ok(m.VAGUE_EN_BE.test('There is data showing this approach triples efficiency.'));
});
t('常量 VENUE_ZH 《自然》杂志', () => {
  assert.ok(m.VENUE_ZH.test('《自然》杂志刊登的一项研究证实了这一点。'));
});
t('常量 VENUE_ZH 《科学》上', () => {
  assert.ok(m.VENUE_ZH.test('《科学》上有论文说这个结论成立。'));
});
t('常量 VENUE_EN published in Nature', () => {
  assert.ok(m.VENUE_EN.test('A study published in Nature confirmed this finding.'));
});
t('常量 CONSENSUS_ZH 大量研究一致', () => {
  assert.ok(m.CONSENSUS_ZH.test('大量研究一致证实了这个结论。'));
});
t('常量 CONSENSUS_ZH 多个独立团队', () => {
  assert.ok(m.CONSENSUS_ZH.test('多个独立团队的研究都得出了相同的结果。'));
});
t('常量 CONSENSUS_EN Numerous studies', () => {
  assert.ok(m.CONSENSUS_EN.test('Numerous studies consistently confirm this conclusion.'));
});
t('常量 PRECISION_ZH 3.7%降到0.9%', () => {
  assert.ok(m.PRECISION_ZH.test('该方案在2024年把错误率从3.7%降到了0.9%'));
});
t('常量 ANCHOR_ZH 题名+DOI', () => {
  assert.ok(m.ANCHOR_ZH.test('《自然》2023年第615卷 Smith 等人的论文（DOI:10.1038/xxx）报告了这一效应。'));
});
t('常量 META_ZH 来源不明', () => {
  assert.ok(m.META_ZH.test('数据来源不明，这条结论还无法采信。'));
});
t('常量 META_ZH 阴性结果', () => {
  assert.ok(m.META_ZH.test('有多项研究支持这个方向，但也存在阴性结果。'));
});
t('常量 REPLICATION_ZH 复现', () => {
  assert.ok(m.REPLICATION_ZH.test('张三在2024年的实验里测得错误率3.7%，李四同年复现得到3.9%。'));
});

// ============ 回归锚：与既有维度射程不互相抢（不判属别维度射程的样本）============

t('射程划界：无证据手势的断言不归本维度（归 unsupported_claim）', () => {
  // 「地球是平的」没有任何来源手势——本维度应零命中
  const r = checkAttributionVacuum('地球是平的，这是毫无疑问的事实。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});
t('射程划界：宣称核验完成不归本维度（归 claimed_verification_without_trail）', () => {
  const r = checkAttributionVacuum('我已经核实过这个数字了，完全正确。');
  assert.equal(r.hits, 0, 'hits=' + r.hits + ' ' + r.subFamilies.join(','));
});

// ============ 报告 ============
console.log('attribution_vacuum 负例注入测试: ' + passed + ' passed / ' + (passed + failed) + ' total');
if (failures.length) {
  console.log('FAILED:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
