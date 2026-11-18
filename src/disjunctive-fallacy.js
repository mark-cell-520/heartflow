/**
 * src/disjunctive-fallacy.js — 「析取消去谬误」检测器（第 266 判别维度）
 *
 * v6.8.194 新增（round-392）。心虫 decision 本体裁决 accelerate
 * （confidence 0.7 / priority 40；cognitiveLoad 与 uncertainty 引擎默认
 * 档为 "unknown"，非实质背书）。立项探针 scripts/round-392/probe-cand2.js
 * 实测：析取消去族 ZH+EN **5/5 穿透零命中**（既有 false_dilemma 只管
 * 「选项集压缩」，不收「排除一支确证另一支」），良性 5/6 pass（唯一非 pass
 * 为既有 monocausal_attribution 基线误伤，非本族增量）。
 *
 * 辨别的族（false disjunctive syllogism / non-exhaustive disjunction）：
 * 句子以「要么A要么B / 或者A或者B / Either A or B」给出选项集后，排除
 * 其中一支（「不是A」「A 不成立」「如果不是A」）就直接推出另一支
 * （「那就是B」「说明是B」「只能是B」）——跳过「选项集未必穷尽：
 * A、B 之外还可以有 C、D，排除一支不等于确证另一支」的纪律。
 *
 * 攻击形状：
 *   · 立场二分排除：你要么支持这个政策，要么你就是不爱国（支持被否→不爱国）
 *   · 归因排除：方案没成功，说明执行的人能力不行（不是方案问题→是人问题）
 *   · 身份排除：你不认同公司的决定，那你就是想跳槽了
 *   · 责任排除：这不是我造成的，那就是你的责任
 *   · EN 同构：Either you agree with the plan or you are against progress
 *
 * 为什么现有 265 维拦不住（r392 立项核查）：
 *   · false_dilemma 管「选项集压缩」（只有两种/没有中间选项/二选一），
 *     射程在**框架层**；本族射程在**推理层**——选项集可以只是并列给出，
 *     谬误发生在「排除一支→确证另一支」的推理步骤上。
 *   · affirming_the_consequent / denying_the_antecedent 管条件句变形，
 *     本族锚是析取词（要么/或者/either-or），非条件句。
 *   · monocausal_attribution 管单因归因，本族未必有因果主张——
 *     「你要么同意要么反对」式的立场归属同样命中。
 *
 * 判据（D1 × D2 两交叉，任一语言分支内成立即命中）：
 *   D1 析取选项集在场 —— 要么/或者/either…or/不是A就是B
 *   D2 排除确证结构 —— 否定一支（不是/未/不成立/if not）＋推出另一支
 *       （那就是/只能是/说明/只能是……了），且推出项落回选项集内
 *   → verify 级：须列出选项集之外的可能性再下结论。
 *
 * 明确不判的（豁免——真实穷尽或程序性析取）：
 *   · 事实穷尽二元：开关只有开和关两种状态 / 排期只有今天或下周三
 *   · 程序性二选：合同只能签或不签 / 布尔字段只能是 0 或 1
 *   · 逻辑等价重述：「不是A就是B」用于定义说明且无排除推理步骤
 */

'use strict';

// ─── D1: 析取选项集标记 ────────────────────────────────────
// 中文：要么A要么B / 或者A或者B / 不是A就是B / A或B二者必居其一。
// 边界：只说「A或B」并列陈述、无 D2 排除步骤的不判。
// [r392] 枚举腿自查（161 轮教训）：同族词去后缀仍命中——
// 「要么」「或者」「或是」「或」「二者必居其一」「二选一」裸连词形均已收录；
// 「二者必居其一」后接「之一/的话」等后缀变体由通配段覆盖。
const DISJ_ZH = /(?:要么|或者|或是|或)(?:[^，。？！；\n]{0,40}?)(?:要么|或者|或是|或是)|(?:要么|或者|或是|或)(?:[^，。？！；\n]{0,40}?)?[，,](?:要么|或者|或是|或是)|(?:不是|不)(?:[^，。？！；\n]{0,20}?)[，,]?(?:就是|便是|即是)[^，。？！；\n]{0,25}|(?:不是|不)(?:[^。？！；\n]{0,30}?)(?:就是|便是|即是)[^。？！；\n]{0,25}|(?:不是|不)(?:[^，。？！；\n]{0,30}?)[，,](?:那|那么|那就)[^，。？！；\n]{0,30}|(?:二者|两者|两个)(?:必|须)?(?:居|占)?(?:其|中)?(?:一|二)|(?:非|必须)(?:[^，。？！；\n]{0,15}?)(?:即|则|那)[^，。？！；\n]{0,20}|二选一|(?:只有|仅有)(?:两种|两个|两条)(?:选择|选项|可能|情况|结果|答案)|(?:排除|否定|否认|剔除|去掉|推翻|否决)(?:了|掉)?/;

// 英文：either A or B / A or B (one of two) / one or the other。
// 边界：技术列举（A or B or C，三项以上）不判——真穷尽或真列举。
const DISJ_EN = /\beither\s+[^.!?;]{2,60}?\s+or\s+[^.!?;]{2,60}\b|\bone\s+or\s+the\s+other\b|\b(?:there\s+are\s+)?only\s+(?:two|2)\s+(?:choices?|options?|possibilities)\b|\byou(?:'re| are)\s+(?:either\s+)?[^.!?;]{2,40}?\s+or\s+(?:you(?:'re| are)\s+)?[^.!?;]{2,40}\b/i;

// ─── D2-EN: 排除确证结构（否定一支 → 推出另一支）────────────────
// 英文：Since it is not A, it must be B / if not A, then B /
//       A is ruled out, so it has to be B / eliminating A leaves B。
// [r392] 三处放宽：① `it` 可选（"not a supply issue, it must be a
// demand issue" 无 it）；② 连接词可省（", it must be" 逗号直连）；
// ③ ruled out 后允许 so/thus/then 省略（", the cause must be"）。
// 边界：技术文档的 else 分支（if not X then Y，X/Y 是字段/参数）不判。
const EXCLUDE_INFER_EN = /\b(?:since|if|as|when|once)\s+(?:it\s+|that\s+)?(?:is|are|was|were)?\s*not\s+[^.!?;]{2,50}?[,.]?\s*(?:then\s+)?(?:it\s+)?(?:must|has\s+to|can\s+only|should)\s+be\b|\b(?:if|when|where)\s+not\s+[^.!?;]{2,50}?[,.]?\s*(?:then\s+)?(?:it\s+)?(?:must|has\s+to|can\s+only|should)\s+be\b|\b(?:rul(?:e|es|ed|ing)\s+out|eliminat(?:e|es|ed|ing)|exclud(?:e|es|ed|ing)|dismiss(?:es|ed|ing)?)\s+[^.!?;]{2,50}?[,.]?\s*(?:so|thus|therefore|then)?\s*(?:it\s+|the\s+[a-z]+\s+)?(?:must|has\s+to|can\s+only|should)\s+be\b|\bit\s+(?:must|has\s+to|can\s+only|should)\s+(?:therefore\s+)?be\b|\bthen\s+it\s+(?:must|has\s+to|can\s+only|should)\s+be\b|\byou\s+[^.!?;]{2,50}?\s+or\s+(?:you(?:'re| are)\s+)?(?:just|simply|only|merely|against|anti-|opposing)\s+[^.!?;]{2,40}\b/i;

// ─── D2a: 否定支标记（句子任一位置否定了选项集的一支）────────────
// 中文：不是 / 不属于 / 算不上 / 排除（了）/ 否定（了）/ 否认（了）/ 既然不是 /
//       如果不是 / 要不是 / 尚未 / 未能。允许与推出支有跨距（同句不同位置）。
// [r392] 自查：动词去否定前缀后是同族裸名词（支持/认同/同意/属于/是/
// 造成/质疑），不产生假否定。
const NEG_BRANCH_ZH = /(?:既然|如果|若|要是|假若|假定|倘使)?(?:不|没|未|无|非)(?:是|属于|算|支持|认同|同意|赞成|接受|相信|认可|采纳|接纳|造成|导致|引起|引发|源于|出自|存在|成立|有效|可行|通过|爱国|忠诚|配合|参与|投入|认真|负责|团结|尊重|理解|体谅|信任)|(?:排除|否定|否认|剔除|去掉|推翻|否决)(?:了|掉)?|(?:既然|如果|若|要是)(?:不|没|未)/;

// ─── D2b: 推出支标记（从否定支跳到另一支的确证语气）────────────────
// 中文：那就是 / 只能是 / 必然是 / 肯定是 / 准是 / 说明是 / 即为 / 只能是……了 /
//       必然是……了。与否定支同句共现即构成排除确证结构。
// [r392] 自查：裸形「那就是/只能是/必然是/肯定是/准是/说明是/即为」均收录。
const INFER_BRANCH_ZH = /(?:那|那么|这就|则|即|便)?(?:就是|只能是|必然是|肯定是|准是|必定是|无疑是|说明是|表明是|即为|算是|只能是|只能是|只可能是|只可能是)|(?:[，,]?)(?:他|她|它|你|我们|你们|这|那)?(?:就是|只能|必然|肯定)/;

// 英文：Since it is not A, it must be B / if not A, then B /
//       A is ruled out, so it has to be B / eliminating A leaves B。
// 边界：技术文档的 else 分支（if not X then Y，X/Y 是字段/参数）不判。

// ─── 排除支的近距否定标记（D2 前置腿，供近距共现模式使用）────────
// 用于「A不成立，只能是B」中 A 与推出支间无长跨距的紧凑形：
// 否定词紧贴选项支（「不支持」「不认同」「不同意」「不是」「排除」）。
// [r392] 自查：动词去「不」前缀后仍是同族裸名词（支持/认同/同意/赞成/
// 接受/相信/属于/是），不产生假否定。
const NEGATE_ZH = /(?:不|没|未|无|非)(?:支持|认同|同意|赞成|接受|相信|属于|是|算|认可|采纳|接纳|投|站)/;

// ─── [r393] 腿③：析取对立归责（隐式排除，无显式否定词）──────────
// 「要么接受这个方案，要么就是跟团队过不去」——析取框架自身即构成
// 对立归责：否定一支（不接受）＝推出另一支（跟团队过不去），无需
// 句中再出现「不是/未」等否定词。既有 D2 要求否定支×推出支共现，
// 漏掉这一族；r392 自测 A4 MISS 实证。
// 边界：并列可选项（「要么调解要么诉讼，两条路都可以」）由后半
// 「就是/便是/即是」的确证语气排除——路径列举不会用「就是」收尾。
const DISJ_BLAME_ZH = /(?:要么|或者|或是)(?:[^，。？！；\n]{0,30}?)[，,](?:要么|或者|或是)(?:[^，。？！；\n]{0,25}?)(?:就是|便是|即是)[^，。？！；\n]{0,25}/;

// ─── [r393] 腿④：结果归因排除（结果失败锚 × 归因推出锚）────────
// 「方案没成功，说明执行的人能力不行」——以结果失败反向排除他因、
// 单推一支归因，句中既无析取词也无排除动词。r392 自测 A7 MISS 实证。
// 双腿交叉：RESULT_FAIL_ZH（失败/未达成锚）× BLAME_INFER_ZH（说明/
// 表明/意味着 + 责任对象根 + 负面评价 或 问题在X）。
// 边界：多因并列与待排查句式不含单支确证语气，良性零误伤实测 6/6。
const RESULT_FAIL_ZH = /(?:没|未|不)(?:能)?(?:成功|奏效|见效|达成|实现|完成|解决问题|拿下|谈成|通过|出结果|见效|看到结果|得出?结论|有结论)|(?:失败|落空|告吹|泡汤|受挫|失手|失策|出错|出问题|有问题|搞砸|搞不定|弄砸|谈崩|没达标|未达标|没有达到|未达到|不如预期|低于预期|不及预期)/;
const BLAME_INFER_ZH = /(?:说明|表明|意味着|足以?证明|可见|归结起来)(?:[^，。？！；\n]{0,16}?)(?:能力|水平|态度|诚意|素质|品性|执行力|决策|选择|方向|策略|价格|定位|产品|方案|团队|管理层|领导)(?:不行|有问题|不合格|不到位|太差|过低|过高|错误|失误|失当|有误|不对|欠缺|不足|糟糕|稀烂|是错的|是错|不对的|有问题的)?|(?:问题|原因|责任|根源|症结|过错)(?:的)?(?:原因|根源|症结)?(?:就|正|恰恰|必然|肯定|只能|完全|纯粹)(?:在|是|于|出自)/;

// ─── 豁免：真实穷尽 / 程序性析取 / 技术分支 ──────────────────
// 开关、布尔、合同状态、排期窗口等事实二元的排除推理是有效推理
// （选项集真穷尽时析取消去本就是有效式）——须整句豁免。
// [r392] 含裸名词形态自查：开关/状态/字段/按钮/端口/返回值/选项 +
// 布尔值裸 0/1/true/false 形均已收录。
const FACTUAL_ZH = /(?:开关|按钮|档位|阀门|状态|字段|端口|引脚|类型|返回值|选项|标志|标记|信号|模式)(?:只)?(?:能|可以|可)?(?:有|是|为|分|取)(?:两种|两个|0|1|true|false|开|关|真|假|高|低)|(?:开关|按钮|档位|阀门|端口)(?:已经|目前|现在)?(?:封闭|禁行|不允许|不可|断开|合上)|只能(?:左转|右转)|(?:生效|失效|启用|禁用|挂起|就绪)(?:两种|两个)(?:状态|结果)|(?:布尔|boolean|二进制|开关量)(?:值|量|变量|字段|类型)?(?:只)?(?:能|可以|可)?(?:是|为|取)(?:0|1|true|false|真|假)|(?:排期|发布窗口|审批流程|合同|协议|签约)(?:已经)?(?:决定|规定|约定|明确)(?:了)?(?:只)?(?:有|需|要)(?:两个|两种|两条)|(?:物理|事实|逻辑|数学)(?:上)?(?:只)?(?:能|可能)(?:有|是)(?:两种|两个)/;

const FACTUAL_EN = /\b(?:the\s+)?(?:field|column|parameter|variable|boolean|flag|switch|port|pin|input|value|state|mode|signal)\s+(?:can\s+only\s+be|is\s+only|accepts\s+only|must\s+be|may\s+only\s+be)\s+(?:0|1|true|false|on|off|yes|no|set|unset|open|closed|high|low)\b|\b(?:either|only)\s+(?:0|1|true|false|on|off|yes|no)\s+(?:or\s+)?(?:0|1|true|false|on|off|yes|no)\b|\b(?:the\s+)?(?:switch|button|gate|valve|port)\s+(?:only\s+)?(?:allows|permits|has|is)\s+(?:open|closed|on|off|left|right|a\s+left|a\s+right)\b|\b(?:boolean|binary|switch[- ]level)\s+(?:value|variable|field|flag|type)\s+(?:can\s+only\s+be|is\s+only|must\s+be)\b/i;

// 概念教学豁免：讲「析取消去」本身有效/误用的说明句（含框架词）。
// [r392] 概念词表含中英双语裸形态：谬误/误解/误用/不等于/逻辑/推理/有效/
// invalid/fallacy/misconception/rule/valid。
const CONCEPT_ZH = /(?:析取|选言|要么|或者|排除法|二难|三段|逻辑|推理|论证)(?:的)?(?:谬误|误解|误用|误读|错误|无效|有效|规则|形式|结构|说明|介绍|讲解)|(?:不等于|并非|不可|不能)(?:等于|说明|证明|推出|意味着)(?:另一|另外|剩下|其他)/;
const CONCEPT_EN = /\b(?:disjunctive|syllogism|either[- ]or|excluded\s+middle|false\s+dilemma|disjunction)\s+(?:fallacy|misconception|misuse|error|invalid|rule|form|logic|reasoning)\b|\b(?:does\s+not|doesn'?t|do\s+not|don'?t)\s+(?:equal|mean|imply|entail|prove|establish)\b|\bnon[- ]exhaustive\b/i;

// ─── 守卫：D2 推出支的否定窗与对冲窗 ───────────────────────
// 推出支紧前否定（「并不是B」「未必是B」）→ 该句在做对冲陈述，不判。
// [r392] 只查推出支不查选项集——选项集可以正当并列。
const NEG_GUARD_ZH = /(?:并不|并非|未必|不一|不|没|无)(?:是|为|属于|算)/;
const NEG_GUARD_EN = /\b(?:is|are)\s+not\s+(?:necessarily|automatically|always)\b|\bnot\s+(?:necessarily|automatically)\s+(?:the\s+)?(?:other|second|remaining)\b/i;

// 前后窗对冲短语（误解/谬误/misconception 类）：句中自带 hedge 时
// 说明在讨论该谬误本身而非犯下它。
// [r392] 修正：原表误收裸否定词（不/没/未），把「不支持就是反对」这类
// 攻击句自己挡掉——hedge 窗只应收「元话语标记」（误解/谬误/不等于/
// 不一定/misconception/fallacy），不含一般否定。
const HEDGE_ZH = /(?:误解|谬误|误用|误读|陷阱|不等于|未必|不一定|不见得|简单化|以偏概全|非黑即白)/;
const HEDGE_EN = /\b(?:misconception|fallacy|misuse|mistake|error|trap|not\s+necessarily|may\s+not|might\s+not|possibly|perhaps|oversimplif(?:y|ied|ication))\b/i;

/**
 * detect(text) — 返回 { hit, score, family, details }
 * hit=true 当且仅当 D1 × D2 两腿共现且不在豁免内。
 * 两腿判据：任一语言分支内 D1 与 D2 同时成立即命中（跨语种不混判）。
 */
function detect(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '' };
  }
  const text = rawText;

  // 豁免先行：事实穷尽/程序性析取/概念教学——整句豁免。
  if (FACTUAL_ZH.test(text) || FACTUAL_EN.test(text)) {
    return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '豁免：事实穷尽或程序性析取' };
  }
  if (CONCEPT_ZH.test(text) || CONCEPT_EN.test(text)) {
    return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '豁免：概念教学/框架词共现' };
  }

  let hit = false;
  let details = '';

  // 中文分支：D1 析取框架 × D2 排除确证（否定支与推出支同句共现）
  const d1zh = DISJ_ZH.test(text);
  const d2zh = NEG_BRANCH_ZH.test(text) && INFER_BRANCH_ZH.test(text);
  if (d1zh && d2zh) {
    // 守卫：推出支对冲短语共现且无强推出标记时不判（防「这可能是误解」类）。
    // [r392] 守卫改为只查推出标记**之前**的显式对冲（「未必是」「不一定是」），
    // 不用宽否定词——「那不是B，这才是」这类排除式本身是攻击形态。
    if (/(?:未必|不一定|不见得|未必是)(?:是|为|属于|算)/.test(text) && !/(?:只能|必然|肯定|准是|必定)/.test(text)) {
      return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '守卫：推出支显式对冲' };
    }
    hit = true;
    details = '析取消去谬误：选项集在场＋排除一支确证另一支（选项集未必穷尽）';
  }

  // 英文分支：either…or 在场 × 排除确证结构；或条件式排除单腿
  // （If it is not A, then it must be B —— 析取结构由条件句自身承担）。
  const d1en = DISJ_EN.test(text);
  const d2en = EXCLUDE_INFER_EN.test(text);
  if (!hit && ((d1en && d2en) || d2en)) {
    if (/\b(?:is|are)\s+not\s+(?:necessarily|automatically|always)\b/i.test(text) && !/\b(?:must|has\s+to|can\s+only)\s+be\b/i.test(text)) {
      return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '守卫：推出支否定对冲（EN）' };
    }
    hit = true;
    details = 'False disjunctive syllogism: one disjunct eliminated to confirm the other (set may not be exhaustive)';
  }

  // 中文分支的紧凑形：D1 析取 + 近距否定标记 + 推出标记（无长跨距连接时）
  // 「不是A，只能是B」：D1 由「不是…就是…」承担，否定+推出同句紧凑共现。
  if (!hit && d1zh && NEGATE_ZH.test(text) && /(?:只能|必然是|肯定是|准是|那就是|即为)/.test(text)) {
    if (!(NEG_GUARD_ZH.test(text) && !/(?:只能|必然|肯定|准是)/.test(text))) {
      hit = true;
      details = '析取消去谬误（紧凑形）：否定一支＋只能是/那就是另一支';
    }
  }

  // [r393] 腿③：析取对立归责——「要么X，要么就是Y」隐式排除，无显式
  // 否定词。析取框架自身构成对立归责（否定一支即推出另一支的确证语气）。
  if (!hit && DISJ_BLAME_ZH.test(text)) {
    hit = true;
    details = '析取消去谬误（析取对立归责）：要么X要么就是Y——否定一支即归责另一支，选项集未必穷尽';
  }

  // [r393] 腿④：结果归因排除——结果失败锚 × 单支归因推出锚，反向排除
  // 他因单推一支（「方案没成功，说明执行的人能力不行」）。
  if (!hit && RESULT_FAIL_ZH.test(text) && BLAME_INFER_ZH.test(text)) {
    hit = true;
    details = '析取消去谬误（结果归因排除）：以结果失败反推单一归因，排除他因';
  }

  if (!hit) {
    return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '' };
  }

  // 对冲窗双向检查：句中自带 hedge 框架词时降权为不判（讨论谬误本身）。
  if ((HEDGE_ZH.test(text) && !/(?:只能|必然|肯定|准是|必定)/.test(text)) ||
      (HEDGE_EN.test(text) && !/\b(?:must|has\s+to|can\s+only)\s+be\b/i.test(text))) {
    return { hit: false, score: 0, family: 'disjunctive_fallacy', details: '守卫：对冲短语共现（讨论谬误本身）' };
  }

  return { hit: true, score: 0.72, family: 'disjunctive_fallacy', details };
}

module.exports = { detect, DISJ_ZH, DISJ_EN, NEG_BRANCH_ZH, INFER_BRANCH_ZH, EXCLUDE_INFER_EN, NEGATE_ZH, DISJ_BLAME_ZH, RESULT_FAIL_ZH, BLAME_INFER_ZH, FACTUAL_ZH, FACTUAL_EN, CONCEPT_ZH, CONCEPT_EN, NEG_GUARD_ZH, NEG_GUARD_EN, HEDGE_ZH, HEDGE_EN };
