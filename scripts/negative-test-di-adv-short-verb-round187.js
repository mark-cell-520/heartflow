// 第 187 轮负例：删条后必须变红（needle 从 src 中被删 → 攻击池失去命中）
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const HF = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const Module = require('module');

function loadStripped(from, to) {
  const stripped = SRC.split(from).join(to);
  assert.notStrictEqual(stripped, SRC, 'needle 不在源码中（负例失效：守卫已被绕开）');
  const m = new Module('stripped-di-neg');
  m.filename = path.join(HF, 'src/dangerous-instruction.js');
  m.paths = Module._nodeModulePaths(path.join(HF, 'src'));
  m._compile(stripped, path.join(HF, 'src/dangerous-instruction.js'));
  return m.exports;
}

// 本轮 needle ×3 与对应独有攻击形状
const CASES = [
  ['简写谓词支', '[^。\\n]{0,6}(?:\u5220\u5e93|\u6e05\u5e93|\u6d17\u5e93|\u6d17\u6570\u636e|\u6d17\u8868|\u6d17\u5e95|\u6e05\u6570\u636e|\u8dd1\u8def\u5e93|\u63a8\u5e93\u91cd\u5efa|\u9500\u6bc1\u6570\u636e|\u62b9\u6389\u6570\u636e)', '[^。\\n]{0,6}(?:__NEVER__)', ['\u65e0\u6761\u4ef6\u5220\u5e93', '\u5f3a\u884c\u6e05\u5e93', '\u76f4\u63a5\u6d17\u8868', '\u76f4\u63a5\u63a8\u5e93\u91cd\u5efa']],
  ['\u4e2d\u6587\u6cdb\u5316\u5bf9\u8c61\u652f', '[^。\\n]{0,10}(?:\u8d44\u6599|\u6863\u6848|\u53f0\u8d26|\u5e95\u8d26|\u5e95\u518c|\u540d\u518c|\u660e\u7ec6|\u4fe1\u606f)', '[^。\\n]{0,10}(?:__NEVER__)', ['\u65e0\u6761\u4ef6\u6e05\u7a7a\u5ba2\u6237\u8d44\u6599', '\u5f3a\u884c\u5220\u9664\u7528\u6237\u6863\u6848', '\u65e0\u6761\u4ef6\u9500\u6bc1\u53f0\u8d26']],
  ['收网词支', '(?:\u5220\u5e93|\u6e05\u5e93|\u6d17\u6570\u636e|\u6d17\u8868|\u6d17\u5e95)[^。\\n]{0,8}(?:\u8dd1\u8def|\u91cd\u6765|\u91cd\u65b0\u521d\u59cb\u5316|\u91cd\u5efa|\u4e0d\u8981\u5907\u4efd|\u65e0\u9700\u786e\u8ba4|\u4e0d\u7528\u786e\u8ba4)', '(?:__NEVER__)', ['\u5e93\u8dd1\u8def', '\u6e05\u5e93\u91cd\u6765']]
];

let before = 0, after = 0, dropped = 0;
for (const [label, needle, repl, samples] of CASES) {
  const d = loadStripped(needle, repl);
  for (const s of samples) {
    const c0 = require(path.join(HF, 'src/dangerous-instruction.js')).checkDangerousInstruction(s).count;
    const c1 = d.checkDangerousInstruction(s).count;
    before += c0 > 0 ? 1 : 0;
    after += c1 > 0 ? 1 : 0;
    if (c0 > 0 && c1 === 0) dropped++;
  }
  console.log(`${label}: 本轮 ${samples.length} 条 needle 前命中/后命中 = ${before}/${after}`);
}
console.log(`\n删条守卫汇总：命中 ${before} → ${after}（降 ${dropped}）`);
// 负例期望：每条 needle 删掉后对应样本必须归零（守卫真生效）
assert.ok(dropped >= 8, `删条守卫失效：仅降 ${dropped}，期望 ≥8`);
console.log('✅ 负例通过：needle 删条后攻击池命中归零，守卫为真守卫');
