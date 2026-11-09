'use strict';
/**
 * r267 monocausal_attribution 新措辞家族测试（真升级②）
 *
 * 覆盖本轮落地（v6.8.157，src/monocausal-attribution.js）：
 *   ① 口语归怪族（全怪/都怪/只怪/全赖/全凭一己/全仗）——L1 归因压缩
 *   ② 口语否证族（其他都是次要的/其余可以忽略）——L2 枚举否认
 *   ③ EN 唯一理由族（for one reason only / one reason only）——L1
 *
 * 判定：攻击样本 gate 必须非 pass 且 monocausal_attribution 必须承重；
 * 良性样本必须零命中。注入-删条：删掉本轮新增常量，守卫必须变红。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const MC = require('../src/monocausal-attribution.js');

const { detectMonocausal } = MC;

// ── 攻击样本：本轮新措辞 + 存量回归 ───────────────────────────────
const ATTACKS = [
  // 本轮新增（L1 归因压缩）
  '项目失败全怪需求变更，其他都是次要的。',
  '比赛输了全怪裁判。',
  'The product flopped for one reason only: the marketing team.',
  // 存量回归
  '销量下滑说到底就是一个原因：定价太高。',
  '失败全都是因为一个人，其他人都没问题。',
  // 本轮新增（L2 枚举否认）
  '需求变更有影响，人员流动有影响，交付节奏也有影响，但其他都是次要的。',
];

// ── 良性样本 ──────────────────────────────────────────────────────
const BENIGN = [
  '项目失败有需求变更的因素，但交付节奏和人员流动同样有责任。',
  'The product flopped for many reasons, including pricing, timing, and distribution.',
  '销量下滑既和定价有关，也和渠道扩张节奏有关。',
  '这场比赛输了，裁判判罚有影响，但球员状态和战术布置也各有问题。',
  '这次能成全赖大家配合，每个人的贡献都缺一不可。',
];

// ── 注入-删条 ─────────────────────────────────────────────────────
const INJECTIONS = [
  { label: 'COMPRESS_ZH 口语归怪族（全怪）', text: '项目失败全怪需求变更，其他都是次要的。', inject: { COMPRESS_ZH: [] } },
  { label: 'COMPRESS_ZH 口语归怪族（全怪·比赛句）', text: '比赛输了全怪裁判。', inject: { COMPRESS_ZH: [] } },
  { label: 'DISMISS_ZH 口语否证族（其他都是次要的）', text: '需求变更有影响，人员流动有影响，交付节奏也有影响，但其他都是次要的。', inject: { DISMISS_ZH: [] } },
  { label: 'COMPRESS_EN 唯一理由族（for one reason only）', text: 'The product flopped for one reason only: the marketing team.', inject: { COMPRESS_EN: [] } },
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

for (const s of ATTACKS) {
  check(`攻击命中: ${s.slice(0, 30)}`, () => {
    const m = detectMonocausal(s);
    assert.ok(m.score > 0, `模块未命中 score=${m.score}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'monocausal_attribution');
    assert.ok(f, 'findings 无 monocausal_attribution');
  });
}
for (const s of BENIGN) {
  check(`良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = detectMonocausal(s);
    assert.strictEqual(m.score, 0, `误命中 score=${m.score}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'monocausal_attribution');
    assert.ok(!f, `gate findings 出现 monocausal_attribution(${g.gate.action})`);
  });
}
let injRed = 0;
for (const inj of INJECTIONS) {
  check(`注入删条变红: ${inj.label}`, () => {
    const before = detectMonocausal(inj.text);
    assert.ok(before.score > 0, '注入前守卫未命中（样本本身不穿透）');
    const after = detectMonocausal(inj.text, inj.inject);
    assert.strictEqual(after.score, 0, `删条后仍命中 score=${after.score}`);
    injRed++;
  });
}

console.log(`round-267-monocausal-attribution: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个（注入 ${INJECTIONS.length} 个：${injRed} 个变红）`);
if (fail > 0) process.exit(1);
console.log('cleanup: none (pure in-memory checks)');
