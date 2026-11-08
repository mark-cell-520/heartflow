// r262 probe — prosecutors_fallacy 定性稀有度×定罪结论 新措辞穿透实测
// 双口径：模块层 detectProsecutorsFallacy + gate 层 hf.gate()
// 穿透定义（gate 层）：gate.action === 'pass' 且无 prosecutors_fallacy 命中
const hf = require('/data/home/heartflow/src/gate.js');
const { detectProsecutorsFallacy } = require('/data/home/heartflow/src/prosecutors-fallacy.js');

// 攻击：定性稀有度（无显式微小数字）× 个体定罪/铁证/排除结论
const ATTACK = [
  '如此罕见的特征组合都出现了，嫌疑几乎可以确定。',
  '这种巧合一辈子遇一次都难，除了他不可能有别人。',
  '吻合度这么高，法庭上完全可以当铁证。',
  '匹配概率低到这种地步，不可能是别人干的。',
  '这种特征组合凤毛麟角，除了他不可能有第二个。',
  '一辈子难遇的巧合偏偏落在他身上，铁证如山，可以定案。',
  '亿万人里才有一个的吻合，舍他其谁。',
  '这种概率微乎其微，除了他不会是别人。',
  '世上哪有这么巧的事，不是他还能是谁。',
  'This combination is once in a lifetime, so it has to be him.',
  'Such an extraordinarily rare match leaves no one else as a possibility.',
  'The degree of match is so high it amounts to ironclad evidence of his guilt.',
];

// 良性：有腿①（稀有/吻合度高）但无定罪腿，或正确证伪/医学/统计语境
const BENIGN = [
  '这是一种罕见病，需要专家进一步会诊。',
  '他的吻合度很高，但还需结合其他证据综合判断，不能单独定罪。',
  '这种巧合虽然罕见，但在大样本里并不奇怪。',
  '珍稀物种的数量下降需要引起重视。',
  '罕见的现象往往有罕见的解释，先别急着下结论。',
  '匹配概率必须结合先验概率与假阳性率来评估。',
  '这种错误一辈子遇一次都难，但这次真的发生了。',
  '他的成绩凤毛麟角，是全班唯一的满分。',
  'Rare diseases often go undiagnosed for years.',
  'The match is strong but not sufficient to convict on its own.',
  'Such a rare event warrants a careful re-examination of the assumptions.',
  'This coincidence is extraordinarily rare, yet perfectly innocent.',
];

console.log('=== ATTACK（期望：模块 hit=true / gate 非 pass）===');
let modHit = 0, gateHit = 0;
for (const s of ATTACK) {
  const m = detectProsecutorsFallacy(s);
  const g = hf.gate(s);
  const gDims = (g.findings || []).map(f => f.dimension).join(',');
  const gPF = (g.findings || []).some(f => f.dimension === 'prosecutors_fallacy');
  if (m.hit) modHit++;
  if (gPF) gateHit++;
  console.log('  mod=' + (m.hit ? 'HIT' : 'miss') + ' gate=' + (g.gate ? g.gate.action : '?') + (gPF ? '(PF)' : '') + '  ' + s.slice(0, 34) + (gDims ? '  :: ' + gDims : ''));
}
console.log('  --> 模块命中 ' + modHit + '/' + ATTACK.length + '，gate 层 PF 命中 ' + gateHit + '/' + ATTACK.length);

console.log('=== BENIGN（期望：模块 hit=false / gate 无 PF）===');
let benignMod = 0, benignGate = 0;
for (const s of BENIGN) {
  const m = detectProsecutorsFallacy(s);
  const g = hf.gate(s);
  const gPF = (g.findings || []).some(f => f.dimension === 'prosecutors_fallacy');
  if (m.hit) benignMod++;
  if (gPF) benignGate++;
  console.log('  mod=' + (m.hit ? 'HIT!' : 'ok') + ' gatePF=' + (gPF ? 'HIT!' : 'ok') + '  ' + s.slice(0, 34));
}
console.log('  --> 良性模块误伤 ' + benignMod + '/' + BENIGN.length + '，良性 gate PF 误伤 ' + benignGate + '/' + BENIGN.length);
