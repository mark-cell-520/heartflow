// r279 law_of_small_numbers 模块层快速验证：新族攻击命中 + 良性零误伤
const { detectLawOfSmallNumbers } = require('/data/home/heartflow/src/law-of-small-numbers.js');
const H = (s) => { try { return detectLawOfSmallNumbers(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  '我连玩了三把都输了，这号是废的。',
  '打了几把排位，匹配机制明显有问题。',
  '抽了十发出金率就是高。',
  '氪了三单就出货，这游戏不坑钱。',
  '看了两场直播，这主播翻车是早晚的事。',
  '小样本才是真相，大样本都是被平均出来的。',
  '样本越大越不准，数据一多就失真。',
  '问卷问几个人就行，调查那么多都是走形式。',
  'Three data points and the trend is obvious, no need for a bigger dataset.',
  'Small samples tell the truth; big datasets average everything away.',
];
const benign = [
  '连玩了三把都输了，也可能只是手感问题，再多打几局看看。',
  '抽了十发没出金，需要看公布的概率和更多样本，不能据此下结论。',
  '小样本容易失真，应该扩大样本量或参考大样本统计再判断。',
  'I matched three games and lost all of them, but three games is too small to judge the ranking system.',
  'Two flights were delayed; I need more data before saying this airline always runs late.',
  '问卷问几个人只是初步访谈，正式结论需要更大规模的调查。',
];
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benign) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
