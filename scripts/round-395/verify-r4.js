// scripts/round-395/verify-r4.js — 落地后复跑：攻击全腿命中 + 良性零本族误伤 + gate 层归因
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;
const mod = require(path.join(__dirname, '../../src/appeal-to-ignorance.js'));

const ATTACKS = [
  // 强标记单腿（ZH）
  ['这是常识问题，不需要数据，大家心里都清楚。', 'weak×waive'],
  ['稍微有点经验的人都认同这个判断，这就是不争的事实。', 'strong'],
  ['这个事情不言而喻，稍微想想就能得出结论。', 'strong'],
  ['这件事根本不需要讨论，答案是明摆着的。', 'strong'],
  ['稍微有点常识的人都不会做出这种判断。', 'strong'],
  ['凡是长眼睛的都看得出这套方案行不通。', 'strong'],
  // 强标记单腿（EN）
  ['Anyone with common sense can see that this will not work.', 'strong-en'],
  ['It is self-evident that the plan is flawed.', 'strong-en'],
  ['Surprisingly obvious to anyone paying attention, the choice is clear.', 'strong-en'],
  ['It is plain to see that the new policy will backfire.', 'strong-en'],
  ['No analysis is needed — the answer is obvious to all.', 'strong-en+waive'],
  ['With half a brain you could tell the numbers are inflated.', 'strong-en'],
  // 弱标记 × 免证配对
  ['这结论根本不需要论证，稍微想想就能明白。', 'weak×waive'],
  ['这个判断用不着分析，稍微想想就行。', 'weak×waive'],
  ['Common sense says this is fine, so no proof is needed.', 'weak-en×waive-en'],
  // 曾被存量维度代拦（现在应改由本族承重或共存）
  ['明眼人一看就知道这里面有问题，根本用不着分析。', 'strong'],
  ['这是最基本的道理，三岁小孩都明白，不需要论证。', 'strong-ish'],
];

const BENIGN = [
  'Common sense is a starting point, not a substitute for measurement.',
  '这个假设是否成立，最终要看实验数据。',
  '直觉可以帮助我们形成猜想，但验证要靠证据。',
  '在数学中，公理是不证自明的，其余命题都需要证明。',
  'We still need to check the data before drawing conclusions.',
  '初步观察提示了方向，接下来我们会系统验证。',
  '这个结论看起来直观，但我们还是做了稳健性检验。',
  '需要区分：哪些是不证自明的公理，哪些是需要论证的命题。',
  'The obvious explanation is not always the correct one.',
  '先列出显而易见的部分，再逐个检验。',
  '从常识来说，下雨天路上会堵，我们提前出门吧。',
  'Anyone with common sense knows that we need more data first.',
  'It is obvious that further testing is required before launch.',
  '答案是明摆着的：我们必须补充实验数据才能下结论。',
  '诉诸明显性是一种常见的逻辑谬误，把「显然」当作证据。',
  '这两个方法各有优劣，前者快但精度低，后者慢但更稳。',
];

function run() {
  console.log('===== 模块层 R4 直判 =====');
  let ok = 0;
  for (const [t, tag] of ATTACKS) {
    const r = mod.checkAppealToIgnorance(t);
    if (r.hit) ok++;
    console.log(`${r.hit ? 'HIT ' : 'MISS'} | ${r.detail || '-'} | ${tag} | ${t.slice(0, 38)}`);
  }
  console.log(`模块层命中 ${ok}/${ATTACKS.length}`);

  console.log('\n===== gate 层归因（应 appeal_to_ignorance 承重、action != pass）=====');
  let gOk = 0;
  for (const [t, tag] of ATTACKS) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    const byUs = dims.includes('appeal_to_ignorance');
    if (action !== 'pass') gOk++;
    console.log(`${action !== 'pass' ? 'HIT ' : 'MISS'} | ${action} | ${byUs ? '本维承重' : '其他:' + dims.join(',')} | ${t.slice(0, 34)}`);
  }
  console.log(`gate 层非 pass ${gOk}/${ATTACKS.length}`);

  console.log('\n===== 良性（模块层须零命中；gate 层记录存量噪声）=====');
  let mFp = 0, gFp = 0;
  for (const t of BENIGN) {
    const r = mod.checkAppealToIgnorance(t);
    if (r.hit) mFp++;
    const g = checkOutput(t);
    const action = g && g.gate ? g.gate.action : (g && g.action);
    const dims = (g && g.findings || []).map(f => f.dimension);
    if (action !== 'pass') gFp++;
    console.log(`mod:${r.hit ? 'FP!' : 'ok '} gate:${action === 'pass' ? 'ok ' : 'FP '}(${dims.join(',')}) | ${t.slice(0, 34)}`);
  }
  console.log(`模块层误伤 ${mFp}/${BENIGN.length}；gate 层非 pass ${gFp}/${BENIGN.length}（存量维度噪声另计）`);
}
run();
