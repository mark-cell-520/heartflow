'use strict';
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkDoseResponseLinearity, __internals } = require(path.join(ROOT, 'src', 'dose-response-linearity.js'));

// 用注入法测腿：把目标常量置空看是否翻转
function needC(txt, key, isZh) {
  const hit0 = checkDoseResponseLinearity(txt).hit;
  const hit1 = checkDoseResponseLinearity(txt, { [key]: [] }).hit;
  return { hit0, withoutKey: hit1, required: hit0 && !hit1 };
}
console.log('ZH豁免样本 DAILY_IN_ZH required:', JSON.stringify(needC('多喝几杯咖啡更能提神醒脑，不过凡事要节制。', 'DAILY_IN_ZH', true)));
console.log('ZH豁免样本 GAIN_ZH required:   ', JSON.stringify(needC('多喝几杯咖啡更能提神醒脑，不过凡事要节制。', 'GAIN_ZH', true)));
console.log('ZH攻击1   GAIN_ZH required:    ', JSON.stringify(needC('一杯茶能润喉，多喝几杯更能养生。', 'GAIN_ZH', true)));
console.log('EN单剂量  DAILY_IN_EN required:', JSON.stringify(needC('Ten cups of coffee keep you up all night and make you sharper.', 'DAILY_IN_EN', false)));
console.log('EN单剂量  GAIN_EN required:    ', JSON.stringify(needC('Ten cups of coffee keep you up all night and make you sharper.', 'GAIN_EN', false)));
console.log('EN单剂量  QUANT_EN required:   ', JSON.stringify(needC('Ten cups of coffee keep you up all night and make you sharper.', 'QUANT_EN', false)));
console.log('EN单剂量  hasIncrement=true?   ', /(?:多|再|加倍|翻倍|多加|加量|加大|增量|加码)/.test('Ten cups of coffee keep you up all night and make you sharper.'));
