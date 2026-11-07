// r240 二轮探针：A 处置效应 vs B 虚假共识效应 定夺（agent-4）
// 攻击穿透上限 + 疑难良性零纠缠 + 边界锁不越界 三重判据。
// 运行：node coordination/agent4/probes/r240-probe-round2.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const attacks = [
  // A 处置效应 追加变体
  ['A 处置效应', 'A7-ZH', '散户的通病就是赚钱的票拿不久，赚几个点就跑，亏钱的票反而敢长期捂着等解套。'],
  ['A 处置效应', 'A8-ZH', '我这几年炒股的心得是：涨了先落袋，跌了不砍仓，利润跑了太难受，割肉下不去手。'],
  ['A 处置效应', 'A9-ZH', '一看翻红了我就想卖，碧绿碧绿的仓位反而舍不得动，总觉得放放就能回本。'],
  ['A 处置效应', 'A10-EN', 'Retail investors are quick to sell a stock once it turns green but hold red positions for years waiting to break even.'],
  ['A 处置效应', 'A11-EN', 'My rule of thumb: bank the gains while they are small, but never realize a loss — wait for it to come back.'],
  ['A 处置效应', 'A12-EN', 'Winners get sold too fast and losers get held too long; realizing a gain feels good, realizing a loss feels terrible.'],
  // B 虚假共识 追加变体
  ['B 虚假共识', 'B7-ZH', '我完全接受不了这个改动，跟我一批的老员工肯定也这么认为，不可能有人支持。'],
  ['B 虚假共识', 'B8-ZH', '我看完片子觉得一般，豆瓣上打高分的人肯定是水军，真实观众不会觉得好。'],
  ['B 虚假共识', 'B9-EN', 'I find the change unacceptable, and the rest of the team must feel the same — no one will support it.'],
  ['B 虚假共识', 'B10-EN', 'I thought the movie was mediocre, so most viewers probably agree and the high ratings are fake.'],
  // C/D/E 复核上限
  ['C 邓宁-克鲁格', 'C7-ZH', '我自学编程三个月，一眼就能看出他们这个架构问题很大，所谓的资深工程师也就这样。'],
  ['D 样本量不敏感', 'D7-ZH', '访谈了8个用户，7个说愿意付费，所以70%的目标用户都有付费意愿，市场空间据此测算。'],
  ['E 蒙蒂霍尔', 'E7-ZH', '体检排除了一项癌症风险之后，剩下两项的患病概率各占一半，跟检查前一模一样。'],
];

// 疑难良性：同领域最易误伤的正确推理形（期望 pass）
const hardBenigns = [
  ['A 处置效应', 'AH1-ZH', '我在买入前就设好止损和止盈线，价格触线机械执行，浮盈浮亏不影响判断。'],
  ['A 处置效应', 'AH2-ZH', '这只票涨到估值上限了，按计划分批卖出；那只基本面恶化了，按纪律止损。'],
  ['A 处置效应', 'AH3-ZH', '虽然浮盈了不少，但基本面没变，我继续持有，没到目标价就不卖。'],
  ['A 处置效应', 'AH4-ZH', '虽然被套了，但重新分析后认为逻辑破了，我果断止损，换更好的标的。'],
  ['A 处置效应', 'AH5-EN', 'My exit rules are valuation-based: trim when the price exceeds fair value, cut when the thesis breaks, regardless of paper P&L.'],
  ['A 处置效应', 'AH6-EN', 'Even though the position is deeply underwater, the numbers still work, so I keep holding — it is conviction, not denial.'],
  ['A 处置效应', 'AH7-ZH', '定投指数基金我从不择时，止盈止损都不看，就按估值百分位再平衡。'],
  ['A 处置效应', 'AH8-EN', 'I never sell a winner just because it is up, and I never keep a loser just because it is down.'],
  ['B 虚假共识', 'BH1-ZH', '我觉得这个改动挺好，不过团队里有人可能有顾虑，下周开个会收集一下意见。'],
  ['B 虚假共识', 'BH2-ZH', '我的体感是加载变快了，性能测试也证实首屏时间下降了两百毫秒。'],
  ['B 虚假共识', 'BH3-ZH', '问卷收了三百份回复，七成用户表示满意，说明改动得到了多数人认可。'],
  ['B 虚假共识', 'BH4-EN', 'My sense is the flow is smoother, and the funnel data backs it up with a 12% lift in completion.'],
  ['B 虚假共识', 'BH5-EN', 'I like the new layout, though I should validate that with users before rolling it out.'],
  ['B 虚假共识', 'BH6-ZH', '老一辈人都怀念过去的日子，这在每一个时代都是常态，并非这届年轻人特殊。'],
  ['B 虚假共识', 'BH7-EN', 'Everyone I talked to at the conference agreed, so the sentiment seems widespread.'],
  ['B 虚假共识', 'BH8-ZH', '客户当场夸我们响应快，看来我们的服务在行业里算是领先的。'],
];

// 边界锁：他族领地或无谬误句，A/B 模块均不得越界承重
const boundaries = [
  ['A 边界-沉没成本', 'AB1-ZH', '这个项目已经投了两百万，现在停掉前面的钱就全打水漂了，只能硬着头皮做完。'],
  ['A 边界-心理账户', 'AB2-ZH', '年终奖发下来我花得特别痛快，反正不是工资，花着不心疼。'],
  ['A 边界-沉没成本EN', 'AB3-EN', 'We have already invested two million, so quitting now would waste it all.'],
  ['B 边界-诉诸多数', 'BBL1-ZH', '既然全网都在讨论这部剧，那它一定是近期最值得看的国产剧。'],
  ['B 边界-伪造口碑', 'BBL2-ZH', '商家宣传月销十万件，买家评价清一色好评，看来质量确实过硬。'],
  ['B 边界-诉诸多数EN', 'BBL3-EN', 'Millions of users love this app, so it must be the best in its category.'],
];

function run(rows, tag, wantPass) {
  const byFam = new Map();
  for (const [fam, id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (!byFam.has(fam)) byFam.set(fam, []);
    byFam.get(fam).push(`    ${id} [${action}]${dims ? ' 承重:' + dims : ''}`);
  }
  console.log(`=== ${tag} ===`);
  for (const [fam, lines] of byFam) {
    const pass = lines.filter(l => l.includes('[pass]')).length;
    console.log(`  ${fam}: pass=${pass}/${lines.length}${wantPass ? '  ← 误伤数' : '  ← 穿透数'}`);
    for (const line of lines) console.log(line);
  }
}

run(attacks, '攻击族（pass=穿过引擎=零命中）', false);
run(hardBenigns, '疑难良性（pass=正确放行，非pass=误伤）', true);
run(boundaries, '边界锁（记录当前归属，供模块接线后对照）', true);
