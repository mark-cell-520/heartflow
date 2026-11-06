/**
 * r235 模块干跑 —— src/mental-accounting.js 对探针全集实测
 * 攻击（应命中）/ 良性（不得命中）/ FP压力疑难良性（不得命中）
 */
const { detectMentalAccounting } = require('/data/home/heartflow/src/mental-accounting.js');

const ATTACKS = [
  // 探针 A 族
  '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。',
  '反正是公司报销的钱，不花白不花，多点几个菜也没什么。',
  '这是省下来的预算，花掉也不心疼，就当是白捡的。',
  '这笔钱是炒股赚来的，来得容易，花起来就不必那么心疼，随便买个包奖励自己。',
  '公司发的购物卡闲着也是闲着，拿去买了用不上的东西，反正不是工资。',
  '退款到账就像白给的一样，不赶紧花掉总觉得亏了。',
  '中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。',
  'The bonus is found money, not real salary, so I might as well splurge on it guilt-free.',
  "Money from a tax refund feels free, so I spent it on things I would never buy with my paycheck.",
  'Since it came out of the entertainment budget, not the real budget, nobody minded the overspend.',
  '这笔是项目奖金，跟基本工资不是一个性质，没必要纳入家庭总预算。',
  '虽然总收入没变，但因为是报销下来的钱，大家默认它可以不计入成本地随意花。',
  // 补充攻击
  '年底发了笔横财，跟大家工资不是一回事，索性痛快花一场。',
  '买的彩票中了头奖，这钱来得轻松，不必当血汗钱心疼。',
  '公司发的代金券马上到期，不用白不用，赶紧下单造掉。',
  'The lottery winnings are not the same as my paycheck, so why not blow the whole thing.',
  'The gift card is separate from my regular budget, so I went ahead and spent it.',
  'Gift cards are basically free money, so spending them on junk does not really count.',
  '遗产到账就当是天上掉下来的，买起东西来没什么心疼的。',
];

const BENIGN = [
  // 探针良性
  '年终奖我打算存起来作为孩子的教育金，专款专用。',
  '所有收入都进同一个账户统一规划，不分来源。',
  '心理账户是一种认知偏差，会让同样的一块钱被区别对待。',
  '意外之财也要纳入家庭预算统一规划，避免非理性消费。',
  '我们把年终奖单独列为教育金账户，这是预算管理方法。',
  '报销款到账后计入项目成本，与工资收入合并管理。',
  'Keeping a separate emergency fund is good budgeting; the fallacy is only when found money gets treated as free.',
  'The tax refund went straight into savings because windfalls should be budgeted like any other income.',
  '研究发现人们对意外之财的消费倾向确实高于常规收入，这是心理账户效应。',
  '中奖收入依法纳税后并入家庭资产统一配置。',
  // FP 压力疑难良性
  '用年终奖犒劳自己一年的辛苦，是合理的消费规划。',
  '意外之财我们捐了一半给慈善，剩下的纳入家庭总预算。',
  '购物卡有使用期限，及时用掉避免过期作废，属于资产管理。',
  '奖金单独列支用于技能培训，与日常开销互不挤占。',
  '把收入和支出分账户管理，是个人理财的常规做法。',
  '这笔退款已原路返回到付款账户。',
  '退款将在三个工作日内原路返回。',
  '报销款不计入绩效工资，但计入项目成本，这是财务制度。',
  '年终奖是税后收入，不计入增值税基数。',
  '这笔交易触发了反洗钱规则，需要人工核查。',
  '虽然意外之财容易让人随手花掉，但我们把它纳入家庭总预算统一规划。',
  '钱就是钱，不分来源，每一块钱都一样珍贵。',
  'Money is money wherever it comes from; every dollar is the same.',
  '坚决反对铺张浪费，严禁挥霍公共资金。',
  '意外之财不能当作随便花的理由，必须纳入监管。',
  'We won the contract because our proposal scored highest on the published criteria.',
  '竞标成功只说明我们最乐观，需按赢家诅咒重新校准估值。',
  '虽然中了奖，但仍需按税法缴纳个税并计入年度收入。',
  '奖金虽然到账了，但绩效方案仍在评估，暂不发放。',
  '红包是人情往来，记账时统一计入往来款。',
];

let aHit = 0, aMiss = [];
for (const t of ATTACKS) {
  const r = detectMentalAccounting(t);
  if (r.hit) aHit++; else aMiss.push(t);
}
let bHit = 0, bMiss = [];
for (const t of BENIGN) {
  const r = detectMentalAccounting(t);
  if (r.hit) { bHit++; bMiss.push(t); }
}
console.log(`攻击命中 ${aHit}/${ATTACKS.length}`);
for (const t of aMiss) console.log('  [漏判] ' + t);
console.log(`良性误命中 ${bHit}/${BENIGN.length}`);
for (const t of bMiss) console.log('  [误伤] ' + t);

// 明细抽样
for (const t of ATTACKS.slice(0, 4)) {
  const r = detectMentalAccounting(t);
  console.log('\n' + t.slice(0, 40) + ' →', r.hit ? `${r.dimension} score=${r.score} count=${r.count} ${r.details}` : 'NO HIT');
}
// 负例注入干跑
const NEVER = /(?!)/;
// 带真实签名+豁免标记的句子（删豁免后必须变红）
const EX_CONCEDE = '虽然这笔年终奖是意外之财、大家以为可以随便花，但我们仍按需规划每一笔支出。';
const EX_DECOUPLE = '这笔年终奖是意外之财，但钱就是钱，不分来源，每一块钱都一样，花起来不必心疼。';
const EX_ACCOUNT = '这笔年终奖是意外之财，按理可以随便花，但我们仍纳入家庭总预算统一规划。';
const EX_META = '心理账户是指像「年终奖是意外之财、可以随便花」这样把钱按来源区别对待的偏差。';
const EX_NOTCOUNT = '这笔是报销款，不计入成本，所以直接去买装备。';
console.log('\n--- 负例注入干跑 ---');
console.log('删 SOURCE_ZH:', detectMentalAccounting(ATTACKS[0], { SOURCE_ZH: [] }).hit);
console.log('删 SPEND_ZH:', detectMentalAccounting(ATTACKS[0], { SPEND_ZH: [] }).hit);
console.log('删 NOTCOUNT_ZH:', detectMentalAccounting(EX_NOTCOUNT, { NOTCOUNT_ZH: [] }).hit);
console.log('删 SOURCE_EN:', detectMentalAccounting(ATTACKS[7], { SOURCE_EN: [] }).hit);
console.log('删 SPEND_EN:', detectMentalAccounting(ATTACKS[7], { SPEND_EN: [] }).hit);
console.log('删 NOTCOUNT_EN:', detectMentalAccounting('The gift card is separate from my regular budget, so I went ahead and spent it.', { NOTCOUNT_EN: [] }).hit);
console.log('删 CONCEDE_ZH 后让步句变红:', detectMentalAccounting(EX_CONCEDE, { CONCEDE_ZH: NEVER }).hit);
console.log('删 DECOUPLE_ZH 后解耦句变红:', detectMentalAccounting(EX_DECOUPLE, { DECOUPLE_ZH: NEVER }).hit);
console.log('删 ACCOUNT_ZH 后记账句变红:', detectMentalAccounting(EX_ACCOUNT, { ACCOUNT_ZH: NEVER }).hit);
console.log('删 META_ZH 后元话语句变红:', detectMentalAccounting(EX_META, { META_ZH: NEVER }).hit);
console.log('放大窗 PAIR_ZH=500:', detectMentalAccounting('这笔年终奖是意外之财，' + 'x'.repeat(60) + '所以可以放心大胆地挥霍一把。').hit, detectMentalAccounting('这笔年终奖是意外之财，' + 'x'.repeat(60) + '所以可以放心大胆地挥霍一把。', { PAIR_ZH: 500 }).hit);
