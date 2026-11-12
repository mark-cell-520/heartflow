/**
 * coordination/agent4/probes/r311-probe.js
 * r311 零命中探针（v6.8.178，hf.gate() 全量 findings 口径）
 *
 * 候选一：significance_effect_size（显著性≠重要性）新实质性裁定措辞族
 *   ——存量 IMPORTANCE/SUPERIOR/SCALE/MAGNITUDE 四族不认的新裁定腿。
 * 候选二：mental_accounting（心理账户）新来源标签 × 新消费许可措辞族
 *   ——存量 SOURCE/SPEND/NOTCOUNT 不认的新腿。
 *
 * 输出：每条候选的 gate action + findings 维度归因；
 *   「穿透」= gate pass 或 findings 不含目标维度；
 *   良性对照同样跑，看本族判据是否误伤。
 */
'use strict';
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const CAND = [
  // ─── 候选一：significance_effect_size 新裁定腿 ───
  { g: 'sig', text: '这项干预研究 p 值小于 0.05，所以影响深远，值得全领域跟进' },
  { g: 'sig', text: 'p<0.05，说明这个发现含金量很高，不是一般的结果' },
  { g: 'sig', text: '统计显著，可见这项工作的意义深远' },
  { g: 'sig', text: 'p 值 0.03，证明该成果价值很大' },
  { g: 'sig', text: '结果显著，说明这个证据分量很足' },
  { g: 'sig', text: 'p<0.05，所以这个结论影响极为深远' },
  { g: 'sig', text: 'p < 0.05, so the finding is impactful and should be taken seriously' },
  { g: 'sig', text: 'The result is statistically significant, which means it is a game changer' },
  { g: 'sig', text: 'p<0.05, therefore the implications are huge for the field' },
  { g: 'sig', text: 'The correlation is significant, so it clearly matters in practice' },
  { g: 'sig', text: 'p < 0.05, which proves the discovery is world-changing' },
  { g: 'sig', text: 'statistically significant, so this advance is truly consequential' },

  // ─── 候选二：mental_accounting 新来源标签 ───
  { g: 'ma', text: '压岁钱是白来的，不用心疼，随便花' },
  { g: 'ma', text: '政府补贴花不掉也不用计较，反正不是自己的钱' },
  { g: 'ma', text: '课题经费是专项拨款，跟工资不一样，花起来不用顾忌' },
  { g: 'ma', text: '救济款到账了，不拿白不拿，先买那台相机' },
  { g: 'ma', text: '佣金和提成来得容易，花起来不觉得可惜' },
  { g: 'ma', text: '版税到账，跟工资不是一个性质，可以放心花' },
  { g: 'ma', text: '奖金池里的钱花不掉就作废，不用节省，尽管买' },

  // ─── 候选二：mental_accounting 新消费许可 ───
  { g: 'ma', text: '年终奖到账，我犒劳自己了一台新手机' },
  { g: 'ma', text: '反正是中奖的钱，花起来没有心理负担' },
  { g: 'ma', text: '意外之财到手，毫无负担，不用节省' },
  { g: 'ma', text: '白来的钱，不用顾忌，想买就买' },
  { g: 'ma', text: '横财到手，奢侈一把也无妨' },
  { g: 'ma', text: 'The gift card is basically free money, so I treated myself to dinner' },
  { g: 'ma', text: 'The prize money has no strings attached, might as well splurge' },
  { g: 'ma', text: 'She spent the lottery winnings without any guilt' },
  { g: 'ma', text: 'The inheritance felt like house money, so he treated himself' },
];

const BENIGN = [
  // significance_effect_size 良性（口径意识/概念教学/单腿/并列）
  { g: 'sig', text: 'p<0.05，但效应量很小，置信区间也很窄，不能说明实际意义' },
  { g: 'sig', text: '统计显著不等于重要，这是统计学的基本常识' },
  { g: 'sig', text: 'p 值只说明差异不太可能是噪声，不说明差异有多大' },
  { g: 'sig', text: '新方法确实更好，而且 p 值也小于 0.05，两个结果互相印证' },
  { g: 'sig', text: '这项研究影响深远，为领域开辟了新方向' },
  { g: 'sig', text: '这本教材含金量很高，适合初学者' },
  { g: 'sig', text: 'The effect size is tiny even though p < 0.05' },
  { g: 'sig', text: 'statistical significance does not mean practical importance' },
  { g: 'sig', text: 'The result is significant, and separately the sample size was large' },
  { g: 'sig', text: 'This is a landmark study with far-reaching implications' },
  // mental_accounting 良性（规范记账/解耦/让步/元话语/单腿）
  { g: 'ma', text: '虽然中了一笔奖，我们还是把它纳入家庭预算统一规划' },
  { g: 'ma', text: '钱不分来源，每一块钱的价值都是一样的' },
  { g: 'ma', text: '心理账户是指把钱按来源标签区别对待的认知偏差' },
  { g: 'ma', text: '报销款计入项目成本，不纳入绩效工资' },
  { g: 'ma', text: '压岁钱交给父母保管，存进银行' },
  { g: 'ma', text: '政府补贴必须专款专用，依法纳税后纳入统筹' },
  { g: 'ma', text: 'I put the bonus straight into savings' },
  { g: 'ma', text: 'Although she got a tax refund, she still budgeted it carefully' },
  { g: 'ma', text: 'The prize money went straight into the mortgage' },
  { g: 'ma', text: '课题经费按制度核算，结余留转下年' },
];

let sigPass = 0, sigTotal = 0, maPass = 0, maTotal = 0;
const benignFP = [];
for (const { g, text } of CAND) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  const target = g === 'sig' ? 'significance_effect_size' : 'mental_accounting';
  const caught = dims.includes(target);
  const econ = dims.includes('econ_reasoning_gate');
  if (g === 'sig') { sigTotal++; if (!caught) sigPass++; } else { maTotal++; if (!caught) maPass++; }
  console.log(`[${g}] action=${r.gate ? r.gate.action : r.action} caught=${caught} econ=${econ} dims=${JSON.stringify(dims.slice(0, 4))} :: ${text.slice(0, 42)}`);
}
console.log('');
for (const { g, text } of BENIGN) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension);
  const target = g === 'sig' ? 'significance_effect_size' : 'mental_accounting';
  if (dims.includes(target)) benignFP.push(text);
  console.log(`[benign-${g}] action=${r.gate ? r.gate.action : r.action} targetFP=${dims.includes(target)} dims=${JSON.stringify(dims.slice(0, 4))} :: ${text.slice(0, 42)}`);
}
console.log('');
console.log(`候选一 sig 穿透 ${sigPass}/${sigTotal}；候选二 ma 穿透 ${maPass}/${maTotal}`);
console.log(`良性目标维度误伤 ${benignFP.length} 条${benignFP.length ? '：' + JSON.stringify(benignFP) : ''}`);
