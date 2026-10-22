/**
 * 第 537 轮诊断：筛「SUFFER ×(OUTRANK|CANCEL) 命中但被 EXEMPT 兜住」的双语豁免探针。
 * 守卫三条件：①基线 miss；②置空目标 EXEMPT 支后由 miss 变 hit；③置空另一支后仍 miss。
 * 用法: node scripts/round-537-exempt-probe3.js
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

// 候选：SUFFER × OUTRANK/CANCEL 都命中，但同句带"独立计量/不抵消"的正当结语。
const zhCands = [
  '我这半年都没睡过一个整觉，你这点委屈也算苦，但它仍需独立计量。',
  '我这半年都没睡过一个整觉，你也别再提了，这不等于伤害可以互相抵消。',
  '我这半年都没睡过一个整觉，你也别再提了，两边分别复盘。',
];

const enCands = [
  'I have not slept in days, stop complaining, and your claim still stands.',
  'I have not slept in days, get over it, but your claim still stands on its own.',
];

for (const [lang, list, target] of [['zh', zhCands, 'EXEMPT_ZH'], ['en', enCands, 'EXEMPT_EN']]) {
  const other = lang === 'zh' ? 'EXEMPT_EN' : 'EXEMPT_ZH';
  console.log(`== ${lang} / target=${target} ==`);
  list.forEach((s, i) => {
    const base = checkSufferingContest(s).hit;
    const t = run(target, s);
    const o = run(other, s);
    const suf = I.SUFFER_ZH.test(s) || I.SUFFER_EN.test(s);
    const out = I.OUTRANK_ZH.test(s) || I.OUTRANK_EN.test(s);
    const can = I.CANCEL_ZH.test(s) || I.CANCEL_EN.test(s);
    console.log(`  #${i} base=${base} blankT=${t} blankO=${o} suf=${suf} out=${out} can=${can} ${(!base && t) ? '✅可用' : ''}`);
  });
}
console.log('DONE');
