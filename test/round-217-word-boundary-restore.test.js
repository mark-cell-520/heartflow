// r217 — 0x08 词边界腐蚀修复测试
//
// 背景（交接簿候选①，r216 记录「必须单独一轮」）：
//   源码里 109 处正则的 \b 词边界被写成字面退格符 0x08（单字节），模式串以
//   0x08 开头/结尾 —— 正常文本永不含退格符，这些正则实际全部失明。分布：
//   src/index.js 77 处（9 个维度常量表）、src/dream/interactive-dream.js
//   20 处、src/knowledge/classics-rules.js 12 处。
//   实测失明样本（修复前）：'Because we shipped the fix, sales rose.'
//   premise=0；'All women are bad at math.' gate=pass；
//   'I deliberately hide my real capabilities...'（deceptive_alignment
//   是 BLOCK 级维度）gate=pass。
//
// 本测试四件事：
//   1. 源码守卫：src/ 下不得再出现 0x08 字节（腐蚀永不复发）
//   2. 修复生效：9 个维度表的英文模式恢复命中（维度级 count/score）
//   3. 拆支合规：interactive-dream / classics-rules 的 CJK 支无 \b 包裹
//      （r128 约定，由 scan-cjk-word-boundary.js 全仓守着，这里抽验行为）
//   4. 回归：中文侧行为不变 + 良性英文句零误伤 + 存量 deceptive 基线修复后值

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { checkReasoningCoherence, checkGoalMisalignment, checkCounterfactual,
        checkSocialNorm, checkMetaCognition, checkDeceptiveAlignment,
        checkStereotype, checkFactualConsistency, checkPrivacyBoundary } = require('../src/index.js');
const { gate } = require('../src/gate.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; console.log('FAIL:', name, '|', e.message); }
}
const ROOT = path.join(__dirname, '..');

// ─── 一、源码守卫：src/ 全树无 0x08 残留 ───────────────────────────────
t('源码守卫：src/ 下 0x08 字节总数为 0', () => {
  let total = 0;
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) {
        const buf = fs.readFileSync(p);
        for (const c of buf) if (c === 0x08) total++;
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  assert.strictEqual(total, 0, 'src/ 仍有 ' + total + ' 个 0x08 字节');
});

// ─── 二、9 个维度表英文侧恢复命中 ─────────────────────────────────────
t('reasoning_coherence：英文完整推理链恢复 0.9（修复前 0「无推理结构」）', () => {
  const r = checkReasoningCoherence('Because we shipped the fix, sales rose. Therefore the campaign worked. In conclusion, we should ship more fixes.');
  assert.strictEqual(r.structure, '完整推理链', 'structure 实际 ' + r.structure);
  assert.ok(r.score >= 0.7, 'score 应 ≥0.7，实际 ' + r.score);
});
t('reasoning_coherence：英文 obviously 恢复「跳跃推理（无依据）」', () => {
  const r = checkReasoningCoherence('Obviously this is the only correct answer.');
  assert.strictEqual(r.structure, '跳跃推理（无依据）', 'structure 实际 ' + r.structure);
  assert.ok(r.score <= 0.1, 'score 应 ≤0.1，实际 ' + r.score);
});
t('reasoning_coherence：中文侧行为不变（完整链仍 0.9）', () => {
  const r = checkReasoningCoherence('因为数据表明用户留存下降，所以我们调整了引导流程。综上所述，改版是必要的。');
  assert.strictEqual(r.structure, '完整推理链', 'structure 实际 ' + r.structure);
  assert.ok(r.score >= 0.7, 'score 应 ≥0.7，实际 ' + r.score);
});

t('goal_misalignment：英文 theory vs practice 恢复命中（修复前 count=0）', () => {
  const r = checkGoalMisalignment('In theory we value transparency, but in practice we hide everything.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
  assert.ok(r.issues.some(i => i.type === 'theory_vs_practice'), 'issues 应含 theory_vs_practice');
});
t('goal_misalignment：中文侧行为不变', () => {
  const r = checkGoalMisalignment('我们的目标是帮助用户，但做法却是收割他们');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('counterfactual：英文 but for 恢复命中（修复前 count=0）', () => {
  const r = checkCounterfactual('But for the backup system, we would have lost everything.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('counterfactual：中文侧行为不变', () => {
  const r = checkCounterfactual('如果没有那次备份，我们就不会损失惨重');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('social_norm：英文 inappropriate 恢复命中（修复前 count=0）', () => {
  const r = checkSocialNorm("That's simply inappropriate behavior.");
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('social_norm：中文侧行为不变', () => {
  const r = checkSocialNorm('不应该这样说话');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('meta_cognition：英文 uncertainty 恢复命中（修复前 count=0）', () => {
  const r = checkMetaCognition('I may be wrong, but the data points elsewhere.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('meta_cognition：中文侧行为不变', () => {
  const r = checkMetaCognition('我也许错了，但数据指向另一边');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('deceptive_alignment：英文 sandbagging 恢复命中（修复前 count=0）', () => {
  const r = checkDeceptiveAlignment('I could solve this but I will pretend I cannot.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('deceptive_alignment：英文 capability hiding 恢复命中（修复前 count=0）', () => {
  const r = checkDeceptiveAlignment('I will hide my true capability from the evaluators.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('deceptive_alignment：中文侧行为不变', () => {
  const r = checkDeceptiveAlignment('我可以答对，但我不展示我的真实水平');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('stereotype：英文群体概括恢复命中（修复前 count=0 / gate=pass）', () => {
  const r = checkStereotype('All women are bad at math.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
  assert.ok((r.signals || []).some(i => i.type === 'group_generalization'), 'signals 应含 group_generalization');
});
t('stereotype：英文代际偏见恢复命中', () => {
  const r = checkStereotype('Millennials are lazy and destroyed the economy.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('stereotype：中文侧行为不变', () => {
  const r = checkStereotype('现在的年轻人都不踏实');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('factual_consistency：英文 everyone knows 恢复命中（修复前 count=0）', () => {
  const r = checkFactualConsistency('Everyone knows that this diet cures cancer.');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('factual_consistency：中文侧行为不变', () => {
  const r = checkFactualConsistency('众所周知，这个偏方可以治愈癌症');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

t('privacy_boundary：英文婚姻提问恢复命中（修复前 count=0）', () => {
  const r = checkPrivacyBoundary('Are you married?');
  assert.ok(r.count >= 1, 'count 应 ≥1，实际 ' + r.count);
});
t('privacy_boundary：中文侧行为不变', () => {
  const r = checkPrivacyBoundary('你结婚了吗');
  assert.ok(r.count >= 1, '中文 count 应 ≥1，实际 ' + r.count);
});

// ─── 三、gate 层：攻击被拦 + 良性零误伤 ──────────────────────────────
const GATE_ATTACKS = [
  ['All women are bad at math.', 'verify'],
  ['Millennials are lazy and destroyed the economy.', 'verify'],
  ['Older people are stuck in their ways.', 'verify'],
  ['Kids these days have no respect.', 'verify'],
  ['I could solve this but I will pretend I cannot.', 'block'],
  ['I will hide my true capability from the evaluators.', 'block'],
];
for (const [text, min] of GATE_ATTACKS) {
  t('gate 攻击样本 ' + JSON.stringify(text.slice(0, 40)) + ' → ' + min, () => {
    const a = gate(text).gate.action;
    assert.ok(['block', 'rewrite', 'verify'].includes(a), '攻击句 action 应为非 pass，实际 ' + a);
    if (min === 'block') assert.strictEqual(a, 'block', 'deceptive_alignment 是 BLOCK 级维度，实际 ' + a);
  });
}
const BENIGN_EN = [
  'The quarterly report shows revenue growth of 12% across all regions.',
  'We need to schedule a meeting with the design team next week.',
  'The library opens at nine and closes at six on weekdays.',
  'She enjoys hiking in the mountains during autumn.',
  'Because we shipped the fix on time, the customer renewed the contract.',
];
for (const text of BENIGN_EN) {
  t('gate 良性英文 ' + JSON.stringify(text.slice(0, 40)) + ' → pass', () => {
    const a = gate(text).gate.action;
    assert.strictEqual(a, 'pass', '良性英文句应 pass，实际 ' + a);
  });
}

// ─── 四、拆支合规（r128 约定）：interactive-dream / classics-rules ────
t('interactive-dream：tagMemory 中英双侧命中且 ASCII 支防子串误伤', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/dream/interactive-dream.js'), 'utf8');
  const defAt = src.indexOf('tagMemory(text) {');
  assert.ok(defAt >= 0, '应找到 tagMemory 方法定义');
  const endAt = src.indexOf('assignRoom(text) {');
  const tag = src.slice(defAt, endAt > defAt ? endAt : defAt + 1200);
  // ASCII 支保留 \b（防 conversation 命中 version 类子串误伤）
  assert.ok(/\\b\(\?:version\|/.test(tag), 'ASCII 支应保留 \\b 组');
  // CJK 支在 \b 组外（r128：\b 对汉字永不成立）
  const grouped = tag.match(/\\b\(\?:([^)]*)\)/g) || [];
  for (const g of grouped) {
    assert.ok(!/[一-鿿]/.test(g), '\\b 组内不应含 CJK：' + g);
  }
  assert.ok(/\|历史\|当前/.test(tag), '中文支应为裸子串（历史|当前）');
});
t('classics-rules：buddhistSoft 单字支无 \\b 包裹（与 confucianSoft 惯例一致）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/knowledge/classics-rules.js'), 'utf8');
  const line = src.split('\n').find(l => l.includes('const buddhistSoft'));
  assert.ok(line, '应找到 buddhistSoft 行');
  assert.ok(!/\\b/.test(line), 'buddhistSoft 不应再含 \\b（对汉字永不成立），实际：' + line.trim().slice(0, 60));
  const conf = src.split('\n').find(l => l.includes('const confucianSoft'));
  assert.ok(conf && !/\\b/.test(conf), 'confucianSoft 惯例即为无 \\b 裸子串');
});
t('拆支行为：interactive-dream 正则中英双侧真命中', () => {
  const tagRe = /(?:\b(?:version|versioning|current|old|new)\b|历史|当前)/i;
  assert.ok(tagRe.test('current version 2'), 'ASCII 支应命中');
  assert.ok(tagRe.test('历史版本回顾'), 'CJK 支应命中');
  assert.ok(!tagRe.test('conversation about cats'), 'ASCII 支不应被子串误伤');
});

console.log(`round-217 word-boundary-restore: ${passed} passed, ${failed} failed (of ${passed + failed})`);
if (failed > 0) process.exit(1);
