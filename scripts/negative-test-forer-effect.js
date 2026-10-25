'use strict';
// scripts/negative-test-forer-effect.js
// [r727] 负例注入：逐常量置空验证承重。攻击集（双腿齐全）置空任一依赖腿
// 必须翻转为不判；豁免集（双腿齐全+恰好一种豁免）置空该豁免必须翻转为命中；
// 豁免独立性——置空某豁免不得翻转其他豁免样本（防叠加兜底假阴性）；
// 全腿置空静默。注入方式同 r726 先例：读源码正则替换后重新 compile。
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const modPath = path.join(__dirname, '..', 'src', 'forer-effect.js');

function loadWithOverrides(overrides) {
  const src = fs.readFileSync(modPath, 'utf8');
  let out = src;
  for (const [name, val] of Object.entries(overrides)) {
    const re = new RegExp('const ' + name + ' = [\\s\\S]*?;');
    if (!re.test(out)) throw new Error('常量未找到: ' + name);
    out = out.replace(re, 'const ' + name + ' = ' + val);
  }
  const m = new Module(modPath, null);
  m.filename = modPath;
  m.paths = Module._nodeModulePaths(path.dirname(modPath));
  m._compile(out, modPath);
  return m.exports;
}

const base = loadWithOverrides({});

// 攻击样本（每条只依赖一个腿①常量 + 一个腿②常量；标注真实依赖）
const attacks = [
  ['你外表看起来坚强，其实内心很柔软', ['FE_SURFACE_DEPTH_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你时而外向热闹，时而沉默寡言', ['FE_BOTH_SIDES_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你渴望被理解，但又害怕受伤', ['FE_UNIVERSAL_NEED_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你属于讨好型的人，总是先满足别人', ['FE_TYPE_LABEL_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你其实什么都懂，只是很少有人真正读懂你', ['FE_RARE_UNDERSTAND_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你命中注定要经历一次重大转变，然后才会真正觉醒', ['FE_FATE_ZH', 'FE_PERSON_TARGET_ZH']],
  ['你是一个有能力但还没完全发挥出来的人', ['FE_DEFENSE_ZH', 'FE_PERSON_TARGET_ZH']],
  ['You appear confident on the outside but often doubt yourself inside.', ['FE_UNIVERSAL_EN', 'FE_PERSON_TARGET_EN']],
  ['Deep down, you want someone to truly understand you.', ['FE_UNIVERSAL_EN', 'FE_PERSON_TARGET_EN']],
];
// 豁免注入样本（双腿齐全 + 恰好一种豁免，避开其他豁免触发词）
const victims = [
  ['你外表看起来坚强，其实内心很柔软——这是人格量表的维度得分解读', 'FE_MEASUREMENT'],
  ['所谓巴纳姆效应，就是「你外表看起来坚强，其实内心很柔软」这种话术', 'FE_META'],
  ['课堂讨论：你外表看起来坚强，其实内心很柔软，这句话问题在哪', 'FE_TEACH'],
  ['你外表看起来坚强，其实内心很柔软，但这不能作为判断你的依据', 'FE_NEG_FLIP'],
  ['你外表看起来坚强，其实内心很柔软，也许事实并非如此', 'FE_HEDGE'],
  ['你外表看起来坚强，其实内心很柔软——测试解读仅供参考，样本有限', 'FE_CAVEAT'],
  ['你外表看起来坚强，其实内心很柔软，这种描述对大多数人都适用', 'FE_REPORT'],
];

let pass = 0;
const fails = [];
function check(name, cond) {
  if (cond) { pass++; } else { fails.push(name); }
}

// 基线：攻击命中、豁免样本被豁免
for (const [s] of attacks) {
  check('基线攻击命中: ' + s.slice(0, 16), base.checkForerEffect(s).score > 0);
}
for (const [s, ex] of victims) {
  check('基线豁免(' + ex + '): ' + s.slice(0, 16), base.checkForerEffect(s).score === 0);
}

// 逐腿置空：攻击必须翻转
for (const [s, legs] of attacks) {
  for (const leg of legs) {
    const m = loadWithOverrides({ [leg]: '[]' });
    check('置空 ' + leg + ' 后攻击翻转: ' + s.slice(0, 16), m.checkForerEffect(s).score === 0);
  }
}

// 逐豁免置空：豁免样本必须翻转为命中
for (const [s, ex] of victims) {
  const m = loadWithOverrides({ [ex]: '[]' });
  check('置空 ' + ex + ' 后豁免翻转: ' + s.slice(0, 16), m.checkForerEffect(s).score > 0);
}

// 豁免独立性：置空某豁免不得翻转其他豁免样本（防叠加兜底假阴性）
for (const [s, ex] of victims) {
  for (const [other, otherEx] of victims) {
    if (other === s) continue;
    const m = loadWithOverrides({ [ex]: '[]' });
    check('置空 ' + ex + ' 不影响豁免(' + otherEx + '): ' + other.slice(0, 16),
      m.checkForerEffect(other).score === 0);
  }
}

// 全腿置空静默：十条腿常量全空后任何攻击样本都不命中
{
  const m = loadWithOverrides({
    FE_SURFACE_DEPTH_ZH: '[]', FE_BOTH_SIDES_ZH: '[]', FE_UNIVERSAL_NEED_ZH: '[]',
    FE_TYPE_LABEL_ZH: '[]', FE_RARE_UNDERSTAND_ZH: '[]', FE_FATE_ZH: '[]',
    FE_DEFENSE_ZH: '[]', FE_UNIVERSAL_EN: '[]',
    FE_PERSON_TARGET_ZH: '[]', FE_PERSON_TARGET_EN: '[]',
  });
  for (const [s] of attacks) {
    check('全腿置空静默: ' + s.slice(0, 16), m.checkForerEffect(s).score === 0);
  }
}

console.log('[r727 negative-test] ' + pass + ' passed, ' + fails.length + ' failed');
for (const f of fails) console.log('  ❌ ' + f);
if (fails.length) process.exit(1);
