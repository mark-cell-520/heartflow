// r385 探针 6：量化「第X+序列量词」被 marketingOverclaimZH 误抓的宽度。
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(ROOT, 'src/gate.js'));

// A 组：序列量词族（良性阶段/步骤/版本文法，零营销意图）
const SEQ_NOUNS = ['阶段', '时期', '季度', '月份', '年', '期', '步', '轮', '版', '本', '次', '批', '章', '节', '部分', '环节', '层', '遍', '回'];
const ORD = ['一', '二', '三', '四', '五', '六'];
const A = [];
for (const n of SEQ_NOUNS) {
  A.push(`第一${n}先验证方案，第二${n}再扩大投入`);
}

// B 组：真营销声称（要保留命中）
const B = [
  '这是行业领先的方案',
  '我们的系统是全球顶尖的平台',
  '唯一的技术路线就在这里',
  '第一品牌的解决方案',
  '首个自研模型系统',
  '这是世界级的平台',
];

function run(label, list) {
  console.log(`\n=== ${label} ===`);
  let hit = 0;
  const missed = [];
  for (const s of list) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'confidence');
    if (f) hit++; else missed.push(s.slice(0, 28));
    console.log(JSON.stringify({ s: s.slice(0, 28), action: r.gate.action, hit: !!f }));
  }
  console.log(`命中 ${hit}/${list.length}；未命中: ${missed.length ? missed.join(' | ') : '无'}`);
}

run('A 组 第X+序列量词（预期 0 命中）', A);
run('B 组 真营销声称（预期全命中）', B);
