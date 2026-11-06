'use strict';
const { detectAppealToFuture } = require('/data/home/heartflow/src/appeal-to-future.js');

const ATK_ZH = [
  '未来的技术终将解决碳排放，所以现在不必急着能源转型。',
  '等以后研发出更便宜的清洁能源，化石燃料污染自然会被淘汰，现在何必急着限排。',
  'AI迟早会自己学会纠错，我们现在不用人工审核。',
  '将来医学进步了一定能治好这病，现在没必要投入预防。',
  '等下一代人想出办法，气候问题总会解决，我们这代该排放排放。',
  '未来会有更高效的材料，现在担心资源枯竭是杞人忧天。',
  '技术奇点临近，届时一切难题都会迎刃而解，当务之急不是当下这些琐事。',
  '等可控核聚变商用，能源危机自解，现在扩建电网纯属浪费。',
  '将来机器人什么都能干，眼下讨论就业保障毫无意义。',
  '以后算力会无限便宜，如今优化算法是徒劳。',
];
const ATK_EN = [
  'Future technology will solve carbon emissions, so there is no need to transition now.',
  'AI will eventually learn to correct itself, so we do not need human review yet.',
  'Medicine will surely cure this disease in the future, so prevention spending now is unnecessary.',
  'The singularity is near, and every problem will be solved then, so today issues do not matter.',
  'Someone will invent cheap clean energy down the road, so why bother cutting emissions today.',
];
const BENIGN = [
  '未来技术可能缓解部分排放，但当下仍需减排作为过渡。',
  '他会成功，因为他准备了很久而且数据支持。',
  '银行因资本金不足而倒闭，这是资产负债表的结果。',
  'Future tech may help, but we must act now as well.',
  'We should invest in prevention now because early treatment is cheaper.',
  '我们为未来的扩张预留了接口。',
  '与其赌未来技术，不如现在就把制度建好。',
  '未来的市场很难预测，所以投资要分散。',
  '我们要未雨绸缪，为将来的危机提早做准备。',
  '这项技术目前还不成熟，需要继续投入研发。',
];
const META_EXEMPT = [
  '诉诸未来是一种常见的拖延谬误。',
  '把希望寄托在尚未出现的技术上，是用未来免除当下的责任。',
  'techno-solutionism is a fallacy that defers present action.',
  '我们不应诉诸未来，把责任推给下一代。',
];

function run(list, label, expectHit) {
  console.log('=== ' + label + ' (期望 ' + (expectHit ? 'hit' : 'nohit') + ') ===');
  let ok = 0, bad = 0;
  for (const t of list) {
    const r = detectAppealToFuture(t);
    const hit = r.hit === true;
    const good = hit === expectHit;
    if (good) ok++; else bad++;
    console.log((good ? '  ok ' : '  BAD ') + (hit ? 'hit ' : 'nohit') + ' | ' + t.slice(0, 40) + (hit ? '  [' + (r.detail || '').slice(0, 40) + ']' : ''));
  }
  console.log('小计: 符合期望 ' + ok + ' / 不符 ' + bad);
  return { ok, bad };
}

const a1 = run(ATK_ZH, '攻击 ZH', true);
const a2 = run(ATK_EN, '攻击 EN', true);
const b = run(BENIGN, '良性', false);
const m = run(META_EXEMPT, '元话语/豁免', false);
console.log('=== 汇总 ===');
console.log('攻击命中: ' + (a1.ok + a2.ok) + '/' + (ATK_ZH.length + ATK_EN.length));
console.log('良性零误伤: ' + b.ok + '/' + BENIGN.length);
console.log('元话语零误伤: ' + m.ok + '/' + META_EXEMPT.length);
