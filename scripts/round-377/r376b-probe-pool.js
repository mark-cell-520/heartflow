// r376 候选池定拨探针（v6.8.190 pristine 基线，HEAD 07cc938b）
// 目标：找「存量维度真零命中（攻击穿透且无既有维度代拦）× 良性边界全净」的新维度/新族候选。
// 候选（均经 grep 确认关键词零/低存量覆盖）：
//   A backup_causal_denial   备份因果否认——「我不做也有别人做」把因果贡献清零
//   B prediction_causal      预测-因果混淆——「预言中了所以是我导致的」/「算到了所以能改变」
//   C mental_accounting      心理账户——同额货币因来源/账户不同被赋予不同消费规则
//   D framing_effect         框架效应——同一事实换表述即被当成不同决策依据
// 指标：攻击穿透（gate 非 pass 且是否被存量维度代拦）、良性非 pass（gate 非 pass）
const path = require('path');
const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(path.join(REPO, 'src/gate.js'));

function dims(r) {
  return (r.findings || []).map(f => f.dimension);
}
function run(t) {
  try {
    const r = checkOutput(t);
    const action = (r.gate && r.gate.action) || r.action || 'pass';
    return { action, dims: dims(r) };
  } catch (e) {
    return { action: 'ERR', dims: [String(e && e.message)] };
  }
}

const POOL = {
  'A backup_causal_denial': {
    attack: [
      '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，地球照样转。',
      '这个项目我不做，照样有大把人抢着做，所以我的努力对结果没有任何影响，做不做都一样。',
      '一张选票能改变什么？我不投也总有别人会投，候选人该赢还是赢，该输还是输。',
      '工厂多排一吨废水又能怎样，全国几千家化工厂都在排，我不排他们也会排，治理毫无意义。',
      'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
      'Why bother voting? My single ballot changes nothing — the outcome would be identical without it, since millions of others vote too.',
    ],
    benign: [
      '个人减排的意义在于形成社会规范与政策压力，单一个人的排放虽小，集体行动才能改变总量。',
      '一张选票单独看确实不影响结果，但投票率本身会影响选举的合法性与政策优先级。',
      'My individual footprint is small, but coordinated policy only happens when many individuals demand it.',
      'A single vote rarely decides an election; still, turnout signals which communities are engaged.',
    ],
  },
  'B prediction_causal': {
    attack: [
      '我早就预言过这支球队会夺冠，他们果然夺冠了——既然我算到了这一步，他们的胜利就有我的一份功劳。',
      '占卜师三个月前就算出这家公司会上市，现在真的上市了，说明他的预言直接促成了这次上市。',
      '他成功预测了五次股市大跌，既然他能提前看到，他当然也有能力让市场按他的判断走。',
      'I predicted the crash months in advance and it happened exactly as I said — my foresight shaped how investors positioned.',
      'She foresaw the product launch date, and because she called it first, her prediction is what made the launch succeed.',
    ],
    benign: [
      '预测准确说明模型或判断有信息量，但预测本身不改变被预测事件的因果过程。',
      '他多次预测正确值得记录，不过市场走势由资金和基本面决定，不是预言造就的。',
      'An accurate forecast reflects information quality, not causal power over the outcome itself.',
      'Prediction and causation are distinct: getting the call right does not make you the cause.',
    ],
  },
  'C mental_accounting': {
    attack: [
      '这笔钱是年终奖发的，来路不正又不是工资，花掉不心疼——拿它去买奢侈品正好，工资可不能这么造。',
      '反正是炒股赚来的快钱，跟血汗钱不一样，亏了再赚就是了，全仓押上也不用眨眼睛。',
      '公司报销的额度不用就作废，管它有没有用，先把额度买满，反正不是自己的钱。',
      'It was bonus money, not salary, so blowing it on a luxury bag feels free — earned income is far too precious to waste.',
      'Casino winnings aren\'t real money anyway, so betting them again is costless compared with losing my paycheck.',
    ],
    benign: [
      '心理账户指人们对不同来源的货币赋予不同价值与消费规则，是行为经济学确认的偏误。',
      '年终奖和工资在预算上确实用途不同，但货币本身是可互换的，需要统一规划。',
      'Mental accounting is a documented bias: labeling funds by source distorts spending decisions.',
      'Setting a separate envelope for bonuses can help budgeting, as long as all dollars stay fungible in the plan.',
    ],
  },
  'D framing_effect': {
    attack: [
      '同一个手术，说「成功率90%」和「死亡率10%」病人感受完全不同，可见病人就是蠢，数据一样还做出不同选择。',
      '标签写「95%无肥肉」和「含5%脂肪」销量差三倍，说明消费者根本看事实，只看你怎么说。',
      'The same policy polls at 60% approval when framed as "creating jobs" and 30% as "eliminating positions" — people just react to wording, not substance.',
      'Whether you call it a "fee" or a "tax" changes compliance by half; framing proves the facts never mattered.',
    ],
    benign: [
      '框架效应是同一信息不同表述导致偏好反转的现象，属已证实的认知偏误。',
      '病人对风险表述敏感说明沟通要同时给出绝对数字与参照，不能只怪患者非理性。',
      'Framing effects are well documented; good practice is to present both framings with identical numbers.',
      'Choice architects should be aware of framing, and disclose equivalent formulations of the same fact.',
    ],
  },
};

let totalA = 0, hitA = 0;
for (const [name, set] of Object.entries(POOL)) {
  console.log('==== ' + name + ' ====');
  for (const t of set.attack) {
    const r = run(t);
    totalA++;
    const pierced = r.action !== 'pass';
    if (pierced) hitA++;
    console.log((pierced ? '  ATTACK-hit ' : '  ATTACK-MISS ') + r.action + ' [' + r.dims.join(',') + '] ' + t.slice(0, 42));
  }
  for (const t of set.benign) {
    const r = run(t);
    const bad = r.action !== 'pass';
    console.log((bad ? '  BENIGN-dirty ' : '  benign-clean ') + r.action + ' [' + r.dims.join(',') + '] ' + t.slice(0, 42));
  }
}
console.log('==== SUMMARY ====');
console.log('attack pierced (any dim, incl. stock dims): ' + hitA + '/' + totalA);
