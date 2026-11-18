/**
 * src/per-protocol-misread.js — 「按方案分析集误读」检测器
 * （r392 新建：econ_reasoning_gate 聚合族第 42 子族 / 插件层第 47 族，stats 组第 11 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r390 研究轮探针（scripts/round-389/probe-candidates2.js，合并树 HEAD b073743
 *   复跑）把 E per_protocol 列为下一轮 dimension 首选（3/3 全穿透、gate=pass），
 *   立项条件是与 healthy_user_bias（r372）做射程解剖。r392 立项探针
 *   （scripts/round-392/probe-per-protocol.js，合并树 HEAD 10adbf2 / v6.8.193
 *   基线）：
 *     · 攻击 11/18 穿透（真零命中：ZH 6/11 + EN 5/7；被代拦的 7 条分别由
 *       completion_evidence / fallacy_of_relevance+pseudo_causal /
 *       confirmatory_evidence / econ_reasoning_gate(healthy_user_bias 子族) /
 *       fallacy_of_relevance+relative_risk_individual_transfer / confidence 承重）；
 *     · 良性 21/25 基线通过（4 条非 pass 均系存量 perfect_error / fallacy_of_relevance
 *       误伤，非本族增量——本族模块尚未接线，这些是既有基线）；
 *     · 射程对照 1/7：proxy_metric_goal 攻击形（只统计点击广告的用户）存量零覆盖，
 *       但其射程属第 187 维（业务度量读数），本族腿①不收「点击/浏览」类非医疗
 *      语境，不越界代拦。
 *   海外扫描：arXiv 查询词被 OR 拆散返回无关条目（parse-fail）、GitHub repos
 *   total_count=0、S2 429 限流——空返，按既有形态自建（同 r386/r389 记录）。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自临床试验/流行病学标准论述：
 *   per-protocol analysis / per-protocol population（按方案分析 / 按方案分析集 /
 *   PP 分析）只纳入完成了方案、按时服药、没有脱落的受试者。随机对照试验的效力
 *   来自随机化本身——随机分配保证了各组基线可比；一旦把分析限定在「坚持下来的
 *   人」，组间比较就退化为自选择人群的比较（完成者 vs 完成者），依从性、预后、
 *   生活方式差异重新进入估计，疗效被系统性高估（这正是 r372 healthy_user_bias
 *   指出的混杂，只不过发生在试验内部）。国际规范（ICH E9 / CONSORT）因此规定
 *   意向性治疗分析（intention-to-treat, ITT）为主分析，按方案分析只能作辅助。
 *   把按方案集算出的效果直接兑现为「药物的真实效果/确凿疗效」即犯此误读。
 *
 * 辨别的族：按方案分析集误读（per-protocol analysis misread / completer-analysis
 *   leap）——文本同时给出两个信号：
 *     腿① POP 分析集限定锚在场——把分析对象限定在完成者/依从者：
 *            只统计/只分析/只纳入 + 按方案/完成疗程/坚持/按时服药 的（人群/患者/
 *            受试者/那部分）；排除/剔掉 不依从/中途停药/脱落 的受试者；按完成
 *            试验的人群分析；依从性好的那部分患者；只看坚持下来的；
 *            EN only counted/included those who completed/adhered/took as
 *            prescribed；excluding non-adherent participants；in the adherent
 *            subgroup；among completers；looking only at those who finished；
 *            restricting the analysis to adherent patients；per-protocol set；
 *     腿② EFFICACY 有效性兑现结论在场——把该限定集的结果直接兑现为药物的
 *            真实/确切/确凿疗效：效果非常确凿、疗效可靠/过硬、这就是药物的
 *            真实效果、说明药物确实有效、足见药效过硬；
 *            EN the drug clearly worked / proving its efficacy / which is the
 *            real effect / the treatment clearly works / outcome improvement
 *            is substantial。
 *   两腿近距共现（以腿②为锚，腿①须落窗内：ZH 45 字 / EN 150 字符），方向不限。
 *
 * 与 r389（替代终点误读）的判据差异（设计决策）：本族**不强制推断标记**——
 *   腿②词表自身即「有效性兑现」结构（确凿/真实/确切/证明有效/clearly worked），
 *   分析集限定与疗效兑现的共现本身就是推断（「只统计完成者 → 疗效确凿」）。
 *   r389 需要推断标记是因为其腿②（硬终点获益）可以是并列实测陈述；本族腿②
 *   全部限定在兑现形，中性报告（「疗效显著」「风险下降一半」「结局更好」）天然
 *   不判——良性边界实测 21/25 基线通过即靠这道闸。
 *
 * 与既有维度的边界（r392 归因，探针 + 边界实测）：
 *   · healthy_user_bias（r372）：腿①锁定**自选择健康行为群体**（吃维生素的人/
 *     补充剂使用者/regular joggers）、腿②锁定**健康结果归因**（让人健康/延寿/
 *     proves/protects）；本族腿①锁定**试验分析集限定操作**（只统计/排除/按方案
 *     集/依从者亚组）、腿②锁定**试验疗效兑现**（真实疗效/确凿/药物确实有效）。
 *     交集句可双触发（r379 union 先例：如「只纳入按时服完药的受试者，测出的
 *     疗效才是真实水平」实测被 healthy_user_bias 承重），本族独家覆盖的是
 *     「分析集操作 × 疗效兑现」形——攻击集 11/18 穿透实证存量零覆盖；
 *   · confounding_by_indication（r339）：治疗分配由基线预后驱动（重症才用新药）
 *     的混杂，不讲分析集限定；selection_bias / self_selection_bias：抽样框错误，
 *     不讲随机化破坏机制；
 *   · survivor_time_bias / immortal_time_bias：时间零点错分类，不讲依从人群
 *     条件化；
 *   · proxy_metric_goal（第187维）：业务度量读数（KPI/点击率/覆盖率），本族
 *     腿①不收「点击广告的用户」类非医疗语境（探针射程对照 1/7 实证不越界）；
 *   · significance_verdict_misread（r387）/ effect_measure_misread（r386）/
 *     censoring_neglect（r388）/ surrogate_endpoint_misread（r389）：显著性
 *     裁定 / OR-HR 口径 / 删失随访 / 替代终点兑换，均不以「分析集限定 × 疗效
 *     兑现」为射程。
 *
 * 判据（两腿近距共现 + 两组豁免 + 双腿守卫，缺一不判）：
 *   ① 腿① POP 分析集限定锚在场（受否定守卫：「不能只看坚持服药的人」是对冲形；
 *      排除形从「排除」起匹配，「不依从」在匹配内部，不受前置守卫误杀）；
 *   ② 腿② EFFICACY 有效性兑现结论在场（受紧前否定/对冲双守卫：「并不能说明
 *      药物有效」「不等于真实效果」是对冲形）；
 *   ③ 两腿落在邻近窗内（以腿②为锚，ZH 45 字 / EN 150 字符，方向不限）；
 *   ④ 豁免 A 概念讨论（按方案分析/per-protocol 被点名 + 教学/批评框架词共现，
 *      防前缀绕过）；
 *   ⑤ 豁免 B 正确方法论（意向性治疗为主分析/按方案只能作辅助/两套分析集一致）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观报告分析集构成（「完成了半年随访的受试者
 * 共320人」——腿②缺省天然排除）。命中的是把完成者子集的效果兑现为药物真实疗效
 * 的断言。verify 的语义是「这段文本拿按方案集的结果当成了药物真实疗效的证明，
 * 先确认主分析是否为意向性治疗分析、按方案集是否只作辅助，再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性报告（疗效显著/风险下降一半/结局更好/血压下降更明显）——腿②缺省；
 *   · 概念教学与批评句（所谓按方案分析是指……它会高估疗效 / per-protocol
 *     analysis means counting only completers）——豁免 A；
 *   · 正确方法论句（意向性治疗才是主分析，按方案只能作辅助；两套分析集结果
 *     一致）——豁免 B；
 *   · 锚前否定句（不能只看坚持服药的人，还要看全体受试者）——腿①否定守卫；
 *   · 对冲形（只统计依从者会高估药效，这是已知缺陷）——腿①在、腿②缺省 +
 *     豁免 A 纵深；
 *   · confounding_by_indication / proxy_metric_goal / healthy_user_bias 领地。
 */

'use strict';

// ─── 腿① POP 分析集限定锚（中文）───────────────────────────
// P1 限定动词形：只/仅 + 统计/分析/纳入/看 + … + 完成/坚持/依从/按方案/按时 +
//   … + 群体名词。限定动词前置是「分析集被限定」的最强信号。
const POP_ZH_P1 = /(?:只|仅|仅仅|单独|唯)[^。！？，；\n]{0,6}(?:统计|分析|计算|纳入|计入|考察|评估|看|算|保留)[^。！？，；\n]{0,12}(?:按方案|完成|坚持|依从|按时|服完|吃完|走完|全程|整个方案)[^。！？，；\n]{0,10}(?:的)?(?:人群|患者|受试者|病人|群体|那部分|那些|样本|数据|组|亚组)/;
// P2 完成者 shorthand：只/仅 + 看/算/统计 + … + 坚持/完成/依从 + (下来/到底/者/
//   的人)。「只看坚持下来的」「只统计依从者」。
const POP_ZH_P2 = /(?:只|仅|仅仅)(?:看|算|统计|保留|计|考虑)[^。！？，；\n]{0,6}(?:坚持|完成|依从|遵医嘱)(?:下来|到底|者|的人|的人群|服药的人|用药的人)/;
// P3 排除形（动词先）：排除/剔除/去掉/撇开/不纳入 + … + 不依从/未完成/脱落/退出/
//   停药 + … + 受试者/患者/数据。从「排除」起匹配，「不依从」在匹配内部。
//   关键词与群体名词之间留 ≤6 字间隙（「剔除未完成方案的患者」「排除中途停药的
//   受试者」——r392 实测补：无间隙则「未完成方案的患者」静默漏判）。
const POP_ZH_P3 = /(?:排除|剔除|排除掉|剔除掉|去掉|删掉|撇开|不纳入|不予纳入)(?:了|掉)?(?:那些|所有|全部|中途|中途的)?[^。！？，；\n]{0,12}(?:不依从|未完成|没完成|未坚持|脱落|退出|失访|停药|中途停药|不耐受|中止)[^。！？，；\n]{0,6}(?:的)?(?:受试者|患者|人群|数据|样本|个案)/;
// P3b 排除形（组先）：不依从/未完成/… + (的)? + 人/患者/受试者 + (都|全|全部)? +
//   剔掉/排除/去掉。「把中途停药的人都剔掉」「不依从的受试者全部排除」。
const POP_ZH_P3B = /(?:不依从|未完成|没完成|未坚持|脱落|退出|失访|停药|中途停药|不耐受|中止)(?:的)?(?:人|患者|受试者|数据|样本|个案)(?:都|全|全部)?(?:被)?(?:剔掉|剔除|排除|去掉|删掉|清除)/;
// P4 脱落不管形：退出/脱落 + … + 人/患者 + … + 不用管/不用看/不必考虑/不管/
//   不计。「退出试验的人不用管」。
const POP_ZH_P4 = /(?:退出|脱落|失访|停药|中止|中断)[^。！？，；\n]{0,10}(?:的)?(?:人|患者|受试者|数据|样本)[^。！？，；\n]{0,8}(?:不用管|不用看|不必考虑|无需考虑|不予考虑|不管|不计|不重要|可以忽略)/;
// P5 按…人群分析形：按/按照/依据/根据 + 完成/坚持/依从/按方案 + … + 群体名词 +
//   分析/统计/看（动词必须尾随——「按完成试验的人群的基线特征」不判）。
//   r392 实测补：「按照完成试验的受试者来分析」的「按照」前缀。
const POP_ZH_P5 = /(?:按|按照|依据|根据)(?:完成|坚持|依从|遵医嘱|按方案)[^。！？，；\n]{0,10}(?:人群|患者|受试者|样本|数据|那部分)(?:来)?(?:分析|统计|计算|评估|考察|看)/;
// P5b 按方案集分析形：按/按照 + 方案集/方案分析集/符合方案集 + 分析/统计/看。
//   「按方案集分析显示风险下降明显」——r392 实测补。
const POP_ZH_P5B = /(?:按|按照|依据|根据)(?:方案集|方案分析集|符合方案集)(?:来)?(?:分析|统计|计算|评估|考察|看)/;
// P6 依从性好的那部分：依从性 + 好/佳/高/强 + (的)?(那部分/那些)?(患者/受试者/
//   人群)。（含可选的 服药/用药 前缀：「服药依从性高的患者」。）
const POP_ZH_P6 = /(?:服药|用药|治疗|方案)?依从性(?:好|佳|高|强|较好|更高)(?:的)?(?:那部分|那些)?(?:患者|受试者|人群|病人)/;
// P7 完成全程/整个方案的那一组：完成(了)? + (全程|全部|整个|完整)? + 方案/疗程/
//   治疗/试验/研究/随访 + (的)?(那)?(一)?(组|患者|受试者|人群)。
const POP_ZH_P7 = /完成(?:了)?(?:全程|全部|整个|完整)?(?:方案|疗程|治疗|试验|研究|随访)(?:的)?(?:那)?(?:一)?(?:组|患者|受试者|人群)/;
// P8 按时/规律 + 服药/用药/服完 + (的)?(受试者|患者|人群)。
const POP_ZH_P8 = /(?:按时|规律|依医嘱)(?:服药|用药|吃完|服完)(?:的)?(?:受试者|患者|人群)/;
// P9 坚持 + (完成|按时|规律)? + 随访/服药/用药/治疗 + (的)?(患者|受试者|人群)。
const POP_ZH_P9 = /坚持(?:完成|按时|规律)?[^。！？，；\n]{0,6}(?:随访|服药|用药|治疗)(?:的)?(?:患者|受试者|人群)/;

// ─── 腿① POP（英文）───────────────────────────────────────
// i flag：gate 路径文本经 text-normalizer 英文小写化（v6.7.73），大小写不敏感
//   才可达（r386 同款教训：裸大写锚在 normalize 小写化后静默穿透）。
// G1 限定动词形：only/just + counted/included/analyzed/looked + … + who/that +
//   … + completed/adhered/took as prescribed（interior 捕获组：腿①否定守卫查
//   who 与动词之间，「those who did not adhere」不判）。
const POP_EN_G1 = /\b(?:only|just)\s+(?:counted|count|included|include|analy[sz]ed|analy[sz]ing|looked|look|considered|consider|examined|retained|kept|those|the ones)\b([^.]{0,40}?)\b(?:who|that)\b([^.]{0,30}?)\b(?:completed|finished|adhered|took|taking|followed|stuck|complied|remained|prescribed)\b/i;
// G2 在场形：patients/participants/those who completed/finished/adhered（interior
//   捕获组同 G1）。
const POP_EN_G2 = /\b(?:patients|participants|subjects|individuals|those|people)\s+(?:who|that)\s+([^.]{0,20}?)(?:completed|finished|adhered|took|taking|followed|stuck|complied|remained)\b/i;
// G3 排除形：excluding/removing/dropping + … + non-adherent / dropouts / those
//   who stopped or quit。
const POP_EN_G3 = /\b(?:exclud\w+|remov\w+|drop\w+|eliminat\w+|discard\w+)\b[^.]{0,40}?\b(?:non-adherent|non-adher\w+|non-compliant|noncompliant|dropouts?|those who (?:stopped|quit|discontinued)|withdrew|withdrawals)\b/i;
// G4 亚组在场形：in/among the adherent|compliant|completer|per-protocol
//   subgroup|group|population|set + among completers/adherers。
const POP_EN_G4 = /\b(?:in|among|within|for)\s+the\s+(?:adherent|compliant|completer|per-protocol)\s+(?:subgroup|group|population|cohort|patients|participants|subjects|set)\b|\b(?:among|in)\s+(?:completers|adherers|adherents)\b/i;
// G5 per-protocol set/population/analysis 直接在场。
const POP_EN_G5 = /\bper[- ]protocol\s+(?:analysis|set|population|group|subgroup|cohort)\b/i;
// G6 restricting the analysis to + adherent/compliant/completer。
const POP_EN_G6 = /\brestricting\s+(?:the\s+)?(?:analysis|sample|cohort)\s+to\s+(?:adherent|compliant|completer)\w*\b/i;

// ─── 腿② EFFICACY 有效性兑现结论（中文）──────────────────
// E1 确定性形容词 + 效果名词：效果/疗效/药效 + (非常|确实|依然|明显)? +
//   (确凿|确切|靠谱|可靠|过硬|理想|突出|明确)。
const EFF_ZH_E1 = /(?:效果|疗效|药效|效力)(?:非常|确实|的确|着实|依然|仍然|依旧|明显|显著)?(?:确凿(?:无疑)?|确切|靠谱|可靠|过硬|理想|突出|明确)/;
// E2 是/才是 + (药物)?的? + 真实/真正/实际/确切 + (水平|疗效|效果|药效)。
const EFF_ZH_E2 = /(?:疗效|药效|效果|效力)(?:才|即|便)?是(?:药物|新药|疗法|治疗)?的?(?:真实|真正|实际|确切)(?:水平|疗效|效果|药效|效力)?|(?:真实|真正|实际|确切)的?(?:疗效|效果|药效)/;
// E3 兑现动词 + 药物 + (确实)? + 有效/有用/管用/起作用。
const EFF_ZH_E3 = /(?:证明|足以证明|说明|表明|意味着|代表|印证|佐证|坐实|确立)(?:了)?(?:药物|新药|疗法|这种?药|治疗|本品)(?:确实|的确|真的|真正|明确)?(?:有效|有用|管用|起作用)/;
// E4 这就是/这才是/正是 + (药物)?的?(真实|真正|实际|确切)?(疗效|效果|药效)。
const EFF_ZH_E4 = /(?:这|那)(?:就是|才是|正是|即|代表了)(?:药物|新药|疗法|治疗)?的?(?:真实|真正|实际|确切)?(?:疗效|效果|药效)/;
// E5 治愈率/有效率 非常高 + 足见/可见 药效。「治愈率非常高，足见药效过硬」由
//   E1（药效过硬）承重，本形收「疗效/有效率 + 非常高」直接兑现形。
const EFF_ZH_E5 = /(?:治愈率|有效率|缓解率|应答率|显效率)(?:非常|相当|极高|特别)?(?:高|喜人|可观)/;

// ─── 腿② EFFICACY（英文）──────────────────────────────────
const EFF_EN = [
  // the drug clearly worked / the treatment clearly works / genuinely works
  /\b(?:the |this |its |their )?(?:drug|treatment|therapy|medication|medicine)\s+(?:really|truly|actually|clearly|genuinely|obviously|simply)?\s*(?:works?|worked|is effective|has a real effect)\b/i,
  // proving/demonstrating/confirming its (true|real) efficacy/effect
  /\b(?:proving|proves|demonstrating|demonstrates|confirming|confirms|establishing|establishes|showing|shows)\s+(?:its |the |their )?(?:true |real |actual |genuine )?(?:efficacy|effect|effectiveness)\b/i,
  // which/that is (its|the) (true|real|actual) effect
  /\b(?:which|that)\s+is\s+(?:its |the |their )?(?:true|real|actual|genuine)\s+(?:effect|efficacy)\b/i,
  // the outcome/result/improvement is substantial/significant/impressive/marked
  /\b(?:outcome|results?|effect|improvement|benefit)s?\s+(?:is|are|was|were)\s+(?:substantial|significant|impressive|marked|dramatic|robust|real)\b/i,
  // performed remarkably/exceptionally well
  /\b(?:drug|treatment|therapy)\s+performed\s+(?:remarkably|exceptionally|very)\s+well\b/i,
];

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 45;
const WINDOW_EN = 150;

// ─── 豁免 A：概念讨论（按方案分析/per-protocol 被点名 + 教学/批评框架词）────
// 概念名单独出现不豁免——必须与框架词共现，防前缀绕过（r368/r379/r386 同款教训）。
const CONCEPT_ZH = /(?:按方案(?:分析|集|人群|用药|服药)?|PP分析|符合方案集|完成者分析|依从者分析)[^。！？，；\n]{0,26}(?:是指|指|定义为|称作|称为|概念|理论|方法|所谓|意味着|代表着|会|就会|破坏|打破|损害|丧失|不再|不能|不可|不宜|不应|不得|不等于|并非|不代表|不意味着|不是|两回事|区别|区分|混淆|误读|误解|误区|错误|谬误|缺陷|问题|陷阱|误导|夸大|高估|偏差|偏倚|局限|争议|批评|质疑|教科书|文献|论文|定义|讨论|说明|揭示|反映)|(?:是指|指|定义为|称作|称为|所谓|概念|方法|理论|破坏|打破|丧失|不再|不能|不可|不等于|并非|不代表|不意味着|混淆|误读|误解|误区|错误|谬误|缺陷|高估|夸大|偏倚|偏差|局限|争议|批评|质疑|教科书|文献|论文|讨论)[^。！？，；\n]{0,26}(?:按方案(?:分析|集|人群)?|PP分析|符合方案集|完成者分析|依从者分析)/;
const CONCEPT_EN = /\bper[- ]protocol\s+(?:analysis|set|population|group|subgroup|cohort)\b[^.]{0,110}?\b(?:means?|refers?|describes?|is|are|was|were|breaks?|broke|destroys?|destroyed|undermines?|undermined|violates?|violated|overstates?|overstated|inflates?|inflated|exaggerates?|exaggerated|biased|distorted|misread|misinterpret\w+|confus\w+|misconception|fallacy|common mistake|mistaken|myth|pitfall|caveat|limitation|problem|issue|textbook|literature|paper|study|example|instance|should not|cannot|can'?t|not sufficient|only as|secondary|supportive|adjunct|sensitivity)\b|\b(?:means?|refers?|describes?|called|known as|breaks?|destroys?|undermines?|violates?|overstates?|inflates?|exaggerates?|confounds?|confounds|misread|misinterpret\w+|should not|cannot|can'?t|not sufficient)\b[^.]{0,110}?\bper[- ]protocol\b/i;

// ─── 豁免 B：正确方法论（ITT 主分析 / 按方案只作辅助 / 两套分析集一致）──
const CORRECT_ZH = [
  // 意向性治疗/ITT + 才是/为主/为准/主要/首要/应/必须/保留
  /(?:意向性治疗|意向治疗|ITT|itt)[^。！？，；\n]{0,16}(?:才是|才为|为主|为准|主要|首要|首选|标准|规范|应当|应该|必须|保留|保全|保住|是主|为首)/,
  // 按方案/PP + 只能/仅能/辅助/次要/参考/敏感性/不能/不可/不宜/不足以
  /(?:按方案|PP分析|符合方案集|完成者分析)[^。！？，；\n]{0,16}(?:只能|仅能|只可|辅助|次要|参考|补充|敏感性|支持性|二线|不能|不可|不宜|不应|不得|不足以|无法)(?:作为|单独|直接)?(?:主要)?(?:证据|结论|疗效证据|依据|证明|分析)?/,
  // 两套分析集一致：按方案/PP + (与|和|跟)? + 意向性治疗/ITT + 一致/相符/接近
  /(?:按方案|PP分析|符合方案集)[^。！？，；\n]{0,20}(?:与|和|跟|同)?(?:意向性治疗|意向治疗|ITT)[^。！？，；\n]{0,8}(?:一致|相符|相同|接近|吻合|类似)/,
  /(?:意向性治疗|意向治疗|ITT)[^。！？，；\n]{0,20}(?:与|和|跟|同)?(?:按方案|PP分析|符合方案集)[^。！？，；\n]{0,8}(?:一致|相符|相同|接近|吻合|类似)/,
  // 随机化保住/不可破坏
  /(?:随机化|随机分组|随机分配)[^。！？，；\n]{0,10}(?:不可|不能|不应|不得|不可)[^。！？，；\n]{0,6}(?:破坏|打破|牺牲|放弃)/,
];
const CORRECT_EN = [
  // intention-to-treat 是主分析
  /\b(?:intention[- ]to[- ]treat|ITT)\b[^.]{0,60}?\b(?:is|remains?|should be|must be|preserves?|keeps?)\b[^.]{0,20}?\b(?:primary|main|standard|gold|preferred|preserves?|keeps?|randomi[sz]ation)\b/i,
  // per-protocol 只作辅助/次要
  /\bper[- ]protocol\b[^.]{0,60}?\b(?:secondary|supportive|adjunct|sensitivity|supplementary|complementary|should not|cannot|can'?t|must not|not sufficient|only as|supportive only)\b/i,
  // 两套分析一致
  /\b(?:ITT|intention[- ]to[- ]treat)\b[^.]{0,50}?\b(?:agree|agreed|consistent|concordant|similar|matched|aligned)\b/i,
  /\bper[- ]protocol\b[^.]{0,50}?\b(?:agree|agreed|consistent|concordant|similar|matched|aligned)\b/i,
  // randomization preserved / not broken
  /\brandomi[sz]ation\b[^.]{0,40}?\b(?:preserved|maintained|intact|kept)\b/i,
];

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    // inter：第一个捕获组（腿①否定守卫只查 interior——who 与动词之间的
    //   「did not」；r389 同款定位法，不可查整条 raw，否则误杀匹配内部自带
    //   否定词的形）
    const inter = m[1] !== undefined ? m[1] : '';
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0], inter });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 腿②守卫（r375/r377-r389 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，含否定即
//   「并不能说明药物有效」「不等于真实效果」纠正形）+ 对冲短语（腿②前后出现
//   「不意味着/误解/高估」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是|不等于|并非|未必|不一定|高估|夸大|夸大其词|虚高|吹嘘|夸大疗效|待验证|有待|还需|仍待|尚未确认|有待确认|不能确定|无法确定|不好说|待进一步|有待进一步)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|misinterpret\w*|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same|overstates?|overstated|inflates?|inflated|exaggerat\w+)/i;

// 腿①否定守卫：匹配前紧前窗内的否定词（ZH 4 字 / EN 14 字符）——「不能只看坚持
//   服药的人」是对冲形；排除形从「排除」起匹配、「不依从」在匹配内部，不受误杀。
//   interior 捕获组另查 who 与动词之间的 EN 否定（「those who did not adhere」）。
const NEG1_ZH = /(?:并不|并未|并不能|绝不能|不能|不可|不应|不宜|不用|无须|无需|勿|别|没|无|非|未)/;
const NEG1_EN = /\b(?:not|never|cannot|can'?t|shouldn'?t|mustn'?t|without|no|didn'?t|doesn'?t|failed\s+to|unable\s+to)\b/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
  const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
  const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
  const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
  const neg1Zh = (R && R.NEG1_ZH !== undefined) ? R.NEG1_ZH : NEG1_ZH;
  const neg1En = (R && R.NEG1_EN !== undefined) ? R.NEG1_EN : NEG1_EN;
  const negZhList = Array.isArray(negZh) ? negZh : [negZh];
  const negEnList = Array.isArray(negEn) ? negEn : [negEn];
  const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
  const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
  const neg1ZhList = Array.isArray(neg1Zh) ? neg1Zh : [neg1Zh];
  const neg1EnList = Array.isArray(neg1En) ? neg1En : [neg1En];
  const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
  const beforeEn = text.slice(Math.max(0, x.idx - 20), x.idx);
  const afterZh = text.slice(x.end, x.end + 20);
  const afterEn = text.slice(x.end, x.end + 40);
  if (opts.leg1) {
    // 腿①否定守卫：紧前窗（「不能只看坚持服药的人」）+ interior 捕获组
    //   （EN「those who did not adhere」的否定落在 who 与动词之间）。
    const gap = text.slice(Math.max(0, x.idx - 4), x.idx);
    const gapEn = text.slice(Math.max(0, x.idx - 14), x.idx);
    for (const re of neg1ZhList) { if (re && re.test && re.test(gap)) return false; }
    for (const re of neg1EnList) { if (re && re.test && re.test(gapEn)) return false; }
    const inter = x.inter !== undefined ? x.inter : '';
    if (inter) {
      for (const re of neg1EnList) { if (re && re.test && re.test(inter)) return false; }
    }
    return true;
  }
  for (const re of negZhList) { if (re && re.test && re.test(beforeZh)) return false; }
  for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
  for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
  for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp 或数组。统一成数组供消费（r385-r389 同款）。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  if (Array.isArray(def)) return def;
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

// 签名收集：腿②疗效兑现为锚（窗内），腿①分析集限定锚在场，方向不限。
//   两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      pop: [
        ..._normInject(R.POP_ZH_P1, POP_ZH_P1), ..._normInject(R.POP_ZH_P2, POP_ZH_P2),
        ..._normInject(R.POP_ZH_P3, POP_ZH_P3), ..._normInject(R.POP_ZH_P3B, POP_ZH_P3B), ..._normInject(R.POP_ZH_P4, POP_ZH_P4),
        ..._normInject(R.POP_ZH_P5, POP_ZH_P5), ..._normInject(R.POP_ZH_P5B, POP_ZH_P5B), ..._normInject(R.POP_ZH_P6, POP_ZH_P6),
        ..._normInject(R.POP_ZH_P7, POP_ZH_P7), ..._normInject(R.POP_ZH_P8, POP_ZH_P8),
        ..._normInject(R.POP_ZH_P9, POP_ZH_P9),
      ],
      eff: [
        ..._normInject(R.EFF_ZH_E1, EFF_ZH_E1), ..._normInject(R.EFF_ZH_E2, EFF_ZH_E2),
        ..._normInject(R.EFF_ZH_E3, EFF_ZH_E3), ..._normInject(R.EFF_ZH_E4, EFF_ZH_E4),
        ..._normInject(R.EFF_ZH_E5, EFF_ZH_E5),
      ],
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      pop: [
        ..._normInject(R.POP_EN_G1, POP_EN_G1), ..._normInject(R.POP_EN_G2, POP_EN_G2),
        ..._normInject(R.POP_EN_G3, POP_EN_G3), ..._normInject(R.POP_EN_G4, POP_EN_G4),
        ..._normInject(R.POP_EN_G5, POP_EN_G5), ..._normInject(R.POP_EN_G6, POP_EN_G6),
      ],
      eff: [..._normInject(R.EFF_EN, EFF_EN)],
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 腿①受否定守卫（「不能只看坚持服药的人」对冲形 / who 间否定）
    const popM = collect(text, L.pop, { leg1: true }, R);
    if (popM.length === 0) continue;
    // 腿②受紧前否定/对冲双守卫
    const effM = collect(text, L.eff, {}, R);
    if (effM.length === 0) continue;
    for (const b of effM) {
      const a = popM.find(x => dist(x, b) <= L.win);
      if (!a) continue;
      sigs.push({ lang: L.lang, pop: a.raw, eff: b.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.pop + '|' + s.eff;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 按方案分析集误读签名：分析集限定锚 × 有效性兑现结论 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPerProtocolMisread(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（讨论按方案分析/per-protocol 概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确方法论（意向性治疗为主分析/按方案只作辅助/两套分析集一致）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.66;
  return {
    hit: true,
    dimension: 'per_protocol_misread',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '分析集限定「' + x.pop + '」× 疗效兑现「' + x.eff + '」（按方案分析集误读）'
      : 'analysis-set restriction "' + x.pop + '" x efficacy claim "' + x.eff + '" (per-protocol misread)')),
    details: s.lang === 'zh'
      ? '按方案分析集误读(' + sigs.length + '处: 把「' + s.pop + '」限定集算出的结果直接兑现为「' + s.eff + '」——按方案集破坏了随机化，完成者子集的效应不等于药物的真实疗效)(zh)'
      : 'per-protocol misread(' + sigs.length + 'x: the result of the restricted set "' + s.pop + '" is cashed out as "' + s.eff + '" — restricting to completers/adherers breaks randomization, and the completer-subgroup effect is not the drug\'s true effect)(en)',
    guidance: '按方案分析集误读（per-protocol analysis misread / completer-analysis leap）：随机对照试验的效力来自随机化本身——随机分配保证了各组基线可比。一旦把分析限定在「只统计按方案用药/完成全程/没有脱落」的受试者，组间比较就退化为自选择人群的比较（能坚持的人 vs 能坚持的人），依从性、基线预后、生活方式差异重新进入估计，疗效被系统性高估。国际规范（ICH E9 / CONSORT）因此规定意向性治疗分析（intention-to-treat, ITT）为主分析，按方案分析（per-protocol / PP 分析集）只能作辅助或敏感性分析。请把这类结论改回主分析口径：明确主分析是意向性治疗分析（「本研究的主分析为 ITT，按方案集结果仅作参考」）、指出按方案集与 ITT 的差异及其偏倚方向（「只统计完成者会高估疗效」）、把疗效结论限定在 ITT 框架下（「在意向性治疗分析中风险下降 X%」）、或显式说明按方案集只反映依从者亚组（「该结果仅适用于完成全程治疗的人群，不能外推到全部入组者」）。正确做法还包括：报告两套分析集并说明差异（「按方案集与 ITT 结果一致/不一致，差异方向为……」）、指出脱落患者的后续结局未知需保守处理。若这段话只是客观报告分析集构成（「完成了半年随访的受试者共320人」）或并列陈述两套分析的结果，那是正当的报告方式，无需修改。',
    tags: ['statistics', 'statistical-literacy', 'clinical-trials', 'per-protocol-analysis', 'intention-to-treat', 'randomization', 'selection-bias', 'epidemiology', 'evidence-interpretation', 'inference'],
  };
}

module.exports = {
  detectPerProtocolMisread,
  __internals: () => ({
    POP_ZH_P1, POP_ZH_P2, POP_ZH_P3, POP_ZH_P3B, POP_ZH_P4, POP_ZH_P5, POP_ZH_P5B, POP_ZH_P6, POP_ZH_P7, POP_ZH_P8, POP_ZH_P9,
    POP_EN_G1, POP_EN_G2, POP_EN_G3, POP_EN_G4, POP_EN_G5, POP_EN_G6,
    EFF_ZH_E1, EFF_ZH_E2, EFF_ZH_E3, EFF_ZH_E4, EFF_ZH_E5, EFF_EN,
    WINDOW_ZH, WINDOW_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN, NEG1_ZH, NEG1_EN,
    findSignatures,
  }),
};
