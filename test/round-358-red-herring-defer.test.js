/**
 * 第 255 维度 red_herring（转移话题/偷换论题）r358 时机搁置族（defer）测试。
 * 立项：r358（路径 h 轮换出后换向，三候选定拨——A dose_response 学习域 3/5、
 *   B 金钱单位域 2/4 均被既有维度部分代拦，C 本族 6/6 穿透 + 良性 4/4 零误伤
 *   胜出）。缺口实证：coordination/agent4/probes/r358-probe-round1.js
 *   （集成树 v6.8.185，干净腿框隔离 + 模块级 legs 双口径）。
 * 判据三段（继承 r323）：腿① SHIFT 置换标记（defer 时机搁置为第四类）/
 *   腿② ORIGIN 原议题段（before 指控段或 capture 组）/ 腿③ REPLACE 替换
 *   议题段（与腿②零共享实词）。defer 族另设精度双墙：DEFER_OK 家族豁免
 *   （等…再/先…做完 同议题条件推迟与前置任务）+ REPLACE_PRIORITY 替换段
 *   竞争性优先标记资格门，两墙均可逐常量置空验证承重。
 */
'use strict';

const assert = require('assert');
const { checkRedHerring, __internals } = require('../src/red-herring.js');

let passed = 0;
let failed = 0;
function check(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.error(`FAIL ${name}: ${e.message}`); }
}

// ── 攻击样本：时机搁置 + 竞争性优先替换 ───────────────────────────
const ATTACKS = [
  // ZH：时候型（before 裸标记 / capture 议题在内）
  '疫苗的安全性问题，现在不是讨论的时候，当务之急是恢复经济。',
  '薪酬的问题眼下不是谈论的时候，当务之急是拿下明年的融资。',
  '财报的事现在不是讨论的时候，更重要的是竞争对手已经抢占了市场。',
  '现在还不是谈论房价泡沫的时候，当务之急是把就业搞上去。',
  '现在不是说这些的时候，当务之急是把这季度的销量冲上去。',
  // ZH：不合时宜型
  '数据泄露的事现在谈不合时宜，我们更应该关注竞争对手的动态。',
  '现在谈用户隐私不合时宜，当下最关键的是先把融资拿到手。',
  // ZH：为时尚早 / 还太早型
  '现在讨论预算赤字为时尚早，大家应该聚焦如何打赢这场价格战。',
  '安全事故现在谈论还为时过早，当务之急是稳住投资者信心。',
  '这个问题现在讨论还太早，当下最关键的是把现金流稳住。',
  // EN
  'Now is not the time to talk about the budget deficit, we need to focus on job creation.',
  'It is too early to discuss the layoffs; the real priority is the product launch.',
  'This is not the time to address the safety report, the more important issue is our market share.',
  'It is too early to discuss the recall, we should focus on the holiday sales push.',
];

for (let i = 0; i < ATTACKS.length; i++) {
  check(`attack[${i}]`, () => {
    const r = checkRedHerring(ATTACKS[i]);
    assert.strictEqual(r.hit, true, `应命中: ${ATTACKS[i]}`);
  });
}

// ── 良性样本：同议题条件推迟 / 前置任务 / 无竞争性优先替换 ────────
const BENIGN = [
  '疫苗的安全性问题，现在不是讨论的时候，等三期临床数据出来再说。',  // DEFER_OK：等证据
  '现在还不是庆祝的时候，等测试全部通过再开香槟。',                  // DEFER_OK：等里程碑
  '现在不是讨论假期安排的时候，我们先把项目交付做完。',              // DEFER_OK：前置任务
  '房价泡沫的问题现在谈不合时宜，等这轮政策效果显现后再评估。',      // DEFER_OK：等观测
  '数据泄露的事现在谈不合时宜，等调查结果公布再下结论。',            // DEFER_OK：等结论
  '现在不是说这些的时候，等时机成熟再说。',                          // DEFER_OK：等时机
  '现在不是讨论技术细节的时候，我们先看整体架构。',                  // 无竞争性优先标记
  '现在不是讨论实现细节的时候，我们先聊聊交互流程。',                // 无竞争性优先标记
  '这个问题现在不是讨论的时候。',                                    // 无替换段
  'Now is not the time to talk about the budget, let us first finish the audit.',
  'It is too early to discuss the results; let us first finish the data review.',
  'It is too early to address the bug reports; let us first complete the regression suite.',
  'This is not the time to review the contract, the draft is not ready.',
  'It is too early to discuss the results, the audit is not complete.',
];

for (let i = 0; i < BENIGN.length; i++) {
  check(`benign[${i}]`, () => {
    const r = checkRedHerring(BENIGN[i]);
    assert.strictEqual(r.hit, false, `应放过: ${BENIGN[i]}`);
  });
}

// EN wait-until 形仅做模块层断言（gate 层会被 future_faking 等他维度按
// 既有口径标 verify，非本轮回归，不在本测试范围）。
const MODULE_ONLY_BENIGN = [
  'It is too early to discuss the results, we should wait until the data is in.',
  'It is too early to address the bug reports; wait until the release is out.',
];
for (let i = 0; i < MODULE_ONLY_BENIGN.length; i++) {
  check(`benign-module-only[${i}]`, () => {
    const r = checkRedHerring(MODULE_ONLY_BENIGN[i]);
    assert.strictEqual(r.hit, false, `应放过: ${MODULE_ONLY_BENIGN[i]}`);
  });
}

// ── 承重验证①：defer 标记族整体置空 → 攻击全部翻转 ────────────────
check('承重: 无 defer 标记不判（整族删常量）', () => {
  const R = __internals();
  const noDefer = { MARKERS: R.MARKERS.filter(m => m.kind !== 'defer') };
  for (const t of ATTACKS) {
    const r = checkRedHerring(t, noDefer);
    assert.strictEqual(r.hit, false, `删 defer 标记后仍命中: ${t}`);
  }
});

// ── 承重验证②：DEFER_OK 置空 → 同议题推迟良性翻转为命中 ───────────
check('承重: DEFER_OK 豁免承重（删后同议题推迟翻转）', () => {
  const noDeferOk = {
    DEFER_OK_ZH: [], DEFER_OK_EN: [],
  };
  const probes = [
    '现在不是讨论预算的时候，等审计结果出来再说，当务之急是先把账目核对完。',
    '疫苗的安全性问题，现在不是讨论的时候，等三期临床数据出来再说，当务之急是安排好接种。',
  ];
  for (const t of probes) {
    const base = checkRedHerring(t);
    assert.strictEqual(base.hit, false, `DEFER_OK 在时应放过: ${t}`);
    const flipped = checkRedHerring(t, noDeferOk);
    assert.strictEqual(flipped.hit, true, `删 DEFER_OK 后应翻转: ${t}`);
  }
});

// ── 承重验证③：REPLACE_PRIORITY 资格门是精度承重墙 ─────────────────
// ③a 拆墙模拟（priority 置为恒真）：无竞争性优先标记的良性翻转为命中——
// 证明拦截良性「先看整体架构」类的唯一机制就是这道资格门。
check('承重: 资格门是唯一拦截（恒真 priority 后良性翻转）', () => {
  const wallsOff = {
    REPLACE_PRIORITY_ZH: [/./], REPLACE_PRIORITY_EN: [/./],
  };
  const probes = [
    '现在不是讨论技术细节的时候，我们先看整体架构。',
    '这个问题现在讨论还太早，我们先聊聊背景。',
  ];
  for (const t of probes) {
    assert.strictEqual(checkRedHerring(t).hit, false, `资格门在时应放过: ${t}`);
    const flipped = checkRedHerring(t, wallsOff);
    assert.strictEqual(flipped.hit, true, `恒真 priority 后应翻转: ${t}`);
  }
});

// ③b 资格门置空（无标记可满足）：攻击族整体失命中——证明优先标记在
// defer 族命中路径上承重，不是旁路装饰。
check('承重: 资格门置空后攻击失命中（优先标记在命中路径承重）', () => {
  const noPriority = {
    REPLACE_PRIORITY_ZH: [], REPLACE_PRIORITY_EN: [],
  };
  for (const t of ATTACKS) {
    const r = checkRedHerring(t, noPriority);
    assert.strictEqual(r.hit, false, `删资格门后仍命中: ${t}`);
  }
});

// ── 族隔离：defer 标记只归 defer 类，计数可复核 ───────────────────
check('族隔离: defer 标记族计数与类别', () => {
  const R = __internals();
  const deferMarkers = R.MARKERS.filter(m => m.kind === 'defer');
  assert.strictEqual(deferMarkers.length, 11, `defer 标记应 11 条，实为 ${deferMarkers.length}`);
  for (const m of deferMarkers) {
    assert.ok(['before', 'capture'].includes(m.origin), `origin 非法: ${m.origin}`);
    assert.ok(m.re instanceof RegExp, 're 应为 RegExp');
  }
  // 其余三类标记零改动（dismiss/redirect/counter 总数与 r324 收尾一致）
  const others = R.MARKERS.filter(m => m.kind !== 'defer');
  assert.strictEqual(others.length, R.MARKERS.length - 11);
});

// ── 族隔离反向硬探针：删掉 capture 型后，议题在标记内的攻击翻转 ────
check('族隔离: 删 capture 型后议题在内句翻转（before 型不 rescue）', () => {
  const R = __internals();
  const noCapture = { MARKERS: R.MARKERS.filter(m => !(m.kind === 'defer' && m.origin === 'capture')) };
  const inside = [
    '现在还不是谈论房价泡沫的时候，当务之急是把就业搞上去。',
    '现在讨论预算赤字为时尚早，大家应该聚焦如何打赢这场价格战。',
    'It is too early to discuss the layoffs; the real priority is the product launch.',
  ];
  for (const t of inside) {
    assert.strictEqual(checkRedHerring(t).hit, true, `capture 在时应命中: ${t}`);
    assert.strictEqual(checkRedHerring(t, noCapture).hit, false, `删 capture 后仍命中: ${t}`);
  }
});

// ── 控制组：既有族零回归（r324 收尾形仍命中）──────────────────────
check('控制组: 既有 dismiss/counter 族零回归', () => {
  const controls = [
    '别再说我迟到了，公司去年不是也搞过一次团建吗？',
    '先别提房价了，难道医疗改革不是更紧迫吗？',
    '你说这个政策有问题，但更重要的是我们得支持国产啊。',
  ];
  for (const t of controls) {
    assert.strictEqual(checkRedHerring(t).hit, true, `控制组应仍命中: ${t}`);
  }
});

// ── gate 集成：VERIFY 级真实可达 + 良性整句放行 ───────────────────
check('gate 集成: 攻击样本 action=verify', () => {
  const { gate } = require('../src/gate.js');
  for (const t of ATTACKS) {
    const r = gate(t);
    assert.notStrictEqual(r.gate.action, 'pass', `gate.action=pass: ${t}`);
  }
});

check('gate 集成: 良性样本 action=pass', () => {
  const { gate } = require('../src/gate.js');
  for (const t of BENIGN) {
    const r = gate(t);
    assert.strictEqual(r.gate.action, 'pass', `gate.action=${r.gate.action}: ${t}`);
  }
});

console.log(`\n第 255 维度 red_herring r358 时机搁置族测试: ${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
