'use strict';
/** probe-r736-si-legs.js — 腿①腿②逐条分解，确认缺口归属 */
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const si = require(path.join(HF, 'src', 'silence-imputation.js'));

// 用模块内部表不可达，改用全句 + 拆句对照定位
const { checkSilenceImputation } = si;
const tests = [
  'She refused to comment.',
  'She refused to comment, which only proves she is guilty.',
  'which only proves she is guilty.',
  'She is obviously guilty.',
  'He would not answer.',
  'He would not answer, as any guilty person would.',
  'She did not respond, and the reason is obvious.',
  'The reason is obvious.',
  'She declined to comment.',
  'She declined to comment, saying it all really.',
  'saying it all really.',
  '他不解释。',
  '他不解释，很能说明问题。',
  '很能说明问题。',
  '这说明什么已经很明显了。',
  '他不接电话，显然是在逃避。',
  '他不接电话。',
  '她拒绝了采访，显然是心虚。',
  '显然是心虚。',
];
for (const s of tests) {
  const r = checkSilenceImputation(s);
  console.log(`${r.hit ? 'HIT ' : '----'} ${s}`);
}
