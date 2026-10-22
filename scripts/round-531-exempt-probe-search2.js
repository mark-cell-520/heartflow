// r531: 用真实攻击样本作「攻击侧种子」搜索 EXEMPT 活度探针
// 语义：探针须同时含 EXEMPT 特征 + deny 特征 + minimize 特征
//   · base miss（被豁免兜住）
//   · 置空对应 EXEMPT 后 hit（攻击两侧独立成立）
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
const base = load(origSrc, 'base');
const variants = {};
for (const d of ['EXEMPT_ZH', 'EXEMPT_EN']) variants[d] = load(blankDecl(origSrc, d), 'b-' + d);

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const exZhSeeds = ['经医院鉴定为轻微伤', '受损名单已经核实', '未造成人员伤亡', '医生诊断为焦虑症', '风险评估结果显示可控', '按标准赔付'];
const exEnSeeds = ['certified as a minor injury', 'the affected users have been verified', 'no casualties were reported', 'clinically diagnosed anxiety', 'the risk assessment indicates it is controlled', 'compensated per the schedule'];

const out = [];
// ZH：豁免种子 + 真实中文攻击样本
for (const ex of exZhSeeds) {
  attacks.filter(s => /[\u4e00-\u9fff]/.test(s)).forEach((s) => {
    const t = ex + '，' + s;
    if (!base.checkHarmInvalidation(t).hit && variants.EXEMPT_ZH.checkHarmInvalidation(t).hit) out.push(['ZH', t]);
  });
}
// EN：豁免种子 + 真实英文攻击样本
for (const ex of exEnSeeds) {
  attacks.filter(s => !/[\u4e00-\u9fff]/.test(s)).forEach((s) => {
    const t = 'According to the report, ' + ex + ', and ' + s;
    if (!base.checkHarmInvalidation(t).hit && variants.EXEMPT_EN.checkHarmInvalidation(t).hit) out.push(['EN', t]);
  });
}
console.log('活度探针候选总数:', out.length);
const zh = out.filter(o => o[0] === 'ZH'), en = out.filter(o => o[0] === 'EN');
console.log('ZH 候选:', zh.length, '| EN 候选:', en.length);
zh.slice(0, 3).forEach(o => console.log('  [ZH] ' + o[1]));
en.slice(0, 3).forEach(o => console.log('  [EN] ' + o[1]));
