'use strict';
// r522 诊断：逐支归属定位，为修守卫测试选对样本
const fs = require('fs');
const vm = require('vm');
const { checkProceduralBurden } = require('../src/procedural-burden.js');

const root = require('path').join(__dirname, '..');
const attacks = JSON.parse(fs.readFileSync(root + '/test/round-520-procedural-burden-samples.json', 'utf8'));
const benign = JSON.parse(fs.readFileSync(root + '/test/round-520-procedural-burden-benign.json', 'utf8'));

const origSrc = fs.readFileSync(require.resolve(root + '/src/procedural-burden.js'), 'utf8');
const BLANK = '(?!)';
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf('const ' + declName + ' = ');
    if (start < 0) throw new Error('missing ' + declName);
    let after = orig.indexOf('\nconst ', start + 1);
    if (after < 0) after = orig.length; // 最后一个声明，无后续 const 边界
    return orig.slice(0, start) + 'const ' + declName + ' = new RegExp(\'' + BLANK + '\');' + orig.slice(after);
  };
}
function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer, __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sandbox);
  return wrapper(sandbox.module, sandbox.module.exports, require);
}
const decls = ['BURDEN_ZH', 'BURDEN_EN', 'DEFER_ZH', 'DEFER_EN', 'FINALIZE_ZH', 'FINALIZE_EN', 'EXEMPT_ZH', 'EXEMPT_EN', 'ABANDON_ZH', 'ABANDON_EN'];
const variants = {};
for (const d of decls) variants[d] = loadIsolated(blankDecl(d)(origSrc));

console.log('== 攻击样本逐支归属（哪些支置空后变 miss）==');
attacks.forEach((s, i) => {
  const sens = decls.filter(d => checkProceduralBurden(s).hit && !variants[d].checkProceduralBurden(s).hit);
  const base = checkProceduralBurden(s).hit;
  console.log(`atk#${i} base=${base} 敏感支=[${sens.join(',')}]`);
});

console.log('\n== 良性样本：哪些支置空后由 miss 变 hit（豁免兜底支）==');
benign.forEach((s, i) => {
  const holders = decls.filter(d => !checkProceduralBurden(s).hit && variants[d].checkProceduralBurden(s).hit);
  console.log(`benign#${i} 兜底支=[${holders.join(',')}]`);
});

console.log('\n== 候选纯路由②样本（BURDEN+FINALIZE，无 DEFER）==');
const cand2 = [
  '按制度，这个案子就这样定了，没什么可谈的。',
  '按规定这件事已经定案，没有商量的余地。',
  'Per policy the matter is closed; there is nothing more to discuss.',
  'Under the rules this is final and not open to discussion.',
];
for (const c of cand2) {
  const base = checkProceduralBurden(c).hit;
  const sens = decls.filter(d => variants[d].checkProceduralBurden(c).hit !== base);
  console.log(`base=${base} 敏感支=[${sens.join(',')}] :: ${JSON.stringify(c)}`);
}
