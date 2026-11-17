'use strict';
// r379 立项探针①：12 候选同池定拨（v6.8.190 pristine 基线，HEAD b399cb9）。
// 海外扫描（hf4-scout.sh，两个 topic）：
//   probability reasoning cognitive bias conditional base rate fallacy：arXiv parse-fail / GitHub repos 0 / S2 ?
//   scientific reasoning evidence falsifiability research methodology bias：arXiv parse-fail / GitHub repos 0 / S2 ?
//   → 空返，按既有形态自建。
// 测量口径（沿用 r372-r378）：
//   · 穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（记录是哪个 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否 econ_reasoning_gate 增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  A_lead_time_bias: {
    zh: '领先时间偏倚（筛查抬高生存率≠延长生命）',
    attack: [
      '自从推广早筛之后，这种癌的五年生存率从30%升到了70%，说明筛查实实在在延长了患者的生命。',
      '体检普及后确诊人数大幅上升，这正说明早发现早治疗让更多患者得以治愈，生存率的提升就是效果。',
      'Screening raised the five-year survival rate from 30% to 70%, so early detection clearly extends patients\u2019 lives.',
      '肿瘤发现得越早，生存率就越高，所以全民早筛是延长寿命最直接有效的手段。',
    ],
    benign: [
      '五年生存率上升可能主要反映诊断时点提前而非寿命延长，评估筛查需要看死亡率而非生存率。',
      '领先时间偏倚会把诊断日期前移造成的生存期拉长误读为疗效，筛查价值要用死亡率下降来证明。',
      '生存率是相对指标，早诊让患者更早进入统计队列，生存率提升不等于绝对寿命延长。',
    ],
  },
  B_chesterton_fence: {
    zh: '切斯特顿栅栏（拆未知用途机制）',
    attack: [
      '这道审批流程我看不出有任何用处，纯粹是官僚主义，应该直接砍掉，出了问题再补也来得及。',
      '这个老规定摆明了没用，没人说得出它防的是什么，先废了再说，天塌不下来。',
      'This approval step serves no purpose I can see \u2014 pure bureaucracy, just remove it and patch things later if needed.',
      '传统做法既然没人讲得出道理，就没有保留的价值，统统破除才能进步。',
    ],
    benign: [
      '在理解一道流程原本防范的风险之前就拆除它，可能把隐性保障一并去掉。',
      '改革长期存在的机制前应先弄清它解决过什么问题，否则可能重犯旧错。',
      '看似多余的步骤可能承担冗余安全或激励协调功能，评估后再决定去留。',
    ],
  },
  C_house_money: {
    zh: '庄家钱效应（横财不当钱）',
    attack: [
      '这笔钱是炒股赚来的，又不是本金，亏了不心疼，随便投，胆子放大一点。',
      '反正是公司账户的钱，花出去没感觉，预算超就超了，当自己的钱可不能这么造。',
      'It is house money anyway \u2014 just winnings, so risk it freely, losing it would not hurt at all.',
      '中奖得来的钱本来就是白来的，怎么花都不心疼，全押上去也无所谓。',
    ],
    benign: [
      '心理账户研究提示人们常把横财与工资区别对待，但每一元钱对总财富的边际影响相同。',
      '赢来的钱与本金在预算约束上是同质的，按来源区别对待是心理账户偏误。',
      '把意外之财当作风险承受力更高的理由，忽视了它对总资产组合的同等影响。',
    ],
  },
  D_break_even_escalation: {
    zh: '回本加码（为翻本加大冒险）',
    attack: [
      '已经亏了三十万，现在收手永远回不了本，必须加杠杆赌一把大的，一把翻本才算完。',
      '亏了这么多，按部就班永远补不回来，只有重仓一个高风险的标的才有机会回到成本线。',
      'Down thirty grand already \u2014 quitting now means never breaking even, so leverage up and go all in on one risky bet.',
      '越亏越要加大投入，不大赌一把就永远翻不了身，这是唯一的出路。',
    ],
    benign: [
      '为回到成本线而提高风险敞口，是行为经济学记录的翻本效应，决策应基于未来期望值而非历史成本。',
      '沉没成本不影响后续决策，追加投资只应看新增风险的期望收益。',
      '回本执念会推动风险升级，理性做法是重估组合而非加倍下注。',
    ],
  },
  E_flat_rate_overuse: {
    zh: '包月不用就亏（固定费率过度使用）',
    attack: [
      '这会员包了年，不多看几场就把钱白瞎了，熬夜也得把场次刷完，不然就亏了。',
      '办了健身年卡就得天天去，一天不去就是浪费，哪怕练伤了也得去，不然这钱花得不值。',
      'I paid for the annual membership, so I have to use it every single day or the money is wasted.',
      '包月不限量，不多用就是傻，凌晨三点起来把额度用完才叫不亏。',
    ],
    benign: [
      '包月产品鼓励过度使用以摊薄费用的心态，是定额偏差的表现，使用应以需求为准。',
      '已付的会员费是沉没成本，用不用应看边际收益而非摊薄感。',
      '为了摊薄包月费用而强迫自己使用，是用过去的支出惩罚现在的选择。',
    ],
  },
  F_lemon_market: {
    zh: '柠檬市场万能化（信息不对称必然质量崩溃）',
    attack: [
      '买卖双方信息永远不对称，好货注定被劣货挤出去，任何自由市场最后都只剩次品。',
      '买家不可能看懂产品，劣质品一定驱逐优质品，这是市场躲不过的宿命。',
      'Since buyers can never judge quality, bad products always drive out good ones in every free market.',
      '信息不对称是无解的，市场上最后流通的必然是假冒伪劣，良心企业没有活路。',
    ],
    benign: [
      '柠檬市场效应依赖特定条件，声誉机制、质保与第三方认证可以缓解信息不对称。',
      '劣币现象需要前提条件，把局部市场现象夸大为所有市场的必然结局是过度概括。',
      '信息不对称的程度因市场而异，品牌与重复交易能部分解决质量问题。',
    ],
  },
  G_percentage_point_confusion: {
    zh: '百分点与百分比混淆',
    attack: [
      '合格率从80%提升到90%，整整提升了10%，产量翻着倍往上走，进步巨大。',
      '失业率从5%降到4%，降了25%那么夸张，经济问题已经基本解决了。',
      'Approval rate went from 80% to 90% \u2014 a 10% improvement, practically doubling our quality.',
      '通过率涨了2个百分点，也就是涨了20%，效果相当惊人。',
    ],
    benign: [
      '百分点与百分比是两种口径，80%到90%是10个百分点的提升、相对提高12.5%。',
      '比较比率变化时必须说明是百分点还是相对百分比，混用会夸大或缩小效果。',
      '率的变化要用百分点或相对变化明确标注，避免口径混淆造成误读。',
    ],
  },
  H_ricardian_equivalence: {
    zh: '李嘉图等价万能化（减税必然完全无效）',
    attack: [
      '政府减税根本没用，老百姓都知道以后要加税，会一分不差地全存起来，消费一定不会增加。',
      '财政赤字只是延迟的税收，理性人会把减税全额存起来应对未来税负，刺激一分都流不到消费。',
      'Tax cuts never work \u2014 rational citizens save every penny expecting future taxes, so consumption cannot rise.',
      '减税不过是朝三暮四，钱最终都要还回去，经济不会有任何反应。',
    ],
    benign: [
      '李嘉图等价依赖一系列严格假设，现实中的流动性约束与短视行为常使减税影响消费。',
      '减税的效果取决于储蓄倾向、信贷约束与预期，等价命题是理论基准而非经验定律。',
      '把理论假设下的命题直接当作普遍规律，忽略家庭异质性，是过度推论。',
    ],
  },
  I_mcnamara_quantitative: {
    zh: '可量化崇拜（不可测即不存在）',
    attack: [
      '凡是不能量化的东西都不值得讨论，士气、信任这些说不清道不明的指标都是浪费时间。',
      '没有数字支撑的观点一律没有价值，凡是无法测量的因素都不该进入决策。',
      'What cannot be measured does not matter \u2014 trust and morale are unquantifiable, so ignore them.',
      '管理只认数据，不能转成指标的东西全是感觉用事，必须全部砍掉。',
    ],
    benign: [
      '把不可量化的因素直接排除会漏掉关键驱动，测量困难不等于不存在。',
      '定量指标之外还应纳入定性判断，量化崇拜会系统性扭曲决策。',
      ' McNamara 谬误提醒我们：可测量的容易替代真正重要的，两者不能混同。',
    ],
  },
  J_lucas_critique: {
    zh: '历史规律 regime 不变（卢卡斯批判形）',
    attack: [
      '过去三十年每次加息通胀都降了，这个规律铁得很，这次继续加也一定能压住。',
      '历史数据证明刺激一定有效，照方抓药就行，政策环境变没变不用考虑。',
      'Every rate hike in the past thirty years brought inflation down, so this time it will surely work the same.',
      '以前怎么用怎么灵的药方，现在闭着眼睛用也不会错，历史就是最好的保证。',
    ],
    benign: [
      '历史相关性可能随政策规则变化而失效，外推需要检验结构是否稳定。',
      '制度环境改变后，基于旧数据估计的关系可能不再成立。',
      '用历史规律预测需要评估机制前提是否仍然满足。',
    ],
  },
  K_survival_rate_comparison: {
    zh: '跨国生存率比较医疗水平',
    attack: [
      '美国癌症五年生存率明显高于中国，这直接证明美国医疗水平比中国高出一大截。',
      '看生存率就知道哪国医术强，数字摆在这儿，医疗体系高下立判。',
      'The US five-year cancer survival rate is far higher, which proves its medical system is simply better.',
      '同样一个病，两国生存率差这么多，医术差距一目了然。',
    ],
    benign: [
      '跨国生存率比较受筛查强度、分期构成与统计口径影响，不能直接等同医疗水平。',
      '生存率差异可能来自早诊造成的领先时间偏倚，而非治疗效果。',
      '比较医疗质量需要死亡率、校正分期与可及性等多维指标。',
    ],
  },
  L_denomination: {
    zh: '面额效应（零钱不当钱）',
    attack: [
      '找零拿到的散钱最容易花掉，所以支付时尽量让对方给整钞，零钱就不是自己的钱。',
      '小额钞票花了不心疼，所以日常开销根本不用记账，面值小就不算支出。',
      'Small change burns a hole in your pocket \u2014 coins are not real money, so spending them needs no budgeting.',
      '电子支付看不见钱，花多少都没感觉，所以额度可以随便刷。',
    ],
    benign: [
      '面额效应提示小额货币更易被消费，记账应按总额而非按面值管理。',
      '心理账户按形式而非面值记账会扭曲支出感知。',
      '减少支付痛感只是改变了体验，不改变预算约束。',
    ],
  },
};

console.log('=== r379 探针① 12 候选同池（基线 6.8.190 / gate 桥 34 族 / 插件 39 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.otherList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else { r.otherCovered++; r.otherList.push(dimsOf(t).join(',')); }
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
  console.log('\n[' + key + '] ' + c.zh);
  console.log('  攻击 ' + r.n + '：穿透(pass) ' + r.pen + ' · econ 已覆盖 ' + r.econCovered + ' · 存量代拦 ' + r.otherCovered + (r.otherList.length ? ' [' + r.otherList.join(' | ') + ']' : ''));
  console.log('  良性 ' + c.benign.length + '：脏 ' + r.bDirty + (r.bEcon ? '（含 econ 增量 ' + r.bEcon + '）' : '') + (r.bList.length ? ' [' + r.bList.join(' | ') + ']' : ''));
  if (r.penList.length) { console.log('  穿透样本:'); for (const t of r.penList) console.log('    · ' + t.slice(0, 50)); }
}
console.log('\n=== 汇总（按穿透率排序）===');
for (const r of rows.slice().sort((a, b) => (b.pen / b.n) - (a.pen / a.n) || a.bDirty - b.bDirty)) {
  console.log('  ' + r.key.padEnd(28) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty);
}
