/**
 * test/round-311-sig-verdict-ma-legs.test.js
 * r311 轮测——econ_reasoning_gate 聚合族两个子模块的新措辞家族（真升级②）：
 *   ① significance_effect_size（显著性≠重要性）腿②新实质性裁定族
 *      ——ZH「影响深远/意义深远」「含金量高/价值很大/分量很足/很有价值/
 *      很有分量」；EN「impactful / game changer / world-changing /
 *      consequential / matters in practice / has major implications /
 *      of great value」「implications are huge / far-reaching impact /
 *      matters in the real world」。
 *   ② mental_accounting（心理账户）新来源标签 × 新消费许可族
 *      ——新来源：压岁钱、公共资金（政府补贴/课题经费/救济款）、劳务
 *      创作收入（佣金/提成/版税）；EN lucky money / red envelope /
 *      subsidy / research funding / relief money / commission / royalty /
 *      tip money。新许可：没有心理负担/不用顾忌/不用计较/
 *      不用节省/犒劳自己/奢侈一把；EN treated myself / rewarded myself /
 *      no strings attached / without any guilt / might as well enjoy /
 *      indulge a little。
 *
 * 背景（coordination/agent4/probes/r311-probe*.js 基线实证，v6.8.178）：
 *   sig 侧 12/12 候选穿透本模块（存量 IMPORTANCE/SUPERIOR/SCALE/
 *   MAGNITUDE 四族不认新裁定腿）；ma 侧 16 条候选 14/16 穿透（2 条
 *   已被存量腿代拦）；官方良性语料 378 条（gate-97 97 + extended 106
 *   + vertical 150 + mixed 25）两模块零误命中。
 *
 * [归一化注意] 攻击句一律用「p 值小于 0.05」「p < 0.05」等带间隔形
 * 式，不用紧邻形「p<0.05」：text-normalizer 的 de_leet 会把紧邻形
 * 还原成「p<o.05」，导致 gate 管道内 sig 腿整体失配——该 artifact
 * 先于本轮存在（存量 IMPORTANCE 等腿同样受影响，已列交接事项）。
 *
 * 实现（平行常量 + findSignatures concat 合并，src/index.js 零改动）：
 *   · significance-effect-size.js：IMPORTANCE_ZH2 / MAGNITUDE_ZH2 /
 *     IMPORTANCE_EN2 / MAGNITUDE_EN2 四条平行常量，findSignatures
 *     verdicts 里与存量腿 concat；
 *   · mental-accounting.js：SOURCE_ZH2 / SPEND_ZH2 / SOURCE_EN2 /
 *     SPEND_EN2 四条平行常量，findSignatures 里与存量腿 concat；
 *   · 存量键注入语义不变（数组注入=整体替换；存量键注入永假正则时
 *     .concat 抛 TypeError，与存量行为一致，聚合层 _safeDetect 兜底）。
 *
 * 覆盖分组：
 *   A gate 层归因（新攻击 → econ_reasoning_gate findings，action≠pass）
 *   B 模块直调（新攻击全部命中）
 *   C 良性零误伤（手工 + 官方语料 378 全量，双模块直调）
 *   D 存量回归（旧攻击仍命中 + 旧良性仍不判）
 *   E 常量级注入（8 新常量=[] 各自依赖腿翻 miss；豁免删除变红；
 *     存量注入语义不变）
 *   F 元素级注入（38 个新元素逐一删除 → 每组至少一条攻击翻红）
 *   G 路由独立（econ_reasoning_gate 聚合层 + 插件层 analyze 双路可达）
 *   H 登记纪律（VERSION 三点一致 / index.js 接线在位 / 族表登记 /
 *     __internals 新键暴露）
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { detectSignificanceEffectSize: SIG, __internals: SIG_INTERNALS } = require(path.join(ROOT, 'src', 'significance-effect-size.js'));
const { detectMentalAccounting: MA, __internals: MA_INTERNALS } = require(path.join(ROOT, 'src', 'mental-accounting.js'));
const { checkEconReasoningGate, FAMILIES } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（负例注入关闭某组豁免/存量腿）
const NEVER = /(?!)/;

// ─── 新攻击集（41 条，基线零命中实证见 coordination/agent4/probes/r311-probe*.js）──
// 族 S：significance_effect_size 新裁定腿（20 条）
const SIG_ATTACK = [
  // MAGNITUDE_ZH2 影响深远/意义深远（5）
  '这项干预研究 p 值小于 0.05，所以影响深远，值得全领域跟进',
  '统计显著，可见这项工作的意义深远',
  'p 值小于 0.05，所以这项成果意义极为深远',
  'p 值小于 0.05，所以这个结论影响极为深远',
  'p 值小于 0.05，因此该疗法的应用前景影响广泛',
  // IMPORTANCE_ZH2 含金量/价值/分量（4）
  'p 值小于 0.05，说明这个发现含金量很高，不是一般的结果',
  'p 值 0.03，证明该成果价值很大',
  '结果显著，说明这个证据分量很足',
  'p 值小于 0.05，所以这项调研很有价值',
  // IMPORTANCE_ZH2 很有分量（1）
  '差异显著，可见这份数据很有分量',
  // IMPORTANCE_EN2（8）
  'p < 0.05, so the finding is impactful and should be taken seriously',
  'The result is statistically significant, which means it is a game changer',
  'p < 0.05, which proves the discovery is world-changing',
  'statistically significant, so this advance is truly consequential',
  'The study was significant at the 5% level, so the advance is truly consequential',
  'The correlation is significant, so it clearly matters in practice',
  'p < 0.05, so this has major implications for treatment',
  'The result is significant, so the dataset is of great value to the field',
  // MAGNITUDE_EN2（3）
  'p < 0.05, therefore the implications are huge for the field',
  'p < 0.05, so the intervention has a far-reaching impact on public health',
  'The result is statistically significant, so it matters a great deal in the real world',
];
// 族 M：mental_accounting 新来源 × 新许可（21 条）
const MA_ATTACK = [
  // SOURCE_ZH2 公共资金/人情/劳务创作 × 新许可（9）
  '压岁钱反正不是自己挣的，花起来不用顾忌',
  '政府补贴花不掉也不用计较，反正不是自己的钱',
  '课题经费是专项拨款，跟工资不一样，花起来不用顾忌',
  '救济款到账了，不拿白不拿，先买那台相机',
  '奖金池里的钱花不掉就作废，不用节省，尽管买',
  '科研经费是公家的钱，花起来不用顾忌，犒劳自己一顿好的',
  '佣金和提成来得容易，花起来不觉得可惜',
  '版税到账，跟工资不是一个性质，可以放心花',
  '版税到账就得犒劳自己，反正不用纳入考核',
  // 存量来源 × 新许可（5）
  '年终奖到账，我犒劳自己了一台新手机',
  '反正是中奖的钱，花起来没有心理负担',
  '意外之财到手，毫无负担，不用节省',
  '白来的钱，不用顾忌，想买就买',
  '横财到手，奢侈一把也无妨',
  // SOURCE_EN2 × SPEND_EN2（7）
  'The lucky money from relatives piled up, and she treated herself to a new bag',
  'The red envelope cash piled up, so she treated herself to dinner',
  'The government subsidy arrived, so he bought a new TV without any guilt',
  'The research funding arrived early, so he might as well splurge on gadgets',
  'The relief money arrived, so I treated myself to a proper meal',
  'The sales commission came in, so I spent it without any guilt',
  'The royalty check has no strings attached, so I might as well indulge',
  'Tip money is cash that does not really count, so I blow it on small treats',
  'The bonus pool arrived, so the team treated themselves to a fancy dinner',
  // 存量来源 × SPEND_EN2（4）
  'She rewarded herself with a spa day from the lottery winnings',
  'The inheritance came with no strings attached, so she booked the trip',
  'The inheritance felt like house money, so I might as well enjoy it',
  'The inheritance was large, so he decided to indulge a little',
];

// ─── A. gate 层归因 ─────────────────────────────────────────────────────
check('A gate 归因：41 条新攻击全部经 econ_reasoning_gate 且 action≠pass', () => {
  for (const t of SIG_ATTACK) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), '无 econ_reasoning_gate 归因: ' + t.slice(0, 24));
    assert.notStrictEqual(r.gate.action, 'pass', 'action=pass: ' + t.slice(0, 24));
  }
  for (const t of MA_ATTACK) {
    const r = gate(t);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('econ_reasoning_gate'), '无 econ_reasoning_gate 归因: ' + t.slice(0, 24));
    assert.notStrictEqual(r.gate.action, 'pass', 'action=pass: ' + t.slice(0, 24));
  }
});

// ─── B. 模块直调 ────────────────────────────────────────────────────────
check('B 模块直调：sig 20 条 + ma 21 条新攻击全部命中', () => {
  for (const t of SIG_ATTACK) assert.strictEqual(SIG(t).hit, true, 'sig 模块未命中: ' + t.slice(0, 24));
  for (const t of MA_ATTACK) assert.strictEqual(MA(t).hit, true, 'ma 模块未命中: ' + t.slice(0, 24));
});

// ─── C. 良性零误伤 ──────────────────────────────────────────────────────
const BENIGN_SIG = [
  '这项研究影响深远，为领域开辟了新方向',
  '这本教材含金量很高，适合初学者入门',
  'This landmark study has far-reaching implications for the field',
  'p<0.05，但效应量很小，不能说明实际意义',
  '统计显著不等于重要，这是统计学的基本常识',
  'The effect size is tiny even though p < 0.05',
  'statistical significance does not mean practical importance',
  '新方法确实更好，而且 p 值也小于 0.05，两个结果互相印证',
  'p 值只说明差异不太可能是噪声，不说明差异有多大',
  'This is a major breakthrough in the field of materials science',
];
const BENIGN_MA = [
  '压岁钱交给父母保管，存进银行作为教育金',
  '政府补贴必须专款专用，依法纳税后纳入统筹管理',
  '课题经费按制度核算，结余留转下一年度',
  '版税收入依法纳税后纳入家庭预算统一规划',
  '虽然拿到了佣金提成，我们还是按统一预算规划消费',
  'I put the royalty check straight into savings',
  'The research grant was budgeted carefully for equipment only',
  '救济款用于受灾群众的基本生活保障，专账管理',
  '奖金池的金额虽然高，分配规则早就公示过了',
  '钱不分来源，每一块钱的价值都是一样的',
  '年终奖我打算存起来作为孩子的教育金，专款专用',
  'The tax refund went straight into savings because windfalls should be budgeted like any other income',
];
check('C 良性零误伤：22 条手工良性双模块直调 + gate 均不出现本族归因', () => {
  for (const t of BENIGN_SIG) {
    assert.strictEqual(SIG(t).hit, false, 'sig 模块误伤: ' + t.slice(0, 24));
    const dims = (gate(t).findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('econ_reasoning_gate'), 'gate 误伤(sig): ' + t.slice(0, 24));
  }
  for (const t of BENIGN_MA) {
    assert.strictEqual(MA(t).hit, false, 'ma 模块误伤: ' + t.slice(0, 24));
    const dims = (gate(t).findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('econ_reasoning_gate'), 'gate 误伤(ma): ' + t.slice(0, 24));
  }
});

check('C 官方良性语料 378 条全量零误命中（双模块直调）', () => {
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [cat, arr] of Object.entries(ext.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('ext:' + cat, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 370, '语料规模 ' + corpora.length);
  let sigHits = 0, maHits = 0;
  for (const c of corpora) {
    if (SIG(c.text).hit) { sigHits++; console.log('    [sig-FP] ' + c.src + ' :: ' + c.text.slice(0, 50)); }
    if (MA(c.text).hit) { maHits++; console.log('    [ma-FP] ' + c.src + ' :: ' + c.text.slice(0, 50)); }
  }
  assert.strictEqual(sigHits, 0, 'sig 误伤 ' + sigHits + ' 条');
  assert.strictEqual(maHits, 0, 'ma 误伤 ' + maHits + ' 条');
  console.log(`    语料总数 ${corpora.length}，sig/ma 零命中`);
});

// ─── D. 存量回归 ────────────────────────────────────────────────────────
check('D 存量攻击集仍命中（sig 6 + ma 5）', () => {
  const OLD_SIG = [
    'p 小于 0.05，所以这个药有效，可以全面推广',
    'p 值只有 0.001，证明这个发现是重大突破',
    '差异显著，说明新方法明显更好',
    '实验组显著优于对照组，这证明改进很大',
    'p < 0.05, so the drug works and should be rolled out to everyone',
    'The result is significant, which proves the effect is large and important',
  ];
  const OLD_MA = [
    '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
    '反正是公司报销的钱，不花白不花，多点几个菜也没什么。',
    '中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。',
    'The bonus is found money, not real salary, so I might as well splurge on it guilt-free.',
    'The lottery winnings are not the same as my paycheck, so why not blow the whole thing.',
  ];
  for (const t of OLD_SIG) assert.strictEqual(SIG(t).hit, true, '存量 sig 失配: ' + t.slice(0, 20));
  for (const t of OLD_MA) assert.strictEqual(MA(t).hit, true, '存量 ma 失配: ' + t.slice(0, 20));
});

check('D 存量良性集仍不判（sig 5 + ma 5）', () => {
  const OLD_SIG_B = [
    'p 小于 0.05，但效应量很小，实际意义有限',
    '统计显著不等于重要，得结合效应量和样本量一起看',
    '新方法明显更好，而且 p 值也小于 0.05',
    '显著性水平通常取 0.05，这个选择很重要',
    'The result is significant, but the difference is too small to matter',
  ];
  const OLD_MA_B = [
    '年终奖我打算存起来作为孩子的教育金，专款专用。',
    '所有收入都进同一个账户统一规划，不分来源。',
    '报销款到账后计入项目成本，与工资收入合并管理。',
    '心理账户是一种认知偏差，会让同样的一块钱被区别对待。',
    'Money is money wherever it comes from; every dollar is the same.',
  ];
  for (const t of OLD_SIG_B) assert.strictEqual(SIG(t).hit, false, '存量 sig 行为变化: ' + t.slice(0, 20));
  for (const t of OLD_MA_B) assert.strictEqual(MA(t).hit, false, '存量 ma 行为变化: ' + t.slice(0, 20));
});

// ─── E. 常量级注入 ──────────────────────────────────────────────────────
check('E IMPORTANCE_ZH2=[] → 依赖新重要性裁定的 ZH 攻击全部失配', () => {
  for (const t of [
    'p 值小于 0.05，说明这个发现含金量很高，不是一般的结果',
    'p 值 0.03，证明该成果价值很大',
    '结果显著，说明这个证据分量很足',
    'p 值小于 0.05，所以这项调研很有价值',
    '差异显著，可见这份数据很有分量',
  ]) assert.strictEqual(SIG(t, { IMPORTANCE_ZH2: [] }).hit, false, '删 IMPORTANCE_ZH2 仍命中: ' + t.slice(0, 20));
});
check('E MAGNITUDE_ZH2=[] → 依赖新深远裁定的 ZH 攻击全部失配', () => {
  for (const t of [
    '这项干预研究 p 值小于 0.05，所以影响深远，值得全领域跟进',
    '统计显著，可见这项工作的意义深远',
    'p 值小于 0.05，所以这项成果意义极为深远',
    'p 值小于 0.05，所以这个结论影响极为深远',
    'p 值小于 0.05，因此该疗法的应用前景影响广泛',
  ]) assert.strictEqual(SIG(t, { MAGNITUDE_ZH2: [] }).hit, false, '删 MAGNITUDE_ZH2 仍命中: ' + t.slice(0, 20));
});
check('E IMPORTANCE_EN2=[] → 依赖新重要性裁定的 EN 攻击全部失配', () => {
  for (const t of [
    'p < 0.05, so the finding is impactful and should be taken seriously',
    'The result is statistically significant, which means it is a game changer',
    'p < 0.05, which proves the discovery is world-changing',
    'statistically significant, so this advance is truly consequential',
    'The study was significant at the 5% level, so the advance is truly consequential',
    'The correlation is significant, so it clearly matters in practice',
    'p < 0.05, so this has major implications for treatment',
    'The result is significant, so the dataset is of great value to the field',
  ]) assert.strictEqual(SIG(t, { IMPORTANCE_EN2: [] }).hit, false, '删 IMPORTANCE_EN2 仍命中: ' + t.slice(0, 20));
});
check('E MAGNITUDE_EN2=[] → 依赖新效应规模裁定的 EN 攻击全部失配', () => {
  for (const t of [
    'p < 0.05, therefore the implications are huge for the field',
    'p < 0.05, so the intervention has a far-reaching impact on public health',
    'The result is statistically significant, so it matters a great deal in the real world',
  ]) assert.strictEqual(SIG(t, { MAGNITUDE_EN2: [] }).hit, false, '删 MAGNITUDE_EN2 仍命中: ' + t.slice(0, 20));
});
check('E SOURCE_ZH2=[] → 依赖新来源标签的 ZH 攻击全部失配', () => {
  for (const t of [
    '压岁钱反正不是自己挣的，花起来不用顾忌',
    '政府补贴花不掉也不用计较，反正不是自己的钱',
    '课题经费是专项拨款，跟工资不一样，花起来不用顾忌',
    '救济款到账了，不拿白不拿，先买那台相机',
    '科研经费是公家的钱，花起来不用顾忌，犒劳自己一顿好的',
    '佣金和提成来得容易，花起来不觉得可惜',
    '版税到账，跟工资不是一个性质，可以放心花',
    '版税到账就得犒劳自己，反正不用纳入考核',
  ]) assert.strictEqual(MA(t, { SOURCE_ZH2: [] }).hit, false, '删 SOURCE_ZH2 仍命中: ' + t.slice(0, 20));
});
check('E SPEND_ZH2=[] → 依赖新消费许可的 ZH 攻击全部失配', () => {
  for (const t of [
    '压岁钱反正不是自己挣的，花起来不用顾忌',
    '政府补贴花不掉也不用计较，反正不是自己的钱',
    '课题经费是专项拨款，跟工资不一样，花起来不用顾忌',
    '奖金池里的钱花不掉就作废，不用节省，尽管买',
    '科研经费是公家的钱，花起来不用顾忌，犒劳自己一顿好的',
    '版税到账就得犒劳自己，反正不用纳入考核',
    '年终奖到账，我犒劳自己了一台新手机',
    '反正是中奖的钱，花起来没有心理负担',
    '意外之财到手，毫无负担，不用节省',
    '白来的钱，不用顾忌，想买就买',
    '横财到手，奢侈一把也无妨',
  ]) assert.strictEqual(MA(t, { SPEND_ZH2: [] }).hit, false, '删 SPEND_ZH2 仍命中: ' + t.slice(0, 20));
});
check('E SOURCE_EN2=[] → 依赖新来源标签的 EN 攻击全部失配', () => {
  for (const t of [
    'The lucky money from relatives piled up, and she treated herself to a new bag',
    'The red envelope cash piled up, so she treated herself to dinner',
    'The government subsidy arrived, so he bought a new TV without any guilt',
    'The research funding arrived early, so he might as well splurge on gadgets',
    'The relief money arrived, so I treated myself to a proper meal',
    'The sales commission came in, so I spent it without any guilt',
    'The royalty check has no strings attached, so I might as well indulge',
    'Tip money is cash that does not really count, so I blow it on small treats',
  ]) assert.strictEqual(MA(t, { SOURCE_EN2: [] }).hit, false, '删 SOURCE_EN2 仍命中: ' + t.slice(0, 20));
});
check('E SPEND_EN2=[] → 依赖新消费许可的 EN 攻击全部失配', () => {
  for (const t of [
    'The lucky money from relatives piled up, and she treated herself to a new bag',
    'The red envelope cash piled up, so she treated herself to dinner',
    'The government subsidy arrived, so he bought a new TV without any guilt',
    'The relief money arrived, so I treated myself to a proper meal',
    'The sales commission came in, so I spent it without any guilt',
    'The royalty check has no strings attached, so I might as well indulge',
    'The bonus pool arrived, so the team treated themselves to a fancy dinner',
    'She rewarded herself with a spa day from the lottery winnings',
    'The inheritance came with no strings attached, so she booked the trip',
    'The inheritance felt like house money, so I might as well enjoy it',
    'The inheritance was large, so he decided to indulge a little',
  ]) assert.strictEqual(MA(t, { SPEND_EN2: [] }).hit, false, '删 SPEND_EN2 仍命中: ' + t.slice(0, 20));
});
check('E 豁免承重：删除口径意识/概念教学/规范记账/元话语豁免后真签名句变红', () => {
  assert.strictEqual(SIG('p 小于 0.05，所以新药有效，不过效应量只有 0.1').hit, false);
  assert.strictEqual(SIG('p 小于 0.05，所以新药有效，不过效应量只有 0.1', { CORRECTIVE_ZH: NEVER }).hit, true, '删 CORRECTIVE_ZH 未变红');
  assert.strictEqual(SIG('统计显著不等于重要，但很多人拿它说明新方法明显更好').hit, false);
  assert.strictEqual(SIG('统计显著不等于重要，但很多人拿它说明新方法明显更好', { CONCEPT_ZH: NEVER }).hit, true, '删 CONCEPT_ZH 未变红');
  assert.strictEqual(MA('这笔年终奖是意外之财，按理可以随便花，但我们仍纳入家庭总预算统一规划').hit, false);
  assert.strictEqual(MA('这笔年终奖是意外之财，按理可以随便花，但我们仍纳入家庭总预算统一规划', { ACCOUNT_ZH: NEVER }).hit, true, '删 ACCOUNT_ZH 未变红');
  assert.strictEqual(MA('心理账户是指像「年终奖是意外之财、可以随便花」这样把钱按来源区别对待的偏差。').hit, false);
  assert.strictEqual(MA('心理账户是指像「年终奖是意外之财、可以随便花」这样把钱按来源区别对待的偏差。', { META_ZH: NEVER }).hit, true, '删 META_ZH 未变红');
});
check('E 存量注入语义不变：删存量裁定/来源腿后存量攻击仍全灭', () => {
  assert.strictEqual(SIG('p 值只有 0.001，证明这个发现是重大突破').hit, true);
  assert.strictEqual(SIG('p 值只有 0.001，证明这个发现是重大突破', { IMPORTANCE_ZH: [] }).hit, false, '存量 IMPORTANCE_ZH 不承重');
  assert.strictEqual(SIG('差异显著，说明新方法明显更好', { SUPERIOR_ZH: [] }).hit, false, '存量 SUPERIOR_ZH 不承重');
  assert.strictEqual(MA('这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。').hit, true);
  assert.strictEqual(MA('这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。', { SOURCE_ZH: [] }).hit, false, '存量 SOURCE_ZH 不承重');
  // 存量键注入永假正则时 .concat 抛 TypeError（与存量行为一致，聚合层兜底）
  assert.throws(() => SIG('p 值只有 0.001，证明这个发现是重大突破', { IMPORTANCE_ZH: NEVER }), TypeError);
});

// ─── F. 元素级注入 ──────────────────────────────────────────────────────
check('F 元素级注入：新正则元素逐一删除后至少一条攻击翻红', () => {
  const SI = SIG_INTERNALS();
  const MI = MA_INTERNALS();
  console.log('    元素数: ' + ['IMPORTANCE_ZH2', 'MAGNITUDE_ZH2', 'IMPORTANCE_EN2', 'MAGNITUDE_EN2'].map(k => k + '=' + SI[k].length).join(' ')
    + ' | ' + ['SOURCE_ZH2', 'SPEND_ZH2', 'SOURCE_EN2', 'SPEND_EN2'].map(k => k + '=' + MI[k].length).join(' '));
  const dropOne = (arr, i) => arr.filter((_, j) => j !== i);
  const perElement = [
    ['IMPORTANCE_ZH2', SI.IMPORTANCE_ZH2, SIG_ATTACK, SIG],
    ['MAGNITUDE_ZH2', SI.MAGNITUDE_ZH2, SIG_ATTACK, SIG],
    ['IMPORTANCE_EN2', SI.IMPORTANCE_EN2, SIG_ATTACK, SIG],
    ['MAGNITUDE_EN2', SI.MAGNITUDE_EN2, SIG_ATTACK, SIG],
    ['SOURCE_ZH2', MI.SOURCE_ZH2, MA_ATTACK, MA],
    ['SPEND_ZH2', MI.SPEND_ZH2, MA_ATTACK, MA],
    ['SOURCE_EN2', MI.SOURCE_EN2, MA_ATTACK, MA],
    ['SPEND_EN2', MI.SPEND_EN2, MA_ATTACK, MA],
  ];
  let elements = 0;
  for (const [name, arr, atks, fn] of perElement) {
    for (let i = 0; i < arr.length; i++) {
      elements++;
      const inj = { [name]: dropOne(arr, i) };
      const reddened = atks.filter(t => fn(t).hit && !fn(t, inj).hit);
      assert.ok(reddened.length >= 1, name + ' 元素 ' + i + ' 删除后无攻击翻红');
    }
  }
  assert.strictEqual(elements, 38, '新元素总数 ' + elements + ' ≠ 38');
});

// ─── G. 路由独立 ────────────────────────────────────────────────────────
check('G 路由独立：聚合层 + 插件层 analyze 双路可达（sig + ma 各一条）', () => {
  const famS = FAMILIES.find(f => f.key === 'significance_effect_size');
  const famM = FAMILIES.find(f => f.key === 'mental_accounting');
  assert.ok(famS, 'FAMILIES 缺 significance_effect_size');
  assert.ok(famM, 'FAMILIES 缺 mental_accounting');
  const rS = checkEconReasoningGate(SIG_ATTACK[0]);
  assert.strictEqual(rS.hit, true, '聚合层未命中 sig 攻击');
  assert.ok(rS.families.some(f => f.key === 'significance_effect_size'), '聚合层族明细缺 significance_effect_size');
  const rM = checkEconReasoningGate(MA_ATTACK[0]);
  assert.strictEqual(rM.hit, true, '聚合层未命中 ma 攻击');
  assert.ok(rM.families.some(f => f.key === 'mental_accounting'), '聚合层族明细缺 mental_accounting');
  const PLUGIN = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
  const keysS = (PLUGIN.analyze(SIG_ATTACK[0]).families || []).map(f => f.key);
  assert.ok(keysS.includes('significance_effect_size'), '插件层未路由 significance_effect_size');
  const keysM = (PLUGIN.analyze(MA_ATTACK[1]).families || []).map(f => f.key);
  assert.ok(keysM.includes('mental_accounting'), '插件层未路由 mental_accounting');
});

// ─── H. 登记纪律 ────────────────────────────────────────────────────────
check('H VERSION / package.json 两点一致（版本号动态，r316-c 起不写死）', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});

check('H 接线在位：index.js require econ-reasoning-gate + 维度计数仍 254', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/require\('\.\/econ-reasoning-gate\.js'\)/.test(src), 'index.js 缺 econ-reasoning-gate 接线');
  assert.ok(/econ_reasoning_gate/.test(src), 'index.js 缺 econ_reasoning_gate 维度键');
  const { discriminate } = require(path.join(ROOT, 'src', 'index.js'));
  const d = discriminate('neutral baseline text');
  assert.strictEqual(Object.keys(d.dimensions || {}).length, 254, '维度数变化（应仍 254）');
});

check('H __internals 暴露 8 新腿常量（sig 4 + ma 4）', () => {
  const SI = SIG_INTERNALS();
  for (const k of ['IMPORTANCE_ZH2', 'MAGNITUDE_ZH2', 'IMPORTANCE_EN2', 'MAGNITUDE_EN2']) {
    assert.ok(Array.isArray(SI[k]) && SI[k].length > 0, 'sig __internals 缺 ' + k);
  }
  const MI = MA_INTERNALS();
  for (const k of ['SOURCE_ZH2', 'SPEND_ZH2', 'SOURCE_EN2', 'SPEND_EN2']) {
    assert.ok(Array.isArray(MI[k]) && MI[k].length > 0, 'ma __internals 缺 ' + k);
  }
});

console.log(`\nround-311 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
