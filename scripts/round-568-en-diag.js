// r568 英文支级探针：逐支测试候选支对英文攻击的命中情况。
// 纪律：样本从 test 文件读出，不进命令行；只输出布尔索引。
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
const enAtk = S.attacks.filter(s => !/[\u4e00-\u9fff]/.test(s));

const B = '\\b';
const cands = {
  'existing:full': cap.CAPITAL_EN.source,
  'existing:at-least-not-worse': B + '(?:at\\s+least|after\\s+all)\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do|do\\s+anything)\\s*(?:worse|as\\s+bad|so\\s+bad)' + B,
  'existing:record-pos': B + '(?:my|our)\\s+(?:record|track\\s+record|history|past|reputation)\\s+(?:is|has\\s+been|remains|stays)?\\s*(?:clean|spotless|unblemished|blameless|impeccable|pristine)' + B,
  'new:have-a-clean': B + '(?:i|we)\\s+(?:have|had)\\s+(?:a|an)\\s*(?:clean|spotless|unblemished|blameless|impeccable|pristine)\\s+(?:record|track\\s+record|history|reputation|image|name)' + B,
  'new:after-all-my': B + 'after\\s+(?:all|everything)\\s+(?:my|our)\\s+(?:volunteer|volunteering|charity|charitable|community|church)\\s+(?:work|service|efforts|contributions|donations|giving|hours)' + B,
  'cand:did-not-do-worse': B + 'i\\s+did\\s+not\\s+do\\s+worse' + B,
  'cand:after-all-volunteer': B + 'after\\s+all\\s+my' + B,
};

console.log('## CAPITAL_EN 整体命中（逐样本，共 ' + enAtk.length + ' 条）');
enAtk.forEach((s, i) => {
  console.log(`  #${i} capitalEN=${cap.CAPITAL_EN.test(s) ? 1 : 0}`);
});

console.log('## 候选支命中索引矩阵');
for (const [name, src] of Object.entries(cands)) {
  let re;
  try { re = new RegExp(src, 'i'); } catch (e) { console.log(`  ${name}: INVALID ${e.message}`); continue; }
  const hits = [];
  enAtk.forEach((s, i) => { if (re.test(s)) hits.push(i); });
  console.log(`  ${name}: [${hits.join(',')}]`);
}
