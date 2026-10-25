const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const ex = require(path.join(ROOT, 'src/dev-exemptions.js'));
// 逐判据拆解：这条良性为什么现在 restore=false
const S = '日志先清一遍，等会儿重新打开验证一下。';
const tm = ex.RESTORE_PROMISE_TIME.test(S);
const wm = ex.RESTORE_WAIT_DONE.test(S);
const ev = ex.RESTORE_VERB.test(S);
console.log(JSON.stringify({ tm, wm, ev, restore: ex.isTemporaryRestorePromise(S) }));
