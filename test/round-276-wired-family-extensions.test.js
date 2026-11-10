// round-276-wired-family-extensions.test.js
// r276：经济与资源推理方向·4 个已接线维度全新措辞家族（真升级②）
// 落地模块：money_illusion / loss_aversion / omission_bias / planning_fallacy
// 判据：探针 coordination/agent4/probes/r276-probe-pool.js 实证穿透
//   money_illusion 4/8、loss_aversion 5/8（2 条 disposition 领地不收）、
//   omission_bias 2/5、planning_fallacy 1/6 → 落地后 8/8、6/6、5/5、6/6
const assert = require('assert');
const hf = require('../src/gate.js');
const { detectMoneyIllusion } = require('../src/money-illusion.js');
const { detectLossAversion } = require('../src/loss-aversion.js');
const { detectOmissionBias } = require('../src/omission-bias.js');
const { detectPlanningFallacy } = require('../src/planning-fallacy.js');
const MONEY = require('../src/money-illusion.js').__internals();
const LOSS = require('../src/loss-aversion.js').__internals();
const OMIT = require('../src/omission-bias.js').__internals();
const PLAN = require('../src/planning-fallacy.js').__internals();

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.error('FAIL ' + name + ': ' + e.message); }
}

// ─── 攻击样本（模块层命中 + gate 层维度承重）─────────────────────
const ATTACKS = [
  // money_illusion（8）：面值翻倍 × 身家翻倍 / 票面见涨 × 积蓄变厚 /
  // 负向名义 × 负向福利 / 抬到 × 上新台阶 / EN statement balance /
  // EN paycheck not shrunk / EN savings worth twice（既有 face value
  // doubled 腿 + 新 savings worth twice 腿）/ 既有 ticket prices 代拦形
  ['money_illusion', '债券的面值翻了一倍，存在我账户里的身家也跟着翻倍，心里踏实多了。'],
  ['money_illusion', '存单上的票面数字月月见涨，我的积蓄眼看着越来越厚，晚年生计不用愁。'],
  ['money_illusion', '每月工资到账的数额三年没缩水，供房养娃的压力一点都没变大。'],
  ['money_illusion', '合同金额从五百万抬到六百万，公司实力明显上了一个台阶。'],
  ['money_illusion', 'The face value of my bond doubled, so my savings are worth twice as much now.'],
  ['money_illusion', 'The statement balance keeps climbing, so my nest egg is getting bigger every month.'],
  ['money_illusion', 'The number on my paycheck has not shrunk, so the financial pressure is unchanged.'],
  ['money_illusion', 'Ticket prices are up 20% and ridership revenue hit a record, so the airline is doing better than ever.'],
  // loss_aversion（6）：痛感/快感倍数 × 只求不亏 / 重三倍 × 少挣也不沾 /
  // 看见亏上头（SOLO S8）/ 想想赔睡不着（SOLO S8）/ EN outweighs ×
  // capital preservation / EN stomach turn × no matter the payoff
  ['loss_aversion', '赔钱的痛感是赚钱的快感的两倍还多，所以我只求不亏。'],
  ['loss_aversion', '亏一点的难受劲儿比赚同样的高兴劲儿重三倍，宁可少挣也不沾。'],
  ['loss_aversion', '一看见亏损两个字就上头，手头的项目算下来再划算我也先撤。'],
  ['loss_aversion', '光是想想可能要赔就焦虑得睡不着，这笔账干脆不算了。'],
  ['loss_aversion', 'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.'],
  ['loss_aversion', 'Just thinking about a possible loss makes my stomach turn, so I am out no matter the payoff.'],
  // omission_bias（5）：行动即被责 SOLO / 放任恶化 × 背锅 / letting
  // slide × blame-free / 不做最多是 + 做错就是罪过（S6+S7 双）/ EN
  // not acting only costs + acting wrongly is a sin（E5+E6 双）
  ['omission_bias', '局面再坏下去，那也是形势使然；我主动出手一旦搞砸，责任全在我。'],
  ['omission_bias', '宁可让事情慢慢烂掉，也不能背上主动做错事的锅。'],
  ['omission_bias', 'Letting things slide is blame-free; acting and failing is entirely on me.'],
  ['omission_bias', '不做最多是慢一点、少赚点；做错了就是实打实的罪过。'],
  ['omission_bias', 'Not acting only costs time; acting wrongly is a real sin.'],
  // omission_bias SOLO 分腿样本（注入唯一腿用：S6 与 S7 各自独立成句）
  ['omission_bias', '不做最多是慢一点、少赚点。'],
  ['omission_bias', '做错了就是实打实的罪过。'],
  // planning_fallacy（6）：拼命 × 工期比计划短 / 意外 dismissal ×
  // 绝不会再超时 / 吃透 × 工期短 / 加人 × 交付更快 / EN fluke ×
  // no more overruns / EN doubled team × can only get faster
  ['planning_fallacy', '这次我拼了命，所有时间都压上，工期肯定比计划还短。'],
  ['planning_fallacy', '上次纯属意外，这次工期绝不会再超时。'],
  ['planning_fallacy', '这次我吃透每个环节，工期肯定比计划还短。'],
  ['planning_fallacy', '我又加了三个人进项目组，人手翻倍，交付只会更快。'],
  ['planning_fallacy', 'Last time was a fluke; I have now mastered every step, so no more overruns.'],
  ['planning_fallacy', 'I doubled the team size, so delivery can only get faster.'],
  ['planning_fallacy', 'This time I am going all in with every hour of the day, so we will finish ahead of schedule.'],
];
for (const [dim, s] of ATTACKS) {
  t('attack ' + dim + ': ' + s.slice(0, 24), () => {
    const mod = { money_illusion: detectMoneyIllusion, loss_aversion: detectLossAversion, omission_bias: detectOmissionBias, planning_fallacy: detectPlanningFallacy }[dim](s);
    assert.strictEqual(mod.hit, true, '模块层未命中');
    const g = hf.gate(s);
    const dimLoad = (g.findings || []).some(f => f.dimension === dim);
    assert.ok(dimLoad, 'gate 层维度未承重（action=' + (g.gate && g.gate.action) + '）');
  });
}

// ─── 良性样本（零误伤）──────────────────────────────────────────
const BENIGN = [
  ['money_illusion', '债券的面值翻了一倍，但票面数字不等于实际收益，还要看利率和期限。'],
  ['money_illusion', '存单上的票面数字月月见涨，不过通胀背景下实际购买力可能没涨。'],
  ['money_illusion', '每月工资到账的数额三年没缩水，但同期物价涨了多少要一起算。'],
  ['money_illusion', '合同金额从五百万抬到六百万，按不变价核算实际规模变化有限。'],
  ['money_illusion', 'The face value of my bond doubled, but nominal value says nothing about real return.'],
  ['money_illusion', 'The number on my paycheck has not shrunk, though inflation may have eaten into it.'],
  ['money_illusion', 'Ticket prices are up 20%, but inflation-adjusted revenue tells a different story.'],
  ['loss_aversion', '赔钱的痛感是赚钱的快感的两倍还多，所以我用事先定好的止损纪律来对冲。'],
  ['loss_aversion', '一看见亏损两个字就上头，但决策要按期望值算，不按情绪算。'],
  ['loss_aversion', 'The pain of a loss outweighs the pleasure of a gain, so I set stop-losses in advance.'],
  ['loss_aversion', 'Just thinking about a possible loss makes my stomach turn, so I size positions by risk budget.'],
  ['omission_bias', '形势使然不能成为放任不管的理由，不作为本身也需要评估。'],
  ['omission_bias', '烂摊子不能捂着，该出手就出手，放任恶化本身也是失职。'],
  ['omission_bias', '不作为不等于零责任，拖延和做错都有代价，要分开评估。'],
  ['omission_bias', '做错了及时改正就行，真正要避免的是重复犯错。'],
  ['omission_bias', 'Letting things rot is a choice too; both acting and not acting carry consequences.'],
  ['omission_bias', 'Inaction is not automatically blameless; every option needs weighing.'],
  ['planning_fallacy', '上次纯属意外，这次我吃透每个环节，计划仍按同类项目的历史中位数排。'],
  ['planning_fallacy', '这次我拼了命，所有时间都压上，但还是要参照历史工期打个富余量。'],
  ['planning_fallacy', '上次那次失败不是偶然，流程上确实有漏洞，所以这次重排了计划。'],
  ['planning_fallacy', '我又加了三个人进项目组，不过新人上手有学习曲线，工期未必更短。'],
  ['planning_fallacy', '以往纯属偶然这个判断本身不成立，我们还是按基准工期来。'],
  ['planning_fallacy', 'Last time was a fluke, so the estimate still follows reference-class forecasting.'],
  ['planning_fallacy', 'This time I am going all in, but the schedule still needs a buffer based on past projects.'],
];
for (const [dim, s] of BENIGN) {
  t('benign ' + dim + ': ' + s.slice(0, 24), () => {
    const mod = { money_illusion: detectMoneyIllusion, loss_aversion: detectLossAversion, omission_bias: detectOmissionBias, planning_fallacy: detectPlanningFallacy }[dim](s);
    assert.strictEqual(mod.hit, false, '良性样本被误判');
  });
}

// ─── 登记测试（新族常量在册）────────────────────────────────────
t('register: money-illusion r276 constants', () => {
  assert.ok(MONEY.NOMINAL_NEG_ZH.length >= 1, 'NOMINAL_NEG_ZH 未登记');
  assert.ok(MONEY.WELFARE_ASSET_ZH.length >= 1, 'WELFARE_ASSET_ZH 未登记');
  assert.ok(MONEY.WELFARE_STEP_ZH.length >= 1, 'WELFARE_STEP_ZH 未登记');
  assert.ok(MONEY.WELFARE_NEG_ZH.length >= 1, 'WELFARE_NEG_ZH 未登记');
  assert.ok(MONEY.NOMINAL_BASIS_ZH.some(re => re.source.includes('见涨')), 'NOMINAL_BASIS_ZH 动词槽未见 见涨');
  assert.ok(MONEY.NOMINAL_FROM_TO_ZH.some(re => re.source.includes('抬')), 'NOMINAL_FROM_TO_ZH 动词槽未见 抬');
  assert.ok(MONEY.NOMINAL_BASIS_EN.some(re => /statement/.test(re.source)), 'NOMINAL_BASIS_EN 未见 statement balance 族');
  assert.ok(MONEY.WELFARE_EN.some(re => /nest/.test(re.source)), 'WELFARE_EN 未见 nest egg 族');
});
t('register: loss-aversion r276 constants', () => {
  assert.ok(LOSS.ASYM_MULTIPLE_ZH.some(re => re.source.includes('痛感')), 'ASYM_MULTIPLE_ZH 未见 痛感');
  assert.ok(LOSS.ASYM_MULTIPLE_ZH.some(re => re.source.includes('快感')), 'ASYM_MULTIPLE_ZH 未见 快感对举');
  assert.ok(LOSS.ASYM_CMP_ZH.some(re => re.source.includes('刻骨')), 'ASYM_CMP_ZH 未见 重N倍 族');
  assert.ok(LOSS.AVOID_RATHER_ZH.some(re => re.source.includes('沾')), 'AVOID_RATHER_ZH 未见 不沾 族');
  assert.ok(LOSS.AVOID_CAPITAL_ZH.some(re => re.source.includes('只求')), 'AVOID_CAPITAL_ZH 未见 只求不亏');
  assert.ok(LOSS.AVOID_EMOTION_ZH.some(re => re.source.includes('上头')), 'AVOID_EMOTION_ZH 未见 上头');
  assert.ok(LOSS.SOLO_ZH.some(re => re.source.includes('膈应')), 'SOLO_ZH 未见 S8 口语前缀×情绪族');
  assert.ok(LOSS.ASYM_EN.some(re => /outweighs/.test(re.source)), 'ASYM_EN 未见 正向 outweigh');
  assert.ok(LOSS.AVOID_EN.some(re => /capital/.test(re.source)), 'AVOID_EN 未见 capital preservation');
  assert.ok(LOSS.SOLO_EN.some(re => /stomach/.test(re.source)), 'SOLO_EN 未见 stomach turn 族');
});
t('register: omission-bias r276 constants', () => {
  assert.ok(OMIT.OMIT_DETERIORATE_ZH.source.includes('烂'), 'OMIT_DETERIORATE_ZH 未见 烂掉');
  assert.ok(OMIT.EXCUL_CIRCUMSTANCE_ZH.source.includes('形势'), 'EXCUL_CIRCUMSTANCE_ZH 未见 形势使然');
  assert.ok(OMIT.EXCUL_POT_ZH.source.includes('黑锅'), 'EXCUL_POT_ZH 未见 背锅族');
  assert.ok(OMIT.OMIT_SLIDE_EN.source.includes('slide'), 'OMIT_SLIDE_EN 未见 letting things slide');
  assert.ok(OMIT.EXCUL_BLAMEFREE_EN.source.includes('blame'), 'EXCUL_BLAMEFREE_EN 未见 blame-free');
  assert.ok(OMIT.SOLO_ZH.some(re => re.source.includes('一旦')), 'SOLO_ZH 未见 S5 行动即被责');
  assert.ok(OMIT.SOLO_ZH.some(re => re.source.includes('最多')), 'SOLO_ZH 未见 S6 不做最多是');
  assert.ok(OMIT.SOLO_ZH.some(re => re.source.includes('罪过')), 'SOLO_ZH 未见 S7 做错就是罪过');
  assert.ok(OMIT.SOLO_EN.some(re => /only/.test(re.source) && /costs/.test(re.source)), 'SOLO_EN 未见 E5 not acting only costs');
  assert.ok(OMIT.SOLO_EN.some(re => /real\s+\?\(sin/.test(re.source) || /sin\|crime/.test(re.source)), 'SOLO_EN 未见 E6 acting wrongly is a sin');
});
t('register: planning-fallacy r276 constants', () => {
  assert.ok(PLAN.WILL_REJECT_REF_ZH.some(re => re.source.includes('纯属')), 'WILL_REJECT_REF_ZH 未见 意外 dismissal');
  assert.ok(PLAN.WILL_DISMISS_ZH.some(re => re.source.includes('吃透')), 'WILL_DISMISS_ZH 未见 掌握族');
  assert.ok(PLAN.EST_PROMISE_ZH.some(re => re.source.includes('绝不会')), 'EST_PROMISE_ZH 未见 绝不会再');
  assert.ok(PLAN.WILL_EFFORT_ZH.some(re => re.source.includes('人手')), 'WILL_EFFORT_ZH 未见 资源加码');
  assert.ok(PLAN.EST_DURATION_ZH.some(re => re.source.includes('工期')), 'EST_DURATION_ZH 未见 工期比较结论');
  assert.ok(PLAN.WILL_REJECT_REF_EN.some(re => /fluke/.test(re.source)), 'WILL_REJECT_REF_EN 未见 fluke dismissal');
  assert.ok(PLAN.EST_PROMISE_EN.some(re => /overruns/.test(re.source)), 'EST_PROMISE_EN 未见 no more overruns');
  assert.ok(PLAN.WILL_EFFORT_EN.some(re => /doubled/.test(re.source)), 'WILL_EFFORT_EN 未见 doubled team');
  assert.ok(PLAN.EST_DURATION_EN.some(re => /ahead/.test(re.source)), 'EST_DURATION_EN 未见 ahead of schedule');
});

// ─── 负例注入（删掉本轮新模式，断言守卫必须变红）────────────────
// 数组族：按源串标记过滤掉本轮新增条目；单正则族：inject 空数组顶掉组
const dropMarked = (arr, marker) => arr.filter(re => !marker.test(re.source));
const injections = [
  // money_illusion
  ['money_illusion', '债券的面值翻了一倍，存在我账户里的身家也跟着翻倍，心里踏实多了。',
    { NOMINAL_BASIS_ZH: dropMarked(MONEY.NOMINAL_BASIS_ZH, /名义额/) }],
  ['money_illusion', '存单上的票面数字月月见涨，我的积蓄眼看着越来越厚，晚年生计不用愁。',
    { WELFARE_ASSET_ZH: [] }],
  ['money_illusion', '每月工资到账的数额三年没缩水，供房养娃的压力一点都没变大。',
    { NOMINAL_NEG_ZH: [] }],
  ['money_illusion', '每月工资到账的数额三年没缩水，供房养娃的压力一点都没变大。',
    { WELFARE_NEG_ZH: [] }],
  ['money_illusion', '合同金额从五百万抬到六百万，公司实力明显上了一个台阶。',
    { NOMINAL_FROM_TO_ZH: dropMarked(MONEY.NOMINAL_FROM_TO_ZH, /抬/) }],
  ['money_illusion', '合同金额从五百万抬到六百万，公司实力明显上了一个台阶。',
    { WELFARE_STEP_ZH: [] }],
  ['money_illusion', 'The statement balance keeps climbing, so my nest egg is getting bigger every month.',
    { NOMINAL_BASIS_EN: dropMarked(MONEY.NOMINAL_BASIS_EN, /statement/) }],
  ['money_illusion', 'The number on my paycheck has not shrunk, so the financial pressure is unchanged.',
    { NOMINAL_BASIS_EN: dropMarked(MONEY.NOMINAL_BASIS_EN, /paycheck/) }],
  ['money_illusion', 'The face value of my bond doubled, so my savings are worth twice as much now.',
    { WELFARE_EN: dropMarked(MONEY.WELFARE_EN, /nest/) }],
  ['money_illusion', 'The number on my paycheck has not shrunk, so the financial pressure is unchanged.',
    { WELFARE_EN: dropMarked(MONEY.WELFARE_EN, /unchanged/) }],
  // loss_aversion
  ['loss_aversion', '赔钱的痛感是赚钱的快感的两倍还多，所以我只求不亏。',
    { ASYM_MULTIPLE_ZH: dropMarked(LOSS.ASYM_MULTIPLE_ZH, /痛感/) }],
  ['loss_aversion', '赔钱的痛感是赚钱的快感的两倍还多，所以我只求不亏。',
    { AVOID_CAPITAL_ZH: dropMarked(LOSS.AVOID_CAPITAL_ZH, /只求/) }],
  ['loss_aversion', '亏一点的难受劲儿比赚同样的高兴劲儿重三倍，宁可少挣也不沾。',
    { ASYM_CMP_ZH: dropMarked(LOSS.ASYM_CMP_ZH, /刻骨/) }],
  ['loss_aversion', '亏一点的难受劲儿比赚同样的高兴劲儿重三倍，宁可少挣也不沾。',
    { AVOID_RATHER_ZH: dropMarked(LOSS.AVOID_RATHER_ZH, /沾/) }],
  ['loss_aversion', '一看见亏损两个字就上头，手头的项目算下来再划算我也先撤。',
    { SOLO_ZH: dropMarked(LOSS.SOLO_ZH, /膈应/) }],
  ['loss_aversion', '亏比挣难受这是常识，亏损报表一看就头皮发麻，这单我不接。',
    { AVOID_EMOTION_ZH: dropMarked(LOSS.AVOID_EMOTION_ZH, /上头/) }],
  ['loss_aversion', 'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.',
    { ASYM_EN: dropMarked(LOSS.ASYM_EN, /outweighs/) }],
  ['loss_aversion', 'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.',
    { AVOID_EN: dropMarked(LOSS.AVOID_EN, /capital/) }],
  ['loss_aversion', 'Just thinking about a possible loss makes my stomach turn, so I am out no matter the payoff.',
    { SOLO_EN: dropMarked(LOSS.SOLO_EN, /stomach/) }],
  // omission_bias（单正则族 inject 空数组顶掉组；SOLO 数组族按源串标记过滤）
  ['omission_bias', '宁可让事情慢慢烂掉，也不能背上主动做错事的锅。',
    { OMIT_DETERIORATE_ZH: [] }],
  ['omission_bias', '宁可让事情慢慢烂掉，也不能背上主动做错事的锅。',
    { EXCUL_POT_ZH: [] }],
  ['omission_bias', '局面再坏下去，那也是形势使然；我主动出手一旦搞砸，责任全在我。',
    { SOLO_ZH: dropMarked(OMIT.SOLO_ZH, /一旦/) }],
  ['omission_bias', '不做最多是慢一点、少赚点。',
    { SOLO_ZH: dropMarked(OMIT.SOLO_ZH, /最多/) }],
  ['omission_bias', '做错了就是实打实的罪过。',
    { SOLO_ZH: dropMarked(OMIT.SOLO_ZH, /罪过/) }],
  ['omission_bias', 'Letting things slide is blame-free; acting and failing is entirely on me.',
    { OMIT_SLIDE_EN: [] }],
  ['omission_bias', 'Letting things slide is blame-free; acting and failing is entirely on me.',
    { EXCUL_BLAMEFREE_EN: [] }],
  // omission_bias SOLO_EN E5/E6 注入：E5 与 E6 双签名的原样本删任一条
  // 仍被另一条兜住，故注入改用各自单腿样本（E5-only / E6-only）
  ['omission_bias', 'Not acting only costs time, so I will hold back.',
    { SOLO_EN: dropMarked(OMIT.SOLO_EN, /costs/) }],
  ['omission_bias', 'Acting wrongly is a real sin, so I will hold back.',
    { SOLO_EN: dropMarked(OMIT.SOLO_EN, /sin\|crime/) }],
  // planning_fallacy
  ['planning_fallacy', '上次纯属意外，这次工期绝不会再超时。',
    { WILL_REJECT_REF_ZH: dropMarked(PLAN.WILL_REJECT_REF_ZH, /纯属/) }],
  ['planning_fallacy', '上次纯属意外，这次工期绝不会再超时。',
    { EST_PROMISE_ZH: dropMarked(PLAN.EST_PROMISE_ZH, /绝不会/) }],
  ['planning_fallacy', '这次我吃透每个环节，工期肯定比计划还短。',
    { WILL_DISMISS_ZH: dropMarked(PLAN.WILL_DISMISS_ZH, /吃透/) }],
  ['planning_fallacy', '我又加了三个人进项目组，人手翻倍，交付只会更快。',
    { WILL_EFFORT_ZH: dropMarked(PLAN.WILL_EFFORT_ZH, /人手/) }],
  ['planning_fallacy', '我又加了三个人进项目组，人手翻倍，交付只会更快。',
    { EST_DURATION_ZH: dropMarked(PLAN.EST_DURATION_ZH, /工期\|进度/) }],
  ['planning_fallacy', 'Last time was a fluke; I have now mastered every step, so no more overruns.',
    { WILL_REJECT_REF_EN: dropMarked(PLAN.WILL_REJECT_REF_EN, /fluke/) }],
  ['planning_fallacy', 'Last time was a fluke; I have now mastered every step, so no more overruns.',
    { EST_PROMISE_EN: dropMarked(PLAN.EST_PROMISE_EN, /overruns/) }],
  ['planning_fallacy', 'I doubled the team size, so delivery can only get faster.',
    { WILL_EFFORT_EN: dropMarked(PLAN.WILL_EFFORT_EN, /doubled/) }],
  ['planning_fallacy', 'I doubled the team size, so delivery can only get faster.',
    { EST_DURATION_EN: dropMarked(PLAN.EST_DURATION_EN, /only/) }],
];
let injTotal = 0, injRed = 0;
for (const [dim, s, inj] of injections) {
  injTotal++;
  const detect = { money_illusion: detectMoneyIllusion, loss_aversion: detectLossAversion, omission_bias: detectOmissionBias, planning_fallacy: detectPlanningFallacy }[dim];
  // 删条前必须命中（否则该样本不是本族的承重样本，注入无意义）
  const before = detect(s, {});
  if (before.hit !== true) { fail++; console.error('FAIL inj-baseline ' + dim + ': ' + s.slice(0, 24)); continue; }
  const after = detect(s, inj);
  if (after.hit === false) injRed++;
  else { fail++; console.error('FAIL inj ' + dim + ' 删条后仍命中: ' + s.slice(0, 24)); }
}
t('injections all red (' + injRed + '/' + injTotal + ')', () => {
  assert.strictEqual(injRed, injTotal, '有注入未变红');
});

console.log('round-276: pass=' + pass + ' fail=' + fail);
if (fail > 0) process.exit(1);
