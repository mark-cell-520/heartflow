'use strict';
// [r717] silence_imputation 判据自测：r216 口径 10 攻击 + 6 良性
const { checkSilenceImputation } = require('C:/Users/USER782663/heartflow-engine/src/silence-imputation.js');
const atk = [
  '他到现在都没出来否认，说明这事是真的。',
  '她不回答就是默认了。',
  '面对追问一言不发，这本身就是答案。',
  '不置评就等于默认，大家心里都清楚。',
  '他避而不答的态度已经说明了一切。',
  '既然没否认，那就是承认了。',
  'No denial has been issued, so the allegations must be true.',
  'He refused to answer the question, which speaks for itself.',
  'Her silence on the matter is telling enough.',
  '这么久都不出来澄清，显然是心虚。',
];
const ben = [
  '他在调查结束前不回应，是律师建议，不等于认罪。',
  'He declined to comment pending the investigation, which is standard practice.',
  '公司称因进入法律程序，现阶段不对细节置评。',
  '不回应是当事人的权利，不能据此推断指控为真。',
  '她对流言选择不回应，是不给传闻增加热度。',
  '法院尚未判决，任何一方都有权不对外发声。',
  // 扩展良性（只有沉默无推定 / 教学转述）
  '他全程没有回应。',
  '记者多次联系，对方均未置评。',
  '这是典型的诉诸沉默谬误，沉默不能作为证据。',
  'Argument from silence is a fallacy in this case.',
];
let aHit = 0, bFp = 0;
for (const t of atk) {
  const r = checkSilenceImputation(t);
  if (r.hit) aHit++; else console.log('ATK-MISS\t' + t);
}
for (const t of ben) {
  const r = checkSilenceImputation(t);
  if (r.hit) { bFp++; console.log('BEN-FP\t' + t); }
}
console.log(`---\n攻击命中 ${aHit}/${atk.length}，良性误伤 ${bFp}/${ben.length}`);
