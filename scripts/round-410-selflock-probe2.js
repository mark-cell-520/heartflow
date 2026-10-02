#!/usr/bin/env node
/** r410 探针 2：failed=3 时具体是哪几条断言挂、报什么 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, 'data/test-count.json');
const original = fs.readFileSync(CACHE, 'utf8');
const j = JSON.parse(original);
try {
  j.failed = 3;
  fs.writeFileSync(CACHE, JSON.stringify(j, null, 2));
  const r = cp.spawnSync('node', [path.join(ROOT, 'test/doc-numbers-accuracy.test.js')],
    { cwd: ROOT, encoding: 'utf8', timeout: 180000 });
  const out = (r.stdout || '') + (r.stderr || '');
  console.log(out.split('\n').filter(l =>
    /✗|✖|规格表 Test suite|测试数匹配|失败|Error/.test(l)
  ).slice(0, 20).join('\n'));
} finally {
  fs.writeFileSync(CACHE, original);
}
