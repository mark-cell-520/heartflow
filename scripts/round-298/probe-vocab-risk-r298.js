// round-298 probe-6：词表 entry 级风险量化 —— 逐个本体论名词测「工程归因真句」误伤可能
// 目的：确认 FP 根因是「本身」这一类普通自指词混进本体论词表，而不是整族判据错。
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

// 构造「工程归因真句」：主语 + 不是A，是 + {本体论名词} + 真工程谓语
// 若某名词在这些句子上命中，说明它在工程语言里只当普通修饰语。
const ENGINEERING_TAILS = [
  '存在并发写风险',
  '需要回滚到上个版本',
  '由配置漂移引起',
  '在压测里复现了',
  '属于发布窗口没对齐',
  '是索引缺失导致的',
  '表现为超时率上升',
  '需要补数据对齐逻辑',
  '与操作系统版本相关',
  '在灰度阶段已经暴露',
];
const NOUNS = ['主宰','和解','前行','答案','本质','过程','轮回','宿命','意义','边界','格局','认知','觉醒','智慧','选择','机会','味道','本身','全部','真相','成长','自由','灵魂','相遇','告别','重逢','治愈'];
console.log('idx12 baseline 形状: ' + IDX12.source.slice(0, 60));

// 每个名词：造 4 条工程真句（抽象主语避开，主语用工程实体），数误伤
console.log('\n名词  工程真句误伤(条)  示例');
const risky = [];
for (const noun of NOUNS) {
  const tails = ENGINEERING_TAILS.slice(0, 4).map(t => '这个模块的瓶颈不是网络，是' + noun + t);
  let hit = 0;
  for (const s of tails) if (IDX12.test(s)) hit++;
  if (hit > 0) { risky.push({ noun, hit, total: tails.length }); console.log(noun + '  ' + hit + '/' + tails.length + '  ' + tails[0]); }
}
console.log('\n风险名词合计: ' + risky.length + '/' + NOUNS.length);

// 反向：删掉风险名词后，确认仍能抓到真阳
console.log('\n删「本身」后验证:');
const noSelf = new RegExp(IDX12.source.replace(/\\u672c\\u8eac\\|/, ''), IDX12.flags);
const FPS = ['这不是某个人的错，是系统设计本身有缺陷', '这个差异不是算法的，是数据采集口径本身不同'];
const TPS = [
  '孤独不是缺陷，是灵魂的底色',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成熟不是终于抵达，是学会与不确定共处',
  '成长不是变得世故，是对世界依然保持好奇',
  '幸福不是拥有很多，是计较得很少',
];
let fp = 0;
for (const s of FPS) if (noSelf.test(s)) { fp++; console.log('  FP仍误伤: ' + s); }
let tp = 0;
for (const s of TPS) if (noSelf.test(s)) tp++;
console.log('  误伤 ' + fp + '/' + FPS.length + '   真阳召回 ' + tp + '/' + TPS.length);
console.log('  BASE 真阳召回: ' + TPS.filter(s => IDX12.test(s)).length + '/' + TPS.length);
