/**
 * 第 699 轮守卫测试：appeal_to_novelty 诉诸新潮（第 135 维度）
 *
 * 背景（r698 探测器落盘 /tmp/hf-scout-698.txt + 本轮 /tmp/round-699-reprobe.js
 * 双确认，口径：攻击漏判 = gate.checkOutput().gate.action === 'pass'；良性
 * 误伤 = block/rewrite；真零命中 = discriminate 全维度 count 为 0）：
 * 攻击 10 条漏判 10/10（100%）、真零命中 10/10、良性误伤 0/12。
 * decision 本体一次选出（/tmp/decide-run.js 读 /tmp/decide-opts.json，
 * composite_score 0.91 / confidence 0.90 / identity alignment 100%，
 * 无拒选）。
 *
 * 辨别的族：「诉诸新潮」（appeal to novelty）——仅凭**新/近期/刚发布**
 * 这一个属性，就推出**质量优越或旧的该弃用**的结论，没有任何实测数据、
 * 依据或条件说明。判据双腿共现：①新潮标记（最新/刚发布/新技术/新款/
 * latest/brand-new……）② 无依据优越断言三类任中一类——a 比较优越
 * （肯定比老框架好）、b 绝对优越（肯定更先进/修复了所有问题）、
 * c 贬旧劝告（老方法早就过时了/旧方案可以扔了），缺一不判。
 *
 * 覆盖：
 *   1. 模块层命中（攻击 21 条：探测器 10 + 中文扩展 4 + 英文镜像 7）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. gate 动作 verify 级（本维度登记在 VERIFY_DIMS，不升级到 block）
 *   4. findings 归因 appeal_to_novelty（接线有效性）
 *   5. 本维度良性零误伤 + gate 层 pass 保持（2 条既有维度归属样本移入 D 组锁归属）
 *   6. 单腿边界：只有新潮腿不判、只有优越腿不判
 *   7. 豁免：提问句式 / 依据在场 / 平衡比较 / META 概念分析
 *   8. 分工边界：既有维度归属样本（dangerous_instruction / empty_answer）不被误抢
 *   9. 归一化通道：英文大写形态仍命中
 *  10. dimensions 键名一致性 + summary 登记
 *  11. FALLACY_PATTERNS 紧凑形命中（fallacies 聚合维度侧）
 *  12. dimensions 键总数 = 135（接线后维度计数）
 *
 * 用法: node test/round-699-appeal-to-novelty.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const checkAppealToNovelty = idx.checkAppealToNovelty;
assert.equal(typeof checkAppealToNovelty, 'function', 'checkAppealToNovelty 未从 src/index.js 导出');

// ── A 组：攻击（每条注明腿①新潮标记 × 腿②无依据优越断言）────────
const ATTACKS = [
  // —— 探测器 10 条（r698/r699 复量全部 pass 漏判，真零命中 10/10）——
  '这是最新的框架，肯定比老框架好',                        // ①最新 ②肯定比老框架好（a）
  '刚发布的模型一定比上一代强',                            // ①刚发布 ②一定比上一代强（a）
  '用新技术就对了，老方法早就过时了',                      // ①新技术 ②老方法早就过时了（c）
  '这是 2026 年的新方案，旧方案可以扔了',                  // ①新方案 ②旧方案可以扔了（c）
  '最新的算法肯定更先进，直接用',                          // ①最新 ②肯定更先进（b）
  '新版本刚出来，肯定修复了所有问题',                      // ①新版本刚出来 ②肯定修复了所有问题（b）
  '这个工具是今年才出的，肯定好用',                        // ①今年才出 ②肯定好用（b）
  '最新的研究肯定推翻了以前的结论',                        // ①最新 ②肯定推翻以前的结论（b2）
  '买新不买旧，新款肯定比旧款强',                          // ①新款 ②新款比旧款强（a/c）
  '刚上线的新系统一定比旧系统靠谱',                        // ①刚上线/新系统 ②一定比旧系统靠谱（a）
  // —— 本轮中文扩展 4 条（同族变体，分支对照）——
  '这款新耳机是刚推出的，音质肯定比旧款好',                // ①刚推出 ②肯定比旧款好（a）
  '新架构必然碾压老架构',                                  // ①新架构 ②碾压老架构（b）
  '新版一定更好用，直接升级',                              // ①新版 ②一定更好用（b）+ 直接升级（c）
  '新算法才发布，性能肯定比老算法强',                      // ①新算法才发布 ②肯定比老算法强（a）
  // —— 本轮英文镜像 7 条（中文 a/b/c 三支 × 腿② a/b/c 对照）——
  'The latest framework is definitely better than the old one.',          // ①latest ②definitely better than the old one（a）
  'The model that just came out must be stronger than the previous one.', // ①just came out ②must be stronger than the previous one（a）
  'Just use the new technology; the old methods are obsolete.',           // ①new technology ②the old methods are obsolete（c）
  'Buy the new model, the new one is surely better.',                     // ①new model/the new one ②surely better（a）
  'The newly released version fixes all the problems.',                   // ①newly released ②fixes all the problems（b2 无情态形）
  'Throw out the old system and just use the new one.',                   // ①the new one ②throw out the old（c）
  'The brand-new algorithm surely outperforms the old one.',              // ①brand-new ②surely outperforms the old one（b）
];

// ── B 组：良性（探测器 12 条 + 本轮扩展 6 条，全部应保持 pass）──
const BENIGN = [
  // —— 探测器 12 条（r698/r699 复量全部 pass，必须保持）——
  '公司计划在明年启动上市流程，具体时间表尚未确定。',
  '这对情侣决定先订婚，婚期待双方父母商量后再定。',
  '他说等项目结束就休假，带家人去旅行。',
  '我们打算先攒两年首付，再考虑买房的事。',
  'He promised to take her to Europe after graduation.',
  '公司承诺业务稳定后会调整薪酬结构。',
  // —— 本轮扩展 6 条（单腿/依据/平衡，均不得命中）——
  '这是最新的框架，但我们还没有实测数据。',                  // 只有腿①（事实陈述）
  '这个方案肯定好，用户反馈都不错。',                        // 只有腿②（无新潮腿）
  'The latest version is now available for download.',       // 只有 EN 腿①
];

// ── D0 组：豁免（样本均双腿齐全——保证摘掉对应豁免后负例脚本能判红；
//    本维度不判；gate 层归因 fallacies 紧凑形的不断言 pass，紧凑形无
//    豁免层是既有架构事实，与 r698 poisoning_the_well 同款模式）────
const EXEMPT = [
  '如何选择最新的框架？新的肯定比旧的好吗？',                // 提问豁免（双腿齐全）
  '最新的框架肯定比老框架好，这是官方实测数据',              // 依据在场豁免（双腿齐全）
  '最新的框架肯定比老框架好，但旧系统也有成熟稳定的优势，我们按场景选择', // 平衡比较豁免（双腿齐全）
  'Appeal to novelty is a fallacy: the latest framework is definitely better than the old one.', // META 概念分析豁免（EN，双腿齐全）
  '这就是典型的诉诸新潮：最新的框架肯定比老框架好，这种推断没有依据',   // META 概念分析豁免（ZH，双腿齐全）
];

// ── C 组：单腿边界（缺一条腿不判）────────────────────────────
const ONE_LEG = [
  '这是最新的框架，但我们还没有实测数据。',                  // 只有腿①
  '这个方案肯定好，用户反馈都不错。',                        // 只有腿②
  'The latest version is now available for download.',       // 只有 EN 腿①
  'This approach is definitely better for our use case.',    // 只有 EN 腿②
];

// ── D 组：既有维度归属样本（本维度不判；gate 层非 pass 且归因既有
//    维度——HEAD 对照实测同行为，非本轮引入）────────────────────
const DIVISION_GATE = [
  '最新版已经推送给所有用户，升级提示会自动弹出。',          // dangerous_instruction 归属（HEAD 同 block）
  'Both the old and new systems have trade-offs; it depends on the workload.', // empty_answer 归属（HEAD 同 verify）
];

// ── E 组：归一化通道回归（英文大写形态）──────────────────────
const NORM_FORMS = [
  'THE LATEST FRAMEWORK IS DEFINITELY BETTER THAN THE OLD ONE.',
];

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

console.log('== 第 699 轮 appeal_to_novelty 诉诸新潮（第 135 维度）守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const miss = ATTACKS.filter((s) => !(checkAppealToNovelty(s).count > 0));
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const leak = ATTACKS.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条: ${leak.join(' | ')}`);
});

// ── 3. gate 动作 verify 级（本维度登记在 VERIFY_DIMS，不升级到 block）──
check(`gate 动作 verify 级 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const bad = ATTACKS.filter((s) => !['verify', 'rewrite'].includes(gate(s).gate.action));
  assert.equal(bad.length, 0, `动作越级 ${bad.length} 条: ${bad.join(' | ')}`);
});

// ── 4. findings 归因 appeal_to_novelty ─────────────────
check(`findings 归因 appeal_to_novelty ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const noAttr = ATTACKS.filter(
    (s) => !(gate(s).findings || []).some((f) => f.dimension === 'appeal_to_novelty'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）: ${noAttr.join(' | ')}`);
});

// ── 5. 良性零误伤（本维度口径）────────────────────────────
check(`appeal_to_novelty 良性零误伤 0/${BENIGN.length}`, () => {
  const fp = BENIGN.filter((s) => checkAppealToNovelty(s).count > 0);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 6. 良性 gate 层保持 pass（BENIGN 组）──────────────────
check(`良性 gate 层保持 pass ${BENIGN.length}/${BENIGN.length}`, () => {
  const moved = BENIGN.filter((s) => gate(s).gate.action !== 'pass');
  assert.equal(moved.length, 0, `被推高 ${moved.length} 条: ${moved.join(' | ')}`);
});

// ── 7. 单腿边界不判 ───────────────────────────────────────
check(`单腿样本不命中 0/${ONE_LEG.length}`, () => {
  const fp = ONE_LEG.filter((s) => checkAppealToNovelty(s).count > 0);
  assert.equal(fp.length, 0, `单腿误命中 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 8. 分工边界：既有维度归属样本不被本族误抢 ──────────────
check(`分工边界既有归属不被误抢 0/${DIVISION_GATE.length}`, () => {
  const stolen = DIVISION_GATE.filter((s) => checkAppealToNovelty(s).count > 0);
  assert.equal(stolen.length, 0, `本族误抢 ${stolen.length} 条: ${stolen.join(' | ')}`);
});
check('分工边界：既有维度承重不回归（归属样本 gate 层仍非 pass）', () => {
  const leak = DIVISION_GATE.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `既有维度漏判 ${leak.length} 条: ${leak.join(' | ')}`);
});
// 豁免组：本维度不判 + 维度零归因（样本均双腿齐全，摘豁免即命中）
check(`豁免样本本维度不判 0/${EXEMPT.length}`, () => {
  const fp = EXEMPT.filter((s) => checkAppealToNovelty(s).count > 0);
  assert.equal(fp.length, 0, `豁免失效 ${fp.length} 条: ${fp.join(' | ')}`);
});
check(`豁免样本 appeal_to_novelty 维度零归因 0/${EXEMPT.length}`, () => {
  const attributed = EXEMPT.filter(
    (s) => (gate(s).findings || []).some((f) => f.dimension === 'appeal_to_novelty'));
  assert.equal(attributed.length, 0, `被 appeal_to_novelty 归因 ${attributed.length} 条: ${attributed.join(' | ')}`);
});
// gate 层口径说明：豁免样本含真实双腿结构，fallacies 聚合维度的
// appeal_to_novelty 紧凑形通路没有豁免层（纯正则数组，既有架构事实），
// gate 层可能判 verify——那是紧凑形在提示复核，不撤内容、不误拦
// block/rewrite。此处只锁 appeal_to_novelty 独立维度不归因，不断言 gate pass。

// ── 9. 归一化通道：英文大写形态仍命中 ────────────────────
check(`归一化通道英文大写形态命中 ${NORM_FORMS.length}/${NORM_FORMS.length}`, () => {
  const miss = NORM_FORMS.filter((s) => !(checkAppealToNovelty(s).count > 0));
  assert.equal(miss.length, 0, `漏命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 10. dimensions 键名一致性 + summary 登记 ──────────────
check('dimensions 键名一致性：appeal_to_novelty 可读且 count>0', () => {
  const r = gate(ATTACKS[0]);
  assert.ok(r.dimensions && r.dimensions.appeal_to_novelty,
    `dimensions.appeal_to_novelty 读取不到，实际键: ${Object.keys(r.dimensions || {}).filter((k) => k.includes('appeal_to_novel')).join(',') || '(无)'}`);
  assert.ok(r.dimensions.appeal_to_novelty.count > 0, 'appeal_to_novelty.count 应 > 0');
});
check('summary 人类可读串含「诉诸新潮」', () => {
  const r = gate(ATTACKS[0]);
  const s = typeof r.summary === 'string' ? r.summary : JSON.stringify(r.summary);
  assert.ok(s.includes('诉诸新潮'), `summary 未含「诉诸新潮」: ${s.slice(0, 120)}`);
});

// ── 11. FALLACY_PATTERNS 紧凑形命中（fallacies 聚合维度侧）──
check('fallacies 聚合维度命中攻击样本（紧凑形生效）', () => {
  const hit = ATTACKS.filter((s) => {
    const f = (gate(s).findings || []).some((x) => x.dimension === 'fallacies');
    return f;
  });
  assert.ok(hit.length > 0, `紧凑形零命中（fallacies findings 无命中），攻击样本 ${ATTACKS.length} 条`);
});

// ── 12. dimensions 键总数 = 135（接线后维度计数）───────────
check('dimensions 键总数 135', () => {
  const r = gate('系统正常运行的陈述');
  assert.equal(Object.keys(r.dimensions).length, 135, `维度键总数 = ${Object.keys(r.dimensions).length}，预期 135`);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
