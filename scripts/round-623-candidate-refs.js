#!/usr/bin/env node
/* r623 候选存活度/路由现状实测 -- 判断 4 个候选是死文件还是真未接线能力 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const CANDS = [
  'src/core/confidence-annotator.js',
  'src/reasoning/claim-extractor.js',
  'src/shield/wake-up-verifier.js',
  'src/memory/semantic-anchor.js',
  'src/emotion/deep-emotion.js',
  'src/cortex/metacognitive-reward.js',
  'src/report/report-generator.js',
  'src/cortex/meta-engine.js',
  'src/cortex/experience-replay.js',
  'src/workflow/task-pipeline.js',
];

function countRef(pat) {
  // 全仓引用计数（排除自身文件）
  let n = 0, files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'archive' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) files.push(p);
    }
  };
  walk(ROOT);
  for (const f of files) {
    if (f === path.join(ROOT, 'src', 'heartflow-api-server.js')) continue;
    const t = fs.readFileSync(f, 'utf8');
    const re = new RegExp(pat, 'g');
    const c = (t.match(re) || []).length;
    if (c > 0) { n += c; if (files.length) { /* noop */ } }
    if (c > 0) global.__HITS = global.__HITS || {}, global.__HITS[f] = c;
  }
  return n;
}

const out = [];
for (const c of CANDS) {
  const abs = path.join(ROOT, c);
  if (!fs.existsSync(abs)) { out.push({ file: c, exists: false }); continue; }
  const cls = (fs.readFileSync(abs, 'utf8').match(/class\s+([A-Z][A-Za-z0-9_]*)/) || [])[1] || '(none)';
  // basename require 引用
  const base = path.basename(c, '.js');
  const nReq = countRef(new RegExp("require\\(['\\\"][^'\\\"]*" + base + "(\\.js)?['\\\"]\\)", 'g'));
  const nCls = cls === '(none)' ? 0 : countRef(new RegExp('\\b' + cls + '\\b', 'g'));
  const hits = Object.keys(global.__HITS || {});
  global.__HITS = {};
  out.push({
    file: c, exists: true, cls,
    require_refs: nReq,
    class_refs: nCls,
    ref_files: hits.map(h => path.relative(ROOT, h)),
  });
}

console.log(JSON.stringify(out, null, 2));
