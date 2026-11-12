/**
 * r302 负例注入承重证明：对 src/regression-to-the-mean.js 的 r302 新增腿做
 * hit → 删腿 → miss → 恢复 → hit 闭环。
 *
 * 注入方式：require 后通过 __internals() 拿到常量数组，按索引置空该条（不删元素，
 * 避开 length===N 断言），再重跑 checkRegressionToMean。
 *
 * 目标腿（均为 r302 WIP 新增，探针证零命中）：
 *   1. INTERVENE_ZH 第 9 条（索引 8）——干预主体名词形「补课班/补习班/辅导班」
 *   2. 普通比较级落差族（EXTREME_LOW_ZH 的 r302 并入条）
 *   3. 指标名词 + 落差动词族
 */
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const mod = require(path.join(ROOT, 'src', 'regression-to-the-mean.js'));
const { checkRegressionToMean, __internals } = mod;

// ─── 待注入腿的定位（用首个特征串匹配，避免硬编码索引漂移） ───────────────
const LEGS = [
  {
    name: 'r302-干预主体名词形（补课班/补习班/辅导班/培训课程）',
    arr: 'INTERVENE_ZH',
    marker: '补课班',
    samples: [
      '上次他考了第一，这次考差了，看来上次的补课班起了反作用。',
      '上季度业绩是冠军，这个季度业绩下滑了，说明当初的激励机制适得其反。',
    ],
  },
  {
    name: 'r302-普通比较级落差族（考差了/业绩下滑/不如从前）',
    arr: 'EXTREME_LOW_ZH',
    marker: '考差了',
    samples: [
      '这次考差了，看来上次的补课班起了反作用。',
      '这次排名不如从前，说明之前的战术打法有问题。',
    ],
  },
  {
    name: 'r302-指标名词+落差动词族（成绩下滑/业绩降了）',
    arr: 'EXTREME_LOW_ZH',
    marker: '业绩|绩效',
    samples: [
      '上个月业绩是冠军，这个月业绩降了，说明新政策起了反作用。',
      '上次口碑最好，这次口碑不如从前，看来换岗是个错误。',
    ],
  },
];

function runAll(samples) {
  return samples.map(s => {
    const r = checkRegressionToMean(s);
    return !!(r && (r.hit === true || (r.score && r.score > 0)));
  });
}

// 用 inject 机制：把目标数组整条替换为空串 → 等于删腿但保留 length
function injectLeg(arrName, marker) {
  const I = __internals();
  const arr = I[arrName];
  if (!arr) return { ok: false, reason: '数组不存在 ' + arrName };
  const re = new RegExp(marker);
  let idx = -1;
  for (let i = 0; i < arr.length; i++) {
    const s = String(arr[i].source || arr[i]);
    if (re.test(s)) { idx = i; break; }
  }
  if (idx < 0) return { ok: false, reason: `未找到含 ${marker} 的条 @${arrName}` };
  const orig = arr[idx];
  arr[idx] = /$/;          // 置为永不匹配的空正则
  return { ok: true, idx, restore: () => { arr[idx] = orig; } };
}

let pass = 0, fails = [];
console.log('=== r302 负例注入承重证明（regression_to_the_mean 补腿） ===');

for (const leg of LEGS) {
  const before = runAll(leg.samples);
  const inj = injectLeg(leg.arr, leg.marker);
  if (!inj.ok) {
    fails.push(`${leg.name} — 注入失败：${inj.reason}`);
    console.log(`  ✗ ${leg.name} — 注入失败：${inj.reason}`);
    continue;
  }
  const during = runAll(leg.samples);
  inj.restore();
  const after = runAll(leg.samples);

  const beforeHit = before.some(Boolean);
  const duringMiss = during.every(v => !v);
  const restoredHit = after.some(Boolean);

  if (beforeHit && duringMiss && restoredHit) {
    pass++;
    console.log(`  ✓ ${leg.name} — hit→(删腿)miss→(恢复)hit 承重闭环`);
  } else {
    const why = !beforeHit ? '删腿前就不命中（腿本身不承重）'
      : !duringMiss ? '删腿后仍命中（既有腿冗余覆盖）'
      : '恢复后未命中（不稳定）';
    fails.push(`${leg.name} — ${why}`);
    console.log(`  ✗ ${leg.name} — ${why}`);
  }
}

console.log(`\nr302 负例注入：${pass}/${LEGS.length} 腿承重`);
if (fails.length) for (const f of fails) console.log('  · ' + f);
console.log(pass === LEGS.length ? 'R302_INJECTION_ALL_LOAD_BEARING' : 'R302_INJECTION_PARTIAL');
