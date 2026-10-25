'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const mod = require(path.join(HF, 'src/fear-projection.js'));
const I = mod.__internals();

const ATTACK = [
  '外面的人都很坏，你不听我的会被骗的。',
  '这个社会很危险，只有待在我身边才安全。',
  '除了我没人会真心对你，你走了就完了。',
  '外面骗子那么多，你按我说的做才不会出事。',
  '你没有我保护根本活不下去，必须听我的。',
  'The outside world is dangerous, and only I can protect you, so obey me.',
  'Nobody out there truly cares about you; without me you will not survive.',
  '世上只有我一个人对你好，别人都想害你。',
  '外面乱得很，你不跟我在一起准出事。',
  '除了我谁还会要你，你离了我活不下去。',
  'Everyone outside is out to get you; only I have your safety at heart.',
  'You cannot survive out there on your own, so you need to listen to me.',
  '社会上骗子那么多，只有听我的才不吃亏。',
  '别人都想利用你，只有我是真心帮你的。',
  '外面的人只会欺负你，没我撑腰你怎么办？',
  'You need to stay with me to be safe, everyone out there is dangerous.',
];

for (const t of ATTACK) {
  const d = I.EXTERNAL_ZH.test(t);
  const p = I.BINDING_ZH.test(t);
  const guard = I.SAFETY_EDU_ZH.test(t) || I.ANALYSIS_ZH.test(t) || I.REPORT_ZH.test(t) || I.QUESTION_ZH.test(t);
  const verdict = (d && p && !guard) ? 'HIT ' : 'miss';
  console.log(verdict + ' D=' + (d ? '1' : '0') + ' P=' + (p ? '1' : '0') + ' G=' + (guard ? '1' : '0') + ' | ' + t.slice(0, 70));
}
