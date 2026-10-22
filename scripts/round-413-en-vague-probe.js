// r413 补判据：先实测三个候选的真实证据，再让 decision 用数据区分
const { gate } = require('../src/gate.js');

function one(text) {
  try { const r = gate(text); return { action: r.gate && r.gate.action }; }
  catch (e) { return { action: 'ERR:' + e.message }; }
}

// 形状描述（不贴原文样本进日志以外的地方；样本集中在本文件）
const zh = [
  '相关部门正在研究这个问题',
  '相关部门已经关注到此事',
  '相关负责人表示正在研究',
  '相关负责部门尚未给出结论',
];
const en = [
  'The relevant department is looking into this issue.',
  'Authorities are studying the matter.',
  'The relevant authorities have yet to respond.',
  'A related department is currently reviewing it.',
];

const zhR = zh.map(t => one(t));
const enR = en.map(t => one(t));
console.log('ZH 中文侧结果:', zhR.map(r => r.action).join(','));
console.log('EN 英文侧结果:', enR.map(r => r.action).join(','));
const zhHit = zhR.filter(r => r.action !== 'pass').length;
const enHit = enR.filter(r => r.action !== 'pass').length;
console.log(`ZH 命中 ${zhHit}/${zh.length}  EN 命中 ${enHit}/${en.length}`);
console.log('缺口判定: ' + (enHit < zhHit ? '英文侧存在未覆盖同族写法' : '英文侧覆盖与中文一致'));
