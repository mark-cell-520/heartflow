/**
 * src/reverse-causation.js — 「因果倒置（reverse causation / 反向因果）」检测器
 * （第 172 个判别维度）
 *
 * [r174 立项] decision 本体在当前引擎（v6.8.101，171 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "counterfactual
 * reasoning" 命中 KDD Tutorial on Causal Inference and Counterfactual
 * Reasoning（objectID 23266032）与 "What If It Goes Wrong?: The Hidden
 * Dangers of Counterfactual Reasoning in AI"（43754084）；"causal inference"
 * 命中 "Causal inference as a blind spot of data scientists"（37890685，225 分）
 * 与 "Seven basic rules for causal inference"（41263928）——确认因果推断是
 * 数据科学与常识推理的公认盲区；GitHub fallacy-detection 仓库群
 * tmakesense/logical-fallacy ★20 / SeanFlannery/Logical.ly ★4 /
 * EPITA-SCIA/Fallacy-Detection-LLM ★2 全部 LLM-based，与纯规则引擎不同构，
 * 仅作概念背景）+ 引擎差距实测（r174 探针 /tmp/hf-probe-r174b.js，直调
 * src/gate.js）：10 条反向因果攻击样本 **7 条穿过硬闸门且零维度命中**
 * （仅报警/约谈/看医生 3 条被 pseudo_causal / fallacies 兜住），良性 10 条
 * 零误判（其中 1 条被既有 pseudo_causal 误拦，见已知边界）。
 *
 * 辨别的族：因果倒置（reverse causation / 反向因果）——把**对后果的应对
 * 行为**当成了**后果本身的原因**。人之所以采取某个行为，恰恰是因为不利
 * 后果已经存在或风险已经很高；于是「做这件事的人/地方，后果更严重」是
 * **选择效应**（后果筛出了行为人），不是该行为制造了后果：
 *   住院患者的死亡率明显更高，所以住院本身增加了死亡风险。
 *   接受心理治疗的人自杀率更高，所以心理治疗会把人推向自杀。
 *   报警越多的社区犯罪率越高，说明报警反而会招来犯罪。
 *   报了补习班的孩子成绩更差，所以补习班让孩子成绩更差。
 *   吃安眠药的人失眠更严重，因此安眠药是造成失眠的原因。
 *   装防盗窗的家庭被盗更多，可见防盗窗会吸引小偷。
 *   被约谈的官员更容易落马，所以约谈导致了他们落马。
 *   戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。
 *   裁员越多的公司效益越差，因此裁员是公司衰败的原因。
 *   Patients who were hospitalized had much higher mortality, so
 *   hospitalization itself increases the risk of death.
 *   Areas with more police reports have higher crime, which means
 *   reporting crimes actually attracts more crime.
 *
 * 与既有维度的边界（r174 归因）：
 *   · post_hoc / pseudo_causal 管「A 在 B 前发生所以 A 导致 B」的**时序**
 *     连接（且能抓「越…越…」相关框），本族管**方向搞反**：被指为原因的
 *     那个行为是对后果的应对，后果在前、行为在后，因果链被整体倒置；
 *   · conditional_proposition 管「如果A真就B」假设条件句当既成论据，本族
 *     不依赖假设条件句；
 *   · monocause 管多因压成单因，本族的方向本身就是错的；
 *   · selection_bias / survivorship_bias 管取样受限向总体推广，本族是
 *     「后果筛出行为人」的选择效应，且不需要向任何总体推广；
 *   · base_rate_neglect 管拿单个阳性信号无视基础概率，本族管两个变量
 *     间的因果方向。
 *
 * 判据（两腿共现，缺一不判）：
 *   腿① RESPONSE_CORR 反应型行为 × 相关/选择框，两形任一：
 *     R-a 选择差异框：反应型行为名词（住院/就医/吃药/报警/投诉/补习/
 *       约谈/戴口罩/装监控/买保险/裁员/封号……裸名词形态；EN hospitali[sz]ed /
 *       therapy / police reports / tutoring / wearing masks / cameras /
 *       insurance / layoffs）+ 「的」+ 群体名词（人/患者/孩子/社区/地区/
 *       公司/官员/家庭/用户/员工/骑手/居民；EN patients/people/those who/
 *       areas/children/drivers）落在 5 字（EN 30 字符）窗内（前后双向），
 *       **且**句中存在差异/相关标记（更/多/高/严重/差/容易/越/集中/往往/
 *       大都/明显/显著/频繁；EN more/higher/worse/more often/likely/tend）；
 *     R-b 递增相关框：反应型行为 + 「越」（12 字窗）且全文「越」出现 ≥2 次
 *       （「报警越多的社区犯罪率越高」「裁员越多的公司效益越差」）。
 *   腿② CAUSE 因果归因：因果动词（导致/造成/引发/引起/带来/招来/引来/
 *      催生/制造/滋生/助长/加剧/加重/诱发/促成/酿成/加大了/增加了/提高了/
 *      提升了/是…的原因/根源在于/罪魁祸首/让/令/使得；EN causes/leads to/
 *       results in/increases/worsens/is responsible for/contributes to）
 *      × 负面结果名词（死亡/死亡率/事故/犯罪/复发/恶化/失眠/抑郁/自杀/落马/
 *      倒闭/亏损/被骗/被盗/感染/感冒/副作用/风险/问题；EN death/mortality/
 *      accidents/crime/relapse/insomnia/depression/suicide/addiction/
 *      infections/losses）落在 16 字（EN 40 字符）窗内。
 *   缺腿不判：「住院病人的死亡率更高，因为重症患者本来就更容易住院」
 *   给出的是正确方向（且落在「是因为」豁免）；「住院治疗降低了死亡率，
 *   这是有随机对照试验支持的」落在实验证据豁免；「戴口罩的人感冒更多，
 *   但这不代表戴口罩导致感冒」落在推理否定豁免。
 *
 * 为什么取 VERIFY 级：因果方向无法由规则引擎独立证实，本维度只能识别
 * 「被指为原因的行为是对后果的应对」这一结构性错位。verify 的含义是
 * 「这个因果方向需要先过证据检验（干预时序/对照/机制）再采信」——调用方
 * 应要求补上方向判据（该行为发生在后果之前还是之后、有没有对照组、
 *  机制是什么），而不是接受默认的倒置方向。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（因果倒置/反向因果/混淆变量/相关不等于因果/辛普森
 *     悖论/内生性/统计学/教材/课堂；EN reverse causation/confounding/
 *     endogeneity/Simpson's paradox/textbook/lecture）——讨论这个谬误
 *     本身是正确判别；
 *   · 实验/证据语境（随机对照/对照组/实验组/双盲/前瞻性研究/队列研究/
 *     元分析/实验表明/数据显示/研究表明/实测/证据表明；EN randomized/
 *     controlled trial/RCT/control group/prospective/cohort study/
 *     meta-analysis/experiment/data show/evidence shows）——以证据而非
 *     观察性相关立论时方向已被检验；
 *   · 推理否定/反向承认（不能说明/不代表/不等于/并不意味着/推不出/不足以/
 *     未必/不一定/是因为/其实是因为/反过来/恰恰相反/反之；EN does not mean/
 *     cannot conclude/not necessarily/is because/the reverse/conversely）——
 *     明确拒绝该推断或给出正确方向；
 *   · 对冲（可能/也许/或许/大概/未必/不一定/恐怕/倾向于/似乎/有待；EN maybe/
 *     perhaps/might/possibly/probably/seems）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① RESP 反应型行为名词（中文，裸名词形态）──────────────────────
// 161 轮教训：全部取可独立出现的裸词形（住院/吃药/报警/裁员），不收
// 「住院治疗」「服药后」这类带后缀组合——同族词去掉后缀必须仍命中。
// 收录口径：**由不利后果或高风险处境触发**的应对/补救/防护/处置行为
// （其后果就是触发它的那个处境），不含预防性、治疗性或政策性中性的
// 动作（止痛药的肝损伤是直接药理效应，不属本族；加息/降息方向在现实
// 争论中双向都被主张，不收录）。
const RESP_ZH = [
  /住院|就医|看病|看医生|上医院|挂诊|吃药|服药|打针|输液|做手术|动手术|化疗|透析|吃安眠药|吃止痛药|吃抗抑郁药|看心理医生|心理咨询|心理治疗|接受治疗|报警|报案|投诉|维权|申诉|上诉|打官司|起诉|补习|补课|辅导班|请家教|复读|考研|约谈|诫勉|隔离|封控|封城|封锁|静态管理|戴口罩|头盔|戴头盔|装监控|安装监控|装防盗窗|装防盗门|买保险|投保|体检|筛查|裁员|裁撤|下岗|辞退|封号|禁言|下架|整顿|整改|检修|返工|止损|割肉|平仓|抢救|救援|灭火|装护栏|立规矩|定规章|助听器|拄拐|轮椅|假肢|护膝|护腰|护腕|支具|矫姿器|背背佳|[Oo][Kk]镜|角膜塑形镜|离焦镜|近视手术|激光手术|正畸|整牙|箍牙|种牙|根管|针灸|推拿|拔罐|艾灸|理疗|康复训练|戒毒|戒毒所|强制戒毒|戒断|戒酒|美沙酮|写检查|记过|处分|停课|请家长|补考|重修|补作业|查征信|拉征信|调流水|报险|理赔|核保|索赔|反诈|防骗教育|安全教育|延保|质保|召回|返厂|风控|反欺诈/,
  // [r275 新增族·并入上方 r174 首族元素内] 医疗辅具/戒断治疗/纪律处分/征信风控/
  // 反诈宣传类应对行为（其「后果」恰是触发它的处境——后果筛出行为人）。
  // 裸词形态：助听器/拄拐/OK镜/戒毒/补考/查征信/反诈/风控/延保 去前后缀仍命中。
  // 按 round-266 登记纪律并入既有元素（RESP_ZH 恒 2 条），不新增数组元素。
  // [r266 新增族] 风险焦虑/信息恐慌触发的应对行为（其"后果"恰是触发它的处境）
  // 自查：不收疫苗族——疫苗相关因果话语在公共讨论中高度极化，边际覆盖增益
  // 小于误伤面，按 r161 口径让位给人工审查（gate verify 由其他维度兜）。
  /囤口罩|囤盐|囤货|抢购|吃保健品|装净水器|买净化器|备药|囤药|装警报器|请保镖|买防身器|加装锁|换锁芯|劝退|清退|退学|开除|除名|留级|降级|停职|免职|撤职|问责|分手|离婚|拉黑|绝交|断亲/,
  // [r283 新增族·并入上方 r266 元素内] 纪律处分/学业处置/关系解除类应对行为：
  // 「成绩差的学生才被劝退学」——劝退/降级/离婚 是对已存在不利后果（成绩差/
  // 绩效差/感情破裂）的处置，被误当成后果的原因。裸词形态：劝退/开除/离婚
  // 去前后缀仍命中。按 round-266 登记纪律并入既有元素（RESP_ZH 恒 2 条）。
];

// ─── 腿① R-a 群体名词（中文）────────────────────────────────────────
// 「的」在名词两侧都可能出现——「住院**患者的**死亡率」是「名词+的」，
// 「住院**的**患者」是「的+名词」，两种框架都要收（r174 首版只收
// 「的+名词」，导致「住院患者的死亡率明显更高」整句漏判）。不收裸名词
// （无「的」约束的「公司裁员」式巧合邻近会造成误配——「裁员之后公司
// 效益好转」因此不判）。
const GROUP_DE_ZH = [
  /的(?:人|患者|病人|病患|患儿|孩子|儿童|学生|学员|社区|地区|区域|国家|公司|单位|官员|干部|群体|家庭|用户|股民|家长|员工|老人|女性|男性|案例|对象|人群|会员|居民|群众|乘客|司机|骑手|贫困户|农民工|创业者|消费者|业主|租客|账号|账户|职场人|打工人|车主|船主|货主|买家|患者家属|家长群|业主群|夫妻|情侣)|(?:人|患者|病人|病患|患儿|孩子|儿童|学生|学员|社区|地区|区域|国家|公司|单位|官员|干部|群体|家庭|用户|股民|家长|员工|老人|女性|男性|案例|对象|人群|会员|居民|群众|乘客|司机|骑手|贫困户|农民工|创业者|消费者|业主|租客|账号|账户|职场人|打工人|车主|船主|货主|买家|患者家属|夫妻|情侣)的/,
];

// ─── 腿① R-a 差异/相关标记（中文）────────────────────────────────────
const DIFF_ZH = [
  /更|多|高|严重|差|容易|越|集中|往往|大都|通常|明显|显著|尤其|特别|频繁|高出|居多|绝大多数|大多数|普遍/,
];

// ─── 腿① R-b 递增相关框（中文：越…越…）──────────────────────────────
const YUE_ZH = [/越/];

// ─── 腿② CAUSE 因果动词（中文）───────────────────────────────────────
const CAUSE_ZH = [
  /导致|造成|引发|引起|带来|招来|引来|吸引|催生|制造|滋生|助长|加剧|加重|诱发|促成|酿成|加大了|增加了|提高了|提升了|推高了|放大了|推向|推向了|是[^。，]{0,10}的原因|原因就在于|根源在于|罪魁祸首|让|令|使得/,
];

// ─── 腿② RESULT 负面结果名词（中文，裸名词形态）──────────────────────
const RESULT_ZH = [
  /死亡|死亡率|身亡|病故|猝死|遇难|伤亡|自杀|轻生|事故|车祸|犯罪|作案|违法|违规|小偷|窃贼|盗贼|复发|恶化|并发症|后遗症|失眠|抑郁|焦虑|成瘾|上瘾|失败|落榜|落马|出事|被抓|被查|被罚|爆雷|亏损|倒闭|破产|衰败|衰退|下滑|下跌|崩盘|瘫痪|泄露|被盗|被骗|生病|感冒|感染|受伤|受害|遇害|辍学|退学|更差|变差|退步|垫底|掉队|风险|问题|乱子|漏洞|故障|副作用|不良反应|反噬|反弹|雪崩/,
  // [r283] 裸表现结果族：「劝退直接导致成绩差」——无「更/变」前缀的结果形容
  // 词（成绩差/评分低/幸福感低），与纪律处分族配对。旧表只收 更差/变差 形。
  // [r283 修订] 名词与形容词之间容许「更」——「离婚导致幸福感更低」。
  /成绩[更]?[差低]|分数[更]?[差低]|表现[更]?[差低]|业绩[更]?[差低]|评价[更]?[差低]|口碑[更]?[差]|评分[更]?[差低]|排名[更]?[低后]|满意度[更]?[低差]|幸福感[更]?[低差]|收入[更]?[低少]|薪资[更]?[低少]|工资[更]?[低少]/,
];

// ─── 英文侧腿① ───────────────────────────────────────────────────────
const RESP_EN = [
  /\b(?:hospitali[sz]ed?|hospitali[sz]ation|in\s+hospital|hospital\s+care|admitted|admission|seeing\s+a\s+doctor|doctor'?s\s+visits?|taking\s+(?:sleeping\s+)?pills?|medication|therapy|psychological\s+(?:treatment|help|counseling)|counseling|sessions?|calling\s+the\s+police|police\s+reports?|reporting|complaints?|lawsuits?|suing|tutoring|cram\s+school|private\s+lessons?|wearing\s+(?:a\s+)?(?:mask|helmets?|seatbelts?)|security\s+cameras?|alarms?|insurance|layoffs?|downsizing|being\s+(?:fired|banned|blocked|suspended)|quarantine|lockdown|screenings?|antidepressants?|painkillers?|hearing\s+aids?|crutches|knee\s+supports?|wheelchairs?|prosthetics|drug\s+rehab|rehab|anti-fraud(?:\s+apps?)?|fraud[- ]prevention(?:\s+(?:education|programs?|campaigns?))?|safety\s+education|extended\s+warrant\w+|credit\s+checks?|background\s+checks?|claims?|expelled|expulsion|suspensions?|suspended|demoted|demotion|held\s+back|expelled\s+from)\b/i,
  // [r266 新增族] 风险焦虑/财产防护触发的应对行为（同 ZH 侧囤货族）
  /\b(?:doorbell\s+cameras?|ring\s+cameras?|vitamin\s+supplements?|security\s+guards?|panic\s+buying|stockpiling|hoarding|air\s+purifiers?|water\s+filters?|pepper\s+spray|self-?defense\s+(?:classes?|training))\b/i,
];
const GROUP_EN = [
  /\b(?:patients?|people|those\s+who|users?|children|students?|pupils?|workers?|employees?|drivers?|riders?|residents?|neighborhoods?|areas?|regions?|countries?|companies?|firms?|officials?|families|households|victims?|cases?|subjects?|applicants?|borrowers?|staff|workers|citizens)\b/i,
];
const DIFF_EN = [
  /\b(?:more|higher|greater|worse|worst|severe|severely|often|frequently|likely|tend|tends|prone|elevated|increased|excess|disproportionate)\b/i,
];

// ─── 英文侧腿② ───────────────────────────────────────────────────────
const CAUSE_EN = [
  /\b(?:causes?|caused|causing|leads?\s+to|led\s+to|leading\s+to|results?\s+in|resulted\s+in|resulting\s+in|brings?\s+about|brought\s+about|creates?|created|creating|produces?|produced|drives?|increases?|increased|increasing|raises?|raised|worsens?|worsened|aggravates?|is\s+responsible\s+for|contributes?\s+to|contributed\s+to|fuels?|fueled|spawns?|triggers?|triggered|induces?|induced|makes?|attracts?|draws?|invites?|breeds?)\b/i,
  // [r266 新增族] -ing 进行态因果动词（独立元素，供负例注入-删条定位）
  /\b(?:attracting|drawing|luring|inviting|pulling)\b/i,
];
const RESULT_EN = [
  /\b(?:death|deaths|mortality|fatalit\w+|accidents?|crashes?|crime|crimes?|offen[cs]es?|relapse|recurrence|deterioration|failure|collapse|bankruptc\w+|insomnia|depression|anxiety|suicide|dropouts?|addiction|dependent|complications?|side\s+effects?|infections?|injur\w+|illness|robber\w+|theft|fraud|scandals?|violations?|losses?|decline|recession|turnover|burnout|problems?|risks?|worse|poorer)\b/i,
  // [r266 新增族] 财产犯罪结果名词（与门铃摄像头/保安族配对）
  /\b(?:thieves|burglars?|burglaries|muggers?|muggings?|break-?ins?|stolen\s+packages?|vandalism)\b/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /因果倒置|反向因果|逆向因果|因果混淆|混淆变量|混杂因素|相关不等于因果|相关性不等于因果|辛普森悖论|辛普森悖误|内生性|选择效应|生态谬误|区群谬误|统计学|统计课|数学课|教材|课本|课堂|教案|论文里|文章里|科普|逻辑课|谬误|谬论|研究方法|课堂教学/,
];
const EXEMPT_META_EN = [
  /\b(?:reverse\s+causa\w+|causality\s+reversal|confounding|confounder|endogeneity|selection\s+effect|simpson'?s\s+paradox|correlation\s+(?:does\s+not|isn'?t)\s+(?:equal|imply)\s+causation|spurious\s+correlation|statistics|textbook|lecture|methodology|epidemiolog\w+|fallacy)\b/i,
];

// ─── 豁免二：实验/证据语境（方向已被检验）────────────────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|前瞻性研究|回顾性研究|队列研究|元分析|实验证明|实验表明|实验显示|数据显示|数据表明|统计显示|研究表明|调查显示|调研显示|跟踪研究|长期观察|实测|证据表明|有证据|临床试验|有效性试验/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[- ]blind|prospective|retrospective\s+cohort|cohort\s+study|meta[- ]analysis|experiment\w*|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|survey\w*|clinical\s+trial)\b/i,
];

// ─── 豁免三：推理否定/反向承认 ────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不代表|不等于|并不意味着|不意味着|推不出|不足以|未必|不一定|很难说|不见得|是因为|其实是因为|反过来|恰恰相反|反之|反过来才是|不能据此|无法据此/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient\s+evidence|no\s+evidence|is\s+because|actually\s+because|the\s+reverse|conversely|on\s+the\s+contrary)\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 与 nearAny 同，但目标窗从 source 匹配的**起点**起算（而非终点）——
 *  腿② 的因果动词模式「是…的原因」「原因就在于」会把结果名词整个吞进
 *  自己的匹配里（「裁员是公司衰败的原因」），从终点起算窗内只剩句号，
 *  结果腿永远找不到负面结果名词（r174 首版因此漏判整族）。 */
function nearFrom(sourceList, targetList, text, win) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const seg = text.slice(m.index, m.index + win);
      if (anyHit(targetList, seg)) return true;
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿①：R-a 选择差异框 + R-b 递增相关框 */
function responseZh(text, R) {
  const RESP = R.RESP_ZH || RESP_ZH;
  const GROUP = R.GROUP_DE_ZH || GROUP_DE_ZH;
  const DIFF = R.DIFF_ZH || DIFF_ZH;
  const YUE = R.YUE_ZH || YUE_ZH;
  // R-a：反应型行为 + 的 + 群体名词（前后双向：英文侧群体在前），且句中有差异标记
  if (nearAny(RESP, GROUP, text, 5, true) && anyHit(DIFF, text)) return true;
  // R-b：反应型行为 + 越（12 字窗）且全文「越」≥2 次（「报警越多的社区犯罪率越高」）
  if (nearAny(RESP, YUE, text, 12, false)) {
    const n = (text.match(/越/g) || []).length;
    if (n >= 2) return true;
  }
  return false;
}

/** 英文腿①：反应型行为 × 群体名词（30 字符窗双向）× 差异标记 */
function responseEn(text, R) {
  const RESP = R.RESP_EN || RESP_EN;
  const GROUP = R.GROUP_EN || GROUP_EN;
  const DIFF = R.DIFF_EN || DIFF_EN;
  if (nearAny(RESP, GROUP, text, 30, true) && anyHit(DIFF, text)) return true;
  // 递增相关框：the more X … the more/worse Y（比较词两侧同族即可）
  if (/\bthe\s+(?:more|worse|higher|greater|fewer)\b[^.]{0,40}\bthe\s+(?:more|worse|higher|greater|fewer)\b/i.test(text) && anyHit(RESP, text)) return true;
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkReverseCausation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① RESPONSE_CORR 反应型行为 × 相关/选择框
  const response = isZh ? responseZh(text, R) : responseEn(text, R);
  if (!response) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② CAUSE 因果归因：因果动词 × 负面结果（从因果动词起点起 18 字 /
  // 45 字符窗——「是…的原因」形的结果名词在动词匹配内部）
  const cause = isZh
    ? nearFrom(R.CAUSE_ZH || CAUSE_ZH, R.RESULT_ZH || RESULT_ZH, text, 18)
    : nearFrom(R.CAUSE_EN || CAUSE_EN, R.RESULT_EN || RESULT_EN, text, 45);
  if (!cause) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.6, count: 1,
    detail: isZh
      ? '因果倒置×把后果的应对行为当成后果的原因(zh)'
      : 'reverse causation×response-action-as-cause(en)',
  };
}

module.exports = {
  checkReverseCausation,
  __internals: () => ({
    RESP_ZH, GROUP_DE_ZH, DIFF_ZH, YUE_ZH, CAUSE_ZH, RESULT_ZH,
    RESP_EN, GROUP_EN, DIFF_EN, CAUSE_EN, RESULT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
