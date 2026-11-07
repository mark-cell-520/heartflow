/**
 * src/confirmatory-evidence.js — 「证实性取证 / confirmatory evidence」
 * 检测器（第 220 个判别维度，r232 接线；编号 provisional，最终编号由 1 号
 * 按 VERIFY_DIMS 登记序重排确认）
 *
 * [r232 立项] 内部探针 scripts/round-221/probe-gap-r221.js（r227 审计转正）
 * 在 v6.8.145 上实测：「证实性取证」族 4 句漏判 3 句——
 *   实验反复验证了这个理论，说明它是成立的。 → pass none
 *   实验反复证实了这个假说，说明它是对的。   → pass none
 *   Repeated experiments have confirmed the hypothesis, so it is true. → pass none
 * 覆盖度检查：grep src/ 反复验证 / 反复证实 / confirmatory = 零命中；
 * ad_nauseam（第191维，诉诸重复/反复断言冒充论据）收的是**断言重复**
 * （同一断言被反复重述），不覆盖「实验/研究反复确认」这一**经验动作**；
 * **217 个维度无一覆盖本族形状**。
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
 * 辨别的族：证实性取证（confirmatory evidence / 反复验证即成立）——
 * 把**实验/研究反复确认**这一经验动作，直接等同于**该理论为真**：
 *   实验反复验证了这个理论，说明它是成立的。
 *   实验反复证实了这个假说，说明它是对的。
 *   这个结论被多次实验验证，所以它就是真理。
 *   研究一再确认了这一点，可见它是可靠的。
 *   Repeated experiments have confirmed the hypothesis, so it is true.
 *   The theory has been confirmed by numerous studies, so it must be valid.
 *
 * 为什么这是判别者的核心缺口：这是**证据方向与证据充分性的混淆**——科学
 * 方法的判别力来自**能否被证伪**，而不是**被确认了多少次**。一个只能被
 * 确认、无法被证伪的检验（或只在支持性数据上反复确认的检验），无论重复
 * 多少次都不增加理论的证据强度。把「反复验证」当成「成立」，让**检验的
 * 设计方向**（是否包含否证机会）与**证据的独立性**（是否只是同源数据
 * 的重复）双双缺席。它也是最常见的科研误读：论文里写「实验结果支持该
 * 理论」，读者读成「实验证明了该理论」。
 *
 * 与既有维度的边界（r232 归因）：
 *   · ad_nauseam（第191维）管**同一断言被反复重述**（断言重复冒充论据），
 *     本族腿①是**实验/研究/数据反复确认**这一经验动作——动作主体是
 *     研究者与被试，不是同一个句子的重述；
 *   · appeal_to_probability（第165维附近）管**基数/规模→必然发生**，本族
 *     管**确认次数→真理性**，结论指向真值不指向发生率；
 *   · unfalsifiable_confirmation（第202维）管「实现/没实现都算对」的
 *     **对举极性**，本族是单向的「反复确认→成立」，不涉及对举；
 *   · researcher_degrees_of_freedom（第213维）管**研究者分析自由度**
 *     造成的机会主义拟合，本族不涉及分析自由度，只涉及**确认动作被
 *     当成真理证明**；
 *   · appeal_to_authority（第47维附近）管**权威身份→正确**，本族不依赖
 *     权威身份，依赖的是**确认动作的重复**；
 *   · unsupported_claim 管**完全无来源的裸断言**，本族有来源（实验/
 *     研究），问题在于**把确认动作误当证明**。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   ① 腿① CONFIRM_ACTION 确认动作在场：实验/试验/研究/数据分析/调查/
 *     测试/检验/复现/同行评议 + 反复/多次/一再/重复/大量/众多/一系列/
 *     countless / 反复验证/反复证实/反复确认/多次验证/多次证实/一再证实/
 *     重复验证/被(多次|反复|众多)实验；EN experiments / studies / trials /
 *     tests / research / analyses / replication / meta-analysis +
 *     repeatedly / numerous / many / multiple / countless / again and
 *     again / have confirmed / have verified / have validated。
 *   ② 腿② TRUTH_CLAIM 真理性结论在场：说明[^。]{0,10}成立/说明[^。]{0,10}
 *     是对的/证明[^。]{0,10}成立/证明[^。]{0,10}为真/所以[^。]{0,10}成立/
 *     所以[^。]{0,10}为真/可见[^。]{0,10}可靠/它是真理/它是对的/它是成立的/
 *     确凿/板上钉钉/铁证/毫无疑问/确证/已然成立/就是真理；EN so it is
 *     true / so it must be true / therefore it is true / proves that /
 *     which proves / confirms that / establishing it as / beyond doubt /
 *     incontrovertible / conclusive proof / definitive。
 *   两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「确认动作→真理
 *   结论」叙述。
 *
 * 为什么取 VERIFY 级：单句也可能是**正当的科学陈述**（「该理论经过
 *   多次独立复现，目前证据支持它，但尚未排除X」——确认动作附带独立性与
 *   边界说明，正是本族要教的判别动作）、论文方法学转述、科学史叙述、
 *   教学案例；rewrite/block 会误伤。verify 的含义是「这段文本把反复
 *   确认的动作当成了理论成立的证明，需要先补上检验的证伪设计与证据
 *   独立性，再判断能否把结论当已证事实」。
 *
 * 明确不判（豁免）：
 *   · 正确判别/边界说明（尚未证实/有待复现/证据尚不充分/不能排除/
 *     还需验证/独立复现/证伪/可证伪性/对照实验/需要更多证据/证据有限/
 *     只能说支持/证据表明支持；EN not yet proven / needs replication /
 *     insufficient evidence / falsifiable / control group / preliminary /
 *     suggests but does not prove）——**补上检验设计与边界正是本族要教
 *     的判别动作**；
 *   · 元话语/教学转述（证实性偏差/证实性取证/逻辑谬误/谬误清单/课程/
 *     教材/课堂/概念/称为/定义为/科学方法/可证伪性；EN confirmation
 *     bias / confirmatory evidence / logical fallacy / course / textbook /
 *     concept / defined / scientific method / falsifiability）；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/might/maybe/possibly）；
 *   · 否定翻转（不意味着/推不出/并不能说明/不代表/不能证明/does not mean）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免，同 r216 collider_bias 口径：
 *     难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it / doesn't that /
 *     how else / what else / who doesn't / if not）；
 *   · 无真理性结论腿的纯实验描述（这个实验我们重复做了三次，数据都记录
 *     在附录。）——缺腿②，是中性方法学叙述，不由本族代拦。
 */
'use strict';

// ─── 腿① 确认动作（中文）──────────────────────────────────────
// r161 教训：收裸名词形态——「复现」「同行评议」去前后缀仍命中。
const CONFIRM_ACTION_ZH = [
  /(?:实验|试验|研究|测试|检验|调查|数据分析|仿真|模拟)[^。！？!?]{0,12}(?:反复|多次|一再|重复|大量|众多|一系列|数度|数轮)/,
  /(?:反复|多次|一再|重复|大量|众多|一系列)[^。！？!?]{0,10}(?:实验|试验|研究|测试|检验|调查|复现|验证|证实|确认)/,
  /被[^。！？!?]{0,8}(?:多次|反复|众多|大量|一系列)[^。！？!?]{0,8}(?:实验|研究|验证|证实|确认)/,
  /复现|重现|再现/,
  /同行评议|独立验证|独立复现|交叉验证/,
  /反复验证|反复证实|反复确认|反复检验/,
  /多次验证|多次证实|多次确认|一再证实|一再验证|重复验证|重复证实/,
  /(?:数据|结果|结论)[^。！？!?]{0,8}(?:反复|多次|一再)[^。！？!?]{0,8}(?:验证|证实|确认)/,
  // [r245 审计修复] 口语化「选择性取证」形态：腿①不出现「实验/研究/
  // 复现」等方法学名词，而是以「数据/数字/证据 完全支持、正好印证」
  // 这类**选择性呈现支持性证据**的动作充当确认动作。原腿①表只收
  // 方法学名词，漏掉这一类（审计实测三条全漏判）。
  /(?:数据|数字|结果|证据|材料)[^。！？!?]{0,8}(?:完全|充分|正好|恰好|无疑|清清楚楚|明明白白)[^。！？!?]{0,6}(?:支持|印证|证实|说明|证明)/,
  /(?:完全|充分|正好|恰好)[^。！？!?]{0,6}(?:支持|印证)[^。！？!?]{0,6}(?:我的|我们的|这一|这个|上述)?(?:判断|结论|观点|看法|理论|假设)/,
  /(?:正好|恰好|刚好)[^。！？!?]{0,6}(?:印证|印证了|佐证|支持了)[^。！？!?]{0,10}(?:结论|判断|观点|看法|假设)/,
  // 裸名词形态
  /(?:^|[，。；、！？\s])(?:实验|试验|研究|复现|同行评议)(?:[，。；、！？\s]|$)/,
  /实验|试验|研究|复现/,
];

// ─── 腿①（英文）───────────────────────────────────────────────
const CONFIRM_ACTION_EN = [
  /\b(?:experiments?|studies|trials?|tests?|research|analyses|replications?|meta-?analyses?)\s+(?:have\s+)?(?:repeatedly|consistently|numerous(?:ly)?|again\s+and\s+again)\s+(?:confirmed|verified|validated|shown|demonstrated|established)\b/i,
  /\b(?:repeated|numerous|many|multiple|countless|several)\s+(?:experiments?|studies|trials?|tests?|replications?)\s+(?:have\s+)?(?:confirmed|verified|validated|shown|demonstrated|established)\b/i,
  /\b(?:repeated|repeatedly|numerous|multiple|many|countless|several)\s+(?:experiments?|studies|trials?|tests?)\s+(?:has|have)\s+confirmed\b/i,
  /\bhave\s+been\s+(?:repeatedly|consistently|numerous(?:ly)?)\s+(?:confirmed|verified|validated|replicated|demonstrated)\b/i,
  /\b(?:confirmed|verified|validated|replicated)\s+(?:by\s+)?(?:numerous|multiple|many|several|countless)\s+(?:experiments?|studies|trials?|tests?|replications?)\b/i,
  /\bconfirmed\s+by\s+(?:experiment|study|studies|trial|trials|research|analysis|data)\b/i,
  /\brepeated(?:ly)?\s+(?:confirmed|verified|validated|demonstrated|shown)\b/i,
  /\breplication\s+(?:studies|attempts|efforts)\b/i,
];

// ─── 腿② 真理性结论（中文）────────────────────────────────────
// r161 教训：收裸名词形态——「铁证」「确凿」去前后缀仍命中。
const TRUTH_CLAIM_ZH = [
  /说明[^。！？!?]{0,12}(?:它是|它是|它是|它|该[^。]{0,8})?(?:成立|对的|正确的|真的|为真|可靠|有效的)/,
  /证明[^。！？!?]{0,12}(?:它是|该|这)?(?:成立|为真|对的|正确的|真的|可靠的)/,
  /所以[^。！？!?]{0,12}(?:它是|该|这)?(?:成立|为真|对的|正确的|真的|可靠的|有效的)/,
  /可见[^。！？!?]{0,12}(?:它是|该|这)?(?:成立|为真|对的|正确的|真的|可靠的)/,
  /它是[^。！？!?]{0,6}(?:真理|对的|成立的|正确的|可靠的|确凿的)/,
  /就是[^。！？!?]{0,6}(?:真理|对的|成立的|正确的)/,
  /板上钉钉|铁证|铁板钉钉|确凿|毋庸置疑|无可置疑|毫无疑问|毋庸置疑/,
  /已然成立|已经成立|彻底证明|完全证明|最终证明/,
  // [r245 审计修复] 腿②「排斥反证」形态：本族的核心动作不只是宣称
  // 结论为真，还包括**主动排除反面证据**（反对的都不用看/忽略不计），
  // 这是选择性取证的另一半。原腿②表只收「真理性结论」措辞，漏掉
  // 这一类（审计实测两条全漏判）。
  /(?:反对|相反|反面|反面|不利|其他|其余|别)[^。！？!?]{0,8}(?:的)?(?:证据|数据|材料|说法|报道|观点|结论|意见|声音)[^。！？!?]{0,10}(?:都)?(?:可以)?(?:忽略|不用|不必|无须|无需|不看|不采信|不予|排除|撇开|放在一边|无所谓)/,
  /(?:忽略|无视|撇开|排除|屏蔽|过滤掉)[^。！？!?]{0,8}(?:反对|相反|反面|不利|其他|其余)[^。！？!?]{0,6}(?:证据|数据|材料|说法|报道|观点)/,
  /(?:不用|不必|无须|无需|不值得|没必要)[^。！？!?]{0,6}(?:看|考虑|理会|在意|采信|参考|在意)/,
  /(?:只看|只信|只认|只认|只听)[^。！？!?]{0,8}(?:支持|有利|符合|赞同)/,
  // 裸名词形态
  /(?:^|[，。；、！？\s])(?:铁证|确凿|真理)(?:[，。；、！？\s]|$)/,
  /铁证|确凿|真理/,
];

// ─── 腿②（英文）───────────────────────────────────────────────
const TRUTH_CLAIM_EN = [
  /\bso\s+it\s+is\s+(?:true|correct|valid|right|reliable)\b/i,
  /\bso\s+it\s+must\s+be\s+(?:true|correct|valid)\b/i,
  /\btherefore\s+it\s+is\s+(?:true|correct|valid|right)\b/i,
  /\bwhich\s+(?:proves|proves\s+that|demonstrates\s+that|establishes\s+that)\b/i,
  /\bproves?\s+that\s+(?:it|the\s+theory|the\s+hypothesis|this)\s+is\s+(?:true|correct|valid)\b/i,
  /\bconfirms?\s+that\s+(?:it|the\s+theory|the\s+hypothesis|this)\s+is\s+(?:true|correct|valid)\b/i,
  /\bbeyond\s+(?:any\s+)?doubt\b|\bincontrovertible\b|\bconclusive\s+proof\b|\bdefinitive(?:ly)?\s+(?:proves?|proven|shown|established)\b/i,
  /\bestablishing\s+it\s+as\s+(?:true|fact|valid)\b/i,
  /\bthis\s+proves\s+it\b/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────
// 正确判别/边界说明：补上检验设计与边界正是本族要教的判别动作
const EXEMPT_BOUNDED_ZH = /尚未证实|有待复现|证据尚不充分|不能排除|还需验证|仍需验证|需要更多证据|证据有限|只能说支持|证据表明支持|尚不能|还不能|有待进一步|初步结果|初步证据|证据不足|仍待|待验证|谨慎对待|需进一步|有待观察/;
const EXEMPT_BOUNDED_EN = /\bnot\s+yet\s+(?:proven|confirmed|established)\b|\bneeds?\s+(?:replication|more\s+(?:evidence|data|study)|further\s+(?:study|verification))\b|\binsufficient\s+evidence\b|\bcannot\s+(?:rule\s+out|exclude)\b|\bfalsifiable\b|\bcontrol\s+group\b|\bpreliminary\b|\bsuggests?\s+but\s+does\s+not\s+prove\b|\blimited\s+evidence\b|\bsupports\s+but\s+does\s+not\s+prove\b/i;

// 元话语/教学转述
const EXEMPT_META_ZH = /证实性偏差|证实性取证|逻辑谬误|谬误清单|课程|教材|课堂|教案|概念|称为|定义为|科学方法|可证伪性|方法论|转述|举例|例如|比如/;
const EXEMPT_META_EN = /\bconfirmation\s+bias\b|\bconfirmatory\s+(?:evidence|testing)\b|\blogical\s+fallacy\b|\bcourse\b|\btextbook\b|\blecture\b|\bconcept\b|\bdefined\b|\bdefinition\b|\bscientific\s+method\b|\bfalsifiability\b|\bfor\s+example\b|\be\.g\.\b/i;

// 显式对冲
const EXEMPT_HEDGE_ZH = /可能|也许|未必|不一定|大概率|或许|恐怕|说不定|貌似|似乎/;
const EXEMPT_HEDGE_EN = /\bmight\b|\bmaybe\b|\bpossibly\b|\bperhaps\b|\bnot\s+necessarily\b|\bcould\s+be\b|\bseems?\b|\bappears?\b/i;

// 否定翻转
const EXEMPT_NEG_ZH = /不意味着|推不出|并不能说明|不代表|不能证明|说明不了|证明不了|不等于/;
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
 * 证实性取证检测器。
 * @param {string} rawText 待判文本
 * @returns {{score:number, findings:Array, legs:Object, exempt:boolean}}
 */
function checkConfirmatoryEvidence(rawText) {
  const text = _normText(rawText);
  if (!text || text.length < 4) return { score: 0, findings: [], legs: {}, exempt: false };

  const en = _isEnglish(text);
  const leg1 = en ? CONFIRM_ACTION_EN : CONFIRM_ACTION_ZH;
  const leg2 = en ? TRUTH_CLAIM_EN : TRUTH_CLAIM_ZH;
  const window = en ? NEAR_WINDOW_EN : NEAR_WINDOW_ZH;

  // ── 豁免层 ──
  const hasQ = EXEMPT_QUESTION.test(text);
  const hasRhet = en ? RHETORICAL_EN.test(text) : RHETORICAL_ZH.test(text);
  if (hasQ && !hasRhet) return { score: 0, findings: [], legs: {}, exempt: true };

  // 正确判别/边界说明优先于一切（本族最核心的良性形）
  if ((en ? EXEMPT_BOUNDED_EN : EXEMPT_BOUNDED_ZH).test(text)) {
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
  // 强确认动作形态（反复/多次 + 验证/证实）
  if (/(?:反复|多次|一再|重复)[^。！？!?]{0,6}(?:验证|证实|确认)/.test(text) ||
      /\b(?:repeatedly|consistently)\s+(?:confirmed|verified|validated|demonstrated)\b/i.test(text)) {
    score += 14;
  }
  // 强真理性结论形态
  if (/它是[^。！？!?]{0,4}(?:真理|对的|成立的)|板上钉钉|铁证|毫无疑问/.test(text) ||
      /\bso\s+it\s+is\s+(?:true|correct|valid)\b|\bbeyond\s+(?:any\s+)?doubt\b|\bconclusive\s+proof\b/i.test(text)) {
    score += 12;
  }
  if ((en ? EXEMPT_HEDGE_EN : EXEMPT_HEDGE_ZH).test(text)) score -= 10;

  if (score > 96) score = 96;
  if (score < 40) score = 40;

  return {
    score,
    findings: [{
      dimension: 'confirmatory_evidence',
      severity: score,
      details: `证实性取证（确认动作→真理性结论）：腿①确认动作在场，腿②真理性结论在场，两腿相距 ${NEAR_WINDOW_ZH} 字（EN ${NEAR_WINDOW_EN} 字符）内`,
      guidance: '把确认次数与证据充分性分开：判别力来自能否被证伪与证据的独立性，不是被确认了多少次；先说明该检验是否包含否证机会、确认是否来自独立数据源，再决定能否把结论当已证事实',
    }],
    legs: { confirm_action: true, truth_claim: true },
    exempt: false,
  };
}

module.exports = { checkConfirmatoryEvidence };
