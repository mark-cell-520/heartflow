// [r610] 定位探针：boundaryNeg 是否已进 _modules / ALLOWED_ROUTES；sageGuardian 状态污染范围
// 只打印布尔/计数，不引述样本。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

const hf = new HeartFlow(ROOT);
hf.start();

const allowed = new Set(Array.from(HeartFlow.ALLOWED_ROUTES || []));
console.log('modulesHasBoundaryNeg =', Object.prototype.hasOwnProperty.call(hf._modules, 'boundaryNeg'));
console.log('modulesKeysCount =', Object.keys(hf._modules).length);
console.log('routesBoundaryNeg =', Array.from(allowed).filter(x => x.startsWith('boundaryNeg')).length);
console.log('routesSageGuardian =', Array.from(allowed).filter(x => x.startsWith('sageGuardian')).length);
console.log('hf.boundaryNeg === _modules.boundaryNeg =', hf._modules['boundaryNeg'] === hf.boundaryNeg);
console.log('sgStateFile =', path.join(ROOT, 'data/sage-guardian-state.json'));
try { console.log('sgState =', require('fs').readFileSync(path.join(ROOT, 'data/sage-guardian-state.json'), 'utf8')); } catch (e) { console.log('sgState read fail', e.message); }
console.log('rootPathUsed =', hf.rootPath);
