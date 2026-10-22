#!/usr/bin/env node
/* r572 诊断4：用桥接图内词汇验证五层链路是否真的通（只打印结构与计数） */
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const hf = new HeartFlow({ rootPath: ROOT, silent: true });
hf.start();
const ae = hf.associativeEngine;

// 句子里含桥接图高频词：代码 / 算法 / 函数 / 调试
const SENTENCES = [
  ['图内词句A', '代码里的函数调用算法时需要调试编译错误。'],
  ['图内词句B', '算法优化了代码结构，函数执行效率明显提升，调试时间减少。'],
  ['通用句C', '这个结论缺乏数据支撑，逻辑上跳跃太大。'],
];

(async () => {
  for (const [tag, s] of SENTENCES) {
    const r = await ae.process(s, {});
    const L = r.internal && r.internal.layers || {};
    const L1 = L.L1 || {};
    console.log(`[${tag}] L1 assoc=${(L1.allAssociations || []).length} ` +
      `L2 chunks=${(L.L2 && L.L2.chunks || []).length} ` +
      `L3 proto=${(L.L3 && L.L3.matchedPrototype) ? L.L3.matchedPrototype.name : 'null'} ` +
      `L4 concepts=${(((L.L4 || {}).thoughtVector || {}).activatedConcepts || []).length} ` +
      `L5 words=${(L.L5 || {}).wordCount} ` +
      `coh=${r.internal && r.internal.coherence ? r.internal.coherence.score : 'N/A'} ` +
      `issues=${r.internal && r.internal.coherence ? r.internal.coherence.issues.length : 'N/A'}`);
  }
  // coherence 空值判定：issues=0 是否等于「无矛盾可查」
  const r0 = await ae.process('这个结论缺乏数据支撑，逻辑上跳跃太大。', {});
  const c = r0.internal.coherence;
  console.log('--- 通用句 coherence:', JSON.stringify(c));
  console.log('--- 通用句 internal.thoughtLog len:', String(r0.internal.thoughtLog || '').length);
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
