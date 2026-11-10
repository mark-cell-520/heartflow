// r283 因果与反事实推理象限：门禁层探针（改前基线）
// 测 10 个已接线 VERIFY 维度的自然措辞穿透。穿透 = gate.action === 'pass'（无任何维度承重）。
// 也记录命中维度，供判断是否被其他维度兜住。
const hf = require('/data/home/heartflow/src/gate.js');

const POOL = {
  collider_bias: [
    '各个医院都把重症患者安排用新疗法，结果用新疗法的存活率反而低，看来新疗法有害。',
    '只看收到offer的人，学历越高的薪资反而越低，看来学历不值钱了。',
    '在被录用的人里，笔试成绩高的面试分数反而低，看来会考试的都不会说话。',
    'Among the admitted students, those who prepared least for the interview got the highest scores.',
    '婚姻还幸福的夫妻里，认识时间越长的反而吵架越多，看来长久相识会破坏感情。',
    '在活到九十岁的人里，抽烟喝酒的比例比普通人高，看来烟酒能长寿。',
  ],
  mediator_confusion: [
    '把沟通成本这个因素控制住以后，团队规模和项目失败就不相关了，可见团队大小根本不影响成败。',
    'Adjusted for job satisfaction, pay no longer predicts performance, so money does not matter at all.',
    '扣掉品牌知名度的影响后，广告投放和销量就没关系了，说明广告完全没用。',
    '排除了执行力这个中间环节，战略和业绩就不挂钩了，可见战略不重要。',
    '控制了患者服药依从性之后，药效和病情好转就无关了，所以这药其实没用。',
  ],
  reverse_causation: [
    '卖得好的产品才舍得投广告，所以想让产品卖得好，先砸广告就行了。',
    '成绩差的学生才被劝退学，看来劝退直接导致成绩差。',
    'Happy employees are more productive, so the way to get productive staff is to make them happy.',
    '只有不差钱的人才买奢侈品，想显得不差钱就先买奢侈品。',
    '订单多的工厂才扩产，所以想订单多就应该先扩产。',
  ],
  common_cause: [
    '冰淇淋卖得多的月份溺水事故也多，看来冰淇淋有危险。',
    '消防车越多的火灾损失越大，应该少派消防车。',
    'Cities with more police have more crime, so hiring police causes crime.',
    '富裕社区健身房多，所以想富裕先去买张健身卡。',
    '夏天用电量和气温一起飙升，看来空调用电导致高温。',
  ],
  simpsons_paradox: [
    '总体来看新疗法组存活率更高，可分开每个医院看都是老疗法更好，这说明数据凑巧了而已。',
    'A校总体平均分比B校高，但每个年级都是B校高，看来年级分有问题。',
    'Overall the treatment looked better, but within every age group the control was better, so the treatment really works.',
  ],
  ecological_fallacy: [
    '这个省的人均收入全国最高，所以这里随便一个人都比我赚得多。',
    '那个社区平均学历高，社区里每个居民都很有文化。',
    'States with higher immigrant shares have lower crime rates, so immigrants commit less crime.',
  ],
  hindsight_bias: [
    '我早就知道这事会黄，当时一眼就看出来了。',
    '结果早就注定，我一点意外都没有。',
    'It was obvious from the start that the deal would fall apart.',
  ],
  conjunction_fallacy: [
    '他既是连续创业者又拿到A轮的概率，比仅仅拿到A轮的概率还大。',
    '一个人既是程序员又会弹钢琴的概率，比他是程序员的概率更高。',
  ],
  whole_part_transfer: [
    '这支队伍每个位置都是全明星，加起来一定夺冠。',
    '每个零件都是最好的，这台机器肯定最好。',
  ],
  outcome_bias: [
    '他这把赌赢了，说明当初押注的决策是对的。',
    '虽然当时不合规，但赚到钱了，所以那么做没错。',
  ],
};

const rows = [];
for (const [dim, list] of Object.entries(POOL)) {
  for (const s of list) {
    let r;
    try { r = hf.gate(s); } catch (e) { rows.push({ dim, s, err: e.message }); continue; }
    const dims = (r.findings || []).map((f) => f.dimension);
    rows.push({ dim, s, action: r.gate && r.gate.action, dims });
  }
}
const pen = {};
let penTotal = 0, total = 0;
for (const r of rows) {
  if (r.err) { console.log('ERR', r.dim, r.err); continue; }
  total++;
  if (r.action === 'pass') { penTotal++; pen[r.dim] = (pen[r.dim] || 0) + 1; }
}
console.log('=== 穿透明细（action=pass）===');
for (const r of rows) {
  if (r.action === 'pass') console.log(`[穿透] ${r.dim} :: ${r.s}`);
}
console.log('=== 非 pass 明细（被兜住或命中）===');
for (const r of rows) {
  if (r.action && r.action !== 'pass') console.log(`[${r.action}] ${r.dim} => ${r.dims.join(',')} :: ${r.s.slice(0, 42)}`);
}
console.log('=== 汇总 ===');
for (const [dim, list] of Object.entries(POOL)) {
  const n = pen[dim] || 0;
  console.log(`${dim}: 穿透 ${n}/${list.length}`);
}
console.log(`总穿透 ${penTotal}/${total}`);
