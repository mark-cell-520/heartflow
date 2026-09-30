// round-298 probe-3：直接从模块加载 PSEUDO_PHILOSOPHY_ZH，逐条定位命中路由
// 不解析源码文本，直接 require 数组本体（最可靠的路由定位方式）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const mod = require(path.join(ROOT, 'src/index.js'));
const ARR = mod.PSEUDO_PHILOSOPHY_ZH || (mod.__ppf && mod.__ppf());
if (!ARR) { console.log('EXPORT_MISSING'); process.exit(1); }
console.log('数组条数: ' + ARR.length);

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
  ARR.forEach((r, i) => { try { if (new RegExp(r.source, r.flags).test(s)) hits.push(i); } catch (e) {} });
  console.log(label.padEnd(28) + ' -> idx[' + hits.join(', ') + ']');
}
console.log('\n数组形状总览（idx: source 前 50 字符）:');
ARR.forEach((r, i) => console.log(i + ': ' + r.source.slice(0, 50)));
