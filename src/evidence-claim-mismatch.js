'use strict';

/**
 * src/evidence-claim-mismatch.js — 「证据-断言覆盖失配（evidence-claim
 * coverage mismatch / extrinsic hallucination）」检测器
 * （第 251 个判别维度，r307 接线）
 *
 * [r307 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。
 *
 * 立项缺口实证（/tmp/r307-probe.js，v6.8.177 实测 10 攻击 + 8 良性）：
 * 攻击 7/10 被既有维度兜住，但 3 条完全穿透（gate=pass / verdict=可信 /
 * overallScore=1，findings 全空）：
 *   · A1「研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防
 *     所有呼吸道感染。」
 *   · A6 "The study found that the drug reduced symptoms in 40% of trial
 *     participants, so the drug cures the disease."
 *   · A10「统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。」
 * 归属诊断（/tmp/r307-attr.js）：三条穿透样本在 reverse_causation /
 * common_cause / post_hoc / pseudo_causal / cherry_picking /
 * hasty_generalization / unsupported_claim 等候选维度上零承重——真缺口，
 * 非搭便车。
 *
 * 外部来源（真实可查，非编造）：
 *   · KRLabsOrg/LettuceDetect（HN Algolia "hallucination detection
 *     evidence" 命中，arXiv 2502.17125，RAGTruth 79.22% F1）：把幻觉分为
 *     intrinsic（与所给证据矛盾）与 extrinsic（**断言内容超出所给证据
 *     可支撑范围**）。本维度实现后者——证据在场且与断言**同主题**，但
 *     断言的覆盖面/因果强度超出证据实际支撑的程度。
 *   · cvs-health/uqlm（GitHub 1,217★，JMLR 2026）：LLM 幻觉检测的不确定
 *     性量化路线，判据依赖采样一致性，与心虫纯规则引擎不同构，仅作方向
 *     参考。
 *   · potsawee/selfcheckgpt（GitHub 635★）：零资源黑盒幻觉检测，依赖
 *     多次采样，同样不同构。
 * 判据为心虫自有纯规则实现（零 LLM 依赖），外部工作仅提供问题定义。
 *
 * 辨别的族：证据-断言覆盖失配——文本先摆出**证据/研究/数据/统计/实验**
 * （研究显示/数据表明/统计显示/实验发现/调查显示/临床试验；EN the study
 * found / data show / the trial found / research shows），继而给出一个
 * **从该证据推不出的断言**：证据只覆盖「部分/相关/单一样本」，断言却
 * 升级成「全部/因果/治愈」：
 *   · 研究显示服用维生素D的志愿者冬季感冒更少，所以维生素D能预防
 *     所有呼吸道感染。（部分样本 → 全称结论）
 *   · 数据表明喝咖啡的人心血管死亡率更低，可见喝咖啡可以治疗心脏病。
 *     （相关 → 因果+疗效）
 *   · 统计显示冰激凌销量与溺水人数高度相关，所以吃冰激凌会导致溺水。
 *     （相关 → 因果，无第三变量排除）
 *   · 在200名大学生中的实验证明了这种方法对所有人都有效。（局部样本
 *     → 全称推广）
 *   · 《Nature》2023年的研究调查了城市绿化，这证明了植树能降低全国
 *     犯罪率。（同主题但结论与研究问题无关）
 *   · The study found that the drug reduced symptoms in 40% of trial
 *     participants, so the drug cures the disease.
 *
 * 为什么这是判别者的核心缺口（对齐「能准确寻找答案——寻真而非似是
 * 而非」）：**断言的确定性上限由证据的覆盖范围决定**。证据说的是
 * 「N 人中观察到 X」，结论只能说「在该样本中 X 成立」；证据说的是
 * 「A 与 B 相关」，结论只能说「A 与 B 同变」。把覆盖面从「样本内/相关」
 * 扩到「全体/因果/治愈」，是把证据链的**实际承重能力**夸大到它
 * 支撑不起的程度——这是 AI 输出中最典型的似是而非形态：引用了真实的
 * 研究、给出了真实的数据，结论却悄悄越过了证据的边界。听众核对来源时
 * 会发现来源是真的，于是更加采信那个被悄悄放大的结论。
 *
 * 与既有维度的边界（r307 归因，探针实证）：
 *   · weak_evidence_strong_claim（第245维）管**弱证据类型**×绝对化措辞
 *     （听说/据说/网传 × 彻底/百分百/guaranteed）——腿①是不可回溯的
 *     传闻转述；本维度腿①是**可回溯的强证据**（研究/数据/统计/实验），
 *     错配发生在覆盖范围而非证据强度。两族互补：一个打「弱证据扛大
 *     断言」，一个打「强证据被越界解读」。
 *   · cum_hoc / post_hoc / reverse_causation / common_cause 管相关→
 *     因果、时序连接、方向倒置、第三变量——它们的腿①是**裸共变陈述**
 *     （A和B相关/A在B前），不要求「研究/数据」这类证据标记在场；本维度
 *     承重的是「**证据在场 + 断言超出证据覆盖**」这个结构。A10 探针
 *     实证两条共现维度全部零命中，而本维度腿①腿②共现可判。
 *   · hasty_generalization 管少数样本→普遍结论，不要求证据标记在场，
 *     且只管**群体规模**外推；本族同时管因果强度外推（相关→因果）与
 *     覆盖面外推（部分→全体/局部→全国）。
 *   · unsupported_claim 管断言缺依据的强度（无证据在场），本维度
 *     的前提恰恰是**证据在场**——错配不在缺席，在越界。
 *   · completion_evidence 管空完成声明（说做完但无产物），本维度
 *     与研究/数据陈述相关，与工作完成无关。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① EVID 证据/研究/数据标记：句中先出现研究/数据/统计/实验/调查/
 *     临床试验/论文/《X》年份 等可回溯证据源标记（ZH+EN 各一套），
 *     含裸名词形态（研究/数据/统计/实验 单独出现即命中——r161 教训
 *     自查：去后缀仍命中）；
 *   腿② OVERREACH 超覆盖断言（四类越界形）：
 *     O1 相关→因果：证据腿近邻出现「导致/造成/引发/会引起/能够治疗/
 *       治愈/根治/预防」且证据腿陈述本身是共变/观察形（更少/更高/
 *       更低/相关/成正比）；
 *     O2 部分→全体：证据腿近邻出现「所有/全部/每个人/任何人/普遍/
 *       一律/都能/皆可/全民」这类全称量化，或「全国/全世界/所有人」；
 *     O3 局部→整体：证据腿限定在小范围（N名/N所/该市/该校/本社区），
 *       断言却用「全国/全省/全球/整体/全面」覆盖；
 *     O4 EN: cures / treats / prevents / works for everyone / all
 *       patients / proves that everyone。
 *
 * 为什么取 VERIFY 级：证据与断言的匹配度取决于该证据的真实覆盖范围
 * （样本量、抽样框、研究设计、效应量、置信区间），规则引擎无法独立
 * 判定某条具体证据的真实承重能力，只能识别「证据在场 + 断言形超出
 * 证据通常覆盖范围」的形态。verify 的含义是「先核对证据实际支撑什么
 * 再采信」：调用方应回到原始研究确认样本范围与结论措辞、把断言降级
 * 到证据覆盖范围内（「在该样本中观察到…」「…与…相关，因果待检验」）、
 * 或补充能支撑全称/因果断言的证据，而不是把研究直接当成全称/因果
 * 结论的背书。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（证据/断言/覆盖/充分性/因果推断/辛普森/混杂/
 *     外推/过度概括/逻辑谬误/统计学/教材/论文/科普/EN evidence /
 *     claim / coverage / sufficiency / causal inference / confounding /
 *     extrapolation / overgeneralization / fallacy / statistics）——
 *     讨论这个概念本身是正确判别；
 *   · 证据充足性论证（证据不足/样本太小/不能证明/不足以/尚待/仍需
 *     验证/需要更大规模/有待重复/不能外推/不能推广/相关性不等于因果/
 *     EN insufficient / too small / cannot conclude / does not prove /
 *     needs replication / cannot be generalized / correlation is not
 *     causation）——主动声明证据边界是正确判别，正是本维度要教的
 *     判别动作；
 *   · 推理否定/反向承认（不能说明/不能证明/推不出/并不意味着/不代表/
 *     未必/不一定/很难说/难以确定/只是相关/只是观察/EN does not mean /
 *     not necessarily / merely correlational / observational only）——
 *     拒绝该外推本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/似乎/好像/有待/倾向于/EN maybe /
 *     perhaps / might / seems / appears）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言；
 *   · 受限定的正确外推形（在…范围内/在…样本中/局限于/仅限于/就该…
 *     而言/就本…而言/EN within this sample / in this cohort / limited
 *     to / restricted to）——显式把结论收在证据边界内。
 */
'use strict';

// ─── 腿① EVID 证据/研究/数据标记（中文）────────────────────────────────
// r161 教训自查：每条词去掉后缀仍须命中——「研究显示」的裸形态「研究」、
// 「数据表明」的裸形态「数据」都单独成腿。含《X》年份引用形。
const EVID_ZH = [
  // 研究/调查/实验裸名词 + 其动词形
  /研究显示|研究表明|研究指出|研究发现|研究证明|研究证实|研究团队|研究[人者]|这项研究|该研究|一项研究|研究认为|研究考察|研究探讨|研究分析|研究对比|研究回顾/,
  /数据表明|数据显示|数据指出|数据揭示|数据显示出|据数据|数据说明/,
  /统计显示|统计表明|统计数据|统计发现|据统计|统计结果/,
  /实验表明|实验显示|实验发现|实验结果|对照实验|实验结果/,
  /调查显示|调查表明|调查发现|调查结果|问卷调查|普查/,
  /临床试验|临床研究|临床数据|病例[数观]|队列研究|元分析|系统评价|系统综述/,
  // 引用来源形（《X》+ 年份 / X大学 / X机构 / X报告）
  /《[^》]{2,40}》\s*(?:19|20)\d{2}|(?:19|20)\d{2}\s*年[^。；，]{0,10}(?:研究|报告|论文|调查|统计)/,
  /[^\s。；，]{2,12}(?:大学|学院|研究所|研究院|实验室|课题组|中心)\s*(?:的)?\s*(?:研究|实验|调查|数据|报告|发现|表明|显示)/,
  /(?:论文|报告|白皮书|年报|季报|月报|公报)\s*(?:指出|表明|显示|发现|认为)/,
  // r307 补：数量样本限定形（N名/N所 + 名词 + 的 + 实验/研究/调查）——
  // A3「在200名大学生中的实验」腿①原缺失形
  /[一二两三四五六七八九十百千万\d]+\s*(?:名|个|位|所|家|人|例|组)\s*[^。；，]{0,12}(?:中的|内的)?\s*(?:实验|研究|调查|试验|试点|随访|队列)/,
  // r307 补：机构/团队 + 开展/完成 + 研究形
  /(?:开展|完成|进行|实施)了?[^。；，]{0,16}(?:实验|研究|调查|试验|试点|随访)/,
  // r307 补 V6 形：裸名词「实验数据/研究数据/调查数据」+ 支持/证实/证明
  /(?:实验|研究|调查|统计|临床)数据\s*(?:支持|证实|证明|表明|显示|说明)/,
  /数据\s*(?:支持|证实|证明)[^。；，]{0,10}(?:结论|观点|说法|论断)/,
];

// ─── 腿① EVID（英文）──────────────────────────────────────────────────
const EVID_EN = [
  /\b(?:the\s+)?(?:study|studies|research|trial|experiment|survey|analysis|meta[- ]analysis|systematic review|cohort|paper|report|data|evidence|findings|results?)\s+(?:found|show[sd]?|reveal[sd]?|indicate[sd]?|suggest[sd]?|demonstrate[sd]?|report(?:ed)?|observe[sd]?|conclude[sd]?)\b/i,
  /\b(?:according\s+to|based\s+on)\s+(?:the\s+)?(?:study|research|trial|data|survey|analysis|report|paper|findings)\b/i,
  /\b(?:in|during)\s+(?:the\s+)?(?:trial|study|experiment|survey)\b/i,
  /\b\d+\s+(?:participants|subjects|patients|respondents|volunteers|students)\b/i,
];

// ─── 腿② OVERREACH 超覆盖断言（中文）──────────────────────────────────
// 四类越界形：O1 相关→因果，O2 部分→全体，O3 局部→整体，O4 疗效越界
const OVERREACH_ZH = [
  // O1 共变/观察 → 因果或疗效断言（因果动词 × 排除第三变量缺席）
  /(?:所以|因此|因而|可见|足见|据此|这说明|这意味着|足以证明|足以说明|于是|那么)[^。；，]{0,20}(?:导致|造成|引起|引发|诱发|使得|能预防|能够预防|可以预防|能治疗|能够治疗|可以治疗|治愈|根治)/,
  /(?:所以|因此|因而|可见|足见|据此|于是|那么|这证明|这说明)[^。；，]{0,16}(?:会导致|会造成|能导致|会引起|就能够)/,
  // r307 补 V4 倒装形：因果动词裸现（句首无连接词）——「吃冰激凌会
  // 导致溺水」本身就是越界断言（相关被说成因果），连接词不是承重件
  /[^。；，]{2,14}(?:导致|造成|引起|引发)[^。；，]{0,10}(?:溺水|死亡|生病|患病|事故|伤亡|失败|衰退|崩溃)/,
  // 因果动词直接接全称/绝对对象
  /(?:能|可以|能够|足以)?\s*(?:预防|治疗|治愈|根治)\s*(?:所有|全部|任何|一切|每种|各类|各种)/,
  // O2 部分样本 → 全称量化
  /(?:所以|因此|因而|可见|足见|据此|这说明|这意味着|足以证明|足以说明|于是|那么)[^。；，]{0,24}(?:所有|全部|每个人|任何人|人人|普遍|一律|无一例外|皆可|都能|通通)/,
  /(?:证明|证实|说明)了?[^。；，]{0,12}(?:对所有|对任何|对每个人|普遍适用|放之四海)/,
  // O3 局部样本 → 整体覆盖（小范围限定词 + 大范围断言词同句）
  /(?:所以|因此|因而|可见|足见|据此|这说明|这意味着|足以证明|足以说明|于是|那么)[^。；，]{0,24}(?:全国|全世界|全球|全省|全市|全民|整体|全面|各行各业)/,
  // 相关形被说成因果（证据腿陈述相关，断言腿用因果词）——覆盖 A10 形
  /高度相关[^。；，]{0,12}(?:所以|因此|因而|可见|足见|据此|于是|那么)[^。；，]{0,8}(?:导致|造成|引起|引发)/,
  /相关[^。；，]{0,6}(?:所以|因此|因而|可见|于是|那么)[^。；，]{0,8}(?:导致|造成|引起|引发|意味着)/,
  // r307 补：V5「据此可以认定，只要坚持运动就能完全避免心脏病」——
  // 认定/断言 + 就能/就能完全避免 形（充分性词 + 绝对化疗效）
  /(?:据此|由此|可见|足见|因此|所以)[^。；，]{0,8}(?:认定|断言|下结论|得出)[^。；，]{0,20}(?:就能|就能完全|完全可以|必然|一定)/,
  /(?:只要|仅需|只需)[^。；，]{0,14}(?:就能|就能够|便可|即可)[^。；，]{0,10}(?:完全|彻底|绝对|根治|治愈|避免|杜绝)/,
  // r307 补：V6「实验数据支持这一结论，所以适用于任何人」——
  // 适用性全称形（适用于/对…适用 + 任何人/任何情况）
  /适用于[^。；，]{0,6}(?:任何人|任何情况|任何人|一切|所有|任何场合|任何场景)/,
  /对[^。；，]{0,10}(?:任何人|任何情况|所有场合)[^。；，]{0,6}(?:适用|有效|成立|适用)/,
  // r307 补：疗效/改善越界——A4「能降低全国犯罪率」、A8「可以让人长寿」
  /(?:能|可以|能够)[^。；，]{0,6}(?:降低|减少|提升|提高|改善|根治|治愈|预防|治疗)[^。；，]{0,10}(?:全国|全球|全省|全市|全民|全世界|所有人|每个人)/,
  /(?:可以|能|能够)让人[^。；，]{0,4}(?:长寿|健康|年轻|聪明|不得病|不生病|长高|变高|强壮|更壮|精力充沛)/,
  /(?:可以|能|能够)[^。；，]{0,8}(?:延长寿命|延年益寿|永葆|重返年轻|长生)/,
  // r307 补：直接断言全国/整体覆盖（无连接词形）
  /(?:证明|证实|说明)了?[^。；，]{0,14}(?:全国|全球|整体|全面|全民|所有行业|每个人)/,
];

// ─── 腿② OVERREACH（英文）─────────────────────────────────────────────
const OVERREACH_EN = [
  // O1 相关/观察 → 因果或疗效
  /\b(?:so|therefore|thus|hence|this\s+(?:proves|shows|means|demonstrates)|which\s+(?:proves|shows|means)|concluding\s+that)\b[^.!?]{0,40}\b(?:causes?|leads?\s+to|results?\s+in|prevents?|treats?|cures?|heals?)\b/i,
  /\b(?:cures?|treats?|prevents?|heals?|eliminates?)\s+(?:the\s+)?(?:disease|illness|condition|cancer|infection)\b/i,
  /\b(?:cures?|works?\s+for|prevents?)\s+(?:all|every|any)\s+(?:patients?|people|cases?|humans?|diseases?)\b/i,
  /\bproves?\s+that\s+(?:everyone|all\s+people|everybody)\b/i,
  // O2 部分 → 全称
  /\b(?:so|therefore|thus|this\s+(?:proves|shows|means)|which\s+(?:proves|shows|means))\b[^.!?]{0,40}\b(?:everyone|everybody|all\s+(?:people|humans?|patients?|cases)|universally|without\s+exception)\b/i,
  // O3 局部 → 整体
  /\b(?:so|therefore|thus|this\s+(?:proves|shows|means))\b[^.!?]{0,40}\b(?:nationwide|globally|worldwide|across\s+the\s+(?:country|world|nation)|everywhere)\b/i,
];

// ─── 豁免一：概念/教学转述 ─────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /证据.{0,6}(充分|不足|充足|缺失|链|效力|强度|等级|分级)|证据力|举证|采信|可信度/,
  /因果推断|因果关系|相关关系|相关不等于|相关性|混杂|混淆变量|第三变量|共同因素|辛普森|内生性|外推|过度概括|以偏概全|样本量|抽样框|置信区间|显著性/,
  /逻辑谬误|逻辑错误|谬误|话术|归因谬误|统计谬误|推理谬误/,
  /统计学|教材|课本|课堂|教案|论文写作|科普|概念|定义|方法论|研究设计/,
];
const EXEMPT_META_EN = [
  /\b(?:evidence[- ]?(?:based|strength|quality|hierarchy)|claim\s+coverage|sufficiency|causal\s+inference|causation|confounding|spurious|extrapolation|overgeneraliz\w+|sample\s+size|sampling\s+frame|confidence\s+interval|statistics|methodology|fallacy)\b/i,
];

// ─── 豁免二：证据充足性论证 / 受限定的正确外推 ────────────────────────
// 这是本维度的关键豁免：主动声明证据边界、把结论收在证据范围内，是
// 正确判别而非谬误。
const EXEMPT_SUFF_ZH = [
  /证据不足|证据有限|证据缺乏|数据不足|样本太小|样本不足|样本量小|样本有限|不能证明|不足以|尚待|仍需|尚需|有待|还需要|需要更大|需要更多|有待重复|尚待重复|重复实验|进一步验证|进一步研究|不能外推|不能推广|难以推广|不足以推广|不足以支撑|无法支撑|支撑不起/,
  /不能说明|不能证明|推不出|并不意味着|不代表|未必|不一定|很难说|不好说|说不清|难以确定|无法确定|只是相关|只是观察|仅表观察|观察性的|相关性不等于|相关不等于|并非因果|不等于因果/,
  // r307 修正：限定形豁免排除「大范围放大词」——把结论收在**小**范围
  // （该样本/本班级/本社区/该年龄段）是正当限定；「在全国范围内推广」
  // 是把局部结论放大到全国，属越界断言本身，不可豁免（A9 实证）。
  /(?:在|于)(?![^。；，]{0,14}(?:全国|全球|全省|全市|全民|全世界|所有人|每个人|整体|全面))[^。；，]{0,14}(?:范围|样本|群体|人群|地区|年龄段|条件|班级|学校|社区|城市|队列|组别)(?:内|中|里)/,
  /局限于|仅限于|就.{0,8}而言|仅在|只在该|就该样本|就本样本|在本样本|此范围内|这一范围内|该范围内|该样本中|此条件下/,
  /如果|假如|若[^。；，]{0,10}则|假设|假使/,
];
const EXEMPT_SUFF_EN = [
  /\b(?:insufficient|limited|too\s+small|not\s+enough|cannot\s+be\s+generalized|cannot\s+be\s+extrapolated|does\s+not\s+prove|does\s+not\s+show|fails\s+to\s+show|needs?\s+(?:further|more|replication|larger)|requires?\s+(?:further|more)|remains?\s+to\s+be\s+seen|warrants?\s+further|observational\s+only|correlational|correlation\s+is\s+not\s+causation|not\s+causal)\b/i,
  /\b(?:within|limited\s+to|restricted\s+to|confined\s+to|in\s+this\s+(?:sample|cohort|group|population))\b/i,
  /\b(?:if|unless|assuming|provided\s+that|hypothetically)\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ──────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不是|并非|不等于|并不意味着|不代表|不能|不可|不会|并不会|未必|不见得|未必能|无从|推不出/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|cannot|can'?t|is\s+not|isn'?t|not\s+necessarily|fails\s+to|unable\s+to)\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认|初步|初步显示|初步表明/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|could\s+be|i\s+suspect|preliminary|tentative|suggests?)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 source 列表中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/**
 * 两腿 + 邻近窗：存在 e∈EVID, o∈OVERREACH 使 |e-o| ≤ WIN。
 * 窗口取 80（ZH）/ 200（EN）：证据陈述与越界断言通常同句或紧邻分句。
 * r307 修正：不强制「证据腿在前」——倒装形（先下结论后补证据，如
 * 「吃冰激凌会导致溺水，因为统计显示冰激凌销量与溺水人数高度相关」）
 * 是常见修辞，两腿共现本身就是「同一叙述内证据×越界断言」的充分
 * 信号；方向由腿①（证据标记）/腿②（越界断言）的词法类别保证，
 * 不靠位置顺序。
 */
function coLocated(evid, over, win) {
  for (const e of evid) {
    for (const o of over) {
      if (Math.abs(o - e) <= win) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkEvidenceClaimMismatch(text, inject) {
  if (!text || text.length < 8) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 证据充足性论证 / 推理否定 / 对冲 / 疑问句。
  // 注意顺序：充足性论证（「不足以证明」）优先于否定豁免之外单独判定，
  // 两类都是「拒绝外推」的正确判别，先判先退。
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_SUFF_ZH || EXEMPT_SUFF_ZH, text) || anyHit(R.EXEMPT_SUFF_EN || EXEMPT_SUFF_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const evid = positions(R.EVID_ZH || EVID_ZH, text).concat(positions(R.EVID_EN || EVID_EN, text));
  const over = positions(R.OVERREACH_ZH || OVERREACH_ZH, text).concat(positions(R.OVERREACH_EN || OVERREACH_EN, text));
  if (evid.length === 0 || over.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const win = isZh ? 80 : 200;
  if (!coLocated(evid, over, win)) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：两腿共现基础 0.60；显式因果/疗效越界（治愈/根治/cures）或
  // 全称量化（所有/全部/everyone）在场 +0.10；越界形命中数 ≥2 处
  // +0.06，封顶 0.80。
  let score = 0.60;
  if (/(?:治愈|根治|预防所有|治疗所有)/.test(text) || /\b(?:cures?|prevents?\s+all|treats?\s+all)\b/i.test(text)) score += 0.10;
  else if (/(?:所有|全部|每个人|任何人|人人|无一例外)/.test(text) || /\b(?:everyone|everybody|all\s+(?:people|humans?|patients?))\b/i.test(text)) score += 0.10;
  if (over.length >= 2) score += 0.06;
  if (score > 0.80) score = 0.80;

  const detail = isZh
    ? '证据-断言覆盖失配：证据/研究在场，断言(因果/全称/整体覆盖)超出证据可支撑范围(zh)'
    : 'evidence-claim coverage mismatch: claim exceeds what the cited evidence supports(en)';

  return { hit: true, score, count: over.length, detail };
}

module.exports = {
  checkEvidenceClaimMismatch,
  __internals: () => ({
    EVID_ZH, EVID_EN, OVERREACH_ZH, OVERREACH_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_SUFF_ZH, EXEMPT_SUFF_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
