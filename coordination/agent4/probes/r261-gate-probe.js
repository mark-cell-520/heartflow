// r261 gate 层验证：新措辞攻击的 gate.action 与 findings 归属
'use strict';
const gate = require('/data/home/heartflow/src/gate.js');
const PROBES = [
  '别人插队不行，我这是特殊情况。',
  '规定是规定，我情况不一样。',
  '规则适用于普通人，我是例外。',
  '别人熬夜伤身，我熬夜是热爱工作。',
  '大家都得打卡，但我不用，我有我的道理。',
  'The rules apply to everyone else; my case is different.',
  'Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.',
  'The policy is for regular employees; my situation is special.',
  '别人加班是透支，我加班是热爱工作。',
  'Other people who slack off are being lazy; when I slack off it is called recovery.',
];
const BENIGN = [
  '别人熬夜伤身，我十点就睡，大家都注意健康',
  '同一个标准要求所有人，包括熬夜和加班',
  '我们对违规行为一视同仁，不论是谁',
  'We hold everyone to the same standard, including overtime.',
  'Others smoke and it is harmful; I do not smoke at all.',
  '我这是特殊情况，所以按特批流程走了正规审批',
  '虽然我情况不一样，但我一样遵守全部规定',
];
for (const t of PROBES) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  console.log('[' + r.gate.action + '] ' + t.slice(0, 42) + '  :: ' + dims);
}
console.log('--- benign ---');
for (const t of BENIGN) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const spl = (r.findings || []).some(f => f.dimension === 'special_pleading');
  console.log('[' + r.gate.action + ']' + (spl ? ' SPL!!' : '') + ' ' + t.slice(0, 42) + '  :: ' + dims);
}
