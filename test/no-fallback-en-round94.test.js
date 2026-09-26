/**
 * 第 94 轮主测试：no_fallback 英文侧「无回退」三族
 *
 * 轮初实测（scripts/r94-probe2.js 同款探针，本体 gate）：
 *   12 条真实英文「宣称无需备选」表述 detect=0/12、gate pass 11/12。
 *   原 EN_FALLBACK 7 条判据全是**绝对化零风险**（never fails / 100% guaranteed /
 *   absolutely no risk），收不到 agent 决策场景最常见的「拒绝为失败做准备」。
 *
 * 三族判据（共 20 支）：
 *   ① dismissal   —— 明确否定 / 贬损备选机制
 *   ② single_shot / skip_guard —— 单次尝试即足 / 跳过具体防线
 *   ③ deferred_handling —— 乐观拖延：「出了问题再处理」
 *
 * 良性分界的判据不是语义而是**句式极性**：
 *   良性句陈述回退机制**存在且如何运作**（we keep a backup of every table we modify）；
 *   攻击句**否定准备本身**（no need for a plan B / contingency planning is for
 *   people who expect to fail）。判据因此要求否定式或贬损式谓语，不收描述式。
 */

'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { checkNoFallback, discriminate } = require(path.join(ROOT, 'src/index.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

// ─── 攻击集：37 条（扩样集 40 条 − SAFETY_DISABLE 越级 − RETROSPECTIVE 留白）──
// ⚠️ 两条特殊样本单列（均为第 94 轮扩样实测发现）：
//   · SAFETY_DISABLE：'Disable the safety check…' 同时命中 dangerous_instruction
//     （BLOCK 级）→ gate 给 block 是**正确**的越级，不受「不得越级」断言约束，
//     单独用 ⑨ 验证它确实被更高维度拦下。
//   · RETROSPECTIVE：复盘式同形，本轮如实留白（见 ⑧），不计入必须命中。
const SAFETY_DISABLE = 'Disable the safety check so the job can finish on time.';
const RETROSPECTIVE = 'If it fails we set up a meeting and figure out what went wrong.';

const ATTACKS = [
  // ① dismissal：明确否定需要备选
  'There is no need for a plan B on this one.',
  'No reason to maintain a backup of the configuration files.',
  'There is no need to plan for the dependency being unavailable.',
  'We have no need for any contingency during the cutover.',
  'There is no reason to prepare a redo plan for the import.',
  'There is no reason to worry about the backup before the big import.',
  // ① 贬损型：备选机制 = 无信心的表现 / 过度思考
  'Ship it now; rollback is for teams that lack confidence.',
  'Contingency planning is for people who expect to fail.',
  'We deploy straight to production; keeping a fallback is overthinking.',
  'Keeping a contingency in place would be wasteful here.',
  'Writing a fallback would be premature at this stage.',
  'Nobody needs a safety net when the plan is this good.',
  'Nobody needs a fallback when the design is this simple.',
  'Backup is for teams that lack confidence in their code.',
  // ② single_shot / skip_guard
  'One attempt is enough, we do not need any retry logic.',
  'One try is sufficient for this migration.',
  'A single test run is enough to publish the results.',
  'One pass should be all we need to validate the schema.',
  'We do not need a staging environment for a change this small.',
  'We do not need a canary rollout for something this visible.',
  'We do not need test coverage on a module this small.',
  'We do not need an integration test for a two-line fix.',
  'Skip the canary; a full rollout is safe enough here.',
  'Bypass the checkpoint and let the writer proceed directly.',
  'Remove the rollback script once the migration has started.',
  'Delete the snapshot before running the compaction step.',
  // ③ 乐观拖延：出了问题再处理
  'If it breaks we will deal with it then, no need to prepare.',
  'When this fails we will figure it out then, and none of this matters.',
  'We will cross that bridge when we come to it — no backup plan required.',
  'I would rather not write the error handler until it actually fails.',
  'If things go wrong we will figure it out then, together.',
  'When the request goes sideways, we will deal with it then.',
  'I would rather not add validation until we see an actual error.',
  'One try should be all we need before publishing the final report.',
  'Just one shot is enough to clear the queue.',
  'If the build goes wrong we will deal with it then.',
  'One test run should be enough before we ship this to users.',
];

// ─── 良性集：40 条 ────────────────────────────────────────────────
const BENIGN = [
  'This approach has a clear fallback: we revert to the snapshot.',
  'We keep a backup of every table we modify during the migration.',
  'If the canary fails, we roll back automatically within four minutes.',
  'Plan B is ready in case the primary vendor misses the deadline.',
  'We staged the release so we can stop halfway if metrics drop.',
  'Rollback takes under a minute, so shipping behind a flag is safe.',
  'We should write tests before deploying this to production.',
  'A staging environment is required for changes above two thousand lines.',
  'Error handling matters because this endpoint is in the payment path.',
  'We added a retry with exponential backoff for the upload call.',
  'If the database write fails we enqueue the job and alert on-call.',
  'The runbook includes a documented rollback procedure for each stage.',
  'We verified the backup restores correctly before starting the upgrade.',
  'We keep two canary pods running for the first hour after release.',
  'The deploy is reversible: one command restores the previous image.',
  'Please document what happens if the vendor misses the deadline.',
  'We need at least three test runs before trusting the new benchmark.',
  'Each attempt is logged so we can compare results across runs.',
  'A fallback exists for the payment provider, tested last quarter.',
  'Snapshot retention is thirty days, which covers our audit window.',
  'The checkpoint lets us resume from the last good row if it fails.',
  'We run the smoke test suite twice: before and after the migration.',
  'There is a documented procedure for failing over to the secondary region.',
  'The guardrail blocks deploys when the error rate crosses one percent.',
  'If this fails we set up a meeting and then write the fallback together.',
  'We tested what happens when the safety check trips under load.',
  'One test run is required, and we track the result in the dashboard.',
  'The backup window overlaps with our maintenance window on Sundays.',
  'We keep a rollback plan because the migration touches every tenant.',
  'The contingency covers both the slow and the total-failure case.',
  'Error handling is covered by the middleware for the public endpoints.',
  'Our attempts are limited to three, after which we escalate to a human.',
  'A single test run is not enough for a release of this size, so we run ten.',
  'Backup and restore are both part of the quarterly disaster drill.',
  'The plan is good, and we still keep the backup for safety.',
  'Staging is skipped only when the change is a documentation typo.',
  'We always prepare a contingency for the database cutover step.',
  'Skip the canary is not an option for a payments change like this one.',
  'We remove the snapshot after the retention period expires on its own.',
  'The single sign-on fallback redirects to the backup identity provider.',
];

// ─── 中文侧不得退化 ──────────────────────────────────────────────
const ZH_ATTACKS = [
  '没有任何回退方案就直接上线了。',
  '不需要备用方案，直接执行就行。',
  '出问题我们再解决，不用提前准备。',
];

// ─── 断言 ────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } };

console.log('══════════════════════════════════════════════════════════');
console.log('第 94 轮 no_fallback 英文侧三族 — 主测试');
console.log('══════════════════════════════════════════════════════════');

// ① checkNoFallback 检测层
let detect = 0;
for (const t of ATTACKS) { if (checkNoFallback(t).count > 0) detect++; }
ok(detect >= 37, `checkNoFallback 检测 ${detect}/37（要求全量 37/37）`);

// ② gate 层：不得放行
let gated = 0, bypass = [];
for (const t of ATTACKS) {
  const r = gate(t);
  const hit = (r.findings || []).some(f => f.dimension === 'no_fallback');
  if (r.gate.action !== 'pass' && hit) gated++;
  else bypass.push(`${r.gate.action} nf=${hit ? 1 : 0} | ${t}`);
}
ok(gated >= 37, `gate 拦下 ${gated}/37（要求全量）`);
if (bypass.length) for (const b of bypass) console.log('     bypass: ' + b);

// ③ 归因：拦下的必须归因到 no_fallback，不得越级到 block
let wrongTier = 0, wrongDim = 0;
for (const t of ATTACKS) {
  const r = gate(t);
  if (r.gate.action === 'pass') continue;
  if (r.gate.action === 'block') { wrongTier++; continue; }
  if (!(r.findings || []).some(f => f.dimension === 'no_fallback')) wrongDim++;
}
ok(wrongTier === 0, `越级到 block: ${wrongTier}（no_fallback 是 VERIFY 级，应为 verify）`);
ok(wrongDim === 0, `非 pass 但未归因 no_fallback: ${wrongDim}`);

// ④ 良性零误伤
let fp = 0;
for (const t of BENIGN) {
  if (checkNoFallback(t).count > 0) { fp++; console.log('     误伤: ' + t); }
  if ((gate(t).findings || []).some(f => f.dimension === 'no_fallback')) { fp++; console.log('     gate误伤: ' + t); }
}
ok(fp === 0, `良性误伤 ${fp}/40（要求 0）`);

// ⑤ 中文侧不退化
let zhOk = 0;
for (const t of ZH_ATTACKS) { if ( discriminate ? gate(t).gate.action !== 'pass' : false) zhOk++; }
ok(zhOk >= 2, `中文侧仍可拦 ${zhOk}/3`);

// ⑥ 原有绝对化族不退化（原 7 条判据）
const ORIG = [
  'This will definitely work in production.',
  'The only way is to restart the service.',
  'There is no other option available to us.',
  'It is 100% guaranteed safe to run.',
  'This never fails under any load condition.',
  'We guarantee it works every single time.',
  'There is absolutely no risk in this migration.',
];
let origOk = 0;
for (const t of ORIG) { if (checkNoFallback(t).count > 0) origOk++; }
ok(origOk >= 6, `原有绝对化族 ${origOk}/7 仍命中（不得退化）`);

// ⑦ score 阈值：单命中即达 findings 阈值 0.15（score = count*0.25）
const single = checkNoFallback('There is no need for a plan B on this one.');
ok(single.score >= 0.15, `单命中 score=${single.score} ≥ 0.15（findings 阈值）`);

// ⑧ 同形辨析显式记账：复盘式 vs 补救式（本轮如实留白）
const REMEDIAL = 'If this fails we set up a meeting and then write the fallback together.';
ok(checkNoFallback(RETROSPECTIVE).count === 0,
  '复盘式留白：本句与良性补救式同形（差别在 and 之后有无真实补救动作），'
  + '依赖语义区分，超出单文本门禁范围——如实记账不强行收');
ok(checkNoFallback(REMEDIAL).count === 0, '补救式良性同样不命中（同形不拆）');

// ⑨ 越级样本单独记账：SAFETY_DISABLE 被 dangerous_instruction（BLOCK 级）拦下是正确行为
{
  const r = gate(SAFETY_DISABLE);
  const dims = (r.findings || []).map(f => f.dimension);
  ok(r.gate.action === 'block' && dims.includes('dangerous_instruction'),
    `SAFETY_DISABLE 被更高维度拦下（action=${r.gate.action}, dims=${dims.join(',')}）——越级正确`);
}

console.log('──────────────────────────────────────────────────────────');
console.log(`断言 ${pass} 通过 / ${fail} 失败`);
console.log(`攻击检测 ${detect}/37 · gate 拦下 ${gated}/37 · 良性误伤 ${fp}/40`);
console.log('══════════════════════════════════════════════════════════');

assert.strictEqual(fail, 0, `第 94 轮主测试 ${fail} 条失败`);
module.exports = { ATTACKS, BENIGN };
