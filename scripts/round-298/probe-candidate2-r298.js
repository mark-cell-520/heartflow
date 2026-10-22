// round-298 probe-7：判据选型压测（修正 \u 转义后重做）
// 候选对比：BASE / 删「本身」/ 删「本身」+要求是侧非普通修饰
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

const declIdx = src.indexOf('const PSEUDO_PHILOSOPHY_ZH');
const arrStart = src.indexOf('[', declIdx);
let depth = 0, arrEnd = -1;
for (let i = arrStart; i < src.length; i++) {
  const c = src[i];
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
}
const block = src.slice(arrStart, arrEnd + 1);
const regs = [];
let i = 0, inStr = null, inLineComment = false;
while (i < block.length) {
  const c = block[i], n = block[i + 1];
  if (inLineComment) { if (c === '\n') inLineComment = false; i++; continue; }
  if (inStr) { if (c === '\\') { i += 2; continue; } if (c === inStr) inStr = null; i++; continue; }
  if (c === '/' && n === '/') { inLineComment = true; i += 2; continue; }
  if (c === '"' || c === "'") { inStr = c; i++; continue; }
  if (c === '/') {
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
      let flags = ''; let k = j + 1;
      while (k < block.length && /[gimsuy]/.test(block[k])) { flags += block[k]; k++; }
      try { regs.push(new RegExp(body, flags)); } catch (e) {}
      i = k; continue;
    }
  }
  i++;
}
const IDX12 = regs[12];
// BEN_SHEN 的 \uXXXX 形式（本身 = u672c u8eab）
const BEN = '\\u672c\\u8eab';

const POS = [
  '孤独不是缺陷，是灵魂的底色',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成熟不是终于抵达，是学会与不确定共处',
  '成长不是变得世故，是对世界依然保持好奇',
  '幸福不是拥有很多，是计较得很少',
  '真正的成熟不是拥有更多，是需求更少',
  '强大不是没有软肋，是带着软肋依然向前',
];
const NEG = [
  '这不是某个人的错，是系统设计本身有缺陷',
  '这个差异不是算法的，是数据采集口径本身不同',
  '问题不在预算，是资源分配规则需要调整',
  '这次故障不是硬件的故障，是配置项的版本不匹配',
  '延迟不是网络造成的，是序列化方式的开销',
  '这个 bug 不是编译器的问题，是代码里的类型标注错了',
  '失败不是产品的问题，是渠道策略失效',
  '错误不是用户造成的，是接口文档写得不清楚',
  '损坏不是运输造成的，是包装材料的强度不够',
  '落后不是技术问题，是组织流程的节奏',
  '崩溃不是内存的问题，是连接池上限设得太低',
  '事故不是单点造成的，是多重配置叠加的结果',
  '这个模块的瓶颈不是网络，是调度策略本身有问题',
  '延迟不是带宽造成的，是压缩算法本身的开销',
  '失败不是策略造成的，是实现本身有并发缺陷',
  '性能问题不在算法，而在编译器本身的优化不足',
  '这不是设计的问题，是工程约束本身限制了方案',
  '真正的成熟不是流程完善，是流程本身有漏洞',
];

function evaluate(name, re) {
  let posHit = 0; const posMiss = [];
  for (const s of POS) { if (re.test(s)) posHit++; else posMiss.push(s); }
  let negHit = 0; const negBad = [];
  for (const s of NEG) { if (re.test(s)) { negHit++; negBad.push(s); } }
  console.log('--- ' + name + ' ---');
  console.log('正例: ' + posHit + '/' + POS.length + '   误伤: ' + negHit + '/' + NEG.length);
  if (posMiss.length) console.log('  漏检: ' + JSON.stringify(posMiss));
  if (negBad.length) console.log('  误伤: ' + JSON.stringify(negBad));
  return { posHit, negHit };
}

evaluate('BASE', IDX12);

const noBen = IDX12.source.split(BEN + '|').join('');
evaluate('候选1 删「本身」', new RegExp(noBen, IDX12.flags));

// 候选2：删「本身」 + B 侧本体论词前必须是「的+本体论词」或紧跟本体论词，
// 即要求词表词带「的」前缀，把「本身/全部」这类裸自指词排除
const noBen2 = noBen.split('\\u5168\\u90e8|').join('');
evaluate('候选2 删「本身+全部」', new RegExp(noBen2, IDX12.flags));

// 候选3：候选2 + B 侧跨距收紧 30→20（真阳 B 侧普遍短）
evaluate('候选3 候选2+跨距30→20', new RegExp(noBen2.replace('{2,30}', '{2,20}'), IDX12.flags));
