'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const I = require(path.join(HF, 'src/fear-projection.js')).__internals();

const t = '世上只有我一个人对你好，别人都想害你。';
console.log('EXTERNAL=' + I.EXTERNAL_ZH.test(t) + '  BINDING=' + I.BINDING_ZH.test(t));

// 逐步缩小：从整句 → 前半句 → 片段
const parts = [
  '世上只有我一个人对你好',
  '只有我一个人对你好',
  '只有我一个人对你好，',
  '只有我一个人对你好，别人都想害你',
];
for (const p of parts) {
  console.log((I.BINDING_ZH.test(p) ? 'Y' : 'N') + ' (B) | ' + p);
}

// 打印右腿所有分支对「只有我一个人对你好」的命中情况
console.log('\n--- 分支级定位 ---');
const src = require('fs').readFileSync(path.join(HF, 'src/fear-projection.js'), 'utf8');
// 提取 BINDING_ZH 数组的每个分支
const m = src.match(/const BINDING_ZH = new RegExp\(\[([\s\S]*?)\]\.join/);
if (m) {
  const lines = m[1].split('\n').filter(l => l.trim().startsWith('String.raw`'));
  const target = '只有我一个人对你好';
  lines.forEach((l, i) => {
    const body = l.replace(/^\s*String\.raw`/, '').replace(/`,?\s*$/, '');
    try {
      const re = new RegExp(body, 'i');
      if (re.test(target)) console.log('  命中分支#' + i + ': ' + body.slice(0, 90));
    } catch (e) { /* 跳过无法单独编译的分支 */ }
  });
}
