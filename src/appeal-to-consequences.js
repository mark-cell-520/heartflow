/**
 * src/appeal-to-consequences.js — 「诉诸后果」检测器（第 164 个判别维度）
 *
 * [r165 立项] decision 本体选出（heartflow_philosophy_decision，type=accelerate /
 * confidence 0.7 / priority 40 / goalReviewed true——cognitiveLoad 与 uncertainty
 * 为默认 "unknown" 档，不构成实质背书）。探测器证据（scripts 探针，当前引擎
 * v6.8.92，163 维）：诉诸后果攻击族 6 条漏判 3 条（50%），漏判样本逐条跑
 * gate() 实测真零命中（「我不敢相信气候变化是人为的，万一这是真的，我们
 * 现在的生产方式就得全盘推翻」「If climate change were real, our whole
 * economy would collapse, so it cannot be real.」），不是被聚合压掉，是射程外。
 * grep src/（排除 test/）诉诸后果 / appeal.to.consequence = 0 命中。缺口成立。
 *
 * 辨别的族：诉诸后果（appeal to consequences / argumentum ad consequentiam）
 * ——**以命题真值所带来的后果评估（可怕/不可接受/太严重/意义消解）替代事实
 * 证据，据此否定或拒绝相信该命题的真值**：
 *   承认房价会跌太可怕了，那么多人还着贷款，所以房价不可能跌。
 *   如果进化论是真的，那人活着就没有意义了，所以进化论不可能是真的。
 *   我不敢相信气候变化是人为的，万一这是真的，经济就全盘崩溃了。
 *   这种结果太可怕了，简直不敢想，所以一定是数据造假。
 *   If climate change were real, our economy would collapse, so it cannot be true.
 *   The consequences of admitting this would be too damaging, so I refuse to believe it.
 *
 * 与既有维度的边界（grep + discriminate() 实测归因）：
 *   · conditional_proposition（第160维，r729）管**假设条件句×否定推断**
 *     （「如果A真就B；就不会/怎么可能」——B 是普通结果），本族的必要腿是
 *     **显式后果评估**（太可怕/全盘崩溃/没有意义），且真值否定可脱离条件句
 *     独立成句（「承认X太可怕了，所以X不是真的」）。交集样本（「如果进化论
 *     是真的，人活着就没有意义了，所以进化论不可能是真的」）两维同时命中，
 *     gate 取并集不漏判即达标（同 no_true_scotsman 先例）；
 *   · wishful_thinking（第147维）管**信念/愿望→结果必然实现**（我想所以会
 *     成），本族管**后果评估→真值否定**（后果糟所以不是真的），方向相反；
 *   · fear_projection（第104维）管**外部危险断言×服从绑定**（控制结构），
 *     本族不管服从，管对命题真值的裁定；
 *   · affective_forecast 管**对未来情绪的预测偏差**，本族不管情绪预测；
 *   · unsupported_claim 管**无依据断言本身**，本族有具体推理结构（后果→
 *     真值否定）；absolute_claim 管**绝对化措辞**，本族必须有后果评估腿在场；
 *   · fallacies（聚合子标签）不覆盖本族形状；其余 163 个维度对漏判样本
 *     实测零命中（射程外）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① CONSEQUENCE 显式后果评估——后果的严重性/不可接受性/意义消解：
 *     太可怕/细思极恐/不堪设想/不敢想/没法接受/天要塌了/全盘崩溃/经济崩盘/
 *     还有什么意义/全都白费/天下大乱；EN：too damaging / would collapse /
 *     would be devastating / too much to bear / life would have no meaning。
 *   · 腿② TRUTH-DENIAL 真值否定/拒绝相信——所以不可能是真的/一定是假的/
 *     纯属吓唬/危言耸听/我不敢相信…是真的/怎么可能；EN：cannot be true /
 *     must be false / I refuse to believe / too … to be true。
 *   · 缺腿不判：只有腿①（「后果很严重，我们需要认真准备应对措施」）是正当
 *     风险沟通——落点是行动不是真值否定；只有腿②（「这一定是假的」）无后果
 *     评估前提，归其他维度。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误推理（「他认为承认下跌太可怕，
 * 所以咬定不会跌，这个逻辑有问题」）、文学对白、辩论教学。verify 的含义是
 * 「这段在用后果的可接受性替代事实判断，需要回到证据层面复核」——调用方应
 * 要求先核查命题本身的证据，再讨论后果的应对，而非接受「太可怕所以不是真的」。
 *
 * 明确不判的（豁免——正当风险沟通、对冲、证据模式、概念转述、否定翻转）：
 *   · 对冲（可能/也许/未必/不一定/尚不清楚/might/maybe/not necessarily）——
 *     带对冲的后果陈述不断定真值；
 *   · 证据在场（数据/实验/实测/对照组/同行评审/peer review/verified）——
 *     有出处的评估不是本族；
 *   · 概念转述（诉诸后果/后果谬误/appeal to consequences/argumentum ad
 *     consequentiam）——分析这套话术本身不是运用它；
 *   · 否定翻转（不意味着/不代表/不等于/并不能说明/does not mean）——
 *     「后果严重不意味着命题为假」是正确的判别；
 *   · 提问句式（含问号）——求知/反问不是断言。
 */
'use strict';

// ─── 腿① CONSEQUENCE 显式后果评估（中文）────────────────────────────
// 收三类形状：a 严重性/不可接受性形容词短语；b 系统性崩溃断言；c 意义消解。
// 只收**显式评估词**，不收「风险/隐患/挑战」等中性词——「这个方案有风险」
// 是正常风险提示，与腿②（真值否定）共现也不构成本族的核心形状，且保精度。
const CONSEQ_ZH = new RegExp(
  // a 严重性/不可接受性
  '太(?:可怕|恐怖|严重|糟糕|残酷|沉重|荒唐|离谱|夸张|吓人)' +
  '|可怕(?:到|得|至极)?' +
  '|恐怖(?:到|得|至极)?' +
  '|细思极恐' +
  '|不堪设想' +
  '|不敢想|想都不敢想|连想都不敢想' +
  '|没法接受|无法接受|难以接受|接受不了|不能接受' +
  '|沉重(?:到|得)|残酷(?:到|得)' +
  // b 系统性崩溃/灾难断言
  '|天(?:都)?要(?:塌|崩|垮)|天塌下来' +
  '|全盘(?:崩溃|崩塌|推翻|垮掉|崩塌)|统统(?:作废|报废|白费)' +
  '|经济(?:就要|将会|必将|迟早)?(?:崩溃|崩盘|完蛋|崩塌)' +
  '|(?:公司|社会|市场|体系|秩序|局面)(?:就要|将会|必将)?(?:崩溃|崩塌|垮掉|乱套)' +
  '|天下大乱|人心惶惶|鸡犬不宁|世界末日|末日(?:来临|将至|到了)' +
  '|一切(?:都)?(?:完了|毁了|作废|白费)|全都(?:完了|毁了|作废)' +
  '|(?:心血|努力|付出|投入)(?:都)?(?:白费|白流|付之东流|打了水漂)' +
  // c 意义消解（还奋斗什么/还有什么意义）
  '|(?:活着|人生|生活|生命|奋斗|努力|拼搏|坚持)(?:就|都|又)?(?:没有|还有)(?:什么)?(?:意义|价值|意思|必要)' +
  '|(?:那|那大家|那我们|大家|我们|所有人|全世界)(?:还|又)(?:凭什么|为什么|哪来的理由)(?:奋斗|努力|坚持|拼命|干活|工作)' +
  '|(?:还|又)(?:奋斗|努力|拼搏|坚持)(?:个|干)?什么' +
  '|岂不是(?:都)?(?:白|白费|白干|白忙|作废|无意义)',
  'i'
);

// 英文：后果评估三支（严重性形容词 / 崩溃推断 / 意义消解）。
const CONSEQ_EN = new RegExp(
  // a 严重性/不可接受性
  "\\btoo\\s+(?:damaging|terrible|horrible|awful|frightening|terrifying|devastating|catastrophic|grave|serious|disturbing|frightening|unthinkable|unbearable|painful|overwhelming)\\b" +
  "|\\b(?:the\\s+)?consequences?\\s+(?:would|could|will|might)\\s+be\\s+too\\b" +
  "|\\bunthinkable\\b|\\binconceivable\\b|\\btoo\\s+much\\s+to\\s+(?:bear|accept|handle|contemplate|stomach)\\b" +
  "|\\bearth[- ]shattering\\b|\\bworld[- ]shattering\\b" +
  // b 系统性崩溃/灾难推断
  "|\\bwould\\s+(?:collapse|be\\s+devastated|be\\s+destroyed|be\\s+ruined|be\\s+catastrophic|mean\\s+the\\s+end\\s+of|throw\\s+.{0,30}\\s+into\\s+chaos|unravel)\\b" +
  "|\\bwould\\s+(?:all\\s+)?(?:collapse|crumble|fall\\s+apart|disintegrate)\\b" +
  "|\\beverything\\s+(?:would\\s+)?(?:would\\s+be\\s+)?(?:ruined|destroyed|lost|over|pointless|meaningless)\\b" +
  "|\\bthe\\s+(?:whole\\s+)?(?:economy|system|market|society|world|country)\\s+would\\s+(?:collapse|crumble|implode|fall\\s+apart)\\b" +
  // c 意义消解
  "|\\b(?:life|existence|everything)\\s+(?:would\\s+)?(?:have\\s+no|lose\\s+(?:all\\s+)?its?)\\s+(?:meaning|purpose|point)\\b" +
  "|\\bwhat\\s+would\\s+be\\s+the\\s+point\\b" +
  "|\\bwould\\s+render\\s+.{0,30}\\s+(?:meaningless|pointless|futile)\\b" +
  "|\\bno\\s+(?:point|reason|sense)\\s+(?:in|to)\\s+(?:trying|going\\s+on|carrying\\s+on|fighting|working\\s+hard)\\b",
  'i'
);

// ─── 腿② TRUTH-DENIAL 真值否定/拒绝相信（中文）─────────────────────────
// 三类子形：a 推断词+真值否定；b 认知拒绝（不敢相信…是真的）；c 定性词
// （危言耸听/纯属吓唬）。只收对**命题真值**的否定，不收对行动的指向——
// 「所以我们要行动起来」不是本腿。
const TDENY_ZH = new RegExp(
  // a 推断词 + 真值否定
  '(?:所以|因此|足见|这说明|可见|这么说来|既然如此)[^。]{0,18}(?:不可能是|绝不是|绝非|不会是|肯定不是|一定不是|不是)(?:真的|事实|真的|靠谱|可信|对的|正确的)' +
  '|(?:所以|因此|足见|这说明|可见|这么说来)[^。]{0,18}一定(?:是|属于)?[^。]{0,4}(?:假的|谣言|造假|骗局|谎言|吹牛|演戏|摆拍|剪辑|伪造|编造|虚构)' +
  '|(?:所以|因此|足见|这说明|可见|这么说来)[^。]{0,18}是(?:假的|谎言|谣言|伪造的|编造的)' +
  '|(?:所以|因此|足见|这说明|可见|这么说来|既然如此)[^。]{0,20}不可能(?:会)?(?:跌|降|崩|发生|存在|成真|成立|实现|夺冠|成功|赢)' +
  '|(?:所以|因此)[^。]{0,18}纯属(?:吓唬|欺骗|谎言|谣言|误导|造谣|扯淡|胡说)' +
  '|(?:所以|因此|足见)[^。]{0,18}(?:是|就是)(?:危言耸听|夸大其词|胡说八道|无稽之谈|一派胡言|瞎扯)' +
  // b 认知拒绝 + 真值指向
  '|(?:我)?(?:不敢|无法|不能|没法|不肯|拒绝|简直不敢)(?:去)?相信[^。]{0,18}(?:是真的|成立|靠谱|可信|事实|这个结论|这种说法|这一切|这个结果|这些数据)' +
  '|(?:我)?(?:无法|不能|没法|难以)(?:想象|理解)[^。]{0,18}(?:是真的|成立|靠谱)' +
  '|不(?:敢)?相信[^。]{0,12}(?:会|可能)[^。]{0,10}(?:发生|存在|是真的)' +
  '|这(?:怎么)?可能(?:会)?是真的|怎么(?:可能|会)(?:是)?真的' +
  // d 无推断词的强否定+真值名词（倒装/短句形：「这绝对不是真的」）
  '|(?:这|那|此|事)?(?:绝对|一定|肯定|必然|压根|根本)?(?:不|并非|绝不是|绝对不是)是(?:真的|事实)' +
  // c 直接定性（无推断词也成立——与腿①共现补足）
  '|(?:一定|肯定|绝对|必然|势必)(?:是|属于)(?:假的|谣言|造假|骗局|谎言|吹牛|演戏|摆拍|伪造|编造|虚构|危言耸听)' +
  '|(?:一定|肯定|绝对)(?:不可信|靠不住|站不住脚)',
  'i'
);

// 英文：a 推断否定 / b 认知拒绝 / c 直接定性。
const TDENY_EN = new RegExp(
  // a 推断否定（so/therefore/which means + 真值否定）
  "\\b(?:so|therefore|thus|which\\s+means|that\\s+means|hence)\\b[^.]{0,40}\\b(?:can(?:not|'t)|could\\s+not|couldn'?t|must\\s+not|cannot\\s+possibly|can'?t\\s+possibly)\\s+be\\s+(?:true|real|correct|right|factual)\\b" +
  "|\\b(?:so|therefore|thus|which\\s+means)\\b[^.]{0,40}\\b(?:must|has\\s+to|have\\s+to)\\s+be\\s+(?:false|fake|fabricated|wrong|a\\s+(?:lie|hoax|fraud|myth|sham))\\b" +
  "|\\bmust\\s+be\\s+(?:false|fake|fabricated|a\\s+(?:lie|hoax|fraud|myth|sham|scare\\s+tactic))\\b" +
  // b 认知拒绝
  "|\\bi\\s+(?:refuse|cannot|can'?t|am\\s+unable)\\s+to\\s+believe\\b" +
  "|\\bi\\s+(?:do\\s+not|don'?t)\\s+believe\\b[^.]{0,40}\\b(?:is|are|was|were)\\s+(?:true|real)\\b" +
  "|\\bcannot\\s+(?:bring\\s+myself\\s+to\\s+)?(?:accept|believe)\\s+that\\b" +
  // c too … to be true（经典诉诸后果收束形）
  "|\\btoo\\s+.{0,30}\\s+to\\s+be\\s+true\\b" +
  "|\\bno\\s+way\\s+(?:that|this)\\s+(?:is|was|it'?s)\\s+true\\b" +
  "|\\bsimply\\s+(?:cannot|can'?t)\\s+be\\s+true\\b",
  'i'
);

// ─── 豁免一：对冲表述（带对冲的后果陈述不断定真值）────────────────────
// [r165] 「可能」加后向负回顾 (?<![不么])——否则「不可能跌/怎么可能」的
// 「不可/么可」子串会误触对冲豁免，攻击句全被自己放走（单元实测 4/10 命中的根因之一）。
const HEDGE_EXEMPT = new RegExp(
  '(?<![不么])可能|也许|或许|未必|不一定|尚不清楚|有待|待确认|待验证|不能排除|无法排除|难说|不好说|大概|估计' +
  '|might\\s+be|may\\s+be|perhaps|maybe|possibly|not\\s+necessarily|not\\s+clear|unclear|remains\\s+to\\s+be\\s+seen|hard\\s+to\\s+say',
  'i'
);

// ─── 豁免二：证据在场（有出处/可检验的评估不是本族）──────────────────
// [r165] 裸「数据/实验」收窄为复合形——「所以一定是数据造假」含裸「数据」
// 会被误豁免（攻击句 5/10 命中的根因之二）。引用形要求「数据+表明/来自/
// 支持」这类可定位搭配。
const EVIDENCE_EXEMPT = new RegExp(
  '数据(?:显示|表明|来自|来源|支持|证实|支撑|库)|实测(?:数据|结果|值|报告)' +
  '|实验(?:结果|数据|证实|支持|组|验证|设计)|对照组|随机(?:抽样|分组)|同行评审|论文|期刊' +
  '|样本(?:量|数|来自|选择)|来源[:：]|证据(?:显示|表明|来自|链)|核查|核实|复核|审计' +
  '|统计(?:显示|数据|表明)|报告(?:显示|表明|指出)' +
  '|experiment(?:al|s)?\\s+(?:results?|data|evidence|group)|controlled|randomi[sz]ed|peer[- ]review|published|dataset|p\\s*<|confidence\\s+interval|replicat(?:ed|ion)|verified|source:|according\\s+to',
  'i'
);

// ─── 豁免三：概念转述（评析这套话术本身不是运用它）────────────────────
const META_EXEMPT_ZH = /(?:诉诸后果|后果谬误|后果论证|诉诸不利后果|诉诸不良后果|以后果(?:取代|替代|否定))/;
const META_EXEMPT_EN = /\b(?:appeal\s+to\s+consequences?|argumentum\s+ad\s+consequentiam|consequentialist\s+fallacy|fallacy\s+of\s+appealing\s+to\s+consequences)/i;

// ─── 豁免四：否定翻转（「后果严重不意味着命题为假」是正确的判别）────────
const NEGATION_FLIP_EXEMPT = new RegExp(
  '(?:不意味着|不代表|不等于|并不能说明|无法推出|推不出|说明不了)(?:.{0,12}(?:就是|一定|必然|肯定是)?(?:假|不成立|错))?' +
  '|(?:不能|无法)(?:因此|据此)(?:就)?(?:否定|推翻|断定|断言)' +
  '|does\\s+not\\s+mean|do\\s+not\\s+mean|doesn\\x27?t\\s+mean|does\\s+not\\s+imply|cannot\\s+(?:therefore|thus)\\s+(?:conclude|infer|dismiss)|so\\s+what',
  'i'
);

// ─── 豁免五：提问句式（求知/反问不是断言）────────────────────────────
const QUESTION_EXEMPT = /[?？]/;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToConsequences(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const CONSEQ_ZH_ = R.CONSEQ_ZH || CONSEQ_ZH;
  const CONSEQ_EN_ = R.CONSEQ_EN || CONSEQ_EN;
  const TDENY_ZH_ = R.TDENY_ZH || TDENY_ZH;
  const TDENY_EN_ = R.TDENY_EN || TDENY_EN;
  const HEDGE_EXEMPT_ = R.HEDGE_EXEMPT || HEDGE_EXEMPT;
  const EVIDENCE_EXEMPT_ = R.EVIDENCE_EXEMPT || EVIDENCE_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const NEGATION_FLIP_EXEMPT_ = R.NEGATION_FLIP_EXEMPT || NEGATION_FLIP_EXEMPT;
  const QUESTION_EXEMPT_ = R.QUESTION_EXEMPT || QUESTION_EXEMPT;

  // 概念转述：评析这套话术 / 谬误教学 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 提问句式：求知/反问不是断言
  if (QUESTION_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对冲：带对冲的后果陈述不断定真值
  if (HEDGE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 证据在场：有出处/可检验的评估不是本族
  if (EVIDENCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 否定翻转：承认后果严重但拒绝据此否定真值——正确的判别
  if (NEGATION_FLIP_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const conseqZh = CONSEQ_ZH_.test(text);
  const conseqEn = CONSEQ_EN_.test(text);
  const denyZh = TDENY_ZH_.test(text);
  const denyEn = TDENY_EN_.test(text);

  // 双腿共现：显式后果评估 × 真值否定/拒绝相信（缺一不判）
  if ((conseqZh || conseqEn) && (denyZh || denyEn)) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '诉诸后果×后果评估×真值否定(zh)' : 'appeal to consequences×consequence assessment×truth denial(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToConsequences,
  __internals: () => ({ CONSEQ_ZH, CONSEQ_EN, TDENY_ZH, TDENY_EN, HEDGE_EXEMPT, EVIDENCE_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN, NEGATION_FLIP_EXEMPT, QUESTION_EXEMPT }),
};
