'use strict';
// r522 诊断：逐支归属定位（用临时文件 + 独立 require，规避 vm 沙箱 strict 坑）
const fs = require('fs');
const path = require('path');
const { checkProceduralBurden } = require('../src/procedural-burden.js');

const root = path.join(__dirname, '..');
const attacks = JSON.parse(fs.readFileSync(root + '/test/round-520-procedural-burden-samples.json', 'utf8'));
const benign = JSON.parse(fs.readFileSync(root + '/test/round-520-procedural-burden-benign.json', 'utf8'));

const origSrc = fs.readFileSync(path.join(root, 'src/procedural-burden.js'), 'utf8');
const BLANK = '(?!)';
function blankDecl(declName, orig) {
  const start = orig.indexOf('const ' + declName + ' = ');
  if (start < 0) throw new Error('missing ' + declName);
  // 边界：下一条 const/let/function/module.exports 顶格声明之前。
  // 注意不能用"找不到就 slice 到 length"——末位声明后面还有函数体与
  // module.exports，一刀切到底会把它们全删掉（r522 实测坑）。
  const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : orig.length;
  return orig.slice(0, start) + 'const ' + declName + ' = new RegExp(\'' + BLANK + '\');' + orig.slice(after);
}
const tmpDir = fs.mkdtempSync('/tmp/r522-mut-');
const decls = ['BURDEN_ZH', 'BURDEN_EN', 'DEFER_ZH', 'DEFER_EN', 'FINALIZE_ZH', 'FINALIZE_EN', 'EXEMPT_ZH', 'EXEMPT_EN', 'ABANDON_ZH', 'ABANDON_EN'];
const variants = {};
for (const d of decls) {
  const f = path.join(tmpDir, d + '.js');
  fs.writeFileSync(f, blankDecl(d, origSrc));
  variants[d] = require(f).checkProceduralBurden;
}

console.log('== 攻击样本逐支归属（哪些支置空后变 miss）==');
attacks.forEach((s, i) => {
  const sens = decls.filter(d => checkProceduralBurden(s).hit && !variants[d](s).hit);
  console.log(`atk#${i} 敏感支=[${sens.join(',')}]`);
});

console.log('\n== 良性样本：哪些支置空后由 miss 变 hit（豁免兜底支）==');
benign.forEach((s, i) => {
  const holders = decls.filter(d => !checkProceduralBurden(s).hit && variants[d](s).hit);
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
  const sens = decls.filter(d => variants[d](c).hit !== checkProceduralBurden(c).hit);
  console.log(`base=${checkProceduralBurden(c).hit} 敏感支=[${sens.join(',')}]`);
}
