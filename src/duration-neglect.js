/**
 * src/duration-neglect.js — 「持续时间忽视」检测器（r379 新建，第 265 个判别维度）
 *
 * [r379 立项] 三轮探针实证（scripts/round-379/，v6.8.191 pristine 基线）：
 *   · probe-r379-pool.js：12 候选同池定拨——A hedonic_adaptation 4/5、
 *     F duration_neglect 3/4、K burden_of_proof_shift 3/4、L survivorship 3/4
 *     （其余 8 族被既有维度大面积代拦，E hot_hand/G regression/I base_rate/
 *     C focusing/J necessary-sufficient 全部 0-1/4 穿透）；
 *   · probe-r379-scope.js：A/F/K 三段深探（各 10 攻击 + 8 良性）——
 *     A 穿透 7/10 但良性脏 3/8（存量 fallacy_of_relevance/completion_evidence/
 *     confidence 误伤边缘良性句），F 穿透 7/10 且良性脏 0/8，K 穿透 5/10
 *     且良性脏 2/8（appeal_to_ignorance/loyalty_test 误伤正确陈述）；
 *   · probe-r379-adjacency.js：F 的 10 条攻击句逐一过 detectPeakEndRule
 *     本体，仅 1/10 命中（「住院…出院那天不疼」被 r319 过程无所谓宣言族
 *     收走），其余 9 条穿透整个 gate=pass。
 * F 双干净 + 真零命中胜出。decision 本体裁决 accelerate（confidence 0.70；
 * cognitiveLoad/uncertainty 为默认 unknown 档，如实记录）。
 *
 * 外部来源：空返。r379 海外扫描（/tmp/hf-scout-1794927953.txt）：HN Algolia
 * 两 query 空返、Semantic Scholar 限流（返回 message/code 无 data）、
 * GitHub 5 仓库全为 LLM-based（whisper+ChatGPT / zero-shot fallacy
 * classifier / label variation），与纯规则引擎架构不兼容。判据为心虫
 * 自有纯规则实现（家族定义取自判断与决策科学的标准描述：duration
 * neglect——人在回溯评价一段体验时系统性地低估/无视其持续时长，
 * Fredrickson & Kahneman 1993 的「持续时间忽视」即峰终规则的核心推论；
 * 冷手实验、结肠镜实验为原型）。
 *
 * 辨别的族：「持续时间忽视」——把一段体验或痛苦的**持续时长**宣告为
 * 无关紧要（不重要/无所谓/不影响/不算数），使整体裁定只剩峰值或结局。
 * 它不是「只看峰终」（那是 peak_end_rule 子族的领地），而是更进一步
 * 的元陈述：**主动断言时长这个维度不该被纳入评价**。
 * 典型形状：时长短语（多久/多长时间/长短/时长/多长/duration）×
 * 无关宣告（不重要/无所谓/不影响/不算数/无关/不必在意）× 评价对象
 * （体验/记忆/满意度/评价/治疗/手术/过程）。
 *
 * 为什么现有维度拦不住（r379 归因）：
 *   · peak_end_rule（econ_reasoning_gate 子族）判「峰终片段代整体裁定」
 *     的三要素共现（峰终锚点 × 正面裁定 × 时长折让形容词族），本族是
 *     **时长被显式宣告无关**的元陈述，不需要峰终锚点也不需要正面裁定
 *     词——「过程长短无所谓」五个字即成立，而三腿结构一条都不齐；
 *   · r319 已收「过程再怎么折腾都无所谓/受的罪都会忘掉」的**痛苦过程
 *     宣告**族，但射程是「过程痛苦被忘却」，不是「时长维度被抹除」：
 *     「手术疼了多久不重要」里没有痛苦宣告，只有时长抹除；
 *   · outcome_bias 管以结果反推过程决策质量；本族不涉结果与过程的
 *     因果反推，判评价维度本身被作废；
 *   · duration_neglect 的教学定义句是 peak_end_rule 的 CONCEPT_ZH
 *     豁免词（「持续时间忽视」字样），但攻击句极少带学科名，豁免几乎
 *     不构成重叠负担。
 *
 * 判据（双腿链，任一语言侧成立即命中）：
 *   · 腿① DURATION_PHRASE：显式提到时长维度（多久/多长时间/多长/时长/
 *     长短/持续多久/duration/how long/length of time）；
 *   · 腿② IRRELEVANCE_DECL：宣告该维度无关（不重要/无所谓/不影响/不算
 *     数/无关/不起作用/不必在意/makes no difference/irrelevant/doesn't matter）；
 *   · 两腿在邻近窗内共现（ZH 24 / EN 90）即命中——本族不需要第三腿，
 *     因为「时长无关」本身就是完整的取样偏误宣告；单腿「多久」或单腿
 *     「不重要」在正常语句里过于常见，双腿共现是承重结构。
 *
 * 明确不判的（豁免）：
 *   · E1 概念讨论：持续时间忽视/时长忽视/duration neglect/峰终定律的
 *     教学、实验转述、机制说明句（这是知识不是谬误）；
 *   · E2 纠正性陈述：明确指出时长不应被忽视、时长有独立权重、按时长
 *     加权、时长同样重要的均衡评价句；
 *   · E3 否定守卫：宣告词前出现否定前缀（不能/不应/并非/不重要是不对
 *     的/时长不是不重要）——「时长并非不重要」是正确陈述；
 *   · E4 非评价语境的「多久」：问路（还有多久到）、等待（还要多久）、
 *     排期（工期多久）等纯信息询问，无宣告词共现，双腿链天然排除。
 *
 * [实现纪律] 所有正则源串一律走 String.raw：单反竹杠写进普通单引号字符串
 * （'\\s' → 's'、'\\b' → 退格）会让磁盘文本「看起来正确」而运行时值全错。
 * String.raw 让磁盘字节与运行时 source 逐字符一致（exclusive-trust r582
 * 教训）。
 */

'use strict';

// ─── 腿①: 时长短语（显式提到时长维度）────────────────────────────
// [r379 裸名词纪律] 161 轮教训：同族词去掉后缀后必须仍命中。本腿同时收
// 带宾式（持续多久/多长时间）与裸名词（时长/长短/多久），使「过程长短
// 无所谓」「时长不影响」这类无后缀裸形态成立。
const DURATION_PHRASE_ZH = [
  String.raw`(?:持续|煎熬|难受|疼痛|苦|罪|折磨|过程|中间|住院|手术|治疗|疗程|等待|排队|旅程|假期|军训|病程|恢复|康复)(?:了)?(?:多久|多长时间|多长|多少时间|几天|几小时|几个月|几年)`,
  String.raw`(?:时长|长短|持续时间|时间长短|过程长短|疗程长短|住院时长|手术时长|痛苦时长|煎熬时长)(?:的)?(?:长短|多少)?`,
  String.raw`(?:多久|多长时间|多长|多少时间)`,
  String.raw`(?:长了|短了|长一点|短一点)(?:的)?(?:过程|时间|经历|体验|治疗|住院|手术|病程|煎熬|折磨)`,
  String.raw`(?:久了|那么久|那么长时间|那么长|这么久|这么长时间|这么长)`,
  // [r380 续] 「熬了/等了/疼了 + N 个时段」动词开头时长短语（「熬了十个小时」
  // 「等了三天」——161 轮裸名词纪律：动词形态同样必须命中）。
  String.raw`(?:熬|等|疼|痛|苦|折磨|煎熬|拖|持续|治疗|住院|手术|恢复|排队|禁)(?:了)?(?:多久|多长时间|多长|多少时间|几天|几小时|几个月|几年|半个|半天|一晚上|一宿)`,
  // [r379 漏判修复] 裸「N 个 + 时段量词」时长短语：「两个多小时」「那十五天」
  // 「几个小时」——161 轮裸名词纪律：同族词去掉修饰后必须仍命中。
  String.raw`(?:前面|开头|中间|过程|那段|这|那|前|后)?\s?(?:两|三|四|五|六|七|八|九|十|几|半|\d+)\s?(?:个)?(?:多)?(?:小时|分钟|秒|天|日|周|星期|月|年|夜|晚)(?:的|之)?(?:时间|时长|过程|日子|煎熬|痛苦|难受|折磨)?`,
];

const DURATION_PHRASE_EN = [
  String.raw`\bhow\s+long\s+(?:the\s+)?(?:pain|surgery|recovery|treatment|procedure|illness|discomfort|agony|suffering|ordeal|stay|wait|process|journey|trip|course)\s+(?:lasted|lasts|takes|took|goes\s+on|went\s+on)\b`,
  String.raw`\bthe\s+(?:duration|length)\s+of\s+(?:the\s+)?(?:pain|surgery|recovery|treatment|procedure|illness|discomfort|suffering|ordeal|stay|wait|process|journey|trip|course|experience|movie|film|game|match)\b`,
  String.raw`\b(?:how\s+long|the\s+length\s+of\s+time|the\s+time\s+it\s+(?:took|lasted|takes|lasts))\b`,
  String.raw`\b(?:lasted|lasting|lasting\s+for)\s+(?:one|two|three|four|five|ten|fifteen|twenty|thirty|a\s+few|\d+)\s+(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\b`,
  // [r379 漏判修复] 裸「(for) N units」时长短语：for two hours / for fifteen
  // days / for weeks——与中文裸形态对位。
  String.raw`\bfor\s+(?:one|two|three|four|five|ten|fifteen|twenty|thirty|a\s+few|several|\d+)\s+(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\b`,
  // [r379 漏判修复] 裸「the length/duration of the X」名词短语（无动词）：
  // the length of the hospital stay / the duration of the surgery。
  String.raw`\bthe\s+(?:length|duration|amount\s+of\s+time)\s+of\s+(?:the\s+|this\s+|that\s+|a\s+|any\s+|each\s+)?(?:pain|surgery|recovery|treatment|procedure|illness|discomfort|suffering|ordeal|stay|wait|process|journey|trip|course|experience|movie|film|game|match|hospital|hospitalization|hospital\s+stay|rehab|therapy|consultation|meeting|delay|queue|inpatient|outpatient|clinic)\b`,
];

// ─── 腿②: 无关宣告（该维度被宣告为不应纳入评价）───────────────────
const IRRELEVANCE_DECL_ZH = [
  String.raw`(?:不)?(?:重要|要緊|要紧)`,
  String.raw`无所谓`,
  String.raw`(?:不)?(?:算数|算|算事|算个事|值得一提|值得一提|值得一提)`,
  String.raw`无关(?:紧要|痛痒)?`,
  String.raw`不起作用`,
  String.raw`不影响`,
  String.raw`不决定`,
  String.raw`不能(?:决定|左右|改变)`,
  String.raw`不必(?:在意|考虑|在意|计较|管|关注)`,
  String.raw`无须(?:在意|考虑|计较|管)`,
  String.raw`不用(?:在意|考虑|计较|管|关心)`,
  String.raw`不重要|无所谓|不影响|不算数`,
  // [r380 续] 「跟/与/和…没关系」「不起任何作用」无关宣告口语形态
  // （「时长跟伤害没关系」——与「无关」同位，非存量同族样本扩容）。
  String.raw`(?:跟|与|和|同)[^。，！？；\n]{0,8}(?:没|不)(?:关系|相干|关联)`,
  String.raw`不(?:起|产生)(?:任何)?(?:作用|影响|效果)`,
];

const IRRELEVANCE_DECL_EN = [
  String.raw`\b(?:makes?|made|making)\s+(?:no|not\s+much|little|zero)\s+(?:difference|difference\s+at\s+all)\b`,
  String.raw`\bis\s+(?:irrelevant|immaterial|beside\s+the\s+point|neither\s+here\s+nor\s+there)\b`,
  String.raw`\b(?:does\s+not|doesn'?t|didn'?t|don'?t|didn'?t)\s+(?:matter|count|carry\s+any\s+weight|make\s+a\s+difference)\b`,
  String.raw`\b(?:is\s+)?(?:not|of\s+no)\s+(?:importance|consequence|relevance)\b`,
  String.raw`\b(?:regardless\s+of|irrespective\s+of|no\s+matter)\s+(?:how\s+long|the\s+duration|the\s+length)\b`,
  String.raw`\bonly\s+(?:the\s+)?(?:end|ending|finale|outcome|result|peak)\s+(?:matters?|counts?)\b`,
  String.raw`\b(?:makes?|made)\s+(?:no\s+)?difference\s+(?:to\s+)?(?:how|what)\b`,
];

// ─── 邻近窗 ───────────────────────────────────────────────────────
const PAIR_ZH = 24;
const PAIR_EN = 90;

// ─── 豁免 E1: 概念讨论（教学/实验转述/机制说明）────────────────────
const CONCEPT_ZH = /(?:持续(?:时间)?忽视|时长忽视|忽视(?:持续|时长|过程时长)|峰终(?:定律|法则|规则)|卡尼曼|卡恩曼|弗雷德里克|体验自我|记忆自我|回溯评价|冷手实验|结肠镜实验|心理学实验|实验(?:发现|表明|显示|证明)|受试者|研究(?:发现|表明|显示)|实验(?:数据|结果|对象))/;
const CONCEPT_EN = /\bduration\s+neglect\b|\bpeak[- ]end\b|\bduration\s+(?:is\s+)?(?:ignored|neglected|overlooked|underweighted)\b|\bKahneman\b|\bFredrickson\b|\bremembering\s+self\b|\bexperiencing\s+self\b|\bcolonoscopy\b|\bcold\s+hand(?:ed)?\s+(?:experiment|test)\b|\b(?:participants|subjects)\b|\b(?:experiment|study)\s+(?:found|showed|shows|suggests?|demonstrated)\b/i;

// ─── 豁免 E2: 纠正性陈述（时长有独立权重/不应被忽视）────────────────
const CORRECTIVE_ZH = /(?:时长(?:同样|也|本身)?(?:重要|有(?:独立)?(?:权重|影响|意义|价值)|不能(?:忽视|忽略)|不应(?:被)?(?:忽视|忽略)|并非不重要|不是不重要|不容忽视)|持续(?:时间)?(?:同样|也)?(?:重要|有影响|不能忽视|不应忽视|并非无关|不是无关)|不能(?:只|单)(?:凭|看|以)(?:峰值|结局|结尾|最后)|(?:时长|持续时间|过程长短)(?:不能|不该|不应|无法|不足以)(?:被)?(?:忽视|忽略|抹杀|一笔带过|不计)|评价(?:应|要|需要)(?:看|考量|纳入|兼顾)(?:全程|时长|整个|持续)|(?:按|依据|依照)(?:时长|持续时间|时间)(?:加权|计算|衡量)|时长(?:也|同样)是(?:评价|评估|考量)(?:的)?(?:一部分|维度|因素)|(?:疼痛|痛苦|煎熬|不适)(?:的)?(?:持续)?(?:时长|时间|长短)(?:同样|也)(?:重要|有影响))/;
const CORRECTIVE_EN = /\b(?:duration|length|how\s+long)\s+(?:also\s+)?(?:matters?|counts?|is\s+(?:important|relevant|significant)|carries\s+(?:independent\s+)?weight|should\s+(?:not\s+be|never\s+be)\s+(?:ignored|neglected|overlooked))\b|\b(?:not|never)\s+(?:just|only|merely)\s+(?:the\s+)?(?:peak|end|ending|finale|outcome|result)\b|\b(?:weigh(?:ed|ing)?|consider(?:ed|ing)?|incorporat(?:e|ed|ing))\s+(?:the\s+)?(?:full|whole|entire)\s+(?:duration|length|timeline)\b|\bduration\s+(?:is\s+)?(?:a\s+)?(?:key|relevant|important)\s+(?:factor|dimension|consideration)\b/i;

// ─── 豁免 E3: 宣告词前的否定守卫（「时长并非不重要」是正确陈述）─────
// 双腿共现时检查宣告词匹配串内部与其紧前文。
const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并不|并没|而非|而不是|绝非|一点都|压根|根本|丝毫|完全没|压根没)/;
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没|绝非|而非|而不是|一点都|压根|根本|丝毫|完全没|压根没|谁说|鬼才|少来)[^。，！？；\n]{0,6}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非|莫|甭)$/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bnot\s+irrelevant\b|\bnot\s+unimportant\b|\bis\s+not\s+irrelevant\b|\bdoes\s+matter\b|\bmatters\b|\bcounts\b|\bis\s+important\b|\bshould\s+not\s+be\s+ignored\b|\bmust\s+not\s+be\s+ignored\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// ─── 工具 ─────────────────────────────────────────────────────────
// [r379] 腿表以 String.raw 源串书写（防磁盘字面量与运行时值分叉），
// 此处统一编译为 RegExp 再进 allMatches。
function toRegExp(list) {
  return list.map(x => (x instanceof RegExp ? x : new RegExp(x, 'i')));
}

// [r379] 自身即否定形态的宣告词——「该维度无关」的完整表达，否定守卫不适用。
const SELF_NEG_ZH = /^(?:不|无|没|非|莫)/;
const SELF_NEG_EN = /^(?:no|not|never|nothing|zero|little)/i;

// [r379] 并列保留词：宣告词出现在「也/同样/同时」之后，说明该维度仍被承认为
// 评价维度（均衡陈述），不构成「被宣告无关」。「再也 X 也无所谓」的「再也」
// 是语气词不是并列保留，显式排除。
const KEEP_WEIGHT_ZH = /(?<!再也|也不会|再也不|更)(?:同样|也|还是|并且|而且|同时|依然|仍然|依旧|固然|当然|自然|确实|真的|实在|分明|显然|众所周知|不可否认|没错|亦是)[^。，！？；\n]{0,10}$/;
const KEEP_WEIGHT_EN = /\b(?:also|too|as\s+well|equally|likewise|similarly|still|nonetheless|nevertheless|of\s+course|certainly|indeed|sure|granted|while|whereas)\s+(?:\w+\s+){0,6}$/i;

const DURATION_PHRASE_ZH_R = toRegExp(DURATION_PHRASE_ZH);
const DURATION_PHRASE_EN_R = toRegExp(DURATION_PHRASE_EN);
const IRRELEVANCE_DECL_ZH_R = toRegExp(IRRELEVANCE_DECL_ZH);
const IRRELEVANCE_DECL_EN_R = toRegExp(IRRELEVANCE_DECL_EN);

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

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (!useNeg) { m.push(x); continue; }
    // [r379 否定守卫修正] 宣告词本身是否定形态的（不影响/不算/不起作用/
    // 无所谓/不重要）不适用 NEG_INSIDE 检查——它们不是在「否定一个正向词」，
    // 其自身就是「该维度无关」的完整宣告。NEG_INSIDE 只对正向宣告词
    // （重要/算数/算/起作用/决定/在意）生效，用于排除「并非重要」「不算
    // 重要」这类**否定正确陈述**。
    const selfNeg = SELF_NEG_ZH.test(x.raw) || SELF_NEG_EN.test(x.raw);
    if (!selfNeg && (NEG_INSIDE_ZH.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) continue;
    const before = text.slice(Math.max(0, x.idx - 10), x.idx);
    const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(before);
    // [r379] 强调词豁免：「根本/压根/完全/绝对/丝毫 不算数」里的「不」是
    // 宣告词自身的第一字（SELF_NEG 已放行），不是否定前缀。IMMEDIATE_NEG
    // 只在宣告词**以正向字开头**时才应触发否定守卫。
    if (!ababForm && !/别提多?$/.test(before) && !selfNeg && (NEG_BEFORE_ZH.test(before) || IMMEDIATE_NEG_ZH.test(before))) continue;
    const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
    if (NEG_BEFORE_EN.test(beforeEn)) continue;
    // [r379 良性修复] 「X 重要，但 Y 同样/也重要」的均衡句式：宣告词之前出现
    // 「同样/也/还是/并且/而且/同时」等并列保留词，说明该维度被承认为重要，
    // 不是被宣告无关（如「结局当然重要，但过程持续了多久也是评价的一部分」）。
    // 注意「再也 X 也无所谓」的「再也」是语气词——保留词前 6 字内出现
    // 「再也」则不视为均衡保留。
    const keepBefore = text.slice(Math.max(0, x.idx - 24), x.idx);
    // 「X 再 Y 也无所谓」的「再也/再…也」是语气词结构（再也/再难受也无
    // 所谓），不是并列保留。从宣告词往前取一小段（无句读），若其中出现
    // 「再也」或「再…也」的语气词结构，则不视为均衡保留。
    const clause = text.slice(Math.max(0, x.idx - 14), x.idx).replace(/^[^。，！？；]*[。，！？；]/, '');
    const zaiye = /(?:再也|再也不|也不会|更不能|都不能|再[^。，！？；\n]{0,4}也)/.test(clause);
    if (!zaiye && (KEEP_WEIGHT_ZH.test(keepBefore) || KEEP_WEIGHT_EN.test(text.slice(Math.max(0, x.idx - 45), x.idx)))) continue;
    m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

/**
 * 持续时间忽视签名：时长短语 × 无关宣告 双腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {Array<{lang, dur, decl}>} 命中签名列表
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      dur: (R.DURATION_PHRASE_ZH || DURATION_PHRASE_ZH),
      decl: (R.IRRELEVANCE_DECL_ZH || IRRELEVANCE_DECL_ZH),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      dur: (R.DURATION_PHRASE_EN || DURATION_PHRASE_EN),
      decl: (R.IRRELEVANCE_DECL_EN || IRRELEVANCE_DECL_EN),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const durM = collect(text, toRegExp(L.dur), true);
    const declM = collect(text, toRegExp(L.decl), true);
    if (durM.length === 0 || declM.length === 0) continue;
    for (const d of durM) {
      const c = declM.find(x => dist(x, d) <= L.win);
      if (!c) continue;
      sigs.push({ lang: L.lang, dur: d.raw, decl: c.raw });
    }
  }
  return sigs;
}

/**
 * 持续时间忽视维度入口。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例注入（同 peak_end_rule 的 R 约定）
 * @returns {object} 维度结果对象（无命中返回 {hit:false, score:0}）
 */
function detectDurationNeglect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 E1：概念讨论（持续时间忽视/峰终定律的教学与实验转述）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 E2：纠正性陈述（时长有独立权重/不应被忽视）
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.60;
  return {
    hit: true,
    dimension: 'duration_neglect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '时长「' + x.dur + '」× 无关宣告「' + x.decl + '」'
      : 'duration "' + x.dur + '" x irrelevance declaration "' + x.decl + '"')),
    details: s.lang === 'zh'
      ? '持续时间忽视(' + sigs.length + '处: 把体验/痛苦的持续时长「' + s.dur + '」宣告为「' + s.decl + '」，时长维度被整体移出评价，只剩峰值或结局在决定结论)(zh)'
      : 'duration neglect(' + sigs.length + 'x: the duration "' + s.dur + '" is declared "' + s.decl + '", removing the time dimension from the evaluation so only the peak or ending decides)(en)',
    guidance: '持续时间忽视指人在回溯评价一段体验时系统性地低估或无视其持续时长，让峰值时刻与结尾单独决定整体结论——手术疼了多久不重要只要最后不疼就算成功 / 过程长短无所谓结局好就算好经历 / 住院难受多久都不要紧出院不疼这次就算顺利 / whether the discomfort lasted a minute or an hour makes no difference only the ending counts / how long the recovery took is irrelevant to how good it was。请补上论证：时长是体验评价的独立维度，一段持续数月的中度痛苦与持续一分钟的同类痛苦不等价，峰值和结尾不能单独代表全程；如果整体结论确实成立，给出贯穿全程的依据（多数时段的表现、按时长加权的满意度、症状持续时长的客观记录），而不是宣告时长无关。同时考量时长与整体分布、按时间加权、明确指出持续时间忽视机制本身，都是正当做法；若这段话只是转述他人的峰终或时长实验，核实其评价是否真的作废了时长维度再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'duration-neglect', 'cognitive-bias', 'judgment-and-decision-making', 'peak-end-rule'],
  };
}

module.exports = {
  detectDurationNeglect,
  __internals: () => ({
    DURATION_PHRASE_ZH, DURATION_PHRASE_EN,
    IRRELEVANCE_DECL_ZH, IRRELEVANCE_DECL_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};