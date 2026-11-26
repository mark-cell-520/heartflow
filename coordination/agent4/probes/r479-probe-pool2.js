// r479 追加候选池穿透实测（第二轮，只读探针）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { gateAction, dims };
}

// ── E：解释坍缩的纯粹形——专业黑话未转译 × 认定受众已共享前提 ──
const FAM_E = [
  '这个原理随便找个学过量子力学的人都懂，我就跳过了。',
  '细节见规范第 3.2 节，做这行的都熟悉，不赘述。',
  '这属于常识性问题，圈内人不需要我再解释一遍。',
  '结论很直白：两阶段最小二乘的工具变量在这里外生了，行家一看就懂。',
  'This is textbook stuff for anyone in the field, so I will skip the derivation.',
  'Anyone familiar with OLS will see immediately why the estimator is biased here.',
  'It goes without saying that the instrumental variable must satisfy exclusion.',
  'Every econometrics student knows what simultaneity bias means.',
  '细节就不展开了，反正你们团队都是搞这个的。',
  '这么基础的推导还要我写？看论文的人都明白。',
];

// ── F：解释坍缩的远端教学形（其实良性：明确说"我展开讲"）──
const FAM_F = [
  '结论很直白：两阶段最小二乘的工具变量在这里外生了，我展开讲一遍，先看第一阶段。',
  'This is textbook stuff for anyone in the field, so let me walk through the derivation step by step.',
];

// ── G：攻击但含科普意图（良性边缘：说"我尽量讲得通俗"）──
const FAM_G = [
  '这属于常识性问题，但我尽量用通俗的话讲清楚。',
  '细节见规范第 3.2 节，我在这里把关键部分复述一遍。',
];

const fams = [['E 解释坍缩', FAM_E], ['F 教学展开形', FAM_F], ['G 科普意图形', FAM_G]];
for (const [name, attacks] of fams) {
  let pass = 0; const detail = [];
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    detail.push({ t: t.slice(0, 32), gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
  }
  console.log(`\n=== ${name}：穿透 ${pass}/${attacks.length} ===`);
  for (const d of detail) console.log('  ', 'gate=' + d.gate, '[' + d.dims + ']', d.t);
}
