// r264 cherry_picking 补丁后干跑（模块层 + gate 层 + 注入-删条）
const { checkCherryPicking, __internals } = require('/data/home/heartflow/src/cherry-picking.js');
const { gate } = require('/data/home/heartflow/src/gate.js');
const hit = (t, inj) => checkCherryPicking(t, inj).hit === true;

const attacks = [
  '报告里专挑顺风顺水的年份摆出来，结论当然好看。',
  '团队专门把顺风顺水的年份晒出来，结论当然可靠。',
  '他把难看的季度一遮，趋势曲线照样漂亮。',
  'The deck cherry-picked the flattering years, so the growth story looks great.',
  'She only showcased the stores that beat target, so the growth story is great.',
];
const benign = [
  '报告里专挑顺风顺水的年份摆出来，同时明确标注了这只是选择性呈现。',
  '他把难看的季度也一并列出，附上了完整口径说明。',
  'The deck included every year with the full methodology disclosed.',
  'She only showcased the stores that beat target, and the board asked for the full picture.',
  '他专挑顺风顺水的案例摆出来，不过这只是选择性呈现，不能当作结论成立的依据。',
  '报告把好年份和坏年份都列了出来，结论当然仅供参考。',
];

let ah = 0, ag = 0, bh = 0;
for (const s of attacks) {
  const m = hit(s);
  const dim = (gate(s).findings || []).some(x => x.dimension === 'cherry_picking');
  if (m) ah++;
  if (dim) ag++;
  console.log((m ? 'HIT' : 'miss') + ' gate=' + (gate(s).gate.action) + (dim ? '(dim)' : '') + '  ' + s.slice(0, 46));
}
for (const s of benign) {
  const m = hit(s);
  const dim = (gate(s).findings || []).some(x => x.dimension === 'cherry_picking');
  if (m) bh++;
  if (m || dim) console.log('误伤! ' + s.slice(0, 46));
}
console.log('==> 攻击 ' + ah + '/' + attacks.length + ' 模块命中, ' + ag + '/' + attacks.length + ' gate 维度承重; 良性误伤 ' + bh + '/' + benign.length);

// 注入-删条：删新模式后对应攻击转 miss
const INJ = [
  { arr: 'SEL_MARK_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_OBJ_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_VERB_ZH', idx: 1, atk: '团队专门把顺风顺水的年份晒出来，结论当然可靠。' },
  { arr: 'SEAL_ADV_ZH', idx: 1, atk: '报告里专挑顺风顺水的年份摆出来，结论当然好看。' },
  { arr: 'SEL_NEG_QUAL_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEL_SUPPRESS_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEAL_NOUN_ZH', idx: 1, atk: '他把难看的季度一遮，趋势曲线照样漂亮。' },
  { arr: 'SEAL_NOUN_EN', idx: 1, atk: 'The deck cherry-picked the flattering years, so the growth story looks great.' },
  { arr: 'SEL_EN_VERB', idx: 1, atk: 'She only showcased the stores that beat target, so the growth story is great.' },
  { arr: 'SEL_EN_MARK', idx: 1, atk: 'She only showcased the stores that beat target, so the growth story is great.' },
];
for (const c of INJ) {
  const full = __internals()[c.arr];
  if (!(full.length > c.idx)) { console.log('注入失败: ' + c.arr + ' 长度不足'); continue; }
  const inj = {}; inj[c.arr] = full.filter((re, i) => i !== c.idx);
  const after = hit(c.atk, inj);
  console.log('注入 ' + c.arr + '[' + c.idx + '] → ' + (after ? '未变红(FAIL)' : '变红(承重)') + '  ' + c.atk.slice(0, 30));
}
