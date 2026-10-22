'use strict';
// [r570] 三个守卫失败项的取证：① SILENCE_EN 数组体到底含哪些关键词
// ② GUARD_EN 豁免族 2 条为何初始即被命中（哪条腿先兜住）③ SHAME_EN 体里
// 是否有 ought。样本用占位形状描述，不打印攻击原文长度。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'shame-compliance.js'), 'utf8');

function bodyOf(name) {
  const s = src.indexOf(`const ${name} = new RegExp([`);
  return src.slice(s, src.indexOf("].join('|'), 'i');", s));
}
const silEn = bodyOf('SILENCE_EN');
const shameEn = bodyOf('SHAME_EN');
console.log('SILENCE_EN 含 quiet:', silEn.includes('quiet'),
  '| silent:', silEn.includes('silent'),
  '| drop:', silEn.includes('drop'),
  '| ought:', silEn.includes('ought'));
console.log('SHAME_EN 含 ought:', shameEn.includes('ought'));
console.log('SHAME_EN 含 ashamed:', shameEn.includes('ashamed'),
  '| embarrassed:', shameEn.includes('embarrassed'));

// 豁免族三条腿分解：用守卫的显式腿函数（不打印原文）
const { checkShameCompliance, __internals } = require(path.resolve(__dirname, '..', 'src', 'shame-compliance.js'));
const I = __internals();
const exEn = [
  'P1: shame + pressure + privacy-tail',
  'P2: should-be-ashamed + logged-and-routed-tail',
  'P3: what-will-others-think + private-matter-tail',
];
// 直接从测试文件读原文做腿分解（原文只进本进程，不进上下文）
const testSrc = fs.readFileSync(path.resolve(__dirname, '..', 'test', 'round-570-shame-compliance.test.js'), 'utf8');
const block = testSrc.slice(testSrc.indexOf('const exemptEn = ['), testSrc.indexOf('];', testSrc.indexOf('const exemptEn = [')));
const lines = block.split('\n').filter(l => l.trim().startsWith("'")).map(l => l.trim().replace(/^'/, '').replace(/',?$/, '').replace(/,$/, ''));
console.log('豁免族样本数:', lines.length);
for (const s of lines) {
  console.log(`  S=${+(I.SHAME_ZH.test(s) || I.SHAME_EN.test(s))}` +
    ` P=${+(I.SILENCE_ZH.test(s) || I.SILENCE_EN.test(s))}` +
    ` gZh=${+I.GUARD_ZH.test(s)} gEn=${+I.GUARD_EN.test(s)}` +
    ` hit=${+checkShameCompliance(s).hit}`);
}
