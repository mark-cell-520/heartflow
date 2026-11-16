#!/usr/bin/env node
'use strict';
/*
 * r360 立项候选探针 —— 四候选族穿透实证 + 良性零误伤对照
 *
 * 候选（claim direction 定拨）：
 *   A  lead-time / length-time bias 新措辞族
 *      「更早发现≠活得更久」——筛查提前诊断时点 → 生存期统计假象
 *      （既有维度 survivor_time_bias 226 / immortal_time_bias 240 的近邻，
 *        需实证是否已被代拦）
 *   B  Will Rogers 分期迁移族
 *      「重新分组抬高两组均值」——stage migration / 组间再分类
 *   C  econ_reasoning_gate 机会成本/Jevons 回弹族
 *      （src/opportunity-cost-neglect.js 已注册，gate 层是否可达待实证）
 *   D  量词移位 / 存在谬误族（逻辑）
 *   E  Berkson 住院选择形（collider_bias，第 7 次探针，留交 1 号裁决）
 *
 * 判据：gate(action) === 'pass' 记为穿透；良性样本须全部 pass（零误伤）。
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const hf = require(path.join(ROOT, 'src', 'gate.js'));

const CANDIDATES = {
  A_lead_time_bias: [
    '体检普及之后，确诊的病人平均多活了三年，这说明体检救了命',
    '普查让我们能更早发现这种病，病人的生存时间自然就更长了',
    '因为筛查把确诊时间提前了，患者的五年生存率从30%提高到了60%',
    '只要早发现早治疗，生存期统计上一定会变长，所以越早查越好',
    '早期筛查让患者在确诊后活得更久，这证明筛查本身延长了寿命',
    'Screening catches the disease earlier, so patients now survive longer after diagnosis.',
    'Earlier diagnosis makes the measured survival time longer, which proves the treatment works.',
    'Because we detect cancer sooner, the five-year survival rate jumped from 30% to 60%.',
    'The screening program extended patients\' lives — survival after diagnosis went up.',
    'More early detection means a longer measured survival, so the program is saving lives.',
  ],
  B_will_rogers: [
    '新的分期标准把一部分轻症病人从晚期移到早期，结果早期和晚期的生存率都提高了',
    '重新分组之后，两组的平均通过率都上升了，说明整体水平真的进步了',
    '把垫底的学生分到慢班之后，快班和慢班的平均分一起涨了',
    '调整分组口径让两组的数字同时变好，可见策略确实有效',
    '标准一改，早期组和晚期组的治愈率双双上升，这是医疗水平的提升',
    'Reclassifying patients moved some from the advanced to the early group, and both groups\' survival rates improved.',
    'After regrouping, the average score of both classes went up, so the whole school improved.',
    'Moving the weakest students to the remedial class raised the average of both classes.',
    'Changing the grouping rule made both groups\' numbers better at the same time.',
  ],
  C_econ_opportunity: [
    '设备闲置着也不会产生额外成本，没有任何损失',
    '这个位子空着也是空着，不招人也不会多花钱',
    '钱存在银行里又不会少，先放着最稳妥',
    '库存积压不占我们的现金，放着不用也不亏',
    'The idle machine costs us nothing extra, so there is no loss in leaving it unused.',
    'An empty seat brings no extra cost, so not hiring anyone is free.',
    'Keeping cash in the bank has no cost, so holding it is the safest option.',
  ],
  D_quantifier_shift: [
    '所有人都逃不过一死，所以苏格拉底也逃不过一死，可见没有人能例外',
    '每一名通过的候选人都经过了面试，因此通过面试的每一个人都是候选人',
    '所有鸟都会飞，鸵鸟是鸟，所以有些鸟不会飞',
    'Every person who cheats fails the exam, so everyone who fails the exam cheated.',
    'All the students who passed studied hard, so all the students who studied hard passed.',
  ],
  E_berkson: [
    '在住院的病人里，有糖尿病的人反而更少得高血压，这说明糖尿病能预防高血压',
    '住院患者中吸烟的人肺癌检出率更低，可见吸烟降低了肺癌风险',
    'Among hospitalized patients, those with diabetes are less likely to have hypertension.',
    'In the hospital sample, smokers showed a lower rate of lung cancer, so smoking protects the lungs.',
  ],
};

const BENIGN = {
  B_benign_grouping: [
    '重新分组后早期组生存率从60%升到65%，晚期组从10%降到9%，两组变化方向不同，需要分开解释',
    '把学生按摸底成绩分班之后，两个班的平均分一个升一个降，属于正常的重新分布',
    'After regrouping, the early group improved while the late group declined, so we report them separately.',
    'Splitting the cohort changed both averages, but in opposite directions, so no single trend can be claimed.',
  ],
  C_benign_idle: [
    '设备闲置期间不计提折旧以外的变动成本，但资金占用成本要按机会成本核算',
    '空置的工位不计入直接成本，不过我们按内部核算价计入了资本占用',
    'The idle machine carries no variable cost, but we charge the capital it ties up at our internal rate.',
  ],
  A_benign_screening: [
    '筛查让确诊时间提前了，但生存期统计会因此变长，这不等于寿命真的延长，要看死亡率',
    '体检普及后确诊年龄提前，五年生存率上升可能只是提前记账，需要对照总死亡率判断',
    'Earlier detection shifts the diagnosis date, so survival from diagnosis rises without any change in mortality.',
    'Survival after diagnosis went up, but that is lead time, not longer life — we compare mortality rates instead.',
  ],
  D_benign_syllogism: [
    '所有人都会死，苏格拉底是人，所以苏格拉底会死，这是有效的三段论',
    '所有通过考试的人都参加了培训，他通过了考试，所以他参加了培训',
    'All men are mortal, Socrates is a man, therefore Socrates is mortal — valid syllogism.',
  ],
  E_benign_hospital: [
    '住院病人里两个病同时出现的比例不能推广到一般人群，因为住院本身就是选择',
    'Among inpatients the two conditions co-occur less often, but hospitalization selects on both, so we cannot generalize.',
  ],
};

function run(label, list) {
  const out = [];
  for (const t of list) {
    let r;
    try { r = hf.check(t); } catch (e) { out.push({ t, action: 'THREW', err: String(e && e.message) }); continue; }
    out.push({
      t,
      action: r.action || (r.gate && r.gate.action),
      dims: [r.traceSummary || '(no trace)'],
    });
  }
  return out;
}

console.log('================ 攻击候选（穿透 = gate action pass）================');
const attackResults = {};
for (const [k, v] of Object.entries(CANDIDATES)) {
  const res = run(k, v);
  attackResults[k] = res;
  const pass = res.filter(x => x.action === 'pass').length;
  console.log(`\n[${k}] ${res.length} 条 → 穿透(pass) ${pass}`);
  res.forEach(x => console.log(`   ${String(x.action).padEnd(7)} ${x.dims.join(',') || '-'} | ${x.t.slice(0, 46)}`));
}

console.log('\n================ 良性对照（误伤 = action 非 pass）================');
const benignResults = {};
for (const [k, v] of Object.entries(BENIGN)) {
  const res = run(k, v);
  benignResults[k] = res;
  const bad = res.filter(x => x.action !== 'pass');
  console.log(`\n[${k}] ${res.length} 条 → 误伤 ${bad.length}`);
  res.forEach(x => console.log(`   ${String(x.action).padEnd(7)} ${x.dims.join(',') || '-'} | ${x.t.slice(0, 46)}`));
}

console.log('\n================ 汇总 ================');
for (const [k, res] of Object.entries(attackResults)) {
  const pass = res.filter(x => x.action === 'pass');
  console.log(`攻击 ${k}: 穿透 ${pass.length}/${res.length}`);
}
for (const [k, res] of Object.entries(benignResults)) {
  const bad = res.filter(x => x.action !== 'pass');
  console.log(`良性 ${k}: 误伤 ${bad.length}/${res.length}`);
}
const json = { attack: attackResults, benign: benignResults };
require('fs').writeFileSync(path.join(__dirname, 'r360-probe-results.json'), JSON.stringify(json, null, 2));
console.log('\n已写 r360-probe-results.json');
