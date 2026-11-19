/**
 * src/lead-time-bias.js — 「领先时间偏误（lead-time bias）」检测器（第 270 个判别维度）
 *
 * [r401 立项] 缺口实证：scripts/round-401/probe-candidates.js + probe-leadtime.js
 * 五个候选族（Berkson / lead-time / Neyman / protopathic / verification bias）
 * 全部零命中实测后定拨 lead-time bias：中英双语攻击穿透 10/13 真零命中
 * （其余 3 条被 fallacy_of_relevance 宽泛兜底意外收），survivor_time_bias
 * （第 226 维）对同 13 条 stb=- 零命中（射程完全不重叠），良性边界 10/10
 * 全 pass 零误伤。
 *
 * 辨别的族：领先时间偏误（lead-time bias / lead time bias / screening
 * survival illusion）——筛查把**确诊时点**提前，但病人实际死亡时间
 * 没变；以「从确诊起算的生存期」变长为证据宣称筛查有效，把**记账
 * 起点前移**造成的生存期假性延长误认为真实获益：
 *   筛查让癌症更早被发现，所以患者的生存时间更长了。
 *   Screening detected the tumor two years earlier, so patients lived
 *   two years longer.
 *   Early detection extends the survival time of cancer patients.
 *
 * 与既有维度的边界（r401 归因）：
 *   · survivor_time_bias（第 226 维）管**存活者生存期长短差异**推断疗效
 *     （病程长度偏倚：慢病程病例更易被纳入）；本族两组**都可以是同期
 *     人群**，错在「诊断起点前移→生存期延长」的记账口径，不要求病程
 *     差异。实测该族对本族 13 条攻击 stb=- 零命中。
 *   · survivorship_bias（第 132 维）管**只统计存活者样本**；本族样本
 *     完整（含死亡），错在生存期的**起点定义**。
 *   · pseudo_causal / post_hoc 管**时间先后当因果**；本族锚在
 *     「筛查×诊断提前×生存获益」三元共现，有时间量语义而非泛时间先后。
 *   · fallacy_of_relevance（兜底维度）宽泛收取含因果词族的句子，不算
 *     本族覆盖：本腿族专收筛查语境的三元结构，射程精确。
 *
 * 判据（三腿共现，缺一不判）：
 *   · 腿① SCREENING 筛查/早诊语义（中英）：筛查/筛检/早筛/普查/体检/
 *     早诊/早发现/早查/screening/mammography/Pap smear/PSA/colonoscopy/
 *     early detection/screened。核心锚是筛查手段或「早发现」语义。
 *   · 腿② DIAGNOSIS_TIMING 诊断时点提前（中英）：提前/提早/前移/更早
 *     诊断/早几年发现/earlier diagnosis/diagnosed earlier/moved diagnosis
 *     forward/advance the time of diagnosis。**允许隐含形**——腿①的
 *     「早发现」本身即诊断提前语义（r401 实测：不放开则「早诊早治让
 *     生存时间延长」漏判）。
 *   · 腿③ SURVIVAL_GAIN 生存获益（中英）：生存期延长/生存时间变长/
 *     多活/活得长/生存期因此/survived longer/survival extended/gained
 *     extra years/longer survival/survival improved。
 *
 * 为什么取 VERIFY 级：单句可能是流行病学教学反例（「五年生存率不是
 * 筛查效果的好指标，因为领先时间偏误」正是本族要教的判别动作）、
 * 对他人错误论证的转述、新闻标题。verify 的含义是「这个生存期获益
 * 宣称可能只是诊断起点前移的假象，需要改看死亡率下降/总生存期
 * RCT 硬终点」——调用方应要求换硬终点指标，而不是接受从确诊起算
 * 的生存期差异。
 *
 * 明确不判的（豁免）：
 *   · 死亡率下降口径在场（死亡率下降/病死率下降/mortality reduction/
 *     fewer deaths/disease-specific mortality）：那是筛查的真实获益终点；
 *   · 元陈述破除本谬误（领先时间偏误/过度诊断/lead-time bias/
 *     overdiagnosis）：那是在教本族；注意与 survivor_time_bias 的
 *     EXEMPT_META 共享同一原则（该族已将 lead-time bias 列为元陈述豁免，
 *     本族同样豁免，两层互不双判）；
 *   · 治愈率/病灶根除口径（治愈率/根治/病灶消失/cure rate/remission）：
 *     机制性获益不是记账口径获益；
 *   · 与筛查无关的语境（软件 bug/工程排期/提前完成）不收——腿①不命中。
 */
'use strict';

// ─── 腿① SCREENING 筛查/早诊语义（中文）───────────────────────────
const SCREENING_ZH = [
  /筛查|筛检|早筛|早查|普査|普查|体检|人群筛查|筛查项目|筛查计划/,
  /早诊|早发现|早检出|早查出|提早发现|提前发现/,
  /防癌筛查|肿瘤筛查|癌症筛查|两癌筛查/,
  // 具体筛查手段（中文常写英文或通用名）
  /钼靶|乳腺X线|胃镜|肠镜|结肠镜|低剂量螺旋CT|低剂量CT|肺部CT|HPV检测|宫颈涂片|TCT|PSA检测|前列腺特异性抗原/,
];

// ─── 腿① SCREENING 筛查/早诊语义（英文）──────────────────────────
const SCREENING_EN = [
  /\bscreening\b/i,
  /\bscreen(?:ed|ing)?\s+(?:program|programme|test|tests|exam|cohort|arm|group|patients|men|women|population)\b/i,
  // 裸 screened 形容词（The screened patients ...）
  /\bthe\s+screened\s+(?:patients|men|women|group|cohort|arm|population|individuals|cases)\b/i,
  /\bmammograph(?:y|ic)\b/i,
  /\bPap\s+(?:smear|test)\b/i,
  /\bPSA\s+(?:test|screening|testing)\b/i,
  /\bcolonoscop(?:y|ies)\b/i,
  /\bfecal\s+(?:occult|immunochemical)\b/i,
  /\bearly\s+detection\b/i,
  /\bearly\s+diagnos(?:is|tic)\s+(?:program|initiative|screening)\b/i,
  /\b(?:screening|screening)\s+(?:test|program|programme|initiative)\b/i,
  // check-up 体检（Regular check-ups find disease earlier）
  /\b(?:regular\s+)?check[- ]?ups?\b/i,
  /\bhealth\s+check(?:[- ]?up)?s?\b/i,
  /\bannual\s+(?:physical|exam|examination)\b/i,
  // [r403] 早诊语义隐含形（与 ZH 侧「早发现」腿①隐含形对称）：
  // 「detected earlier / identified earlier / found at an earlier stage」
  // 本身即早期检出语义——EN 叙述 lead-time 时常不带 screening 字样
  // （「Because cancer is detected earlier now, the five-year survival
  // rate has improved」）。r403 实测该句 SCREENING 腿空穿透后补。
  /\b(?:detect(?:ed|ion)?|identif(?:y|ied|ication)|found|diagnos(?:is|ed))\s+(?:earlier|sooner|at\s+an\s+earlier\s+(?:stage|point|time))\b/i,
  /\b(?:earlier|sooner)\s+(?:detection|identification|diagnosis|discovery)\b/i,
];

// ─── 腿② DIAGNOSIS_TIMING 诊断时点提前（中文）────────────────────
// 注意：腿①「早发现」本身就是诊断提前语义，作为隐含形单独成腿②
const TIMING_ZH = [
  /(?:确诊|诊断|发现|检出)(?:的)?(?:时间|时点)?(?:被)?(?:提前|提早|前移|挪前|提前了|提早了)/,
  /(?:提前|提早|前移|早了)\s*(?:了)?\s*[0-9０-９一二两三四五六七八九十百千万]+\s*(?:年|个月|月|天|周|岁)/,
  /(?:提前|提早|更早|早几|早数)(?:年|个月|月|天)?(?:被)?(?:发现|确诊|诊断|检出|查出)/,
  // 早发现/早诊本身即诊断提前语义（隐含形）
  /早发现|早诊|早检出|早查出|提早发现|提前发现/,
  // [r403] 筛查引入时点族：「自从…筛查以来」「筛查普及后」「开展筛查
  // 之后」「推广筛查以后」——筛查在人群层面的意义就是诊断起点前移，
  // 引入时点表述与腿①筛查语义 + 腿③获益共现时，即完整的 lead-time
  // 叙事（「自从社区推广低价钼靶筛查以来，…中位生存时间由4年提高到
  // 了7年以上」）。r401 注释已确立「腿①筛查语义本身即诊断提前」的
  // 隐含形原则，此族是该原则在时点维度的展开；r403 实测该长句穿透
  // （TIMING 腿空）后补。
  /(?:自从|自|从)[^。，；]{0,18}(?:筛查|筛检|普查|体检|早筛|早查)[^。，；]{0,6}(?:以来|以后|之后|后|起)/,
  /(?:筛查|筛检|普查|体检|早筛|早查|推广|开展|普及)(?:项目|计划|工作|普及|推广|开展)?[^。，；]{0,6}(?:以来|以后|之后)/,
  /(?:随着|伴随)[^。，；]{0,16}(?:筛查|筛检|普查|早筛)(?:的)?(?:普及|推广|开展|应用|引入)/,
  // 更早/较早 + 诊断动词（「让病查得更早」「诊断更早」）
  /(?:更早|较早|提前|提早|再早)\s*(?:地)?\s*(?:被)?(?:发现|确诊|诊断|检出|查出|识别|找到|查)/,
  // 动词 + 得 + 更早（「病查得更早」「确诊得更早」倒装形）
  /(?:发现|确诊|诊断|检出|查出|识别|找到|查|筛|筛出)\s*(?:得)?\s*(?:更早|较早|再早|更早些|较早些)/,
  // 把…提前 / 使…提前
  /(?:把|将|使|令)[^。，；]{0,10}(?:确诊|诊断)(?:时间|时点)?(?:提前|提早|前移)/,
  // [r403] 历史/跨年代对比形（诊断时点前移的旁证句式）：「几十年前只能
  // 活3年，现在能活8年」「过去确诊后平均活2年，如今延长到了5年」——
  // 无任何「提前」字样，靠「过去/从前/几十年前/以往 vs 现在/如今/今天」
  // 的时段对照 + 生存期数值对比承载诊断起点差异语义。r403 实测攻击
  // 3「这个病现在确诊后平均能活8年，而几十年前只能活3年」穿透（timing
  // 三腿中仅 SCREENING+GAIN 命中）后补。
  /(?:过去|从前|以前|以往|几十年前|多年前|过去|曾经|当年|早年|昔日)\s*(?:的)?(?:患者|病人|人|确诊|诊断|发现|患)/,
  /(?:几十年前|多年前|以前|以往|过去|从前|当年|昔日)\s*[^。，；]{0,14}(?:只能|仅能|才|只)/,
  /而\s*(?:几十年前|多年前|以前|以往|过去|从前|当年|昔日)\s*[^。，；]{0,18}(?:只能|仅能|才)/,
  // 「现在/如今 + 能活 N 年」对照右支（左支过去形命中即可判同句对照）
  /(?:现在|如今|今天|眼下|当前|目前)\s*(?:的)?(?:患者|病人|人|确诊|诊断|发现|患)[^。，；]{0,12}(?:能活|可活|平均|可以活)/,
];

// ─── 腿② DIAGNOSIS_TIMING 诊断时点提前（英文）────────────────────
const TIMING_EN = [
  /\b(?:diagnos(?:is|ed|tic)|detect(?:ed|ion)?|identif(?:ied|ication)|found|caught|spotted)\s+(?:[^.,;]{0,25}?\s+)?(?:\d+\s+years?\s+|months?\s+|several\s+years?\s+)?(?:earlier|sooner|in\s+advance)\b/i,
  /\b(?:moved?|moves|shifts?|shifted|pushes?|pushed|advance[sd]?)\s+(?:the\s+)?(?:time\s+of\s+|date\s+of\s+|point\s+of\s+)?(?:diagnos(?:is|tic)|detection|discovery)\b/i,
  /\b(?:earlier|sooner)\s+(?:diagnos(?:is|ed)|detection|identification)\b/i,
  /\bdiagnos(?:is|ed)\s+(?:of\s+)?[^.]{0,20}\b(?:earlier|sooner|in\s+advance)\b/i,
  /\bcaught\s+(?:earlier|sooner)\b/i,
  /\bdetected\s+(?:earlier|sooner|at\s+an\s+earlier\s+(?:stage|time|point))\b/i,
  /\b(?:finds?|found|detects?|detected|identif(?:y|ies|ied))\s+[^.,;]{0,25}\b(?:earlier|sooner|in\s+advance)\b/i,
  // at an early stage / at an earlier stage 形（筛查在早期发现）
  /\b(?:finds?|found|detects?|detected|identif(?:y|ies|ied)|catches?|caught)\s+[^.,;]{0,25}\bat\s+an?\s+(?:early|earlier)\s+(?:stage|time|point)\b/i,
  /\bat\s+an?\s+(?:early|earlier)\s+stage\b/i,
  // earlier detection 裸名词短语（与 screening 腿共现时即为诊断提前语义）
  /\bearlier\s+diagnos(?:is|es)\b/i,
  /\bearly\s+detection\b/i,
  /\bearlier\s+detection\b/i,
  // [r403] 裸 smaller/earlier-stage 形：「Tumors found by screening are
  // smaller and patients survive longer.」——肿瘤「更小」本身即诊断时点
  // 提前的物理后果（同阶段肿瘤更早被发现时体积更小），与 screening 腿
  // 共现时承载前移语义；r403 实测该句穿透（timing 仅命中 screening）
  // 后补。注意裸 smaller 单独出现不判（须 screening/earlier-stage 族
  // 共现，腿①保证）。
  /\b(?:are|were|is|was)?\s*(?:smaller|small|tiny|tinyer)\b[^.!?]{0,40}\b(?:patients?|survive|survived|live|lived|survival)\b/i,
  // [r403] 历史对比形（EN）：「decades ago patients survived only 3 years,
  // now 8 years」「in the past … lived 2 years, today …」——时段对照 +
  // 生存期数值承载诊断起点差异。
  /\b(?:decades?\s+ago|years?\s+ago|in\s+the\s+past|formerly|previously|back\s+then|used\s+to)\b[^.!?]{0,60}\b(?:lived?|survived?|survival)\b/i,
  /\b(?:now|today|nowadays|currently|these\s+days)\b[^.!?]{0,40}\b(?:live|lives|survive|survives|survival)\b/i,
];

// ─── 腿③ SURVIVAL_GAIN 生存获益（中文）──────────────────────────
const GAIN_ZH = [
  /(?:生存期|存活期|生存时间|存活时间|生存时长)\s*(?:因此|从而|随之|也|都|就)?\s*(?:被)?(?:延长|变长|拉长|增长|增加|提高|提升|得到延长)/,
  // 副词插入形（显著/明显/大幅/从而/因此/也/都 插在名词与动词之间）
  /(?:生存期|存活期|生存时间|存活时间|生存时长)\s*(?:明显|显著|大幅|大大|因此|从而|随之|也|都|就|进一步|得以|得到了?|获得?了?)*\s*(?:延长|变长|拉长|增长|增加|提高|提升|改善|改善)/,
  /(?:延长|拉长|增长|增加|提高|提升)(?:了)?\s*(?:患者的?)?(?:生存期|存活期|生存时间|存活时间|生存时长|寿命)/,
  /(?:多活|多挺|多撑)(?:了)?\s*(?:整整|足足|将近|近了|近|约|大约|差不多|上下|左右)?\s*[0-9０-９一二两三四五六七八九十百千万零几数个多]+\s*(?:年|月|天|周|岁|载)/,
  /(?:活(?:得|的)?(?:更|比较|较)?(?:长|久)|存活(?:得)?(?:更|更久)?长)/,
  // 「也/都/就 变长了」口语形
  /(?:也|都|就|于是|从而|因此)?\s*(?:变长|拉长|延长)(?:了)?\s*(?:整整|足足|将近|近了|近|约|大约)?\s*[0-9０-９一二两三四五六七八九十百千万零几数个多]*\s*(?:年|月|天|周|岁|载)?/,
  // [r403] 认知框架形：「显得更长 / 看起来更长 / 显得活了更久」——生存
  // 获益是记账口径造成的观感而非真实获益（正是 lead-time 的核心语义）。
  // r403 实测「筛查普及后，肿瘤能更早被发现，患者的生存期因此显得更
  // 长」穿透（GAIN 腿空）后补。
  /(?:显得|看起来|看上去|貌似|仿佛|好像)(?:更|比较|较为)?(?:长|久|高|多)/,
  /(?:显得|看起来|看上去|貌似|仿佛|好像)(?:活的|生存的)?(?:更长|更久|更高|更多)/,
  /(?:被)?(?:显得|看起来|看上去)(?:患者|病人)?(?:能)?(?:活|生存)(?:得)?(?:更|比较)?(?:长|久)/,
  /(?:生存|存活)(?:时间|期)(?:明显|显著|大幅|更)?(?:长|优于|领先)/,
  /五年生存率\s*(?:因此|从而|随之)?\s*(?:提高|提升|增加|改善|上升)/,
  // 生存获益显式词
  /生存获益|生存收益|总生存(?:期)?(?:获益|延长|改善)/,
];

// ─── 腿③ SURVIVAL_GAIN 生存获益（英文）──────────────────────────
const GAIN_EN = [
  /\b(?:survived?|surviving|lived?)\s+(?:(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s+(?:years?|months?|weeks?|days?)\s+|months?\s+|years?\s+)?(?:longer|for\s+longer|significantly\s+longer|much\s+longer)\b/i,
  /\b(?:survive|survives)\s+longer\b/i,
  /\b(?:extends?|extending|lengthens?|lengthened|prolongs?|prolonged)\s+(?:the\s+)?(?:overall\s+)?(?:survival|survival\s+time|life\s+expectancy|lifetime)\b/i,
  /\b(?:longer|extended|improved|better|increased)\s+(?:overall\s+)?(?:survival|survival\s+time|life\s+expectancy|lifetime)\b/i,
  /\b(?:survival|life\s+expectancy)\s+(?:was\s+|were\s+|is\s+|gets?\s+)?(?:extended|lengthened|prolonged|improved|increased)\b/i,
  /\b(?:gained?|gains?|gain(?:ed|s)?)\s+(?:\d+\s+|several\s+|extra\s+|a\s+few\s+)*\s*(?:years?|months?|weeks?|days?)\s+of\s+life\b/i,
  /\b(?:extra|additional)\s+(?:years?|months?)\s+of\s+(?:life|survival)\b/i,
  /\b(?:five|5|ten|10|three|3)[-\s]?year\s+survival\s+(?:improved|increased|rose|went\s+up|was\s+better)\b/i,
  // [r403] survival rate + has/have improved 形（无前置限定词）：
  // 「Because cancer is detected earlier now, the five-year survival rate
  // has improved significantly.」——既有族只收 improved 紧跟 survival 或
  // 限定词+year survival improved，漏 has improved 助动词形，r403 实测
  // 攻击 6 穿透后补。
  /\b(?:five|5|ten|10|three|3)[-\s]?year\s+survival\s+rate\s+(?:has|have|had)?\s*(?:improved|increased|risen|rose|got\s+better|been\s+better)\b/i,
  /\bsurvival\s+rate\s+(?:has|have|had)?\s*(?:improved|increased|risen|rose|got\s+better|climbed|jumped)\b/i,
  /\bsurvival\s+(?:rate|rates)\s+(?:improved|increased|improves|increases|rose|climbed|jumped)\b/i,
  /\bsurvival\s+(?:improved|increased|improves|increases|rose)\b/i,
  /\b(?:appear(?:s|ed)?\s+to\s+)?(?:improve|improves|improved|lengthen|increase|increase[sd]?|boost(?:s|ed)?)\s+(?:\w+\s+){0,2}(?:survival|survival\s+time|life\s+expectancy)\b/i,
  /\b(?:live|lives)\s+longer\b/i,
  // survival ... appeared to improve（倒装形）
  /\b(?:survival|survival\s+time|life\s+expectancy)\s+(?:appears?|appeared|seems?|seemed|looks?|looked)\s+to\s+(?:improve|improves|lengthen|increase|increase[sd]?|boost(?:s|ed)?)\b/i,
  /\b(?:lives?|lifetimes?)\s+(?:were\s+)?(?:extended|lengthened|saved)\b/i,
];

// ─── 豁免一：硬终点口径（死亡率下降——真实获益，非记账假象）────────
const EXEMPT_ENDPOINT_ZH = [
  /死亡率(?:下降|降低|减少|下降)|病死率(?:下降|降低|减少)/,
  // [r403] 死亡率数据/口径作宾语形（「需要随机对照试验的死亡率数据来
  // 回答」「要看死亡率而非生存期」）——作者已在正确口径上要求证据，
  // 不是宣称获益。r403 实测良性 1「筛查能更早发现问题，但能否延长
  // 寿命还需要随机对照试验的死亡率数据来回答。」被误伤后补。
  /(?:需要|要看|要看|应以|应以|取决于|取决于|取决于)[^。；，]{0,20}(?:死亡率|病死率|死亡风险)/,
  /(?:死亡率|病死率|死亡风险)(?:数据|指标|口径|终点|证据|结果|统计)/,
  /(?:而非|而不是|不能只看|不应只看|不是只看)[^。；，]{0,10}(?:生存期|生存时间|生存率|存活期)/,
  /死亡人数(?:减少|下降|降低)|少(?:死|死亡)|免于死亡|避免死亡/,
  /总生存期.{0,12}(?:随机|RCT|对照试验)|随机对照.{0,12}总生存期/,
  /疾病特异性死亡|癌因死亡|癌症死亡(?:率)?(?:下降|减少|降低)/,
];
const EXEMPT_ENDPOINT_EN = [
  /\bmortality\s+(?:reduction|decline|decrease|was\s+reduced|fell|dropped|decreased)\b/i,
  // [r403] mortality 作证据/指标宾语形（「requires mortality data from
  // RCTs」「mortality endpoint rather than survival」）——作者已在正确
  // 口径上要求证据。
  /\b(?:requires?|need(?:s|ed)?|depend(?:s)?\s+on|must\s+use|should\s+use)\b[^.!?]{0,40}\bmortality\b/i,
  /\bmortality\s+(?:data|endpoint|outcome|rate|rates|statistics|evidence)\b/i,
  /\b(?:rather\s+than|instead\s+of|not\s+(?:just|only))\s+(?:survival|survival\s+time)\b/i,
  /\b(?:reduced?|lower(?:ed)?|fewer)\s+(?:deaths|disease[- ]specific\s+mortality|cancer\s+deaths)\b/i,
  /\boverall\s+survival\s+(?:in\s+the\s+)?(?:RCT|randomized|trial)\b/i,
  /\bdied\s+(?:less\s+often|fewer)\b/i,
];

// ─── 豁免二：元陈述破除本谬误（lead-time bias 名字在场）──────────
// 与 survivor_time_bias 的 EXEMPT_META 同原则：该族已把 lead-time bias
// 列为元陈述豁免，本族同样豁免，两层互不双判。
const EXEMPT_META_ZH = [
  /领先时间偏倚|领先时间偏差|领先时间偏误|过度诊断|过診/,
  /生存期.{0,16}(?:不可比|没法比|不能直接比|有偏|误导|假象|假性)/,
  /(?:忽略|忽视|没考虑|未考虑|不考虑)(?:了)?(?:领先时间|诊断时点|起算点|记账起点)/,
  /(?:五年)?生存率.{0,12}(?:不是|并非|算不上).{0,8}(?:好|可靠|有效|合适).{0,6}(?:指标|标准)/,
];
const EXEMPT_META_EN = [
  /\blead[- ]?time\s+bias\b/i,
  /\boverdiagnos(?:is|is)\b/i,
  /\bsurvival\s+(?:time|times|gain)\s+(?:is|are)\s+(?:a\s+)?(?:misleading|illusion|not\s+comparable|biased)\b/i,
  /\bignor(?:e|es|ing|ed)\s+(?:the\s+)?lead[- ]?time\b/i,
  /\bnot\s+a\s+(?:good|valid|reliable)\s+(?:endpoint|measure|metric|surrogate)\s+(?:for|of)\s+screening\b/i,
  /\b(?:five|5)[-\s]?year\s+survival\s+(?:rate\s+)?is\s+(?:a\s+)?(?:misleading|not\s+a\s+good)\b/i,
];

// ─── 豁免三：机制性/治愈口径（非记账口径获益）───────────────────
const EXEMPT_CURE_ZH = [
  /治愈率|根治|根除|病灶消失|肿瘤消失|完全缓解|临床治愈/,
  /(?:防止|阻止|避免|延缓)(?:了)?(?:转移|进展|恶化|复发)/,
  /(?:治疗|干预|处理)(?:窗口|时机|时间窗)(?:期)?(?:更好|更佳|更早|提前)/,
];
const EXEMPT_CURE_EN = [
  /\bcure\s+rate\b|\bcured\b|\bcurative\b/i,
  /\b(?:prevents?|prevented|preventing|halts?|halted|stops?|stopped)\s+(?:metastasis|progression|spread)\b/i,
  /\b(?:therapeutic|treatment)\s+window\b/i,
  /\bremov(?:ed|al)\s+(?:of\s+)?(?:the\s+)?(?:tumor|lesion|polyp)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 统计某正则清单在文本中的总匹配次数（保留原 flags 并补 g）
function countMatches(list, text) {
  let n = 0;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) n += m.length;
  }
  return n;
}

/**
 * 领先时间偏误判别：筛查语义腿 × 诊断时点提前腿 × 生存获益腿，三腿共现。
 *
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLeadTimeBias(text, inject) {
  // [稳定性审计 2026-11-09] 非字符串入口守卫：number/object 会让 text.match 崩溃。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const S_Z = R.SCREENING_ZH || SCREENING_ZH;
  const S_E = R.SCREENING_EN || SCREENING_EN;
  const T_Z = R.TIMING_ZH || TIMING_ZH;
  const T_E = R.TIMING_EN || TIMING_EN;
  const G_Z = R.GAIN_ZH || GAIN_ZH;
  const G_E = R.GAIN_EN || GAIN_EN;
  const P_Z = R.EXEMPT_ENDPOINT_ZH || EXEMPT_ENDPOINT_ZH;
  const P_E = R.EXEMPT_ENDPOINT_EN || EXEMPT_ENDPOINT_EN;
  const M_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const M_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const C_Z = R.EXEMPT_CURE_ZH || EXEMPT_CURE_ZH;
  const C_E = R.EXEMPT_CURE_EN || EXEMPT_CURE_EN;

  // 硬终点口径 / 元陈述破除 / 机制性治愈口径 → 不判
  if (anyHit(P_Z, text) || anyHit(P_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(C_Z, text) || anyHit(C_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿① 筛查/早诊语义（至少一处）
  const screeningCount = countMatches(S_Z, text) + countMatches(S_E, text);
  if (screeningCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 诊断时点提前语义（至少一处；「早发现」隐含形计入）
  const timingCount = countMatches(T_Z, text) + countMatches(T_E, text);
  if (timingCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③ 生存获益语义（至少一处）
  const gainCount = countMatches(G_Z, text) + countMatches(G_E, text);
  if (gainCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: gainCount,
    detail: isZh
      ? '领先时间偏误×诊断起点前移误作生存获益(zh)'
      : 'lead-time-bias×earlier-diagnosis-as-survival-gain(en)',
  };
}

module.exports = {
  checkLeadTimeBias,
  __internals: () => ({
    SCREENING_ZH, SCREENING_EN,
    TIMING_ZH, TIMING_EN,
    GAIN_ZH, GAIN_EN,
    EXEMPT_ENDPOINT_ZH, EXEMPT_ENDPOINT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CURE_ZH, EXEMPT_CURE_EN,
  }),
};
