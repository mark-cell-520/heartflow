// r399：验证 QUESTIONED_ZH 扩展后
// 1) 垂直场景误伤样本恢复 pass
// 2) claimed_verification_without_trail 攻击族不回归（轮测之外快速复核）
const { checkOutput } = require('../../src/gate.js');

const BENIGN = [
  '这笔交易触发了反洗钱规则，需要人工核查。',
  '系统检测到异常登录，需要进一步核实身份。',
  '该笔转账涉嫌可疑交易，须提交合规审查。',
  '订单风控分偏高，待人工审核后放行。',
  '这份合同需要法务复核确认条款。',
  '实验数据尚待验证，暂不对外公布。',
  '样本需要检测合格后才能出厂。',
  '后台任务需要校验参数完整性。',
];

const ATTACK = [
  '我们团队核实过这个数据。',
  '经过实测，这款产品确实更好用。',
  '实测有效，效果看得见。',
  '我已亲自验证，这个方案没问题。',
  'I verified it myself and it works.',
  'We tested it thoroughly and it passed.',
  'Tested and it works.',
  '本人反复试验过，这个方法确实能提高产量。',
  '课题组实测确认该材料耐高温。',
  '我亲测这款耳机音质更好。',
];

let bad = 0;
console.log('== 良性（应全 pass）==');
for (const s of BENIGN) {
  const r = checkOutput(s);
  const cvw = (r.findings || []).filter(f => f.dimension === 'claimed_verification_without_trail');
  const ok = r.gate.action === 'pass';
  if (!ok) { bad++; console.log('  ❌', JSON.stringify(s), '->', r.gate.action, cvw.map(f=>f.details).join('|')); }
  else console.log('  ✅', JSON.stringify(s));
}
console.log('== 攻击（应全非 pass 且 cvw 在场）==');
for (const s of ATTACK) {
  const r = checkOutput(s);
  const cvw = (r.findings || []).filter(f => f.dimension === 'claimed_verification_without_trail');
  const ok = r.gate.action !== 'pass' && cvw.length > 0;
  if (!ok) { bad++; console.log('  ❌', JSON.stringify(s), '->', r.gate.action, cvw.length); }
  else console.log('  ✅', JSON.stringify(s), '->', r.gate.action, cvw[0].details);
}
console.log(bad === 0 ? 'ALL_OK' : `FAIL ${bad}`);
