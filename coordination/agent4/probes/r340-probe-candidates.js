'use strict';
// Exploratory probe r340: five statistical/scientific candidates, penetration + benign FP.
//   A: 符合方案分析偏误 per-protocol（只分析坚持用药/完成全程者的疗效×治愈率断言）
//   B: 原发症状用药倒置 protopathic bias（服药后确诊 ⇒ 药致病，早期症状促用药）
//   C: 长度时间偏误 length-time bias（筛查更易检出进展慢病灶 ⇒ 筛查延命）
//   D: 截断坐标轴/误导图表域（轴不从零起 ⇒ 差异被夸大×数量断言）
//   E: 回忆偏误 recall bias（病例组更记得接触史 × 风险倍数断言）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: per-protocol / completer analysis ─────────────────
const A_ATTACK = [
  '只看坚持用完整个疗程的患者，治愈率高达95%，说明这个药确实有效。',
  '剔除了那些不耐受的病例之后，治疗组的复发率显著更低，可见疗法可靠。',
  '完成全程治疗的病人效果都很好，所以不能因为退出的人多就否定疗效。',
  '按实际接受了多少治疗来分析，依从性好的患者生存期明显更长，这证明治疗有效。',
  'Among patients who completed the full course, the cure rate was 95%, so the drug clearly works.',
  'After excluding those who could not tolerate it, the treatment group had far fewer recurrences.',
  'The patients who adhered to the regimen survived much longer, which proves adherence drives the benefit.',
  'Looking only at completers, the therapy shows a significant effect on survival.',
];
const A_BENIGN = [
  '只看完成疗程的患者会破坏随机化，依从性本身就是预后标志，需要按意向治疗分析。',
  '剔除不耐受病例属于符合方案分析，容易高估疗效，应报告两组全部随机化人群。',
  'Analyzing only completers breaks randomization; we need an intention-to-treat analysis.',
  'Per-protocol analysis overestimates benefit because adherence correlates with better prognosis.',
];

// ─── B: protopathic bias ──────────────────────────────────
const B_ATTACK = [
  '确诊前很多患者都在吃这种胃药，可见正是它导致了这种病。',
  '得病的人病发前普遍服用过这个药，足以证明服药是发病的原因。',
  '这些患者在确诊前一年内大量使用该药物，因此该药物是致病因素。',
  'Patients who developed the disease had all been taking this drug in the year before diagnosis, so the drug causes it.',
  'Most of those diagnosed had used the medication beforehand, which shows the medication led to the disease.',
  'The drug use preceded the diagnosis, so it must be the cause.',
];
const B_BENIGN = [
  '确诊前用药可能是疾病早期症状促使就医开药，需要厘清因果方向再下结论。',
  '用药早于诊断不等于用药致病，可能是原发症状导致用药，属反向因果。',
  'Drug use before diagnosis may reflect early symptoms of the disease, not causation.',
  'Preceding drug use could be protopathic bias — the illness itself prompted the prescription.',
];

// ─── C: length-time bias ──────────────────────────────────
const C_ATTACK = [
  '筛查检出的肿瘤大多生长缓慢，接受筛查后患者生存期明显更长，这说明筛查确实能延命。',
  '筛查发现的病例恶性程度低、进展慢，所以筛查组的生存时间更长，证明筛查有效。',
  '筛查能抓到那些本来发展就慢的病灶，患者因此多活了好几年，可见筛查的功劳。',
  'Screening detects slow-growing tumors, so screened patients live longer — proof that screening extends life.',
  'Because screening catches the indolent cases, survival in the screened group is much longer.',
  'The tumors screening finds are less aggressive, and those patients survive longer, so screening works.',
];
const C_BENIGN = [
  '筛查组生存期长可能只是长度时间偏误——更容易检出进展慢的病灶，要看总死亡率。',
  '检出以惰性病灶为主不代表延命，需要比较死亡率而非生存时间。',
  'Longer survival in screened patients may reflect length-time bias, not a true mortality benefit.',
  'Slow-growing tumors are over-represented among screen-detected cases; mortality must decide.',
];

// ─── D: truncated axis / misleading chart domain ───────────
const D_ATTACK = [
  '图表一目了然，这个指标从100跌到20，暴跌了整整八成。',
  '看这条曲线，A 从 98 掉到 95，足足跌了三个百分点，形势已经很严峻了。',
  '图表显示差距悬殊，一方是100另一方是80，高出了整整25%。',
  'The chart shows the value collapsed from 100 to 20, a devastating 80% drop.',
  'Look at the line: it fell from 98 to 95 — a dramatic decline of three full points.',
  'The graph makes the gap obvious: 100 versus 80, a 25% difference.',
];
const D_BENIGN = [
  '这张图的纵轴没有从零开始，视觉上的暴跌被夸大了，实际只下降了不到一个百分点。',
  '比较百分比变化要先看基数，98到95在零起点坐标下几乎看不出来。',
  'The y-axis is truncated; the visual cliff exaggerates what is a minor change.',
  'Percent change from a high base can look dramatic on a truncated axis.',
];

// ─── E: recall bias ───────────────────────────────────────
const E_ATTACK = [
  '病例组的患者能更清楚地回忆起自己接触过这种物质，对照组的记忆模糊得多，这说明接触史确实与发病相关。',
  '生病的人几乎都记得发病前接触过它，没生病的人大多想不起来，可见接触就是危险因素。',
  '患者组报告接触史的比例是对照组的三倍，说明该接触使发病风险升高了三倍。',
  'Cases recalled the exposure far more clearly than controls, so the exposure is linked to the disease.',
  'Patients remembered the exposure three times more often than controls, so it triples the risk.',
  'The diseased group recalled contact far more vividly, which shows contact causes the disease.',
];
const E_BENIGN = [
  '病例组与对照组的回忆不对称是回忆偏误的典型表现，结论需前瞻性研究验证。',
  '病例更卖力地搜寻病因记忆，回顾性接触史差异可能只是回忆偏误。',
  'Cases search their memories harder for causes; recall bias can inflate the association.',
  'Differential recall between cases and controls is classic recall bias, not proof of risk.',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 42) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('A_ATTACK (per-protocol)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (protopathic)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
run('C_ATTACK (length-time)', C_ATTACK);
run('C_BENIGN', C_BENIGN);
run('D_ATTACK (truncated axis)', D_ATTACK);
run('D_BENIGN', D_BENIGN);
run('E_ATTACK (recall bias)', E_ATTACK);
run('E_BENIGN', E_BENIGN);
