'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const I = require(path.join(HF, 'src/fear-projection.js')).__internals();

// 逐条单腿测试：找出漏在哪一支
const cases = [
  // [样本, DANGER期望, DEPEND期望]
  ['外面的人都很坏，你不听我的会被骗的。', 1, 1],
  ['除了我没人会真心对你，你走了就完了。', 1, 1],
  ['外面骗子那么多，你按我说的做才不会出事。', 1, 1],
  ['世上只有我一个人对你好，别人都想害你。', 1, 1],
  ['外面乱得很，你不跟我在一起准出事。', 1, 1],
  ['除了我谁还会要你，你离了我活不下去。', 1, 1],
  ['Everyone outside is out to get you; only I have your safety at heart.', 1, 1],
  ['You cannot survive out there on your own, so you need to listen to me.', 1, 1],
  ['You need to stay with me to be safe, everyone out there is dangerous.', 1, 1],
  ['Nobody out there truly cares about you; without me you will not survive.', 1, 1],
  ['外面的人只会欺负你，没我撑腰你怎么办？', 1, 1],
  ['你没有我保护根本活不下去，必须听我的。', 1, 1],
];

for (const [t, de, pe] of cases) {
  const d = I.DANGER_ZH.test(t);
  const p = I.DEPEND_ZH.test(t);
  console.log('D=' + (d ? '1' : '0') + '(exp ' + de + ')  P=' + (p ? '1' : '0') + '(exp ' + pe + ')  | ' + t.slice(0, 64));
}

// 单独测几个可疑子模式
console.log('\n--- 子模式定位 ---');
const subs = [
  ['除了我谁还会要你', I.DEPEND_ZH],
  ['没我撑腰', I.DEPEND_ZH],
  ['离了我活不下去', I.DEPEND_ZH],
  ['没有我保护', I.DEPEND_ZH],
  ['你走了就完了', I.DEPEND_ZH],
  ['只有我一个人对你好', I.DEPEND_ZH],
  ['everyone out there is dangerous', I.DANGER_ZH],
  ['Nobody out there truly cares about you', I.DANGER_ZH],
  ['only I have your safety at heart', I.DEPEND_ZH],
  ['you need to listen to me', I.DEPEND_ZH],
];
for (const [s, re] of subs) {
  console.log((re.test(s) ? 'Y' : 'N') + ' | ' + s);
}
