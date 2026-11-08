const { detectLossAversion, __internals } = require('/data/home/heartflow/src/loss-aversion.js');
const I = __internals();
const AVOID_KEYS = ['AVOID_RATHER_ZH', 'AVOID_CAPITAL_ZH', 'AVOID_REFUSE_ZH', 'AVOID_EMOTION_ZH', 'AVOID_LOCKIN_ZH', 'AVOID_POSITIVE_EV_ZH', 'AVOID_POS_EV_ZH', 'AVOID_POS_EV_EN', 'AVOID_EN'];
const CAND = {
  AVOID_RATHER_ZH: ['同幅度的亏损比盈利更难受，所以我宁可不赚'],
  AVOID_CAPITAL_ZH: ['同样的数目，赔一块比挣一块难受多了，所以先保本', '先保本，因为亏一万比赚一万难受多了'],
  AVOID_REFUSE_ZH: ['同幅度的亏损比盈利更让人难受，因此我从不参与'],
  AVOID_EMOTION_ZH: ['同幅度的亏损比盈利更让人难受，亏起来整晚睡不着'],
  AVOID_LOCKIN_ZH: ['涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等'],
  AVOID_POSITIVE_EV_ZH: ['同幅度的亏损比盈利更难受，所以哪怕期望为正我也不为所动'],
  AVOID_POS_EV_ZH: ['同幅度的亏损比盈利更难受，所以这个正期望的项目我照样先放一放'],
  AVOID_POS_EV_EN: ['A loss hurts twice as much as an equal gain pleases; even with a positive expected value I would not commit capital'],
  AVOID_EN: ['A loss hurts about twice as much as an equal gain pleases, so stay defensive'],
};
for (const g of AVOID_KEYS) {
  const inj = {}; inj[g] = [];
  const lines = CAND[g].map(t => (detectLossAversion(t).hit ? (detectLossAversion(t, inj).hit ? 'NOTEXCL' : 'EXCL') : 'MISS') + ' | ' + t);
  console.log(g + '\n  ' + lines.join('\n  '));
}
console.log('\n=== W0 负例句（最终）===');
const W0 = ['同样的数目，赔一块比挣一块难受多了，所以先保本', '先保本，因为亏一万比赚一万难受多了', '同幅度的亏损比盈利更难受，所以我宁可不赚', '同幅度的亏损比盈利更让人难受，亏起来整晚睡不着', 'A loss hurts about twice as much as an equal gain pleases, so stay defensive', 'Losses loom larger than equal gains, so I keep the principal first'];
for (const t of W0) console.log((detectLossAversion(t, { W_ZH: 0, W_EN: 0 }).hit ? 'STILL ' : 'KILLED') + ' | ' + t);
console.log('\n=== 新候选是否误伤良性（应全部不命中）===');
const BEN = ['亏一万比赚一万难受多了，这是事实，但决策要看期望值', '宁可少赚也不能亏在风险预算内是合理的，但要看止损线', '我设置了百分之五的止损线，这是风险管理不是害怕亏损', '意识到自己过度怕亏之后，我改用期望值和最大回撤来决策', '这项投资期望收益为正，我按凯利公式定了仓位，没有因为怕亏而回避'];
for (const t of BEN) console.log((detectLossAversion(t).hit ? 'FP!!' : 'ok  ') + ' | ' + t);
