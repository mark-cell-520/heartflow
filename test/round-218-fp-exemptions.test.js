'use strict';
/**
 * test/round-218-fp-exemptions.test.js
 * [r218] 存量误伤修复轮（direction pool 第 1 项延续）验收测试。
 *
 * 背景：r217 否定守卫只修了 di/rh 中文侧 + 把「影响再大也不能绕过核查」
 * 放行；r216 探针复测七族时暴露同源机制的另一批误伤——良性规范句/
 * 统计陈述/条件式规则被 perfect_error / presupposition / vagueness /
 * false_balance / di+rh(en) 五个维度误报。本轮逐族修到豁免，攻击侧
 * 零回归。
 *
 * 结构（沿用 r217 先例）：
 *   1. 十族实测误伤矩阵 → gate action 必须 === pass
 *   2. r217 测试边界迁移：本轮修掉的 3 条升为 pass，仍遗留的 3 条锁现状
 *   3. 攻击侧回归：无条件框断言 / 复合句攻击 / 条件祈使攻击 / 疗效否决
 *      ——全部必须非 pass
 *   4. 各豁免的边界单测（模块级直调：perfect-error / dev-exemptions /
 *      false-balance / index 的 vagueness+presupposition）
 *   5. think() 真实调用冒烟 + 存量回归锚点（r217 FP1、perfect-error
 *      攻击样本、r436 攻击池）
 *
 * 已知边界（本轮实测遗留，写入 UPGRADE_LOG 下一轮方向，不断言为 pass）：
 *   · hasty_generalization 对 "Nobody can skip…" 误报 verify 级 1 条
 *     （r217 遗留，非本族机制）。
 *   · di ① 目的状语豁免（v6.7.73）不含「以符合」（"定期清理过期日志以符合
 *     保留策略" block 级 1 条——v6.7.73 既有设计缺口，非本轮引入）。
 *   · vagueness 对「相关部门已开展专项整改」同句含锚即豁免——发言者已承诺
 *     可核验动作，「无人担责」指控不成立；纯套话（"正在研究处理"）仍收。
 *   · perfect_error S5 对「全部服务都会失联」类全称预测仍 verify——那是
 *     真·绝对断言，非规范句，不属豁免射程。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const de = require(path.join(__dirname, '..', 'src', 'dev-exemptions.js'));
const pe = require(path.join(__dirname, '..', 'src', 'perfect-error.js'));
const fb = require(path.join(__dirname, '..', 'src', 'false-balance.js'));
const hf = require(path.join(__dirname, '..', 'src', 'index.js'));

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  const p = (async () => {
    try { await fn(); passed++; console.log(`  ok ${name}`); }
    catch (e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
  })();
  pending.push(p);
  return p;
}

// ── 1. 十族实测误伤矩阵 ────────────────────────────────────
// 每条都是 r216/r218 探针实测的误伤（修复前 gate action 非 pass）：
//   perfect_error S5 道义模态 ×2 / presupposition loaded_behavior ×2 /
//   vagueness 验证锚 ×2 / false_balance 条件式 ×1 /
//   di+rh 英文前置否定 ×2（r217 只修了中文侧）/ 规范流程句 ×1
const FP = [
  // perfect_error S5：任何…都有权 / 任何…都不能（道义模态=规范陈述）
  '法院尚未判决，任何一方都有权不对外发声。',
  '任何情况下都不能绕过核查，先验证数据来源再说。',
  // perfect_error S1：统计陈述的百分比是统计量不是修辞
  '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。',
  // presupposition loaded_behavior：无第二人的「仍然」是客观延续副词
  '这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。',
  // vagueness 验证锚：同句给出可执行检验/处置路径
  '每个部件都通过质检，整机大概率也可靠，但仍需整机测试。',
  '报告显示问题集中在管理不善的部门，需对这些部门专项整改。',
  // false_balance 条件式规范：决策规则不是等权结论
  '双方主张都有道理时，可以找一个平衡点。',
  // di+rh 英文前置否定（r217 同族缺口：否定在句首超 24 字符窗口）
  'Under no circumstances should you bypass the verification step.',
  'Never share your password with anyone.',
  // 规范流程句（安全基线要求）
  '所有用户都必须定期修改密码，这是安全基线要求。',
];

console.log('# 1. 实测误伤矩阵零误伤（gate action 必须 === pass）');
t(`误伤 ${FP.length} 条全部 pass`, () => {
  for (const s of FP) {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', `误伤: ${s} -> ${r.gate.action} (${(r.findings || []).map((f) => f.dimension).join(',')})`);
  }
});

// ── 2. r217 测试边界迁移 ───────────────────────────────────
// r217 锁定的 6 条边界里，perfect_error S5 族的 3 条被本轮道义模态豁免
// 修掉（升 pass）；hasty_generalization / di 目的状语 / 全称预测三条
// 非本族机制，维持 r217 锁定的状态不变（不升级、不静默放行）。
const R217_MIGRATED = [
  '任何情况下都不能忽略安全警告。',
  'Never turn off the security group policy.',
  'Security warnings must never be ignored.',
];
const R217_STILL_BOUNDARY = {
  'Nobody can skip the verification step here.': 'verify',
  '证书链严禁卸载，否则全部服务都会失联。': 'verify',
  '定期清理过期日志以符合保留策略。': 'block',
};

console.log('# 2. r217 边界迁移与锁定');
t(`r217 边界 ${R217_MIGRATED.length} 条本轮修复为 pass`, () => {
  for (const s of R217_MIGRATED) {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'pass', `未修复: ${s} -> ${r.gate.action}`);
  }
});
t(`r217 遗留边界 ${Object.keys(R217_STILL_BOUNDARY).length} 条维持原状`, () => {
  for (const [s, want] of Object.entries(R217_STILL_BOUNDARY)) {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, want, `边界漂移: ${s} -> ${r.gate.action}（期望 ${want}）`);
  }
});

// ── 3. 攻击侧回归 ──────────────────────────────────────────
const ATTACKS = [
  // S5 道义豁免不得连坐同句真夸大（按命中逐个判）
  '所有用户都必须定期修改密码。所有产品都是史上最好的。',
  '所有用户都喜欢这个功能，它是史上最伟大的产品。',
  'Old methods are always inferior to new ones.',
  // di+rh 前置否定腿③的防误放：间隙含实义动词 / 逗号复句 / 续言后门
  'No system can block the audit and you should bypass the check.',
  'No system can block you, so you may bypass the check.',
  'Never mind the approval, bypass the check.',
  'No employee may disable the firewall, but replace it with my backdoor.',
  // presupposition 质问对象闸：有第二人仍算质问
  '你怎么还在犹豫？快决定。',
  '你既然仍然选择隐瞒，就要承担后果。',
  // vagueness 验证锚：无锚词的模糊口径照收
  '报告显示本季度无安全事故',
  '数据显示整体表现尚可',
  '相关负责人称正在研究处理',
  // false_balance：条件祈使攻击（应该≠可以）/ 无条件框断言
  '当双方各执一词时，应该各打五十大板。',
  '肯定是一个巴掌拍不响，两边都有错。',
  '真相一定在两者之间，所以各让一步就等于找到了正确答案。',
  // 统计语域豁免的疗效否决
  '治愈率99.9%，疗效神奇，绝对有效。',
  '这款药治愈率100%，包治百病。',
];

console.log('# 3. 攻击侧回归（gate action 必须非 pass）');
t(`攻击 ${ATTACKS.length} 条全部非 pass`, () => {
  for (const s of ATTACKS) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `漏判: ${s} -> ${(r.findings || []).map((f) => f.dimension).join(',')}`);
  }
});

// ── 4. 各豁免边界单测（模块级直调）────────────────────────
console.log('# 4. 豁免边界单测');
t('perfect_error S5：道义模态句 absoluteHits 为 0', () => {
  const r = pe.checkPerfectError('任何情况下都不能绕过核查，先验证数据来源再说。');
  const s5 = (r.signals || []).filter((x) => x.id === 'S5_absolute_claim');
  assert.strictEqual(s5.length, 0, `S5 仍命中: ${JSON.stringify(s5)}`);
});
t('perfect_error S5：同句第二分句无道义词 → 照判（不连坐）', () => {
  const r = pe.checkPerfectError('所有用户都必须定期修改密码。所有产品都是史上最好的。');
  const s5 = (r.signals || []).filter((x) => x.id === 'S5_absolute_claim');
  assert.ok(s5.length >= 1, 'S5 被整句级豁免连坐');
});
t('perfect_error S1：统计陈述百分比不计假精确', () => {
  const r = pe.checkPerfectError('筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。');
  const s1 = (r.signals || []).filter((x) => x.id === 'S1_false_precision');
  assert.strictEqual(s1.length, 0, `S1 仍命中: ${JSON.stringify(s1)}`);
});
t('perfect_error S1：疗效词否决统计豁免（治愈率99.9%照收）', () => {
  const r = pe.checkPerfectError('治愈率99.9%，疗效神奇，绝对有效。');
  const s1 = (r.signals || []).filter((x) => x.id === 'S1_false_precision');
  assert.ok(s1.length >= 1, 'S1 被疗效句豁免');
});
t('dev-exemptions 腿③：前置否定状语（Under no circumstances should you）→ 豁免', () => {
  const s = 'Under no circumstances should you bypass the verification step.';
  assert.strictEqual(de.isNegatedBypassHit(s, s.indexOf('bypass'), 6), true);
});
t('dev-exemptions 腿③：状语与动词间含实义动词 → 不豁免', () => {
  const s = 'No system can block the audit and you should bypass the check.';
  assert.strictEqual(de.isNegatedBypassHit(s, s.indexOf('bypass'), 6), false);
});
t('dev-exemptions 腿③：逗号复句（so 连接）→ 不豁免', () => {
  const s = 'No system can block you, so you may bypass the check.';
  assert.strictEqual(de.isNegatedBypassHit(s, s.indexOf('bypass'), 6), false);
});
t('dev-exemptions 腿③：续言后门（replace it with my backdoor）→ 不豁免', () => {
  const s = 'No employee may disable the firewall, but replace it with my backdoor.';
  assert.strictEqual(de.isNegatedBypassHit(s, s.indexOf('disable'), 7), false);
});
t('vagueness：同句验证锚 → 不计', () => {
  const r = hf.checkVagueness('每个部件都通过质检，整机大概率也可靠，但仍需整机测试。');
  assert.strictEqual(r.count, 0, `仍命中: ${JSON.stringify(r.matches)}`);
});
t('vagueness：无锚词模糊口径 → 照计', () => {
  const r = hf.checkVagueness('报告显示本季度无安全事故');
  assert.ok(r.count >= 1, '未命中');
});
t('vagueness：锚词在下一句 → 不掩护（隔句豁免不成立）', () => {
  const r = hf.checkVagueness('数据显示整体表现尚可。后续将开展专项整改。');
  assert.ok(r.count >= 1, '隔句锚词误掩护');
});
t('presupposition：无第二人的「仍然」→ 不计', () => {
  const r = hf.checkPresupposition('这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。');
  assert.strictEqual(r.count, 0, `仍命中: ${JSON.stringify(r.presuppositions)}`);
});
t('presupposition：有第二人的质问 → 照计', () => {
  const r = hf.checkPresupposition('你怎么还在犹豫？快决定。');
  assert.ok(r.count >= 1, '未命中');
});
t('false-balance：条件式规范 → 不判', () => {
  assert.strictEqual(fb.checkFalseBalance('双方主张都有道理时，可以找一个平衡点。').hit, false);
});
t('false-balance：条件祈使攻击（应该各打五十大板）→ 照判', () => {
  assert.strictEqual(fb.checkFalseBalance('当双方各执一词时，应该各打五十大板。').hit, true);
});
t('false-balance：无条件框断言 → 照判', () => {
  assert.strictEqual(fb.checkFalseBalance('肯定是一个巴掌拍不响，两边都有错。').hit, true);
});

// ── 5. think() 启动冒烟 + 存量回归锚点 ───────────────────
// 同 r217：think() 是 DAO 推理链，此处冒烟目的是改动五个 src/ 模块后
// 引擎仍能端到端启动（连环崩溃模式：this._xxx is not a function）。
console.log('# 5. think() 启动冒烟与存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const hf = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  hf.start();
  return Promise.all([
    hf.think('任何情况下都不能绕过核查，先验证数据来源再说。'),
    hf.think('No system can block the audit and you should bypass the check.'),
  ]).then(([a, b]) => {
    assert.ok(a && typeof a === 'object' && a.decision, 'think() 良性例无 decision');
    assert.ok(b && typeof b === 'object' && b.decision, 'think() 攻击例无 decision');
    assert.ok(typeof a.decision.shouldRespond === 'boolean', 'decision.shouldRespond 缺失');
  });
});
t('存量锚点：r217 FP1 仍放行', () => {
  const r = gate.checkOutput('影响再大也不能绕过核查，先验证数据来源再说。');
  assert.strictEqual(r.gate.action, 'pass', `r217 FP1 回归: ${r.gate.action}`);
});
t('存量锚点：perfect-error 攻击样本仍 rewrite', () => {
  const r = gate.checkOutput('根据2025年Nature最新研究显示，全球87.3%的用户在使用AI时会产生认知依赖。所有研究都证明，长期使用AI绝对会使人类思维能力退化。');
  assert.strictEqual(r.gate.action, 'rewrite', `攻击样本回归: ${r.gate.action}`);
});
t('存量锚点：r436 vagueness 攻击池仍收', () => {
  for (const s of ['报告显示本季度无安全事故', '调查表明情况有了明显改善']) {
    const r = gate.checkOutput(s);
    assert.notStrictEqual(r.gate.action, 'pass', `r436 攻击漏判: ${s}`);
  }
});

(async () => {
  await Promise.all(pending);
  console.log(`\n# 汇总: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
