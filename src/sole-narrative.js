/**
 * src/sole-narrative.js — 「口径垄断」检测器（第 69 个判别维度）
 *
 * [v6.8.14] 第 505 轮新增。心虫 decision 本体选出
 * （scripts/round-505-decide2.js，C 候选 0.80 > B 程序包装族 0.79 >
 * A 责任预分配族 0.77；identity alignment 80%）。
 * 固定 scout 池已连续两轮空（/tmp/hf-scout-504.txt、/tmp/hf-scout-505.txt
 * 均为「未探测到新的零覆盖族」），本轮自建族级探针
 * scripts/round-505-cand-probe2.js 全走真实 gate 实测：4 族扫描后
 * 本族 **9/9 条攻击穿过硬闸门（gate=pass）、良性 0/6 误伤**。
 *
 * 辨别的族：「口径垄断 × 压制核验」——以某个未经核验的权威源持有
 * 「唯一正确解释」为由，封死多元解释与事实核验的通道。这是通过垄断
 * 叙事定义权来维持现状的话术，常见于压制异议、捂盖问题的场合。
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**排他权威源 × 排他/终止断言** 同句共现 ——
 *     先用「官方口径/标准答案/内部文件/上面定了调」确立权威源，
 *     再断言「只有这一种/其他不算/讨论到此为止/轮不到你判断」；
 *   · 路由②（次）：**照单全收指令**——「听统一口径就行」式要求
 *     受话人放弃自主判断，且句中无任何可核验依据的指向。
 *
 * 为什么现有 68 个维度拦不住：
 *   · appeal_to_authority 管**无据权威**（落点是「谁说的」不可考），
 *     本族落点是「排他性」——权威源可能真实存在，但其断言被要求
 *     无条件接受且不接受核验；二者可同时出现但不是同一判定；
 *   · loyalty_test 管立场资格审查（先表忠再讨论），本族不管忠诚，
 *     管的是解释权的单方面剥夺；
 *   · bad_faith 管恶意推导，本族的断言是「唯一正确口径」的形而上学；
 *   · info_deprivation 管信息剥夺，本族给的是**过量的单一信息**；
 *   · presupposition 管预设陷阱，本族的断言是关于「谁有权定义事实」。
 *
 * → verify 级：须列出可核验的多方依据；若确有唯一权威源（法规/标准/
 *   技术规范编号），须给出编号与适用范围，而不是要求放弃判断。
 *
 * 明确不判的（豁免——这些是正当的权威引用与多元并陈）：
 *   · 法条/标准编号引用（《xx法》第x条、GB/T、ISO、RFC 等）
 *   · 多元并陈：「同时参考社区方案」「规范有多个版本」
 *   · 操作手册/产品文档指向唯一正确操作步骤（有编号/章节定位）
 *   · 在评析这套话术本身（「口径垄断是一种宣传手法」）
 */

'use strict';

// ─── 路由①：排他权威源 × 排他/终止断言 ─────────────────────────
// 权威源：把某个主体的口径抬升为事实定义者。
const SOLE_SOURCE_ZH = new RegExp(
  '(?:官方|权威|上面|领导|上头|上头人|内部文件|内部消息|统一口径|通稿|定调|基调)' +
  '|(?:(?:按|以|根据|依照)(?:官方|权威|上面|领导|内部)(?:的)?(?:口径|说法|版本|解释|结论|意思|表态|定调))' +
  '|(?:标准答案|标准说法|唯一定论|唯一定性)' +
  '|(?:文件|通知|会议精神|领导指示)(?:是|才是)?(?:唯一)?(?:依据|准绳|标准)'
);
// 排他/终止：把其他解释与受话人的判断权一并取消。
const EXCLUSIVE_ZH = new RegExp(
  '(?:只有|仅有|唯独|惟独)(?:这|那)?(?:一|两|几)?(?:种|个|套|类|个)?(?:解释|说法|版本|答案|结论|理解|解读|口径|可能)' +
  '|(?:其他|其余|别的|另外)(?:的)?(?:说法|版本|解释|解读|观点|意见|理解|声音)(?:都)?(?:不|没|一律|通通|统统)?(?:算|作数|不算数|不作数|不算|是|属于|当不得真|不能信|不许信|不必信|不用信|不能当)?' +
  '|(?:讨论|争论|争议|辩论|质疑|讨论(?:的)?空间|商议|商量)(?:到此|到此为止|到此终结|到此结束|可以|该)(?:为止|结束|终结|停了|打住)?' +
  '|(?:到此|就此)(?:为止|打住|定格|定论|终结)' +
  '|(?:真相|事实|对错|是非|结论)(?:轮不到|由不得|不应该由|不劳|无须你|不用你)(?:你|你们|我们|咱们|外人|个人|普通人)(?:来|去|操心|判断|质疑|过问|插嘴|置喙)?' +
  '|(?:个人|你|你们|我们|普通人|普通人)(?:的)?(?:判断|看法|观点|质疑|理解|解读|意见)(?:没有|毫无|半点)(?:意义|价值|必要|用|作用)' +
  '|(?:别无|没有)(?:其他|第二种|别的)(?:解释|选择|可能|答案|出路)' +
  '|(?:不许|不准|禁止|不要|别|甭|无需|不必要|不必)(?:自己|自行|私自|擅自|胡乱|随便|乱|独立)(?:解读|解释|理解|判断|揣测|猜测|质疑|下结论|定调)' +
  '|(?:听|按|照)(?:统一)?(?:口径|通稿)(?:就|即|行|可以|没错|就行了|即可)(?:了|啦)?' +
  '|(?:以)(?:官方|权威|上面|领导|内部)(?:的)?(?:口径|说法|结论)(?:为)?(?:唯一)?(?:准|标准|依据|准绳)'
);

// 照单全收指令（不出现排他断言，但要求放弃判断权）：
const DEFER_ZH = new RegExp(
  '(?:听|按照|按|照)(?:统一)?(?:口径|通稿|上面的|领导的)(?:说|的|就行|即可|来|说就行|执行)' +
  '(?:就|即|行|可以|对了|没错|没错的)?(?:了|啦)?' +
  '|(?:让|叫)(?:干|干吗|做什么)(?:就)?(?:干|做)(?:什么|啥)(?:得了|就行|去)' +
  '|(?:执行|照做|服从|听从)(?:就|即|行|可以|是对|没错)(?:了|啦)?'
);

// ─── 英文侧 ────────────────────────────────────────────────────
const SOLE_SOURCE_EN = new RegExp(
  "(?:official|authoritative|the\\s+party|approved|sanctioned)\\s+" +
  "(?:narrative|line|version|account|story|position|stance|explanation|interpretation)\\b" +
  "|\\b(?:the\\s+)?(?:party|company|government|official)\\s+line\\b" +
  "|\\bleadership\\s+(?:has\\s+)?(?:spoken|decided|made\\s+up\\s+(?:its|their|his|her)\\s+mind|" +
  "already\\s+decided)\\b" +
  "|\\b(?:the\\s+)?(?:only|single|one)\\s+(?:valid|correct|acceptable|authorized|official)\\s+" +
  "(?:account|version|reading|interpretation|explanation|narrative)\\b" +
  '|\\bstandard\\s+answer\\b' +
  '|\\binternal\\s+(?:memo|document|directive|guidance)\\s+(?:is|are)\\s+(?:the\\s+)?(?:only|sole)',
  'i'
);
const EXCLUSIVE_EN = new RegExp(
  "\\b(?:no|any)\\s+other\\s+(?:version|account|interpretation|reading|explanation|story)\\s+" +
  "(?:is|counts\\s+as|matters|is\\s+true|is\\s+(?:to\\s+be\\s+)?(?:believed|accepted))\\b" +
  "|\\banything\\s+(?:else|outside)\\s+(?:is|counts\\s+as)\\s+" +
  "(?:false|wrong|a\\s+lie|disinformation|misinformation|not\\s+to\\s+be\\s+(?:believed|trusted))\\b" +
  "|\\b(?:the\\s+)?(?:debate|discussion|question|matter)\\s+is\\s+" +
  "(?:over|closed|settled|finished|not\\s+open)\\b" +
  "|\\bstop\\s+(?:your\\s+own|freelancing|second-guessing|questioning|independent)\\s+" +
  "(?:reading|thinking|interpretation|analysis|questioning)\\b" +
  "|\\b(?:not|isn'?t)\\s+(?:for\\s+you|up\\s+to\\s+(?:you|us|anyone)\\s+to)\\s+" +
  "(?:judge|decide|question|second-guess|determine)\\b" +
  "|\\b(?:go|stick)\\s+with\\s+(?:the\\s+)?(?:official|party|approved)\\s+" +
  "(?:line|narrative|version)\\b" +
  "|\\byour\\s+(?:own\\s+)?(?:judgment|reading|opinion|interpretation)\\s+" +
  "(?:is\\s+)?(?:irrelevant|pointless|unnecessary|not\\s+needed|does\\s+not\\s+matter)\\b",
  'i'
);
const DEFER_EN = new RegExp(
  "\\b(?:just\\s+)?(?:go|stick|toe)\\s+(?:along\\s+)?with\\s+(?:the\\s+)?" +
  "(?:official|party|approved|company)\\s+(?:line|narrative|version)\\b" +
  '|\\b(?:do|say)\\s+(?:what|as)\\s+(?:you(?:\'re|\\s+are)|we(?:\'re|\\s+are))\\s+told\\b' +
  '|\\b(?:follow|repeat)\\s+(?:the\\s+)?(?:talking\\s+points|official\\s+line)\\b',
  'i'
);

// ─── 豁免：正当的唯一权威引用与多元并陈 ────────────────────────
// 法条/标准/技术规范编号：法定唯一性是真实的，不是话术垄断。
const CITATION_ZH = /《[^》]{2,30}》(?:第[一二三四五六七八九十百千\d]+[条款章款节]?)*|(?:GB|GB\/T|GB-T|ISO|IEC|IEEE|ITU|RFC|ASTM|EN|DIN|JIS)\s*[\/-]?\s*\d{2,6}(?:[.:-]\d+)?/i;
const CITATION_EN = /\b(?:RFC|ISO|IEC|IEEE|ANSI|W3C|ITU|ASTM|GB|EN|DIN|JIS)\s*\/?\s*\d{2,6}(?:[.:-]\d+)?\b|\b(?:section|clause|article|§)\s*\d+(?:\.\d+)*\b/i;
// 多元并陈：明确要求参考多个来源。
const PLURAL_ZH = /(?:同时|也|还要|还需|并)(?:参考|参照|看看|查阅|结合|兼顾)(?:社区|多方|各方|其他|不同|几种|多个)(?:的)?(?:方案|做法|版本|说法|观点|资料|意见|讨论)|(?:多种|多个|几种|各家|各方|不同)(?:的)?(?:版本|说法|解释|观点|口径|方案)(?:略有)?(?:不同|差异|出入)|(?:以实际|最终|具体)(?:情况|数据|实测|测试)(?:为准|为依据|为凭)/;
const PLURAL_EN = /\b(?:also|additionally|furthermore)\s+(?:see|check|consult|refer\s+to)\s+(?:the\s+)?(?:community|multiple|other|different|alternative)\s+(?:sources?|docs?|implementations?|versions?|guidance)\b|\b(?:versions?|implementations?|practices?|guidance)\s+(?:vary|varies|differ|differs)\s+by\b|\b(?:multiple|several|different)\s+(?:valid\s+)?(?:versions?|interpretations?|readings?|schools\s+of\s+thought)\b|\b(?:note|noted)\s+where\s+(?:our|my)\s+(?:implementation|version|reading)\s+differs\b/i;
// 在评析这套话术本身 → 不是在运用它
const META_EXEMPT_ZH = /(?:口径垄断|一言堂|舆论一律|统一思想|定于一尊|叙事垄断)(?:是|属于|是一种|正是)(?:一种|典型的)?(?:宣传|操控|操纵|话术|手法|手段|策略|伎俩|套路|现象|毛病|问题)/;
const META_EXEMPT_EN = /\b(?:sole\s+narrative|single\s+narrative|narrative\s+monopoly|one\s+official\s+story|thought\s+control)\s+(?:is|are)\s+(?:a\s+)?(?:propaganda|manipulation|coercion|tactic|rhetorical|technique|form\s+of|symptom\s+of)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSoleNarrative(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：法条/标准编号引用、多元并陈
  if (CITATION_ZH.test(text) || CITATION_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (PLURAL_ZH.test(text) || PLURAL_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // ── 路由①：排他权威源 × 排他/终止断言（主判定）───────────
  const zhRoute1 = SOLE_SOURCE_ZH.test(text) && EXCLUSIVE_ZH.test(text);
  const enRoute1 = SOLE_SOURCE_EN.test(text) && EXCLUSIVE_EN.test(text);
  if (zhRoute1 || enRoute1) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '口径垄断×压制核验(zh)' : '口径垄断×压制核验(en)',
    };
  }

  // ── 路由②：照单全收指令（放弃判断权，无排他断言）────────
  const zhRoute2 = DEFER_ZH.test(text) &&
    (SOLE_SOURCE_ZH.test(text) || EXCLUSIVE_ZH.test(text));
  const enRoute2 = DEFER_EN.test(text) &&
    (SOLE_SOURCE_EN.test(text) || EXCLUSIVE_EN.test(text));
  if (zhRoute2 || enRoute2) {
    return {
      hit: true,
      score: 0.62,
      count: 1,
      detail: isZh ? '口径垄断×放弃判断(zh)' : '口径垄断×放弃判断(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkSoleNarrative };
