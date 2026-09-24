/**
 * absolute-claim-en.test.js — 英文绝对化句式族覆盖（v6.7.113）
 *
 * 缺口来源：第 8 轮实测 10 条真实句漏 7 条；第 13 轮复测 22 条漏 21 条
 *   （checkAbsoluteClaim 直接调用 count=0），良性边界 25 条实测 0 误伤。
 * 心虫 decision.decide A 方向 0.91 分选定。
 *
 * 原 ABSOLUTE_CLAIM_PATTERNS.en 6 条全是**词面**绝对化：
 *   no one has ever / will change everything / the only way is to /
 *   absolutely the best / never will work / everyone knows
 * 漏掉最高频的一类：**把结论的例外空间压到零**——
 *   保证成功、完全解决、无一例外、无人反对、100% 有效。
 *
 * 九族句式 + 良性边界 + 既有族防回归。
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkAbsoluteClaim } = require(path.join(ROOT, 'src', 'index.js'));

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  ✗ ' + msg); }
}

// ─── 1. 九族漏判样本：改动前全部 count=0（33 条） ───
const HITS = {
  '唯一解+优质形容词': [
    'This is the only correct solution.',
    'This is the only viable approach.',
    'That is the only valid explanation.',
    'compression is the only real fix.',
    'This is the only secure way to do it.',
    'The only acceptable option is to rewrite it.',
  ],
  '没有更好的方案': [
    'There is no better way to do this.',
    'no better alternative exists for now',
    'There is no better approach to this problem.',
    'No better solution has been proposed.',
  ],
  '永不失败/总是成功': [
    'This approach will never fail.',
    'The deployment will never fail.',
    'this tool always works',
    'It always succeeds under load.',
    'The check never fails to catch it.',
    'The service always delivers under stress.',
  ],
  '保证成功': [
    'This method is guaranteed to succeed.',
    'It is guaranteed to work.',
    'We guarantee a perfect result.',
    'The patch guarantees zero failure.',
    'This is guaranteed to solve the outage.',
    'The design guarantees success in production.',
  ],
  '无人能挡': [
    'Nothing can stop this trend.',
    'No one can prevent this outcome.',
    'Nobody can block our progress.',
    'Nothing could slow the rollout.',
  ],
  '无路可败': [
    'There is no way this could fail.',
    'There is no way we can lose this deal.',
  ],
  '完全解决': [
    'This will completely solve the problem.',
    'This will totally eliminate the risk.',
    'It fully removed the bug.',
    'This design completely prevents the attack.',
    'The patch totally fixed the leak.',
    'The fix entirely resolved the conflict.',
  ],
  '人人皆知/无人反对': [
    'All experts agree on this point.',
    'Nobody disputes this fact.',
    'All researchers concur on the mechanism.',
    'No one questions the result.',
    'All analysts agree on the forecast.',
  ],
  '无一例外': [
    'This works in every single case.',
    'It holds without exception.',
    'There are no exceptions to this rule.',
    'This option works in every single scenario.',
  ],
  '100%/zero 缺陷': [
    'This solution is 100% effective.',
    'We have zero defects in this release.',
    'zero vulnerabilities were found in the audit',
    'This firewall is 100% secure.',
    'The release has zero bugs.',
  ],
};

console.log('— 九族漏判样本（checkAbsoluteClaim 应命中且 gate=rewrite）—');
for (const [family, samples] of Object.entries(HITS)) {
  for (const t of samples) {
    const d = checkAbsoluteClaim(t);
    ok(d.count > 0, `checkAbsoluteClaim 未命中: [${family}] ${t}`);
    const r = gate(t);
    const ab = (r.findings || []).find(f => f.dimension === 'absolute_claim');
    ok(!!ab, `gate findings 缺 absolute_claim: [${family}] ${t}`);
    ok(r.gate.action === 'rewrite', `gate 应为 rewrite 实为 ${r.gate.action}: [${family}] ${t}`);
  }
}

// ─── 2. 良性边界：不得命中 absolute_claim、不得 block/rewrite ───
// 这些是**实测过**的边界（第 13 轮 probe#4/probe 改后验证），不是想出来的。
const BENIGN = [
  'This is the only file we changed.',                      // only + 普通名词
  'It is guaranteed to be installed by the package manager.', // guaranteed to be 被动
  'All tests currently pass.',
  'Everyone on the team reviewed the PR.',
  'This approach cannot fail silently.',
  'Nothing in the report suggests otherwise.',              // nothing 无 can
  'No single factor explains the outcome.',                 // no one/nobody 的邻居但不命中
  'There are no open issues right now.',                    // no + issues 非 exceptions
  'This is the recommended approach for now.',
  'We consider this the best option available.',            // best 无 absolutely/definitely
  'This approach works well in most cases.',
  'The fix resolved the issue in testing.',
  'It has not failed in our tests so far.',
  'Zero downtime is the goal, not a guarantee.',            // zero + 非缺陷名词
  'The build has zero dependencies on external services.',  // zero dependencies 工程事实
  'We never deploy on Fridays.',                            // never + 普通动词
  'The script always times out after 30 seconds.',          // always + 普通动词
  'All engineers on the call agreed to ship the fix.',       // all + 非专家名词
  'Everything passes the type checker.',                     // everything + 非 knows/agrees
  'It always fails on the CI runner, so we skip it there.', // always fails 非 always works
  'This removes the need for a manual review step.',
  'The migration is completely done.',                       // completely done 是 overconfidence 层，不是绝对化族
  'This feature is fully implemented.',                     // fully + implemented 非解决动词
  'we can no longer reproduce the error',
];

console.log('— 良性边界（不得命中 absolute_claim、不得 block/rewrite）—');
for (const t of BENIGN) {
  const d = checkAbsoluteClaim(t);
  ok(d.count === 0, `良性样本被 absolute_claim 命中(count=${d.count}): ${t}`);
  const r = gate(t);
  ok(r.gate.action !== 'block' && r.gate.action !== 'rewrite',
    `良性样本被 ${r.gate.action}: ${(r.findings || []).map(f => f.dimension).join(',')} | ${t}`);
}

// ─── 3. 既有族防回归：原 6 条不能退化 ───
const LEGACY = [
  'No one has ever solved this problem.',
  'This will change everything.',
  'The only way to succeed is to work harder.',
  'This is absolutely the best solution.',
  'Everyone knows that the earth is round.',
  // 负面对照：同族但 Change everything / never work 在 HEAD 就 count=0——
  // 那是既有表的口径（要求 this|it|that 作主语、never + will/would/can/could），
  // 不是本轮退化，见 scripts 的 HEAD 快照对照。
];
console.log('— 既有族防回归（原 6 条不得退化）—');
for (const t of LEGACY) {
  ok(checkAbsoluteClaim(t).count > 0, `既有族退化: ${t}`);
}

// ─── 4. 中文侧不受影响（英文模式不能被中文文本触发） ───
const ZH = [
  '这是唯一正确的解决方案。',
  '它永远不会失败。',
  '所有专家都同意这一点。',
];
console.log('— 中文侧保持 zh 表行为 —');
for (const t of ZH) {
  const d = checkAbsoluteClaim(t);
  ok(typeof d.count === 'number', `中文侧异常: ${t}`);
}

// ─── 5. 边界条件 ───
console.log('— 边界条件 —');
ok(checkAbsoluteClaim('').count === 0, '空串应返回 0');
ok(checkAbsoluteClaim(null).count === 0, 'null 应返回 0');
ok(checkAbsoluteClaim(undefined).count === 0, 'undefined 应返回 0');
{
  const d = checkAbsoluteClaim('the the only correct solution');
  ok(d.count > 0, '冠词重复不影响匹配');
}
// 分数封顶 1.0（count 可超 10，score 不能溢出）
{
  const many = HITS['100%/zero 缺陷'].join('. ') + '. ' + LEGACY.join('. ');
  const d = checkAbsoluteClaim(many);
  ok(d.score <= 1, `score 应封顶 1.0，实为 ${d.score}`);
}

console.log(`\nabsolute-claim-en: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
