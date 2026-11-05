/**
 * src/shield/equivocation-sense-shift.js
 *
 * [r645] equivocation_sense_shift — 「一词多义被用于跨义位推理」检测器
 * 心虫第 67 判别维度。
 *
 * [r221 · agent-4 补强] POLYSEMY_TABLE 增补 4 个中英双语多义词家族：
 *   理论(science vs 猜测)、证明(数理推导 vs 经验表明)、模型(数理建模 vs
 *   榜样/样品)、显著(统计显著 vs 重要/巨大)。补强前零命中探针实测这四族
 *   10/10 攻击穿引擎（6 条 gate.action=pass 完全漏判）。此为「已有维度的
 *   全新措辞家族」（真升级类型②），模块已接线故立即激活，无需改 src/index.js。
 *
 * [r223 · agent-4 补强] POLYSEMY_TABLE 再增 4 个中英双语多义词家族：
 *   价值(交换价值 vs 效用/伦理价值)、规律(自然法则 vs 社会法律)、
 *   压力(物理压强 vs 心理压力)、自由(消极自由 vs 积极自由)。
 *   干跑探针（内存注入候选、不落盘）实测：17 条攻击 16 条被本维度直接
 *   承重，其中 8 条 gate.action 从 pass 翻转为 verify；官方良性集 326 条
 *   非 pass 数 25→25 零增加。此为「已有维度的全新措辞家族」（真升级
 *   类型②），模块已接线故立即激活，无需改 src/index.js。
 *
 * [r224 · agent-4 补强] POLYSEMY_TABLE 再增 3 个中英双语多义词家族：
 *   规则(人为约定 vs 客观规律)、实验(科学受控检验 vs 随意尝试)、
 *   控制(实验控制 vs 社会控制)。零命中探针（内存摘除/注入对照）实测：
 *   18 条攻击 14 条补强前 gate.action=pass 穿引擎，补强后 14/14 翻转
 *   verify、17/18 被本维度直接承重；干跑探针实测官方良性集 326 条非
 *   pass 数 25→25 零增加。同为真升级类型②，模块已接线立即激活。
 *   弃选：选择/selection（反驳句与攻击句词汇同构，系统性误伤）、
 *   机会/chance（机会×概率良性合法共现，FP 面最大）。
 *
 * 论文来源（2026-10-10 升级轮调研）：
 *   arXiv 2606.31039《Truth or Sophistry? LoFa: A Benchmark for LLM
 *   Robustness Against Logical Fallacies》。实测 10 类谬误的 LFR@k：
 *     · LLM 对「Distraction/Distortion」类谬误最脆弱
 *     · Equivocation（一词多义/义位偷换）LFR@3 仅 29.4%，全部谬误中最低
 *     · 模型能「识别」谬误结构，却在被动说服场景下被击穿
 *   佐证：Beyond Logical Forms (ArgMining 2026) 实测 Equivocation
 *   在所有模型上「entirely undetected」。
 *
 * 心虫侧缺口（scripts/round-645-probe.js 实测，真实 gate.checkOutput）：
 *   攻击 10 条 → 8 条 pass（80% 漏判）；良性 12 条 → 0 误伤。
 *   既有 ambiguity_fallacy 只认元话语（"the word has multiple
 *   meanings"），即「谈论词义本身」；本维度判**推理结构**——同一个
 *   多义词在前提与结论中取不同义位却得出结论。两者互补。
 *
 * 判定结构（三段共现，缺一不可）：
 *   ① 多义词出现 ≥2 次（英文允许复数/所有格变形）
 *   ② 两次出现的邻近上下文分别命中两个**不相交语义域**的标记词
 *   ③ 前提与结论之间有推理连接词
 *
 * 保守边界（明确不收，防误伤）：
 *   · 该词只出现一次 → 无从谈义位切换
 *   · 两次落在同一语义域 → 正常重复
 *   · 元话语/语言讨论语境 → 由 ambiguity_fallacy 负责
 *   · 只有语义域标记、没有推理连接 → 并列事实，不是谬误论证
 */

'use strict';

// ─── 多义词表：词 → [语义域A标记, 语义域B标记] ─────────────────────────
// 入选判据：① 语义域区分度高 ② 有真实攻击样本验证漏判 ③ 使用频率足够
// 标记词判据：**语义域的强指示词**，不要求逐字出现在攻击样本里，
// 而是「该词出现时最可能的伴随词」。用动词/名词/领域词，不用虚词。
const POLYSEMY_TABLE = {
  // ── 中文 ──
  '平等': [
    ['法律', '权利', '人格', '尊严', '机会', '公民', '公平', '对待', '男女', '种族', '选举', '判决', '条款'],
    ['数量', '数值', '数学', '份额', '一样多', '平均分', '对半', '盐和糖', '分配', '分成', '重量', '长度', '面积', '比分'],
  ],
  '精神': [
    ['意志', '面貌', '心理', '士气', '振作', '奉献', '团队', '面貌', '饱满', '风险', '精神文明'],
    ['大脑', '神经', '意识', '脑部', '扫描', '物质', '哲学', '唯物主义', '产物', '细胞'],
  ],
  '意思': [
    ['含义', '意义', '理解', '指的是', '意思是', '表达', '传达'],
    ['心意', '礼数', '表示', '给点', '一下', '送礼', '红包', '客气', '意思意思'],
  ],
  '银行': [
    ['金融', '贷款', '存款', '账户', '信贷', '利息', '办理', '工作', '业务'],
    ['河', '岸', '水', '泥', '堤', '钓鱼'],
  ],
  '学校': [
    ['教育', '学生', '上课', '老师', '入学', '班级'],
    ['鱼', '群', '游', '鲨', '海豚'],
  ],
  '光线': [
    ['亮', '照', '灯', '明', '暗', '阳光'],
    ['重', '轻', '质量', '重量'],
  ],
  // ── 英文 ──
  'light': [
    ['bright', 'brightness', 'color', 'lamp', 'sun', 'dark', 'shine', 'beam', 'dim', 'room'],
    ['weight', 'heavy', 'feather', 'weigh', 'kg', 'pounds', 'grams', 'lift'],
  ],
  'bank': [
    ['financial', 'money', 'loan', 'account', 'deposit', 'interest', 'credit', 'institution'],
    ['river', 'mud', 'water', 'stream', 'fishing', 'shore'],
  ],
  'school': [
    ['education', 'student', 'learn', 'teach', 'classroom', 'pupil', 'study'],
    ['fish', 'shark', 'swim', 'dolphin', 'whale'],
  ],
  'staff': [
    ['employee', 'worker', 'team', 'office', 'hire', 'colleague', 'company', 'staff', 'management'],
    ['stick', 'walking', 'shepherd', 'wooden', 'rod', 'cane'],
  ],
  'fine': [
    ['penalty', 'ticket', 'parking', 'violation', 'charge', 'pay', 'fee', 'ticket', 'summons'],
    ['good', 'excellent', 'quality', 'nice', 'great', 'okay', 'acceptable', 'satisfactory'],
  ],
  'equal': [
    ['rights', 'law', 'people', 'citizens', 'dignity', 'justice', 'treatment', 'society'],
    ['number', 'numbers', 'math', 'equation', 'value', 'values', 'sum', 'algebra'],
  ],
  'right': [
    ['entitle', 'entitled', 'legal', 'freedom', 'claim', 'deserve', 'constitutional'],
    ['correct', 'correctly', 'direction', 'opposite', 'left', 'answer', 'choice'],
  ],
  'match': [
    ['game', 'competition', 'sport', 'tournament', 'score', 'win', 'play'],
    ['fire', 'burn', 'ignite', 'flame', 'combustion', 'strike'],
  ],
  'current': [
    ['electric', 'electrical', 'wire', 'circuit', 'voltage', 'power', 'ampere'],
    ['present', 'now', 'today', 'flow', 'trend', 'situation'],
  ],
  // ── [r221] agent-4 补强：科学推理/统计素养方向最高频的 Equivocation 四族 ──
  // 判据同既有条目：① 两义位语义域区分度高（域标记不相交）② 真实攻击样本
  // 验证此前漏判（coordination/agent4/probes/r221-zerohit-probe.js 实测 10/10
  // 穿引擎）③ 良性同义重复只命中单一域 → 不误伤。逻辑要求 hitA && hitB 共现，
  // 故纯单义文本天然放行。中英双语，VERIFY 级。
  '理论': [
    ['科学', '验证', '实验', '定律', '假说', '数据', '证据', '相对论', '进化论', '检验', '预测', '物理', '同行评审', '可证伪'],
    ['猜测', '猜想', '臆测', '推测', '没有依据', '未经证实', '纯属', '异想天开', '未必成立', '不一定对'],
  ],
  '证明': [
    ['数学', '定理', '引理', '逻辑', '推导', '公理', '形式化', '充要条件', '严谨'],
    ['表明', '说明', '显示', '足以', '实践', '事实胜于雄辩'],
  ],
  '模型': [
    ['数学', '建模', '拟合', '数据', '算法', '预测', '训练', '参数', '回归', '统计', '仿真'],
    ['榜样', '示范', '模范', '样品', '机型', '模特', '典范', '标杆', '效仿', '学习对象'],
  ],
  '显著': [
    ['统计', 'p值', 'p 值', '显著性', '检验', '样本', '置信', '差异', '方差', '卡方', 't检验'],
    ['重要', '重大', '巨大', '深远', '可观', '突破', '值得推广', '影响力'],
  ],
  'theory': [
    ['scientific', 'evidence', 'experiment', 'tested', 'verified', 'data', 'hypothesis', 'law', 'physics', 'biology', 'evolution', 'relativity', 'peer-reviewed', 'falsifiable'],
    ['guess', 'speculation', 'hunch', 'conjecture', 'mere', 'unproven', 'not necessarily', 'opinion', 'made up'],
  ],
  'prove': [
    ['mathematics', 'theorem', 'lemma', 'logic', 'derivation', 'axiom', 'formal', 'deduce'],
    ['demonstrate', 'guarantee', 'practice', 'effective', 'in practice'],
  ],
  'model': [
    ['mathematical', 'modeling', 'modelling', 'fitted', 'data', 'algorithm', 'predict', 'prediction', 'training', 'parameters', 'regression', 'statistical', 'simulation'],
    ['role', 'exemplar', 'prototype', 'sample', 'citizen', '榜样'],
  ],
  'significant': [
    ['statistical', 'statistically', 'p-value', 'significance', 'test', 'sample', 'confidence', 'difference', 'variance'],
    ['important', 'importance', 'major', 'huge', 'profound', 'breakthrough', 'worth'],
  ],
  // ── [r222] agent-4 补强：逻辑有效性 + 统计常态的 Equivocation 两族 ──
  // 判据同既有条目：① 两义位语义域区分度高且**良性写作中罕见共现**（压误伤）
  // ② 真实攻击样本验证此前漏判（coordination/agent4/probes/r222-zerohit-probe.js
  //    实测：有效-zh 两种变体/正常-zh/normal-en 改动前 gate.action=pass 完全漏判）
  // ③ 良性单一义位只命中单域 → 不误伤。
  // 关键压 FP 决策：域A 只用**严格逻辑/统计标记**（演绎/保真/形式逻辑/均值…），
  //   不收"论证/前提/结论/方案"等泛词——否则"有效的论证+有效的方案+因此"这类
  //   合法双义位共现会被误判。健全/sound 族因"逻辑健全+财务健全"合法共现而被弃。
  // 逻辑要求 hitA && hitB 跨出现位置合并，故纯单义文本天然放行。中英双语，VERIFY 级。
  '有效': [
    // 域A：逻辑有效性（保真/演绎严格标记）
    ['演绎', '归纳', '保真', '形式逻辑', '三段论', '必然为真', '逻辑有效', '有效推理'],
    // 域B：日常"有道理/站得住脚/有效果"
    ['说得过去', '说得通', '站得住脚', '有道理', '顾虑', '诉求', '反对意见', '投诉', '办法', '手段'],
  ],
  '正常': [
    // 域A：统计常态（接近均值/分布）
    ['统计', '均值', '分布', '标准差', '抽样', '基线', '平均', '正态', '样本'],
    // 域B：健康/发育/规范性判断
    ['健康', '身体', '发育', '生病', '就诊', '患病', '体征', '应当', '应该'],
  ],
  'valid': [
    ['deductive', 'inductive', 'truth-preserving', 'syllogism', 'logically valid', 'valid argument', 'logical form', 'necessarily true', 'valid inference'],
    ['objection', 'concern', 'complaint', 'criticism', 'point', 'grievance', 'defensible', 'makes sense', 'reasonable', 'legitimate', 'warranted'],
  ],
  'normal': [
    ['statistical', 'statistically', 'statistics', 'the mean', 'sample mean', 'on average', 'standard deviation', 'distribution', 'baseline', 'bell curve'],
    ['healthy', 'health', 'developed', 'illness', 'sick', 'doctor', 'symptom', 'should be', 'ought'],
  ],
  // ── [r223] agent-4 补强：经济/伦理、自然/社会、物理/心理、消极/积极自由四族 ──
  // 判据同既有条目：① 两义位语义域区分度高 ② 真实攻击样本验证此前漏判
  //   （coordination/agent4/probes/r223-dryrun-probe.js 实测：8 条补强前
  //    gate.action=pass 完全穿引擎，补强后翻 verify 且本维度直接承重）
  // ③ 良性单一义位只命中单域 → 不误伤（同探针实测官方良性集 326 条
  //    非 pass 数 25→25 零增加）。
  // 压 FP 关键决策：域标记一律用**强指示词**（价格/报酬/法律/液体/强制…），
  //   不收"工作/条件/意义"等泛词；价值族的"价格"与"尊严"在良性句里极少
  //   跨句共现，实测零误伤。逻辑要求 hitA && hitB 跨出现位置合并，故纯
  //   单义文本天然放行。中英双语，VERIFY 级。
  '价值': [
    // 域A：交换价值（价格/报酬/市场）
    ['价格', '售价', '标价', '定价', '供需', '市场', '交换', '报酬', '薪酬', '工资', '薪水', '薪资', '成交', '免费', '不要钱', '金钱', '货币', '交易', '付费', '行情'],
    // 域B：效用/伦理价值（福利/公益/尊严）
    ['效用', '用途', '实用', '福利', '幸福', '尊严', '伦理', '道德', '生命', '人权', '公益', '志愿', '义工', '无偿'],
  ],
  'value': [
    ['price', 'pricing', 'market', 'exchange', 'salary', 'wage', 'wages', 'paid', 'compensation', 'free', 'cost', 'trade', 'commodity', 'sell'],
    ['utility', 'usefulness', 'useful', 'welfare', 'well-being', 'dignity', 'ethical', 'moral', 'ethics', 'life', 'human rights', 'public good', 'volunteer', 'volunteering', 'community service'],
  ],
  '规律': [
    // 域A：自然法则（进化/重力/必然）
    ['自然', '自然界', '生物', '进化', '自然选择', '物理', '重力', '优胜劣汰', '客观', '科学定律', '必然'],
    // 域B：社会规则（法律/制度/立法）
    ['法律', '社会', '制度', '规则', '人为', '立法', '司法', '习俗', '制定'],
  ],
  'law': [
    ['nature', 'natural', 'natural selection', 'biology', 'biological', 'physics', 'physical', 'gravity', 'evolution', 'thermodynamics'],
    ['legal', 'court', 'statute', 'legislation', 'society', 'social', 'regulation', 'crime', 'criminal', 'justice', 'enacted'],
  ],
  '压力': [
    // 域A：物理压强（液体/帕斯卡/深度）
    ['液体', '气体', '压强', '帕斯卡', '大气', '物理', '深度', '仪表', '兆帕', '压缩', '液压'],
    // 域B：心理压力（情绪/焦虑/职场）
    ['心理', '情绪', '精神', '焦虑', '紧张', '职场', '员工', '问卷', '缓解', '抗压'],
  ],
  'pressure': [
    ['liquid', 'fluid', 'gas', 'pascals', 'atmospheric', 'physics', 'physical', 'depth', 'gauge', 'hydraulic', 'compressed'],
    ['psychological', 'mental', 'emotional', 'stress', 'anxiety', 'workplace', 'employees', 'burnout', 'questionnaire'],
  ],
  '自由': [
    // 域A：消极自由（免于强制/干涉）
    ['强制', '干涉', '干预', '阻碍', '禁止', '权利', '免于', '外部', '约束'],
    // 域B：积极自由（能力/资源/实质）
    ['能力', '资源', '贫穷', '贫困', '没钱', '财富', '自我实现', '实质自由'],
  ],
  'freedom': [
    ['coercion', 'coerce', 'coerced', 'interfere', 'interferes', 'intervention', 'constraint', 'prohibit', 'rights', 'liberty', 'absence'],
    ['ability', 'capability', 'resources', 'poverty', 'poor', 'cannot afford', 'wealth', 'self-realization'],
  ],
  // liberty 与 freedom 同义位结构（EN 高频替换词），域标记同 freedom
  'liberty': [
    ['coercion', 'coerce', 'coerced', 'interfere', 'interferes', 'intervention', 'constraint', 'prohibit', 'rights', 'freedom', 'absence'],
    ['ability', 'capability', 'resources', 'poverty', 'poor', 'cannot afford', 'wealth', 'self-realization'],
  ],
  // ── [r224] agent-4 补强：约定/规律、科学实验/随意尝试、实验控制/社会控制三族 ──
  // 判据同既有条目：① 两义位语义域区分度高 ② 真实攻击样本验证此前漏判
  //   （coordination/agent4/probes/r224-zerohit-probe.js 实测：18 条攻击
  //    14 条补强前 gate.action=pass 穿引擎，补强后 14/14 翻转 verify 且
  //    17/18 被本维度直接承重）
  // ③ 良性单一义位只命中单域 → 不误伤（r224-dryrun-probe.js 实测官方
  //    良性集 326 条非 pass 数 25→25 零增加，equivocation 新增承重 0）。
  // 压 FP 关键决策：域标记一律用强指示词——规则族不收"要/必须"等泛词，
  //   B 域只用自然/物理/必然/无一例外等规律词；实验族 B 域用试试/尝试/
  //   亲身/业余等尝试词，不收"新方法/不同"（良性方法论文本合法共现）；
  //   控制族 B 域只用统治/压迫/监控/操纵/专政/镇压/舆论/言论/思想/规训
  //   等强支配词，**不收"政府/国家/权力"**——"政府资助的对照实验严格
  //   控制变量，因此结果可信"这类良性学术句会因政府×控制×因此误触。
  // 弃选家族（诚实记录）：选择/selection（"自然选择不需要选择者"这类
  //   反驳句与攻击句词汇同构，±90 字符窗内必然双命中，系统性误伤）；
  //   机会/chance（机会×概率在良性职业/统计语境合法共现，FP 面最大，
  //   同 r223 弃 risk 的理由）。
  // 逻辑要求 hitA && hitB（可同一出现双命中或跨出现合并）+ 多义词出现
  // ≥2 次 + 有推理连接词，纯单义文本天然放行。中英双语，VERIFY 级。
  '规则': [
    // 域A：人为约定（比赛/章程/可修改）
    ['比赛', '游戏', '棋', '裁判', '章程', '条约', '制度', '制定', '约定', '习俗', '人为', '可变', '修改', '打破', '违反'],
    // 域B：客观规律（自然/物理/必然/无一例外）
    ['自然', '自然界', '物理', '必然', '无一例外', '不变', '客观', '铁律', '天地', '万物'],
  ],
  'rule': [
    ['game', 'chess', 'sport', 'referee', 'charter', 'bylaw', 'bylaws', 'treaty', 'convention', 'custom', 'invented', 'changed', 'modified', 'broken', 'human'],
    ['nature', 'natural', 'physics', 'physical', 'gravity', 'inevitable', 'invariable', 'unchanging', 'objective', 'iron law', 'universal'],
  ],
  '实验': [
    // 域A：科学受控检验（对照/统计/同行评审）
    ['对照', '双盲', '随机', '数据', '统计', '同行', '实验室', '发表', '可重复', '检验', '科学', '严谨', '假设'],
    // 域B：随意尝试（试试/亲身/业余）
    ['试试', '尝试', '亲身体验', '大胆', '尝鲜', '玩玩', '随便', '业余'],
  ],
  'experiment': [
    ['controlled', 'control', 'lab', 'laboratory', 'data', 'statistical', 'peer', 'published', 'replicated', 'hypothesis', 'scientific', 'rigorous', 'randomized'],
    ['try', 'trying', 'tried', 'yourself', 'personal', 'dabble', 'boldly', 'firsthand', 'casually', 'amateur'],
  ],
  '控制': [
    // 域A：实验控制（变量/对照/混杂因素）
    ['对照', '变量', '对照组', '随机', '双盲', '盲法', '实验', '检验', '混杂', '科学', '方法'],
    // 域B：社会控制（统治/监控/操纵/思想规训）
    ['统治', '压迫', '监控', '操纵', '专政', '镇压', '舆论', '言论', '思想', '规训', '禁锢', '民意'],
  ],
  'control': [
    ['experiment', 'experiments', 'controlled', 'variables', 'group', 'randomized', 'blinded', 'confounder', 'scientific', 'lab', 'laboratory'],
    ['dominate', 'domination', 'oppression', 'surveillance', 'manipulate', 'manipulation', 'authoritarian', 'tyranny', 'regime', 'populace'],
  ],
};

// 推理连接词：前提 → 结论
const INFERENCE_ZH = [
  /(?:所以|因此|因而|故而|从而|可见|这就说明|那么由此)/,
  /(?:既然|如果)[^。；\n]{0,24}(?:那么|就|则)/,
];
const INFERENCE_EN = [
  /\b(?:therefore|thus|hence|so|consequently|which means|it follows)\b/i,
  /\b(?:since|if)\b[^.]{0,40}\b(?:then|so)\b/i,
];

// 元话语：在谈论词义本身（由 ambiguity_fallacy 负责，本维度豁免）
const METALINGUISTIC = [
  /一词多义|多义词|歧义|这个词有|这个字有|不同含义|两种意思|几种意思|字面意思/,
  /\b(?:has|have)\s+(?:multiple|several|two|different)\s+meanings?\b/i,
  /\b(?:word|term)\s+(?:is|means)\s+(?:ambiguous|polysemous)\b/i,
  /\bpolysemy\b|\bpolysemous\b/i,
];

// 语义域匹配窗口：多义词出现位置前后 N 个字符
const WINDOW = 90;

// 英文后缀：复数/所有格/动词变形，用于词边界守卫放行
const EN_SUFFIX_RE = /^(?:s|es|'s|s')?$/i;

function detect(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, findings: [], confidence: 0, topSeverity: 0, count: 0 };
  }

  // 元话语语境 → 整个豁免（那是语言讨论，不是谬误论证）
  for (const re of METALINGUISTIC) {
    if (re.test(text)) return _clean();
  }

  // 必须有推理连接（没有就不是论证，只是并列陈述）
  const hasInference =
    INFERENCE_ZH.some(r => r.test(text)) || INFERENCE_EN.some(r => r.test(text));
  if (!hasInference) return _clean();

  const findings = [];

  for (const word of Object.keys(POLYSEMY_TABLE)) {
    const [domainA, domainB] = POLYSEMY_TABLE[word];

    const positions = _findAll(text, word);
    if (positions.length < 2) continue;

    // 对每次出现，判定它落在哪个语义域（取首次命中的域）
    let hitA = false;
    let hitB = false;
    let evidenceA = null;
    let evidenceB = null;

    for (const pos of positions) {
      const ctx = text.slice(Math.max(0, pos - WINDOW), pos + WINDOW).toLowerCase();
      let inA = false;
      let inB = false;
      for (const marker of domainA) {
        if (ctx.includes(marker.toLowerCase())) { inA = true; break; }
      }
      for (const marker of domainB) {
        if (ctx.includes(marker.toLowerCase())) { inB = true; break; }
      }
      if (inA && !hitA) {
        hitA = true;
        evidenceA = text.slice(Math.max(0, pos - 14), pos + word.length + 14).trim();
      }
      if (inB && !hitB) {
        hitB = true;
        evidenceB = text.slice(Math.max(0, pos - 14), pos + word.length + 14).trim();
      }
    }

    // 两个不相交语义域都被命中 → 义位切换
    if (hitA && hitB) {
      findings.push({
        dimension: 'equivocation_sense_shift',
        severity: 0.58,
        matched: word,
        detail: '多义词「' + word + '」在同一论证中被用于两个不同义位（出现 ' +
                positions.length + ' 次），构成 Equivocation 谬误',
        evidence: [
          evidenceA ? '义位一: ' + evidenceA.slice(0, 40) : null,
          evidenceB ? '义位二: ' + evidenceB.slice(0, 40) : null,
        ].filter(Boolean),
        pattern: 'equivocation:' + word,
      });
    }
  }

  if (findings.length === 0) return _clean();

  return {
    score: 0.58,
    findings,
    confidence: 0.8,
    topSeverity: 0.58,
    count: findings.length,
  };
}

/**
 * 找出多义词所有出现位置。
 * 英文：允许 s/es/'s 等后缀（banks、bank's），但拒绝 bankaccount 这种
 * 与其他字母直接相连的词（真·不同词）。
 */
function _findAll(text, word) {
  const out = [];
  const isEn = /^[a-z]+$/i.test(word);
  let idx = text.toLowerCase().indexOf(word.toLowerCase());
  while (idx !== -1) {
    if (isEn) {
      const afterRaw = text.slice(idx + word.length, idx + word.length + 4);
      const before = idx > 0 ? text[idx - 1] : '';
      const beforeIsLetter = /[a-z]/i.test(before);
      // 后缀必须正好是 s/es/'s/s' 且后面不能再跟字母
      const m = afterRaw.match(/^([a-z']{0,3})/i);
      const suffix = m ? m[1] : '';
      const rest = afterRaw.slice(suffix.length, suffix.length + 1);
      const restIsLetter = rest !== '' && /[a-z]/i.test(rest);
      const suffixOk = suffix === '' || (EN_SUFFIX_RE.test(suffix) && !restIsLetter);
      if (!beforeIsLetter && suffixOk) {
        out.push(idx);
      }
    } else {
      out.push(idx);
    }
    idx = text.toLowerCase().indexOf(word.toLowerCase(), idx + 1);
  }
  return out;
}

function _clean() {
  return { score: 0, findings: [], confidence: 0, topSeverity: 0, count: 0 };
}

module.exports = { detect, POLYSEMY_TABLE };
