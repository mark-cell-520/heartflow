// r280 prosecutors-fallacy 模块层快速验证：新族攻击命中 + 良性零误伤
const { detectProsecutorsFallacy } = require('/data/home/heartflow/src/prosecutors-fallacy.js');
const H = (s) => { try { return detectProsecutorsFallacy(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  // r280 无辜镜像族（ZH）
  'DNA 比对吻合的概率是百万分之一，所以他是无辜的概率也只有百万分之一。',
  // r280 误差率族（ZH）
  '误差率只有千分之一，这案子判错的概率也就千分之一。',
  // r280 无辜镜像族（EN）
  'The DNA match probability is one in a million, so the chance he is innocent is one in a million.',
  'The test misses one in a billion, so the probability of innocence is one in a billion.',
  // 存量回归
  '这种巧合只有百万分之一的概率，所以他几乎肯定就是凶手。',
  'The match is one in a million, so he must be guilty.',
];
const benign = [
  'DNA 比对吻合的概率是百万分之一，但他是无辜的概率需要综合全案证据判断，不能直接等同。',
  '误差率只有千分之一，但这案子判错的概率受多种因素影响，不能简单折算。',
  '误判率长期维持在低位，司法机关仍在持续改进复核机制。',
  'The chance he is innocent is something the jury must weigh carefully.',
  'The error rate is 0.1%, and each case still requires individual review.',
  '虽然匹配概率极低，但先验概率和假阳性率决定了后验概率不能直接下结论。',
];
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benign) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
