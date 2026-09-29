// 第 218 轮诊断 25：精确复刻——把原测试文件的 1-75 行原样 + 引擎段，
// 但 ok() 里的用例体换成 trace 打点。用原文件字节切片，确保零改写。
const fs = require('fs');
const path = require('path');
const ORIG = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
const lines = ORIG.split('\n');
const head = lines.slice(0, 75).join('\n');  // 到 if(runEngine) 前
const TRACE = path.join(process.cwd(), '_dbg8.trace');
try { fs.unlinkSync(TRACE); } catch {}
const tail = `
const _T = (s) => { try { require('fs').appendFileSync(${JSON.stringify(TRACE)}, s + '\\n'); } catch {} };
_T('HEAD_DONE pass=' + pass);
if (runEngine) {
  _T('ENGINE_BRANCH');
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  _T('HF_NEW');
  (async () => {
    _T('IIFE');
    try {
      await hf.start();
      _T('STARTED');
    } catch (e) {
      _T('START_ERR ' + e.message);
      return finish();
    }
    const r = await hf.think('帮我看看这个方案有没有什么问题', { compact: false });
    _T('THOUGHT hasSV=' + !!r._selfVerification);
    finish();
  })();
} else {
  _T('SKIP');
  finish();
}
function finish2() {}
`;
const code = head + '\n' + tail + '\nfunction finish() {\n  console.log(`\\nsum: ' + '${pass} passed, ${fail} failed' + '`);\n  _T("FINISH");\n  process.exit(fail ? 1 : 0);\n}\n';
const out = path.join(process.cwd(), 'scripts/round-218/_diag12.test.js');
fs.writeFileSync(out, code);
console.log('WROTE ' + out + ' headLines=75');
