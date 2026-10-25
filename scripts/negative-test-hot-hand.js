/**
 * scripts/negative-test-hot-hand.js
 * [r722] hot_hand 第 153 维度负例注入测试：逐一置空各常量验证承重。
 * 纪律（同 r720 post_hoc 先例）：置空后期望翻转（攻击从命中变零命中；
 * 豁免样本从豁免变命中）；豁免注入样本必须双腿齐全，且避开其他豁免的
 * 触发词（防叠加兜底造成假阴性）。另做豁免独立性交叉校验：置空一条
 * 豁免不得翻转其他豁免的样本。
 */
'use strict';

const path = require('path');
const Module = require('module');
const modPath = path.join(__dirname, '..', 'src', 'hot-hand.js');

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
  ['我手感正旺，下一把肯定中', ['STREAK_ZH', 'CONTINUE_ZH']],
  ['I am on a hot streak, so the next hand is mine.', ['STREAK_EN', 'CONTINUE_EN']],
];
// 豁免注入样本（双腿齐全 + 恰好一种豁免，避开其他豁免触发词）
const victims = [
  ['热手谬误指连胜之后还认为下一局肯定还会赢', 'META_NOUN'],
  ['连胜之后下一局肯定还会赢，但每局概率独立', 'EVIDENCE_PRESENT'],
  ['教授在课堂上说，连胜之后下一局肯定还会赢，这是经典错误', 'THIRD_PERSON_EXEMPT'],
];

let pass = 0;
const fails = [];
function check(name, cond) {
  if (cond) { pass++; } else { fails.push(name); }
}

// 基线：攻击命中、豁免样本被豁免
for (const [s, legs] of attacks) {
  check('基线攻击命中: ' + s.slice(0, 18), base.checkHotHand(s).count > 0);
}
for (const [s, ex] of victims) {
  check('基线豁免(' + ex + '): ' + s.slice(0, 18), base.checkHotHand(s).count === 0);
}

// 逐腿置空：攻击必须翻转
for (const [s, legs] of attacks) {
  for (const leg of legs) {
    const m = loadWithOverrides({ [leg]: '[]' });
    check('置空 ' + leg + ' 后攻击翻转: ' + s.slice(0, 18), m.checkHotHand(s).count === 0);
  }
  // 另一路由的腿置空不得影响本路由（跨语言路由独立）
  const otherLeg = legs[0] === 'STREAK_ZH' ? 'STREAK_EN' : 'STREAK_ZH';
  const m2 = loadWithOverrides({ [otherLeg]: '[]' });
  check('置空 ' + otherLeg + ' 不影响本路由: ' + s.slice(0, 18), m2.checkHotHand(s).count > 0);
}

// 逐豁免置空：豁免样本必须翻转为命中
for (const [s, ex] of victims) {
  const m = loadWithOverrides({ [ex]: '[]' });
  check('置空 ' + ex + ' 后豁免翻转: ' + s.slice(0, 18), m.checkHotHand(s).count > 0);
}

// 豁免独立性：置空某豁免不得翻转其他豁免样本
for (const [s, ex] of victims) {
  for (const other of victims) {
    if (other[1] === ex) continue;
    const m = loadWithOverrides({ [ex]: '[]' });
    check('置空 ' + ex + ' 不翻转 ' + other[1] + ' 样本: ' + other[0].slice(0, 14), m.checkHotHand(other[0]).count === 0);
  }
}

// 全腿置空：所有攻击必须静默（零命中且 zeroHit=true）
{
  const m = loadWithOverrides({ STREAK_ZH: '[]', CONTINUE_ZH: '[]', STREAK_EN: '[]', CONTINUE_EN: '[]' });
  for (const [s] of attacks) {
    const r = m.checkHotHand(s);
    check('全腿置空静默: ' + s.slice(0, 18), r.count === 0 && r.zeroHit === true);
  }
}

console.log('=== negative-test-hot-hand ===');
console.log(pass + ' passed, ' + fails.length + ' failed');
fails.forEach((f) => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
