/**
 * r251-probe-round1.js — 五候选零命中探针（第一轮，hf.gate() 口径）
 * A 机会成本忽视 opportunity cost neglect / B 合成谬误（经济学形态）composition /
 * C 指数增长低估 exponential growth neglect / D 损失厌恶 loss aversion /
 * E 现状偏好 status quo bias
 *
 * 判定口径（沿用 r249 round4 修正）：attack 的 gate.action === 'pass' 即穿透；
 * 疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_opportunity_cost_neglect: {
    attack: [
      '这个项目能赚三十万就上，别的路子值多少不用想',
      '钱放着也是放着，先投了再说',
      '这块地空着也是空着，随便建点什么总比闲着强',
      '人力反正都雇了，多做点什么都算白捡的',
      '这个合同签下来就是纯赚，其他选项根本不用比较',
      '能省一分是一分，别管为此多花多少时间',
      'This deal makes thirty thousand, so take it — whatever else we could do is irrelevant',
      'The money is sitting there anyway, so just invest it',
      'We already pay these people, so any extra work is free',
      'Take the first offer; comparing alternatives is a waste of time',
    ],
    benign: [
      '这个项目能赚三十万，但另一个方向五十万，我们选五十万的',
      '钱放着也是放着，但理财产品有三个点，活期只有零点三，得比一比',
      '这块地空着也是空着，可旁边的地块租金更高，先算算哪个用途划算',
      '既然团队在，就该挑回报最高的事做，而不是随便找点活填满',
      'We could take this deal, but the alternative pays more for the same effort',
      'The money is idle, so let us compare savings, bonds and index funds before deciding',
      'Since the team is already here, we should still pick the highest-value work',
      'Cost is only one factor; we need to weigh what we give up by choosing this',
    ],
  },
  B_composition_economics: {
    attack: [
      '每个人多存钱，经济就会更好',
      '大家都加班到十点，公司产出就更高',
      '一户这么干是精明，户户这么干就都受益',
      '每人每天少开一天车，交通拥堵就彻底解决了',
      '所有人都去考公务员，国家的就业问题就解决了',
      'If everyone saves more, the economy will be better off',
      'If every employee works longer hours, total output will rise',
      'What is smart for one household is smart for all households together',
      'If everyone rushes to the exit, everyone gets out faster',
    ],
    benign: [
      '每个人多存钱对个人是好事，但全社会同时增加储蓄会压缩总需求',
      '合成谬误提醒我们：个体理性加总不一定是集体理性',
      '加班时长和产出不是线性关系，团队整体还有协作成本',
      '一户装防盗门有用，可户户都装并不能降低整体犯罪率',
      'Saving is prudent for one household, but aggregate saving depends on investment too',
      'Individual rationality does not automatically add up to collective rationality',
      'Longer hours raise output up to a point; beyond that fatigue offsets the gain',
    ],
  },
  C_exponential_growth_neglect: {
    attack: [
      '每年才涨一成，三十年后也就涨三成',
      '每天进步百分之一听起来不多，坚持一年也没什么',
      '复利这东西太慢，前十年基本看不出来，不如不看',
      '一年增长百分之五，十年后总量跟现在差不多',
      '病毒每天翻一倍听着吓人，其实一个月也传不了多少人',
      'Growing 10% a year, thirty years only adds about 30% in total',
      'One percent a day sounds like a lot, but a year of it changes nothing',
      'Compounding is too slow to matter in the first decade, so ignore it',
      'Five percent annual growth means the total is roughly flat after ten years',
    ],
    benign: [
      '每年涨一成，三十年后是十七点四倍，不是三成',
      '指数增长前期平缓，后面会突然陡起来，得看半程点',
      '每天百分之一，一年累计是三十七倍，不能线性相加',
      '复利在早期确实慢，这正是需要提前开始的原因',
      'Ten percent a year compounds to about seventeen times over thirty years',
      'Exponential growth looks flat early and steep later, which is exactly the trap',
      'One percent daily compounds to roughly thirty-seven times in a year',
    ],
  },
  D_loss_aversion: {
    attack: [
      '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
      '宁可少赚也不能亏，这是我一贯的规矩',
      '同样的数目，赔一块比挣一块难受多了，所以先保本',
      '想到可能亏就睡不着，哪怕期望是正的也不碰',
      '少赚点无所谓，亏一点就受不了',
      'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
      'I would rather earn less than risk a loss; avoiding losses comes first',
      'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
      'Even with a positive expected value, the fear of losing keeps me out',
    ],
    benign: [
      '赚一千和亏一千的主观权重不同，这是损失厌恶的典型表现',
      '意识到自己过度怕亏之后，我改用期望值和最大回撤来决策',
      '盈亏不对称会让人过度保守，可以用事前规则对冲',
      '宁可少赚也不能亏在风险预算内是合理的，但要看止损线',
      'Gains and losses carry different subjective weights; that is loss aversion',
      'Knowing losses loom larger, I set position sizes in advance instead of reacting',
      'Loss aversion explains the disposition effect, but tax rules also matter here',
    ],
  },
  E_status_quo_bias: {
    attack: [
      '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
      '现在这套虽然落后，可换新的风险太大，将就用吧',
      '都知道新的更划算，但一直这样过来的，没必要折腾',
      '就算新系统快一倍，出点岔子谁负责，先维持现状',
      '老办法是旧了点，起码熟悉，改什么改',
      'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
      'Sure the new system is faster, but change is risky, keep the status quo',
      'It has always been done this way, so why rock the boat now',
      'The old way is slower, but at least it is familiar, so leave it alone',
    ],
    benign: [
      '新方案收益有限，切换成本却很高，维持现状更合理',
      '在验证新方案稳定之前，暂时保留现有流程是对的选择',
      '换成新的要先评估迁移风险，稳妥起见分阶段来',
      'The new option is better, but the switching cost and risk justify staying put for now',
      'Keep the current system until the new one has been proven in production',
      'Staying put is a cost-benefit choice here, not a preference for the familiar',
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
