'use strict';
// r353 leg-level debug: which path-h legs are missing for probe sentences.
const { checkImmortalTimeBias, __internals: _getI } = require('/data/home/heartflow/src/immortal-time-bias.js');
const I = _getI();

function legReport(label, text) {
  const hit = checkImmortalTimeBias(text).hit;
  // 手工重算三腿（与主块同口径：腿①五族、腿②五族、腿③三族取最早匹配）
  const t = text;
  const leg1 = [
    ['LEAD_SCREEN', I.LEAD_SCREEN_ZH, I.LEAD_SCREEN_EN],
    ['DETECT_UP_EN', null, I.DETECT_UP_EN],
    ['DETECT_UP_ZH', I.DETECT_UP_ZH, null],
    ['DETECT_UP_EN4', null, I.DETECT_UP_EN4],
    ['DETECT_UP_ZH4', I.DETECT_UP_ZH4, null],
  ];
  const leg2 = [
    ['CASE_SURGE', I.CASE_SURGE_ZH, I.CASE_SURGE_EN],
    ['CASE_SURGE2', I.CASE_SURGE_ZH2, I.CASE_SURGE_EN2],
    ['CASE_SURGE3', I.CASE_SURGE_ZH3, I.CASE_SURGE_EN3],
    ['CASE_SURGE4', null, I.CASE_SURGE_EN4],
    ['CASE_SURGE5', null, I.CASE_SURGE_EN5],
  ];
  const leg3 = [
    ['INCIDENCE', I.INCIDENCE_CLAIM_ZH, I.INCIDENCE_CLAIM_EN],
    ['INCIDENCE2', I.INCIDENCE_CLAIM_ZH2, I.INCIDENCE_CLAIM_EN2],
    ['INCIDENCE3', null, I.INCIDENCE_CLAIM_EN3],
  ];
  const probe = (fams) => fams.filter(([, zh, en]) => (zh && zh.some(re => re.test(t))) || (en && en.some(re => re.test(t)))).map(([n]) => n);
  const l1 = probe(leg1), l2 = probe(leg2), l3 = probe(leg3);
  console.log((hit ? 'HIT ' : 'MISS') + ' | ' + label);
  console.log('   leg1=' + (l1.join(',') || '-') + ' leg2=' + (l2.join(',') || '-') + ' leg3=' + (l3.join(',') || '-'));
}

console.log('── A(EN) leg① adjective+testing sentences ──');
legReport('A1 advanced testing', 'With advanced testing, far more cases are being detected, suggesting the cancer is truly spreading.');
legReport('A2 accurate testing', 'More accurate testing means many more tumors are being picked up, indicating the disease is really on the rise.');
legReport('A3 improved testing', 'Improved testing has identified numerous additional cases, which suggests the disease is truly becoming more common.');
legReport('A4 newer testing methods', 'With newer testing methods, many more lesions are being found, which suggests the disease is really spreading.');
legReport('A5 better testing', 'Better testing identified many more tumors, which suggests the disease is truly on the rise.');
legReport('A6 sensitive testing were surfaced', 'Thanks to sensitive testing, far more cases were surfaced, which indicated the disease was genuinely becoming more widespread.');
legReport('A9 advanced testing picked up', 'Advanced testing picked up far more tumors than before, suggesting the cancer is truly becoming more common.');
legReport('A11 improved testing surfaced', 'Improved testing surfaced numerous hidden cases, indicating the illness was really becoming more widespread.');
console.log('── control (p5 self-anchor blocked pair) ──');
legReport('CTL sensitive imaging + were surfaced', 'Thanks to more sensitive imaging, far more tumors were surfaced, which indicated the disease was genuinely becoming more widespread.');
console.log('── C sentences ──');
legReport('C1 diagnosed case numbers climbed', 'After the screening program expanded, diagnosed case numbers climbed steadily, which suggests the disease is really becoming more common.');
legReport('C2 case numbers have risen', 'With wider screening, case numbers have risen sharply, suggesting the cancer is truly on the rise.');
legReport('C3 reported case numbers tripled', 'Thanks to mass testing, reported case numbers tripled last year, indicating the disease is genuinely spreading.');
legReport('C4 coverage expanded (blocked)', 'As screening coverage expanded, many more tumors were found, which suggests the cancer is truly becoming more common.');
legReport('C5 testing intensity increased', 'With testing intensity increased, far more cases are being identified, suggesting the disease is really on the rise.');
legReport('C6 coverage was extended', 'Once screening coverage was extended to all districts, numerous additional cases surfaced, which showed the disease was truly becoming more widespread.');
console.log('── AZ sentence ──');
legReport('AZ3 更先进的检测手段浮出大量潜伏病例', '更先进的检测手段浮出大量潜伏病例，表明疾病真的在蔓延。');
