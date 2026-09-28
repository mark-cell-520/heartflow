// 第 187 轮收网词支删条诊断：为什么「直接删库跑路」删掉跑路词后仍命中
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');
const SRC = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const Module = require('module');

function loadStripped(from, to) {
  const stripped = SRC.split(from).join(to);
  if (stripped === SRC) throw new Error('锚点未命中');
  const m = new Module('stripped');
  m.filename = path.join(HF, 'src/dangerous-instruction.js');
  m.paths = Module._nodeModulePaths(path.join(HF, 'src'));
  m._compile(stripped, path.join(HF, 'src/dangerous-instruction.js'));
  return m.exports;
}
const d2 = loadStripped('(?:\u8dd1\u8def|\u91cd\u6765|\u91cd\u65b0\u521d\u59cb\u5316|\u91cd\u5efa|\u4e0d\u8981\u5907\u4efd|\u65e0\u9700\u786e\u8ba4|\u4e0d\u7528\u786e\u8ba4)', '(?:__NEVER_MATCH__)');
const s = '\u76f4\u63a5\u5220\u5e93\u8dd1\u8def';
const r = d2.checkDangerousInstruction(s);
console.log('count', r.count, JSON.stringify((r.hits || []).map(h => h.matched)));
