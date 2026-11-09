'use strict';
/**
 * r267 simpsons_paradox 新措辞家族测试（真升级②）
 *
 * 覆盖本轮落地（v6.8.157，src/simpsons-paradox.js）：
 *   ① 口语聚合族（合并两个校区看/合起来看/拢在一起看；EN pooling/
 *      aggregating/combining/lumping/merging）
 *   ② 比较胜负动词族（压过/胜过/领先/反超/高于/低于；EN wins/leads/
 *      ahead/favors/trails/lags/behind/declines）——**并入 TREND 列表
 *      首正则**：trendDirs 只取列表首个正则，另起数组元素是死代码
 *
 * 判定：攻击样本 gate 必须非 pass 且 simpsons_paradox 必须承重；良性样本
 * 必须零命中。注入-删条：删掉本轮新增常量/替换首正则，守卫必须变红。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const SP = require('../src/simpsons-paradox.js');

const { checkSimpsonsParadox } = SP;

// ── 攻击样本：本轮新措辞 + 存量回归 ───────────────────────────────
const ATTACKS = [
  '合并两个校区看，A 校区的通过率压过 B 校区，可拆到每个学院看 A 都更低，可见 A 校区教学更好。',
  'Pooling both districts together, plan B leads, yet within each neighborhood plan B trails, so plan B is clearly the better rollout.',
  '总体上 A 组的表现高于 B 组，但每个年龄段内 A 组都更低，所以 A 组的方法更有效。',
  'Overall sales went up, but every region saw declines, so the strategy clearly worked.',
];

// ── 良性样本 ──────────────────────────────────────────────────────
const BENIGN = [
  '合并两个校区看 A 压过 B，拆到每个学院 A 都更低，聚合层与子群层方向相反，需分层解读。',
  '总体上看新药组的康复率更高，但每个年龄段内新药组反而更低，这正是辛普森悖论的形态，不能轻下结论。',
  'The overall numbers favor plan B, yet in every region plan A wins — an aggregation reversal that needs subgroup analysis.',
  '总体通过率提高了，说明培训有效。',
];

// ── 注入-删条：AGG 列表注入空数组；TREND 注入永假正则（替换首正则）──
const NEVER = /(?!x)x/;
const INJECTIONS = [
  { label: 'AGG_ZH 口语聚合族（合并…看）', text: '合并两个校区看，A 校区的通过率压过 B 校区，可拆到每个学院看 A 都更低，可见 A 校区教学更好。', inject: { AGG_ZH: [] } },
  { label: 'TREND_UP_ZH 比较胜负动词（压过）', text: '合并两个校区看，A 校区的通过率压过 B 校区，可拆到每个学院看 A 都更低，可见 A 校区教学更好。', inject: { TREND_UP_ZH: NEVER } },
  { label: 'AGG_EN 口语聚合动词（pooling）', text: 'Pooling both districts together, plan B leads, yet within each neighborhood plan B trails, so plan B is clearly the better rollout.', inject: { AGG_EN: [] } },
  { label: 'TREND_UP_EN 偏好胜负动词（leads）', text: 'Pooling both districts together, plan B leads, yet within each neighborhood plan B trails, so plan B is clearly the better rollout.', inject: { TREND_UP_EN: NEVER } },
  { label: 'TREND_DOWN_EN 偏好落后动词（trails/declines）', text: 'Overall sales went up, but every region saw declines, so the strategy clearly worked.', inject: { TREND_DOWN_EN: NEVER } },
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

for (const s of ATTACKS) {
  check(`攻击命中: ${s.slice(0, 30)}`, () => {
    const m = checkSimpsonsParadox(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'simpsons_paradox');
    assert.ok(f, 'findings 无 simpsons_paradox');
  });
}
for (const s of BENIGN) {
  check(`良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = checkSimpsonsParadox(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'simpsons_paradox');
    assert.ok(!f, `gate findings 出现 simpsons_paradox(${g.gate.action})`);
  });
}
let injRed = 0;
for (const inj of INJECTIONS) {
  check(`注入删条变红: ${inj.label}`, () => {
    const before = checkSimpsonsParadox(inj.text);
    assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
    const after = checkSimpsonsParadox(inj.text, inj.inject);
    assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
    injRed++;
  });
}

console.log(`round-267-simpsons-paradox: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个（注入 ${INJECTIONS.length} 个：${injRed} 个变红）`);
if (fail > 0) process.exit(1);
console.log('cleanup: none (pure in-memory checks)');
