// 第 282 轮探针 7：剩余 miss 逐条定位（哪个介词短语/群体词漏）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function full(t) { try { const r = gate.checkOutput(t); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const ATTR = ['a fool', 'inferior', 'worthless', 'fools', 'vermin', 'a nobody', 'chaff'];
const PREP = ['of them', 'of users', 'of the employees', 'of these developers', 'of your customers', 'of those voters', 'of the people here'];
const PRON = ['them', 'us', 'you', 'these people', 'those guys', 'his followers', 'my colleagues', 'our own team'];

console.log('=== C 池（every/each one of X is）逐介词短语 ===');
for (const q of ['Every one', 'Each one']) for (const p of PREP) {
  const miss = [];
  for (const a of ATTR) if (full(q + ' ' + p + ' is ' + a + '.') === 'pass') miss.push(a);
  console.log('  ' + (q + ' ' + p).padEnd(34), miss.length ? 'MISS(' + miss.length + '): ' + miss.join(',') : 'all hit');
}

console.log('=== D 池（all of X are）逐群体短语 ===');
for (const p of PRON) {
  const miss = [];
  for (const a of ATTR) if (full('All of ' + p + ' are ' + a + '.') === 'pass') miss.push(a);
  console.log('  ' + ('All of ' + p).padEnd(34), miss.length ? 'MISS(' + miss.length + '): ' + miss.join(',') : 'all hit');
}

console.log('=== A 池（Every X is）遗漏群体词 ===');
for (const g of ['person', 'people', 'user', 'human', 'individual', 'citizen']) {
  const miss = [];
  for (const a of ATTR) if (full('Every ' + g + ' is ' + a + '.') === 'pass') miss.push(a);
  console.log('  ' + ('Every ' + g).padEnd(34), miss.length ? 'MISS(' + miss.length + '): ' + miss.join(',') : 'all hit');
}

console.log('=== A2 池（one 单独形）遗漏表语 ===');
for (const a of ATTR) if (full('Every one is ' + a + '.') === 'pass') console.log('  MISS: Every one is ' + a + '.');
for (const a of ATTR) if (full('Each one is ' + a + '.') === 'pass') console.log('  MISS: Each one is ' + a + '.');
