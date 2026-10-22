// r531: 正确诊断 —— 用模块变体分离 deny / minimize 两侧是否成立
// 变异A：把 minimize 判等强制为 true → hit 当且仅当 deny 成立且未豁免
// 变异B：把 deny 判等强制为 true → hit 当且仅当 minimize 成立且未豁免
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modPath = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function loadVariant(src, tag) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
                    __filename: tag + '.js', __dirname: path.dirname(modPath) };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext(
    '(function(module, exports, require){' + src + '\nreturn module.exports;})',
    sandbox, { filename: tag + '.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const A_MARK = "  if (MINIMIZE_ZH.test(text) || MINIMIZE_EN.test(text)) {";
const B_MARK = "  const deny = HARM_DENY_ZH.test(text) || HARM_DENY_EN.test(text);";
if (!origSrc.includes(A_MARK)) throw new Error('A_MARK 漂移');
if (!origSrc.includes(B_MARK)) throw new Error('B_MARK 漂移');

const variantA = loadVariant(origSrc.replace(A_MARK, "  if (true) {"), 'varA');
const variantB = loadVariant(origSrc.replace(B_MARK, "  const deny = true;"), 'varB');

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-benign.json'), 'utf8'));

console.log('== 攻击样本两侧诊断 ==');
attacks.forEach((s, i) => {
  const a = variantA.checkHarmInvalidation(s).hit;   // deny 侧成立
  const b = variantB.checkHarmInvalidation(s).hit;   // minimize 侧成立
  if (!a || !b) console.log(`atk#${i} deny侧=${a ? '✓' : '✗'} minimize侧=${b ? '✓' : '✗'}`);
});

console.log('\n== 良性样本两侧诊断（两侧同时成立 = 假阳性风险，仅豁免兜住）==');
let bothCount = 0;
benign.forEach((s, i) => {
  const a = variantA.checkHarmInvalidation(s).hit;
  const b = variantB.checkHarmInvalidation(s).hit;
  if (a && b) { bothCount++; console.log(`ben#${i} 两侧均成立（仅靠 EXEMPT 兜住）`); }
});
console.log(`良性两侧均成立: ${bothCount}/${benign.length}`);

console.log('\n== 豁免支真实活度：置空 EXEMPT 后良性转 hit 的条数 ==');
function blankDecl(src, declName) {
  const start = src.indexOf(`const ${declName} = new RegExp([`);
  if (start < 0) throw new Error('decl not found: ' + declName);
  const m = src.slice(start + 1).match(/\n\]\.join\(/);
  const after = m ? start + 1 + m.index : src.length;
  return src.slice(0, start) +
    `const ${declName} = new RegExp('(?!)');` + src.slice(after);
}
for (const d of ['EXEMPT_ZH', 'EXEMPT_EN']) {
  const v = loadVariant(blankDecl(origSrc, d), 'blank-' + d);
  const flipped = benign.map((s, i) => [s, i]).filter(([s]) => v.checkHarmInvalidation(s).hit).map(([, i]) => i);
  console.log(`置空 ${d} → 良性新增命中: ${JSON.stringify(flipped)}`);
}
