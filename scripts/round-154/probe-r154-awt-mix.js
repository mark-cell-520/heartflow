// 第 154 轮探针 1：ai_writing_tell 真 AI 混排漏检复测 + 归因
// 复测 r141 的 10 条 AI_MIX（decision 简报里说的 4/9 漏检就是这批），
// 再扩 20 条新构造的同族样本，逐条打 familiesHit / normalizedFams / findings，
// 找出漏检样本缺哪个证据位。样本只在本文件内出现，报告只引用编号。
'use strict';
const path = require('path');
const { detect } = require(path.join(__dirname, '..', '..', 'src', 'shield', 'ai-writing-tell.js'));

// r141 原始 10 条（换过词的 AI 混排池）
const AI_MIX = [
  '总而言之，This approach demonstrates significant value across multiple dimensions of our work.',
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。',
  '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。',
  '总的来说，In conclusion 这个方案是可行且 robust 的。',
  '总之，In conclusion, we should leverage this robust framework to streamline processes.',
  '换句话说，we need to delve into the intricate details of the design.',
  '这个 robust 的方案能够 multifaceted 地解决问题，效果显著。',
  '我们需要 holistic 地 streamline 整个流程，实现质的飞跃。',
  '这是一个 game-changer，可以 leverage 现有资源创造价值。',
  '系统 poised 实现 unprecedented 的增长，前景十分光明。',
];

// 本轮新扩 20 条：换锚点词/换 TIER 词/换句式，测同族覆盖
const NEW_MIX = [
  // 组1：锚点 + 单 TIER 词 + 少量英文（测锚点单证据能否撑起共现）
  '首先，robust 的设计是这个方案的核心优势。',
  '值得注意的是，seamless 集成让部署变得简单。',
  '综上所述，holistic 策略覆盖了所有关键路径。',
  '总的来说，comprehensive 方案解决了大部分问题。',
  '换句话说，streamline 的流程减少了交接成本。',
  // 组2：中文主语 + 英文谓语动词（AI 翻译腔的动词直译）
  '这个方案能够 leverage 现有的基础设施，避免重复建设。',
  '我们需要 foster 团队之间的协作氛围。',
  '新架构可以 facilitate 更快的迭代节奏。',
  '该系统旨在 empower 业务团队自主配置流程。',
  '这套工具能 augment 分析师的处理能力。',
  // 组3：英文形容词当前置定语 + 普通中文名词
  '这是一个 robust 的系统，部署在三个可用区。',
  '他们提出了 comprehensive 的迁移计划，分四个阶段。',
  '团队采用了 holistic 的治理框架。',
  '这是一份 meticulous 的测试报告，覆盖 200 个用例。',
  '该项目展现了 seamless 的多云协同能力。',
  // 组4：中文句 + 英文抽象名词（AI 常用大词直译）
  '这次重构带来了 synergistic 的效果，各部门都受益。',
  '平台提供了 myriads 的数据接口。',
  '该产品具备 paradigm 级别的创新。',
  // 组5：无锚点无连接词，仅靠词表共现
  'robust 且 comprehensive 的架构设计。',
  'streamline 整个流程，实现 seamless 衔接。',
];

const rows = [];
for (const [i, s] of [...AI_MIX, ...NEW_MIX].entries()) {
  const r = detect(s);
  const dims = (r.findings || []).map(f => f.dimension.replace(/^ai-tell-/, ''));
  rows.push({
    idx: i < 10 ? `A${i + 1}` : `N${i - 9}`,
    score: Number(r.score.toFixed(2)),
    fams: r.familiesHit,
    co: r.coOccurrence,
    dims,
  });
}

const oldMiss = rows.filter(r => r.idx.startsWith('A') && r.score === 0);
const newHit = rows.filter(r => r.idx.startsWith('N') && r.score > 0);
const newMiss = rows.filter(r => r.idx.startsWith('N') && r.score === 0);

console.log('=== r141 原 10 条 ===');
for (const r of rows.filter(x => x.idx.startsWith('A'))) {
  console.log(`${r.idx} score=${r.score} fams=${r.fams} co=${r.co} dims=[${r.dims.join(',')}]${r.score === 0 ? '  <<< MISS' : ''}`);
}
console.log(`旧池漏检: ${oldMiss.length}/10\n`);

console.log('=== 新扩 20 条 ===');
for (const r of rows.filter(x => x.idx.startsWith('N'))) {
  console.log(`${r.idx} score=${r.score} fams=${r.fams} co=${r.co} dims=[${r.dims.join(',')}]${r.score === 0 ? '  <<< MISS' : ''}`);
}
console.log(`新池命中: ${newHit.length}/20  漏检: ${newMiss.length}/20`);

// 归因：漏检样本的族分布
const missDims = {};
for (const r of [...oldMiss, ...newMiss]) for (const d of r.dims) missDims[d] = (missDims[d] || 0) + 1;
console.log('\n漏检样本的 finding 维分布:', JSON.stringify(missDims));
const hitDims = {};
for (const r of [...rows.filter(x => x.idx.startsWith('A') && x.score > 0), ...newHit]) for (const d of r.dims) hitDims[d] = (hitDims[d] || 0) + 1;
console.log('命中样本的 finding 维分布:', JSON.stringify(hitDims));
