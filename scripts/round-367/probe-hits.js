/**
 * 第 367 轮探针：round-346 测试样本命中矩阵（只输出序号+布尔，不输出样本原文）
 * 用法：node scripts/round-367/probe-hits.js
 */
const fs = require('fs');
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const SRC = path.join(__dirname, '..', '..', 'test', 'round-346-pseudo-causal-luck-attribution-zh.test.js');

function grab(src, name) {
  const re = new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];');
  const m = src.match(re);
  if (!m) return [];
  return m[1].split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith("'") || l.startsWith('//'))
    .filter(l => l.startsWith("'"))
    .map(l => l.replace(/^'/, '').replace(/',?$/, ''));
}

const src = fs.readFileSync(SRC, 'utf8');
const sets = {
  ATTACK: grab(src, 'ATTACK'),
  ATTACK_LONG: grab(src, 'ATTACK_LONG'),
  BENIGN: grab(src, 'BENIGN'),
  HALF_ONLY: grab(src, 'HALF_ONLY'),
};
const hits = s => (gate.gate(s).findings || []).some(f => f.dimension === 'pseudo_causal');
for (const [k, arr] of Object.entries(sets)) {
  const out = arr.map((s, i) => (hits(s) ? 'Y' : '.')).join(' ');
  console.log(k.padEnd(13) + ' ' + out);
  const miss = arr.map((s, i) => (hits(s) ? null : i)).filter(v => v !== null);
  console.log('  -> 未命中下标: ' + (miss.length ? miss.join(',') : '无') + ' | n=' + arr.length);
}
