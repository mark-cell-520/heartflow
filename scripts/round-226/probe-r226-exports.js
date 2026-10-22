// 核实正确入口：src/index.js 的实际导出
const idx = require('../../src/index.js');
console.log('exports =', Object.keys(idx).slice(0, 40).join(','));
const gj = require('../../src/gate.js');
console.log('gate.js exports =', Object.keys(gj).slice(0, 40).join(','));
