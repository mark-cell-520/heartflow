'use strict';
/**
 * test/hg-capture-guard-zero-contrib-r721.test.js — 第 721 轮（v6.8.150）
 *
 * 本轮改动（src/index.js HASTY_GENERALIZATION_PATTERNS + src/quantifier-guards.js）：
 *   ① every/each 族主判据加捕获槽 `((?:\w+\s+){0,3})`（名词槽后、动词槽前），
 *      isNormativeQuantifierHit(m) 守卫接入——规范宣告句 "Every customer
 *      must ignore the docs"（must 在名词与动词之间）本应豁免，r229 轮判据
 *      起无捕获组，守卫读 m[1] 不生效，与 r718 判据③修复前同型误伤。
 *   ② every/each 族 + all 族宾语槽补 these|those（"All users ignore these
 *      warnings" 类，原槽只收 this/that）。
 *   ③ 群体表补 accountants?/vendors?/suppliers?/contractors?/consultants?/
 *      auditors? 六词（every/each 主判据、every/each writes-no 支、all 族
 *      主判据、all 族零宾语支四处同步）。
 *   ④ every/each 族 writes-no 支谓词表扩展：writes? 单形 → writes?/leaves?/
 *      sends?/gives?/provides?/posts?/replies/responds?/offers? 九形
 *      （"Every developer leaves no comments" 类零贡献归罪）。
 *   ⑤ everyone 族新增 writes-no 同型窄支（"Everyone leaves no comments."）。
 *   ⑥ 谓词表 expected 加负向断言 expected(?!\s+to\b)（两族）+
 *      守卫 QUANT_MODAL_FILLER_EN be+义务分词表扩充（expected/required/
 *      permitted/encouraged/asked/told/instructed/advised/obligated/
 *      obliged/mandated/compelled/forced/meant/destined）——修复 HEAD
 *      （v6.8.149）存量误伤 "Everyone is expected to comply." /
 *      "Nobody is expected to skip the step."（r720 everyone 族捕获槽
 *      允许 "is " 填充 + expected 谓词落入谓词表，m[1] 只截到 "is "，
 *      守卫测不到 be+pp 结构）。
 *
 * 缺口来源：scripts/diag-r721.js 轮初复测实测 + git stash HEAD 对照。
 *
 * 【刻意不收】验证动词八族（verif/validat/confirm/review/audit/test/
 * double-check/approve/watch）本轮曾同步至 every/each/all 三族，实测撞
 * r230/r280 功能句池（"Every manager approves the report" / "All users
 * validates the notice" 共 337 条良性流程陈述必须零命中）后撤回——界线
 * 在「泛人称收（everyone/nobody 族，r720/r718 已落盘）vs 具体群体不收
 * （every/each/all 族，r229-r282 五轮测试锁定）」。本测试组 8 锁死该
 * 界线，防下一轮回滚式「补全」。
 *
 * 门禁口径（与 229/230/279/332/r720 轮一致）：
 *   · 攻击样本 checkHastyGeneralization().count >= 1
 *   · 良性样本 count === 0（含规范情态句——守卫豁免路径）
 *   · 存量样本不回归（本轮只做加法 + 守卫修复）
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

// ── 组 1：every/each 族捕获槽（副词填充攻击形 + 规范句边界）────────
// 捕获槽真价值：纯副词填充攻击形（always/usually/ever）——无捕获槽时
// "Every customer always ignores…" 的 always 落在谓词槽不匹配整句 MISS，
// 有捕获槽 m[1]="always "（非情态词）不赦 → 命中。
check('g1-always', 'Every customer always ignores the docs.', true);
check('g1-usually', 'Each reviewer usually ignores the noise.', true);
check('g1-ever', 'Every developer ever ignores the warnings.', true);
check('g1-really', 'Every manager really ignores the feedback.', true);
check('g1-inthisteam', 'Every analyst in this team ignores the reports.', true);
// 规范句边界：情态动词（must/can/should/has to/is able to）本就不在谓词表，
// 无捕获槽时整句不匹配（HEAD 行为）；有捕获槽时命中位点经守卫豁免——
// 两种路径殊途同归 count=0，负例脚本注入①只锁副词填充形（见脚本注释）。
check('g1-must', 'Every customer must ignore the docs.', false);
check('g1-can', 'Every customer can ignore the warning.', false);
check('g1-should', 'Each reviewer should ignore the noise.', false);
check('g1-hasto', 'Every employee has to ignore the spam.', false);
check('g1-isableto', 'Every operator is able to ignore the alert.', false);
check('g1-all-must', 'All users must ignore the announcement.', false);
check('g1-everyone-must', 'Everyone must ignore the noise.', false);
// 无填充攻击形照常命中
check('g1-无填充攻击', 'Every customer ignores the docs.', true);
check('g1-each-无填充', 'Each reviewer ignores the feedback.', true);

// ── 组 2：these/those 宾语槽 ────────────────────────────────
check('g2-every-these', 'Every customer ignores these warnings.', true);
check('g2-every-those', 'Every manager ignores those complaints.', true);
check('g2-each-these', 'Each reviewer ignores these issues.', true);
check('g2-all-these', 'All users ignore these warnings.', true);
check('g2-all-those', 'All customers ignore those notices.', true);
check('g2-ofour-these', 'All of our users ignore these warnings.', true);
// this/that 存量形态不回归
check('g2-存量this', 'Every customer ignores this.', true);
check('g2-存量that', 'All users ignore that.', true);

// ── 组 3：新群体词六族 × 三句式 ──────────────────────────────
check('g3-every-accountant', 'Every accountant ignores the notice.', true);
check('g3-every-vendor', 'Every vendor ignores the contract.', true);
check('g3-every-supplier', 'Every supplier ignores the deadline.', true);
check('g3-every-contractor', 'Every contractor ignores the spec.', true);
check('g3-every-consultant', 'Every consultant ignores the brief.', true);
check('g3-every-auditor', 'Every auditor ignores the finding.', true);
check('g3-each-accountant', 'Each accountant ignores the notice.', true);
check('g3-all-accountant', 'All accountants ignore the notice.', true);
check('g3-all-vendor', 'All vendors ignore the contract.', true);
check('g3-all-auditor', 'All auditors ignore the finding.', true);
check('g3-ofour-auditor', 'All of our auditors ignore the finding.', true);
check('g3-their-supplier', 'All their suppliers ignore the deadline.', true);
// 新群体词 + writes-no 支
check('g3-auditor-writesno', 'Every auditor writes no findings.', true);
check('g3-vendor-writesno', 'Every vendor leaves no documentation.', true);
// 群体词功能句不误伤（谓词不在枚举表）
check('g3-功能句', 'Every auditor receives an invoice.', false);
check('g3-功能句2', 'All vendors provide documentation.', false);

// ── 组 4：writes-no 支谓词扩展（every/each 族九形）────────────
check('g4-writes存量', 'Every developer writes no comments.', true);
check('g4-leaves', 'Every developer leaves no comments on the PR.', true);
check('g4-sends', 'Every reviewer sends no reply.', true);
check('g4-gives', 'Every customer gives no feedback.', true);
check('g4-provides', 'Every vendor provides no documentation.', true);
check('g4-posts', 'Every user posts no complaints.', true);
check('g4-replies-no', 'Every applicant sends no explanation.', true);
check('g4-responds', 'Every attendee responds without feedback.', true);
check('g4-offers', 'Every volunteer offers no explanation.', true);
check('g4-each-leaves', 'Each developer leaves no comments.', true);
// 边界样本：all 族无零贡献支（writes-no 支只在 every/each 与 everyone 两族），
// 此句断言 all 族不走本支——「all 族补零贡献支」写进 UPGRADE_LOG 下一轮方向
check('g4-all-族无本支', 'All developers leave no comments.', false);
// writes-no 支功能形不命中（无 no/without 双要素）
check('g4-功能形', 'Every developer leaves documentation.', false);
check('g4-功能形2', 'Every reviewer sends the report.', false);
check('g4-功能形3', 'Every customer provides an invoice.', false);
// without 变体
check('g4-without', 'Every developer leaves without documentation.', true);

// ── 组 5：everyone 族 writes-no 新支 ────────────────────────
check('g5-everyone-leaves', 'Everyone leaves no comments.', true);
check('g5-everyone-sends', 'Everyone sends no reply.', true);
check('g5-everyone-gives', 'Everyone gives no feedback.', true);
check('g5-everyone-provides', 'Everyone provides no evidence.', true);
check('g5-everyone-writes存量', 'Everyone writes no comments.', true);
// 规范句经捕获槽守卫豁免
check('g5-must-豁免', 'Everyone must leave no trace.', false);
// 功能形不命中
check('g5-功能形', 'Everyone leaves feedback.', false);
check('g5-功能形2', 'Everyone provides evidence.', false);

// ── 组 6：被动义务守卫修复（HEAD 存量误伤 + 正交路径）─────────
// 修复 1：被动式 + 非攻击动词——负向断言管，整句不命中
check('g6-everyone-expected', 'Everyone is expected to comply.', false);
check('g6-nobody-expected', 'Nobody is expected to skip the step.', false);
check('g6-every-expected', 'Every user is expected to comply.', false);
check('g6-noone-expected', 'No one is expected to sign in.', false);
check('g6-are-required', 'All users are required to validate the input.', false);
check('g6-was-told', 'Everyone was told to comply.', false);
check('g6-is-supposed', 'Everyone is supposed to comply.', false);
// 修复 2：被动式 + 攻击动词——守卫扩充管，命中位点豁免
check('g6-passive-plus-attack', 'Everyone is expected to ignore the docs.', false);
check('g6-passive-plus-attack2', 'Everyone is required to ignore the warnings.', false);
// 主动 expected 仍命中（攻击语义：人人都期待/预期）
check('g6-主动expected', 'Everyone expected a refund.', true);
check('g6-主动expects', 'Everyone expects a refund.', true);
check('g6-every-主动', 'Every customer expected a discount.', true);

// ── 组 7：存量不回归（r229/r230/r280/r281/r718/r720 锁死样本）──
check('g7-r229-everyone', 'Everyone ignores the warnings.', true);
check('g7-r229-every-customer', 'Every customer ignores this.', true);
check('g7-r229-all-users', 'All users ignore this.', true);
check('g7-r229-everyone-knows', 'Everyone knows this.', true);
check('g7-r230-blocks', 'Every reviewer blocks the change.', true);
check('g7-r230-restarts', 'Every operator restarts the box.', true);
check('g7-r230-complained', 'All customers complained.', true);
check('g7-r281-copula', 'All users are lazy.', true);
check('g7-r281-expected存量', 'Every user is expected to comply.', false);
check('g7-r281-guard', 'Every user is required to sign in.', false);
check('g7-r718-nobody-can', 'Nobody can skip the verification step here.', false);
check('g7-r718-not-everyone', 'Not everyone agrees with the proposal.', false);
check('g7-r720-noone-approves', 'No one approves these requests.', true);
check('g7-r720-everyone-validates', 'Everyone validates the config before deploying.', true);
check('g7-r720-everyone-must-validate', 'Everyone must validate the input before submitting.', false);
check('g7-r332-功能句', 'Every customer receives an invoice.', false);
check('g7-r332-功能句2', 'All headers are lowercased before the check.', false);
check('g7-zh存量', '每个人都忽视警告。', true);
check('g7-zh规范', '每个人都要签字。', false);

// ── 组 8：功能池界线（r230/r280 锁死——八族不得覆盖具体群体）───
check('g8-r230-approves', 'Every manager approves the report.', false);
check('g8-r280-validates', 'All users validate the notice.', false);
check('g8-r280-verifies', 'All users verifies the invoice.', false);
check('g8-r280-audits', 'All users audits the agreement.', false);
check('g8-r280-validates-every', 'Every customer validates the config.', false);
check('g8-r280-confirms-every', 'Every manager confirms the totals.', false);
check('g8-泛人称收界-everyone', 'Everyone validates the config before deploying.', true);
check('g8-泛人称收界-nobody', 'No one validates the config before deploying.', true);

if (fail > 0) {
  console.log('r721 HG 捕获槽守卫/零贡献支/被动义务守卫: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
  for (const f of failures) console.log('  FAIL ' + f);
  process.exit(1);
} else {
  console.log('r721 HG 捕获槽守卫/零贡献支/被动义务守卫: ' + pass + ' 通过, 0 失败, 共 ' + pass + ' 个');
}
