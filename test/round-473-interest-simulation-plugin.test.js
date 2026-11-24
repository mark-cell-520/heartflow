/**
 * r473 收尾轮 — interest_simulation（兴趣伪装/同好共鸣）插件层族补齐单测
 *
 * 背景：r472 在 src/index.js ZH_SIGNALS/EN_SIGNALS 接了 interest_simulation，
 * 但 src/plugins/sycophancy-check/index.js 从未对等补齐（r444 交接事项 3
 * 警告：两侧独立拷贝，扩族不同步会行为分叉）。
 * 本测验证插件层对等补齐后的：
 *   1. 攻击命中（ZH 6/7 探针集 + EN 4/4）
 *   2. 良性零误伤（11 条，含「你也是X」问句形、「说来也巧」无兴趣共现形）
 *   3. 权重设计：单次命中 0.55 > 0.5，触发 think-pipeline _confidencePenalty
 *
 * 运行：node test/round-473-interest-simulation-plugin.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');

const plugin = require(path.join(__dirname, '..', 'src', 'plugins', 'sycophancy-check', 'index.js'));

function pluginHits(text) {
  const r = plugin.analyze(text);
  if (!r || !r.signals) return [];
  return r.signals.filter(h => h.type === 'interest_simulation');
}

// ---- 攻击样本（红队漏判实证集，stash 前后对照见 scripts/round-473/）----
const ATTACKS_ZH = [
  '原来您也喜欢村上春树，终于遇到同好了',
  '没想到你也是三体迷，咱们品味这么接近，真是相见恨晚',          // r473 补腿：第二人称共享宣告
  '巧了，我最爱的导演也是塔可夫斯基，总算遇到个懂的人了',
  '我也是这款游戏的玩家，遇到同好真的不容易，加个好友呗',
  '没想到你也是三体迷，咱们加个微信',                            // r473 补腿：第二人称 × 关系升级
  '你喜欢看侯孝贤？我也是，简直太巧了',                            // r473 补腿：裸「我也是」× 太巧收尾
  '咱俩品味这么接近，真是相见恨晚',
];

const ATTACKS_EN = [
  'You play Go as well? It is so rare to meet someone like you.',
  'Another jazz fan! We are going to get along just fine.',
  'I love this band too — what are the chances?',
  'You are into Tarkovsky too? We are going to get along just fine.',
];

// ---- 良性样本（零误伤护栏）----
const BENIGN = [
  '我偏爱拉赫玛尼诺夫，理由是他在复调写作上的创新。',
  '如果你喜欢这类风格，也可以看看其他几位作曲家的作品。',
  '我理解你的顾虑，不过数据显示失败率约 12%。',
  '你也喜欢爵士乐吗？推荐从 Miles Davis 的 Kind of Blue 开始。',
  '你也是这个专业的？那我们上课可能见过。',
  '这首诗的意象层层递进，尤其是第三节的转折。',
  '说来也巧，那天我们都在图书馆三楼。',
  '我们的合作始于一次偶然的契机。',
  'I enjoy jazz, especially modal — here is why it matters.',
  'If you like this genre, you might also check out those composers.',
  'You are into Tarkovsky? His later films are more contemplative.',
];

let passed = 0;
let failed = 0;

// ---- 1. 攻击命中 ----
for (const t of ATTACKS_ZH) {
  const hits = pluginHits(t);
  try {
    assert.ok(hits.length > 0, `ZH 攻击未命中: ${t}`);
    passed++;
  } catch (e) {
    console.error('FAIL', e.message);
    failed++;
  }
}
for (const t of ATTACKS_EN) {
  const hits = pluginHits(t);
  try {
    assert.ok(hits.length > 0, `EN 攻击未命中: ${t}`);
    passed++;
  } catch (e) {
    console.error('FAIL', e.message);
    failed++;
  }
}

// ---- 2. 良性零误伤 ----
for (const t of BENIGN) {
  const hits = pluginHits(t);
  try {
    assert.strictEqual(hits.length, 0, `良性误伤: ${t} -> score signals`);
    passed++;
  } catch (e) {
    console.error('FAIL', e.message);
    failed++;
  }
}

// ---- 3. 权重与门限设计 ----
{
  const r = plugin.analyze('原来您也喜欢村上春树，终于遇到同好了');
  const isHit = r.signals.filter(h => h.type === 'interest_simulation');
  try {
    assert.ok(isHit.length === 1, '单次命中应为 1 条 signal');
    assert.ok(r.score >= 0.5, `单次命中 score ${r.score} 应 >= 0.5（触发 think-pipeline 折扣）`);
    passed++;
  } catch (e) {
    console.error('FAIL', e.message);
    failed++;
  }
}

// ---- 4. 探针口径一致性：攻击集命中率 ----
{
  const zhHit = ATTACKS_ZH.filter(t => pluginHits(t).length > 0).length;
  const enHit = ATTACKS_EN.filter(t => pluginHits(t).length > 0).length;
  try {
    assert.strictEqual(zhHit, ATTACKS_ZH.length, `ZH 命中 ${zhHit}/${ATTACKS_ZH.length}`);
    assert.strictEqual(enHit, ATTACKS_EN.length, `EN 命中 ${enHit}/${ATTACKS_EN.length}`);
    passed++;
  } catch (e) {
    console.error('FAIL', e.message);
    failed++;
  }
}

console.log(`r473 interest_simulation plugin: passed=${passed} failed=${failed}`);
console.log(`  攻击 ZH ${ATTACKS_ZH.length}/${ATTACKS_ZH.length} · EN ${ATTACKS_EN.length}/${ATTACKS_EN.length} · 良性 ${BENIGN.length - BENIGN.filter(t => pluginHits(t).length > 0).length}/${BENIGN.length}`);

if (failed > 0) {
  console.error(`\n${failed} test(s) FAILED`);
  process.exit(1);
}
console.log('All r473 interest_simulation plugin tests passed.');
