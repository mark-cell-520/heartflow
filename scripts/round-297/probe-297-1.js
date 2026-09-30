// 探针 297-1：复测 r296 交接簿遗留的两个「真盲区」（缺口是否仍存在）
// 族 A：前置否定型「问题不在X，而在Y{维度|层次|境界|高度}」
// 族 B：非「问题」引导型「这不是X的错，而是Y{境界|层次|维度|高度}」
// 判据来源：src/index.js:8701 第5条（r296 已放宽跨度）+
//           src/index.js:8736/8737 伪辩证族（B 侧词表含「境界|格局」但无「层次|维度|高度」）
'use strict';
const path = require('path');
const HF = require(path.join(__dirname, '../../src/gate.js'));

function info(s) {
  const r = HF.checkOutput(s);
  const j = JSON.stringify(r);
  const m = /pseudo_profundity/i.test(j);
  return { hit: m, score: r.overallScore, gate: r.gate && r.gate.action };
}

const groupA = [
  ['A1 问题不在X，而在Y维度', '问题不在于甲，而在于维度的认知偏差。'],
  ['A2 问题不在X，而在Y层次', '问题不在甲方，而在战略层次的定位不准。'],
  ['A3 问题不在X，而在Y境界', '问题根本不在制度，而在执行境界的欠缺。'],
  ['A4 长主语 + 问题不在X，而在Y高度', '这个项目的真正问题不在代码实现层面，而在整体架构设计的高度。'],
];

const groupB = [
  ['B1 这不是X的错，而是Y境界', '这不是甲的错，而是境界层次还没到。'],
  ['B2 这不是X的错，而是Y层次', '这不是产品的错，而是市场层次的认知不足。'],
  ['B3 这不是X的错，而是Y维度', '这不是算法的错，而是数据维度的选型失误。'],
  ['B4 长主语 + 这不是X的错，而是Y高度', '这不是某一个团队的错，而是整个组织在战略维度上高度不够。'],
];

// 对照组：r296 已覆盖的老族（放宽后应命中）
const control = [
  '这不是甲的问题，而是认知维度的局限。',
  '这不是简单的技术问题，而是整个行业维度的认知出现了系统性的偏差。',
];

for (const [name, s] of groupA.concat(groupB, control.map(x => ['对照 老族', x]))) {
  const r = info(s);
  console.log((r.hit ? '命中' : '漏检') + ' | ' + name + ' | gate=' + r.gate);
}

// 负例集：工程/商业真句（放宽或新族都必须保持 0 命中）
const negatives = [
  '这不是性能的瓶颈，而是IO等待的问题，压测显示p99达到120ms。',
  '这不是设计的问题，而是实现层面的疏漏，重构即可解决。',
  '这不是架构的问题，而是运维层面的失误，复盘已出。',
  '这不是代码的问题，是环境变量没配，检查deploy.yaml。',
  '这不是产品的问题，而是市场需求变化的正常反应。',
  '问题根本不是出在算法，而是数据标注的质量不齐。',
  '这不是安全性问题，而是权限配置写错了。',
  '这不是技术选型问题，而是团队熟悉度的差异。',
  '这不是流程问题，而是执行环节缺少监督。',
  '这不是预算的问题，而是供应商交付能力的问题。',
  '瓶颈不在前端渲染，而在于后端接口的响应时间。',
  '延迟不在于网络，而在于数据库的索引缺失。',
];
let negHit = 0;
for (const s of negatives) if (info(s).hit) negHit++;
console.log('负例误伤 = ' + negHit + '/' + negatives.length);
