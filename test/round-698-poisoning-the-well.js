/**
 * 第 698 轮守卫测试：poisoning_the_well 井里投毒（第 134 维度）
 *
 * 背景（r698 轮前探测器 /tmp/round-698-pre-probe.js，落盘 /tmp/hf-scout-698.txt，
 * 口径：攻击漏判 = gate.checkOutput().gate.action === 'pass'；良性误伤 =
 * block/rewrite；真零命中 = discriminate 全维度 count 为 0）：
 * 攻击 10 条漏判 10/10（100%）、真零命中 10/10、良性误伤 0/12。
 * decision 本体一次选出（/tmp/decide-run-698.js，composite_score 0.92 /
 * confidence 0.92 / identity alignment 100%，无拒选）。
 *
 * 辨别的族：「井里投毒」（poisoning the well）——说话者的**动机、历史、
 * 身份被预先定性为不可信**，并以此为据**拒绝采信其观点或建议**。
 * 判据双腿共现：①预先污名定性（动机揣测/历史污名/身份贬低）② 拒绝
 * 采信结论（直接否定/观点宾语在场/反问式否定），缺一不判。
 *
 * 覆盖：
 *   1. 模块层命中（攻击 24 条：探测器 9 + 中文扩展 8 + 英文镜像 7）
 *   2. gate 层非 pass（走真实判别管线）
 *   3. gate 动作 verify 级（本维度登记在 VERIFY_DIMS，不升级到 block）
 *   4. findings 归因 poisoning_the_well（接线有效性）
 *   5. 本维度良性零误伤 + gate 层 pass 保持（2 条既有维度归属样本移入 B2 锁归属）
 *   6. 单腿边界：只有污名腿不判、只有拒绝腿不判
 *   7. 豁免：反诈提醒 / 匿名消息源质疑 / META 概念分析 / 立场披露
 *   8. 分工边界：appeal_to_motive（动机揣测单句）与 premature_termination
 *      （草率收尾）归属样本不被本族误抢，且既有维度承重不回归
 *   9. 归一化通道：英文大写形态仍命中
 *  10. dimensions 键名一致性 + summary 登记
 *  11. FALLACY_PATTERNS 紧凑形命中（fallacies 聚合维度侧）
 *
 * 用法: node test/round-698-poisoning-the-well.js
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const checkPoisoningTheWell = idx.checkPoisoningTheWell;
assert.equal(typeof checkPoisoningTheWell, 'function', 'checkPoisoningTheWell 未从 src/index.js 导出');

// ── A 组：攻击（每条注明腿①污名定性 × 腿②拒绝采信）────────────
const ATTACKS = [
  // —— 探测器 9 条（r698 前全部 pass 漏判，真零命中 9/9）——
  '他反对这个方案？别听他的，他向来别有用心',            // ①别有用心 ②别听他的
  '她提的建议肯定是为了她自己，不用看内容',              // ①为了她自己 ②不用看
  '这个人上次就站错队，这次也别信',                      // ①站错队 ②也别信
  '他一个竞品过来的，能安什么好心',                      // ①竞品过来的 ②能安什么好心
  '她之前项目就搞砸了，这次的建议也不用听',              // ①搞砸了 ②建议也不用听（宾语前置倒装）
  '别问他意见，他向来喜欢抬杠',                          // ①喜欢抬杠 ②别问
  '她提这个问题就是针对我，理她干什么',                  // ①就是针对 ②理她干什么
  '他一个实习生，能有什么好想法',                        // ①实习生 ②能有什么好想法
  '她的方案肯定是抄的，别浪费时间的',                    // ①方案是抄的 ②别浪费
  // —— 本轮中文扩展 8 条（同族变体，分支对照）——
  '他每次都唱反调，这次肯定也没安好心，别信',            // ①没安好心 ②别信
  '她是被别家收买的，她说的话一个标点都不能信',          // ①被收买 ②不能信
  '这个人一贯如此，他的报告直接跳过',                    // ①一贯如此 ②直接跳过
  '别搭理她，她提这个就是为了刷存在感',                  // ①刷存在感 ②别搭理
  '她一个小姑娘，懂什么业务，别问她',                    // ①小姑娘 ②别问
  '这个博主翻过车，他推荐的东西都别信',                  // ①翻过车 ②都别信
  '他是关系户，方案肯定是走后门做的，看了也白看',        // ①关系户/走后门 ②看了也白看
  '她上次就被通报过，这次的结论也无须看',                // ①被通报过 ②也无须看
  // —— 本轮英文镜像 7 条（中文 a/b/c 三支 × 腿② a/b/c 三支对照）——
  "Don't listen to him, he has always had an agenda.",                                   // ①has had an agenda ②don't listen to
  'Ignore her proposal, she is only looking out for herself.',                            // ①only looking out for herself ②ignore her proposal
  'He messed up the last project, so whatever he says now is worthless.',                // ①messed up ②whatever he says is worthless
  'She is just an intern, no need to read her analysis.',                                 // ①just an intern ②no need to read
  'He got fired last year, so do not take his advice.',                                   // ①got fired ②do not take his advice
  'She is being paid by competitors, discount anything she proposes.',                    // ①is being paid ②discount anything
  'Why listen to him? He is a nobody who knows nothing.',                                 // ①a nobody ②why listen to him
];

// ── B 组：良性（探测器 10 条 + 本轮扩展 4 条，全部应保持 pass）──
const BENIGN = [
  // —— 探测器 10 条（r698 前全部 pass，补丁后必须保持；其中 2 条 gate 层
  //    归 premature_termination 的移入 B2 组，此处收 8 条真 pass）——
  '他的建议我们需要看内容再评估',
  '她上次项目虽然失败，但复盘报告写得很认真',
  '竞品过来的同事带来了不同视角，值得听',
  '他位置不同，看问题的角度也不同，先听完',
  '他确实喜欢提反对意见，但这次数据是对的',
  '她提的问题直指风险点，我们应该回应',
  '实习生的想法也可以讨论，有亮点就采纳',
  '反对意见本身有道理，与动机无关',
  '他提的方案有历史数据支撑，可以试点',
  '她虽然年轻，但压测报告做得扎实',
  // —— 本轮扩展 4 条 ——
  '他有行业背景，观点可能有利益相关性，需要说明',        // 立场披露（正当同行评议实践）
  '她的提案我逐条核对过数据，第三项有问题',              // 就内容回应
  '他虽然上次失败了，但这次的计划书写得很扎实',          // 历史提及但无拒绝腿
  'He has a different background, but his analysis checks out.', // EN：背景差异+内容认可
];

// ── B2 组：既有维度归属样本（本维度不判；gate 层非 pass 且归因既有维度）──
const DIVISION_GATE = [
  '他这个位置说这话，肯定是想推卸责任',                  // appeal_to_motive 归属（fallacies 紧凑形 r698 新补）
  '方案是否原创不重要，能解决问题就行',                  // premature_termination 归属（T5 过程弱化）
  '先看论据，再看立场，别急着否定人',                    // premature_termination 归属（T1 状态陈述）
];
const DIVISION_PURE_PASS = [
  '他这个位置说这话，可能有立场因素，需要说明',          // 纯立场披露：本维度不判且 gate pass
];

// ── C 组：单腿边界（缺一条腿不判）────────────────────────────
const ONE_LEG = [
  '他这个人向来别有用心',                                // 只有腿①（无拒绝腿）
  '这个事的决策别听他的就行',                            // 只有腿②（无污名定语）
  '他一个实习生而已',                                    // 只有腿①
  '他的建议也无须看',                                    // 只有腿②（b2 倒装形）
  'He has always had an agenda.',                        // 只有 EN 腿①
  'Ignore her proposal.',                                // 只有 EN 腿②
];

// ── D 组：豁免（正当的提醒、质疑与概念分析——样本均双腿齐全，
//    保证摘掉对应豁免后负例脚本能判红）────────────────────
const EXEMPT = [
  '对方别有用心，让你转账，别信',                      // 反诈提醒（危险内容词「转账」）
  '陌生号码说你中奖了，对方没安好心，让你报验证码，别信', // 反诈提醒
  '网上传他是水军，他的数据都是假的，别信',            // 匿名消息源质疑（「网上传」）
  '未经证实的传言说他别有用心，他的结论也无须看',      // 匿名消息源质疑（「未经证实」）
  '文章里举例：他反对这个方案？别听他的，他向来别有用心，这就是典型的井里投毒', // META 概念分析
  'Poisoning the well is a common fallacy: do not listen to him, he has always had an agenda.', // META 概念分析（双腿在场）
];

// ── E 组：归一化通道回归（英文大写形态）──────────────────────
const NORM_FORMS = [
  "DON'T LISTEN TO HIM, HE HAS ALWAYS HAD AN AGENDA.",
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

console.log('== 第 698 轮 poisoning_the_well 井里投毒（第 134 维度）守卫测试 ==');

// ── 1. 模块层命中 ─────────────────────────────────────────
check(`模块层攻击命中 ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const miss = ATTACKS.filter((s) => !(checkPoisoningTheWell(s).count > 0));
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

// ── 4. findings 归因 poisoning_the_well ─────────────────
check(`findings 归因 poisoning_the_well ${ATTACKS.length}/${ATTACKS.length}`, () => {
  const noAttr = ATTACKS.filter(
    (s) => !(gate(s).findings || []).some((f) => f.dimension === 'poisoning_the_well'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（疑似接线未进 findings）: ${noAttr.join(' | ')}`);
});

// ── 5. 良性零误伤（本维度口径）────────────────────────────
check(`poisoning_the_well 良性零误伤 0/${BENIGN.length}`, () => {
  const fp = BENIGN.filter((s) => checkPoisoningTheWell(s).count > 0);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 6. 良性 gate 层保持 pass（BENIGN 组）──────────────────
check(`良性 gate 层保持 pass ${BENIGN.length}/${BENIGN.length}`, () => {
  const moved = BENIGN.filter((s) => gate(s).gate.action !== 'pass');
  assert.equal(moved.length, 0, `被推高 ${moved.length} 条: ${moved.join(' | ')}`);
});

// ── 7. 单腿边界不判 ───────────────────────────────────────
check(`单腿样本不命中 0/${ONE_LEG.length}`, () => {
  const fp = ONE_LEG.filter((s) => checkPoisoningTheWell(s).count > 0);
  assert.equal(fp.length, 0, `单腿误命中 ${fp.length} 条: ${fp.join(' | ')}`);
});

// ── 8. 豁免组全部不判 ─────────────────────────────────────
check(`豁免样本不命中 0/${EXEMPT.length}`, () => {
  const fp = EXEMPT.filter((s) => checkPoisoningTheWell(s).count > 0);
  assert.equal(fp.length, 0, `豁免失效 ${fp.length} 条: ${fp.join(' | ')}`);
});
// gate 层口径说明：豁免样本含真实攻击结构，fallacies 聚合维度的 poisoning_the_well
// 紧凑形通路没有豁免层（纯正则数组，既有架构事实），gate 层可能判 verify——那是
// 紧凑形在提示复核，不撤内容、不误拦 block/rewrite。此处只锁 poisoning_the_well
// 独立维度不归因，不断言 gate pass。
check(`豁免样本 poisoning_the_well 维度零归因 0/${EXEMPT.length}`, () => {
  const attributed = EXEMPT.filter(
    (s) => (gate(s).findings || []).some((f) => f.dimension === 'poisoning_the_well'));
  assert.equal(attributed.length, 0, `被 poisoning_the_well 归因 ${attributed.length} 条: ${attributed.join(' | ')}`);
});

// ── 9. 分工边界：既有维度归属样本不被本族误抢 ──────────────
check(`分工边界既有归属不被误抢 0/${DIVISION_GATE.length}`, () => {
  const stolen = DIVISION_GATE.filter((s) => checkPoisoningTheWell(s).count > 0);
  assert.equal(stolen.length, 0, `本族误抢 ${stolen.length} 条: ${stolen.join(' | ')}`);
});
check('分工边界：既有维度承重不回归（归属样本 gate 层仍非 pass）', () => {
  const leak = DIVISION_GATE.filter((s) => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `既有维度漏判 ${leak.length} 条: ${leak.join(' | ')}`);
});
check(`纯立场披露样本本维度不判且 gate pass ${DIVISION_PURE_PASS.length}/${DIVISION_PURE_PASS.length}`, () => {
  DIVISION_PURE_PASS.forEach((s) => {
    assert.equal(checkPoisoningTheWell(s).count, 0, `本维度误判: ${s}`);
    assert.equal(gate(s).gate.action, 'pass', `gate 层被推高: ${s}`);
  });
});

// ── 10. 归一化通道：英文大写形态仍命中 ────────────────────
check(`归一化通道英文大写形态命中 ${NORM_FORMS.length}/${NORM_FORMS.length}`, () => {
  const miss = NORM_FORMS.filter((s) => !(checkPoisoningTheWell(s).count > 0));
  assert.equal(miss.length, 0, `漏命中 ${miss.length} 条: ${miss.join(' | ')}`);
});

// ── 11. dimensions 键名一致性 + summary 登记 ──────────────
check('dimensions 键名一致性：poisoning_the_well 可读且 count>0', () => {
  const r = gate(ATTACKS[0]);
  assert.ok(r.dimensions && r.dimensions.poisoning_the_well,
    `dimensions.poisoning_the_well 读取不到，实际键: ${Object.keys(r.dimensions || {}).filter((k) => k.includes('poison')).join(',') || '(无)'}`);
  assert.ok(r.dimensions.poisoning_the_well.count > 0, 'poisoning_the_well.count 应 > 0');
});
check('summary 人类可读串含「井里投毒」', () => {
  const r = gate(ATTACKS[0]);
  const s = typeof r.summary === 'string' ? r.summary : JSON.stringify(r.summary);
  assert.ok(s.includes('井里投毒'), `summary 未含「井里投毒」: ${s.slice(0, 120)}`);
});

// ── 12. FALLACY_PATTERNS 紧凑形命中（fallacies 聚合维度侧）──
check('fallacies 聚合维度命中攻击样本（紧凑形生效）', () => {
  const hit = ATTACKS.filter((s) => {
    const f = (gate(s).findings || []).some((x) => x.dimension === 'fallacies');
    return f;
  });
  assert.ok(hit.length > 0, `紧凑形零命中（fallacies findings 无命中），攻击样本 ${ATTACKS.length} 条`);
});

// ── 13. dimensions 键总数 = 134（接线后维度计数）───────────
check('dimensions 键总数 134', () => {
  const r = gate('系统正常运行的陈述');
  assert.equal(Object.keys(r.dimensions).length, 134, `维度键总数 = ${Object.keys(r.dimensions).length}，预期 134`);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) {
  console.log('失败项:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
