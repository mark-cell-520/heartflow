// round-373 第 262 维度 tax_incidence（税负转嫁谬误）负例注入测试
// r373：三腿判据 + 两组豁免 + 否定守卫，逐常量验证承重
// 攻击样本必须命中（hit=true），良性样本必须不命中（hit=false）。
'use strict';

const assert = require('node:assert/strict');
const { detectTaxIncidence } = require('../src/tax-incidence.js');

let passed = 0;
let failed = 0;

function checkAttack(text, label) {
  const r = detectTaxIncidence(text);
  if (r.hit) { passed++; }
  else { failed++; console.error('FAIL attack [' + label + ']: ' + text.slice(0, 60)); }
}

function checkBenign(text, label) {
  const r = detectTaxIncidence(text);
  if (!r.hit) { passed++; }
  else { failed++; console.error('FAIL benign [' + label + ']: ' + text.slice(0, 60)); }
}

// ---------- 攻击族：税种 × 法定归属 × 免转嫁断言 三腿共现（ZH）----------
checkAttack('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。', 'zh-property-tax-company');
checkAttack('向进口商征收关税，税由进口商缴纳，进口商品的价格不会因此上涨，消费者完全不受影响。', 'zh-tariff-importer');
checkAttack('法律规定社保费由雇主缴纳，所以用工成本全部由企业消化，员工工资不会下降。', 'zh-social-security-employer');
checkAttack('对房东征收房产税，税负落在房东身上，房东无法把税负转嫁给租客，租金维持不变。', 'zh-property-tax-landlord');
checkAttack('国家向卖方征收增值税，税由卖方承担，买方支付的价格不会变化，买单的是企业。', 'zh-vat-seller');
checkAttack('企业所得税由公司缴纳，税负全部由公司股东承担，不会影响到员工和消费者。', 'zh-corporate-tax-shareholders');
checkAttack('对汽车厂商征收车船税，税款由厂商缴纳，整车价格因此维持不变，消费者买单的只是自己那一份。', 'zh-vehicle-tax-maker');
checkAttack('政府向出口商征收出口关税，税负全部由出口商负担，不会影响到海外买家的采购价格。', 'zh-export-duty-exporter');

// ---------- 攻击族：EN 三腿共现 ----------
checkAttack('The tax is imposed on employers, so the employer bears the entire cost and wages will not change.', 'en-tax-employers');
checkAttack('A tariff levied on importers means the price consumers pay will not rise, buyers are unaffected.', 'en-tariff-importers');
checkAttack('Legally the landlord must pay the property tax, therefore rent will not increase and tenants bear nothing.', 'en-property-tax-landlord');
checkAttack('The corporate tax is paid by the company alone, the burden is borne entirely by shareholders, employees will not be affected.', 'en-corporate-tax-company');
checkAttack('The payroll tax is imposed on the employer, wages are unaffected by the levy.', 'en-payroll-tax-employer');
checkAttack('Under the new tariff, importers remit the duty at customs, so retail prices will not shift.', 'en-tariff-retail');

// ---------- 良性：概念教学 / 正确限定 / 制度描述 / 对冲 ----------
checkBenign('税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。', 'zh-correct-elasticity');
checkBenign('向房东征收房产税，房东可能通过涨房租把税负转嫁给租客。', 'zh-correct-shifting');
checkBenign('税负归宿分析的是法定归宿与经济归宿的差异，这是公共经济学的核心概念。', 'zh-concept-incidence');
checkBenign('房产税法律规定由房东缴纳，税率为 1.2%，这是制度描述。', 'zh-statute-description');
checkBenign('税负转嫁谬误就是把法定纳税人直接当成实际负税人，是常见的分析陷阱。', 'zh-concept-fallacy');
checkBenign('税收归宿要看供需弹性，法律规定的纳税人不一定是实际负税人。', 'zh-correct-elasticity-2');
checkBenign('对企业征收房产税，房东可能通过涨房租把税负转嫁给租客，弹性决定了转嫁比例。', 'zh-correct-shifting-2');
checkBenign('今年社保费率维持不变，缴费基数上下限与去年持平。', 'zh-bare-rate');
checkBenign('The legal incidence of a tax does not determine its economic incidence; it depends on elasticities.', 'en-correct-elasticity');
checkBenign('Tax incidence depends on the relative elasticity of supply and demand, not on who remits the tax.', 'en-correct-elasticity-2');
checkBenign('The distinction between statutory and economic incidence is a textbook principle of public economics.', 'en-concept-incidence');
checkBenign('Under the statute the landlord pays the property tax, at a rate of 1.2 percent.', 'en-statute-description');
checkBenign('Taxes on sellers may be shifted to buyers through higher prices; incidence is an empirical question.', 'en-correct-shifting');
checkBenign('A tariff is a tax on imported goods; who ultimately bears the burden depends on elasticities.', 'en-correct-tariff');

// ---------- 良性：腿①缺失（无税种在场，不得判）----------
checkBenign('成本全部由企业消化，价格不会因此上涨。', 'zh-no-tax-leg');
checkBenign('The entire cost is absorbed by the company, prices will not rise.', 'en-no-tax-leg');

// ---------- 良性：腿②缺失（无归属断言，不得判）----------
checkBenign('房产税税率是 1.2%，税负重，这不会改变。', 'zh-no-statutory-leg');
checkBenign('The property tax rate is 1.2 percent; the burden is heavy, which is unlikely to change.', 'en-no-statutory-leg');

// ---------- 良性：腿③缺失（无免转嫁断言，不得判）----------
checkBenign('房产税由房东缴纳，租客也要分摊一部分租金。', 'zh-no-notransfer-leg');
checkBenign('The landlord pays the property tax, and tenants share part of the rent.', 'en-no-notransfer-leg');

// ---------- 负例注入：逐常量验证三腿/豁免承重 ----------
const I = require('../src/tax-incidence.js').__internals();
const ZH_TAX = I.TAX_ZH_GROUPS;
const EN_TAX = I.TAX_EN_GROUPS;
const ZH_STAT = I.STATUTORY_ZH_GROUPS;
const EN_STAT = I.STATUTORY_EN_GROUPS;
const ZH_NO = I.NOTRANSFER_ZH_GROUPS;
const EN_NO = I.NOTRANSFER_EN_GROUPS;

// 三腿常量组必须同时非空（缺一组 = 判据不完整）
assert.ok(Array.isArray(ZH_TAX) && ZH_TAX.length > 0, 'ZH_TAX non-empty');
assert.ok(Array.isArray(EN_TAX) && EN_TAX.length > 0, 'EN_TAX non-empty');
assert.ok(Array.isArray(ZH_STAT) && ZH_STAT.length > 0, 'ZH_STAT non-empty');
assert.ok(Array.isArray(EN_STAT) && EN_STAT.length > 0, 'EN_STAT non-empty');
assert.ok(Array.isArray(ZH_NO) && ZH_NO.length > 0, 'ZH_NO non-empty');
assert.ok(Array.isArray(EN_NO) && EN_NO.length > 0, 'EN_NO non-empty');
passed += 6;

// 腿①注入空数组（删条）→ 攻击样本必须失去命中（证明腿①承重）
const noTax = detectTaxIncidence('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。', { TAX_ZH_A: [], TAX_ZH_B: [] });
assert.equal(noTax.hit, false, 'injecting empty TAX_ZH_A/TAX_ZH_B must remove ZH hit (leg-1 load-bearing)');
passed++;

// 腿②注入永假正则（替换）→ 攻击样本必须失去命中（证明腿②承重）
const noStat = detectTaxIncidence('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。', { STATUTORY_ZH: /(?!x)x/ });
assert.equal(noStat.hit, false, 'injecting never-match STATUTORY_ZH must remove ZH hit (leg-2 load-bearing)');
passed++;

// 腿③注入空数组（删条）→ 攻击样本必须失去命中（证明腿③承重）
const noNo = detectTaxIncidence('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。', { NOTRANSFER_ZH: [] });
assert.equal(noNo.hit, false, 'injecting empty NOTRANSFER_ZH must remove ZH hit (leg-3 load-bearing)');
passed++;

// EN 三腿同样逐腿验证承重
const noTaxEn = detectTaxIncidence('The tax is imposed on employers, so the employer bears the entire cost and wages will not change.', { TAX_EN_A: [], TAX_EN_B: [] });
assert.equal(noTaxEn.hit, false, 'injecting empty TAX_EN_A/TAX_EN_B must remove EN hit (leg-1 load-bearing)');
passed++;
const noStatEn = detectTaxIncidence('The tax is imposed on employers, so the employer bears the entire cost and wages will not change.', { STATUTORY_EN: /(?!x)x/ });
assert.equal(noStatEn.hit, false, 'injecting never-match STATUTORY_EN must remove EN hit (leg-2 load-bearing)');
passed++;
const noNoEn = detectTaxIncidence('The tax is imposed on employers, so the employer bears the entire cost and wages will not change.', { NOTRANSFER_EN: [] });
assert.equal(noNoEn.hit, false, 'injecting empty NOTRANSFER_EN must remove EN hit (leg-3 load-bearing)');
passed++;

// 豁免 A 承重：概念教学良性句注入空 CONCEPT_ZH 后应变成命中（证明豁免承重）
// 用腿齐的概念教学句——「常见陷阱」框架词与三腿共现，无豁免时会被判。
const conceptLoses = detectTaxIncidence('税负转嫁谬误是常见的分析陷阱：对房东征收房产税，税负落在房东身上，租金维持不变。', { CONCEPT_ZH: [], CONCEPT_EN: [] });
assert.equal(conceptLoses.hit, true, 'removing CONCEPT_ZH exemption must make the concept-teaching benign hit (exemption load-bearing)');
passed++;
// 反向：豁免在场时同句必须不命中（证明豁免真的在兜）
const conceptGuarded = detectTaxIncidence('税负转嫁谬误是常见的分析陷阱：对房东征收房产税，税负落在房东身上，租金维持不变。');
assert.equal(conceptGuarded.hit, false, 'concept-teaching sentence with full three legs must be exempted (CONCEPT_ZH guard works)');
passed++;

// 豁免 B 承重：正确限定良性句注入空 CORRECT_ZH 后应变成命中（证明豁免承重）
// 上一轮交接时该样本三腿不齐（「取决于供需弹性」本身不含税种×归属×免转嫁），
// 注入后仍不命中 → 假失败。改用腿齐句：三腿共现 + CORRECT 限定，基线由
// CORRECT_ZH 豁免兜住；注入删条后必须翻红。
const correctCaveat = '房产税由房东承担，不会转嫁给租客，租金维持不变，税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。';
const correctLoses = detectTaxIncidence(correctCaveat, { CORRECT_ZH: [] });
assert.equal(correctLoses.hit, true, 'removing CORRECT_ZH exemption must make the correct-caveat benign hit (exemption load-bearing)');
passed++;

// 否定守卫承重：腿②加否定后不再命中（「并非由企业承担」是纠正形）
checkBenign('对企业征收房产税，税收并非由企业承担，而是最终由消费者负担，房价不会因此下跌。', 'zh-neg-guard-statutory');

// ---------- gate 端到端：接线后 gate.action 非 pass ----------
const { gate } = require('../src/gate.js');
const g1 = gate('对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。');
assert.notEqual(g1.gate.action, 'pass', 'gate must not pass tax_incidence attack');
assert.ok(g1.findings.some(f => f.dimension === 'econ_reasoning_gate' || f.dimension === 'tax_incidence'), 'findings must contain econ gate hit');
passed += 2;

const g2 = gate('税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。');
assert.equal(g2.findings.some(f => f.dimension === 'econ_reasoning_gate'), false, 'correct-caveat benign must not be flagged by econ gate');
passed++;

const g3 = gate('房产税法律规定由房东缴纳，税率为 1.2%，这是制度描述。');
assert.equal(g3.findings.some(f => f.dimension === 'econ_reasoning_gate'), false, 'statute description must not be flagged by econ gate');
passed++;

// ---------- 边界相邻维度不得被误判 ----------
const g4 = gate('限价政策压着房租，市场供给因此萎缩，黑市替代品出现');
assert.equal(g4.findings.some(f => f.dimension === 'econ_reasoning_gate' && /tax_incidence/.test(JSON.stringify(g4.findings))), false, 'price-control adjacent must not be flagged as tax_incidence');
passed++;

console.log('round-373 tax_incidence: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
