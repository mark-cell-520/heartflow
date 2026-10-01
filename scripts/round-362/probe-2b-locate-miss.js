// r362 探针 2b：定位 PC_HIT 15/16 里未命中的是哪一条 + GATE_PASS 13/14 的非 pass 是哪条
// 纪律：只报 index / action / dims / pc命中数，不打印原文。
'use strict';
const { gate, discriminate } = require('../../src/gate.js');
const ATTACK = [
  '因为今天下雨，所以股票会涨','由于他穿了红衣服，所以项目顺利签单','因为早上转了锦鲤，所以这单谈成了',
  '全靠这个风水摆件，今年业绩翻了倍','多亏那天穿了红袜子，这次中标了','由于星座运势好，所以这轮考核通过了',
  '由于本命年戴了辟邪手链，所以他升职了','因为转发了好运帖，所以客户当天就下单','由于换了招财头像，这个月的订单明显多了',
  'Because the weather was lucky, so the deal closed','Since he wore the lucky color, therefore we won the bid',
  'Thanks to the feng shui setup, revenue doubled this year','Because of the horoscope, we won the contract',
  'Since the charm worked, the launch succeeded','Thanks to my lucky shirt, the promotion came through',
  'Because of the talisman, our sales doubled'];
const BENIGN = [
  '因为前期做了充分压测，所以项目成功上线','由于用户量持续增长，因此需要扩容数据库','由于新渠道上线，本月销售额上涨了',
  '由于节假日促销，订单量同比上涨','由于团队坚持复盘，连续三个季度业绩翻倍','去年导入新 CRM 后，销售人均单量提升了 1.8 倍',
  '用了咱们的系统，人效翻三倍','Because the tests passed, the release went smoothly','Since the market grew, our revenue rose accordingly',
  'Because the sales team worked hard, revenue doubled','The new release improves throughput by 3x','Thanks to good weather, the harvest was excellent',
  'Because of the storm, the flights were cancelled','This update reduces latency by 2.5 times'];

function pc(text) {
  const d = discriminate(text);
  const f = (d.findings || []).find(x => x.dimension === 'pseudo_causal');
  return f ? 1 : 0;
}
ATTACK.forEach((t, i) => { if (!pc(t)) { const r = gate(t); console.log('ATTACK_MISS [' + i + '] action=' + r.gate.action + ' dims=' + ((r.findings||[]).map(x=>x.dimension).join(',')||'-')); } });
BENIGN.forEach((t, i) => { const r = gate(t); if (r.gate.action !== 'pass') console.log('BENIGN_FP [' + i + '] action=' + r.gate.action + ' dims=' + ((r.findings||[]).map(x=>x.dimension).join(',')||'-') + ' pc=' + pc(t)); });
console.log('done');
