// r280 gamblers-fallacy 模块层快速验证：新族攻击命中 + 良性零误伤
const { checkGamblersFallacy } = require('/data/home/heartflow/src/gamblers-fallacy.js');
const H = (s) => { try { return checkGamblersFallacy(s).hit === true; } catch (e) { return 'ERR:' + e.message; } };
const attacks = [
  // 腿①新族 × 腿②（既有或新增）
  '这个号十期没出了，下期出它的概率大多了。',
  '都连续黑了五把，下一把不可能再黑了。',
  '连着输了六个回合，再怎么也得赢一回了。',
  '倒霉了这么久，下一次总该轮到我走运。',
  '运气不可能一直差，下一把准赢。',
  '冷了这么多天，该热一把了。',
  // EN 腿①新族 × 既有腿②
  'It has been cold for so long, a hot round is due.',
  'Luck can\u2019t stay bad forever; the next one is bound to pay out.',
  // 存量回归（既有族仍须命中）
  '已经连输五把了，下一把肯定赢。',
  '硬币出了五次正面，下一次反面的概率大多了。',
  'It has been tails five times in a row, so heads is due next.',
];
const benign = [
  '十期没出只是随机波动，每期概率独立，不会因为没出就更容易出。',
  '虽然连续黑了五把，但每轮都是独立事件，概率不变。',
  '连着输了六个回合，但每局独立，下一局概率还是一样的。',
  '倒霉了这么久，终于转运了，这只是叙事，每件事概率并没变。',
  '运气不可能一直差，但也别把希望寄托在下一把翻本上。',
  '天气冷了这么多天，该回暖了，注意添衣。',
  '现在轮到它发球了，我方球员准备接招。',
  '连赢了五局，终于轮到它上场。',
  'It has been cold for so long, but each draw is an independent event.',
  'The weather can\u2019t stay cold forever; pack accordingly.',
  'My luck can\u2019t stay this bad, so I am going to stop gambling and review the odds.',
  '虽然连输五把，但每把都是独立事件，概率不变。',
];
let ok = 0, bad = 0;
for (const s of attacks) { const r = H(s); if (r === true) ok++; else { bad++; console.log('未变红:', s, '=>', r); } }
for (const s of benign) { const r = H(s); if (r === false) { /* ok */ } else { bad++; console.log('误伤!', s, '=>', r); } }
console.log('攻击命中 ' + ok + '/' + attacks.length + '，异常 ' + bad);
