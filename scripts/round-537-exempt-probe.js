/**
 * 第 537 轮诊断：为豁免守卫筛「置空目标 EXEMPT 支后由 miss 变 hit」的双语探针。
 * 要求：①基线 miss；②置空目标支后 hit；③置空另一支后仍 miss（只由目标支兜住）。
 * 用法: node scripts/round-537-exempt-probe.js
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const I = require('../src/suffering-contest.js').__internals();

const zhCands = [
  '两边都难，不等于你的那部分可以抵消。',
  '压力不能互相抵消，两边分开处理。',
  '我压力很大，但不影响你的诉求独立核算。',
  '两边都难，我们分别复盘、逐条对齐。',
  '双方都不容易，你的诉求另行核算。',
  '两边都难，你的诉求独立成立。',
  '我们的情况不一样，但需逐项处理。',
  '两边都苦，压力不可对冲。',
];
const enCands = [
  'Both sides are struggling, so we track every claim separately.',
  'We compare notes without ranking whose pain is bigger.',
  'Your grievance is real and stands on its own.',
  'Your claim is real and stands separately.',
  'I feel awful, and separately the restitution plan is attached.',
  'Both sides are under pressure, so we track every claim separately.',
  'Situations differ, and your claim still stands.',
  'Guilt is not a substitute for the restitution plan.',
];

const modPath = require.resolve('../src/suffering-contest.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

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

for (const [lang, list, target] of [['zh', zhCands, 'EXEMPT_ZH'], ['en', enCands, 'EXEMPT_EN']]) {
  const other = lang === 'zh' ? 'EXEMPT_EN' : 'EXEMPT_ZH';
  console.log(`== ${lang} / target=${target} ==`);
  list.forEach((s, i) => {
    const base = require('../src/suffering-contest.js').checkSufferingContest(s).hit;
    const t = run(target, s);
    const o = run(other, s);
    console.log(`  #${i} base=${base} blankTarget=${t} blankOther=${o} ${(!base && t && o) ? '✅可用' : ''}`);
  });
}
console.log('DONE');
