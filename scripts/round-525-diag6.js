'use strict';
const { __internals } = require('../src/cost-externalization.js');
const I = __internals();
const cases = {
  'SZH 你管不着': [I.DISMISS_ZH, '你管不着'],
  'SZH 你管不着。': [I.DISMISS_ZH, '你管不着。'],
  'SZH 你管不着,': [I.DISMISS_ZH, '疼的又不是你,你管不着.'],
  'SZH 你说风凉话': [I.DISMISS_ZH, '你说的这些都是风凉话'],
  'SZH 等我这位置': [I.DISMISS_ZH, '等你坐到我这个位置再说'],
};
for (const [name, [re, s]] of Object.entries(cases)) {
  console.log(`${re.test(s) ? 'HIT ' : 'MISS'}  ${name}`);
}
