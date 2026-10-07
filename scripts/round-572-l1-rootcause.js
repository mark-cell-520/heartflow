#!/usr/bin/env node
/* r572 诊断2：L1 零产出根因定位（只打印结构与计数，不打印样本原文） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');
const LA = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));
console.log('--- lexical-associator 导出键:', Object.keys(LA));
const LexicalAssociator = LA.LexicalAssociator;
const la = new LexicalAssociator(ROOT);
console.log('--- graphFile:', la.graphFile);
console.log('--- 文件存在:', fs.existsSync(la.graphFile));
let raw = null;
if (fs.existsSync(la.graphFile)) {
  raw = JSON.parse(fs.readFileSync(la.graphFile, 'utf8'));
  console.log('--- JSON 顶层键:', Object.keys(raw));
  console.log('--- nodes 键数:', Object.keys(raw.nodes || {}).length);
  const nonEmpty = Object.entries(raw.nodes || {}).filter(([k, v]) => Array.isArray(v) && v.length > 0);
  console.log('--- nodes 非空数组数:', nonEmpty.length);
  console.log('--- nodes 前5键:', Object.keys(raw.nodes || {}).slice(0, 5));
  console.log('--- 首节点值类型:', Array.isArray(raw.nodes) ? 'ARRAY!' : typeof raw.nodes);
  console.log('--- metadata:', JSON.stringify(raw.metadata || {}).slice(0, 200));
}
console.log('--- la.graph nodes 键数:', Object.keys(la.graph.nodes || {}).length);
const nonEmptyLa = Object.entries(la.graph.nodes || {}).filter(([k, v]) => Array.isArray(v) && v.length > 0);
console.log('--- la.graph nodes 非空数组数:', nonEmptyLa.length);
console.log('--- la.bridgeStats:', JSON.stringify(la.bridgeStats || null).slice(0, 300));
console.log('--- la.bridgeResult:', JSON.stringify(la.bridgeResult || null).slice(0, 300));
if (nonEmptyLa.length > 0) {
  console.log('--- 示例非空键:', nonEmptyLa.slice(0, 5).map(([k, v]) => k + '(' + v.length + ')'));
}

// 单步测：直接对英文词跑 getAssociations
const g1 = la.getAssociations('revenue', {});
console.log('--- getAssociations("revenue") n:', g1.associations.length, 'totalCandidates:', g1.totalCandidates);
const g2 = la.getAssociations('心', {});
console.log('--- getAssociations("心") n:', g2.associations.length, 'totalCandidates:', g2.totalCandidates);
process.exit(0);
