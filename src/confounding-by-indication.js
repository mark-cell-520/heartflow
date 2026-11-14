/**
 * src/confounding-by-indication.js — 「适应证混杂」检测器
 * （r339 新建：econ_reasoning_gate 聚合族第 19 子族）
 *
 * 背景（真升级类型②：聚合族全新子家族）：
 *   r339 立项探针（coordination/agent4/probes/r339-probe-candidates.js，
 *   集成树 v6.8.185 hf.gate() 全量 findings 口径）五候选定夺——
 *     · A 禀赋/处置效应新措辞：攻击 5/7 穿透但良性 3/4（1 条被存量
 *       维度误拦），放弃；
 *     · B 适应证混杂：攻击 5/5 完全穿透、良性 4/4 零误伤 → **胜出**；
 *     · C 筛查悖误读：1/5（reverse_causation/perfect_error 已代拦
 *       大半），放弃；D omission/status quo：0/5 全覆盖，放弃；
 *     · E effort justification：3/5 部分覆盖，放弃。
 *   外部来源：空返，按既有形态自建。r339 海外扫描（原始证据
 *   coordination/agent4/scout/*20261114-175632*）：arXiv 查询词被 OR
 *   拆散返回无关条目、GitHub repos 0 命中、Semantic Scholar 429
 *   空返。判据为心虫自有纯规则实现，家族定义取自因果推断标准描述：
 *   confounded by indication / confounding by indication——治疗分配
 *   由基线预后驱动（重症才用新药）时，组间粗结局率差异反映的是基线
 *   风险而非治疗效应。
 *
 * 辨别的族：适应证混杂（confounding by indication / 指征混杂）——
 * 文本先给出**治疗分配由基线风险驱动的在场指称**（用新药的都是重症 /
 * 病情重的医生才敢开 / 接受治疗的患者本身预后更差 / patients who
 * received the drug were the sickest），再给出**把组间结局差异直接
 * 归因于治疗的断言**（所以新药反而有害 / 可见该药无效 / so the
 * therapy must be dangerous）：
 *   用新药的都是重症患者，所以新药组死亡率更高，这证明新药反而有害。
 *   病情重的医生才敢开这个疗法，结果用了疗法的病人死得更多，可见疗法有问题。
 *   The patients who received the new drug were the sickest ones, so the
 *   higher death rate proves the drug is harmful.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：疗效比较是循证
 * 决策的地基，而适应证混杂是它最常见的腐蚀方式——先给出一个真实的
 * 用药事实（重症确实更多地用新药），再把由此产生的结局差异当成治疗
 * 有害/有效的证据。它的毒性在于它伪装成「数据说话」：粗死亡率、
 * 痊愈率、并发症率全部现成，唯独缺了「两组本来就可比」这一步。
 * 与正当推理的界线很清楚：指出需要随机化/分层/调整基线的方法论
 * 陈述、把差异归因于基线风险本身的纠正句、或点名这是适应证混杂，
 * 都是正当做法，一律豁免。
 *
 * 与既有维度的边界（r339 归因，探针 + 边界实测）：
 *   · common_cause（174）判**两变量相关源于共同原因**——不涉治疗
 *     分配结构，无「重症多用某疗法的选择性分配」腿；
 *   · reverse_causation（172）判**因果方向倒置**（B 导致 A 说成
 *     A 导致 B）——本族方向不倒置，错在组间不可比；
 *   · selection_on_dependent_variable（252，同聚合桥 stats 族）
 *     判**按结果/因变量选择样本**（只看活下来的案例）——本族按
 *     **基线预后**选择进哪一组，选择变量在治疗之前；
 *   · selection_bias（168）判**样本进入研究的概率与暴露/结局
 *     相关**的广义选择偏误——本族射程窄：治疗组与非治疗组的基线
 *     风险非均衡 + 粗结局差异被归因于治疗，双腿结构缺一不判；
 *   · survivorship_bias / survivor_time_bias 判**只看存活者**——
 *     本族不要求任何存活/筛选结构。
 *
 * 判据（双腿近距共现 + 三组豁免 + 否定/对冲守卫，缺一不判）：
 *   ① 腿① SELECTION 治疗分配由基线风险驱动在场——ZH 四组 / EN 四组
 *      （详见下方常量）：选择性分配动词族、治疗×重症人群描述族、
 *      重症×治疗反向族、基线差异陈述族；EN received-were-sickest /
 *      prescribe-only-in-severe / sicker-patients-received /
 *      had-worse-baseline 族；
 *   ② 腿② CAUSAL 结局差异×治疗因果断言——ZH 四组 / EN 四组：推断
 *      标记×裁决族、证实词×治疗×裁决族、治疗×裁决无标记族、结局
 *      差异族；EN so-therapy-harmful / proves-drug-unsafe /
 *      drug-is-ineffective / mortality-rates-higher 族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 双腿查强否定前缀守卫（「无法证明新药有害」= 否定断言 → 失配）；
 *   ⑤ 腿②查对冲守卫（「可能是指征混杂」= 正确限定 → 该匹配作废）；
 *   ⑥ 豁免 A 概念教学（适应证混杂/因果推断/confounding by indication
 *      等方法论讨论）；⑦ 豁免 B 纠正句（随机化/分层/调整基线/倾向
 *      评分/不能据此比较——正确指出组间不可比）；⑧ 豁免 C 概念词
 *      与纠正词同句共现时的元陈述（含 confound 词根的句子本身在
 *      讨论混杂，不判）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次他人的疗效比较
 * （「主管认为新药组死得多所以新药有害」是事实陈述），也可能是
 * 描述一个待验证的观察。verify 的语义是「这段文本把基线风险非均衡
 *  两组间的粗结局差异归因于治疗，先核对两组的基线可比性与调整
 *  方法，再决定是否采信这个疗效判断」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 正确方法论陈述（需要按基线风险分层/随机化后才能比较疗效；
 *     we adjusted for baseline severity）；
 *   · 概念教学（适应证混杂是因果推断文献记载的偏误来源）；
 *   · 正确归因纠正句（死亡率差异可能是指征混杂而非药物效应；
 *     mortality differences may reflect prognosis, not harm）；
 *   · 无因果断论的客观用药描述（医生说这种药只用于重症，这是
 *     合理的用药规范——只有腿①没有腿②）；
 *   · 近邻维度领地（common_cause / reverse_causation /
 *     selection_on_dependent_variable / selection_bias）。
 */
'use strict';

// ─── 腿① SELECTION 治疗分配由基线风险驱动在场 ───────────────────
// S1 选择性分配动词族（只用/只给/只用于/主要用于/多用于/优先用于/
//    才用于/留给/保留给/倾向于给/才给/才敢给/才开/多开给）。
const SELECT_VERB_ZH = /(?:只用|只给|只用于|只用在|主要用于|多用于|优先用于|一般用于|常规用于|往往用于|常用于|才用于|留给|保留给|倾向于给|习惯于给|才会给|才给|才敢给|才开|多开给|常开给|优先给|多给)[^。，！？；\n]{0,14}(?:重症|危重|重病|病得重|病情重|病情更重|病情较重|严重|高危|高风险|预后差|预后更差|晚期|虚弱|合并症多|老年|病重)/;
// S2 治疗×重症人群描述族（用新药的都是重症/接受新疗法的多为危重）。
const SELECT_TREAT_SEV_ZH = /(?:用|使用|采用|接受|分到|入组|开|服用|注射)[^。，！？；\n]{0,8}(?:的)?(?:新药|新疗法|该药|该疗法|这种治疗|这种疗法|本方案|疗法|药物|方案|干预|手段|措施|治疗)[^。，！？；\n]{0,10}(?:的)?(?:都|多|大多|往往|通常|一般|多数)?(?:是|为|属于)?[^。，！？；\n]{0,8}(?:重症|危重|重病|病情重|病情更重|严重|高危|高风险|预后差|预后更差|晚期|虚弱|合并症多|年龄更大)/;
// S3 重症×治疗反向族（病情越重越倾向用新方案/病得越重医生才越敢开）。
const SELECT_SEV_TREAT_ZH = /(?:病情|病得|疾病|症状|身体|患者|重症|危重|重病)[^。，！？；\n]{0,8}(?:越)?(?:重|严重|差|危重|更重|复杂)[^。，！？；\n]{0,14}(?:越|更|才|往往|更容易|更可能|大多|通常|倾向)[^。，！？；\n]{0,10}(?:用|使用|采用|开|选择|考虑|推荐|倾向)[^。，！？；\n]{0,8}(?:新药|新疗法|该药|该疗法|这种|这个|该|本|新)?(?:药|疗法|治疗|方案|手段|干预|措施)|越[^。，！？；\n]{0,6}(?:严重|危重|重|复杂|差)[^。，！？；\n]{0,14}(?:越|更|才|往往|更容易|更可能|大多|通常|倾向)[^。，！？；\n]{0,10}(?:用|使用|采用|开|选择|考虑|推荐|倾向)[^。，！？；\n]{0,8}(?:新药|新疗法|该药|该疗法|这种|这个|该|本|新)?(?:药|疗法|治疗|方案|手段|干预|措施)/;
// S4 基线差异陈述族（接受这种治疗的患者本身预后更差/服用新药的患者
//    平均基线风险更高）。
const SELECT_IMBALANCE_ZH = /(?:接受|使用|用上|采用|分到|分配到|入组|服用|注射)[^。，！？；\n]{0,12}(?:新药|新疗法|该药|该疗法|这种治疗|这种疗法|本方案|疗法|药物|方案|干预|手段|治疗)[^。，！？；\n]{0,10}(?:的)?(?:患者|病人|人群|受试者|病例|小组|一组|这一组)[^。，！？；\n]{0,16}(?:本身|往往|通常|大多|多数|普遍|平均|平均而言)?[^。，！？；\n]{0,10}(?:病情|预后|风险|严重程度|身体状况|基线|年龄|体质)[^。，！？；\n]{0,10}(?:更|越|较|最为|特别|明显)?(?:重|差|高|弱|糟糕|不良|大)/;

const SELECTION_ZH_GROUPS = [
  ['SELECT_VERB_ZH', [SELECT_VERB_ZH]],
  ['SELECT_TREAT_SEV_ZH', [SELECT_TREAT_SEV_ZH]],
  ['SELECT_SEV_TREAT_ZH', [SELECT_SEV_TREAT_ZH]],
  ['SELECT_IMBALANCE_ZH', [SELECT_IMBALANCE_ZH]],
];
const SELECTION_ZH = [SELECT_VERB_ZH, SELECT_TREAT_SEV_ZH, SELECT_SEV_TREAT_ZH, SELECT_IMBALANCE_ZH];

// E1 patients who received … were the sickest 族
const SELECT_RECV_SEV_EN = /\b(?:patients?|cases?|subjects?|people|individuals|participants)\s+(?:who|that)\s+(?:received|got|were\s+given|were\s+prescribed|took|were\s+treated\s+with|were\s+assigned\s+to|were\s+started\s+on)\b[^.]{0,60}\b(?:were\s+)?(?:the\s+)?(?:sickest|sicker|most\s+severe|more\s+severe|severest|highest[\s-]risk|higher[\s-]risk|poorest\s+prognosis|worse\s+prognosis|frail|frailest|critical|most\s+critical|advanced|more\s+advanced)\b/i;
// E2 prescribe/give/reserve … only in/for/to the severe 族
const SELECT_PRESCRIBE_SEV_EN = /\b(?:prescrib\w+|administer\w+|giv\w+|offer\w+|us\w+|reserv\w+|recommend\w+)\b[^.]{0,50}\b(?:only\s+|primarily\s+|mostly\s+|preferentially\s+|typically\s+|usually\s+)?(?:to|for|in)\s+(?:the\s+|those\s+|only\s+)?(?:sickest|sicker|most\s+severe|more\s+severe|highest[\s-]risk|higher[\s-]risk|critical|most\s+critical|frail|frailest|poorest\s+prognosis|worst\s+prognosis|severe)\b/i;
// E3 sicker patients received … 族
const SELECT_SICKER_RECV_EN = /\b(?:sicker|more\s+severe|sickest|worse|higher[\s-]risk|frailer|most\s+severe)\s+(?:patients?|cases?|subjects?|people|individuals)\b[^.]{0,50}\b(?:received|got|were\s+given|were\s+more\s+likely|tended|were\s+prescribed|were\s+treated)\b/i;
// E4 patients … had worse baseline severity 族
const SELECT_IMBALANCE_EN = /\b(?:patients?|cases?|subjects?|individuals)\s+(?:who|that)\s+(?:received|got|were\s+given|were\s+assigned\s+to|took)\s+(?:the\s+)?(?:drug|therapy|treatment|intervention|regimen)\b[^.]{0,60}\b(?:had|were\s+at|carried)\b[^.]{0,40}\b(?:worse|poorer|more\s+severe|higher|greater|elevated)\s+(?:prognosis|baseline\s+risk|severity|risk|baseline)\b/i;

const SELECTION_EN_GROUPS = [
  ['SELECT_RECV_SEV_EN', [SELECT_RECV_SEV_EN]],
  ['SELECT_PRESCRIBE_SEV_EN', [SELECT_PRESCRIBE_SEV_EN]],
  ['SELECT_SICKER_RECV_EN', [SELECT_SICKER_RECV_EN]],
  ['SELECT_IMBALANCE_EN', [SELECT_IMBALANCE_EN]],
];
const SELECTION_EN = [SELECT_RECV_SEV_EN, SELECT_PRESCRIBE_SEV_EN, SELECT_SICKER_RECV_EN, SELECT_IMBALANCE_EN];

// ─── 腿② CAUSAL 结局差异×治疗因果断言 ───────────────────────────
// A1 推断标记×裁决/比较族（所以…有害 / 结果…死得更多 / 因此…更差）。
const CAUSAL_MARK_ZH_A = /(?:所以|因此|因而|故|可见|故而|这说明|足以|显然|结果|导致)[^。，！？；\n]{0,26}(?:有害|有危害|很危险|是危险的|反而加重|致死|无效|没用|没有效果|有效|安全|可靠|有问题|不可取|弊大于利|更危险|更好|更差|死得更快|死得更多|活得更久|导致死亡|造成死亡|反而|更高|更低|更多|更少|上升|下降|最长|最短)/;
// A2 证实词×治疗×裁决族（证明新药有害 / 研究表明该药不安全）。
const CAUSAL_PROVE_ZH_B = /(?:证明|说明|表明|意味着|反映出|足以证实|证实了|证明了|研究表明|研究发现|数据表明)[^。，！？；\n]{0,26}(?:新药|新疗法|该药|该疗法|这种治疗|这种疗法|本方案|该治疗|该方案|疗法|药物|干预|手段|措施|它)[^。，！？；\n]{0,16}(?:有害|无效|有效|安全|危险|有问题|可靠|不可取|更好|更差|加重|致死|不安全|导致死亡|造成死亡)/;
// A3 治疗×裁决无标记族（新药反而有害 / 该药无效 / 新疗法导致更高的死亡率）。
const CAUSAL_TREAT_ZH_C = /(?:新药|新疗法|该药|该疗法|这种治疗|这种疗法|本方案|该治疗|该方案|疗法|药物|干预|手段|措施)[^。，！？；\n]{0,10}(?:反而|更|较)?[^。，！？；\n]{0,10}(?:有害|无效|有效|安全|危险|有问题|不可取|更危险|更好|更差|导致(?:更高的)?(?:死亡率|死亡|风险)|造成(?:更高的)?(?:死亡率|死亡|风险)|加重)/;
// A4 结局差异族（痊愈率明显更低 / 死亡率更高）。
const CAUSAL_OUTCOME_ZH_D = /(?:死亡率|病死率|死亡人数|复发率|恶化率|并发症|生存率|痊愈率|治愈率|缓解率|有效率|失败率|不良反应|疗效|预后|死亡|痊愈|治愈|缓解|恶化|复发)[^。，！？；\n]{0,14}(?:更高|更低|更多|更少|更好|更差|上升|下降|升高|降低|最长|最短|更长|更短|明显更高|明显更低|明显更多|明显更少)/;

const CAUSAL_ZH_GROUPS = [
  ['CAUSAL_MARK_ZH_A', [CAUSAL_MARK_ZH_A]],
  ['CAUSAL_PROVE_ZH_B', [CAUSAL_PROVE_ZH_B]],
  ['CAUSAL_TREAT_ZH_C', [CAUSAL_TREAT_ZH_C]],
  ['CAUSAL_OUTCOME_ZH_D', [CAUSAL_OUTCOME_ZH_D]],
];
const CAUSAL_ZH = [CAUSAL_MARK_ZH_A, CAUSAL_PROVE_ZH_B, CAUSAL_TREAT_ZH_C, CAUSAL_OUTCOME_ZH_D];

// B1 so/therefore … harmful 族
const CAUSAL_SO_EN_A = /\b(?:so|therefore|thus|hence|consequently|as\s+a\s+result)\b[^.]{0,70}\b(?:harmful|dangerous|unsafe|ineffective|effective|works?|fails?|causes?|led\s+to|increases?|reduces?|is\s+no\s+good|does\s+not\s+work)\b/i;
// B2 proves/shows … the drug … unsafe 族
const CAUSAL_PROVE_EN_B = /\b(?:proves?|shows?|means?|demonstrates?|indicates?)\b[^.]{0,40}\b(?:the\s+)?(?:drug|therapy|treatment|intervention|regimen|medication|procedure)\b[^.]{0,40}\b(?:harmful|dangerous|unsafe|ineffective|effective|works?|fails?|causes?|is\s+no\s+good|does\s+not\s+work)\b/i;
// B3 the drug is ineffective 族（无标记，治疗名词紧邻裁决）
const CAUSAL_TREAT_EN_C = /\b(?:the\s+|this\s+|new\s+)?(?:drug|therapy|treatment|intervention|regimen|medication)\s+(?:is\s+|was\s+|are\s+|were\s+)?(?:harmful|dangerous|unsafe|ineffective|effective|works?|fails?|causes?)\b/i;
// B4 mortality rates were higher 族
const CAUSAL_RATE_EN_D = /\b(?:death|mortality|survival|response|recurrence|complication|cure|remission|failure)\s+(?:rates?|risks?|numbers?)?\s*(?:were|was|are|is)?\s*(?:significantly\s+|much\s+|far\s+)?(?:higher|lower|increased|reduced|elevated|worse|better)\b|\b(?:higher|lower|increased|reduced|elevated|worse|better)\s+(?:death|mortality|survival|response|recurrence|complication|cure|remission|failure)\s+(?:rates?|risks?|numbers?)?\b/i;

const CAUSAL_EN_GROUPS = [
  ['CAUSAL_SO_EN_A', [CAUSAL_SO_EN_A]],
  ['CAUSAL_PROVE_EN_B', [CAUSAL_PROVE_EN_B]],
  ['CAUSAL_TREAT_EN_C', [CAUSAL_TREAT_EN_C]],
  ['CAUSAL_RATE_EN_D', [CAUSAL_RATE_EN_D]],
];
const CAUSAL_EN = [CAUSAL_SO_EN_A, CAUSAL_PROVE_EN_B, CAUSAL_TREAT_EN_C, CAUSAL_RATE_EN_D];

// ─── 距离窗（选择性分配 × 治疗因果断言）─────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名适应证混杂/因果推断方法论本身）────────
const CONCEPT_ZH = /(?:适应证混杂|指征混杂|适应证偏倚|指征偏倚|因果推断|流行病学|基线不平衡|选择偏倚|混杂因素|混杂偏倚|渠道偏差|治疗选择偏倚)/;
const CONCEPT_EN = /\bconfounding\s+by\s+indication\b|\bindication\s+bias\b|\bconfound\w*\b|\bcausal\s+inference\b|\bepidemiolog\w+\b|\bprognostic\s+imbalance\b|\bbaseline\s+imbalance\b|\bselection\s+bias\b/i;

// ─── 豁免 B：纠正句（正确指出组间不可比/需要调整——这是本族要教的
// 判别动作本身）。
const CORRECT_ZH = /(?:随机化|随机对照|随机分配|分层分析|分层后|按基线|基线校正|校正基线|倾向评分|多变量|协变量|控制混杂|剔除混杂|调整基线|校正后|调整后|排除混杂|不能据此|无法据此|不能说明|不能证明|无法比较|不能比较|无法直接|不能直接|不能得出|难以比较|尚不能|头对头)/;
const CORRECT_EN = /\brandomi[sz]\w*\b|\bstratifi\w+\b|\badjust\w*\s+for\b|\bpropensity\s+score\b|\bmultivariable\b|\bbaseline[-\s]adjusted\b|\bcontrol\w+\s+for\b|\bcannot\s+(?:be\s+)?(?:compared|inferred|concluded|determined)\b|\bcan(?:not|'t)\s+conclude\b|\bafter\s+adjustment\b|\bmatched\s+cohort\b|\bhead[-\s]to[-\s]head\b/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「无法证明
// 新药有害」= 没有断言有害；「并不能说明疗法无效」= 断言被推翻）。
const STRONG_NEG_ZH = /(?:并非|绝不是|绝对不是|绝不|丝毫不|一点都不|压根|根本(?:不|没有)|无法|不能|难以|不足以|不代表|不等于|说明不了|证明不了|很难说|不见得|未必|不一定)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|cannot|can't|unable\s+to|fails?\s+to)\b/i;
// 对冲词（腿②前置）：命中词前出现这些词，说明断言被限定（「可能
// 是指征混杂」= 正确限定而非归因断言）。
const HEDGE_ZH = /(?:可能|也许|或许|大概|未必|不一定|尚不明确|无法断定|不能排除|难以排除|有待|似乎|恐怕|或与|疑似)/;
const HEDGE_EN = /\b(?:may|might|could|possibly|perhaps|probably|uncertain|unclear|suggests?|likely\s+reflect)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  return STRONG_NEG_ZH.test(before);
}

function matchAlive(text, x, useNeg, hedge) {
  if (useNeg) {
    if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
    if (STRONG_NEG_EN.test(beforeEn)) return false;
  }
  if (hedge) {
    if (HEDGE_ZH.test(x.raw)) return false;
    const beforeZh = text.slice(Math.max(0, x.idx - 24), x.idx);
    if (HEDGE_ZH.test(beforeZh)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 40), x.idx);
    if (HEDGE_EN.test(beforeEn)) return false;
  }
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

function collect(text, list, useNeg, hedge) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, hedge)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①选择性分配 × 腿②治疗因果断言，两腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      sel: resolveGroups(R, SELECTION_ZH_GROUPS),
      cau: resolveGroups(R, CAUSAL_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      sel: resolveGroups(R, SELECTION_EN_GROUPS),
      cau: resolveGroups(R, CAUSAL_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const selM = collect(text, L.sel, true, false);
    if (selM.length === 0) continue;
    const cauM = collect(text, L.cau, true, true);
    if (cauM.length === 0) continue;
    for (const n of selM) {
      const z = cauM.find(x => dist(x, n) <= L.win);
      if (!z) continue;
      sigs.push({ lang: L.lang, selection: n.raw, causal: z.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.selection + '|' + s.causal;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 适应证混杂签名：治疗分配由基线风险驱动 × 结局差异归因于治疗，两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectConfoundingByIndication(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论适应证混杂这个概念本身是正确判别）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（指出组间不可比/需要随机化调整的正当陈述）
  if ((R.CORRECT_ZH || CORRECT_ZH).test(text) || (R.CORRECT_EN || CORRECT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'confounding_by_indication',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '选择性分配「' + x.selection + '」× 治疗归因「' + x.causal + '」'
      : 'selection "' + x.selection + '" x causal claim "' + x.causal + '"')),
    details: s.lang === 'zh'
      ? '适应证混杂(' + sigs.length + '处: 「' + s.selection + '」说明治疗分配由基线风险驱动，却把「' + s.causal + '」的组间结局差异直接归因于治疗——两组基线不可比，粗率差异不能作为疗效/危害证据)(zh)'
      : 'confounding-by-indication(' + sigs.length + 'x: "' + s.selection + '" shows treatment assignment was driven by baseline risk, yet "' + s.causal + '" attributes the crude outcome gap to the treatment — groups are not comparable at baseline)(en)',
    guidance: '适应证混杂（confounding by indication / 指征混杂）指治疗分配由基线预后驱动时（重症患者才用新药、病情重的医生才敢开），组间粗结局率差异反映的是基线风险而非治疗效应，直接据此断言治疗有害或有效是把不可比的两组当成可比。它的危害不在「重症确实更多地用了新药」这个事实陈述（那可以用处方记录核实），而在紧随其后的第二动作：把由此产生的死亡率/痊愈率/并发症率差异当成药物的效果——这一步跳过了「两组本来就可比」的前提。正当做法是先核对两组的基线风险分布并做分层/多变量调整/倾向评分，或直接指出只能做随机对照试验比较；需要按基线分层或随机化后才能比较、把差异归因于基线预后本身的纠正句、或明确指出这是适应证混杂，都是正当做法。',
    tags: ['causal-inference', 'epidemiology', 'confounding', 'statistics', 'evidence-based-medicine', 'treatment-comparison'],
  };
}

module.exports = {
  detectConfoundingByIndication,
  __internals: () => ({
    SELECT_VERB_ZH, SELECT_TREAT_SEV_ZH, SELECT_SEV_TREAT_ZH, SELECT_IMBALANCE_ZH,
    SELECT_RECV_SEV_EN, SELECT_PRESCRIBE_SEV_EN, SELECT_SICKER_RECV_EN, SELECT_IMBALANCE_EN,
    CAUSAL_MARK_ZH_A, CAUSAL_PROVE_ZH_B, CAUSAL_TREAT_ZH_C, CAUSAL_OUTCOME_ZH_D,
    CAUSAL_SO_EN_A, CAUSAL_PROVE_EN_B, CAUSAL_TREAT_EN_C, CAUSAL_RATE_EN_D,
    SELECTION_ZH, SELECTION_EN, CAUSAL_ZH, CAUSAL_EN,
    SELECTION_ZH_GROUPS, SELECTION_EN_GROUPS, CAUSAL_ZH_GROUPS, CAUSAL_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
