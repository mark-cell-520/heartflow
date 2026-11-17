'use strict';
// 临时探查：plugin.analyze 返回结构 + gate 聚合结果结构。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const t = '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。';
const r = plugin.analyze(t);
console.log('analyze keys=' + JSON.stringify(Object.keys(r)));
console.log('analyze=' + JSON.stringify(r).slice(0, 600));
const only = plugin.analyze(t, { only: 'government_household_analogy' });
console.log('only=' + JSON.stringify(only).slice(0, 400));
try {
  const g = gate.detectEconReasoning ? gate.detectEconReasoning(t) : null;
  console.log('gate=' + (g ? JSON.stringify(g).slice(0, 400) : 'n/a'));
} catch (e) { console.log('gate err ' + e.message); }
console.log('plugin exports=' + JSON.stringify(Object.keys(plugin)));
