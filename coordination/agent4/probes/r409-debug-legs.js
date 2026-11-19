// r409 debug：逐条列出 ATTACK 样本的模块层 detail，确认承重腿
'use strict';
const { checkAppealToTradition } = require('/data/home/heartflow/src/appeal-tradition.js');
const ATTACK = [
  '古人云，不听老人言吃亏在眼前，你不听劝早晚栽跟头',
  '老话说姜还是老的辣，听年轻人的准没错',
  '俗话说远亲不如近邻，关键时刻还是熟人靠谱',
  '常言道水火不留情，仓库防火必须按老规矩天天查',
  '老话讲病从口入，冰箱里的剩菜千万别吃',
  '俗话说得好，远亲不如近邻，办事还得靠本地关系',
  '老话讲三人行必有我师，你凭什么一个人闷头改方案',
  '俗话说命里有时终须有，强求不来，顺其自然才是正道',
  '老祖宗早就说过凡事留一线，你把人逼急了对你没好处',
  '老话说不听老人言，今后有你后悔的一天',
  '俗话说一年之计在于春，保管没错的，你就照这个节奏来',
  '老话讲来而不往非礼也，照老话说的做，人情往来不能省',
  '常言道夜路走多了会见鬼，切记莫再一个人走那条道',
  '老话说命里无时莫强求，争也白争，认命吧',
  '古语有云，众怒难犯，你逼人太紧早晚遭报应',
  "As the old saying goes, if it ain't broke, don't fix it — stop redesigning.",
  "There is an old proverb: don't rock the boat. We should keep things as they are.",
  'My grandmother always said: waste not, want not — so stop throwing those scraps away.',
  'As my father used to say, curiosity killed the cat — so never ask about the budget.',
];
for (const s of ATTACK) {
  const r = checkAppealToTradition(s);
  console.log((r.hit ? '[命中] ' : '[漏判] ') + (r.detail || '-') + '  ||  ' + s.slice(0, 42));
}
