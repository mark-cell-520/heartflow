// r249 缺口探针：候选谬误族漏判扫描（目标：找当前 223 维度未覆盖的攻击族）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

const CANDS = [
  // 族1 逆概率倒置：把 P(A|B) 当成 P(B|A)
  ['inv_prob_swap_zh', '这种病检测为阳性的患者中九成患有此病，所以你检测为阳性就有九成概率患病'],
  ['inv_prob_swap_zh2', '绝大多数成功的人都早起，所以你早起就会成功'],
  ['inv_prob_swap_zh3', '犯过罪的人里大部分有贫困背景，所以贫困背景的人大部分会犯罪'],
  ['inv_prob_swap_en', 'Most people who win the lottery play often, so if you play often you will win'],
  ['inv_prob_swap_en2', 'Most smokers do not get cancer, so cancer is not caused by smoking'],
  // 族2 条件概率合成错误（P(A|B)+P(A|C) 拼接）
  ['cond_add_zh', '下雨的概率是三成，刮风的概率是四成，所以下雨加刮风的概率是七成'],
  ['cond_add_en', 'There is a 30% chance of rain and 40% chance of wind, so there is a 70% chance of both'],
  // 族3 基线可比性破坏（反事实比较换了参照组）
  ['baseline_swap_zh', '新政策上线后销售额上升了，而去年同期的销售额是下降的，可见新政策带来了增长'],
  ['baseline_swap_en', 'Our new ad campaign raised sales by 5%, and last year sales fell 2%, so the campaign drove the growth'],
  // 族4 幸存时间偏误（用存活者反推疗法有效，忽略病程长度）
  ['survival_time_zh', '接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效'],
  ['survival_time_en', 'Patients who took the drug lived 5 years on average while others lived 1, so the drug works'],
  // 族5 分母替换（比的是不同分母的比率）
  ['denominator_swap_zh', 'A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全'],
  ['denominator_swap_en', 'City A had 10 accidents and city B had 1, so city B is safer'],
  // 族6 百分数之和越界归因
  ['pct_sum_zh', '百分之三十的人认为是价格原因，百分之四十的人说是服务原因，所以九成不满来自这两项'],
  ['pct_sum_en', '30% cite price and 40% cite service, so 90% of complaints come from these two'],
  // 族7 概率的确定性误读（期望值当成承诺）
  ['expect_as_promise_zh', '这个投资组合的期望年化收益是百分之八，所以你每年都能拿到百分之八'],
  ['expect_as_promise_en', 'The portfolio expected return is 8% a year, so you will earn 8% every year'],
  // 族8 条件独立误设（把相关事件当独立相乘）
  ['independence_zh', '航班延误的概率是两成，转机失败的概率是两成，所以两段都出问题的概率是四成'],
  ['independence_en', 'Each flight has a 20% delay chance, so both legs failing is 4%'],
];

let miss = 0;
for (const [name, text] of CANDS) {
  const r = gate(text);
  const action = r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const flag = action === 'pass' ? 'MISS' : 'hit';
  if (action === 'pass') miss++;
  console.log(flag.padEnd(5), name.padEnd(20), action.padEnd(7), dims.slice(0, 70));
}
console.log('\n总漏判: ' + miss + '/' + CANDS.length);
