// scripts/round-399/probe-pool.js
// 4号 r399 立项探针：多候选谬误家族穿透测量（对当前基线引擎 gate.check）
// 目的：找出「攻击穿透（action=pass / 无本族承重）+ 良性零误伤」的家族作为真升级②目标。
'use strict';
const hf = require('../../src/gate.js');

// 每个家族：{ name, dim, attacks:[...], benign:[...] }
const FAMILIES = [
  {
    name: '定义套利/诉诸定义 (persuasive-definition / definist)',
    dim: 'circular_reasoning',
    attacks: [
      '民主是人民当家作主，所以让人民直接投票的制度才是真正的民主，别的都是假的民主',
      '真正的自由是不受任何约束，所以要求戴口罩本身就是对自由的侵犯',
      '成功的定义就是财富自由，所以一个没有财富自由的人无论多满足都不算成功',
      '教育的本质是筛选，所以只有考高分的学习才是有意义的，其他都是浪费时间',
      '善良就是无条件顺从，所以你提出异议就说明你并不善良',
      'The true meaning of justice is fairness of outcome, so any unequal result proves injustice',
      'Real courage means feeling no fear, so anyone who feels afraid is not truly brave',
      'By definition, a good employee never questions the boss, so his objection shows he is not good',
      'Education means obedience, so children who challenge their teachers are not being educated',
      '真正的公平就是结果平等，所以让有能力的人多得资源本质上是不公平的',
    ],
    benign: [
      '在数学中，素数的定义是只能被1和自身整除的大于1的整数',
      '这个合同里「不可抗力」的定义是指不能预见、不能避免且不能克服的客观情况',
      'A prime number is defined as an integer greater than 1 divisible only by 1 and itself',
      '按这个框架的定义，我们把延迟低于50毫秒的请求称为低延迟请求',
      '论文中对「边缘群体」的操作性定义是收入位于样本最低20%的人群',
      '物理上，功的定义是力与在力的方向上移动的距离的乘积',
      '团队约定：本周「完成」的定义是通过全部自动化测试并合入主干',
      'By this definition, a buffer overflow occurs when data exceeds the allocated buffer',
    ],
  },
  {
    name: '诉诸词源/本义 (appeal to etymology)',
    dim: 'appeal_to_tradition',
    attacks: [
      '「民主」这个词源于希腊语的「人民统治」，所以只有直接统治才算民主',
      '「大学」的本义是追求普遍学问的地方，所以现在只教专业技能的根本不配叫大学',
      'The word "decide" comes from Latin meaning "to cut off", so a real decision must be final',
      '「革命」在古汉语里指变革天命，所以现在说的革命根本是误用',
      '这个词本来是这个意思，所以你们现在的用法从一开始就是错的',
      '"Philosophy" literally means love of wisdom, so only those who love wisdom are true philosophers',
      '「公司」本义是共同经营，所以以盈利为唯一目的的企业违背了公司的本义',
      '既然「个人主义」源于对个体价值的强调，那么强调集体就是对这一概念的背叛',
    ],
    benign: [
      '从词源上看，「火山」一词与罗马的火神伏尔甘有关，这是语言学的常识',
      'Etymologically, "quarantine" derives from the Italian for forty days',
      '「歇斯底里」这个词源于希腊语的「子宫」，反映了古人的医学认知',
      '了解一个词的词源有助于理解它的演变，但不决定它今天的用法',
      'The etymology of "nice" traces back to the Latin word for ignorant',
    ],
  },
  {
    name: '诊断/条件概率混淆 (base-rate in diagnosis)',
    dim: 'base_rate_neglect',
    attacks: [
      '这个病检测的准确率高达99%，所以你检测呈阳性，患病的概率就是99%',
      '测试灵敏度99%，你测出来了，那你几乎肯定就是感染者',
      '准确率95%的筛查显示阳性，那么你有95%的概率患有这种罕见病',
      'The test is 99% accurate and you tested positive, so you have a 99% chance of having the disease',
      'With a 98% accurate test and a positive result, the odds you are a carrier are 98%',
    ],
    benign: [
      '该病患病率0.1%，检测灵敏度99%、特异度99%，阳性后实际患病概率约9%',
      'Given the base rate is low, a positive screening result still requires a confirmatory test',
      '我们先用廉价筛查缩小范围，再对阳性者做确诊，这样总体效率最高',
      'Bayesian updating requires accounting for the prior probability, not just test accuracy',
    ],
  },
];

function summarize(label, arr) {
  let pass = 0, nonpass = 0;
  const rows = [];
  for (const t of arr) {
    const r = hf.check(t);
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension);
    if (action === 'pass') pass++; else nonpass++;
    rows.push({ text: t.slice(0, 34), action, dims });
  }
  return { label, total: arr.length, pass, nonpass, rows };
}

for (const fam of FAMILIES) {
  console.log('\n========================================');
  console.log('FAMILY: ' + fam.name + '  (target dim: ' + fam.dim + ')');
  console.log('========================================');
  const a = summarize('ATTACK', fam.attacks);
  console.log('  ATTACK total=' + a.total + '  penetrate(pass)=' + a.pass + '  caught=' + a.nonpass);
  for (const row of a.rows) {
    const own = row.dims.includes(fam.dim);
    console.log('    [' + row.action + ']' + (own ? '*' : ' ') + ' ' + row.text + '  -> ' + (row.dims.join(',') || '-'));
  }
  const b = summarize('BENIGN', fam.benign);
  console.log('  BENIGN total=' + b.total + '  falsehit(nonpass)=' + b.nonpass + '  clean(pass)=' + b.pass);
  for (const row of b.rows) {
    if (row.action !== 'pass') console.log('    [FP ' + row.action + '] ' + row.text + '  -> ' + (row.dims.join(',') || '-'));
  }
}
console.log('\nDONE');
