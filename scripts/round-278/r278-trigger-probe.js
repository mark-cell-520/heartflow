// 第 278 轮探针：定位 de_leet 门槛——为什么 Q3/0xFF00 会被还原而 100k 也会被还原
// 关键：_deLeetCandidates 的门槛是 totalHits>=3（或中英混排 >=1）。
// 中文句子里只要含 1 个 leet 字符（如 Q3 的 3、v6.8.159 的多个数字）就会触发还原。
// 本探针枚举触发条件，确认「中英混排 + 1 个数字」即触发的机制。
'use strict';
const tn = require('../../src/text-normalizer.js');

const CASES = [
  // 纯英文（无中文）：需要 >=3 个 leet 字符
  { id: 'en-1hit', text: 'The Q3 report is ready.' },
  { id: 'en-2hit', text: 'The Q3 and Q4 reports are ready.' },
  { id: 'en-3hit', text: 'The Q3 Q4 Q1 reports are ready.' },
  { id: 'en-4hit', text: 'The Q3 Q4 Q1 Q2 reports are ready.' },
  // 中英混排：1 个即触发
  { id: 'mix-1hit', text: '这个 Q3 报告准备好了。' },
  { id: 'mix-ver', text: '版本 v6.8.159 发布了。' },
  { id: 'mix-hash', text: 'commit 3f2a91b 修复了问题。' },
  // 纯中文 + 数字
  { id: 'zh-num', text: '版本 6.8.159 发布了，性能提升 150%。' },
  { id: 'zh-plain', text: '版本发布了，性能提升了。' },
];

for (const c of CASES) {
  const r = tn.normalize(c.text);
  const norm = r.normalized !== undefined ? r.normalized : r;
  const applied = (r.applied || []).join(',');
  console.log(`${applied.includes('de_leet') ? 'TRIGGER' : 'no     '} ${c.id.padEnd(10)} [${applied}]`);
  console.log(`   原: ${c.text}`);
  if (norm !== c.text) console.log(`   归: ${norm}`);
}
