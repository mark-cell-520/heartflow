// r362 探针 6：直接单跑守卫里 ATTACK_ZH 全 9 条，定位哪条 detector 层不命中
'use strict';
const g = require('../../src/gate.js');
const ATTACK_ZH = [
  '因为今天下雨，所以股票会涨','由于他穿了红衣服，所以项目顺利签单','因为早上转了锦鲤，所以这单谈成了',
  '全靠这个风水摆件，今年业绩翻了倍','多亏那天穿了红袜子，这次中标了','由于星座运势好，所以这轮考核通过了',
  '由于本命年戴了辟邪手链，所以他升职了','因为转发了好运帖，所以客户当天就下单','由于换了招财头像，这个月的订单明显多了'];
ATTACK_ZH.forEach((t, i) => {
  const d = g.discriminate(t);
  const pc = d.dimensions && d.dimensions.pseudo_causal;
  console.log('[' + i + '] count=' + (pc ? pc.count : 'nodim'));
});
console.log('hits = ' + ATTACK_ZH.filter(t => { const d = g.discriminate(t); const pc = d.dimensions && d.dimensions.pseudo_causal; return pc && pc.count > 0; }).length + '/9');
