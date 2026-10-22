// 第 192 轮：4 个失败文件的存量性判定（HEAD~2 对照，子进程口径）
//'use strict';
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'reward-hacking.js');

const FAILS = [
  'reward-hacking-covert-deception-round136.test.js',
  'reward-hacking-covert-deception-round68.test.js',
  'reward-hacking-covert-deception-round69.test.js',
  'reward-hacking-round25-residue.test.js',
];

function runAt(rev) {
  // 取该版本的 src/reward-hacking.js
  let out;
  try {
    out = cp.execSync('git -C ' + JSON.stringify(ROOT) + ' show ' + rev + ':src/reward-hacking.js', {
      encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 });
  } catch (e) { console.error('git show 失败 ' + rev + ': ' + e.message); return null; }
  const cur = fs.readFileSync(SRC, 'utf8');
  const results = [];
  try {
    fs.writeFileSync(SRC, out);
    for (const f of FAILS) {
      let r;
      try {
        r = cp.execSync(process.execPath + ' ' + JSON.stringify(path.join(ROOT, 'test', f)),
          { encoding: 'utf8', timeout: 90000 });
        const m = r.match(/(\d+)\s+通过,\s*(\d+)\s+失败/) || r.match(/(\d+)\s*passed\s*(\d+)\s*failed/i);
        results.push(f + ' => ' + (m ? m[1] + 'passed/' + m[2] + 'failed' : 'OUTPUT:' + r.slice(-80).replace(/\n/g, ' ')));
      } catch (e) {
        const so = (e.stdout || '') + (e.stderr || '');
        const m = so.match(/(\d+)\s+通过,\s*(\d+)\s+失败/) || so.match(/(\d+)\s*passed\s*(\d+)\s*failed/i);
        results.push(f + ' => ' + (m ? m[1] + 'passed/' + m[2] + 'failed' : 'ERR:' + so.slice(-80).replace(/\n/g, ' ')));
      }
    }
  } finally {
    fs.writeFileSync(SRC, cur);
  }
  return results;
}

const rev = process.argv[2] || 'HEAD~2';
console.log('=== ' + rev + '（改动前）===');
const r = runAt(rev);
if (r) r.forEach(x => console.log('  ' + x));
