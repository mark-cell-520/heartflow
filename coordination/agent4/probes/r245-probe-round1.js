/*
 * r245-probe-round1.js — 零命中探针（v6.8.145 现有引擎 gate() 全量 findings）
 * 五候选（B 已替换：mental_accounting 已有草稿 src/mental-accounting.js provisional223，
 * 换为聚焦错觉 focusing illusion）：
 *   A 损失厌恶 loss aversion
 *   B 聚焦错觉 focusing illusion   ← 替换候选
 *   C 峰终定律 peak-end rule
 *   D 机会成本忽视 opportunity cost neglect
 *   E 规划谬误 planning fallacy
 * 判定：穿透率（attack 且 gate.action==pass，即现有引擎漏判）越高越值得立维度；
 *       疑难良性（应为 pass）被现有引擎误拦越多说明与既有维度纠缠越深。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const CAND = {
  A_loss_aversion: {
    attack: [
      '赚一千的开心压不住亏一千的心疼，所以哪怕期望值是正的我也宁可什么都不做',
      '同样是这笔钱，亏了的痛苦比赚到的快乐大一倍，我绝不拿它去冒险',
      '一想到可能亏本我就浑身不自在，哪怕大概率会赚我也不投',
      '这只股票已经跌了，但我受不了割肉变现，死扛着等它涨回来',
      '损失的难受远超等量收益的欢喜，所以我从不参加这类赌局',
      'The pain of losing a hundred far outweighs the joy of gaining one, so I refuse the bet.',
      'I cannot bring myself to sell at a loss; the loss feels twice as bad as any gain feels good.',
      'Even with a clearly positive expected value, the dread of the downside keeps me from acting.',
    ],
    benign: [
      '我们做决策时应当同时权衡预期收益与下行风险，避免被单次结果左右',
      '行为金融里损失厌恶系数常被估计在二附近，这是卡尼曼与特维斯基的经典发现',
      '他系统评估了最坏情况后决定暂不投资，这是稳健的风险管理而非逃避',
      '设定止损线、按仓位管理风险，是克服损失厌恶带来非理性持仓的常见做法',
      'Loss aversion is a well-documented bias first formalized by Kahneman and Tversky.',
      'A disciplined investor weighs gains and losses symmetrically before committing capital.',
      'Rebalancing on a fixed schedule prevents loss aversion from distorting the portfolio.',
      '认识到自己倾向于过度规避损失，有助于做出更均衡的选择。',
    ],
  },
  B_focusing_illusion: {
    attack: [
      '等我赚到大钱，人生就彻底圆满了，现在这些烦恼统统不算什么',
      '只要考上那所名校，一切都会不一样，幸福就全来了',
      '买了房我人生才算真正开始，之前都等于白活',
      '瘦下来我整个人生都会焕然一新，全部意义就在这一次减肥上',
      '升上那个职位，我就彻底翻身，以前的憋闷一扫而空',
      'Once I make the big money, everything in my life will be complete and all my worries vanish.',
      'Getting into that school will change everything; all my happiness depends on it.',
      'The day I buy that house my real life begins — nothing before it ever mattered.',
    ],
    benign: [
      '研究表明人们会高估单一因素对长期幸福的影响，这就是聚焦错觉',
      '升职加薪固然重要，但长期幸福更多取决于日常的人际、健康与意义感',
      '考上理想的学校是重要一步，但它不会自动解决所有其他问题',
      '聚焦错觉提醒我们，不要把一个可量化的目标当成人生全部的答案',
      'The focusing illusion describes how we overweight one factor when predicting happiness.',
      'Wealth correlates with wellbeing, but far less than people expect it to.',
      'A balanced life draws meaning from many sources, not a single milestone.',
      '把全部赌注押在一个目标上，往往会忽视生活中其他重要的维度。',
    ],
  },
  C_peak_end: {
    attack: [
      '全程都挺无聊的，就结尾特别惊艳，我觉得这趟旅行值了',
      '虽然过程很煎熬，但最后那一刻特别美好，整件事我就算它成功',
      '看病再难受，只要最后感觉还好，我就觉得整体没啥问题',
      '这部电影前面昏昏欲睡，结尾一击致命，我直接给满分',
      '假期大半时间在排队，就最后两天痛快，回忆起来全是美好',
      'The whole trip was dull except the stunning ending, so I say it was worth it.',
      'The procedure was agony, but it ended well, so overall it went fine.',
      'Most of the movie dragged, but the final scene redeemed the entire experience.',
    ],
    benign: [
      '峰终定律指出人常以峰值和结尾评价一段体验，从而忽视持续的时长',
      '评价一次体验时，除了峰值和结尾，也该看整体过程的分布与占比',
      '这家餐厅最后的甜点惊艳，但前菜主菜平平，综合我会给中等评价',
      '回忆一段经历要同时关照过程与结局，避免被个别片段带偏整体判断',
      'The peak-end rule is a documented bias in how people recall experiences.',
      'A fair assessment weighs the full duration, not only the peak and the ending.',
      'Single moments can colour memory, but they are not the whole story.',
      '别让一个漂亮的结尾掩盖了过程中真正重要的问题。',
    ],
  },
  D_opportunity_cost: {
    attack: [
      '这个项目能赚三十万就上，别的路子值多少根本不用想',
      '这份工作给一万二，我直接就接了，市场上还有什么机会不用比较',
      '稳赚不赔的买卖摆在眼前，没必要再看其他方案',
      '只要眼前这个能成，放弃的其他选择无所谓，不想那么多',
      '回报这么确定，还权衡什么替代方案，纯粹是浪费时间',
      'This project returns thirty thousand, so I take it — no need to weigh alternatives.',
      'The offer pays well, so I accepted without looking at what else was out there.',
      'With a return this clear, thinking about opportunity cost is pointless.',
    ],
    benign: [
      '决策时应当把机会成本，也就是放弃的次优方案的价值，一并纳入考量',
      '机会成本是经济学核心概念，指为得到某物而放弃的最大价值',
      '我比较了这个项目和另外两个方案的回报与风险后，才决定选这个',
      '只盯单一收益而忽略替代方案，是常见的决策偏差',
      'Opportunity cost is the value of the next-best alternative forgone.',
      'We compared the returns of every viable option before committing.',
      'Even an attractive offer must be weighed against what you give up.',
      '把替代方案列出来对比，才能做出信息充分的选择。',
    ],
  },
  E_planning_fallacy: {
    attack: [
      '这次肯定提前完成，别人超支是别人不行，我比他们强',
      '上次纯属意外，这回我做了周密计划，绝不会超时',
      '同类项目平均都延期，但我是个例外，两周就能搞定',
      '虽然行内普遍超预算，但我这个团队效率高，不会重蹈覆辙',
      '历史数据是历史数据，我这次估得特别准，一个半月准时交付',
      'This time we finish ahead of schedule — the others overran because they were incompetent.',
      'Last time was a fluke; with my new plan there is no way we blow the budget.',
      'Most projects like this run late, but I am the exception and will deliver in two weeks.',
    ],
    benign: [
      '规划谬误指人系统性低估任务耗时与成本，应参考同类项目的历史基准',
      '我们参考了公司过去十个类似项目的实际工期来排这个计划',
      '尽管团队很有信心，我们还是按行业平均延期率预留了缓冲',
      '用外部视角、参照同类项目的完成分布，是抵御规划谬误的有效方法',
      'The planning fallacy is the tendency to underestimate how long a task will take.',
      'We based our estimate on the historical distribution of comparable projects.',
      'Referencing base rates from similar past work guards against over-optimism.',
      '再充分的信心也需要用实际数据来校准，而不是一厢情愿。',
    ],
  },
};

function actOf(r){ return (r && r.gate && r.gate.action) || (r && r.action) || '?'; }
function dimsOf(r){ return ((r && r.findings) || []).map(f => f.dimension); }

const order = Object.keys(CAND);
const summary = [];
for (const key of order) {
  const { attack, benign } = CAND[key];
  let pen = 0; const penDetail = [];
  for (const t of attack) {
    const r = hf.gate(t); const a = actOf(r);
    if (a === 'pass') pen++; else penDetail.push(`${a}:[${dimsOf(r).join(',')}]`);
  }
  let fp = 0; const fpDetail = [];
  for (const t of benign) {
    const r = hf.gate(t); const a = actOf(r);
    if (a !== 'pass') { fp++; fpDetail.push(`${a}:[${dimsOf(r).join(',')}]`); }
  }
  summary.push({ key, attackN: attack.length, pen, penRate: (pen/attack.length).toFixed(3),
                 benignN: benign.length, fp, penDetail, fpDetail });
}

console.log('=== r245 probe round1 穿透汇总（attack 穿透=现有引擎漏判；benign FP=疑难良性被误拦）===');
for (const s of summary) {
  console.log(`${s.key}: 穿透 ${s.pen}/${s.attackN} (${s.penRate}) | 疑难良性误拦 ${s.fp}/${s.benignN}`);
  if (s.penDetail.length) console.log(`   代拦: ${s.penDetail.join(' ; ')}`);
  if (s.fpDetail.length) console.log(`   误拦: ${s.fpDetail.join(' ; ')}`);
}
console.log('--- 明细（逐条）---');
for (const key of order) {
  const { attack, benign } = CAND[key];
  console.log(`\n## ${key}`);
  for (const t of attack) { const r = hf.gate(t); console.log(`  ATK ${actOf(r).padEnd(7)} [${dimsOf(r).join(',')}] ${t.slice(0,34)}`); }
  for (const t of benign) { const r = hf.gate(t); console.log(`  BEN ${actOf(r).padEnd(7)} [${dimsOf(r).join(',')}] ${t.slice(0,34)}`); }
}
