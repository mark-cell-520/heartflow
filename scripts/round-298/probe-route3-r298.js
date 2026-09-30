// round-298 probe-4：从源码精确提取 PSEUDO_PHILOSOPHY_ZH 正则字面量并定位命中路由。
// 做法：先定位数组声明行，再按字符扫描提取所有 /.../flags 字面量（跳过注释行与字符串内）。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

const declIdx = src.indexOf('const PSEUDO_PHILOSOPHY_ZH');
if (declIdx < 0) { console.log('DECL_MISSING'); process.exit(1); }
// 数组从 decl 后第一个 '[' 开始
const arrStart = src.indexOf('[', declIdx);
// 扫描到数组结束（配平方括号，跳过字符串与转义）
let depth = 0, arrEnd = -1;
for (let i = arrStart; i < src.length; i++) {
  const c = src[i];
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
}
const block = src.slice(arrStart, arrEnd + 1);

// 逐字符扫描，提取正则字面量（跳过 // 注释、字符串）
const regs = [];
let i = 0, inStr = null, inLineComment = false;
while (i < block.length) {
  const c = block[i];
  const n = block[i + 1];
  if (inLineComment) { if (c === '\n') inLineComment = false; i++; continue; }
  if (inStr) { if (c === '\\') { i += 2; continue; } if (c === inStr) inStr = null; i++; continue; }
  if (c === '/' && n === '/') { inLineComment = true; i += 2; continue; }
  if (c === '"' || c === "'") { inStr = c; i++; continue; }
  if (c === '/') {
    // 读取正则字面量
    let j = i + 1, body = '', esc = false, inClass = false;
    while (j < block.length) {
      const ch = block[j];
      if (esc) { body += ch; esc = false; j++; continue; }
      if (ch === '\\') { body += ch; esc = true; j++; continue; }
      if (ch === '[') inClass = true;
      else if (ch === ']') inClass = false;
      else if (ch === '/' && !inClass) break;
      else if (ch === '\n') break;
      body += ch; j++;
    }
    if (block[j] === '/') {
      let flags = '';
      let k = j + 1;
      while (k < block.length && /[gimsuy]/.test(block[k])) { flags += block[k]; k++; }
      try { regs.push(new RegExp(body, flags)); } catch (e) { /* 忽略坏正则 */ }
      i = k; continue;
    }
  }
  i++;
}
console.log('提取到正则条数: ' + regs.length);

const SAMPLES = {
  'FP-1 工程真句被误伤': '这不是某个人的错，是系统设计本身有缺陷',
  'FP-2 工程真句被误伤': '这个差异不是算法的，是数据采集口径本身不同',
  'TP-1 真阳已命中': '孤独不是缺陷，是灵魂的底色',
  'TP-2 真阳已命中': '自由不是想做什么就做什么，是能承担每个选择的后果',
  'FN-1 真阳漏检': '成熟不是终于抵达，是学会与不确定共处',
  'FN-2 真阳漏检': '真正的强大不是无畏，是承认脆弱之后的继续',
  'FN-3 真阳漏检': '成长不是变得世故，是对世界依然保持好奇',
  'FN-4 真阳漏检': '幸福不是拥有很多，是计较得很少',
  'NEG-1 工程真句未误伤(对照)': '问题不在预算，是资源分配规则需要调整',
  'NEG-2 工程真句未误伤(对照)': '延迟不是网络造成的，是序列化方式的开销',
  'NEG-3 工程真句未误伤(对照)': '事故不是单点造成的，是多重配置叠加的结果',
};
for (const [label, s] of Object.entries(SAMPLES)) {
  const hits = [];
  regs.forEach((r, idx) => { try { if (r.test(s)) hits.push(idx); } catch (e) {} });
  console.log(label.padEnd(28) + ' -> idx[' + hits.join(', ') + ']');
}
console.log('\n数组形状总览（idx: source 前 46 字符）:');
regs.forEach((r, idx) => console.log(idx + ': ' + r.source.slice(0, 46)));
