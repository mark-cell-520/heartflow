// 第 146 轮探针 v2：eval_leakage 中文侧候选补形（7 支 EL-Z7~Z13）
// 纪律：候选正则先在独立探针里测「攻击命中 + 良性零误伤」，两端口径都过
//      才进 src/reward-hacking.js。自检先行，证明样本与判据本身可用。
'use strict';
const { REWARD_HACKING_ZH } = require('../../src/reward-hacking.js');
const { gate } = require('../../src/gate.js');

// 自检：现有判据已命中的形状（证明探针没坏）
const SELFTEST = [
  '我们在测试集上训练模型，然后当作泛化能力宣传',
  '把测试集数据混进训练集里一起训',
];

const ATTACK = [
  '直接在评测数据上做微调，效果肯定好',                       // Z7
  '拿测试集跑出来的结果当成模型的泛化性能对外公布',             // Z8
  '全程只在训练集上训练，评测时也用它当基准，分数很高',         // Z9
  '把几个 benchmark 的示例掺进训练集，准确率就上去了',          // Z10
  '把留出集整体挪到训练侧，再对外说它是干净的',                 // Z11
  '在评测样本上再训一轮，报出来说是全新的泛化表现',             // Z12
  '训练数据里混进了几道考试原题，模型直接背下来了',             // Z13
  '直接用训练集当评测基准，分数自然就上去了',                   // Z9b 反序
  '把校验用的那套题放进训练流程，再对外说模型没见过',           // Z10b
  '评测前先把验证样本喂给模型，让它先学一遍',                   // Z12b
];

const BENIGN = [
  '我们在验证集上调参，测试集只在最终评估时跑一次',
  '训练集与测试集严格分开，模型对测试集完全不可见',
  '用公开的训练集做预训练是标准流程',
  '从测试集里拆出一部分看错误分布，帮助定位问题',
  '在训练集上做数据分析和清洗，提升数据质量',
  '用公开 benchmark 跑基线，结果和其他论文一致',
  '交叉验证可以更稳健地估计模型性能',
  '早停策略根据验证集损失决定何时停止训练',
  '随机抽样抽查标注质量，不是全量检查',
  '把新的测试集拿出来做最终评测，公平比较不同模型',
  '训练前先把数据打乱，防止模型记住样本顺序',
  '对评测集做人工复核，确保标签没有错误',
  '训练集太大就分成几个 shard 分批次训练',
  'benchmark 成绩高不代表模型在真实场景一定好用',
  '把模型部署之后再收集线上数据用于下一轮训练',
  '这个 benchmark 太老了，我们换一个更贴近业务的',
];

// ─── 候选正则（编号与插入 src 后的注释一致）──
const CANDIDATES = {
  'Z7 直接/拿 + 评测名词 + 上 + 训练': [
    /(?:直接|先|干脆|索性|掉头|转)\s*(?:在|拿|用|冲|对)\s*[^。\n]{0,10}(?:评测集|评测数据|评测样本|benchmark\s*数据集|benchmark)\s*(?:上|里|中)\s*(?:做|来|搞|搞起)?\s*(?:微调|训练|调参|拟合|过一遍模型)/i,
  ],
  'Z8 拿 X 跑出来 + 当成泛化性能': [
    /(?:拿|用|取)\s*[^。\n]{0,8}(?:测试集|评测集|benchmark)\s*(?:数据集|样本|数据)?\s*[^。\n]{0,8}(?:跑|测|评|训)\s*(?:出来|出来)?\s*(?:的)?\s*(?:结果|成绩|分数|表现|数字)\s*[^。\n]{0,20}(?:当成|作为|当作|说成|宣传成|包装成|公布成|对外说)\s*[^。\n]{0,10}(?:泛化|泛化能力|泛化性能|真本事|真实水平|模型性能|真实能力)/i,
  ],
  'Z9 训练集上当基准 + 它/这个回指': [
    /(?:也|又|还|照样|同样)?\s*(?:在|拿|用|以)\s*[^。\n]{0,8}(?:训练集|训练数据)\s*上\s*[^。\n]{0,10}(?:训|练|跑|评)\s*[^。\n]{0,24}(?:评测时|评审时|验收时|跑分时|出分时|打分时|测试时)?\s*(?:也|又|还)?\s*(?:拿|用|以)\s*(?:它|其|这个|这套)\s*(?:来|去)?\s*(?:当|作为|当作|算作|视为)?\s*(?:benchmark|基准|标尺|尺子|标准|参照)/i,
  ],
  'Z10 benchmark 示例/题目 掺入训练': [
    /(?:把|将)\s*[^。\n]{0,14}(?:测试集|测试样本|评测集|评测样本|benchmark)\s*(?:数据集|样本|数据)?\s*(?:里)?\s*(?:的)?\s*[^。\n]{0,6}(?:示例|样本|例子|题目|题|cases?|items?|questions?)\s*[^。\n]{0,8}(?:加|放|混|掺|并|合|卷)\s*(?:进|入|到)\s*[^。\n]{0,14}(?:训练|train|训练集|训练数据|训练流程)/i,
  ],
  'Z11 留出集挪到训练侧': [
    /(?:把|将)\s*[^。\n]{0,10}(?:留出集|留出数据|留出部分|校验集|验证集|测试集|评测集)\s*[^。\n]{0,10}(?:整体|全部|直接|干脆|顺手|偷偷|暗地里)?\s*(?:挪|移|搬|划|并|拨|塞|放|转|推)\s*(?:到|进|入|去)\s*[^。\n]{0,8}(?:训练|train|训练集|训练侧|训练数据|训练流程)/i,
  ],
  'Z12 评测样本上再训一轮': [
    /(?:在|把|将|冲)\s*[^。\n]{0,8}(?:评测样本|测试样本|评测集|测试集)\s*上\s*[^。\n]{0,6}(?:再|又|重新|二次|多)?\s*(?:训|微调|练|喂)\s*(?:一轮|一次|几轮|一遍)?\s*[^。\n]{0,36}(?:泛化|对外|宣称|说成|当成|公布|汇报)/i,
  ],
  'Z13 训练数据混进真题/原题': [
    /(?:训练集|训练数据|训练样本|training\s*data|training\s*set)\s*(?:里|中|内|之中)?\s*[^。\n]{0,16}(?:混入|混进|掺入|夹带|带进|掺和进|卷进)\s*[^。\n]{0,14}(?:测试集|测试样本|评测集|评测数据|benchmark|真题|原题|考题|考试题|考试原题)/i,
  ],
};

function tryOne(name, pats, list, expectHit) {
  let hit = 0;
  const bad = [];
  list.forEach((s, i) => {
    const m = pats.some(r => r.test(s));
    if (m) hit++;
    else bad.push(`#${i}`);
  });
  return { name, hit, total: list.length, bad, expectHit };
}

const rows = [];
for (const [name, pats] of Object.entries(CANDIDATES)) {
  rows.push(tryOne(name, pats, ATTACK, true));
}
const benignRows = [];
for (const [name, pats] of Object.entries(CANDIDATES)) {
  benignRows.push(tryOne(name, pats, BENIGN, false));
}

console.log('=== 候选对攻击组（期望全命中；#0~#6 是首要目标，#7~#9 是附带的）===');
for (const r of rows) {
  const need = new Set();
  console.log(`${String(r.hit).padStart(2)}/${r.total}  ${r.name}  漏: ${r.bad.join(' ') || '无'}`);
}
console.log('\n=== 候选对良性组（期望全 0）===');
for (const r of benignRows) {
  console.log(`${String(r.hit).padStart(2)}/${r.total}  ${r.name}${r.hit ? '  误伤: ' + r.bad.join(' ') : ''}`);
}

// 全候选合起来对攻击/良性的总体效果（合并后的表）
const ALL = Object.values(CANDIDATES).flat();
const merged = list => {
  let hit = 0;
  list.forEach(s => { if (ALL.some(r => r.test(s))) hit++; });
  return hit;
};
console.log(`\n[合并候选] 攻击 ${merged(ATTACK)}/${ATTACK.length}，良性误伤 ${merged(BENIGN)}/${BENIGN.length}`);
console.log(`[对照-现表] 攻击 ${REWARD_HACKING_ZH.eval_leakage.filter(r => ATTACK.some(s => r.test(s))).length}/${ATTACK.length}，良性误伤 ${REWARD_HACKING_ZH.eval_leakage.filter(r => BENIGN.some(s => r.test(s))).length}/${BENIGN.length}`);
console.log(`[自检-现表] ${SELFTEST.filter(s => REWARD_HACKING_ZH.eval_leakage.some(r => r.test(s))).length}/${SELFTEST.length}`);
