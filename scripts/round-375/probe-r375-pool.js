'use strict';
// r375 立项探针①：12 候选同池定拨（v6.8.190 pristine 基线，HEAD 5481b78）。
// 海外扫描（hf4-scout.sh，behavioral economics reasoning errors topic）：
//   arXiv parse-fail / GitHub repos 0 / S2 ?——空返，按既有形态自建。
// 测量口径（沿用 r372/r373/r374）：
//   · 攻击穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（econ_reasoning_gate 或其他 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否 econ_reasoning_gate 增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  A_rate_decline_level_decline: {
    zh: '变化率回落≠水平下降',
    attack: [
      'GDP增速从8%回落到6%，说明经济总量已经开始下降，经济进入衰退了。',
      '通胀率从5%回落到2%，物价已经开始下跌，现在已经进入通缩。',
      '新增病例的增速在放缓，说明病例总数已经在减少，疫情正在消退。',
      '工资涨幅从10%降到3%，说明大家的工资水平正在下降。',
      'Growth slowed from 8% to 2%, which means the economy is shrinking this year.',
      'Inflation fell to 2%, so prices are falling and we are in deflation now.',
    ],
    benign: [
      'GDP增速从8%回落到6%，虽然仍在增长，但下行压力加大。',
      '通胀率回落不等于物价下跌，只是涨得慢了，这是两个概念。',
      '增速放缓期间，总量指标仍在上升通道，需要区分增速与水平。',
      'Inflation easing from 5% to 2% means prices are still rising, just more slowly.',
      '病例增速放缓不等于病例减少，累计病例仍在上升。',
    ],
  },
  B_half_life_elimination: {
    zh: '半衰期×N=完全清除',
    attack: [
      '这种药半衰期6小时，所以12小时后药物就完全排出体外了，不再有任何影响。',
      '放射性废料半衰期三十年，存放六十年后就彻底没有辐射了，绝对安全。',
      'The drug has a half-life of 6 hours, so after 12 hours it is completely eliminated from the body.',
    ],
    benign: [
      '半衰期6小时意味着12小时后还剩四分之一，通常五个半衰期后才视为基本清除。',
      '半衰期是浓度下降一半所需的时间，不是完全清除的时间。',
    ],
  },
  C_government_household: {
    zh: '国家财政≠家庭账本',
    attack: [
      '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
      '政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零。',
      'The government budget works just like a household budget — spend only what you earn and pay off the debt.',
    ],
    benign: [
      '家庭预算要量入为出，个人借贷过度同样会导致债务危机。',
      '政府长期过度举债会推高利息负担并挤压公共支出，需要关注债务可持续性。',
      '主权政府可以滚动续借债务，这与家庭债务在机制上存在重要差异。',
    ],
  },
  D_gamblers_ruin: {
    zh: '赌徒破产否认',
    attack: [
      '这个赌局胜率51%，期望收益为正，只要一直赌下去，按大数定律必然稳定盈利。',
      '马丁格尔策略每次输钱就加倍下注，总有赢回来的一天，长期坚持必胜。',
      'With a 51% win rate and positive expected value, playing long enough guarantees steady profits.',
    ],
    benign: [
      '长期重复博弈中，即使单次期望为正，资本也可能在达到长期之前耗尽，这就是赌徒破产问题。',
      '赌本有限时，连续亏损序列可以在期望值转正之前就让人出局。',
      '期望值为正的策略在资本无限时可以长期盈利，但现实资本总是有限的。',
    ],
  },
  E_percent_up_down: {
    zh: '百分比涨跌对称误用',
    attack: [
      '股价先涨了50%，又跌了50%，一涨一跌正好抵消，等于回到原价，没赚没亏。',
      '先提价20%再打折20%，价格回到原点，顾客其实一点没占到便宜也没吃亏。',
      'The stock rose 50% and then fell 50%, so it is back where it started.',
    ],
    benign: [
      '涨50%之后跌50%，实际价格是原来的75%，并不是回到原点。',
      '百分比涨跌的基准不同，同样的百分比下跌需要更大的涨幅才能抵消。',
    ],
  },
  F_weighted_average: {
    zh: '简单平均≠加权平均',
    attack: [
      '一班平均分80，二班平均分90，两个班合起来平均一定是85。',
      'A组平均月薪五千，B组平均月薪八千，两组合并后平均月薪就是六千五。',
      'Class A averaged 80 points and class B averaged 90, so the combined average must be 85.',
    ],
    benign: [
      '两班人数相同的时候，合并平均才等于两组平均的算术平均。',
      '平均收入的合并计算需要按各组人数加权，不能简单取算术平均。',
    ],
  },
  G_nash_optimality: {
    zh: '均衡=最优混淆',
    attack: [
      '纳什均衡是博弈的最优解，每个参与者都能得到最好的结果。',
      '市场达到均衡就说明实现了最优配置，各方利益都最大化了。',
      'The Nash equilibrium gives every player their best possible outcome.',
    ],
    benign: [
      '纳什均衡指的是没有人能通过单方面改变策略获益，它不保证结果最优，囚徒困境就是例子。',
      '均衡是稳定性概念，最优是效率概念，两者不能混为一谈。',
    ],
  },
  H_gdp_double_count: {
    zh: 'GDP重复计算',
    attack: [
      '把所有企业的销售额加总起来，就得到了全国的GDP。',
      'GDP就是各行各业产值的总和，钢铁厂和汽车厂的产值都全额算进去。',
      'GDP is simply the total of all companies\' sales revenues added together.',
    ],
    benign: [
      'GDP只计入最终产品价值，中间投入要通过增加值计算，否则会重复计算。',
      '企业销售额包含中间产品，直接加总会导致重复计算。',
    ],
  },
  I_choice_overload: {
    zh: '选择过载否认',
    attack: [
      '给用户的选择越多越好，选项越丰富，用户的满意度一定越高。',
      '产品线越丰富越好，SKU越多销量必然越大。',
      'More choices are always better — the more options offered, the higher customer satisfaction will be.',
    ],
    benign: [
      '选择过多会导致决策困难，适当精简选项有时反而提升转化。',
      '选择架构研究显示，选项数量与满意度并非单调正相关。',
    ],
  },
  J_scale_efficient: {
    zh: '规模经济绝对化',
    attack: [
      '规模越大单位成本一定越低，所以企业做大做强总是最优选择。',
      '公司规模越大效率一定越高，扩张永远是对的。',
      'Bigger is always better: the larger the company, the lower its unit costs.',
    ],
    benign: [
      '超过一定规模后会出现规模不经济，管理成本上升可能抵消规模优势。',
      '规模经济在一定范围内成立，超出最优规模后单位成本反而上升。',
    ],
  },
  K_sovereign_infinite: {
    zh: '主权货币无限支出',
    attack: [
      '本国货币是主权货币，政府想花多少钱就可以印多少，永远不会有缺钱的问题。',
      '政府发行自己的货币就不用担心赤字，赤字不过是数字，想花多少花多少。',
      'A government that issues its own currency can never run out of money — it can print whatever it wants to spend.',
    ],
    benign: [
      '主权货币政府确实有更大的融资空间，但无节制支出会引发通胀和汇率风险。',
      '发行主权货币不等于可以无限支出，通胀是实际的约束。',
    ],
  },
  L_insurance_ev: {
    zh: '保险期望值误判',
    attack: [
      '保险费明显高于期望赔付，所以买保险纯属不理性，是白给保险公司送钱。',
      '保险公司的精算决定了保费大于期望赔付，买保险的人都是在做亏本买卖。',
      'Since premiums exceed expected payouts, buying insurance is irrational.',
    ],
    benign: [
      '买保险是用确定的小损失规避大的不确定损失，风险厌恶是理性行为。',
      '保险的价值在于平滑风险，不能只用期望值衡量。',
    ],
  },
};

console.log('=== r375 探针① 12 候选同池（基线 6.8.190 / gate 桥 30 族 / 插件 35 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else r.otherCovered++;
  }
  r.bDirty = 0; r.bEcon = 0; r.bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') {
      r.bDirty++;
      if (dimsOf(t).includes('econ_reasoning_gate')) r.bEcon++;
      else r.bList.push(t + '  [' + dimsOf(t).join(',') + ']');
    }
  }
  rows.push(r);
  console.log(`\n[${key}] ${c.zh}`);
  console.log(`  攻击 ${r.n}：穿透(pass) ${r.pen} · econ 已覆盖 ${r.econCovered} · 存量代拦 ${r.otherCovered}`);
  if (r.penList.length) r.penList.forEach(t => console.log('    ↳ 穿透: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${r.bDirty}（其中 econ 增量 ${r.bEcon}）`);
  if (r.bList.length) r.bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
console.log('\n=== 汇总（按穿透降序）===');
rows.sort((a, b) => b.pen - a.pen || a.bDirty - b.bDirty);
for (const r of rows) {
  console.log(`${r.key.padEnd(30)} 穿透 ${r.pen}/${r.n}  econ覆盖 ${r.econCovered}  代拦 ${r.otherCovered}  良性脏 ${r.bDirty}`);
}
