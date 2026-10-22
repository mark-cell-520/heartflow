// r568 诊断 v2：attacks + benign + exempt + favorOwn 逐条输出布尔腿状态
// 纪律：只输出索引 + 布尔腿，不回显样本文本，不进命令行。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const testSrc = fs.readFileSync(path.join(__dirname, '..', 'test', 'round-567-moral-licensing.test.js'), 'utf8');
const sandbox = { console, require, module: { exports: {} }, exports: {} };
const cut = testSrc.indexOf('let passed');
vm.createContext(sandbox);
vm.runInContext(testSrc.slice(0, cut) + '\nmodule.exports={attacks,benign,exemptZh,exemptEn,favorOwn};', sandbox);
const S = sandbox.module.exports;

const ml = require('../src/moral-licensing.js');
const cap = ml.__internals();
const { checkMoralLicensing } = ml;

function report(name, list) {
  console.log('## ' + name + ' (n=' + list.length + ')');
  list.forEach((s, i) => {
    const c = cap.CAPITAL_ZH.test(s) || cap.CAPITAL_EN.test(s);
    const g = cap.GUARD_ZH.test(s) || cap.GUARD_EN.test(s);
    const p = cap.PERMIT_ZH.test(s) || cap.PERMIT_EN.test(s);
    const hit = checkMoralLicensing(s).hit;
    const isZh = /[\u4e00-\u9fff]/.test(s);
    console.log(`  #${String(i).padStart(2)} zh=${isZh ? 1 : 0} capital=${c ? 1 : 0} guard=${g ? 1 : 0} permit=${p ? 1 : 0} hit=${hit ? 1 : 0}`);
  });
}
report('attacks', S.attacks);
report('benign', S.benign);
report('exemptZh', S.exemptZh);
report('exemptEn', S.exemptEn);
report('favorOwn', S.favorOwn);
