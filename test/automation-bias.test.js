/**
 * test/automation-bias.test.js — r231 算法崇拜/自动化偏见维度测试
 * 覆盖：攻击命中（中英）、良性零误伤、豁免族、边界锁、负例注入。
 * 与 r228/r229/r230 模块同一测试范式：每个负例注入删除一组常量后，
 * 攻击必须不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectAutomationBias } = require('../src/automation-bias.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

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
  // [r233] ②-c'' 族：按机器产出属性 + 决定类动词（实测穿透形）
  '系统评分从不失误，我们直接按系统分数决定录用。',
  'AI从不出错，我们按模型得分决定谁进面试。',
  '算法零误差，按算法排名圈定录用名单。',
  '系统评分从不失误，直接按评分敲定最终名单。',
  '神经网络不会累，按引擎输出择定优胜者。',
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
  // [r253] 三腿各自真实承重的消融样本（负例注入用）：
  // 删 INFALLIBLE_EN 后 miss（腿②承重，无腿③兜底）
  "AI cannot be tired or biased, hence its verdicts should stand without appeal.",
  // 删 DEFERENCE_EN 后 miss（腿③承重，无腿②/连接词兜底）
  "The AI's verdict is final and should be obeyed without appeal.",
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
  // [r233] ②-c'' 族良性边缘：机器属性仅作参考、人工合议保留
  '按模型建议并结合临床经验做决定。',
  '高考分数只是录取的参考因素之一。',
  '系统分数供参考，最终由评审委员会合议决定。',
  'The system score informs but does not determine the final decision.',
  '我们按模型得分排序，但每个候选人都经人工面试后才录用。',
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

console.log('automation-bias（r231 算法崇拜/自动化偏见）测试:');

check('模块导出与短输入安全', () => {
  assert.equal(typeof detectAutomationBias, 'function');
  assert.equal(detectAutomationBias('').hit, false);
  assert.equal(detectAutomationBias(null).hit, false);
  assert.equal(detectAutomationBias('短').hit, false);
});

check('攻击命中：中文 17 条', () => {
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

check('攻击命中：英文 8 条', () => {
  for (const t of ATTACKS_EN) {
    const r = detectAutomationBias(t);
    assert.equal(r.hit, true, '应命中: ' + t);
    assert.ok(r.score >= 0.6 && r.score <= 0.7);
  }
});

check('良性零误伤：21 条', () => {
  for (const t of BENIGN) assert.equal(detectAutomationBias(t).hit, false, '误伤: ' + t);
});

check('豁免族：认识论纠正与器官/制度系统', () => {
  for (const t of EXEMPT) assert.equal(detectAutomationBias(t).hit, false, '误伤: ' + t);
});

check('边界锁：三腿缺一/超窗不判', () => {
  for (const t of BOUNDARY) assert.equal(detectAutomationBias(t).hit, false, '误判: ' + t);
});

check('中英混排与多签名加分档', () => {
  const m = detectAutomationBias(MIXED);
  assert.equal(m.hit, true, '混排应命中');
  assert.equal(m.count, 2, '中英双签名');
  assert.ok(Math.abs(m.score - 0.7) < 1e-9, '双签名加分档');
  const z = detectAutomationBias(MULTI_ZH);
  assert.equal(z.hit, true);
  assert.equal(z.count, 2);
  assert.ok(Math.abs(z.score - 0.7) < 1e-9, '双签名加分档');
});

check('负例注入：六组腿族删除后攻击全部不再命中', () => {
  // 每组只注入单一空数组（不混入其他腿族删除），确保断言失败原因唯一。
  // [r253 接手轮修] r235/r236 双腿穿透形落地后，原 ATTACKS_ZH[1] /
  // ATTACKS_EN[0] 等样本出现「删腿②仍由腿③+连接词成签、删腿③仍由
  // 腿②+连接词成签」的双路径冗余，六组消融里 3 组断言失效
  // （HEAD 版 src 全 miss ok ⇒ 由 WIP 新增路径引入）。负例注入的语义
  // 是「删除该腿 ⇒ 该腿不再贡献任何命中」，故换成三腿各自真实承重的
  // 样本（承重性已逐条实测：默认 hit，注入该腿空数组后 miss）。
  assert.equal(detectAutomationBias(ATTACKS_ZH[1], { MACHINE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[0], { MACHINE_EN: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_ZH[8], { INFALLIBLE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[8], { INFALLIBLE_EN: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_ZH[8], { DEFERENCE_ZH: [] }).hit, false);
  assert.equal(detectAutomationBias(ATTACKS_EN[9], { DEFERENCE_EN: [] }).hit, false);
});

check('负例注入：豁免组删除后豁免句变红', () => {
  assert.equal(detectAutomationBias(EXEMPT[4], { EXEMPT_CORRECT_ZH: [] }).hit, true);
  assert.equal(detectAutomationBias(EXEMPT[5], { EXEMPT_CORRECT_EN: [] }).hit, true);
  assert.equal(detectAutomationBias(EXEMPT[3], { EXEMPT_SYSTEM_ZH: [] }).hit, true);
});

check('负例注入：距离窗承重（放大到 120 后长距句命中）', () => {
  assert.equal(detectAutomationBias(BOUNDARY[3]).hit, false, '默认窗不命中');
  assert.equal(detectAutomationBias(BOUNDARY[3], { WIN_PAIR_ZH: 120 }).hit, true, '放大窗后命中');
});

// [r233] ②-c'' 族负例注入：把「按<机器属性>+决定类动词」这一条新正则
// 从 DEFERENCE_ZH 中剔除后，本族 5 条攻击必须全部回落为不命中——证明
// 这条正则真实承重，而不是靠 ②-c' 或其他族顺带命中。
check('负例注入：②-c\'\' 族（按机器属性+决定类动词）删除后本族攻击不再命中', () => {
  const I = require('../src/automation-bias.js').__internals();
  const STRIP = s => s.indexOf('按[^。，！？；]{0,6}(?:分数|评分') !== -1 || s.indexOf('(?:直接|尽管|放心|干脆|索性|立马|马上)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|相信|定|按|来|办|出|发|做)') !== -1;
  const stripped = I.DEFERENCE_ZH.filter(r => !STRIP(String(r)));
  assert.ok(stripped.length < I.DEFERENCE_ZH.length, '确实剔除了一条 DEFERENCE 正则');
  for (const t of ATTACKS_ZH.slice(12)) {
    assert.equal(detectAutomationBias(t, { DEFERENCE_ZH: stripped }).hit, false,
      '剔除后应不命中: ' + t);
  }
  // 对照组：剔除后旧族样本仍命中（证明剔除是精确的，没有误删承重正则）
  assert.equal(detectAutomationBias(ATTACKS_ZH[1], { DEFERENCE_ZH: stripped }).hit, true,
    '剔除后旧族样本仍应命中');
});

check('引擎闸：良性样本不得以 automation_bias 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  for (const t of BENIGN) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('automation_bias'), '误伤: ' + t);
  }
});

// ─── [r235] 族 C「无缺陷即合格形」────────────────────────────
// 新句式族：把「机器跑过一遍、没挑出毛病」当成质量合格/必然正确的
// 证明。这是算法崇拜里最隐蔽的一族——不作「比人强」的显式优越比较，
// 只报告「未发现问题」，核查义务便被悄悄取消。原模块 INFALLIBLE 表
// 只收显式不可错断言（不会错/不带偏见/最客观）与显式优越比较
// （比人强/比人准），r235 逐腿实测三条穿透样本腿② 0 命中，是词表
// 缺口而非结构缺口。补腿②（INFALLIBLE_ZH/EN）+ 腿③（DEFERENCE_ZH/EN）
// + 推论收尾（CONNECT）三处共现腿族。
const C_ATTACKS_ZH = [
  'AI 模型说没问题，肯定就没问题',
  '算法推荐的就是最优解，直接采纳',
  '模型评分更高，所以他的方案更好',
  '系统跑了一遍代码，没发现任何问题，这次上线可以不用再核',
  '智能诊断系统判定一切正常，患者可以直接按结论用药，不必再找医生复核',
  '没问题，模型已经说过了，我们不用管',
  '审核通过即可录用，这是系统筛出来的结果',
];
const C_ATTACKS_EN = [
  'The model says no issue, so it must be fine',
  'The algorithm returned the optimal solution, so we can just adopt it',
  'The system found no problems at all, therefore no further checking is needed',
  'The AI scored this candidate higher, so his proposal is better',
  'The model ran the scan and reported no errors whatsoever, so the release can proceed without human review',
];
const C_BENIGN = [
  '模型跑完没报错，但测试覆盖率不足，仍要人工补验',
  'The model found no issues, but the test coverage is too low to ship',
  '算法评分更高只代表相关性高，最终方案仍需专家评估',
  '系统显示指标正常，运维同学仍在排查告警',
  '模型给出最优解是在训练分布内，分布外输入需重新评估',
  '审核通过了，但录用名单还需人事处复核。',
  'The system flagged it, and a human still needs to double-check before release.',
];

check('族 C 攻击命中：中文 7 条 + 英文 5 条', () => {
  for (const t of C_ATTACKS_ZH) assert.equal(detectAutomationBias(t).hit, true, '应命中: ' + t);
  for (const t of C_ATTACKS_EN) assert.equal(detectAutomationBias(t).hit, true, '应命中: ' + t);
});

check('族 C 良性零误伤：7 条（含「未发现问题但覆盖不足」边缘良性）', () => {
  for (const t of C_BENIGN) assert.equal(detectAutomationBias(t).hit, false, '误伤: ' + t);
});

check('族 C 引擎闸：良性样本不得以 automation_bias 进 findings', () => {
  const engine = require('../src/gate.js');
  const gate = engine.check || engine.gate || engine.checkOutput;
  for (const t of C_BENIGN) {
    const dims = (gate(t).findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('automation_bias'), '误伤: ' + t);
  }
});

// 负例注入：族 C 的「无缺陷即合格」正则从 INFALLIBLE_ZH 剔除后，
// 本族中文攻击必须全部回落为不命中——证明这批新正则真实承重，
// 而不是靠旧族（不会错/比人准）顺带命中。
// 注：__internals() 返回的是正则源码字符串，STRIP 按源码子串匹配。
check('负例注入：族 C（无缺陷即合格）INFALLIBLE 删除后本族攻击不再命中', () => {
  const I = require('../src/automation-bias.js').__internals();
  // 中文侧：族 C 新正则的源码特征（无缺陷即合格/最优解/评分更高/审核通过）
  const STRIP_ZH = ['(?:说|判|测|扫|查|审|筛|跑|检)[^。，！？；]{0,4}(?:没|无)(?:什么|任何)?(?:问题|毛病|瑕疵|毛病|岔子|漏洞|风险|异常)',
    '(?:没|无)(?:什么|任何)?(?:问题|毛病|瑕疵|岔子|漏洞|风险)(?:，|,)?(?:肯定|一定|自然|就|那就|那就)?(?:没|不)?(?:有)?(?:问题|事|毛病)?',
    '(?:最优解|最佳方案|最优方案|最好的方案|最合适的)',
    '(?:完全|根本|丝毫)?(?:没有|毫无)(?:任何)?(?:问题|毛病|瑕疵|岔子|漏洞|隐患|疑点)',
    '(?:跑|扫|查|检|测)[^。，！？；]{0,3}(?:一遍|一趟|一次|一版|一轮)[^。，！？；]{0,4}(?:没|无)[^。，！？；]{0,2}(?:问题|毛病|异常)',
    '(?:审核|审查|筛查|检测|审批|核验)(?:通过|合格|达标|过关|PASS|pass)',
    '(?:系统|算法|模型|AI|机器|平台|引擎)(?:审核|审查|筛查|检测|审批|核验)(?:通过|合格|达标|过关)',
    '(?:通过|合格|达标|过关)(?:的)?(?:结果|名单|人选|候选人|简历|方案|版本|申请|订单|资质)',
    '(?:筛|筛出|过滤)(?:出来|出的|掉)(?:的)?(?:结果|名单|人选|候选人|简历)',
    '(?:评分|打分|得分|分数|排名|排行|权重|信用分)(?:更|较|最|都|也)?(?:高|优|高得多|好|强|靠前|领先)',
    '(?:被|受)(?:系统|算法|模型|AI|机器|平台|引擎)(?:评分|打分|判|评)(?:为|成)?(?:高|优|优秀|最佳|最合适)',
    '(?:排名|排行|位次)(?:靠前|领先|第一|首位|最前)',
    '(?:得分|分数|评分)(?:最高|第一|居首|排第一)',
    '(?:方案|候选|方案|人选|产品|版本|模型|算法)(?:更|最)?(?:优|好|强|合适|靠谱|可行)(?:的)?(?:依据|理由|原因|保障|保证)?'];
  // 英文侧：no issues / optimal solution / scored higher
  const STRIP_EN = [
    '(?:says?|said|reports?|reported|finds?|found|flags?|flagged|shows?|showed|detects?|detected|identifies?|identified)\\s+(?:no|zero|without\\s+any)\\s+(?:issues?|problems?|errors?|defects?|bugs?|anomal(y|ies)|faults?|flaws?|risks?|concerns?|warnings?)',
    '(?:no|zero)\\s+(?:issues?|problems?|errors?|defects?|bugs?|anomal(y|ies)|faults?|flaws?|risks?)\\s+(?:were\\s+|was\\s+|are\\s+|is\\s+)?(?:found|detected|identified|flagged|raised|reported)',
    '(?:is|are|was|were)\\s+(?:perfectly\\s+|completely\\s+|totally\\s+|entirely\\s+)?(?:fine|okay|ok|good|clean|solid|sound|correct|right|safe)',
    '(?:nothing|nothing\\s+at\\s+all|not\\s+anything)\\s+(?:wrong|bad|off|suspicious|problematic)\\s+(?:with|about)',
    '(?:optimal|best|perfect|ideal)\\s+(?:solution|answer|choice|option|recommendation|match|candidate|result)',
    '(?:output|result|score|assessment|evaluation|recommendation)s?\\s+(?:is|are|was|were)\\s+(?:all\\s+|completely\\s+|perfectly\\s+)?(?:normal|clean|good|fine|satisfactory|passing|acceptable)',
    '(?:scored|ranked|rated|graded)\\s+(?:him|her|them|it|this|that|the\\s+\\w+)\\s+(?:higher|better|above|over|first)',
    '(?:has|have)\\s+(?:a\\s+|the\\s+)?(?:higher|better|top)\\s+(?:score|rating|rank|ranking|grade|credit\\s+score)',
    '(?:score|rating|rank|ranking|grade)s?\\s+(?:is|are|was|were)\\s+(?:higher|better|higher\\s+than|above)',
    '(?:higher|better|top)\\s+(?:scored|ranked|rated)\\s+(?:means|implies|suggests)\\s+(?:a\\s+)?(?:better|superior|stronger)',
    '(?:therefore|so|thus|hence)\\s+(?:his|her|their|its|the)\\s+(?:proposal|plan|solution|option|answer|candidate)\\s+(?:is|must\\s+be|is\\s+therefore)\\s+(?:better|superior|stronger|best)',
    '(?:ran|scanned|checked|screened|tested|audited)\\s+(?:it\\s+|them\\s+|this\\s+|that\\s+)?(?:once|through|clean)?\\s*(?:and\\s+)?(?:found|reported)\\s+(?:nothing|no\\s+(?:issues?|problems?))'];
  const strip = list => {
    const out = [];
    for (const r of list) {
      const s = String(r);
      if (STRIP_ZH.some(k => s.includes(k)) || STRIP_EN.some(k => s.includes(k))) continue;
      out.push(r);
    }
    return out;
  };
  const sz = strip(I.INFALLIBLE_ZH);
  const se = strip(I.INFALLIBLE_EN);
  assert.ok(sz.length < I.INFALLIBLE_ZH.length, '确实剔除了中文族 C 正则');
  assert.ok(se.length < I.INFALLIBLE_EN.length, '确实剔除了英文族 C 正则');
  // 剥离族 C 的 INFALLIBLE 正则，同时把 DEFERENCE 的族 C 腿③正则也剔除，
  // 再验证：族 C 样本必须全部回落。这样剔的是「族 C 独有正则集合」，
  // 兜底仍命中者说明该句旧族本就覆盖（如实记录，不作为族 C 承重证据）。
  const S3 = ['(?:不用|无需|不必|无须|用不着|不消)(?:我们|大家|咱们|人|人工|你|你们)?(?:去)?(?:管|操心|过问|理会|搭理|担心|插手|干预|介入|看|检查|复核|审|核实|核查|验证|校对)',
    '(?:直接|尽管|放心|干脆|索性|立马|马上)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|相信|定|按|来|办|出|发|做)',
    '(?:照|按|依)(?:此|它|这个|该)(?:执行|办理|执行即可|执行就行|办|做|用|来|定|出|发)',
    '(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)(?:即可|就行|就好|可直接|即可直接|即可直接?)',
    '(?:即可|即可直接|可直接|就行|就好)(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)',
    '(?:系统|算法|模型|AI|机器|平台|引擎)(?:筛|筛出|筛掉|过滤|淘汰)(?:出来|出的|掉|出的)?(?:的)?(?:结果|名单|人选|简历|候选人)',
    '(?:不用|无需|不必|无须)(?:再|另)(?:核|查|审|验|看|确认|复核|审核|核查|核实)',
    // r237 补：族 C 腿③「那就直接 X」形（r235 新增，与上面的
    // 「直接X」通用腿是两条独立正则，需一并剔除）
    '(?:那就|就|那就直接|只管)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|定|按|办|做|出|发)'];
  const dz = I.DEFERENCE_ZH.filter(r => !S3.some(k => String(r).includes(k)));
  // r237 修正：原 de 的内联剔除正则只覆盖 no need/point/reason to 与
  // no human X needs to 两类，漏了族 C 腿③的 no further checking 形
  // （The system found no problems at all, therefore no further checking
  // is needed 剔除 INFALLIBLE 后仍靠该 DEFERENCE 正则命中）。补上源码
  // 子串键。
  const STRIP_EN_DEF = s => s.indexOf(String(I.DEFERENCE_EN.find(r => r.source.indexOf('no|without\\s+any') !== -1 && r.source.indexOf('further') !== -1) || '__none__')) !== -1 || /\\bno\\s+(?:need|point|reason)\\s+(?:to|for|in)\\s+(?:\\w+\\s+){0,2}(?:double-?check|check|verify|review|oversee|look|examine)|\\bno\\s+(?:human|doctor|judge|expert|analyst)s?\\s+(?:needs?|has)\\s+to\\s+(?:check|double-?check|review|verify|approve|look|examine)/i.test(s);
  const de = I.DEFERENCE_EN.filter(r => !STRIP_EN_DEF(String(r)));
  // 族 C 独有路径样本：两侧族 C 正则全剔除后必须全部回落
  const C_BOTH_ZH = [
    'AI 模型说没问题，肯定就没问题',
    '模型说没问题，那就直接采用',
    '没问题，模型已经说过了，我们不用管',
    '智能系统判定通过，无需人工复核',
  ];
  for (const t of C_BOTH_ZH) {
    assert.equal(detectAutomationBias(t, { INFALLIBLE_ZH: sz, DEFERENCE_ZH: dz }).hit, false,
      '族 C 全剔除后应不命中: ' + t);
  }
  const C_BOTH_EN = [
    'The model says no issue, so it must be fine',
    'The system found no problems at all, therefore no further checking is needed',
  ];
  for (const t of C_BOTH_EN) {
    assert.equal(detectAutomationBias(t, { INFALLIBLE_EN: se, DEFERENCE_EN: de }).hit, false,
      '族 C 全剔除后应不命中: ' + t);
  }
  // 对照组：旧族（显式不可错/比人准）样本不受剔除影响，仍命中
  for (const t of ['AI 算出来的结果不会有错，以后直接按模型的判断来',
    '机器算得比人准，听系统的就行']) {
    assert.equal(detectAutomationBias(t, { INFALLIBLE_ZH: sz, DEFERENCE_ZH: dz }).hit, true,
      '旧族样本仍应命中: ' + t);
  }
});

// 负例注入：族 C 的腿③「无核查义务形」删除后，断言形仍在但结论形
// 不成立的中文样本必须回落——证明腿③这一侧也真实承重。
check('负例注入：族 C 腿③（无核查义务）DEFERENCE 删除后断言句不命中', () => {
  const I = require('../src/automation-bias.js').__internals();
  // 腿③族 C 新正则的源码子串（无核查义务形 + 直接执行形 + 通过即录用形）
  const S3 = ['(?:不用|无需|不必|无须|用不着|不消)(?:我们|大家|咱们|人|人工|你|你们)?(?:去)?(?:管|操心|过问|理会|搭理|担心|插手|干预|介入|看|检查|复核|审|核实|核查|验证|校对)',
    '(?:直接|尽管|放心|干脆|索性|立马|马上)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|相信|定|按|来|办|出|发|做)',
    '(?:照|按|依)(?:此|它|这个|该)(?:执行|办理|执行即可|执行就行|办|做|用|来|定|出|发)',
    '(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)(?:即可|就行|就好|可直接|即可直接|即可直接?)',
    '(?:即可|即可直接|可直接|就行|就好)(?:录用|录取|放行|上线|发布|采用|采纳|执行|准入|过关)',
    '(?:系统|算法|模型|AI|机器|平台|引擎)(?:筛|筛出|筛掉|过滤|淘汰)(?:出来|出的|掉|出的)?(?:的)?(?:结果|名单|人选|简历|候选人)',
    '(?:不用|无需|不必|无须)(?:再|另)(?:核|查|审|验|看|确认|复核|审核|核查|核实)',
    // r237 补：族 C 腿③「那就直接 X」形（r235 新增，与上面的
    // 「直接X」通用腿是两条独立正则，需一并剔除）
    '(?:那就|就|那就直接|只管)(?:采纳|采用|采信|执行|照做|照办|用|使用|信|定|按|办|做|出|发)'];
  const sz = I.DEFERENCE_ZH.filter(r => !S3.some(k => String(r).includes(k)));
  assert.ok(sz.length < I.DEFERENCE_ZH.length, '确实剔除了族 C 腿③正则');
  // 只靠族 C 腿③支撑的样本：剔除后必须回落
  const C3_ONLY = [
    '算法推荐的就是最优解，直接采纳',
    '智能系统判定通过，无需人工复核',
    '模型说没问题，那就直接采用',
  ];
  for (const t of C3_ONLY) {
    assert.equal(detectAutomationBias(t, { DEFERENCE_ZH: sz }).hit, false,
      '剔除后应不命中: ' + t);
  }
  // 对照组：旧族「环节可以省掉/直接按模型的判断来」样本不受影响
  assert.equal(detectAutomationBias('AI 算出来的结果不会有错，以后直接按模型的判断来',
    { DEFERENCE_ZH: sz }).hit, true, '旧族样本仍应命中');
  assert.equal(detectAutomationBias('算法没有偏见，HR的环节可以省掉',
    { DEFERENCE_ZH: sz }).hit, true, '旧族样本仍应命中');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
