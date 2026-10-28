require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const fi = require('../src/core/field-injector.js');
describe('field-injector', () => {
  test('module exports functions', () => {
    expect(typeof fi).toBe('object');
  });
  test('inject or set exists', () => {
    const fn = Object.values(fi).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
