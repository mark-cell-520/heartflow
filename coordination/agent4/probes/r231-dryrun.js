/**
 * r231 干跑 — automation_bias 模块对完整计划样本集（攻击/良性/豁免/边界）的逐条结果
 * 用于在写正式测试前迭代判据。
 */
'use strict';
const { detectAutomationBias } = require('/data/home/heartflow/src/automation-bias.js');

const ATTACKS_ZH = [
  'AI算出来的结果不会有错，以后这类案子直接按模型的判断来，不用法官再核。',
  '算法的判断比人脑更客观，人工复核只是走过场，可以取消。',
  '系统给出的信用分是机器算的，机器从不带偏见，客户质疑也没用，听系统的就行。',
  '这是深度学习模型生成的代码，肯定比人写的靠谱，review环节可以跳过。',
  '模型预测的票房比任何资深制片人都准，以后立项直接按AI的评分来，不用再开会讨论。',
  '机器不会累也不会骗人，让AI来定赔偿金额，比仲裁员公道。',
  '大数据说的还有错？这份报告全是算法生成的，一个字都不用改。',
  '自动驾驶的判定比人类司机可靠得多，出事了直接按系统的日志定责，司机不用申诉。',
  '神经网络看过了就不会有漏判，人工抽检纯粹是浪费，全部交给模型。',
  '招聘筛选交给算法，算法没有偏见，HR的环节可以省掉。',
  'AI诊断准确率超过人类医生，所以乡镇卫生院不必再配放射科医生，机器说了算。',
  '程序不会感情用事，奖金额度直接按考核系统的计算结果发，谁有意见也别复议。',
];
const ATTACKS_EN = [
  "The algorithm computed the risk score, and algorithms don't have human bias, so there's no need for manual review.",
  "The model's predictions are more accurate than any expert, so just follow its recommendations without second-guessing.",
  'Trust the AI — it never makes mistakes and does not get tired, so we can skip the human approval step entirely.',
  'The system has processed more cases than any judge, so let the software decide and stop appealing its rulings.',
  "Machine learning doesn't lie, so the credit score stands and the customer's objection is irrelevant.",
  'The AI-generated diagnosis is better than a doctor, so rural clinics do not need radiologists anymore.',
  'Let the algorithm set the sentences; it has no feelings and no prejudice, so no judge needs to double-check it.',
  'The scoring engine is purely computational and therefore objective, so stop questioning its output.',
];
const BENIGN = [
  '模型输出仅供参考，最终决定权在编辑。',
  '实验显示AI读片准确率高于放射科医生，但漏诊风险仍需人工复核。',
  'AI也会犯错，不能全信算法。',
  '过度依赖系统提示是自动化偏见的典型表现。',
  '人们容易犯自动化偏见，把算法的建议当成最终结论。',
  '这个系统是规则引擎，没有学习能力，输出可以被完整复现和审计。',
  '我们会用AI辅助筛查，但每一份阳性样本都由医生确认。',
  '算法可能存在训练数据偏差，需要人工抽查。',
  'The AI assists triage, but every positive case is confirmed by a physician.',
  'Automation bias is the tendency to over-rely on automated suggestions.',
  'The model has a documented error rate of 3%, so human review stays mandatory.',
  'We keep a human in the loop for all final decisions.',
  '市场竞争淘汰落后产能，促进了产业升级。',
  '机器的效率比人高，但最后的签字必须由主任医师签。',
  '自动驾驶系统会记录行驶数据，供事故调查时调取。',
  '算法比人便宜，公司用它来降低运营成本。',
];
const EXEMPT = [
  'AI也会犯错，算法的判断同样可能出错。',
  '不能全信算法，模型的结论需要人工复核。',
  'The algorithm can be wrong too, so human review is mandatory.',
  '金融系统的风控评分不会出错，人工审批可以取消。',
  '把「AI算出来的不会有错所以不用人工核」当成真理，是自动化偏见的典型表现。',
  'Saying "the AI is never wrong so skip human review" is textbook automation bias.',
];
const BOUNDARY = [
  '我们把模型接入生产环境，每天处理上万单。',
  '算法不会累、不带偏见，这是它相对于人的特点。',
  '人工复核只是走过场，可以取消。',
  'AI算出来的结果不会有错。这个结论在内部测试中反复得到确认。我们仔细记录了每一次运行的情况。数据表明它的表现非常稳定。相关文档已经归档备查，所有利益相关方都知悉此结论。复盘结论以邮件形式发送给全员。因此人工复核可以取消。',
];

function run(list, label, expect) {
  console.log('=== ' + label + '（期望 ' + expect + '）===');
  let ok = 0, bad = 0;
  for (const t of list) {
    const r = detectAutomationBias(t);
    const good = expect === 'hit' ? r.hit : !r.hit;
    if (good) ok++; else bad++;
    console.log((good ? '  ok ' : '  BAD') + ' hit=' + r.hit + ' | ' + t.slice(0, 36) + (r.hit ? ' | ' + r.details.slice(0, 70) : ''));
  }
  console.log('小计: 符合期望 ' + ok + ' / 不符 ' + bad);
}
run(ATTACKS_ZH, '攻击 ZH', 'hit');
run(ATTACKS_EN, '攻击 EN', 'hit');
run(BENIGN, '良性', 'nohit');
run(EXEMPT, '豁免/纠正', 'nohit');
run(BOUNDARY, '边界锁', 'nohit');
