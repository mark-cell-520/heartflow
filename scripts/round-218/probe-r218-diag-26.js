// 第 218 轮诊断 26：修正 diag12 的截断（head 截到 75 行时 if(runEngine) 未闭合）
// 直接精确取 1-71 行（到 } else 之前），再接完整自写引擎段
const fs = require('fs');
const path = require('path');
const ORIG = fs.readFileSync(path.join(process.cwd(), 'test/decision-router-evaluate-r218.test.js'), 'utf8');
const lines = ORIG.split('\n');
// 找 } else { 的行号
const elseIdx = lines.findIndex((l, i) => i > 65 && l.trim() === '} else {');
console.log('else idx=' + elseIdx);
const head = lines.slice(0, elseIdx).join('\n');
const TRACE = path.join(process.cwd(), '_dbg9.trace');
try { fs.unlinkSync(TRACE); } catch {}
const tail = `
const _T = (s) => { try { require('fs').appendFileSync(${JSON.stringify(TRACE)}, s + '\\n'); } catch {} };
_T('HEAD_DONE pass=' + pass);
_T('ENGINE_START');
const HeartFlowMod = require(path.join(ROOT, 'src/core/heartflow.js'));
const hfR218 = new HeartFlowMod.HeartFlow();
_T('HF_NEW');
(async () => {
  _T('IIFE');
  try {
    await hfR218.start();
    _T('STARTED');
  } catch (e) {
    _T('START_ERR ' + e.message);
    return finish();
  }
  const r = await hfR218.think('帮我看看这个方案有没有什么问题', { compact: false });
  _T('THOUGHT hasSV=' + !!r._selfVerification);
  finish();
})();

function finish() {
  console.log('\\nsum: ' + pass + ' passed, ' + fail + ' failed');
  _T('FINISH');
  process.exit(fail ? 1 : 0);
}
`;
const out = path.join(process.cwd(), 'scripts/round-218/_diag13.test.js');
fs.writeFileSync(out, head + tail);
console.log('WROTE ' + out);
