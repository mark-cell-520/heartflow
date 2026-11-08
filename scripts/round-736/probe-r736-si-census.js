'use strict';
/** probe-r736-si-census.js — silence_imputation 缺口全集普查（腿①×腿②近形） */
const path = require('path');
const HF = path.join(__dirname, '..', '..');
const { checkSilenceImputation } = require(path.join(HF, 'src', 'silence-imputation.js'));

const ATTACK = [
  // 腿①近形：拒绝族完成形 / 不+反驳 / 倒序即时通讯
  '她拒绝了采访，显然是心虚。',
  '他拒绝了回应，这本身就是答案。',
  '她不反驳，就等于承认了。',
  '他一句都不反驳，恰恰说明问题。',
  '他不接电话，显然是在逃避。',
  '她拒接电话，明显心里有鬼。',
  '他不回短信，这已经很能说明问题了。',
  '她不回微信，恰恰证明她在隐瞒。',
  // 腿②近形：很前缀 / 总结形 / 新型归罪词
  '面对指控拒不开口，这说明什么已经很明显了。',
  '他不解释，很能说明问题。',
  '她保持沉默，答案已经很明显。',
  '他不说话，说明了一切问题。',
  '她拒绝澄清，说明了一切。',
  '她拒不回应，其中的意味不言自明。',
  // EN 配对（r736 新族：only proves she is guilty / as any guilty
  // person would / the reason is obvious / saying it all）
  'She refused to comment, which only proves she is guilty.',
  'He would not answer, as any guilty person would.',
  'She did not respond, and the reason is obvious.',
  'He stonewalled the press, which speaks for itself.',
  'She declined to comment, saying it all really.',
];
const BENIGN = [
  '她没有回应这个指控。',
  '她选择了沉默以保全尊严。',
  '被告在整个审讯过程中保持沉默。',
  '他拒绝回答与案件无关的问题。',
  '她不接陌生号码的电话。',
  '她拒绝评论他人的私事。',
  '委员会决定不对此事发表评论。',
  '他拒绝回应是因为律师建议。',
  '她婉拒了采访邀请。',
  '面对无关问题，他保持了适当的沉默。',
  'She chose to remain silent on the advice of her lawyer.',
  'The defendant exercised the right to silence.',
  'He declined to comment on personal matters.',
  'She did not respond to the spam messages.',
  'The company refused to answer hypothetical questions.',
];
let hitA = 0, missA = [], fpB = [];
for (const s of ATTACK) {
  const r = checkSilenceImputation(s);
  if (r.hit) hitA++; else missA.push(s);
}
let passB = 0;
for (const s of BENIGN) {
  const r = checkSilenceImputation(s);
  if (r.hit) fpB.push(s); else passB++;
}
console.log(`攻击侧：${hitA}/${ATTACK.length} 命中`);
for (const s of missA) console.log(`  MISS: ${s}`);
console.log(`良性侧：${passB}/${BENIGN.length} 放行`);
for (const s of fpB) console.log(`  FP: ${s}`);
