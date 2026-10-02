// r413 目标缺口英文侧全量探针：确认「责任主体缺位族」在英文侧真实存在
// 且现有英文 VAGUE_PATTERNS 完全没有覆盖。输出只报数字与形状，不贴原文。
const { gate } = require('../src/gate.js');

function action(t) {
  try { const r = gate(t); return (r.gate && r.gate.action) || 'pass'; }
  catch (e) { return 'ERR'; }
}

// 形状族：责任主体缺位（机构代词 + 模糊动作），中文侧 r411 已补、英文侧未补
const FAMILY = [
  'The relevant department is looking into this issue.',
  'The relevant authorities have yet to respond.',
  'A related department is currently reviewing it.',
  'Officials are investigating.',
  'The responsible department is still looking into it.',
  'Relevant authorities have yet to give an explanation.',
  'The department concerned is handling the case.',
  'Authorities are studying the matter.',
];
// 对照组：中文侧同族（r411 判据，应 4/4 verify）
const CTRL_ZH = [
  '相关部门正在研究这个问题',
  '相关负责人表示正在研究',
];

const famR = FAMILY.map(action);
const ctrlR = CTRL_ZH.map(action);
console.log('英文族命中: ' + famR.filter(a => a !== 'pass').length + '/' + FAMILY.length);
console.log('英文族动作: ' + famR.join(','));
console.log('中文对照命中: ' + ctrlR.filter(a => a !== 'pass').length + '/' + CTRL_ZH.length);
console.log('中文对照动作: ' + ctrlR.join(','));

// 良性分界线样本（改后必须仍 pass）
const BENIGN = [
  'Please submit the documents to the relevant department.',
  'The department replies were published yesterday.',
  'This matter has been transferred to the relevant department and a receipt was issued.',
  'Contact details for the relevant department are on the official website.',
  'The relevant departments annual report lists three violations.',
];
const benR = BENIGN.map(action);
console.log('良性基线: ' + benR.filter(a => a === 'pass').length + '/' + BENIGN.length + ' pass');
