// round-298 probe-5：候选判据压测（修 FP + 补 FN 两个候选）
// 目标：找到「不动词表锚点也能覆盖 FN，且零误伤」的分界线。
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
  const c = block[i];
  const n = block[i + 1];
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
console.log('BASE idx12 命中工程真句数（应为 2）:');
const FPS = ['这不是某个人的错，是系统设计本身有缺陷', '这个差异不是算法的，是数据采集口径本身不同'];
for (const s of FPS) console.log('  ' + (IDX12.test(s) ? 'HIT ' : 'miss') + ' ' + s);

// ── 候选 1：删词表里的本身/B（最小改动，只修 FP）──
const C1 = new RegExp(IDX12.source.replace(/\\\u672c\u8eab\|/g, '').replace(/\|B\)/g, ')'), IDX12.flags);
console.log('\n候选1（删本身/B）:');
for (const s of FPS) console.log('  FP ' + (C1.test(s) ? 'HIT(仍误伤)' : 'cleared') + ' ' + s);

// ── 候选 2：抽象人生主语 + 不是A，是B（补 FN）──
// A 侧（不是之后）与 B 侧（是之后）都是抽象行为悬置；B 侧尾部不加逗号。
const SUBJ = '(?:成熟|成长|幸福|人生|生命|生活|孤独|爱情|自由|智慧|勇气|沉默|时间|真正的强大|强大|深刻|本质)';
const C2 = new RegExp(
  '^(?:[^\\u3002\\uff01\\uff1f\\n]{0,10})?(?:' + SUBJ + ')[^\\u3002\\uff01\\uff1f\\n]{0,10}' +
  '\\u4e0d\\u662f[^\\u3002\\uff01\\uff1f\\n]{2,30}[\\uff0c,]' +
  '[^\\u3002\\uff01\\uff1f\\n]{0,4}(?:\\u662f|\\u5728\\u4e8e)[^\\u3002\\uff01\\uff1f\\n]{2,40}(?![\\uff0c,])'
);
console.log('\n候选2（抽象主语+不是A是B）:');
const FN = [
  '成熟不是终于抵达，是学会与不确定共处',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成长不是变得世故，是对世界依然保持好奇',
  '幸福不是拥有很多，是计较得很少',
  '孤独不是缺陷，是灵魂的底色',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
  '真正的强大不是无畏，是承认脆弱之后的继续前行',
  '成熟不是抵达终点，是学会与过程相处',
];
const NEG_ALL = [
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
  '效率不是目标，是可维护性',
  '时间不是问题，是资源不足',
  '生活不是问题，是成本核算',
  '节点A的冲突不是问题的本质，是锁粒度设置不当',
  '孤独的患者需要陪伴，而不是药物治疗',
  '生命体征的监测不是关键流程，是常规巡检项',
  '成熟期产品的迭代不是重点，是稳定性维护',
  '幸福感的调研不是本期指标，是下季度的事情',
  '生活污水不是这次排查的对象，是市政项目',
];
let fnHit = 0;
for (const s of FN) { const h = C2.test(s); if (h) fnHit++; console.log('  FN ' + (h ? 'HIT ' : 'miss') + ' ' + s); }
let negHit = 0;
for (const s of NEG_ALL) { const h = C2.test(s); if (h) negHit++; console.log('  NEG ' + (h ? 'HIT(误伤)' : 'cleared') + ' ' + s); }
console.log('\n候选2: FN ' + fnHit + '/' + FN.length + '  NEG误伤 ' + negHit + '/' + NEG_ALL.length);
