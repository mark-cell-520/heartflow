'use strict';
// r379 诊断 v5：为 EXEMPT_META / EXEMPT_NORM 构造「豁免唯一阻挡」形句子。
// 基座取 canonical 攻击句 A1（双腿完整），只插入豁免触发词，不加任何其他阻挡。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const m = require(path.join(ROOT, 'src', 'relative-risk-individual-transfer.js'));
const NEVER = /(?!x)x/;

const CANDS = {
  'META_ZH': [
    // 教材/论文语境 + 攻击结构
    '统计学教材指出，风险降低60%，所以每个患者的心血管事件都会减少六成',
    '论文中提到，风险降低60%，所以每个患者的心血管事件都会减少六成',
    '统计学教材说，疫苗把人群感染风险压低九成，因此每个人的感染风险也少了九成',
  ],
  'META_EN': [
    'The textbook says risk was cut by 60%, so every patient\'s event count drops by six tenths.',
    'The lecture notes state the vaccine cuts infection risk by 90%, therefore each person\'s risk also drops by nine tenths.',
  ],
  'NORM_ZH': [
    // 规范报告语境 + 攻击结构
    '按统计学规范报告，风险降低60%，所以每个患者的心血管事件都会减少六成',
    '相对风险降低60%与绝对风险降低3%需同时报告，所以每个患者的心血管事件都会减少六成',
  ],
  'NORM_EN': [
    'Reported per statistical conventions: risk was cut by 60%, so every patient\'s event count drops by six tenths.',
    'The relative risk reduction of 60% together with the absolute risk reduction means every individual receives the same extent of benefit.',
  ],
};

const KEYMAP = {
  META_ZH: ['EXEMPT_META_ZH'],
  META_EN: ['EXEMPT_META_EN'],
  NORM_ZH: ['EXEMPT_NORM_ZH'],
  NORM_EN: ['EXEMPT_NORM_EN'],
};

for (const [label, list] of Object.entries(CANDS)) {
  console.log('=== ' + label + ' ===');
  for (const s of list) {
    const base = m.checkRelativeRiskIndividualTransfer(s).hit;
    const inj = {};
    for (const k of KEYMAP[label]) inj[k] = NEVER;
    const killed = m.checkRelativeRiskIndividualTransfer(s, inj).hit;
    const flag = (!base && killed) ? '★USABLE' : (base ? 'BASE-HIT!' : 'blocked-anyway');
    console.log(`  ${flag} base=${base} killed=${killed}  ${s.slice(0, 60)}`);
  }
}
