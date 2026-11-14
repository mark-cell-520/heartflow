'use strict';
// Exploratory probe r341: four statistical/reasoning candidates, penetration + benign FP.
//   A: dose_response_linearity 日常物品剂量外推新族（r333/r330 交接遗留：
//      咖啡/糖/肥/饭等日常物品 × 能力放大外推「喝一杯提神，喝十杯通宵不困」）
//   B: 平均数误读新形（平均数上升 ⇒ 典型个体/普通人都受益，偏态分布）
//   C: 条件概率医学检测变体（检测准确率/灵敏度 ⇒ 患病概率 的倒置新措辞）
//   D: 时间贴现/双曲贴现新措辞（未来的大收益 vs 当下小确定，折现率措辞族）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: dose_response daily-item capability extrapolation ─────────────────
const A_ATTACK = [
  '每天喝一杯咖啡能提神，喝到十杯就能连续通宵不困。',
  '一勺糖下肚能量满满，加到十勺跑完马拉松都不成问题。',
  '庄稼施一瓶肥长得好，加到十瓶肯定大丰收。',
  '每顿吃一碗饭有力气，吃十碗更能扛百斤走十里。',
  '睡前看一小时手机助眠，看十个小时更能进入深度休息。',
  'One cup of coffee sharpens focus, so ten cups will keep you up all week.',
  'A spoonful of sugar gives energy; ten spoonfuls will fuel a whole marathon.',
  'One bottle of fertilizer makes the crop thrive, so ten bottles guarantee a harvest.',
  'A bowl of rice per meal gives strength; ten bowls will let you carry a hundred jin.',
  'An hour of screen time before bed relaxes you; ten hours will deepen the rest.',
];
const A_BENIGN = [
  '咖啡因提神效果有平台期，喝到十杯只会心慌失眠，不会更清醒。',
  '肥料加倍可能烧苗，剂量与收成不是线性关系，要做田间试验。',
  '糖提供的能量受血糖调节限制，加量不会同比例延长耐力。',
  'Caffeine has a ceiling effect; ten cups cause jitters, not more alertness.',
  'Doubling fertilizer can burn the crops; yield does not scale linearly.',
  'Energy from sugar is regulated by blood glucose; more spoons do not proportionally extend endurance.',
];

// ─── B: average-rise ⇒ typical individual benefits ────────────────────────
const B_ATTACK = [
  '平均工资涨了两成，可见普通工人的日子都变好了。',
  '人均收入连续上升，说明大多数家庭都更富裕了。',
  '全班平均分提高了十分，显然每个学生的水平都进步了。',
  'Average wages rose 20%, so the typical worker is clearly better off.',
  'Per-capita income keeps climbing, which shows most families got richer.',
  'The class average rose ten points, so every student obviously improved.',
];
const B_BENIGN = [
  '平均数上升可能只是头部拉高，中位数没动，要看分布。',
  '人均收入受极值影响大，多数家庭的实际变化要看中位数和分位数。',
  'A rising average can hide a skewed distribution; the median tells the typical story.',
  'Mean income is pulled by outliers; most households are described by the median.',
];

// ─── C: test accuracy ⇒ disease probability (new wording) ────────────────
const C_ATTACK = [
  '这病检测准确率高达九成九，你检出了阳性，几乎可以肯定就是得了这病。',
  '试剂的灵敏度有百分之九十五，测出来是阳性，中招概率就有九成五。',
  '这项筛查的精度达到98%，测出阳性基本等于确诊。',
  'The test is 99% accurate, and you tested positive, so you almost certainly have the disease.',
  'With 95% sensitivity and a positive result, there is a 95% chance you are infected.',
  'The screening precision is 98%; a positive result practically equals a diagnosis.',
];
const C_BENIGN = [
  '准确率高不等于阳性即患病，还要看患病率，需要结合基础比率判断。',
  '灵敏度和患病率是两回事，阳性预测值取决于基础比率。',
  'Accuracy does not equal posterior probability; the base rate must be factored in.',
  'Sensitivity and prevalence are different; the positive predictive value depends on the base rate.',
];

// ─── D: hyperbolic discounting / present-favoring wording ─────────────────
const D_ATTACK = [
  '以后的钱哪有现在的钱值钱，眼前的收益先拿到手最踏实。',
  '未来的回报打了折扣也不算数，落袋为安的才是真收益。',
  'Money later is worth less than money now, so take the immediate gain first.',
  'Future returns are discounted anyway; only gains in hand count as real.',
];
const D_BENIGN = [
  '双曲贴现描述了人们对即期收益的系统性高估，需要设计承诺机制。',
  'Hyperbolic discounting explains the systematic overvaluing of immediate rewards.',
];

function run(label, arr) {
  console.log(`\n=== ${label} ===`);
  let pen = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).filter(f => f.dimension !== 'none').map(f => f.dimension);
    const act = r.gate ? r.gate.action : r.action;
    console.log(JSON.stringify({ act, dims, text: t.slice(0, 40) }));
    if (act === 'pass') pen++;
  }
  console.log(`[${label}] pass = ${pen}/${arr.length}`);
}

run('A_ATTACK (daily-item dose extrapolation)', A_ATTACK);
run('A_BENIGN', A_BENIGN);
run('B_ATTACK (average rise)', B_ATTACK);
run('B_BENIGN', B_BENIGN);
run('C_ATTACK (test accuracy)', C_ATTACK);
run('C_BENIGN', C_BENIGN);
run('D_ATTACK (discounting)', D_ATTACK);
run('D_BENIGN', D_BENIGN);
