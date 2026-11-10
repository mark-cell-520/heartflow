#!/usr/bin/env node
/** 诊断否定前件漏判根因：切分 + 重叠度 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));
const ic = new InferenceChain({ silent: true });

const CASES = [
  { id: 'EN-1', p: 'If it rains, the ground will be wet.', s: 'It is not raining, therefore the ground is not wet.' },
  { id: 'EN-2', p: 'If it rains, the ground will be wet.', s: 'It is in fact not raining at all, therefore the ground is clearly not wet.' },
  { id: 'ZH-1', p: '如果下雨，地面就会湿。', s: '没有下雨，所以地面不湿。' },
  { id: 'ZH-2', p: '如果下雨，地面就会湿。', s: '地面不会湿，因为没有下雨。' },
  { id: 'ZH-3', p: '如果明天下大雨，室外音乐节就会取消。', s: '根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。' },
];

for (const c of CASES) {
  console.log('─'.repeat(70));
  console.log(`${c.id}: premise="${c.p}"`);
  console.log(`      step="${c.s}"`);
  const pc = ic._splitConditional(c.p);
  console.log('  premise cond split:', pc ? JSON.stringify({ antecedent: pc.antecedent, consequent: pc.consequent }) : null);
  const sc = ic._splitGivenConcluded(c.s);
  console.log('  step split:', sc ? JSON.stringify({ given: sc.given, concluded: sc.concluded, givenNeg: sc.givenNeg, concludedNeg: sc.concludedNeg }) : null);
  if (pc && sc) {
    const { antecedent, consequent } = pc;
    const { given, concluded } = sc;
    const strip = t => ic._stripNeg(t);
    console.log('  givenHitsConsequent =', given ? ic._charOverlap(given, consequent) : false);
    console.log('  givenHitsAntecedent =', given ? ic._charOverlap(given, antecedent) : false);
    console.log('  concludedHitsConsequent =', ic._charOverlap(concluded, consequent));
    console.log('  concludedHitsAntecedent =', ic._charOverlap(concluded, antecedent));
    console.log('  stripNeg(concluded)=', strip(concluded), '-> overlapCons =', ic._charOverlap(strip(concluded), consequent));
    console.log('  stripNeg(given)=', strip(given||''), '-> overlapAnt =', ic._charOverlap(strip(given||''), antecedent));
    console.log('  negatedByOther(antecedent) =', ic._negatedByOther([{ text: c.p }], antecedent, { text: c.p }));
  }
}
