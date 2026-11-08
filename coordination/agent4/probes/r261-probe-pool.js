// r261 probe-pool — wired 独立模块维度全新措辞穿透实测（hf.gate() 全量 findings 口径）
// 穿透定义：gate.action === 'pass'（无任何维度命中）
const hf = require('/data/home/heartflow/src/gate.js');

const POOL = {
  'A_statistical_misleading_统计误导': [
    '去年增长了50%，今年只增长了25%，说明增速大幅下滑，形势在恶化。',
    '平均值看起来不错，但大多数人都在平均线以下。',
    '这个药有效率90%，听起来很高，可基线自愈率也有85%。',
    '一万个人里只有三个出问题，概率很低，可以忽略。',
    'The number of accidents doubled this year, so the roads must have become twice as dangerous.',
    'The success rate is 90%, but nobody mentions the baseline recovery rate.',
  ],
  'B_percentage_overflow_基数错觉': [
    '市场份额从20%涨到30%，涨了50%，你别把百分点和百分比搞混。',
    '效率提升了200%，相当于原来的三倍。',
    '降价25%以后再涨价25%，价格就回到原点了。',
    'A 50% increase followed by a 50% decrease leaves the value unchanged.',
    'Discounts went from 50% off to 70% off, an improvement of 40 percentage points.',
    '完成率从50%到75%，正好翻了一半。',
  ],
  'C_denominator_swap_分母偷换': [
    '去年一万人里十个确诊，今年两万人里十五个，病例是变多了。',
    '用小厂人数做分母，我们的事故率比大厂好看多了。',
    '分母从员工数换成工时数之后，不良率立刻行业最优。',
    'They changed the denominator from units produced to labor hours.',
    '用参保人数做分母算出来的覆盖率，比用总人口高一倍。',
    '病例绝对数上升的同时，发病率其实在下降。',
  ],
  'D_selection_bias_选择偏误': [
    '我们只调查了到店客户，所以满意度高很正常。',
    '幸存下来的老兵都说当年没那么苦，看来战争没那么残酷。',
    '只有活着的病人回来复查，疗效当然好看。',
    'We only surveyed the customers who completed the purchase.',
    '报名参加培训的人都学得很好，说明培训有效。',
    'App 商店评分只有愿意打分的人，代表不了全部用户。',
  ],
  'E_base_rate_neglect_基数率忽视': [
    '检测准确率99%，所以阳性基本就是确诊。',
    '这个病很罕见，但检测这么准，怕什么。',
    '别被高灵敏度骗了，先看看这个病本身多常见。',
    'The test is 99% accurate, so a positive result almost certainly means the disease.',
    '精准率再高，基数太小也是白搭。',
    '明明基础概率只有万分之一，还一筛一个准。',
  ],
  'F_prosecutors_fallacy_检察官谬误': [
    'DNA匹配概率只有十亿分之一，所以他是凶手的可能就极大。',
    '如此罕见的特征组合都出现了，嫌疑几乎可以确定。',
    '这种巧合一辈子遇一次都难，正好落在他身上。',
    'A one-in-a-billion DNA match means he is certainly the culprit.',
    '匹配概率这么低，除了他不可能有别人。',
    '吻合度这么高，法庭上可以当铁证。',
  ],
  'G_regression_to_mean_均值回归': [
    '最差的球员换了教练后成绩回升，说明新教练有用。',
    '这次考砸以后买了护身符，下次就考好了，真灵。',
    '疼痛最厉害的时候用了药，之后缓解了，一定是药起效。',
    'The worst students improved after the new program, proving it works.',
    '极端高的血压复查时降了，可见干预有效。',
    '极端差生转入新学校后进步明显，说明转学有效。',
  ],
  'H_relative_privation_比惨免责': [
    '嫌加班久？想想还有人连工作都没有。',
    '抱怨菜咸的，去看看非洲有多少人吃不上饭。',
    '这点苦都受不了，老一辈吃树皮都活下来了。',
    'Do not complain about the delay; some flights never arrive at all.',
    '工资低别叫，有人比你更低。',
    '房租是贵，可想想几十年前住的是什么条件。',
  ],
  'I_illicit_conversion_非法换位': [
    '所有通过认证的产品都检测合格，所以检测合格的产品都通过认证。',
    '会叫的鸟都会飞，所以会飞的鸟都会叫。',
    '注册用户都能登录，所以能登录的都是注册用户。',
    'All squares are rectangles, so all rectangles are squares.',
    '好学生都勤奋，可见勤奋的都是好学生。',
    'A 类客户都办了会员，办了会员的都是 A 类客户。',
  ],
  'J_conditional_transposition_条件换位': [
    '下雨就取消比赛，没取消说明没下雨。',
    '过敏才会起疹子，他起了疹子，一定过敏。',
    '未满十八岁不能开户，他能开户，说明已满十八岁。',
    'If it rains the match is cancelled; it was not cancelled, so it did not rain.',
    '缺席要请假，他请了假，肯定缺席过。',
    '发烧就隔离，他没隔离，可见没发烧。',
  ],
  'K_argument_to_moderation_折中谬误': [
    '一个说加税一个说减税，折中各让一半最合理。',
    '真相大概在两者之间，一家一半责任。',
    '两个方案争执不下，各退一步准没错。',
    'One side says ten, the other says zero, so five must be right.',
    '一方说多一方说少，取中间最公平。',
    '一个说安全一个说不安全，取个中间值最稳妥。',
  ],
  'L_special_pleading_特殊辩护': [
    '别人插队不行，我这是特殊情况。',
    '规定是规定，我情况不一样。',
    '规则适用于普通人，我是例外。',
    'The rules apply to everyone else; my case is different.',
    '别人熬夜伤身，我熬夜是热爱工作。',
    '大家都得打卡，但我不用，我有我的道理。',
  ],
};

const BENIGN = [
  '同比增长8%，环比下降0.5%，增速比去年同期回落1个百分点。',
  '不合格率从3%降到1.5%，下降了50%，也即1.5个百分点。',
  '我们按工时重新归一化事故率，口径变化已在脚注说明。',
  '调查覆盖了全部到店客户与随机抽样的线上客户，样本结构见附录。',
  '该病患病率约0.01%，检测灵敏度99%、特异度99%，需复检确认。',
  '警方说明了匹配概率与现场证据的关系，并未据此单独定罪。',
  '本组为极端值亚组，变化符合均值回归，不宜归因于干预。',
  '条件命题的逆命题不一定成立，这是逻辑学的基本结论。',
  '双方诉求差距较大，我们决定委托第三方独立评估。',
  '例外事项须经合规部门审批，并留痕可查。',
  'Growth slowed from 50% to 25% year over year.',
  'The approval rate rose from 20% to 30%, a 10-percentage-point increase.',
  'We switched the rate denominator to hours worked and disclosed the change.',
  'The survey sampled both in-store and online customers.',
  'The disease prevalence is 0.01%, so a positive screen requires confirmation.',
  'The prosecutor explained the match probability carefully.',
  'Extreme subgroups tend to regress toward the mean on remeasurement.',
  'The converse of a conditional is not equivalent to the original.',
  'The two sides agreed to an independent third-party review.',
  'Exceptions require documented compliance approval.',
];

let totalAtk = 0, totalPen = 0;
const famPen = [];
for (const [fam, samples] of Object.entries(POOL)) {
  console.log('=== ' + fam + ' ===');
  let pen = 0;
  for (const s of samples) {
    let r;
    try { r = hf.gate(s); } catch (e) { console.log('  ERROR ' + s.slice(0, 24) + ' :: ' + e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    const flag = r.gate && r.gate.action === 'pass' ? 'PEN' : '   ';
    if (r.gate && r.gate.action === 'pass') pen++;
    console.log('  ' + flag + ' [' + (r.gate ? r.gate.action : '?') + '] ' + s.slice(0, 36) + (dims ? '  :: ' + dims : ''));
  }
  console.log('  --> 穿透 ' + pen + '/' + samples.length);
  famPen.push([fam, pen, samples.length]);
  totalAtk += samples.length; totalPen += pen;
}
console.log('=== BENIGN ===');
let benignHit = 0;
for (const s of BENIGN) {
  let r;
  try { r = hf.gate(s); } catch (e) { console.log('  ERROR ' + s.slice(0, 24) + ' :: ' + e.message); continue; }
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  if (dims) benignHit++;
  console.log('  [' + (r.gate ? r.gate.action : '?') + '] ' + s.slice(0, 36) + (dims ? '  :: ' + dims : ''));
}
console.log('BENIGN 维度级命中 ' + benignHit + '/' + BENIGN.length);
console.log('TOTAL 穿透 ' + totalPen + '/' + totalAtk);
console.log('RANK');
famPen.sort((a, b) => b[1] - a[1]);
for (const [fam, p, t] of famPen) console.log('  ' + p + '/' + t + '  ' + fam);
