// 第 222 轮探针 3：最+主观形容词 词表白名单制漏判量化（用户两次指出的老问题）
// 按 checkOutput 端到端口径跑，只看 gate.action + findings dimension。
const { checkOutput } = require('../../src/gate.js');

// 形状族：最+主观形容词 + 物品/服务/人 作宾语，无任何来源
const positives = [
  '这是最安静的房间',
  '这是最有分量的结论',
  '这是最省电的一台',
  '这是最舒适的椅子',
  '这是最安全的婴儿车',
  '业界最优的方案',
  '准确率最高的算法',
  '口感最好的面包',
  '最耐用的地板',
  '最灵敏的传感器',
  '最省心的服务',
  '最贴心的设计',
  '最好看的外观',
  '最难用的界面',
  '最吵的机器',
  '最脏的车间',
  '最贵的零件',
  '最便宜的机票',
  '最亮的屏幕',
  '最软的床垫',
  '最香的洗发水',
  '最甜的西瓜',
  '最新鲜的蔬菜',
  '最划算的套餐',
  '最值的会员',
  '最准的预报',
  '最快的车',
  '最慢的网',
  '最轻的笔记本',
  '最重的箱子',
  '最厚的墙',
  '最薄的玻璃',
  '最静的夜',
  '最闹的街',
  '最硬的床',
  '最软的糖',
  '最差的体验',
  '最好的服务',
  '最强的对手',
  '最棒的表现',
  '最漂亮的设计',
  '最重要的发现',
  '最深刻的反思',
  '最伟大的成就',
  '最完美的曲线',
  '最厉害的高手',
  '最出色的发挥',
  '最安静的模式',
  '最有分量的作品',
];
// 对照组：良性基准样本（不应被新判据命中）
const benign = [
  '最近三天天气都不错，适合出门散步',
  '最终版本已经确定，请大家按照新流程执行',
  '最初的方案里并没有这一项，是后来补上的',
  '最新版本已经发布，修复了若干已知问题',
  '最高优先级是保证生产环境稳定',
  '这个投资组合的最大回撤是 12%',
  '最小样本量必须大于 30 才满足统计要求',
  '最大的误差出现在系统启动阶段',
  '最小的间隔是 5 毫秒',
  '最好的办法是先备份再操作',
  '最稳妥的做法是逐步灰度发布',
  '最高权限由管理员统一分配',
  '最早的记录可以追溯到去年三月',
  '最快的路径已经标注在地图上',
];

console.log('==== R222-P3 端到端 checkOutput ====');
let flagged = 0;
const missed = [];
for (const t of positives) {
  const r = checkOutput(t);
  const hit = r.gate.action !== 'pass';
  if (hit) flagged++;
  else missed.push(t);
}
console.log(`positive: ${flagged}/${positives.length} 被非 pass 动作命中`);
console.log('missed: ' + JSON.stringify(missed, null, 0));

let benignFlag = 0;
const falsePos = [];
for (const t of benign) {
  const r = checkOutput(t);
  if (r.gate.action !== 'pass') { benignFlag++; falsePos.push({ t, a: r.gate.action, d: (r.findings || []).map(f => f.dimension) }); }
}
console.log(`benign: ${benignFlag}/${benign.length} 被误命中`);
if (falsePos.length) console.log(JSON.stringify(falsePos, null, 0));
console.log('==== END ====');
