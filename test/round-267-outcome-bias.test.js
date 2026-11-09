'use strict';
/**
 * r267 outcome_bias 新措辞家族测试（真升级②）
 *
 * 覆盖本轮落地（v6.8.157，src/outcome-bias.js）：
 *   ① OUTCOME_ZH 结果评价短语族（结果不错/结局不好）与人生大事结果族
 *      （跳槽/转行/创业成功失败/上岸/被裁/复合/离婚）
 *   ② EVAL_ZH 口语评价族（没问题/没毛病/在理/靠谱/说得过去）
 *   ③ OUTCOME_EN 顺当结果族（went fine/went well/turned out fine/
 *      worked out fine）
 *   ④ DECISION_EN 判断名词族（judgment/verdict/read/instinct/hunch）
 *
 * 判定：攻击样本 gate 必须非 pass 且 outcome_bias 必须承重；良性样本必须
 * outcome_bias 零命中。注入-删条：删掉本轮新增常量，守卫必须变红。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const OB = require('../src/outcome-bias.js');

const { checkOutcomeBias } = OB;

// ── 攻击样本：本轮新措辞 + 存量回归 ───────────────────────────────
const ATTACKS = [
  '手术成功了，所以主刀医生当时的判断没问题。',
  '那次冒险跳槽结果不错，可见放弃稳定编制的决定本来就正确。',
  'The surgery went fine, so the surgeon’s judgment was clearly right.',
  '他赌对了，说明当初押上去的决策是对的。',
  'The bet paid off, which proves his decision was wise.',
  '新产品卖爆了，这说明当初的市场定位判断是对的。',
  'She lost everything, showing that her choice was clearly reckless.',
];

// ── 良性样本 ──────────────────────────────────────────────────────
const BENIGN = [
  '他赌对了，但结果是运气还是判断，要看决策时的信息集是否充分。',
  '手术成功了，评估决策质量要看出血量控制和预案，而不是只看结果。',
  'The bet paid off, but decision quality should be judged on the information available at the time.',
  '这个方案当时论证充分，团队执行也扎实。',
  '他赌对了纯属运气。',
];

// ── 注入-删条 ─────────────────────────────────────────────────────
const INJECTIONS = [
  { label: 'OUTCOME_ZH 结果评价短语（结果不错）', text: '那次冒险跳槽结果不错，可见放弃稳定编制的决定本来就正确。', inject: { OUTCOME_ZH: [] } },
  { label: 'EVAL_ZH 口语评价（没问题）', text: '手术成功了，所以主刀医生当时的判断没问题。', inject: { EVAL_ZH: [] } },
  { label: 'OUTCOME_EN 顺当结果（went fine）', text: 'The surgery went fine, so the surgeon’s judgment was clearly right.', inject: { OUTCOME_EN: [] } },
  { label: 'DECISION_EN 判断名词（judgment）', text: 'The surgery went fine, so the surgeon’s judgment was clearly right.', inject: { DECISION_EN: [] } },
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

for (const s of ATTACKS) {
  check(`攻击命中: ${s.slice(0, 30)}`, () => {
    const m = checkOutcomeBias(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'outcome_bias');
    assert.ok(f, 'findings 无 outcome_bias');
  });
}
for (const s of BENIGN) {
  check(`良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = checkOutcomeBias(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'outcome_bias');
    assert.ok(!f, `gate findings 出现 outcome_bias(${g.gate.action})`);
  });
}
let injRed = 0;
for (const inj of INJECTIONS) {
  check(`注入删条变红: ${inj.label}`, () => {
    const before = checkOutcomeBias(inj.text);
    assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
    const after = checkOutcomeBias(inj.text, inj.inject);
    assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
    injRed++;
  });
}

console.log(`round-267-outcome-bias: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个（注入 ${INJECTIONS.length} 个：${injRed} 个变红）`);
if (fail > 0) process.exit(1);
console.log('cleanup: none (pure in-memory checks)');
