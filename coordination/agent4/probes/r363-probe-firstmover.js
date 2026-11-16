'use strict';
// r363 聚焦探针：tragedy_of_commons 「先占/抢先」第一子族定拨。
// 新腿③ first-mover rationale：「共享资源 + 别人也会过度取用 + 所以先尽量多占」
// ——存量 C_ZH/C_EN 只收「自己多挣/成本大家扛/是理性的」，不收「不占就被
// 别人占/先下手为强」式抢先合理化。测模块层 + gate 层穿透 + 良性零误伤。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const mod = require(path.join(ROOT, 'src', 'tragedy-of-commons.js'));
const detect = mod.detectTragedyOfCommons;
const gate = require(path.join(ROOT, 'src', 'gate.js')).gate;
const { checkEconReasoningGate } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));

const ATTACK = [
  '这片草场是公共的，我不多养几只，别人也会多养，先占先得。',
  '公海的鱼谁都能捞，我不去捞就被别的船捞光了，不如先尽量多捕。',
  '地下水资源是共享的，我不多抽，邻村也会抽，能多抽就多抽。',
  '公共车位就那么多，我不占就被别人占了，先停进去再说。',
  '林子是大家的，我不多砍一圈，别人也会砍，趁现在能多砍就多砍。',
  'The fishery is open to all, so if I do not catch more, other boats will, might as well grab it first.',
  'Since the pasture is shared, if I do not graze more, my neighbor will, so I take what I can now.',
  'The aquifer is free, so unless I pump more this season, other farms will, I had better grab my share.',
  'Free public wifi has limited bandwidth; if I do not download now, others will hog it, so I grab all I can.',
  'It is a shared resource, and if I hold back others will not, so there is no reason for me to restrain myself.',
];

const BENIGN = [
  '这片草场是公共的，需要通过配额制度防止过度放牧。',
  '公地悲剧描述了共享资源被个体过度取用最终耗竭的现象。',
  '为了避免搭便车，公共渔场需要明确产权或引入捕捞配额。',
  '公共车位紧张，应该引入阶梯收费和时段限停来调节。',
  '先到先得的排队规则在这里是一套公平的制度安排。',
  'The shared aquifer requires pumping quotas to prevent depletion.',
  'To avoid overuse, the commons needs clear property rights or usage caps.',
  'First-come-first-served is a fair allocation rule when supply is limited.',
  '大家需要协商一个取用上限，而不是各凭本事多占。',
  '公共资源的治理要靠集体协商，不是谁抢先谁就多拿。',
];

function run(label, arr, expect) {
  console.log('### ' + label);
  for (const t of arr) {
    let modHit = false, fam = '-';
    try { const r = detect(t); modHit = !!(r && r.hit); } catch (e) {}
    const er = checkEconReasoningGate(t);
    if (er && er.hit) fam = (er.families || []).map(f => f.key).join(',');
    let action;
    try { action = gate(t).gate.action; } catch (e) { action = 'ERR'; }
    const tag = expect === 'attack' ? (action === 'pass' ? ' <<PENETRATE' : ' caught') : (action !== 'pass' ? ' <<FALSEPOS' : ' ok');
    console.log('  mod=' + (modHit ? 'HIT' : 'miss') + ' econ=' + fam + ' gate=' + action + tag + '  :: ' + t.slice(0, 44));
  }
}
run('ATTACK (want caught / want a real gap pre-fix)', ATTACK, 'attack');
run('BENIGN (want pass)', BENIGN, 'benign');
