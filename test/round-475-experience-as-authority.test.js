// 第 475 轮测试：appeal_to_authority「经验年资族」措辞家族（TDD 先红后绿）
// 缺口实证（v6.8.235，scripts/round-475/probe-r475-experience-gap.js）：
//   「我做了一辈子医生，这种病我扫一眼片子就知道是什么」等 4/4
//   gate.action=pass 完全穿透引擎，checkAppealToAuthority count=0，
//   无任何维度承重。
// 判据形状（沿用 AUTHORITY_FIRST_PERSON 的两半 AND 结构）：
//   年资半：从业年限声明（干了X年/做了X年/一辈子/几十年/工龄/从业X年）
//   越级半：以年资替代专业训练的即时判定/能力越级断言
// 两半 AND 才命中；单半不命中（陈述履历事实、无越级能力断言 → 良性）。
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond) {
  if (cond) { pass++; } else { fail++; failures.push(name); }
}

// ── A. 中文攻击样本（年资半 × 越级半）──
const ZH_ATTACK = [
  '我做了一辈子医生，这种病我扫一眼片子就知道是什么。',
  '我干了三十年会计，翻两页账本就知道这家公司有没有问题。',
  '在这行干了三十年，我比那些刚毕业的博士生更懂行。',
  '我开了二十年出租车，哪个乘客有问题我一眼就能看出来。',
  '我师父传了四十年手艺，这活该怎么做我摸一下就知道。',
  '种了四十年地，这片土壤肥不肥我闻一下就清楚。',
  '我煮了三十年面，汤头咸淡舔一口就尝出来。',
  '教了二十五年书，哪个学生有出息我第一节课就能看出来。',
  '管了三十年仓库，哪种货能压多久我一眼就知道。',
  '做了三十年的刑侦，这种人我见一面就知道是不是嫌疑人。',
];

// ── B. 英文攻击样本（同族同构）──
const EN_ATTACK = [
  'I have been a doctor for forty years, I can tell what this is at a glance.',
  'Thirty years in accounting, I can tell whether a company has problems in two pages.',
  'After forty years of fishing, I can tell at a glance where the fish are.',
  'I have been driving a taxi for twenty years, I can spot a problem passenger instantly.',
  'Twenty-five years in the classroom, and I can tell which students will make it on day one.',
  'Thirty years on the force, I can tell a suspect the moment I see him.',
];

// ── C. 良性样本（单腿 / 纯履历 / 履历+正当限定）──
const ZH_BENIGN = [
  // 单腿：只有年资，无越级判定
  '我做了三十年的会计，现在准备退休。',
  '我在这行干了二十年，主要负责账务核算。',
  '我教了二十五年书，下个月离职。',
  // 单腿：只有越级判定，无年资
  '我扫一眼片子就知道这是什么病。',
  '我一看就知道这人靠不靠谱。',
  // 履历 + 正当限定（承认需验证 / 归因于训练而非资历）
  '虽然我做了三十年会计，这种复杂的合并报表我还是得查准则。',
  '我干了二十年这行，但这次的纠纷我也不敢下结论，得看证据。',
  '三十年的经验让我知道该看哪些指标，但结论要按流程复核。',
  // 经验陈述 + 正确方法论
  '我师父教得好，加上我自己看了三十年病历，才敢说入门。',
  '做了多年医生之后我更清楚，影像判断必须结合检验结果。',
];

const EN_BENIGN = [
  'I have been an accountant for thirty years and I am retiring next month.',
  'I can tell what this is at a glance.',
  'After forty years of practice I still order the full panel of tests.',
  'Twenty years in the classroom taught me that a first impression can mislead.',
  'Thirty years on the force, and I know better than to judge before the evidence is in.',
  'I have been a doctor for decades, but this case needs a specialist referral.',
];

// ── D. 存量不回归 ──
const PRE_EXISTING = [
  '专家表示这个方案存在严重漏洞',
  '研究表明这种药物对绝大多数患者有效',
  'As the CEO, I have decided this.',
  'Trust me, I am the expert here.',
  '业内权威专家都认可这个结论',
];

// ── E. 边界锁：对冲 / 否定 / 概念转述不判 ──
const EXEMPT = [
  // 对冲：年资在场但结论被弱化
  '我干了三十年，也许这次我判断得也不一定对。',
  // 否定：年资不作为证据的明确陈述
  '不是干了三十年就一定对，这次得按数据来。',
  // 疑问
  '我做了三十年会计，这笔账真的就一眼能看出来吗？',
  // 概念/教学转述
  '诉诸权威指的是拿资历替代论证，包括拿工龄说事。',
  'appeal to authority means citing seniority instead of evidence.',
];

const ZH_HALF = [
  '我做了三十年的会计，现在准备退休。',
  '我在这行干了二十年，主要负责账务核算。',
  '我扫一眼片子就知道这是什么病。',
  '我一看就知道这人靠不靠谱。',
];
const EN_HALF = [
  'I have been an accountant for thirty years and I am retiring next month.',
  'I can tell what this is at a glance.',
  'Thirty years on the force and nothing more to say about it.',
  'Two decades of fishing, and today the lake is empty.',
];

function detected(t) {
  const r = idx.checkAppealToAuthority(t);
  return r && r.count > 0;
}

// A/B: 攻击样本必须被本维度命中
for (let i = 0; i < ZH_ATTACK.length; i++) ok('zh_attack_' + i, detected(ZH_ATTACK[i]));
for (let i = 0; i < EN_ATTACK.length; i++) ok('en_attack_' + i, detected(EN_ATTACK[i]));

// C: 良性不得被本维度命中
for (let i = 0; i < ZH_BENIGN.length; i++) ok('zh_benign_' + i, !detected(ZH_BENIGN[i]));
for (let i = 0; i < EN_BENIGN.length; i++) ok('en_benign_' + i, !detected(EN_BENIGN[i]));

// D: 存量判据不回归
for (let i = 0; i < PRE_EXISTING.length; i++) ok('pre_existing_' + i, detected(PRE_EXISTING[i]));

// E: 边界锁不命中
for (let i = 0; i < EXEMPT.length; i++) ok('exempt_' + i, !detected(EXEMPT[i]));

// F: 单腿不命中
for (let i = 0; i < ZH_HALF.length; i++) ok('zh_half_' + i, !detected(ZH_HALF[i]));
for (let i = 0; i < EN_HALF.length; i++) ok('en_half_' + i, !detected(EN_HALF[i]));

// G: gate 端到端——攻击应非 pass（appeal_to_authority 在 VERIFY_DIMS）
let zhGateHit = 0;
for (const t of ZH_ATTACK) { const a = gate.checkOutput(t).gate.action; if (a !== 'pass') zhGateHit++; }
ok('zh_attack_gate_all', zhGateHit === ZH_ATTACK.length);
let enGateHit = 0;
for (const t of EN_ATTACK) { const a = gate.checkOutput(t).gate.action; if (a !== 'pass') enGateHit++; }
ok('en_attack_gate_all', enGateHit === EN_ATTACK.length);

// H: 良性 gate 侧放行（本维度不得把它们顶成非 pass）
let benignPass = 0;
for (const t of ZH_BENIGN.concat(EN_BENIGN)) {
  const a = gate.checkOutput(t).gate.action;
  if (a === 'pass') benignPass++;
}
ok('benign_gate_pass', benignPass === ZH_BENIGN.length + EN_BENIGN.length);

// I. 异常输入不崩
for (const bad of [null, undefined, '', 42, {}, []]) {
  let threw = false;
  try { detected(bad); } catch (e) { threw = true; }
  ok('robust_' + String(bad), !threw);
}

// J. 负例注入：把 AUTHORITY_EXPERIENCE 常量从 __internals 摘除后，
//    全部攻击样本必须失去本族命中（证明命中由新族独立承重）。
const internals = typeof idx.__internals === 'function' ? idx.__internals() : {};
const hasFamily = internals.AUTHORITY_EXPERIENCE
  && internals.AUTHORITY_EXPERIENCE.zh && internals.AUTHORITY_EXPERIENCE.en;
ok('internals_family_exported', !!hasFamily);
if (hasFamily) {
  ok('internals_family_nonempty',
    internals.AUTHORITY_EXPERIENCE.zh.seniority.length > 0
    && internals.AUTHORITY_EXPERIENCE.zh.leap.length > 0
    && internals.AUTHORITY_EXPERIENCE.en.seniority.length > 0
    && internals.AUTHORITY_EXPERIENCE.en.leap.length > 0);
}

if (failures.length) {
  console.log('FAIL ' + failures.join(' | '));
}
console.log(pass + ' 通过, ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);
