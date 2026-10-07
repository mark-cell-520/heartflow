// [r610] 定性探针：1) boundaryNeg.assess 缺失 2) reviewProposal 返回体 3) 持久化状态污染
// 只打印形状，不引述任何攻击样本原文。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

const hf = new HeartFlow(ROOT);
hf.start();

console.log('--- 1) reviewProposal 返回体形状 ---');
const rep = hf.dispatch('sageGuardian.reviewProposal', { description: '优化心流体验的提升' }, {});
console.log('keys =', JSON.stringify(Object.keys(rep)));
console.log('passed =', typeof rep.passed, rep.passed);
console.log('violations =', typeof rep.violations, JSON.stringify(rep.violations));
console.log('checks.len =', Array.isArray(rep.checks) ? rep.checks.length : 'not-array');

console.log('--- 2) dispatch 空路由下的 reviewProposal 单参调用 ---');
try {
  const r1 = hf.dispatch('sageGuardian.reviewProposal', { description: '优化心流体验的提升' });
  console.log('单参返回 keys =', JSON.stringify(Object.keys(r1)), 'passed =', r1.passed);
} catch (e) {
  console.log('单参抛错:', e.message);
}

console.log('--- 3) ethics.check 现状 ---');
try {
  const ec = hf.ethics.check('普通文本');
  console.log('ethics.check ok =', JSON.stringify(ec));
} catch (e) {
  console.log('ethics.check 抛错:', e.message);
}
console.log('boundaryNeg keys =', JSON.stringify(Object.keys(hf.boundaryNeg || {})));

console.log('--- 4) sageGuardian 状态文件 ---');
const fs = require('fs');
const sf = path.join(ROOT, 'data/sage-guardian-state.json');
if (fs.existsSync(sf)) console.log('stateFile =', fs.readFileSync(sf, 'utf8'));
else console.log('stateFile 不存在:', sf);

console.log('--- 5) needsNegotiation 现有能力（拟接 assess 的底座） ---');
const bn = hf.boundaryNeg;
if (bn) {
  console.log('needsNegotiation("删除日志") =', JSON.stringify(bn.needsNegotiation('删除日志')));
  console.log('needsNegotiation("读取文件") =', JSON.stringify(bn.needsNegotiation('读取文件')));
  console.log('calculateRiskScore("删除日志") =', JSON.stringify(bn.calculateRiskScore('删除日志')));
}
