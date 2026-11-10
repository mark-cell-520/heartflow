// r280 appeal-to-probability 模块层快速验证：新族攻击命中 + 良性零误伤
const { checkAppealToProbability } = require('/data/home/heartflow/src/appeal-to-probability.js');
const H = (s) => { try { return checkAppealToProbability(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  '希望这么大，肯定跑不了。',
  '可能性这么高，铁定会发生。',
  '胜算这么大，必定能成。',
  '机会这么好，准会发生。',
  // 存量回归
  '宇宙这么大，肯定有外星人。',
  '航班天天飞，出事的才几起，我肯定赶不上。',
];
const benign = [
  '希望这么大，但也要做好两手准备，概率不等于保证。',
  '可能性这么高，值得认真评估，但仍需数据验证。',
  '胜算这么大，也不能保证一定赢，独立事件每轮概率不变。',
  '机会这么好，不试试怎么知道，成不成看运气。',
  '宇宙这么大，但至今没有证据，不能断定有外星人。',
  '概率再低，只要重复次数够多就一定发生。', // 这是攻击句，移出良性
];
// 上面最后一条是攻击句，从良性移除重跑
const benignFinal = benign.slice(0, 5);
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benignFinal) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
