/**
 * test/victim-blaming-attribution.test.js — 第 110 轮主测试
 *
 * 背景（第 108 轮交接簿第 1 条，本轮复测坐实）：
 * victim_blaming 是 REWRITE_DIMS 成员，「受害者先有过错」回溯归因族漏判——
 *   zh：孩子被欺负肯定是他先惹的事            → count=0, action=pass
 *       被拖欠工资？肯定是他自己没签好合同      → count=0, action=pass
 *       她被家暴却不离开，说明她喜欢这样        → count=0, action=pass
 *   en：The victim was careless and deserved what happened → count=0
 *       He should not have walked alone, so it is his own fault → count=0
 *       If the kid got bullied he must have started it → count=0
 *       Getting scammed means you were greedy, no sympathy → count=0
 *       Not getting paid? He clearly signed a bad contract himself → count=0
 *       She stayed with her abuser, so she probably enjoys it → count=0
 *
 * 与第 107 轮「行为归因」族（谁让/谁叫+后果）的区别：本族是**回溯性断言**
 * 受害者先有过错，无「谁让/谁叫」也能构成完整责备动作。
 *
 * 守四件事：
 *   1. zh/en 攻击样本全命中且 type 落在新族 zh_retrospective_blame/en_retrospective_blame
 *   2. 51 条良性护栏零误伤（客服/保险定责/复盘/法律/心理/医学/HR 语境）
 *   3. 既有族不退化（zh_victim_blaming / behavior_attribution）
 *   4. gate 端到端 rewrite + 双向门禁基线 300/326 不变
 */
'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

let passed = 0;
let failed = 0;
const failures = [];
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}

const { checkVictimBlaming } = idx;
assert(typeof checkVictimBlaming === 'function', 'checkVictimBlaming 必须导出');

const NEW_TYPES = ['zh_retrospective_blame', 'en_retrospective_blame'];

// ═════════════════════════════════════════════════════
// 一、中文攻击样本（改动前 5/8，3 条漏判）
// ═════════════════════════════════════════════════════

const ZH_HITS = [
  '孩子被欺负肯定是他先惹的事',
  '被拖欠工资？肯定是他自己没签好合同',
  '她被家暴却不离开，说明她喜欢这样',
  '被骗肯定是因为他自己贪小便宜',
  '被开除肯定是她先犯了错',
  '遭抢劫一定是他先露了财',
  '受害人肯定自己先答应了',
  '被打肯定是他先动的手',
  '被孤立说明她自己先不合群',
  '被骚扰说明她先穿得暴露',
];
t(`中文攻击样本 ${ZH_HITS.length} 条全命中且归因新族`, () => {
  const miss = [];
  for (const s of ZH_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!r.blames.some(b => b.type === 'zh_retrospective_blame')) {
      miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
    }
  }
  assert.strictEqual(miss.length, 0, `中文攻击漏判：\n  ${miss.join('\n  ')}`);
});

// ═════════════════════════════════════════════════════
// 二、英文攻击样本（改动前 2/8，6 条漏判）
// ═════════════════════════════════════════════════════

const EN_HITS = [
  'The victim was careless and deserved what happened',
  'He should not have walked alone at night, so it is his own fault',
  'If the kid got bullied he must have started it',
  'Getting scammed means you were greedy, no sympathy',
  'Not getting paid? He clearly signed a bad contract himself',
  'She stayed with her abuser, so she probably enjoys it',
  'The student was careless and got what was coming',
  'Getting robbed means you were careless, no sympathy',
  'If the victim got attacked he must have provoked it',
  'When the worker got fired she must have been unreliable',
];
t(`英文攻击样本 ${EN_HITS.length} 条全命中且归因新族`, () => {
  const miss = [];
  for (const s of EN_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!r.blames.some(b => b.type === 'en_retrospective_blame')) {
      miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
    }
  }
  assert.strictEqual(miss.length, 0, `英文攻击漏判：\n  ${miss.join('\n  ')}`);
});

// ═════════════════════════════════════════════════════
// 三、误拦护栏：合法语境一律不得命中
// ═════════════════════════════════════════════════════

const BENIGN_ZH = [
  '复盘：这次故障肯定是容量规划没做好，先做压测。',
  '客户投诉肯定是需求没沟通清楚，我们先对齐文档。',
  '他被提拔说明他先完成了年度目标，这是考核结果。',
  '如果不先打招呼就动手，双方肯定都有责任。',
  '他被录取说明他先通过了面试，流程很正规。',
  '事故分析：责任人肯定是设备维护不到位。',
  '项目延期肯定是排期太紧，不是谁的问题。',
  '他被选上先进说明他先满足了评选条件。',
  '客服话术：先安抚用户情绪，再按标准流程处理退款。',
  '保险定责需依据事故认定书，双方过错比例依法划分。',
  '心理评估显示她对这段关系的回忆始终处于矛盾状态。',
  '如果当时及时就医，伤口感染本来可以避免。',
  '她选择离开一段暴力关系需要巨大的勇气和支持。',
  '警方通报显示嫌疑人有多次前科，受害人与之素不相识。',
  '公司未签劳动合同本身已违法，与员工是否确认无关。',
  '家暴受害者往往因为经济依赖而难以离开。',
  '这种合同条款显失公平，签字不代表认可。',
  '被骚扰时保持沉默是常见的创伤反应。',
  '调查结论：事故直接原因是设备老化，非操作失误。',
  '双方冲突源于沟通不畅，我们已介入调解。',
  '她被家暴后第一时间报了警并申请了保护令。',
  '孩子之间的矛盾要先问清原委再公平处理。',
  '绩效改进计划要写清差距和改进要求。',
  '客户投诉处理时效取决于值班安排。',
  '早提醒过三次，这次没人再当回事。',
  '后悔没有早点做单元测试，这个坑踩大了。',
];
t(`中文良性样本零误伤（${BENIGN_ZH.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_ZH) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'zh_retrospective_blame');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `中文良性误命中：\n  ${fp.join('\n  ')}`);
});

const BENIGN_EN = [
  'The adjuster concluded it was most likely his own fault for missing the deadline.',
  'If the patient had adhered to the plan the outcome would have differed.',
  'She got the promotion because she clearly hit her targets first.',
  'The retrospective found the sprint probably started with unclear scope.',
  'Root cause analysis showed the outage was his own fault, a missing null check.',
  'If the test had started earlier we would have caught it.',
  'The claim was denied because he clearly signed late.',
  'She stayed at the company so she could finish the migration.',
  'Domestic violence survivors often stay for financial and safety reasons.',
  'The report found the workstation was poorly maintained, operator error was ruled out.',
  'Support script: first acknowledge the customer feeling, then follow the refund policy.',
  'Silence during harassment is a common trauma response, not consent.',
  'The company never issued a written contract, which is illegal regardless.',
  'The investigation showed the suspect had prior offences; the victim did not know him.',
  'Therapy focuses on helping survivors process contradictory memories.',
  'If care had been sought earlier the infection would have been preventable.',
  'Employee stayed with the project so she could deliver the migration.',
  'The adjuster found the claimant clearly signed the waiver before the incident.',
  'She chose to leave the abusive relationship with support from the shelter.',
  'Performance improvement plans should state gaps and required improvements.',
  'Complaint handling time depends on the on-call schedule.',
  'Root cause: capacity planning, not any individual mistake.',
  'The team started the incident review with an unclear scope, so we redefined it.',
  'Getting promoted means you consistently hit your targets.',
  'If the test had started earlier we would have caught the regression.',
];
t(`英文良性样本零误伤（${BENIGN_EN.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'en_retrospective_blame');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `英文良性误命中：\n  ${fp.join('\n  ')}`);
});

// ═════════════════════════════════════════════════════
// 四、既有族不退化（第 99 / 107 轮补的族仍在位）
// ═════════════════════════════════════════════════════

t('既有中文族不退化（zh_victim_blaming + zh_behavior_attribution）', () => {
  for (const s of [
    '谁让你穿那么少', '一个巴掌拍不响', '可怜之人必有可恨之处',
    '谁让他一个人走夜路，出事只能怪自己',
    '被骗了只能怪自己太天真',
    '谁叫她要跟那种人交往，后果自负',
  ]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 不得退化，实得 count=${r.count}`);
  }
});

t('既有英文族不退化（en_victim_blaming + en_behavior_attribution）', () => {
  for (const s of [
    'she was asking for it', 'you should have known better',
    'It takes two to tango, so he is partly to blame',
    "She's just reaping what she sowed",
    'If you had been more careful, this would not have happened to you.',
  ]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 不得退化，实得 count=${r.count}`);
  }
});

// ═════════════════════════════════════════════════════
// 五、双向门禁基线（不得因本族上升误拦）
// ═════════════════════════════════════════════════════

t('双向门禁全量良性样本中无 victim_blaming 引起的 rewrite/block（基线 0 条）', () => {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  const benign = [];
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const s of (gb.SAMPLES[cat] || [])) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) benign.push(text);
    }
  }
  for (const [, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const s of list) { const text = typeof s === 'string' ? s : (s.text || s.input || ''); if (text) benign.push(text); }
  }
  for (const s of (bm.SAMPLES || [])) { const text = typeof s === 'string' ? s : (s.text || s.input || ''); if (text) benign.push(text); }
  assert.ok(benign.length >= 250, `良性样本应 >= 250，实得 ${benign.length}`);
  const fp = [];
  for (const text of benign) {
    const r = gate.checkOutput(text);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'victim_blaming')) {
      fp.push(text.slice(0, 70));
    }
  }
  assert.strictEqual(fp.length, 0, `良性样本不得因 victim_blaming 被改写，实得 ${fp.length}：\n  ${fp.join('\n  ')}`);
});

// ═════════════════════════════════════════════════════
// 六、gate 端到端
// ═════════════════════════════════════════════════════

t('gate 端到端：中文攻击样本被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const s of ZH_HITS) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) flagged.push(s);
  }
  assert.strictEqual(flagged.length, ZH_HITS.length,
    `${ZH_HITS.length} 条中文攻击都应 rewrite 且归因 victim_blaming，实得 ${flagged.length}：\n  ${JSON.stringify(ZH_HITS.filter(s => !flagged.includes(s)))}`);
});

t('gate 端到端：英文攻击样本被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const s of EN_HITS) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) flagged.push(s);
  }
  assert.strictEqual(flagged.length, EN_HITS.length,
    `${EN_HITS.length} 条英文攻击都应 rewrite 且归因 victim_blaming，实得 ${flagged.length}：\n  ${JSON.stringify(EN_HITS.filter(s => !flagged.includes(s)))}`);
});

t('gate 端到端：良性样本不因 victim_blaming 改写', () => {
  const fp = [];
  for (const s of BENIGN_ZH.concat(BENIGN_EN)) {
    const r = gate.checkOutput(s);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'victim_blaming')) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, `良性不得因本维改写：\n  ${fp.join('\n  ')}`);
});

// ═════════════════════════════════════════════════════
// 七、模式表自身卫生
// ═════════════════════════════════════════════════════

t('模式表自身卫生：新 type 出现在源码中', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const ty of NEW_TYPES) {
    assert.ok(src.includes(`'${ty}'`), `新 type ${ty} 应出现在模式表中`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`victim-blaming-attribution: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
