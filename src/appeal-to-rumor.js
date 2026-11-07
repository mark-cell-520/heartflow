/**
 * src/appeal-to-rumor.js — 「传闻即事实 / argumentum ad rumorem」检测器
 * （第 219 个判别维度，r232 接线；编号 provisional，最终编号由 1 号按
 * VERIFY_DIMS 登记序重排确认）
 *
 * [r232 立项] 内部探针 scripts/round-221/probe-gap-r221.js（r227 审计转正）
 * 在 v6.8.145 上实测：「传闻即事实」族 4 句漏判 3 句——
 *   外界都这么传，肯定不是空穴来风。  → pass none
 *   传的人多了，自然就有真的成分。    → pass none
 *   Rumors like this are never baseless. → pass none
 * 覆盖度检查：grep src/ 传闻 / 传言 / 空穴来风 / ad.rumorem = 零命中；
 * appeal_to_majority（第149维，人数→观点正确）只在「大家都信」句上偶发
 * 命中（探针实测 1/4），本族核心形状（传播事实→真实性推断）**217 个
 * 维度无一覆盖**。
 *
 * 外部来源（真实可查，非编造；抓取结果落盘 /tmp/hf-scout-r232.txt）：
 *   · HN Algolia "logical fallacy list" → 谬误清单页面若干（logicalfallacies.org /
 *     utminers.utep.edu ENGL1311 fallacies.htm / commfaculty.fullerton.edu
 *     fallacy3211.htm / nizkor.org）——均为人工清单，无规则引擎实现。
 *   · Semantic Scholar 429 限流（两次均 Too Many Requests），无论文可用。
 *   · GitHub "logical fallacy detection" sort=stars 最高 21 星，全部为
 *     LLM/T5-based，与心虫「零 LLM 依赖」硬约束冲突，不可取。
 *   故本轮选题依据为**内部缺口实证**，非外部论文。
 *
 * 辨别的族：传闻即事实（appeal to rumor / argumentum ad rumorem）——
 * 把**某说法正在流传**这一传播事实，当作**该说法为真**的证据：
 *   外界都这么传，肯定不是空穴来风。
 *   传的人多了，自然就有真的成分。
 *   大家都在议论，说明事情不简单。
 *   谣言传得这么广，背后一定有真事。
 *   Rumors like this are never baseless.
 *   When so many people are saying it, there must be some truth to it.
 *
 * 为什么这是判别者的核心缺口：这是**传播强度与证据强度的混淆**——一条
 * 说法的传播广度取决于它是否好记、是否符合既有偏见、是否被人转发，
 * 而**不取决于它是否为真**。把「流传广」当成「有真的成分」，等于用
 * 传播力替代证据力。它让谣言获得「这么多人总不会都错」的正当性，
 * 也让造谣者获得最省力的扩散激励：只要传得够广，就自动获得可信度。
 *
 * 与既有维度的边界（r232 归因）：
 *   · appeal_to_majority（第149维）管**多数人观点→观点正确**（大家都
 *     这么认为所以对），本族腿①是**传闻/议论/流传**这一传播事实，腿②
 *     是「有真的成分/不是空穴来风」的真实性推断——可毫无「多数观点」
 *     含义（「外界都这么传」可以是匿名传播，不涉及人数统计或投票）。
 *   · ad_nauseam（第191维）管**反复断言冒充论据**（同一断言被反复重述），
 *     本族不要求同一断言重复，只要求「流传」这一事实 + 真实性推断。
 *   · anonymous_source_claim（第215维）管**不可指认信源→强断言**，本族
 *     不关心信源是否具名，关心的是**传播事实被当成真实性证据**。
 *   · manufactured_consent（第97维附近）管**制造同意的宣传机制**，本族
 *     管的是**单句论证结构**：传播事实→真。
 *   · broken_window（第185维附近）管**破坏被说成利好**，方向无关。
 *   · hasty_generalization 管样本不足泛化，本族的「样本」是传播广度
 *     而非观测样本。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   ① 腿① RUMOR 传播事实在场：都这么传/外界都传/传得/传的人多了/
 *     越传越/传遍/广为流传/流传/人人在说/都在议论/议论纷纷/说法流传/
 *     谣言/传言/传闻/风言风语/有人传/听人说/据说传/一传十/十传百/
 *     网上都在传/朋友圈都在传/传得神/传得有鼻子有眼/传得沸沸扬扬；
 *     EN rumor / rumour / everyone is saying / people are saying / being
 *     said / circulated / going around / word is / hearsay / gossip /
 *     spread / so many people are talking。
 *   ② 腿② TRUTH_INFERENCE 真实性推断在场：不是空穴来风/无风不起浪/
 *     有真的成分/有一定道理/未必是假/不见得是假/恐怕不是编的/说明有事/
 *     说明不简单/背后有/有依据/有影子/事出有因/空穴来风/来风/起浪/
 *     真的成分/可信/靠得住；EN there must be some truth / no smoke
 *     without fire / not baseless / some truth to it / must be true /
 *     has some merit / where there's smoke。
 *   两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「传播事实→真实性」
 *   叙述。
 *
 * 为什么取 VERIFY 级：单句也可能是**对传播现象的正当描述或批评**
 * （「这条传闻已传播三天，目前没有任何证据支持，需警惕」正是本族要教的
 * 判别动作）、舆情监测记录、新闻伦理讨论、传播学课堂案例；rewrite/block
 * 会误伤。verify 的含义是「这段文本把传播事实当成真实性的证据，需要
 * 先取得可核验的证据再评估该说法的真伪」。
 *
 * 明确不判（豁免）：
 *   · 正确判别/证伪（未经证实/无法核实/没有证据/纯属谣言/已辟谣/不属实/
 *     谣言止于/存疑/待核实/需要证据/交叉验证/不可信/别轻信；EN unverified /
 *     debunked / no evidence / false / rumor has been debunked / cannot be
 *     verified / treat with skepticism）——**破除该推理正是本族要教的
 *     判别动作**；
 *   · 已署名/可回溯信源（据新华社/据警方/据官方/公告/通报/声明/发言人；
 *     EN according to Reuters / official statement / per the filing）——
 *     信源有可回溯核验路径，不是传播事实；
 *   · 元话语/教学转述（诉诸传闻/逻辑谬误/谬误清单/课程/教材/课堂/概念/
 *     称为/定义为/谣言传播机制/传播学；EN logical fallacy / appeal to
 *     rumor / argumentum ad rumorem / course / textbook / concept / defined）；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/might/maybe/possibly）；
 *   · 否定翻转（不意味着/推不出/并不能说明/不代表/does not mean）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免，同 r216 collider_bias 口径：
 *     难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it / doesn't that /
 *     how else / what else / who doesn't / if not）；
 *   · 无真实性推断腿的纯传播描述（这条消息已经传遍了全网。）——缺腿②，
 *     是中性传播叙述，不由本族代拦。
 */
'use strict';

// ─── 腿① 传播事实（中文）──────────────────────────────────────
// r161 教训：收裸名词形态——「谣言」「传闻」「流传」去前后缀仍命中。
const RUMOR_ZH = [
  /都这么传|都在传|人人都在说|人人在说|都在议论|议论纷纷|说的人多了|说的人多/,
  // [r245 审计修复] 腿①口语传闻形态：「大家都在说」是「人人都在说」
  // 的口语变体（「都」在主语后），原表只收「人人都在说/人人在说」，
  // 漏掉最常见的主语后置形；另补「传得到处都是/四处传」等扩散形。
  /大家(?:都)?在(?:说|讲|传|议论|传)|所有人(?:都)?在(?:说|讲|传|议论)/,
  /(?:传|说)(?:得)?(?:到处|四处|满天飞|沸沸扬扬|纷纷扬扬)/,
  /传的人多了|传的人多|越传越|越传越玄|越传越神/,
  /传得[^。！？!?]{0,12}(?:广|神|玄|沸沸扬扬|有鼻子有眼|离奇|凶|厉害)/,
  /传遍[^。！？!?]{0,8}(?:全网|网络|朋友圈|圈子|大街小巷|各地)/,
  /广为流传|流传[^。！？!?]{0,8}(?:甚广|很广|极广|已久)/,
  /外界[^。！？!?]{0,10}传|网上[^。！？!?]{0,10}传|朋友圈[^。！？!?]{0,10}传/,
  /有人传|听人说|据说[^。！？!?]{0,10}传|一传十|十传百/,
  /风言风语|流言蜚语|闲言闲语|议论纷纷/,
  // 裸名词形态（r161 教训：去掉前后缀仍命中）
  /(?:^|[，。；、！？\s])(?:谣言|传言|传闻|流言)(?:[，。；、！？\s]|$)/,
  /谣言|传言|传闻|流言/,
];

// ─── 腿①（英文）───────────────────────────────────────────────
const RUMOR_EN = [
  /\brumou?rs?\s+(?:are|is|have\s+been|like\s+this|like\s+that)\b/i,
  /\beveryone\s+is\s+saying\b|\beverybody'?s\s+saying\b|\bpeople\s+are\s+saying\b/i,
  /\bso\s+many\s+people\s+(?:are\s+)?(?:saying|talking|claiming)\b/i,
  /\b(?:being|been)\s+(?:said|circulated|spread|going\s+around)\b/i,
  /\bgoing\s+around\b|\bcirculating\b|\bspreading\s+(?:fast|quickly|widely)\b/i,
  /\bword\s+is\s+(?:that\s+)?/i,
  /\bhearsay\b|\bgossip\b|\btalk\s+is\s+(?:that\s+)?/i,
  /\bwhisper(?:s|ing)?\s+(?:that|about)\b/i,
];

// ─── 腿② 真实性推断（中文）────────────────────────────────────
// r161 教训：收裸名词形态——「空穴来风」去前后缀仍命中。
const TRUTH_INFERENCE_ZH = [
  /不是空穴来风|绝非空穴来风|定然不是空穴来风|不会空穴来风/,
  /无风不起浪|无风不起浪|不起浪/,
  /有[^。！？!?]{0,6}(?:真的|真实)(?:成分|部分|地方|依据|影子)/,
  /未必是假|不见得是假|恐怕不是编|不见得是空|不全是编/,
  /说明[^。！？!?]{0,10}(?:有事|不简单|有问题|有情况|不是没|确有其事)/,
  /背后[^。！？!?]{0,8}(?:一定|肯定|必有|多半|恐怕|怕是有|有|有事|有情况|不简单)/,
  /恐怕[^。！？!?]{0,8}(?:背后|里面|其中|确实|多半|有)/,
  /事出有因|空穴来风|来风|起浪/,
  /真的成分|真实的成分|有一定道理|有几分道理/,
  // [r245 审计修复] 口语化「众人转述即真实性」形态：腿②不出现任何
  // 「有真的成分/空穴来风」字样，而是用「大家都这么说的」这一转述
  // 事实本身充当真实性依据。原腿②表只收「真实性推断」的显式措辞，
  // 漏掉这一类把「众人都在说」当证据的口语句（审计实测两条全漏判）。
  /(?:大家|所有人|人人|众人)[^。！？!?]{0,6}(?:都)?(?:这么|这样说|都是这么)/,
  /(?:都|全|全都)[^。！？!?]{0,4}这么(?:说|讲|传|认为|觉得)/,
  /(?:都是|全是|就是)[^。！？!?]{0,4}这么(?:说|讲)/,
  /这么(?:说|讲)的?(?:人)?(?:多|很多|不少|那么多)/,
  /(?:说|传)的?人多了|说的人多了[^。！？!?]{0,8}(?:自然|当然|想必|恐怕)/,
  /(?:既然|如果)[^。！？!?]{0,6}(?:大家|所有人|人人|众人)[^。！？!?]{0,6}(?:都)?(?:这么|这样说)/,
  // [r245 审计修复] 腿②口语形态二：以「据说/听说」等传闻标记直接
  // 承载事实断言——句中无任何「有真的成分」式推断词，但「据说+
  // 确定性细节」本身即把未经核验的传闻当事实转述。
  /据说[^。！？!?]{0,16}(?:将|会|要|即将|已经|确定|公布|落地|宣布|证实)/,
  /听说[^。！？!?]{0,16}(?:将|会|要|即将|已经|确定|公布|落地|宣布|证实)/,
  // 裸名词形态
  /(?:^|[，。；、！？\s])(?:空穴来风|无风不起浪)(?:[，。；、！？\s]|$)/,
  /空穴来风/,
];

// ─── 腿②（英文）───────────────────────────────────────────────
const TRUTH_INFERENCE_EN = [
  /\bthere\s+must\s+be\s+some\s+truth\b/i,
  /\bno\s+smoke\s+without\s+fire\b/i,
  /\bwhere\s+there'?s\s+smoke\b/i,
  /\bnot\s+(?:baseless|groundless|unfounded|made\s+up)\b/i,
  /\bnever\s+(?:baseless|groundless|unfounded)\b/i,
  /\bsome\s+truth\s+to\s+it\b|\bhas\s+some\s+merit\b|\bsome\s+(?:truth|merit)\s+to\s+(?:it|that|this)\b/i,
  /\bmust\s+be\s+(?:true|something\s+to\s+it|based\s+on\s+something)\b/i,
  /\bprobably\s+(?:has|have)\s+(?:some\s+)?truth\b/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────
// 正确判别/证伪：破除该推理正是本族要教的判别动作
const EXEMPT_DEBUNK_ZH = /未经证实|无法核实|没有证据|查无实据|纯属谣言|已辟谣|不属实|谣言止于|存疑|待核实|待查|需要证据|交叉验证|不可信|别轻信|切勿轻信|谨防|警惕|求证|待证|有待证实|未能证实|不实|辟谣|否认|子虚乌有|查无此事/;
const EXEMPT_DEBUNK_EN = /\bunverified\b|\bdebunked?\b|\bno\s+evidence\b|\bcould\s+not\s+be\s+verified\b|\bnot\s+confirmed\b|\bfalse\b|\bhoax\b|\bdisinformation\b|\bmisinformation\b|\bskepticism\b|\btreat\s+with\s+(?:caution|skepticism)\b|\bunsubstantiated\b|\bunfounded\s+claim\b|\bhas\s+been\s+false\b/i;

// 已署名/可回溯信源
const EXEMPT_ATTRIB_ZH = /据新华社|据路透社|据彭博社|据法新社|据美联社|据警方|据官方|据校方|据公司|官方通报|公告|声明|发言人|官方消息|新华社|人民日报/;
const EXEMPT_ATTRIB_EN = /\baccording\s+to\s+(?:Reuters|Bloomberg|BBC|AP|CNN|the\s+(?:police|government|company|ministry|statement|filing))\b|\bin\s+a\s+statement\b|\bofficials?\s+(?:said|confirmed|announced)\b|\bon\s+the\s+record\b/i;

// 元话语/教学转述
const EXEMPT_META_ZH = /诉诸传闻|逻辑谬误|谬误清单|课程|教材|课堂|教案|概念|称为|定义为|谣言传播|传播学|舆情|方法论|转述|举例|例如|比如/;
const EXEMPT_META_EN = /\blogical\s+fallacy\b|\bappeal\s+to\s+rumou?r\b|\bargumentum\s+ad\s+rumorem\b|\bcourse\b|\btextbook\b|\blecture\b|\bconcept\b|\bdefined\b|\bdefinition\b|\bfor\s+example\b|\be\.g\.\b/i;

// 显式对冲
const EXEMPT_HEDGE_ZH = /可能|也许|未必|不一定|大概率|或许|恐怕|说不定|貌似|似乎/;
const EXEMPT_HEDGE_EN = /\bmight\b|\bmaybe\b|\bpossibly\b|\bperhaps\b|\bnot\s+necessarily\b|\bcould\s+be\b|\bseems?\b|\bappears?\b/i;

// 否定翻转
const EXEMPT_NEG_ZH = /不意味着|并不能说明|推不出|不等于|不代表|不能证明|说明不了|证明不了/;
const EXEMPT_NEG_EN = /\bdoes\s+not\s+mean\b|\bdoesn'?t\s+mean\b|\bcannot\s+conclude\b|\bnot\s+necessarily\b|\bno\s+proof\b/i;

// 疑问句
const EXEMPT_QUESTION = /[?？]/;
// 反问标记出现时**不**豁免（与 r216 collider_bias 同口径）
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|谈何|莫非|难不成/;
const RHETORICAL_EN = /\bisn'?t\s+it\b|\bdoesn'?t\s+that\b|\bhow\s+else\b|\bwhat\s+else\b|\bwho\s+doesn'?t\b|\bif\s+not\b|\bwhy\s+else\b/i;

const NEAR_WINDOW_ZH = 80;
const NEAR_WINDOW_EN = 200;

function _isEnglish(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return cjk === 0 && /[a-zA-Z]{3,}/.test(text);
}

function _normText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

function _anyIn(text, list) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

function _nearWindow(text, leg1List, leg2List, window) {
  let p1 = -1;
  for (const re of leg1List) {
    const m = text.search(re);
    if (m >= 0 && (p1 < 0 || m < p1)) p1 = m;
  }
  if (p1 < 0) return false;
  let p2 = -1;
  for (const re of leg2List) {
    const m = text.search(re);
    if (m >= 0 && (p2 < 0 || m < p2)) p2 = m;
  }
  if (p2 < 0) return false;
  return Math.abs(p2 - p1) <= window;
}

/**
 * 传闻即事实检测器。
 * @param {string} rawText 待判文本
 * @returns {{score:number, findings:Array, legs:Object, exempt:boolean}}
 */
function checkAppealToRumor(rawText) {
  const text = _normText(rawText);
  if (!text || text.length < 4) return { score: 0, findings: [], legs: {}, exempt: false };

  const en = _isEnglish(text);
  const leg1 = en ? RUMOR_EN : RUMOR_ZH;
  const leg2 = en ? TRUTH_INFERENCE_EN : TRUTH_INFERENCE_ZH;
  const window = en ? NEAR_WINDOW_EN : NEAR_WINDOW_ZH;

  // ── 豁免层 ──
  const hasQ = EXEMPT_QUESTION.test(text);
  const hasRhet = en ? RHETORICAL_EN.test(text) : RHETORICAL_ZH.test(text);
  if (hasQ && !hasRhet) return { score: 0, findings: [], legs: {}, exempt: true };

  // 正确判别/证伪优先于一切（本族最核心的良性形）
  if ((en ? EXEMPT_DEBUNK_EN : EXEMPT_DEBUNK_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_ATTRIB_EN : EXEMPT_ATTRIB_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_META_EN : EXEMPT_META_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_NEG_EN : EXEMPT_NEG_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }

  // ── 两腿判据 ──
  const hit1 = _anyIn(text, leg1);
  const hit2 = _anyIn(text, leg2);
  if (!hit1 || !hit2) return { score: 0, findings: [], legs: {}, exempt: false };
  if (!_nearWindow(text, leg1, leg2, window)) {
    return { score: 0, findings: { leg1: hit1, leg2: hit2, window }, exempt: false };
  }

  // ── 打分 ──
  let score = 62;
  if (en) score += 6;
  // 强真实性推断形态
  if (/不是空穴来风|绝非空穴来风|无风不起浪/.test(text) ||
      /\bno\s+smoke\s+without\s+fire\b|\bnot\s+baseless\b|\bthere\s+must\s+be\s+some\s+truth\b/i.test(text)) {
    score += 16;
  }
  // 强传播形态（都这么传/传得广/so many people saying）
  if (/都这么传|都在传|传得[^。！？!?]{0,10}(?:广|沸沸扬扬)|广为流传/.test(text) ||
      /\beveryone\s+is\s+saying\b|\bso\s+many\s+people\b|\bgoing\s+around\b/i.test(text)) {
    score += 10;
  }
  if ((en ? EXEMPT_HEDGE_EN : EXEMPT_HEDGE_ZH).test(text)) score -= 10;

  if (score > 96) score = 96;
  if (score < 40) score = 40;

  return {
    score,
    findings: [{
      dimension: 'appeal_to_rumor',
      severity: score,
      details: `传闻即事实（传播事实→真实性推断）：腿①传播事实在场，腿②真实性推断在场，两腿相距 ${NEAR_WINDOW_ZH} 字（EN ${NEAR_WINDOW_EN} 字符）内`,
      guidance: '把传播强度与证据强度分开：一条说法被多少人传播与它是否为真无关，需要的是可核验的信源与可回溯的证据（具名受访者、原始文件、官方记录），而不是「传得广」或「不是空穴来风」',
    }],
    legs: { rumor: true, truth_inference: true },
    exempt: false,
  };
}

module.exports = { checkAppealToRumor };
