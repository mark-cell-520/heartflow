// r435 探针二：P3 扩充样本深度验证（新秀墙/魔咒族）+ 豁免边界
'use strict';
const hf = require('../src/gate.js');

const ATTACKS = [
  // ZH 冠军/新人极端 × 回落 × 魔咒断言
  '拿了最佳新人后就撞上新秀墙，这魔咒看来真躲不过',
  '上年还是冠军，今年直接崩盘，亚军魔咒果然又灵验了',
  '第二张专辑远不如首张，第二专辑综合征谁也逃不掉',
  '他连拿三个冠军后状态断崖式下滑，果然是夺冠即巅峰的魔咒',
  '上了封面成绩就下滑，封面魔咒屡试不爽',
  '首专即巅峰，后面的专辑一张不如一张，这就是首专魔咒',
  '第一次创业就上市，第二家必然倒闭，首战即巅峰的魔咒跑不掉',
  '卫冕冠军第二年全垮了，卫冕魔咒真是铁律',
  '考了第一之后就一路下滑，看来第一名魔咒谁都逃不过',
  '拿了大奖后作品水准直线下降，获奖魔咒又一次应验',
  // EN
  'He won rookie of the year and immediately hit the sophomore slump — the jinx is real',
  'After the championship they collapsed; the cover curse strikes again',
  'Every rookie of the year hits the sophomore slump — the curse never fails',
  'After winning the title they fell apart; the championship curse is real',
  'Her first album was a masterpiece and the second flopped — second album syndrome again',
];

const BENIGN = [
  // 概念教学/正确解释 → 应被存量概念豁免
  '新秀墙是典型现象，多数新人第二年数据都会回落，这只是均值回归',
  'Sophomore slumps are well documented as regression to the mean',
  '新人第二年数据回落，这是统计学上的均值回归，不是魔咒',
  // 无魔咒断言的归因（干预/替代解释）→ 不应命中
  '他换了教练后成绩下滑，可能是对手研究透了我们',
  '专辑不如首张受欢迎，也可能是因为创作周期太短',
  '卫冕失败有很多原因，不能说是魔咒应验',
  // 反驳/存疑句 → 豁免
  '数据下滑是事实，但说是魔咒就言过其实了',
  '所谓封面魔咒并没有统计依据，只是均值回归',
];

const show = (arr, tag) => {
  console.log(`\n=== ${tag} ===`);
  let pass = 0, own = 0;
  for (const t of arr) {
    const r = hf.gate(t);
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d !== 'none');
    const action = r.gate.action;
    if (action === 'pass') pass++;
    if (dims.includes('regression_to_the_mean')) own++;
    console.log(`  [${action}] ${dims.join(',') || '-'} | ${t.slice(0, 30)}`);
  }
  console.log(`${tag}: pass=${pass}/${arr.length} 本维度承重=${own}/${arr.length}`);
};
show(ATTACKS, '攻击');
show(BENIGN, '良性');
