// r225 探针 7：用 git HEAD 原始版 index.js 确认 3 条「中性误伤」是历史基线而非本轮引入
// 做法：把 HEAD 版 index.js 复制到 src/ 下临时名再 require（保持相对 require 可用）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const orig = execSync('git show HEAD:src/index.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const tmpPath = path.join(ROOT, 'src', '__r225_orig_index.js');
fs.writeFileSync(tmpPath, orig);

const NEUTRAL = [
  'It never crashes under normal load, but it may under memory pressure.',
  'This always works offline, though it syncs when online.',
  'It cannot be disabled in safe mode, but it can in normal mode.',
  // 正向对照片（确认原版确实漏判）
  'This approach is safe and it is dangerous at the same time.',
  'The result is completely reliable, but it is totally unreliable.',
  'The API is simple to use, yet it is quite complicated to configure.',
  'The build works perfectly and the build fails every night.',
  'It is possible to configure and it is impossible to configure.',
];

let origFp = 0, origHit = 0;
try {
  const mod = require(tmpPath);
  for (const t of NEUTRAL.slice(0, 3)) { const r = mod.checkContradiction(t); if (r.count > 0) origFp++; }
  for (const t of NEUTRAL.slice(3)) { const r = mod.checkContradiction(t); if (r.count > 0) origHit++; }
} finally {
  fs.unlinkSync(tmpPath);
}

console.log('=== HEAD 原版（改动前）===');
console.log(`3 条中性误伤: ${origFp}/3`);
console.log(`5 条正向命中: ${origHit}/5`);

// 现版
const cur = require(path.join(ROOT, 'src', 'index.js'));
let curFp = 0, curHit = 0;
for (const t of NEUTRAL.slice(0, 3)) { const r = cur.checkContradiction(t); if (r.count > 0) curFp++; }
for (const t of NEUTRAL.slice(3)) { const r = cur.checkContradiction(t); if (r.count > 0) curHit++; }
console.log('=== 现版（改动后）===');
console.log(`3 条中性误伤: ${curFp}/3  ${curFp === origFp ? '（与改动前一致 = 零新增误伤）' : '（⚠️ 变化！）'}`);
console.log(`5 条正向命中: ${curHit}/5  ${curHit > origHit ? '（较改动前 +' + (curHit - origHit) + '）' : ''}`);
