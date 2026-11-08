/**
 * r254-dryrun.js — money-illusion 模块层干跑（攻击命中 / 疑难良性零误伤 / 豁免族）
 */
const path = require('path');
const { detectMoneyIllusion, __internals } = require(path.join(__dirname, '..', '..', '..', 'src', 'money-illusion.js'));

const ATTACK_ZH = [
  '工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了',
  '名义GDP连年增长，这说明老百姓的日子越过越好了',
  '存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏',
  '老李的退休金从三千涨到四千，涨了三分之一，他的养老待遇明显改善了',
  '虽然通胀吃掉了购买力，但名义收入年年创新高，说明工薪阶层收入在提高',
  '合同金额从一百万涨到一百二十万，数字上看我们收入提高了两成，公司更赚钱了',
  '最低工资标准上调了，打工到手的钱变多了，这就是实实在在的改善',
  '薪酬数字连年上调，虽然购买力打折，到手的钞票变厚了，日子更踏实',
  '地方政府税收名义额连创新高，说明财政实力显著增强',
  '以现价计算的公司营收一年内扩张了15%，企业真实经营规模在扩大',
  // SOLO 签名
  '涨工资就是改善生活',
  '名义增长就是共同富裕',
  '工资数字涨了就是收入提高',
  // 倒装：福利结论在前、名义变动在后
  '大家更富裕了，因为工资数字连年上调',
];
const ATTACK_EN = [
  'Wages rose 5% while prices rose 8%, but people have more cash in hand, so they are better off',
  'Nominal GDP keeps growing, which shows living standards are improving',
  'The interest rate is 3% and inflation is 5%, but the interest payment is real money in the bank',
  'Salary numbers went up 20% year over year, so employees clearly earned more',
  'The face value of the payout doubled, so retirees are twice as well off',
  'Ticket prices doubled but attendance revenue doubled too, so the business is booming in real terms',
  'Although prices doubled, my paycheck in dollars is the highest ever, so I am doing better than before',
  'A nominal raise is a real improvement',
  'More dollars in hand means better off',
];

const BENIGN = [
  // 正确价格口径
  '工资涨了5%，物价涨了8%，扣除通胀实际工资其实是下降的',
  '名义GDP连年增长，但要扣除价格因素，实际增长没那么好看',
  '退休金从三千涨到四千，不过同期物价涨了不少，实际购买力提高有限',
  'Wages rose 5% and prices rose 8%, so real wages fell',
  'Nominal GDP grew, but adjusted for inflation the real gain was flat',
  '合同金额从一百万涨到一百二十万，但同期物价涨了25%，实际收入是下降的',
  '最低工资上调要对照物价涨幅，如果CPI涨得更多，实际最低工资反而降了',
  '营收名义增长15%，扣除成本上涨后实际利润几乎没动',
  'Salary rose 20% nominally, but inflation was 20%, so real pay was flat',
  '票息固定增加只是名义口径，实际收益要按真实利率折算',
  // 概念教学
  '货币错觉告诉我们名义不等于实际，评价生活水平要用不变价',
  'Money illusion means nominal gains are not real gains when prices rise faster',
  '经济学家用费雪方程区分名义利率和实际利率',
  // 单腿句：只有名义变动无福利结论
  '这个月房租涨了两百，房东说是因为通胀',
  '债券按名义本金计算利息，这是标准条款',
  'The payout is fixed in nominal terms and does not adjust for inflation',
  // 邻接领地
  '我们测得营收增长了15.37%，精确到小数点后两位',
  '统计口径把三个季度的数据平均后呈现，制造了平滑增长的印象',
  '把不同年份的数字直接相加对比，忽略了价格水平的变化',
  '通胀率3%，我把钱投了指数基金',
  '工资跑不赢通胀',
  // 翻转/批评句式
  '工资数字涨了，但这不说明生活更富裕',
  '名义账户和实际账户要分清，不能混用',
  '按不变价计算的GDP增长才是实际增长',
];

let aHit = 0, aMiss = [];
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  const r = detectMoneyIllusion(t);
  if (r.hit) aHit++; else aMiss.push(t);
}
let bClean = 0, bHits = [];
for (const t of BENIGN) {
  const r = detectMoneyIllusion(t);
  if (!r.hit) bClean++; else bHits.push(t + '  :: ' + r.details.slice(0, 80));
}
console.log(`攻击 ${ATTACK_ZH.length + ATTACK_EN.length} 条：命中 ${aHit}｜漏 ${aMiss.length}`);
aMiss.forEach(t => console.log('  [MISS] ' + t.slice(0, 50)));
console.log(`良性 ${BENIGN.length} 条：零误伤 ${bClean}｜误伤 ${bHits.length}`);
bHits.forEach(t => console.log('  [FP] ' + t));

// 签名档位与 count 检查
const one = detectMoneyIllusion('工资涨了5%，虽然物价涨了8%，但到手钱变多了，大家更富裕了');
console.log('单签名 count =', one.count, 'score =', one.score, 'dim =', one.dimension);
const multi = detectMoneyIllusion('工资涨了5%，大家更富裕了；名义GDP连年增长，说明日子越过越好');
console.log('多签名 count =', multi.count, 'score =', multi.score);

// 窗口承重检查
const overd = '工资涨了5%' + '，'.repeat(80) + '大家更富裕了';
console.log('超距默认窗命中?', detectMoneyIllusion(overd).hit, '（应 false）');
console.log('超距放大窗命中?', detectMoneyIllusion(overd, { W_ZH: 500 }).hit, '（应 true）');

// 防自证检查
const selfEv = detectMoneyIllusion('数字上看我们收入提高了两成');
console.log('纯单腿「收入提高」命中?', selfEv.hit, '（应 false）');
