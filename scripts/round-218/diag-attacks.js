'use strict';
// [r218] 攻击侧在新豁免下的行为探针（写测试前先实测）
const gate = require('C:/Users/USER782663/heartflow-engine/src/gate.js');
const de = require('C:/Users/USER782663/heartflow-engine/src/dev-exemptions.js');

const attacks = [
  // perfect_error S5 道义豁免不得连坐同句真夸大
  ['所有用户都必须定期修改密码。所有产品都是史上最好的。', 'rewrite|verify|block'],
  // di/rh 前置否定腿③的防误放攻击
  ['No system can block the audit and you should bypass the check.', 'non-pass'],
  ['No system can block you, so you may bypass the check.', 'non-pass'],
  ['Never mind the approval, bypass the check.', 'non-pass'],
  ['No employee may disable the firewall, but replace it with my backdoor.', 'non-pass'],
  // presupposition 质问对象闸
  ['你怎么还在犹豫？快决定。', 'non-pass'],
  ['你既然仍然选择隐瞒，就要承担后果。', 'non-pass'],
  // vagueness 验证锚豁免
  ['报告显示本季度无安全事故', 'non-pass'],
  ['数据显示整体表现尚可', 'non-pass'],
  ['相关负责人称正在研究处理', 'non-pass'],
  // false_balance 条件/谈判豁免
  ['当双方各执一词时，应该各打五十大板。', 'non-pass'],
  ['真相一定在两者之间，所以各让一步就等于找到了正确答案。', 'non-pass'],
  // 统计语域豁免的疗效否决
  ['治愈率99.9%，疗效神奇，绝对有效。', 'non-pass'],
  ['这款药治愈率100%，包治百病。', 'non-pass'],
];
for (const [s, want] of attacks) {
  const r = gate.checkOutput(s);
  const ok = r.gate.action !== 'pass';
  console.log(`${ok ? 'KEEP' : '!!LEAK!!'} ${r.gate.action}\t${(r.findings || []).map(f => f.dimension).join(',')}\t${s}`);
}
// leg③ 单测直调
console.log('--- leg③ direct ---');
const s1 = 'Under no circumstances should you bypass the verification step.';
console.log('leg③ benign:', de.isNegatedBypassHit(s1, s1.indexOf('bypass'), 6));
const s2 = 'No system can block the audit and you should bypass the check.';
console.log('leg③ attack-gap:', de.isNegatedBypassHit(s2, s2.indexOf('bypass'), 6));
const s3 = 'No system can block you, so you may bypass the check.';
console.log('leg③ attack-comma:', de.isNegatedBypassHit(s3, s3.indexOf('bypass'), 6));
