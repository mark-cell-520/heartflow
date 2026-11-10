#!/usr/bin/env node
/**
 * r282 负例注入测试：否定前件族 + 跳跃豁免族
 * 固化 src/reasoning/inference-chain.js 的 r282 修复：
 *   1. then_en 补 will/would 等时态形式 + EN/ZH 逗号优先切分腿
 *   2. _splitGivenConcluded 结论前置倒装腿（「…，因为…」）
 *   3. _stripModifiers/_hitsSegment 修饰语与前缀稀释复算
 *   4. _isMultiCauseStatement 多因陈述豁免（第五腿）
 *   5. weakCharInherit 弱字面继承豁免（溯因/反驳句式）
 */
'use strict';
const path = require('path');
const HF = path.resolve(__dirname, '..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));

const ATTACKS = [
  { id: 'DA-EN-1', p: 'If it rains, the ground will be wet.', s: 'It is not raining, therefore the ground is not wet.' },
  { id: 'DA-EN-2', p: 'If it rains, the ground will be wet.', s: 'It is in fact not raining at all, therefore the ground is clearly not wet.' },
  { id: 'DA-EN-3', p: 'If the engine is overheating, the warning light turns on.', s: 'The engine is apparently not overheating, so the warning light is not on.' },
  { id: 'DA-EN-4', p: 'If she studies hard, she will pass the exam.', s: 'She did not study hard, therefore she will not pass the exam.' },
  { id: 'DA-EN-5', p: 'If the user is not verified, access must be denied.', s: 'The user is in fact not verified, so access is clearly not denied.' },
  { id: 'DA-EN-6', p: 'If we do not leave now, we will miss the train.', s: 'We are leaving now, therefore we will not miss the train.' },
  { id: 'DA-ZH-1', p: '如果下雨，地面就会湿。', s: '没有下雨，所以地面不湿。' },
  { id: 'DA-ZH-2', p: '如果下雨，地面就会湿。', s: '地面不会湿，因为没有下雨。' },
  { id: 'DA-ZH-3', p: '如果明天下大雨，室外音乐节就会取消。', s: '根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。' },
  { id: 'DA-ZH-4', p: '如果发动机过热，警报灯就会亮。', s: '发动机显然没有过热，所以警报灯没亮。' },
  { id: 'DA-ZH-5', p: '如果努力，就会有收获。', s: '没有努力，所以没有收获。' },
  { id: 'DA-ZH-6', p: '若方案通过，预算就会增加。', s: '方案肯定没通过，因此预算不会增加。' },
];

const BENIGNS = [
  { id: 'B-1', p: '如果下雨，地面就会湿。', s: '地面没有湿，所以没有下雨。' },
  { id: 'B-2', p: '如果下雨，地面就会湿。', s: '下雨了，所以地面会湿。' },
  { id: 'B-3', p: '如果明天下大雨，室外音乐节就会取消。', s: '明天会下大雨，所以室外音乐节会取消。' },
  { id: 'B-4', p: '战争的历史成因包括资源争夺。', s: '战争是多因共同造成的，既有资源争夺，也有地缘政治。' },
  { id: 'B-5', p: '昨天下了一场大雨。', s: '地面湿是因为下雨，这是正常因果关系。' },
  { id: 'B-6', p: '如果下雨，地面就会湿。', s: '地面不湿可能有很多原因，不一定是因为没下雨。' },
  { id: 'B-7', p: '样本全部通过测试。', s: '因此需要重新评估资源分配与排期。' },
  { id: 'B-8', p: '如果下雨，地面就会湿。', s: '下雨了。' },
  { id: 'B-9', p: '样本全部通过测试。', s: '产品合格率很高是多种因素共同作用的结果。' },
];

function runOne(c) {
  const ic = new InferenceChain({ silent: true });
  const chainId = ic.createChain('探针').id;
  if (c.p) ic.addStep(chainId, { type: 'premise', text: c.p });
  ic.addStep(chainId, { type: 'inference', text: c.s });
  const m = c.s.match(/(?:所以|因此|那么|故|于是|由此可见|, so | therefore | thus | hence )(.*)$/i);
  const conclText = m ? m[1].trim() : (c.s.includes('，因为') ? c.s.split('，因为')[0] : c.s);
  ic.addStep(chainId, { type: 'conclusion', text: conclText });
  const an = ic.analyze(chainId);
  const list = Array.isArray(an.steps) ? an.steps : [];
  return list.some(s => s && s.valid === false);
}

let pass = 0, fail = 0;
const failed = [];
for (const c of ATTACKS) {
  const got = runOne(c);
  if (got) pass++; else { fail++; failed.push(`${c.id} 期望命中却漏判`); }
}
for (const c of BENIGNS) {
  const got = runOne(c);
  if (!got) pass++; else { fail++; failed.push(`${c.id} 良性样本被误伤`); }
}
for (const f of failed) console.error('  ✗', f);
console.log(`\nr282 否定前件/跳跃豁免 负例注入测试: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
