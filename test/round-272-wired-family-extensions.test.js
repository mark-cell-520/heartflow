'use strict';
/**
 * test/round-272-wired-family-extensions.test.js
 * [r272] 四个已接线 VERIFY 维度的全新措辞家族扩展（真升级②，live 生效，
 * 维度计数不变 240、src/index.js 零改动、VERSION 未 bump）。
 *
 * r272 池化探针实测（/data/home/.hermes/cache/scratch/r272-full-probe.js，
 * 对 /data/home/heartflow/src/gate.js）：25 条全新自然措辞攻击在 HEAD 上
 * 20 条 gate.action=pass 且零维度承重，落地 4 个维度共 12 个子族：
 *
 *   A. base_rate_neglect
 *      SIGNAL_ZH   += 生物特征比对族（人脸/指纹/DNA 比对、比中、比对结果）
 *      CONFIDENT_ZH+= 推断标记×裸置信修饰×归属结论（说明/意味着/可见 +
 *                    基本/大概率/多半 + 得/患/是/嫌疑人，无「肯定/可能」字样）
 *      CONFIDENT_ZH+= 裸置信口语收尾（基本没跑/基本稳了/基本定案）
 *      CONFIDENT_EN+= basically/effectively means you have … / very likely to be
 *   B. conjunction_fallacy
 *      CMP_BACK_ZH / CMP_ANCHOR_ZH += 单纯/单单/光 三个口语对比锚
 *      CMP_PROB_ZH += 更有机会/更有胜算
 *      fix: r270 本族补 inject 钩子（此前 CONJ_CMP_PROB_ZH/ANCHOR 是启动
 *           时烧死的模块级正则，负例注入完全无法触达）
 *   C. simpsons_paradox
 *      TREND_UP_ZH/EN  += 盈利/赚钱/扭亏/跑赢、profitable/in the black
 *      TREND_DOWN_ZH/EN+= 亏损/赔钱/亏本/跑输、losing money/in the red
 *      AFFIRM_ZH       += 经营决策结论族（能做/可行/继续扩张/加大投入）
 *   D. common_cause
 *      COVARY_MOVE_ZH  += 口语共变族（X多的时候Y也多 / 越X越Y）
 *      COVARY_MOVE_EN  += 比较级平行共变族（the -er … the more）
 *      CAUSE_ZH        += 裸「致」因果动词（冰淇淋致溺水）
 *      NO_CONFOUND_EN  += 口语共同原因形（summer drives both）——修存量 FP
 *
 * 覆盖：新攻击矩阵（EN+ZH）+ 新良性零误伤 + gate 层接线 + 逐新模式
 * 注入-删条承重 + 存量回归 + 登记。
 */
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const brnMod = require(path.join(ROOT, 'src', 'base-rate-neglect.js'));
const cfMod = require(path.join(ROOT, 'src', 'conjunction-fallacy.js'));
const spMod = require(path.join(ROOT, 'src', 'simpsons-paradox.js'));
const ccMod = require(path.join(ROOT, 'src', 'common-cause.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

// 永假式正则：负例注入用（模块内 pickRe/anyHit 语义）
const NEVER = /(?!x)x/;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (mod, s, inj) => mod(s, inj).hit === true;

// ─── 1. 新攻击矩阵 ────────────────────────────────────────────────
const ATTACKS = {
  base_rate_neglect: [
    '筛查阳性就说明基本得了这个病。',
    '人脸比对上了，基本没跑。',
    '指纹比中了，基本可以定案。',
    '系统把你标记成匹配对象，这意味着你大概率就是内鬼。',
    '两道杠都出来了，十有八九是怀上了。',
    '他符合嫌疑人的画像，可见八成就是那个人。',
    'DNA比对结果出来了，说明大概率是他。',
    'The test came back positive, which basically means you have the disease.',
    'The algorithm flagged him, so he is most likely the fraud.',
    'He matched the profile, which means he is very likely guilty.',
    'The scan lit up, which effectively means she is a match.',
  ],
  conjunction_fallacy: [
    '他既是会计又懂音乐，比单纯是会计更可能升上去。',
    '既会写代码又懂产品，比光会写代码更容易当上负责人。',
    '她既懂技术又会带人，比单单懂技术更有机会进管理层。',
    '既是冠军又是教练，比仅仅是冠军更可能带出冠军。',
    // 路线 a（CMP_OP × CMP_BACK）专用形：无「比…单是」锚，只有 单纯 + 比较算子
    '他既是会计又懂音乐，升职的希望更大，单纯是会计的可排不上。',
    'She is both an engineer and a designer, more likely to lead than merely an engineer.',
  ],
  simpsons_paradox: [
    '总体算下来是赚钱的，可见这门生意能做，然而每个区域都在赔钱。',
    '合并两个渠道看转化率是上升的，因此改版是成功的，但单独看每个渠道都在下降。',
    '汇总三个季度的账是盈利的，因此可以继续扩张，然而每一个季度都在亏损。',
  ],
  common_cause: [
    '冰淇淋销量和溺水人数一起走高，冰淇淋卖得多的时候溺水也多，所以冰淇淋致溺水。',
    '空调和用电负荷越涨越高，所以空调致电网压力上升。',
    '加班和离职率同步上升，加班多的时候离职也多，所以加班致离职。',
    'Ice cream sales and drowning both climb; the hotter it gets, the more of each we see, so ice cream causes drowning.',
  ],
};
const MODS = {
  base_rate_neglect: brnMod.checkBaseRateNeglect,
  conjunction_fallacy: cfMod.checkConjunctionFallacy,
  simpsons_paradox: spMod.checkSimpsonsParadox,
  common_cause: ccMod.checkCommonCause,
};
let atkTotal = 0;
for (const dim of Object.keys(ATTACKS)) {
  const fn = MODS[dim];
  ATTACKS[dim].forEach((s, i) => t('攻击-' + dim + '-' + (i + 1), () => {
    assert.strictEqual(hit(fn, s), true, '未命中: ' + s);
  }));
  atkTotal += ATTACKS[dim].length;
}

// ─── 2. 新良性样本（零误伤）──────────────────────────────────────
const BENIGN = {
  base_rate_neglect: [
    '初筛阳性需要复查确认，不能据此断定患病。',
    '阳性预测值取决于患病率与假阳性率。',
    '系统标记了三个候选，还需要人工复核。',
    '人脸比对结果需人工复核后才能作为线索。',
    '指纹比中不等于就是嫌疑人，还要排除巧合。',
    'A positive result alone is not conclusive; we need a confirmation test.',
    'The model ranked three candidates; a human still reviews the shortlist.',
    'The flag is a signal to review, not a verdict.',
  ],
  conjunction_fallacy: [
    '既便宜又耐用更容易卖出去。',
    '兼具两者优势的方案更稳妥。',
    '既是会计又懂音乐的人，职业选择面更宽。',
    '比单纯的努力更重要的是方法对不对。',
    'Being both an engineer and a designer widens your career options.',
  ],
  simpsons_paradox: [
    '总体盈利，每个门店也都盈利，说明经营健康。',
    '合并看整体亏损，但每一家门店都盈利，说明还有结构性亮点。',
    '总体和分层数据方向相反，需要分层解读再下结论。',
    '总体亏损但每个门店盈利，这是辛普森悖论的典型形态。',
    '整体盈利且每个渠道都盈利，可以推广。',
  ],
  common_cause: [
    '冰淇淋销量和溺水人数相关，但这不等于冰淇淋导致溺水。',
    '两者相关，可能存在共同原因（天气炎热）。',
    '相关不等于因果，需要控制混杂因素。',
    '加班与离职率相关，未必说明加班导致离职。',
    'Ice cream sales and drowning are correlated, but correlation is not causation.',
    'The heat wave is a common cause; both metrics are driven by it.',
  ],
};
for (const dim of Object.keys(BENIGN)) {
  const fn = MODS[dim];
  BENIGN[dim].forEach((s, i) => t('良性-' + dim + '-' + (i + 1), () => {
    assert.strictEqual(hit(fn, s), false, '误伤: ' + s);
  }));
}

// ─── 3. gate 层接线（findings 含本维度）──────────────────────────
for (const dim of Object.keys(ATTACKS)) {
  ATTACKS[dim].forEach((s, i) => t('gate-' + dim + '-' + (i + 1), () => {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 仍为 pass: ' + s);
    const f = (r.findings || []).find((x) => x.dimension === dim);
    assert.ok(f, 'findings 应含 ' + dim + ': ' + s);
  }));
}

// ─── 4. 逐新模式注入-删条承重（删除后攻击须转 miss）──────────────
// 单正则常量注入永假式；数组常量注入空数组（TREND 等单正则型注入永假式）。
const INJECTIONS = [
  { dim: 'base_rate_neglect', key: 'SIGNAL_ZH', val: [], atk: '指纹比中了，基本可以定案。' },
  { dim: 'base_rate_neglect', key: 'CONFIDENT_ZH', val: [], atk: '筛查阳性就说明基本得了这个病。' },
  { dim: 'base_rate_neglect', key: 'CONFIDENT_ZH', val: [], atk: '人脸比对上了，基本没跑。' },
  { dim: 'base_rate_neglect', key: 'CONFIDENT_EN', val: [], atk: 'The test came back positive, which basically means you have the disease.' },
  { dim: 'base_rate_neglect', key: 'CONFIDENT_EN', val: [], atk: 'He matched the profile, which means he is very likely guilty.' },
  { dim: 'conjunction_fallacy', key: 'CMP_BACK_ZH', val: [], atk: '他既是会计又懂音乐，升职的希望更大，单纯是会计的可排不上。' },
  { dim: 'conjunction_fallacy', key: 'CONJ_CMP_ANCHOR_ZH', val: NEVER, atk: '她既懂技术又会带人，比单单懂技术更有机会进管理层。' },
  { dim: 'conjunction_fallacy', key: 'CONJ_CMP_PROB_ZH', val: NEVER, atk: '既会写代码又懂产品，比光会写代码更容易当上负责人。' },
  { dim: 'simpsons_paradox', key: 'TREND_UP_ZH', val: NEVER, atk: '总体算下来是赚钱的，可见这门生意能做，然而每个区域都在赔钱。' },
  { dim: 'simpsons_paradox', key: 'TREND_DOWN_ZH', val: NEVER, atk: '合并两个渠道看转化率是上升的，因此改版是成功的，但单独看每个渠道都在下降。' },
  { dim: 'simpsons_paradox', key: 'AFFIRM_ZH', val: [], atk: '汇总三个季度的账是盈利的，因此可以继续扩张，然而每一个季度都在亏损。' },
  { dim: 'common_cause', key: 'COVARY_MOVE_ZH', val: [NEVER], atk: '加班和离职率同步上升，加班多的时候离职也多，所以加班致离职。' },
  { dim: 'common_cause', key: 'COVARY_MOVE_ZH', val: [NEVER], atk: '空调和用电负荷越涨越高，所以空调致电网压力上升。' },
  { dim: 'common_cause', key: 'CAUSE_ZH', val: [NEVER], atk: '冰淇淋销量和溺水人数一起走高，冰淇淋卖得多的时候溺水也多，所以冰淇淋致溺水。' },
  { dim: 'common_cause', key: 'COVARY_MOVE_EN', val: [NEVER], atk: 'Ice cream sales and drowning both climb; the hotter it gets, the more of each we see, so ice cream causes drowning.' },
];
INJECTIONS.forEach((c, i) => t('注入-' + (i + 1) + '-' + c.dim + '.' + c.key, () => {
  const fn = MODS[c.dim];
  const inj = {};
  inj[c.key] = c.val;
  assert.strictEqual(hit(fn, c.atk), true, '正向命中: ' + c.atk);
  assert.strictEqual(hit(fn, c.atk, inj), false, '删 [' + c.key + '] 后攻击须转 miss（承重证明）: ' + c.atk);
}));

// ─── 5. 存量回归（各维度旧攻击矩阵不翻转）───────────────────────
t('存量回归-base_rate_neglect', () => {
  const old = [
    '筛查阳性，所以你几乎肯定得了这个病。',
    '他被系统标记了，说明他很可能就是内鬼。',
    '检测呈阳性，所以你几乎肯定感染了。',
    'The test came back positive, so you almost certainly have the disease.',
    'The system flagged him, which means he is very likely guilty.',
  ];
  for (const s of old) assert.strictEqual(hit(brnMod.checkBaseRateNeglect, s), true, '存量攻击翻转: ' + s);
});
t('存量回归-conjunction_fallacy', () => {
  const old = [
    '琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。',
    '又会作曲又能开巡演，评上年度音乐人的希望比只会作曲的指望高。',
    'The probability that Linda is both a bank teller and a feminist is higher than the probability that she is a bank teller.',
    'Someone who can both write and present has a better shot at the offer than someone who can only write.',
  ];
  for (const s of old) assert.strictEqual(hit(cfMod.checkConjunctionFallacy, s), true, '存量攻击翻转: ' + s);
});
t('存量回归-simpsons_paradox', () => {
  const old = [
    '总体看手术率下降了，所以新方案更安全，但每个科室的手术率都在上升。',
    '总体看成功率提升了，因此应当全面推广，但各分组成功率都在下降。',
    'Overall the survival rate improved, so the treatment is better, but each age group got worse.',
  ];
  for (const s of old) assert.strictEqual(hit(spMod.checkSimpsonsParadox, s), true, '存量攻击翻转: ' + s);
});
t('存量回归-common_cause', () => {
  // 取自 test/round-176-common-cause.js 与 round-264-common-cause.test.js 的存量攻击矩阵
  const old = [
    '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水',
    '这两个指标同涨同跌，说明其中一个驱动另一个',
    'A 指标与 B 指标高度相关，可见 A 是 B 的原因',
    '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。',
    'Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.',
    'A and B are highly correlated, so A causes B.',
    'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.',
  ];
  for (const s of old) assert.strictEqual(hit(ccMod.checkCommonCause, s), true, '存量攻击翻转: ' + s);
});

// ─── 6. 登记断言（维度计数不变、VERIFY_DIMS 在位）────────────────
t('登记-dimensions/VERIFY_DIMS', () => {
  const idx = require(path.join(ROOT, 'src', 'index.js'));
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  for (const dim of Object.keys(MODS)) {
    assert.ok(keys.includes(dim), 'dimensions 键缺失: ' + dim);
  }
  const src = require('fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const m = src.match(/VERIFY_DIMS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'VERIFY_DIMS 未找到');
  for (const dim of Object.keys(MODS)) {
    assert.ok(m[1].includes("'" + dim + "'"), 'VERIFY_DIMS 未含 ' + dim);
  }
});

console.log('✓ 新攻击矩阵 ' + atkTotal + '/' + atkTotal + ' 全部命中（4 维度 × EN/ZH 全新措辞）');
if (fails.length) { console.error('FAIL:'); fails.forEach((f) => console.error(' - ' + f)); process.exit(1); }
console.log('✓ round-272-wired-family-extensions 全部通过 (' + pass + ' 断言)');
console.log('round-272-wired-family-extensions: ' + pass + ' 通过, ' + fails.length + ' 失败, 共 ' + (pass + fails.length) + ' 个');
