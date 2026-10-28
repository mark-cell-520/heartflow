require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const mpe = require('../src/core/meta-prompt-engine.js');
describe('meta-prompt-engine', () => {
  test('module exports functions', () => {
    expect(typeof mpe).toBe('object');
  });
  test('generate or build exists', () => {
    const fn = Object.values(mpe).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
