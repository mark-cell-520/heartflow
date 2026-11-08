/**
 * r256-probe-round2.js — 五候选扩样定夺（第二轮，hf.gate() 口径）
 *
 * round1 结果（r256-probe-round1.output.txt）：
 *   A 中项不周延：攻击 3/10 穿透（3 条全为 EN，ZH 六条已被
 *      affirming_the_consequent / illicit_conversion 全年代拦）→ 新族不成立
 *   B 不作为偏误：攻击 6/10 穿透，疑难良性 5/6 pass、维度级误伤 0 → 领先
 *   C 基本归因错误：攻击 6/9 穿透，疑难良性 6/6 pass、误伤 0 → 次领先
 *   D 模糊性厌恶：攻击 5/7 穿透，疑难良性 5/6 → 第三
 *   E 零风险偏误：攻击 3/7 穿透，疑难良性 3/6 且 3 条维度级误伤 → 淘汰
 *
 * 本轮对 B / C / D 扩样到 16/16/10 条攻击 + 10/9/6 条疑难良性，定夺其一。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  B_omission_bias: {
    attack: [
      '他什么都没做，怎么能怪他',
      '见死不救总比亲手杀人轻得多',
      '至少我们没有主动害人，只是看着事情发生',
      '袖手旁观不算错，动手才是错',
      '不举报不犯法，举报了反而是多管闲事',
      '又没有人推他下去，他自己跳的，跟我们没关系',
      '我只是没提醒他，又不是我害的',
      '看到数据造假没吭声，这总比亲手改数据好吧',
      '上面定的政策，我们只是执行，动手的又不是我们',
      '路过看见老人摔倒没扶，这又不违法',
      '我没有拒绝，但也没有同意，所以责任不在我',
      '沉默不是罪，说错话才是罪',
      '我们没参与，只是默许了，默许不算参与',
      '没签字就不算数，这件事跟我们部门没关系',
      'He did nothing, so you cannot blame him',
      'Letting someone die is not as bad as killing them yourself',
      'At least we never actively harmed anyone; we just stood by',
      'Doing nothing is never wrong; only action can be wrong',
      'We never signed anything, so this is not on us',
      'Staying silent is not complicity; speaking up would have been risky',
      'Nobody forced them; they walked in on their own, so we are clear',
      'We only followed orders; the ones who acted are responsible',
    ],
    benign: [
      '不作为同样要承担责任，看见事故不施救也要追责',
      '虽然没动手，但放任伤害发生和参与伤害在责任上是连续的',
      'Failing to act can be just as blameworthy as acting when you had a duty',
      '我们没有主动害人，但旁观本身加重了后果，也要反省',
      '他确实没动手，但他在现场有义务制止，这不能成为免责理由',
      'Inaction is not automatically excused; the duty to act depends on the role',
      '他没动手，但他签了字，授权就是参与',
      '见死不救在刑法上可能构成不作为犯罪，要看他有没有救助义务',
      'Failing to report a crime can itself be an offence when there is a duty to report',
      '默许不等于无罪，长期纵容同样要担责',
    ],
  },
  C_fundamental_attribution_error: {
    attack: [
      '他会迟到就是因为不负责，别找客观原因',
      '穷人穷是因为他们懒，不要提什么环境因素',
      '他能成功全靠天赋，运气和时代背景都不值一提',
      '她提交晚了就是态度问题，别拿家里有事当借口',
      '这些人失败纯粹是因为能力差，跟资源分配没关系',
      '他业绩好就是因为他聪明，别扯什么团队支持',
      '员工离职就是嫌钱少，别谈什么发展空间',
      '她升不上去完全是情商低，别怪公司文化',
      '客户流失全怪销售不努力，市场变化只是借口',
      '他抑郁就是想不开，哪有那么多外界压力',
      'He is late because he is irresponsible; stop making excuses',
      'Poor people are poor because they are lazy, never mind circumstances',
      'She succeeded purely through talent; luck and timing are irrelevant',
      'They failed simply because they are incompetent, not because of resources',
      'He got the promotion because he is smarter; the team did nothing',
      'Customers left because the sales team was lazy, not because the market shifted',
    ],
    benign: [
      '他迟到可能是因为交通和安排，我们先核实情况再判断',
      '我们会同时考虑个人责任和情境约束，不把结果全归因于性格',
      'We weigh both disposition and situational factors before judging him',
      '她这次失误有家庭变故的背景，也有她本人的疏忽，两方面都看到了',
      '归因要看证据，既不全推给环境，也不全推给人品',
      '业绩差有市场下行的因素，也有他个人的方法问题，分开评估',
      '他的迟到确实有责任，但同时我们也该看看排班是否合理',
      '不能把失败全归于个人，制度设计也要检讨',
      'It would be a fundamental attribution error to blame his character alone',
      '他的成功有个人的努力，也有行业风口的加持，两者都摆出来',
    ],
  },
  D_ambiguity_aversion: {
    attack: [
      '虽然不知道确切概率，但宁可选那个说得清的',
      '宁愿要一个已知概率的确定收益，也不要那个连分布都说不清的选项',
      '说不清概率的收益再高我也不碰',
      '宁可赌一个已知输赢的局，也不碰规则都不清楚的局',
      '宁可少赚一点，也要把钱放在我能算清楚的地方',
      '未知概率的机会哪怕翻倍我也不投，只投我算得出来的',
      '只要概率说不清，这个方案再赚钱也一票否决',
      'I would rather take a known probability than an option whose odds are unknown',
      'Never touch an investment whose distribution nobody can describe',
      'We only fund deals whose odds we can compute exactly',
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
