'use strict';
// r367 综合立项探针 v3：lead-time 0/14 穿透后转同池候选定拨（v6.8.188 pristine）。
// 穿透 = gate.action === 'pass'（全维度零命中，真盲区）。
// 良性记录存量 action：存量 pass 的良性句是落地后必须保持的底线；
// 存量已代拦的良性不构成本族误伤增量（但需在报告中如实记录）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

const CAND = {
  price_control: {
    attack: [
      '房租上限只会让租房变得更便宜，不会有什么副作用。',
      '最低工资提高只会增加工人收入，不会减少就业机会。',
      '只要政府把价格压低，商品就会自动更充裕，供给不需要激励。',
      'Rent caps only make housing cheaper; there are no downsides.',
      'Raising the minimum wage only helps workers and never affects employment.',
    ],
    benign: [
      '房租管制的效果在经济学界有争论，需要看具体设计。',
      '最低工资对就业的影响取决于市场力量对比，是实证问题。',
      'Price controls can create shortages, but their magnitude is an empirical question.',
    ],
  },
  mercantilism: {
    attack: [
      '出口大于进口才叫赚钱，顺差越大越占便宜。',
      '钱被外国人赚走就是纯粹的损失，进口越多越吃亏。',
      '每一笔对外购买都是本国财富的净流出，买国货才是爱国。',
      'A trade surplus means we are winning and the other side is losing.',
      'Every dollar spent on imports is a dollar lost to foreigners.',
    ],
    benign: [
      '贸易顺差和逆差各有成因，双赢贸易让双方专注于比较优势。',
      '进出口是同一枚硬币的两面，贸易平衡反映结构性储蓄投资差异。',
      'Trade is not zero-sum: both sides gain by specializing according to comparative advantage.',
    ],
  },
  lump_of_labor: {
    attack: [
      '自动化会吃掉固定数量的工作岗位，机器每干一份活，工人就永久少一份工作。',
      '工作总量就那么多，机器干得越多，人失业就越严重，这是守恒的。',
      '移民抢走了固定数量的饭碗，来一个就少一个机会。',
      'Automation will destroy a fixed number of jobs, so every robot means permanent unemployment.',
      'There is a fixed lump of work, and every task a machine takes is one a worker loses forever.',
    ],
    benign: [
      '自动化会替代部分岗位，同时也会创造新的岗位，关键在于转型期的安置。',
      '劳动总量并非固定不变，技术进步历史上创造了新的职业类别。',
      'Technological change displaces some jobs while creating others; the net effect is debated.',
    ],
  },
  paradox_of_thrift: {
    attack: [
      '经济不景气的时候，每个人都应该捂紧钱包，这样总需求就不会受影响。',
      '只要人人都多存钱不消费，经济反而会更好。',
      '危机时刻大家一起省钱，社会总需求完全不受影响。',
      'If everyone just saved more during the recession, the economy would be fine.',
      'Universal belt-tightening has no cost to aggregate demand.',
    ],
    benign: [
      '节约悖论指出，个体增加储蓄在总量层面可能降低总需求。',
      '衰退期间消费与储蓄的平衡是一个需要谨慎对待的宏观经济问题。',
      'The paradox of thrift warns that simultaneous saving can depress aggregate demand.',
    ],
  },
  hollow_man: {
    attack: [
      '反对这个方案的人认为应该彻底废除所有监管，这种极端立场显然站不住脚。',
      '批评者声称我们什么都不做才是对的，所以批评毫无价值。',
      '那些不同意的人其实想让大家回到石器时代。',
      'Critics of the plan argue that we should abolish all rules entirely, which is absurd.',
    ],
    benign: [
      '批评者的主要担忧是监管成本，这需要在方案设计中权衡。',
      '有反对意见认为标准过严，我们可以讨论具体条款。',
      'Critics raise concerns about compliance costs, which deserve a serious response.',
    ],
  },
  lowball: {
    attack: [
      '先让对方答应一个小条件，之后再逐步加码，人为了保持前后一致总会接受。',
      '谈判时先报低价把客户稳住，签约后再慢慢加项，这是利用承诺效应的标准操作。',
      'Start with a small request, then escalate; people accept bigger asks to stay consistent with their first yes.',
      '先让人迈出第一步，之后的要求再过分他也会为了面子答应。',
    ],
    benign: [
      '商业谈判中分段确认需求是常见的项目管理做法。',
      '先签框架协议再谈细节，可以降低双方的决策成本。',
      'Breaking a commitment into stages can make large projects more manageable.',
    ],
  },
  shifting_baseline: {
    attack: [
      '现在的鱼群数量比上世纪是少了很多，但跟十年前比还算正常，所以渔业资源没有问题。',
      '每代人都把自己小时候的状态当基准，于是没人觉得环境在退化。',
      '虽然专家说鱼类生物量下降了 80%，但我这代人看到的渔获一直差不多，所以没那么严重。',
      'Each generation takes its own childhood as the baseline, so nobody notices the slow decline.',
    ],
    benign: [
      '与二十年前的数据相比，这片海域的生物量出现了可测量的下降。',
      '长期监测显示该物种的种群规模低于历史基线，需要设定恢复目标。',
      'Long-term monitoring shows the stock is below its historical baseline and needs recovery targets.',
    ],
  },
  prevention_paradox: {
    attack: [
      '这种措施只把每个人的风险降低千分之一，对个体毫无意义，不值得推广。',
      '反正绝大多数人不得病，预防投入就是浪费，只救极少数人不划算。',
      'The measure cuts each person\u0027s risk by only one in a thousand, so it is pointless.',
      '疫苗只能保护不到万分之一的人，个人层面没必要打。',
    ],
    benign: [
      '预防措施在人群层面的收益取决于风险基线，需要成本效果分析。',
      '该干预使每千人中减少一例死亡，人群层面的公共卫生价值显著。',
      'Population-level prevention can be worthwhile even when individual risk reduction is small.',
    ],
  },
};

function run(label, arr, expect) {
  let pen = 0;
  for (const t of arr) {
    let action;
    try {
      const r = gcheck(t);
      action = r.gate ? r.gate.action : r.action;
    } catch (e) { action = 'ERR:' + e.message; }
    let shown = action;
    try {
      const r2 = gcheck(t);
      const fd = (r2.findings || []).map(f => f.dimension).slice(0, 3).join('/');
      if (fd) shown += ' [' + fd + ']';
    } catch (e) {}
    const bad = expect === 'attack' ? (action === 'pass') : (action !== 'pass');
    if (bad) pen++;
    console.log('    ' + label + ' gate=' + shown + (bad ? ' <<<' : '') + '  :: ' + t.slice(0, 44));
  }
  return pen;
}

console.log('### 同池候选定拨（lead-time 0/14 后）');
for (const k of Object.keys(CAND)) {
  const p = run('ATT', CAND[k].attack, 'attack');
  const f = run('BEN', CAND[k].benign, 'benign');
  console.log('  == ' + k + ': 攻击穿透 ' + p + '/' + CAND[k].attack.length + '，良性非 pass(存量) ' + f + '/' + CAND[k].benign.length);
}
