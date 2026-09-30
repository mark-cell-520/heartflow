// [v6.7.130 第 300 轮] probe-1-zh-recall：复测 + 定位中文侧召回缺口
// 背景：r298 修完「本身」误伤后，交接簿遗留第 3 项 = B 侧词表召回不足。
// 纪律：样本只在本文件出现，跑完只报数字/形状，不贴输出原文到报告。
// 口径：线上 gate checkOutput 的 findings（不用离线正则复刻）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

// 复测 r298 probe-pp-gap-r298 的 6 条正例（BASE 当前 = 2/6）
const POS = [
  '成熟不是终于抵达，是学会与不确定共处',
  '孤独不是缺陷，是灵魂的底色',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '成长不是变得世故，是对世界依然保持好奇',
  '自由不是想做什么就做什么，是能承担每个选择的后果',
  '幸福不是拥有很多，是计较得很少',
];

// 12 条工程真句（r298 已归零的误伤组）—— 本轮改完必须仍 0 误伤
const NEG = [
  '这不是某个人的错，是系统设计本身有缺陷',
  '问题不在预算，是资源分配规则需要调整',
  '这次故障不是硬件的故障，是配置项的版本不匹配',
  '延迟不是网络造成的，是序列化方式的开销',
  '这个 bug 不是编译器的问题，是代码里的类型标注错了',
  '失败不是产品的问题，是渠道策略失效',
  '错误不是用户造成的，是接口文档写得不清楚',
  '损坏不是运输造成的，是包装材料的强度不够',
  '落后不是技术问题，是组织流程的节奏',
  '崩溃不是内存的问题，是连接池上限设得太低',
  '这个差异不是算法的，是数据采集口径本身不同',
  '事故不是单点造成的，是多重配置叠加的结果',
];

// 12 条普通抽象陈述真阴（E2 同款宽松组，防本轮补词后反噬）
const NEG_PLAIN = [
  '时间是物理学中的可测量量',
  '生命是区别于非生物的特征',
  '沉默是特定环境中可听声音的缺失',
  '希望是基于期待的乐观心理状态',
  '恐惧是对感知威胁的情绪反应',
  '信任是对另一方可靠性的相信',
  '耐心是不烦躁地忍受延迟的能力',
  '记忆是编码与提取信息的机能',
  '年龄是自事件发生以来经过的时间',
  '爱是心理学研究的复杂情绪状态',
  '成长是规模或数量随时间增加',
  '勇气是尽管恐惧依然行动的能力',
];

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ── 诊断：逐条拆 不是…，是… 后半段的末尾名词，看哪个现有词表能沾上 ──
// 输出形状：每条样本的 B 侧尾部片段（不含整句，只取「是」之后的片段）
function tailAfterShi(s) {
  const m = s.match(/[，,]?\s*是(.{0,12})$/);
  return m ? m[1] : '(无尾部)';
}

console.log('=== 复测：中文正例召回 ===');
let hit = 0;
for (const s of POS) {
  const h = ppf(s);
  if (h) hit++;
  console.log([h ? 'HIT ' : 'MISS', 'B侧尾=' + tailAfterShi(s)].join(' | '));
}
console.log('POS_RECALL=' + hit + '/' + POS.length);

let fpN = 0, fpP = 0;
for (const s of NEG) if (ppf(s)) fpN++;
for (const s of NEG_PLAIN) if (ppf(s)) fpP++;
console.log('NEG_ENG_FP=' + fpN + '/' + NEG.length);
console.log('NEG_PLAIN_FP=' + fpP + '/' + NEG_PLAIN.length);
