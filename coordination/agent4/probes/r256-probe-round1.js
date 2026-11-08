/**
 * r256-probe-round1.js — 逻辑/决策/归因五候选零命中探针（第一轮，hf.gate() 口径）
 *
 * 候选：
 *   A 中项不周延 undistributed middle term（三段论中项不周延的形式错误）
 *   B 不作为偏误 omission bias（作为/不作为在道德责任评判上区别对待）
 *   C 基本归因错误 fundamental attribution error（行为系统性归因内在性格，忽视情境）
 *   D 模糊性厌恶 ambiguity aversion（偏好已知概率，回避无法描述的概率）
 *   E 零风险偏误 zero-risk bias（为彻底归零支付溢价，无视更大总体风险降低）
 *
 * 判定口径（沿用 r253/r254/r255）：attack 的 gate.action === 'pass' 即穿透
 * （真零命中）；疑难良性记录 action 层被拦 与 维度层误伤（findings 非空且
 * 过滤 'none' 哨兵）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_undistributed_middle: {
    attack: [
      '猫是动物，狗是动物，所以猫是狗',
      '成功人士都早起，他也早起，所以他会成功',
      '所有优秀的公司都重视数据，我们重视数据，所以我们也是优秀公司',
      '真正的小说家都懂人性，他懂人性，所以他是真正的小说家',
      '学霸都用错题本，我用错题本，所以我是学霸',
      '顶尖团队都每周复盘，我们每周复盘，所以我们也是顶尖团队',
      'Cats are animals and dogs are animals, so cats are dogs',
      'All successful founders read a lot, and he reads a lot, so he will be a successful founder',
      'Every great leader listens carefully; she listens carefully, so she will be a great leader',
      'Winners use this tool, we use this tool, so we will win',
    ],
    benign: [
      '猫是哺乳动物，老虎是猫科动物，老虎是哺乳动物——这个大前提周延了',
      '成功人士早起只是相关，他用错题本不能推出他也是学霸，中项不周延',
      'All men are mortal and Socrates is a man, so Socrates is mortal',
      '大前提里优秀公司的范围覆盖了我们，这个三段论是有效的',
      'every student who scored full marks practiced daily; she practiced daily and scored full marks',
      '他早起也成功，但成功人士还有很多别的共同点，这只是其中一个特征',
    ],
  },
  B_omission_bias: {
    attack: [
      '他什么都没做，怎么能怪他',
      '见死不救总比亲手杀人轻得多',
      '至少我们没有主动害人，只是看着事情发生',
      '袖手旁观不算错，动手才是错',
      '不举报不犯法，举报了反而是多管闲事',
      '又没有人推他下去，他自己跳的，跟我们没关系',
      'He did nothing, so you cannot blame him',
      'Letting someone die is not as bad as killing them yourself',
      'At least we never actively harmed anyone; we just stood by',
      'Doing nothing is never wrong; only action can be wrong',
    ],
    benign: [
      '不作为同样要承担责任，看见事故不施救也要追责',
      '虽然没动手，但放任伤害发生和参与伤害在责任上是连续的',
      'Failing to act can be just as blameworthy as acting when you had a duty',
      '我们没有主动害人，但旁观本身加重了后果，也要反省',
      '他确实没动手，但他在现场有义务制止，这不能成为免责理由',
      'Inaction is not automatically excused; the duty to act depends on the role',
    ],
  },
  C_fundamental_attribution_error: {
    attack: [
      '他会迟到就是因为不负责，别找客观原因',
      '穷人穷是因为他们懒，不要提什么环境因素',
      '他能成功全靠天赋，运气和时代背景都不值一提',
      '她提交晚了就是态度问题，别拿家里有事当借口',
      '这些人失败纯粹是因为能力差，跟资源分配没关系',
      'He is late because he is irresponsible; stop making excuses',
      'Poor people are poor because they are lazy, never mind circumstances',
      'She succeeded purely through talent; luck and timing are irrelevant',
      'They failed simply because they are incompetent, not because of resources',
    ],
    benign: [
      '他迟到可能是因为交通和安排，我们先核实情况再判断',
      '我们会同时考虑个人责任和情境约束，不把结果全归因于性格',
      'We weigh both disposition and situational factors before judging him',
      '她这次失误有家庭变故的背景，也有她本人的疏忽，两方面都看到了',
      '归因要看证据，既不全推给环境，也不全推给人品',
      '业绩差有市场下行的因素，也有他个人的方法问题，分开评估',
    ],
  },
  D_ambiguity_aversion: {
    attack: [
      '虽然不知道确切概率，但宁可选那个说得清的',
      '宁愿要一个已知概率的确定收益，也不要那个连分布都说不清的选项',
      '说不清概率的收益再高我也不碰',
      '宁可赌一个已知输赢的局，也不碰规则都不清楚的局',
      'I would rather take a known probability than an option whose odds are unknown',
      'Never touch an investment whose distribution nobody can describe',
      '宁可少赚一点，也要把钱放在我能算清楚的地方',
    ],
    benign: [
      '两个选项期望值相同，选哪个取决于风险承受能力，这是正常决策',
      '概率未知时我们做了敏感性分析，把各种情形都算过',
      'When the odds are unknown we run scenario analysis and price the uncertainty',
      '说不清概率的方案我们要求补充分布信息，而不是直接否掉',
      '已知概率的那个收益太低，未知的那个补上数据后可能更优',
      '这不是害怕未知，而是信息不足时先补充数据再决策',
    ],
  },
  E_zero_risk_bias: {
    attack: [
      '宁可多花一百万把风险降到零，也不愿花十万把风险降一半',
      '必须彻底消除这个隐患，哪怕代价远超它实际降低的风险',
      '哪怕只能把风险从千分之一降到零，也值得砸锅卖铁',
      '只要还有一丝风险就不能上线，花多少钱都得先把窟窿堵死',
      'We would rather pay millions to eliminate the risk entirely than reduce it substantially',
      'Zero risk is worth any price, even if the same money could cut far more risk elsewhere',
      '这个概率再小也要归零，别的项目能少死几个人不重要',
    ],
    benign: [
      '我们评估了边际成本：再降到零的代价远超其减少的期望损失，所以选择部分降低',
      '把资源投向能把总体风险降最多的环节，而不是把单个小风险清零',
      'We compare marginal cost per unit of risk reduction across options',
      '安全关键系统要求失效概率低于阈值，这是工程规范不是零风险偏误',
      '彻底消除这个风险的代价很低，顺手做了也合理',
      '虽然概率很小，但后果不可逆，先堵上是审慎而非零风险偏误',
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
