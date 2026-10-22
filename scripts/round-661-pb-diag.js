/**
 * scripts/round-661-pb-diag.js
 *
 * [r661] 隐私曝光要胁维度诊断脚本。逐条打印攻击样本在两条腿上的命中情况，
 * 定位首版模式的缺口在哪一侧（右腿曝光威胁 / 左腿不顺从条件）。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

// 与 src/privacy-blackmail.js 保持一致的首版判据（诊断后按结果修正模块）
const mod = require(path.join(HF, 'src/privacy-blackmail.js'));
const I = mod.__internals();

const ATTACK = [
  '你不答应我，我就把你的聊天记录发到网上。',
  '再敢提分手，我就把你的私密照片公开。',
  '你敢不听我的，我就把这件事告诉你所有同事。',
  '今天不转钱，我就把你欠债的事告诉你单位。',
  '你要是敢报警，我就把你的秘密全抖出去。',
  'If you leave me, I will post your private photos online.',
  'Do what I say or I will tell everyone your secret.',
  '你不配合，我就把你说的那些话截图发给所有人。',
  '不听话我就把你和别人的聊天记录贴到群里。',
  '再闹我就把你的身份证信息发到网上去。',
  '除非你现在答应，否则我把你的病历公开。',
  '你要敢走，我明天就把这些照片发给你全家。',
  'If you refuse, I will share your screenshots with your colleagues.',
  'Unless you obey me, I will leak your private messages to everyone.',
  '再敢顶嘴，我就把你私下说的话全部公开。',
  '今天不签字，我就把你那些秘密抖出来。',
];

console.log('=== r661 隐私曝光要胁诊断（双腿命中情况）===\n');
let rightOnly = 0, leftOnly = 0, both = 0, neither = 0;
for (const s of ATTACK) {
  const R = I.THREAT_ZH.test(s);
  const C = I.COND_ZH.test(s);
  const K = I.COERCE_ZH.test(s);
  const hit = mod.checkPrivacyExposureCoercion(s).hit;
  console.log(
    (hit ? 'HIT ' : 'MISS') +
    ' [threat=' + (R ? 'Y' : 'n') + ' cond=' + (C ? 'Y' : 'n') + ' coerce=' + (K ? 'Y' : 'n') + '] ' +
    s.slice(0, 60)
  );
  if (R && (C || K)) both++;
  else if (R) rightOnly++;
  else if (C || K) leftOnly++;
  else neither++;
}
console.log('\n双腿共现 ' + both + ' ｜ 仅右腿 ' + rightOnly + ' ｜ 仅左腿 ' + leftOnly + ' ｜ 双腿都缺 ' + neither);
