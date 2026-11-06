/**
 * test/automation-bias.test.js — r231 算法崇拜/自动化偏见维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、豁免族、边界锁、负例注入。
 * 与 r228/r229/r230 模块同一测试范式：每个负例注入删除一组常量后，
 * 攻击必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { detectAutomationBias } = require('../src/automation-bias.js');

// ─── 攻击样本（应命中）────────────────────────────────────────
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

// ─── 良性样本（不得命中）──────────────────────────────────────
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

// ─── 豁免族（认识论纠正/器官制度系统，不得命中）────────────────
const EXEMPT = [
  'AI也会犯错，算法的判断同样可能出错。',
  '不能全信算法，模型的结论需要人工复核。',
  'The algorithm can be wrong too, so human review is mandatory.',
  '金融系统的风控评分不会出错，人工审批可以取消。',
  '把「AI算出来的不会有错所以不用人工复核」当成真理，是自动化偏见的典型表现。',
  'Saying "the AI is never wrong so skip human review" is textbook automation bias.',
];

// ─── 边界锁（三腿缺一/超窗/器官系统，不得命中）────────────────
const BOUNDARY = [
  '我们把模型接入生产环境，每天处理上万单。',                    // 无腿②
  '算法不会累、不带偏见，这是它相对于人的特点。',                // 无腿③
  '人工复核只是走过场，可以取消。',                              // 无腿①
  'AI算出来的结果不会有错。这个结论在内部测试中反复得到确认。我们仔细记录了每一次运行的情况。数据表明它的表现非常稳定。相关文档已经归档备查，所有利益相关方都知悉此结论。复盘结论以邮件形式发送给全员。因此人工复核可以取消。', // 腿②③相距>80字
];

const MIXED = '算法的判断比人脑更客观，人工复核可以取消；the model is more accurate than any human, so skip the review.';
const MULTI_ZH = '算法的判断比人脑更客观，人工复核可以取消；系统给出的分数比任何专家都准，申诉无效。';

// ─── 负例注入用常量替换（单键注入，勿整体 spread）────────────────

test('模块导出与短输入安全', () => {
  assert.equal(typeof detectAutomationBias, 'function');
  assert.equal(detectAutomationBias('').hit, false);
  assert.equal(detectAutomationBias(null).hit, false);
  assert.equal(detectAutomationBias('短').hit, false);
});

test('攻击命中：中文 12 条', () => {
  for (const t of ATTACKS_ZH) {
    const r = detectAutomationBias(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.equal(r.dimension, 'automation_bias');
    assert.ok(r.score >= 0.6 && r.score <= 0.7, 'severity 档位: ' + t);
    assert.ok(r.details.length > 10, 'details 非空');
    assert.ok(r.evidence.length >= 1, 'evidence 非空');
    assert.ok(r.guidance.length > 20, 'guidance 非空');
  }
});

test('攻击命中：英文 8 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectAutomationBias(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.7);
  }
});

test('良性零误伤：16 条', () => {
  for (const t of BENIGN) assert.equal(detectAutomationBias(t).hit, false, '误伤: ' + t);
});

test('豁免族：认识论纠正与器官/制度系统', () => {
  for (const t of EXEMPT) assert.equal(detectAutomationBias(t).hit, false, '误伤: ' + t);
});

test('边界锁：三腿缺一/超窗不判', () => {
  for (const t of BOUNDARY) assert.equal(detectAutomationBias(t).hit, false, '误判: ' + t);
});

test('中英混排与多签名加分档', () => {
  const m = detectAutomationBias(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.7) < 1e-9, '双签名加分档');
  const z = detectAutomationBias(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.7) < 1e-9, '双签名加分档');
});

test('负例注入：六组腿族删除后攻击全部不再命中', () => {
  // 每组只注入单一空数组（不混入其他腿族删除），确保断言失败原因唯一
  assert.equal(detectAutomationBias(ATTACKS_ZH[1], { MACHINE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[0], { MACHINE_EN: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_ZH[5], { INFALLIBLE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[4], { INFALLIBLE_EN: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_ZH[1], { DEFERENCE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[0], { DEFERENCE_EN: [] }).hit, false);
});

test('负例注入：豁免组删除后豁免句变红', () => {
  assert.equal(detectAutomationBias(EXEMPT[4], { EXEMPT_CORRECT_ZH: [] }).hit, true);
  assert.equal(detectAutomationBias(EXEMPT[5], { EXEMPT_CORRECT_EN: [] }).hit, true);
  assert.equal(detectAutomationBias(EXEMPT[3], { EXEMPT_SYSTEM_ZH: [] }).hit, true);
});

test('负例注入：距离窗承重（放大到 120 后长距句命中）', () => {
  assert.equal(detectAutomationBias(BOUNDARY[3]).hit, false, '默认窗不命中');
  assert.equal(detectAutomationBias(BOUNDARY[3], { WIN_PAIR_ZH: 120 }).hit, true, '放大窗后命中');
});

test('引擎闸：良性样本不得以 automation_bias 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('automation_bias'), '误伤: ' + t);
  }
});
