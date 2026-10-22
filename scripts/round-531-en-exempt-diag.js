// r531: 诊断 EN 豁免探针为何在置空 EXEMPT_EN 后仍 miss
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modPath = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const origSrc = fs.readFileSync(modPath, 'utf8');
function blankDecl(src, d) {
  const start = src.indexOf(`const ${d} = new RegExp([`);
  const m = src.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : src.length;
  return src.slice(0, start) + `const ${d} = new RegExp('(?!)');` + src.slice(after);
}
function load(src, tag) {
  const sb = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
              __filename: tag, __dirname: path.dirname(modPath) };
  vm.createContext(sb);
  const w = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sb, { filename: tag });
  return w(sb.module, sb.module.exports, require);
}
const base = load(origSrc, 'b');
const cands = [
  'According to the report, the affected users have been verified, and they are just resisting the change.',
  'The affected users have been verified, so they are just resisting the change.',
  'No casualties were reported, and they are just oversensitive.',
  'The risk assessment indicates it is controlled, but she was imagining the whole thing.',
  'It is clinically diagnosed anxiety, so she was imagining the whole thing.',
  'It is certified as a minor injury, but she was imagining the whole thing.',
];
for (const t of cands) {
  const bZH = load(blankDecl(origSrc, 'EXEMPT_ZH'), 'bz');
  const bEN = load(blankDecl(origSrc, 'EXEMPT_EN'), 'be');
  console.log(`base=${base.checkHarmInvalidation(t).hit} blankZH=${bZH.checkHarmInvalidation(t).hit} blankEN=${bEN.checkHarmInvalidation(t).hit} :: ${t.slice(0, 70)}`);
}
