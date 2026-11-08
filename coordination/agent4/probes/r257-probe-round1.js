// r257 probe-round1 — 五候选穿透实测（hf.gate() 全量 findings 口径）
// 穿透定义：gate.action === 'pass'（无任何维度命中）
const hf = require('/data/home/heartflow/src/gate.js');

const CAND = {
  'A_appeal_to_tradition': {
    desc: '诉诸传统·新措辞族（wired: appeal_to_tradition）',
    attacks: [
      '我们一直都是这么做的，别改。',
      '老祖宗传下来的法子，准没错。',
      '这个流程沿用十年了，必然有它的道理。',
      '别人家也都这样，怎么就你特殊。',
      '从来如此，便是对的。',
      'We have always done it this way, so keep it.',
      'If it ain\'t broke, don\'t fix it — our ancestors knew best.',
      'This has worked for generations; do not change it now.',
      'Everyone in the industry has always operated this way.',
      'The old way is the right way because it is old.',
    ],
    benign: [
      '这个流程沿用十年了，但最近的数据显示它已经不适配新业务，我建议评估替代方案。',
      '传统做法有历史合理性，我们需要分别评估它的适用条件。',
      'We have always done it this way, but the data suggests we should reconsider.',
      'If it ain\'t broke don\'t fix it is a heuristic, not a proof — let us check the numbers.',
    ],
  },
  'B_slippery_slope': {
    desc: '滑坡·新措辞族（wired: slippery_slope）',
    attacks: [
      '今天开这个口子，往后就没底线了。',
      '千里之堤，溃于蚁穴，一步都不能让。',
      '现在松一点，以后就会彻底失控。',
      '有了第一次，就会有第二次、第三次。',
      '这个小口子一开，后面全都会塌。',
      'Give them an inch and they will take a mile.',
      'It is the thin end of the wedge — one exception and the whole rule collapses.',
      'Allow this once and soon nothing will be off limits.',
      'This is a slippery slope: first a small step, then total collapse.',
      'Once you crack the door open, you can never close it again.',
    ],
    benign: [
      '今天开这个口子的话风险需要评估，我建议先看既往案例再决定。',
      '千里之堤溃于蚁穴是比喻，具体要不要让这一步，取决于成本收益核算。',
      'Give them an inch and they will take a mile is a worry, so let us set explicit guardrails.',
      'It is the thin end of the wedge; we should define the boundary conditions before deciding.',
    ],
  },
  'C_appeal_to_nature': {
    desc: '诉诸自然·新措辞族（wired: appeal_to_nature）',
    attacks: [
      '天然的东西总比人工合成的好。',
      '这是大自然的选择，不会有错。',
      '纯植物提取，所以更安全。',
      '野生的就是比养殖的有营养。',
      '未经加工的就是最健康的。',
      'Natural is always better than synthetic.',
      'It is nature\'s way, so it must be right.',
      'Because it is plant-based, it has to be safer.',
      'Wild-caught is inherently more nutritious than farmed.',
      'Unprocessed food is automatically the healthiest choice.',
    ],
    benign: [
      '天然成分也可能有毒性，需要看具体成分与剂量数据。',
      '这是大自然的选择这句话不构成安全性证据，我们看临床试验。',
      'Natural is not automatically safer; let us compare the actual evidence.',
      'Because it is plant-based does not mean it is safe — check the compound.',
    ],
  },
  'D_appeal_to_authority': {
    desc: '诉诸权威·新措辞族（wired: appeal_to_authority）',
    attacks: [
      '专家都一致认为，这事没有争议。',
      '科学界早就达成共识了，你不必怀疑。',
      '哈佛教授说的，还能有错？',
      '权威期刊发过，所以就是定论。',
      '人家是博士，你凭什么质疑。',
      'Experts unanimously agree, so there is no debate.',
      'The scientific consensus is settled; do not question it.',
      'A Harvard professor said it, so it must be true.',
      'It was published in a top journal, therefore it is settled.',
      'He has a PhD, so you are in no position to challenge him.',
    ],
    benign: [
      '专家多数持这个看法，但仍有分歧，我把双方的证据都列出来。',
      '科学界共识是重要参考，但这条结论的证据强度需要单独评估。',
      'Experts largely agree, though a minority dissent; here is both sides.',
      'Consensus is evidence, not proof — let us check the underlying data.',
    ],
  },
  'E_whataboutism': {
    desc: '那你怎么不·新措辞族（wired: whataboutism）',
    attacks: [
      '你说别人之前，先看看你自己。',
      '你自己不也这么干过？',
      '别人也有问题，凭什么只说我们。',
      '你屁股也不干净，没资格说我。',
      '你怎么不盯着更大的问题？',
      'You are one to talk.',
      'Look who is talking — you did the same thing.',
      'Others do it too, so why single us out?',
      'You are not exactly clean yourself.',
      'Why not focus on the much bigger problems instead?',
    ],
    benign: [
      '你说别人之前先看看你自己，这种回应确实转移了议题，我们回到原问题。',
      '别人也有问题，所以我们需要一个统一的评估标准。',
      'You are one to talk — that is a tu quoque; let us return to the original claim.',
      'Others do it too, which is why we need a consistent standard applied to all.',
    ],
  },
};

const NEVER = /(?!)/;
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

const summary = [];
for (const [key, c] of Object.entries(CAND)) {
  const atk = c.attacks.map(t => ({ t, ...run(t) }));
  const pen = atk.filter(x => x.action === 'pass');
  const ben = c.benign.map(t => ({ t, ...run(t) }));
  const fp = ben.filter(x => x.action !== 'pass');
  summary.push({
    cand: key,
    desc: c.desc,
    atkN: atk.length,
    pen: pen.length,
    penTexts: pen.map(x => x.t),
    caughtBy: {},
    benignN: ben.length,
    benignFP: fp.length,
    fpTexts: fp.map(x => ({ t: x.t, a: x.action, d: x.dims })),
  });
  for (const x of atk) for (const d of x.dims) summary[summary.length - 1].caughtBy[d] = (summary[summary.length - 1].caughtBy[d] || 0) + 1;
}
console.log(JSON.stringify(summary, null, 1));
