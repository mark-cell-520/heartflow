/**
 * r463 empty_answer[circular_restate] 英文支守卫
 *
 * 背景（r460 的自引入回归）：r460 移除英文支「同形跳过」后，循环重述族
 * 攻击从 0/10 提到 10/10，但同时把一句**良性工程句**拖进命中
 * （because 前后同词干 slow…slow，后半给出修复动作）。根因是
 * **架构性不对称**：r447 给套话支加的英文收敛/数值赦免只挂在
 * EMPTY_ANSWER_PATTERNS.en 命中分支上，而循环支闸门用的是
 * EMPTY_CONVERGE_ZH / EMPTY_NUMERIC_ZH 两个中文正则，英文文本上恒 false
 * → 英文循环支从来没有赦免通道。
 *
 * 本测试锁三件事：
 *   1) 英文循环攻击集命中（召回），gate 给 verify
 *   2) 良性工程句 0 误伤（含 r460 误伤的那一条），且中文侧基线不动
 *   3) 变异守卫：作废 EMPTY_CIRCULAR_FIX_EN（新赦免式）→ 良性误伤回来 → 变红
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
const g = require('../src/gate.js');

// ── 1. 英文攻击集：同词复现（无收敛、无数值、无修复动作）──────────────
const ATTACK_EN = [
  'The reason it works is because it works',
  'It is slow because it is slow',
  'This is wrong because it is wrong',
  'The problem persists because the problem persists',
  'It is risky because it is risky',
  'The delay is high because the delay is high',
  'It broke because it broke',
  'The issue remains because the issue remains',
  'It crashed since it crashed',
  'The failure occurs as the failure occurs',
];

// ── 2. 良性工程句：给出修复动作/数值/新实体（不得命中）────────────────
const BENIGN_EN = [
  'It failed due to a null pointer; add a guard clause',
  'It is complex because it spans 40 modules across 3 teams',
  'The root cause is a race condition in the cache layer',
  'It is slow because the query does a full table scan',
  'It broke because the connection pool was exhausted',
  'The service is slow because the disk is slow but the CPU is fine and the fix is to move the hot tables to NVMe',
  'It failed because the token expired, refresh it and retry',
  'The build fails because the artifact cache is cold on the first run',
  'It is expensive because there are 3 replicas each with 16GB reserved, we can drop to 2',
  'The job is slow because it processes 2 million rows one by one; batch it to 10k',
  'It is wrong because the offset starts at 1 instead of 0',
  'It is risky because we have no fallback and no retry budget',
  'The delay is high because the RTT to the peer is 240ms',
  'It crashed because the vendor API returned a 500 twice in a row',
  'It is broken because the migration script dropped the index, restore it from the backup',
];

// ── 3. 中文基线：r417 建立的攻击/良性子集，确认本轮没动中文口径 ────────
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
];
const BENIGN_ZH = [
  '它失败是因为输入为空导致除以零，修法是加判空',
  '这个问题复杂在三个维度：数据量、并发、一致性，我建议先解决一致性',
  '这件事的关键是找到关键约束，也就是带宽上限 10Gbps',
  '会上讨论了三个议题，结论是采纳方案 B',
  '原因在于冷却系统故障，温度超过阈值触发停机',
  '慢是因为索引缺失导致全表扫描，加了索引降到 30ms',
  '需求变更多是因为客户三次改期，建议冻结范围',
  '效率低是因为串行调用过多，改并行后提升 3 倍',
  '延迟高是因为跨境链路 RTT 高，无法在本层优化',
  '风险大是因为只做了单机房部署，补多活即可',
];

// ── 断言 1：英文攻击全部命中 empty_answer ───────────────────────────
let enHit = 0;
for (const t of ATTACK_EN) if (checkEmptyAnswer(t).count > 0) enHit++;
console.log(`英文攻击命中 ${enHit}/${ATTACK_EN.length}`);
assert.strictEqual(enHit, ATTACK_EN.length, `英文循环攻击漏判：${ATTACK_EN.length - enHit} 条`);

// ── 断言 2：英文良性 0 误伤（含 r460 误伤的那条）─────────────────────
let enFp = 0; const enFpList = [];
for (const t of BENIGN_EN) { if (checkEmptyAnswer(t).count > 0) { enFp++; enFpList.push(t.slice(0, 40)); } }
console.log(`英文良性误伤 ${enFp}/${BENIGN_EN.length}`);
assert.strictEqual(enFp, 0, `英文良性误伤: ${enFpList.join(' | ')}`);

// ── 断言 3：中文侧基线不变（攻击 9/9、良性 0）────────────────────────
const zhHit = ATTACK_ZH.filter(t => checkEmptyAnswer(t).count > 0).length;
const zhFp = BENIGN_ZH.filter(t => checkEmptyAnswer(t).count > 0).length;
console.log(`中文攻击命中 ${zhHit}/${ATTACK_ZH.length}、良性误伤 ${zhFp}/${BENIGN_ZH.length}`);
assert.strictEqual(zhHit, ATTACK_ZH.length, '中文攻击召回不得退化');
assert.strictEqual(zhFp, 0, '中文良性命中基线不得退化');

// ── 断言 4：gate 层英文攻击给非 pass ────────────────────────────────
const gateHit = ATTACK_EN.filter(t => g.checkOutput(t).gate.action !== 'pass').length;
console.log(`英文攻击 gate 非 pass ${gateHit}/${ATTACK_EN.length}`);
assert.strictEqual(gateHit, ATTACK_EN.length, '英文循环攻击 gate 必须非 pass');

// ── 断言 5：变异守卫 ────────────────────────────────────────────────
const SELF_TEST = path.join(__dirname, 'round-463-circular-en-fix-amnesty.test.js');
function runSelf() {
  try { cp.execSync(`node ${JSON.stringify(SELF_TEST)}`, { cwd: ROOT, stdio: 'pipe', env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }) }); return 0; }
  catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}
let red = 0;
// [cronfix 2026-10-05] 递归深度保护：子进程（_HF_SELF_SPAWN_DEPTH>=1）
// 直接结束，绝不进入变异守卫段。否则每个子进程会再 spawn 多个孙子进程，
// 指数级自我复制。2026-10-05 实测同类文件泄漏 27 个 node 副本、1408MB，
// 顶穿 4GiB cgroup → OOM killer 杀 gateway → 飞书/微信全断。
// 子进程跑到这里说明前置断言全过（exit 0），父进程据此判定"未变红"，
// 语义不变，只是不再递归。
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) >= 1) {
  console.log('[cronfix] 子进程：跳过变异守卫段（防自我 spawn 膨胀）');
  process.exit(0);
}
const MUTATIONS = [
  { name: 'M1 作废 EMPTY_CIRCULAR_FIX_EN（新赦免式）', mark: 'const EMPTY_CIRCULAR_FIX_EN =' },
  // [r473] M2 锚点重定位：EMPTY_CIRCULAR_EN 常量已在 r465 作为「从未被引用的
  // 恒假空壳死码」删除，英文循环判据本体改由 _emptyCircularEnTest() 函数实现
  // （L3988），删掉它 = 判据本体消失。改为两个锚点：
  //   M2a 作废 _emptyCircularEnTest（函数体换成恒 false）
  //   M2b 把函数调用点短路 —— hasChinese 恒 true，英文文本全走中文支
  { name: 'M2a 作废 _emptyCircularEnTest（英文循环判据本体）', mark: 'function _emptyCircularEnTest(text) {' },
  { name: 'M2b 短路英文支调用点（hasChinese 恒真）', mark: 'const circular = hasChinese ? EMPTY_CIRCULAR_ZH.test(text) : _emptyCircularEnTest(text);' },
];
// [r473] 逐锚点替换策略：函数定义锚点需把函数体首行改成 return false（否则
// 后面跟着的还是原函数体，语法会崩 —— 原实现的删条是在 mark 行后插入恒假
// return，正好等价于作废本体）。调用点锚点用 hasChinese 恒真替换三目。
function mutate(orig, mark) {
  const idx = orig.indexOf(mark);
  assert.ok(idx >= 0, `锚点未找到: ${mark}`);
  const lineEnd = orig.indexOf('\n', idx);
  if (mark.indexOf('const circular =') === 0) {
    return orig.slice(0, idx) + 'const circular = true ? EMPTY_CIRCULAR_ZH.test(text) : _emptyCircularEnTest(text);' + orig.slice(lineEnd);
  }
  return orig.slice(0, idx) + mark + '\n  return false; /' + '(?!x)x/;' + orig.slice(lineEnd);
}
for (const mut of MUTATIONS) {
  const mutated = mutate(orig, mut.mark);
  arm(SRC, fs.readFileSync(SRC, 'utf8'));
  fs.writeFileSync(SRC, mutated, 'utf8');
  const code = runSelf();
  fs.writeFileSync(SRC, orig, 'utf8');
  disarm(SRC);
  console.log(`${mut.name}: exit=${code} ${code !== 0 ? '✅ 变红' : '❌ 守卫不敏感'}`);
  if (code !== 0) red++;
}
assert.strictEqual(red, MUTATIONS.length, '两个变异都必须变红');
assert.strictEqual(runSelf(), 0, '还原后必须 PASS');

console.log('\nr463 circular_en_fix_amnesty: 全部通过');
