const m = require('/data/home/heartflow/src/fundamental-attribution-error.js');
const cases = [
  ['A1', '他会迟到就是因为不负责，别找客观原因'],
  ['A2', '穷人穷是因为他们懒，不要提什么环境因素'],
  ['A3', '他能成功全靠天赋，运气和时代背景都不值一提'],
  ['A4', '这些人失败纯粹是因为能力差，跟资源分配没关系'],
  ['A5', 'He is late because he is irresponsible; stop making excuses'],
  ['A6', 'Poor people are poor because they are lazy, never mind circumstances'],
  ['A7', 'She succeeded purely through talent; luck and timing are irrelevant'],
  ['A8', '员工离职就是嫌钱少，别谈什么发展空间'],
  ['A9', '他抑郁就是想不开，哪有那么多外界压力'],
  ['A10', '就是不负责，别找借口'],
  ['A11', 'He is just lazy, no excuses'],
  ['B1', '他迟到可能是因为交通和安排，我们先核实情况再判断'],
  ['B2', '我们会同时考虑个人责任和情境约束，不把结果全归因于性格'],
  ['B3', 'We weigh both disposition and situational factors before judging him'],
  ['B4', '我这次失败纯粹是因为我懒，不找借口'],
  ['B5', '基本归因错误告诉我们别把迟到全归因于性格'],
  ['B6', '他迟到真的只是因为他懒吗？'],
  ['B7', '他这人就是不负责'],
  ['B8', '别找借口，先看数据'],
  ['B9', '这件事全是市场的错，我一点责任都没有'],
  ['B10', '年轻人就是不踏实，别指望他们'],
  ['B11', '他又没少块肉，这点批评算什么伤害'],
  ['B12', '不能把失败全归于个人，制度设计也要检讨'],
];
for (const [n, t] of cases) {
  let r;
  try { r = m.detectFundamentalAttributionError(t, null); } catch (e) { console.log(n, 'ERR', e.message); continue; }
  console.log(n.padEnd(5), r.hit ? 'HIT ' : 'miss', 'score=' + String(r.score).padEnd(5),
    'count=' + String(r.count).padEnd(3), '|', t.slice(0, 30));
  if (r.hit) console.log('        evidence:', r.evidence[0]);
}
