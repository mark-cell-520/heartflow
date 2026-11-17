'use strict';
// r375 立项探针②：六候选二段深探（10 攻击变体 + 8 良性边界，基线 6.8.190）。
// 定拨标准（沿用 r374）：穿透率（存量维度零覆盖的新增量）× 良性边界干净度
// （非 pass 是否系存量维度既有误伤、非本族增量）× 与既有 30 子族/262 维度射程
// 不相邻。探针①胜出者进入本段：C government_household / D gamblers_ruin /
// F weighted_average / H gdp_double_count / I choice_overload / L insurance_ev
// （A/E/G/J/K 探针①穿透 0 全部被存量 absolute_claim/confidence/perfect_error
//   代拦，出局）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  C_government_household: {
    zh: '国家财政≠家庭账本',
    attack: [
      '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
      '政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零。',
      'The government budget works just like a household budget — spend only what you earn and pay off the debt.',
      '治理国家要像居家过日子一样量入为出，绝不能用借钱的方式过日子。',
      '国债到期就必须全额偿还，跟还信用卡一个道理，不然国家信用就破产了。',
      '政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。',
      'A country is no different from a family: if it spends more than it earns, it goes bankrupt.',
      '国家欠的债和房贷一样，迟早是要还的，借得越多还得越惨。',
      '政府赤字就好比个人透支信用卡，拆东墙补西墙，最后一定崩盘。',
      '家庭都知道节俭持家，国家更应该如此，财政赤字就是败家行为。',
    ],
    benign: [
      '家庭预算要量入为出，个人借贷过度同样会导致债务危机。',
      '政府长期过度举债会推高利息负担并挤压公共支出，需要关注债务可持续性。',
      '主权政府可以滚动续借债务，这与家庭债务在机制上存在重要差异。',
      '企业连续亏损会破产清算，这是公司财务与主权财政的关键区别。',
      '政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。'.replace('政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。', '政府在基础设施投资上的回报周期比企业长，评估标准应当不同。'),
      '财政赤字的合理性与债务结构、增长前景有关，需要具体分析。',
      'A household that spends more than it earns will eventually face insolvency.',
      'Sovereign debt sustainability depends on growth, inflation, and debt structure.',
    ],
  },
  D_gamblers_ruin: {
    zh: '赌徒破产否认',
    attack: [
      '这个赌局胜率51%，期望收益为正，只要一直赌下去，按大数定律必然稳定盈利。',
      '马丁格尔策略每次输钱就加倍下注，总有赢回来的一天，长期坚持必胜。',
      'With a 51% win rate and positive expected value, playing long enough guarantees steady profits.',
      '只要胜率略占优势，长期下来一定是赚的，不存在输光的可能。',
      '赌本充足就可以高枕无忧，连续输的运气不可能一直持续下去。',
      '加倍下注法在数学上保证回本，只是需要的资金多一点而已。',
      'A favorable bet repeated often enough cannot lose in the long run.',
      '概率站在我这边，玩得越久赢得越多，这是大数定律的保证。',
      '长期来看期望值必然兑现，所以坚持下注就能稳定盈利。',
      '胜率过半就相当于掌握了长期提款机，不可能被输光。',
    ],
    benign: [
      '长期重复博弈中，即使单次期望为正，资本也可能在达到长期之前耗尽，这就是赌徒破产问题。',
      '赌本有限时，连续亏损序列可以在期望值转正之前就让人出局。',
      '期望值为正的策略在资本无限时可以长期盈利，但现实资本总是有限的。',
      '连胜之后该停了，运气不可能一直好下去。'.replace('连胜之后该停了，运气不可能一直好下去。', '赌场依靠大数定律在大量局数中稳定获利，这正是概率优势的体现。'),
      '这个游戏期望收益为负，长期参与必然亏损。',
      'The house edge ensures the casino profits over many plays.',
      'With finite capital, a losing streak can wipe you out before the long run arrives.',
      '赌博的长期结果由期望值和资本约束共同决定。',
    ],
  },
  F_weighted_average: {
    zh: '简单平均≠加权平均',
    attack: [
      '一班平均分80，二班平均分90，两个班合起来平均一定是85。',
      'A组平均月薪五千，B组平均月薪八千，两组合并后平均月薪就是六千五。',
      'Class A averaged 80 points and class B averaged 90, so the combined average must be 85.',
      '上半年平均增速6%，下半年平均增速8%，全年平均增速就是7%。',
      '第一组转化率3%，第二组转化率5%，两组合并转化率一定是4%。',
      '三个店的平均日销分别是一百、两百、三百，合并统计平均日销就是两百。',
      'Group one converted at 3% and group two at 5%, so the pooled conversion rate is 4%.',
      '平均工资一组八千一组一万二，合并之后平均就是一万。',
      '两项投资年化收益分别是5%和15%，组合起来年化收益就是10%。',
      '两次考试平均分70和80，学年平均分必定是75。',
    ],
    benign: [
      '两班人数相同的时候，合并平均才等于两组平均的算术平均。',
      '平均收入的合并计算需要按各组人数加权，不能简单取算术平均。',
      '上半年平均增速6%，下半年平均增速8%，全年增速要按上下半年基数加权计算。',
      '两组人数悬殊时，直接平均两组均值会低估人数多的组的影响。',
      'The pooled rate must be weighted by each group\'s sample size, not simply averaged.',
      '合并统计转化率时，应以总转化数除以总访问数。',
      'When both classes have the same number of students, the combined average is the simple mean.',
      '加权平均的权重来自各组规模，规模未知时无法直接合并。',
    ],
  },
  H_gdp_double_count: {
    zh: 'GDP重复计算',
    attack: [
      '把所有企业的销售额加总起来，就得到了全国的GDP。',
      'GDP就是各行各业产值的总和，钢铁厂和汽车厂的产值都全额算进去。',
      'GDP is simply the total of all companies\' sales revenues added together.',
      '把每个工厂的产值加起来，再加上商铺的营业额，这就是经济总量。',
      'GDP是全国所有企业营收的合计，营收越大经济越强。',
      '经济总量就是各行各业产值的加总，产值统计得越全越准。',
      'Adding up the output of every firm gives you the nation\'s total economic output.',
      '全国GDP等于各行业总产值之和，工业农业服务业的产值都要算。',
      '把产业链上每个环节的销售额都统计进来，汇总就是GDP。',
      '一个国家的经济规模，就是所有企业一年销售额的总和。',
    ],
    benign: [
      'GDP只计入最终产品价值，中间投入要通过增加值计算，否则会重复计算。',
      '企业销售额包含中间产品，直接加总会导致重复计算。',
      'GDP统计使用生产法和支出法，避免中间环节的重复计算。',
      '工业总产值与GDP不是一回事，前者包含重复计算。',
      'GDP counts only final goods and services to avoid double counting.',
      '增加值是产出减去中间投入，各行业增加值之和构成GDP。',
      '统计口径上，营业额与营业收入不等于增加值。',
      '经济总量的测算要防止产业链环节的重复累加。',
    ],
  },
  I_choice_overload: {
    zh: '选择过载否认',
    attack: [
      '给用户的选择越多越好，选项越丰富，用户的满意度一定越高。',
      '产品线越丰富越好，SKU越多销量必然越大。',
      'More choices are always better — the more options offered, the higher customer satisfaction will be.',
      '菜单上的菜品越多，顾客点得越开心，营业额也越高。',
      '选择越多用户越容易找到合适的，转化一定更好。',
      '品类越全越有竞争力，给用户提供无限选择总是最优策略。',
      'The more options in the lineup, the better — customers always want more choices.',
      '选项越多覆盖的需求越广，销量必然随选择数量上升。',
      '给用户无限的选择永远是对的，没人会因为选择太多而放弃。',
      'SKU翻倍销量就能翻倍，选择数量和销售额是正相关的。',
    ],
    benign: [
      '选择过多会导致决策困难，适当精简选项有时反而提升转化。',
      '选择架构研究显示，选项数量与满意度并非单调正相关。',
      '选项过多可能引发决策疲劳，产品设计需要做取舍。',
      '超市心理学实验发现，过量果酱摊位反而降低了购买转化。',
      'Too many options can overwhelm customers and depress conversion.',
      '精简SKU有助于降低库存成本并提升顾客决策效率。',
      'The relationship between choice count and satisfaction is not monotonic.',
      '选项设计要平衡覆盖度与决策成本。',
    ],
  },
  L_insurance_ev: {
    zh: '保险期望值误判',
    attack: [
      '保险费明显高于期望赔付，所以买保险纯属不理性，是白给保险公司送钱。',
      '保险公司的精算决定了保费大于期望赔付，买保险的人都是在做亏本买卖。',
      'Since premiums exceed expected payouts, buying insurance is irrational.',
      '期望赔付低于保费，保险是负和游戏，理性人都不该买。',
      '从期望值看保险注定亏钱，所以不买保险才是理性选择。',
      '保险公司要赚钱，保费必然高于期望赔付，买保险等于主动送钱。',
      'Insurance has a negative expected value for the buyer, so it is never rational to buy it.',
      '精算保证了保险公司稳赚，买保险就是为别人的利润买单。',
      '风险事件概率很低，期望赔付微不足道，买保险纯粹浪费钱。',
      '按期望值计算，买保险长期必亏，理性决策者应该自留风险。',
    ],
    benign: [
      '买保险是用确定的小损失规避大的不确定损失，风险厌恶是理性行为。',
      '保险的价值在于平滑风险，不能只用期望值衡量。',
      '效用函数凹性意味着确定性等价低于期望值，保险因此有正价值。',
      '保险通过风险汇聚让个体规避巨灾损失，是典型的理性安排。',
      'Insurance transfers risk from risk-averse individuals to a diversified pool.',
      '期望值相同的情况下，风险厌恶者愿意为降低波动付费。',
      '评估保险应看效用而非期望货币值。',
      '风险汇聚与分摊是保险市场的核心功能。',
    ],
  },
};

console.log('=== r375 探针② 六候选二段深探（基线 6.8.190 / gate 桥 30 族 / 插件 35 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.covList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else {
      const dims = dimsOf(t);
      if (dims.includes('econ_reasoning_gate')) r.econCovered++;
      else { r.otherCovered++; r.covList.push(t.slice(0, 30) + '… [' + dims.join(',') + ']'); }
    }
  }
  r.bDirty = 0; r.bEcon = 0; r.bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') {
      r.bDirty++;
      const dims = dimsOf(t);
      if (dims.includes('econ_reasoning_gate')) r.bEcon++;
      else r.bList.push(t.slice(0, 26) + '… [' + dims.join(',') + ']');
    }
  }
  rows.push(r);
  console.log(`\n[${key}] ${c.zh}`);
  console.log(`  攻击 ${r.n}：穿透 ${r.pen} · econ 已覆盖 ${r.econCovered} · 存量代拦 ${r.otherCovered}`);
  if (r.covList.length) r.covList.forEach(t => console.log('    ↳ 代拦: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${r.bDirty}（econ 增量 ${r.bEcon}）`);
  if (r.bList.length) r.bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
console.log('\n=== 汇总（穿透降序）===');
rows.sort((a, b) => b.pen - a.pen || a.bDirty - b.bDirty);
for (const r of rows) {
  console.log(`${r.key.padEnd(26)} 穿透 ${String(r.pen).padStart(2)}/${r.n}  代拦 ${r.otherCovered}  良性脏 ${r.bDirty}`);
}
