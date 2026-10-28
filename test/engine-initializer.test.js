require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const ei = require('../src/core/engine-initializer.js');
describe('engine-initializer', () => {
  test('start is function', () => {
    expect(typeof ei.start).toBe('function');
  });
});
