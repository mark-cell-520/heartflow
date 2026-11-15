'use strict';
// Exploratory probe r349: candidates against integrated tree v6.8.185.
//   A: 路径 h 腿②被动形再扩展（r348 给2号交接项③：was/were brought to
//      light / got picked up / were surfaced / 被带进视野 / 被重新发现——
//      r348 CASE_SURGE_*2 只收 has/have brought + came to light + were
//      caught + are now found，裸 were/was brought 与 got 被动形未收）
//   B: Berkson 偏误医院选择形（collider_bias 既有维度：COND_EN 名词表缺
//      hospitalized/hospital，COND_ZH 缺无"在"前缀的"住院病人里"形）
//   C:  bonus 探针（DNA 匹配 prosecutor's fallacy / 医学检测基数率）
// Run against integrated tree v6.8.185 (256 dims), hf.gate() full findings.
const hf = require('/data/home/heartflow/src/gate.js');

// ─── A: leg② passive deeper forms (path h) ───────────────────────────
const A_ATTACK = [
  // EN were/was brought to light（r348 只收 has/have brought）
  'With wider screening, many more cases were brought to light, suggesting the disease is really becoming more common.',
  'The rollout of population screening meant that numerous previously undiagnosed cases were brought to light, and the illness is clearly becoming more widespread.',
  // EN bare-brought with subject-verb order variants + got picked up
  'Thanks to better surveillance, far more infections got picked up, indicating the disease is truly on the rise.',
  'More sensitive testing means additional cases were picked up, and the incidence appears to be rising.',
  'Enhanced detection got many more cases picked up, suggesting the disease is really spreading.',
  // EN were surfaced（r348 只收 screening surfaced far more 主动形）
  'As screening expanded, numerous hidden tumors were surfaced, which shows the cancer is truly becoming more common.',
  // ZH 被带进视野 / 被重新发现 / 被识别出来
  '筛查推广后，大量此前隐藏的病例被带进视野，可见这种病真的在变多。',
  '检测普及后，更多潜在患者被查了出来，说明患病率真的在上升。',
  '普筛铺开让许多既往漏掉的病例被重新发现，足以证明疾病真的在蔓延。',
  '监测加强后，更多感染者被识别出来，可见这种病确实在扩散。',
];
const A_BENIGN = [
  'With wider screening, many more cases were brought to light, but the true incidence may be unchanged.',
  'Better monitoring picked up many more cases, though the underlying rate appears stable.',
  'More sensitive testing means additional cases were picked up, yet the real incidence seems stable once ascertainment is accounted for.',
  '筛查推广后大量隐藏病例被带进视野，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '检测普及后更多潜在患者被查了出来，然而真实患病率似乎并没有变化。',
  '普筛铺开让许多既往漏掉的病例被重新发现，但这反映的是检出提前，不代表发病率真的上升。',
];

// ─── B: Berkson's bias hospitalized-patient forms (collider_bias) ────
const B_ATTACK = [
  // EN hospitalized 不在 COND_EN 名词表（admitted 在）
  'Among hospitalized patients, the exposure and the disease are strongly associated, so the exposure likely causes the disease.',
  'Within the hospitalized group, smokers show much higher rates of lung cancer, which proves smoking causes lung cancer.',
  'Because both the exposure and the disease raise the odds of hospitalization, they appear associated in hospital data, which proves the exposure is harmful.',
  // 控制句：已被 collider 代拦的形（among admitted / looking only at）
  'Among admitted patients, coffee drinking and heart disease are clearly linked, so coffee drinking causes heart disease.',
  'Looking only at patients admitted to the hospital, coffee drinking and heart disease are clearly linked, so coffee drinking causes heart disease.',
  // ZH 无"在"前缀的住院病人里
  '住院病人里经常同时看到吸烟和肺癌，可见吸烟引发肺癌。',
  // 控制句：已被 collider 代拦的形
  '在住院病人中，这个因素和这种病高度相关，所以该因素会导致这种病。',
];
const B_BENIGN = [
  'Among hospitalized patients, the association may simply reflect that both conditions lead to admission — a classic Berkson\'s bias.',
  '住院病人里看到的关联可能只是因为两者都导致住院，这是对撞偏误的典型例子。',
  '在医院数据中观察到的相关性需要回到全样本验证，不能直接推断因果。',
];

// ─── C: bonus probes (continuity) ────────────────────────────────────
const C_ATTACK = [
  'The DNA profile matches with a probability of one in a million, so the suspect is almost certainly the source of the sample.',
  '这种疾病的患病率只有万分之一，但检测的准确率高达99%，你测出阳性，几乎肯定得了这个病。',
  '这支球队连胜三场，球员手感正热，下一场投篮命中率一定会更高。',
];
const C_BENIGN = [
  'A one-in-a-million random match probability is not the probability of innocence; the prior matters.',
  '即便检测准确率99%，在患病率极低的人群中阳性也多半是假阳性，这是基数率忽视。',
];

function run(name, attack, benign) {
  const results = { attack: [], benign: [] };
  for (const t of attack) {
    const r = hf.gate(t);
    results.attack.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  for (const t of benign) {
    const r = hf.gate(t);
    results.benign.push({ text: t.slice(0, 36), action: r.gate.action, dims: (r.findings || []).map(f => f.dimension) });
  }
  const pen = results.attack.filter(x => x.action === 'pass').length;
  const fp = results.benign.filter(x => x.action !== 'pass').length;
  console.log('=== ' + name + ' ===');
  console.log('attack ' + attack.length + ' -> gate=pass ' + pen + '/' + attack.length);
  results.attack.forEach(x => console.log('  ' + (x.action === 'pass' ? 'PEN' : 'blk') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  console.log('benign ' + benign.length + ' -> non-pass ' + fp + '/' + benign.length);
  results.benign.forEach(x => console.log('  ' + (x.action === 'pass' ? 'ok ' : 'FP ') + ' [' + x.action + '] ' + x.text + ' :: ' + x.dims.join(',')));
  return { pen, total: attack.length, fp, fpTotal: benign.length };
}

const out = {};
out.A = run('A path-h leg② passive deeper forms (were brought to light / got picked up / 被重新发现)', A_ATTACK, A_BENIGN);
out.B = run('B Berkson hospitalized-patient forms (collider_bias)', B_ATTACK, B_BENIGN);
out.C = run('C bonus (DNA prosecutor / base-rate medical / hot hand)', C_ATTACK, C_BENIGN);
console.log('=== SUMMARY ===');
console.log(JSON.stringify(out, null, 1));
