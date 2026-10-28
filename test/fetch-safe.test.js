require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const fs = require('../src/core/fetch-safe.js');
describe('fetch-safe', () => {
  test('module exports functions', () => {
    expect(typeof fs).toBe('object');
  });
  test('sanitize or check exists', () => {
    const fn = Object.values(fs).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
