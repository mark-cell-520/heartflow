'use strict';
// [r726] 模块层冒烟：定稿前自测（接线前）。
// 样本集 = scripts/round-726-family-probe.js 的 relative_pration 族实测样本
// + 五条豁免常量注入样本 + suffering_contest/suffering_capital 分工样本 + 防御性负例。
const path = require('path');
const { checkRelativePrivation, CONSTANTS } = require(path.join(__dirname, '..', 'src', 'relative-pration.js'));

const attacks = [
  '你抱怨加班？想想那些连工作都没有的人',
  '起码你还有学上，非洲的孩子连饭都吃不上',
  '别嫌房租贵了，有人睡大街呢',
  '你至少身体健康，多少人躺在床上你还不满足',
  '别吐槽食堂难吃了，灾区人民连干净水都喝不上',
  '你至少还活着，多少人今天都没挺过来',
  '知足吧，还有人工资比你低一半呢',
  '别喊累了，工地上的人比你累多了',
  '你这点苦算什么，穷苦人家连饭都吃不上',
  '年轻人吃点苦怎么了，我们当年饭都吃不饱',
  'How can you complain about your flight delay when people are starving?',
  'You have a roof over your head; stop complaining about the noise.',
  'At least you have a job — many people would kill for your position.',
  'Quit whining about the wifi; children in war zones have no internet.',
  'You got second place; be grateful, some people never win anything.',
  'At least it is only rain — other cities are flooding.',
  '你至少还能在家办公，有人通勤四小时呢',
  '别喊压力大，想想大山里的孩子',
  '你只是加班到十点，有人熬夜到天亮呢',
  '这顿饭菜不错了，非洲还有难民呢',
  '至少你父母还健在，有人从小就没了爸妈',
  '别抱怨 996 了，工地上还有搬砖的呢',
  '你至少有双休，服务业全年无休的多的是',
  '别嫌工资低，至少还有五险一金，知足吧',
  '你至少还年轻，多少人这个年纪已经一身病了',
  '别喊嫁得不好，至少还有人要你，知足吧',
  '你至少考上了大学，多少人初中就辍学了',
  'Stop complaining about the commute; some people walk ten miles.',
  'You lost your job, but at least you have savings — some have nothing.',
  '别喊疼了，人家生孩子的都不吭声',
  '你至少还有房子住，多少人租房都被赶出来了',
  '别嫌辅导班贵，山区孩子想上还没得上',
  '有学上就不错了，以前的女孩子还不让念书呢',
  '至少公司还发工资，好多厂都倒闭了，知足吧',
  '别吐槽航班取消了，有人连飞机都没坐过',
];

const benign = [
  '你的困难是真的，同时也值得想想更糟的情况来调节视角',
  '虽然还有更不幸的人，但这不代表你的痛苦不存在',
  'It is worth keeping perspective, but your frustration is still valid.',
  '你的处境确实不容易，别人的苦难不能抵消你的困难',
  '我们能做的有限，但这不是忽视眼前问题的理由',
  '抱怨解决不了问题，但具体问题我们可以一起想办法',
  '对比能让人感恩，但不该用来否定当下的合理诉求',
  'Keeping perspective helps, and your concern still deserves attention.',
  '更糟的处境值得关注，但你反映的问题也应该单独处理',
  '加班到十点确实辛苦，我们也看看怎么改善排班',
  '工资的事值得谈，同时也可以关注一下市场行情',
  '有人处境更艰难，所以我们更要认真对待你提的问题',
];

// 五条豁免常量的注入样本（置空对应常量后应重新命中）。
const exempt = [
  ['SELF_SUFFER', '我比你惨多了，你这点挫折算什么'],
  ['META', '所谓诉诸更惨，就是「别喊累了，有人连饭都吃不上」这种堵嘴话'],
  ['TEACH', '课堂讨论：别喊累了，有人连饭都吃不上，这句话问题在哪'],
  ['NEG_FLIP', '别抱怨了，有人连饭都吃不上，但这不能抵消你加班到十点的辛苦'],
  ['HEDGE', '别抱怨了，也许有人连饭都吃不上，但你的加班费也该按实际工时算'],
];

// 分工样本：存量 suffering_contest / suffering_capital 的形状（本维须放行）。
const carveOut = [
  '我这半年没睡过整觉，你才遇到一次，有什么好抱怨的',
  '我付出的是你的十倍，你凭什么不听我的',
  '我当年吃过的苦比你吃过的盐还多，你受点委屈算什么',
  '我为了这个家吃尽了苦头，你现在必须按我说的做',
];

// 防御性负例（常见良性形，双腿看似接近但实质不成立）。
const defensive = [
  '至少我们还有备份，系统可以恢复',
  '他只是个孩子，别跟他计较',
  '这只是一个小 bug，别急着重构',
  '想想那些支持你的人，别轻易放弃',
  '至少方案还有数据支撑，我们可以跑个验证',
  'At least we have a backup plan for the rollout.',
  'Keep perspective and review the checklist before shipping.',
];

let pass = 0, fail = 0;
const failures = [];
const hit = (t) => checkRelativePrivation(t).score > 0;

for (const t of attacks) {
  if (hit(t)) pass++; else { fail++; failures.push('ATTACK-MISS: ' + t); }
}
for (const t of benign) {
  if (!hit(t)) pass++; else { fail++; failures.push('BENIGN-FP: ' + t); }
}
for (const [k, t] of exempt) {
  if (!hit(t)) pass++; else { fail++; failures.push('EXEMPT-LEAK(' + k + '): ' + t); }
}
for (const t of carveOut) {
  if (!hit(t)) pass++; else { fail++; failures.push('CARVEOUT-LEAK: ' + t); }
}
for (const t of defensive) {
  if (!hit(t)) pass++; else { fail++; failures.push('DEFENSIVE-FP: ' + t); }
}

// 常量完整性：五条豁免常量必须存在且非空（负例注入的前提）。
const constNames = ['RP_SELF_SUFFER', 'RP_META', 'RP_TEACH', 'RP_NEG_FLIP', 'RP_HEDGE'];
for (const c of constNames) {
  if (CONSTANTS[c] && CONSTANTS[c].length > 0) pass++;
  else { fail++; failures.push('CONST-MISSING: ' + c); }
}

const attackHit = attacks.filter(hit).length;
console.log('[r726 smoke] 攻击命中 ' + attackHit + '/' + attacks.length
  + '｜良性 ' + benign.filter((t) => !hit(t)).length + '/' + benign.length
  + '｜豁免 ' + exempt.filter(([, t]) => !hit(t)).length + '/' + exempt.length
  + '｜分工 ' + carveOut.filter((t) => !hit(t)).length + '/' + carveOut.length
  + '｜防御 ' + defensive.filter((t) => !hit(t)).length + '/' + defensive.length
  + '｜常量 ' + constNames.length + '/' + constNames.length);
console.log('[r726 smoke] ' + pass + ' passed, ' + fail + ' failed');
for (const f of failures) console.log('  ' + f);
