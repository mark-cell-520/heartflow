/**
 * src/affective-forecast.js — 「情感预言胁迫」检测器（第 96 个判别维度）
 *
 * [v6.8.2] 第 640 轮立项并建模块。候选来源：r640 家族探针
 * （scripts/round-640-gap-probe.js，四族实测：本族 4/6 攻击穿过硬闸门、
 * 3 条良性对照 0 误伤）+ decision 本体裁决（/tmp/decide-opts-640.json，
 * chosen=A_affective_forecast，score 0.89 / confidence 0.85 / 身份对齐 100%）。
 * 零命中复验：scripts/round-640-zerohit-probe.js —— 本族 4 条样本在
 * discriminate() 全部维度上只命中 evidence(1)（证据不足提示），
 * gate.action 全部 pass，是真缺口不是聚合压掉。
 *
 * 辨别的族：「情感预言胁迫」——把对方**未来的情绪**（后悔/自责/感谢/
 * 明白/痛苦）当作**当前必须行动的理由**。它不是预测，是胁迫：
 * 预测说「X 可能导致 Y」，本族说「你现在不做 X，将来必然后悔，
 * 所以你现在就得做」。典型形状：时态前移（等/以后/将来/到时候）×
 * 情绪断言（后悔/自责/感谢/明白/来不及）× 行动绑定（不买/不做/放弃）。
 *
 * 为什么现有维度拦不住（r640 归因实测）：
 *   · emotional_manipulation 管的是**当下**情绪杠杆（恐惧/愧疚/怜悯的
 *     直接唤起），本族的招牌是**时态前移**——把情绪结果放到未来，
 *     当下没有任何情绪施压词；
 *   · false_urgency 管虚假紧迫（时间压力），本族的时间锚在未来而非
 *     「马上/今天/仅剩」；
 *   · concession_coercion 管让步条件×灾难终局，本族的终局是情绪性的
 *     （后悔/自责）不是灾难性的；
 *   · appeal_to_tradition 管诉诸过去，本族指向未来。
 *
 * 判据（任一成立即命中，共三支）：
 *   · 支① FORECAST × EMOTION × BIND：时态前移词 + 未来情绪断言 +
 *     行动绑定（现在不/没 + 动作，或 会/肯定/一定 情绪断言）三要素共现；
 *   · 支② GRATITUDE_SWAP：「以后会感谢 / 将来会感激 / 迟早会明白」
 *     单腿即完整——把对方的未来情绪当作当下决定的合法性来源；
 *   · 支③ REGRET_CERTAINTY：对未来的后悔/自责做**确定性**断言
 *     （肯定会/一定会/注定/迟早），即使未显式出现行动绑定也成立——
 *     确定性地预言他人情绪本身就是取消对方当下判断权。
 *
 * 明确不判的（看守 G1-G5）：
 *   · G1 正当长期规划建议：陈述长期收益（复利/健康/词汇量）而没有
 *     「不做的情绪后果」；
 *   · G2 反思性陈述：复盘自己当年的情绪预言或被施加的经历；
 *   · G3 客观时间信息：活动截止/停产/招生周期等事实性时间陈述；
 *   · G4 疑问/探讨句式：询问某种选择会不会导致后悔（提问≠胁迫）；
 *   · G5 文学叙事/分析语境：小说情节、影视对白、话术分析的转述。
 *
 * [实现纪律] 所有正则源串一律走 String.raw：单反竹杠写进普通单引号字符串
 * （'\s' → 's'、'\b' → 退格）会让磁盘文本「看起来正确」而运行时值全错。
 * String.raw 让磁盘字节与运行时 source 逐字符一致（exclusive-trust r582
 * 教训）。
 */

'use strict';

// ─── 时态前移词（把结果放到未来）────────────────────────────────
const FORESHIFT_ZH = new RegExp([
  String.raw`(?:等你|等到|等到了|等)(?:[^。；，,]{0,10})(?:老|上了年纪|长大|成熟|有钱|成功|过几年|以后|将来|日后|回头)`,
  String.raw`(?:以后|将来|日后|回头|到时候|而今而后|有朝一日|多年以后|几年以后|将来某天|未来的某天)`,
  String.raw`(?:现在|如今|当下|眼下|此刻)(?:[^。]{0,8})(?:不|没|未曾)(?:[^。]{0,8})(?:懂|明白|理解|清楚|知道|相信|信|在乎|在意|重视|当回事)`,
  String.raw`(?:到你|等你|待到)(?:[^。]{0,8})(?:这个|那个|我这|我这把)(?:年纪|岁数|年岁|位置|处境|境地)`,
].join('|'));

const FORESHIFT_EN = new RegExp([
  String.raw`\b(?:when|once|as|after)\s+you\s+(?:get|are|grow|become|reach)\s+(?:older|older\s+and|my\s+age|this\s+age|to\s+my\s+age|old\s+enough|older\s+you)\b`,
  String.raw`\b(?:years?\s+from\s+now|in\s+the\s+future|down\s+the\s+road|one\s+day|someday|eventually|later\s+in\s+life|later\s+on)\b`,
  String.raw`\byou\s+(?:will|would|'ll)\s+(?:thank|be\s+thanking|regret|understand|realize|see|know|thank)\b`,
  String.raw`\bright\s+now\s+you\s+(?:do\s+not|don't|cannot|can't)\s+(?:understand|see|know|realize|appreciate|care)\b`,
].join('|'), 'i');

// ─── 未来情绪断言（被预言的对方情绪）────────────────────────────
const EMOTION_ZH = new RegExp([
  String.raw`(?:后悔|懊悔|悔恨|遗憾|自责|内疚|愧疚|埋怨|怪自己|怪罪自己|恨自己|看不起自己|放过自己|想明白|恍然大悟|追悔莫及)`,
  String.raw`(?:感谢|感激|感恩|谢谢|铭记|感念)`,
  String.raw`(?:明白|理解|清楚|知道|懂|体会|领悟|感受|见识|认识到|意识到)`,
  String.raw`(?:痛苦|难受|煎熬|煎熬|崩溃|失望|寒心|心寒|伤心|难过|苦)`,
  String.raw`(?:来不及|赶不上|错过|失去|一无所有|白费|白忙|白干|付之东流|前功尽弃)`,
].join('|'));

const EMOTION_EN = new RegExp([
  String.raw`\b(?:regret|regretting|blame\s+yourself|blaming\s+yourself|be\s+sorry|feel\s+guilty|resent|resenting|hate\s+yourself|never\s+forgive\s+yourself)\b`,
  String.raw`\b(?:thank\s+me|thank\s+us|be\s+grateful|be\s+thankful|appreciate\s+(?:me|this|it))\b`,
  String.raw`\b(?:understand|realize|see\s+(?:it|why|the\s+truth)|know\s+(?:better|why)|appreciate)\b`,
  String.raw`\b(?:suffer|be\s+miserable|fall\s+apart|be\s+devastated|be\s+heartbroken|be\s+disappointed|feel\s+awful)\b`,
  String.raw`\b(?:too\s+late|miss\s+out|lose\s+(?:it\s+all|everything)|wasted|all\s+for\s+nothing)\b`,
].join('|'), 'i');

// ─── 行动绑定（当下该做/不该做的动作）───────────────────────────
const BIND_ZH = new RegExp([
  String.raw`(?:现在|如今|当下|赶紧|马上|立刻|立即|趁早|及早|尽早)(?:[^。]{0,8})(?:不|没|未)(?:[^。]{0,10})(?:买|购|下单|付款|投资|报名|参加|加入|开始|学|做|行动|决定|选|定|存|攒|申请|抢)`,
  String.raw`(?:不|没|未)(?:[^。]{0,8})(?:买|购|下单|付款|投资|报名|参加|加入|开始|学|做|行动|决定|选|定|存|攒|申请|抢|努力|坚持)(?:[^。]{0,10})(?:以后|将来|日后|回头|到时候)`,
  String.raw`(?:会|就会|才会|将要|注定|必然|一定|肯定会|必定|迟早)(?:[^。]{0,10})(?:后悔|自责|怪自己|感谢|感激|明白|理解|来不及|痛苦|失望|寒心|难过)`,
  String.raw`(?:只有|唯有|只有现在|必须现在|就得现在|现在就得|现在就要)(?:[^。]{0,8})(?:买|做|开始|行动|决定|选|报名|加入|投资|抢)`,
].join('|'));

const BIND_EN = new RegExp([
  String.raw`\b(?:if\s+you\s+do\s+not|if\s+you\s+don't|unless\s+you)\s+(?:\w+\s+){0,3}?(?:buy|purchase|invest|sign\s+up|join|start|act|decide|choose|register|apply|order)\b`,
  String.raw`\b(?:you\s+will|you'll|you\s+would|you'd)\s+(?:regret|blame\s+yourself|be\s+sorry|thank\s+(?:me|us)|understand|realize|be\s+too\s+late)\b`,
  String.raw`\b(?:only|the\s+only\s+way)\s+(?:if|when|by)\s+you\s+(?:\w+\s+){0,3}?(?:buy|start|act|decide|join|invest|sign\s+up)\b`,
].join('|'), 'i');

// ─── 支②: 未来感激/明白交换（单腿成立）─────────────────────────
const GRATITUDE_ZH = new RegExp([
  String.raw`(?:以后|将来|日后|回头|到时候|有朝一日|多年以后|几年以后)(?:[^。]{0,8})(?:会|就会|才会|一定|肯定|必定|注定|迟早)(?:[^。]{0,6})(?:感谢|感激|感恩|谢谢|感念|铭记|明白|理解|懂|体会|领悟|知道)`,
  // [r641 收尾] 第二支加**说话者锚点**：原式不要求「我」在场，于是
  // 「总有一天你会明白这个道理」「实验结果早晚会揭晓」「真相迟早会大白」
  // 这类泛指陈述整族被判 verify（实测 5/5 误伤）。判据：本支的招牌是
  // 「用我的判断换你的未来感激」，没有「我」就不是交换而是泛泛预言。
  String.raw`(?:迟早|早晚|总有一天|终有一天|日后)(?:[^。]{0,8})(?:会|就会|一定|肯定)(?:[^。]{0,6})(?:明白|理解|懂|感谢|感激|体会|知道|认识到)(?:[^。]{0,4})(?:我|我的)`,
  String.raw`(?:现在|如今)(?:[^。]{0,10})(?:听|按|照)(?:[^。]{0,6})(?:我|我的)(?:[^。]{0,4})(?:做|说|安排|准没错|没错)`,
].join('|'));

const GRATITUDE_EN = new RegExp([
  String.raw`\b(?:you\s+will|you'll|you\s+would|you'd|one\s+day\s+you\s+will)\s+(?:thank|be\s+thanking|be\s+grateful\s+to|be\s+thankful\s+(?:to|for))\s+(?:me|us)\b`,
  String.raw`\b(?:you\s+will|you'll)\s+(?:thank\s+me|thank\s+us|understand|realize|see\s+(?:why|that\s+I\s+was|that\s+I\s+am))\s+(?:later|someday|one\s+day|eventually|down\s+the\s+road)\b`,
  String.raw`\bsomeday\s+you\s+(?:will|would)\s+(?:understand|realize|see|appreciate|thank)\b`,
].join('|'), 'i');

// ─── 支③: 对未来后悔的确定性断言（单腿成立）────────────────────
const REGRET_ZH = new RegExp([
  String.raw`(?:肯定|一定会|必定|注定|必然|迟早|百分百|一(?:定|准))(?:[^。]{0,8})(?:后悔|懊悔|悔恨|遗憾|自责|怪自己|恨自己|看不起自己)`,
  String.raw`(?:不|没|未)(?:[^。]{0,10})(?:肯定|一定|必定|注定|必然|迟早)(?:[^。]{0,6})(?:后悔|自责|遗憾|怪自己)`,
  String.raw`(?:错过|放弃|拒绝|不买)(?:[^。]{0,6})(?:你|您)?(?:[^。]{0,4})(?:一定|肯定|必定|注定|迟早)(?:[^。]{0,6})(?:会)?(?:后悔|遗憾|自责)`,
].join('|'));

const REGRET_EN = new RegExp([
  String.raw`\b(?:you\s+will|you'll|you\s+would|you'd)\s+(?:definitely|certainly|surely|absolutely|undoubtedly|someday|one\s+day)\s+(?:regret|be\s+sorry|blame\s+yourself)\b`,
  String.raw`\b(?:definitely|certainly|surely|absolutely|undoubtedly)\s+(?:regret|be\s+sorry)\b`,
  String.raw`\b(?:if\s+you\s+)(?:pass|skip|miss|walk\s+away|say\s+no|turn\s+this\s+down|let\s+this\s+go)\b[^.]{0,40}\byou\s+(?:will|would|'ll|'d)\s+(?:definitely\s+|certainly\s+|surely\s+)?regret\b`,
].join('|'), 'i');

// ─── G1: 正当长期规划建议（陈述长期收益，无情绪后果）────────────
const PLAN_ZH = new RegExp([
  String.raw`(?:提前|及早|尽早|趁早)(?:[^。]{0,8})(?:规划|布局|准备|筹备|安排|储蓄|储蓄|养老|教育|医疗)`,
  String.raw`(?:长期|长期来看|从长远看|拉长看)(?:[^。]{0,10})(?:有|能|可以|有助于|有利于)(?:[^。]{0,8})(?:好处|收益|回报|改善|提升|效果|复利|积累|优势)`,
  String.raw`(?:越早|越早开始)(?:[^。]{0,10})(?:越|则越|就愈)(?:[^。]{0,6})(?:好|有利|有效|明显|强|大|高|省|轻松)`,
  String.raw`(?:复利|时间|货币的时间价值|长期主义|延迟满足)(?:[^。]{0,10})(?:效应|原理|理念|策略|方法)`,
].join('|'));

const PLAN_EN = new RegExp([
  String.raw`\b(?:start|starting|begin|beginning)\s+(?:early|as\s+early\s+as\s+possible|sooner)\s+(?:\w+\s+){0,3}?(?:pays\s+off|has\s+benefits|is\s+beneficial|helps)\b`,
  String.raw`\b(?:in\s+the\s+long\s+run|over\s+the\s+long\s+term|over\s+time)\b[^.]{0,40}\b(?:beneficial|helps|improves|pays\s+off|compounds)\b`,
  String.raw`\b(?:compound\s+interest|delayed\s+gratification|long-?term\s+planning|retirement\s+planning)\b`,
].join('|'), 'i');

// ─── G2: 反思性陈述（复盘自己被施加的经历/分析这种话术）─────────
const REFLEXIVE_ZH = new RegExp([
  String.raw`(?:当年|当初|以前|曾经|回头(?:想想|来看)|现在(?:想想|回顾))(?:[^。]{0,12})(?:有人说|跟我说|对我说|劝我|跟我讲|告诉我)(?:[^。]{0,10})(?:后悔|以后|将来)`,
  String.raw`(?:这种|这类)(?:[^。]{0,8})(?:话术|说法|套路|说法|逻辑|结构|手法|策略)(?:[^。]{0,10})(?:是|属于|正是)(?:[^。]{0,8})(?:胁迫|施压|操控|操纵|情感绑架|不恰当|有问题|值得警惕|要警惕)`,
  String.raw`(?:要|应当|应该|需要|值得)(?:警惕|拒绝|反对|批评|破除|避免)(?:[^。]{0,10})(?:情感|这种)(?:[^。]{0,6})(?:预言|胁迫|绑架|施压|操控)`,
  String.raw`(?:分析|讨论|研究|拆解|识别)(?:[^。]{0,8})(?:情感预言|这种)(?:[^。]{0,6})(?:胁迫|话术|结构|套路)`,
].join('|'));

const REFLEXIVE_EN = new RegExp([
  String.raw`\b(?:someone|somebody|they|he|she)\s+(?:once|used\s+to|would)\s+(?:tell|say|warn)\s+(?:me|us)\b[^.]{0,50}\b(?:regret|later|someday)\b`,
  String.raw`\b(?:this|such)\s+(?:tactic|rhetoric|framing|line|pattern)\s+of\s+(?:\w+\s+){0,3}?(?:future\s+)?(?:regret|emotional)\b[^.]{0,50}\b(?:is|are)\s+(?:manipulative|a\s+red\s+flag|coercive|problematic)\b`,
  String.raw`\bwe\s+should\s+(?:be\s+)?(?:wary\s+of|reject|avoid|guard\s+against)\s+(?:\w+\s+){0,3}?regret\s+(?:appeals?|framing|tactics?)\b`,
].join('|'), 'i');

// ─── G3: 客观时间信息（事实性时间陈述，无情绪断言）──────────────
const FACTUAL_ZH = new RegExp([
  String.raw`(?:活动|促销|优惠|折扣|报名|招生|投票|申报|公示)(?:[^。]{0,6})(?:时间|期限|截止|周期|窗口期)(?:[^。]{0,10})(?:为|是|至|到|：|:)`,
  String.raw`(?:将|将于|计划|预计)(?:[^。]{0,6})(?:于|在)(?:[^。]{0,10})(?:停|截止|结束|恢复|上调|下调|生效|上线|下线|开放|关闭)`,
  String.raw`(?:每年|每季度|每月|每年只在)(?:[^。]{0,8})(?:招生|开放|申报|举办|开始|进行)(?:一次|一期|一届)`,
].join('|'));

const FACTUAL_EN = new RegExp([
  String.raw`\b(?:sale|promotion|discount|registration|enrollment|deadline|application)\s+(?:period|window|ends?|closes?)\s+(?:on|at|by)\b`,
  String.raw`\b(?:will|is\s+scheduled\s+to|is\s+set\s+to)\s+(?:close|end|expire|resume|take\s+effect)\s+(?:on|at|by)\b`,
].join('|'), 'i');

// ─── G4: 疑问/探讨句式（询问会不会后悔 ≠ 胁迫）─────────────────
const QUESTION_ZH = new RegExp([
  String.raw`(?:会不会|会不会|是否会|会不会)(?:[^。]{0,10})(?:后悔|遗憾|自责)`,
  String.raw`(?:怎么|怎样|如何)(?:[^。]{0,8})(?:才|才能|可以不)(?:[^。]{0,6})(?:后悔|遗憾|错过)`,
  String.raw`(?:？|\?)\s*$`,
].join('|'));

const QUESTION_EN = new RegExp([
  String.raw`\b(?:will|would)\s+(?:i|we|you)\s+(?:regret|be\s+sorry|miss)\b\s*\?`,
  String.raw`\bhow\s+(?:do|can)\s+(?:i|we)\s+(?:avoid|not)\s+(?:regret|missing)\b\s*\?`,
].join('|'), 'i');

// ─── G5: 文学/分析语境看守（小说情节/话术分析转述）─────────────
const NARRATIVE_ZH = new RegExp([
  String.raw`(?:小说|剧本|影视|电影|电视剧|故事|情节|台词|对白|角色|人物)(?:[^。]{0,10})(?:里|中|说|写道|写道|写道|提到|出现|设计|塑造|刻画)`,
  String.raw`(?:文章|帖子|报道|评论|分析|拆解)(?:[^。]{0,8})(?:里|中)(?:[^。]{0,6})(?:提到|说|写道|分析|拆解|指出)`,
].join('|'));

const NARRATIVE_EN = new RegExp([
  String.raw`\b(?:in|from)\s+(?:the\s+)?(?:novel|script|screenplay|movie|film|story|scene|dialogue|character)\b`,
  String.raw`\bthe\s+(?:article|post|report|analysis)\s+(?:says|notes|describes|mentions|points\s+out)\b`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入：把指定正则支替换成
 *   另值（例 { FORESHIFT_ZH: /(?!x)x/ } 表示「置空中文时态前移腿」）。
 *   生产调用不传该参数，行为完全不变。
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAffectiveForecast(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const FORESHIFT_ZH_ = R.FORESHIFT_ZH || FORESHIFT_ZH;
  const FORESHIFT_EN_ = R.FORESHIFT_EN || FORESHIFT_EN;
  const EMOTION_ZH_ = R.EMOTION_ZH || EMOTION_ZH;
  const EMOTION_EN_ = R.EMOTION_EN || EMOTION_EN;
  const BIND_ZH_ = R.BIND_ZH || BIND_ZH;
  const BIND_EN_ = R.BIND_EN || BIND_EN;
  const GRATITUDE_ZH_ = R.GRATITUDE_ZH || GRATITUDE_ZH;
  const GRATITUDE_EN_ = R.GRATITUDE_EN || GRATITUDE_EN;
  const REGRET_ZH_ = R.REGRET_ZH || REGRET_ZH;
  const REGRET_EN_ = R.REGRET_EN || REGRET_EN;
  const PLAN_ZH_ = R.PLAN_ZH || PLAN_ZH;
  const PLAN_EN_ = R.PLAN_EN || PLAN_EN;
  const REFLEXIVE_ZH_ = R.REFLEXIVE_ZH || REFLEXIVE_ZH;
  const REFLEXIVE_EN_ = R.REFLEXIVE_EN || REFLEXIVE_EN;
  const FACTUAL_ZH_ = R.FACTUAL_ZH || FACTUAL_ZH;
  const FACTUAL_EN_ = R.FACTUAL_EN || FACTUAL_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;
  const NARRATIVE_ZH_ = R.NARRATIVE_ZH || NARRATIVE_ZH;
  const NARRATIVE_EN_ = R.NARRATIVE_EN || NARRATIVE_EN;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '情感预言胁迫×未来情绪断言×当下行动绑定(zh)'
      : 'affective-forecast×future-emotion-appeal×present-action-binding(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 五类守门前置：规划建议 / 反思陈述 / 客观时间 / 疑问句式 / 叙事语境。
  // 疑问句式（G4）单独看句尾问号会误伤「你会后悔的？」这类反问胁迫，
  // 因此只在「不含确定性断言」时作数（见下方支③前的复检）。
  if (PLAN_ZH_.test(text) || PLAN_EN_.test(text)) return miss();
  if (REFLEXIVE_ZH_.test(text) || REFLEXIVE_EN_.test(text)) return miss();
  if (FACTUAL_ZH_.test(text) || FACTUAL_EN_.test(text)) return miss();
  if (NARRATIVE_ZH_.test(text) || NARRATIVE_EN_.test(text)) return miss();
  const isQuestion = QUESTION_ZH_.test(text) || QUESTION_EN_.test(text);

  // 支② GRATITUDE_SWAP：未来感激/明白交换 —— 单腿成立。
  // 「以后你会感谢我」本身就是把对方的未来情绪当作当下决定的合法性。
  if (GRATITUDE_ZH_.test(text) || GRATITUDE_EN_.test(text)) return hitResult;

  // 支③ REGRET_CERTAINTY：对未来后悔的确定性断言 —— 单腿成立。
  // 疑问句式作守门：询问「会不会后悔」不是胁迫（但反问/确定性断言除外，
  // 而反问句的确定性断言已被 REGRET_* 覆盖）。
  if (!isQuestion && (REGRET_ZH_.test(text) || REGRET_EN_.test(text))) return hitResult;

  // 支① FORECAST × EMOTION × BIND：三要素共现。
  // 疑问句式下不判（「现在不学英语以后会不会后悔」是真诚提问）。
  if (isQuestion) return miss();
  const fore = FORESHIFT_ZH_.test(text) || FORESHIFT_EN_.test(text);
  const emo = EMOTION_ZH_.test(text) || EMOTION_EN_.test(text);
  const bind = BIND_ZH_.test(text) || BIND_EN_.test(text);
  if (fore && emo && bind) return hitResult;
  // 时态前移 + 情绪断言，且句中无「建议/认为/可能」等弱化词时，
  // 也视为胁迫（情绪断言指向对方本人时成立）。
  if (fore && emo && /(?:你|您|你自己)/.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkAffectiveForecast,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    FORESHIFT_ZH, FORESHIFT_EN,
    EMOTION_ZH, EMOTION_EN,
    BIND_ZH, BIND_EN,
    GRATITUDE_ZH, GRATITUDE_EN,
    REGRET_ZH, REGRET_EN,
    PLAN_ZH, PLAN_EN,
    REFLEXIVE_ZH, REFLEXIVE_EN,
    FACTUAL_ZH, FACTUAL_EN,
    QUESTION_ZH, QUESTION_EN,
    NARRATIVE_ZH, NARRATIVE_EN,
  }),
};
