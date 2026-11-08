/**
 * test/loss-aversion.test.js — r251 损失厌恶维度测试
 * 覆盖：攻击命中（双腿型中英 + 独腿签名中英）、良性零误伤（含疑难 FP 压力
 * 样本）、两组豁免族（概念教学 / 正当风险管理，嵌入真实签名，可负例注入
 * 证明承重）、边界锁（单腿句 / 邻接维度领地 / 防自证同跨度 / 超距 / 倒装）、
 * 多签名档位、负例注入（腿①六组 / 腿②六组 / 独腿 7+8 条逐条 / 距离窗双向
 * 承重 / 两组豁免逐组删除）、官方良性语料 272、引擎闸。
 * 与 r218-r250 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectLossAversion, __internals } = require('../src/loss-aversion.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

// ─── 攻击样本 A：双腿型（腿①权重不对称 × 腿②避损决策，邻近共现）─────
// 注入 NO_ASYM / NO_AVOID / W=0 均应失配（已逐条验证为纯双腿句）
const ATTACK_2LEG_ZH = [
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '同幅度的亏损比盈利更让人难受，因此我从不参与',
  '亏一万比赚一万更疼，所以我选择不出手',
  '赚一千的开心压不住亏一万的心疼，宁可什么都不做',
  '赚一万的快乐抵不过亏一万的心疼，我选择不出手',
  '亏一万的心疼大于赚一万的快乐，所以我先保本',
  '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
  '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
  '得失根本不对等，所以我只做保本的事',
  '亏损的痛苦是收益的两倍，所以这个正期望的项目我不投',
  '亏一万比赚一万难受多了，所以宁可什么都不做',
  '同幅度的亏损比盈利更让人难受，亏起来整晚睡不着',
  '同幅度的亏损比盈利更难受，所以这个正期望的项目我照样先放一放',
  // 倒装：决策在前、权重陈述在后
  '先保本，因为亏一万比赚一万难受多了',
];
const ATTACK_2LEG_EN = [
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
  'The pain of a loss is about twice as large as the pleasure of an equal gain, so I pass on it',
  'Losses loom larger than equal gains, so I keep the principal first',
  'Losing a hundred stings far more than winning a hundred thrills, so I stay defensive',
  'The pain of losing is twice the pleasure of gaining, so I protect the downside first',
];

// ─── 攻击样本 B：独腿签名（SOLO，一句话内部自带完整损失厌恶结构）─────
// 每条与 SOLO[n] 一一对应，删除该条后必须失配（在 NO_BOTH 隔离下验证）
const SOLO_ZH_ATTACKS = [
  '宁可少赚也不能亏，这是我一贯的规矩',              // S0 偏好倒置
  '少赚点无所谓，亏一点就受不了',                    // S1 权重对比
  '只要不亏，少挣多少都能接受',                      // S2 保本换少赚
  '一想到要亏，给多少补偿都不干',                    // S3 补偿免疫
  '损失的痛苦是收益的两倍，所以哪怕期望为正我也不碰', // S4 正期望仍拒
  '一想到可能亏就睡不着，什么正期望都拉不回我',       // S5 情绪化避损
  '亏一点就心慌，我选择躺平',                        // S6 亏即心慌+不作为
];
const SOLO_EN_ATTACKS = [
  'I would rather earn less than risk a loss',                    // E0 偏好倒置
  'Earning less is fine as long as I avoid a loss',               // E1 少赚可接受
  'Even with a positive expected value, the fear of losing keeps me out', // E2 正期望仍拒
  'The joy of gaining a thousand does not offset the pain of losing one, so do nothing', // E3 赚悦压不住亏痛
  'A missed gain is only a missed gain, but a realized loss feels like a wound', // E4 错过≠实亏
  'I lose sleep over a loss, so I stay out of the market',        // E5 亏致失眠
  'I cannot stomach a loss, so I stay out of the market',         // E6 亏不可承受
  'I never risk what I already have',                             // E7 绝不冒险
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 概念教学（讨论损失厌恶这个概念本身）
  '赚一千和亏一万的主观权重不同，这是损失厌恶的典型表现',
  'Gains and losses carry different subjective weights; that is loss aversion',
  'Loss aversion explains the disposition effect, but tax rules also matter here',
  '预期效用理论用参考点解释这类不对称，需要结合具体情境判断',
  '前景理论用参考点解释为什么亏损比盈利更刺痛',
  'A loss hurts about twice as much as an equal gain pleases — that is textbook loss aversion',
  // 正当风险管理 / 纪律化决策
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
  'Losing a hundred stings far more than winning a hundred thrills, so I sit out — that is why I set position sizes in advance',
  // 单腿句 / 纯事实陈述（无决策腿）
  '亏一万比赚一万难受多了，这是事实，但决策要看期望值',
  'Losing hurts more than winning; that is why I use a written rule',
  // 翻转 / 批评句式
  '并不是亏比挣难受就说明该放弃，关键是算出期望值',
  '损失厌恶不等于理性回避，只说明感受的刻度不同',
  // 邻接维度领地（sunk_cost / disposition / endowment / present_bias / investment_as_debt）
  '已经在只股票上亏了三年，现在卖出就等于承认自己错了',
  'five years into this fund, selling now would mean the last five years were wasted',
  '赚了钱就急着跑，亏了钱就死捂着，这很常见',
  'i sell winners early and hold losers forever, that is my pattern',
  '这东西是我的，别人出多少钱我都不觉得够',
  'my own mug is worth more to me than anyone else is willing to pay',
  '以后的事以后再说，今天的快乐最实在',
  'why save for later when i can have it right now',
  '他为我付出了这么多，我要是退出就是欠他一辈子',
  'she has invested so much in me that leaving would mean i owe her forever',
  // 工程/运维常识（与「能跑就不要动」式表述同形的压力样本）
  '能跑就不要动，除非有明确的性能数据支持',
  "if it ain't broke don't fix it, but the benchmark says otherwise",
];

// 防自证：同一段话不能既当权重陈述又当避损决策
const SELF_EVIDENCE = '亏一万比赚一万难受多了，这是事实，但决策要看期望值';

// 超距样本：默认窗 W_ZH=60 内两腿不共现
const OVERDIST = '亏一万比赚一万难受多了' + '，'.repeat(80) + '先保本';

// 多签名样本
const MULTI_ZH = '亏一万比赚一万难受多了，所以先保本；赚一万的快乐抵不过亏一万的心疼，我选择不出手';
const MULTI_MIXED = '亏一万比赚一万难受多了，所以先保本。A loss hurts about twice as much as an equal gain pleases, so stay defensive';

// 距离窗负例句：两腿分离（dist>0），W=0 即失配
const W0_ZH = [
  '同样的数目，赔一块比挣一块难受多了，所以先保本',
  '先保本，因为亏一万比赚一万难受多了',
  '同幅度的亏损比盈利更难受，所以我宁可不赚',
  '同幅度的亏损比盈利更让人难受，亏起来整晚睡不着',
];
const W0_EN = [
  'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
  'Losses loom larger than equal gains, so I keep the principal first',
];

const NO_ASYM = { ASYM_CMP_ZH: [], ASYM_OUTWEIGH_ZH: [], ASYM_COMPENSATE_ZH: [], ASYM_ASYMMETRY_ZH: [], ASYM_MULTIPLE_ZH: [], ASYM_EN: [] };
const NO_AVOID = {
  AVOID_RATHER_ZH: [], AVOID_CAPITAL_ZH: [], AVOID_REFUSE_ZH: [], AVOID_EMOTION_ZH: [],
  AVOID_LOCKIN_ZH: [], AVOID_POSITIVE_EV_ZH: [], AVOID_POS_EV_ZH: [], AVOID_POS_EV_EN: [], AVOID_EN: [],
};
const NO_BOTH = Object.assign({}, NO_ASYM, NO_AVOID);
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿①六组（含逐族独占句）
const ASYM_GROUPS = [
  ['ASYM_CMP_ZH', ['同样的数目，赔一块比挣一块难受多了，所以先保本', '亏一万比赚一万更疼，所以我选择不出手', '同幅度的亏损比盈利更让人难受，因此我从不参与']],
  ['ASYM_OUTWEIGH_ZH', ['赚一万的快乐抵不过亏一万的心疼，我选择不出手', '亏一万的心疼大于赚一万的快乐，所以我先保本', '赚一千的开心压不住亏一万的心疼，宁可什么都不做']],
  ['ASYM_COMPENSATE_ZH', ['亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险']],
  ['ASYM_ASYMMETRY_ZH', ['涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等', '得失根本不对等，所以我只做保本的事']],
  ['ASYM_MULTIPLE_ZH', ['亏损的痛苦是收益的两倍，所以这个正期望的项目我不投']],
  ['ASYM_EN', ['A loss hurts about twice as much as an equal gain pleases, so stay defensive', 'Losses loom larger than equal gains, so I keep the principal first']],
];
// 腿②六组（「正期望仍拒」腿的三个子族作为一组删除）
const AVOID_GROUPS = [
  [['AVOID_RATHER_ZH'], ['同幅度的亏损比盈利更难受，所以我宁可不赚']],
  [['AVOID_CAPITAL_ZH'], ['同样的数目，赔一块比挣一块难受多了，所以先保本', '先保本，因为亏一万比赚一万难受多了']],
  [['AVOID_REFUSE_ZH'], ['同幅度的亏损比盈利更让人难受，因此我从不参与', '赚一万的快乐抵不过亏一万的心疼，我选择不出手', '亏一万比赚一万更疼，所以我选择不出手']],
  [['AVOID_EMOTION_ZH'], ['同幅度的亏损比盈利更让人难受，亏起来整晚睡不着']],
  [['AVOID_LOCKIN_ZH'], ['涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等']],
  [['AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH', 'AVOID_POS_EV_EN'], ['同幅度的亏损比盈利更难受，所以哪怕期望为正我也不为所动', '同幅度的亏损比盈利更难受，所以这个正期望的项目我照样先放一放', 'A loss hurts twice as much as an equal gain pleases; even with a positive expected value I would not commit capital']],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectLossAversion, 'function');
  const r = detectLossAversion('赚一千的开心压不住亏一千的心疼，宁可什么都不做');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'loss_aversion');
  assert.ok(r.details && r.details.includes('损失厌恶'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('loss-aversion'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectLossAversion(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectLossAversion(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectLossAversion(t).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectLossAversion(t).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本', () => {
  for (const t of BENIGN_HARD) assert.equal(detectLossAversion(t).hit, false, '误伤: ' + t);
});

check('防自证：同跨度不得一话两证', () => {
  assert.equal(detectLossAversion(SELF_EVIDENCE).hit, false);
});

check('档位：单签名 0.62 / 多签名 0.72', () => {
  const one = detectLossAversion('亏一万比赚一万难受多了，所以先保本');
  assert.equal(one.hit, true);
  assert.equal(one.count, 1);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = detectLossAversion(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = detectLossAversion(MULTI_MIXED);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：腿①权重不对称陈述整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectLossAversion(t, NO_ASYM).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectLossAversion(t, NO_ASYM).hit, false, '删腿①EN: ' + t);
});

check('负例注入：腿②避损决策整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectLossAversion(t, NO_AVOID).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectLossAversion(t, NO_AVOID).hit, false, '删腿②EN: ' + t);
});

check('负例注入：腿①六组逐组删除后该组独占攻击失配', () => {
  for (const [g, list] of ASYM_GROUPS) {
    const inj = {}; inj[g] = [];
    for (const t of list) {
      assert.equal(detectLossAversion(t).hit, true, '默认应命中: ' + t);
      assert.equal(detectLossAversion(t, inj).hit, false, '删 ' + g + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿②六组逐组删除后该组独占攻击失配', () => {
  for (const [keys, list] of AVOID_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    for (const k of keys) inj[k] = [];
    for (const t of list) {
      assert.equal(detectLossAversion(t).hit, true, '默认应命中: ' + t);
      assert.equal(detectLossAversion(t, inj).hit, false, '删 ' + keys.join('+') + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_BOTH 隔离双腿）', () => {
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(detectLossAversion(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectLossAversion(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(detectLossAversion(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectLossAversion(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectLossAversion(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectLossAversion(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectLossAversion(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectLossAversion(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(detectLossAversion(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(detectLossAversion(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of W0_ZH) assert.equal(detectLossAversion(t, { W_ZH: 0 }).hit, false, 'W_ZH=0: ' + t);
  for (const t of W0_EN) assert.equal(detectLossAversion(t, { W_EN: 0 }).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '亏一万比赚一万难受多了，这是损失厌恶的典型表现，所以我先保本';
  const en = 'A loss hurts about twice as much as an equal gain pleases — that is textbook loss aversion, so stay defensive';
  assert.equal(detectLossAversion(zh).hit, false, '概念教学ZH 默认豁免');
  assert.equal(detectLossAversion(zh, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(detectLossAversion(en).hit, false, '概念教学EN 默认豁免');
  assert.equal(detectLossAversion(en, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：正当风险管理豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '宁可少赚也不能亏在风险预算内是合理的，但要看止损线';
  const en = 'Losing a hundred stings far more than winning a hundred thrills, so I sit out — that is why I set position sizes in advance';
  assert.equal(detectLossAversion(zh).hit, false, '正当风险管理ZH 默认豁免');
  assert.equal(detectLossAversion(zh, { CORRECTIVE_ZH: NEVER }).hit, true, '删正当风险管理ZH 后变红');
  assert.equal(detectLossAversion(en).hit, false, '正当风险管理EN 默认豁免');
  assert.equal(detectLossAversion(en, { CORRECTIVE_EN: NEVER }).hit, true, '删正当风险管理EN 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '亏']) {
    const r = detectLossAversion(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 272 条零误命中', () => {
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 270, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (detectLossAversion(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：模块未接线时 gate() 不得出现 loss_aversion findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('loss_aversion'), '误伤: ' + t);
  }
  // 模块未接线（provisional 239），接线规格由 1 号按报告 §五 补全；此处
  // 只锁定「不因本模块引入新误伤」与「gate 返回结构完整」。
  const out = gate('赚一千的开心压不住亏一千的心疼，宁可什么都不做');
  assert.ok(out && typeof out.gate === 'object', 'gate 返回结构完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
