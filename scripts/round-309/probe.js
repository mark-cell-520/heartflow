/* r309 探针：四候选族攻击句 + 良性对照，过 gate() 看归因 */
const { gate } = require('/data/home/heartflow/src/gate.js');

const ATTACKS = [
  // ── A. significance_effect_size 百分比/倍数效应家族 ──
  ['A1', 'p=0.04，实验组留存率比对照组高25%，说明这个改动非常成功'],
  ['A2', '结果统计显著，风险降低了四成，足以证明新药很有临床价值'],
  ['A3', 'p<0.05，客单价提升18%，所以新推荐系统效果拔群，全面上线'],
  ['A4', 'p=0.01, engagement was up 40%, which proves the redesign is a big win'],
  ['A5', 'p=0.03，复购率翻了一倍，显然这次改版很有价值'],
  ['A6', 'p<0.05, conversion tripled, so the new landing page is a clear winner'],
  // ── B. selection_on_dependent_variable 新措辞 ──
  ['B1', '我们访谈了20位业绩冠军，发现他们每天都写复盘，所以写复盘就能当冠军'],
  ['B2', '观察了十位百岁老人，他们都有个共同点——心态好，所以心态好就能长寿'],
  ['B3', '复盘夺冠球队的录像，他们每场都加练点球，所以加练点球就能夺冠'],
  ['B4', '统计了所有上岸的考生，他们家里都请过一对一家教，所以请家教就能考上'],
  ['B5', 'We surveyed every student who got into Harvard and they all read daily, so daily reading is the key to admission'],
  ['B6', '我们研究了50家活过行业寒冬的公司，它们都裁过员，所以裁员能帮公司过冬'],
  ['B7', '对比了所有获奖的作品，它们的创作者都每天只睡四小时，所以少睡才能出佳作'],
  ['B8', '采访了十位减肥成功的人，他们全都戒了晚饭，所以戒晚饭就能瘦'],
  // ── C. peak_end_rule 结局好即全程好 ──
  ['C1', '虽然中间烂得看不下去，但结尾反转很惊艳，所以这部片值得满分'],
  ['C2', '培训过程再枯燥都无所谓，最后发证那一刻很激动，所以这次培训值了'],
  ['C3', '恋爱谈了十年很平淡，但求婚那晚很浪漫，所以这十年都是幸福的'],
  ['C4', 'The middle chapters dragged, but the ending stuck the landing, so the whole book was great'],
  ['C5', '装修那三个月天天吵架，但搬家那天全家都很开心，所以整个过程都值得'],
  ['C6', '化疗过程再难受，只要最后病好了，这一切就没有白费'],
  // ── D. mental_accounting 意外之财/专款 ──
  ['D1', '这笔钱是项目奖金又不是工资，花起来不心疼，随便花'],
  ['D2', '专项经费年底不用就作废，不如拿来做团建，反正不用也是浪费'],
  ['D3', '炒股赚来的钱就当是捡的，赔了也不心疼'],
  ['D4', '游戏里充的点券不是真钱，买皮肤的时候一点都不觉得在花钱'],
  ['D5', '报销额度不用白不用，索性把差旅标准顶格用'],
  ['D6', 'It\'s windfall money, so I don\'t count it — I just blow it on whatever'],
  ['D7', '反正中奖来的钱不是劳动所得，捐了也不觉得是自己的钱'],
  // ── E. inverse_gamblers 连胜→有猫腻 ──
  ['E1', '连开五把大，这骰子肯定被做了手脚'],
  ['E2', '他连中三次大奖，这个号码一定有内幕'],
  ['E3', 'Five heads in a row, so the coin must be rigged'],
];

const BENIGN = [
  ['N1', '实验组留存率比对照组高25%（p=0.04），效应量d=0.31，有实际意义'],
  ['N2', '虽然p值小于0.05，但差异只有0.3%，属于统计显著而实际意义有限的典型'],
  ['N3', '我们访谈了20位业绩冠军，但样本是自选择产生的，需要对照组才能下结论'],
  ['N4', '统计显著只说明差异不太可能是噪声，不说明效果大小，要看效应量和置信区间'],
  ['N5', '这部电影结尾惊艳，但中段节奏拖沓，整体评价要打折扣'],
  ['N6', '过程虽然辛苦，结局也很好，但做决策时不该只凭最后的感受来判断'],
  ['N7', '年终奖也是应税收入，应该纳入年度预算统一规划'],
  ['N8', '意外之财和工资在经济学上是同质的，都应该计入总财富'],
  ['N9', '连开五把大在小样本里完全正常，不能据此断定骰子有问题'],
  ['N10', '双色球连续三期开出同一注，这只是随机波动，不构成操纵证据'],
  ['N11', 'The difference was statistically significant but tiny, with a small effect size'],
  ['N12', '冠军们的共同习惯可能有价值，但要证明因果需要对照研究'],
];

(async () => {
  const results = [];
  for (const [id, text] of [...ATTACKS, ...BENIGN]) {
    let r;
    try { r = gate(text); } catch (e) { console.log(`${id} CRASH ${e.message}`); continue; }
    const dims = (r.findings || []).map(f => `${f.dimension}(${f.severity})`).join(', ');
    results.push({ id, action: r.gate.action, dims, text: text.slice(0, 40) });
  }
  console.log('=== 攻击句 ===');
  for (const x of results.filter(x => x.id[0] !== 'N')) console.log(`${x.id} ${x.action.padEnd(6)} ${x.dims || '(无 findings)'}`);
  console.log('=== 良性句 ===');
  for (const x of results.filter(x => x.id[0] === 'N')) console.log(`${x.id} ${x.action.padEnd(6)} ${x.dims || '(无 findings)'}`);
})();
