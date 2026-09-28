const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
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
