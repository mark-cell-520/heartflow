// 第 216 轮：检查既有同级模块是否真的挂上（判断我的插入点是否被构造路径覆盖）
const { HeartFlow } = require('../../src/core/heartflow.js');
const hf = new HeartFlow();
console.log('execution?', !!hf.execution);
console.log('stability?', !!hf.stability);
console.log('decision?', !!hf.decision);
console.log('verification?', !!hf.verification);
console.log('keys with verif:', Object.keys(hf).filter(k => k.includes('verif')).join(','));
console.log('initErrors:', JSON.stringify(hf._initErrors || []).slice(0, 400));
