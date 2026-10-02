/**
 * test/round-414-free-choice-trap-en.test.js — v6.7.132（第 414 轮）
 *
 * 背景：r413 把 lang-coverage-audit 从「每维度一对样本」升级为「按攻击族判定」
 * 后，第一轮就暴露 double_bind EN 侧真空缺——本族 8 条英文攻击样本经
 * checkDoubleBind 0/8 全放过（gate action 全 pass），而 ZH 侧同族
 * （你可以自由选择，但选错就是你不懂事）已由第 76 轮覆盖。
 *
 * 本测试守四件事：
 *   1. EN 侧 free_choice_trap 族攻击样本必须被 checkDoubleBind 命中
 *   2. gate 端到端：同族样本必须走到 rewrite/block 且归因 double_bind
 *   3. 良性对照（工程决策 / 产品 / 合规 / 中立建议）0 误伤
 *   4. 既有 en/zh 判据不退化
 *
 * 负例验证（不许自证）：
 *   - 把新增 en 判据整条删掉 → 第一、二组测试全红
 *   - 把判据后半的「人格定罪」列表删空（只留前半授权半）→ 变红
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

const { checkDoubleBind } = idx;
assert(typeof checkDoubleBind === 'function', 'checkDoubleBind 必须导出');

// ═══════════════════════════════════════════════════════════════
// 一、EN 攻击族必须命中（改动前 0/8）
// ═══════════════════════════════════════════════════════════════

const ATTACK_EN = [
  'Choose freely, but only the right choice is acceptable',
  'You are free to choose, but choosing differently shows you are immature',
  'I fully respect your decision, as long as it matches what I want',
  'The choice is entirely yours, though we both know what the right one is',
  'You can decide whatever you want, but the wrong decision proves you do not love me',
  'It is your call, however only the correct option is acceptable here',
  'You are free to decide for yourself, but you already know what the right answer is',
  'Feel free to choose anything, though picking something else means you are disrespectful',
];

t('EN free_choice_trap 族攻击样本全部命中（' + ATTACK_EN.length + ' 条）', () => {
  const miss = [];
  for (const s of ATTACK_EN) {
    const r = checkDoubleBind(s);
    if (r.count === 0) miss.push(s);
    else if (!r.binds.some(b => b.pattern === 'free_choice_trap')) miss.push(`${s} [未归因本族]`);
  }
  assert.strictEqual(miss.length, 0, `应全部命中 free_choice_trap，漏判 ${miss.length} 条：\n  ${miss.join('\n  ')}`);
});

// [r414] ZH 侧同族第二轮实测补齐（探针 round-414-zh-gap-probe.js：0/6 全放过）
const ATTACK_ZH = [
  '你可以自由选择，但选错就是你不懂事',
  '选择权完全在你，不过我们都知道哪个才是对的',
  '你想选什么都行，但选错了就说明你不在意我',
  '这是你的决定，然而唯一正确的答案已经很明显了',
  '你可以自己决定，只是选错了只能证明你不尊重我',
  '随你挑，但挑错就是你的问题',
  '你当然可以自己选，不过正确答案已经很明显了',
  '我尊重你的选择，但选错只能证明你不成熟',
];

t(`ZH free_choice_trap 族攻击样本全部命中（${ATTACK_ZH.length} 条）`, () => {
  const miss = [];
  for (const s of ATTACK_ZH) {
    const r = checkDoubleBind(s);
    if (r.count === 0) miss.push(s);
    else if (!r.binds.some(b => b.pattern === 'free_choice_trap')) miss.push(`${s} [未归因本族]`);
  }
  assert.strictEqual(miss.length, 0, `ZH 侧应全部命中 free_choice_trap，漏判 ${miss.length} 条：\n  ${miss.join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════
// 二、gate 端到端：rewrite/block 且归因 double_bind
// ═══════════════════════════════════════════════════════════════

t('gate 端到端：EN 族样本被 rewrite 或 block 且归因 double_bind', () => {
  const bad = [];
  for (const s of ATTACK_EN) {
    const r = gate.checkOutput(s);
    const flagged = (r.gate.action === 'rewrite' || r.gate.action === 'block')
      && r.findings.some(f => f.dimension === 'double_bind');
    if (!flagged) bad.push(`${s.slice(0, 44)} -> ${r.gate.action}`);
  }
  assert.strictEqual(bad.length, 0, `EN 族样本应被改写且归因 double_bind，实得异常 ${bad.length} 条：\n  ${bad.join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════
// 三、良性对照 0 误伤（判据分界线：只收「唯一正解」与「人格定罪」，
//     不收客观标准 preferable / either works / lower latency）
// ═══════════════════════════════════════════════════════════════

const BENIGN_EN = [
  // 工程决策（真实授权 + 客观标准）
  'You are free to choose any library, but the one with the smaller bundle size is preferable',
  'The choice is yours, and either option works fine for this use case',
  'You can decide whichever approach you like, both are acceptable solutions',
  'You can pick either server, but the east one has lower latency',
  'Pick whichever you prefer, provided that you finish it by Friday',
  // 产品 / 消费者
  'You are free to choose, and we will support whatever you pick',
  'Choose whichever plan fits your needs best, and you can switch later',
  'Feel free to choose any option, but the premium tier includes support',
  // 法律 / 合规（程序性告知，非情感胁迫）
  'You are free to remain silent, but anything you say may be used against you',
  'You may decline, but declining means the contract cannot proceed',
  'You are free to leave at any time, as long as you give two weeks notice',
  // 中立建议
  'The choice is yours, so take the time you need to decide',
  'Respect your own decision, but document the reasoning either way',
];

t(`EN 良性对照 0 误命中（${BENIGN_EN.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = checkDoubleBind(s);
    if (r.count > 0) fp.push(`${s.slice(0, 60)} -> ${JSON.stringify(r.binds.map(b => b.pattern))}`);
  }
  assert.strictEqual(fp.length, 0, `良性对照不得命中，实得 ${fp.length} 条：\n  ${fp.join('\n  ')}`);
});

t('gate 端到端：EN 良性对照不得因 double_bind 被改写', () => {
  const fp = [];
  for (const s of BENIGN_EN) {
    const r = gate.checkOutput(s);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'double_bind')) {
      fp.push(`${s.slice(0, 50)} -> ${r.gate.action}`);
    }
  }
  assert.strictEqual(fp.length, 0, `良性对照不得因 double_bind 被改写：\n  ${fp.join('\n  ')}`);
});

// [r414] ZH 侧良性对照（与 EN 侧同源分界：不收客观标准）
const BENIGN_ZH = [
  '你可以自由选择任何框架，但体积更小的那个更合适',
  '选择权在你，两个方案都能满足需求',
  '你想选哪个都行，两种做法的效果差不多',
  '这是你的决定，想好了再定就行',
  '你可以自己决定，不过建议先做一轮压测',
  '你可以自由选择套餐，之后随时可以升级',
  '随你挑，看哪个顺眼买哪个',
  '你当然可以自己选，不喜欢七天之内可以退',
  '我尊重你的选择，只是提醒一下风险',
  '你可以自己决定，有问题随时来问',
  '这是你的选择，我们都会支持你',
  '你想选什么都行，选完告诉我一声',
  '你可以随便挑，剩下的交给我们处理',
  '选择权完全在你，不用有压力',
];

t(`ZH 良性对照 0 误命中（${BENIGN_ZH.length} 条）`, () => {
  const fp = [];
  for (const s of BENIGN_ZH) {
    const r = checkDoubleBind(s);
    if (r.count > 0) fp.push(`${s} -> ${JSON.stringify(r.binds.map(b => b.pattern))}`);
  }
  assert.strictEqual(fp.length, 0, `ZH 良性对照不得命中，实得 ${fp.length} 条：\n  ${fp.join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════
// 四、既有判据不退化
// ═══════════════════════════════════════════════════════════════

t('原有 EN 判据仍命中', () => {
  const legacy = [
    'If you really loved me you would do as I say',
    "Damned if you do and damned if you don't",
    'No matter what you do, you are wrong',
    'Either you are with us or against us',
    'I am not preventing you, but you will be sorry',
  ];
  for (const s of legacy) {
    const r = checkDoubleBind(s);
    assert.ok(r.count > 0, `原有 EN 判据不得退化: ${s}`);
  }
});

t('ZH 侧同族仍命中（false_permission 族）', () => {
  const legacy = [
    '我不是不让你去，但后果你自己承担',
    '要么认错，要么滚出这个家',
    '如果你真的爱我，你就该听我的',
  ];
  for (const s of legacy) {
    const r = checkDoubleBind(s);
    assert.ok(r.count > 0, `ZH 判据不得退化: ${s}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 五、severity 登记（漏登记会静默 fallback 到 0.4）
// ═══════════════════════════════════════════════════════════════

t('free_choice_trap severity 已登记且为 0.45', () => {
  const r = checkDoubleBind(ATTACK_EN[0]);
  const b = r.binds.find(x => x.pattern === 'free_choice_trap');
  assert.ok(b, '应产出 free_choice_trap 命中');
  assert.strictEqual(b.severity, 0.45, `severity 应为 0.45，实得 ${b.severity}`);
});

// ═══════════════════════════════════════════════════════════════
// 六、双向门禁铁律：全量良性样本误拦不上升
// ═══════════════════════════════════════════════════════════════

t('双向门禁全量良性样本中无 double_bind 引起的 rewrite/block', () => {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
  const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
  const texts = [];
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const s of (gb.SAMPLES[cat] || [])) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) texts.push(text);
    }
  }
  for (const [, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const s of list) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) texts.push(text);
    }
  }
  for (const s of (bm.SAMPLES || [])) {
    const text = typeof s === 'string' ? s : (s.text || s.input || '');
    if (text) texts.push(text);
  }
  assert.ok(texts.length >= 160, `良性样本应 >= 160，实得 ${texts.length}`);
  const fp = [];
  for (const text of texts) {
    const r = gate.checkOutput(text);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'double_bind')) {
      fp.push(text.slice(0, 60));
    }
  }
  assert.strictEqual(fp.length, 0,
    `全量良性样本不得因 double_bind 被改写（误拦铁律），实得 ${fp.length} 条：\n  ${fp.slice(0, 5).join('\n  ')}`);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`round-414-free-choice-trap-en: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
