/**
 * 第 697 轮守卫测试：appeal_to_authority 补「第三人称权威 + 反质疑/资格剥夺」句式族
 *
 * 背景（r697 轮前复量探针 /tmp/hf-scout-697.txt，口径与 r696 一致）：
 * 该族 6 条攻击样本（「医生都说了，你还质疑什么」等）gate 全 pass、
 * discriminate 全维度真零命中（6/6），良性 10 条零误伤。根因是原有
 * AUTHORITY_PATTERNS 60 条全是**第三人称转述**（据权威机构/according to
 * experts/studies show），AUTHORITY_FIRST_PERSON（r227）只管**第一人称**
 * 职权声明（我是X/我说了算）——「权威在场 + 反问封口/资格剥夺」这一族
 * 两边都不收。
 *
 * 覆盖：
 *   1. 模块层命中（攻击 20 条：探测器 6 + 中文扩展 6 + 英文镜像 8）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. findings 归因到 appeal_to_authority（接线有效性）
 *   4. 良性零误伤（15 条：探测器 10 + 扩展 5）
 *   5. 单腿边界：只有权威名词不判、只有剥夺短语不判
 *   6. dimensions 键名一致性（appeal_to_authority 可读、旧键不存在）
 *   7. 归一化通道：CEO 被归一化小写化后仍命中（r697 踩坑回归锁）
 *   8. 分工边界：info_deprivation 归属样本不被本族误抢
 *   9. 既有测试不回归由 test/appeal-authority-first-person-r227.test.js 等
 *      三个既有文件在验证集中单独跑（本文件不复制夹具）
 *
 * 用法: node test/round-697-appeal-authority-dismissal.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const checkAppealToAuthority = idx.checkAppealToAuthority;
assert.equal(typeof checkAppealToAuthority, 'function', 'checkAppealToAuthority 未从 src/index.js 导出');

// ── A 组：新族攻击（每条注明腿①权威名词 × 腿②反质疑/资格剥夺）────────
const ATTACKS = [
  // —— 探测器 6 条（r697 前全部 pass 漏判，真零命中 6/6）——
  '医生都说了，你还质疑什么',                    // ①医生 ②你还质疑什么
  '专家一致认为，你比专家还懂？',                // ①专家 ②你比X还懂
  'CEO 亲自拍板的方向，执行就对了',              // ①CEO ②执行就对了（归一化会把 CEO 小写化）
  '书上写的还能有错？作者是泰斗级人物',          // ①泰斗/作者 ②还能有错（权威名词在后）
  '导师的研究方向，轮得到你来评价',              // ①导师 ②轮得到你来评价
  '官方通报都出来了，你凭什么不信',              // ①官方/通报 ②你凭什么不信
  // —— 本轮中文扩展 6 条（同族变体）——
  '领导早就定了，你管得着吗',                    // ①领导 ②你管得着吗
  '爸妈吃过的盐比你吃过的米还多，听就行了',      // ①爸妈 ②听就行了
  '教授署名的论文还能有假？',                    // ①教授 ②还能有假
  '这是权威部门的结论，不该问的别问',            // ①权威 ②不该问的别问
  '主任都这么说了，你算老几',                    // ①主任 ②你算老几
  '前辈走过的桥比你走过的路还多，照做就行',      // ①前辈 ②照做就行
  // —— 本轮英文镜像 8 条（分支对照：中文腿有几个分支，英文腿就要有几个）——
  'The doctor said so, who are you to question it?',                              // ①doctor ②who are you to question
  'All the experts agree. Do you think you know better than they do?',            // ①experts ②know better than
  'The CEO made the call. Just obey and execute it.',                             // ①CEO ②just obey
  'It is written in the book and the author is a leading authority, how could it be wrong?', // ①author/authority ②how could it be wrong
  'This is your supervisor research direction. It is not your place to judge it.', // ①supervisor ②not your place to judge
  'The official report is out. What right do you have to doubt it?',              // ①official ②what right do you have to doubt
  'Your professor published the paper. Are you saying the professor is wrong?',   // ①professor ②are you saying ... is wrong
  'Stop asking questions and just do as you are told.',                           // ①as you are told（隐含权威）②stop asking questions
];

// ── B 组：良性（探测器 10 条 + 本轮扩展 5 条）──────────────────────
const BENIGN = [
  // —— 探测器 10 条（r697 前全部 pass，补丁后必须保持）——
  '专家意见可以参考，但也要看证据是否支持',
  '这位诺贝尔奖得主的研究领域与这个话题无关',
  '遵医嘱治疗，同时保留二次诊疗的权利',
  '权威结论也会被新证据修正，科学是动态发展的',
  'Peer review exists precisely to check authority claims.',
  '老板做了决定，我可以执行并保留书面意见',
  '通报内容可以与现场事实相互印证',
  '泰斗的著作也要区分观点与证据',
  '导师的假设需要用实验数据验证',
  '引用权威时要注明出处和适用范围',
  // —— 本轮扩展 5 条 ——
  'You should follow the doctor advice and also seek a second opinion.',  // 有权威名词+求医动作，无剥夺短语
  'The official report should be cross-checked against on-site facts.',   // 有官方报告，无剥夺短语
  'Experts can be wrong, so we verify claims against data.',              // 明确质疑权威是正当做法
  '医生说吃三天药，症状没好转就复诊',                                    // 医嘱+复诊机制，无剥夺短语
  '领导同意了，但流程上还要走变更单',                                    // 同意+流程要求，无剥夺短语
];

// ── C 组：单腿边界（缺一条腿不判）────────────────────────────────
const ONE_LEG = [
  '这位专家在领域内很有声望',              // 只有腿①（无剥夺短语）
  'The professor gave a lecture yesterday.', // 只有腿①
  '你别问那么多了，先看文档',              // 只有腿②（无权威名词）
  'Just obey the instructions in the manual.', // 只有腿②（manual 不是权威名词）
  '照做就行，别犹豫',                      // 只有腿②
  'who are you to question the results',   // 只有腿②（results 不是权威名词）
];

// ── D 组：归一化通道回归（r697 踩坑：归一化把 CEO 小写化）────────
const NORM_FORMS = [
  'CEO 亲自拍板的方向，执行就对了',
  'ceo 亲自拍板的方向，执行就对了',  // 归一化后的形态（text-normalizer 会 lowercasing）
];

// ── E 组：分工边界（归属 info_deprivation，不被本族误抢）──────────
const DIVISION = [
  '我老板说是就是，你不需要知道原因',  // info_deprivation 归属；本族 dismiss 表不收「不需要知道原因」
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

console.log('== 第 697 轮 appeal_to_authority 第三人称权威+反质疑/资格剥夺句式族守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const miss = ATTACKS.filter((s) => !(checkAppealToAuthority(s).count > 0));
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 2. gate 层非 pass ─────────────────────────────────────
check(`gate 非 pass ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const leak = ATTACKS.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条: ${leak.join(' | ')}`);
});

// ── 3. gate 层动作是 verify 级（本维度登记在 VERIFY_DIMS，不升级到 block）──
check(`gate 动作 verify 级 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const bad = ATTACKS.filter((s) => !['verify', 'rewrite'].includes(gate(s).gate.action));
  assert.equal(bad.length, 0, `动作越级 ${bad.length} 条: ${bad.join(' | ')}`);
});

// ── 4. findings 归因到 appeal_to_authority ─────────────────
check(`findings 归因 appeal_to_authority ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const noAttr = ATTACKS.filter(
    (s) => !(gate(s).findings || []).some((f) => f.dimension === 'appeal_to_authority'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）`);
});

// ── 5. 良性零误伤（本维度口径）────────────────────────────
check(`appeal_to_authority 良性零误伤 0/${BENIGN.length}`, () => {
  const fp = BENIGN.filter((s) => checkAppealToAuthority(s).count > 0);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 6. 良性 gate 层零动作变化（不得从 pass 被推高）──────────
check(`良性 gate 层保持 pass ${BENIGN.length}/${BENIGN.length}`, () => {
  const moved = BENIGN.filter((s) => gate(s).gate.action !== 'pass');
  assert.equal(moved.length, 0, `被推高 ${moved.length} 条: ${moved.join(' | ')}`);
});

// ── 7. 单腿边界不判 ───────────────────────────────────────
check(`单腿样本不命中 0/${ONE_LEG.length}`, () => {
  const fp = ONE_LEG.filter((s) => checkAppealToAuthority(s).count > 0);
  assert.equal(fp.length, 0, `单腿误命中 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 8. 归一化通道：CEO 大小写两形态都命中 ──────────────────
check(`归一化通道 CEO 两形态均命中 2/${NORM_FORMS.length}`, () => {
  const miss = NORM_FORMS.filter((s) => !(checkAppealToAuthority(s).count > 0));
  assert.equal(miss.length, 0, `漏命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 9. 分工边界：info_deprivation 样本不被本族抢命中 ───────
check(`分工边界 info_deprivation 归属 0/${DIVISION.length}`, () => {
  const stolen = DIVISION.filter((s) => checkAppealToAuthority(s).count > 0);
  assert.equal(stolen.length, 0, `本族误抢 ${stolen.length} 条: ${stolen.join(' | ')}`);
});
check('分工边界 info_deprivation 归属样本仍被 gate 拦（既有维度承重）', () => {
  const leak = DIVISION.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `既有维度漏判 ${leak.length} 条: ${leak.join(' | ')}`);
});

// ── 10. dimensions 键名一致性（r697 修复：旧键 appeal_to_authority_boost 已统一）──
check('dimensions 键名一致性：appeal_to_authority 可读', () => {
  const r = gate(ATTACKS[0]);
  assert.ok(r.dimensions && r.dimensions.appeal_to_authority,
    `dimensions.appeal_to_authority 读取不到，实际键: ${Object.keys(r.dimensions || {}).filter((k) => k.includes('authority')).join(',') || '(无 authority 相关键)'}`);
  assert.ok(r.dimensions.appeal_to_authority.count > 0, 'appeal_to_authority.count 应 > 0');
  assert.equal(r.dimensions.appeal_to_authority_boost, undefined,
    '旧键 appeal_to_authority_boost 仍存在——键名未统一');
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
