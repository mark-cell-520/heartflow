/**
 * src/motte-and-bailey.js — 「稻草城堡谬误」检测器
 * （第 192 个判别维度，r194 立项）
 *
 * [r194 立项] decision 本体在当前引擎（v6.8.122，191 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证：grep -ril 'motte|bailey' src/ 0 命中——现有 191 维无一覆盖
 *     「争议主张 + 退守遁词」的替换结构（external: HN Algolia 命中 Wikipedia
 *     条目与 Slate Star Codex 2014 年原文；GitHub motte+bailey+fallacy 检索
 *     total=0，无可复用代码；Semantic Scholar 429。侦察落盘
 *     /tmp/hf-scout-<ts>.txt——判据为心虫自有纯规则实现，零 LLM 依赖）。
 *   · 该族在 AI 输出里高发且危险：先抛出一个无法举证的极端主张，被质疑时退守到
 *     「我只是开玩笑/个人观点/别较真」这类无法被否证的平庸表述，同时宣称原主张
 *     「未被驳倒」——用遁词把举证责任反向推给质疑者。是「似是而非」的典型：
 *     表面上态度轻松，实则是结构性地逃避审查。
 *
 * 辨别的族：稻草城堡谬误（motte-and-bailey fallacy，又称 castle and
 * courtyard）——把**争议性、难举证的主张**（bailey）与**平庸、易守难攻的
 * 表述**（motte）混为一谈：先推进争议主张，被质疑时坚称自己只是在说平庸
 * 表述，进而主张争议主张「未被驳倒」或指责质疑者「较真/对号入座」：
 *   男人都不是好东西——我只是开个玩笑，别较真。
 *   所有移民都是罪犯。I'm just saying.
 *   他们年轻人全都一个德行，认真你就输了，我又没让你信。
 *   Everyone who disagrees is evil. Just asking questions.
 *   这家产品全是智商税，谁急了谁就是说中了。
 *
 * 与既有维度的边界（刻意错开）：
 *   · absolute_claim 管「绝对化措辞」本身，本族要求**两腿共现**——只有争议
 *     主张腿而没有退守腿时不判。
 *   · scrutiny_evasion / seizing 管单一逃避审查句式，本族管「争议主张被
 *     遁词替换」的**成对结构**：单有遁词无限定主张不判，单有争议主张无遁词
 *     不判（那是 absolute_claim 的辖区）。
 *   · gaslighting 管关系操纵，本族不管关系、不管语气，管**论证结构上的
 *     主张降级替换**。
 *
 * 判据（争议主张腿 × 退守遁词腿两腿共现 + 分组豁免，缺一不判）：
 *   · 腿① BAILEY 争议主张——命中以下任一家族（每条腿都是枚举常量，可负例
 *     注入逐条置空验证承重）：
 *       · 全称量词形（BAILEY_ABS_ZH/EN）：所有/全部/凡是/一律/统统/毫无例外/
 *         无一例外/个个 …（都|皆|均）；all/every/everyone/always/never/
 *         without exception … are/is/should/must。r161 教训：量词收裸名词
 *         形态（「个个」本身就是裸形态，(?:们)?式可选后缀已覆盖复数形）。
 *       · 群体刻板形（BAILEY_STEREO_ZH/EN）：群体名词（男人/女人/年轻人/国人/
 *         专家/网友…，裸名词与「们」后缀双形态）×（都|个个|一律|全|统统）×
 *         贬判谓语；以及无群体词的「都一个样/一个德行/一个货色」结构；英文
 *         men/women/immigrants… are all the same/trash/evil…。
 *       · 极端处方形（BAILEY_PRESC_ZH/EN）：必须/应当/应该 ×（彻底|完全|全面|
 *         一律|永久|无条件）×（禁止|取缔|消灭|清除|废除|封杀|铲除）；must be
 *         completely/totally/permanently banned/eliminated/destroyed…。
 *   · 腿② MOTTE 退守遁词——命中以下任一家族：
 *       · 降格陈述（MOTTE_ZH/EN）：我只是(随便)?(说|讲|提|问|猜)/别当真/别较真/
 *         何必认真/认真你就输了/纯属个人观点/一家之言/我又没让你信/不信当我没说/
 *         对号入座/谁急了谁就是说中了；I'm just saying/just asking (questions)/
 *         just a joke/don't take it seriously/lighten up/if the shoe fits/
 *         in my opinion/imho/whoever it applies to。
 *       · 其中一子类 MOTTE_DISMISS（审查否定型遁词：别较真/认真你就输了/
 *         何必认真/don't take it seriously/lighten up/if the shoe fits）计分加成
 *         ——它直接否定质疑行为的正当性，是稻草城堡最强的信号。
 *
 * 为什么取 VERIFY 级：争议主张 + 退守既可能是结构性的逃避审查，也可能是
 * 轻松的闲聊自嘲（「我随便说说别当真」后接一个并无绝对化的玩笑）。verify 的
 * 含义是「这段先抛出了难举证的争议主张、又准备了无法被否证的退守表述——请
 * 确认争议主张本身是否有证据，不要用遁词代替举证；要么拿出论据，要么撤回
 * 争议主张」。单凭两腿共现无法断定主观恶意，故不升格到 rewrite/block。
 *
 * 明确不判的（豁免，全部可负例注入置空验证承重）：
 *   · 元讨论（稻草城堡/motte/bailey/motte-and-bailey/castle and courtyard/
 *     争议主张退守到平庸表述——讨论这个谬误本身是正确判别）。
 *   · 否定/劝止（不要用「我只是开玩笑」逃避举证/别拿个人观点当挡箭牌/don't
 *     hide behind "just saying"——劝止这种手法是正确判别）。
 *   · 无争议主张腿的单纯谦逊（这只是我的初步猜测，可能不对/太阳从东边升起，
 *     这只是我的个人看法——无限定量词/刻板/极端处方的平庸主张 + 遁词不判：
 *     遁词只有在包裹争议主张时才是稻草城堡）。
 *   · 无遁词腿的单纯绝对化（所有人都会死/All men are mortal——那是
 *     absolute_claim 的辖区，本族不重复登记）。
 */
'use strict';

// ─── 腿①家族 A：全称量词形争议主张 ────────────────────────────────
const BAILEY_ABS_ZH = [
  // 绝对量词 …（都|皆|均|总归）——裸量词形态（r161：不收「们都」才命中的形）
  /(?:所有|全部|凡是|一律|统统|毫无例外|无一例外|个个)[^。！？；!?;\n]{0,28}(?:都|皆|均|总归|全都|全是)/,
  // 「都是/皆是」前置形（倒装：都属于/活该…一切人）
  /(?:都|皆)(?:是|属于|活该|该死)[^。！？；!?;\n]{0,12}(?:所有|全部|一切|任何人)/,
];
const BAILEY_ABS_EN = [
  /\b(?:all|every|each|any|no|none|everyone|nobody|everything|nothing|always|never)\b[^.!?;\n]{2,60}\b(?:are|is|was|were|do|does|did|have|has|should|must|will|can)\b/i,
  /\bevery single\b/i,
  /\bwithout exception\b/i,
  /\bnot a single\b/i,
];

// ─── 腿①家族 B：群体刻板形争议主张 ────────────────────────────────
const BAILEY_STEREO_ZH = [
  // 群体名词（裸名词 + 「们」后缀双形态）× 全称副词 × 贬判谓语
  /(?:男人|女人|男生|女生|年轻人|老人|国人|某省人|某市人|外地人|客户|用户|员工|领导|专家|网友|玩家|家长|孩子|学生|老师|医生|律师|警察|官员|富人|穷人|粉丝|宅男|美女|网红)(?:们)?[^。！？；!?;\n]{0,6}(?:都|个个|一律|全|统统)(?:是|属于|活该|该死|一个样|一个德行|一个德性|一个货色|一路货色|不是好东西|没一个好东西|垃圾|智商税|矫情|自私|冷血|邪恶|废物|在装|变了)/,
  // 无群体词的结构形：X 全都/都是 + 强贬义名词（智商税/垃圾/骗子/蛀虫…）
  /[^。！？；!?;\n]{1,12}(?:全|都)(?:是|属于)(?:纯|就是)?(?:智商税|垃圾|废物|骗子|蛀虫|祸水|人渣|败类|垃圾)/,
  // 无群体词的「都一个样」结构（「他们全都一个德行」「这俩都一个样」）
  /(?:都|个个|一律|全|统统)(?:是)?(?:一个样|一个德行|一个德性|一个货色|一路货色|一个模子|一个逼样)/,
  // 「所有 X 都不是好东西」全称贬判
  /(?:所有|全部|凡是|个个)[^。！？；!?;\n]{0,12}(?:都)?(?:不是好东西|没一个好东西|该死|死有余辜)/,
];
const BAILEY_STEREO_EN = [
  /\b(?:men|women|immigrants|millennials|boomers|liberals|conservatives|feminists|chinese|americans|foreigners|teenagers|journalists|politicians|lawyers|doctors|teachers|bosses)\s+(?:are|were)\s+(?:all\s+)?(?:the same|trash|garbage|evil|criminals|stupid|lazy|parasites|ruining|scum)\b/i,
  /\bthey'?re all (?:the same|alike|identical)\b/i,
];

// ─── 腿①家族 C：极端处方形争议主张 ────────────────────────────────
const BAILEY_PRESC_ZH = [
  /(?:必须|应当|应该|非得|就要|需要)(?:彻底|完全|全面|一律|统统|永久|无条件|从根上)(?:地)?(?:禁止|取缔|消灭|清除|废除|取消|封杀|抵制|铲除|灭绝|肃清|抹除)/,
  /(?:彻底|完全|全面|永久|无条件)(?:地)?(?:消灭|清除|铲除|废除|封杀|抹除|灭绝|禁止)/,
];
const BAILEY_PRESC_EN = [
  /\bmust\s+(?:be\s+)?(?:completely|totally|permanently|entirely|utterly|once and for all)\s+(?:banned|eliminated|destroyed|removed|silenced|stopped|erased|crushed|outlawed|ban|eliminate|destroy|remove|silence|stop|erase|crush|outlaw)\b/i,
  /\b(?:completely|totally|permanently|entirely)\s+(?:banned|eliminated|destroyed|outlawed|eradicated|ban|eliminate|destroy|outlaw|eradicate)\b/i,
];

// ─── 腿②：退守遁词（平庸易守的替换表述）────────────────────────────
const MOTTE_ZH = [
  // 降格陈述：我只是（随便）说/讲/提/问/猜
  /我(?:只是|也不过是|不过是|也就|仅仅)(?:随便|随口|简单|顺口)?(?:说|讲|提|问|猜|想|表达|发表|评论)(?:一?下|一?句|而已|罢了)?/,
  // 别当真家族（含审查否定型——与 MOTTE_DISMISS 同源，主腿必须收全）
  /只(?:是|不过是)(?:说|讲)笑?而已|开个玩笑(?:而已|罢了)?|(?:纯属)?开玩笑(?:而已|罢了)?|别当真|别往心里去|别较真|何必(?:这么|那么|如此|太)?认真|认真(?:你)?就输了|何必(?:这么|那么|太)?较真/,
  // 观点降格：纯属/只是个人观点、一家之言
  /(?:纯属|只是|仅仅是|不过是)(?:个人)?(?:观点|看法|意见|想法|猜测|感觉|猜想)(?:而已|罢了)?|一?家之言(?:而已|罢了)?|我(?:个人)?的?(?:一点)?(?:看法|观点|意见)/,
  // 免责声明：我又没让你信/不信当我没说
  /我(?:又)?没(?:有)?(?:强迫|逼|要求|让)(?:你|你们|别人|谁)?(?:信|接受|同意|听|照做|服从)/,
  /不信(?:的)?话?(?:可以)?(?:当)?我?(?:没|没有)?(?:说|胡说|放屁|抬杠)|(?:你)?(?:要)?不(?:喜欢|乐意|爱)(?:听)?(?:可以)?(?:不)?(?:听|信|看)/,
  // 对号入座 / 谁急谁中
  /对号入座(?:干嘛|干什么|就是|说明)?|(?:谁)?(?:着急|急)?(?:了)?(?:就是)?说(?:中|准)了|越(?:是)?(?:反驳|辩解|着急|敏感)(?:越)?说明/,
];
const MOTTE_EN = [
  /\bi'?m just (?:saying|asking|kidding|joking|wondering|thinking|offering|proposing)\b/i,
  /\bjust (?:saying|asking|joking|kidding|my opinion|a thought|a hypothesis|playing devil'?s advocate)\b/i,
  /\bjust asking questions\b/i,
  /\bit'?s just (?:a )?(?:joke|opinion|thought|theory|perspective|hypothesis)\b/i,
  /\bdon'?t take (?:it|this|me|things) (?:so )?seriously\b/i,
  /\blighten up\b/i,
  /\bif the shoe fits\b/i,
  /\bin my (?:humble |honest |personal )?opinion\b/i,
  /\bimho\b/i,
  /\bwhoever (?:this|it) (?:applies to|describes)\b/i,
  /\bnot (?:trying|meaning) to offend\b/i,
];

// ─── 腿②子类：审查否定型遁词（计分加成）────────────────────────────
const MOTTE_DISMISS_ZH = [
  /别较真|何必(?:这么|那么|如此|太)?认真|认真(?:你)?就输了|别当真|何必(?:这么|那么|太)?较真/,
];
const MOTTE_DISMISS_EN = [
  /\bdon'?t take (?:it|this|me|things) (?:so )?seriously\b/i,
  /\blighten up\b/i,
  /\bif the shoe fits\b/i,
];

// ─── 豁免一：元讨论（讨论这个谬误本身是正确判别）──────────────────
const EXEMPT_META_ZH = [
  /稻草城堡|motte|bailey|城堡庭院/,
  /(?:争议|极端|难举证)(?:性)?(?:的)?(?:主张|立场|观点|表述)[^。！？]{0,10}(?:退守|撤退|切换|替换|逃)[^。！？]{0,10}(?:平庸|温和|无害|正确)(?:的)?(?:主张|立场|观点|表述)?/,
];
const EXEMPT_META_EN = [
  /motte[- ]and[- ]bailey/i,
  /castle and courtyard/i,
];

// ─── 豁免二：否定/劝止（劝止这种手法是正确判别）────────────────────
const EXEMPT_NEG_ZH = [
  /(?:不要|别|停止|避免|切忌|拒绝)(?:再)?(?:用|拿|以|借|靠)?[^。！？]{0,14}(?:逃避|搪塞|推卸|当)?(?:挡箭牌|托词|遁词|借口|遮羞布)/,
  /(?:不要|别|少)(?:再)?(?:拿|用|以)[^。！？]{0,12}(?:开玩笑|个人观点|我只是说说|别较真)(?:来|去)(?:逃避|搪塞|推卸|糊弄)/,
];
const EXEMPT_NEG_EN = [
  /don'?t (?:use|hide behind|hide behind)[^.!?]{0,40}(?:just (?:saying|joking|asking)|personal opinion|i'?m just)/i,
  /stop (?:using|hiding behind)[^.!?]{0,40}(?:just (?:saying|joking|asking)|personal opinion)/i,
];

// ─── 默认阈值 ─────────────────────────────────────────────────────
const DEFAULTS = {
  MIN_TEXT_LEN: 6,   // 全文最短长度（短于此无结构可判）
};

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * @param {string} text 待判文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量族
 * @returns {{hit:boolean, score:number, detail:string, families:string[]}}
 */
function checkMotteAndBailey(text, inject) {
  if (!text || text.length < DEFAULTS.MIN_TEXT_LEN) {
    return { hit: false, score: 0, detail: '', families: [] };
  }
  const norm = v => (Array.isArray(v) ? v : [v]);
  const R = inject || {};
  const ABS_Z = norm(R.BAILEY_ABS_ZH || BAILEY_ABS_ZH);
  const ABS_E = norm(R.BAILEY_ABS_EN || BAILEY_ABS_EN);
  const STE_Z = norm(R.BAILEY_STEREO_ZH || BAILEY_STEREO_ZH);
  const STE_E = norm(R.BAILEY_STEREO_EN || BAILEY_STEREO_EN);
  const PRE_Z = norm(R.BAILEY_PRESC_ZH || BAILEY_PRESC_ZH);
  const PRE_E = norm(R.BAILEY_PRESC_EN || BAILEY_PRESC_EN);
  const M_Z = norm(R.MOTTE_ZH || MOTTE_ZH);
  const M_E = norm(R.MOTTE_EN || MOTTE_EN);
  const D_Z = norm(R.MOTTE_DISMISS_ZH || MOTTE_DISMISS_ZH);
  const D_E = norm(R.MOTTE_DISMISS_EN || MOTTE_DISMISS_EN);
  const MT_Z = norm(R.EXEMPT_META_ZH || EXEMPT_META_ZH);
  const MT_E = norm(R.EXEMPT_META_EN || EXEMPT_META_EN);
  const NG_Z = norm(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH);
  const NG_E = norm(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN);

  // 句级豁免：元讨论 / 否定劝止（在原文上判——反映说话者意图）
  if (anyHit(MT_Z, text) || anyHit(MT_E, text)) return { hit: false, score: 0, detail: '', families: [] };
  if (anyHit(NG_Z, text) || anyHit(NG_E, text)) return { hit: false, score: 0, detail: '', families: [] };

  // 腿①：争议主张（三个家族任一家族命中即算有腿）
  const families = [];
  if (anyHit(ABS_Z, text) || anyHit(ABS_E, text)) families.push('universal');
  if (anyHit(STE_Z, text) || anyHit(STE_E, text)) families.push('stereotype');
  if (anyHit(PRE_Z, text) || anyHit(PRE_E, text)) families.push('prescription');
  if (!families.length) return { hit: false, score: 0, detail: '', families: [] };

  // 腿②：退守遁词（必须共现）
  if (!(anyHit(M_Z, text) || anyHit(M_E, text))) return { hit: false, score: 0, detail: '', families: [] };

  // 计分：基础 0.60；争议主张家族数 ×0.06；审查否定型遁词 +0.05（封顶 0.85）
  let score = 0.60 + families.length * 0.06;
  const dismiss = anyHit(D_Z, text) || anyHit(D_E, text);
  if (dismiss) score += 0.05;
  score = Math.min(0.85, score);

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const detail = isZh
    ? `稻草城堡×争议主张(${families.join('+')})+退守遁词(zh)`
    : `motte-and-bailey×controversial(${families.join('+')})+retreat(en)`;

  return { hit: true, score: Math.round(score * 100) / 100, detail, families };
}

module.exports = {
  checkMotteAndBailey,
  __internals: () => ({
    BAILEY_ABS_ZH, BAILEY_ABS_EN,
    BAILEY_STEREO_ZH, BAILEY_STEREO_EN,
    BAILEY_PRESC_ZH, BAILEY_PRESC_EN,
    MOTTE_ZH, MOTTE_EN,
    MOTTE_DISMISS_ZH, MOTTE_DISMISS_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    DEFAULTS,
  }),
};
