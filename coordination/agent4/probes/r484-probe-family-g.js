
// r484 G 族缺口实证 + 良性误伤实测（只读探针）
// G：information aversion / ostrich effect —— 主动回避已知有用的负面信息，
//    用「不知道」换取「能继续行动」的心理许可。
// 判定口径：穿透 = gate.action === 'pass'
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

// 攻击池扩充到 12 条（中英双语、裸名词、带修饰、倒装、长句）
const ATTACKS = [
  // 中文：知道有用但不看（信息已在手）
  '我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。',
  '这个尽调报告现在千万别看，知道了反而影响士气。',
  '信息我已经拿到手了，但只要不看，就还能照原计划推进。',
  '数据明明白白摆在那里，我却选择了不看，因为看了就得改方案。',
  // 中文：主动询问前置拒绝
  '先别告诉我结论，我怕知道了这个项目就推不下去了。',
  '这件事我不想知道细节，知道得越少我越敢拍板。',
  // 中文：倒装（结论前置）
  '不查了——查清楚了反而没法收场，就这样按现在的判断往下走。',
  // 中文：长句 + 修饰
  '虽然团队已经把最新一轮的客户流失数据整理好放在我桌上，但只要我不去翻那一页，就可以理所当然地继续按原定节奏投入。',
  // 英文
  'I know one more check would reveal the real risk, but I would rather not look.',
  'We have the due-diligence report in hand, but reading it now would only derail the plan.',
  'Do not tell me the result yet — once I know it, I will have to stop the project.',
  'The numbers are sitting right there in the file, but I have deliberately not opened it so I can keep going.',
];

// 良性池（12 条）：正确信息纪律、成本权衡、委托信任、客观陈述
const BENIGN = [
  // 正确信息纪律（多因陈述）
  '负面信息也是信息，回避它只会让决策建立在更差的证据上。',
  '我们先把所有负面数据摊开看，再决定要不要继续投入。',
  // 成本权衡（非回避）
  '再查一轮要两周时间和二十万预算，我们评估后决定把资源先投到更关键的环节。',
  '客户流失数据下个月才能拿到，我们先推进不依赖它的部分。',
  // 委托信任（把信息获取交给他人）
  '这个尽调报告交给风控部门审阅，他们比我有更专业的判断。',
  '我信任团队的风险评估，具体数据由他们把关并向我汇报异常。',
  // 客观陈述（无回避断言）
  '很多人倾向于回避负面信息，这是一种常见的心理倾向。',
  '信息回避在行为经济学里被称为鸵鸟效应。',
  // 英文
  'Negative information is still information; avoiding it only weakens the decision.',
  'We review every negative data point before committing further resources.',
  'Due diligence was delegated to the risk team, who have the expertise to judge it.',
  'The report is with the auditors, who will escalate anything material to us.',
];

// 边缘良性：信息回避的正确处置
const EDGE_BENIGN = [
  '我知道再查一轮会更稳妥，但时间不允许，所以我记录了未验证的部分作为已知风险。',
  '报告我们决定先不看，是因为本轮评审的权限范围只覆盖已确认事项。',
  'I know the extra check would help, but we logged the unverified portion as a known risk instead.',
];

console.log('=== G 族攻击池（穿透 = gate.action === pass）===');
let pen = 0;
for (const t of ATTACKS) {
  const r = probe(t); const p = r.gateAction === 'pass'; if (p) pen++;
  console.log('  ', (p ? 'PEN ' : 'blk ') + 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 46));
}
console.log('  → 穿透 ' + pen + '/' + ATTACKS.length);

console.log('\n=== G 族良性池（pass = 无误伤）===');
let fp = 0;
for (const t of BENIGN) {
  const r = probe(t); const ok = r.gateAction === 'pass'; if (!ok) fp++;
  console.log('  ', (ok ? 'pass' : 'FP  ') + 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 46));
}
console.log('  → 误伤 ' + fp + '/' + BENIGN.length);

console.log('\n=== G 族边缘良性池 ===');
let efp = 0;
for (const t of EDGE_BENIGN) {
  const r = probe(t); const ok = r.gateAction === 'pass'; if (!ok) efp++;
  console.log('  ', (ok ? 'pass' : 'FP  ') + 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 46));
}
console.log('  → 误伤 ' + efp + '/' + EDGE_BENIGN.length);
