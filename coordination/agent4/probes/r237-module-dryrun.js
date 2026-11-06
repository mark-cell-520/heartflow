/**
 * r237 模块干跑：src/winners-curse.js 未接线前的攻击/疑难良性/边界干跑
 */
const { detectWinnersCurse } = require('/data/home/heartflow/src/winners-curse.js');

const ATTACKS_ZH = [
  '竞标赢了说明这块地就值这个价，我们的判断得到了验证。',
  '这次中标证明我们的报价是合理的，业主认可这个成本。',
  '能拍下这幅画，说明它确实被低估了，我们捡了漏。',
  '招标排名第一，说明我们的方案性价比最高。',
  '竞得这块地意味着市场认可这个价格，值。',
  '出价最高还赢了，只能说明这东西真的好。',
  '我们竞标成功拿下标的，评标委员会认可这个报价，判断得到了验证。',
];
const ATTACKS_EN = [
  'We won the auction, which confirms the asset is worth what we paid.',
  'Winning the bid proves our price was fair and the client accepted the cost.',
  'We outbid everyone, so the painting was clearly undervalued—a real bargain.',
  'Coming out on top in the tender shows our offer had the best value.',
  'Our bid was accepted, which demonstrates our valuation was correct and we got a real bargain.',
];

const BENIGN = [
  // 疑难良性（FP 压力）
  '竞标成功只说明我们出价最高，不等于估值正确，还要留足安全边际。',
  '赢了拍卖不等于捡漏，赢家往往是最乐观的那个，要防赢家诅咒。',
  '中标之后先核算成本，价格是竞争出来的，不是价值算出来的。',
  '我们以低于评估价的价格中标，预算省下来了，按合同履约即可。',
  '出价前要做尽调，报价高低和资产好坏是两回事。',
  'Winning the auction only means we bid highest, not that the price was right.',
  'The winner is usually the most optimistic bidder, so we should guard against the winner\u2019s curse.',
  'We won the tender at below assessment price; now we just deliver the contract.',
  // 常规良性
  '公司中标后股价上涨，说明市场看好公司前景。',
  '我们赢得了这场比赛，说明训练方案有效。',
  '这块地我们竞得，先做尽调再说。',
  '投标文件已经提交，评标结果下周公布。',
  '这次投标虽然失败了，但报价得到了市场的反馈。',
  '拍卖行的图录已经寄送给潜在买家。',
  'The team won the championship after months of hard work.',
  'We submitted the proposal and are waiting for the tender result.',
  'Winning the auction does not prove the price was fair.',
  'The auction house published its catalogue last week.',
  'He is so rich that his judgment must be right.',
  'I am fully confident this project will succeed.',
];

const BOUNDARY = [
  '他这么有钱，说明他的判断肯定没错。',                    // appeal_to_wealth 领地（无竞价胜利腿）
  '我对这个项目有十足的信心，肯定能成。',                  // confidence 领地（无竞价胜利腿）
  'KPI 完成了，说明目标肯定达成了。',                      // proxy_metric_goal 领地
  '下载量破百万，说明产品满足了用户需求。',                // proxy_metric_goal 领地
  '我们赢得了这场比赛，说明训练方案有效。',                // 非竞价胜利（体育）
  '竞标赢了不等于估值正确。',                              // 腿②被否定前缀拦下（不等于）
  '这次中标不能证明报价合理，能否说明值这个价尚未可知。',  // 腿②两处均被否定前缀拦下
  '公司今年加大了研发投入，政策扶持新兴产业。',            // 完全无关
];

let fail = 0;
for (const t of ATTACKS_ZH.concat(ATTACKS_EN)) {
  const r = detectWinnersCurse(t);
  if (!r.hit) { fail++; console.log('✗ 攻击未命中: ' + t); }
}
console.log(`攻击干跑: ${ATTACKS_ZH.length + ATTACKS_EN.length - fail}/${ATTACKS_ZH.length + ATTACKS_EN.length} 命中`);
let fp = 0;
for (const t of BENIGN) {
  const r = detectWinnersCurse(t);
  if (r.hit) { fp++; console.log('✗ 良性误伤: ' + t); }
}
console.log(`疑难+常规良性干跑: ${BENIGN.length - fp}/${BENIGN.length} 零误伤`);
let bd = 0;
for (const t of BOUNDARY) {
  const r = detectWinnersCurse(t);
  if (r.hit) { bd++; console.log('✗ 边界误判: ' + t); }
}
console.log(`边界干跑: ${BOUNDARY.length - bd}/${BOUNDARY.length} 不越界`);
if (fail || fp || bd) process.exit(1);
