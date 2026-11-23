// r443 接线：第 282 维度 protopathic_bias（反向因果/原反因果偏误）
// 判据：三腿共现（SYMPTOM 前驱症状 × EXPOSURE 症状驱动暴露 × OUTCOME
// 疗效归因宣告 + 邻近窗 + 顺序校验）+ 四组豁免，缺一不判。
// 覆盖：ZH/EN 攻击族逐常量承重、逐腿拆解、豁免组、良性负例。
const assert = require('assert');
const path = require('path');

const { checkProtopathicBias, __internals } = require(path.resolve(__dirname, '../src/protopathic-bias.js'));
const I = __internals();

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (e) { failed++; console.log('  FAIL -', name, '::', e.message); }
}

// 三腿词表逐常量承重：每个词都必须在 detail 里真实出现
function legsHit(text, sy, ex, oc) {
  const r = checkProtopathicBias(text);
  if (!r.hit) return 'no-hit';
  for (const w of sy) if (!r.detail.includes(w)) return 'symptom:' + w;
  for (const w of ex) if (!r.detail.includes(w)) return 'exposure:' + w;
  for (const w of oc) if (!r.detail.includes(w)) return 'outcome:' + w;
  return null;
}

// ---------- 1. 攻击族 ZH ----------
const ATTACKS_ZH = [
  ['咖啡-疲倦', '因为感到疲倦，老王开始每天喝咖啡提神，所以喝咖啡让人精力充沛。', ['疲倦'], ['喝咖啡'], ['所以']],
  ['姜茶-胃痛', '她胃痛才喝的姜茶，一年后胃病痊愈，可见姜茶治胃病。', ['胃痛'], ['姜茶'], ['可见']],
  ['甘草片-咳嗽', '患者因早期咳嗽开始服用甘草片，因此甘草片治愈了咳嗽。', ['咳嗽'], ['开始服用'], ['因此']],
  ['钙片-关节疼痛', '感到关节疼痛的人开始补充钙片，因此补钙改善了关节健康。', ['关节疼痛'], ['补充'], ['因此']],
  ['中药-失眠', '他长期失眠，便开始喝中药调理，一个月后痊愈，可见中药治失眠。', ['失眠'], ['喝'], ['可见']],
];
for (const [name, text, sy, ex, oc] of ATTACKS_ZH) {
  t('attack zh ' + name, () => {
    const err = legsHit(text, sy, ex, oc);
    assert.strictEqual(err, null, 'leg mismatch: ' + err);
  });
}

// ---------- 2. 攻击族 EN ----------
const ATTACKS_EN = [
  ['coffee-fatigue', 'Because he felt fatigue, he started drinking coffee every day, so drinking coffee boosts energy.', ['fatigue'], ['drinking'], ['so']],
  ['treatment-early-symptoms', 'Children with early symptoms got the treatment, and they improved, so the treatment works.', ['early symptoms'], ['got'], ['so']],
  ['drug-symptomatic', 'Symptomatic patients received the drug first, which is why the drug looks so effective.', ['Symptom'], ['received'], ['why']],
  ['vitamin-pain', 'Patients with joint pain began taking vitamin D, and their pain subsided, proving the vitamin works.', ['pain'], ['taking'], ['proving']],
  ['herbal-tea-stomach', 'Her stomach hurt so she drank ginger tea, and the pain went away, which proves ginger tea heals gastritis.', ['hurt'], ['drank'], ['proves']],
];
for (const [name, text, sy, ex, oc] of ATTACKS_EN) {
  t('attack en ' + name, () => {
    const err = legsHit(text, sy, ex, oc);
    assert.strictEqual(err, null, 'leg mismatch: ' + err);
  });
}

// ---------- 3. 逐腿承重：拆掉任一条腿必须 miss ----------
t('leg1 symptom removal -> miss', () => {
  const text = '她每天都喝姜茶，一年后胃病痊愈，可见姜茶治胃病。';
  assert.ok(checkProtopathicBias(text).hit === false, 'symptom-less should miss');
  assert.strictEqual(I.SYMPTOM_ZH.test(text), false, 'symptom regex must not match');
});

t('leg2 exposure removal -> miss', () => {
  const text = '她胃痛，一年后胃病痊愈，可见自愈能力很强。';
  assert.ok(checkProtopathicBias(text).hit === false, 'exposure-less should miss');
  assert.strictEqual(I.EXPOSURE_ZH.test(text), false, 'exposure regex must not match');
});

t('leg3 outcome-attribution removal -> miss', () => {
  const text = '她胃痛才喝的姜茶。';
  assert.ok(checkProtopathicBias(text).hit === false, 'bare exposure should miss');
  assert.strictEqual(I.OUTCOME_ZH.test(text), false, 'outcome regex must not match');
});

t('order check: exposure before symptom -> miss', () => {
  // 暴露先于症状出现，暴露不是被症状驱动的（预防性暴露描述）
  const text = '他从去年开始每天服用维生素C，今年春天得了感冒。';
  assert.ok(checkProtopathicBias(text).hit === false, 'exposure-before-symptom should miss');
});

t('leg constants are non-empty tables', () => {
  for (const k of ['SYMPTOM_ZH', 'EXPOSURE_ZH', 'OUTCOME_ZH', 'SYMPTOM_EN', 'EXPOSURE_EN', 'OUTCOME_EN']) {
    assert.ok(I[k].source.length > 20, k + ' too small');
  }
  for (const k of ['EXEMPT_CAUSAL_DISCIPLINE_ZH', 'EXEMPT_MULTICAUSE_ZH', 'EXEMPT_HEDGE_ZH', 'EXEMPT_PEDAGOGY_ZH']) {
    assert.ok(I[k].source.length > 20, k + ' too small');
  }
});

// ---------- 4. 豁免组 ----------
const EXEMPTED = [
  ['因果纪律-zh', '这里的患者服药前症状更重，按适应证用药，这是典型的反向因果，不能说明药物无效。'],
  ['因果纪律-en', 'This is confounding by indication — the sickest patients got the drug, so the control group is essential.'],
  ['统计教学-zh', '教材里这个案例是讲原反因果偏误的经典反例。'],
  ['统计教学-en', 'This is a textbook case of protopathic bias in observational studies.'],
  ['对冲-zh', '也许姜茶确实有帮助，但也可能只是安慰剂效应。'],
  ['预防医学-en', 'The study enrolled asymptomatic participants and gave them the vaccine as primary prevention.'],
];
for (const [name, text] of EXEMPTED) {
  t('exempt ' + name, () => {
    assert.ok(checkProtopathicBias(text).hit === false, 'should be exempt: ' + text);
  });
}

// ---------- 5. 良性负例（含边缘良性） ----------
const BENIGN = [
  ['多因陈述', '感冒是多因共同造成的，休息、营养和免疫力都起作用。'],
  ['病因不确定', '咳嗽可能由过敏或感染引起，需要对照才能判断。'],
  ['待验证', '这个疗法的疗效尚未通过随机对照试验验证。'],
  ['无前驱症状-自选择族', '这些老人长期服用维生素D，所以他们骨骼健康，可见维生素D能防骨折。'],
  ['偏好非症状', '他每天喝咖啡是因为喜欢咖啡的味道，与疲劳无关。'],
  ['en-multi-cause', 'Fatigue can be caused by sleep, diet, or stress; multiple factors are involved.'],
  ['en-control-needed', 'We need a control group before attributing the improvement to the drug.'],
  ['en-prevention', 'Preventive vitamin D use in healthy elderly is unrelated to prior symptoms.'],
];
for (const [name, text] of BENIGN) {
  t('benign ' + name, () => {
    assert.ok(checkProtopathicBias(text).hit === false, 'false positive: ' + text);
  });
}

// ---------- 6. 返回结构 ----------
t('return shape on hit', () => {
  const r = checkProtopathicBias('她胃痛才喝的姜茶，一年后胃病痊愈，可见姜茶治胃病。');
  assert.ok(r.hit === true);
  assert.ok(typeof r.score === 'number' && r.score > 0 && r.score <= 1);
  assert.ok(typeof r.count === 'number');
  assert.ok(typeof r.detail === 'string' && r.detail.length > 10);
  assert.ok(r.detail.includes('zh'));
});
t('return shape on miss', () => {
  const r = checkProtopathicBias('今天天气很好。');
  assert.strictEqual(r.hit, false);
  assert.strictEqual(r.score, 0);
});

console.log('\nround-443-protopathic-bias:', passed, 'passed /', failed, 'failed');
if (failed > 0) process.exit(1);
