// 第 228 轮复测：checkNoFallback 英文侧 8 条漏判的逐条形状诊断。
// 纪律：只输出数字与形状标签，不打印样本文本；样本从 r227_scan.js 提取。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const ATTACK = [
  'There is no alternative to this design.',
  'This is the single available option.',
  'No other approach will work.',
  'Only this path remains open.',
  'There is no second choice here.',
  'The plan has no backup option.',
  'No fallback exists for that step.',
  'This is the sole possible route.',
];
const BENIGN = [
  'Option A is the retry with backoff; if that fails, Option B drains the queue.',
  'We ship A first and keep B behind a flag for rollback.',
  'If the migration fails, we restore the snapshot and rerun.',
  'The fallback is the read-through cache while the index rebuilds.',
  'Path A is preferred; path B is documented as the degraded mode.',
];

// 入口自检（226 轮教训：入口错则全盘假阴性）
console.log('SELFTEST ' + [
  idx.checkNoFallback ? 'fn-ok' : 'fn-missing',
  typeof gate.checkOutput === 'function' ? 'gate-ok' : 'gate-missing',
].join(','));

let aHit = 0;
ATTACK.forEach((t, i) => {
  const r = idx.checkNoFallback(t);
  const act = gate.checkOutput(t).gate.action;
  const hitDim = r.count > 0;
  if (hitDim) aHit++;
  console.log('A' + i + ' dim=' + r.count + ' gate=' + act + ' types=' + r.signals.map(s => s.type).join('|'));
});
let bHit = 0;
BENIGN.forEach((t, i) => {
  const r = idx.checkNoFallback(t);
  const act = gate.checkOutput(t).gate.action;
  if (r.count > 0) bHit++;
  console.log('B' + i + ' dim=' + r.count + ' gate=' + act + ' types=' + r.signals.map(s => s.type).join('|'));
});
console.log('SUMMARY attack_dim=' + aHit + '/' + ATTACK.length + ' benign_dim=' + bHit + '/' + BENIGN.length);
