// [v6.7.130 第 300 轮] probe-4-zh-fp-scale：量化 8792 判据的工程真句误伤面
// 纪律：样本只在本文件出现；只报数字与形状。
// probe-3 D 组发现：词表内既有词（本质/意义/真相）在工程真句上 3/3 误伤。
// 这推翻了「补词即可安全召回」的假设 —— 修召回前必须先量化现有判据的误伤面，
// 否则等于在漏水的船上加水。本条独立清点，不动 src/。
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

// 工程/商业归因真句，B 侧落点是可测量实体或普通领域名词（不构成本体论升格）
// 这一组刻意不含「本身」（r298 已修），专测既有词表的越界
const NEG = [
  // B 侧 = 本质/意义/真相（词表内既有词，probe-3 D 组 3/3 误伤）
  '延期不是排期问题，是需求本质还没定',
  '指标下滑不是投放问题，是这次改动意义不大',
  '对不上不是查询错，是数据源才是真相',
  // B 侧 = 成长/自由/灵魂 等既有词
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动',
  '这次拆分不是架构问题，是团队自由度不够',
  '召回率低不是模型问题，是特征才是灵魂',
  // B 侧 = 答案/过程/轮回 等 289 轮词表
  '崩溃不是内存问题，是连接池才是答案',
  '延迟不是网络问题，是序列化才是过程',
  // 同形态但 B 侧纯技术实体（对照，应全 ok）
  '延期不是排期问题，是需求评审周期太长',
  '指标下滑不是投放问题，是素材迭代节奏慢了',
  '对不上不是查询错，是数据源同步有延迟',
  '活跃度下降不是推荐问题，是冷启动策略覆盖不足',
  '这次拆分不是架构问题，是模块边界划分不合理',
  '召回率低不是模型问题，是特征工程的覆盖度不够',
  '崩溃不是内存问题，是连接池上限设得太低',
  '延迟不是网络问题，是序列化的方式开销大',
];

let fp = 0;
const detail = [];
for (const s of NEG) {
  const h = ppf(s);
  if (h) fp++;
  detail.push((h ? '🔴FP' : 'ok ') + ' | ' + s);
}
console.log('=== 8792 判据工程/商业真句误伤清点 ===');
for (const d of detail) console.log(d);
console.log('FP=' + fp + '/' + NEG.length);

// 分界：纯技术实体对照组 vs 既有词表组
const vocabHits = detail.slice(0, 9).filter(d => d.startsWith('🔴')).length;
const techHits = detail.slice(9).filter(d => d.startsWith('🔴')).length;
console.log('既有词表组 FP=' + vocabHits + '/9');
console.log('纯技术实体对照组 FP=' + techHits + '/9');
