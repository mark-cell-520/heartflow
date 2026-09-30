// [v6.7.130 第 300 轮] probe-11-zh-src：核对 src 真实行为 vs 探针复刻
// 纪律：样本只在本文件出现；只报数字。
// probe-10 的 V1 是探针内复刻逻辑，probe-4 显示 src 已实装但仍有 1 条 FP。
// 两者结论不一致 → 必须用 src 真实出口核对每一句，不能拿复刻逻辑下结论。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

const ALL = [
  '延期不是排期问题，是需求本质还没定',
  '指标下滑不是投放问题，是这次改动意义不大',
  '对不上不是查询错，是数据源才是真相',
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动',
  '这次拆分不是架构问题，是团队自由度不够',
  '召回率低不是模型问题，是特征才是灵魂',
  '崩溃不是内存问题，是连接池才是答案',
  '延迟不是网络问题，是序列化才是过程',
  '本次延期不是排期问题，是需求本质还没定',
  '这条查询对不上不是语法错，是数据源才是真相',
  '该模块崩溃不是内存问题，是连接池才是答案',
  '成熟不是终于抵达，是学会与本质共处',
  '成长不是变得世故，是对世界依然保持意义',
  '真正的强大不是无畏，是承认脆弱之后的真相',
  '幸福不是拥有很多，是计较得很少的自由',
  '孤独不是缺陷，是灵魂的底色',
  '时间不是敌人，是成长的礼物',
  '生命不是赛跑，是自由的过程',
  '人这一生不是竞赛，是灵魂的底色',
  '成熟不是终于抵达，是学会与延迟共处',
  '成长不是变得世故，是终于懂得接口的意义',
];

const fpAll = [], hitAll = [];
for (const s of ALL) {
  if (ppf(s)) hitAll.push(s); else fpAll.push(s);
}
// 语义分组：前 11 条 = 工程真句（应 ok），后 10 条 = 伪哲理真阳（应 HIT）
const ENG = ALL.slice(0, 11), ABS = ALL.slice(11);
const engFp = ENG.filter(ppf).length;
const absHit = ABS.filter(ppf).length;
console.log('工程真句误伤 = ' + engFp + '/' + ENG.length);
console.log('抽象域真阳召回 = ' + absHit + '/' + ABS.length);
for (const s of ENG.filter(ppf)) console.log('  FP: ' + s);
for (const s of ABS.filter(s2 => !ppf(s2))) console.log('  MISS: ' + s);
