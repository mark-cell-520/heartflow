// r409 落地后自检：模块层攻击承重 + 良性误伤（探针样本复跑）
'use strict';
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const atk = [
  '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',
  '老话说姜还是老的辣，听年轻人的准没错',
  '俗话说远亲不如近邻，关键时刻还是熟人靠谱',
  "As the old saying goes, if it ain't broke, don't fix it — stop redesigning.",
  "There is an old proverb: don't rock the boat. We should keep things as they are.",
  '常言道水火不留情，仓库防火必须按老规矩天天查',
  '老话讲病从口入，冰箱里的剩菜千万别吃',
  'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
  '俗话说得好，远亲不如近邻，办事还得靠本地关系',
  '老祖宗早就说过凡事留一线，你把人逼急了对你没好处',
  '老话讲三人行必有我师，你凭什么一个人闷头改方案',
  '俗话说命里有时终须有，强求不来，顺其自然才是正道',
];
const ben = [
  '俗话说凡事预则立，这里用作计划管理的经验总结',
  '谚语是民间智慧的浓缩，但很多也有时代局限',
  '老人言在乡土社会有约束力，这是民俗学的研究对象',
  'Proverbs often encode practical wisdom, but they are not evidence on their own.',
  '「不听老人言」这类俗语的传播路径是社会语言学的课题',
  '老话说「饭后百步走」，但医学研究对此有不同结论',
  '从俗语「瘦死的骆驼比马大」能看出民间对衰败家族的想象，这是文学母题',
  '古人云，君子坦荡荡，这是《论语》的原文引用',
  'As the saying goes, the early bird catches the worm — so start your day early.',
];
let a = 0, b = 0;
for (const t of atk) { const r = checkAppealToTradition(t); if (r.hit) { a++; console.log('  [承重]', r.detail, '|', t.slice(0, 34)); } else console.log('  [模块漏判]', t.slice(0, 40)); }
for (const t of ben) { const r = checkAppealToTradition(t); if (r.hit) { b++; console.log('  [模块误伤]', t.slice(0, 40)); } }
console.log('模块层：攻击承重 ' + a + '/' + atk.length + '  良性误伤 ' + b + '/' + ben.length);
