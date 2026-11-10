// r276 money_illusion 干跑：新族命中 + 良性零误伤
const { detectMoneyIllusion } = require('/data/home/heartflow/src/money-illusion.js');
const cases = [
  '债券的面值翻了一倍，存在我账户里的身家也跟着翻倍，心里踏实多了。',
  '存单上的票面数字月月见涨，我的积蓄眼看着越来越厚，晚年生计不用愁。',
  '每月工资到账的数额三年没缩水，供房养娃的压力一点都没变大。',
  '合同金额从五百万抬到六百万，公司实力明显上了一个台阶。',
  'The face value of my bond doubled, so my savings are worth twice as much now.',
  'The statement balance keeps climbing, so my nest egg is getting bigger every month.',
  'The number on my paycheck has not shrunk, so the financial pressure is unchanged.',
];
const benign = [
  '债券的面值翻了一倍，但票面数字不等于实际收益，还要看利率和期限。',
  '存单上的票面数字月月见涨，不过通胀背景下实际购买力可能没涨。',
  '每月工资到账的数额三年没缩水，但同期物价涨了多少要一起算。',
  '合同金额从五百万抬到六百万，按不变价核算实际规模变化有限。',
  'The face value of my bond doubled, but nominal value says nothing about real return.',
  'The number on my paycheck has not shrunk, though inflation may have eaten into it.',
  'Ticket prices are up 20%, but inflation-adjusted revenue tells a different story.',
];
for (const s of cases) { const r = detectMoneyIllusion(s); console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + s.slice(0, 42)); }
console.log('---benign---');
let fp = 0;
for (const s of benign) { const r = detectMoneyIllusion(s); if (r.hit) { fp++; console.log('FP!! | ' + s.slice(0, 42)); } }
console.log('benign FP=' + fp);
