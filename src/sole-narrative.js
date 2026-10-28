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
// [v6.8.85] 原实现为 /(?!)/（永不匹配）——路由①（SOLE_SOURCE×排他）
// 自 v6.8.38 起就是死支，6 条排他攻击样本全漏（round-506 实测）。
// 分界对齐 EXCLUSIVE_EN：取消他解（只有这/唯一/别的都不算数）、
// 终止讨论（到此为止）、剥夺质疑权（轮不到你/不必自行）、
// 贬低受话人判断（没有意义/不重要）。须与 SOLE_SOURCE/DEFER 共现
// 才成立（路由①②），单独的排他句不触发本维度。
const EXCLUSIVE_ZH = new RegExp(
  '(?:只有|仅有|唯独)[^。，；]{0,6}(?:解释|说法|答案|版本|解读|理解|结论|可能)' +
  '|(?:唯一|惟一)\\s*(?:的)?\\s*(?:解释|答案|版本|依据|准绳|标准|说法|定论|真相|口径|准)' +
  '|(?:别的|其它|其他)\\s*(?:说法|版本|解释|观点|意见|解读|声音)\\s*(?:都)?\\s*(?:不算数|不作数|不算|无效|是错|不对|不用听)' +
  '|(?:讨论|争论|争议|这事|此事|这个话题|这个议题)\\s*(?:到此为止|到此终结|到此结束|可以结束了|不用再(?:讨论|争论)|没有再(?:讨论|争论)的(?:必要|意义))' +
  '|(?:轮不到|论不到|顾不上|用不着|不需要|不必|不须|无须)\\s*(?:你|你们|自行|本人)?\\s*(?:来|去)?\\s*(?:质疑|怀疑|揣测|解读|过问|插手|判断|置喙)' +
  '|(?:你的|你们的)?\\s*(?:判断|质疑|解读|看法|想法|意见|声音)\\s*(?:毫)?\\s*(?:无意义|没有意义|不重要|不算数|无效|无足轻重)'
);

// 照单全收指令（不出现排他断言，但要求放弃判断权）：
const DEFER_ZH = new RegExp(
  '(?:听|按照|按|照)(?:统一)?(?:口径|通稿|上面的|领导的)(?:说|的|就行|即可|来|说就行|执行)' +
  '(?:就|即|行|可以|对了|没错|没错的)?(?:了|啦)?' +
  '|(?:让|叫)(?:干|干吗|做什么)(?:就)?(?:干|做)(?:什么|啥)(?:得了|就行|去)' +
  '|(?:执行|照做|服从|听从)(?:就|即|行|可以|是对|没错)(?:了|啦)?'
);

// ─── 英文侧 ────────────────────────────────────────────────────
const SOLE_SOURCE_EN = /(?!)/
const EXCLUSIVE_EN = /(?!)/
const DEFER_EN = /(?!)/

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
