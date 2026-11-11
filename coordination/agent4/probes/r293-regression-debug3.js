const { ZH_SIGNALS } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const t = '我之前的判断不对，你的说法才是对的。';
console.log('flip pats:', ZH_SIGNALS.flip_no_reason.map((p) => String(p)));
console.log('test0:', ZH_SIGNALS.flip_no_reason[0].test(t));
console.log('test0 again:', ZH_SIGNALS.flip_no_reason[0].test(t));
console.log('test0 literal:', /我之前的判断(完全)?(错|不对|有误)/i.test(t));
const p = ZH_SIGNALS.flip_no_reason[0];
console.log('same as literal?', p.source === '我之前的判断(完全)?(错|不对|有误)', 'flags:', JSON.stringify(p.flags));
