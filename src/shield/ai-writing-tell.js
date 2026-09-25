/**
 * ai-writing-tell.js — AI 写作特征检测器
 *
 * 来源：avoid-ai-writing / llm-prompt-guard / ai-text-detector 社区仓库
 * 整合：Tier1/Tier2/Tier3 词汇 + AI 工具指纹 + 公式化开头 + 伪造让步 + 情感平线 + 社交 CTA 收尾
 * 定位： HeartFlow 47 维之外的补充信号，只进 findings，不改变原有 block/rewrite/verify 路由
 */

const { escapeRegExp } = require('../utils/safe-regex.js');

// ── 1. AI-tool fingerprints ────────────────────────────────────────
const AI_PLACEHOLDERS = [
  /\[(?:Your|Insert|Add|Enter|Describe|Specify|Choose|Pick)[^\]\n]{1,80}\]/gi,
  /\[(?:Recipient|Sender|Topic|Subject|Salutation|Closing|Position|Department|Project Name|Company Name|Date)(?:\s+[^\]\n]{0,60})?\]/gi,
  /\[(?:INSERT|FILL\s+IN|ADD|TODO|TBD|PLACEHOLDER)[^\]]{0,80}\]/g,
  /\b(?:19|20)\d{2}-XX-XX\b/g,
  /\bXX\/XX\/(?:19|20)\d{2}\b/g,
  /<!--\s*(?:add|fill\s+in|insert|todo|placeholder)[^>]{0,120}-->/gi,
];

const AI_CITATION_MARKUP = [
  /cite(?:turn|news|search|navigation)\d+(?:search|turn|news|navigation)\d+/gi,
  /contentReference\s*\[oaicite:[^\]]+\]\s*\{[^}]*\}/gi,
  /\boai_citation\b/gi,
  /\[attached_file:\d+\]/gi,
  /\bgrok_card\b/gi,
];

const AI_UTM_SOURCE = [
  /[?&]utm_source=(?:chatgpt|openai|copilot|claude|grok|gemini|perplexity)(?:\.com|\.ai)?\b/gi,
  /[?&]referrer=(?:chatgpt|copilot|grok|gemini|perplexity)\.(?:com|ai)\b/gi,
];

// ── 2. Tier1 / Tier2 / Tier3 词表 ─────────────────────────────────
const TIER1 = new Set([
  'delve','tapestry','paradigm','beacon','robust','comprehensive','cutting-edge',
  'pivotal','meticulous','meticulously','seamless','seamlessly','game-changer',
  'game-changing','nestled','vibrant','thriving','bustling','intricate','intricacies',
  'ever-evolving','enduring','daunting','holistic','holistically','actionable',
  'impactful','learnings','synergy','synergies','interplay','symphony','embrace',
]);
const TIER2 = new Set([
  'harness','navigate','navigating','foster','elevate','unleash','streamline',
  'empower','bolster','spearhead','resonate','resonates','revolutionize','facilitate',
  'facilitates','underpin','nuanced','crucial','multifaceted','ecosystem','myriad',
  'plethora','encompass','catalyze','reimagine','galvanize','augment','cultivate',
  'illuminate','elucidate','juxtapose','transformative','transformation','cornerstone',
  'paramount','poised','burgeoning','nascent','quintessential','overarching',
  'underpinning','underpinnings','paradigm-shifting',
]);
const TIER3 = new Set([
  'significant','significantly','innovative','innovation','effective','effectively',
  'dynamic','dynamics','scalable','scalability','compelling','unprecedented',
  'exceptional','exceptionally','remarkable','remarkably','sophisticated','instrumental',
  'world-class','state-of-the-art','best-in-class','verbatim',
]);

// ── 3. 结构模式 ───────────────────────────────────────────────────
const TRANSITIONS = [
  /\bmoreover\b/gi, /\bfurthermore\b/gi, /\badditionally\b/gi,
  /\bin\s+today'?s\b/gi, /\bin\s+an\s+era\s+where\b/gi,
  /\bit'?s\s+worth\s+noting\s+that\b/gi, /\bnotably\b/gi,
  /\bin\s+conclusion\b/gi, /\bin\s+summary\b/gi, /\bto\s+summarize\b/gi,
  /\bwhen\s+it\s+comes\s+to\b/gi, /\bat\s+the\s+end\s+of\s+the\s+day\b/gi,
  /\bthat\s+(?:being\s+)?said\b/gi,
];
const CHATBOT_ARTIFACTS = [
  /\bi\s+hope\s+this\s+helps\b/gi, /\bcertainly!\b/gi, /\babsolutely!\b/gi,
  /\bgreat\s+question!\b/gi, /\bexcellent\s+point!\b/gi,
  /\bfeel\s+free\s+to\s+reach\s+out\b/gi,
  /\blet\s+me\s+know\s+if\s+you\s+need\s+anything\b/gi,
  /\bin\s+this\s+article,?\s+we\s+will\s+explore\b/gi,
  /\blet'?s\s+dive\s+in!?\b/gi,
];
const SYCOPHANTIC = [
  /\byou'?re\s+absolutely\s+right\b/gi,
  /\bthat'?s\s+a\s+really\s+insightful\b/gi,
  /\bthat'?s\s+a\s+great\s+question\b/gi,
  /\bexcellent\s+question\b/gi,
];
const FILLERS = [
  /\bit\s+is\s+important\s+to\s+note\s+that\b/gi,
  /\bin\s+terms\s+of\b/gi,
  /\bthe\s+reality\s+is\s+that\b/gi,
  /\bit'?s\s+important\s+to\s+note\s+that\b/gi,
];
const GENERIC_CONCLUSIONS = [
  /\bthe\s+future\s+looks\s+bright\b/gi,
  /\bonly\s+time\s+will\s+tell\b/gi,
  /\bone\s+thing\s+is\s+certain\b/gi,
  /\bas\s+we\s+move\s+forward\b/gi,
];
const LETS_PATTERNS = [
  /\blet'?s\s+explore\b/gi, /\blet'?s\s+take\s+a\s+look\b/gi,
  /\blet'?s\s+break\s+this\s+down\b/gi, /\blet'?s\s+examine\b/gi,
  /\blet'?s\s+(?:consider|discuss|delve|unpack|walk\s+through)\b/gi,
];
const REASONING_ARTIFACTS = [
  /\blet\s+me\s+think\s+step\s+by\s+step\b/gi,
  /\bbreaking\s+this\s+down\b/gi,
  /\bto\s+approach\s+this\s+systematically\b/gi,
  /\bhere'?s\s+my\s+thought\s+process\b/gi,
  /\bfirst,?\s+let'?s\s+consider\b/gi,
  /\bworking\s+through\s+this\s+logically\b/gi,
];
const SIGNIFICANCE_INFLATION = [
  /\bmarking\s+a\s+(?:pivotal|significant|important)\s+moment\b/gi,
  /\ba\s+watershed\s+moment\s+for\b/gi,
  /\bin\s+the\s+evolution\s+of\b/gi,
  /\ba\s+(?:pivotal|defining)\s+moment\s+in\b/gi,
];
const VAGUE_ATTRIBUTIONS = [
  /\bexperts\s+(?:believe|say|suggest|agree)\b/gi,
  /\bstudies\s+(?:show|suggest|indicate)\b/gi,
  /\bresearch\s+(?:shows|suggests|indicates)\b/gi,
  /\bindustry\s+leaders\s+(?:agree|believe|say)\b/gi,
];
const HOLLOW_INTENSIFIERS = [
  /\bgenuine(?:ly)?\b/gi, /\btruly\b/gi, /\bquite\s+frankly\b/gi,
  /\bto\s+be\s+honest\b/gi, /\blet'?s\s+be\s+clear\b/gi,
];
const EMOTIONAL_FLATLINE = [
  /\bwhat\s+surprised\s+me\s+most\b/gi,
  /\bi\s+was\s+fascinated\s+to\b/gi,
  /\bwhat\s+struck\s+me\s+was\b/gi,
  /\bi\s+was\s+excited\s+to\s+learn\b/gi,
  /\bthe\s+most\s+interesting\s+(?:part|thing|aspect|piece)\b/gi,
  /^\s*interesting\s+(?:part|thing|aspect|piece)(?:\s+of\s+(?:the\s+)?\w+)?\s*:/gim,
];
const LINGERING_ATTENTION = [
  /\b(?:the|that|this)\s+(?:one\s+)?(?:line|quote|bit|part|idea|point|framing|comment|thing)\s+(?:that\s+)?i\s+keep\s+(?:coming\s+back\s+to|thinking\s+about)\b/gi,
  /\bi\s+can'?t\s+stop\s+thinking\s+about\b/gi,
  /\bstill\s+thinking\s+about\s+(?:this|that)\s+one\b/gi,
  /\b(?:been|be)\s+rattling\s+around\s+(?:in\s+)?my\s+(?:head|brain)\b/gi,
  /\bi'?ve\s+been\s+chewing\s+on\s+(?:this|that)\b/gi,
];
const NOVELTY_INFLATION = [
  /\bthe\s+failure\s+mode\s+nobody'?s?\s+naming\b/gi,
  /\ba\s+problem\s+nobody\s+talks\s+about\b/gi,
  /\bthe\s+insight\s+everyone'?s?\s+missing\b/gi,
  /\bwhat\s+nobody\s+tells\s+you\b/gi,
];
const CUTOFF_DISCLAIMERS = [
  /\bas\s+of\s+my\s+last\s+update\b/gi,
  /\bas\s+of\s+my\s+(?:knowledge\s+)?(?:cut-?off|last\s+training)\b/gi,
  /\bi\s+don'?t\s+have\s+access\s+to\s+real-?time\s+(?:data|information)\b/gi,
  /\bbased\s+on\s+available\s+information\b/gi,
  /\bas\s+an?\s+(?:ai|artificial\s+intelligence|large\s+language|ai\s+language)\s+(?:language\s+)?model\b/gi,
  /\bi\s+(?:am|'m)\s+an?\s+(?:ai|artificial\s+intelligence|large\s+language)\s+(?:assistant|model)?\b/gi,
  /\bi\s+cannot\s+(?:provide|give|offer)\s+(?:legal|medical|financial|professional)\s+advice\b/gi,
  /\bmy\s+training\s+data\s+(?:only\s+)?(?:goes\s+up\s+to|extends\s+to|ends\s+(?:in|at))\b/gi,
];
const FALSE_CONCESSION = [
  /\bwhile\s+\w+\s+is\s+impressive\b/gi,
  /\balthough\s+\w+\s+has\s+made\s+strides\b/gi,
  /\bdespite\s+\w+\s+challenges?\b/gi,
];
const RHETORICAL_QUESTIONS = [
  /\bbut\s+what\s+does\s+this\s+mean\s+for\b/gi,
  /\bso\s+why\s+should\s+you\s+care\b/gi,
  /\bwhat'?s\s+next\?\s*/gi,
];
const HEDGE_STACK = [
  /\b(?:could|may|might)\s+(?:(?!not\b|never\b|hardly\b|scarcely\b|barely\b)\w+\s+)?(?:potentially|eventually|ultimately|possibly|conceivably)\b/gi,
  /\b(?:potentially|eventually|ultimately)\s+(?:could|may|might)\b/gi,
];
const FUTURE_NARRATIVE = [
  /\b(?:may|could|will|is\s+(?:poised|set)\s+to)\s+become\s+(?:one\s+of\s+)?(?:the\s+)?(?:most\s+)?\w+\s+(?:narratives?|stories|developments?|trends?|movements?|chapters?|themes?|forces?)\b/gi,
  /\bone\s+of\s+the\s+most\s+important\s+(?:narratives?|stories|trends?|themes?)\s+of\s+the\s+(?:next|coming)\s+\w+\b/gi,
];
const REAL_ACTUAL_INFLATION = [
  /\b(?:real|actual|genuine|true)\s+(?:on-?chain\s+)?(?:tokenomics|economics|utility|adoption|sustainability|impact|revenue|fundamentals|demand|value|innovation|traction)\b/gi,
];
const FORMULAIC_OPENERS = [
  /\bin\s+the\s+(?:rapidly\s+|ever-?\s*)?(?:evolving|changing|expanding|growing|shifting)\s+(?:world|landscape|realm|space|field|domain|era)\s+of\b/gi,
  /\bin\s+(?:an?|the)\s+(?:digital\s+)?age\s+(?:where|of)\b/gi,
  /\bas\s+(?:we|the\s+world|society|industries?)\s+(?:continue|move|navigate|enter)\s+(?:to\s+)?(?:evolve|forward|into|through)\b/gi,
  /\bhas\s+emerged\s+as\s+(?:a|the|one\s+of)\s+(?:leading|key|major|critical|essential|fundamental|pivotal|prominent|dominant|important)\s+\w+/gi,
  /\bhas\s+become\s+increasingly\s+(?:important|critical|popular|relevant|prominent|essential)\b/gi,
];
const SPECULATIVE_OPENERS = [
  /\b(?:imagine|picture|envision)(?:\s*,[^,\n]{1,30},)?\s+a\s+(?:world|future|reality)\s+(?:where|in\s+which)\b/gi,
];
const PERFORMED_INSIGHT = [
  /\bsit(?:s|ting)?\s+with\s+(?:that|this)(?=\s*(?:[.!?,;:)\u2013\u2014\u2019"']|for\s+a\s+(?:moment|minute|second|beat)\b|$))(?:\s+for\s+a\s+(?:moment|minute|second|beat))?/gi,
  /\bsit(?:s|ting)?\s+with\s+(?:the|your)\s+(?:discomfort|tension|uncertainty|ambiguity|grief|unease)\b/gi,
  /\b(?:that|this|it|which)(?:['\u2019]s|\s+(?:is|was))\s+not\s+nothing\b/gi,
  /\byou\s+already\s+know\s+the\s+answer\b/gi,
  /\b(?:do\s+not|don['\u2019]t)\s+(?:have\s+to\s+)?take\s+my\s+word\s+for\s+it\b/gi,
  /(?<=^|[.!?]\s|\n)Turns\s+out\b/g,
  /(?:['\u2019]s|\b(?:is|was|are|were))\s+the\s+(?:whole|entire)\s+(?:point|game|ballgame|trick|pitch|idea|play|business\s+model|value\s+proposition)\b/gi,
  /\b(?:that|this)(?:['\u2019]s|\s+(?:is|was))\s+the\s+part\s+(?:that|I|you|we|nobody|no\s+one|most\s+people)\b/gi,
  /\bthe\s+only\s+[\w'\u2019-]+\s+that\s+(?:matters|counts)\b/gi,
  /\bis\s+dead\s*[.;,:\u2013\u2014]\s*long\s+live\b/gi,
  /\b(?:that|this)(?:['\u2019]s|\s+(?:is|was))\s+why\s+[^.!?\n]{0,60}\s+mattered\b/gi,
];
const NEGATION_CHAIN = [
  new RegExp(
    "(?<=^|[.!?]\\s|\\n|[:\u2013\u2014]\\s)No\\s+" +
    "(?!matter\\b|one\\b|doubt\\b|longer\\b|way\\b|less\\b|more\\b|such\\b|other\\b|means\\b)" +
    "[a-z'\u2019-]+(?:\\s+" +
    "(?!(?:in|on|at|of|to|for|with|from|by|is|are|was|were|be|been|being|will|would|can|could|should|shall|may|might|must|have|has|had|do|does|did)\\b)" +
    "[a-z'\u2019-]+)?" +
    "(?:\\s*,\\s*(?:and\\s+|or\\s+|just\\s+)?no\\s+" +
    "(?!matter\\b|one\\b|doubt\\b|longer\\b|way\\b|less\\b|more\\b|such\\b|other\\b|means\\b)" +
    "[a-z'\u2019-]+(?:\\s+" +
    "(?!(?:in|on|at|of|to|for|with|from|by|is|are|was|were|be|been|being|will|would|can|could|should|shall|may|might|must|have|has|had|do|does|did)\\b)" +
    "[a-z'\u2019-]+)?){2,}",
    'gm'
  ),
  /\b(?:did\s+not|didn['\u2019]t)\s+[a-z]+[^,.;!?\n]{0,20},\s*(?:did\s+not|didn['\u2019]t)\s+[a-z]+/gi,
  /\b(?:do\s+not|don['\u2019]t)\s+(?:just\s+)?(\w+)\s+it\b[^.!?\n]{0,60}[.!?;:,]['\u201d\u201c]/gi,
];
const INVISIBLE_HOMOGLYPH = [
  /[\u200B\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u206A\u206B\u206C\u206D\u206E\u206F\uFEFF]/g,
  // [v6.7.101] 第二条原来写成 [^\x00-\x7F\u4e00-\u9fff...]，把所有中文
  // 标点（，？。！、）都算"非 ASCII 非汉字"的同形字——任何含中文逗号的
  // 正常句子都被 ai_writing_tell 命中（35 分），与其它维度叠加后 gate 从
  // pass 变 verify。双向门禁 benign 组因此长期卡在 29/30。
  // 修正：显式放行 CJK 标点区（\u3000-\u303f）与全角 ASCII 变体（\uff00-\uffef）。
  /[^\x00-\x7F\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g,
];

// ── 4. [第 50 轮] 中英混杂 AI 腔（zh-en code-mixing）──────────────────
// 实测缺口（2026-09-25 轮初探针，5 条同族句 detect().score 全 0、coOccurrence
// 全 false）：
//   「总而言之，This approach demonstrates significant value ...」
//   「综上所述，我们需要 comprehensively evaluate 这个方案的优劣」
// 根因有两条，都不在词表里：
//   ① 英文判据（TIER1-3 / transitions / formulaic-openers）全是整句英文句型，
//      中文句子夹英文词时 `\b(?:robust|...)\b` 要求英文语境，match 命中但族数
//      只有 1，被 [v6.7.125 第 36 轮] 的共现门槛（familiesHit >= 2）清零；
//   ② 中文侧根本没有"套话锚 + 英文内容"的判据——「总之、首先、换句话说」
//      这类 AI 高频连接词单独出现是正常中文，与英文内容同框才是机器痕迹。
// 判据（三条各自独立成立，第 50 轮实测 23/23 命中、良性池 0/151 新增误伤）：
//   ① anchor-mix：中文 AI 套话锚（core 集，刻意不含"然后/最后/另外/例如"这类
//      日常高频词——wide 集实测误伤「我打算从 CAP 理论讲起，然后介绍强一致性…」）
//      + 锚点后 140 字符内 ≥2 个英文词
//   ② double-connective：中英翻译对连接词同框 ≥2 对（首先+Firstly、此外+Furthermore）
//      单对不判（"首先，Firstly …"只有一对时是正常的中英术语混排）
//   ③ tier-phrase：中文句中出现 TIER 词且全文英文词 ≥2（"这个 robust 的方案"）
//      TIER 词取自既有 TIER1-3 词表，只做中英混杂场景的跨语言搬运检测。
// 与英文侧判据的关系：本族只加分（0.18），不取代任何既有族；共现门槛照旧
// 生效——单命中本族照旧 score 归零，这是第 36 轮定下的纪律，不因本轮松动。
const ZH_AI_ANCHOR = /(总而言之|综上所述|值得注意的?是|首先|其次|总的来说|总之|更重要(?:的|是)?|换句话说|一方面|另一方面|第一|第二)/;

// 中英连接词翻译对：中侧 + 英侧同现才算一对
const ZH_EN_CONNECTIVE_PAIRS = [
  [/首先|第一/, /\bfirstly\b|\bfirst\b|\bto begin with\b/i],
  [/其次|第二/, /\bsecondly\b|\bsecond\b|\bnext\b/i],
  [/最后|最终/, /\bfinally\b|\blastly\b|\blast\b/i],
  [/总之|总的来说|总而言之/, /\bin conclusion\b|\bto conclude\b|\bin summary\b|\boverall\b/i],
  [/因此|所以/, /\btherefore\b|\bthus\b|\bhence\b/i],
  [/然而|但是/, /\bhowever\b|\bnevertheless\b|\byet\b/i],
  [/此外|另外/, /\bfurthermore\b|\bmoreover\b|\badditionally\b/i],
  [/换句话说/, /\bin other words\b|\bthat is to say\b/i],
  [/例如|比如/, /\bfor example\b|\bfor instance\b|\be\.g\./i],
];

// TIER 词（中英短语级判据 C 用）：合并 TIER1-3 词表 + 常见派生后缀
const TIER_WORDS_RE = /\b(robust|comprehensive\w*|holistic\w*|seamless\w*|leverage\w*|streamline\w*|transformative|transformation|pivotal|multifaceted|unprecedented|intricate\w*|delve|embrace|foster\w*|nuanced|paramount|quintessential|burgeoning|poised|encompass\w*|harness\w*|unleash\w*|world-class|game-chang\w*|significant\w*|effective\w*|sophisticated\w*|crucial\w*|myriad|plethora|cataly[sz]e\w*|galvaniz\w*|illuminat\w*|elucidat\w*|juxtapos\w*|reimagin\w*|spearhead\w*|bolster\w*|resonat\w*|revolutioni[sz]e\w*|underpin\w*|underlying|cornerstone|overarching|paradigm|tapestry|beacon|meticulous\w*|nestled|vibrant|thriving|bustling|enduring|daunting|holistically|actionable|impactful|learnings|synerg\w*|interplay|symphony|elevate\w*|empower\w*|navigat\w*|facilitat\w*|augment\w*|cultivat\w*|nascent|ecosystem)\b/i;

function detectZhEnMixing(text) {
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  if (!hasChinese) return [];
  const triggers = [];
  // ① anchor-mix：core 锚点 + 锚后 140 字符内 ≥2 个英文词
  const anchor = text.match(ZH_AI_ANCHOR);
  if (anchor) {
    const start = text.indexOf(anchor[0]) + anchor[0].length;
    const enAfter = text.slice(start, start + 140).match(/[a-zA-Z]{2,}/g) || [];
    if (enAfter.length >= 2) {
      triggers.push({ trigger: `${anchor[0]} + ${enAfter.slice(0, 4).join(' ')},...` });
    }
  }
  // ② double-connective：中英连接词翻译对 ≥2
  let pairs = 0;
  const pairHits = [];
  for (const [zh, en] of ZH_EN_CONNECTIVE_PAIRS) {
    if (zh.test(text) && en.test(text)) { pairs++; pairHits.push(zh.source); }
  }
  if (pairs >= 2) {
    triggers.push({ trigger: `中英连接词对 x${pairs}` });
  }
  // ③ tier-phrase：中文句中 TIER 词 ≥1 且全文英文词 ≥2
  const tierHits = text.match(new RegExp(TIER_WORDS_RE.source, 'gi')) || [];
  const enAll = text.match(/[a-zA-Z]{2,}/g) || [];
  if (tierHits.length >= 1 && enAll.length >= 2) {
    triggers.push({ trigger: `TIER词 ${tierHits.slice(0, 3).join('/')}` });
  }
  return triggers;
}

const AI_TELL_PATTERNS = [
  { name: 'placeholders',        patterns: AI_PLACEHOLDERS,       baseScore: 0.30 },
  { name: 'citation-markup',     patterns: AI_CITATION_MARKUP,    baseScore: 0.32 },
  { name: 'utm-source',          patterns: AI_UTM_SOURCE,         baseScore: 0.30 },
  { name: 'cutoff-disclaimers',  patterns: CUTOFF_DISCLAIMERS,    baseScore: 0.28 },
  { name: 'chatbot-artifacts',   patterns: CHATBOT_ARTIFACTS,     baseScore: 0.25 },
  { name: 'reasoning-artifacts', patterns: REASONING_ARTIFACTS,   baseScore: 0.20 },
  { name: 'sycophantic',         patterns: SYCOPHANTIC,           baseScore: 0.22 },
  { name: 'lingering-attention', patterns: LINGERING_ATTENTION,   baseScore: 0.14 },
  { name: 'emotional-flatline',  patterns: EMOTIONAL_FLATLINE,    baseScore: 0.15 },
  { name: 'novelty-inflation',   patterns: NOVELTY_INFLATION,     baseScore: 0.18 },
  { name: 'formulaic-openers',   patterns: FORMULAIC_OPENERS,     baseScore: 0.14 },
  { name: 'speculative-openers', patterns: SPECULATIVE_OPENERS,   baseScore: 0.15 },
  { name: 'false-concession',    patterns: FALSE_CONCESSION,       baseScore: 0.14 },
  { name: 'significance-inflation', patterns: SIGNIFICANCE_INFLATION, baseScore: 0.18 },
  { name: 'real-actual-inflation', patterns: REAL_ACTUAL_INFLATION, baseScore: 0.18 },
  { name: 'future-narrative',    patterns: FUTURE_NARRATIVE,       baseScore: 0.16 },
  { name: 'vague-attributions',  patterns: VAGUE_ATTRIBUTIONS,    baseScore: 0.20 },
  { name: 'generic-conclusions', patterns: GENERIC_CONCLUSIONS,   baseScore: 0.16 },
  { name: 'lets-patterns',       patterns: LETS_PATTERNS,         baseScore: 0.13 },
  { name: 'rhetorical-questions',patterns: RHETORICAL_QUESTIONS, baseScore: 0.12 },
  { name: 'hedge-stack',         patterns: HEDGE_STACK,           baseScore: 0.11 },
  { name: 'hollow-intensifiers', patterns: HOLLOW_INTENSIFIERS,   baseScore: 0.12 },
  { name: 'transitions',         patterns: TRANSITIONS,           baseScore: 0.10 },
  { name: 'tier1',              patterns: [...TIER1].map(w => new RegExp('\\b' + escapeRegExp(w) + '\\b','gi')), baseScore: 0.18 },
  { name: 'tier2',              patterns: [...TIER2].map(w => new RegExp('\\b' + escapeRegExp(w) + '\\b','gi')), baseScore: 0.12 },
  { name: 'tier3',              patterns: [...TIER3].map(w => new RegExp('\\b' + escapeRegExp(w) + '\\b','gi')), baseScore: 0.07 },
  { name: 'negation-chain',     patterns: NEGATION_CHAIN,         baseScore: 0.22 },
  { name: 'invisible-homoglyph',patterns: INVISIBLE_HOMOGLYPH,   baseScore: 0.35 },
];

function normalizeText(text) {
  let out = text;
  out = out.replace(/[\u200B\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u206A\u206B\u206C\u206D\u206E\u206F\uFEFF]/g, '');
  out = out.replace(/[\u0400-\u04FF\u0370-\u03FF]/g, (m) => {
    const map = { '\u0430':'a','\u0435':'e','\u043e':'o','\u0440':'p','\u0441':'c','\u0445':'x','\u0443':'y','\u043a':'k','\u043c':'m','\u043d':'h','\u0432':'b','\u0442':'t','\u0410':'A','\u0415':'E','\u041e':'O','\u0420':'P','\u0421':'C','\u0425':'X','\u0423':'Y','\u041a':'K','\u041c':'M','\u041d':'H','\u0412':'B','\u0422':'T','\u0438':'y','\u0418':'Y','\u0433':'r','\u0413':'R','\u0437':'3','\u0447':'4','\u044f':'r','\u042f':'R','\u0436':'j','\u0416':'J','\u0431':'b','\u0411':'B','\u0444':'f','\u0424':'F','\u0434':'d','\u0414':'D','\u043b':'l','\u041b':'L','\u0446':'u','\u0426':'U','\u0448':'w','\u0428':'W','\u0449':'q','\u0429':'Q','\u044d':'e','\u042d':'E','\u044b':'b','\u042b':'B','\u044c':'b','\u042c':'B','\u0455':'s','\u0456':'i','\u0458':'j','\u04bb':'h','\u0501':'d','\u051b':'q','\u0261':'g','\u03bf':'o','\u039f':'O','\u03b1':'a','\u0391':'A','\u03c1':'p','\u03a1':'P','\u03bd':'v','\u039d':'N','\u03c5':'u','\u03a5':'Y','\u03c7':'x','\u03a7':'X','\u03ba':'k','\u039a':'K','\u03bb':'l','\u039b':'L','\u03bc':'m','\u039c':'M','\u03c4':'t','\u03a4':'T','\u03c9':'w','\u03a9':'W','\u03b2':'b','\u0392':'B','\u03b3':'y','\u0393':'Y','\u03b4':'d','\u0394':'D','\u03b6':'z','\u0396':'Z','\u03b7':'n','\u0397':'N','\u03b8':'0','\u0398':'0','\u03b9':'i','\u0399':'I','\u03c3':'o','\u03a3':'O','\u03c6':'o','\u03a6':'O' };
    return map[m] || m;
  });
  return out;
}

function tokenize(text) {
  return (text.match(/[a-z0-9]+(?:'[a-z0-9]+)?/gi) || []).map((t) => t.toLowerCase());
}

function getSentences(text) {
  return text.split(/[.!?]+\s+|\n+/).filter((s) => (s.match(/\S+/g) || []).length > 0);
}

function detectStylometry(text) {
  const sentences = getSentences(text);
  const tokens = tokenize(text);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const signals = [];

  if (sentences.length >= 5) {
    const lengths = sentences.map((s) => tokenize(s).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
    if (cv < 0.25 && avg > 10) {
      signals.push({ type: 'uniformity', severity: 12, trigger: `sentence lengths ~${Math.round(avg)} words`, guidance: 'Rhythm uniformity' });
    }
  }

  if (tokens.length >= 200) {
    const unique = new Set(tokens).size;
    const ttr = unique / tokens.length;
    if (ttr < 0.4) {
      signals.push({ type: 'low-ttr', severity: 8, trigger: `TTR=${(ttr * 100).toFixed(1)}%`, guidance: 'Low vocabulary diversity' });
    }
  }

  if (paragraphs.length >= 4) {
    const paraLengths = paragraphs.map((p) => getSentences(p).length);
    const avg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    if (avg >= 3 && paraLengths.every((l) => Math.abs(l - avg) <= 1)) {
      signals.push({ type: 'uniformity', severity: 8, trigger: `paragraphs ~${Math.round(avg)} sentences`, guidance: 'Paragraph rhythm uniformity' });
    }
  }

  return signals;
}

function detect(text) {
  if (!text || typeof text !== 'string') {
    return { module: 'ai-writing-tell', score: 0, topSeverity: 0, confidence: 0, count: 0, findings: [] };
  }

  const normalized = normalizeText(text);
  const lowered = normalized.toLowerCase();
  const findings = [];
  const seen = new Set();
  let total = 0;

  for (const entry of AI_TELL_PATTERNS) {
    if (!entry.patterns || !entry.patterns.length) continue;
    let hit = null;
    for (const re of entry.patterns) {
      if (!(re instanceof RegExp)) continue;
      re.lastIndex = 0;
      const m = lowered.match(re);
      if (m && m.length) {
        hit = m[0].slice(0, 80);
        break;
      }
    }
    if (!hit) continue;

    const key = `${entry.name}:${hit.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const severity = Math.min(100, Math.round(entry.baseScore * 100));
    total += entry.baseScore;
    findings.push({ dimension: `ai-tell-${entry.name}`, severity, trigger: hit, guidance: 'AI writing artifact' });
    if (findings.length >= 24) break;
  }

  // [第 50 轮] 中英混杂族：三条独立判据（anchor-mix / double-connective /
  // tier-phrase），任一命中即记一个 family（zh-en-mixing）。这与既有族的
  // 计分方式一致：baseScore 0.18，只加分不改路由；共现门槛照旧适用。
  const mixingTriggers = detectZhEnMixing(normalized);
  for (const mt of mixingTriggers) {
    const key = `zh-en-mixing:${mt.trigger}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total += 0.18;
    findings.push({ dimension: 'ai-tell-zh-en-mixing', severity: 18, trigger: mt.trigger, guidance: 'AI writing artifact (zh-en code-mixing)' });
  }

  const stylometry = detectStylometry(normalized);
  for (const s of stylometry) {
    const key = `${s.type}:${s.trigger}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total += s.severity / 100;
    findings.push({ dimension: `ai-tell-${s.type}`, severity: s.severity, trigger: s.trigger, guidance: s.guidance });
  }

  findings.sort((a, b) => b.severity - a.severity);
  const top = findings[0]?.severity || 0;

  // [v6.7.125 第 36 轮] 共现门槛：单族命中不计分。
  // 实测（2026-09-25，16 条正常学术/商业文本）7 条被误记：
  //   robust(0.18) / comprehensive(0.18) / holistic(0.18) / significant(0.07) /
  //   in summary / furthermore / in conclusion(0.10) —— 全是正常学术英语，
  //   每条**只命中一个特征族**。
  // 而真 AI 文本实测族数 3-6（4 条样本：4/3/6/5 族）。
  // 判据：AI 写作痕迹的本质是**多特征共现**，单个高频学术词不构成
  // AI 指纹。单族命中 → score 归零但仍进 findings（可观测、可调试），
  // 不再拉低 overallScore、不再污染 discriminate 的 findings 聚合。
  // 反向确认：真 AI 文本族数全部 >=3，门槛取 2 不影响它们任何一条。
  const familiesHit = new Set(findings.map((f) => f.dimension.replace(/^ai-tell-/, ''))).size;
  const coOccurrence = familiesHit >= 2;
  if (!coOccurrence) {
    total = 0;
  }
  const confidence = coOccurrence ? Math.min(1, total) : 0;

  return {
    module: 'ai-writing-tell',
    score: Math.min(1, total),
    topSeverity: top,
    confidence,
    count: findings.length,
    coOccurrence,
    familiesHit,
    findings: findings.slice(0, 12),
  };
}

module.exports = { detect, normalizeText };
