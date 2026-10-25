/**
 * scripts/negative-test-affirming-the-consequent.js
 * [r725] affirming_the_consequent 第 155 维度负例注入测试：逐一置空各常量验证承重。
 * 纪律（同 r720-r724 先例）：置空后期望翻转（攻击从命中变零命中；豁免样本
 * 从豁免变命中）；豁免注入样本必须双腿齐全，且避开其他豁免的触发词
 * （防叠加兜底造成假阴性）。另做豁免独立性交叉校验与全腿置空静默。
 */
'use strict';

const path = require('path');
const Module = require('module');
const modPath = path.join(__dirname, '..', 'src', 'affirming-the-consequent.js');

function loadWithOverrides(overrides) {
  const src = require('fs').readFileSync(modPath, 'utf8');
  let out = src;
  for (const [name, val] of Object.entries(overrides)) {
    // 把 const NAME = [...] 替换为 const NAME = <val>
    const re = new RegExp('const ' + name + ' = \\[[^\\]]*\\]');
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

// 攻击样本（双腿齐全、无任何豁免词）
const attacks = [
  ['如果他是负责人，他签字了；他签字了，所以他是负责人', ['COND_IF', 'INFER_ZH']],   // 条件连接词型
  ['努力的人方能成功；他成功了，所以他很努力', ['COND_UNIVERSAL', 'INFER_ZH']],     // 全称规则型（避开「会」字防 COND_HUI 兜底）
  ['发烧的人体温会高；他体温高，所以他发烧了', ['COND_HUI', 'INFER_ZH']],             // 会条件型
  ['If he were guilty, he would act nervous. He looks nervous, so he is guilty.', ['COND_IF', 'INFER_EN']], // EN 规则型
  ['Successful founders read a lot. He reads a lot, so he will be a successful founder.', ['INFER_EN']],    // EN 裸规则型
];
// 豁免注入样本（双腿齐全 + 恰好一种豁免，避开其他豁免触发词）
const victims = [
  ['如果他是负责人，他就会签字；他签字了，所以他是负责人，这是肯定后件谬误', 'META_CONCEPT'],
  ['如果他是负责人，他就会签字；他签字了，可能说明他是负责人', 'HEDGE'],
  ['如果是他干的，他会留下痕迹；现场没有痕迹，说明不是他干的', 'NEG_ZH'],
  ['If he were guilty, he would act nervous. He does not look nervous at all, so he is not guilty.', 'NEG_EN'],
  ['老师在课堂上讲：如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的', 'TEACH'],
  ['如果他是负责人，他就会签字；他签字了，所以他是负责人——但孤证难以定案，还要查授权记录', 'EVIDENCE'],
];

let pass = 0;
const fails = [];
function check(name, cond) {
  if (cond) { pass++; } else { fails.push(name); }
}

// 基线：攻击命中、豁免样本被豁免
for (const [s] of attacks) {
  check('基线攻击命中: ' + s.slice(0, 18), base.checkAffirmingTheConsequent(s).count > 0);
}
for (const [s, ex] of victims) {
  check('基线豁免(' + ex + '): ' + s.slice(0, 18), base.checkAffirmingTheConsequent(s).count === 0);
}

// 逐腿置空：攻击必须翻转
for (const [s, legs] of attacks) {
  for (const leg of legs) {
    const m = loadWithOverrides({ [leg]: '[]' });
    check('置空 ' + leg + ' 后攻击翻转: ' + s.slice(0, 18), m.checkAffirmingTheConsequent(s).count === 0);
  }
}

// 逐豁免置空：豁免样本必须翻转为命中
for (const [s, ex] of victims) {
  const m = loadWithOverrides({ [ex]: '[]' });
  check('置空 ' + ex + ' 后豁免翻转: ' + s.slice(0, 18), m.checkAffirmingTheConsequent(s).count > 0);
}

// 豁免独立性：置空某豁免不得翻转其他豁免样本
for (const [s, ex] of victims) {
  for (const other of victims) {
    if (other[1] === ex) continue;
    const m = loadWithOverrides({ [ex]: '[]' });
    check('置空 ' + ex + ' 不翻转 ' + other[1] + ' 样本: ' + other[0].slice(0, 14), m.checkAffirmingTheConsequent(other[0]).count === 0);
  }
}

// 全腿置空：所有攻击必须静默（零命中）
{
  const m = loadWithOverrides({ COND_IF: '[]', COND_UNIVERSAL: '[]', COND_HUI: '[]', INFER_ZH: '[]', INFER_EN: '[]' });
  for (const [s] of attacks) {
    check('全腿置空静默: ' + s.slice(0, 18), m.checkAffirmingTheConsequent(s).count === 0);
  }
}

console.log('=== negative-test-affirming-the-consequent ===');
console.log(pass + ' passed, ' + fails.length + ' failed');
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
