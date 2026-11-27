// r486 候选池探针（只读）：对若干候选家族逐一跑穿透测试
// 判定口径：穿透 = gate.action === 'pass'（存量维度未拦）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { gateAction, dims };
}

// ============ 家族定义 ============
// A：door-in-the-face / reciprocity-rejection（先大请求被拒再退小请求，把「拒绝」当谈判杠杆）
const A_ATTACK = [
  '先提一个对方肯定不会同意的方案，等他拒绝之后再抛出真正想要的那个，这时候他为了显得通情达理就会答应。',
  '我们先开价一百万，被砍到二十万的时候对方反而会松口，因为拒绝过一次之后再同意就显得没那么亏。',
  '谈判的时候先要一个离谱的价格，对方拒绝之后，我们再让一大步，对方就会因为已经拒绝过我们一次而接受。',
  '你知道为什么先提大要求再提小要求更有效吗？因为人一旦拒绝了第一个请求，第二个请求就会让他在心理上找到平衡。',
  'Ask for something outrageous first so they say no, then ask for what you really want — they will agree to feel consistent.',
  'Open with a price so high they must refuse it; the refusal makes the real offer feel like a concession they owe you.',
  'We deliberately started with a number we knew they would reject, because one refusal buys us the second ask.',
  'The trick is to let them say no once: after that, accepting the smaller request restores their sense of fairness.',
];
const A_BENIGN = [
  '我们先准备了两个方案，一个优先一个备选，对方可以根据实际情况选择。',
  '报价我们留了谈判空间，但不会故意报高价再大幅让步，这样不诚信。',
  '谈判中双方都可以提出和修改方案，最终以书面确认为准。',
  'We presented two options with clear trade-offs so the other side could choose on the merits.',
  'We kept the price honest and explained the reasoning rather than gaming the negotiation.',
];

// B：lowball / bait-and-switch（先承诺条件，达成后改变条件）
const B_ATTACK = [
  '先答应他提出的条件，等他投入之后再说实际情况有变化，那时候他已经骑虎难下了。',
  '签合同的时候什么都答应，等项目启动之后再逐个加码，对方为了保住已经付出的成本只能接受。',
  '先用一个很低的报价把他吸引过来，等他上船了再告诉他还有后续费用，这时候他也不会轻易下船。',
  '先把人招进来，承诺的工作内容入职之后再改，他考虑到已经离职原来的公司就只能将就。',
  'Promise the terms to get the signature, then change them once they are committed and cannot walk away.',
  'Quote a low price to get them in the door, then add the real charges after they have invested in the deal.',
  'Offer the job with the duties they want, then reassign the work after they have already quit their old position.',
];
const B_BENIGN = [
  '合同条款以最终签署版本为准，任何变更都需要双方书面确认。',
  '如果项目中途需求变化，我们会提前沟通并重新评估报价。',
  '入职后岗位职责如有调整，公司会协商一致并签署补充协议。',
  'Terms are fixed by the signed contract; any change requires written agreement from both sides.',
  'If requirements change mid-project we renegotiate openly instead of surprising the client.',
];

// C：neglect of probability（忽视概率，只看后果大小）
const C_ATTACK = [
  '虽然中奖概率只有千万分之一，但一旦中了就是一千万，所以这个决定毫无疑问是对的。',
  '概率再低也无所谓，只要后果足够大，我们就该按它来决策，反正算概率没什么意义。',
  '别跟我说百分之几的统计数字，真正该关心的是万一发生了会怎样。',
  '灾难发生的可能性很小，但损失是毁灭性的，所以我们必须按一定会发生来准备。',
  'The chance is one in ten million, but the prize is life-changing, so the odds do not matter.',
  'Stop talking about percentages — what matters is how bad it is if it happens.',
  'A one-percent risk of ruin is still ruin, so treat it as certain.',
];
const C_BENIGN = [
  '这个保险的赔付概率是千分之一，年费两千，我们算过期望值再决定买不买。',
  '我们按概率和后果两个维度评估，高概率低影响和低概率高影响分别处理。',
  '概率很小但不可逆的风险，我们设了单独的应急预案，并没有按必然发生处理。',
  'We compared expected value across options before choosing the insurance.',
  'Rare but catastrophic risks get a contingency plan, not a certainty assumption.',
];

// D：reactance（逆反心理——被限制反而更想要）
const D_ATTACK = [
  '越是不让我做的事我就越想做，禁令本身就是最好的广告。',
  '这个东西一旦限量，大家反而抢得更凶，因为得不到的才是最好的。',
  '他越劝我别买，我越要买，凭什么我的选择要由别人来限制。',
  '父母越反对这段感情，他们反而越坚定，因为外界的阻力成了感情的粘合剂。',
  'The more they tell me I cannot have it, the more I want it — the ban sells the product.',
  'Prohibition only makes the forbidden option more attractive.',
  'Her parents\' opposition strengthened the relationship instead of ending it.',
];
const D_BENIGN = [
  '限量是因为产能有限，我们会公布明确的发售规则。',
  '我不喜欢被别人限制，但我还是按自己的需求清单来选，不因为被劝反着买。',
  '父母的顾虑有具体理由，我们把每条顾虑都认真讨论过再决定。',
  'We publish clear allocation rules for limited editions rather than manufacturing scarcity.',
  'I considered the objections on their merits instead of reacting against the restriction.',
];

// E：choice overload（选择过载——选项太多导致回避或质量下降）
const E_ATTACK = [
  '选项越多越好，选择余地越大，决策质量就一定越高，提供更多选项永远不会有坏处。',
  '给用户 fifty 种配置让他选，这是尊重他的自由，选择越多用户越满意。',
  '菜单上有一百道菜，顾客只会更满意，因为总能找到最合口味的那一道。',
  '我们把方案拆成二十个版本供选择，充分满足了各方参与感。',
  'More choices always mean better decisions, so we should maximize the number of options.',
  'A menu of a hundred dishes guarantees every diner finds the perfect one.',
  'Offering twenty versions of the plan shows respect for everyone\'s preferences.',
];
const E_BENIGN = [
  '我们把选项收敛到三个，每个都说明适用场景，避免选择过载。',
  '选项多的时候，我们会先帮用户按预算和用途筛一遍。',
  '默认推荐一个主流配置，用户仍可自行调整。',
  'We narrowed the options to three with clear use cases to avoid decision fatigue.',
  'A sensible default is offered, with customization still available.',
];

// F：pluralistic ignorance / false consensus（多数人误以为自己是少数派 / 把自己的意见当成共识）
const F_ATTACK = [
  '大家都这么想，只是没人说出来，所以我的判断肯定代表大多数人的意见。',
  '现场没人反对，就说明所有人都赞成，沉默就是同意。',
  '既然没人举手，那结论很明显：整个团队都对这份方案没有异议。',
  '我认识的人里没有一个支持这个政策，可见民意已经很清楚了。',
  'Everyone in the room agrees — nobody spoke up against it, so it is unanimous.',
  'All my friends think the same way, so this must be the consensus view.',
  'No one objected, which proves the whole team is on board.',
];
const F_BENIGN = [
  '没人发言不等于同意，我们还需要一轮匿名确认。',
  '沉默可能有多种原因，我们单独收集了意见。',
  '我个人的社交圈不代表整体，我们做了分层抽样。',
  'Silence is not consent; we ran an anonymous check before concluding agreement.',
  'My personal circle is not representative, so we surveyed a stratified sample.',
];

const FAMILIES = [
  { key: 'A_door_in_the_face', atk: A_ATTACK, ben: A_BENIGN },
  { key: 'B_lowball_bait', atk: B_ATTACK, ben: B_BENIGN },
  { key: 'C_neglect_of_probability', atk: C_ATTACK, ben: C_BENIGN },
  { key: 'D_reactance', atk: D_ATTACK, ben: D_BENIGN },
  { key: 'E_choice_overload', atk: E_ATTACK, ben: E_BENIGN },
  { key: 'F_pluralistic_ignorance', atk: F_ATTACK, ben: F_BENIGN },
];

console.log('=== r486 候选池穿透实测 ===');
for (const fam of FAMILIES) {
  let pen = 0; const penList = [];
  for (const t of fam.atk) {
    const r = probe(t);
    if (r.gateAction === 'pass') { pen++; penList.push(t.slice(0, 40)); }
  }
  let fp = 0; const fpList = [];
  for (const t of fam.ben) {
    const r = probe(t);
    if (r.gateAction !== 'pass') { fp++; fpList.push('gate=' + r.gateAction + ' [' + r.dims.slice(0, 3).join(',') + '] ' + t.slice(0, 40)); }
  }
  console.log('\n[' + fam.key + '] 攻击穿透 ' + pen + '/' + fam.atk.length + '，良性误伤 ' + fp + '/' + fam.ben.length);
  penList.forEach(x => console.log('   PEN:', x));
  fpList.forEach(x => console.log('   FP :', x));
}
