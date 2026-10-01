// r359 probe-20b：把 r358 的探针复制进父工作树后复跑（探针未入库所以父树上没有）
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PARENT = '/tmp/r359-parent';

const PROBES = [
  'scripts/round-358/probe-1-en-numeric-diff.js',
  'scripts/round-358/probe-7-extended.js',
];
for (const p of PROBES) {
  const src = fs.readFileSync(path.join(ROOT, p), 'utf8');
  fs.writeFileSync(path.join(PARENT, p), src);
  const out = execFileSync('node', [p], { cwd: PARENT, encoding: 'utf8' });
  console.log(`── ${p} (parent cc7eedb5) ──`);
  console.log(out.trim());
}
