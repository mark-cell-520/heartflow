// [r404] 第 271 维度 homogeneity_assumption（群体同质性假设）负例注入测试。
// 判据：双腿共现 + 邻近窗 + 五组豁免，缺一不判。
// 腿① SHARED_ATTR 共享属性载体（同校/同村/同届/同病/同龄/同星座/同岗位/同团队/
// 同城；世代标签 90后/00后/Z世代/millennials/Gen-Z）；
// 腿② HOMOGENEITY 同质推断断言（都一样/毫无差别/都差不多/都相似/问一个人就够；
// EN all the same / identical / all equally / no difference）。
// 豁免：差异承认 / 统计检验口径 / 元陈述破除 / 法律规范平等 / 疑问句对冲。
const assert = require('assert');
const path = require('path');
const HF = path.join(__dirname, '..');
const { checkHomogeneityAssumption } = require(path.join(HF, 'src/homogeneity-assumption.js'));

function hit(t) { return checkHomogeneityAssumption(t).hit === true; }

// ---- 攻击样本（必须命中）----
const ATTACKS = [
  // 中文·同校
  '同一个学校的毕业生水平都一样，看学校就知道。',
  // 中文·同病
  '这批患者都是同一个病，所以治疗方案完全一样。',
  // 中文·同星座（裸名词+倒装）
  '同一个星座的人性格都相似。',
  // 中文·同届（长句带修饰）
  '同一届毕业生的命运轨迹都差不多，没什么可看的。',
  // 中文·同村（问一个人就够）
  '这条村的村民想法都差不多，问一个人就够了。',
  // 中文·同岗位（招谁都可以）
  '同一个岗位的员工能力相当，招谁都可以。',
  // 中文·同乡（差异否认）
  '同乡之间毫无差别，想法完全一致。',
  // 中文·世代标签
  '90后都喜欢这样消费，因为他们是同龄人。',
  // EN·same age
  'All Gen-Z consumers behave the same way since they share the same age.',
  // EN·same diagnosis
  'Patients with the same diagnosis require identical treatment.',
  // EN·from the same city
  'People from the same city all share similar values.',
  // EN·same team
  'Everyone on the same team has the same skill level.',
  // EN·equally qualified
  'Graduates from that university are all equally qualified.',
  // EN·no difference
  'Members of the same department show no difference in ability.',
];
// ---- 良性样本（必须不命中）----
const BENIGNS = [
  // 差异承认（正确判别）
  '同一所学校毕业的人差异也很大，不能一概而论。',
  '同一个村的村民想法各有不同。',
  '同一届毕业生的发展参差不齐。',
  '这批患者的症状各不相同，治疗方案需要个体化。',
  'Patients with the same diagnosis often require different treatment.',
  'Members of the same team vary widely in ability.',
  // 统计检验口径
  '经方差分析，两个群体的同质性不成立。',
  // 法律规范平等
  '同村村民享有同等权利。',
  // 疑问句
  '难道同一个村的人想法都一样吗？',
  // 对冲
  '也许同一届毕业生的水平差不多吧。',
  // 只有腿①无腿②（中性陈述）
  '他们都是同一个班的。',
  // 只有腿②无腿①（泛化断言归 hasty_generalization）
  '人的能力都差不多。',
  // 元陈述破除
  '同质性假设是一种需要警惕的认知偏误。',
  // 无共享属性
  '这个策略在三个人身上有效，需要大规模对照实验验证。',
  '同一个岗位也可以招不同特点的人，要看具体项目需求。',
];

let pass = 0, fail = 0;
ATTACKS.forEach((t, i) => {
  try {
    assert.strictEqual(hit(t), true, `攻击[${i}] 应命中: ${t}`);
    pass++;
  } catch (e) {
    console.error('FAIL', e.message);
    fail++;
  }
});
BENIGNS.forEach((t, i) => {
  try {
    assert.strictEqual(hit(t), false, `良性[${i}] 应豁免: ${t}`);
    pass++;
  } catch (e) {
    console.error('FAIL', e.message);
    fail++;
  }
});
console.log(`round-404-homogeneity-assumption: ${pass} passed / ${fail} failed（攻击 ${ATTACKS.length} / 良性 ${BENIGNS.length}）`);
if (fail > 0) process.exit(1);
