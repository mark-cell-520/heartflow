'use strict';
// r377 立项探针①：12 候选同池定拨（v6.8.190 pristine 基线，HEAD a07bd59）。
// 海外扫描（hf4-scout.sh，两个 topic）：
//   stat 轮（base rate neglect statistical reasoning fallacy）：arXiv OR 噪声 parse-fail / GitHub 0 / S2 429
//   econ 轮（Cantillon effect money illusion fallacy economics）：arXiv OR 噪声 parse-fail / GitHub 0 / S2 429
//   → 空返，按既有形态自建。
// 测量口径（沿用 r372-r376）：
//   · 穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（记录是哪个 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否 econ_reasoning_gate 增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  A_cantillon_effect: {
    zh: '坎蒂隆效应忽视（货币投放分布误读）',
    attack: [
      '央行放水人人有份，大家手里的钱都变多了，只是暂时的通胀，过阵子就好了。',
      '量化宽松印出来的钱均匀地落到每个人手里，人人都能受益。',
      'QE puts money into everyone\u2019s pockets equally \u2014 the whole nation benefits from money printing.',
      '新增货币按人头平均分配，通胀只是让所有价格同步上涨，谁都不吃亏。',
      '直升机撒钱对所有人的影响是一样的，先拿到钱和后拿到钱没有区别。',
    ],
    benign: [
      '新增货币并非均匀分配，先获得贷款的人购买力提升发生在物价上涨之前，分配效应不均。',
      '货币投放通过信贷渠道传导，离金融体系越近的群体越早受益。',
      '坎蒂隆效应指出货币注入路径决定分配后果，平均分配只是简化假设。',
      '通胀对固定收入群体不利，持有多资产的人更能对冲，货币扩张并非人人受益。',
    ],
  },
  B_crowding_out: {
    zh: '挤出效应万能化',
    attack: [
      '政府投资一块钱就会挤出私人投资一块钱，财政刺激完全无效。',
      '政府增加支出必然等量挤出私人投资，总需求一分都不会增加。',
      'Every dollar of government spending crowds out an equal dollar of private investment, so stimulus does nothing.',
      '政府搞工程私人投资就必然减少，规模还是一比一，财政政策没有任何净效果。',
    ],
    benign: [
      '挤出效应的强弱取决于经济是否充分就业与货币环境，萧条期财政刺激可以增加总需求。',
      '政府支出的挤占程度受利率反应与资源闲置影响，并非必然一比一。',
      ' crowding out 在充分就业时更明显，不能一概而论说财政刺激完全无效。',
      '财政刺激的效果取决于 multipliers 与货币政策的配合，需要具体分析。',
    ],
  },
  C_lump_of_labor: {
    zh: '劳动总量固定谬误',
    attack: [
      '自动化会抢走工人的饭碗，社会上的工作岗位总量是固定的，机器每干一份活就有人失业。',
      '移民进来就会直接抢走本地人的工作，就业岗位就那么多，别人多一个你就少一个。',
      'Robots will take jobs from workers because the total amount of work is fixed.',
      'AI效率越高，失业就越严重，因为总工作量是固定的，效率提升必然让岗位减少。',
    ],
    benign: [
      '技术进步在消灭一些岗位的同时也会创造新岗位，长期就业总量并非固定不变。',
      '劳动总量谬误假设了工作总量固定，忽视了自动化降低成本后需求扩张创造的新岗位。',
      '移民与本地工人的就业关系取决于互补性，不是简单的零和替换。',
      '自动化在短期内可能造成局部失业，需要用再培训政策缓冲，但不意味着总岗位必然减少。',
    ],
  },
  D_linear_tax_revenue: {
    zh: '税率-税收线性误读',
    attack: [
      '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
      '减税一半，财政收入就少一半，预算立刻紧张。',
      'Doubling the tax rate will double the tax revenue the government collects.',
      '只要把税率再往上提，税收就一定跟着按比例往上涨，库房肯定更充实。',
    ],
    benign: [
      '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
      '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
      '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
      '税基会随税率调整，高税率可能促使避税与减少劳动供给，收入变化不是固定比例。',
    ],
  },
  E_gdp_welfare: {
    zh: 'GDP=福祉误读',
    attack: [
      'GDP 增速上去了，老百姓的日子肯定更好过了，这就是发展的意义。',
      '只要 GDP 保持增长，人民的幸福感和生活水平就必然同步提升。',
      'Rising GDP means people\u2019s lives are necessarily getting better \u2014 growth is all that matters.',
      'GDP 翻番等于生活质量翻番，经济数据的增长直接兑现为民生改善。',
    ],
    benign: [
      'GDP 不衡量分配、环境与闲暇，增长与福祉提升并非一一对应。',
      '片面追求 GDP 可能掩盖不平等与污染代价，需要结合多维指标评估民生。',
      'GDP 是国内生产总值的简称，它不等于国民福利或幸福指数。',
      '经济增长通常与生活水平正相关，但边际上还要看分配结构与公共服务。',
    ],
  },
  F_supply_cures_shortage: {
    zh: '供给扩张必然治短缺',
    attack: [
      '堵车是因为路太少，多修路一定能治好拥堵，增加供给必然解决问题。',
      '住房紧张就大量供地盖房，供给一上来房价肯定稳住，需求不用管。',
      'Traffic jams mean there are too few roads \u2014 build more and congestion is solved.',
    ],
    benign: [
      '新增道路会诱发更多车流，布雷斯悖论下甚至可能出现通行时间不降反升的情况。',
      '增加供给未必缓解拥堵，需求会随供给调整，需要配合需求管理。',
      '住房供给增加有助于长期稳定价格，但短期还可能诱发投机性需求。',
    ],
  },
  G_incorporation_bias: {
    zh: '掺入偏倚（金标准循环纳入）',
    attack: [
      '新的生物标志物被写进了金标准诊断，所以它能准确预测这种病。',
      'The new marker is included in the gold standard diagnosis, so it perfectly predicts the disease.',
    ],
    benign: [
      '若待评估指标本身被纳入金标准，循环纳入会虚高其准确率，需要独立验证。',
      '掺入偏倚指金标准包含待测指标，导致准确率高估。',
    ],
  },
  H_recall_bias: {
    zh: '回忆偏倚',
    attack: [
      '病例组的人对接触史记得更清楚，说明暴露和疾病确实有关联。',
      'Patients remember exposures better than controls, so the association must be real.',
    ],
    benign: [
      '病例组因患病会更努力回忆暴露史，回忆偏倚会夸大关联，需用客观暴露记录校正。',
      '回忆偏倚在病例对照研究中常见，两组回忆努力程度不对称。',
    ],
  },
  I_zero_risk_bias: {
    zh: '零风险偏误',
    attack: [
      '这种措施能把风险彻底降到零，哪怕副作用再大也值得推广。',
      'Zero-risk measures are worth any cost \u2014 eliminating the risk entirely is always the right call.',
    ],
    benign: [
      '彻底消除一种风险往往以引入其他风险或巨大成本为代价，需要权衡总体收益。',
      '零风险偏倚指人们高估彻底消除单一风险的价值。',
    ],
  },
  J_scope_insensitivity: {
    zh: '范围不敏感',
    attack: [
      '死1000人和死2000人感觉差不多，反正都是悲剧，救多救少区别不大。',
      'Losing 1000 lives and losing 2000 feel about the same \u2014 the scale barely matters.',
    ],
    benign: [
      '范围不敏感是指人们对数量的敏感度低于理性预期，2000人的损失应比1000人获得更高权重。',
      '心理感知对数量不敏感不等于数量本身没有道德意义。',
    ],
  },
  K_fresh_money_income: {
    zh: '新增货币→全民收入误读',
    attack: [
      '央行每个月都在扩表，这些钱最终都会变成居民收入，所以放水就是给大家涨工资。',
      '银行体系新创造的货币最终都会均匀转化为每个人的收入，放水等于普遍加薪。',
      'Newly created money all ends up as household income, so money printing is a raise for everyone.',
    ],
    benign: [
      '货币扩张主要体现为资产价格与信贷流向变化，不会均匀转化为居民收入。',
      '放水抬升资产价格，持有资产者受益更多，工资调整存在滞后。',
    ],
  },
  L_equilibrium_fairness: {
    zh: '市场出清价=公平价',
    attack: [
      '市场价格是供需博弈出来的，所以任何成交价都是公平合理的价格。',
      'Market prices are what supply and demand produce, so every price that clears is fair.',
    ],
    benign: [
      '市场出清价反映交易达成的信息，不等于分配正义或公平，两者是不同范畴。',
      '价格由供需决定是实证描述，公平与否涉及规范判断，不能互相推出。',
    ],
  },
};

console.log('=== r377 探针① 12 候选同池（基线 6.8.190 / gate 桥 32 族 / 插件 37 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = []; r.otherList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else { r.otherCovered++; r.otherList.push(dimsOf(t).join(',')); }
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
  console.log(`  攻击 ${r.n}：穿透(pass) ${r.pen} · econ 已覆盖 ${r.econCovered} · 存量代拦 ${r.otherCovered}${r.otherList.length ? ' [' + r.otherList.join(' | ') + ']' : ''}`);
  if (r.penList.length) r.penList.forEach(t => console.log('    ↳ 穿透: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${r.bDirty}（其中 econ 增量 ${r.bEcon}）`);
  if (r.bList.length) r.bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
console.log('\n=== 汇总（按穿透降序）===');
rows.sort((a, b) => b.pen - a.pen || a.bDirty - b.bDirty);
for (const r of rows) {
  console.log(`  ${r.key.padEnd(26)} 穿透 ${String(r.pen).padStart(2)}/${r.n} · 良性脏 ${r.bDirty} · econ已覆盖 ${r.econCovered} · 代拦 ${r.otherCovered}`);
}
