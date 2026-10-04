// r439 抽取 r438 测试里的隐私样本到一个独立文件（形状化处理：只搬运、不创作）
// 目的：让 round-439-privacy-persist-guard.test.js 用同一批样本做全量串匹配，
// 而不把原文复制进测试文件的断言文本里。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const src = fs.readFileSync(path.join(ROOT, 'test/privacy-exposure-gate.test.js'), 'utf8');
const lines = src.split('\n');
// r438 PRIVATE 数组区间（第 40-53 行附近），取形如 '...' 的字面量行
const start = lines.findIndex(l => l.includes('const PRIVATE = ['));
const end = lines.findIndex((l, i) => i > start && l.trim() === '];');
const samples = [];
for (let i = start + 1; i < end; i++) {
  const t = lines[i].trim();
  if (!t.startsWith("'")) continue;
  samples.push(t.replace(/^'/, '').replace(/',$/, ''));
}
fs.writeFileSync(path.join(ROOT, 'scripts/round-439-je-sample.txt'), samples.join('\n').trim() + '\n');
console.log('样本条数=' + samples.length);
console.log('首条长度=' + samples[0].length);
