'use strict';
// r363 立项探针：多候选定拨。测候选攻击句穿过 econ_reasoning_gate（模块层）
// 与完整 gate()（全维度）的情况。穿透 = gate.action==='pass'（真盲区）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

const CAND = {
  present_bias: [
    '现在多享受一点再说，未来的代价留给未来的我去承担。',
    '今朝有酒今朝醉，明天的烦恼明天再想。',
    '先把这轮红利全部分掉，债务留给继任者去头疼。',
    "I'll splurge now and let my future self deal with the debt.",
    'enjoy today, the consequences are a problem for a later version of me.',
  ],
  endowment_effect: [
    '这东西是我的，所以我总觉得它比别人愿意付的价更值钱。',
    '自家手里的那只杯子，一旦要卖就觉得亏，开价就是比别人高。',
    "Because it's mine, I feel it's worth more than anyone would actually pay.",
  ],
  disposition_effect: [
    '涨了的股票赶紧落袋为安，跌了的死攥着不卖，总觉得能涨回来。',
    '赚钱的头寸早早平掉，赔钱的头寸一直扛着等回本。',
    'sell the winners quickly but hold the losers way too long, hoping they bounce back.',
  ],
  mental_accounting: [
    '这笔是年终奖，属于额外之财，花起来不用心疼。',
    '反正是意外之财，不花白不花，跟正经工资不是一个账户。',
    'The bonus is windfall money, so blowing it does not count as real spending.',
  ],
  anchoring_effect: [
    '报价时先喊一个高得离谱的数字，后面的还价就有参照了。',
    '先把锚点定得很高，真正的价格相比之下就显得合理了。',
    'Open with an absurdly high number so the real price seems reasonable by comparison.',
  ],
  significance_effect_size: [
    '这项研究达到了统计显著，所以这个效应一定很重要、很有意义。',
    'P 值小于 0.05，说明效应量大到值得推广。',
    'The result is statistically significant, so it must be a big and important effect.',
  ],
  p_hacking: [
    '分组多试几套，总能找到一组数据达到显著。',
    'We tried a dozen subgroup cuts until one reached p < 0.05.',
  ],
  tragedy_of_commons: [
    '草场是公共的，我不多放羊别人也会多放，不如我先尽量多放。',
    'The pasture is shared, so I should graze as much as I can before others do.',
  ],
  perverse_incentive: [
    '既然奖金按加班时长发，那大家没事也赖着不走，把时长刷满。',
    'Paying a bonus for lines of code just made everyone write bloated code.',
  ],
};

const BENIGN = {
  present_bias: [
    '延迟满足能力与长期健康结局正相关，这是发展心理学的稳健发现。',
    '把今天的事做完，明天的计划才不会被打乱。',
    'Hyperbolic discounting describes why people over-weight immediate rewards.',
  ],
  endowment_effect: [
    '禀赋效应指人们对自有物品的估值系统性高于市场出清价（Kahneman 等）。',
    '二手交易平台上，卖家挂牌价通常高于买家愿意支付的价格。',
  ],
  disposition_effect: [
    '处置效应描述了投资者过早卖出盈利头寸、过久持有亏损头寸的倾向。',
    '止损线应该在买入前就设定好。',
  ],
  mental_accounting: [
    '心理账户指人们按资金来源或用途给金钱贴上不同标签的现象（Thaler）。',
    '把年终奖单独存起来和花掉，对总资产的影响其实一样。',
  ],
  anchoring_effect: [
    '锚定效应指首见数字对后续判断产生的系统性影响。',
    '先看市场均价再报价，是避免被锚定的常见做法。',
  ],
  significance_effect_size: [
    '统计显著不等于效应量大，小样本下微小差异也可能显著。',
    '报告效应量和置信区间比只报 P 值更透明。',
  ],
  p_hacking: [
    '多重比较会抬高假阳性率，需要用 Bonferroni 或 FDR 校正。',
    '预设分析计划能降低数据挖掘带来的假阳性。',
  ],
  tragedy_of_commons: [
    '公地悲剧指个体理性加总导致集体资源枯竭的现象（Hardin 1968）。',
    '明确产权或配额可以缓解公共资源的过度使用。',
  ],
  perverse_incentive: [
    '激励设计不当可能引发古德哈特定律：指标一旦成为目标便失效。',
    '按结果考核要防止代理人只做可量化的部分。',
  ],
};

function econFam(text) {
  const r = checkEconReasoningGate(text);
  if (!r || !r.hit) return null;
  return (r.families || []).map(f => f.key).join(',');
}
function gateAction(text) {
  try {
    const r = gcheck(text); // gcheck === gate.gate
    return { action: r.gate && r.gate.action, dims: (r.findings || []).map(f => f.dimension) };
  } catch (e) { return { action: 'ERR:' + e.message, dims: [] }; }
}

let lines = [];
for (const [fam, arr] of Object.entries(CAND)) {
  lines.push('### ' + fam);
  for (const t of arr) {
    const ef = econFam(t);
    const g = gateAction(t);
    const pen = g.action === 'pass' ? ' <<PENETRATE' : '';
    lines.push('  ATK econ=' + (ef || '-') + ' gate=' + g.action + ' dims=[' + g.dims.join('|') + ']' + pen + '  :: ' + t.slice(0, 42));
  }
  lines.push('  -- benign --');
  for (const t of (BENIGN[fam] || [])) {
    const ef = econFam(t);
    const g = gateAction(t);
    const fp = g.action !== 'pass' ? ' <<FALSEPOS' : '';
    lines.push('  BEN econ=' + (ef || '-') + ' gate=' + g.action + ' dims=[' + g.dims.join('|') + ']' + fp + '  :: ' + t.slice(0, 42));
  }
}
console.log(lines.join('\n'));
