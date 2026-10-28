require('./helpers/mocha-shim.js'); // [v6.8.85] mocha shim：裸 node 可跑
const eh = require('../src/core/event-hooks.js');
describe('event-hooks', () => {
  test('module exports object', () => {
    expect(typeof eh).toBe('object');
  });
});
