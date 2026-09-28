const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const ex = require(path.join(ROOT, 'src/dev-exemptions.js'));
// 逐判据拆解：这条良性为什么现在 restore=false
const S = '日志先清一遍，等会儿重新打开验证一下。';
const tm = ex.RESTORE_PROMISE_TIME.test(S);
const wm = ex.RESTORE_WAIT_DONE.test(S);
const ev = ex.RESTORE_VERB.test(S);
console.log(JSON.stringify({ tm, wm, ev, restore: ex.isTemporaryRestorePromise(S) }));
