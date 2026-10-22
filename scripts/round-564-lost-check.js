'use strict';
// [r564] 确认 LOST 行只是键加引号，内容未变。
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const before = cp.execSync('git show HEAD~1:src/index.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const after = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const grab = (t, key) => {
  const re = new RegExp(key + "\\s*:\\s*'([^']{20,})'");
  const m = t.match(re);
  return m ? m[1] : null;
};
const b = grab(before, 'crisis_exceptionalism');
const a = grab(after, "'crisis_exceptionalism'");
console.log('before 长度:', b ? b.length : null);
console.log('after  长度:', a ? a.length : null);
console.log('内容完全一致:', b === a);
