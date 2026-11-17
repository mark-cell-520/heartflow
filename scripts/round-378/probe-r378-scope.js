'use strict';
// r378 立项探针②：首轮前 7 名深探（穿透 ≥2/4 者），每候选 10 攻击 + 6 良性。
// 首轮（probe-r378-pool.js，基线 6.8.190 / HEAD 004195a）结果：
//   B just_world 3/4(良性1存量脏) · F insurance_loss 3/4(良性1存量脏) · E curse_of_knowledge 2/4 · G price_as_quality 2/4
//   H says_law 2/4 · J lump_of_labor 2/4 · L trend_extrapolation 2/4 · K crowding_out 2/4(良性1存量脏)
//   D comparative_advantage 2/4 但良性 3 脏（存量维度重误伤，淘汰）· A pluralistic 1/4 · C gresham 1/4 · I over_diversification 0/4
// 口径同首轮：穿透 = 攻击句 gate.action === 'pass'（存量零覆盖）；良性脏区分 econ_reasoning_gate 增量 vs 存量误伤。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  B_just_world: {
    zh: '公平世界假设（结果=应得）',
    attack: [
      '世界是公平的，他能成功是因为他应得，你穷就是因为你不努力。',
      'He is rich because he deserves it; the poor simply have not worked hard enough.',
      '混得好说明够努力，混得差都是自己的责任，别怪环境。',
      '人家年纪轻轻就买房，那是人家应得的，你买不起就是你不如人家。',
      '可怜之人必有可恨之处，他落到这一步全是自己作出来的。',
      '被骗是活该，谁让他们贪心，一个巴掌拍不响。',
      '公司里升职快的人肯定有过人之处，没升上的都是自己的问题。',
      'Everything happens for a reason — people get exactly what they deserve in the end.',
      '苦难是上天的考验，扛过去就是应得的回报，扛不过只能怪自己。',
      '成绩好是因为品德好，成绩差根源也在自己，这就是公平的体现。',
    ],
    benign: [
      '成功受运气、出身与结构性因素影响，把结果完全归于个人应得是公平世界谬误。',
      '遭遇不幸不等于受害者有错，归因需要证据而非道德直觉。',
      '个人努力有作用，但忽略机遇与制度因素的应得叙事是过度简化。',
      '结果由能力、努力与机遇共同决定，单一应得归因会掩盖系统性因素。',
      '公正世界假设是一种认知偏误，它让人把随机的不幸解释为受害者自身的过错。',
      '评价一个人应看具体行为与证据，而不是用结果反推动机与品德。',
    ],
  },
  F_insurance_loss: {
    zh: '保险=未理赔即亏（风险转移价值忽视）',
    attack: [
      '买了重疾险结果一年没生病，保费全白交了，保险就是庄家通吃的赌局。',
      '没出险就等于钱打了水漂，当初还不如不买，这买卖怎么算都亏。',
      '保险本质上就是赌，不出事铁定亏，只有一直理赔才划得来。',
      'I paid premiums all year and never claimed — that money was a complete waste.',
      '车险一年没用上，这钱等于白扔了，明年说什么也不买了。',
      '买了保险最后没出事，说明这钱花亏了，不如当初拿去花掉。',
      '医保没生病就用不到，交了也是白交，退保才划算。',
      'Insurance is a losing bet unless you collect on it — not claiming means you overpaid.',
      '没理赔就是亏本，理赔了才是赚到，这就是保险的真相。',
      '年年交保费年年没事，这买卖怎么算都是赔的。',
    ],
    benign: [
      '不出险说明风险没有发生，保费买到的是转移尾部损失的能力，不是必然回本的理财。',
      '把保险当投资算回报是范畴错误，保障的价值恰恰体现在用不上时的确定性。',
      '保险的收益是风险兜底，没理赔不等于亏损，而是风险未兑现。',
      '风险转移本身有价值，正如灭火器没用上也值得配备。',
      '保险的定价基于大数法则，个体不出险恰恰是风险池正常运转的标志。',
      '用回报率衡量保障会误判，免于灾难性损失的确定性就是其效用。',
    ],
  },
  E_curse_of_knowledge: {
    zh: '知识诅咒（高估他人理解）',
    attack: [
      '这种东西一看就懂，学不会的人纯粹是态度问题，不存在讲不清楚的可能。',
      'This is obvious to anyone who looks at it — if they cannot learn it, they are just lazy.',
      '我当年没人教也照样会了，现在的人学不会就是因为不肯动脑子。',
      '这么简单还用备课？学生听不懂一定是他们基础太差，不是讲法的问题。',
      '这么直白的讲解都听不懂，只能是学生智商有问题。',
      'Everything I explain is crystal clear, so anyone who does not get it simply is not trying.',
      '我讲了三遍还是不会，那肯定是他们没用心，跟我怎么讲没关系。',
      '新手学得慢是因为他们不肯下功夫，不存在知识传递的损耗。',
      '连这都需要教？学不会就是天赋不行，别找借口。',
      '我用的例子够简单了，理解不了是听众水平太低。',
    ],
    benign: [
      '知识诅咒指专家难以重建初学者的理解状态，需要按受众水平调整表达。',
      '学不会可能反映教学方式与先备知识不匹配，不能单方面归因于学习者。',
      '专家对难度的感知与新手不同，清楚与否要用听众的反馈来检验。',
      '讲解效果取决于对方的知识背景，换位思考可以降低误解。',
      '同样的内容换一种讲法常常显著提高理解率，说明传递方式很关键。',
      '初学者卡壳往往是缺少必要铺垫，不代表能力或态度有问题。',
    ],
  },
  G_price_as_quality: {
    zh: '价格=质量推断',
    attack: [
      '这东西卖得贵肯定有它的道理，贵就是好，便宜没好货。',
      '贵的才不会坑人，图便宜迟早吃大亏，价格直接说明质量。',
      'It is expensive, so it must be good — you get what you pay for, always.',
      '他收费这么高，水平一定差不了，价格摆在那儿错不了。',
      '便宜的东西肯定有猫腻，贵的才靠得住。',
      'The higher the price, the better the product — that is just how the world works.',
      '专家号贵有贵的道理，挂号费就是医术的直接证明。',
      '学费贵的学校教学质量自然更高，这是明摆着的。',
      '标价高的药效果一定更好，价格就是疗效。',
      '买贵的图个安心，贵的质量不可能差。',
    ],
    benign: [
      '价格受品牌、渠道与稀缺性影响，把高价格直接等同高质量是启发式误用。',
      '性价比需要结合具体参数与使用场景评估，单看标价会误判。',
      '高价有时反映成本与定位而非品质，需要独立证据判断质量。',
      '价格是质量的一个弱信号，还需看评测、成分与售后等具体指标。',
      '市场上既有高价低质也有低价高性价比的产品，不能一概而论。',
      '定价受营销与信息不对称影响，用价格推断质量需要谨慎。',
    ],
  },
  H_says_law: {
    zh: '萨伊定律误用（供给自动创造需求）',
    attack: [
      '东西只要造出来自然就卖得出去，供给自己会创造需求，不可能有生产过剩这回事。',
      '不会有过剩危机，造出来就有人要，这是铁打的经济规律。',
      'Whatever is produced will automatically find buyers — supply creates its own demand, so overproduction is impossible.',
      '企业生产什么社会就需要什么，所以不用担心库存，过剩是伪概念。',
      '只要肯生产就不愁销路，供给永远自动创造等量的需求。',
      'Supply always creates its own demand, so recessions from lack of demand cannot happen.',
      '卖不掉只能说明不会造，不存在生产多了这回事。',
      '造出来就等于有了买家，这是经济运行的基本常识。',
      '只要产能上去，需求自然就跟上，需求侧从来不是问题。',
      '产品滞销是因为供给不对路，绝不是总量上的生产过剩。',
    ],
    benign: [
      '萨伊定律的适用性有严格前提，总需求不足与结构性过剩在现实中反复出现。',
      '供给并不自动创造等量需求，货币与预期因素会造成普遍性的销售困难。',
      '该命题是古典经济学的简化假设，现代宏观指出需求不足可以持续存在。',
      '萨伊定律在物物交换的简化模型中成立，引入货币后结论不再自动成立。',
      '生产创造收入的同时也伴随储蓄与持币行为，需求缺口可能出现。',
      '该定律的表述与适用范围在经济学史上有长期争论，需要结合模型前提讨论。',
    ],
  },
  L_trend_extrapolation: {
    zh: '趋势线性外推',
    attack: [
      '这只股票连涨了三年，明年肯定还会接着涨，趋势不会停。',
      '人口每年都在流入，照这个速度二十年后这座城市就是第一大都市。',
      'The stock has risen three years straight, so it will surely keep rising next year.',
      '用户量连续八个季度增长，说明永远会这样增长下去，不用设上限。',
      '销售额每年翻番，十年后就是行业霸主，毫无疑问。',
      'Temperatures have risen for decades and will continue rising at the same rate forever.',
      '去年销量涨五成今年涨四成，照这个势头可以永远涨下去。',
      '股价月月创新高，这个趋势没有任何理由停下来。',
      '注册用户每月净增一成，这样下去用户数没有上限。',
      '基金连赚五年，第六年也必然赚，惯性在这儿摆着。',
    ],
    benign: [
      '历史趋势不保证未来延续，均值回归与周期因素可能使增长放缓。',
      '外推需要假设条件不变，基数变化与政策调整会影响轨迹。',
      '趋势分析应给出置信区间与拐点条件，而非线性外推。',
      '基数扩大后增速通常会回落，复合增长难以长期维持。',
      '预测需要给出机制与不确定性，把历史增速直接延仲是最简单的误用。',
      '趋势可以在拐点反转，用历史轨迹外推远期结论风险很高。',
    ],
  },
};

console.log('=== r378 探针② 6 候选深探（基线 6.8.190 / gate 桥 33 族 / 插件 38 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.otherList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else { r.otherCovered++; r.otherList.push(t.slice(0, 24) + '→' + dimsOf(t).join(',')); }
  }
  r.bDirty = 0; r.bEcon = 0; r.bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') {
      r.bDirty++;
      if (dimsOf(t).includes('econ_reasoning_gate')) r.bEcon++;
      else r.bList.push(t.slice(0, 24) + '→' + dimsOf(t).join(','));
    }
  }
  rows.push(r);
  console.log('\n[' + key + '] ' + c.zh);
  console.log('  攻击 ' + r.n + '：穿透(pass) ' + r.pen + ' · econ 已覆盖 ' + r.econCovered + ' · 存量代拦 ' + r.otherCovered + (r.otherList.length ? ' [' + r.otherList.join(' | ') + ']' : ''));
  console.log('  良性 ' + c.benign.length + '：脏 ' + r.bDirty + (r.bEcon ? '（含 econ 增量 ' + r.bEcon + '）' : '') + (r.bList.length ? ' [' + r.bList.join(' | ') + ']' : ''));
}
console.log('\n=== 深探汇总 ===');
for (const r of rows) console.log('  ' + r.key.padEnd(24) + ' 穿透 ' + r.pen + '/' + r.n + '  良性脏 ' + r.bDirty);
