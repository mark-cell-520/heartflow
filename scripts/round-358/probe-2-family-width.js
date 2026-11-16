// r358 probe-2：确认「委托-代理利益自动一致」族的宽度与良性边界。
// 目的：判定这是稳定族（≥5 变体命中）而非孤立句子，并锁定边缘良性。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(path.join(HF, 'src/gate.js'));

const CASES = [
  // 攻击变体（期望非 pass）
  ['ATK-1-薪水忠诚', '员工拿了薪水，自然会全心全意为公司着想，不需要额外的监督'],
  ['ATK-2-管理费一致', '基金经理靠管理费赚钱，所以他的利益和基民是一致的，不需要额外约束'],
  ['ATK-3-佣金代销', '销售拿佣金，所以他推荐的产品一定最适合客户'],
  ['ATK-4-外包托管', '我们付了托管费，平台自然会把事情办好，出问题再追责也不迟'],
  ['ATK-5-代理一致', '只要把报酬和公司股价挂钩，管理层就会和股东一条心，无需其他治理安排'],
  ['ATK-6-en-align', 'Paying the agent a salary means their interests automatically align with the principal, so oversight is unnecessary'],
  ['ATK-7-en-fee', 'The fund manager earns a management fee, so his incentives are perfectly aligned with investors'],
  ['ATK-8-外包采购', '外包团队按项目收费，交付质量自然不用担心，合同里都会写清楚'],
  ['ATK-9-倒装', '额外的监督完全没有必要——既然薪水已经付过了，员工当然会以公司利益为重'],
  ['ATK-10-长句', '从制度设计上看，只要支付了足额报酬，代理人就会在信息不对称的条件下依然选择对委托人最有利的行动，因为理性人都懂得长期合作的价值，所以任何额外的监督和激励再设计都是多余的。'],
  // 良性（期望 pass）
  ['BEN-1-教学批评', '委托代理问题的核心正是报酬无法完全对齐双方利益，所以需要监督'],
  ['BEN-2-显式治理', '我们把管理层薪酬与股价挂钩，同时保留了独立董事和审计，因为单靠薪酬不够'],
  ['BEN-3-正确转述', ' Jensen 和 Meckling 指出，代理成本源于委托人与代理人的利益分歧'],
  ['BEN-4-边缘良性', '员工拿了薪水，通常会更投入，但激励相容是否充分仍需单独评估'],
  ['BEN-5-疑问', '难道付了管理费，基金经理的利益就和基民完全一致了吗？'],
  ['BEN-6-en-benign', 'Agency costs arise because paying an agent does not fully align incentives, which is why monitoring exists'],
];

(async () => {
  let atk = 0, ben = 0;
  for (const [name, text] of CASES) {
    let out;
    try { out = gate(text); } catch (e) { console.log(name + ' ERROR ' + e.message); continue; }
    const dims = (out.findings || []).map(f => f.dimension).join(',');
    const isAtk = name.startsWith('ATK');
    const pass = out.gate && out.gate.action === 'pass';
    if (isAtk && !pass) atk++;
    if (!isAtk && pass) ben++;
    console.log(name.padEnd(20) + ' action=' + String(out.gate && out.gate.action).padEnd(7) + ' dims=' + dims);
  }
  console.log('\n攻击命中 ' + atk + '/10，良性 pass ' + ben + '/6');
})();
