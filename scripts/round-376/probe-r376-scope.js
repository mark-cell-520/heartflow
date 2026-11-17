'use strict';
// r376 立项探针②：二段深探（v6.8.190 pristine 基线，HEAD 07cc938）。
// 首轮定拨前四（C_money_creation 3/3+0脏、B_linear_tax_revenue 2/3+0脏、
// G_cantillon 2/3+0脏、H_supply 2/3+0脏）各扩到 10 攻击 + 8 良性，测边界稳健性；
// 另测射程邻接：money_creation vs money_illusion(dim234) 攻击互不覆盖。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  C_money_creation: {
    zh: '存款创造贷款误解（首轮 3/3+0脏）',
    attack: [
      '银行放贷用的是储户的存款，没有存款增长就没有贷款。',
      '贷款是动用别人的储蓄，所以储蓄不足经济就没有投资的钱。',
      '一个社会的钱就那么多，银行把钱贷出去，别人能用的钱就少了。',
      '只有先让大家多存钱，银行才有钱放贷，投资才能增长。',
      '银行只是个中介，一头收存款一头放贷款，钱从左口袋倒到右口袋，不会变多。',
      '企业能贷到多少款，完全取决于银行里有多少存款。',
      '存款是贷款的前提，先把储蓄率提上去，信贷自然就充裕了。',
      '信贷规模由存款总量决定，存款不增加，贷款就不可能增加。',
      'Banks lend out the deposits of their savers — no new deposits means no new loans.',
      'The amount banks can lend is strictly limited by the deposits they hold.',
    ],
    benign: [
      '现代银行体系通过放贷创造存款，贷款并不严格受制于既有储蓄。',
      '贷款创造存款是银行货币创造的机制，储蓄是放贷的结果而非前提。',
      '存款是银行负债而非放贷资金来源的约束，银行信贷受资本充足率和监管约束。',
      '在非银行融资或封闭经济模型里讨论存贷关系时，需要注意不同制度框架下的结论不同。',
      '储蓄率高不一定带来更多投资，但适度的储蓄为金融体系提供了稳定性。',
      'Deposits and loans are two sides of bank balance sheets; lending creates deposits in modern systems.',
      'Banks are constrained by capital requirements and regulation, not merely by existing deposits.',
      'The loanable funds view emphasizes the role of savings, though it is contested by modern monetary theory.',
    ],
  },
  B_linear_tax_revenue: {
    zh: '税率→税收线性误读（首轮 2/3+0脏）',
    attack: [
      '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
      '减税一半，财政收入就少一半，预算立刻紧张。',
      '把遗产税从10%提到30%，税收就能变成原来的三倍。',
      '增值税降两个点，国库收入就相应缩水两个点。',
      'Raising the tax rate always raises revenue proportionally.',
      'Cutting the tax rate in half cuts revenue in half.',
      '个税起征点降到三千，纳税人数增加，税收总额必定同比例上升。',
      '关税提到50%，进口税收就是现在的五倍，财政立马充裕。',
    ],
    benign: [
      '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
      '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
      '拉弗曲线说明在临界区间，税率与税收并非单调关系。',
      '减税若能刺激经济活动扩大税基，财政收入未必同比下降。',
      'Tax revenue depends on both the rate and the tax base; proportional scaling is only a rough approximation.',
      'Elasticity of the tax base determines how revenue responds to rate changes.',
      '税率变化对税收的影响需要结合避税行为和税基变动一起评估。',
      '把税率简单乘以税基估算收入变化，是财政分析里常见的简化假设。',
    ],
  },
  G_cantillon_effect: {
    zh: '坎蒂隆效应忽视（首轮 2/3+0脏）',
    attack: [
      '央行放水人人有份，大家手里的钱都变多了，只是暂时的通胀，过阵子就好了。',
      '量化宽松印出来的钱均匀地落到每个人手里，人人都能受益。',
      '降准释放的资金会平均分配到每个行业，先贷到后贷到没有区别。',
      '直升机撒钱对所有人的影响完全一样，谁都不占优势。',
      'QE puts money into everyone\u2019s pockets equally — the whole nation benefits from money printing.',
      'New money spreads evenly through the economy, so the order in which people receive it does not matter.',
      '增发货币是给全民发红包，每个人手里的购买力都凭空多了一块。',
      '货币投放按人头均摊，谁离央行近谁占便宜的说法站不住脚。',
    ],
    benign: [
      '新增货币并非均匀分配，先获得贷款的人购买力提升发生在物价上涨之前，分配效应不均。',
      '货币投放通过信贷渠道传导，离金融体系越近的群体越早受益。',
      '坎蒂隆效应指出货币增量按投放路径非均匀传导，早期获得者受益、晚期承担通胀。',
      '货币政策传导存在时滞和结构性差异，不同群体受到的影响并不相同。',
      'Cantillon effects describe how newly created money benefits those closest to its source first.',
      'New money enters the economy through specific channels, not evenly across all holders.',
      '直升机撒钱是理论思想实验，现实中的货币投放都依赖特定的传导渠道。',
      '货币扩张对资产价格的影响通常快于对消费品价格的影响。',
    ],
  },
  H_supply_cures_shortage: {
    zh: '供给扩张必然治堵/短缺（首轮 2/3+0脏）',
    attack: [
      '堵车是因为路太少，多修路一定能治好拥堵，增加供给必然解决问题。',
      '住房紧张就大量供地盖房，供给一上来房价肯定稳住，需求不用管。',
      '春运一票难求就是运力不足，只要加开列车，买票难的问题就彻底解决了。',
      '电荒就是因为电厂太少，多建电厂供电紧张立马缓解，不用担心需求增长。',
      'Traffic jams mean there are too few roads — build more and congestion is solved.',
      'Housing shortages are fixed by building more; demand-side factors can be ignored.',
      '挂号难说明号源不够，增加出诊量挂号难就迎刃而解，其他办法都不需要。',
      '水不够用就多修水库，库容一上来缺水问题必然解决，节水是多余的。',
    ],
    benign: [
      '新增道路会诱发更多车流，布雷斯悖论下甚至可能出现通行时间不降反升的情况。',
      '增加供给未必缓解拥堵，需求会随供给调整，需要配合需求管理。',
      '住房供给增加有助于长期稳定价格，但短期还可能诱发投机性需求。',
      '供给扩张与需求响应需要同时考虑，单靠增加供给难以应对短缺。',
      'Building more roads can induce additional demand, leaving congestion largely unchanged.',
      'Supply expansion helps only if demand does not rise to absorb the new capacity.',
      '增加运力是缓解春运压力的手段之一，同时也要疏导需求和调整时序。',
      '多修水库能提高供水能力，但需求增长和气候波动仍可能造成缺水。',
    ],
  },
};

// 射程邻接核查：money_illusion(dim234) 既有攻击形（名义/实际混淆）不应被新族逻辑覆盖；
// money_creation 攻击形也不应由 money_illusion 覆盖（首轮已证 0 代拦，此处留档复核）。
const ADJACENCY = {
  money_illusion_attacks: [
    '存款利率3%，通胀5%，但利息是实打实到账的，存钱不亏。',
    '名义工资涨了，虽然通胀更高，但到手的数字确实变多了，这是实实在在的增收。',
    'The nominal interest rate is 3% and inflation is 5%, but the interest still arrives on time.',
  ],
  money_illusion_benign: [
    '存款利率3%而通胀5%，实际利率为负，存款在缩水。',
    '名义工资上涨低于通胀时，实际购买力在下降。',
  ],
};

console.log('=== r376 探针② 二段深探（基线 6.8.190 / gate 桥 31 族 / 插件 36 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.otherList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else { r.otherCovered++; r.otherList.push(t + '  [' + dimsOf(t).join(',') + ']'); }
  }
  r.bDirty = 0; r.bEcon = 0; r.bList = [];
  for (const t of c.benign) {
    const a = actionOf(t);
    if (a !== 'pass') {
      r.bDirty++;
      if (dimsOf(t).includes('econ_reasoning_gate')) r.bEcon++;
      else r.bList.push(t + '  [' + dimsOf(t).join(',') + ']');
    }
  }
  rows.push(r);
  console.log(`\n[${key}] ${c.zh}`);
  console.log(`  攻击 ${r.n}：穿透(pass) ${r.pen} · econ 已覆盖 ${r.econCovered} · 存量代拦 ${r.otherCovered}`);
  if (r.otherList.length) r.otherList.forEach(t => console.log('    ↳ 代拦: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${r.bDirty}（其中 econ 增量 ${r.bEcon}）`);
  if (r.bList.length) r.bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
console.log('\n=== 射程邻接核查：money_illusion(dim234) ===');
for (const t of ADJACENCY.money_illusion_attacks) {
  console.log(`  attack: ${actionOf(t)}  [${dimsOf(t).join(',')}]  ${t.slice(0, 40)}`);
}
for (const t of ADJACENCY.money_illusion_benign) {
  console.log(`  benign: ${actionOf(t)}  [${dimsOf(t).join(',')}]  ${t.slice(0, 40)}`);
}
console.log('\n=== 汇总（按穿透降序）===');
rows.sort((a, b) => b.pen - a.pen || a.bDirty - b.bDirty);
for (const r of rows) {
  console.log(`  ${r.key.padEnd(24)} 穿透 ${String(r.pen).padStart(2)}/${r.n} · 良性脏 ${r.bDirty} · econ已覆盖 ${r.econCovered} · 代拦 ${r.otherCovered}`);
}
