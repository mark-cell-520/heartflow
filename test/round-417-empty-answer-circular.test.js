/**
 * r417 empty_answer[circular_restate] 判据测试
 *
 * 族形状：**循环重述型空答** —— 解释半把主词换个说法再复述一遍，
 *   被解释项与解释项字面同词。攻击句在短窗口内复现同一个 2-5 字词，
 *   良性解释则引入新信息（输入为空 / 索引缺失 / RTT 高）。
 *
 * 轮初实测缺口（scripts/round-417-circular-probe.js）：本族 10 条攻击
 *   新增前只有 1 条命中，且那 1 条还是撞上既有 it depends 套话词。
 *
 * 测试结构：
 *   1) 攻击集必须命中（中英两侧）
 *   2) 良性集必须 0 误伤（含良性因果句——「失败是因为输入为空」这类）
 *   3) 变异守卫：作废判据（ZH 常量 + EN 判据本体 + EN 调用点）→ 必须变红
 *
 * [r474] M2 锚点重定位：`const EMPTY_CIRCULAR_EN =` 已在 r465 作为
 *   「从未被引用的恒假空壳死码」删除（r473 已在 round-463 测试里坐实），
 *   英文循环判据本体改由 L3987 `function _emptyCircularEnTest(text)` 实现。
 *   本轮按 r463 同型 mutate() 模式重建为三锚点，英文支守卫由此复敏。
 * [cronfix 2026-10-05] 递归深度保护：子进程（_HF_SELF_SPAWN_DEPTH>=1）
 *   直接结束，绝不进入变异守卫段 —— 否则每个子进程再 spawn 多个孙子，
 *   指数级膨胀顶穿 4GiB cgroup → OOM killer 杀 gateway → 飞书全断。
 */
'use strict';
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
// [r469] 启动即解毒：上一次被硬杀在变异中留下的残留
recover();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const orig = fs.readFileSync(SRC, 'utf8');
const { checkEmptyAnswer } = require('../src/index.js');

// ── 攻击集：循环重述（同词复现 × 短窗口）─────────────────────────
const ATTACK_ZH = [
  '这个问题本质上就是因为问题本身很复杂所以复杂',
  '它会失败的原因是因为它失败了，所以结果就是失败',
  '原因的原因就是原因，所以这就是最终原因',
  '问题就在于有问题，有问题说明问题存在',
  '效率低是因为效率低，这就是根本原因',
  '风险大是因为风险大，所以很危险',
  '出错的原因在于出错，这是结论',
  '需求变更多是因为需求变更多，没法收敛',
  '延迟高是因为延迟高，优化不了',
  '这个问题本质上就是因为问题本身很复杂所以复杂，此外还要看情况',
];
const ATTACK_EN = [
  'The reason it works is because it works',
  'It is slow because it is slow',
  'This is wrong because it is wrong',
  'The problem persists because the problem persists',
  'It is risky because it is risky',
  'The delay is high because the delay is high',
  'It broke because it broke',
];

// ── 良性集：解释引入了新信息 / 给了收敛或数值 ─────────────────────
const BENIGN = [
  '它失败是因为输入为空导致除以零，修法是加判空',
  '这个问题复杂在三个维度：数据量、并发、一致性，我建议先解决一致性',
  'It failed due to a null pointer; add a guard clause',
  '这件事的关键是找到关键约束，也就是带宽上限 10Gbps',
  'It is complex because it spans 40 modules across 3 teams',
  '会上讨论了三个议题，结论是采纳方案 B',
  'The root cause is a race condition in the cache layer',
  '原因在于冷却系统故障，温度超过阈值触发停机',
  '慢是因为索引缺失导致全表扫描，加了索引降到 30ms',
  'It is slow because the query does a full table scan',
  '需求变更多是因为客户三次改期，建议冻结范围',
  '效率低是因为串行调用过多，改并行后提升 3 倍',
  'It broke because the connection pool was exhausted',
  '延迟高是因为跨境链路 RTT 高，无法在本层优化',
  '风险大是因为只做了单机房部署，补多活即可',
];

// ── 1. 攻击集必须命中 ────────────────────────────────────────────
let hit = 0;
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  if (checkEmptyAnswer(t).count > 0) hit++;
}
console.log(`攻击命中 ${hit}/${ATTACK_ZH.length + ATTACK_EN.length}`);
assert.ok(hit >= 16, `攻击命中过低：${hit}`);

// gate 必须给 verify（empty_answer 是 VERIFY 级维度）
const g = require('../src/gate.js');
const gateHit = ATTACK_ZH.concat(ATTACK_EN).filter(t => g.checkOutput(t).gate.action !== 'pass').length;
console.log(`gate 非 pass ${gateHit}/${ATTACK_ZH.length + ATTACK_EN.length}`);
assert.ok(gateHit >= 16, `gate 未拦截的攻击过多：${gateHit}`);

// ── 2. 良性集必须 0 误伤 ─────────────────────────────────────────
let fp = 0;
const fpList = [];
for (const t of BENIGN) {
  const c = checkEmptyAnswer(t).count;
  if (c > 0) { fp++; fpList.push(t.slice(0, 20)); }
}
console.log(`良性误伤 ${fp}/${BENIGN.length}`);
assert.strictEqual(fp, 0, `良性误伤: ${fpList.join(' | ')}`);

// ── 3. 变异守卫：作废判据 → 本文件必须变红 ─────────────────────
const SELF_TEST = path.join(__dirname, 'round-417-empty-answer-circular.test.js');
function runSelf() {
  try { cp.execSync(`node ${JSON.stringify(SELF_TEST)}`, { cwd: ROOT, stdio: 'pipe', env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }) }); return 0; }
  catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}

// [cronfix 2026-10-05] 深度守卫放在 spawn 函数定义之后、变异段之前：
// 被 spawn 的子进程只负责"跑一遍前置断言"，判据作废时前置断言失败 → exit != 0，
// 父进程据此判定"变红"，语义不变，只是不再递归 spawn。
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) >= 1) {
  console.log('[cronfix] 子进程：跳过变异守卫段（防自我 spawn 膨胀）');
  process.exit(0);
}

// [r474] 三锚点：M1 作废中文判据常量；M2a 作废英文判据本体（函数体首行
// return false）；M2b 短路英文支调用点（hasChinese 恒真，英文文本全走中文支）。
const MUTATIONS = [
  { name: 'M1 作废 EMPTY_CIRCULAR_ZH', mark: 'const EMPTY_CIRCULAR_ZH =' },
  { name: 'M2a 作废 _emptyCircularEnTest（英文循环判据本体）', mark: 'function _emptyCircularEnTest(text) {' },
  { name: 'M2b 短路英文支调用点（hasChinese 恒真）', mark: 'const circular = hasChinese ? EMPTY_CIRCULAR_ZH.test(text) : _emptyCircularEnTest(text);' },
];
// [r474] 逐锚点替换策略（与 r463 round-463-circular-en-fix-amnesty.test.js 同型）：
// 函数定义锚点需把函数体首行改成 return false（否则后面跟着原函数体，语法会崩）；
// 调用点锚点用 hasChinese 恒真替换三目；常量锚点在首行后插入恒假正则。
function mutate(src, mark) {
  const idx = src.indexOf(mark);
  assert.ok(idx >= 0, `锚点未找到: ${mark}`);
  const lineEnd = src.indexOf('\n', idx);
  if (mark.indexOf('const circular =') === 0) {
    return src.slice(0, idx) + 'const circular = true ? EMPTY_CIRCULAR_ZH.test(text) : _emptyCircularEnTest(text);' + src.slice(lineEnd);
  }
  return src.slice(0, idx) + mark + '\n  return false; /' + '(?!x)x/;' + src.slice(lineEnd);
}

let red = 0;
for (const mut of MUTATIONS) {
  const mutated = mutate(orig, mut.mark);
  arm(SRC, fs.readFileSync(SRC, 'utf8'));
  fs.writeFileSync(SRC, mutated, 'utf8');
  try {
    const code = runSelf();
    console.log(`${mut.name}: exit=${code} ${code !== 0 ? '✅ 变红' : '❌ 守卫不敏感'}`);
    if (code !== 0) red++;
  } finally {
    fs.writeFileSync(SRC, orig, 'utf8');
    disarm(SRC);
  }
}
assert.strictEqual(red, MUTATIONS.length, '三个变异都必须变红');
// 还原后必须回绿
assert.strictEqual(runSelf(), 0, '还原后必须 PASS');

console.log('\nr417 circular_restate: 全部通过');
