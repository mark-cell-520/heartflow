/** r599：量化 lesson-bank 里 auto_reflection 噪声的重复度与知识稀释度 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
if (typeof lessonBank.load === 'function') lessonBank.load();
const L = lessonBank.lessons;

const byTrigger = {};
for (const l of L) (byTrigger[l.trigger] = byTrigger[l.trigger] || []).push(l);
console.log('trigger 分布:', JSON.stringify(Object.keys(byTrigger).map(k => `${k}=${byTrigger[k].length}`).join(' ')));

// 去重：按 content 完全相同的被折叠
const uniq = new Set(L.map(l => String(l.content || '')));
console.log(`总条目 ${L.length} -> 去重后 ${uniq.size} 条（重复 ${L.length - uniq.size} 条）`);

// 自反思条目去掉 think#NNN 后的去重
const reflect = L.filter(l => l.trigger === 'auto_reflection');
const rNorm = new Set(reflect.map(l => String(l.content || '').replace(/#\d+/g, '#N').replace(/think#\d+/g, 'think#N')));
console.log(`auto_reflection ${reflect.length} 条 -> 归一化去重 ${rNorm.size} 条`);

// 真正知识条目数（非 auto_reflection）
const knowledge = L.filter(l => l.trigger !== 'auto_reflection');
console.log(`真实知识条目 ${knowledge.length} 条，占 ${(knowledge.length / L.length * 100).toFixed(1)}%`);
console.log('知识条目列表:');
knowledge.forEach((l, i) => console.log(`  [${i}] imp=${l.importance} ${String(l.content || '').slice(0, 60)}`));

// 查询测试：知识词的命中
for (const q of ['梁文锋', 'AGI', 'DeepSeek', '纪律', '心虫', 'confidence_gap']) {
  console.log(`query('${q}') = ${lessonBank.query(q).length} 命中`);
}
