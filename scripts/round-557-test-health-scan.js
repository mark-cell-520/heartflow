#!/usr/bin/env node
/** r557：扫出裸跑时会崩的测试文件（describe/test/expect 未定义或其它 ReferenceError） */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const TDIR = path.join(__dirname, '..', 'test');
const files = fs.readdirSync(TDIR).filter(f => f.endsWith('.test.js') && f !== 'run-all.test.js');

const broken = [];
const timedOut = [];
let ok = 0;

for (const f of files) {
  let out = '', code = 0;
  try {
    const r = cp.spawnSync('node', [path.join(TDIR, f)], {
      encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024,
    });
    out = (r.stdout || '') + (r.stderr || '');
    code = r.status;
  } catch (e) { out = String(e.message); code = -1; }

  const hasSummary = /(\d+)\s*(?:通过|passed)\s*[/,]?\s*(\d+)\s*(?:失败|failed)/.test(out)
    || /^\s*PASS\b/m.test(out) || /^\s*SKIP\b/m.test(out);

  if (hasSummary && code === 0) { ok++; continue; }
  if (code === null) { timedOut.push(f); continue; }

  const errLine = out.split('\n').find(l => /ReferenceError|TypeError|SyntaxError|is not a function|Cannot find/.test(l));
  broken.push({ file: f, code, err: (errLine || out.split('\n')[0] || '').slice(0, 120) });
}

console.log(`扫描 ${files.length} 个测试文件：正常 ${ok}、超时 ${timedOut.length}、异常 ${broken.length}`);
if (timedOut.length) console.log(`\n[超时 ${timedOut.length}] ${timedOut.slice(0, 30).join(', ')}`);
if (broken.length) {
  console.log(`\n[异常 ${broken.length}]`);
  broken.forEach(b => console.log(`  ${b.file}  (exit ${b.code})  ${b.err}`));
}
