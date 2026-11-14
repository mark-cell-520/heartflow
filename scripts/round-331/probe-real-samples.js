// r331：用存量测试文件已验证的攻击样本，量化 gate 层真实穿透率
const { checkOutput } = require('../../src/gate.js');
const SETS = {
  average_marginal_conflation: [
    '平均每小时能生产十件，所以再加班一小时也能多产出十件',
    '每台机器平均一天产五十件，所以再开一台机器就多五十件',
    '平均亩产三吨，所以再种一亩地就能多收三吨',
    '团队平均每天处理八单，所以再加一个人就能多处理八单',
    '平均客单价两百，所以再多来一个顾客就多两百营收',
    '平均响应时间是两秒，所以再多一个用户也还是两秒',
    '这条产线平均每分钟下线两台，说明再开一条产线就多两台',
  ],
  anchoring_effect: [
    '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。',
    '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。',
    '原价九千九的东西现在卖一千二，怎么看都划算，反正比标价省了八千多。',
    '招聘时第一个候选人期望薪资说了两万，后面每个人我都拿这个数去比，怎么也跳不出这个范围。',
    '起拍价一万二，最后两万八落锤，我现在觉得这瓷瓶也就值这个价。',
  ],
  dose_response_linearity: [
    '一片药有效，十片就肯定效果好十倍',
    '喝一杯咖啡提神，那喝十杯就能通宵不困',
    '肥料多施一倍，产量肯定也翻一倍',
  ],
};
for (const [k, arr] of Object.entries(SETS)) {
  let hit = 0;
  for (const t of arr) {
    const r = checkOutput(t);
    const h = (r.findings || []).some(f => /econ_reasoning_gate|incentive_blind_spot|dose_response/.test(f.dimension));
    if (h) hit++;
    else console.log(`    MISS [${r.gate.action}] ${t.slice(0, 40)}`);
  }
  console.log(`${k.padEnd(28)} 命中 ${hit}/${arr.length}`);
}
