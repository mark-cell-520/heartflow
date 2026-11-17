/**
 * src/relative-risk-individual-transfer.js — r378 第 264 维度
 * relative_risk_individual_transfer（相对风险个体平移 / 基线风险忽视）
 *
 * 攻击族：群体层的相对风险/效应量降幅，被直接平移成个体层同幅度收益。
 * 典型形状：
 *   「这种治疗能把心血管事件的风险降低60%，所以每个患者的心血管事件
 *     都会减少六成」
 *   "The vaccine cuts infection risk by 90%, so each person's chance of
 *     catching it drops by nine tenths."
 *
 * 判别结构（两腿 + 推论连接，缺一不判）：
 *   · 腿① GROUP 群体层统计量陈述：相对风险/相对降幅（相对风险/风险降低
 *     X%/relative risk/risk reduction/risk cut by/有效率/RRR）作用于
 *     **人群/患者整体/受试者** 这类聚合主语。
 *   · 腿② INDIV 个体层同幅度兑现：把该降幅直接兑现到个体（每个患者/
 *     每个人/个人/each individual/every person/you personally）身上，
 *     且带同幅度量（也少/同样/都减少/同样幅度/drops by the same）。
 *   · 腿③ 推论连接（所以/因此/so/therefore/thus/hence）——把群体统计
 *     与个体兑现连成因果推理动作。裸并列陈述（先说群体再说个体、无推论
 *     连接）不判。
 *
 * 为什么取 VERIFY 级：单句也可能是**正确换算后的陈述**（已折算成绝对
 * 风险/已说明基线），rewrite/block 会误伤。verify 的含义是「这段文本把
 * 群体层相对效应量平移到了个体层兑现，需要先验证个体层绝对收益与基线
 * 风险再采信」——调用方应要求补出基线风险与绝对风险差。
 *
 * 与既有维度的射程切分（避免假增量）：
 *   · base_rate_neglect（第 169 维度）管「忽视基数/先验概率做条件推断」，
 *     核心是**概率更新时忽略基数**；本族的核心是**相对效应量跨层平移**，
 *     句子可以不含任何概率更新（「风险降低60%」是效应量陈述而非条件
 *     概率推断），且必须含个体层兑现腿。
 *   · statistical_misleading 管基数隐藏的比例断言（缺分母的百分比）；
 *     本族的百分比有明确基数（相对风险），缺的是**层间换算**。
 *   · percentage_overflow 管百分比超 100/不可加的溢出误用；本族的数字
 *     本身合法（60% 相对降幅是真实统计量）。
 *   · ecological_fallacy（第 211 维度）管「群体聚合特征推到个体属性」，
 *     射程在**属性/相关关系**；本族射程在**效应量的幅度兑现**（幅度数字
 *     与个体绑定），且以「相对风险」词形为腿①。
 *   · 存量维度（ecological/statistical_misleading/percentage_overflow）
 *     主要代拦含绝对数字/生态量词的变体；纯净双腿形穿透稳定（r378 六轮
 *     探针实证，见 test/round-378-relative-risk-individual-transfer.test.js）。
 *
 * 明确不判的（豁免——正当陈述与正确判别）：
 *   · 正确换算（已折算绝对风险/需结合基线/基线只有X%/低于基线/在基线
 *     附近/绝对风险只下降/individual risk depends on baseline/absolute
 *     risk reduction）——本族要教的判别动作。
 *   · 概念/教学转述（相对风险/绝对风险/基线风险/NNT/相对风险降低/RRR/
 *     relative risk/absolute risk/baseline risk/教材|论文|称为|定义|
 *     fallacy）——讨论这个概念本身不是运用它。
 *   · 统计规范陈述（相对风险降低RRR/绝对风险降低ARR/NNT需结合基线/
 *     95%置信区间/显著性/统计学教材口径）——研究者在正确报告口径。
 *   · 疑问句（含 ?/？；反问标记出现时不豁免——「难道每个人的风险都
 *     真少六成？」正是本族最常见的包装形态）。
 *   · 无腿②（只说群体相对降幅、无个体兑现）——「疫苗在人群中把感染
 *     风险压低九成」本身是正确的群体陈述，不判。
 *   · 无腿①（只说个体收益、无群体统计）——「你打完疫苗后风险确实低
 *     了很多」是个体经验陈述，不判。
 *
 * 已知边界：
 *   · 腿①腿②以词表识别，未收入词表的同义表述不判。
 *   · 邻近窗外的跨段共现（两腿相隔 >80 字 / EN >200 字符）不判。
 *   · 与 ecological_fallacy 的共命中按射程切分声明，未做大规模共现
 *     消歧压测。
 */
'use strict';

// ─── 腿① GROUP 群体层统计量陈述（中文）──────────────────────────
const GROUP_ZH = [
  // 相对风险/相对降幅词形（作用于聚合主语）
  /相对风险(?:降低|下降|减少|降幅)?|相对危险度|相对危险(?:度)?降低|相对效应|效应量(?:降幅|降低|减少)?/,
  /风险(?:降低|下降|减少|压低|降幅)(?:了|到|至)?[0-9０-９一二三四五六七八九十百]+(?:\.|点)?[0-9０-９一二三四五六七八九十]*%|百分之[0-9０-９一二三四五六七八九十百]+/,
  /感染(?:风险|率)(?:降低|下降|减少|压低)|发病(?:风险|率)(?:降低|下降|减少|压低)|心血管事件(?:风险|率)(?:降低|下降|减少|压低)/,
  /(?:把|将)?(?:风险|感染率|发病率|复发率|死亡率|事件率)(?:降低|下降|减少|压低|砍掉|削减)(?:了|到)?/,
  /(?:治疗|药物|疫苗|干预|疗法|手术|方案)(?:能|可|可以|可将)?(?:把|将)?(?:风险|发病率|感染率|死亡率|事件率)(?:降低|下降|减少|压低)/,
  /有效率|保护率|缓解率|应答率|治愈率/,
  /在(?:人群|受试者|患者|试验组|人群中|整体上|平均而言)中?(?:的)?(?:风险|发病率|感染率|效果)/,
  /人群(?:层面|水平|中|上)的?(?:风险|发病率|感染率|效果|降幅)/,
  /群体(?:层面|水平|中|上)的?(?:风险|发病率|感染率|效果|降幅)/,
  /平均(?:而言|来说|来看)?(?:风险|发病率|感染率)?(?:降低|下降|减少)/,
  /统计学(?:显著|意义|上显著)|显著(?:降低|下降|减少|优于)/,
  /六成|九成|八成|七成|五成|四成|三成|两成|对折|减半|砍半/,
];

// ─── 腿① GROUP 群体层统计量陈述（英文）──────────────────────────
const GROUP_EN = [
  /\brelative\s+(?:risk|reduction|benefit|effect|effectiveness)\b/i,
  /\bRRR\b/,
  /\brisk\s+(?:reduction|was\s+reduced|is\s+reduced|cut|lowered|dropped|decreased)\s+(?:by\s+)?[0-9]+(?:\.[0-9]+)?\s*%|\breduces?\s+.{0,40}?\brisk\s+by\s+[0-9]+(?:\.[0-9]+)?\s*%/i,
  /\b(?:cuts?|lowers?|reduces?|drops?|decreases?)\s+.{0,40}?\brisk\s+(?:by|of|to)\s+[0-9]+(?:\.[0-9]+)?\s*%/i,
  /\b(?:infection|incidence|mortality|event)\s+rate\s+(?:fell|dropped|was\s+reduced|decreased)\s+by\s+[0-9]+(?:\.[0-9]+)?\s*%/i,
  /\b(?:efficacy|effectiveness|response\s+rate|cure\s+rate)\s+(?:of|was|is)\s+[0-9]+(?:\.[0-9]+)?\s*%/i,
  /\b(?:in|across|among)\s+the\s+(?:population|cohort|trial\s+group|treatment\s+group|subjects?|participants?)\b/i,
  /\b(?:population|group|cohort)[- ](?:level|wide|average)\s+(?:risk|effect|reduction|benefit)\b/i,
  /\b(?:on\s+)?average\s+(?:the\s+)?(?:risk|rate|chance)\s+(?:fell|dropped|was\s+reduced|decreased)\b/i,
  /\b(?:statistically\s+)?significant(?:ly)?\s+(?:reduction|decrease|lower|reduced|better|superior)\b/i,
  /\b(?:halved|cut\s+in\s+half|reduced\s+by\s+half|nine\s+tenths|six\s+tenths)\b/i,
  // r378 补腿：英文群体幅度口语形——`is a third lower` / `a quarter less`
  // / `was cut in half` 不出现 `relative risk` 字样（前文只出现一次
  // "in relative terms"），原 GROUP_EN 前 10 条全部要求 risk/reduction
  // 显式同现，该形整条不判（r378 miss 实例）。
  /\b(?:population|group|cohort|overall|average|aggregate)\s+(?:risk|rate)\s+(?:is|was)\s+(?:a|an|one)?\s*(?:quarter|third|half|fifth|sixth|tenth|[0-9]+(?:\.[0-9]+)?\s*%)\s+(?:lower|less|fewer|reduced|smaller)\b/i,
  /\b(?:risk|rate)\s+(?:is|was)\s+(?:a|an|one)?\s*(?:quarter|third|half|fifth|sixth|tenth)\s+(?:lower|less|fewer)\s+in\s+(?:the\s+)?(?:population|group|cohort|treatment\s+arm)\b/i,
  /\bin\s+relative\s+terms\b/i,
];

// ─── 腿② INDIV 个体层同幅度兑现（中文）──────────────────────────
  // MOD 吸收「也/都/同样 + 情态动词（会/能/将/可以）」的组合：本族最常见的
  // 包装是「每个患者也会少六成」「你能拿到同样幅度的收益」，情态词夹在
  // 个体指称与兑现动词之间，不收它整条腿就断。
  // BARE 吸收裸指称形（「每个参与者本人的风险也都……」中，个体指称紧接
  // 的「本人/自己的」是所有权短语而非兑现动词；先用 BARE 收位置，再由
  // MOD + 兑现动词腿在同窗内配对）。
  // **AMT 同幅度量族**（r378 补腿）：幅度量的中文口语形「六成/四分之一/
  // 两成/三分之一/六折」直接绑定个体指称时，腿②不出现显式兑现动词——
  // 「每个参与者的个人风险也都打六折」「你作为个体同样下降四分之一」。
  // 原 INDIV 腿全部要求「指称+兑现动词」共现，这两族整条不判。
  const MOD_ZH = '(?:也|都|同样|照样|会|能|可以|将|能会|会能|本人|自己|自身)*';
  const AMT_ZH = '(?:[0-9０-９一二三四五六七八九十百]+(?:\\.|点)?[0-9０-９一二三四五六七八九十]*%|百分之[0-9０-９一二三四五六七八九十百]+|六成|九成|八成|七成|五成|四成|三成|两成|一成|(?:一|二|三|四|五|六|七|八|九|十)(?:分之[一二三四五六七八九十])+|(?:一|二|三|四|五|六|七|八|九|十)(?:分之[一二三四五六七八九十])+|六折|七折|八折|九折|对折|减半|砍半|六?折|打对折)';
  const INDIV_ZH = [
    // 个体指称 + 同幅度兑现
    /每个(?:人|患者|参与者|受试者|个体|个人)/,
    /每(?:一)?个(?:人|患者|参与者|受试者|个体|个人)/,
    /个(?:人|体|人)(?:的)?(?:风险|发病率|感染率|收益|获益)?/,
    /个(?:人|体|人)MOD_ZH(?:少|降低|下降|减少|打|享|获益|受益|兑现|适用)/,
    /(?:你|您|我们)(?:个人|自己|自身)?(?:的)?(?:风险|发病率|感染率|收益|获益|好处|保护)?MOD_ZH(?:少|降低|下降|减少|获益|受益|兑现|适用|享受|获得|拿到)/,
    /个(?:人|体|人)(?:层面|身上|角度)MOD_ZH(?:少|降低|下降|减少|兑现|适用)/,
    /同(?:样|等)(?:幅度|比例|程度|效果)(?:的)?(?:收益|获益|下降|降低|减少|兑现)?/,
    /MOD_ZH(?:少|降低|下降|减少|打)(?:同样|一样|同等)?(?:幅度|比例|程度)?(?:的)?/,
    /落(?:在|到)(?:每个|个人|个体|你)(?:人|患者|参与者|自身)?(?:身上|头上)/,
    /兑现(?:到|在|于)(?:每个|个人|个体|你|自身)/,
    /(?:每个|个人|个体|你)(?:都|也|会|能|将)MOD_ZH(?:享受|获得|拿到)(?:同样|同等)?(?:幅度|比例)?(?:的)?(?:收益|好处|保护)/,
    // AMT 腿：个体指称 + 同幅度量（中文口语幅度形）——「每个参与者的个人
    // 风险也都打六折」「你作为个体同样下降四分之一」「落到每个人头上也是
    // 两成」。原腿族全部要求显式兑现动词，这两族只有幅度量，整条漏判。
    /每个(?:人|患者|参与者|受试者|个体|个人)(?:的)?(?:个人|自身|本人)?(?:风险|发病率|感染率|收益|获益|好处|保护)?MOD_ZH(?:打|是|为|有|也|都)?AMT_ZH/,
    /个(?:人|体|人)(?:层面|身上|角度|作为个体)?MOD_ZH(?:下降|降低|减少|打|是|为)?AMT_ZH/,
    /(?:你|您|我们)(?:个人|自己|自身|作为个体)?(?:的)?(?:风险|发病率|感染率|收益|获益|好处|保护)?MOD_ZH(?:下降|降低|减少|打|是|为|拿|享)?AMT_ZH/,
    /落(?:在|到)(?:每个|个人|个体|你)(?:人|患者|参与者|自身)?(?:身上|头上)(?:也|都|同样|照样)?(?:是|为|有)?AMT_ZH/,
    // r378 补腿：个体指称 + 相对风险复述 + 降幅——「相对风险下降 25%，
    // 个人相对风险也下降 25%」中腿②「个人相对风险也下降 25%」没有任何
    // 原腿能整条收住（原腿要么只要指称、要么要指称+动词但 AMT 腿要求
    // 指称紧跟幅度量，中间隔着「相对风险」）。本腿收指称+同幅度复述。
    /个(?:人|体)(?:的)?(?:相对|绝对)?风险?(?:也|都|同样|照样)?(?:下降|降低|减少|降幅|为|是|有|打|少)AMT_ZH/,
    /(?:你|您|我们|每个|各位)(?:的)?(?:个人|自身|本人)?(?:相对|绝对)?风险?(?:也|都|同样|照样)?(?:下降|降低|减少|降幅|为|是|有|打|少)AMT_ZH/,
  ].map(s => new RegExp(s.source.replace(/MOD_ZH/g, MOD_ZH).replace(/AMT_ZH/g, AMT_ZH), s.flags));

// ─── 腿② INDIV 个体层同幅度兑现（英文）──────────────────────────
const INDIV_EN = [
  /\bevery\s+(?:individual|person|patient|participant|subject|user)\b/i,
  /\beach\s+(?:individual|person|patient|participant|subject|user)\b/i,
  /\byou\s+personally\b/i,
  /\byour\s+(?:personal|individual|own)\s+(?:risk|chance|odds|benefit|protection)\b/i,
  /\b(?:each|every)\s+(?:person|individual|patient)\s+(?:will|would|can|should|gets?|gets)\s+(?:the\s+)?(?:same|equivalent|equal)\b/i,
  /\b(?:same|equivalent|equal)\s+(?:degree|extent|magnitude|amount|proportion|share)\s+of\s+(?:benefit|protection|risk\s+reduction|reduction)\b/i,
  /\b(?:drops?|falls?|decreases?|reduces?)\s+by\s+the\s+same\s+(?:amount|degree|extent|proportion)\b/i,
  /\b(?:applies?|transfers?|carries?\s+over|holds)\s+(?:equally|directly|one[- ]to[- ]one)\s+to\s+(?:each|every|you|individuals?|people)\b/i,
  /\bfor\s+you\s+personally\b/i,
  /\b(?:each|every)\s+(?:person|individual)\s+(?:gets?|receives?|enjoys?)\s+(?:the\s+)?(?:full|same)\s+(?:benefit|protection|effect)\b/i,
  // r378 补腿：英文个体幅度兑现形——腿②以幅度量绑定个体指称而不出现
  // 显式兑现动词（"it fell by half for you"、"each participant is a
  // third lower"、"a third lower ... for each participant"）。
  /\bfell\s+by\s+(?:half|a\s+quarter|a\s+third|two\s+thirds|[0-9]+(?:\.[0-9]+)?\s*%|nine\s+tenths|six\s+tenths)\s+for\s+(?:you|each|every|individuals?|people|participants?)\b/i,
  /\b(?:drops?|falls?|decreases?|reduces?|is|are|was|were)\s+(?:a|an|one)\s+(?:quarter|third|half|fifth|sixth)\s+lower\s+for\s+(?:you|each|every|individuals?|people|participants?)\b/i,
  /\b(?:you|each|every)\s+(?:individual|person|participant|patient)\s+(?:is|are|was|were|gets?|get|received?|receives?)\s+(?:a|an|one)?\s*(?:quarter|third|half|fifth|sixth|[0-9]+(?:\.[0-9]+)?\s*%|nine\s+tenths)\s+(?:lower|less|fewer|reduction|reduction\s+in\s+risk)?\b/i,
  /\bfor\s+(?:you|each|every)\s+(?:individual|person|participant|patient)\b(?=[^.]{0,40}\b(?:lower|less|reduction|benefit)\b)/i,
];

// ─── 腿③ 推论连接（群体统计 → 个体兑现的推理动作）────────────────
// 覆盖顺推（所以/因此）与倒装（因为/由于）两种语序：推理连接是「把群体
// 统计与个体兑现连成因果动作」的充要标记，顺装倒装都是该谬误的话形。
// r378 补腿：中文推论连接扩形——原 INFER_ZH 只收显式连接词，但中文更
// 常见的三种零连接形态整条漏判（腿①②双命中，5 条 miss 全部卡在此）：
//   ① 逗号并列推论：「群体相对风险降到三成，落到每个人头上也是三成」
//   ② 同位复述：「…下降四分之一，你作为个体同样下降四分之一」
//   ③ 零连接同幅度复述：「相对风险下降 25%，个人相对风险也下降 25%」
// 实现上**不收裸「，/、」**（那会让任何含逗号的中文句 infer=true，等于
// 取消腿③），改为「腿①命中位置与腿②命中位置之间存在连接标记」的结构
// 化判据——`hasInferenceBetween(gStart, gEnd, iIdx)` 见下方函数。
// 连接标记：显式连接词 ∪ 逗号并列 ∪ 同样/也是/等同幅度复述。
const INFER_ZH = /所以|因此|因而|故而|可见|这说明|这表明|那么|也就是说|换句话说|等于|意味着(?:每个|个人|你)|顺理成章|理所当然|因为|由于|既然|鉴于|可以说|看得出来|足见|据此|据(?:此|统计结果)|从统计结果看|统计结果看|研究显示|结果显示|试验显示|数据表明|同(?:样|理|等)|也(?:是|就)?(?:同样|同样地)|亦然|同理/;
// 连接标记（结构化用）：显式连接词 ∪ 逗号/分号/顿号 ∪ 同幅度复述
const INFER_MARK_ZH = /，|,|；|;|、|所以|因此|也就是说|这意味着|等于|同(?:样|理|等)|也(?:是|同样|同样地)|同样|就是|亦/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|that\s+means|meaning|in\s+other\s+words|it\s+follows|because|since|as\s+a\s+result|consequently|accordingly)\b/i;

// ─── 豁免一：正确换算（本族要教的判别动作）──────────────────────
// 已折算绝对风险 / 明确提示要结合基线——是统计学上正确的表述。
const EXEMPT_CORRECT_ZH = [
  /绝对风险(?:降低|下降|减少|只|才|仅)|绝对风险差|需(?:要)?结合(?:基线|基准风险)|要(?:看|结合|取决于)(?:基线|基准风险|个人基线)/,
  /基线(?:风险|率)(?:只有|仅|才|为|是|约|大约|接近|低于|高于|因人而异|因人不同)/,
  /(?:风险|发病率)(?:本身|本来)?(?:很|极|非常)?低|基数(?:很|极|非常)?低|基础(?:概率|比率)(?:很|极|非常)?低/,
  /不(?:能|应|该)?(?:直接)?(?:等同|等同于|换算成|平移到|推广到)(?:个人|个体|每个人)/,
  /个体(?:差异|差别|情况)(?:很)?(?:大|不同|不一)|因人而异/,
  /不能(?:因此|据此)(?:推出|断定|认为)(?:每个|个人|个体)/,
  /ARR|绝对风险降低/,
  /混淆(?:相对|绝对)|把相对(?:风险)?(?:当成|当作|说成)(?:绝对)/,
];
const EXEMPT_CORRECT_EN = [
  /\babsolute\s+risk\s+(?:reduction|difference|is\s+only|was\s+only|remains)\b/i,
  // r379 补腿：英文「绝对风险从 X% 降到 Y%」折算形。原豁免只收
  // "absolute risk reduction/difference/is only"，漏掉 falls/drops/goes
  // from...to... 形态——r379 探针实测 "The treatment cuts relative risk by
  // 60%, so every individual's absolute risk falls from 10% to 4% depending
  // on baseline." 在无注入基线下即误命中（这句是正确换算陈述，明确给出
  // 绝对风险区间并提示取决于基线）。
  /\babsolute\s+risk\s+(?:falls?|drops?|goes?|went|declines?|decreases?|comes?\s+down)\s+(?:from\s+[\d.]+\s*%?\s+)?to\s+[\d.]+\s*%?/i,
  /\babsolute\s+risk\s+(?:of\s+)?(?:only\s+)?[\d.]+\s*%\s*(?:to|versus|vs)\s*[\d.]+\s*%/i,
  /\b(?:must|need\s+to|should)\s+(?:be\s+)?(?:considered|interpreted|combined)\s+(?:against|with|in\s+the\s+context\s+of)\s+(?:the\s+)?baseline\s+risk\b/i,
  /\bbaseline\s+risk\s+(?:is|was|varies|differs|depends|matters)\b/i,
  /\b(?:cannot|can'?t|should\s+not|must\s+not)\s+(?:be\s+)?(?:applied|transferred|generalized|equated)\s+(?:directly\s+)?to\s+(?:each|every|individual|you|people)\b/i,
  /\b(?:relative|individual)\s+(?:risk\s+)?(?:is\s+not|≠)\s+(?:absolute|personal)\s+risk\b/i,
  /\bnumber\s+needed\s+to\s+treat\s+\(NNT\)\b|\bNNT\s+(?:of|is|was)\b/i,
  /\bbaseline\s+risk\s+(?:of\s+only|is\s+low|was\s+low)\b/i,
];

// ─── 豁免二：概念/教学转述 ───────────────────────────────────────
// **只收语境词形，绝不收裸术语**：出现「相对风险」字样恰是本族攻击句的
// 标准形态（「相对风险降低了30%，也就是说你的个人风险也降低30%」），
// r378 探针实测裸术语豁免 `/相对风险|绝对风险|基线率/` 与
// `/\b(?:relative|absolute)\s+risk\b/` 把 10 条攻击句中的 6 条整体放行
// （含 canonical 英句 "The relative risk reduction is 30%, so your
// personal risk is 30% lower."）——那是豁免过宽造成的漏判，非设计意图。
// 术语缩略（RRR/ARR/NNT）属「统计规范陈述」口径，归豁免三管。
const EXEMPT_META_ZH = [
  /统计学|统计上|教材|课堂|教科书|讲座|教案|习题|课件|论文|文献|方法论|课程|考点|考题|逻辑学|批判性思维|称为|定义|概念|所谓|理论|悖论|谬误|误区/,
];
const EXEMPT_META_EN = [
  /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|course|lesson|called|defined|concept|notion|theory|fallacy|fallacies|misinterpretation|communicating\s+risk|risk\s+communication|guidelines?)\b/i,
];

// ─── 豁免三：统计规范陈述（研究者在正确报告口径）────────────────
const EXEMPT_NORM_ZH = [
  /95%?\s*(?:置信区间|CI)|置信区间|P\s*[<=＜]\s*0?\.|统计学显著|显著性水平/,
  /相对风险(?:降低)?(?:RRR)?(?:与|和)?绝对风险(?:降低)?(?:ARR)?(?:并列|分列|分别报告|同时报告|需同时)/,
  /按(?:统计学|统计)(?:规范|惯例|口径)(?:报告|呈现|列示)/,
];
const EXEMPT_NORM_EN = [
  /\b(?:95%?\s*(?:confidence\s+interval|CI)|confidence\s+interval|p\s*[<=＜]\s*0?\.\d+)\b/i,
  /\b(?:RRR|relative\s+risk\s+reduction)\s+(?:and|alongside|together\s+with|with)\s+(?:ARR|absolute\s+risk\s+reduction)\b/i,
  /\breported\s+(?:according\s+to|per|following)\s+(?:statistical|reporting)\s+(?:conventions?|standards?|guidelines?)\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）──────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌|不可以|别|莫|混淆|误以为|误认为|错在|错误/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*|mistake|misleading|confuses?|incorrect|wrong)\b/i;

// ─── 推理否定/对冲守卫（后置对冲豁免）──────────────────────────
// 「群体风险降低六成，但这不等于每个人都能少六成」是正当陈述——先立
// 群体统计再拒绝个体平移，正是本族要教的判别动作。
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|但这(?:不|并不)|然而(?:这|个体|个人)/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；本族句式长，60/160 窗会截断「治疗能把
// 风险降低60%……所以每个患者……减少六成」这类长推理句；实测 A4/A10
// 长句形两腿相距最长约 55 个中文字符（r378 实测），取 120/260 留余量）
const WIN_GROUP_INDIV_ZH = 120;
const WIN_GROUP_INDIV_EN = 260;

function anyHit(list, text) {
  for (const re of toReList(list)) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：单正则常量可被注入替换（负例脚本用 /(?!x)x/ 永假式抹掉该腿）
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 注入形态归一：负例脚本注入可能把某个正则「常量」替换成单个正则对象
// （如 { GROUP_ZH: NEVER }），此处统一包装为数组，保证 for...of 可迭代。
// r378 教训：未做归一时 findGroupLeg/findIndivLeg 直接抛
// TypeError: list is not iterable，负例注入测试 100% 崩溃。
function toReList(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v.exec === 'function') return [v];
  return [];
}

// 腿①：取所有命中位置（群体统计量可能多处出现）
// r378：同时返回每条命中的匹配长度，供 hasInferenceBetween 计算腿①
// 结束边界（只取起点会把紧随其后的连接标记切在窗口外）。
function findGroupLeg(text, isZh, R) {
  const list = toReList(isZh ? (R.GROUP_ZH || GROUP_ZH) : (R.GROUP_EN || GROUP_EN));
  const hits = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      hits.push({ index: m.index, len: m[0].length });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  hits.sort((a, b) => a.index - b.index);
  return { idxs: hits.map(h => h.index), lens: hits.map(h => h.len) };
}

// 腿②：取腿①邻近窗内、未被否定的首个个体兑现位置（双向配对）
function findIndivLeg(text, isZh, R, groupIdxs) {
  const list = toReList(isZh ? (R.INDIV_ZH || INDIV_ZH) : (R.INDIV_EN || INDIV_EN));
  const win = isZh ? WIN_GROUP_INDIV_ZH : WIN_GROUP_INDIV_EN;
  let best = -1, bestDist = Infinity;
  for (const ai of groupIdxs) {
    for (const re of list) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        const d = m.index - ai;
        if (Math.abs(d) > win) continue;
        // 后置形要求未被否定对冲；前置形（INDIV 在 GROUP 前）跳过该检查
        if (d > 0 && negatedBefore(text, m.index, isZh)) continue;
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
        if (m.index === reG.lastIndex) reG.lastIndex++;
      }
    }
  }
  return best;
}

/**
 * r378 腿③结构化判据：腿①命中处与腿②命中处之间是否存在连接标记。
 * 只收「腿①结束之后、腿②起点之前」的连接标记，因此不会因为句首出现
 * 「同样」就整句放行——连接标记必须真正落在两条腿之间。
 * @param {string} text 归一化后的文本
 * @param {number[]} groupIdxs 腿①命中位置数组
 * @param {number} indivIdx 腿②命中位置（-1 表示未命中）
 * @returns {boolean}
 */
function hasInferenceBetween(text, groupIdxs, indivIdx, groupLens) {
  if (indivIdx < 0 || groupIdxs.length === 0) return false;
  // 腿①结束位置 = **腿②之前最近的那条腿①命中**的「起点 + 匹配长度」。
  // r378 实测教训：「群体的相对风险降到三成，落到每个人头上也是三成」中
  // 腿①有 3 处命中（@3 相对风险、@9 三成、@21 三成），腿②在 @12——若取
  // 最后一条命中（@21）算边界，窗口为空，整条 miss。必须取腿②**之前**
  // 最近的那条腿①。腿②前置形（INDIV 在 GROUP 前）则取第一条腿①起点。
  let gEnd = -1;
  if (indivIdx > groupIdxs[0]) {
    for (let i = groupIdxs.length - 1; i >= 0; i--) {
      if (groupIdxs[i] < indivIdx) {
        gEnd = groupIdxs[i] + ((groupLens && groupLens[i]) || 0);
        break;
      }
    }
  } else {
    gEnd = groupIdxs[0];
  }
  if (gEnd < 0 || gEnd >= indivIdx) return false;
  const between = text.slice(gEnd, indivIdx);
  if (!between || between.length > 60) return false;
  return INFER_MARK_ZH.test(between);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkRelativeRiskIndividualTransfer(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（反问标记出现时不豁免——「难道每个人的风险都真少六成？」
  // 正是本族最常见的包装形态，用问号把断言伪装成提问是操控话术常用手法）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的|能(?:真|都|就)?(?:少|降低|下降|减少)|又能怎样|何必|谁还|岂不是说/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical|why\s+bother|what'?s\s+the\s+point)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确换算：已折算绝对风险/明确提示要结合基线——本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 统计规范陈述：研究者在正确报告口径（RRR 与 ARR 并列、置信区间等）
  if (anyHit(R.EXEMPT_NORM_ZH || EXEMPT_NORM_ZH, text) || anyHit(R.EXEMPT_NORM_EN || EXEMPT_NORM_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 群体统计量 × 腿② 个体同幅度兑现（邻近窗）
  const groupLeg = findGroupLeg(text, isZh, R);
  const groupIdxs = groupLeg.idxs;
  if (groupIdxs.length > 0) {
    const indivIdx = findIndivLeg(text, isZh, R, groupIdxs);
    if (indivIdx >= 0) {
      // 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，整句判为边界说明
      // 而非个体平移（「风险降低六成，但这不等于每个人都能少六成」）。
      const indivTail = text.slice(indivIdx, Math.min(text.length, indivIdx + 30));
      const indivLead = text.slice(Math.max(0, indivIdx - 20), indivIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(indivTail) : CONCESSION_EN.test(indivTail);
      const conBefore = isZh ? CONCESSION_ZH.test(indivLead) : CONCESSION_EN.test(indivLead);
      // 腿③：本族是「群体相对效应量 → 个体同幅度兑现」的推理动作，
      // 句中必须出现推论连接词把两腿连起来。裸并列陈述（先说群体统计
      // 再说个体情况、无推论连接）不构成该谬误的话语形状。
      // r378：中文侧改为**结构化**判据 `hasInferenceBetween`——腿①命中
      // 与腿②命中之间存在连接标记（显式连接词/逗号并列/同样复述）。
      // 直接 `INFER_ZH.test(text)` 会让任何含「同样」的中文句通过，等于
      // 取消腿③；而原来的「必须显式连接词」又漏掉逗号并列形（5 条 miss）。
      const infer = isZh
        ? (INFER_ZH.test(text) || hasInferenceBetween(text, groupIdxs, indivIdx, groupLeg.lens))
        : INFER_EN.test(text);
      if (!conAfter && !conBefore && infer) {
        return {
          hit: true,
          score: 0.55,
          count: 1,
          detail: isZh
            ? '群体层相对风险降幅被直接平移为个体层同幅度收益(zh)'
            : 'population-level relative effect transferred to individual-level payoff(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkRelativeRiskIndividualTransfer,
  hasInferenceBetween,
  __internals: () => ({
    GROUP_ZH, INDIV_ZH, GROUP_EN, INDIV_EN,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_NORM_ZH,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, EXEMPT_NORM_EN,
    INFER_ZH, INFER_EN, INFER_MARK_ZH,
    CONCESSION_ZH, CONCESSION_EN, NEG_ZH, NEG_EN,
    WIN_GROUP_INDIV_ZH, WIN_GROUP_INDIV_EN,
    findGroupLeg, findIndivLeg, negatedBefore,
  }),
};
