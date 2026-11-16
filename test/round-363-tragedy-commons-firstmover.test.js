'use strict';
// round-363：tragedy_of_commons「先占/抢先」第一人合理化子族（经典链）。
// r363 立项探针 coordination/agent4/probes/r363-probe-firstmover.js：存量三腿
// 六链的腿③只收「自己多挣/成本大家扛/是理性的/不X白不X」，整族漏「共享资源 +
// 别人也会过度取用 + 所以先尽量多占」的先占/抢先合理化。新增 C_ZH5/C_EN5（腿③）
// + B_EN5（EN 第一人称过度取用腿②），经 concat **仅**合入经典链（不动 r315 数字链 /
// r321 现代链，保其负例注入语义）。src/index.js 零改动、维度 257 不变、VERSION 不 bump。
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const { detectTragedyOfCommons, __internals } = require(path.join(ROOT, 'src', 'tragedy-of-commons.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js')).gate;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function gateAction(t) { const r = gate(t); return r && r.gate && r.gate.action; }
function econFams(t) { const r = checkEconReasoningGate(t); return (r && r.hit) ? (r.families || []).map(f => f.key) : []; }

// ─── 攻击语料（先占/抢先第一人合理化，经典链）──────────────────────
const ATTACK_ZH = [
  '这片草场是公共的，我不多养几只，别人也会多养，先占先得。',
  '公海的鱼谁都能捞，我不去捞就被别的船捞光了，不如先尽量多捕。',
  '地下水资源是共享的，我不多抽，邻村也会抽，能多抽就多抽。',
  '林子是大家的，我不多砍一圈，别人也会砍，趁现在能多砍就多砍。',
];
const ATTACK_EN = [
  'The fishery is open to all, so if I do not catch more, other boats will, might as well grab it first.',
  'Since the pasture is shared, if I do not graze more, my neighbor will, so I take what I can now.',
  'The aquifer is free, so unless I pump more this season, other farms will, I had better grab my share.',
];
// ─── 存量经典链攻击（回归 + 存量注入语义保留）──────────────────────
const REGRESSION = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，退化大家一起承担。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
];
// ─── 良性（零误伤；含「谁抢先/先到先得」易混形，缺腿②/否定守卫应拦）────
const BENIGN = [
  '这片草场是公共的，需要通过配额制度防止过度放牧。',
  '为了避免搭便车，公共渔场需要明确产权或引入捕捞配额。',
  '公共资源的治理要靠集体协商，不是谁抢先谁就多拿。',
  'The shared aquifer requires pumping quotas to prevent depletion.',
  'To avoid overuse, the commons needs clear property rights or usage caps.',
  'First-come-first-served is a fair allocation rule when supply is limited.',
];

console.log('### A 模块命中（先占族攻击 7/7）');
ATTACK_ZH.concat(ATTACK_EN).forEach((t, i) =>
  check('A' + i + ' ' + t.slice(0, 18), () => { const r = detectTragedyOfCommons(t); assert(r && r.hit, '模块未命中'); }));

console.log('### B 引擎闸归因 + gate action');
ATTACK_ZH.forEach((t, i) => check('B-zh' + i + ' econ=tragedy_of_commons', () => {
  assert(econFams(t).includes('tragedy_of_commons'), 'econ 未归因本族: ' + JSON.stringify(econFams(t)));
  assert(gateAction(t) !== 'pass', 'gate 未拦: ' + gateAction(t));
}));
ATTACK_EN.forEach((t, i) => check('B-en' + i + ' econ=tragedy_of_commons', () => {
  assert(econFams(t).includes('tragedy_of_commons'), 'econ 未归因本族: ' + JSON.stringify(econFams(t)));
}));

console.log('### C 良性零误伤（6/6 pass）');
BENIGN.forEach((t, i) => check('C' + i + ' ' + t.slice(0, 18), () => {
  const r = detectTragedyOfCommons(t);
  assert(!(r && r.hit), '良性误命中本族');
}));

console.log('### D 负例注入（删新常量 → 攻击翻红，证承重）');
check('D1 删 C_ZH5 → ZH 攻击全部翻红', () => {
  ATTACK_ZH.forEach(t => { assert(!detectTragedyOfCommons(t, { C_ZH5: [] }).hit, '删 C_ZH5 后仍命中: ' + t.slice(0, 18)); });
});
check('D2 删 B_EN5 → EN 攻击全部翻红', () => {
  ATTACK_EN.forEach(t => { assert(!detectTragedyOfCommons(t, { B_EN5: [] }).hit, '删 B_EN5 后仍命中: ' + t.slice(0, 30)); });
});
check('D3 删 C_EN5 → EN 攻击（纯 C_EN5 腿③）翻红', () => {
  [ATTACK_EN[1], ATTACK_EN[2]].forEach(t => { assert(!detectTragedyOfCommons(t, { C_EN5: [] }).hit, '删 C_EN5 后仍命中: ' + t.slice(0, 30)); });
});

console.log('### E 存量回归 + 存量注入语义保留');
check('E1 存量经典链攻击仍命中', () => {
  REGRESSION.forEach(t => { assert(detectTragedyOfCommons(t).hit, '存量攻击失配: ' + t.slice(0, 18)); });
});
check('E2 删 C_ZH → 存量经典攻击翻红（经典注入语义未被 concat 破坏）', () => {
  REGRESSION.forEach(t => { assert(!detectTragedyOfCommons(t, { C_ZH: [] }).hit, '删 C_ZH 后存量攻击仍命中（注入语义坏）: ' + t.slice(0, 18)); });
});

console.log('### F 内部常量导出');
check('F __internals 导出 C_ZH5/B_EN5/C_EN5 非空', () => {
  const I = __internals();
  assert(Array.isArray(I.C_ZH5) && I.C_ZH5.length > 0, 'C_ZH5 未导出');
  assert(Array.isArray(I.B_EN5) && I.B_EN5.length > 0, 'B_EN5 未导出');
  assert(Array.isArray(I.C_EN5) && I.C_EN5.length > 0, 'C_EN5 未导出');
});

console.log('### G 登记');
check('G 登记：claims.jsonl 含 r363 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8');
  assert(claims.includes('"round":"r363"') && claims.includes('"agent":"agent-4"') && claims.includes('"kind":"dimension"'), 'claims.jsonl 缺 r363 认领');
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) process.exit(1);
