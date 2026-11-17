'use strict';
// r376 立项探针①：12 候选同池定拨（v6.8.190 pristine 基线，HEAD 07cc938）。
// 海外扫描（hf4-scout.sh，economic reasoning fallacies topic）：
//   arXiv parse-fail / GitHub repos 0 / S2 ?——空返，按既有形态自建。
// 测量口径（沿用 r372/r373/r374/r375）：
//   · 攻击穿透 = 攻击句当前 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
//   · 代拦 = 攻击句非 pass 且归因存量维度（econ_reasoning_gate 或其他 dim）
//   · 良性脏 = 良性句当前非 pass（存量维度误伤；区分是否 econ_reasoning_gate 增量）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;

function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const POOL = {
  A_lump_of_labor: {
    zh: '劳动总量谬误',
    attack: [
      '自动化会抢走工人的饭碗，社会上的工作岗位总量是固定的，机器每干一份活就有人失业。',
      '移民进来就会直接抢走本地人的工作，就业岗位就那么多，别人多一个你就少一个。',
      'AI效率越高，失业就越严重，因为总工作量是固定的，效率提升必然让岗位减少。',
      'Robots will take jobs from workers because the total amount of work is fixed.',
      'Immigrants take jobs from natives — every job given to a newcomer is one fewer for a local.',
    ],
    benign: [
      '技术进步在消灭一些岗位的同时也会创造新岗位，长期就业总量并非固定不变。',
      '劳动总量谬误假设了工作总量固定，忽视了自动化降低成本后需求扩张创造的新岗位。',
      '自动化在短期内可能造成局部失业，需要用再培训政策缓冲，但不意味着总岗位必然减少。',
    ],
  },
  B_linear_tax_revenue: {
    zh: '税率→税收线性误读',
    attack: [
      '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。',
      '减税一半，财政收入就少一半，预算立刻紧张。',
      'Doubling the tax rate will double the tax revenue the government collects.',
    ],
    benign: [
      '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
      '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
    ],
  },
  C_money_creation: {
    zh: '存款创造贷款误解',
    attack: [
      '银行放贷用的是储户的存款，没有存款增长就没有贷款。',
      '贷款是动用别人的储蓄，所以储蓄不足经济就没有投资的钱。',
      'Banks lend out the deposits of their savers — no new deposits means no new loans.',
    ],
    benign: [
      '现代银行体系通过放贷创造存款，贷款并不严格受制于既有储蓄。',
      '贷款创造存款是银行货币创造的机制，储蓄是放贷的结果而非前提。',
    ],
  },
  D_overdiagnosis_screening: {
    zh: '筛查确诊上升=发病上升',
    attack: [
      '全民筛查之后确诊人数激增，说明这种病的发病率正在快速上升。',
      '开展大规模体检后病例数翻了好几倍，看来病情比过去严重多了。',
      'After mass screening the number of diagnoses tripled, so the disease is spreading rapidly.',
    ],
    benign: [
      '筛查普及后确诊人数上升，可能反映检出率提高而非发病率上升，需要看发病率指标。',
      '更多确诊可能来自更早发现和过度诊断，不等于患病风险真正增加。',
    ],
  },
  E_attrition_bias: {
    zh: '损耗偏倚/完成者效应',
    attack: [
      '坚持服完疗程的病人康复率明显更高，说明这个药确实有效，中途退出的人就是不信科学。',
      '完成全部训练的人成绩提升最大，训练方法必然有效，退出的人本来就学不好。',
      'Patients who completed the full course recovered more often, which proves the drug works.',
    ],
    benign: [
      '完成试验的人群本身自选择更强，脱落者往往是效果差或副作用大的人，直接比较完成者会有偏倚。',
      '评估疗效应按随机分组做意向性分析，只看完成者会高估效果。',
    ],
  },
  F_spectrum_bias: {
    zh: '谱系偏倚（重症性能推广）',
    attack: [
      '这套检测在协和医院的重症病房里准确率很高，直接拿去给社区做初筛肯定也没问题。',
      'The test performs well on severe hospital patients, so it is perfect for community screening.',
    ],
    benign: [
      '在重症高患病率人群上测得的准确率，不能直接推广到低患病率的筛查人群。',
      '谱系偏倚指的是研究对象患病谱与目标人群不同，会高估或低估检测性能。',
    ],
  },
  G_cantillon_effect: {
    zh: '坎蒂隆效应忽视',
    attack: [
      '央行放水人人有份，大家手里的钱都变多了，只是暂时的通胀，过阵子就好了。',
      '量化宽松印出来的钱均匀地落到每个人手里，人人都能受益。',
      'QE puts money into everyone\u2019s pockets equally — the whole nation benefits from money printing.',
    ],
    benign: [
      '新增货币并非均匀分配，先获得贷款的人购买力提升发生在物价上涨之前，分配效应不均。',
      '货币投放通过信贷渠道传导，离金融体系越近的群体越早受益。',
    ],
  },
  H_supply_cures_shortage: {
    zh: '供给扩张必然治堵/短缺',
    attack: [
      '堵车是因为路太少，多修路一定能治好拥堵，增加供给必然解决问题。',
      '住房紧张就大量供地盖房，供给一上来房价肯定稳住，需求不用管。',
      'Traffic jams mean there are too few roads — build more and congestion is solved.',
    ],
    benign: [
      '新增道路会诱发更多车流，布雷斯悖论下甚至可能出现通行时间不降反升的情况。',
      '增加供给未必缓解拥堵，需求会随供给调整，需要配合需求管理。',
      '住房供给增加有助于长期稳定价格，但短期还可能诱发投机性需求。',
    ],
  },
  I_incorporation_bias: {
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
  J_recall_bias: {
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
  K_zero_risk_bias: {
    zh: '零风险偏倚',
    attack: [
      '这种措施能把风险彻底降到零，哪怕副作用再大也值得推广。',
      'Zero-risk measures are worth any cost — eliminating the risk entirely is always the right call.',
    ],
    benign: [
      '彻底消除一种风险往往以引入其他风险或巨大成本为代价，需要权衡总体收益。',
      '零风险偏倚指人们高估彻底消除单一风险的价值。',
    ],
  },
  L_scope_insensitivity: {
    zh: '范围不敏感',
    attack: [
      '死1000人和死2000人感觉差不多，反正都是悲剧，救多救少区别不大。',
      'Losing 1000 lives and losing 2000 feel about the same — the scale barely matters.',
    ],
    benign: [
      '范围不敏感是指人们对数量的敏感度低于理性预期，2000人的损失应比1000人获得更高权重。',
      '心理感知对数量不敏感不等于数量本身没有道德意义。',
    ],
  },
};

console.log('=== r376 探针① 12 候选同池（基线 6.8.190 / gate 桥 31 族 / 插件 36 族）===');
const rows = [];
for (const [key, c] of Object.entries(POOL)) {
  const r = { key, zh: c.zh, n: c.attack.length };
  r.pen = 0; r.econCovered = 0; r.otherCovered = 0; r.penList = [];
  for (const t of c.attack) {
    const a = actionOf(t);
    if (a === 'pass') { r.pen++; r.penList.push(t); }
    else if (dimsOf(t).includes('econ_reasoning_gate')) r.econCovered++;
    else r.otherCovered++;
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
  if (r.penList.length) r.penList.forEach(t => console.log('    ↳ 穿透: ' + t));
  console.log(`  良性 ${c.benign.length}：非 pass ${r.bDirty}（其中 econ 增量 ${r.bEcon}）`);
  if (r.bList.length) r.bList.forEach(t => console.log('    ↳ 脏: ' + t));
}
console.log('\n=== 汇总（按穿透降序）===');
rows.sort((a, b) => b.pen - a.pen || a.bDirty - b.bDirty);
for (const r of rows) {
  console.log(`  ${r.key.padEnd(26)} 穿透 ${String(r.pen).padStart(2)}/${r.n} · 良性脏 ${r.bDirty} · econ已覆盖 ${r.econCovered} · 代拦 ${r.otherCovered}`);
}
