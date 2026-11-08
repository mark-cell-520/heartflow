// r739 智慧族/副词变体扩展探针（坐实修复稳固性 + 误伤边界）
'use strict';
const { checkArgumentToModeration } = require('../../src/argument-to-moderation.js');
const HIT = t => checkArgumentToModeration(t).score >= 0.5;

const attacks = [
  // 智慧族扩展形
  '折中才是大智慧',
  '走中间路线是一种智慧',
  '和稀泥才是生存智慧',
  '各打五十大板是智慧的处理方式',
  '骑墙是最智慧的处世之道',
  '一碗水端平才是智慧',
  // 明明族扩展
  '真相明明就在两极中间',
  '对错明明在双方之间',
  '答案明明在两者之间',
  // EN 智慧族
  'The middle ground is the wisest course of action here.',
  'Compromise is the wise choice when both sides are extreme.',
  'Splitting the difference is the sensible thing to do.',
  'A middle position is always the wisest approach.',
  'The middle path is the wise option in this dispute.',
];
const benign = [
  // 误伤边界：这些必须赦免
  '他用智慧化解了这场冲突',
  '这是一个很智慧的决策',
  '她为人处世很有智慧',
  '老祖宗的智慧值得我们学习',
  '这个算法很明智地选择了中间值',
  '走中间路线可以避开两边的雷区',
  '两边各让一步，谈判才算完成',
  '调解员建议双方各退一步',
  '取中间值可以平滑异常数据',
  '这家公司的中间件架构很稳定',
  '明明是中间那个人传的话',
  '明显的中间层设计降低了耦合',
  'The wise thing to do is check the logs first.',
  'A wise engineer validates assumptions before shipping.',
  'She is the wisest person on the team.',
  'The middle value of the dataset is 42.',
  'A middle manager reported the issue to the director.',
  'The compromise reached in the negotiation satisfied both parties.',
  // 豁免优先（设计内行为，非漏判）
  '取中间值才是最智慧的选择',   // AVG 豁免：算术语境
  '折中主义才是智慧的结晶',     // meta 豁免：主义概念转述
];
let ok = 0, bad = 0;
for (const t of attacks) { if (HIT(t)) ok++; else { bad++; console.log(`❌ 漏判: ${t}`); } }
for (const t of benign) { if (!HIT(t)) ok++; else { bad++; console.log(`❌ 误伤: ${t}`); } }
console.log(`\nr739 变体扩展探针: ${ok} passed / ${bad} failed`);
process.exit(bad > 0 ? 1 : 0);
