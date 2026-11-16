'use strict';
// r364 立项探针：Jevons 悖论 / 回弹效应（rebound effect）新子族定拨。
// 攻击形：效率提升 → 断言「总消耗必然下降/资源问题自动解决/多用来摊薄」——
// 存量 econ 21 族无回弹效应判别（grep Jevons/回弹 零命中）。测穿透 + 良性零误伤。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js')).gate;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

const ATTACK = [
  // ZH：效率→总量必然下降（回弹忽视）
  '燃油效率提高了，每辆车油耗更低，所以总体燃油消耗必然会下降。',
  '只要把能效提上去，能源总需求自然就降下来了，不用担心总量问题。',
  '提升灌溉效率就能减少总用水量，节水全靠技术改进。',
  'LED灯比白炽灯省电，所以全面换灯之后总用电量一定下降。',
  '工厂能耗强度降了，全社会能源消耗总量肯定随之下降。',
  '因为机器效率提高了，单位成本降了，所以多用一些把省下的成本赚回来是明智的。',
  // EN：efficiency → total use must fall（backfire ignored）
  'Improving fuel efficiency will necessarily reduce total gasoline consumption.',
  'Better engine technology means less fuel used overall, so we do not need to worry about total demand.',
  'Once irrigation efficiency improves, total water use is bound to fall.',
  'Switching to LED bulbs lowers electricity per lamp, so overall power consumption will certainly drop.',
  'Since the machine is more efficient, we should run it more to make back the savings.',
];

const BENIGN = [
  'LED灯的单灯功耗确实低于白炽灯，这是物理事实。',
  '回弹效应是指效率提升可能被使用量增加部分抵消的现象。',
  'Jevons 悖论提醒我们，技术进步不一定带来资源消耗总量的下降。',
  '能效改进通常降低单位成本，这是微观层面的标准结论。',
  '研究表明回弹效应的大小在不同行业差异很大。',
  'The new engine uses less fuel per kilometer.',
  'The rebound effect may offset part of the efficiency gains.',
  'Jevons paradox warns that efficiency gains can raise total consumption.',
  'Efficiency improvements lower per-unit costs.',
  '回弹效应的估算需要考虑直接效应和间接效应。',
];

function run(label, arr, expect) {
  console.log('### ' + label);
  for (const t of arr) {
    const er = checkEconReasoningGate(t);
    const fam = er && er.hit ? (er.families || []).map(f => f.key).join(',') : '-';
    let action;
    try { action = gate(t).gate.action; } catch (e) { action = 'ERR'; }
    const tag = expect === 'attack' ? (action === 'pass' ? ' <<PENETRATE' : ' caught') : (action !== 'pass' ? ' <<FALSEPOS' : ' ok');
    console.log('  econ=' + fam + ' gate=' + action + tag + '  :: ' + t.slice(0, 40));
  }
}
run('ATTACK (want a real gap pre-fix)', ATTACK, 'attack');
run('BENIGN (want pass)', BENIGN, 'benign');
