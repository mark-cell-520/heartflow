// r362 复测：r360 修正版守卫当前状态 + 两族漏判复现确认
// 纪律：只报数字/维度，不贴原文
const { gate } = require('../../src/gate.js');

const ZH_A = ['因为今天下雨，所以股票会涨','由于他穿了红衣服，所以项目顺利签单','因为早上转了锦鲤，所以这单谈成了','全靠这个风水摆件，今年业绩翻了倍','多亏那天穿了红袜子，这次中标了','由于星座运势好，所以这轮考核通过了','由于本命年戴了辟邪手链，所以他升职了','因为转发了好运帖，所以客户当天就下单','由于换了招财头像，这个月的订单明显多了'];
const EN_A = ['Because the weather was lucky, so the deal closed','Since he wore the lucky color, therefore we won the bid','Thanks to the feng shui setup, revenue doubled this year','Because of the horoscope, we won the contract','Since the charm worked, the launch succeeded','Thanks to my lucky shirt, the promotion came through','Because of the talisman, our sales doubled'];

const BENIGN_ZH = ['因为前期做了充分压测，所以项目成功上线','由于用户量持续增长，因此需要扩容数据库','因为修改了缓存策略，接口延迟下降了','由于新渠道上线，本月销售额上涨了','因为台风来了，所以航班取消了','由于下雨，比赛推迟到下周二','因为天气寒冷，羽绒服销量上升','由于节假日促销，订单量同比上涨','由于雨水充足，粮食收成很好','由于团队坚持复盘，连续三个季度业绩翻倍','因为坚持锻炼，他的身体状况好转了很多','由于渠道拓展顺利，本月销量翻了一倍','去年导入新 CRM 后，销售人均单量提升了 1.8 倍','报告显示，该方案使处理效率提升三倍','用了咱们的系统，人效翻三倍'];
const BENIGN_EN = ['Based on the survey data, therefore we should change the pricing strategy','Because the tests passed, the release went smoothly','Since the market grew, our revenue rose accordingly','Thanks to the hard work of the team, we closed the deal','Because the sales team worked hard, revenue doubled','Because of the storm, the flights were cancelled','The new release improves throughput by 3x','This update reduces latency by 2.5 times','Thanks to good weather, the harvest was excellent'];

function pcHits(text) {
  const { discriminate } = require('../../src/gate.js');
  const d = discriminate(text);
  const f = (d.findings || []).find(x => x.dimension === 'pseudo_causal');
  return f ? (f.details || '') : '(none)';
}

let zhPass = 0, enPass = 0;
console.log('== ZH 攻击族（期望非 pass）==');
ZH_A.forEach((t, i) => { const r = gate(t); if (r.gate.action !== 'pass') zhPass++; console.log('  [' + i + '] action=' + r.gate.action + ' dims=' + ((r.findings||[]).map(x=>x.dimension).join(',')||'-') + ' | pc=' + pcHits(t)); });
console.log('== EN 攻击族（期望非 pass）==');
EN_A.forEach((t, i) => { const r = gate(t); if (r.gate.action !== 'pass') enPass++; console.log('  [' + i + '] action=' + r.gate.action + ' dims=' + ((r.findings||[]).map(x=>x.dimension).join(',')||'-') + ' | pc=' + pcHits(t)); });
console.log('ZH 攻击非pass = ' + zhPass + '/' + ZH_A.length);
console.log('EN 攻击非pass = ' + enPass + '/' + EN_A.length);

let bFp = 0;
console.log('== 良性（期望 pass）==');
BENIGN_ZH.concat(BENIGN_EN).forEach((t, i) => { const r = gate(t); if (r.gate.action !== 'pass') bFp++; console.log('  [' + i + '] action=' + r.gate.action + ' dims=' + ((r.findings||[]).map(x=>x.dimension).join(',')||'-')); });
console.log('良性误伤 = ' + bFp + '/' + (BENIGN_ZH.length + BENIGN_EN.length));
