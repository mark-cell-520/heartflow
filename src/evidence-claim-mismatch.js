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
 * [r338 立项] 立项探针 coordination/agent4/probes/r338-probe-candidates.js
 * （集成树 v6.8.185 全量 findings 口径）：因果与科学推理方向五候选族
 * 定拨——A 子组效应外推普适 4/8 穿透且疑难良性 4/4 零误伤（最高穿透
 * + 零误伤胜出）；B 跨试验间接比较 ZH 侧 3/3 穿透（EN 侧已被既有维度
 * 代拦）；C 统计推断误读 1/6、D 安慰剂万能解释 1/5 已被存量维度基本
 * 覆盖且伴良性误伤，放弃；E 动物外推 2/5 部分覆盖。海外扫描 arXiv 15
 * 条全为物理/多模态无关条目、GitHub 0 条、S2 429——空返，按既有形态
 * 自建。A+B 落地为两个新措辞家族（真升级②），src/index.js 零改动、
 * 维度计数 256 不变（同 r306/r320-r337 先例）。
 *
 * [r338 新措辞家族 A · 子组效应外推普适（subgroup-scope evidence →
 * universal claim）] 证据本身是子组限定形的疗效/获益陈述（只在男性
 * 亚组中显著/仅覆盖北美人群/对65岁以上患者有效），断言却跨子组或
 * 全人群（适用于所有人群/年轻人同样适用/对两性都有效/推广到全球/
 * works for everyone/younger patients benefit too/generalizes
 * worldwide）。旧实现腿①只认「研究/数据」这类可回溯来源标记，子组
 * 限定形整族漏判（探针 4/8 穿透）。子组限定形本身就是证据覆盖范围
 * 的声明——「只在X中成立」的覆盖范围小于「对所有Y成立」的断言范围，
 * 同属覆盖失配，补为腿①第二族（SUBGROUP_ZH/EN）。
 *
 * [r338 新措辞家族 B · 跨试验间接比较（indirect/cross-trial
 * comparison）] 证据是两个分立试验各自与对照/安慰剂的比较结果
 * （A 比安慰剂多降 20%、B 比安慰剂只降 5%），断言却是两干预之间
 * 的高下（A 优于 B）——无头对头共同对照时效应量不可跨试验相比。
 * 补为腿①第三族（CROSS_TRIAL_ZH/EN）+ 腿②对应越界形。ZH 侧探针
 * 3/3 穿透；EN 侧既有维度已代拦，本轮补齐模块层归因。
 *
 * [r402 新措辞家族 C · 动物/临床前证据外推人体（preclinical-to-clinical
 * extrapolation）] 证据是**动物模型/体外模型**上的结果（小鼠/大鼠/狗/
 * 斑马鱼/体外细胞/in vitro/in vivo/mice/preclinical），断言却是**人体
 * 疗效/人体适用性**（可治疗人类/患者服用/对人体有效/in patients/
 * effective in people）——物种间生理差异（代谢、剂量、免疫、病程）
 * 使动物结论不能直接承载人体结论，这是转化医学（translational
 * medicine）公认的最大缺口之一，r338 轮次的候选族 E（当时 2/5 部分
 * 覆盖、被放弃未落地）的正式落地。r402 立项探针
 * scripts/round-402/probe-preclinical.js 实测 14 攻击 **7/14 穿透**
 * gate=pass（中英双语、裸名词「实验动物」形、倒装形 C1 均穿透），
 * 存量五族（EVID/SUBGROUP/CROSS_TRIAL）无一覆盖物种限定形——腿①补
 * 第六族 PRECLINICAL_ZH/EN，腿②补人体结论断言族
 * OVERREACH_HUMAN_ZH/EN，豁免补第五组 EXEMPT_TRANSLATION_ZH/EN
 * （显式声明物种鸿沟/临床前状态的谨慎表述——「动物实验结果不能直接
 * 外推到人类，还需要临床试验验证」类文本正是本维度要教的判别动作）。
 * 同族相邻维度的分工：hasty_generalization 管样本规模外推（少数→
 * 多数人），不管物种跨越；本族管**模型系统跨越**（动物→人）。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① EVID 证据/研究/数据标记（r338 扩为三族）：EVID——句中先出现
 *     研究/数据/统计/实验/调查/临床试验/论文/《X》年份 等可回溯证据源
 *     标记（ZH+EN 各一套），含裸名词形态（研究/数据/统计/实验 单独
 *     出现即命中——r161 教训自查：去后缀仍命中）；SUBGROUP——子组
 *     限定形证据（只在X亚组中显著/仅覆盖X人群/对65岁以上患者有效/
 *     only in the male subgroup/only enrolled North Americans），
 *     家族 A 专用；CROSS_TRIAL——分立试验各自 vs 对照/安慰剂形
 *     （A比安慰剂多降20%/另一项试验/beat placebo/trial 2），家族
 *     B 专用。三族同属「证据覆盖范围声明」语义；
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

// ─── r338 腿①家族 A：子组限定证据标记（中文）──────────────────────────
// 新措辞家族 A（子组效应外推普适）：证据本身是**子组限定形**的疗效/获益
// 陈述（只在X亚组中显著/仅覆盖X人群/对65岁以上患者有效），不带「研究/
// 数据」这类可回溯来源标记，旧 EVID 词表整族漏判。子组限定形本身就是
// 证据覆盖范围的声明——覆盖范围小于断言范围即失配。
const SUBGROUP_ZH = [
  // 「只在/仅在/只有在 + 子组范围 + 显著/观察到/有效/获益」
  /只在[^。；，]{0,10}(?:亚组|人群|患者|受试者|群体|年龄段|样本|层)/,
  /仅有?在[^。；，]{0,10}(?:受试者|患者|人群|亚组|群体|对象)/,
  /仅在[^。；，]{0,10}(?:中|内|身上)(?:显著|观察到|有效|获益|改善)/,
  // 年龄/性别/症候子组限定 + 人群名词
  /对?\s*\d+\s*岁以[上下][^。；，]{0,6}(?:患者|人群|受试者|群体|老人|成人|儿童)/,
  /在[^。；，]{0,8}(?:重症|轻症|中度|重度|老年|中年|青年|男性|女性|儿童|成人|高危|低危)[^。；，]{0,6}(?:患者|人群|受试者|群体|对象)/,
  // 覆盖范围限定形
  /(?:只|仅)覆盖[^。；，]{0,10}(?:人群|地区|国家|样本|群体)/,
];

// ─── r338 腿①家族 A：子组限定证据标记（英文）──────────────────────────
const SUBGROUP_EN = [
  /\b(?:appeared|seen|observed|found|effective|works?|benefit\w*|improvement)\s+only\s+(?:in|among|for)\b/i,
  /\bonly\s+(?:in|among|for)\s+(?:the\s+)?[a-z\s-]{0,30}(?:subgroup|patients?|participants?|subjects?|cohort|men|women|males?|females?)\b/i,
  /\bin\s+patients?\s+(?:over|under|above|below|aged)\s+\d+/i,
  /\b(?:male|female)\s+subgroup\b/i,
  /\bonly\s+(?:enrolled|studied|tested|measured|recruited|included)\b/i,
];

// ─── r338 腿①家族 B：跨试验间接比较标记（中文）────────────────────────
// 新措辞家族 B（跨试验间接比较）：证据是**各自与对照/安慰剂比较**的分立
// 试验结果，断言却是两干预之间的高下（A 优于 B）——不同试验间无共同
// 对照，效应量不可直接相比。同属「断言超出证据覆盖」：比较结论超出所
// 摆证据（各自 vs 对照）可支撑的范围。
const CROSS_TRIAL_ZH = [
  /比安慰剂|与安慰剂相比|相对于安慰剂/,
  /(?:各自|分别)与(?:对照|对照组|安慰剂)/,
  /与对照(剂)?组?的?比较/,
  /头对头|跨试验|另一项试验|两项试验/,
];

// ─── r338 腿①家族 B：跨试验间接比较标记（英文）───────────────────────
const CROSS_TRIAL_EN = [
  /\b(?:beat|beats|outperform\w*)\s+(?:the\s+)?(?:placebo|control)\b/i,
  /\btrial\s+\d\b/i,
  /\bin\s+(?:its|their)\s+own\s+(?:trial|study)\b/i,
  /\bcross[- ]trial\b/i,
];

// ─── r402 腿①家族 C：动物/临床前证据标记（中文）──────────────────────
// 新措辞家族 C（动物/临床前证据外推人体）：证据本身是**物种/模型限定
// 形**的结果陈述——小鼠/大鼠/狗/猴/斑马鱼/体外细胞等非人模型上观察到
// 的效应。物种限定形与子组限定形同属「证据覆盖范围声明」，但跨越的是
// 模型系统（动物→人）而非人群子组，存量五族无一覆盖。
// r161 教训自查：每条词去掉前后缀仍须命中——「小鼠实验」的裸形态
// 「小鼠」、「体外细胞实验」的裸形态「体外」都单独成腿；不收需要
// 「实验」后缀共现的形（「小鼠实验表明…」与「在小鼠身上…」都要命中）。
const PRECLINICAL_ZH = [
  // 物种裸名词（啮齿类/常见模式动物）
  /小鼠|大鼠|老鼠|仓鼠|豚鼠|兔子|家兔|豚鼠|狗|犬|猫|猴子|猕猴|食蟹猴|恒河猴|斑马鱼|果蝇|线虫|猪|羊|马|鸡/,
  // 动物实验框架形（含裸「实验动物」）
  /动物实验|动物模型|动物研究|动物试验|实验动物|模式动物|动物身上|动物数据|动物结果/,
  // 体外/离体模型形
  /体外|离体|细胞实验|细胞系|培养细胞|细胞培养|皿中|试管|平皿| petri /i,
  // 通用非人模型指称
  /非人灵长类|临床前|前临床|转化研究|概念验证/,
];

// ─── r402 腿①家族 C：动物/临床前证据标记（英文）──────────────────────
const PRECLINICAL_EN = [
  /\b(?:in|on|using)\s+(?:mice|mouse|rats?|hamsters?|guinea\s+pigs?|rabbits?|dogs?|cats?|monkeys?|primates?|macaques?|zebrafish|fruit\s+flies?|drosophila|pigs?|sheep)\b/i,
  // 物种裸主语法（r402 消融实测补形：「Rabbits receiving the antibody
  // cleared the infection」——物种名词直接作主语，无 in/on 前缀，
  // r161 裸名词自查：EN 侧物种裸名词独立成腿）
  /\b(?:mice|mouse|rats?|rabbits?|dogs?|monkeys?|primates?|macaques?|zebrafish|hamsters?|guinea\s+pigs?)\s+(?:receiving|treated\s+with|given|fed|injected|administered|exposed\s+to|show(?:ed|ing|s)?|display(?:ed|ing|s)?|develop(?:ed|ing|s)?)\b/i,
  /\b(?:mice|mouse|rats?|rabbits?|dogs?|monkeys?|primates?|zebrafish)\s+(?:study|studies|model|models|experiment|experiments|trial|trials|data|results?)\b/i,
  /\b(?:preclinical|pre-clinical|animal)\s+(?:study|studies|model|models|experiment|experiments|trial|trials|data|results?|testing|evidence)\b/i,
  /\b(?:in\s+vitro|in-vitro|cell\s+(?:line|lines|culture|cultures)|cell-based|petri\s+dish|test\s+tube)\b/i,
  /\bin\s+(?:non-?human\s+)?primates?\b/i,
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

// ─── r338 腿②新增越界形（中文）────────────────────────────────────────
// 家族 A 子组→普适越界形 + 家族 B 跨试验间接比较越界形。独立成组便于
// 负例注入逐组删除验证承重。
const OVERREACH_NEW_ZH = [
  // 家族 A · 子组→普适
  /(?:所以|因此|因而|可见|足见|据此|这说明|这意味着|于是|那么)[^。；，]{0,18}(?:同样|也)[^。；，]{0,6}(?:适用|有效|成立|获益)/,
  /(?:所以|因此|说明|可见|据此|足以证明)[^。；，]{0,18}(?:也|同样|一定|必然)[^。；，]{0,6}(?:有效|适用|成立|获益)/,
  /宣称[^。；，]{0,14}(?:两性|男女|所有|任何|人人|全民|各类|各种|所有人)/,
  /对(?:两性|男女|所有|任何|各类)[^。；，]{0,6}(?:都)?(?:有效|适用|成立)/,
  /推广到[^。；，]{0,6}(?:全国|全球|全世界|全民|所有|各地|全人类)/,
  // 家族 B · 跨试验间接比较
  /(?:所以|因此|因而|可见|足见|据此|于是|那么)[^。；，]{0,16}(?:优于|胜过|强于|好于|更有效|效果更好|更胜)/,
  /(?:所以|因此|可见|据此)[^。；，]{0,8}[A-Za-z甲乙丙]\s*比\s*[A-Za-z甲乙丙]\s*(?:强|好|优)/,
  /说明[^。；，]{0,8}(?:更有效|效果更好|更优|优于)/,
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

// ─── r338 腿②新增越界形（英文）────────────────────────────────────────
const OVERREACH_NEW_EN = [
  // 家族 A · 子组→普适
  /\b(?:which\s+means|so|therefore|thus|meaning)\b[^.!?]{0,40}\b(?:younger|older|other|both\s+sexes|women|men|males|females|everyone)\b[^.!?]{0,30}\b(?:benefit|works?|effective|applies|respond|helped)\b/i,
  /\bgeneraliz\w+\s+(?:worldwide|globally|everywhere|across\b)/i,
  // 家族 B · 跨试验间接比较
  /\b(?:so|therefore|thus)\b[^.!?]{0,40}\b(?:superior|better|more\s+effective|outperforms?)\b/i,
];

// ─── r402 腿②家族 C：人体结论断言标记（中文）──────────────────────────
// 新措辞家族 C 的腿②：断言落在**人体**上（疗效/适用性/安全性结论），
// 与腿①（动物/体外证据）形成「模型系统跨越」失配。不收人体作为背景
// 的中性陈述（「该疾病困扰着许多患者」无断言），只收「结论适用于人」的
// 断言语。裸名词自查：患者/人类/人 单独出现不断言，须与疗效动词或
// 「可以用于/可用于」类适用性框架共现。
const OVERREACH_HUMAN_ZH = [
  // 治疗框架 + 人体对象
  /(?:可以|能够|可用于|能用于|可以用来|可用来|足以|就可以|就能)[^。；，]{0,12}(?:治疗|治愈|救治|诊断|预防)(?:人类|人|患者|病人|人群体)/,
  // 治疗人类/患者断言（人体疗效的直接结论形）
  // r402 修复：不收带限定量词的宾语——「治疗效果在部分患者中显现，
  // 不能推广到其他人群。」是限定+否定的良性句，「治疗…部分患者」是
  // 限定性表述而非人体疗效断言。限定词（部分/某些/少数/个别/亚组/仅
  // 仅/只/局限）出现在动词与宾语之间时，该短语属「覆盖范围声明」而非
  // 断言，判「人体结论」须由语义主体（推广/证明/声称）承担。
  /(?:治疗|治愈|救治|预防)(?![^。；，]{0,8}(?:部分|某些|少数|个别|亚组|局限|仅仅|只是))[^。；，]{0,8}(?:人类|患者|病人)/,
  // 「对人体/在人体上」有效性断言
  /(?:对|在)(?:人体|人类|人)[^。；，]{0,10}(?:有效|适用|成立|有益|有帮助|起作用|奏效)/,
  // 患者作为受益/使用主体的断言（消费动词含裸「吃」——「糖尿病人吃它
  // 就能控制病情」整句靠此形命中，r161 裸名词自查延伸：动词族也要收
  // 口语裸形态）
  /(?:患者|病人)[^。；，]{0,10}(?:服用|使用|注射|摄入|接受|吃|饮用|食)[^。；，]{0,10}(?:可以|就能|能够|可)/,
  /(?:患者|病人)[^。；，]{0,8}(?:可以|能|就能)[^。；，]{0,10}(?:恢复|改善|缓解|痊愈|康复|受益|得到|控制)/,
  // 「可以给所有患者使用」类普遍适用性断言（给+受事+使用框架）
  /(?:可以|能够|可|足以)[^。；，]{0,10}给[^。；，]{0,10}(?:患者|病人|人们|人)[^。；，]{0,8}(?:使用|服用|吃|注射|应用|用)/,
  // 「可以在临床上用于治疗」类临床使用断言（临床在前、用于在后的语序）
  /(?:可以|能够|可|即可|就能)[^。；，]{0,12}临床[^。；，]{0,8}(?:用于|应用于)(?:治疗|治愈|预防|诊断)/,
  // 推广到人类/临床应用断言
  /推广(?:到|至)?[^。；，]{0,8}(?:人类|人体|临床)/,
  /(?:可以|能够|即将)?[^。；，]{0,6}(?:用于|应用于|进入)[^。；，]{0,8}(?:人类|人体|临床|患者)/,
  // 直接证明人体结论形（「接种者」为受益主体变体——疫苗族高频形：
  // 动物验证保护效果→证明能保护接种者）
  /证明[^。；，]{0,10}(?:对人体|对人类|对患者|在人)/,
  /证明[^。；，]{0,6}(?:能|可以|可)?[^。；，]{0,6}(?:保护|免疫|预防)[^。；，]{0,6}(?:接种者|接种者|受种者|人群|人们)/,
  /(?:保护|免疫|预防)[^。；，]{0,6}(?:接种者|受种者|所有接种|每位接种)/,
  // 「推广到人类」类（含裸「推广」+「所有…病」的全称受益形）
  /推广(?:到|至)?[^。；，]{0,10}(?:人类|人体|临床)/,
  /(?:帮助|造福|惠及|使)[^。；，]{0,8}(?:所有|广大|亿万)?[^。；，]{0,6}(?:患者|病人|人|人群|人类)/,
];

// ─── r402 腿②家族 C：人体结论断言标记（英文）──────────────────────────
const OVERREACH_HUMAN_EN = [
  /\b(?:so|therefore|thus|which\s+means|meaning|this\s+(?:proves|shows|means))\b[^.!?]{0,40}\b(?:in|for)\s+(?:humans?|people|patients?|humans?)\b/i,
  /\b(?:can|could|will|would|may)\s+(?:be\s+)?(?:used?|given|administered|prescribed|applied)\s+(?:to|in|for)\s+(?:humans?|people|patients?)\b/i,
  /\b(?:cures?|treats?|heals?|prevents?|helps?|works?|effective)\s+(?:in|for)\s+(?:humans?|people|patients?)\b/i,
  /\bpatients?\s+(?:can|could|will|may)\s+(?:take|use|receive|be\s+given)\b/i,
  /\b(?:effective|safe|works?|beneficial)\s+(?:in|for)\s+(?:people|humans?)\b/i,
  // r402 收紧：translation 形须与疗效/适用性断言搭配，不收裸形——
  // 「translation to humans remains unproven」是标准谨慎表述，裸收误伤。
  /\btranslat\w+\s+to\s+(?:humans?|people)\s+(?:use|therapy|treatment|efficacy|benefit|settings?)\b/i,
  /\btranslat\w+\s+to\s+(?:the\s+clinic|clinical\s+use)\s+(?:for|as)\b/i,
  /\b(?:can|could|will)\s+(?:be\s+)?translat\w+\s+to\s+(?:humans?|people|patients?|the\s+clinic)\b/i,
];

// ─── 豁免一：概念/教学转述 ─────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /证据.{0,6}(充分|不足|充足|缺失|链|效力|强度|等级|分级)|证据力|举证|采信|可信度/,
  /因果推断|因果关系|相关关系|相关不等于|相关性|混杂|混淆变量|第三变量|共同因素|辛普森|内生性|外推|过度概括|以偏概全|样本量|抽样框|置信区间|显著性/,
  /逻辑谬误|逻辑错误|谬误|话术|归因谬误|统计谬误|推理谬误/,
  /统计学|教材|课本|课堂|教案|论文写作|科普|概念(?!验证)|定义|方法论|研究设计/,
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

// ─── r402 豁免五：物种鸿沟/临床前状态的谨慎声明 ──────────────────────
// 家族 C 的关键豁免：显式声明「动物结论不能直接外推到人体」的谨慎
// 表述——这正是本维度要教的判别动作，不能反被判为谬误。覆盖：不能
// 外推/不能推广/物种差异/临床前阶段/需临床试验验证；EN translation
// gap / remains unproven / preclinical only / not yet been shown in
// humans / species differences / needs clinical trials。
const EXEMPT_TRANSLATION_ZH = [
  /不能外推|无法外推|不可外推|不宜外推|难以外推|不能推广|不能直接|不能简单|不能轻易|不可直接/,
  /物种(?:差异|区别|不同|间)|种属差异|动物(?:与|和)人|人与动物|跨越物种/,
  /临床前|尚处临床前|仅处临床前|前临床|尚未临床|未进入临床|还没进入临床/,
  /(?:还需|还需要|仍需|尚需|有待|有待于)[^。；，]{0,12}(?:临床|试验|验证|确认|人体)/,
  /(?:临床|人体)?试验[^。；，]{0,6}(?:验证|确认|检验)[^。；，]{0,6}(?:才|再|方|)/,
  /漫长的|漫长的验证|漫长的过程|漫长的路|很长的路|言之过早|为时尚早|不能想当然/,
  /(?:转化|翻译)(?:医学|研究)?[^。；，]{0,8}(?:鸿沟|差距|难题|瓶颈|挑战|失败率高|成功率低)/,
];
const EXEMPT_TRANSLATION_EN = [
  /\b(?:cannot|can'?t|could\s+not|must\s+not|should\s+not)\s+(?:be\s+)?(?:directly\s+)?(?:extrapolat\w+|generaliz\w+|translat\w+|appl\w+)\s+(?:to\s+)?(?:humans?|people|patients?|the\s+clinic|clinical)\b/i,
  /\bspecies\s+(?:differences?|gap|variation)\b/i,
  /\b(?:translation|translational)\s+(?:gap|medicine|research|failure)\b/i,
  /\bpreclinical\s+(?:only|stage|phase|results?)\b/i,
  /\b(?:not\s+yet|remains?|has\s+not|have\s+not|is\s+not|are\s+not)\s+(?:been\s+)?(?:shown|demonstrated|proven|tested|established|validated)\s+(?:in|for)\s+(?:humans?|people|patients?)\b/i,
  /\b(?:unproven|unconfirmed|untested|unvalidated)\s+in\s+(?:humans?|people|patients?)\b/i,
  /\b(?:preclinical|animal|in\s+vitro)\s+(?:results?|findings?|data|evidence)\s+(?:do\s+not|don'?t|cannot|can'?t)\s+(?:guarantee|ensure|prove|establish)\b/i,
  /\b(?:needs?|requires?|awaits?|warrants?)\s+(?:further\s+)?(?:clinical|human)\s+(?:trials?|testing|studies|validation)\b/i,
  // r402 补形：remains/stays + unproven/uncertain/to be seen 类谨慎态
  // （消融实测「translation to humans remains unproven」穿透豁免——该句
  // 是标准的正确判别表述）
  /\b(?:remains?|stays?|is|are)\s+(?:still\s+)?(?:unproven|uncertain|unclear|to\s+be\s+(?:seen|determined|established|confirmed))\b/i,
];

// ─── r402 豁免六：人体证据优先（家族 C 专用）──────────────────────────
// 句中明确以**人体试验/临床证据**为据时，人体结论有真人证支撑，不判
// 动物→人体失配。「临床试验已经证明该药对患者有效，可以用于治疗人类
// 的高血压」是真陈述；「Clinical trials demonstrated efficacy in patients」
// 同理。注意不收「临床试验前/准备开展临床试验」类未完成态。
const HUMAN_EVIDENCE_ZH = [
  // r402 修复：裸「试验证明」不算人体证据——「试验证明该药对65岁以上
  // 患者有效，所以年轻人同样适用。」（家族A攻击样本）正是「试验证明」
  // 形，r402 初版把 `(?:临床|人体)?` 设为可选，致整族攻击被误豁免。
  // 人体证据须显式出现「临床」或「人体」限定词，与家族 C 的物种腿形成
  // 「真人证 vs 动物证」的对照才有豁免意义。
  /(?:临床|人体)试验[^。；，]{0,10}(?:已经|已|业已)?[^。；，]{0,4}(?:证明|证实|确认|表明|显示)/,
  /(?:临床研究|临床数据|人体试验|人体研究)[^。；，]{0,12}(?:证明|证实|确认|表明|显示)/,
  /(?:已经|已)[^。；，]{0,6}(?:完成|开展|进行)?[^。；，]{0,4}(?:临床|人体)(?:试验|研究)/,
  // r402 修复补形：临床试验在前、动词在后的倒装（「临床试验显示该药
  // 对患者有效」）——显式人体限定词仍在，属真人证
  /临床试验[^。；，]{0,12}(?:有效|成功|达到|改善)/,
];
const HUMAN_EVIDENCE_EN = [
  /\b(?:clinical|human)\s+(?:trials?|studies|testing)\s+(?:have\s+)?(?:proved|proven|demonstrated|shown|showed|established|confirmed)\b/i,
  /\b(?:proved|proven|demonstrated|shown|showed|established|confirmed)\s+(?:in|by)\s+(?:clinical|human)\s+(?:trials?|studies)\b/i,
  /\bphase\s+(?:i{1,3}V?|1|2|3|4)\s+(?:trial|study|data)\b/i,
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
  // r402 腿②先行计算：家族 C 的两腿判据。注意腿②（人体结论断言）的
  // 计算必须早于豁免判定——「先免责铺垫、后越界断言」的攻击句（「虽然
  // 物种差异很大，不能想当然，但该药在临床上用于治疗人类是没问题的」）
  // 同时含谨慎词与人体断言，此时越界断言才是实质，不能因全文本命中
  // 谨慎词就整体豁免（r402 混合句实测：全文本豁免致 5/5 攻击穿透）。
  const overEarly = positions(R.OVERREACH_ZH || OVERREACH_ZH, text)
    .concat(positions(R.OVERREACH_EN || OVERREACH_EN, text))
    .concat(positions(R.OVERREACH_NEW_ZH || OVERREACH_NEW_ZH, text))
    .concat(positions(R.OVERREACH_NEW_EN || OVERREACH_NEW_EN, text))
    .concat(positions(R.OVERREACH_HUMAN_ZH || OVERREACH_HUMAN_ZH, text))
    .concat(positions(R.OVERREACH_HUMAN_EN || OVERREACH_HUMAN_EN, text));
  // r403 重构 hedge 豁免：原全文本判定把「The drug shrank tumors in
  // mice, so it may be effective in patients.」这类家族 C 攻击句整体放行
  // （may be 恰好修饰越界断言本身）。新规则：hedge 命中区间与任一腿②
  // （人体结论断言）命中区间重叠时，该 hedge 是越界短语的自带修饰语，
  // 不构成对冲豁免；hedge 在腿②跨度之外的，维持原有全文本豁免行为。
  // HEDGE_OVERLAP_WIN=12：hedge 词（may be/might 等）到腿②命中起点的
  // 距离 ≤12 字符时判定为「修饰该断言」——覆盖 may/might/could (3-5) +
  // be (2) + 空格 (1) + 至越界动词（effective/cures）的距离。
  const HEDGE_OVERLAP_WIN = 12;
  const hedgeHitsZh = positions(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text);
  const hedgeHitsEn = positions(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text);
  const hedgesOutsideClaim = hedgeHitsZh.concat(hedgeHitsEn).filter((h) => !overEarly.some((o) => Math.abs(o - h) <= HEDGE_OVERLAP_WIN));
  const hedgeOnlyOutside = hedgesOutsideClaim.length > 0 && hedgesOutsideClaim.length === hedgeHitsZh.length + hedgeHitsEn.length;
  // r402 修复：人体断言语义须剔除**被否定词直接支配**的命中——
  // 「不能据此认为维生素C能预防所有感染」中，越界命中「能预防所有」
  // 虽距否定词「不能」10 字，但整段是「不能…认为…」的从属否定链，
  // 否定词支配其右侧整段从句；「不能推广到其他人群」同理。判据改为
  // **单向左窗口**：越界命中起点之前 NEG_WIN 字内出现否定词，即视为
  // 被该否定支配，不计入人体断言。r307 良性「研究显示相关性不等于因
  // 果，不能据此认为维生素C能预防所有感染。」实测命中前 10 字处有
  // 「不能」，剔除后 false（HEAD 态行为恢复）；而混合句攻击「小鼠数
  // 据还不能证明对人体有效，不过患者服用它可以控制病情」的后分句断
  // 言距前分句否定词 >NEG_WIN 字，仍独立计为人体断言（攻击不放行）。
  // 窗口取 20 字（ZH）/45 字符（EN），覆盖「不能/不足以/并不意味着 +
  // 据此/认为/证明 + 宾语」的常见从属链长度。
  const negPosZh = positions(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text);
  const negPosEn = positions(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text);
  const isZhText = /[\u4e00-\u9fff]/.test(text);
  const negWin = isZhText ? 20 : 45;
  const negated = (p) => (isZhText ? negPosZh : negPosEn).some((n) => n <= p && p - n <= negWin);
  const overPos = overEarly.filter((p) => !negated(p));
  const hasHumanClaim = overPos.length > 0;
  const over = overPos;
  // r403：hedge 豁免的最终接回点——hedge 命中全部位于腿②（人体结论断言）
  // 跨度之外时才整体豁免（对冲语气修饰的是句中别处的断言/铺垫）。若
  // hedge 落在腿②命中附近（如 may be 修饰 effective in patients 本身），
  // 它是越界断言的自带语气，不构成对冲，攻击句不放行。当人体断言已被
  // 否定支配剔除（hasHumanClaim=false）时，hedge 在跨度外即恢复豁免。
  if (hedgeOnlyOutside && !hasHumanClaim) return { hit: false, score: 0, detail: '', count: 0 };
  // r402：否定豁免（EXEMPT_NEG，既有族）同样受「人体断言在场则不放行」
  // 约束——「小鼠数据还不能证明对人体有效，不过患者服用它可以控制病情」
  // 是先否定铺垫、后独立人体断言的混合句，越界断言才是实质。
  if (hasHumanClaim === false && (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text))) return { hit: false, score: 0, detail: '', count: 0 };
  // r402：证据不足类豁免（EXEMPT_SUFF「证据有限/不能证明」）同样受约束
  // （混合句：先自认证据不足、后独立越界断言）。
  if (hasHumanClaim === false && (anyHit(R.EXEMPT_SUFF_ZH || EXEMPT_SUFF_ZH, text) || anyHit(R.EXEMPT_SUFF_EN || EXEMPT_SUFF_EN, text))) return { hit: false, score: 0, detail: '', count: 0 };
  // r402 豁免五：物种鸿沟/临床前状态的谨慎声明（家族 C 专用，先于判定）。
  // 仅当句中**无**人体结论断言时生效——含人体断言的混合句不放行。
  if (!hasHumanClaim && (anyHit(R.EXEMPT_TRANSLATION_ZH || EXEMPT_TRANSLATION_ZH, text) || anyHit(R.EXEMPT_TRANSLATION_EN || EXEMPT_TRANSLATION_EN, text))) return { hit: false, score: 0, detail: '', count: 0 };
  // r402 豁免六：人体证据优先——句中明确以**人体试验/临床证据**为据
  // （临床试验/临床研究/人体试验 + 证明/证实/显示；clinical trial(s)
  // proved/demonstrated/showed）时，人体结论有真人证支撑，动物腿即便
  // 在场也只是背景，不判失配（「临床试验已经证明该药对患者有效」是真
  /// 陈述）。此豁免只挡家族 C 的失配判定，不碰其他维度的行为。
  if (anyHit(R.HUMAN_EVIDENCE_ZH || HUMAN_EVIDENCE_ZH, text) || anyHit(R.HUMAN_EVIDENCE_EN || HUMAN_EVIDENCE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  // r338：腿①扩为五族——EVID（研究/数据标记）+ SUBGROUP（子组限定证据形，
  // 家族 A）+ CROSS_TRIAL（分立试验各自 vs 对照，家族 B）。子组限定形与
  // 跨试验分证形本身就是「证据覆盖范围」的声明，与 EVID 同属腿①语义。
  // r402：腿①再扩第六族 PRECLINICAL（动物/体外模型证据，家族 C）。
  const evid = positions(R.EVID_ZH || EVID_ZH, text)
    .concat(positions(R.EVID_EN || EVID_EN, text))
    .concat(positions(R.SUBGROUP_ZH || SUBGROUP_ZH, text))
    .concat(positions(R.SUBGROUP_EN || SUBGROUP_EN, text))
    .concat(positions(R.CROSS_TRIAL_ZH || CROSS_TRIAL_ZH, text))
    .concat(positions(R.CROSS_TRIAL_EN || CROSS_TRIAL_EN, text))
    .concat(positions(R.PRECLINICAL_ZH || PRECLINICAL_ZH, text))
    .concat(positions(R.PRECLINICAL_EN || PRECLINICAL_EN, text));
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
    OVERREACH_NEW_ZH, OVERREACH_NEW_EN,
    SUBGROUP_ZH, SUBGROUP_EN, CROSS_TRIAL_ZH, CROSS_TRIAL_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_SUFF_ZH, EXEMPT_SUFF_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_TRANSLATION_ZH, EXEMPT_TRANSLATION_EN,
    HUMAN_EVIDENCE_ZH, HUMAN_EVIDENCE_EN,
    PRECLINICAL_ZH, PRECLINICAL_EN, OVERREACH_HUMAN_ZH, OVERREACH_HUMAN_EN,
  }),
};
