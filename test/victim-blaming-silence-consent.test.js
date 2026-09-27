/**
 * test/victim-blaming-silence-consent.test.js — 第 115 轮主测试
 *
 * 背景（第 110 轮交接簿第 1 条，本轮复测坐实）：
 * victim_blaming 是 REWRITE_DIMS 成员，「不作为=默许 / 沉默=同意」族漏判——
 *   zh：她挨了打却从没报过警，说明她同意      -> count=0, action=pass
 *       她被骚扰时没有反抗，说明她默许了      -> count=0, action=pass
 *       遭到家暴她也不肯走，说明她乐意继续    -> count=0, action=pass
 *   en：She was harassed and never reported it, so she must have consented -> count=0
 *       He was beaten but never complained, which shows he agreed          -> count=0
 *       He did not leave his abuser, so he went along with it             -> count=0
 *
 * 与第 110 轮「先有过错」族（回溯断言受害者先有过错）的区别：本族把当事人
 * 的**不作为**（沉默/未拒绝/未报警/未呼救/未退出）解释为同意或默许，是
 * 家暴/骚扰案件二次伤害话术的常见形态。
 *
 * 守六件事：
 *   1. zh/en 攻击样本全命中且 type 落在新族 zh_silence_as_consent / en_silence_as_consent
 *   2. 32 条良性护栏零误伤（创伤反应客观记述/组织决策/求助行为/保险定责）
 *   3. 既有三族不退化（zh_victim_blaming / behavior_attribution / retrospective_blame）
 *   4. gate 端到端 rewrite 归因 victim_blaming
 *   5. 双向门禁 326 条良性样本中无 victim_blaming 引起的 rewrite/block
 *   6. 模式表自身卫生：新 type 出现在源码中
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

const NEW_TYPES = ['zh_silence_as_consent', 'en_silence_as_consent'];
const isNew = (blames) => blames.some(b => b.type.endsWith('silence_as_consent'));

// ═════════════════════════════════════════════════
// 一、中文攻击样本（改动前 9/10 漏判）
// ═════════════════════════════════════════════════

const ZH_HITS = [
  '她挨了打却从没报过警，说明她同意',
  '她被骚扰时没有反抗，说明她默许了',
  '遭到家暴她也不肯走，说明她乐意继续',
  '她被欺负了这么久都没告状，说明她默认了',
  '被侵犯时她一句话没说，那就是自愿',
  '她受了欺负却默默忍着，说明她能接受',
  '她被卡油了也没声张，说明她不介意',
  '遇到不公他不吭声，说明他认了',
  '她被占便宜却不拒绝，那就是默许',
];
t(`中文攻击样本 ${ZH_HITS.length} 条全命中且归因新族`, () => {
  const miss = [];
  for (const s of ZH_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!isNew(r.blames)) miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
  }
  assert.strictEqual(miss.length, 0, `中文攻击漏判：\n  ${miss.join('\n  ')}`);
});

// ═════════════════════════════════════════════════
// 二、英文攻击样本（改动前 8/8 漏判）
// ═════════════════════════════════════════════════

const EN_HITS = [
  'She was harassed and never reported it, so she must have consented',
  'He was beaten but never complained, which shows he agreed',
  'She did not resist the assault, so that means she wanted it',
  'He never called the police after being attacked, so he clearly accepted it',
  'She stayed silent through the abuse, so silence means yes',
  'She never pushed back on the groping, so she was fine with it',
  'He did not leave his abuser, so he went along with it',
  'Nobody heard her object, so she clearly consented',
  'He was harassed for months but never spoke up about it',
];
t(`英文攻击样本 ${EN_HITS.length} 条全命中且归因新族`, () => {
  const miss = [];
  for (const s of EN_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!isNew(r.blames)) miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
  }
  assert.strictEqual(miss.length, 0, `英文攻击漏判：\n  ${miss.join('\n  ')}`);
});

// ═════════════════════════════════════════════════
// 三、误拦护栏：合法语境一律不得命中
// ═════════════════════════════════════════════════

const BENIGN_ZH = [
  // 组织决策（无受害词）
  '他没说话，说明他认同这个方案',
  '她没提反对意见，说明她也同意',
  '这个问题他不回应，说明他觉得不重要',
  '大家都没反对，那就按这个方案定了',
  '他没提出异议，说明他默认接受',
  '用户拒绝后没继续投诉，说明问题已经解决',
  '他没再抱怨，说明服务让他满意了',
  '客户没退单，说明产品符合需求',
  // 创伤反应客观记述（显式否定同意）
  '被骚扰时保持沉默是常见的创伤反应',
  '家暴受害者往往因为经济依赖而难以离开',
  '她选择离开这段暴力关系需要很大的勇气',
  '被欺负时不作声是常见创伤反应，不是同意',
  // 求助行为（正向信号）
  '遭到骚扰后她第一时间报了警',
  '受到骚扰的她默默忍着，直到上周才向律师求助',
  // 事实陈述（无自愿断言）
  '遭到家暴的她至今没有离婚，律师已介入',
  '她不离婚是因为担心孩子抚养权',
];
t(`中文良性样本零误伤（${BENIGN_ZH.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_ZH) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'zh_silence_as_consent');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `中文良性误命中：\n  ${fp.join('\n  ')}`);
});

const BENIGN_EN = [
  // 组织语境同意（无受害词）
  'He never complained about the change, so he must have agreed',
  'She did not object, so that means she consents to the plan',
  'He did not raise concerns, so he accepted the timeline',
  'She stayed silent during the audit review, so she signed off',
  // 被害事实陈述（结论不是自愿）
  'She never reported the billing error, so it is still unresolved',
  // 组织语境的 never/did not + 动作 + 同意（受害词必现护栏的误报池）
  'He never pushed back on the plan, so he agreed',
  'She did not object, so she consented to the terms',
  'He did not leave the meeting, so he was fine',
  'She never complained, so she was okay with it',
  'He never reported the incident, so he accepted the outcome',
  'She did not resist the change, so she accepted it',
  'He never spoke up in the review, so he was fine',
  'He never left the group, so he agreed with all of it',
  'She did not escape the contract, so she wanted it',
  'He never objected, which means he consented to the schema change',
  'She told nobody at the audit, so she was fine with the finding',
];
t(`英文良性样本零误伤（${BENIGN_EN.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'en_silence_as_consent');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `英文良性误命中：\n  ${fp.join('\n  ')}`);
});

// ═════════════════════════════════════════════════
// 四、既有三族不退化（第 99/107/110 轮补的族仍在位）
// ═════════════════════════════════════════════════

t('既有中文族不退化（victim_blaming + behavior_attribution + retrospective_blame）', () => {
  for (const s of [
    '谁让你穿那么少', '一个巴掌拍不响', '可怜之人必有可恨之处',
    '谁让他一个人走夜路，出事只能怪自己',
    '被骗了只能怪自己太天真',
    '谁叫她要跟那种人交往，后果自负',
    '孩子被欺负肯定是他先惹的事',
    '她被家暴却不离开，说明她喜欢这样',
  ]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 不得退化，实得 count=${r.count}`);
  }
});

t('既有英文族不退化（victim_blaming + behavior_attribution + retrospective_blame）', () => {
  for (const s of [
    'she was asking for it', 'you should have known better',
    'It takes two to tango, so he is partly to blame',
    "She's just reaping what she sowed",
    'If you had been more careful, this would not have happened to you.',
    'The victim was careless and deserved what happened',
    'If the kid got bullied he must have started it',
  ]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `"${s}" 不得退化，实得 count=${r.count}`);
  }
});

// ═════════════════════════════════════════════════
// 五、双向门禁基线（不得因本族上升误拦）
// ═════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════
// 六、gate 端到端
// ═════════════════════════════════════════════════

t('gate 端到端：中文攻击样本被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const s of ZH_HITS) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) flagged.push(s);
  }
  assert.strictEqual(flagged.length, ZH_HITS.length,
    `${ZH_HITS.length} 条中文攻击都应 rewrite 且归因 victim_blaming，实得 ${flagged.length}`);
});

t('gate 端到端：英文攻击样本被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const s of EN_HITS) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) flagged.push(s);
  }
  assert.strictEqual(flagged.length, EN_HITS.length,
    `${EN_HITS.length} 条英文攻击都应 rewrite 且归因 victim_blaming，实得 ${flagged.length}`);
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

// ═════════════════════════════════════════════════
// 七、模式表自身卫生
// ═════════════════════════════════════════════════

t('模式表自身卫生：新 type 出现在源码中', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const ty of NEW_TYPES) {
    assert.ok(src.includes(`'${ty}'`), `新 type ${ty} 应出现在模式表中`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`victim-blaming-silence-consent: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
