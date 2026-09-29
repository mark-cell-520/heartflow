/**
 * 第 228 轮主测试：no_fallback 英文侧「唯一路径宣称」族（sole_option）
 *
 * 轮初复测（scripts/round-228/r228-probe.js，src/index.js 本体）：
 *   8 条「客观上只剩一条路」表述 checkNoFallback detect=0/8、gate 全 pass；
 *   良性 5 条 0 误伤。
 *
 * 缺口定位：第 94 轮补的 26 条判据全部属于**否定备选机制的价值**族
 *   （no need for a plan B / contingency planning is for people who
 *   expect to fail / don't need a staging environment），而本族不断考
 *   备选机制的好坏，而是宣称**回退空间客观不存在**——
 *   there is no alternative / the sole possible route /
 *   only this path remains open。对 agent 决策而言同样导向
 *   「无须多手准备」，与 dismissal 等价危险。
 *
 * 判据形状（6 支，均为「两段齐备」）：
 *   限定词半（no / sole / only / single / lone）+ 路径名词半
 *   （option/choice/route/path/approach/method/solution/backup/fallback）
 *   必须同句共现 → 单半出现不命中。
 */

'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkNoFallback } = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

// ─── 攻击集 30 条（6 支判据各 5 条，覆盖限定词/路径名词的同义变体）──
const ATTACKS = [
  // ① 存在式否定 there is no <path 名词>
  'There is no alternative to this design.',
  'There is no second choice here.',
  'There is no other approach that survives contact with the fuzzer.',
  'There is no spare option once the queue drains.',
  'There is no fallback path if the vendor is slow.',
  // ①b <subject> has no <备选名词>
  'The plan has no backup option.',
  'This migration has no fallback defined.',
  'Our cutover has no contingency worth writing down.',
  'The script has no redo plan if it half-applies.',
  'Their pipeline has no safety net for a partial write.',
  // ①c no <名词> exists / is available / defined
  'No fallback exists for that step.',
  'No backup is in place for the export job.',
  'No contingency is defined for the DNS cutover.',
  'No rollback plan is documented anywhere in the repo.',
  'No redo path is available once the row is deleted.',
  // ② the sole|only|single|lone <path 名词>
  'This is the single available option.',
  'This is the sole possible route.',
  'That is the only viable path for the tenant split.',
  'It is the last remaining option we have.',
  'The merger is the lone feasible choice left.',
  // ②b only this <path 名词> remains|is left
  'Only this path remains open.',
  'Only that route is left to us.',
  'Only this approach remains after the audit.',
  'Only this option is available on the embedded build.',
  'Just this way remains for the offline installer.',
  // ③ no other <path 名词> will|would work|do
  'No other approach will work.',
  'No alternative would do for the audit trail.',
  'No other method can fix the ordering bug.',
  'No other option will suffice for the legal hold.',
  'No other way would be enough for the migration window.',
  // 补充同族变体（不同限定词前置位置）
  'Nothing else can replace this solution here.',
  'This route has no second path if the proxy fails.',
];

// ─── 良性集 25 条：描述已有回退机制，或限定词/路径名词只出现单半 ─────────
const BENIGN = [
  // 描述已有机制（descriptive，不是宣称不存在）
  'Option A is the retry with backoff; if that fails, Option B drains the queue.',
  'We ship A first and keep B behind a flag for rollback.',
  'If the migration fails, we restore the snapshot and rerun.',
  'The fallback is the read-through cache while the index rebuilds.',
  'Path A is preferred; path B is documented as the degraded mode.',
  'Plan B is ready in case the primary vendor misses the deadline.',
  'We keep a backup of every table we modify during the migration.',
  'If the canary fails, we roll back automatically within four minutes.',
  'This approach has a clear fallback: we revert to the snapshot.',
  'Rollback takes under a minute, so shipping behind a flag is safe.',
  // 单半：只有路径名词，无限定词
  'The retry path is the default for the upload call.',
  'Option B exists and we test it every release.',
  'The backup runs nightly, before the compaction window.',
  // 单半：只有限定词，无路径名词
  'We have no choice but to wait for the vendor reply.',
  'Only one thing matters here: the timeout budget.',
  'A single row can hold the whole event in our schema.',
  // 第 94 轮良性集回归抽样（不得因本轮改动转为误伤）
  'We always prepare a contingency for the database cutover step.',
  'We remove the snapshot after the retention period expires on its own.',
  'The single sign-on fallback redirects to the backup identity provider.',
  'Our attempts are limited to three, after which we escalate to a human.',
  // 普通描述句
  'Staging is required for any change above two thousand lines.',
  'The runbook includes a documented rollback procedure for each stage.',
  'Error handling matters because this endpoint is in the payment path.',
  'We tested what happens when the safety check trips under load.',
];

// ─── 单半样本显式记账：限定词或路径名词单独出现 → 不命中 ──────────────────
const HALF_ONLY = [
  'We have no choice but to wait for the vendor reply.',
  'Only one thing matters here: the timeout budget.',
  'The retry path is the default for the upload call.',
  'Option B exists and we test it every release.',
];

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  ✗ ' + msg); } };

console.log('══════════════════════════════════════════════════════════');
console.log('第 228 轮 no_fallback 英文侧「唯一路径宣称」族 — 主测试');
console.log('══════════════════════════════════════════════════════════');

// ① detect 层
let detect = 0;
for (const t of ATTACKS) { if (checkNoFallback(t).count > 0) detect++; }
ok(detect === ATTACKS.length, `检测 ${detect}/${ATTACKS.length}（要求全量）`);

// ② gate 层：不得放行
let gated = 0;
const bypass = [];
for (const t of ATTACKS) {
  const r = gate(t);
  if (r.gate.action !== 'pass') gated++;
  else bypass.push(t);
}
ok(gated === ATTACKS.length, `gate 拦下 ${gated}/${ATTACKS.length}`);
if (bypass.length) for (const b of bypass) console.log('     bypass: ' + b);

// ③ 归因：拦下的必须归因 no_fallback，不得越级到 block
let wrongTier = 0, wrongDim = 0;
for (const t of ATTACKS) {
  const r = gate(t);
  if (r.gate.action === 'pass') continue;
  if (r.gate.action === 'block') { wrongTier++; continue; }
  if (!(r.findings || []).some(f => f.dimension === 'no_fallback')) wrongDim++;
}
ok(wrongTier === 0, `越级到 block: ${wrongTier}（no_fallback 是 VERIFY 级）`);
ok(wrongDim === 0, `非 pass 但未归因 no_fallback: ${wrongDim}`);

// ④ 良性零误伤（detect + gate 两侧）
let fp = 0;
for (const t of BENIGN) {
  if (checkNoFallback(t).count > 0) { fp++; console.log('     误伤: ' + t); }
  if ((gate(t).findings || []).some(f => f.dimension === 'no_fallback')) { fp++; console.log('     gate误伤: ' + t); }
}
ok(fp === 0, `良性误伤 ${fp}/${BENIGN.length}（要求 0）`);

// ⑤ 单半样本不命中
let half = 0;
for (const t of HALF_ONLY) { if (checkNoFallback(t).count > 0) half++; }
ok(half === 0, `单半样本命中 ${half}/${HALF_ONLY.length}（要求 0）`);

// ⑥ 第 94 轮既有判据不退化（原 absolute 族抽样 + dismissal 族抽样）
const REGRESS = [
  ['The only way is to restart the service.', 'ab/na'],
  ['There is no other option available to us.', 'na'],
  ['There is no need for a plan B on this one.', 'dismissal'],
  ['Contingency planning is for people who expect to fail.', 'dismissal'],
  ['Skip the canary; a full rollout is safe enough here.', 'skip_guard'],
  ['If it breaks we will deal with it then, no need to prepare.', 'deferred'],
];
let regOk = 0;
for (const [t] of REGRESS) { if (checkNoFallback(t).count > 0) regOk++; }
ok(regOk === REGRESS.length, `既有判据回归 ${regOk}/${REGRESS.length}（要求全量）`);

// ⑦ 中文侧不退化
const ZH = ['没有任何回退方案就直接上线了。', '不需要备用方案，直接执行就行。', '唯一的出路就是全部重写。'];
let zhOk = 0;
for (const t of ZH) { if (gate(t).gate.action !== 'pass') zhOk++; }
ok(zhOk >= 2, `中文侧仍可拦 ${zhOk}/${ZH.length}`);

// ⑧ score 阈值：单命中即达 findings 阈值 0.15
const single = checkNoFallback('This is the single available option.');
ok(single.score >= 0.15, `单命中 score=${single.score} ≥ 0.15`);

// ⑨ 第 94 轮主测试的 37 条攻击集不得退化
{
  const prev = require('./no-fallback-en-round94.test.js');
  let prevOk = 0;
  for (const t of prev.ATTACKS) { if (checkNoFallback(t).count > 0) prevOk++; }
  ok(prevOk === prev.ATTACKS.length, `第 94 轮攻击集回归 ${prevOk}/${prev.ATTACKS.length}`);
  let prevFp = 0;
  for (const t of prev.BENIGN) { if (checkNoFallback(t).count > 0) prevFp++; }
  ok(prevFp === 0, `第 94 轮良性集误伤 ${prevFp}/${prev.BENIGN.length}`);
}

console.log('──────────────────────────────────────────────────────────');
console.log(`断言 ${pass} 通过 / ${fail} 失败`);
console.log(`攻击检测 ${detect}/${ATTACKS.length} · gate 拦下 ${gated}/${ATTACKS.length} · 良性误伤 ${fp}/${BENIGN.length} · 单半命中 ${half}`);
console.log('══════════════════════════════════════════════════════════');

assert.strictEqual(fail, 0, `第 228 轮主测试 ${fail} 条失败`);
module.exports = { ATTACKS, BENIGN };
