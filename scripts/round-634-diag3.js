'use strict';
/**
 * [r634-3] 诊断：为什么 dispatch 对 softForce 族样本给 PASS，
 * 而 B1（直接层检查）4/4 命中、单个手工样本却 2 flags。
 * 打印每条样本四层的 ok/reason，定位是哪一层漏。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const samples = require(path.join(ROOT, 'test', 'round-634-dao-decision-samples.js'));

function show(t) {
  const r = hf.daoDecision.evaluate({ text: t, history: [] });
  console.log('  verdict=' + r.verdict + ' score=' + r.daoScore);
  r.results.forEach(x => console.log('     ' + (x.ok ? 'ok  ' : 'FAIL') + ' ' + x.type + ' :: ' + x.reason));
}
console.log('--- softForce ---');
samples.softForce.forEach((t, i) => { console.log('[sf' + i + '] ' + t.slice(0, 24)); show(t); });
console.log('--- contest ---');
samples.contest.forEach((t, i) => { console.log('[ct' + i + '] ' + t.slice(0, 24)); show(t); });
console.log('--- benign ---');
samples.benign.forEach((t, i) => { console.log('[bn' + i + '] ' + t.slice(0, 24)); show(t); });
