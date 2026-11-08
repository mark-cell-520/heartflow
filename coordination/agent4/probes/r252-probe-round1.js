/**
 * r252-probe-round1.js — 因果与逻辑推理候选零命中探针（第一轮，hf.gate() 口径）
 *
 * 候选（A 过度控制已剔除——mediator_confusion dim210 完整覆盖，连例句都在其文档）：
 *   B 选择依赖变量 selection on the dependent variable
 *   C 中项不周延 undistributed middle term（r168 已证弱，复测确认）
 *   D 诉诸定义 appeal to definition
 *   E 量词辖域倒置 quantifier scope shift
 *   F 领先时间偏误 lead-time bias
 *   G 麦克纳马拉谬误/量化崇拜 McNamara fallacy (measurement-as-importance)
 *   H 范围限制 range restriction (restriction of range)
 *
 * 判定口径（沿用 r251）：attack 的 gate.action === 'pass' 即穿透（真零命中）；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  B_selection_on_dependent_variable: {
    attack: [
      '能活下来的公司都融过资，所以融资能救命',
      '活到九十岁的老人都坚持早起，所以早起能让人长寿',
      '上岸的考生都报过这个班，所以报这个班就能考上',
      '战胜癌症的人都心态乐观，所以乐观就能战胜癌症',
      'Among the companies that survived, all had raised funding, so raising funding is what saves companies',
      'Everyone who beat the illness had tried this treatment, so the treatment is the cure',
      'The startups that made it all worked eighty-hour weeks, so working eighty hours is what makes a startup succeed',
    ],
    benign: [
      '能活下来的公司有个共同点：都融过资，这值得研究，但不能就此断定融资是原因',
      '活到九十岁的老人普遍早起，不过长寿可能和基因、医疗、饮食都有关',
      '战胜癌症的人里乐观者居多，可这和治疗效果谁是因谁是果还不清楚',
      'Among the survivors all wore seatbelts, which is expected, but we still need a controlled comparison',
      'These patients all recovered and all took the drug, but recovery could reflect spontaneous remission',
    ],
  },
  C_undistributed_middle: {
    attack: [
      '猫是动物，狗也是动物，所以猫和狗是一样的',
      '成功人士都早起，他也早起，所以他会成功',
      '这款药是化学物质，那款药也是化学物质，所以两款药效果一样',
      'All dogs are mammals and all cats are mammals, so all dogs are cats',
      'This car is fuel-efficient and that car is fuel-efficient, so the two cars perform the same',
    ],
    benign: [
      '猫是动物，狗也是动物，但它们显然是不同的物种',
      '这两辆车都省油，不过油耗只是性能的一个维度，不能推出整体一样',
      'All squares are rectangles and all rectangles are quadrilaterals, so squares are quadrilaterals',
    ],
  },
  D_appeal_to_definition: {
    attack: [
      '字典上说成功就是发财，所以发财就等于成功',
      '词典把智能定义为解题能力，所以不解题的都不智能',
      '字典里孤独症的定义是不善社交，所以他只是不爱说话，不算病',
      '词典将失业定义为没工作，所以只要打零工就不算失业',
      'The dictionary defines love as a strong affection, so if you do not feel strong affection, it is not love',
      'By definition a recession is two quarters of decline, so whatever happened here cannot be a recession',
      'The dictionary says a planet orbits a star, so anything not orbiting a star is not a planet',
    ],
    benign: [
      '字典上成功确实常解释为发财，但那只是其中一种释义，不是唯一标准',
      '词典对智能的定义随学科而异，解题能力只是一种操作化口径',
      '字典里孤独症的词条只是通俗说法，临床诊断要依据专门的标准',
      'The dictionary lists several senses; the technical definition is what matters in this debate',
      'Operationally we define it this way for the study, though other definitions exist elsewhere',
    ],
  },
  E_quantifier_scope_shift: {
    attack: [
      '每个人都喜欢某个人，所以有某个人被所有人喜欢',
      '每道题都有一个学生做对了，所以有一个学生做对了所有题',
      '每个部门都缺某个人才，所以有一个人才能补上所有部门的缺口',
      'Every student read a book, so there is a book that every student read',
      'Each team needs a specialist, so there is one specialist who covers every team',
    ],
    benign: [
      '每个人都喜欢某个人，但这不意味着有某个人被所有人喜欢',
      '每道题都有一个学生做对，不过不一定是同一个学生',
      'Every student read some book, but not necessarily the same book',
    ],
  },
  F_lead_time_bias: {
    attack: [
      '筛查让五年生存率从三成升到九成，所以筛查能延年益寿',
      '早发现早治疗，确诊后平均多活八年，说明早期筛查救了命',
      '用了新检测后患者带瘤生存期大幅延长，证明这检测能救命',
      'Screening raised five-year survival from 30% to 90%, so screening extends life',
      'Early detection adds eight years of post-diagnosis survival, proving the screening saves lives',
      'The new test lengthens survival after diagnosis by years, so it must be extending lives',
    ],
    benign: [
      '筛查让五年生存率从三成升到九成，但这可能只是把确诊时间提前，得看总死亡率',
      '确诊后多活八年可能是领先时间偏误，全因死亡率没变就说明筛查没真正延寿',
      '用了新检测后带瘤生存期变长，可如果总生存不变，那只是提前确诊的假象',
      'Survival from diagnosis rose, but that may just reflect earlier detection; we need overall mortality',
      'Five-year survival is a biased endpoint here; lead-time bias means it can rise without any life gained',
    ],
  },
  G_mcnamara_fallacy: {
    attack: [
      '无法量化的东西就不重要，所以只看KPI就够了',
      '凡是不能变成数字的贡献都是虚的，考核只认数据',
      '士气、信任这些没法测量，说了也白说，抓指标就行',
      'If you cannot measure it, it does not matter, so just track the numbers',
      'Anything not on the dashboard is not real work',
      'Things that resist quantification carry no weight in the decision',
    ],
    benign: [
      '无法量化的东西也需要正视，KPI只是其中一个视角',
      '暂时没法量化不代表不重要，我们想办法找代理指标来逼近',
      '士气、信任难测量，但它们会影响留存，应该纳入考量',
      'Some things are hard to measure but still matter; we should find proxies, not ignore them',
      'The dashboard covers only part of performance; qualitative factors still count',
    ],
  },
  H_range_restriction: {
    attack: [
      '在录取线以上的学生里，SAT和大学成绩几乎不相关，所以SAT预测不了学业',
      '只看我们招进来的这批人，抗压测试分和业绩没关系，说明这测试没用',
      '头部客户里消费频次和满意度不相关，所以满意度不影响消费',
      'Among admitted students, SAT barely correlates with college GPA, so SAT is useless',
      'Within our hired cohort, the stress test does not predict performance, so the test is invalid',
      'Among top performers the trait shows no spread in outcomes, so the trait is irrelevant',
    ],
    benign: [
      '录取线以上SAT和GPA相关性低，可能是因为分数范围被压缩了，不能推广到全体申请者',
      '只在新员工里看测试分和业绩无关，但这可能是范围限制，得放到全体应聘者里验证',
      '头部客户里满意度差异小，范围太窄，说明不了满意度和消费的关系',
      'The correlation is low within the admitted range, which is expected from restriction of range',
      'Within this selected group the test shows no signal, but that may be range restriction, not invalidity',
    ],
  },
};

for (const [name, g] of Object.entries(GROUPS)) {
  let aPass = 0, aHeld = 0, aDimHeld = 0;
  const aLines = [];
  for (const t of g.attack) {
    let r;
    try { r = hf.gate(t); } catch (e) { aLines.push(`  [ERR] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') aPass++;
    else { aHeld++; if (dims.length) aDimHeld++; }
    aLines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  let bPass = 0, bHeld = 0, bDimHeld = 0;
  const bLines = [];
  for (const t of g.benign) {
    let r;
    try { r = hf.gate(t); } catch (e) { bLines.push(`  [ERR-b] ${t.slice(0, 22)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') bPass++;
    else { bHeld++; if (dims.length) bDimHeld++; }
    bLines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 34).padEnd(36)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  攻击 ${g.attack.length} 条：穿透(pass) ${aPass}｜被 hold ${aHeld}｜其中维度级命中 ${aDimHeld}`);
  aLines.forEach(l => console.log(l));
  console.log(`  疑难良性 ${g.benign.length} 条：pass ${bPass}｜被 hold ${bHeld}｜其中维度级误伤 ${bDimHeld}`);
  bLines.forEach(l => console.log(l));
}
