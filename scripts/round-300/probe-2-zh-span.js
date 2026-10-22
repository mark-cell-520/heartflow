// [v6.7.130 第 300 轮] probe-2-zh-span：量化漏检样本的 B 侧跨度分布
// 纪律：样本只在本文件出现；只报数字与形状。
// 目的：区分「跨度上限不足」与「词表缺词」两种根因 —— 直接决定补什么：
//   · 若 4 条全部在现有判据跨度外 → 跨度是主因（放宽跨距即可）
//   · 若全部在跨度内、只是词表没有的尾部名词 → 词表广度是主因
// 口径：线上 gate checkOutput。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

const MISS = [
  '成熟不是终于抵达，是学会与不确定共处',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成长不是变得世故，是对世界依然保持好奇',
  '幸福不是拥有很多，是计较得很少',
];
const HIT = [
  '孤独不是缺陷，是灵魂的底色',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
];

// 8792 行判据的跨度常量（手抄只为定位，不用于判定）
// /^[^。！？\n]{0,12}(?:真正)?[^。！？\n]{0,24}不是[^。！？\n]{2,40}[，,][^。！？\n]{0,8}(?:是|是在于|关乎|源于)[^。！？\n]{2,30}词表/
// B 侧 = 最后一个 [^。！？\n]{2,30}

// 逐条拆出 B 侧实际长度 + 是否落到句尾
function analyze(s) {
  const m = s.match(/[，,]?\s*(?:是|是在于|关乎|源于)([^。！？\n]+)$/);
  const b = m ? m[1] : null;
  return b === null ? { b: null, len: -1, atTail: false } : { b, len: b.length, atTail: true };
}

console.log('=== 漏检样本 B 侧拆解（相对 8792 判据结构）===');
for (const s of MISS.concat(HIT)) {
  const a = analyze(s);
  const tag = MISS.includes(s) ? 'MISS' : 'HIT ';
  console.log([tag, 'B侧长=' + a.len, a.b === null ? '(未匹配结构)' : 'B侧=' + a.b].join(' | '));
}

// 跨度梯度测试：把「幸福不是拥有很多，是计较得很少」手工放缩 B 侧到不同长度，
// 看现有判据在哪个长度上绷断（验证 30 是否真的是边界）
const gradient = [];
for (const pad of [0, 2, 6, 10, 14, 18, 22, 26, 29, 31, 40]) {
  const filler = '的'.repeat(0) + '过程'.repeat(Math.ceil(pad / 2)).slice(0, pad);
  const s = '成熟不是终于抵达，是学会与不确定共处' + (pad > 0 ? '，这本身就是' + filler + '本质' : '');
  const r = checkOutput(s);
  const h = r && r.findings ? r.findings.some(f => String(f.dimension || '').includes('pseudo_profundity')) : false;
  gradient.push(pad + ':' + (h ? 'HIT' : 'miss'));
}
console.log('跨度梯度(pad:HIT/miss) = ' + gradient.join(' '));

// 尾部落点测试：把漏检样本的 B 侧名词换成词表内已有词，看是否命中
// （验证「形状对、只差词」这一假设）
const SWAP = [
  ['原形', '成熟不是终于抵达，是学会与不确定共处'],
  ['换词表词-本质', '成熟不是终于抵达，是学会与本质共处'],
  ['换词表词-真相', '成熟不是终于抵达，是学会与真相共处'],
  ['换词表词-意义', '成熟不是终于抵达，是学会与意义共处'],
];
console.log('=== 换词探针（形状不变、只把 B 侧末尾名词换成词表内已有词）===');
for (const [tag, s] of SWAP) {
  const r = checkOutput(s);
  const h = r && r.findings ? r.findings.some(f => String(f.dimension || '').includes('pseudo_profundity')) : false;
  console.log([tag, h ? 'HIT' : 'miss'].join(' | ') + ' | ' + s);
}
