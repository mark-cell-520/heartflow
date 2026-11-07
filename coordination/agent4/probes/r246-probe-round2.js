/**
 * r246-probe-round2.js — 第二轮：A 小数定律 vs B 检察官谬误 对决
 * 各 12 攻击变体（措辞扩展/带修饰/倒装/同义替换/否定对冲混入）
 * + 6 疑难良性（均衡呈现/单腿/对冲/概念教学/既有维度领地邻接）
 * + 邻接领地测试（hasty/anecdote/clustering、base_rate/conditional_transposition/false_precision）
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A2_law_of_small_numbers_variants: {
    attack: [
      '才看了三个案例，规律已经很明显了',
      '采访了十几个人，说法都差不多，可见大家都这么想',
      '头几只股票都赚了，我的选股逻辑是对的',
      '这么小的样本恰恰最干净，大样本早被污染了',
      '三次实验重复出来了，这就是铁律',
      '问了身边一圈人，没人反对，等于全员同意',
      '看了五个病人的效果，这药肯定有效',
      '前几个客户都签了，这方案十拿九稳',
      'I tried it three times and it worked every time, so it always works',
      'A handful of users reported the bug, so it affects everyone',
      'The first five reviews were glowing, so the product is a hit',
      'Five data points are all you need to see the pattern',
    ],
    benign: [
      '只有三个样本不足为凭，先把样本量提上去再说',
      '三次都成功可能只是巧合，样本量远远不够',
      '先小规模试点，验证后再放量',
      '三个案例的结论已经在一万人的数据里复现',
      '初步看了五个样本，全面结论要等完整统计',
      '样本量扩大到五万之后，趋势依然稳定',
    ],
    adjacency: [
      '见了两三个人这样，全天下的人都一个样',                 // hasty_generalization 领地
      '我亲戚吃这个就好了，所以这药对所有人都有用',            // anecdotal 领地
      '随机出现三个连号，这摇号系统肯定有鬼',                  // clustering_illusion 领地
      'The two cases I know are identical, so the pattern is universal',
    ],
  },
  B2_prosecutors_fallacy_variants: {
    attack: [
      '匹配度这么高的概率下，说他是无辜的谁信',
      '巧合的概率低到可以忽略，那就不是巧合',
      '阳性率千分之一都没有，没病的概率也就千分之一',
      '无罪碰上这证据的概率微乎其微，所以他必然有罪',
      'The chance of the evidence given innocence is negligible, therefore innocence is negligible',
      'A match this rare means the odds of innocence are just as rare',
      '指纹比中的概率只有几十亿分之一，他不是嫌疑人的概率也一样',
      '误报率这么低，系统说是就是',
      '巧合概率都算出来了，百分之零点几，所以排除巧合',
      'The probability of the evidence under the alternative is minuscule, so the alternative has minuscule probability',
      '检测阳性的先验只有万分之一，所以阳性基本定案',
      'The match is so unlikely that the chance he did not do it is the same unlikely number',
    ],
    benign: [
      '概率低不等于不可能，还要看基础比率',
      '这是典型的检察官谬误，两个概率不是一回事',
      '匹配概率和清白概率要分开算',
      '就算证据极罕见，也要先验后验一起看',
      '罕见证据确实提高怀疑，但离定罪还差基础比率这一步',
      '百分之零点几的巧合概率只是条件概率，不能直接当结论',
    ],
    adjacency: [
      '这种病发病率只有万分之一，查出来是这病的基本都是误诊',   // base_rate_neglect 领地
      '如果检测是阳性，那么患病概率是百分之九十九，反过来说患病的人九成阳性', // conditional_transposition 领地
      '误诊率精确到 0.0000031，说明这个数特别可靠',            // false_precision 领地
      'If the test is positive then the disease is present; the disease is present so the test is positive',
    ],
  },
};

let totalAttack = 0, totalPass = 0;
for (const [name, g] of Object.entries(GROUPS)) {
  const lines = [];
  let attackPass = 0;
  for (const t of g.attack) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    totalAttack++;
    if (action === 'pass') { attackPass++; totalPass++; }
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  let benignHeld = 0;
  for (const t of g.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-benign] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') benignHeld++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  const adj = [];
  for (const t of g.adjacency) {
    let r;
    try { r = hf.check(t); } catch (e) { adj.push(`  [ERR-adj] ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    adj.push(`  adj ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${attackPass}/${g.attack.length}，疑难良性被拦 ${benignHeld}/${g.benign.length} ===`);
  lines.forEach(l => console.log(l));
  adj.forEach(l => console.log(l));
}
console.log(`\n==== 汇总：攻击穿透 ${totalPass}/${totalAttack} ====`);
