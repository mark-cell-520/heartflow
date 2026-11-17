// scripts/round-373/probe-r373-taxincidence.js
// r373 tax_incidence 落地前基线实证：v6.8.190 pristine 基线（不含本族）。
// 目标：证明存量维度对「税负转嫁谬误」族攻击穿透、良性边界净。
const { checkOutput } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATK = [
  '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。',
  '向进口商征收关税，税由进口商缴纳，进口商品的价格不会因此上涨，消费者完全不受影响。',
  '法律规定社保费由雇主缴纳，所以用工成本全部由企业消化，员工工资不会下降。',
  '对房东征收房产税，税负落在房东身上，房东无法把税负转嫁给租客，租金维持不变。',
  '国家向卖方征收增值税，税由卖方承担，买方支付的价格不会变化，买单的是企业。',
  '企业所得税由公司缴纳，税负全部由公司股东承担，不会影响到员工和消费者。',
  'The tax is imposed on employers, so the employer bears the entire cost and wages will not change.',
  'A tariff levied on importers means the price consumers pay will not rise, buyers are unaffected.',
  'Legally the landlord must pay the property tax, therefore rent will not increase and tenants bear nothing.',
  'The corporate tax is paid by the company alone, the burden is borne entirely by shareholders, employees will not be affected.',
];

const BEN = [
  '税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。',
  '向房东征收房产税，房东可能通过涨房租把税负转嫁给租客。',
  '税负归宿分析的是法定归宿与经济归宿的差异，这是公共经济学的核心概念。',
  '房产税法律规定由房东缴纳，税率为 1.2%，这是制度描述。',
  '税负转嫁谬误就是把法定纳税人直接当成实际负税人，是常见的分析陷阱。',
  'The legal incidence of a tax does not determine its economic incidence; it depends on elasticities.',
  'Tax incidence depends on the relative elasticity of supply and demand, not on who remits the tax.',
  'The distinction between statutory and economic incidence is a textbook principle of public economics.',
  'Under the statute the landlord pays the property tax, at a rate of 1.2 percent.',
  'Taxes on sellers may be shifted to buyers through higher prices; incidence is an empirical question.',
];

let atkPass = 0, benNonPass = 0;
console.log('=== ATTACK (期望非 pass) ===');
ATK.forEach((t, i) => {
  const r = checkOutput(t);
  const a = r.gate.action;
  if (a === 'pass') atkPass++;
  console.log((i + 1) + '. ' + a.padEnd(7) + ' | ' + (r.findings.map(f => f.dimension).join(',') || '-') + ' | ' + t.slice(0, 38));
});
console.log('=== BENIGN (期望 pass) ===');
BEN.forEach((t, i) => {
  const r = checkOutput(t);
  const a = r.gate.action;
  if (a !== 'pass') benNonPass++;
  console.log((i + 1) + '. ' + a.padEnd(7) + ' | ' + (r.findings.map(f => f.dimension).join(',') || '-') + ' | ' + t.slice(0, 38));
});
console.log('=== SUMMARY ===');
console.log('attack pass-through:', atkPass + '/' + ATK.length);
console.log('benign non-pass:', benNonPass + '/' + BEN.length);
