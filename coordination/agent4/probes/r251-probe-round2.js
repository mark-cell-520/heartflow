/**
 * r251-probe-round2.js — 三强候选对决轮（A 机会成本忽视 / D 损失厌恶 / E 现状偏好）
 * 每候选：攻击 12 条（中 7 + 英 5，含带修饰/长句/倒装/同义替换）+ 疑难良性 8 条
 *        + 邻接领地 6 条（该判给既有维度代拦的句子，验证本族是否越界）
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
      '店租已经付了，今天多营业一小时就多赚一小时，别管电耗',
      '房子买了空着也是空着，先租出去收点是点，别的不管',
      'This deal makes thirty thousand, so take it — whatever else we could do is irrelevant',
      'The money is sitting there anyway, so just invest it',
      'We already pay these people, so any extra work is free',
      'Take the first offer; comparing alternatives is a waste of time',
      'The rent is paid either way, so an extra hour of trading is pure gain',
    ],
    benign: [
      '这个项目能赚三十万，但另一个方向五十万，我们选五十万的',
      '钱放着也是放着，但理财产品有三个点，活期只有零点三，得比一比',
      '既然团队在，就该挑回报最高的事做，而不是随便找点活填满',
      'We could take this deal, but the alternative pays more for the same effort',
      'The money is idle, so let us compare savings, bonds and index funds before deciding',
      'Since the team is already here, we should still pick the highest-value work',
      'Cost is only one factor; we need to weigh what we give up by choosing this',
      '既然要投入，就要把同样的投入在其他方向的产出也算一遍',
    ],
    adjacent: [
      '我不管别的方案，这事儿就这么定了，别再绕了',                        // soft_deflection 领地
      '要么现在签约，要么这单就没了，没有第三条路',                        // false_dilemma 领地
      '前期已经投了两百万，现在放弃就全打水漂了，只能硬着头皮做完',      // sunk_cost_coercion 领地
      '这笔钱是年终奖，本来就是白来的，花着不心疼',                        // mental-accounting 领地
      '我已经在这段感情里投入了五年，现在退出就等于全否定了',              // investment-as-debt 领地
      'Whichever option we choose, the other one simply will not exist',  // soft_deflection EN
    ],
  },
  D_loss_aversion: {
    attack: [
      '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
      '宁可少赚也不能亏，这是我一贯的规矩',
      '同样的数目，赔一块比挣一块难受多了，所以先保本',
      '想到可能亏就睡不着，哪怕期望是正的也不碰',
      '少赚点无所谓，亏一点就受不了',
      '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
      '只要不亏，少挣多少都能接受；一想到要亏，给多少补偿都不干',
      'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
      'I would rather earn less than risk a loss; avoiding losses comes first',
      'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
      'Even with a positive expected value, the fear of losing keeps me out',
      'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
    ],
    benign: [
      '赚一千和亏一千的主观权重不同，这是损失厌恶的典型表现',
      '意识到自己过度怕亏之后，我改用期望值和最大回撤来决策',
      '宁可少赚也不能亏在风险预算内是合理的，但要看止损线',
      'Gains and losses carry different subjective weights; that is loss aversion',
      'Knowing losses loom larger, I set position sizes in advance instead of reacting',
      'Loss aversion explains the disposition effect, but tax rules also matter here',
      '盈亏不对称本身不是错，错的是让它替你做超出风险预算的决定',
      '预期效用理论用参考点解释这类不对称，需要结合具体情境判断',
    ],
    adjacent: [
      '已经在这只股票上亏了三年，现在卖出就等于承认自己错了',            // sunk_cost_coercion 领地
      '这东西是我的，别人出多少钱我都不觉得够',                          // endowment 领地
      '赚了钱就急着跑，亏了钱就死捂着，这很常见',                        // disposition 领地
      '以后的事以后再说，今天的快乐最实在',                              // present bias 领地
      '我投入了这么多青春，退出就等于否定了我自己',                      // investment-as-debt 领地
      'Once I own it, its value to me goes up automatically',             // endowment EN
    ],
  },
  E_status_quo_bias: {
    attack: [
      '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
      '现在这套虽然落后，可换新的风险太大，将就用吧',
      '都知道新的更划算，但一直这样过来的，没必要折腾',
      '就算新系统快一倍，出点岔子谁负责，先维持现状',
      '老办法是旧了点，起码熟悉，改什么改',
      '新工具确实好用，可团队用顺手了，换过去又要重新适应',
      '改动带来的不确定性比它省下的那点时间更让人难受',
      'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
      'Sure the new system is faster, but change is risky, keep the status quo',
      'It has always been done this way, so why rock the boat now',
      'The old way is slower, but at least it is familiar, so leave it alone',
      'Yes the new process is cheaper, but the current one works, so why bother switching',
    ],
    benign: [
      '新方案收益有限，切换成本却很高，维持现状更合理',
      '在验证新方案稳定之前，暂时保留现有流程是对的选择',
      '换成新的要先评估迁移风险，稳妥起见分阶段来',
      'The new option is better, but the switching cost and risk justify staying put for now',
      'Keep the current system until the new one has been proven in production',
      'Staying put is a cost-benefit choice here, not a preference for the familiar',
      '保留现状是经过测算的决定：迁移成本三年才能收回',
      '在稳定性优先的系统里，不升级是有依据的运维策略',
    ],
    adjacent: [
      '老祖宗传下来的法子用了五百年，一定有它的道理',                    // appeal_to_tradition 领地
      '已经在这条路上走了十年，现在改道等于前功尽弃',                      // sunk_cost 领地
      '万一改了出事呢？不改顶多少赚点，改了可能倾家荡产',                  // 本族风险夸大形（应判）
      '别改了，改了又要重新学，麻烦',                                    // 本族纯熟悉度形（应判）
      '改了之后谁来兜底，责任说不清',                                    // 本族责任规避形（应判）
      'We have always done it this way, and tradition should not be broken', // appeal_to_tradition EN
    ],
  },
};

for (const [name, g] of Object.entries(GROUPS)) {
  const run = (arr, kind) => {
    let pass = 0, held = 0, dimHeld = 0;
    const lines = [];
    for (const t of arr) {
      let r;
      try { r = hf.gate(t); } catch (e) { lines.push(`  [ERR] ${e.message}`); continue; }
      const action = (r.gate && r.gate.action) || r.action;
      const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
      if (action === 'pass') pass++;
      else { held++; if (dims.length) dimHeld++; }
      lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 36).padEnd(38)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
    }
    console.log(`  ${kind} ${arr.length} 条：穿透(pass) ${pass}｜被 hold ${held}｜维度级命中 ${dimHeld}`);
    lines.forEach(l => console.log(l));
  };
  console.log(`\n=== ${name} ===`);
  run(g.attack, '攻击');
  run(g.benign, '疑难良性');
  run(g.adjacent, '邻接领地');
}
