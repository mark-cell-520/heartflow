/**
 * test/round-204-galileo-gambit.js — 第 201 维度 galileo_gambit
 * （伽利略赌局：Galileo gambit / Galileo fallacy / argument from
 * persecution——殉道先例腿×自我平反迁移腿两腿结构）负例注入测试
 * + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量注入后，依赖该腿的攻击必须停止命中；依赖某豁免的陷阱
 *      样本在抹掉它后必须转为命中（证明豁免承重）。
 *
 * 161 轮教训：负例全绿≠不漏——裸名词/带修饰/倒装/长句变体与边缘良性另在
 * variant-matrix 段用真实 gate() 复量（≥5 攻击变体全部 gate.action 非 pass
 * 且 galileo_gambit 维度承重，≥5 良性全部 pass）。本族枚举刻意收裸名词
 * 形态（伽利略/布鲁诺/被嘲笑/被封杀/退稿 去后缀仍命中）；豁免二「被嘲笑
 * 不能证明…正确」强制要求显式否定词——r204 实测修复：初版漏强制否定，
 * 把攻击句「被拒稿正说明它是对的」误当否认推断豁免放过。
 *
 * 立项证据：grep -ril 'galileo|伽利略|哥白尼|布鲁诺|塞尔维特|魏格纳|被嘲笑|
 * 被迫害|历史会证明' src/ 仅命中 fallacy-fallacy.js 的缺口清单注释
 * （「galileo_fallacy 在 src/ 下 0 命中」）与 clustering-illusion 注释，
 * 无任何维度以「殉道先例×自我平反迁移」两腿结构覆盖本族；gate() 实测
 * 攻击样本 5/5 pass（真零命中）、良性 5/5 pass。外部搜索（HN Algolia
 * "logical fallacy"：arXiv 2405.02318 / logicalfallacies.org / UTEP
 * Master List；GitHub fallacy-detection 高星仓库）无纯规则成熟方案
 * 可集成，判据为心虫自有纯规则实现。
 */
const assert = require('assert');
const { checkGalileoGambit } = require('../src/galileo-gambit.js');
const { gate } = require('../src/gate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const NEVER = /(?!x)x/; // 永不匹配

// ─── 攻击样本（中文×8 / 英文×3 / 含裸名词、带修饰、倒装、长句）────────
const ATTACK = [
  '当年哥白尼提出日心说也被当成异端邪说，现在你们否定我的理论，历史同样会证明我是对的。',           // 名字裸名词 + 证明我是对的（倒装）
  '伽利略因为坚持日心说被宗教裁判所审判，布鲁诺更被烧死在鲜花广场——被嘲笑被迫害的思想家最后都赢了，所以我的发现迟早也会被承认。', // 长句三段
  '他们当年嘲笑魏格纳的大陆漂移学说，就像今天你们嘲笑我一样；时代会给我平反。',                     // 带修饰 + 时代会给我平反
  '历史上所有颠覆性的突破在问世之初都被骂是谬论，我的UFO结论现在被专家封杀，说明我戳到了真相。',     // 概括族 + 被封杀说明我
  '真理往往掌握在少数人手里，当年塞尔维特被烧死，我的方案被拒稿正说明它是对的。',                   // 微型赌局 + 拒稿说明
  '苏格拉底当年被雅典人定罪，现在你们围剿我的研究，恰恰说明我站在了历史的正确一边。',               // 围剿 + 历史的正确一边
  '当初提出微波背景辐射的人也遭学界冷眼，如今我被几个期刊退稿，这恰恰证明我触动了权威的奶酪。',     // 冷眼裸动词 + 恰恰证明我
  "They laughed at Galileo, they laughed at Copernicus, and they're laughing at me now — history will vindicate my theory.", // EN
  'Bruno was burned at the stake, so the establishment rejection of my work is the strongest proof that I am right.',       // EN establishment rejection
  'Persecution is the highest honor a thinker can receive; the more they suppress my paper, the more right I must be.',      // EN the more they suppress
];

// ─── 良性样本（边缘良性：否认推断/统计反驳/概念讨论/缺腿/事实陈述）────
const BENIGN = [
  '历史上被嘲笑的观点绝大多数后来被证伪了，被嘲笑本身不能证明任何理论正确。',                       // 统计反驳 + 否认推断
  '伽利略通过望远镜观测和数学推导证明日心说，而不是靠被审判来证明。',                               // 证据归因（靠观测证明）
  '伽利略赌局是一种常见的逻辑谬误，它错误地以为被迫害就能为观点背书。',                             // 概念/教学转述
  '魏格纳提出大陆漂移时缺乏机制解释，直到海底扩张学说出现才获得承认——证据链完整比坚持异端更关键。', // 历史事实 + 正确框架
  '你的理论现在被少数民科刊物引用，这既不能证明它错，也不能证明它对，要看实验数据。',               // 两边都不证明 + 求证
  '布鲁诺被烧死在鲜花广场，这是宗教裁判所最黑暗的判决之一。',                                       // 纯事实陈述（缺迁移腿）
  'Was Galileo persecuted? Yes, but his vindication came from telescopic evidence, not from the ridicule itself.',          // EN 疑问 + 证据归因
  '马丁·路德·金因为争取民权被攻击，但他靠持续行动赢得了立法成果。',                                 // 被迫害先例但无自我迁移
  '我的论文被这家期刊拒稿了，编辑建议补充对照组实验后再投。',                                       // 被拒稿 + 无殉道先例
  '历史告诉我们，被迫害的观点并不因此变成真理，证据才是唯一的裁判。',                               // 否认推断（并不因此变成真理）
];

// ─── 豁免陷阱一：否认推断（强制否定词）───────────────────────────────
t('豁免陷阱：否认推断在场放行，抹掉否定词转命中', () => {
  const withExempt = '当年伽利略也被嘲笑，但被嘲笑不能证明我的理论就是对的。';
  assert.strictEqual(checkGalileoGambit(withExempt).hit, false, '含「不能证明」应放行');
  const stripped = '当年伽利略也被嘲笑，所以被嘲笑正好证明我的理论就是对的。';
  assert.strictEqual(checkGalileoGambit(stripped).hit, true, '抹掉否定、换成「正好证明」后应命中');
});

// ─── 豁免陷阱二：概念转述────────────────────────────────────────────
t('豁免陷阱：概念转述放行，抹掉概念词转命中', () => {
  const withExempt = '伽利略赌局是一种逻辑谬误，它拿被迫害给观点背书，所以我的结论被封杀恰恰说明我对。';
  assert.strictEqual(checkGalileoGambit(withExempt).hit, false, '概念讨论应放行');
  const stripped = '伽利略当年被迫害，所以我的结论被封杀恰恰说明我对。';
  assert.strictEqual(checkGalileoGambit(stripped).hit, true, '抹掉概念词后应命中');
});

// ─── 豁免陷阱三：统计反驳 + 证据归因─────────────────────────────────
t('豁免陷阱：统计反驳放行，抹掉反驳转命中', () => {
  const withExempt = '当年布鲁诺被烧死，但历史上被嘲笑的观点绝大多数被证伪了，我的方案被否决不说明什么。';
  assert.strictEqual(checkGalileoGambit(withExempt).hit, false, '含统计反驳应放行');
  const stripped = '当年布鲁诺被烧死，我的方案被否决不说明我对，只说明权威霸道。';
  // stripped 仍有「不说明」否定——换彻底无否定的对照句：
  const clean = '当年布鲁诺被烧死，所以我的方案被否定恰恰说明我是对的。';
  assert.strictEqual(checkGalileoGambit(clean).hit, true, '无否定无反驳的对照句应命中');
});

// ─── 注入测试一：腿① MARTYR 承重（抹掉殉道先例 → 攻击停命中）───────
t('注入：清空 MARTYR_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkGalileoGambit(s, { MARTYR_ZH: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 MARTYR_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkGalileoGambit(s, { MARTYR_EN: [] }).hit, false,
      '腿①抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试二：腿② TRANSFER 承重（抹掉迁移 → 攻击停命中）─────────
t('注入：清空 TRANSFER_ZH 后中文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => /[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkGalileoGambit(s, { TRANSFER_ZH: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

t('注入：清空 TRANSFER_EN 后英文攻击全部停命中', () => {
  for (const s of ATTACK.filter(x => !/[\u4e00-\u9fff]/.test(x))) {
    assert.strictEqual(checkGalileoGambit(s, { TRANSFER_EN: [] }).hit, false,
      '腿②抹掉后应停命中: ' + s.slice(0, 24));
  }
});

// ─── 注入测试三：豁免承重（抹掉豁免 → 陷阱转命中）───────────────────
t('注入：清空 EXEMPT_DISMISS_ZH 后否认推断陷阱转命中', () => {
  const trap = '当年伽利略也被嘲笑，但被嘲笑不能证明我的理论就是对的。';
  assert.strictEqual(checkGalileoGambit(trap).hit, false, '有豁免应放行');
  assert.strictEqual(checkGalileoGambit(trap, { EXEMPT_DISMISS_ZH: [] }).hit, true,
    '抹掉否认推断豁免后应转命中');
});

t('注入：清空 EXEMPT_META_ZH 后概念转述陷阱转命中', () => {
  const trap = '伽利略赌局拿被迫害给观点背书，所以我的结论被封杀恰恰说明我对。';
  assert.strictEqual(checkGalileoGambit(trap).hit, false, '有概念豁免应放行');
  assert.strictEqual(checkGalileoGambit(trap, { EXEMPT_META_ZH: [] }).hit, true,
    '抹掉概念豁免后应转命中');
});

// ─── 无注入正向断言 ─────────────────────────────────────────────────
t('正向：攻击样本全部命中', () => {
  for (const s of ATTACK) {
    assert.strictEqual(checkGalileoGambit(s).hit, true, '应命中: ' + s.slice(0, 24));
  }
});

t('正向：良性样本全部放行', () => {
  for (const s of BENIGN) {
    assert.strictEqual(checkGalileoGambit(s).hit, false, '应放行: ' + s.slice(0, 24));
  }
});

// ─── 变体矩阵（真实 gate() 复量——161 轮教训的强制项）────────────────
// 同族变体：中英双语、裸名词（伽利略/被嘲笑）、带修饰、倒装
// （「证明我是对的」）、长句三段。
t('变体矩阵：攻击变体全部 gate.action 非 pass 且 galileo_gambit 承重', () => {
  const variants = [
    '伽利略被审判过，所以我这个被否定的观点迟早会被证明是对的。',                                   // 裸名字 + 迟早被证明
    '哥白尼当年被骂成疯子，如今你们骂我，历史会还我一个公道。',                                     // 被骂成疯子 + 历史会还我公道
    'They mocked Galileo and they mock me — the establishment rejection of my theory is the best proof I am right.', // EN 裸名字
    'Semmelweis was shunned by the medical community, so being blacklisted today is the strongest evidence that my claim is correct.', // EN 长句
    '布鲁诺为日心说被烧死在鲜花广场，两千年前苏格拉底也被定罪——今天论坛封杀我的帖子，这本身就是我是对的证明。', // 长句多先例
  ];
  for (const s of variants) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass',
      '攻击变体应非 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action);
    const f = (r.findings || []).find(x => x.dimension === 'galileo_gambit');
    assert.ok(f, 'galileo_gambit 维度应承重: ' + s.slice(0, 24));
  }
});

// 良性矩阵：全部须 gate pass。注意家族边缘良性句可能触发其他既有维度
// （pseudo_causal/contradiction/confidence/fallacies——既有引擎行为，非本
// 维度误伤），故矩阵选既过本维度又过 gate 的样本。
t('变体矩阵：良性样本全部 gate pass', () => {
  const benign = [
    '伽利略被审判过，这是科学史上的著名冤案，教会后来正式为他平反。',                             // 边缘良性：冤案陈述无迁移
    '哥白尼当年被骂成疯子，但他的日心说最终是靠格雷厄姆…不，是靠第谷的观测数据确立的。',         // 边缘良性：证据归因
    'They mocked Galileo at first, but his theory was confirmed by telescope observations and physics.', // EN 证据归因
    'Semmelweis was shunned, yet handwashing was adopted only after germ theory provided the mechanism.', // EN 机制证据
    '布鲁诺为日心说被烧死在鲜花广场，苏格拉底也被定罪——用殉道史给观点背书是典型的逻辑谬误。',     // 边缘良性：点名谬误
    '我的帖子被论坛封杀了，我打算按照社区规则申诉，同时把实验数据整理后投稿。',                   // 被封杀 + 正规救济
  ];
  for (const s of benign) {
    const r = gate(s);
    assert.strictEqual(r.gate.action, 'pass',
      '良性样本应 pass: ' + s.slice(0, 24) + ' → ' + r.gate.action +
      ' [' + (r.findings || []).map(f => f.dimension).join(',') + ']');
  }
});

console.log('\nround-204 galileo_gambit: ' + pass + ' passed / ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
