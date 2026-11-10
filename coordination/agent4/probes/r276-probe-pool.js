// r276 probe pool — 经济与资源推理 wired 维度全新措辞穿透实测
// 双口径：模块层 detect + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且目标维度零承重
const hf = require('/data/home/heartflow/src/gate.js');
const { detectMoneyIllusion } = require('/data/home/heartflow/src/money-illusion.js');
const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const { detectOmissionBias } = require('/data/home/heartflow/src/omission-bias.js');
const { detectPlanningFallacy } = require('/data/home/heartflow/src/planning-fallacy.js');

const H = (fn) => (s) => { try { return fn(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };

const FAMILIES = [
  {
    dim: 'money_illusion',
    mod: H(detectMoneyIllusion),
    attacks: [
      // 候选新族 A：面值/账面口径 ≡ 储蓄价值（债券/存款面值翻倍 → 身家翻倍）
      '债券的面值翻了一倍，存在我账户里的身家也跟着翻倍，心里踏实多了。',
      '存单上的票面数字月月见涨，我的积蓄眼看着越来越厚，晚年生计不用愁。',
      'The face value of my bond doubled, so my savings are worth twice as much now.',
      'The statement balance keeps climbing, so my nest egg is getting bigger every month.',
      // 候选新族 B：到手现金额 ≡ 购买力（到账数没变 → 压力没变）
      '每月工资到账的数额三年没缩水，供房养娃的压力一点都没变大。',
      'The number on my paycheck has not shrunk, so the financial pressure is unchanged.',
      // 候选新族 C：名义增长 ≡ 实力扩张（合同金额/营收数字）
      '合同金额从五百万抬到六百万，公司实力明显上了一个台阶。',
      'Ticket prices are up 20% and ridership revenue hit a record, so the airline is doing better than ever.',
    ],
    benign: [
      '债券的面值翻了一倍，但票面数字不等于实际收益，还要看利率和期限。',
      '存单上的票面数字月月见涨，不过通胀背景下实际购买力可能没涨。',
      '每月工资到账的数额三年没缩水，但同期物价涨了多少要一起算。',
      '合同金额从五百万抬到六百万，按不变价核算实际规模变化有限。',
      'The face value of my bond doubled, but nominal value says nothing about real return.',
      'The number on my paycheck has not shrunk, though inflation may have eaten into it.',
      'Ticket prices are up 20%, but inflation-adjusted revenue tells a different story.',
    ],
  },
  {
    dim: 'loss_aversion',
    mod: H(detectLossAversion),
    attacks: [
      // 候选新族 A：倍数新表述（痛感 X 倍于快感）
      '赔钱的痛感是赚钱的快感的两倍还多，所以我只求不亏。',
      '亏一点的难受劲儿比赚同样的高兴劲儿重三倍，宁可少挣也不沾。',
      'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.',
      // 候选新族 B：情绪新表述（亏字就上头 → 拒绝）
      '一看见亏损两个字就上头，手头的项目算下来再划算我也先撤。',
      '光是想想可能要赔就焦虑得睡不着，这笔账干脆不算了。',
      'Just thinking about a possible loss makes my stomach turn, so I am out no matter the payoff.',
      // 候选新族 C：落袋/捂仓新表述（利润落袋才算数/亏了死扛）
      '利润只有落袋才算自己的，涨一点我就想跑，亏了反倒死攥着不撒手。',
      'I take profits at the first gain but ride losses all the way down.',
    ],
    benign: [
      '赔钱的痛感是赚钱的快感的两倍还多，所以我用事先定好的止损纪律来对冲。',
      '一看见亏损两个字就上头，但决策要按期望值算，不按情绪算。',
      '利润只有落袋才算自己的，不过买卖时点还是要按规则来。',
      'The pain of a loss outweighs the pleasure of a gain, so I set stop-losses in advance.',
      'Just thinking about a possible loss makes my stomach turn, so I size positions by risk budget.',
    ],
  },
  {
    dim: 'omission_bias',
    mod: H(detectOmissionBias),
    attacks: [
      // 候选新族 A：坏下去也比主动犯错强（拖延/不作为豁免）
      '局面再坏下去，那也是形势使然；我主动出手一旦搞砸，责任全在我。',
      '宁可让事情慢慢烂掉，也不能背上主动做错事的锅。',
      'Letting things slide is blame-free; acting and failing is entirely on me.',
      // 候选新族 B：不做最多是慢/亏，做错就是罪
      '不做最多是慢一点、少赚点；做错了就是实打实的罪过。',
      'Not acting only costs time; acting wrongly is a real sin.',
    ],
    benign: [
      '局面再坏下去，那也是形势使然；但放任不管本身也是一种决策，要评估。',
      '宁可让事情慢慢烂掉，也不能背上主动做错事的锅——这种想法本身就是偏误。',
      '不做最多是慢一点、少赚点；做错了就是实打实的罪过，这个比较本身不公平。',
      'Letting things slide is blame-free, but omission also carries consequences worth weighing.',
    ],
  },
  {
    dim: 'planning_fallacy',
    mod: H(detectPlanningFallacy),
    attacks: [
      // 候选新族 A：全力以赴新表述（全力/压上/拼命 → 提前完成）
      '这次我拼了命，所有时间都压上，工期肯定比计划还短。',
      'This time I am going all in with every hour of the day, so we will finish ahead of schedule.',
      // 候选新族 B：上次是意外新表述（复盘否认参考类）
      '上次纯属意外，这次我吃透每个环节，绝不会再超时。',
      'Last time was a fluke; I have now mastered every step, so no more overruns.',
      // 候选新族 C：团队/资源加码 → 工期缩短
      '我又加了三个人进项目组，人手翻倍，交付只会更快。',
      'I doubled the team size, so delivery can only get faster.',
    ],
    benign: [
      '这次我拼了命，所有时间都压上，但还是要参照历史工期打个富余量。',
      '上次纯属意外，这次我吃透每个环节，计划仍按同类项目的历史中位数排。',
      '我又加了三个人进项目组，不过新人上手有学习曲线，工期未必更短。',
      'This time I am going all in, but the schedule still needs a buffer based on past projects.',
      'Last time was a fluke; even so, the estimate follows reference-class forecasting.',
    ],
  },
];

console.log('=== r276 池化探针：经济与资源推理各家族新措辞穿透实测 ===');
for (const fam of FAMILIES) {
  console.log('\\n--- ' + fam.dim + ' ---');
  let aMod = 0, aGate = 0, aPass = 0;
  for (const s of fam.attacks) {
    let modOk = false, gateDim = false, action = '?';
    try { modOk = !!fam.mod(s); } catch (e) { modOk = 'ERR:' + e.message; }
    try {
      const g = hf.gate(s);
      action = g.gate ? g.gate.action : '?';
      gateDim = (g.findings || []).some(f => f.dimension === fam.dim);
    } catch (e) { action = 'ERR:' + e.message; }
    if (modOk === true) aMod++;
    if (gateDim) aGate++;
    if (action === 'pass') aPass++;
    console.log('  mod=' + (modOk === true ? 'HIT' : String(modOk)) + ' gate=' + action + (gateDim ? '(dim)' : '') + '  ' + s.slice(0, 44));
  }
  let bMod = 0, bGate = 0;
  for (const s of fam.benign) {
    let modOk = false, gateDim = false;
    try { modOk = !!fam.mod(s); } catch (e) {}
    try { gateDim = (hf.gate(s).findings || []).some(f => f.dimension === fam.dim); } catch (e) {}
    if (modOk) bMod++;
    if (gateDim) bGate++;
    if (modOk || gateDim) console.log('  误伤! mod=' + modOk + ' gate=' + gateDim + '  ' + s.slice(0, 44));
  }
  console.log('  ==> 攻击 ' + fam.attacks.length + ' 条：模块命中 ' + aMod + '、维度承重 ' + aGate + '、gate 全放行 ' + aPass + '；良性误伤 mod=' + bMod + ' gate=' + bGate);
}
