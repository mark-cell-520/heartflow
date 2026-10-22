/**
 * r535 诊断3：EN 探针在 blankDecl 置空后的具实表现。
 * 打印空白后模块内部各支 test 结果 + hit。
 * 用法: node scripts/round-535-probe-en-final.js
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const origSrc = fs.readFileSync(require.resolve('../src/performative-responsibility.js'), 'utf8');
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
function blankDecl(src) {
  const start = src.indexOf('const EXEMPT_EN = new RegExp([');
  if (start < 0) throw new Error('EXEMPT_EN 不存在');
  const m = src.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = start + 1 + m.index;
  return src.slice(0, start) + `const EXEMPT_EN = new RegExp('(?!)');` + src.slice(after);
}

const probe = 'I take full responsibility for the outage, not because you are exactly innocent, and the corrective action plan is due Friday.';
const muted = loadIsolated(blankDecl(origSrc));
const int = muted.__internals();
console.log('baseline hit =', base.checkPerformativeResponsibility(probe).hit);
console.log('muted  hit  =', muted.checkPerformativeResponsibility(probe).hit);
console.log('muted 各支: OWN_EN=' + int.OWN_EN.test(probe) +
            ' INVERT_EN=' + int.INVERT_EN.test(probe) +
            ' EXEMPT_EN=' + int.EXEMPT_EN.test(probe) +
            ' EXEMPT_ZH=' + int.EXEMPT_ZH.test(probe));
console.log('muted EXEMPT_EN source(前60):', JSON.stringify(int.EXEMPT_EN.source.slice(0, 60)));

// 也试：只置空 EXEMPT_EN 但保留 EXEMPT_ZH 时（= 测试实际行为）
// 与同时置空两者对照
const bothBlank = blankDecl(origSrc).replace("const EXEMPT_ZH = new RegExp([", "const EXEMPT_ZH = new RegExp('(?!)'");
console.log('both-blank result hit =', loadIsolated(bothBlank).checkPerformativeResponsibility(probe).hit);
