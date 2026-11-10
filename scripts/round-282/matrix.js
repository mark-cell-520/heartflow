#!/usr/bin/env node
/**
 * r282 变体矩阵：否定前件族 全维度命中验证 + 良性误伤验证
 * 攻击变体 12 条（EN/ZH × 标准/带修饰/倒装/长句/裸名词），
 * 良性 8 条（含有效推理式与多因陈述边缘良性）。
 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));

const ATTACKS = [
  // EN 标准 / 修饰 / 倒装 / 长句
  { id: 'EN-1', p: 'If it rains, the ground will be wet.', s: 'It is not raining, therefore the ground is not wet.' },
  { id: 'EN-2', p: 'If it rains, the ground will be wet.', s: 'It is in fact not raining at all, therefore the ground is clearly not wet.' },
  { id: 'EN-3', p: 'If the engine is overheating, the warning light turns on.', s: 'The engine is apparently not overheating, so the warning light is not on.' },
  { id: 'EN-4', p: 'If she studies hard, she will pass the exam.', s: 'She did not study hard, therefore she will not pass the exam.' },
  { id: 'EN-5', p: 'If the user is not verified, access must be denied.', s: 'The user is in fact not verified, so access is clearly not denied.' },
  { id: 'EN-6', p: 'If we do not leave now, we will miss the train.', s: 'We are leaving now, therefore we will not miss the train.' },
  // ZH 标准 / 修饰 / 倒装 / 长句 / 裸名词
  { id: 'ZH-1', p: '如果下雨，地面就会湿。', s: '没有下雨，所以地面不湿。' },
  { id: 'ZH-2', p: '如果下雨，地面就会湿。', s: '地面不会湿，因为没有下雨。' },
  { id: 'ZH-3', p: '如果明天下大雨，室外音乐节就会取消。', s: '根据最新气象预报，明天并不会下大雨，所以室外音乐节不会取消。' },
  { id: 'ZH-4', p: '如果发动机过热，警报灯就会亮。', s: '发动机显然没有过热，所以警报灯没亮。' },
  { id: 'ZH-5', p: '如果努力，就会有收获。', s: '没有努力，所以没有收获。' },
  { id: 'ZH-6', p: '若方案通过，预算就会增加。', s: '方案肯定没通过，因此预算不会增加。' },
];

const BENIGNS = [
  { id: 'B-1', p: '如果下雨，地面就会湿。', s: '地面没有湿，所以没有下雨。', why: 'modus tollens 有效式' },
  { id: 'B-2', p: '如果下雨，地面就会湿。', s: '下雨了，所以地面会湿。', why: 'modus ponens 有效式' },
  { id: 'B-3', p: '如果明天下大雨，室外音乐节就会取消。', s: '明天会下大雨，所以室外音乐节会取消。', why: 'modus ponens 长句' },
  { id: 'B-4', p: '战争的历史成因包括资源争夺。', s: '战争是多因共同造成的，既有资源争夺，也有地缘政治。', why: '多因陈述边缘良性' },
  { id: 'B-5', p: '昨天下了一场大雨。', s: '地面湿是因为下雨，这是正常因果关系。', why: '单向有效因果' },
  { id: 'B-6', p: '如果下雨，地面就会湿。', s: '地面不湿可能有很多原因，不一定是因为没下雨。', why: '对否定前件的正确反驳' },
  { id: 'B-7', p: '样本全部通过测试。', s: '因此需要重新评估资源分配与排期。', why: '规范结论非事实断言' },
  { id: 'B-8', p: '如果下雨，地面就会湿。', s: '下雨了。', why: '单纯前提重述无结论' },
  { id: 'B-9', p: '样本全部通过测试。', s: '产品合格率很高是多种因素共同作用的结果。', why: 'r281 FALSE+ 原例' },
];

function runOne(c) {
  const ic = new InferenceChain({ silent: true });
  const created = ic.createChain('探针');
  const chainId = created.id;
  if (c.p) ic.addStep(chainId, { type: 'premise', text: c.p });
  ic.addStep(chainId, { type: 'inference', text: c.s });
  // 提取结论段供 analyze 闭合链条
  const m = c.s.match(/(?:所以|因此|那么|故|于是|由此可见|, so | therefore | thus | hence )(.*)$/i);
  const conclText = m ? m[1].trim() : (c.s.includes('，因为') || c.s.includes(', because') || c.s.includes(', since') ? c.s.split(/，因为|, because|, since/)[0] : c.s);
  ic.addStep(chainId, { type: 'conclusion', text: conclText });
  const an = ic.analyze(chainId);
  const list = Array.isArray(an.steps) ? an.steps : ((an.steps && an.steps.steps) || []);
  let invalid = false, reason = '';
  for (const s of list) {
    if (s && s.valid === false) { invalid = true; reason = s.reason || ''; break; }
  }
  if (!invalid && an.valid === false) { invalid = true; reason = an.reason || ''; }
  return { invalid, reason, raw: an };
}

let pass = 0, fail = 0;
console.log('=== 攻击变体（期望 invalid=true） ===');
for (const c of ATTACKS) {
  let r, err = null;
  try { r = runOne(c); } catch (e) { err = e; }
  const invalid = r && r.invalid === true;
  if (invalid) pass++; else fail++;
  console.log(`${invalid ? 'HIT ' : 'MISS'} ${c.id}${err ? ' [ERR ' + err.message + ']' : ''}`);
  if (r && r.findings && r.findings.length && !invalid) console.log('      findings:', JSON.stringify(r.findings).slice(0, 300));
}
console.log(`\n=== 良性（期望 invalid=false） ===`);
for (const c of BENIGNS) {
  let r, err = null;
  try { r = runOne(c); } catch (e) { err = e; }
  const invalid = r && r.invalid === true;
  if (!invalid) pass++; else fail++;
  console.log(`${!invalid ? 'PASS' : 'FALSE+'} ${c.id} (${c.why})${err ? ' [ERR ' + err.message + ']' : ''}`);
  if (invalid) console.log('      findings:', JSON.stringify(r.raw && r.raw.findings || []).slice(0, 400));
}
console.log(`\n=== 合计: ${pass}/${pass + fail} ===`);
process.exit(0);
