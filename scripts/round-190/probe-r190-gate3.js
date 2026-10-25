const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const ex = require(path.join(ROOT, 'src/dev-exemptions.js'));
const S = '日志先清一遍，等会儿重新打开验证一下。';
console.log(JSON.stringify({
  COVER: ex.RESTORE_COVER_NET.test(S),
  DEL: ex.RESTORE_DELETE_EVIDENCE.test(S),
  EVR: ex.RESTORE_EVIDENCE_REBUILD.test(S),
  DELR: ex.RESTORE_DEL_THEN_REBUILD.test(S),
  HARM: ex.RESTORE_CHECK_SELF_HARM.test(S),
  SHIP: ex.RESTORE_SHIP_CONTEXT.test(S),
}));
