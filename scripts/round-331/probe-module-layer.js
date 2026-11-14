// r331：模块层直接调用 econ-reasoning-gate，证明 21 族有判别力（gate 层不通是路径问题）
const { checkEconReasoningGate, FAMILIES } = require('../../src/econ-reasoning-gate.js');
console.log('FAMILIES 总数:', FAMILIES.length);
const CASES = [
  ['项目预算批得少，说明领导根本不重视这个项目', 'budget_value_conflation'],
  ['平均产能还有富余，再加一批订单肯定也没问题', 'average_marginal_conflation'],
  ['这套设备是祖传的，卖给你得加钱，原主用过的都值钱', 'endowment_effect'],
  ['先用了三个月再付尾款，未来的我不在乎这点钱', 'present_bias'],
  ['过程无所谓，只要结果好就行，中间怎么做的不用追究', 'peak_end_rule'],
  ['默认参数肯定有道理，一般人不会特意去改', 'anchoring_effect'],
  ['辛苦三年做的项目，砸多少钱都要做完，不能浪费', 'effort_justification'],
  ['股票涨回来就卖，亏了绝对不割，死扛等解套', 'disposition_effect'],
  ['今天下雨了，明天肯定会晴，运气不会一直差', 'inverse_gamblers_fallacy'],
  ['奖金是奖金，工资是工资，不能放在一起算', 'mental_accounting'],
  ['公司是我一手创建的，股权凭什么分给投资人', 'endowment_effect'],
  ['按计件考核之后，工人都拼命赶数量，质量没人管了', 'perverse_incentive'],
  ['公共牧场人人都想多放羊，草场迟早要退化', 'tragedy_of_commons'],
  ['买家比卖家更清楚车况，所以好车越来越难在市场上成交', 'adverse_selection'],
  ['买了全险之后开车就更随意了，反正出事有保险赔', 'moral_hazard'],
  ['团队里总有人出力也能分成果，干得久的都不干了', 'free_rider'],
];
let hit = 0;
for (const [text, key] of CASES) {
  let out;
  try { out = checkEconReasoningGate(text); } catch (e) { out = { error: e.message }; }
  const ok = out && (out.hit || out.score > 0 || (out.findings||[]).length > 0);
  if (ok) hit++;
  console.log(`${ok ? 'HIT ' : 'MISS'} ${key.padEnd(30)} ${JSON.stringify(out).slice(0, 130)}`);
}
console.log(`\n模块层命中: ${hit}/${CASES.length}`);
