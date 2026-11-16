// 隔离测试 EN 分支正则
const pats = [
  String.raw`\bif\s+you\s+(?:really|truly)\s+(?:loved|cared)\b`,
  String.raw`\bonce\s+you\s+(?:prove|show|demonstrate|handle|finish|complete)\b`,
  String.raw`\bmaybe\s+you\s+should\s+find\s+(?:someone|somebody)\b`,
];
const s1 = 'If you really loved me, you would not need me to ask twice.';
const s2 = 'Once you prove you can handle this, we can talk about our future.';
const s3 = 'Maybe you should find someone who can put up with all of this.';
console.log('if-loved@1:', new RegExp(pats[0], 'i').test(s1));
console.log('once-prove@2:', new RegExp(pats[1], 'i').test(s2));
console.log('maybe-find@3:', new RegExp(pats[2], 'i').test(s3));
// 再看模块内 EN 分支原文是否被 String.raw 正确保留
const I = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/coercive-affection.js').__internals();
console.log('module CONDITION source 长度:', I.CONDITION_ZH.source.length);
console.log('module CONDITION 含 once:', I.CONDITION_ZH.source.includes('once'));
