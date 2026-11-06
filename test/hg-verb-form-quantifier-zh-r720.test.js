'use strict';
/**
 * test/hg-verb-form-quantifier-zh-r720.test.js — 第 720 轮（v6.8.149）
 *
 * 本轮改动（src/index.js HASTY_GENERALIZATION_PATTERNS）：
 *   ① en 判据③（nobody/no one + 行为动词）谓词槽形态系统化：
 *      - 修复 `verified?` 只覆盖 verify/verified 的形态漏洞（补 verifies/verifying）
 *      - 追加验证审查动词族八族：verif / validat / confirm / review / audit /
 *        test / double-check / approve / watch，每族四形态（原形/-s/-ed/-ing）
 *   ② zh 身边族放宽间隔：`身边(?:全是|…)` → `身边[^。，！？；]{0,6}(?:全是|…)`
 *      （覆盖「身边的人全是」「身边同学都是」）
 *   ③ zh 新增「X 全是 + 负面定性」全称归因判据（主语段 1-12 字 + 全是 +
 *      负面定性词表；主语段禁含 不|没 以排除「解释不全是借口」式反驳句）
 *
 * 缺口来源：scripts/diag-r720.js 轮初复测实测——攻击形 verifies / validates /
 * confirms / reviews / double-checks / validated / validating 七形全 MISS；
 * 「身边的人全是关系户」「他的解释全是借口」MISS；存量 reads / checks /
 * 所有人都 三条仍 HIT；良性 can verify / must validate / should confirm /
 * 二等品 / 徒弟骨干 五条仍 pass。
 *
 * 门禁口径（与 229/230/279/332 轮一致）：
 *   · 攻击样本 checkHastyGeneralization().count >= 1
 *   · 良性样本 count === 0（含规范情态句——守卫豁免路径）
 *   · 存量样本不回归（本轮只做加法 + 形态修复）
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

// ── ① en 攻击：verif 族四形态 ───────────────────────────────────────
check('en-verif-s', 'No one verifies the results before publishing.', true);
check('en-verif-base', 'Nobody verifies the calculations.', true);
check('en-verif-ing', 'Nobody is verifying the output anymore.', true);
check('en-verif-ed', 'No one verified the sample last quarter.', true);

// ── ① en 攻击：validat / confirm / review 三族 ──────────────────────
check('en-validat-s', 'No one validates the config before deploying.', true);
check('en-validat-ing', 'Nobody is validating user input on this endpoint.', true);
check('en-validat-ed', 'Nobody validated the migration script.', true);
check('en-confirm-s', 'Nobody confirms the invoice totals anymore.', true);
check('en-confirm-ing', 'No one is confirming the booking details.', true);
check('en-review-s', 'No one reviews the pull requests these days.', true);
check('en-review-ed', 'Nobody reviewed the contract before signing.', true);

// ── ① en 攻击：audit / test / double-check / approve / watch 五族 ───
check('en-audit-s', 'Nobody audits the expense reports.', true);
check('en-test-s', 'No one tests the edge cases.', true);
check('en-doublecheck-s', 'Nobody double-checks the calculations.', true);
check('en-doublecheck-nospace', 'Nobody doublechecks the totals.', true);
check('en-approve-s', 'No one approves these requests.', true);
check('en-watch-s', 'Nobody watches the monitoring dashboard.', true);

// ── ① en 规范句豁免（规范情态槽守卫路径，count 必须为 0）─────────────
check('en-modal-can', 'Nobody can verify the results without the audit log.', false);
check('en-modal-must', 'Everyone must validate the input before submitting.', false);
check('en-modal-should', 'Nobody should confirm the payment over the phone.', false);
check('en-modal-ableto', 'Nobody is able to validate the payload here.', false);
check('en-modal-could-review', 'Nobody could review the contract before Friday.', false);
check('en-modal-ought-approve', 'Nobody ought to approve this without sign-off.', false);
check('en-modal-hasto-audit', 'No one has to audit every line item.', false);

// ── ① en 存量不回归（229/230 轮既有动词）───────────────────────────
check('en-legacy-reads', 'Nobody ever reads the docs.', true);
check('en-legacy-checks', 'No one checks the logs.', true);
check('en-legacy-knows', 'Nobody knows the real reason.', true);
check('en-legacy-verify-base', 'No one can verify the results.', false); // 规范句（can 填充槽）

// ── ①' everyone 族捕获槽 + 守卫接入 + 八族动词（v6.8.149 同族第二修点）──
// 攻击形（无填充槽，直接命中）
check('en-everyone-validates', 'Everyone validates the config before deploying.', true);
check('en-everyone-verifies', 'Everyone verifies the results.', true);
check('en-everyone-confirms', 'Everyone confirms the invoice totals.', true);
check('en-everyone-reviews', 'Everyone reviews the pull requests.', true);
check('en-everyone-audits', 'Everyone audits the expense reports.', true);
// 规范句（填充槽含情态动词，守卫豁免）
check('en-everyone-must-validate', 'Everyone must validate the input before submitting.', false);
check('en-everyone-should-confirm', 'Everyone should confirm the payment details.', false);
check('en-everyone-can-review', 'Everyone can review the contract.', false);
check('en-everyone-ableto-audit', 'Everyone is able to audit the reports.', false);
// everyone 族存量不回归（229 轮既有动词 + 副词填充仍命中）
check('en-everyone-legacy-ignores', 'Everyone ignores the warnings.', true);
check('en-everyone-legacy-checks', 'Everyone checks the logs.', true);
check('en-everyone-always-ignores', 'Everyone always ignores the warnings.', true); // always 非情态词，不豁免

// ── ② zh 身边族放宽间隔 ────────────────────────────────────────────
check('zh-shenbian-ren', '身边的人全是关系户，根本没有公平竞争。', true);
check('zh-shenbian-tongxue', '身边同学都是内推进来的。', true);
check('zh-shenbian-tongshi', '身边同事全都走关系。', true);
check('zh-shenbian-tight', '身边全是坏人。', true); // 存量紧贴形仍命中

// ── ③ zh「X 全是 + 负面定性」攻击 ──────────────────────────────────
check('zh-all-jiekou', '他的解释全是借口，没有一句是真的。', true);
check('zh-all-pianzi', '这帮人全是骗子。', true);
check('zh-all-caotaibangzi', '这个团队全是草台班子。', true);
check('zh-all-taolu', '他的方案全是套路。', true);
check('zh-all-feihua', '会上讲的全是空话。', true);
check('zh-all-jiade', '这些数据全是假的。', true);

// ── ③ zh 良性边界（负面定性表外一律放行）──────────────────────────
check('zh-benign-erdengpin', '这批货全是二等品，按合同可以拒收。', false);
check('zh-benign-gugan', '他带的徒弟全是骨干，个个能独当一面。', false);
check('zh-benign-ren', '会场里全是人。', false);
check('zh-benign-fuzhi', '这段代码全是复制粘贴的。', false);
check('zh-benign-yuzhicai', '这家餐厅全是预制菜。', false);

// ── ③ zh 否定反驳排除（对全称的部分否定不是攻击）─────────────────
check('zh-negate-buquanshi', '他的解释不全是借口，也有可取之处。', false);
check('zh-negate-buquanshi2', '问题不全是代码缺陷。', false);

// ── zh 存量不回归 ──────────────────────────────────────────────────
check('zh-legacy-renren', '人人都说这家公司不行。', true);
check('zh-legacy-suoyouren', '所有人都在抱怨这个流程。', true);
check('zh-legacy-conglai', '我从来没遇到过靠谱的供应商。', true);

// ── gate 端到端（新判据进 gate 层）────────────────────────────────
{
  const { gate } = require('../src/gate.js');
  const e2e = [
    ['No one verifies the results before publishing.', 'verify'],
    ['他的解释全是借口，没有一句是真的。', 'verify'],
  ];
  for (const [t, expectAction] of e2e) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const ok = r.gate.action === expectAction && dims.includes('hasty_generalization');
    if (ok) pass++;
    else { fail++; failures.push(`gate-e2e: "${t}" action=${r.gate.action} dims=[${dims}] expect=${expectAction}`); }
  }
}

console.log(`r720 HG 动词形态/量化词守卫: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) {
  console.log('失败项:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
