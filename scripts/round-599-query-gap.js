/** r599：量化 lessonBank.query 的召回缺口（整串子串匹配 vs 中文主题词） */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();

const L = lessonBank.lessons;
console.log('教训总数:', L.length);

// 库里实际出现过的高频中文词组（用于对照：这个词确实在 content 里）
function hasTerm(term) {
  return L.filter(l => (l.content || '').includes(term) || (l.context || '').includes(term)).length;
}

const probes = ['版本号', '纪律', '记忆', '心虫', '升级', '蒸馏', '诚实', '隐私', '权限', '超时',
  '内存', '提交', '测试', '安全', '摘要', '兴趣', '关注', '评估', '部署', '启动'];
const rows = probes.map(p => ({ term: p, contains: hasTerm(p), queryHits: lessonBank.query(p).length }));
rows.forEach(r => {
  if (r.contains > 0 && r.queryHits === 0) console.log(`  缺口: 「${r.term}」content 中出现 ${r.contains} 次，query 命中 ${r.queryHits}`);
});
const gapCount = rows.filter(r => r.contains > 0 && r.queryHits === 0).length;
console.log(JSON.stringify({ rows, gaps: gapCount }, null, 2));
