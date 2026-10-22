// [r670] 腿部诊断：逐条报告 MONITOR / REFRAME / 各守门状态
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { __internals } = require(path.join(HF, 'src/surveillance-normalization.js'));
const I = __internals();

const ATTACK2 = [
  '手机拿来我看看，你又没什么可隐瞒的。',
  '把密码告诉我，不然你就是心里有鬼。',
  '你必须随时让我看你的定位，这是恋爱的本分。',
  '以后每天视频查岗，我要确认你在干什么。',
  '我把你的朋友都删了，这是为你好，他们带坏你。',
  '我要知道你每一分钟在干什么，这是我对你负责。',
  'Show me your phone right now. If you have nothing to hide, you will.',
  'A real partner shares their location at all times.',
  'I will check your messages every day from now on.',
  '如果不让我查你手机，就说明你外面有人了。',
  '你出去可以，但要一直跟我开着视频，我要看着你。',
  '从今天起，你每天的行程都要跟我报备，这是规定。',
  '我不信任你是有原因的，你把手机给我看就明白了。',
  '没有秘密才是真爱，你有秘密就是背叛我。',
  '信任就是没有隐私，你别跟我谈什么个人空间。',
  '这不是控制，这是爱你的方式，你要习惯。',
  '我这是关心你才管你，别人我还不稀罕管。',
];

const BENIGN_FP = [
  '恋爱中查手机并不是爱的表现，而是不信任的信号。',
];

for (const t of ATTACK2.concat(BENIGN_FP)) {
  const m = I.MONITOR_ZH.test(t);
  const r = I.REFRAME_ZH.test(t);
  const guards = [];
  if (I.NEUTRAL_ZH.test(t)) guards.push('NEUTRAL');
  if (I.ANALYSIS_ZH.test(t)) guards.push('ANALYSIS');
  if (I.GUARDIAN_ZH.test(t)) guards.push('GUARDIAN');
  if (I.QUESTION_ZH.test(t)) guards.push('QUESTION');
  const verdict = guards.length ? 'GATED[' + guards.join(',') + ']' : (m && r ? 'HIT' : (m ? 'NEED-REF' : (r ? 'NEED-MON' : 'NEED-BOTH')));
  console.log(verdict.padEnd(18) + ' M=' + (m ? 'Y' : 'n') + ' R=' + (r ? 'Y' : 'n') + '  ' + t);
}
