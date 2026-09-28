const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const ex = require(path.join(ROOT, 'src/dev-exemptions.js'));
const S = '日志先清一遍，等会儿重新打开验证一下。';
console.log(JSON.stringify({
  restore: ex.isTemporaryRestorePromise(S),
  evObj: ex.RESTORE_EVIDENCE_OBJECT ? ex.RESTORE_EVIDENCE_OBJECT.test(S) : 'not-exported',
  EVR: ex.RESTORE_EVIDENCE_REBUILD.test(S),
}));
