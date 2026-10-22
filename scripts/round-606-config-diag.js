'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  const vi = hf.valueInternalizer;
  console.log('config=' + JSON.stringify(vi.config));
  console.log('oscillationWindow=' + vi.config.oscillationWindow);
  console.log('config keys=' + Object.keys(vi.config).join(','));
  console.log('isConfigFrozen=' + Object.isFrozen(vi.config));
  console.log('proto has config? ' + Object.getOwnPropertyNames(Object.getPrototypeOf(vi)).includes('config'));
  // 试调 _recordDecision 再看栈
  try { vi._recordDecision(true, 'abc', {}); console.log('now OK'); }
  catch (e) { console.log('THROW: ' + e.message); console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
})().catch(e => console.log('FAIL ' + e.message));
