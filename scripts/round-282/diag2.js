#!/usr/bin/env node
/** 诊断剩余 3 个缺口 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));
const ic = new InferenceChain({ silent: true });

console.log('=== EN-2 带修饰 ===');
{
  const p = 'If it rains, the ground will be wet.';
  const s = 'It is in fact not raining at all, therefore the ground is clearly not wet.';
  const pc = ic._splitConditional(p);
  const sc = ic._splitGivenConcluded(s);
  console.log('pc:', JSON.stringify(pc));
  console.log('sc:', JSON.stringify(sc));
  console.log('_charOverlap(given, antecedent) =', ic._charOverlap(sc.given, pc.antecedent));
  console.log('_charOverlap(concluded, consequent) =', ic._charOverlap(sc.concluded, pc.consequent));
  console.log('_charOverlap(stripNeg(concluded), consequent) =', ic._charOverlap(ic._stripNeg(sc.concluded), pc.consequent));
  console.log('_charOverlap(stripNeg(given), antecedent) =', ic._charOverlap(ic._stripNeg(sc.given), pc.antecedent));
}

console.log('=== ZH-2 倒装 ===');
{
  const p = '如果下雨，地面就会湿。';
  const s = '地面不会湿，因为没有下雨。';
  const pc = ic._splitConditional(p);
  console.log('pc:', JSON.stringify(pc));
  const sc = ic._splitGivenConcluded(s);
  console.log('sc:', JSON.stringify(sc));
  console.log('_splitGivenConcluded 返回 null → GIVEN/CONC 标记查找失败');
  // 手动查标记
  console.log('GIVEN_MARKERS_ZH 命中:', ['因为','由于','鉴于','既然'].find(m => s.includes(m)));
  console.log('CONC_MARKERS_ZH 命中:', ['所以','因此','因而','故','于是','由此可见','这说明','这表明','即'].find(m => s.includes(m)));
}

console.log('=== ZH-3 长句 ===');
{
  const p = '如果明天下大雨，室外音乐节就会取消。';
  const s = '根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。';
  const pc = ic._splitConditional(p);
  const sc = ic._splitGivenConcluded(s);
  console.log('pc:', JSON.stringify(pc));
  console.log('sc:', JSON.stringify(sc));
  if (sc && pc) {
    console.log('overlap(given, antecedent) =', ic._charOverlap(sc.given, pc.antecedent));
    console.log('overlap(concluded, consequent) =', ic._charOverlap(sc.concluded, pc.consequent));
    console.log('overlap(stripNeg(concluded), consequent) =', ic._charOverlap(ic._stripNeg(sc.concluded), pc.consequent));
    console.log('stripNeg(given)=', JSON.stringify(ic._stripNeg(sc.given)));
    console.log('antecedent=', pc.antecedent);
    console.log('overlap(stripNeg(given), antecedent) =', ic._charOverlap(ic._stripNeg(sc.given), pc.antecedent));
  }
}
