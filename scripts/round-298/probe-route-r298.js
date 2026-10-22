// round-298 probe-2：逐条定位命中的正则索引（找到误伤与漏检分别由哪条判据造成）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

// 从源码里抓 PSEUDO_PHILOSOPHY_ZH 数组的正则字面量（不执行引擎，只做路由定位）
const start = src.indexOf('PSEUDO_PHILOSOPHY_ZH');
const arrStart = src.indexOf('[', start);
// 找到数组结束：用括号配平
let depth = 0, arrEnd = -1, inStr = false, strCh = '', esc = false;
for (let i = arrStart; i < src.length; i++) {
  const c = src[i];
  if (esc) { esc = false; continue; }
  if (c === '\\') { esc = true; continue; }
  if (inStr) { if (c === strCh) inStr = false; continue; }
  if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
}
const block = src.slice(arrStart, arrEnd + 1);

// 提取所有 /.../flags 字面量（数组里不含注释里的中文正则注释块影响，逐行扫）
const lines = block.split('\n');
const regs = [];
for (const line of lines) {
  // 跳过注释行
  if (/^\s*\/\//.test(line)) continue;
  const re = /(?<![\w)\]])\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)\s*,?\s*$/.exec(line.trim());
  if (re) {
    try {
      regs.push({ pat: '/' + re[1] + '/' + re[2], re: new RegExp(re[1], re[2]) });
    } catch (e) { /* 忽略 */ }
  }
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
  'NEG-1 工程真句未误伤': '问题不在预算，是资源分配规则需要调整',
  'NEG-2 工程真句未误伤': '延迟不是网络造成的，是序列化方式的开销',
};

for (const [label, s] of Object.entries(SAMPLES)) {
  const hits = [];
  regs.forEach((r, i) => { if (r.re.test(s)) hits.push(i); });
  console.log(label.padEnd(26) + ' -> [' + hits.join(', ') + ']  ' + s);
}
console.log('\n全部正则形状（索引: 前60字符）:');
regs.forEach((r, i) => console.log(i + ': ' + r.pat.slice(0, 60)));
