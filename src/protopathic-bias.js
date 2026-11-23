// protopathic_bias（反向因果：前驱症状驱动暴露，效果被反授于暴露）——第 280 维度（r443 接线）
//
// 判据：一句话里 腿①（前驱症状/疾病状态/不适）× 腿②（因该状态而采取的暴露：
// 服药/补充/求医/忌口）× 腿③（结果改善被归因为该暴露）三腿共现。
//
// 这是流行病学里的 **protopathic bias（原反因果偏误 / reverse causation）**：
// 暴露不是原因，而是**结果**——疾病的早期表现（前驱症状）反过来驱动了
// 暴露的选择。典型结构：「出现早期症状→才开始吃药→病情好转→证明药有效」。
// 时序上暴露确实在前，但暴露本身由症状引起，因果方向与叙述方向相反。
//
// 与既有维度射程分工（源码逐链核对 + 探针实证）：
// - reverse_causation（第 172 维）管泛化的因果倒置（「A→B 其实是 B→A」的
//   抽象声明）；本族三腿更具体：前驱症状腿 × 症状驱动暴露腿 × 疗效归因腿，
//   且腿①必须是**症状/疾病/不适**类名词（疼痛/咳嗽/失眠/疲劳/头晕/消瘦/
//   不舒服/不适/生病/确诊），腿②必须是**因症状采取的暴露**（吃药/补充/求医/
//   忌口/停用），腿③必须是**效果改善的归因宣告**。探针实证：reverse_causation
//   对 20 条攻击样本中 0 条命中——其词表不收症状名词与暴露动作的共现形。
// - post_hoc 管「A 在 B 前所以 A 导致 B」的时序泛化；本族的承重点是
//   **暴露由症状反向驱动**这一因果结构（「因为痛才吃」），不是单纯先后。
// - intervention_effect_without_baseline（第 278 维）腿①必须是**一次性干预
//   动作**（上线/推行/部署/发布）；本族腿②是**患者/个体因症状采取的暴露**
//   （服药/补充/求医），主语是人不是组织，且腿①症状必须在场。探针实证：
//   22 条攻击样本仅 2 条被其命中（均因含「上线/推行」类组织动作词），
//   其余 20 条穿透。
// - baseline_omission 腿①是比例结果名词；本族腿①是症状名词，不重叠。
// - cum_hoc / pseudo_causal 管泛化共现因果；本族限定「症状→暴露→疗效」
//   三腿方向链。
//
// 为什么取 VERIFY 级：单句可能是真实的临床观察报告、病史陈述、或转述
// 他人说法。verify 的含义是「这个疗效归因把因果方向搞反了，采信前必须
// 补上基线严重度、对照、或时间序列证据」。
//
// 探针实证（scripts/round-443/probe-r443.js，v6.8.217 gate 层）：
// 攻击池 20 条中英双语，17 条完全穿透零维度承重。

'use strict';

// ============ 腿① SYMPTOM 前驱症状/疾病状态（中英，含裸名词形）============
// 161 轮教训：收裸名词形「疼痛」「咳嗽」而不只收「出现早期症状」——
// 同族词去掉修饰后仍独立命中。
const SYMPTOM_ZH = new RegExp([
  // 疼痛/不适族（裸名词）
  '疼痛', '痛疼', '酸痛', '胀痛', '隐痛', '刺痛', '剧痛', '钝痛',
  '头痛', '偏头痛', '胃痛', '肚子痛', '腹痛', '腰痛', '关节痛', '关节疼痛',
  '胸痛', '背痛', '牙痛', '喉咙痛', '嗓子痛', '肌肉痛', '经痛',
  '不舒服', '不适', '难受', '不舒坦', '乏力', '疲乏', '疲劳', '疲倦',
  '疲惫', '没精神', '提不起精神', '虚弱', '体虚', '虚弱无力',
  '咳嗽', '咳喘', '气喘', '哮喘', '气短', '喘不过气',
  '头晕', '眩晕', '头昏', '昏沉', '眼花',
  '失眠', '睡不着', '睡眠差', '多梦', '易醒', '入睡困难',
  '食欲不振', '没胃口', '胃口差', '消化不良', '腹胀', '腹泻', '便秘',
  '恶心', '呕吐', '反胃', '烧心', '胃酸', '胃胀',
  '消瘦', '体重下降', '掉体重', '消瘦明显', '日渐消瘦',
  '发热', '发烧', '低烧', '持续低热', '盗汗', '出虚汗',
  '心慌', '心悸', '胸闷', '气促', '浮肿', '水肿',
  '麻木', '抽搐', '震颤', '手抖', '僵硬',
  '抑郁', '焦虑', '烦躁', '情绪低落', '紧张', '失眠多梦',
  '过敏', '皮疹', '瘙痒', '湿疹', '鼻炎', '打喷嚏', '流鼻涕',
  '生病', '患了', '患病', '得了', '确诊', '查出', '诊断出',
  '不舒服', '状态不佳', '气色差', '精神差', '亚健康', '免疫力差', '抵抗力差',
  '免疫力低', '体质差', '关节不好', '腰不好', '胃不好', '睡眠不好',
  '精神不振', '萎靡', '倦怠',
  '出现.{0,4}症状', '早期.{0,4}症状', '前驱.{0,4}症状', '轻度.{0,4}症状',
  '症状.{0,4}(?:出现|加重|减轻)', '不舒服.{0,6}(?:开始|才|于是)',
].join('|'));

const SYMPTOM_EN = new RegExp([
  '\\b(?:pain|ache|aching|sore|soreness|tender|tenderness|hurt|hurts|hurting)',
  '\\b(?:headache|migraine|back\\s*pain|stomach\\s*(?:ache|pain)|abdominal\\s*pain|joint\\s*pain|chest\\s*pain|tooth\\s*ache|throat\\s*(?:pain|sore))',
  '\\b(?:fatigue|tired|tiredness|exhausted|exhaustion|lethargy|weakness|fatigued|weary|drained|low\\s*energy)',
  '\\b(?:cough|coughing|wheeze|wheezing|shortness\\s*of\\s*breath|breathless|asthma)',
  '\\b(?:dizz(?:y|iness)|light[- ]?headed|faint|vertigo)',
  '\\b(?:insomnia|cannot\\s*sleep|couldn\\u2019?t\\s*sleep|trouble\\s*sleeping|sleep\\s*(?:problems?|disturbance)|sleepless|poor\\s*sleep)',
  '\\b(?:nausea|nauseous|vomiting|vomit|queasy|indigestion|bloating|diarrhea|constipation|reflux|heartburn)',
  '\\b(?:weight\\s*loss|losing\\s*weight|lost\\s*weight|unintended\\s*weight\\s*loss|wasting)',
  '\\b(?:fever|feverish|chills|night\\s*sweats?|sweating)',
  '\\b(?:palpitations|racing\\s*heart|edema|swelling|numbness|tingling|tremor|trembling|stiffness)',
  '\\b(?:depress(?:ed|ion)|anxious|anxiety|mood\\s*(?:low|swings?)|irritable|stress(?:ed)?)',
  '\\b(?:allerg(?:y|ies|ic)|rash|itching|itchy|eczema|hives|sneezing|runny\\s*nose|hay\\s*fever)',
  '\\b(?:ill|illness|sick|sickness|disease|diagnosed|diagnosis|infection|infected)',
  '\\b(?:unwell|poorly|feeling\\s*(?:unwell|off|under\\s*the\\s*weather)|not\\s*feeling\\s*well|run[- ]?down)',
  '\\b(?:low\\s*immun(?:e|ity)|weak\\s*immun(?:e|ity)|immunocompromised|poor\\s*immunity)',
  '\\b(?:symptom(?:s)?|early\\s*symptom(?:s)?|precursor|prodrome|prodromal|preclinical|subclinical)',
  '\\b(?:early[- ]?(?:stage|onset)|first\\s*sign(?:s)?|warning\\s*sign(?:s)?)',
].join('|'), 'i');

// ============ 腿② EXPOSURE 症状驱动的暴露（服药/补充/求医/忌口/停用）============
// 必须是**因症状而采取**的暴露动作/物品，不是组织的一次性干预动作。
const EXPOSURE_ZH = new RegExp([
  // 服药族（裸动词 + 带宾语形）
  '吃药', '服药', '吃了药', '服用', '吃了', '用药', '开始吃', '开始服用',
  '吃上', '吃起了', '吃着', '常吃', '天天吃', '每天吃', '一直在吃',
  '打针', '输液', '打点滴', '吊瓶', '挂水', '注射',
  // 保健品/补充族
  '补充', '进补', '食补', '药补', '调理', '调养', '养生',
  '维生素', '钙片', '鱼油', '褪黑素', '益生菌', '蛋白粉', '阿胶',
  '枸杞', '人参', '黄芪', '蜂蜜', '红糖', '姜茶', '甘草', '川贝',
  '保健品', '营养品', '补品', '膳食补充', '膳食补充剂',
  // 求医族
  '看医生', '看大夫', '就医', '求医', '挂号', '住院', '门诊', '复诊',
  '看中医', '看西医', '看专家', '求诊',
  // 生活方式改变族（因症状而启动）
  '忌口', '戒掉', '停用', '停吃', '不再吃', '不敢吃', '开始戒',
  '早睡', '早起', '开始锻炼', '开始运动', '开始跑步', '开始散步',
  '开始泡脚', '开始热敷', '开始按摩', '开始贴', '开始针灸',
  '开始喝', '喝上了', '泡上', '喝起了', '吃起了',
  '买了', '囤了', '备上', '常备', '家里备',
  '敷', '贴了', '泡了', '按摩', '针灸', '艾灸', '拔罐', '刮痧',
  '戒烟', '戒酒', '戒糖', '少油', '少盐', '清淡',
  // 饮品/食补暴露（因症状而喝的饮品，含裸名词形——161 轮教训）
  '喝咖啡', '喝了咖啡', '开始喝咖啡', '天天喝咖啡', '喝起了咖啡',
  '喝茶', '喝了茶', '喝浓茶', '开始喝茶', '喝起了茶',
  '喝牛奶', '喝热牛奶', '喝红糖水', '喝蜂蜜水', '喝柠檬水',
  '喝姜汤', '煮姜汤', '泡姜茶', '喝起了姜茶', '泡上了茶',
  '喝中药', '熬中药', '煎中药', '喝上了中药', '中药调理',
  '喝可乐', '喝奶茶', '喝功能饮料', '喝运动饮料', '喝补液',
  '热敷', '冷敷', '敷上', '泡脚', '泡上了脚', '泡起脚',
].join('|'));

const EXPOSURE_EN = new RegExp([
  '\\b(?:took|take|taking|takes|started\\s*taking|began\\s*taking|tried\\s*taking|switched\\s*to\\s*taking)',
  '\\b(?:prescrib(?:ed|e|es|ing)|was\\s*prescribed|put\\s+on|started\\s+on)',
  '\\b(?:supplement(?:s|ed|ing|ation)?|vitamin(?:s)?|fish\\s*oil|melatonin|probiotic(?:s)?|calcium|magnesium|zinc|iron\\s*(?:pills?|supplements?)|protein\\s*powder|herb(?:s|al)?|remed(?:y|ies))',
  '\\b(?:sought|seek|seeking|got|getting|obtained|arranged)\\s+(?:medical|treatment|care|a\\s+doctor|help)',
  '\\b(?:visit(?:ed|ing)?|saw|consult(?:ed|ing)?|appointment\\s+with)\\s+(?:a|the|his|her|their)?\\s*(?:doctor|physician|GP|specialist|clinician|hospital|clinic)',
  '\\b(?:hospitali[sz]ed|admitted|inpatient|outpatient)',
  '\\b(?:started\\s+(?:exercising|running|walking|jogging|working\\s*out|yoga|meditat\\w+|sleeping\\s+earlier|going\\s+to\\s+bed\\s+early))',
  '\\b(?:quit|quitting|stopped|cut\\s+out|gave\\s+up|avoid(?:ing|ed)?|eliminat(?:ed|ing))\\s+(?:smoking|caffeine|alcohol|sugar|dairy|gluten|coffee|red\\s*meat)',
  '\\b(?:began|started|switched|moved|changed)\\s+(?:drinking|eating|using|taking|a\\s+diet|diet)',
  '\\b(?:wearing|uses?|using|applying|applied)\\s+(?:a|the)?\\s*(?:brace|support|pillow|mattress|cream|ointment|patch|device|brace|splint|knee)',
  '\\b(?:turned\\s+to|resorted\\s+to|reached\\s+for|relies?\\s+on|dependent\\s+on)',
  // 给药/接受治疗族（裸接受形 + 接受名词形）
  '\\b(?:got|received|receiving|was\\s+given|were\\s+given|given|taking\\s+the\\s+treatment|given\\s+the\\s+(?:drug|treatment|medication|injection))\\b',
  '\\b(?:treatment|therapy|medication|medicine|drug|injection|infusion|dose|dosage|regimen|course\\s+of\\s+treatment)\\b',
  '\\b(?:was\\s+(?:put|started)\\s+on\\s+(?:a|the|his|her)\\s+(?:course|regimen|treatment|medication|drug|pill|therapy))',
  '\\b(?:started|began|tried|went\\s+on)\\s+(?:the\\s+)?(?:treatment|therapy|medication|medicine|drug|diet|supplement|vitamin)',
  '\\b(?:drank|drinking|drinks|started\\s+drinking|began\\s+drinking|switched\\s+to\\s+drinking)\\s+(?:coffee|tea|milk|green\\s+tea|herbal\\s+tea|soup|broth|juice|smoothie|energy\\s+drink)',
  // 裸饮用动词：he drank ginger tea / she drinks turmeric milk（无限定饮料名时也需命中腿②）
  '\\b(?:drank|drinking|drinks|had\\s+been\\s+drinking)\\b',
  '\\b(?:coffee|tea|green\\s+tea|herbal\\s+tea|ginger\\s+tea|turmeric|honey|cinnamon|apple\\s+cider\\s+vinegar)\\b',
].join('|'), 'i');

// ============ 腿③ OUTCOME_CLAIM 疗效归因宣告 ============
// 改善/痊愈被宣告为该暴露的效果。两类词：
//   ① 疗效改善宣告（好转/痊愈/有效/improved/recovered）
//   ② 归因连接词（所以/可见/证明/so/proves/which is why）
// 后者从 OUTCOME 词表拆出为独立常量，供 detail 分桶承重与后续轮次复用。
const IMPROVEMENT_ZH = new RegExp([
  // 改善/好转宣告
  '好转', '改善了', '改善', '见好', '好多了', '好起来', '康复', '痊愈',
  '治愈', '治好了', '根治', '有效', '有用', '管用', '灵验', '见效',
  '起效', '见效快', '立竿见影', '效果明显', '疗效', '疗效显著',
  '减轻', '缓解', '舒缓', '消退', '消失', '不见了', '没了',
  '不再', '不疼', '不痛', '不咳', '睡得着', '睡着了', '精神好',
  '精力充沛', '有精神', '气色好', '身体好', '体质改善', '状态好',
  '指标正常', '指标恢复', '恢复', '回归正常', '稳定了', '控制了',
  '明显好转', '大有好转', '日益好转', '逐渐好转', '日渐好转',
].join('|'));

const ATTRIBUTION_ZH = new RegExp([
  // 归因连接（暴露 × 疗效 的因果/推论连接）
  '所以', '因此', '因而', '于是', '从而', '可见', '说明', '证明',
  '表明', '足以证明', '显然', '果然', '多亏', '幸亏', '得益于',
  '归功于', '靠', '正是因为', '正是因为', '就是.{0,4}(?:治好|改善|缓解|起效)',
  '起作用', '功劳', '起了作用', '发挥作用', '见效是', '之所以',
  '让', '使', '带来', '带来改善', '促使好转',
].join('|'));

const OUTCOME_ZH = new RegExp([
  IMPROVEMENT_ZH.source, ATTRIBUTION_ZH.source,
].join('|'));

const IMPROVEMENT_EN = new RegExp([
  '\\b(?:improved|improvement|better|got\\s*better|feeling\\s*better|felt\\s*better|recovered|recovery|healed|healing|cured|cure|resolved|resolution|remission|remitted)',
  '\\b(?:relieved|relief|alleviated|eased|subsided|disappeared|gone|vanished|diminished|reduced|lessened)',
  '\\b(?:went\\s+away|faded(?:\\s+away)?|cleared\\s+up|wore\\s+off|(?:pain|ache|symptom\\w*)\\s+(?:is|are|was|were)\\s+gone|no\\s+longer\\s+(?:hurt\\w*|aching|present))',
  '\\b(?:effective|effectively|efficacy|works?|worked|worked\\s*well|did\\s*the\\s*trick|help(?:ed|ful|s)?|helpful)',
  '\\b(?:slept\\s*better|sleeping\\s*better|able\\s+to\\s+sleep|fall\\s*asleep\\s*(?:faster|easily|easier)|slept\\s*through)',
  '\\b(?:normalized|back\\s+to\\s+normal|under\\s+control|controlled|stabilized|managed|remission)',
].join('|'), 'i');

const ATTRIBUTION_EN = new RegExp([
  '\\b(?:so|therefore|thus|hence|consequently|which\\s+(?:means|shows|proves|suggests)|that\\u2019?s\\s+why|thanks\\s+to|because\\s+of\\s+(?:it|that|this)|credit(?:ed)?\\s+to|attributed\\s+to|owe(?:s|d)?\\s+to|due\\s+to\\s+(?:it|that|this|the))',
  '\\b(?:proves|proven|proving|demonstrates|demonstrating|indicates|indicating|evidence\\s+that|clear(?:ly)?\\s+(?:works?|effective)|shows?|showing|suggests?|suggesting)',
  '\\b(?:it\\s+was\\s+(?:the|that)\\b|the\\s+reason\\s+(?:why|I|we|they)|turned\\s+(?:things?|it)\\s+around|made\\s+(?:all\\s+)?the\\s+difference)',
  '\\bwhy\\b',
].join('|'), 'i');

const OUTCOME_EN = new RegExp([
  IMPROVEMENT_EN.source, ATTRIBUTION_EN.source,
].join('|'), 'i');

// ============ 豁免组 ============

// 豁免①：因果纪律在场——说话人自己点明暴露可能是结果不是原因，
// 或给出了对照/基线/混杂控制。这正是本维度要的纪律。
const EXEMPT_CAUSAL_DISCIPLINE_ZH = new RegExp([
  '反向因果', '因果倒置', '因果反了', '因果方向', '倒因为果', '倒果为因',
  '可能不是.{0,6}(?:原因|导致)', '不是因为', '未必是.{0,4}导致',
  '不是因为.{0,8}(?:才|所以)', '不是因为.{0,8}(?:有效|好转|改善)',
  '症状在先', '先有症状', '症状引起', '症状导致', '症状驱动',
  '疾病引起', '疾病导致', '病情导致', '病情促使', '病情驱动',
  '前驱症状', '原反因果', '反向归因', '因果混淆',
  '对照组', '控制组', '随机对照', '随机分组', '基线', '基线值',
  '干预前', '干预后', '干预前后', 'AB测试', 'A/B', '对照实验',
  '混杂因素', '混淆变量', '第三变量', 'indication', '按适应证',
  '适应证', '症状严重度', '病情严重度', '严重度分层',
  '不能说明', '不足以说明', '无法说明', '很难说明', '难以证明',
  '不能归因', '无法归因', '难以归因', '不能只归功', '不能只归因',
  '不能简单归因', '不能简单归咎', '存疑', '待确认', '尚不明确',
  '未必', '不一定', '可能受', '也许受', '或许是',
  '观察性', '横断面', '回顾性', '相关性.{0,4}(?:不等于|不代表).{0,4}因果',
].join('|'));

const EXEMPT_CAUSAL_DISCIPLINE_EN = new RegExp([
  '\\breverse\\s+caus(?:ation|al|e)\\b', '\\bcaus(?:ation|al|e)\\s+(?:is\\s+)?reversed\\b',
  '\\bcausal\\s+(?:direction|order)\\b', '\\bbackwards?\\s+caus\\w+\\b',
  '\\bthe\\s+symptom\\s+(?:came|caused|led|drove|prompted|triggered)\\b',
  '\\bsymptom\\s+(?:drove|led|prompted|triggered|preceded)\\b',
  '\\bnot\\s+(?:necessarily\\s+)?(?:the\\s+)?(?:cause|reason)\\b',
  '\\bmay\\s+not\\s+(?:be\\s+)?(?:the\\s+)?cause\\b', '\\bmight\\s+not\\s+be\\s+causal\\b',
  '\\bprotopathic\\b', '\\breverse\\s+causality\\b', '\\bconfounding\\s+by\\s+indication\\b',
  '\\bcontrol\\s+group\\b', '\\btreatment\\s+group\\b', '\\brandomi[sz]ed\\b',
  '\\brandom(?:ly)?\\s+(?:assigned|allocated|divided)\\b', '\\bbaseline\\b',
  '\\bbefore[- ]and[- ]after\\b', '\\bplacebo\\b', '\\bpre[- ]?post\\b',
  '\\bconfound(?:ed|ing|s)?\\b', '\\bthird\\s+variable\\b', '\\bseverity\\b',
  '\\bcorrelation\\s+(?:does\\s+not|doesn\\u2019?t|is\\s+not)\\s+(?:equal|imply|mean)\\s+caus\\w+\\b',
  '\\bnot\\s+necessarily\\s+causal\\b', '\\bcannot\\s+(?:be\\s+)?(?:attributed|inferred)\\b',
  '\\bcan\\u2019?t\\s+(?:be\\s+)?(?:attributed|conclude|infer)\\b', '\\bno\\s+significant\\s+(?:difference|effect)\\b',
].join('|'), 'i');

// 豁免②：多因/归因谨慎——效果被明确归为多因或无法单归
const EXEMPT_MULTICAUSE_ZH = new RegExp([
  '多因', '共同造成', '共同作用', '多种因素', '综合因素', '叠加',
  '不仅仅因为', '不只是因为', '并非只因', '不能只靠', '不能只凭',
  '季节因素', '大环境', '行业趋势', '自然病程', '自限性', '会自愈',
  '自己好', '自己恢复', '安慰剂', '心理作用', '心理暗示',
  '需要控制', '需要对照', '需要排除', '有待观察', '待进一步',
  '说不清', '说不准', '不好说', '很难讲', '谈不上',
].join('|'));

const EXEMPT_MULTICAUSE_EN = new RegExp([
  '\\bmany\\s+(?:factors|causes|reasons)\\b', '\\bmultiple\\s+(?:factors|causes|reasons)\\b',
  '\\bnot\\s+(?:solely|only|just)\\b', '\\bcannot\\s+be\\s+solely\\s+attributed\\b',
  '\\bcan\\u2019?t\\s+attribute\\b', '\\bconfounding\\s+variable\\b',
  '\\bseasonal\\b', '\\bmarket\\s+cycle\\b', '\\bindustry\\s+trend\\b',
  '\\bmay\\s+be\\s+due\\b', '\\bmight\\s+be\\s+due\\b', '\\bcould\\s+be\\s+due\\b',
  '\\bself[- ]?limit(?:ing|ed)\\b', '\\bnatural\\s+(?:course|history)\\b',
  '\\bwould\\s+have\\s+(?:gotten|got)\\s+better\\b', '\\bplacebo\\b',
  '\\bregression\\s+to\\s+the\\s+mean\\b', '\\byet\\s+to\\s+be\\s+(?:confirmed|verified)\\b',
].join('|'), 'i');

// 豁免③：对冲/疑问——概率化结论或提问不是疗效宣告
const EXEMPT_HEDGE_ZH = /(?:可能|也许|或许|未必|不一定|大概|恐怕|说不定|似乎|好像|估计|大概率|待观察|拭目以待|吗|呢|？|\?)/;
const EXEMPT_HEDGE_EN = /\b(?:maybe|perhaps|might|may|could|possibly|probably|unclear|uncertain|tbd|to\s+be\s+determined|seems?|appears?)\b|\?/i;

// 豁免④：统计教学/谬误分析转述
const EXEMPT_PEDAGOGY_ZH = /(?:谬误|偏误|偏差|案例|反例|错误示范|教学|教材|课本|课程|举例|示例|比如|剖析|拆解|这句话的问题|错在|举个例子|打个比方)/;
const EXEMPT_PEDAGOGY_EN = /(?:\bfallacy\b|\bbias\b|\bcase\s+study\b|\bfor\s+example\b|\bfor\s+instance\b|\billustrates?\b|\btextbook\b|\bwhat'?s\s+wrong\s+with\b|\bsuppose\b)/i;

// ============ 邻近窗（三腿需在窗内共现）============
// 症状→暴露→疗效归因 在同一叙述里必须紧邻：真实攻击句三腿通常落在
// 同一个句号内或相邻两个分句。窗口按字符长度给中英不同默认值。
const WINDOW_ZH = 120;
const WINDOW_EN = 320;

function _normText(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/[\u3000]/g, ' ').replace(/\s+/g, ' ');
}

// 在窗口内查找三腿的最小共现距离：返回 -1 表示三腿跨度超过窗口
function _spanWithinWindow(positions, window) {
  if (!positions || positions.length === 0) return false;
  const first = positions[0];
  const last = positions[positions.length - 1];
  return (last - first) <= window;
}

function checkProtopathicBias(text, inject) {
  const t = _normText(text);
  if (!t || t.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const R = inject || {};
  const SY_Z = R.SYMPTOM_ZH || SYMPTOM_ZH;
  const SY_E = R.SYMPTOM_EN || SYMPTOM_EN;
  const EX_Z = R.EXPOSURE_ZH || EXPOSURE_ZH;
  const EX_E = R.EXPOSURE_EN || EXPOSURE_EN;
  const OC_Z = R.OUTCOME_ZH || OUTCOME_ZH;
  const OC_E = R.OUTCOME_EN || OUTCOME_EN;
  const ECD_Z = R.EXEMPT_CAUSAL_DISCIPLINE_ZH || EXEMPT_CAUSAL_DISCIPLINE_ZH;
  const ECD_E = R.EXEMPT_CAUSAL_DISCIPLINE_EN || EXEMPT_CAUSAL_DISCIPLINE_EN;
  const EM_Z = R.EXEMPT_MULTICAUSE_ZH || EXEMPT_MULTICAUSE_ZH;
  const EM_E = R.EXEMPT_MULTICAUSE_EN || EXEMPT_MULTICAUSE_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const EP_Z = R.EXEMPT_PEDAGOGY_ZH || EXEMPT_PEDAGOGY_ZH;
  const EP_E = R.EXEMPT_PEDAGOGY_EN || EXEMPT_PEDAGOGY_EN;
  const WINDOW = R.WINDOW || { zh: WINDOW_ZH, en: WINDOW_EN };

  // 四组豁免，任一在场即不判
  if (ECD_Z.test(t) || ECD_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EM_Z.test(t) || EM_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EH_Z.test(t) || EH_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EP_Z.test(t) || EP_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(t);

  // 收集三腿位置（腿①症状，腿②暴露，腿③疗效归因）
  // ⚠️ 三条腿的正则都是非全局（无 g 标志）的：非全局 exec 每次调用都从
  // index 0 重新匹配，永远返回同一个命中，while 循环会无限重复同一词。
  // 因此这里在函数内建局部全局副本（保留原 flags，仅追加 g），
  // 不动导出的常量本体——isAttribution / 四组豁免都用 .test() 调它们，
  // 全局正则的 .test() 会因 lastIndex 前进而状态化漏判。
  const positions = [];
  let symptomHit = '';
  let exposureHit = '';
  let outcomeHit = '';
  // 通用扫描：局部全局副本 + 零宽匹配保护（lastIndex 不推进会死循环）
  const scanLeg = (rx, onHit) => {
    const g = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
    let mm;
    while ((mm = g.exec(t)) !== null) {
      onHit(mm[0], mm.index);
      if (g.lastIndex === mm.index) g.lastIndex++;
    }
  };

  // 腿① SYMPTOM
  scanLeg(isZh ? SY_Z : SY_E, (w, i) => {
    positions.push(i);
    if (!symptomHit) symptomHit = w;
  });
  if (positions.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② EXPOSURE
  const exposurePositions = [];
  scanLeg(isZh ? EX_Z : EX_E, (w, i) => {
    exposurePositions.push(i);
    if (!exposureHit) exposureHit = w;
  });
  if (exposurePositions.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③ OUTCOME：区分「疗效改善宣告」（好转/痊愈类）与「归因连接词」
  // （所以/可见/so/proves 类）——detail 需把两类分别报出承重。
  const OUT_IMP = isZh ? IMPROVEMENT_ZH : IMPROVEMENT_EN;
  const OUT_ATT = isZh ? ATTRIBUTION_ZH : ATTRIBUTION_EN;
  const outcomePositions = [];
  const improvementHits = [];   // 改善/痊愈宣告类
  const attributionHits = [];   // 归因连接词类
  const isAttribution = (w) => {
    if (!OUT_ATT.test(w)) return false;
    // 归因连接词必须是「纯连接词」；若同时命中改善宣告词（如「痊愈」），
    // 以改善宣告优先，避免把改善词误分到归因桶。
    return !OUT_IMP.test(w);
  };
  scanLeg(OUT_IMP, (w, i) => {
    outcomePositions.push(i);
    if (improvementHits.length < 8) improvementHits.push(w);
  });
  scanLeg(OUT_ATT, (w, i) => {
    outcomePositions.push(i);
    if (!isAttribution(w)) return;
    if (attributionHits.length < 8) attributionHits.push(w);
  });
  outcomePositions.sort((a, b) => a - b);
  outcomeHit = improvementHits[0] || attributionHits[0] || '';
  if (outcomePositions.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗校验：三腿首位置跨度不超过窗口
  const allPositions = positions.concat(exposurePositions).concat(outcomePositions).sort((a, b) => a - b);
  const win = isZh ? WINDOW.zh : WINDOW.en;
  if (!_spanWithinWindow(allPositions, win)) return { hit: false, score: 0, detail: '', count: 0 };

  // 顺序校验：症状腿必须在暴露腿之前（前驱症状驱动暴露的因果方向）
  const firstSymptom = positions[0];
  const firstExposure = exposurePositions[0];
  const firstOutcome = outcomePositions[0];
  if (!(firstSymptom < firstExposure && firstExposure < firstOutcome + 40)) {
    // 暴露腿先于症状腿：暴露不是被症状驱动的（可能是无症状预防性暴露，
    // 属正常描述，不判）。疗效腿与暴露腿的相对位置放宽到 ±40 字符，
    // 覆盖「吃了X，病情好转」与「病情好转，都是X的功劳」两种语序。
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  return {
    hit: true,
    score: 0.55,
    count: 1,
    detail: isZh
      ? `反向因果-前驱症状驱动暴露(zh, 症状「${symptomHit}」×暴露「${exposureHit}」×疗效归因「${improvementHits.slice(0, 3).join('/')}」×归因词「${attributionHits.slice(0, 3).join('/')}」)`
      : `protopathic bias(en, symptom「${symptomHit}」×exposure「${exposureHit}」×outcome「${improvementHits.slice(0, 3).join('/')}」×attribution「${attributionHits.slice(0, 3).join('/')}」)`,
  };
}

module.exports = {
  checkProtopathicBias,
  __internals: () => ({
    SYMPTOM_ZH, SYMPTOM_EN,
    EXPOSURE_ZH, EXPOSURE_EN,
    OUTCOME_ZH, OUTCOME_EN,
    EXEMPT_CAUSAL_DISCIPLINE_ZH, EXEMPT_CAUSAL_DISCIPLINE_EN,
    EXEMPT_MULTICAUSE_ZH, EXEMPT_MULTICAUSE_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_PEDAGOGY_ZH, EXEMPT_PEDAGOGY_EN,
    WINDOW_ZH, WINDOW_EN,
  }),
};
