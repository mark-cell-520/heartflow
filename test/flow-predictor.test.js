require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const fp = require('../src/core/flow-predictor.js');
describe('flow-predictor', () => {
  test('module exports functions', () => {
    expect(typeof fp).toBe('object');
  });
  test('predict or estimate exists', () => {
    const fn = Object.values(fp).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
