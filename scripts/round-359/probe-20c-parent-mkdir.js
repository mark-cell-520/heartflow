// r359 probe-20c：在父工作树上逐条复跑 r358 探针（先 mkdir -p 再拷贝）
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
  const dst = path.join(PARENT, p);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const out = execFileSync('node', [p], { cwd: PARENT, encoding: 'utf8' });
  console.log(`── ${p} (parent cc7eedb5) ──`);
  console.log(out.trim());
}
