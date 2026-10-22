// r531: 验证拟用于守卫测试的 6 个变异支是否真敏感（置空后指定样本必须 miss）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modPath = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const origSrc = fs.readFileSync(modPath, 'utf8');
const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));

function blankDecl(src, declName) {
  const start = src.indexOf(`const ${declName} = new RegExp([`);
  if (start < 0) throw new Error('decl not found: ' + declName);
  // 边界取「下一条 const/let/var/function/module.exports 顶层声明」之前
  // （r524 先例）：不能用 ].join 之前，否则整段数组收尾被留在原地变成语法错误
  const m = src.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : src.length;
  const seg = src.slice(start, after);
  if (!/new RegExp\(/.test(seg)) throw new Error(`${declName} 声明形状异常`);
  return src.slice(0, start) +
    `const ${declName} = new RegExp('(?!)');` + src.slice(after);
}
function load(src, tag) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
                    __filename: tag + '.js', __dirname: path.dirname(modPath) };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sandbox, { filename: tag + '.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const base = load(origSrc, 'base');
const targets = [
  ['HARM_DENY_ZH', attacks[17]],  // 没受到任何影响
  ['MINIMIZE_ZH', attacks[6]],    // 不适应新流程
  ['HARM_DENY_EN', attacks[18]],  // there was no real damage
  ['MINIMIZE_EN', attacks[19]],   // oversensitive
];
for (const [d, sample] of targets) {
  const b = base.checkHarmInvalidation(sample).hit;
  const v = load(blankDecl(origSrc, d), 'b-' + d);
  const a = v.checkHarmInvalidation(sample).hit;
  console.log(`置空 ${d} → 指定样本 before=${b} after=${a} ${b && !a ? 'OK(敏感)' : 'FAIL(不敏感)'}`);
}

// 豁免支活度：置空后良性必须由 miss 变 hit → 需要「豁免+攻击两侧」探针
const EXEMPT_PROBE_ZH = '经医院鉴定为轻微伤，但大家其实是不适应新系统的抵触情绪。';
const EXEMPT_PROBE_EN = 'The doctor confirmed a real injury, but they are just resisting the new process.';
const baseZh = base.checkHarmInvalidation(EXEMPT_PROBE_ZH).hit;
const baseEn = base.checkHarmInvalidation(EXEMPT_PROBE_EN).hit;
const vZh = load(blankDecl(origSrc, 'EXEMPT_ZH'), 'b-EXEMPT_ZH').checkHarmInvalidation(EXEMPT_PROBE_ZH).hit;
const vEn = load(blankDecl(origSrc, 'EXEMPT_EN'), 'b-EXEMPT_EN').checkHarmInvalidation(EXEMPT_PROBE_EN).hit;
console.log(`\nEXEMPT_ZH 探针 baseline=${baseZh} blanked=${vZh} ${!baseZh && vZh ? 'OK(敏感)' : 'FAIL'}`);
console.log(`EXEMPT_EN 探针 baseline=${baseEn} blanked=${vEn} ${!baseEn && vEn ? 'OK(敏感)' : 'FAIL'}`);

// 若上面探针不行，从良性样本里自动找一个「两侧成立但被豁免兜住」的
const benign = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-benign.json'), 'utf8'));
let found = 0;
benign.forEach((s, i) => {
  if (found >= 3) return;
  const bz = base.checkHarmInvalidation(s).hit;
  const vz = load(blankDecl(origSrc, 'EXEMPT_ZH'), 'b-EXEMPT_ZH').checkHarmInvalidation(s).hit;
  const ve = load(blankDecl(origSrc, 'EXEMPT_EN'), 'b-EXEMPT_EN').checkHarmInvalidation(s).hit;
  if ((!bz && vz) || (!bz && ve)) {
    found++;
    console.log(`  可选豁免探针 ben#${i}: base=${bz} blankZH=${vz} blankEN=${ve}`);
  }
});
if (found === 0) console.log('  良性样本中无「两侧成立被豁免兜住」者 → 豁免守卫须自建探针');
