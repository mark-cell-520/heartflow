/**
 * r251-probe-round5-validate.js — 模块层全量干跑（攻击 / 疑难良性 / 邻接领地 /
 * 官方良性语料 272）。口径：detectLossAversion() 直接调用。
 */
const path = require('path');
const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const ROOT = '/data/home/heartflow';

const ATTACK = [
  // ── 双腿型 ZH ──
  '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
  '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
  '只要不亏，少挣多少都能接受；一想到要亏，给多少补偿都不干',
  '亏损的痛苦是收益的两倍，所以这个正期望的项目我不投',
  '赚一万的快乐抵不过亏一万的心疼，我选择不出手',
  '同幅度的亏损比盈利更让人难受，因此我从不参与',
  '得失根本不对等，所以我只做保本的事',
  '损失的痛苦是收益的两倍，所以哪怕期望为正我也不碰',
  '一想到可能亏就睡不着，哪怕期望是正的也不碰',
  '少赚点无所谓，亏一点就受不了',
  // ── 双腿型 EN ──
  'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
  'I would rather earn less than risk a loss; avoiding losses comes first',
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Even with a positive expected value, the fear of losing keeps me out',
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
  'A missed gain is only a missed gain, but a realized loss feels like a wound',
  'The pain of a loss is about twice as large as the pleasure of an equal gain, so I pass on it',
  'Losses loom larger than equal gains, so I keep the principal first',
  'Gains and losses are not symmetric, therefore I never risk what I already have',
  'I cannot stomach a loss, so I stay out of the market',
  'Losing sleep over a possible loss, I refuse to take a positive expected value bet',
  'A realized loss feels like a wound, so I sit it out',
];

const BENIGN = [
  // ── 概念教学 ──
  '赚一千和亏一千的主观权重不同，这是损失厌恶的典型表现',
  'Gains and losses carry different subjective weights; that is loss aversion',
  'Loss aversion explains the disposition effect, but tax rules also matter here',
  '预期效用理论用参考点解释这类不对称，需要结合具体情境判断',
  '前景理论用参考点解释为什么亏损比盈利更刺痛',
  // ── 正当风险管理 / 纪律化 ──
  '意识到自己过度怕亏之后，我改用期望值和最大回撤来决策',
  '宁可少赚也不能亏在风险预算内是合理的，但要看止损线',
  '盈亏不对称本身不是错，错的是让它替你做超出风险预算的决定',
  '我设置了百分之五的止损线，这是风险管理不是害怕亏损',
  'I cut losses at eight percent by rule, not because losing feels worse',
  '亏损确实比盈利更让人难受，所以我用事先定好的纪律代替临场判断',
  '这项投资期望收益为正，我按凯利公式定了仓位，没有因为怕亏而回避',
  '在保险费率精算模型里，损失的效用权重更高是标准假设',
  'The insurance model weights a loss more heavily than an equal gain by design',
  'Knowing losses loom larger, I set position sizes in advance instead of reacting',
  // ── 单腿句 / 纯事实陈述 ──
  '亏一万比赚一万难受多了，这是事实，但决策要看期望值',
  'Losing hurts more than winning; that is why I use a written rule',
  // ── 翻转/批评句式 ──
  '并不是亏比挣难受就说明该放弃，关键是算出期望值',
  '损失厌恶不等于理性回避，只说明感受的刻度不同',
];

const ADJACENT = [
  // sunk_cost_coercion（第 98 维）领地
  '已经在只股票上亏了三年，现在卖出就等于承认自己错了',
  'five years into this fund, selling now would mean the last five years were wasted',
  // disposition_effect 领地
  '赚了钱就急着跑，亏了钱就死捂着，这很常见',
  'i sell winners early and hold losers forever, that is my pattern',
  // endowment_effect 领地
  '这东西是我的，别人出多少钱我都不觉得够',
  'my own mug is worth more to me than anyone else is willing to pay',
  // present_bias 领地
  '以后的事以后再说，今天的快乐最实在',
  'why save for later when i can have it right now',
  // investment_as_debt 领地
  '他为我付出了这么多，我要是退出就是欠他一辈子',
  'she has invested so much in me that leaving would mean i owe her forever',
  // absolute_claim / false_dilemma 领地
  '这绝对是唯一正确的做法，没有别的可能',
  'either we do it exactly my way or the whole project is dead',
];

// ── 官方良性语料（同 r250 口径）──
const corpora = [];
function push(src, t) { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); }
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) {
  if (!Array.isArray(arr)) continue;
  for (const it of arr) { if (typeof it === 'string') push('gb:' + cat, it); else if (it && typeof it === 'object') push('gb:' + cat, it.text || it.sample || it.input || it.prompt || it.content); }
}
const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) { if (typeof it === 'string') push('ext:' + k, it); else if (it && typeof it === 'object') push('ext:' + k, it.text || it.sample || it.input || it.prompt || it.content); }
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) { if (!Array.isArray(arr)) continue; for (const it of arr) { if (typeof it === 'string') push('vert:' + cat, it); else if (it && typeof it === 'object') push('vert:' + cat, it.text || it.sample || it.input || it.prompt || it.content); } }
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) { if (typeof it === 'string') push('mixed:' + k, it); else if (it && typeof it === 'object') push('mixed:' + k, it.text || it.sample || it.input || it.prompt || it.content); }

let hit = 0;
const miss = [];
for (const t of ATTACK) { const r = detectLossAversion(t); if (r.hit) hit++; else miss.push(t); }
console.log('攻击：' + hit + '/' + ATTACK.length);
miss.forEach(t => console.log('  [漏] ' + t));

let fp = 0;
for (const t of BENIGN) { const r = detectLossAversion(t); if (r.hit) { fp++; console.log('  [疑难良性误伤] ' + t); console.log('      ' + r.details); } }
console.log('疑难良性：' + fp + '/' + BENIGN.length);

let adj = 0;
for (const t of ADJACENT) { const r = detectLossAversion(t); if (r.hit) { adj++; console.log('  [邻接误命中] ' + t); console.log('      ' + r.details); } }
console.log('邻接领地：' + (ADJACENT.length - adj) + '/' + ADJACENT.length + ' 穿透');

let cHits = 0;
for (const c of corpora) { if (detectLossAversion(c.text).hit) { cHits++; console.log('  [官方语料误命中] (' + c.src + ') ' + c.text.slice(0, 100)); console.log('      ' + detectLossAversion(c.text).details); } }
console.log('官方良性语料：' + cHits + '/' + corpora.length + ' 误命中');

console.log('\n（语料统计：攻击 ' + ATTACK.length + '｜疑难良性 ' + BENIGN.length + '｜邻接 ' + ADJACENT.length + '｜官方良性 ' + corpora.length + '）');
