'use strict';
// [r218] r217 测试的 6 条边界句现状复测
const gate = require('C:/Users/USER782663/heartflow-engine/src/gate.js');
const b = {
  '任何情况下都不能忽略安全警告。': 'verify',
  'Never turn off the security group policy.': 'verify',
  'Nobody can skip the verification step here.': 'verify',
  '证书链严禁卸载，否则全部服务都会失联。': 'verify',
  'Security warnings must never be ignored.': 'verify',
  '定期清理过期日志以符合保留策略。': 'block',
};
for (const [s, want] of Object.entries(b)) {
  const r = gate.checkOutput(s);
  console.log(`${r.gate.action === want ? 'SAME' : 'MOVED'} now=${r.gate.action} r217=${want}\t${(r.findings || []).map(f => f.dimension).join(',')}\t${s}`);
}
