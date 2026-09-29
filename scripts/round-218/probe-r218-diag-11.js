// 第 218 轮诊断 17（决）：直接在原测试文件里最小植入 ——
// 只把 5 个同步 ok() 换成 appendFileSync 顺序打点，看哪一条后 start 就停。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
// 在原 sync ok() 调用之前插入一个打点，之后立即再来一个
const out2 = src.replace(
  "const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));",
  `const { DecisionRouter } = require(path.join(ROOT, 'src/core/decision-router.js'));
const _T = (s) => { try { require('fs').appendFileSync(process.cwd() + '/_dbg.trace', s + '\\n'); } catch {} };
_T('AFTER_REQUIRE_DR');`);
// 在 IIFE 的 start 前后
const out3 = out2
  .replace('  (async () => {\n    try {\n      await hf.start();',
           '  (async () => {\n    _T("IIFE_ENTER");\n    try {\n      _T("PRE_START");\n      await hf.start();\n      _T("POST_START");')
  .replace("    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });",
           '    _T("PRE_THINK");\n    const r = await hf.think(\'帮我看看这个方案有没有什么问题\', { compact: false });\n    _T("POST_THINK");')
  .replace(/process\.exit\(fail \? 1 : 0\);/, '_T("FINISH"); process.exit(0);');
const tmp = path.join(process.cwd(), 'scripts/round-218/_diag11.test.js');
fs.writeFileSync(tmp, out3);
console.log('WROTE ' + tmp);
