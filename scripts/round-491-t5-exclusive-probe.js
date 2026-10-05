'use strict';
// 第491轮探针：为 T5 四支各挑「删该支后失守」的独占样本（删条变异选样）
// 口径：同一候选样本池，逐支把 `X.test(text)` 置假后重测；
// 仍命中 = 有其他支兜底（不能作该支的承重样本），失守 = 该支独占承重。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src/agency-deflection.js');

const BRANCHES = ['T5_ZH_BLAME', 'T5_ZH_EXEC', 'T5_ZH_NULLIFY', 'T5_EN'];

const SAMPLES = [
  '出了问题全怪系统算法，它自己做的决策。',
  '这都是流程规定的，我也没办法。',
  '按照公司制度办的，个人没有选择空间。',
  '这是公司规定，我自己没有任何选择余地。',
  '责任在系统那边，不在任何人身上。',
  '锅是平台背，跟我们没有关系。',
  '决策权在算法手里，谁也管不了。',
  '都是模型给出的结果，我们只是照单执行。',
  '这件事走的是自动流程，个人只能接受。',
  '责任归系统，人只是按一下按钮。',
  '算法给出的指令，我们只能服从。',
  'The algorithm made the call, not any person here.',
  'The platform absorbs the blame, we are just following it.',
  'The system owns the decision, we just carry it out.',
  'No human has any say in how the model routes cases.',
  '责任全在流程那一边，谁也不背。',
];

function freshHit(text) {
  delete require.cache[require.resolve(MODULE)];
  const m = require(MODULE);
  return m.checkAgencyDeflection(text).hit;
}

function hitWithBranchOff(branch, text) {
  const orig = fs.readFileSync(MODULE, 'utf8');
  const marker = new RegExp(branch + '\\.test\\(text\\)');
  if (!marker.test(orig)) throw new Error('marker not found: ' + branch);
  const mutated = orig.replace(marker, 'false && ' + branch + '.test(text)');
  fs.writeFileSync(MODULE, mutated, 'utf8');
  try {
    delete require.cache[require.resolve(MODULE)];
    const m = require(MODULE);
    return m.checkAgencyDeflection(text).hit;
  } finally {
    fs.writeFileSync(MODULE, orig, 'utf8');
    delete require.cache[require.resolve(MODULE)];
    require(MODULE);
  }
}

// 1) 基线：每条样本当前是否命中（未命中说明探针选错）
const base = SAMPLES.map(s => ({ s, hit: freshHit(s) }));
for (const b of base) if (!b.hit) console.log('BASELINE-MISS', b.s.slice(0, 30));

// 2) 逐支挑独占样本
for (const br of BRANCHES) {
  const exclusive = [];
  for (const b of base) {
    if (!b.hit) continue;
    if (!hitWithBranchOff(br, b.s)) exclusive.push(b.s);
  }
  console.log(`\n== ${br} 独占承重样本 ${exclusive.length} 条 ==`);
  exclusive.forEach(s => console.log('  ' + s));
}

// 3) 还原校验
const orig = fs.readFileSync(MODULE, 'utf8');
console.log('\n还原后 checkAgencyDeflection 可用：', typeof require(MODULE).checkAgencyDeflection === 'function', '| 文件长度', orig.length);
