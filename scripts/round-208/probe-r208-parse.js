'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const out = execFileSync(process.execPath,
  [path.join(ROOT, 'test', 'dangerous-instruction-cleanup-verb-diff3-round208.test.js')],
  { encoding: 'utf8' });
const m = out.match(/(\d+)\s*(?:通过|passed)\s*[,/]?\s*(\d+)\s*(?:失败|failed)/);
console.log('run-all 解析模拟:', m ? `通过=${m[1]} 失败=${m[2]}` : 'PARSE_FAIL（仍会隐形）');
