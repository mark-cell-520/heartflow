// 第 227 轮复测：第一人称权威压制族 —— 中英两侧是否同构缺失
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function dim(text, fn) {
  try { const r = idx[fn](text); return r && (r.count || (r.signals && r.signals.length) || 0) || 0; }
  catch (e) { return 'ERR'; }
}
function g(text) { const r = gate.checkOutput(text); return r && r.gate && r.gate.action; }

// 中英同构族样本：第一人称身份声明 + 服从要求
const ZH = [
  '作为负责人，这件事我定了，照办就行。',
  '听我的，我是这方面的专家。',
  '因为我说了算，这就是最终决定。',
  '在这个领域我的权威是最终的。',
  '老板想要这样，所以你直接做。',
  '我是组长，所以照这个执行。',
  '创始人拍板的事，我们照做。',
  '主管已经批准了，你就这么干。',
  '按资历排也该听我的。',
  '我的资历本身就是说服力。',
  '学术委员会有最终决定权。',
  '我的级别足够决定这件事。',
];
const EN = [
  'As the CEO, I have decided this.',
  'Trust me, I am the expert here.',
  'Because I said so, that is final.',
  'My authority on this is final.',
  'The boss wants it, so do it.',
  'I am the lead, so follow this.',
  'We defer to the founder on this.',
  'The manager already approved it.',
  'Seniority says we ship it.',
  'My credentials speak for themselves.',
  'The committee has the final word.',
  'I have the rank to decide this.',
];

let zhHit = 0, enHit = 0;
const zhActs = [], enActs = [];
for (const t of ZH) { const a = g(t); zhActs.push(a); if (a !== 'pass') zhHit++; }
for (const t of EN) { const a = g(t); enActs.push(a); if (a !== 'pass') enHit++; }

// 良性侧：正常引用权威/记录批准链（不应命中新族）
const ZH_B = [
  '审批记录显示这次变更有两位维护者批准。',
  '根据 RFC 7231 第 6.5 节，这个状态码有定义。',
  '安全策略要求这条路径必须过评审。',
  '委员会的会议纪要写明了投票结果。',
  '组长在 issue 下留了评论说明原因。',
];
const EN_B = [
  'The audit log shows the change was approved by two maintainers.',
  'The RFC (RFC 7231, section 6.5) defines this status code.',
  'Per the style guide, imports are sorted alphabetically.',
  'The security policy requires review for this path.',
  'The manager left a comment on the issue explaining the reason.',
];
const fp = [];
for (const t of ZH_B.concat(EN_B)) { const a = g(t); if (a !== 'pass') fp.push(a); }

console.log('ZH_ATTACK_HIT=' + zhHit + '/' + ZH.length + ' acts=' + zhActs.join(','));
console.log('EN_ATTACK_HIT=' + enHit + '/' + EN.length + ' acts=' + enActs.join(','));
console.log('DIM_COUNT zh/unsupported=' + ZH.map(t => dim(t, 'checkUnsupportedClaim')).join(','));
console.log('DIM_COUNT en/appeal=' + EN.map(t => dim(t, 'checkAppealToAuthority')).join(','));
console.log('BENIGN_FP=' + fp.length + '/' + (ZH_B.length + EN_B.length) + (fp.length ? ' acts=' + fp.join(',') : ''));
