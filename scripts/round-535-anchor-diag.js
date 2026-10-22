/**
 * r535 诊断：①复测 EXEMPT 探针（join 修复后）；②逐条检查测试里的 6 个锚点
 * 是否真的是 origSrc 的子串，定位 #5 失败原因。
 * 用法: node scripts/round-535-anchor-diag.js
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
  const start = origSrc.indexOf(`const ${declName} = new RegExp([`);
  if (start < 0) throw new Error(`变异目标 ${declName} 不存在`);
  const m = origSrc.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : origSrc.length;
  return origSrc.slice(0, start) +
    `const ${declName} = new RegExp('(?!)');` + orig.slice ? origSrc : origSrc.slice(after);
}

// ① ⑤ EXEMPT 探针复测
const zhProbe = '我全责，你们从来不在乎我受了什么。我把整改方案周五前交出来。';
const enProbe = 'I take full responsibility for the outage, the corrective action plan is due Friday, but you are also partly to blame.';
const mutZH = loadIsolated(blankDeclZH());
function blankDeclZH() {
  const start = origSrc.indexOf('const EXEMPT_ZH = new RegExp([');
  const m = origSrc.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = start + 1 + m.index;
  return origSrc.slice(0, start) + `const EXEMPT_ZH = new RegExp('(?!)');` + origSrc.slice(after);
}
const mutEN = loadIsolated((() => {
  const start = origSrc.indexOf('const EXEMPT_EN = new RegExp([');
  const m = origSrc.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = start + 1 + m.index;
  return origSrc.slice(0, start) + `const EXEMPT_EN = new RegExp('(?!)');` + origSrc.slice(after);
})());

console.log('== EXEMPT 探针复测（join 修复后） ==');
console.log(`ZH before=${base.checkPerformativeResponsibility(zhProbe).hit} after=${mutZH.checkPerformativeResponsibility(zhProbe).hit}`);
console.log(`EN before=${base.checkPerformativeResponsibility(enProbe).hit} after=${mutEN.checkPerformativeResponsibility(enProbe).hit}`);

// ⑥ 锚点子串检查
const anchors = [
  '(?:从来|一直|向来|根本|压根|也)(?:不|没|未曾|从不)(?:在乎|理会|在意|考虑|关心|尊重|理解|体谅|心疼)',
  '(?:从来|一向|向来|从来都|一向都)?(?:只会|只会|会|都)?(?:怪|骂|指责|埋怨|数落|挑刺|苛责|计较|算计|念叨|翻旧账)',
  '(?:是谁|是谁|到底是谁|当初是谁)?(?:谁|哪一个)(?:先|先开|先挑|先惹|先动|先说|先做|先提)',
  '(?:反正|横竖|说到底)(?:是|都|全)(?:你|你们|你方)?(?:先)?(?:把|将)?(?:事|话|头|事情)?(?:挑|惹|起|开|动|说|做|提)',
  '(?:只|就会|只会)(?:会)?(?:计较|算计|算|盯着)(?:这些|这点|这点事|得失|对错|输赢|面子|小账|这些琐事|那些)',
  '(?:whatever|anything|everything)\\s+(?:that\\s+)?(?:happens|goes\\s+wrong|results)\\s+(?:now|next|from\\s+here)?\\s*(?:is|will\\s+be)\\s+(?:all\\s+)?on\\s+you',
];
console.log('\n== 锚点子串检查 ==');
anchors.forEach((a, i) => {
  const ok = origSrc.includes(a);
  console.log(`#${i}: ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) {
    console.log(`  anchor(前80): ${JSON.stringify(a.slice(0, 80))}`);
    // 找最接近的文件行
    const key = a.slice(0, 24);
    const line = origSrc.split('\n').find(l => l.includes(key));
    if (line) console.log(`  file行(前110): ${JSON.stringify(line.slice(0, 110))}`);
    else console.log(`  文件中找不到以 ${JSON.stringify(key)} 开头的行`);
  }
});
