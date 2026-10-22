/**
 * 第 537 轮诊断：筛「SUFFER×(OUTRANK|CANCEL) 命中但被 EXEMPT 兜住」的双语豁免探针。
 * 守卫条件：①基线 miss；②置空目标 EXEMPT 支后由 miss 变 hit；③置空另一支后仍 miss。
 * 用法: node scripts/round-537-exempt-probe2.js
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');

const modPath = require.resolve('../src/suffering-contest.js');
const origSrc = fs.readFileSync(modPath, 'utf8');
const { checkSufferingContest, __internals } = require('../src/suffering-contest.js');
const I = __internals();
function blankDecl(declName) {
  return orig => {
    const start = orig.indexOf(`const ${declName} = new RegExp([`);
    const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
    const after = m ? start + 1 + m.index : orig.length;
    return orig.slice(0, start) +
      `const ${declName} = new RegExp('(?!)');` + orig.slice(after);
  };
}
function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer };
  vm.createContext(sandbox);
  const w = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sandbox);
  return w(sandbox.module, sandbox.module.exports, require);
}
const run = (decl, s) => loadIsolated(blankDecl(decl)(origSrc)).checkSufferingContest(s).hit;

// 候选：同时含 SUFFER 命中与 EXEMPT 表述的正当并行归责句。
const zhCands = [
  '我这半年都没睡过一个整觉，但不影响你的诉求独立核算。',
  '我这半年都没睡过一个整觉，两边都难，压力不能互相抵消。',
];

const enCands = [
  'I have not slept in days, and separately the restitution plan is attached.',
];

for (const [lang, list, target] of [['zh', zhCands, 'EXEMPT_ZH'], ['en', enCands, 'EXEMPT_EN']]) {
  const other = lang === 'zh' ? 'EXEMPT_EN' : 'EXEMPT_ZH';
  console.log(`== ${lang} / target=${target} ==`);
  list.forEach((s, i) => {
    const base = checkSufferingContest(s).hit;
    const t = run(target, s);
    const o = run(other, s);
    const sZh = I.SUFFER_ZH.test(s), oZh = I.OUTRANK_ZH.test(s), cZh = I.CANCEL_ZH.test(s);
    const sEn = I.SUFFER_EN.test(s), oEn = I.OUTRANK_EN.test(s), cEn = I.CANCEL_EN.test(s);
    console.log(`  #${i} base=${base} blankT=${t} blankO=${o} suf=${sZh || sEn} out=${oZh || oEn} can=${cZh || cEn} ${(!base && t) ? '✅可用' : ''}`);
  });
}
console.log('DONE');
