#!/usr/bin/env node
/* r572 诊断3：tokenizer 与 L2/L3/L4 短板定位（只打印结构与计数，不打印样本原文） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const LA = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));
const la = new (LA.LexicalAssociator)(ROOT);

const EN = 'The quarterly revenue figure implies the plant output is overheated.';
const ZH = '这笔交易的条款听起来过于完美，很可能存在隐藏的风险与代价。';
const MIX = '这个计划的逻辑听起来很合理，但我需要更多数据才能相信。';

for (const [tag, t] of [['EN', EN], ['ZH', ZH], ['MIX', MIX]]) {
  const toks = la.tokenize(t);
  const hits = toks.filter(w => w.length > 1 && la.graph.nodes[w.toLowerCase()]);
  console.log(`[${tag}] tokens=${toks.length} 图命中=${hits.length} hits=${JSON.stringify(hits.slice(0,6))}`);
}

// L1 直接测：图命中词是否真的产关联
const la2 = new (LA.LexicalAssociator)(ROOT);
const zhHits = la2.tokenize(ZH).filter(w => w.length > 1 && la2.graph.nodes[w.toLowerCase()]);
if (zhHits.length) {
  const g = la2.getAssociations(zhHits[0], {});
  console.log('--- 图命中词 getAssociations n:', g.associations.length, 'totalCandidates:', g.totalCandidates);
}
const enHits = la2.tokenize(EN).filter(w => w.length > 1 && la2.graph.nodes[w.toLowerCase()]);
console.log('--- EN 图命中数:', enHits.length);

// 图键语言分布
const keys = Object.keys(la.graph.nodes).filter(k => (la.graph.nodes[k] || []).length > 0);
const zhKeys = keys.filter(k => /[\u4e00-\u9fff]/.test(k));
const enKeys = keys.filter(k => /^[A-Za-z]+$/.test(k));
console.log('--- 非空图键:', keys.length, '中文键:', zhKeys.length, '英文键:', enKeys.length);
console.log('--- 英文键示例:', enKeys.slice(0, 10).join(','));
console.log('--- 中文键示例:', zhKeys.slice(0, 10).join(','));

// L2 直接测
const CD = require(path.join(ROOT, 'src/archive/associative-engine/chunk-detector.js'));
console.log('--- chunk-detector 导出键:', Object.keys(CD));
process.exit(0);
