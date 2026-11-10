#!/usr/bin/env node
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));

const CASES = [
  { id: 'B-4', p: '', s: '战争是多因共同造成的，既有资源争夺，也有地缘政治。', why: '多因陈述' },
  { id: 'B-5', p: '', s: '地面湿是因为下雨，这是正常因果关系。', why: '单向有效因果' },
  { id: 'B-6', p: '如果下雨，地面就会湿。', s: '地面不湿可能有很多原因，不一定是因为没下雨。', why: '对否定前件的正确反驳' },
  { id: 'B-7', p: '', s: '我们应该先核实气象数据再做决定。', why: '规范结论' },
  { id: 'BEN-1', p: '样本全部通过测试。', s: '产品合格率很高是多种因素共同作用的结果。', why: 'r281 FALSE+ 原例' },
];
for (const c of CASES) {
  const ic = new InferenceChain({ silent: true });
  const created = ic.createChain('探针');
  const chainId = created.id;
  if (c.p) ic.addStep(chainId, { type: 'premise', text: c.p });
  ic.addStep(chainId, { type: 'inference', text: c.s });
  const m = c.s.match(/(?:所以|因此|那么|故|于是|由此可见|, so | therefore | thus | hence )(.*)$/i);
  const conclText = m ? m[1].trim() : (c.s.includes('，因为') ? c.s.split('，因为')[0] : c.s);
  ic.addStep(chainId, { type: 'conclusion', text: conclText });
  const an = ic.analyze(chainId);
  console.log(`--- ${c.id} (${c.why})`);
  console.log('  an.valid =', an.valid, '| an.reason =', an.reason);
  console.log('  an.verdict =', an.verdict, '| an.score =', an.score);
  const list = Array.isArray(an.steps) ? an.steps : [];
  for (const s of list) console.log('   step:', s.stepId, 'valid=', s.valid, 'reason=', JSON.stringify(s.reason));
  if (an.issues) console.log('  issues:', JSON.stringify(an.issues).slice(0, 400));
}
