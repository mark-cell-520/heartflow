'use strict';
/**
 * test/hg-quantifier-nounverb-r723.test.js — 第 723 轮（v6.8.151）
 *
 * 本轮改动（src/index.js HASTY_GENERALIZATION_PATTERNS）：
 *   ① 填充槽尾限定词阻断（名动同形误伤修复，存量自 r229/r720 起潜伏）：
 *      everyone / nobody 两支的填充槽 `((?:\w+\s+){0,3})` 改「尾词非限定词」
 *      感知。轮初复测（scripts/diag-r723-nounverb.js）实测 12/12 良性流程句
 *      被误拦——"Everyone on the audit team must verify the findings."
 *      match="Everyone on the audit"（audit 是 team 的修饰语，被谓词表里的
 *      audit 动词形吞掉）。根因：谓词表混入名动同形词（check/call/email/
 *      file/open/use/question/notice/review/audit/test/watch/ship/reply/
 *      care/trust + 验证八族），而限定词后接动词在英语里不成立——槽尾是
 *      限定词时谓词位必然是名词修饰读法。every/each 主支（v6.7.126 起）本
 *      就有宾语槽所以天生免疫，本修法把该保护补进 everyone/nobody 两支。
 *   ② 零贡献归罪族量化形补全（r721 测试规范写明的下轮方向）：
 *      - all 族零贡献支（"All developers leave no comments." 10 形全补）
 *      - no one/nobody 零贡献支（宾语取 any|no——否定量化词的自然宾语是
 *        any；不收 without——"No one leaves without signing out." 是规范陈述）
 *      - everybody 零贡献支（原只被 knows/says/thinks 老判据覆盖）
 *      - no one/nobody 贡献动词支（logs/updates/fixes/answers/tracks/
 *        records/maintains/writes 八族，宾语槽锁 determiner/to-动词/句尾）
 *   ③ every/each 零贡献支补捕获槽：守卫 isNormativeQuantifierHit 现在能
 *      豁免 "Every customer must leave no comments." 类规范句。
 *
 * 门禁口径（与 229/230/720/721 轮一致）：
 *   · 攻击样本 checkHastyGeneralization().count >= 1
 *   · 良性样本 count === 0（含名动同形修饰读法句与规范情态句）
 *   · 存量样本不回归（r229/r230/r720 锁定样本全量复跑）
 */
'use strict';

const assert = require('assert');
const { checkHastyGeneralization } = require('../src/index.js');

let pass = 0, fail = 0;
const failures = [];
function check(label, text, expectHit) {
  const r = checkHastyGeneralization(text);
  const hit = r.count >= 1;
  if (hit === expectHit) { pass++; }
  else {
    fail++;
    failures.push(`${label}: "${text}" count=${r.count} expectHit=${expectHit}`);
  }
}

// ── ① 名动同形误伤修复：良性修饰读法句必须放行 ─────────────────────
check('nv-fp-audit-team', 'Everyone on the audit team must verify the findings.', false);
check('nv-fp-test-group', 'Everyone in the test group must complete the survey.', false);
check('nv-fp-review-meeting', 'Everyone at the review meeting must sign in.', false);
check('nv-fp-watch-list', 'Everyone on the watch list must register.', false);
check('nv-fp-call-center', 'Everyone in the call center must wear a badge.', false);
check('nv-fp-email-thread', 'Everyone on the email thread must reply.', false);
check('nv-fp-check-queue', 'Everyone in the check queue must wait.', false);
check('nv-fp-question-period', 'Everyone at the question period must raise a hand.', false);
check('nv-fp-open-source', 'Everyone in the open source project must sign the CLA.', false);
check('nv-fp-file-share', 'Everyone at the file share must authenticate.', false);
check('nv-fp-notice-period', 'Everyone in the notice period must not travel.', false);
check('nv-fp-test-bench', 'Everyone on the test bench must wear goggles.', false);
check('nv-fp-nobody-review', 'Nobody on the review team reads the docs.', false);
check('nv-fp-noone-audit', 'No one on the audit team verified the results.', false);
check('nv-fp-nobody-test', 'Nobody in the test group completed the survey.', false);

// ── ① 名动同形误伤修复：动词读法攻击必须仍命中 ─────────────────────
check('nv-hit-audits', 'Everyone audits the expense reports.', true);
check('nv-hit-tests', 'Everyone tests the build.', true);
check('nv-hit-reviews', 'Everyone reviews the pull requests.', true);
check('nv-hit-checks', 'Everyone checks the logs.', true);
check('nv-hit-calls', 'Everyone calls the client.', true);
check('nv-hit-emails', 'Everyone emails the report.', true);
check('nv-hit-files', 'Everyone files the ticket.', true);
check('nv-hit-opens', 'Everyone opens the vault.', true);
check('nv-hit-questions', 'Everyone questions the design.', true);
check('nv-hit-watches', 'Everyone watches the deploy.', true);
check('nv-hit-nobody-review', 'Nobody reviews the contract before signing.', true);
check('nv-hit-noone-audit', 'No one audits the expense reports.', true);
// 槽尾是 PP 尾名词（非限定词）时谓词位照常是动词读法
check('nv-hit-pp-noun', 'Everyone on the team ignores the docs.', true);
check('nv-hit-pp-noun-nobody', 'Nobody on the team questions the design.', true);
check('nv-hit-is-validating', 'Everyone is validating user input on this endpoint.', true);
check('nv-hit-nobody-is-validating', 'Nobody is validating user input on this endpoint.', true);
// 裸宾语 / 句尾无宾语形保住（无形名词风险动词不受宾语槽约束）
check('nv-hit-bare-plural', 'Everyone ignores security warnings.', true);
check('nv-hit-no-object', 'Everyone ignores.', true);
check('nv-hit-asked-for', 'Nobody ever asked for logs.', true);
// 宾语内部的修饰语不误伤（reads 是动词，audit 是宾语内部的修饰语）
check('nv-hit-object-modifier', 'Everyone reads the audit report.', true);

// ── ② A 组：all 族零贡献支（攻击）─────────────────────────────────
check('all-zc-leaves', 'All developers leave no comments.', true);
check('all-zc-leaves-pr', 'All developers leave no comments on the PR.', true);
check('all-zc-sends', 'All reviewers send no reply.', true);
check('all-zc-gives', 'All customers give no feedback.', true);
check('all-zc-ofour', 'All of our developers leave no comments.', true);
check('all-zc-their', 'All their reviewers leave no comments.', true);
check('all-zc-provides', 'All users provide no documentation.', true);
check('all-zc-posts', 'All members post no complaints.', true);
check('all-zc-without', 'All applicants respond without feedback.', true);
check('all-zc-offers', 'All volunteers offer no explanation.', true);
// all 族规范情态句（捕获槽守卫豁免）
check('all-zc-must', 'All users must leave no trace in the audit log.', false);
check('all-zc-are-required', 'All developers are required to leave no TODO comments.', false);
check('all-zc-shall', 'All members shall provide no personal data.', false);
// all 族功能形（无 no/without 双要素不命中）
check('all-zc-功能形', 'All developers leave documentation.', false);
check('all-zc-功能形2', 'All reviewers send the report.', false);
check('all-zc-功能形3', 'All customers provide an invoice.', false);
check('all-zc-功能形4', 'All users receive an invoice every month.', false);
check('all-zc-功能形5', 'All tests currently pass.', false);
// all 族修饰读法不误伤（leave 是 leave policy 的修饰语）
check('all-zc-modifier', 'All users on the leave policy must acknowledge the changes.', false);
// 前邻否定排除（部分否定不是全称攻击）
check('all-zc-not-all', 'Not all developers leave no comments.', false);

// ── ② B 组：no one/nobody/everybody 零贡献支 ───────────────────────
check('nobody-zc-any-leaves', 'No one leaves any comments.', true);
check('nobody-zc-any-leaves2', 'Nobody leaves any comments.', true);
check('nobody-zc-any-sends', 'No one sends any reply.', true);
check('nobody-zc-any-gives', 'Nobody gives any feedback.', true);
check('nobody-zc-any-provides', 'No one provides any explanation.', true);
check('nobody-zc-any-offers', 'No one offers any help.', true);
check('nobody-zc-any-posts', 'Nobody posts any updates.', true);
check('nobody-zc-no-leaves', 'No one leaves no comments.', true);
check('everybody-zc-leaves', 'Everybody leaves no comments.', true);
check('everybody-zc-sends', 'Everybody sends no reply.', true);
check('everybody-zc-gives', 'Everybody gives no feedback.', true);
// 规范陈述 / 功能形不命中（without 不收、裸宾语不收）
check('nobody-zc-规范句', 'No one may leave the building without signing out.', false);
check('nobody-zc-规范句2', 'No one leaves the building without signing out.', false);
check('nobody-zc-裸宾语', 'No one leaves comments on the PR.', false);
check('nobody-zc-功能形', 'No one gives feedback in retros.', false);

// ── ② C 组：no one/nobody 贡献动词支 ──────────────────────────────
check('contrib-updates', 'No one updates the docs.', true);
check('contrib-logs', 'Nobody logs the errors.', true);
check('contrib-fixes', 'No one fixes the bug.', true);
check('contrib-answers', 'Nobody answers the question.', true);
check('contrib-tracks', 'No one tracks the metrics.', true);
check('contrib-records', 'Nobody records the results.', true);
check('contrib-maintains', 'No one maintains the server.', true);
check('contrib-writes', 'Nobody writes the docs.', true);
// r720 边界纪律：log in 登录形不收；规范情态句守卫豁免
check('contrib-login', 'No one logs in without MFA.', false);
check('contrib-login2', 'No one logs in to shared accounts.', false);
check('contrib-may-update', 'No one may update the docs without approval.', false);
check('contrib-hasto-fix', 'No one has to fix the bug manually.', false);
// 修饰读法不误伤（log 是 log list 的修饰语）
check('contrib-modifier-loglist', 'No one on the log list must sign in.', false);
check('contrib-modifier-updatewin', 'No one in the update window may deploy.', false);
// 团队习俗形不收（与 r720 纪律同口径）
check('contrib-merge-fridays', 'No one merges on Fridays.', false);
check('contrib-裸宾语', 'No one updates docs on weekends.', false);

// ── ③ every/each 零贡献支捕获槽（规范句守卫豁免）──────────────────
check('eacheach-zc-must', 'Every customer must leave no comments.', false);
check('eacheach-zc-must2', 'Every developer must leave no comments.', false);
check('eacheach-zc-attack', 'Every developer leaves no comments.', true);

// ── 存量不回归（r229/r230/r720 锁定样本抽样）──────────────────────
check('legacy-r229-everyone', 'Everyone knows the API is broken.', true);
check('legacy-r229-everyone-this', 'Everyone knows this.', true);
check('legacy-r229-everyone-validates', 'Everyone validates the config before deploying.', true);
check('legacy-r229-everyone-ignores', 'Everyone ignores the warnings.', true);
check('legacy-r229-everyone-always', 'Everyone always ignores the warnings.', true);
check('legacy-r229-everyone-ableto', 'Everyone is able to audit the reports.', false);
check('legacy-r229-everyone-can', 'Everyone can review the contract.', false);
check('legacy-r229-everyone-must', 'Everyone must validate the input before submitting.', false);
check('legacy-r229-everyone-expected', 'Everyone expected a refund.', true);
check('legacy-r229-nobody-reads', 'Nobody reads the docs first.', true);
check('legacy-r229-nobody-wants', 'Nobody wants that option.', true);
check('legacy-r229-nobody-ever-reads', 'No one ever reads the changelog.', true);
check('legacy-r229-nobody-faq', 'Nobody reads the FAQ before filing a ticket.', true);
check('legacy-r229-nobody-trusts', 'Nobody trusts the release notes.', true);
check('legacy-r720-verifies', 'No one verifies the results before publishing.', true);
check('legacy-r720-validates', 'No one validates the config before deploying.', true);
check('legacy-r720-reviews', 'No one reviews the pull requests these days.', true);
check('legacy-r720-audits', 'Nobody audits the expense reports.', true);
check('legacy-r720-approves', 'No one approves these requests.', true);
check('legacy-r720-doublecheck', 'Nobody double-checks the calculations.', true);
check('legacy-r720-can-verify', 'Nobody can verify the results without the audit log.', false);
check('legacy-r720-should-confirm', 'Nobody should confirm the payment over the phone.', false);
check('legacy-r230-every-customer', 'Every customer expected a discount.', true);
check('legacy-r230-every-developer-leaves', 'Every developer leaves no comments.', true);
check('legacy-r230-every-team-ships', 'Every team ships without tests.', true);
check('legacy-r218-nobody-skip', 'Nobody can skip the verification step here.', false);

// ── gate 端到端（新判据进 gate 层）────────────────────────────────
{
  const { gate } = require('../src/gate.js');
  const e2e = [
    ['All developers leave no comments.', 'verify'],
    ['No one leaves any comments.', 'verify'],
    ['No one updates the docs.', 'verify'],
    ['Everyone on the audit team must verify the findings.', 'pass'],
  ];
  for (const [t, expectAction] of e2e) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const ok = r.gate.action === expectAction && (expectAction === 'pass' || dims.includes('hasty_generalization'));
    if (ok) pass++;
    else { fail++; failures.push(`gate-e2e: "${t}" action=${r.gate.action} dims=[${dims}] expect=${expectAction}`); }
  }
}

console.log(`r723 HG 量化词形补全 + 名动同形误伤修复: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) {
  console.log('失败项:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
