'use strict';
// r516 诊断：路由③变异守卫为何 after 恒为 true
const fs = require('fs');
const vm = require('node:vm');
const path = require('path');
const modPath = require.resolve('../src/scrutiny-evasion.js');
const orig = fs.readFileSync(modPath, 'utf8');
const samples = require('../test/round-511-scrutiny-evasion-samples.json');

function blankDecl(declName) {
  return o => {
    const start = o.indexOf(`const ${declName} = `);
    if (start < 0) throw new Error(`no decl ${declName}`);
    const after = o.indexOf('\nconst ', start + 1);
    if (after < 0) throw new Error(`no boundary ${declName}`);
    const seg = o.slice(start, after);
    return o.slice(0, start) + `const ${declName} = new RegExp('');` + o.slice(after);
  };
}

function loadIsolated(src) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
                    __filename: 'sev-isolated.js', __dirname: __dirname };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: 'sev-isolated.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const sel = process.argv[2] || 'DEFER_CONSEQ_ZH';
const idx = Number(process.argv[3] || 17);
const m = orig.replace;
const mutated = blankDecl(sel)(orig);
console.log(`sel=${sel} idx=${idx}`);
const start = mutated.indexOf(`const ${sel} = new RegExp('');`);
console.log('mutated head:', JSON.stringify(mutated.slice(start, start + 120)));
const after = mutated.indexOf('\nconst ', start + 1);
console.log('next decl after mutation:', JSON.stringify(mutated.slice(after, after + 60)));
const mod = loadIsolated(mutated);
console.log('isolated exports keys:', Object.keys(mod));
const s = samples.attacks[idx];
console.log('sample:', s.slice(0, 40));
const origMod = require('../src/scrutiny-evasion.js');
console.log('orig hit =', origMod.checkScrutinyEvasion(s));
console.log('mutated hit =', mod.checkScrutinyEvasion(s));
