// probe-r373-baseline.js v2 — 副本隔离法：把 src/ 复制到 scratch 沙盒，
// 在副本里摘除 tax_incidence 接线与模块，测 pristine 基线。
// 绝不修改真实 src/（v1 曾把模块覆盖成 stub 造成事故——本次为先例后不再犯）。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = '/root/hermes1/skills/ai/mark-heartflow-skill';
const SB = '/root/hermes1/cache/scratch/sandbox-r373-baseline';

// 1. 建沙盒：复制 src/（node_modules 无——零依赖仓库）
execSync(`rm -rf ${SB} && mkdir -p ${SB} && cp -r ${REPO}/src ${SB}/src && cp ${REPO}/VERSION ${SB}/VERSION`);

// 2. 在副本里摘除 tax_incidence 接线行
const gatePath = path.join(SB, 'src/econ-reasoning-gate.js');
let gate = fs.readFileSync(gatePath, 'utf8');
const lineRe = /\n[ \t]*\{ key: 'tax_incidence'[^\n]*/;
if (!lineRe.test(gate)) { console.log('FATAL: wiring line not found in sandbox copy'); process.exit(1); }
fs.writeFileSync(gatePath, gate.replace(lineRe, ''), 'utf8');

// 3. 把副本的模块替换成 stub（只动副本）
const taxPath = path.join(SB, 'src/tax-incidence.js');
fs.writeFileSync(taxPath, 'module.exports = { detectTaxIncidence: () => null };', 'utf8');

// 4. 验证副本里接线已摘除、真实文件未被碰
const realGate = fs.readFileSync(path.join(REPO, 'src/econ-reasoning-gate.js'), 'utf8');
const realTax = fs.readFileSync(path.join(REPO, 'src/tax-incidence.js'), 'utf8');
// 4. 验证副本里接线已摘除、真实文件未被碰（读替换后的字符串）
// 注意：阈值不用字节数（并发 tick 可能在增强模块），改用结构完整校验。
function realIntact() {
  try {
    const t = fs.readFileSync(path.join(REPO, 'src/tax-incidence.js'), 'utf8');
    return t.length > 15000 && t.indexOf('detectTaxIncidence') >= 0 && t.indexOf('module.exports') >= 0
      && t.indexOf('CONCEPT_ZH') >= 0 && t.indexOf('CORRECT_ZH') >= 0;
  } catch (e) { return false; }
}
console.log('sandbox wiring removed:', !lineRe.test(fs.readFileSync(gatePath, 'utf8')));
console.log('REAL gate untouched:', lineRe.test(realGate));
console.log('REAL tax intact:', realIntact());

// 5. 从沙盒跑 checkOutput
const { checkOutput } = require(path.join(SB, 'src/gate.js'));

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
ATK.forEach((t, i) => {
  const r = checkOutput(t);
  if (r.gate.action === 'pass') atkPass++;
  console.log('A' + (i + 1) + '. ' + r.gate.action.padEnd(7) + ' | ' + (r.findings.map(f => f.dimension).join(',') || '-'));
});
BEN.forEach((t, i) => {
  const r = checkOutput(t);
  if (r.gate.action !== 'pass') benNonPass++;
  console.log('B' + (i + 1) + '. ' + r.gate.action.padEnd(7) + ' | ' + (r.findings.map(f => f.dimension).join(',') || '-'));
});
console.log('=== BASELINE attack pass-through:', atkPass + '/' + ATK.length, '| benign non-pass:', benNonPass + '/' + BEN.length, '===');
// 6. 收尾：真实文件再验一次
console.log('FINAL REAL gate untouched:', lineRe.test(fs.readFileSync(path.join(REPO, 'src/econ-reasoning-gate.js'), 'utf8')));
console.log('FINAL REAL tax intact:', realIntact());
