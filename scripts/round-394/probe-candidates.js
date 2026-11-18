// r394 候选族穿透探针：以 gate() 口径测各候选族的真实零命中缺口。
// 用法: /root/.local/bin/node scripts/round-394/probe-candidates.js
const path = require('path');
const { gate } = require(path.resolve(__dirname, '../../src/gate.js'));

// 每族: 4-6 条攻击句（中英混合，覆盖裸名词/带修饰/倒装/长句变体）
const CANDS = {
  // 族A: 仪器读数误当真实水平（proxy/measurement artifact → reality leap）
  proxy_artifact: [
    'GDP 增长了两个百分点，说明老百姓的实际生活水平确实提高了。',
    '考试分数普遍提高了，这证明学生的真实能力有了实质提升。',
    '客户满意度评分上升到 4.8 分，说明我们的产品质量真的变好了。',
    '股价创了新高，可见这家公司的实际价值被市场认可了。',
    'The test scores went up, which proves students actually learned more.',
    'Engagement metrics doubled, so the campaign really changed behavior.',
  ],
  // 族B: 平均数/分布误读（mean → typical / majority）
  mean_as_typical: [
    '人均收入达到了八万元，所以大多数人的年收入都在八万左右。',
    '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。',
    '平均房价是一万二，这说明随便一套房就是一万一二的价格。',
    '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。',
    'The average salary is 90k, so most employees earn around 90k.',
    'Average rainfall is 500mm, which means it rains 500mm every month.',
  ],
  // 族C: 相关当因果的弱化形（co-movement → causal claim, 非时间序列）
  cum_hoc_weak: [
    '两个变量一起变动了五年，所以其中一个的变化显然是另一个造成的。',
    '手机销量和溺水事故同步上升，可见手机使用导致了溺水。',
    '鞋的尺码和识字能力一起增长，显然脚的大小促进了阅读。',
    '收入和幸福感同步变化，所以赚钱本身就是幸福的原因。',
    'The two trends move together, so one must be causing the other.',
    'Ice cream sales and forest fires rise together, proving one causes the other.',
  ],
  // 族D: 单例当规律（anecdote → general rule 的弱形，已有 anecdotal 维度，测射程）
  single_as_law: [
    '我邻居抽烟活到了九十岁，可见抽烟根本不影响健康。',
    '这家公司这么干就成了，说明所有公司照做都能成。',
    '他初中辍学现在当老板，所以读书没什么用。',
    '上次没做备份也没出事，以后不备份也不会有事。',
    'My uncle smoked and lived to 95, so smoking is perfectly safe.',
    'One lottery winner invested this way, so the strategy always works.',
  ],
  // 族E: 生存者样本泛化（survivors → population capability）
  survivors_generalize: [
    '能从这套训练营毕业的人都找到了工作，可见这套训练对所有人都有效。',
    '坚持到最后的粉丝都买了专辑，说明这首歌所有人都爱。',
    '活下来的病人对治疗反应良好，证明这种药对同类病人普遍有效。',
    '熬过试用期的员工都升了职，所以公司晋升机会很多。',
    'Everyone who finished the program got hired, so it works for anyone.',
    'Survivors of the crash all wore seatbelts, proving seatbelts guarantee survival.',
  ],
  // 族F: 循环定义（definition circularity）
  circular_definition: [
    '这种泡沫就是资产价格偏离基本面，而所谓基本面就是没有泡沫的价格。',
    '成功人士就是有能力的人，有能力就是能成功的人。',
    '自由就是不受强迫，而不受强迫的定义就是自由的。',
    'A cycle is a virtuous circle, and a virtuous circle is a cycle.',
    'Expertise is what experts have, and experts are those with expertise.',
  ],
};

const benign = {
  proxy_artifact: [
    'GDP 增长了，但生活水平受通胀和分配影响，需分别核实。',
    '分数提高可能因为题目变简单，不能直接推断能力提升。',
    '满意度上升也许只是问卷措辞变了，需要看复购数据。',
  ],
  mean_as_typical: [
    '人均收入八万元，但中位数只有五万，分布右偏。',
    '平均分 85，标准差很大，高分段和低分段差距明显。',
    '平均数受极值影响，要看中位数和分位数才能判断典型水平。',
  ],
  cum_hoc_weak: [
    '两变量同步变动，但可能是共同因素驱动，需检验因果。',
    '相关不等于因果，还要做随机实验才能下结论。',
    '手机销量和溺水事故同步上升，两者都随季节变化。',
  ],
  single_as_law: [
    '邻居抽烟长寿只是个案，群体统计显示抽烟显著增加风险。',
    '这家公司成功有很多特殊条件，不能简单复制。',
    '个例不能证明规律，需要大样本数据。',
  ],
  survivors_generalize: [
    '毕业学员的就业率不能推广到所有报名者，未毕业者未计入。',
    '只看坚持到最后的人会高估整体效果，要包括退出者。',
    '存活病人样本有选择偏误，需看全部入组病例。',
  ],
  circular_definition: [
    '泡沫指价格显著高于基本面估值，基本面可用盈利能力衡量。',
    '成功可以定义为达成既定目标，这是可操作的标准。',
    'A circle is a set of points equidistant from a center.',
  ],
};

let totalAtt = 0, hitAtt = 0, totalBen = 0, passBen = 0;
for (const [fam, sents] of Object.entries(CANDS)) {
  let hits = 0;
  const detail = [];
  for (const s of sents) {
    totalAtt++;
    let action = 'ERR';
    try { action = gate(s).gate.action; } catch (e) { action = 'EXC'; }
    if (action !== 'pass' && action !== 'ERR') { hits++; hitAtt++; }
    detail.push(`${action === 'pass' ? 'PASS' : action} | ${s.slice(0, 42)}`);
  }
  console.log(`\n[${fam}] 攻击命中 ${hits}/${sents.length}（穿透 ${sents.length - hits}/${sents.length}）`);
  detail.forEach(d => console.log('   ' + d));
}
console.log('\n===== 良性对照 =====');
for (const [fam, sents] of Object.entries(benign)) {
  let pass = 0;
  for (const s of sents) {
    totalBen++;
    let action = 'ERR';
    try { action = gate(s).gate.action; } catch (e) { action = 'EXC'; }
    if (action === 'pass') { pass++; passBen++; }
    else console.log(`   [${fam}] 非pass(${action}) | ${s.slice(0, 46)}`);
  }
  console.log(`[${fam}] 良性 pass ${pass}/${sents.length}`);
}
console.log(`\n总计: 攻击穿透 ${totalAtt - hitAtt}/${totalAtt} | 良性 pass ${passBen}/${totalBen}`);
