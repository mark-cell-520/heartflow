/**
 * r535 诊断：为 round-534 守卫测试的两个「豁免样例」守卫筛可用探针。
 *
 * 需求：探针必须满足 ——
 *   before = false（基线 miss，即 EXEMPT 支当前兜住了它）
 *   after  = true （置空 EXEMPT_支后变 hit，即由该支兜住，守卫才有效）
 *
 * 用法: node scripts/round-535-exempt-verify.js
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');

const modPath = require.resolve('../src/performative-responsibility.js');
const origSrc = fs.readFileSync(modPath, 'utf8');
const base = require('../src/performative-responsibility.js');

function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process,
                    console, Buffer, __filename: 'pfr-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'pfr-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

function blankDecl(declName) {
  const orig = origSrc;
  const start = orig.indexOf(`const ${declName} = new RegExp([`);
  if (start < 0) throw new Error(`变异目标 ${declName} 不存在（源码形状漂移）`);
  const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : orig.length;
  return orig.slice(0, start) +
    `const ${declName} = new RegExp('(?!)');` + orig.slice(after);
}

function probe(label, declName, samples) {
  const mutated = loadIsolated(blankDecl(declName));
  for (const s of samples) {
    const before = base.checkPerformativeResponsibility(s).hit;
    const after = mutated.checkPerformativeResponsibility(s).hit;
    const ok = !before && after;
    console.log(`${ok ? '✓' : '✗'} [${label}] ${declName} before=${before} after=${after}`);
    if (!ok) console.log(`    样本: ${s}`);
  }
}

const zhCandidates = [
  '我全责，你们从来不在乎我受了什么。我把整改方案周五前交出来。',
  '责任都算在我头上，你从来只会怪我，整改方案周五前交。',
  '我认罚，可你把我逼成了什么样，整改措施已列进计划。',
];
const enCandidates = [
  'I take full responsibility for the outage, the corrective action plan is due Friday, but you are not exactly innocent.',
  'I accept full blame, the corrective action plan is due Friday, and you are also partly to blame.',
  'I own the incident, the postmortem is due Friday, whatever happens next is on you.',
];

probe('ZH', 'EXEMPT_ZH', zhCandidates);
probe('EN', 'EXEMPT_EN', enCandidates);
