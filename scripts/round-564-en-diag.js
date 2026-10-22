'use strict';
// [r564] 按腿诊断 favor_ledger EN 侧失败原因。
// 样本不从本轮工具调用里重写，直接由上一轮探针文件解析提取（451 铁律）。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const m = require(path.join(ROOT, 'src', 'favor-ledger.js'));
const I = m.__internals();

const raw = fs.readFileSync(path.join(__dirname, 'round-563-favor-probe.js'), 'utf8');
const seg = raw.split('const ATK = [')[1].split('];')[0];
const all = seg.split('\n').map(l => l.trim())
  .filter(l => l.startsWith("'") && l.endsWith(','))
  .map(l => l.slice(1, -2).replace(/\\'/g, "'"));
const EN = all.filter(s => !/[\u4e00-\u9fff]/.test(s));

console.log('提取 EN 样本数:', EN.length);
for (const s of EN) {
  const legs = [];
  if (I.LEDGER_ZH.test(s)) legs.push('A1-zh');
  if (I.LEDGER_EN.test(s)) legs.push('A1-en');
  if (I.CLAIM_ZH.test(s)) legs.push('A2-zh');
  if (I.CLAIM_EN.test(s)) legs.push('A2-en');
  if (I.GUARD_ZH.test(s)) legs.push('GUARD-zh');
  if (I.GUARD_EN.test(s)) legs.push('GUARD-en');
  const r = m.checkFavorLedger(s);
  console.log(`${r.hit ? 'HIT ' : 'MISS'} | legs=[${legs.join(',') || 'none'}] | ${s.slice(0, 46)}`);
}

// 组合 vs 单支：逐条 test 组合正则，与源字符数对比，确认是否有分支被吞。
console.log('\nLEDGER_EN 源字符数:', I.LEDGER_EN.source.length);
console.log('CLAIM_EN 源字符数:', I.CLAIM_EN.source.length);
console.log('GUARD_EN 源字符数:', I.GUARD_EN.source.length);
console.log('isZh 判据本身工作:', I.LEDGER_EN.test('Without me you would be nothing, so do as I say.'));
