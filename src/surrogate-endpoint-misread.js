/**
 * src/surrogate-endpoint-misread.js — 「替代终点误读」检测器
 * （r389 新建：econ_reasoning_gate 聚合族第 41 子族 / 插件层第 46 族，stats 组第 10 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r389 立项探针两段（scripts/round-389/probe-candidates.js + probe-candidates2.js，
 *   v6.8.192 合并树基线 HEAD 9c708fc，10 个候选族同池定拨）：
 *     · 一段：A surrogate_endpoint 7/18、C ad_hoc_rescue 8/12、
 *       I control_illusion 5/7、F winner_curse_effect 4/7、E per_protocol 4/7、
 *       D pseudo_replication 4/9、B optional_stopping 4/13、G ci_width 2/6、
 *       H in_vitro_to_human 2/7、J pre_post 1/7、K subgroup_fishing 1/5；
 *     · 二段深探：A 17/27（ZH 8/16 + EN 9/11）、C 2/5、I 3/4、F 0/3、E 3/3。
 *   A 两段合计 **24/45 穿透**（gate=pass、零维度承重）为全场最高绝对量，且良性
 *   边界最干净（20 条良性边界样本中 7 条非 pass 全部由存量维度
 *   reasoning_coherence/monocausal_attribution/contradiction/presupposition/
 *   fallacy_of_relevance 误伤，非本族增量——本族自身零误伤）。
 *   定拨理由：C/I/F/E 三族穿透率不低但**良性边界脏或射程与既有维度粘连**——
 *   C ad_hoc_rescue 与 unfalsifiable_assertion（dim244）射程相邻（一段 3 条被其
 *   代拦）、I control_illusion 与 confounding_by_indication（r339）同讲回归
 *   校正、F winner_curse 与 confidence/researcher_degrees_of_freedom 纠缠；
 *   A 的射程（临床生物标志物 → 硬临床终点）在 265 个维度 + 45 个聚合子族中
 *   **零覆盖、零相邻**，且判据形状（双腿 + 推断标记 + 双豁免 + 腿②双守卫）与
 *   r386/r387/r388 完全同构，落地风险最低。
 *
 * 辨别的族：替代终点误读（surrogate endpoint misread / surrogate-to-hard-endpoint
 *   leap）——文本同时给出两个信号：
 *     腿① SURROGATE 中间指标改善锚在场（血压/血脂/LDL/糖化血红蛋白/HbA1c/
 *            肿瘤标志物/骨密度/抗体滴度/病毒载量/转氨酶/生物标志物/替代终点/
 *            替代标志物/中间指标/实验室指标/影像学缓解 × 改善方向词；
 *            EN LDL cholesterol / blood pressure / HbA1c / tumor marker /
 *            bone density / antibody titers / viral load / biomarker /
 *            surrogate endpoint / lab values × improved direction）；
 *     腿② HARD 硬临床终点获益结论在场（预防心脏病/心梗/中风/骨折/死亡、
 *            延长寿命/生存期、降低死亡率、临床获益确证、减少并发症、治愈/
 *            彻底清除、救命、长期风险解除；EN prevent heart attacks / strokes /
 *            deaths、live longer / survival benefit、reduce mortality、
 *            clinical benefit / confirms clinical value、cured / saves lives）。
 *   两腿近距共现（以腿②为锚，腿①须落窗内：ZH 45 字 / EN 150 字符），且推断
 *   标记（说明/证明/意味着/可见/因此/等于/足以；EN so / means / proving /
 *   therefore）或条件连接（只要…就…）须与两腿跨区重叠——获益结论是由标志物
 *   改善**推出来的**，而不是把两个实测发现并列陈述（「LDL 降了 40%；试验的
 *   主要终点是心血管死亡率」是两个并列事实，无推断连接，不判）。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 正当的替代终点讨论（「替代终点改善不等于临床获益」「LDL 降了不等于
 *     心梗减少」）由 CONCEPT 豁免（概念教学/批评句）；
 *   · 正确对冲（「仍需硬终点证据」「硬终点数据尚未公布」「只能作为辅助
 *     证据」）由 CORRECT 豁免；
 *   · 腿①必须带**改善方向词**（下降/降低/达标/缩小/转阴…）——「肿瘤标志物
 *     仍然升高，说明病情在进展」这类恶化陈述天然不判（方向词不含升高-恶化
 *     组合，骨密度/抗体类才收升高）；「血压一直没降下来」由腿①否定守卫排除；
 *   · 腿②只收**硬终点获益结论**（死亡/心梗/中风/骨折/生存/寿命/临床获益），
 *     不收中间指标描述（「血脂降了」「指标好转」是度量到度量的正常陈述）。
 *
 * 与既有维度的边界（r389 归因，刻意错开）：
 *   · proxy_metric_goal（第187维，r190）：腿①只收**业务度量读数**（KPI/
 *     点击率/覆盖率/引用量/DAU/分数），腿②只收一般目标达成（目标达成/需求
 *     满足/质量没问题）——本族腿①是**临床生物标志物**、腿②是**硬临床终点
 *     结局**（死亡/心梗/中风/生存），两族词表互斥；
 *   · healthy_user_bias（r372）：行为/依从群体 × 健康结果归因，不要求标志物
 *     改善锚；confounding_by_indication（r339）：治疗分配基线预后混杂，不
 *     讲替代终点兑换；weak_evidence_strong_claim（dim245）：弱证据**类型** ×
 *     绝对化断言，本族的依据类型是**具体测量口径无效**（替代 ≠ 终点）而非
 *     证据强度不足；extraordinary_claims（r373）：离奇主张 × 弱基底，轴不同；
 *   · significance_verdict_misread（r387）/effect_measure_misread（r386）/
 *     censoring_neglect（r388）：显著性裁定 / OR-HR 口径 / 删失随访，均不以
 *     「标志物改善 → 硬终点获益」的兑换结构为射程。
 *
 * 判据（两腿近距共现 + 推断标记跨区重叠 + 两组豁免 + 双腿守卫，缺一不判）：
 *   ① 腿① SURROGATE 中间指标改善锚在场（带方向词、不受否定守卫）；
 *   ② 腿② HARD 硬临床终点获益结论在场（受紧前否定/对冲双守卫）；
 *   ③ 推断标记或条件连接与两腿跨区重叠（方向不限）；
 *   ④ 两腿落在邻近窗内（以腿②为锚，ZH 45 字 / EN 150 字符）；
 *   ⑤ 豁免 A 概念讨论（替代终点区别本身的教学/批评句）；
 *   ⑥ 豁免 B 正确对冲句（仍需终点证据/尚未公布/只能作为辅助）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观报告一项中间指标结果（「试验的替代
 * 终点达到显著性，主要终点数据尚未公布」——CORRECT 豁免天然不判），命中的是
 * 把替代终点直接兑换成硬临床获益的断言。verify 的语义是「这段文本拿中间指标
 * 的改善当成了临床结局的证明，先把替代终点与硬终点的对应关系对齐再决定是否
 * 采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学与批评句（替代终点不等于硬终点 / surrogate ≠ outcome）——CONCEPT 豁免；
 *   · 正确对冲句（仍需硬终点证据 / 数据尚未公布 / 只能作为辅助证据）——CORRECT 豁免；
 *   · 恶化陈述（肿瘤标志物升高说明病情进展）——腿①方向词不匹配；
 *   · 锚后否定句（血压一直没降下来 / LDL hasn't come down）——腿①否定守卫查
 *     锚与方向词之间的 interior 加紧前窗（r389 实现期实测修正：原守卫查匹配前
 *     gap，而腿①模式从锚起匹配时 gap 恒在锚前、锚后「没」落入 interior 致守卫
 *     静默失效，该句默认误判命中；修法=全部 SURROGATE 模式间隙加捕获组记录
 *     inter，守卫只查 interior + 紧前窗——不可查整条 raw，否则误杀「病毒载量
 *     检测不到」这类方向词自带否定形）；
 *   · 并列实测发现无推断标记（LDL 降了 40%；主要终点是心血管死亡率）；
 *   · 中间指标到中间指标的陈述（血脂降了、血糖达标了，无硬终点结论）——腿②缺失；
 *   · proxy_metric_goal（KPI/覆盖率）与 confounding_by_indication 领地。
 */

'use strict';

// ─── 腿① SURROGATE 中间指标改善锚（中文）──────────────────────
// 按"改善方向"分四组：代谢类（越低越好）、骨/免疫类（越高越好）、
// 肿瘤/影像类（缩小消退）、检验/病毒类（下降转阴）。方向词必须与标志物
// 名词近距共现（间隙 ≤12 字），单纯提及标志物不判（「肿瘤标志物的定义
// 是…」无方向词）。
const SURROGATE_ZH = [
  // 代谢/心血管类：血压、血脂、LDL、胆固醇、甘油三酯、血糖、糖化血红蛋白、HbA1c
  //   （中间间隙加捕获组：腿①否定守卫只查锚与方向词之间的 interior，
  //     r389 实测修正——原实现查匹配前的 gap，"血压一直没降下"整条从血压
  //     起匹配导致 gap 为空、否定守卫静默失效）
  /(?:血压|收缩压|舒张压|血脂|胆固醇|低密度脂蛋白|LDL|甘油三酯|血糖|糖化血红蛋白|HbA1c|胰岛素抵抗)([^。！？，；\n]{0,12})(?:下降|降低|降了|降下|减少|得到控制|控制住|控制到|恢复正常|回归正常|达标|改善|好转|优化)/,
  // 骨密度/免疫类：骨密度、T值、抗体滴度、中和抗体、抗体水平
  /(?:骨密度|T值|抗体滴度|中和抗体|抗体水平|免疫应答)([^。！？，；\n]{0,12})(?:提高|上升|升高|增加|改善|增强|上去|上来)/,
  // 很高的抗体滴度（方向词前置形）
  /很高的?(?:抗体滴度|中和抗体|抗体水平|免疫应答)/,
  // 肿瘤/影像类：肿瘤、病灶、肿块、瘤体、结节 缩小/消退/缓解
  /(?:肿瘤|病灶|肿块|瘤体|包块|结节)([^。！？，；\n]{0,12})(?:缩小|消退|缓解|消失)/,
  // 检验/病毒类：病毒载量、转氨酶、肌酐、尿酸、肝酶、肿瘤标志物、癌胚抗原、PSA、甲胎蛋白
  /(?:病毒载量|病毒量|载量)([^。！？，；\n]{0,12})(?:下降|降低|减少|检测不到|转阴)/,
  /(?:转氨酶|肌酐|尿酸|肝酶|肿瘤标志物|癌胚抗原|PSA|甲胎蛋白|糖筛|胰岛素水平)([^。！？，；\n]{0,12})(?:下降|降低|减少|恢复正常|回归正常|转阴|达标)/,
  /(?:抗体|抗原)([^。！？，；\n]{0,4})(?:转阴|阴转)/,
  // 泛称类：生物标志物、替代终点、替代标志物、中间指标、实验室指标、影像学
  /(?:生物标志物|替代终点|替代标志物|替代指标|中间指标|中介指标|实验室指标|检验指标|化验指标|生化指标|血液指标|影像学|影像检查|扫描结果|分子标志物)([^。！？，；\n]{0,12})(?:改善|好转|优化|恢复正常|向好|转向)/,
];

// ─── 腿① SURROGATE（英文）──────────────────────────────────────
// i flag：gate 路径文本经 text-normalizer 英文小写化（v6.7.73），大小写不敏感
//   才可达（r386 同款教训：裸大写锚在 normalize 小写化后静默穿透）。
const SURROGATE_EN = [
  // 同样加捕获组（腿①否定守卫查 interior，r389 实测修正）
  /\b(?:LDL(?:\s+cholesterol)?|blood\s+pressure|HbA1c|blood\s+sugar|cholesterol|viral\s+load|tumor\s+markers?|tumou?rs?|lesions?|bone\s+density|antibody\s+titers?|neutralizing\s+antibod\w+|biomarkers?|surrogate\s+endpoints?|intermediate\s+endpoints?|lab\s+values?|liver\s+enzymes?|PSA)\b([^.!?;]{0,25})\b(?:dropped|fell|decreased|reduced|lowered|improved|normalized|rose|increased|shrank|undetectable|controlled|reached\s+target|better|cut|came\s+down)\b/i,
  /\bhigh(?:er|est)?\s+(?:antibody\s+)?titers?\b/i,
  /(?:titers?|antibody\s+levels?)(\s+)(?:rose|increased|were\s+high)/i,
  /(?:cut|reduced?|lowered?|dropped|slashed|trimmed|decreased)\b([^.!?;]{0,25})\b(?:LDL(?:\s+cholesterol)?|blood\s+pressure|HbA1c|cholesterol|biomarkers?|tumor\s+markers?|viral\s+load|bone\s+density|antibody\s+titers?)\b/i,
  /\b(?:complete|partial)\s+(?:radiographic\s+|radiological\s+)?response\b/i,
  /\bimaging\b([^.!?;]{0,30})\b(?:response|shrinkage|regression)\b/i,
  /\b(?:surrogate|intermediate)\s+(?:endpoint|measure|outcome)\b([^.!?;]{0,25})\b(?:improved|improvement|better|met|reached)\b/i,
];

// ─── 腿② HARD 硬临床终点获益结论（中文）──────────────────────
// 只收**硬终点获益结论**：预防/减少硬终点事件、延长寿命/生存、降低死亡率、
//   临床获益确证、减少并发症、治愈/彻底清除、救命、长期风险解除。
// 不收中间指标描述（「血脂降了」「指标好转」是度量到度量的正常陈述）。
const HARD_ZH = [
  // 预防/减少硬终点事件
  /(?:预防|防止|防范|避免|减少|降低|减轻|遏制)[^。！？，；\n]{0,10}(?:心脏病|心脏病发作|心肌梗死|心梗|中风|卒中|脑卒中|骨折|跌倒|死亡|猝死|心血管事件|冠心病|心衰|肾衰|并发症|感染|病毒)/,
  // 否定式免患（「就不会骨折了」——否定词在匹配内部，紧前守卫查窗外故不误杀）
  /(?:就不会|不会|不再|再不|杜绝|免于)[^。！？，；\n]{0,3}(?:骨折|跌倒|中风|心梗|心肌梗死|猝死|死亡|复发|转移|并发症|感染)/,
  // 防住/抵御
  /(?:防住|防得了|抵挡住|抵御)[^。！？，；\n]{0,4}(?:感染|疾病|病毒|发作)/,
  // 延长寿命/生存
  /(?:延长|拉长|增加)[^。！？，；\n]{0,8}(?:寿命|生命|生存期|生存时间|存活时间)/,
  /(?:寿命|生命|生存期|存活时间)[^。！？，；\n]{0,6}(?:延长|拉长|增加|提升|更久)/,
  /(?:活得更?久|活得更好|长寿|延年益寿|长命百岁)/,
  // 生存/预后受益
  /(?:生存|预后)[^。！？，；\n]{0,6}(?:受益|获益|改善)/,
  // 降低死亡率
  /(?:降低|减少|压低)[^。！？，；\n]{0,8}(?:死亡率|死亡风险|病死率|全因死亡)/,
  // 临床获益/价值确证
  /(?:临床获益|临床收益|临床价值|临床意义)[^。！？，；\n]{0,8}(?:确证|得到确证|确认|确立|证明|体现|彰显|坐实)/,
  // 临床上取得成功/奏效/见效
  /(?:临床上|临床)[^。！？，；\n]{0,8}(?:取得成功|获得成功|成功|奏效|见效|突破)/,
  // 对患者/病人有好处/益处
  /(?:对|给)(?:患者|病人|受试者)[^。！？，；\n]{0,10}(?:有|确有|真的有|的确有|确实有)[^。！？，；\n]{0,4}(?:好处|益处|益|帮助|价值|实惠)/,
  /(?:患者|病人|受试者)[^。！？，；\n]{0,8}(?:有|确有|真的有)[^。！？，；\n]{0,4}(?:实质性)?(?:好处|益处|实惠|帮助)/,
  // 并发症减少
  /(?:并发症)[^。！？，；\n]{0,6}(?:减少|降低|更少|下降)/,
  // 治愈/彻底清除
  /(?:治愈|根治|根除|彻底清除|完全清除)/,
  // 救命
  /(?:救命|保命|保住.{0,4}命|救回|挽回生命)/,
  // 长期预后/生存改善
  /(?:长期预后|远期预后|长期生存|远期生存)[^。！？，；\n]{0,6}(?:改善|更好|提升|受益)/,
  /(?:心血管结局|临床结局|硬终点|终点事件|主要终点)[^。！？，；\n]{0,8}(?:改善|好转|减少|降低|受益)/,
  // 风险/隐患解除
  /(?:长期|远期)[^。！？，；\n]{0,6}风险[^。！？，；\n]{0,4}(?:解除|消除|消失|排除)/,
  /(?:风险|隐患)[^。！？，；\n]{0,4}(?:解除|消除|消失|排除|化解)/,
  /(?:没有|无)[^。！？，；\n]{0,4}(?:健康隐患|后顾之忧|风险)/,
  // 患者受益
  /(?:患者|病人|受试者)[^。！？，；\n]{0,6}(?:受益|获益|得到保护|活得更)/,
];

// ─── 腿② HARD（英文）──────────────────────────────────────────
const HARD_EN = [
  /\b(?:prevent|prevents|preventing|avoid|avoids|reduc\w+|lower|lowers|fewer)\b[^.!?;]{0,25}\b(?:heart\s+attacks?|strokes?|fractures?|deaths?|cardiovascular\s+events?|MACE|heart\s+disease|mortality|complications)\b/i,
  /\b(?:will\s+not|won'?t|no\s+longer)\s+(?:fracture|suffer|develop|die|relapse|recur)\b/i,
  /\bprotect\w*\s+(?:against|from)\s+(?:infection|disease|illness|death|severe\s+disease)\b/i,
  /\b(?:live|lives|living)\s+longer\b|\bprolong\w*\s+survival\b|\bsurvival\s+benefit\b|\blonger\s+survival\b/i,
  /\b(?:mortality|death\s+rate|risk\s+of\s+death|overall\s+survival)\b[^.!?;]{0,20}\b(?:reduced?|lower|improved|better|decreased?|dropped)\b/i,
  /\b(?:survival|outcome|outcomes)\b[^.!?;]{0,15}\b(?:must\s+)?(?:improve|better|improved)\b/i,
  /\bclinical\s+benefit\b|\bconfirms?\s+(?:the\s+)?clinical\s+value\b|\bproves?\s+(?:the\s+)?clinical\s+value\b|\bestablishes?\s+clinical\b/i,
  /\bfewer\s+complications\b|\bcured\b|\bsaves?\s+lives\b|\bsave\s+lives\b/i,
  /\b(?:long-term|long\s+term)\s+(?:risk|risks)\b[^.!?;]{0,25}\b(?:resolved|gone|eliminated|removed)\b/i,
  /\b(?:stroke|heart\s+attack|fracture)\s+risk\b[^.!?;]{0,15}\b(?:is\s+gone|disappeared|eliminated|removed)\b/i,
  /\b(?:patients?|subjects?|people)\s+(?:clearly|obviously|really|truly|actually|undoubtedly|therefore)?\s*benefit\b/i,
];

// ─── 推断标记（获益结论由标志物改善推出，而非并列陈述）─────────
// 条件连接（只要…就…）允许跨两腿全区——「只要替代终点改善，患者最终的生存
//   就会受益」中连接词起于腿①之前、终于腿②之内，严格"介于"会漏掉该攻击形
//   （r387 同款教训：允许与腿②重合，本族推广到跨区重叠）。
const INFER_ZH = /(?:所以|因此|据此|可见|说明|表明|证明|意味着|足以|当然|显然|肯定|一定|反映出|体现出|足见|充分说明|充分证明|足以表明|足以证明|结论就是|就是说|毋庸置疑|毫无疑问|分明|就代表|代表着|据此可以|就可以|可以说|可以认为|可以认定|可以采信|可以断定|足以认定|足以相信|有理由相信|等于|相当于|提示|预示着|即|方向(?:符合|一致|印证|佐证)|只要[^。！？\n]{0,14}(?:就|便|即|则)|若[^。！？\n]{0,14}(?:就|便|即|则)|一旦[^。！？\n]{0,14}(?:就|便|即|则))/;
const INFER_EN = /\b(?:so|therefore|thus|hence|means|meaning|meant|mean|which\s+(?:means|proves|shows|supports?|suggests?|indicates?|confirms?|demonstrates?|implies?)|that\s+means|proves?|proving|shows?|showing|indicates?|indicating|demonstrates?|demonstrating|suggests?|suggesting|confirms?|confirming|implies?|establish(?:es|ing)?|concludes?|concluding|it\s+follows|this\s+shows|this\s+proves|clearly|obviously|thereby|consequently|if\s+[^.]{0,30}\bthen\b|as\s+long\s+as\b[^.]{0,30}\b(?:then|will|would))\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 45;
const WINDOW_EN = 150;

// ─── 豁免 A：概念讨论（替代终点区别本身的教学/批评句）─────
// 概念词在场 + 批评/教学词近距共现（防「替代终点不等于硬终点」前缀绕过，
// r368/r379/r386 同款教训）。不收裸「风险」「效应」——那是腿②领地。
const CONCEPT_ZH = /(?:替代终点|生物标志物|替代标志物|替代指标|中间指标|中介指标|实验室指标|检验指标|化验指标|生化指标|影像学|肿瘤标志物|骨密度|抗体滴度|糖化血红蛋白|LDL|低密度脂蛋白|血压|生存率)[^。！？，；\n]{0,30}(?:不等于|并非|不代表|不意味着|不能|不可|不宜|不应|不是一回事|两回事|另一回事|区别|区分|混淆|误读|误解|误区|错误|谬误|常见|典型|所谓|概念|定义|教学|讨论|包装|话术|陷阱|误导|未必|不一定|只能作为|只是|充其量)/;
const CONCEPT_EN = /\b(?:surrogate\s+endpoints?|biomarkers?|intermediate\s+endpoints?|lab\s+values?|tumor\s+markers?|surrogate|proxies|proxy)\b[^.]{0,110}\b(?:does\s+not|doesn'?t|do\s+not|don'?t|is\s+not|are\s+not|cannot|can'?t|not\s+the\s+same|distinct\s+from|mislead\w*|misread|misinterpret\w*|confus\w+|misconception|fallacy|common\s+mistake|mistaken|myth|weasel\w*)\b/i;

// ─── 豁免 B：正确对冲句（仍需终点证据/尚未公布/只能作为辅助）──
const CORRECT_ZH = [
  /(?:仍需|尚需|还需要|有待)[^。！？，；\n]{0,12}(?:证据|验证|数据|试验|终点|观察|确认)/,
  /(?:不足以|无法|不能|说明不了|证明不了|推不出)[^。！？，；\n]{0,12}(?:说明|证明|推断|下结论|采信|认定|表明)/,
  /(?:尚未|还未|没有|未见)[^。！？，；\n]{0,10}(?:公布|报道|见到|看到|出来|完成)/,
  /(?:只是|仅是|只不过|仅仅是)[^。！？，；\n]{0,10}(?:中间指标|替代终点|代理指标|参考|辅助|侧面|表象)/,
  /(?:主要终点|硬终点)[^。！？，；\n]{0,12}(?:尚未|还未|没有|未见|待|仍是|在进行)/,
  /(?:仍在|还在|尚在)[^。！？，；\n]{0,6}(?:进行|招募|随访|观察)/,
  /(?:不能|无法|不宜|不应)[^。！？，；\n]{0,10}(?:直接|简单|轻易|单独)[^。！？，；\n]{0,6}(?:说明|推断|等同|等同于|当作)/,
  /(?:只|仅|仅仅)(?:能)?(?:说明|代表|反映|证明)[^。！？，；\n]{0,16}(?:存在|出现|有|未必|不一定|不能|并非|不)/,
  /(?:要靠|要看|取决于)[^。！？，；\n]{0,8}(?:终点|硬终点|结局|主要终点)/,
];
const CORRECT_EN = [
  /\b(?:still|yet)\s+(?:need\w*|require\w*|await\w*|pending)\b[^.]{0,40}\b(?:evidence|data|endpoints?|trials?|outcomes?)\b/i,
  /\b(?:not|insufficient|cannot|can'?t|unable)\b[^.]{0,40}\b(?:enough|sufficient)\b[^.]{0,30}\b(?:evidence|data|conclude|establish|prove|infer)\b/i,
  /\b(?:has|have)\s+not\s+(?:yet\s+)?(?:been\s+)?(?:published|reported|released|shown|demonstrated)\b/i,
  /\b(?:only|merely|just)\s+a\s+(?:surrogate|proxy|intermediate)\b[^.]{0,40}\b(?:not|rather\s+than)\b/i,
  /\b(?:primary|hard|clinical)\s+(?:endpoint|outcome)s?\b[^.]{0,40}\b(?:pending|await\w*|not\s+yet|still\s+(?:ongoing|recruiting|underway))\b/i,
  /\b(?:still|currently)\s+(?:ongoing|recruiting|underway|enrolling)\b/i,
  /\bdoes\s+not\s+(?:by\s+itself\s+)?(?:mean|imply|establish|prove|guarantee)\b/i,
  /\bwe\s+(?:still\s+)?need\b[^.]{0,30}\b(?:hard|clinical)\s+(?:endpoint|outcome)s?\b/i,
];

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    // inter：锚与方向词之间的捕获组（腿①否定守卫只查 interior，r389 实测修正）
    const inter = m[1] !== undefined ? m[1] : '';
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0], inter });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 腿②守卫（r375/r377/r378/r379/r381/r385/r386/r387 同款）：紧前否定窗（ZH 6 字 /
//   EN 20 字符，含否定即「并非延长寿命/不等于无差异」纠正形）+ 对冲短语（腿②
//   前后出现「不意味着/误解/混淆」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是|不等于|并非|未必|不一定)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|misinterpret\w*|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same)/i;

// 腿①否定守卫（本族新增）：方向词前 4 字内出现否定即「血压一直没降下来」
//   （恶化/未改善陈述），不构成"改善锚"。
const NEG1_ZH = /(?:并不|并未|并未能|没能|没有|没|未|无|难以|无法)/;
const NEG1_EN = /\b(?:not|never|no|failed\s+to|didn'?t|did\s+not|unable\s+to|hardly)\b/i;

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
    // 腿①否定守卫：只查锚与方向词之间的 interior（x.inter，"血压一直没降下"）
    //   + 匹配前紧前窗（EN "did not lower..." 类）。
    //   r389 实测修正——原实现只查匹配前 gap：腿①模式从锚起匹配时 gap 恒在
    //   锚前，"血压一直没降下"的"没"在 interior 里、gap 为空 → 守卫静默失效；
    //   而查整条 raw 会误杀"病毒载量检测不到"（方向词自带否定形），故必须
    //   精确定位到 interior。
    const inter = x.inter !== undefined ? x.inter : '';
    const gap = text.slice(Math.max(0, x.idx - 4), x.idx);
    const gapEn = text.slice(Math.max(0, x.idx - 14), x.idx);
    for (const re of neg1ZhList) { if (re && re.test && re.test(inter)) return false; }
    for (const re of neg1EnList) { if (re && re.test && re.test(inter)) return false; }
    for (const re of neg1ZhList) { if (re && re.test && re.test(gap)) return false; }
    for (const re of neg1EnList) { if (re && re.test && re.test(gapEn)) return false; }
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
// 默认值本身是 RegExp 或数组。统一成数组供消费（r385/r386/r387 同款）。
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

// 签名收集：腿②硬终点结论为锚（窗内），腿①标志物改善锚在场，推断标记须与
//   两腿跨区重叠（腿①在前或腿②在前均可）。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      a: [..._normInject(R.SURROGATE_ZH, SURROGATE_ZH)],
      b: [..._normInject(R.HARD_ZH, HARD_ZH)],
      infer: R.INFER_ZH != null ? R.INFER_ZH : INFER_ZH,
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      a: [..._normInject(R.SURROGATE_EN, SURROGATE_EN)],
      b: [..._normInject(R.HARD_EN, HARD_EN)],
      infer: R.INFER_EN != null ? R.INFER_EN : INFER_EN,
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const inferM = allMatches(L.infer, text);
    if (inferM.length === 0) continue;
    const aM = collect(text, L.a, { leg1: true }, R);
    if (aM.length === 0) continue;
    const bM = collect(text, L.b, {}, R);
    if (bM.length === 0) continue;
    for (const b of bM) {
      const a = aM.find(x => dist(x, b) <= L.win);
      if (!a) continue;
      // 推断标记须与两腿跨区重叠（方向不限）：严格"介于"会漏掉条件连接形
      //  （「只要替代终点改善，生存就会受益」连接词起于腿①之前）与腿②自带
      //  连接词的形（「可以采信」兼任结论，r387 同款教训）。
      const spanLo = Math.min(a.idx, b.idx);
      const spanHi = Math.max(a.end, b.end);
      const hit = inferM.find(x => x.idx <= spanHi && x.end >= spanLo);
      if (!hit) continue;
      sigs.push({ lang: L.lang, leg1: a.raw, leg2: b.raw, infer: hit.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.leg1 + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 替代终点误读签名：中间指标改善锚 × 硬临床终点获益结论 两腿近距共现，且
 * 推断标记与两腿跨区重叠。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSurrogateEndpointMisread(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（替代终点区别本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确对冲句（仍需硬终点证据/数据尚未公布/只能作为辅助证据）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.66;
  return {
    hit: true,
    dimension: 'surrogate_endpoint_misread',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '中间指标「' + x.leg1 + '」→ 硬终点结论「' + x.leg2 + '」（推断标记「' + x.infer + '」，替代终点误读）'
      : 'surrogate marker "' + x.leg1 + '" -> hard-endpoint claim "' + x.leg2 + '" (via "' + x.infer + '", surrogate-endpoint misread)')),
    details: s.lang === 'zh'
      ? '替代终点误读(' + sigs.length + '处: 拿「' + s.leg1 + '」直接推出「' + s.leg2 + '」——中间指标的改善不等于硬临床终点的获益)(zh)'
      : 'surrogate-endpoint misread(' + sigs.length + 'x: "' + s.leg1 + '" directly converted into "' + s.leg2 + '" — improving an intermediate marker is not the same as benefiting a hard clinical endpoint)(en)',
    guidance: '替代终点误读（surrogate endpoint misread / surrogate-to-hard-endpoint leap）：把血压、血脂、LDL、糖化血红蛋白、肿瘤标志物、骨密度、抗体滴度、病毒载量这类**中间指标**的改善，直接当成预防心梗/中风/骨折/死亡、延长寿命、降低死亡率、临床获益的**证明**，跳过「替代终点只与真实结局相关、其改善不保证结局改善」这一生存分析与临床试验的基本纪律。请先把替代终点与硬终点的对应关系对齐再下结论：明确说明该标志物只是中间指标/替代终点（而不是临床结局本身）、指出已有哪些硬终点证据（死亡率/心血管事件/骨折发生率）而哪些还没有、把结论限定在检验实际支持的范围（「本研究显示 LDL 下降 40%，对心血管结局的影响尚需终点试验确认」）、需要下临床获益结论时引用硬终点随机对照试验结果（而不是替代终点的显著性）。正确做法还包括：说明替代终点可能误导（历史上有多个替代终点改善而硬终点恶化甚至增加死亡的先例）、指出替代终点与硬终点的相关性需要在元分析层面验证。若这段话只是并列陈述替代终点结果与终点试验设计（LDL 降了 40%；试验的主要终点是心血管死亡率），那是正当的报告方式，无需修改。',
    tags: ['statistics', 'statistical-literacy', 'clinical-trials', 'surrogate-endpoint', 'biomarker', 'epidemiology', 'evidence-interpretation', 'inference', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectSurrogateEndpointMisread,
  __internals: () => ({
    SURROGATE_ZH, SURROGATE_EN, HARD_ZH, HARD_EN,
    WINDOW_ZH, WINDOW_EN,
    INFER_ZH, INFER_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN, NEG1_ZH, NEG1_EN,
    findSignatures,
  }),
};
