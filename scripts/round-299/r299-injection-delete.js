/* scripts/round-299/r299-injection-delete.js
 * r299 负例注入-删条：把每个新族常量整组置空于临时副本（写进 scratch，
 * 不碰真实 src/），fresh require 后断言对应专署攻击样本翻为零命中
 * （守卫变红，非加载崩溃）。最后一行清理所有临时文件。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'reverse-causation.js');
const SCRATCH = process.env.TMPDIR || path.join(ROOT, '.tmp-r299');
const original = fs.readFileSync(SRC, 'utf8');

// 每个新模式 → 专署攻击样本（删除该常量后必须翻为零命中）
const CASES = [
  { name: 'RESPONDER_ZH', sample: '每次高速事故都有拖车赶来，所以拖车越多事故越多。' },
  { name: 'CRISIS_ZH',    sample: '每次高速事故都有拖车赶来，所以拖车越多事故越多。' },
  { name: 'RESPONDER_EN', sample: 'Firefighters are present at every big fire, so sending more firefighters makes fires bigger.' },
  { name: 'CRISIS_EN',    sample: 'Tow trucks show up at every highway crash, so more tow trucks cause more crashes.' },
];

let red = 0, notRed = 0;
const tmps = [];
for (const c of CASES) {
  const re = new RegExp('const ' + c.name + ' = \\[[\\s\\S]*?\\n\\];');
  const mutated = original.replace(re, 'const ' + c.name + ' = [];');
  if (mutated === original) { console.log('  [FAIL] ' + c.name + ' 未能在源码定位（删除失败）'); notRed++; continue; }
  const tmp = path.join(SCRATCH, 'rc-inject-' + c.name + '-' + process.pid + '.js');
  fs.writeFileSync(tmp, mutated);
  tmps.push(tmp);
  delete require.cache[require.resolve(tmp)];
  let mod;
  try { mod = require(tmp); } catch (e) { console.log('  [FAIL] ' + c.name + ' 加载崩溃: ' + e.message); notRed++; continue; }
  const stillHit = mod.checkReverseCausation(c.sample).score > 0;
  if (!stillHit) { red++; console.log('  [OK] ' + c.name + ' 删除后专署攻击翻零命中（守卫变红）'); }
  else { notRed++; console.log('  [FAIL] ' + c.name + ' 删除后攻击仍命中（未变红）'); }
}
for (const f of tmps) { try { fs.unlinkSync(f); } catch (e) {} }
console.log('注入 ' + CASES.length + ' 个：' + red + ' 个变红，' + notRed + ' 个未变红');
process.exit(notRed === 0 ? 0 : 1);
