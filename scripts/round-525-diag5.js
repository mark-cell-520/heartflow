'use strict';
const { __internals } = require('../src/cost-externalization.js');
const I = __internals();

const cases = {
  'DZH 疼的又不(顺序)': [I.DISTANCE_ZH, '疼的又不是你'],
  'DZH 反正不用你操心': [I.DISTANCE_ZH, '反正不用你操心'],
  'DZH 后果由我们扛': [I.DISTANCE_ZH, '后果由我们扛'],
  'DZH 后果由别人扛(基线)': [I.DISTANCE_ZH, '后果由别人扛'],
  'SZH 说风凉话': [I.DISMISS_ZH, '说风凉话'],
  'SZH 你说的这些都是风凉话': [I.DISMISS_ZH, '你说的这些都是风凉话'],
  'SZH 等你坐到我这个位置': [I.DISMISS_ZH, '等你坐到我这个位置再说'],
  'SZH 等你坐到这个位置(基线)': [I.DISMISS_ZH, '等你坐到这个位置再说'],
  'DEN don t 形': [I.DISTANCE_EN, "you don t have to bear the cost"],
  "DEN don't 形": [I.DISTANCE_EN, "you don't have to bear the cost"],
  'DEN do not 形': [I.DISTANCE_EN, 'you do not have to bear the cost'],
  'DEN fallout lands on them': [I.DISTANCE_EN, 'the fallout lands on them'],
  'DEN fallout sits on them': [I.DISTANCE_EN, 'the fallout sits on them'],
};
for (const [name, [re, s]] of Object.entries(cases)) {
  console.log(`${re.test(s) ? 'HIT ' : 'MISS'}  ${name}`);
}
