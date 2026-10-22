// r531: EXEMPT 支级归属（正确切分：按 ] 结尾项，不用 | 切）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const mod = require('../src/harm-invalidation.js');
const I = mod.__internals();

function declBranches(reName) {
  // 从源码取该项声明的字符串数组，按 ',\n  ' 切分（数组元素边界）
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'harm-invalidation.js'), 'utf8');
  const start = src.indexOf(`const ${reName} = new RegExp([`);
  const endM = src.slice(start).match(/\n\]\.join\(/);
  const seg = src.slice(start, start + endM.index);
  // 提取所有 '...' 字面量（含拼接），每项之间以 ,\n 分隔
  const items = seg.split(/\n\s*,\s*\n?/).filter(s => s.trim().startsWith("'"));
  return items.map(s => {
    // 拼接字符串求值
    let joined = s.trim();
    joined = joined.replace(/\n\s*\+\s*\n\s*'/, '').replace(/^\s*'/, '').replace(/'\s*$/, '');
    try { return JSON.parse('"' + joined.replace(/\\'/g, "'") + '"'); } catch (e) { return joined; }
  });
}

const attacks = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'round-530-harm-invalidation-samples.json'), 'utf8'));
const exZH = declBranches('EXEMPT_ZH');
const exEN = declBranches('EXEMPT_EN');
console.log(`EXEMPT_ZH 项数=${exZH.length} EXEMPT_EN 项数=${exEN.length}`);

for (const i of [13, 15, 16, 18, 19]) {
  const s = attacks[i];
  const zhHits = exZH.map((b, j) => [b, j]).filter(([b]) => { try { return new RegExp(b, 'i').test(s); } catch (e) { return false; } }).map(([, j]) => j);
  const enHits = exEN.map((b, j) => [b, j]).filter(([b]) => { try { return new RegExp(b, 'i').test(s); } catch (e) { return false; } }).map(([, j]) => j);
  console.log(`atk#${i} EXEMPT_ZH支=${JSON.stringify(zhHits)} EXEMPT_EN支=${JSON.stringify(enHits)}`);
}
