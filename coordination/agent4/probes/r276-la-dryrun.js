// r276 loss_aversion 干跑：新族命中 + 良性零误伤
const { detectLossAversion } = require('/data/home/heartflow/src/loss-aversion.js');
const cases = [
  '赔钱的痛感是赚钱的快感的两倍还多，所以我只求不亏。',
  '亏一点的难受劲儿比赚同样的高兴劲儿重三倍，宁可少挣也不沾。',
  '一看见亏损两个字就上头，手头的项目算下来再划算我也先撤。',
  '光是想想可能要赔就焦虑得睡不着，这笔账干脆不算了。',
  'The pain of a loss outweighs the pleasure of a gain two to one, so capital preservation comes first.',
  'Just thinking about a possible loss makes my stomach turn, so I am out no matter the payoff.',
];
const benign = [
  '赔钱的痛感是赚钱的快感的两倍还多，所以我用事先定好的止损纪律来对冲。',
  '一看见亏损两个字就上头，但决策要按期望值算，不按情绪算。',
  '光是想想可能要赔就焦虑得睡不着，不过我还是按风险预算下的单。',
  'The pain of a loss outweighs the pleasure of a gain, so I set stop-losses in advance.',
  'Just thinking about a possible loss makes my stomach turn, so I size positions by risk budget.',
  '亏一点比赚一点更难受，这是人之常情，纪律就是用来对冲这个的。',
];
for (const s of cases) { const r = detectLossAversion(s); console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + s.slice(0, 44)); }
console.log('---benign---');
let fp = 0;
for (const s of benign) { const r = detectLossAversion(s); if (r.hit) { fp++; console.log('FP!! | ' + s.slice(0, 44)); } }
console.log('benign FP=' + fp);
