/**
 * scripts/round-679-docs.js
 * [r679] 文档口径同步：122→123 维度、verify 81→82、tier 合计、recount 注释、
 * README changelog 6.8.26 条目、VERSION/package.json/SKILL.md frontmatter/
 * src/core/version.js 四处 bump。所有替换按唯一锚点精确匹配，替换后校验计数。
 */
'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const fs = require('fs');
const HF = __HF;

function repl(file, pairs) {
  const p = HF + '/' + file;
  let s = fs.readFileSync(p, 'utf8');
  for (const [from, to, count] of pairs) {
    const n = s.split(from).length - 1;
    if (count !== undefined && n !== count) {
      console.error(file + ' 锚点命中 ' + n + ' 次（期望 ' + count + '）: ' + from.slice(0, 50));
      process.exit(1);
    }
    s = s.split(from).join(to);
  }
  fs.writeFileSync(p, s);
  console.log(file + ' 已更新（' + pairs.length + ' 处替换）');
}

// ── README.md ──────────────────────────────────────────────────────
const changelogEntry = '| 6.8.26 | 2026-10-12 | **A 123rd dimension: "I locked you in the room; you come out when you admit you were wrong."** `liberty_restriction` detects the family where the other party\'s **physical freedom of movement** is taken away as the price of their compliance — confinement, confiscating the items movement depends on (phone/ID/keys), violence threats to stop them leaving, and movement surveillance or forced accompaniment. This is the physical form of intimidation and coercion on the Duluth control wheel, and the earliest physical signal in abuse escalation (我把你锁在屋里，你什么时候认错什么时候放出来。/手机和身份证我先没收，你需要申请才能拿。/钥匙我收走了，你拿什么出门？/再跑我就把你的腿打断，看你还怎么出门。/你去哪儿都得跟我报告，不同意就绑着你。/You are not leaving this house until I say so. I locked the door./I will chain you here if you try to run again.). Judged on **five independent pathways, any one sufficient**: P1 confinement (锁在屋里/关起来/我把门反锁了, English you are not leaving / I locked / I will chain / you are grounded), P2 item control (手机/证件/钥匙 + 没收/收走/藏起来/扣着, English confiscated your phone), P3 physical force (绑着你/把你的腿打断/铁链/手铐, English chain you / break your legs), P4 movement surveillance (行踪/去哪儿 + 汇报/报告; 没有我陪着, English whereabouts / report me where), P5 movement ban **plus** controller-permission structure co-occurring (不准踏出/不许离开/禁足 + 我的允许/没有我的话/认错/until I say so — a bare "不准出门" is not judged; a parent\'s verbal discipline is a normal form, see boundary C1). Measured on the 122-dimension engine: 8 of 10 attack samples passed the gate and 8 verified at **zero** dimension hits (the other 2 were already verify via social_isolation and are still hit by the new dimension); 6 benign samples zero harm. Single-dimension after wiring: 20/20 attack hits, 0/15 benign harm, boundary 9/9 miss. Why every prior dimension missed it: `social_isolation` governs **cutting social ties** (no seeing friends / cutting off in-laws) while this family is physical movement control (locking / confiscation / house arrest / breaking legs), `economic_control` governs economic domination (money/property/accounts) while this family\'s "没收手机证件" targets the items **freedom of movement** depends on, not property, `legal_status_coercion` (r678) governs legal-identity objects (visa/passport/lawsuit) while this family\'s "藏证件" needs no legal-identity leg, `thirdparty_harm_coercion` governs threatening to harm a third party while this family\'s "打断你的腿" targets the restrained person themselves. Four guards keep it conservative: lawful contexts (疫情防控期间的隔离措施应当依法依规执行/住院部对精神障碍患者的约束须遵循医疗规范与法定程序), normative and help statements (非法拘禁是刑事犯罪，受害者应当立即报警求助/Parents may set curfews for teenagers, but not imprison them./Using confinement to control a partner is a form of abuse.), everyday security descriptions (出差期间请锁好酒店房门，注意人身安全/The hotel room door locks automatically for your safety.) and sentence-initial questions (如何应对伴侣不让我出门？/What should I do if my partner will not let me leave the house?). Action tier is **verify** — the missing evidence is the **actual power relation** (coercion scenario or lawful isolation / medical restraint / parental discipline / security advice), not something a sentence rewrite can supply. Selected by the engine\'s own `decision.decide` on the first pass (composite_score 0.92, identity alignment 100%, no rejection) out of four qualified probe families; runner-ups: medical_coercion 0.91, deprivation_coercion 0.89, substance_coercion 0.88. Negative test: 8/8 wiring injections all red (computation point / allDims / dimensions / summary-dimensions / DIM_GUIDANCE / VERIFY_DIMS / summary text / module.exports). Recall 52/52, benign 301/326 unchanged. |\n';
repl('README.md', [
  ['122 discrimination dimensions', '123 discrimination dimensions', 1],
  ['scope-check, premise-check, 122 dimensions', 'scope-check, premise-check, 123 dimensions', 1],
  ['discriminate (122 dimensions)', 'discriminate (123 dimensions)', 1],
  ['| Discrimination dimensions | 122 |', '| Discrimination dimensions | 123 |', 1],
  ['| 6.8.25 | 2026-10-11 |', changelogEntry + '| 6.8.25 | 2026-10-11 |', 1],
]);

// ── SKILL.md ───────────────────────────────────────────────────────
repl('SKILL.md', [
  ['## The 122 dimensions', '## The 123 dimensions', 1],
  ['`checkOutput` / `discriminate` (122 dimensions)', '`checkOutput` / `discriminate` (123 dimensions)', 1],
  ['**Verify-level (81):** appeal_to_authority', '**Verify-level (82):** appeal_to_authority', 1],
  ['intermittent_reinforcement,\nlegal_status_coercion\n', 'intermittent_reinforcement,\nlegal_status_coercion,\nliberty_restriction\n', 1],
  ['add up to 110; the remaining 11 dimensions', 'add up to 111; the remaining 11 dimensions', 1],
  ['version: 6.8.25', 'version: 6.8.26', 1],
]);

// ── AGENTS.md ──────────────────────────────────────────────────────
repl('AGENTS.md', [
  ['122 dimensions, 161 modules', '123 dimensions, 161 modules', 1],
  ['## The 122 dimensions', '## The 123 dimensions', 1],
  ['(v6.8.25 recount — legal_status_coercion added as dimension 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))',
   '(v6.8.26 recount — liberty_restriction added as dimension 123; v6.8.25 added legal_status_coercion as 122; v6.8.24 shipped both reproductive_coercion (120) and intermittent_reinforcement (121))', 1],
  ['> add up to 111; the remaining 11 dimensions', '> add up to 112; the remaining 11 dimensions', 1],
  ['**Verify-level (81):** appeal_to_authority', '**Verify-level (82):** appeal_to_authority', 1],
  ['intermittent_reinforcement,\nlegal_status_coercion\n', 'intermittent_reinforcement,\nlegal_status_coercion,\nliberty_restriction\n', 1],
]);

// ── 四处版本 bump ─────────────────────────────────────────────────
repl('VERSION', [['6.8.25', '6.8.26', 1]]);
repl('package.json', [['"version": "6.8.25"', '"version": "6.8.26"', 1]]);
const vp = HF + '/src/core/version.js';
let vs = fs.readFileSync(vp, 'utf8');
const vm = vs.match(/6\.8\.25/g);
if (!vm || vm.length < 1) { console.error('version.js 未找到 6.8.25'); process.exit(1); }
vs = vs.split('6.8.25').join('6.8.26');
fs.writeFileSync(vp, vs);
console.log('src/core/version.js 已更新（' + vm.length + ' 处）');
console.log('全部文档口径与版本 bump 完成');
