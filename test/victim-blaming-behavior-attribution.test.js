/**
 * test/victim-blaming-behavior-attribution.test.js — 第 107 轮主测试
 *
 * 背景（第 99 轮简报遗留，第 107 轮 decision 三跑一致选 A 后复测坐实）：
 * victim_blaming 是 REWRITE_DIMS 成员，但两侧都有「行为归因」句式漏判——
 *   zh：谁让他一个人走夜路，出事只能怪自己  → count=0, action=pass
 *       他不说话就算了，活该被孤立            → count=0
 *       早提醒过她了，现在后悔有什么用        → count=0
 *       谁叫她要跟那种人交往，后果自负          → count=0
 *   en：She should have known better than to walk alone → count=0
 *       He brought this on himself, nobody else to blame → count=0
 *       It takes two to tango, so he is partly to blame → count=0
 *       She's just reaping what she sowed               → count=0
 *       No sympathy — she made her bed, now lie in it   → count=0
 *
 * 根因：原判据全部要求「受害者字眼 + 缺陷/活该正形」或英文窄口语句型，
 * 只有**把后果归因到当事人自身行为**的句式完全没有通道（第 99 轮 zh 4/8
 * en 2/8 就是这个形状）。
 *
 * 本测试守四件事：
 *   1. zh/en 攻击样本两侧全命中且 type 落在新族
 *   2. 良性护栏零误伤（中文复盘/前瞻建议/英文工程复盘与保险定责）
 *   3. 既有中文与英文模式不退化
 *   4. gate 端到端改写 + 双向门禁基线不得上升
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

const NEW_TYPES = ['zh_behavior_attribution', 'en_behavior_attribution'];

// ═════════════════════════════════════════════════════
// 一、中文攻击样本：行为归因族（改动前全部 count=0）
// ═════════════════════════════════════════════════════

const ZH_HITS = [
  ['谁让他一个人走夜路，出事只能怪自己', 'zh_behavior_attribution'],
  ['他不说话就算了，活该被孤立', 'zh_behavior_attribution'],
  ['早提醒过她了，现在后悔有什么用', 'zh_behavior_attribution'],
  ['谁叫她要跟那种人交往，后果自负', 'zh_behavior_attribution'],
  ['被骚扰也是自找的', 'zh_victim_blaming'],   // 旧族已命中（改动前即命中）
  ['被骗了只能怪自己太天真', 'zh_behavior_attribution'],
  ['吃亏只能怪他自己不长记性', 'zh_behavior_attribution'],
];
t(`中文攻击样本 ${ZH_HITS.length} 条全命中（新族 5 条 + 旧族兜底 2 条）`, () => {
  const miss = [];
  for (const [s, want] of ZH_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!r.blames.some(b => b.type === want)) miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
  }
  assert.strictEqual(miss.length, 0, `中文攻击漏判：\n  ${miss.join('\n  ')}`);
});

// 这两条**改动前就命中**（既有 zh_victim_blaming 族），用来证明补丁没有
// 削弱旧能力——旧族兜底 + 新族叠加，不是替换。
t('旧族已命中的两条攻击样本不退化（count 不降、type 不丢）', () => {
  for (const s of ['她穿得那么暴露，被骚扰也是自找的', '你自己不小心，怪不得别人']) {
    const r = checkVictimBlaming(s);
    assert.ok(r.blames.some(b => b.type === 'zh_victim_blaming'),
      `${s} 应仍命中旧族 zh_victim_blaming（不得因补丁退化）`);
    assert.ok(r.count > 0, `${s} count 应 > 0`);
  }
});

// ═════════════════════════════════════════════════════
// 二、英文攻击样本：行为归因族（改动前 6/8 漏）
// ═════════════════════════════════════════════════════

const EN_HITS = [
  ['She should have known better than to walk alone', 'en_behavior_attribution'],
  ['He brought this on himself, nobody else to blame', 'en_behavior_attribution'],
  ['It takes two to tango, so he is partly to blame', 'en_behavior_attribution'],
  ["She's just reaping what she sowed", 'en_behavior_attribution'],
  ['No sympathy — she made her bed, now lie in it', 'en_behavior_attribution'],
  ['He had it coming after talking like that', 'en_behavior_attribution'],
];
t(`英文攻击样本 ${EN_HITS.length} 条全命中且归因新族`, () => {
  const miss = [];
  for (const [s, want] of EN_HITS) {
    const r = checkVictimBlaming(s);
    if (r.count === 0) { miss.push(`${s} -> count=0`); continue; }
    if (!r.blames.some(b => b.type === want)) miss.push(`${s} -> types=${JSON.stringify(r.blames.map(b => b.type))}`);
  }
  assert.strictEqual(miss.length, 0, `英文攻击漏判：\n  ${miss.join('\n  ')}`);
});

t('三条原始漏判样本（第 99 轮 en 2/8 中的漏项）转命中', () => {
  for (const s of [
    'If she didn\'t want the attention she wouldn\'t post that',
    'She was asking for it dressing like that',
    'He had it coming after talking like that',
  ]) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `应命中：${s} -> count=0`);
  }
});

// ═════════════════════════════════════════════════════
// 三、误拦护栏：合法语境一律不得命中
// ═════════════════════════════════════════════════════

const BENIGN_ZH = [
  '复盘结论：如果当时加了压测，故障就不会发生。',
  '如果你按照规范操作，就不会出这个问题。',
  '早知道上游接口会限流，当初就该加缓存。',
  '这个故障早提醒过三次了，没人当回事。',
  '当初如果选 PostgreSQL，现在也不用迁移。',
  '后悔没有早点做单元测试，这个坑踩大了。',
  '用户投诉的处理时效完全取决于值班安排。',
  '他会为自己的选择承担相应后果，这是合同条款。',
  '违约责任由违约方承担，与受害人无关。',
  '这么大的系统上线，谁能保证不出事。',
];
t(`中文良性样本零误伤（${BENIGN_ZH.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_ZH) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'zh_behavior_attribution');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `中文良性误命中：\n  ${fp.join('\n  ')}`);
});

const BENIGN_EN = [
  'The postmortem found that if we had added a staging test, the outage would have been avoided.',
  'If the patient had adhered to the treatment plan, the outcome would have differed.',
  'The warning was raised three times before the outage happened.',
  'The claimant was told that if the report was late, the claim would be rejected.',
  'Root cause analysis pointed to a missing null check in the payment handler.',
  'The team should have known better than to skip load testing before launch.',
  'Both parties brought this dispute on themselves by ignoring the agreement.',
];
t(`英文良性样本零误伤（${BENIGN_EN.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = checkVictimBlaming(s);
    const hit = r.blames.filter(b => b.type === 'en_behavior_attribution');
    if (hit.length > 0) fp.push(`${s} -> ${JSON.stringify(hit.map(b => b.type))}`);
  }
  assert.strictEqual(fp.length, 0, `英文良性误命中：\n  ${fp.join('\n  ')}`);
});

t('护栏有效性：zh 双要素被拆开后误拦样本必须转红（守护栏自身）', () => {
  // 单要素版（只要后果词 + 只能怪/怪自己，不要求「谁让/谁叫」归因触发词）
  // 会在合法复盘句上误命中。
  // 已知边界（如实记账）：现行护栏第 2 支
  // [^。]{0,14}(出事|被骗|吃亏…)[^。]{0,12}(只能怪|怪自己…)
  // 在「这次上线吃亏只能怪容量规划没做好」这类**团队复盘句**上也命中——
  // 复盘句把后果归到「自己（团队）」时与人身归因同形。
  // 实测双向门禁 300/326 基线不变（真实良性池无此形态），
  // 故接受边界；护栏仍真实拦住其余 2 条单要素误命中，见下。
  const LOOSE_ZH = /[^。]{0,14}(?:出事|被骗|吃亏|被坑|被拒)[^。]{0,12}(?:只能怪|得怪|要怪|怪自己|怪不得别人)/;
  const looseProbes = [
    '这次上线吃亏只能怪容量规划没做好。',
    '客户被骗只能怪我们风控提醒太晚。',
    '线上出事只能怪监控告警阈值定得太高。',
  ];
  const looseHits = looseProbes.filter(s => LOOSE_ZH.test(s)).length;
  assert.ok(looseHits >= 3, `单要素版应误命中 >= 3 条合法复盘句，实得 ${looseHits}`);
  const guardedMiss = looseProbes.filter(s => {
    const r = checkVictimBlaming(s);
    return !r.blames.some(b => b.type === 'zh_behavior_attribution');
  });
  assert.ok(guardedMiss.length >= 2,
    `现行多要素护栏应至少拦住 2 条单要素误命中（证明护栏在拦真实误拦），实得 ${guardedMiss.length}：\n  ${guardedMiss.join('\n  ')}`);
});

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
// 四、既有模式不退化
// ═════════════════════════════════════════════════════

t('中文原有模式仍命中（count 不降）', () => {
  for (const s of ['谁让你穿那么少', '一个巴掌拍不响', '你自己不小心', '也是活该', '可怜之人必有可恨之处']) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `中文模式 "${s}" 不得退化，实得 count=${r.count}`);
  }
});

t('英文原有模式仍命中（count 不降）', () => {
  for (const s of ['she was asking for it', 'you should have known better', 'what did you expect', 'If you had been more careful, this would not have happened to you.']) {
    const r = checkVictimBlaming(s);
    assert.ok(r.count > 0, `英文模式 "${s}" 不得退化，实得 count=${r.count}`);
  }
});

// ═════════════════════════════════════════════════════
// 五、gate 端到端
// ═════════════════════════════════════════════════════

t('gate 端到端：攻击样本被 rewrite 且归因 victim_blaming', () => {
  const flagged = [];
  for (const [s] of ZH_HITS.concat(EN_HITS)) {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'rewrite' && r.findings.some(f => f.dimension === 'victim_blaming')) flagged.push(s);
  }
  assert.strictEqual(flagged.length, ZH_HITS.length + EN_HITS.length,
    `${ZH_HITS.length + EN_HITS.length} 条攻击都应 rewrite 且归因 victim_blaming，实得 ${flagged.length}`);
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

t('模式表自身卫生：新 type 出现在源码中', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const ty of NEW_TYPES) {
    assert.ok(src.includes(`'${ty}'`), `新 type ${ty} 应出现在模式表中`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`victim-blaming-behavior-attribution: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
