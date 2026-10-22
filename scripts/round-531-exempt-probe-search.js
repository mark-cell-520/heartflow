// r531: 为豁免守卫寻找活度达标的自建探针（须满足：baseline miss + 置空 EXEMPT 后 hit）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modPath = path.join(__dirname, '..', 'src', 'harm-invalidation.js');
const origSrc = fs.readFileSync(modPath, 'utf8');

function blankDecl(src, declName) {
  const start = src.indexOf(`const ${declName} = new RegExp([`);
  const m = src.slice(start + 1).match(/\n(?:const |let |var |function |module\.exports)/);
  const after = m ? start + 1 + m.index : src.length;
  const seg = src.slice(start, after);
  if (!/new RegExp\(/.test(seg)) throw new Error(`${declName} 声明形状异常`);
  return src.slice(0, start) + `const ${declName} = new RegExp('(?!)');` + src.slice(after);
}
function load(src, tag) {
  const sandbox = { module: { exports: {} }, exports: {}, require, process, console, Buffer,
                    __filename: tag + '.js', __dirname: path.dirname(modPath) };
  vm.createContext(sandbox);
  const wrapper = vm.runInContext('(function(module, exports, require){' + src + '\nreturn module.exports;})', sandbox, { filename: tag + '.js' });
  return wrapper(sandbox.module, sandbox.module.exports, require);
}

const base = load(origSrc, 'base');
const bZh = load(blankDecl(origSrc, 'EXEMPT_ZH'), 'b-EXEMPT_ZH');
const bEn = load(blankDecl(origSrc, 'EXEMPT_EN'), 'b-EXEMPT_EN');

// 豁免特征词（取自 EXEMPT 支）与攻击特征词（取自 HARM_DENY/MINIMIZE）组合
const exZhSeeds = [
  '经医院鉴定为轻微伤',
  '受损名单已经核实',
  '未造成人员伤亡',
  '医生诊断为焦虑症',
  '风险评估结果显示可控',
  '按标准赔付',
];
const exEnSeeds = [
  'certified as a minor injury',
  'the affected users have been verified',
  'no casualties were reported',
  'clinically diagnosed anxiety',
  'the risk assessment indicates it is controlled',
  'compensated per the schedule',
];
const atkZhSeeds = [
  '她根本没受伤，就是自己吓自己',
  '别小题大做',
  '这点小伤也算？',
  '又没死人',
  '只是不适应新流程',
  '大家其实不熟悉新系统',
  '其实没人掉块肉',
];
const atkEnSeeds = [
  'she was imagining the whole thing',
  'they are oversensitive',
  'it is all in their head',
  'nobody is really worse off',
  'they are just resisting the change',
  'there is nothing to settle',
  'they will get used to it',
];

const results = [];
for (const ex of exZhSeeds) {
  for (const atk of atkZhSeeds) {
    const t = ex + '，' + atk;
    if (!base.checkHarmInvalidation(t).hit && bZh.checkHarmInvalidation(t).hit) {
      results.push(['ZH', t]);
    }
  }
}
for (const ex of exEnSeeds) {
  for (const atk of atkEnSeeds) {
    const t = 'According to the report, ' + ex + ', and ' + atk + '.';
    if (!base.checkHarmInvalidation(t).hit && bEn.checkHarmInvalidation(t).hit) {
      results.push(['EN', t]);
    }
  }
}
console.log('候选活度探针数:', results.length);
results.slice(0, 6).forEach(([lang, t]) => console.log(`  [${lang}] ${t}`));
