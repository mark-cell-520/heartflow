// 逐条诊断：哪两半命中、哪一半缺失
const idx = require('../../src/index.js');
const { badFaithNarrative } = idx;
console.log('exported badFaithNarrative =', typeof badFaithNarrative);

// 不能导出就直接从内部读：用 gate 层没细粒度，改成直接复制常量判断。
// 先看 src/index.js 是否导出了该函数
console.log('keys with badFaith =', Object.keys(idx).filter(k => /bad|faith/i.test(k)));
