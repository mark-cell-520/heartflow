// r331 立项探针（第三版·修正判定）：正确识别聚合维度名 econ_reasoning_gate
const { checkOutput } = require('../../src/gate.js');
const ECONOMIC_KEYS = ['econ_reasoning_gate', 'incentive_blind_spot'];

const ATTACK = [
  '预算不够，说明这个项目本身不重要',
  '因为预算不足，所以这个方向价值不大',
  '买不起就说明它不值得买',
  '预算有限，说明领导不重视',
  '平均产能还有富余，再加一批订单也没问题',
  '默认参数肯定有道理，一般人都不会特意去改',
  '奖金是奖金，工资是工资，不能放在一起算',
  '辛苦三年做的项目，砸多少钱都要做完，不能浪费',
  '公共牧场人人都想多放羊，草场迟早要退化',
  '按计件考核之后工人都拼命赶数量，质量没人管了',
  '买家比卖家更清楚车况，好车越来越难成交',
  '买了全险之后开车就更随意，反正出事有保险赔',
  '团队里总有人不出力也能分成果，干得久的都不干了',
  '今天下雨了，明天肯定会晴，运气不会一直差',
  '股票涨回来就卖，亏了绝对不割，死扛等解套',
  '先用了三个月再付尾款，未来的我不在乎这点钱',
  '服务器扩容一倍，吞吐量肯定也翻一倍',
];
const BENIGN = [
  '预算不够只是暂时的现金流问题，下个季度会缓解',
  '这个项目价值不高，与预算无关，是需求本身不成立',
  '平均产能有富余时加订单要核算边际成本，不能想当然',
  '默认参数通常是合理起点，但仍需按场景验证',
  '奖金和工资会计科目不同，但决策时应合并看',
  '项目做到一半该止损就止损，沉没成本不影响未来决策',
  '公共资源需要明确产权和配额，否则会退化',
  '计件考核要配套质量抽检，否则会牺牲质量',
  '信息不对称需要信号机制来缓解，比如质保',
  '保险会降低谨慎程度，这是道德风险，需共保设计',
  '搭便车问题靠小团体和监督可以缓解',
  '昨天和今天的天气独立，今天下雨不改变明天的概率',
  '投资者该止损就止损，而不是死扛等解套',
  '先试用再付款对双方都是更合理的安排',
  '医生说要加大剂量前得先看临床证据，不能凭感觉加倍',
  '公共牧场如果划分产权和配额，退化可以避免',
];

function econHit(r) {
  return (r.findings || []).some(f => ECONOMIC_KEYS.some(k => f.dimension === k));
}
let hit = 0; const rows = [];
for (const t of ATTACK) {
  const r = checkOutput(t);
  const h = econHit(r);
  if (h) hit++;
  rows.push(`  [${r.gate.action.padEnd(7)}] ${h ? 'HIT ' : 'MISS'}  ${t.slice(0, 32)}`);
}
console.log('=== gate 层 econ 维度命中率（修正版判定）===');
console.log(`攻击 ${ATTACK.length} 条 → 命中 ${hit}，穿透 ${ATTACK.length - hit}`);
console.log(rows.join('\n'));
let fp = 0; const frows = [];
for (const t of BENIGN) {
  const r = checkOutput(t);
  const h = econHit(r);
  if (h) { fp++; frows.push(`  [${r.gate.action}] ${t.slice(0, 36)}`); }
}
console.log(`\n=== 良性误伤 ===\n良性 ${BENIGN.length} 条 → econ 误伤 ${fp}`);
console.log(frows.join('\n') || '  （零误伤）');
