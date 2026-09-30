/**
 * 第 291 轮探针 5：定位「维度命中但 findings=pass」的真实分叉点。
 * 失败样本在两个入口表现不同（discriminate 直调 verify / checkOutput pass），
 * 差异只能在传入 mode 或 evidence 上。这里逐项拆。
 * 只打印数字与结构，不贴样本。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const idx = require(path.join(ROOT, 'src', 'index.js'));
const ped = require(path.join(ROOT, 'src', 'pedagogy.js'));

const S = '幸福不是拥有得多，而是计较得少。';

console.log('== discriminate 的三种调用形态 ==');
console.log('A. 无 mode      :', JSON.stringify(idx.discriminate(S).gate));
console.log('B. pedagogical  :', JSON.stringify(idx.discriminate(S, [], 'pedagogical').gate));
console.log('C. findings数   :', idx.discriminate(S).findings.length, '/', idx.discriminate(S, [], 'pedagogical').findings.length);

console.log('== pedagogy 信号为何出现 ==');
const p = ped.detectPedagogicalContent(S);
console.log('  pedagogy.score =', p.score);
// 手动拆解 8 个信号
const signals = {
  hasCommandList: /(?:^|\n)\s*▸\s*\/[a-zA-Z]+\s+[^\n]+/.test(S) || /\b\/reset\b|\/clear\b|\/memory\b|\/skill\b/.test(S) || /(?:^|\n)\s*▸\s*(?:Step\s*\d|操作\s*\d|Q:|A:)/.test(S),
  hasConfigExample: /(?:app_id|app_secret|api_key|base_url)\s*[:=]/.test(S) && /cli_[a-z0-9]+|xxxx/i.test(S),
  hasTechPaths: /\/etc\/shadow|\/root\/\.ssh|\/root\/projects/.test(S),
  hasQAPattern: /\n\s*Q[:：]/.test(S) || /\n\s*A[:：]/.test(S),
  hasCapabilityCompare: /Hermes (?:的优势|的局限|vs|对比)/.test(S) || /优势[^\n]*局限/.test(S),
  hasMisconceptionSection: /误解\s*\d/.test(S) || /事实[：:]/.test(S),
  hasMisconceptionPair: /误解[^。]{0,30}事实/.test(S) || /误解[^。]{0,30}纠正/.test(S),
  hasClassroomStructure: /本节课目标|核心术语|常见错误|实战案例|检查清单|下一步行动|课程总结|课后作业|操作\s*\d|Step\s*\d/i.test(S),
};
console.log('  各信号 =', JSON.stringify(signals));

console.log('== gate.action 由什么决定（VERIFY_DIMS 判定）==');
// 直接看 gate 的 reason
const d1 = idx.discriminate(S);
const d2 = idx.discriminate(S, [], 'pedagogical');
console.log('  no-mode   reason =', d1.gate.reason, '| score =', d1.overallScore, '| pp.score =', d1.dimensions && d1.dimensions.pseudo_profundity && d1.dimensions.pseudo_profundity.score);
console.log('  pedagogic reason =', d2.gate.reason, '| score =', d2.overallScore, '| pp.score =', d2.dimensions && d2.dimensions.pseudo_profundity && d2.dimensions.pseudo_profundity.score);
