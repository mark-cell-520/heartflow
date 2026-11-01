/**
 * src/incredulity.js — 「诉诸个人怀疑」检测器（第 162 个判别维度）
 *
 * [r162 立项] decision 本体一次选出（heartflow_philosophy_decision，
 * type=accelerate / confidence 0.7 / priority 40 / goalReviewed true；
 * 注意 rationale 的 cognitiveLoad/uncertainty 为 "unknown" 默认档，
 * 不构成实质背书）。探测器证据：grep src/（排除 test/）
 * 无法想象|难以置信|不可思议|can'?t imagine|inconceivable|unfathomable
 * 相关判据 = 0 命中（ psychologists_fallacy 只管「别人怎么想」，
 * 不管「对事实的真值否定」；unsupported_claim 管无依据断言，
 * 不管「以主观难以置信替代证据」——真缺口，射程外）。
 * 外部搜索记录（如实）：HN Algolia 命中真实故事 "Translating natural
 * language to first-order logic for logical fallacy detection"
 * （https://arxiv.org/abs/2405.02318，hn id 43257719，LLM 路线，
 * 与心虫纯规则引擎不同构）；GitHub fallacy detection 最高星为
 * latent-variable/Real_time_fallacy_detection（119★，LLM 实时检测，
 * 无可复用规则）；Semantic Scholar 全部尝试 HTTP 失败（total
 * undefined）。不编造 arXiv ID——本族为标准非形式谬误
 * "argument from personal incredulity（诉诸个人怀疑）"，
 * 实现为心虫自有规则（仿 src/monocause.js）。
 *
 * 辨别的族：诉诸个人怀疑（argument from personal incredulity /
 * appeal to personal incredulity / argument from ignorance 的强表亲）——
 * 用**主观上的「无法想象/难以置信」**替代证据，据此**否定事实的
 * 真值或真实性**：
 *   我无法想象他怎么能做到，所以这成绩一定是假的。
 *   这件事简直令人难以置信，因此根本不可能是真的。
 *   视频播放量高得离谱，我难以想象是自然增长，肯定是刷出来的。
 *   他年纪轻轻就身居高位，我根本想象不到他凭什么，背后一定有推手。
 *   结果不可思议，一看就是后期剪辑的。
 *   这不可能，我实在无法相信他能通关。
 *   I cannot imagine how this is possible, so it cannot be true.
 *   The results are simply unbelievable, therefore the data must be
 *   fabricated.
 *   There is no way that happened; I cannot fathom it.
 *
 * 与既有维度的边界（grep + 归因）：
 *   · psychologists_fallacy（fallacies 子标签）管「以为别人都和自己
 *     想的一样」，本族管**对事实真值的否定**，机制是难以置信；
 *   · appeal_to_ignorance（既有维度）管「不能证伪所以为真」，本族
 *     管「我不能想象所以为假」——方向相反、腿也不同；
 *   · unsupported_claim（既有维度）管**无依据的断言**本身，本族的
 *     断言有一个**主观难以置信的前提**在驱动，错在推理结构；
 *   · absolute_claim（既有维度）管绝对化措辞，本族必须有难以置信
 *     陈述腿在场，孤立的「一定是假的」不是本族；
 *   · mind_reading（既有维度）管断言他人动机，本族管否定事实真值；
 *   · 其余 161 个维度对本族样本预计零命中（射程外）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① INCREDULITY 难以置信陈述——无法想象/难以想象/想象不到/
 *     难以置信/不可思议/匪夷所思…（EN：can't imagine / hard to
 *     believe / inconceivable / unfathomable / beyond comprehension）。
 *   · 腿② TRUTH-DENIAL 真值否定推导——两种子形：
 *     (a) 推断词+否定断言（所以/因此/这说明…+ 不是真的/是假的/
 *         纯属/不可信/作弊/编造/摆拍/有黑幕…；EN：so/therefore/
 *         which means…+ can't be true / must be fake / fabricated）；
 *     (b) 直接否定断言（一看就是假的/肯定是作弊的/不可能是真的；
 *         EN：clearly fake / no way that happened / is obviously
 *         staged）——倒装形：真值否定在前、难以置信在后作理由
 *         （这成绩不可能是真的，我无法想象他怎么练的）。
 *   · 缺腿不判：只有腿①（「实验结果令人难以置信」）是中性陈述；
 *     只有腿②（「这一定是假的」）无难以置信前提，是别的语境。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误推理、文学对白、评析
 * 对象。verify 的含义是「这段用主观难以置信替代了证据，需要回到
 * 可验证依据（录像/数据/第三方复核）再下真值判断」。
 *
 * 明确不判的（豁免）：
 *   · 有据可查的惊讶（成绩提升令人难以置信，但有三次模考记录和
 *     批改痕迹可查 / 经第三方核实）——惊讶+证据不是本族；
 *   · 提问句式（含问号——求知/反问不是断言）；
 *   · 评析这套话术本身（诉诸个人怀疑/argument from personal
 *     incredulity）；
 *   · 无否定推导的纯感叹（快得难以置信/美味得不可思议）。
 */
'use strict';

// ─── 腿① INCREDULITY 难以置信陈述（中文）──────────────────────────────
// 收裸词干形态（想象不到/想不到/难以置信——不加「让人/简直」等修饰也
// 命中，[r161] 裸词教训）；修饰词（实在/简直/根本/真的/完全）位于
// 动词前或后均由子串匹配覆盖。
const INCREDULITY_ZH = new RegExp(
  // 否定/弱化副词 + 想象/相信/理解
  '(?:无法|难以|很难|没法|没办法|不能|不敢|不大能|不太|不大|几乎)' +
  '(?:想象|想像|相信|置信|理解)' +
  // 裸词干形：想象不到 / 想不到 / 相信不了
  '|(?:想象|想像|相信)(?:不到|不了)' +
  '|想不到' +
  // [audit-fix r166] 离谱族（口语化主观难以置信——「播放量高得离谱」）
  '|高得离谱|离谱得|真离谱|太离谱|离大谱|夸张得(?:离谱|不可思议)' +
  // 固定短语
  '|难以置信|难以相信|很难相信|匪夷所思|不可思议' +
  '|超乎(?:我的|人的|所有人)?想象|超出(?:我的|人的)?想象' +
  '|无法理喻|不可名状到让人' +
  // 令人…难以置信（「让人/令人」前缀形，子串已覆盖，显式列出便于注释）
  '|令人?难以置信',
  'i'
);

// 英文：can't imagine / hard to believe / inconceivable / unfathomable /
// beyond comprehension / strains credulity / boggles the mind。
const INCREDULITY_EN = new RegExp(
  // 主语 + 否定情态 + 认知动词
  "\\b(?:i|we|you|one|people|someone|anybody|anyone)\\s+(?:really\\s+|just\\s+|simply\\s+|honestly\\s+|frankly\\s+)?(?:can'?t|cannot|can\\s+not|could\\s+not|couldn'?t)\\s+(?:even\\s+|possibly\\s+)?(?:imagine|picture|fathom|conceive|comprehend|understand|grasp|see\\s+how|believe|wrap\\s+my\\s+head\\s+around)\\b" +
  // it's hard/difficult/impossible to imagine/believe…
  "|\\bit'?s\\s+(?:just\\s+|simply\\s+|really\\s+)?(?:hard|difficult|impossible|too\\s+hard)\\s+(?:for\\s+(?:me|us|anyone|anybody)\\s+)?to\\s+(?:imagine|believe|fathom|conceive|comprehend|understand|see\\s+how|grasp)\\b" +
  // 形容词族
  "|\\b(?:inconceivable|unimaginable|unfathomable|unbelievable)\\b" +
  "|\\bbeyond\\s+(?:my|our|anyone'?s|all)\\s+(?:comprehension|understanding|imagination|ken)\\b" +
  // 固定短语
  "|\\bstrains?\\s+credulity\\b|\\bboggle[ds]?\\s+(?:the|my)\\s+mind\\b|\\bmind[-\s]?boggling\\b" +
  "|\\b(?:hard|difficult|impossible)\\s+to\\s+believe\\b|\\bhard\\s+to\\s+fathom\\b",
  'i'
);

// ─── 腿②a TRUTH-DENIAL 推断词+否定断言（中文）────────────────────────
// 推断词（所以/因此/这说明/足以证明…）+ 窗口内的真值否定/真实性否定。
const INFER_ZH = '(?:所以|因此|故而|这说明|足以证明|只能说明|可见|证明|表明|说明)';
const DENY_ZH = new RegExp(
  // 真值否定
  '不是真的|不可能是真的|是假的|绝对是假|肯定是假|一定是假|纯属|不可信|不能信|信不得' +
  // 不存在/未发生
  '|根本(?:不存在|没发生过|不可信|是假|是编)' +
  // 欺骗/造假族
  '|(?:是|属|属于)(?:谎言|谎话|骗局|骗子|圈套|托(?:儿)?|编(?:的|造|出来|出来的)|假(?:的|象)?|作弊|舞弊|造假|注水|放水|黑哨|假赛|假唱|代考|抄袭|洗稿|作伪|作秀|演戏|摆拍|炒作|欺诈|行骗|P图|修图|后期(?:制作|剪辑)?|剪(?:辑|出来的)|修(?:过|图)|演(?:的|出来)|装(?:的|出来))' +
  // 黑幕/水分族
  '|有(?:黑幕|内幕|猫腻|水分|假|鬼|蹊跷|推手)' +
  // 刷量族
  '|(?:刷|买)(?:单|量|粉|赞|票|榜|水军|出来|的)' +
  // 虚报族
  '|(?:数据|成绩|销量|流量)?(?:造假|作伪|虚报|谎报|夸大|吹牛|瞎(?:编|说)|胡(?:编|说|扯)|乱编|编造|捏造|虚构|伪造|杜撰|撒谎|欺瞒|隐瞒)',
  'i'
);

// ─── 腿②b TRUTH-DENIAL 直接否定断言（中文，倒装形）──────────────────
// 无推断词的显式否定断言（一看/显然/肯定/一定…是假的）+ 不可能形 +
// 纯属形。倒装形（真值否定在前、难以置信在后）由本腿与腿①共现覆盖。
const TRUTHDENIAL_ZH_B = new RegExp(
  // 一看/显然/肯定/一定…就是假的（修饰副词必选——精度锚）
  '(?:一看|分明|显然|肯定|一定|绝对|无非|只不过|明明|压根|根本|摆明)就?是' +
  '(?:假的?|假象|谎言|谎话|骗局|编造|捏造|虚构|伪造|摆拍|演戏|炒作|作秀|托(?:儿)?|作弊|舞弊|造假|刷(?:单|出来|的)|买(?:粉|量|赞)|抄(?:袭|的)|演(?:的|出来)|装(?:的|出来)|后期(?:的|制作|剪辑|处理|合成|特效|修音|调色)?|P图|修图|剪(?:辑|出来的|过)|吃(?:了)?药|嗑药|打药|用药|兴奋剂|有黑幕|有内幕|有猫腻)' +
  // [audit-fix r166] 无推断词阴谋否定（背后一定有推手/有黑幕——guidance 样本4）
  '|(?:背后|幕后|暗中|其中|里面)?(?:一定|肯定|绝对|必然|必定|势必|多半)?有(?:推手|黑幕|内幕|猫腻|鬼|蹊跷)' +
  // 不可能…是真的/存在/做过（否定情态 + 窗口内真值词）
  '|(?:不可能|绝不会|绝对不是|绝非|不见得)[^。！？，,；;]{0,18}(?:是真的|存在|发生过|做得出来|干得出来|说得通|行得通|成立)' +
  // 纯属/根本 + 造假族
  '|纯属(?:虚构|编造|捏造|伪造|作假|杜撰)' +
  '|根本(?:不存在|没发生过|不可信|是假|是编)',
  'i'
);

// ─── 腿② TRUTH-DENIAL（英文）────────────────────────────────────────
const TRUTHDENIAL_EN = new RegExp(
  // a 推断词 + can't be true / isn't real…
  "(?:so|therefore|thus|hence|which\\s+means|which\\s+proves|that\\s+means|this\\s+proves|meaning)\\s+(?:it|this|that|they|he|she|the\\s+\\w+)?\\s*(?:can'?t|cannot|couldn'?t|must\\s+not|isn'?t|is\\s+not|aren'?t|are\\s+not|wasn'?t|weren'?t|is\\s+no)\\s+(?:possibly\\s+|really\\s+|actually\\s+|be\\s+|been\\s+)?(?:true|real|correct|accurate|right|possible|credible|believable|factual|genuine|legit|legitimate|the\\s+case|happened|for\\s+real)" +
  // b 推断词 + must be fake/fabricated…
  "|(?:so|therefore|thus|which\\s+means|that\\s+means)\\s+(?:it|this|that|they|he|she|the\\s+\\w+)?\\s*(?:must|has\\s+to|can\\s+only)\\s+(?:be\\s+|have\\s+been\\s+)(?:false|fake|faked|fabricated|made\\s+up|a\\s+lie|lies|a\\s+hoax|bogus|phony|staged|scripted|doctored|rigged|cooked|exaggerated|a\\s+scam|fraud|fraudulent|a\\s+setup|photoshopped|edited|altered|manipulated)" +
  // c didn't really happen
  "|(?:therefore|so)\\s+(?:it|this|that|they)\\s+(?:didn'?t|did\\s+not)\\s+(?:really\\s+)?(?:happen|occur)" +
  // d 裸显式否定（clearly/obviously + fake/staged/rigged…）
  "|\\b(?:is|are|was|were|it'?s|that'?s)\\s+(?:clearly|obviously|plainly|simply|definitely|absolutely|certainly|just)\\s+(?:false|fake|fabricated|a\\s+lie|a\\s+hoax|staged|scripted|rigged|doctored|made\\s+up|bogus|phony|photoshopped)" +
  // d2 副词前置形（clearly the footage was doctored）
  "|\\b(?:clearly|obviously|plainly|simply|definitely|absolutely|certainly)\\s+(?:the\\s+\\w+\\s+)?(?:was|were|is|are)\\s+(?:doctored|staged|fabricated|faked|edited|photoshopped|rigged|scripted|cooked|fake|false|made\\s+up|a\\s+lie|a\\s+hoax)" +
  // e no way that happened / no way it's real
  "|\\bno\\s+way\\s+(?:that\\s+)?(?:this|that|it|they|he|she)\\s+(?:really\\s+)?(?:happened|is\\s+true|was\\s+real|is\\s+real|did\\s+that|did\\s+this)\\b" +
  // f 倒装形：can't be true, because I cannot imagine/fathom…
  "|\\b(?:can'?t|cannot|couldn'?t|must\\s+not|isn'?t|is\\s+not)\\s+(?:possibly\\s+|really\\s+)?(?:be\\s+)?(?:true|real|possible)\\b[^.]{0,40}\\b(?:because|since|as)\\b[^.]{0,60}(?:imagine|believe|fathom|conceive|comprehend|inconceivable|unimaginable|unfathomable)",
  'i'
);

// ─── 豁免一：有据可查的惊讶（惊讶+证据不是本族）────────────────────
const EVIDENCE_EXEMPT = new RegExp(
  // 中文：转折 + 有 [证据族]
  '(?:但|但是|然而|不过|可是|只不过|只是)[^。]{0,26}(?:有|均有|并有|附有|具备|可查)[^。]{0,10}' +
  '(?:录像|视频|照片|影像|图像|证据|记录|数据|公证|报道|文献|论文|第三方|见证|目击|证书|票据|凭证|编号|备案|出处|来源|原文|链接|可查|可验证|可复核)' +
  // 中文：经核实/已查证
  '|(?:经|经过|已经|已|并经|均经|再经)(?:核实|查证|证实|验证|确认|复核|鉴定|公证|比对|审计|交叉验证)' +
  // 英文：转折 + 证据族 / verified by…
  "|\\b(?:but|however|yet|although|though)\\b[^.]{0,40}\\b(?:video|footage|photo(?:s|graph(?:s)?)?|evidence|record|records|documentation|witness(?:es)?|source|sources|paper|study|data|receipt|certificate|verifiable|confirmed|verified|corroborated|authenticated|peer[- ]reviewed)\\b" +
  "|\\b(?:verified|confirmed|corroborated|documented|recorded|authenticated|fact[- ]checked)\\s+(?:by|through|independently)\\b",
  'i'
);

// ─── 豁免二：提问句式（求知/反问不是断言）──────────────────────────
const QUESTION_EXEMPT = /[?？]/;

// ─── 豁免三：评析这套话术本身 / 概念分析 ───────────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:诉诸|诉诸于)(?:个人|主观|自我)?(?:怀疑|难以置信|想象|不信)' +
  '|(?:难以置信|无法想象|想象不到|诉诸怀疑)(?:是)?(?:一种|典型的|常见的)?(?:谬误|论证|论证方式|逻辑错误|逻辑谬误|思维陷阱|话术|手法|推理错误)' +
  '|(?:这是|属于|犯了)(?:诉诸)?(?:个人)?(?:怀疑|难以置信)(?:的)?(?:谬误|错误|逻辑)',
  'i'
);
const META_EXEMPT_EN = new RegExp(
  "\\b(?:argument|appeal)\\s+to\\s+(?:personal\\s+|mere\\s+)?incredulity\\b" +
  "|\\bpersonal\\s+incredulity\\b" +
  "|\\b(?:can'?t|cannot)\\s+imagine[^.]{0,40}\\b(?:is|are)\\s+a\\s+(?:fallacy|logical\\s+error|mistake)\\b",
  'i'
);

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkIncredulity(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const INCREDULITY_ZH_ = R.INCREDULITY_ZH || INCREDULITY_ZH;
  const INCREDULITY_EN_ = R.INCREDULITY_EN || INCREDULITY_EN;
  const DENY_ZH_ = R.DENY_ZH || DENY_ZH;
  const TRUTHDENIAL_ZH_B_ = R.TRUTHDENIAL_ZH_B || TRUTHDENIAL_ZH_B;
  const TRUTHDENIAL_EN_ = R.TRUTHDENIAL_EN || TRUTHDENIAL_EN;
  const EVIDENCE_EXEMPT_ = R.EVIDENCE_EXEMPT || EVIDENCE_EXEMPT;
  const QUESTION_EXEMPT_ = R.QUESTION_EXEMPT || QUESTION_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 评析这套话术 / 概念分析 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 提问句式：含问号——求知/反问不是断言
  if (QUESTION_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 有据可查的惊讶：惊讶+证据佐证不是本族
  if (EVIDENCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 难以置信陈述
  const incZh = INCREDULITY_ZH_.test(text);
  const incEn = INCREDULITY_EN_.test(text);
  if (!incZh && !incEn) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 腿②a 推断词+否定断言（中文窗口 26 字符；英文由 TRUTHDENIAL_EN 内建）
  const inferZh = new RegExp(INFER_ZH + '[^。！？；;]{0,26}(?:' + DENY_ZH_.source + ')', 'i').test(text);
  // 腿②b 直接否定断言
  const denyZhB = TRUTHDENIAL_ZH_B_.test(text);
  const denyEn = TRUTHDENIAL_EN_.test(text);

  if (inferZh || denyZhB || denyEn) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? '诉诸个人怀疑×难以置信陈述×真值否定推导(zh)'
        : 'incredulity×disbelief statement×truth-denial inference(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkIncredulity,
  __internals: () => ({
    INCREDULITY_ZH, INCREDULITY_EN, INFER_ZH, DENY_ZH,
    TRUTHDENIAL_ZH_B, TRUTHDENIAL_EN,
    EVIDENCE_EXEMPT, QUESTION_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN,
  }),
};
