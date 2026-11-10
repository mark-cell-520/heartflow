#!/usr/bin/env node
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));
const ic = new InferenceChain({ silent: true });
const CASES = [
  { id: 'B-5', p: '昨天下了一场大雨。', s: '地面湿是因为下雨，这是正常因果关系。' },
  { id: 'B-6', p: '如果下雨，地面就会湿。', s: '地面不湿可能有很多原因，不一定是因为没下雨。' },
  { id: 'ATK', p: '该公司去年营收增长 20%。', s: '斯克兰顿实控财团暗网节点共识机制。' },
];
for (const c of CASES) {
  const premiseKw = ic._extractKeywords(c.p);
  const stepKw = ic._extractKeywords(c.s);
  const premiseSet = new Set(premiseKw);
  const novel = stepKw.filter(k => !premiseSet.has(k));
  console.log(`--- ${c.id}`);
  console.log('  premiseKw:', JSON.stringify(premiseKw));
  console.log('  stepKw   :', JSON.stringify(stepKw));
  console.log('  novel    :', JSON.stringify(novel), 'ratio =', (novel.length / stepKw.length).toFixed(2));
  const stepChars = new Set((c.s.match(/[\u4e00-\u9fa5]/g) || []));
  const pChars = new Set((c.p.match(/[\u4e00-\u9fa5]/g) || []));
  let hit = 0; for (const ch of stepChars) if (pChars.has(ch)) hit++;
  console.log('  char inherit =', (hit / stepChars.size).toFixed(2), `(${hit}/${stepChars.size})`);
  console.log('  isNormative =', ic._isNormativeConclusion(c.s));
  console.log('  isGeneralization =', ic._isInductiveGeneralization(c.s, novel));
  console.log('  isMultiCause =', ic._isMultiCauseStatement(c.s, novel, pChars));
}
