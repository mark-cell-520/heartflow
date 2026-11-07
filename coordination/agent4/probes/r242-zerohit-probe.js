// r242 dimension 轮前置零命中探针（agent-4，海外产能单元）
// 目的：验证五个候选攻击族在当前引擎（v6.8.145）下是否零命中。
// 判定口径：gate.action === 'pass' 即该样本整族穿过引擎（候选新维度证据）。
// 注意：攻击句避开绝对词（一定/必然/肯定/显然/绝对），逼出结构层漏判。
// 运行：node coordination/agent4/probes/r242-zerohit-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// [族, id, 攻击样本] —— 攻击形＝推理者本人被框住/犯该族谬误
const attacks = [
  // A. 蒙蒂霍尔失更：新信息（主持人排除一个错误选项）进入后仍称概率不变。
  ['A 蒙蒂霍尔失更', 'A1-ZH', '主持人打开一扇空门之后，换与不换的中奖概率还是一样的，都是五五。'],
  ['A 蒙蒂霍尔失更', 'A2-ZH', '主持人排除了一个错误选项后，剩下两扇门背后有奖的概率并没有改变，还是各占一半。'],
  ['A 蒙蒂霍尔失更', 'A3-ZH', '既然主持人已经掀开一扇没有奖的门，这时候换不换都无所谓，概率相同。'],
  ['A 蒙蒂霍尔失更', 'A4-EN', 'After the host opens a door with nothing behind it, switching doors gives you the same odds as staying — it is still fifty-fifty.'],
  ['A 蒙蒂霍尔失更', 'A5-EN', 'The host eliminated one wrong option, but the probability of the remaining two doors did not change at all.'],
  ['A 蒙蒂霍尔失更', 'A6-EN', 'Once the host reveals a goat, your chances are exactly equal whether you switch or stick with your original pick.'],
  ['A 蒙蒂霍尔失更', 'A7-ZH', '排除掉一个明显错误的答案之后，剩下两个选项正确的可能性一样大，改不改都行。'],

  // B. 邓宁-克鲁格：自陈无训练却高度自信越级评判并贬低专业者。
  ['B 邓宁-克鲁格', 'B1-ZH', '我没学过金融，但我一眼就看出来这群分析师是在炒作，真正懂行的都没出声。'],
  ['B 邓宁-克鲁格', 'B2-ZH', '虽然我不是学医的，可这张片子我十分钟就看明白了，那些专家说得太夸张。'],
  ['B 邓宁-克鲁格', 'B3-ZH', '我一个外行人听了一遍就听出这篇论文是灌水，学院派那套也就是唬人。'],
  ['B 邓宁-克鲁格', 'B4-EN', 'I have never studied music, but I can tell after one listen that the critics are overpraising this album.'],
  ['B 邓宁-克鲁格', 'B5-EN', 'I am no expert, yet anyone with common sense can see the official report missed what was in front of the professionals.'],
  ['B 邓宁-克鲁格', 'B6-EN', 'Without any training in architecture I took one look at the blueprints and spotted the flaw their engineers overlooked.'],
  ['B 邓宁-克鲁格', 'B7-ZH', '书读多了反而看不透，这方案行不通，我干了半年比那些博士强得多。'],

  // C. 乐观偏差/个人风险豁免：无证据否认个人风险——"这种事只会发生在别人身上"。
  ['C 乐观偏差', 'C1-ZH', '我酒驾十几年从没出过事，那些肇事的是他们不小心，我的技术心里有数。'],
  ['C 乐观偏差', 'C2-ZH', '肺癌那是老了的事，我身体倍儿棒，这种事只会发生在别人身上。'],
  ['C 乐观偏差', 'C3-ZH', '我天天走这条线，路况熟得很，高速上打个盹不至于出事。'],
  ['C 乐观偏差', 'C4-EN', 'I have driven after drinking for years without a scratch; accidents happen to other people, not to me.'],
  ['C 乐观偏差', 'C5-EN', 'Smoking never hurt anyone in my family — my grandfather smoked and lived to ninety, so I am not worried.'],
  ['C 乐观偏差', 'C6-EN', 'I skip the safety check because I know these machines; injuries happen to careless operators, not to me.'],
  ['C 乐观偏差', 'C7-ZH', '洪水再大也淹不到我们村，祖祖辈辈都住在这儿，能出什么问题。'],

  // D. 锚定效应：第一个数字/标价不成比例地决定后续估计与判断。
  ['D 锚定效应', 'D1-ZH', '这套房标价五百万，房东降了二十万就催着我定，我觉得占了便宜。'],
  ['D 锚定效应', 'D2-ZH', '谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。'],
  ['D 锚定效应', 'D3-ZH', '原价九千九的东西现在卖一千二，怎么看都划算，反正比标价省了八千多。'],
  ['D 锚定效应', 'D4-EN', 'The sticker said ten thousand, so when the salesman offered seven I felt I was getting a great deal.'],
  ['D 锚定效应', 'D5-EN', 'They opened at ninety, I countered at seventy, and we settled without ever questioning whether it was worth fifty.'],
  ['D 锚定效应', 'D6-EN', 'The list price was three hundred, and the fifty percent discount made the purchase feel like a win regardless of quality.'],
  ['D 锚定效应', 'D7-ZH', '招聘时第一个候选人期望薪资说了两万，后面每个人我都拿这个数去比，怎么也跳不出这个范围。'],

  // E. 群体思维：共识压力下自我审查、放弃异议。
  ['E 群体思维', 'E1-ZH', '会上所有人都赞成，我虽然有疑虑也没举手，毕竟是集体决定。'],
  ['E 群体思维', 'E2-ZH', '看到大家一致同意，我那几个反对意见到了嘴边又咽回去了，不想扫兴。'],
  ['E 群体思维', 'E3-ZH', '既然领导和团队都没有异议，我一个人提不同看法只会破坏团结。'],
  ['E 群体思维', 'E4-EN', 'Everyone in the room nodded along, so I kept my doubts to myself rather than disagree with the consensus.'],
  ['E 群体思维', 'E5-EN', 'I had reservations about the plan, but with the whole committee on board I decided not to rock the boat.'],
  ['E 群体思维', 'E6-EN', 'Nobody raised an objection, and I did not want to be the only one blocking what the group clearly wanted.'],
  ['E 群体思维', 'E7-ZH', '讨论进行得特别顺利，全员通过，我也就不好再提风险了。'],
];

// 良性对照：同领域正确推理形（期望 pass；被误拦即为误伤证据）
const benigns = [
  ['A 蒙蒂霍尔失更', 'BA1-ZH', '主持人打开一扇空门后，换门的中奖率是三分之二，坚持原门只有三分之一。'],
  ['A 蒙蒂霍尔失更', 'BA2-ZH', '蒙蒂霍尔问题是条件概率的经典案例，新信息进入后样本空间随之改变。'],
  ['A 蒙蒂霍尔失更', 'BA3-EN', 'After the host reveals a goat, switching wins two times out of three — the new information redistributes the probability.'],
  ['A 蒙蒂霍尔失更', 'BA4-EN', 'The Monty Hall problem illustrates why new evidence must update conditional probabilities, not leave them unchanged.'],
  ['A 蒙蒂霍尔失更', 'BA5-ZH', '重新计算后两个选项的先验相同，但主持人知情地排除一个错误选项，这个动作本身携带信息。'],
  ['B 邓宁-克鲁格', 'BB1-ZH', '我虽然不是这个专业的，但我核对过原始数据，发现论文第三表的统计口径对不上。'],
  ['B 邓宁-克鲁格', 'BB2-ZH', '这篇论文的实验设计有缺陷，我复核了样本分组和对照设置，结论不成立。'],
  ['B 邓宁-克鲁格', 'BB3-EN', 'I am not a lawyer, but I read the contract clause by clause and the indemnity terms contradict the appendix.'],
  ['B 邓宁-克鲁格', 'BB4-EN', 'The audit found the discrepancy in the ledger, and the accounting team has acknowledged the error.'],
  ['B 邓宁-克鲁格', 'BB5-ZH', '邓宁-克鲁格效应描述了能力不足者难以认识自身不足的现象，是元认知研究的经典课题。'],
  ['C 乐观偏差', 'BC1-ZH', '我打了疫苗又做过抗体检测，感染后的重症风险确实低于未接种人群。'],
  ['C 乐观偏差', 'BC2-ZH', '根据体检指标和家族史，医生评估我的心血管风险低于同龄平均水平。'],
  ['C 乐观偏差', 'BC3-EN', 'With the seat belt, helmet, and training completed, my risk on this route is measurably lower than an untrained rider.'],
  ['C 乐观偏差', 'BC4-EN', 'The insurer quoted a lower premium after reviewing my driving record, so the risk assessment is evidence-based.'],
  ['C 乐观偏差', 'BC5-ZH', '乐观偏差让人低估自身遭遇负面事件的概率，风险评估中需要引入外部基准率来校正。'],
  ['D 锚定效应', 'BD1-ZH', '吊牌价只是参考，我按二手平台近三个月的成交行情重新评估了这台设备的价值。'],
  ['D 锚定效应', 'BD2-ZH', '报价虚高是常态，我以成本加合理利润为基准反推，报出的价格不随对方开价走。'],
  ['D 锚定效应', 'BD3-EN', 'We ignored the asking price and valued the company from its cash flows before deciding what to bid.'],
  ['D 锚定效应', 'BD4-EN', 'The discount was computed from the wholesale cost, and the final price still leaves a healthy margin.'],
  ['D 锚定效应', 'BD5-ZH', '锚定效应指初始数值对后续估计的影响，谈判中应当以独立估价为锚而非对方开价。'],
  ['E 群体思维', 'BE1-ZH', '与会者逐条审议了风险清单，无人异议是基于逐项核对后的结论，不是沉默。'],
  ['E 群体思维', 'BE2-ZH', '两位委员提出了保留意见并记录在案，多数表决后方案进入试行期。'],
  ['E 群体思维', 'BE3-EN', 'The board debated for three hours, two members recorded dissents, and the vote was taken after amendments.'],
  ['E 群体思维', 'BE4-EN', 'Consensus was reached only after each concern was addressed on the record and the minutes reflect the discussion.'],
  ['E 群体思维', 'BE5-ZH', '群体思维研究共识压力对决策质量的损害，鼓励异见表达是重要的纠偏机制。'],
];

function famSummary(rows, tag, wantPass) {
  const byFam = new Map();
  for (const [fam, id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (!byFam.has(fam)) byFam.set(fam, { pass: 0, other: 0, detail: [] });
    const rec = byFam.get(fam);
    if (action === 'pass') rec.pass++; else rec.other++;
    rec.detail.push(`    ${id} [${action}]${dims ? ' 承重:' + dims : ''}`);
  }
  console.log(`=== ${tag} ===`);
  for (const [fam, rec] of byFam) {
    const total = rec.pass + rec.other;
    console.log(`  ${fam}: pass=${rec.pass}/${total}${wantPass ? '  ← 误伤数' : '  ← 零命中(攻击穿过引擎)数'}`);
    for (const line of rec.detail) console.log(line);
  }
}

famSummary(attacks, '攻击族（pass=穿过引擎=零命中）', false);
famSummary(benigns, '良性对照（pass=正确放行）', true);

console.log('=== 汇总 ===');
const fams = [...new Set(attacks.map(a => a[0]))];
for (const fam of fams) {
  let pass = 0, total = 0;
  for (const [f, id, text] of attacks) {
    if (f !== fam) continue;
    total++;
    try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') pass++; } catch (e) {}
  }
  console.log(`  ${fam}: ${pass}/${total} 穿过引擎`);
}
let bpass = 0; const bflagged = [];
for (const [f, id, text] of benigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') bpass++; else bflagged.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`); } catch (e) {}
}
console.log(`  良性对照: ${bpass}/${benigns.length} 正确放行`);
if (bflagged.length) console.log('  被泛维度代拦的良性: ' + bflagged.join(' | '));
