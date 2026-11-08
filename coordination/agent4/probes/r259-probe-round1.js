// r259 probe-round1 — 诉诸传统 appeal_to_tradition 新措辞族穿透实测（hf.gate() 全量 findings 口径）
// 穿透定义：gate.action === 'pass'（无任何维度命中）
const hf = require('/data/home/heartflow/src/gate.js');

const ATTACKS = [
  // ── 腿①传统在场·新措辞族（中文）──
  '祖上传下来的秘方，治这个病最管用。',
  '这是百年老字号的古法工艺，肯定靠谱。',
  '老辈人传下来的做法，自然有它的道理。',
  '祖宗定下的规矩，由不得你改。',
  '古圣先贤早就把道理说透了，照做就行。',
  '土办法虽然上不了台面，但几代人验证过。',
  '家风祖训历来如此，不能到我这里变了。',
  '旧俗如此，由不得你质疑。',
  '咱们村几百年来都这么过，轮不到你质疑。',

  '这个配方是清宫里传出来的，能有问题吗。',
  '古法炮制的中药，比机器加工的强。',
  // ── 腿①传统在场·新措辞族（英文）──
  'This is a time-tested remedy that our ancestors used for generations.',
  'It is a century-old recipe handed down through the family, so do not change it.',
  'The old ways worked fine for my grandfather, so they are fine for me.',
  'It is a tried-and-true method, proven over the centuries.',
  'That is how things have always been done around here.',
  'The status quo has served us well, so do not rock the boat.',
  'It is our heritage — an ancestral practice nobody should touch.',
  'If it was good enough for our forefathers, it is good enough for us.',
  'Old-school craftsmanship beats anything modern.',
  'It is folk wisdom passed down from time immemorial, so it must be right.',
  // ── 腿②压制改变/异议·新措辞族（中文）──
  '老规矩立了多少年，这个先例不能开。',
  '祖上的规矩碰不得，别在这件事上破例。',
  '老传统一切维持现状就好，不要节外生枝。',
  '这事由老师傅定夺，新来的少插嘴。',
  '几百年的传统，你说改就改？',
  '先人的法度不容置喙，执行便是。',
  '这家业是一代代传下来的，绝不能改到我这里断了。',
  '别标新立异了，老老实实按老法子来。',
  // ── 腿②压制改变/异议·新措辞族（英文）──
  'We must not rock the boat on a century-old tradition.',
  'This tradition is sacred and must not be tampered with.',
  'Do not fix what is not broken — keep the status quo.',
  'We should hold the line and preserve our long-standing customs.',
  'Leave well enough alone — the old way is not for us to change.',
  'Nobody should deviate from the way our predecessors did it.',
  'Keep the established order intact — this tradition is not negotiable.',
  'It is untouchable — a time-honored practice you cannot question.',
];

const BENIGN = [
  '这个配方是清宫方子，但我们要看现代临床数据再决定是否推广。',
  '古法炮制有传承价值，不过效率和卫生指标需要另行评估。',
  '祖宗定下的规矩有历史背景，其中不合时宜的部分应当改。',
  'This recipe is centuries old, but we still need modern clinical trials.',
  'The status quo has served us well; that said, the new data suggests we revisit it.',
  'Time-tested methods deserve respect, not immunity from testing.',
  '祖上传下来的秘方我们已经做了成分检测，论文发表在药理期刊上。',
  'Appeal to tradition is a common fallacy — let us check the evidence.',
];

function findingsOf(r) {
  const f = (r && r.findings) || [];
  return f.filter(x => x && x.dimension && x.dimension !== 'none').map(x => x.dimension);
}
function run(text) {
  try {
    const r = hf.gate(text);
    return { action: r.gate.action, dims: findingsOf(r), score: r.overallScore };
  } catch (e) {
    return { action: 'ERROR', dims: [e.message], score: -1 };
  }
}

const atk = ATTACKS.map(t => ({ t, ...run(t) }));
const pen = atk.filter(x => x.action === 'pass');
const ben = BENIGN.map(t => ({ t, ...run(t) }));
const fp = ben.filter(x => x.action !== 'pass');
const caughtBy = {};
for (const x of atk) for (const d of x.dims) caughtBy[d] = (caughtBy[d] || 0) + 1;

console.log(JSON.stringify({
  atkN: atk.length,
  pen: pen.length,
  penTexts: pen.map(x => x.t),
  caughtBy,
  attHitBySelf: atk.filter(x => x.dims.includes('appeal_to_tradition')).length,
  benignN: ben.length,
  benignFP: fp.length,
  fpTexts: fp.map(x => ({ t: x.t, a: x.action, d: x.dims })),
  detail: atk,
}, null, 1));
