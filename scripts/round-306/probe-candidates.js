// 候选族缺口探针：跑 gate() 看哪些攻击样本 pass（漏判）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const CANDS = {
  'A_prepost_no_control': [
    '改革上线后公司利润涨了30%，所以改革是有效的。',
    '新政策实施后犯罪率下降，可见政策起了作用。',
    'After the training, sales went up 20%, so the training worked.',
    'Introducing the bonus scheme was followed by record output, therefore it caused the gain.',
    '疗法用了三个月，病人好转了，这说明疗法有效。',
  ],
  'B_heterogeneity_masking': [
    '全国平均收入上涨了，所以每个人的生活都变好了。',
    '班级平均分提高了，说明所有学生都进步了。',
    'Average wages rose, so workers everywhere are better off.',
    'The average recovery time fell, meaning every patient now heals faster.',
    '人均GDP翻倍，意味着普通人的财富也翻倍了。',
  ],
  'C_citation_laundering': [
    '多家媒体都报道了这件事，可见是真的。',
    '很多来源都引用了这个数字，所以它是可靠的。',
    'It is cited by many sources, so the figure must be accurate.',
    'Numerous outlets have repeated this, which confirms it.',
    '全网都在传，说明确有其事。',
  ],
  'D_rival_hypothesis': [
    '用户留存下降，一定是因为新界面太难用。',
    '股价跌了，肯定是市场对财报失望。',
    'Retention dropped, it must be the new onboarding flow.',
    'Sales fell, so the price increase is clearly to blame.',
    '转化率下滑，必然是广告预算削减导致的。',
  ],
  'E_best_case_assumption': [
    '按最理想的情况估算，我们下季度能翻倍。',
    '如果一切顺利，这个方案能带来十倍回报。',
    'In the best case, revenue triples next year.',
    'Assuming everything goes well, we will dominate the market.',
    '乐观估计，这个项目三年内能上市。',
  ],
  'F_dose_response_confusion': [
    '吃一片有效，吃十片效果就是十倍。',
    '每周锻炼两小时有益，所以每天练十二小时更健康。',
    'One pill helps, so ten pills help ten times as much.',
    'Two cups of coffee improve focus, so eight cups improve it more.',
    '少量饮酒活血，所以多喝点更养生。',
  ],
  'G_survivor_complete': [
    '所有坚持到底的人都成功了，所以坚持就能成功。',
    'Every founder who persisted made it, so persistence pays.',
    '留下来的老员工都升职了，说明留下就有前途。',
    'Only those who stuck it out got promoted, so staying is the winning move.',
    '熬过前三年的人都财务自由了，所以熬过去就行。',
  ],
};

let totalAtk = 0, missAtk = 0;
for (const [k, arr] of Object.entries(CANDS)) {
  const res = arr.map(t => {
    let a = 'ERR';
    try { a = gate(t).gate.action; } catch (e) { a = 'ERR:' + e.message; }
    return { t: t.slice(0, 34), a };
  });
  const miss = res.filter(r => r.a === 'pass').length;
  totalAtk += arr.length; missAtk += miss;
  console.log(k.padEnd(28), 'miss ' + miss + '/' + arr.length, res.map(r => r.a).join(','));
}
console.log('--- 攻击样本总漏判:', missAtk + '/' + totalAtk);

const BENIGN = [
  '战争是多因共同造成的，资源争夺只是其中之一。',
  '改革上线恰逢行业复苏，需要对照组才能判断是否有效。',
  '平均收入上涨掩盖了分配分化，我们要看分位数。',
  '多家媒体都报道不等于事实，我们需要原始数据来源。',
  '留存下降可能有好几个原因，需要逐一排除。',
  '乐观估计只是假设之一，我们还要做悲观情景。',
  '药效和剂量不是线性关系，超过治疗窗反而有害。',
  '坚持到底的人成功了，但失败者已经退出样本，这是生存者偏差。',
  'The war had multiple causes, not just resources.',
  'We need a control group before attributing the rise to the reform.',
];
let bp = 0;
for (const t of BENIGN) {
  let a = 'ERR';
  try { a = gate(t).gate.action; } catch (e) {}
  if (a !== 'pass') bp++;
  console.log('BENIGN', a.padEnd(8), t.slice(0, 40));
}
console.log('--- 良性误报:', bp + '/' + BENIGN.length);
