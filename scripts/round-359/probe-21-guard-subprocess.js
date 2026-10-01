// r359 probe-21：为什么守卫 P2 的 solo pe 模式 GREEN，而 probe-18 的 old 分支全 S1
// 差异排查：probe-18 直接改写 src/perfect-error.js 后 delete require.cache；
// 守卫的 solo-runner 是新起的子进程，理应能读到 disk 上的回退版本。
// 假设：restore() 在 find-not-unique 分支外的时序问题，或 PE 模块被
// src/index.js 的 _lazy 缓存持有另一份。逐项验证。
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const PE = path.join(ROOT, 'src/perfect-error.js');
const orig = fs.readFileSync(PE, 'utf8');

// 1) 手工回退 + 起子进程查（与守卫 solo 同构）
const oldBody = orig.replace('percent(?!age)[a-z]*', 'percent[a-z]*');
console.log('replace changed file:', oldBody !== orig);
fs.writeFileSync(PE, oldBody);
const sub = `'use strict';
const pe = require('${PE}');
const check = pe.checkPerfectError || pe;
for (const t of ['The deviation exceeds 3 percentage point beyond the agreed tolerance.']) {
  console.log('sub sees S1:', check(t).signals.some((s) => s.id === 'S1_false_precision'));
}`;
fs.writeFileSync(path.join(ROOT, 'scripts/round-359/_t.js'), sub);
console.log(execFileSync('node', [path.join(ROOT, 'scripts/round-359/_t.js')], { encoding: 'utf8' }).trim());
fs.unlinkSync(path.join(ROOT, 'scripts/round-359/_t.js'));
fs.writeFileSync(PE, orig);
console.log('restored, changed back:', fs.readFileSync(PE, 'utf8') === orig);
