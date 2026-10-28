require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const ev = require('../src/core/execution-verifier.js');
describe('execution-verifier', () => {
  test('module exports functions', () => {
    expect(typeof ev).toBe('object');
  });
  test('verify or check exists', () => {
    const fn = Object.values(ev).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
