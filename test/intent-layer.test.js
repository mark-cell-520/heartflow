require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const il = require('../src/core/intent-layer.js');
describe('intent-layer', () => {
  test('module exports functions', () => {
    expect(typeof il).toBe('object');
  });
  test('classify or detect exists', () => {
    const fn = Object.values(il).find(v => typeof v === 'function');
    expect(fn).toBeDefined();
  });
});
