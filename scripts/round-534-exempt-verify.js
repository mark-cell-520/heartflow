/** r534：验证选定探针在置空 EXEMPT 后由 miss 变 hit。 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const { checkPerformativeResponsibility } = require('../src/performative-responsibility.js');
const origSrc = fs.readFileSync(require.resolve('../src/performative-responsibility.js'), 'utf8');

const PROBE_ZH = '我全责，你们从来不在乎我受了什么。我把整改方案周五前交出来。';
const PROBE_EN = 'I take full responsibility and you are the one who started it. The corrective action plan is due Friday.';

const BLANK = '(?!)';
function blankDecl(name) {
  return orig => {
    const start = orig.indexOf(`const ${name} = new RegExp([`);
    if (start < 0) throw new Error('no decl ' + name);
    const m = orig.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
    const after = m ? start + 1 + m.index : orig.length;
    return orig.slice(0, start) + `const ${name} = new RegExp('${BLANK}');` + orig.slice(after);
  };
}
function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
                    __filename: 'iso.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const w = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sandbox, { filename: 'iso.js' });
  return w(sandbox.module, sandbox.module.exports, require);
}

for (const [name, probe] of [['EXEMPT_ZH', PROBE_ZH], ['EXEMPT_EN', PROBE_EN]]) {
  const before = checkPerformativeResponsibility(probe).hit;
  const after = loadIsolated(blankDecl(name)(origSrc)).checkPerformativeResponsibility(probe).hit;
  console.log(`${name}: before=${before} after=${after} ${!before && after ? '✓ 有效' : '✗ 无效'}`);
}
