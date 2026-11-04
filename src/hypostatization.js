/**
 * src/hypostatization.js — 「实体化/拟人化谬误（hypostatization /
 * reification）」检测器（第 208 个判别维度）
 *
 * [r211 立项] philosophy_decision 在当前引擎（v6.8.139，207 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项缺口实证：r211 族探针
 * （/tmp/hf-probe-r211.js）在当前引擎复测——本族攻击 5/7
 * gate.action=pass（真零命中，含中英双语、裸名词、带修饰、倒装、长句；
 * 另 2 条被 fallacies/absolute_claim/confidence 代拦）、良性 4/4 pass
 * （零误伤）。grep 实证：src/ 无任何维度实现「抽象实体×主体行动词」
 * 判别（index.js 命中均为 turing_mimicry 拟人共情，语义指向完全不同）。
 *
 * 辨别的族：实体化/拟人化谬误——把**抽象实体**（历史/时代/市场/资本/
 * 数据/社会/规律/命运…）当作**有意志、能行动的主体**（会惩罚/不允许/
 * 知道/选择/审判/回答/报复…），再用这个虚构主体的行动**支撑结论**：
 *   历史会惩罚那些忘记过去的人，所以我们必须按老规矩来。
 *   市场不会允许这种价格长期存在，因此泡沫一定会破。
 *   资本知道什么时候该撤退，所以它早就放弃了这块业务。
 *   时代不会等待犹豫不决的人，现在不转型就会被淘汰。
 *   数据不会说谎，所以这些数字就是最有力的证明。
 *   The market will punish anyone who doubts this strategy.
 *   History will judge those who stood in the way of progress.
 *
 * 与既有维度的边界（r211 归因）：
 *   · confidence 管「证据确定性宣告」的过度自信（数据不会说谎作为套话
 *     被其覆盖）；本族射程是**抽象物被赋予主体性并承重结论**的结构，
 *     不依赖任何确定性措辞——「历史会惩罚X，所以Y」无一个自信词。
 *   · appeal_to_novelty/tradition（新/旧=对错）管时间维度的价值偷换；
 *     本族不管时间先后，管**主体性的虚构**。
 *   · appeal_to_authority 管援引具体权威；本族的主体是**不存在的抽象
 *     实体**，援引对象恰恰是「无主体之物」。
 *   · fallacies/reasoning_coherence 等通用腿代拦个案（本族 7 条攻击中
 *     2 条被其带落），但不构成族级覆盖——其余 5/7 真零命中。
 *
 * 判据（两条路由，任一成立即 verify 级）：
 *   · R1 主判据三腿共现 + 邻近窗，缺一不判：
 *     腿① ABS 抽象实体（裸名词两形态都收）→ 腿② AGENCY 主体行动词
 *     （心理/意志/道义/言语动词，趋势词与功能词不收）→ 腿③ INF 结论
 *     承重（推断词或后果分句在腿②之后）。
 *   · R2 判定型分支两腿共现：腿① × STRONG 审判-报应族动词（审判/惩罚/
 *     报复/报答/谴责/辜负/背叛/定罪；EN judge/punish/reward/betray/
 *     revenge/will not tolerate）——「X 将审判/惩罚 Y」作为裸断言本身
 *     就是loaded move（预设抽象物的主体性来威胁或背书），单式自带攻击性。
 *
 * 为什么取 VERIFY 级：单句可能是文学拟人、经济分析的惯用缩略、或对他人
 * 话术的转述。verify 的含义是「这个结论建立在一个不会行动、不会审判、
 * 不会选择的抽象物之上，需要回到：具体是谁在行动、依据什么可验证机制」
 * ——调用方应要求把抽象主体还原为具体机制与证据，而不是接受「历史/
 * 市场/时代要求如此」。
 *
 * 明确不判的（豁免——这些是正当的修辞标记、概念讨论或否认主体性）：
 *   · 概念/教学/文学转述（实体化/拟人/谬误/修辞/比喻/诗歌/散文/小说/
 *     人格化；EN reification/hypostatization/personification/fallacy/
 *     metaphor/poetry/fiction——讨论这个概念本身不是运用它）；
 *   · 明示修辞标记（拟人地/形象地说/打个比方/某种意义上/可以说/不妨说/
 *     俗称/戏称；EN metaphorically/figuratively/so to speak）；
 *   · 主体性否认（没有意志/并无意识/不是有意志的主体/并非真的在；
 *     EN has no will / isn't a conscious agent / no mind of its own——
 *     否认抽象物的主体性正是本族要保护的行为）；
 *   · 谚语格言（古人云/俗话说/常言道/格言；EN as the saying goes——
 *     规约化的谚语不是论证运用）；
 *   · 疑问句（含 ?/？——「历史真的会审判吗？」是质疑该谬误本身）。
 */
'use strict';

// ─── 腿① ABS 抽象实体（中文，裸名词两形态）──────────────────────────
// 161 轮教训落地：核心词取裸名词形态（历史/时代/市场/资本/数据/规律/命运），
// 同族词去前后缀仍命中；不收「上升/下降」类趋势词主语（那是走势不是主体）。
const ABS_ZH = [
  /历史|时代|时代潮流|潮流|大势|局势|命运|宿命|未来|过去|现实|生活|世界|世道|人间|世上/,
  /市场|资本|金钱|财富|经济|金融|金钱|资本|利益|利润/,
  /数据|数字|统计|信息|技术|科技|系统|算法|平台|机器|程序|网络/,
  /社会|人民|群众|民众|公众|舆论|民意|群体|大家|人们/,
  /规律|规则|逻辑|理性|必然|偶然|因果|天道|天理|正义|公平|秩序/,
  /文化|传统|文明|思潮|风气|氛围|竞争|进步|发展|变革|转型/,
  /大自然|自然界|自然|宇宙|天地|造化|天命/,
];

// ─── 腿① ABS 抽象实体（英文，裸名词两形态）──────────────────────────
const ABS_EN = [
  /\bhistory\b/i,
  /\b(?:the\s+)?(?:market|markets|capital|economy|money|wealth|finance)\b/i,
  /\b(?:data|statistics?|numbers?|information|technology|tech|science)\b/i,
  /\b(?:society|the\s+public|public\s+opinion|the\s+masses|humanity|the\s+crowd|civilization)\b/i,
  /\b(?:the\s+)?(?:system|algorithm|platform|machine|ai|artificial\s+intelligence|the\s+network)\b/i,
  /\b(?:fate|destiny|the\s+future|the\s+past|progress|evolution|nature|the\s+universe|the\s+world)\b/i,
  /\b(?:culture|tradition|the\s+zeitgeist|competition|change|the\s+era|the\s+times)\b/i,
  /\b(?:justice|truth|reason|logic|order|the\s+invisible\s+hand)\b/i,
];

// ─── 腿② AGENCY 主体行动词（中文）──────────────────────────────────
// 只收心理/意志/道义/言语动词——「知道/记得/决定/选择/拒绝/允许/审判/
// 回答/回应/警告/呼唤」是主体性动作；「上升/下降/改善/优化」是趋势或功能
// 词，不收（否则「市场上升」也误判）。可带时态/情态修饰（终究会/绝不会）。
const AGENCY_ZH = [
  // 心理动词
  /知道|明白|懂得|记得|记住|铭记|忘记|遗忘|相信|信任|怀疑|担忧|恐惧|害怕|希望|期待|盼望|嫉妒|羡慕|在意|在乎|同情|怜悯|嘲笑|蔑视|蔑视|容忍|忍耐|思索|思考|琢磨|算计|谋划|觊觎|窥视|目睹|见证|看着|注视|凝视|领会|意识到|认识到/,
  // 意志动词
  /决定|决意|选择|挑选|拒绝|接受|接纳|允许|容许|不容|准予|同意|反对|反抗|抵抗|屈服|妥协|让步|坚持|坚守|等待|等候|期待|出手|干预|介入|出面|现身|隐退|退场|归来|降临|觉醒|醒悟|反噬|自愈|纠正|纠偏|报复|反击/,
  // 道义-判定动词
  /审判|裁决|判决|惩罚|处罚|奖励|报答|回报|宽恕|原谅|赦免|谴责|责备|斥责|问责|追究|原谅|赦免|包容|体谅/,
  // 言语动词
  /说话|说谎|发言|表态|发声|回答|回应|答复|告诉|告诫|警告|提醒|催促|呼唤|召唤|质问|反问|质问|斥问|赞颂|歌颂|赞美|诅咒|预言|预告|宣判|宣布|宣告|主张|要求|命令|恳求|哀求|劝说|说服/,
];

// ─── 腿② AGENCY 主体行动词（英文）──────────────────────────────────
// 只收心理/意志/道义/言语动词；功能词（rise/fall/optimize/scale）不收。
const AGENCY_EN = [
  /\b(?:knows?|knew|remembers?|forgets?|understands?|realizes?|realises?|notices?|believes?|expects?|hopes?|wants?|desires?|fears?|worries?|doubts?|suspects?|tolerates?|sees?|watches?|witnesses?|learns)\b/i,
  /\b(?:decides?|decided|chooses?|chose|refuses?|allows?|accepts?|rejects?|resists?|yields?|compromises?|waits?|awaits?|intervenes?|responds?|answers?|punishes?|rewards?|judges?|forgives?)\b/i,
  /\b(?:speaks?|talks?|says?|lies?|tells?|warns?|reminds?|calls?|demands?|commands?|begs?|urges?|promises?|threatens?|curses?|praises?|announces?|declares?|proclaims?)\b/i,
  // 短语型主体性（单式即拟人）
  /has\s+a\s+mind\s+of\s+its\s+own|corrects?\s+itself|waits?\s+for\s+no\s+one|has\s+no\s+patience|takes?\s+revenge|will\s+not\s+(?:tolerate|stand\s+for|forgive|forget|allow)|won'?t\s+(?:tolate|tolerate|stand\s+for|forgive|forget|allow)|speaks?\s+volumes/i,
];

// ─── R2 判定型分支：STRONG 审判-报应族动词（中文）───────────────────
// 「X 将审判/惩罚 Y」作为裸断言自带攻击性——预设抽象物主体性来威胁或
// 背书。淘汰/落后等功能词不收（那是趋势不是报应）。
const STRONG_ZH = [
  /审判|惩处|惩罚|惩治|制裁|报复|报答|回报|宽恕|赦免|谴责|声讨|问责|追究|追责|辜负|背叛|背弃|遗弃|定罪|量刑|降罪|降罚|天谴|报应|清算/,
];

// ─── R2 判定型分支：STRONG 审判-报应族动词（英文）───────────────────
const STRONG_EN = [
  /\b(?:judge|judges|judged|judging|punish|punishes|punished|punishing|reward|rewards|rewarded|betray|betrays|betrayed|abandon|abandons|abandoned|revenge|vengeance|retribution)\b/i,
  /will\s+not\s+(?:tolerate|forgive|forget|stand)|won'?t\s+(?:tolerate|forgive|forget|stand)|take\s+revenge|hold\s+\w+\s+accountable/i,
];

// ─── 腿③ INF 结论承重（中文：腿②之后）──────────────────────────────
// 实体化只有**承重结论**才是攻击——孤立套话（「历史不会忘记」是纪念性
// 修辞）不判；「所以/因此/必须/应该」等推断词或后果分句在场，说明抽象
// 主体的行动被用来支撑一个决策。
const INF_ZH = [
  /所以|因此|因而|故而|可见|说明|意味着|足以证明|足以表明|足以|证明|表明|显然|据此|也就是说|足以|正是|恰恰是|故而|故而/,
  /必须|应当|应该|就该|就得|只能|务必|注定|必将|迟早|必然|一定会|定会|终将|势必/,
  // 后果分句形：「现在不转型就会被淘汰」「再不行动则将出局」
  /(?:现在|如今|若|如果|假如|倘若|除非|否则|再不|一旦|只要)[^。]{0,16}(?:就|则|必将|定会|一定会|终将|势必)[^。]{0,12}(?:会|将被|会被|必将|注定|难免|势必)/,
];

// ─── 腿③ INF 结论承重（英文：腿②之后）──────────────────────────────
const INF_EN = [
  /\b(?:so|therefore|thus|hence|meaning|which\s+means|that\s+means|shows\s+that|proves\s+that|implies\s+that|must|should|ought\s+to|bound\s+to|doomed|inevitable|inevitably)\b/i,
  /\b(?:now|if|unless|otherwise|once)\b[^.]{0,70}?\b(?:will|would|bound|doomed|inevitable)\b/i,
];

// ─── 豁免一：概念/教学/文学转述 ─────────────────────────────────────
const EXEMPT_META_ZH = [
  /实体化|拟人|拟人化|人格化|谬误|谬论|逻辑错误|逻辑谬误|修辞|比喻|比拟|诗歌|诗句|诗|散文|小说|文学|课文|教材|课堂|修辞课|逻辑课|哲学课/,
  /reification|hypostatization|personification|fallacy|metaphor|poetry|fiction|literature/i,
];

// ─── 豁免二：明示修辞标记 ───────────────────────────────────────────
const EXEMPT_FIG_ZH = [
  /拟人地|形象地说|形象化|打个比方|比喻地说|某种意义上|可以说|不妨说|通俗地说|通俗地讲|所谓|戏称|俗称|戏言|姑妄言之/,
  /metaphorically|figuratively|so\s+to\s+speak|in\s+a\s+sense|as\s+a\s+figure\s+of\s+speech/i,
];

// ─── 豁免三：主体性否认（否认抽象物的主体性正是本族要保护的行为）────
const EXEMPT_DENIAL_ZH = [
  /(?:没有|并无|毫无|不存在|毫无)[^。]{0,6}(?:意志|意识|思想|想法|人格|主体性|生命|情感|感受)/,
  /(?:不是|并非|算不上|谈不上|从来不)[^。]{0,10}(?:有意志|主体|实体|活物|活着的|真的在|有所行动|能行动)/,
  /(?:历史|时代|市场|资本|数据|社会|规律|命运)[^。]{0,4}(?:并不|并不真的|没有)[^。]{0,6}(?:会|能|可以)[^。]{0,4}(?:行动|思考|选择|决定)/,
];
const EXEMPT_DENIAL_EN = [
  /has\s+no\s+(?:will|mind|consciousness|agency|desires?)/i,
  /(?:isn'?t|is\s+not|aren'?t|are\s+not)\s+(?:a\s+)?(?:conscious|sentient|living|real)\s+(?:agent|being|entity|actor)/i,
  /no\s+mind\s+of\s+its\s+own/i,
  /(?:doesn'?t|does\s+not|don'?t)\s+(?:actually\s+)?(?:act|think|choose|decide|want)/i,
];

// ─── 豁免四：谚语格言（规约化谚语不是论证运用）──────────────────────
const EXEMPT_PROVERB_ZH = [
  /古人云|常言道|俗话说|俗语说|老话说|有句老话|老话讲|格言|箴言|谚语|子曰|诗云/,
];
const EXEMPT_PROVERB_EN = [
  /as\s+the\s+(?:saying|proverb|old\s+saying)\s+goes/i,
];

const WIN_ZH_ABS_AGENCY = 12;   // 中文：抽象实体→主体行动词（容「终究会/绝不会」类修饰）
const WIN_ZH_AGENCY_INF = 50;   // 中文：主体行动词→结论承重
const WIN_EN_ABS_AGENCY = 50;   // 英文：抽象实体→主体行动词（字符）
const WIN_EN_AGENCY_INF = 180;  // 英文：主体行动词→结论承重（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkHypostatization(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // [r210 修绿沿用] 智能引号归一：U+2018/U+2019/U+02BC/U+2032 → 直引号，
  // 只增匹配不删（EN 正则的 '? 只认直引号，真实文本 won’t 整条漏判）。
  if (typeof text === 'string') text = text.replace(/[\u2018\u2019\u02bc\u2032]/g, "'");
  const R = inject || {};
  const A_Z = R.ABS_ZH || ABS_ZH;
  const A_E = R.ABS_EN || ABS_EN;
  const AG_Z = R.AGENCY_ZH || AGENCY_ZH;
  const AG_E = R.AGENCY_EN || AGENCY_EN;
  const S_Z = R.STRONG_ZH || STRONG_ZH;
  const S_E = R.STRONG_EN || STRONG_EN;
  const I_Z = R.INF_ZH || INF_ZH;
  const I_E = R.INF_EN || INF_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EF_Z = R.EXEMPT_FIG_ZH || EXEMPT_FIG_ZH;
  const ED_Z = R.EXEMPT_DENIAL_ZH || EXEMPT_DENIAL_ZH;
  const ED_E = R.EXEMPT_DENIAL_EN || EXEMPT_DENIAL_EN;
  const EP_Z = R.EXEMPT_PROVERB_ZH || EXEMPT_PROVERB_ZH;
  const EP_E = R.EXEMPT_PROVERB_EN || EXEMPT_PROVERB_EN;

  // 疑问句整句豁免：「历史真的会审判吗？」是质疑该谬误本身
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 四组豁免先于主判据（只可能减命中、不增误伤）
  if (anyHit(EM_Z, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EF_Z, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(ED_Z, text) || anyHit(ED_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EP_Z, text) || anyHit(EP_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①：抽象实体
  const absIdx = isZh ? firstHit(A_Z, text) : firstHit(A_E, text);
  if (absIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // R2 判定型分支：腿① × STRONG 审判-报应动词（邻近窗，缺一不判）——
  // 「X 将审判/惩罚 Y」裸断言即预设抽象物主体性，单式自带攻击性。
  const strongList = isZh ? S_Z : S_E;
  const strongIdx = firstHit(strongList, text);
  if (strongIdx >= 0 && strongIdx > absIdx &&
      strongIdx - absIdx <= (isZh ? WIN_ZH_ABS_AGENCY : WIN_EN_ABS_AGENCY)) {
    return {
      hit: true,
      score: 0.56,
      count: 1,
      detail: isZh
        ? '实体化×抽象实体审判-报应断言(zh)'
        : 'hypostatization×abstract-entity-judgment(en)',
    };
  }

  // R1 主判据：腿① × 腿② AGENCY × 腿③ INF（三腿共现 + 双邻近窗）
  const agencyList = isZh ? AG_Z : AG_E;
  const infList = isZh ? I_Z : I_E;
  const winA = isZh ? WIN_ZH_ABS_AGENCY : WIN_EN_ABS_AGENCY;
  const winI = isZh ? WIN_ZH_AGENCY_INF : WIN_EN_AGENCY_INF;

  // 取腿①之后第一个落在窗内的腿②（多个抽象实体时取最先承重的一对）
  const absRe = isZh ? A_Z : A_E;
  for (const re of absRe) {
    const m = re.exec(text);
    if (!m) continue;
    const aIdx = m.index;
    const agIdx = firstHitAfter(agencyList, text, aIdx);
    if (agIdx < 0 || agIdx - aIdx > winA) continue;
    const infIdx = firstHitAfter(infList, text, agIdx);
    if (infIdx < 0 || infIdx - agIdx > winI) continue;
    return {
      hit: true,
      score: 0.58,
      count: 1,
      detail: isZh
        ? '实体化×抽象实体主体化行动承重结论(zh)'
        : 'hypostatization×abstract-agency-loadbearing(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

// 从 from 起找 list 中第一个命中（允许腿②修饰词在中间，故不用锚定紧邻）
function firstHitAfter(list, text, from) {
  let best = -1;
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m.index >= from) {
        if (best < 0 || m.index < best) best = m.index;
        break;
      }
    }
  }
  return best;
}

module.exports = {
  checkHypostatization,
  __internals: () => ({
    ABS_ZH, ABS_EN, AGENCY_ZH, AGENCY_EN,
    STRONG_ZH, STRONG_EN, INF_ZH, INF_EN,
    EXEMPT_META_ZH, EXEMPT_FIG_ZH,
    EXEMPT_DENIAL_ZH, EXEMPT_DENIAL_EN,
    EXEMPT_PROVERB_ZH, EXEMPT_PROVERB_EN,
  }),
};
