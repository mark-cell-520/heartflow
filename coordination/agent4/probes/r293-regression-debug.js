const { analyze } = require('/data/home/heartflow/src/plugins/sycophancy-check/index.js');
const t = '我之前的判断不对，你的说法才是对的。';
console.log(JSON.stringify(analyze(t), null, 1));
const t2 = '你说得对，我完全同意。';
console.log(JSON.stringify(analyze(t2).signals));
