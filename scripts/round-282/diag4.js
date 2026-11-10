#!/usr/bin/env node
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));
const CASES = [
  { id: 'B-4', p: '战争的历史成因包括资源争夺。', s: '战争是多因共同造成的，既有资源争夺，也有地缘政治。' },
  { id: 'B-5', p: '昨天下了一场大雨。', s: '地面湿是因为下雨，这是正常因果关系。' },
  { id: 'B-6', p: '如果下雨，地面就会湿。', s: '地面不湿可能有很多原因，不一定是因为没下雨。' },
];
for (const c of CASES) {
  const ic = new InferenceChain({ silent: true });
  const created = ic.createChain('探针');
  const chainId = created.id;
  ic.addStep(chainId, { type: 'premise', text: c.p });
  ic.addStep(chainId, { type: 'inference', text: c.s });
  const m = c.s.match(/(?:所以|因此|那么|故|于是|由此可见|, so | therefore | thus | hence )(.*)$/i);
  const conclText = m ? m[1].trim() : (c.s.includes('，因为') ? c.s.split('，因为')[0] : c.s);
  ic.addStep(chainId, { type: 'conclusion', text: conclText });
  const an = ic.analyze(chainId);
  console.log(`--- ${c.id}`);
  console.log('  an.valid =', an.valid, '| an.reason =', an.reason);
  const list = Array.isArray(an.steps) ? an.steps : [];
  for (const s of list) console.log('   step:', s.stepId, 'valid=', s.valid, '| reason=', s.reason);
  console.log('  step count =', list.length);
  if (an.chainLevel) console.log('  chainLevel =', JSON.stringify(an.chainLevel).slice(0, 300));
}
