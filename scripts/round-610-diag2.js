// [r610] 定位探针：reviewProposal 为何返回空对象（keys=[]），以及 checkValueAlignment 单参行为
// 只打印形状与布尔结论，不引述任何攻击样本原文。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

const hf = new HeartFlow(ROOT);
hf.start();

console.log('--- A) reviewProposal 直接（不经 dispatch）---');
const sg = hf._modules['sageGuardian'];
const direct = sg.reviewProposal({ description: '优化心流体验的提升' }, {});
console.log('typeof =', typeof direct, 'isPromise =', typeof direct.then === 'function');
if (direct && typeof direct.then === 'function') {
  direct.then(r => console.log('awaited keys =', JSON.stringify(Object.keys(r)), 'passed =', r.passed, 'checks =', r.checks.length));
}

console.log('--- B) dispatch 返回值是否 isPromise ---');
const disp = hf.dispatch('sageGuardian.reviewProposal', { description: '优化心流体验的提升' }, {});
console.log('disp isPromise =', disp && typeof disp.then === 'function');
if (disp && typeof disp.then === 'function') {
  disp.then(r => console.log('dispatch awaited passed =', r.passed, 'checks =', r.checks.length));
}

console.log('--- C) checkValueAlignment 单参（经 dispatch 降级路径） ---');
const v = hf.dispatch('sageGuardian.checkValueAlignment', { description: '优化心流体验' }, {});
console.log('V keys =', JSON.stringify(Object.keys(v)), 'passed =', v.passed);

console.log('--- D) ethics.boundary 有没有 assess 的替代面 ---');
const bn = hf.boundaryNeg;
console.log('bn.needsNegotiation type =', typeof bn.needsNegotiation);
console.log('bn.hasPermission type =', typeof bn.hasPermission);

setTimeout(() => {}, 800);
