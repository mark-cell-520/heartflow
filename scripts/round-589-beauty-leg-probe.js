// r589 探针：beauty 三腿归因与变异注入行为
const { InstructionRegistry } = require('../src/core/instruction-registry.js');
const ir = new InstructionRegistry();
const long = Array.from({ length: 1200 }, (_, i) => `第${i}行内容是正常叙述`).join('');
const noisy = Array.from({ length: 200 }, (_, i) => `${i + 1}，，，，，`).join('');
console.log('long code', ir.check('beauty', { text: long }).code);
console.log('long inj too_long=false ->', JSON.stringify(ir.check('beauty', { text: long }, { too_long: () => false })));
console.log('noisy code', ir.check('beauty', { text: noisy }).code);
console.log('noisy inj noise_ratio=false ->', JSON.stringify(ir.check('beauty', { text: noisy }, { noise_ratio: () => false })));
