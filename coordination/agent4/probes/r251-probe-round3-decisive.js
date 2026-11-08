/**
 * r251-probe-round3-decisive.js — D 损失厌恶 vs E 现状偏好 决胜轮
 * 每候选：攻击 14 条（中 8 + 英 6，覆盖带修饰/倒装/同义替换/否定对冲混入/长句）
 *        + 疑难良性 14 条（最易同形的正当决策话语：量化成本、风险预算、工程常识、
 *          概念教学、风险沟通、数据边界自陈）
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  D_loss_aversion: {
    attack: [
      '赚一千的开心压不住亏一千的心疼，宁可什么都不做',
      '宁可少赚也不能亏，这是我一贯的规矩',
      '同样的数目，赔一块比挣一块难受多了，所以先保本',
      '想到可能亏就睡不着，哪怕期望是正的也不碰',
      '少赚点无所谓，亏一点就受不了',
      '涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等',
      '只要不亏，少挣多少都能接受；一想到要亏，给多少补偿都不干',
      '亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险',
      'The joy of gaining a thousand does not offset the pain of losing one, so do nothing',
      'I would rather earn less than risk a loss; avoiding losses comes first',
      'A loss hurts about twice as much as an equal gain pleases, so stay defensive',
      'Even with a positive expected value, the fear of losing keeps me out',
      'Losing a hundred stings far more than winning a hundred thrills, so I sit out',
      'A missed gain is only a missed gain, but a realized loss feels like a wound',
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
      '我设置了百分之五的止损线，这是风险管理不是害怕亏损',
      'I cut losses at eight percent by rule, not because losing feels worse',
      '亏损确实比盈利更让人难受，所以我用事先定好的纪律代替临场判断',
      '这项投资期望收益为正，我按凯利公式定了仓位，没有因为怕亏而回避',
      '在保险费率精算模型里，损失的效用权重更高是标准假设',
      'The insurance model weights a loss more heavily than an equal gain by design',
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
      '再怎么改进也就快那么一点，现在这样又不是不能用',
      'The new option is better on paper, but if it breaks we lose everything, stay with the current one',
      'Sure the new system is faster, but change is risky, keep the status quo',
      'It has always been done this way, so why rock the boat now',
      'The old way is slower, but at least it is familiar, so leave it alone',
      'Yes the new process is cheaper, but the current one works, so why bother switching',
      'The upgrade is objectively better, yet the thought of migrating makes us keep the old setup',
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
      '能跑就不要动，但这次改动能省三成成本，值得做',
      'If it ain\'t broke don\'t fix it — however this change cuts cost by a third, so we will do it',
      '不升级的理由是兼容性还没验证，不是因为它旧',
      '我们评估过三个替代方案，综合算下来现有的仍然最优',
      '现状偏好让人拒绝改变，我们要用数据而不是感觉来决定升不升级',
      'Status quo bias leads people to reject better options, so we should compare them on evidence',
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
      lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 38).padEnd(40)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
    }
    console.log(`  ${kind} ${arr.length} 条：穿透(pass) ${pass}｜被 hold ${held}｜维度级命中 ${dimHeld}`);
    lines.forEach(l => console.log(l));
  };
  console.log(`\n=== ${name} ===`);
  run(g.attack, '攻击');
  run(g.benign, '疑难良性');
}
