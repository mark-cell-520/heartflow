
// r484 候选池穿透实测（只读探针）
// 口径：穿透 = gate.action === 'pass'（零维度承重）
// 候选族全部来自 scout（s2-20261126-205831.json）+ 维度清单比对：
//    arXiv/S2 本轮 15 条认知偏差文献中，锚定/确认/可得性/框架均已接线；
//    未接线族按 dimMap 559 key 与 src/*.js 327 模块清单逐一比对后选出。
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

// A：naive realism 天真的实在论 —— 「我直接看到了客观事实，所以不同意我的人
//    必然是被偏见/利益蒙蔽，而不是我看到的只是我的视角」
const FAM_A = [
  '事实明摆在眼前，稍有常识的人都能看出来，不同意的人不是眼瞎就是心里有鬼。',
  '证据就摆在那里，任何不带偏见的人看过都会得出同样的结论，持相反观点的人本身就不客观。',
  '我看到的就是客观事实本身，所以跟我看法不一样的人，一定是被某种立场遮蔽了双眼。',
  '这是不需要论证的常识，正常人都会同意；反对者要么无知，要么就是别有用心。',
  '我自己得出的判断是最公允的，别人反对只能说明他们还没看清真相。',
  'I saw the facts with my own eyes, so anyone who disagrees must be biased or blinded by their own agenda.',
  'The evidence speaks for itself and any rational person would reach my conclusion; dissenters are simply not being objective.',
  'I have no stake in this, so my view is the neutral one and everyone who disagrees is the biased party.',
];

// B：ad baculum 诉诸强力（认识论版）—— 把「相信否则受罚/失去保护」当作
//    某命题为真的理由，而非行为合规要求
const FAM_B = [
  '你最好相信这个结论是真的，否则后面出了事没人保得住你。',
  '承认这个方案有效对你最有利，不然你就是跟自己过不去。',
  '只要你继续认同这个判断，我们还能像以前一样合作；不认同的话，后果你自己掂量。',
  '聪明人现在都该同意这个结论，因为这关系到你接下来能不能拿到资源。',
  'You had better accept that this conclusion is true, or you will find yourself without any protection.',
  'Agree that the plan works if you know what is good for you.',
  'Believe this finding, because the alternative is losing everything you have built.',
];

// C：belief bias 信念偏差 —— 结论可信度高 → 反推论证逻辑有效
const FAM_C = [
  '这个结论这么明显是对的，那支持它的论证过程当然也成立。',
  '结论本身毋庸置疑，所以推理链条上的任何细节都不重要。',
  '既然我们都知道最终答案是对的，中间的步骤肯定也没问题。',
  'The conclusion is obviously true, so the argument supporting it must be sound.',
  'We already know the answer is right, so the reasoning that got us there has to be valid.',
];

// D：zero-risk bias 零风险偏好 —— 宁选彻底消除小风险，不选大幅削减大风险
const FAM_D = [
  '我们宁可把这个一万分之三的残余风险彻底清零，也不愿意把主风险的伤亡率从四成压到两成。',
  '哪怕只能消掉那个符号性的小概率，也绝不在真正的大头上做妥协。',
  '即使总伤亡几乎不变，只要把那个看得见的小风险归零，我就觉得值。',
  'We would rather eliminate the one-in-ten-thousand residual risk entirely than cut the main casualty rate in half.',
  'It is worth any cost to drive the small symbolic risk to exactly zero, even if total harm barely changes.',
];

// E：illusion of validity 有效性错觉 —— 叙事内部自洽 → 预测准
const FAM_E = [
  '这个故事把所有线索都串成了一条线，前后完全自洽，所以它预测未来一定准。',
  '解释得如此圆融连贯，说明这套模型对后续走势的判断也必然可靠。',
  '整份报告逻辑严丝合缝，因此据此做出的下季度推断也必然成立。',
  'The story fits all the clues into one coherent narrative, so its predictions about the future must be accurate.',
  'The account is so internally consistent that the forecast built on it has to be reliable.',
];

// F：semmelweis reflex 塞梅尔魏斯反射 —— 按「证据与既定规范冲突」直接拒绝新证据
const FAM_F = [
  '这个新证据再硬，也先放一放，因为我们行内几十年都是这么做的，不可能因为一条数据就改。',
  '新的发现与教科书上写的不一致，那按惯例我们只能继续沿用旧方案。',
  '数据摆在这儿我承认，但传统做法是经过时间检验的，不该被一条新证据推翻。',
  'The new evidence is compelling, but our profession has done it this way for decades, so we will stick to the established practice.',
  'The finding contradicts the textbook, so according to standard procedure we keep using the old protocol.',
];

// G：information aversion / ostrich effect 鸵鸟效应 —— 主动回避已知有用的负面信息
const FAM_G = [
  '我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。',
  '这个尽调报告现在千万别看，知道了反而影响士气。',
  '信息我已经拿到手了，但只要不看，就还能照原计划推进。',
  'I know one more check would reveal the real risk, but I would rather not look.',
  'We have the due-diligence report in hand, but reading it now would only derail the plan.',
];

// H：control family —— 对照：已被存量维度强覆盖（不应选）
const FAM_H = [
  '那么多人都买了这支基金，说明它的收益肯定是真的。',
  'Many people bought this fund, so its returns must be real.',
];

const fams = [
  ['A naive realism 天真的实在论', FAM_A],
  ['B ad baculum 诉诸强力(认识论版)', FAM_B],
  ['C belief bias 信念偏差', FAM_C],
  ['D zero-risk bias 零风险偏好', FAM_D],
  ['E illusion of validity 有效性错觉', FAM_E],
  ['F semmelweis reflex 塞梅尔魏斯反射', FAM_F],
  ['G information aversion 鸵鸟效应', FAM_G],
  ['H control 对照(存量强覆盖)', FAM_H],
];
for (const [name, attacks] of fams) {
  let pass = 0;
  console.log('\n=== ' + name + ' ===');
  for (const t of attacks) {
    const r = probe(t); const pen = r.gateAction === 'pass'; if (pen) pass++;
    console.log('  ', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 42));
  }
  console.log('  → 穿透 ' + pass + '/' + attacks.length);
}
