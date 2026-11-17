'use strict';
// r381 存量 econ 轮测复跑（r379 教训：feat 后必须确认存量 econ 轮测零红）。
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(path.join(ROOT, 'test'))
  .filter(f => /^round-\d+.*\.(test\.)?js$/.test(f) && f !== 'round-381-lump-of-labor.test.js')
  .filter(f => {
    const c = fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
    return /econ-reasoning-gate|econ-reasoning-check|lump-of-labor/.test(c);
  })
  .sort();
let fail = 0;
for (const f of files) {
  try {
    const out = execFileSync('node', ['--test', path.join('test', f)], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    const m = out.match(/# fail (\d+)/);
    console.log((m && Number(m[1]) > 0 ? 'FAIL ' : 'ok   ') + f);
    if (m && Number(m[1]) > 0) { fail++; console.log(out.split('\n').filter(l => /not ok|fail/.test(l)).slice(0, 8).join('\n')); }
  } catch (e) {
    fail++;
    console.log('FAIL(exit) ' + f);
    const out = (e.stdout || '') + (e.stderr || '');
    console.log(out.split('\n').filter(l => /not ok|Error/.test(l)).slice(0, 8).join('\n'));
  }
}
console.log('存量 econ 轮测：' + files.length + ' 个文件，fail ' + fail);
