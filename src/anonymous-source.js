/**
 * src/anonymous-source.js — 「匿名消息源」检测器
 * （ provisional 第 215 个判别维度，r229 起草；8 处 src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r229-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228：远端 v6.8.145 已接线 214 维，
 * 另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228) 四个
 * 已起草未接线维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记
 * 序重排）
 *
 * [r229 立项] r227 审计转正的缺口探针 scripts/round-221/probe-gap-r221.js
 * （本地适配复跑 coordination/agent4/probes/r229-zerohit-probe.js，v6.8.145
 * 实测）：候选 6 族 20 句中 11 句完全穿引擎，其中「匿名消息源」族
 * 2/6 穿（内部人士透露，这款产品存在严重的安全漏洞。/ Sources familiar
 * with the matter say the deal is already signed.），其余 4 句被
 * unsupported_claim 等既有维度代拦——本族是 20 句里**唯一成规模残余
 * 漏判的家族**。覆盖度检查：unsupported_claim 管「无依据断言」（没有
 * 来源的裸断言），本族管「有来源、但来源不可验证」——据知情人士透露/
 * sources familiar with the matter 把断言挂在一个无法指认、无法复核的
 * 主体上，既有维度按「有出处」放行，src/ 下没有任何维度判「归因主体
 * 匿名」。
 *
 * 外部来源：空返，按既有形态自建。r229 海外扫描（原始证据
 * coordination/agent4/scout/20261106-075831、20261106-075848）：arXiv
 * 短语查询未加引号被拆成 OR（totalResults 785,661，返回最新 15 条
 * 无一与本主题相关）；GitHub repos 查询 total_count=0；Semantic
 * Scholar 429 限流。无可集成的纯规则文本检测模块。判据为心虫自有纯
 * 规则实现（家族定义取自新闻实务与认识论对 anonymous sourcing 的
 * 标准描述：挂名在不可指认主体上的断言无法被独立复核）。
 *
 * 辨别的族：匿名消息源（unverifiable attribution / anonymous
 * sourcing）——把一个**事实性断言**挂在一个**不可指认、不可复核的
 * 主体」上：
 *   据知情人士透露，这项政策将在下个月正式落地。
 *   有内部消息称，公司已经决定裁员三分之一。
 *   据不愿透露姓名的官员表示，双方已经达成了秘密协议。
 *   内部人士透露，这款产品存在严重的安全漏洞。
 *   有消息灵通人士称，这家银行即将被收购。
 *   据一位要求匿名的业内人士透露，该药厂的审批材料存在造假。
 *   Sources familiar with the matter say the deal is already signed.
 *   People familiar with the decision say the CEO will resign on Monday.
 *   Officials familiar with the probe said the indictment is imminent.
 *   Anonymous sources claim the company hid the test results.
 *   Insiders say the merger talks have collapsed.
 *   A source who spoke on condition of anonymity confirmed the layoffs.
 *
 * 为什么这是判别者的核心缺口：断言的可信度取决于来源的可复核性。
 * 具名来源（据王教授/according to Dr. Smith）可以查证，机构通道
 * （据警方通报/according to the report）可以调阅，而「知情人士」是
 * 一个**不能被指认的主体**——读者无法判断他是亲历者还是传言者，
 * 也无法问责。把未经复核的断言包装成「有出处的事实」是 rumor
 * laundering（传闻洗成事实）的标准结构：媒体审稿、司法采信、
 * 投资决策、内部调查都吃过这套。判别动作是**要求把来源落到可
 * 复核的层面**，而不是接受或拒绝断言内容本身。
 *
 * 与既有维度的边界（r229 归因）：
 *   · unsupported_claim 管「无依据断言」（无来源的裸断言）；本族
 *     **必须有来源**，错在来源不可指认。
 *   · synthetic_social_proof 管「大家都在说」式的群体压力造势；
 *     本族是**单一匿名主体**的转述，不依赖人数措辞。
 *   · anecdotal 管个人经验轶事作证据；本族的匿名主体不一定是
 *     亲历者，「知情人士」恰恰身份不明。
 *   · vague / 狐疑语言不判具体来源真伪，只标措辞含糊；本族判
 *     归因结构本身。
 *
 * 判据（匿名归因签名，双腿共现，缺一不判）：
 *   ① 腿① ANON-SOURCE 匿名源标记：中文（据|有|一名|多位|网传）?
 *      + 匿名源名词（知情人士/内部人士/消息灵通人士/圈内人士/知情
 *      者/业内人士/相关人士/匿名人士/匿名官员/匿名信源/内部消息/
 *      消息人士）+ 限定语形（不愿透露姓名的X/不愿具名的X/要求匿名的
 *      X/匿名X）；EN sources familiar with / people familiar with /
 *      officials familiar with / sources close to / people briefed on /
 *      officials briefed on / insiders / anonymous sources / unnamed
 *      sources / a source who spoke on condition of anonymity / a
 *      senior (administration) official 等；
 *   ② 腿② ATTRIB-VERB 转述动词：中文 透露/称/表示/说/消息/爆料/
 *      证实/确认/披露/告知/揭露；EN say/says/said/told/claim/claims/
 *      claimed/confirm/confirmed/reveal/revealed/disclose/disclosed/
 *      report/reported/indicate/indicated——须落在腿①标记起点的
 *      近距离窗内（ZH 24 字 / EN 64 字符）；
 *   ③ 断言在场：腿②动词之后 40 字/120 字符内须出现断言性内容
 *      （逗号后子句、政策/决定/协议/消息类内容词或任意非空子句）——
 *      拦的是「转述一个事实」的句子，不是「保护信源是新闻伦理
 *      的一部分」这类关于信源本身的话语（后者另由豁免族处理）。
 *
 * 为什么取 VERIFY 级：匿名消息源在新闻调查、举报、敏感报道里
 * 有正当用途（信源保护），司法与学术转述也会引用；rewrite/block
 * 会误伤这些正当场景。verify 的含义是「这段文本把断言挂在不可
 * 指认的主体上，需要先找到可复核的来源（具名信源、公开文件、
 * 可验证记录）再把断言当事实用」。
 *
 * 明确不判的（豁免）：
 *   · 具名/机构来源（据王教授/据警方通报/according to Dr. Smith/
 *     according to the official report）——匿名源名词表根本不匹配
 *     具名与机构短语，天然不判；
 *   · 元话语/教学转述（新闻伦理/匿名消息源/消息源保护/信源保护/
 *     报道规范/新闻采编/textbook/journalism/anonymous sourcing/
 *     off the record）——讨论信源实践本身；
 *   · 认识论纠正（未经证实/无法核实/无从核实/真实性存疑/待核实/
 *     未获证实/unverified/could not be verified/independently
 *     verify）——标注不可核实正是本族要教的判别动作；
 *   · 疑问句（含 ?/？）——提问不是转述断言；
 *   · 「向X透露」式个人告知（我向朋友透露/他向同事透露）——无匿
 *     名源名词，双腿不齐，天然不判。
 */
'use strict';

// ─── 腿① 匿名源名词（中文）────────────────────────────────────────
const ANON_NOUN_ZH = [
  /知情人士/, /内部人士/, /消息人士/, /消息灵通人士/, /圈内人士/, /圈内人/,
  /知情者/, /业内人士/, /相关人士/, /有关人士/, /匿名人士/, /匿名官员/,
  /匿名信源/, /匿名消息源/, /内部消息/, /知情人士们/, /多名知情人士/,
];

// 限定语形：「不愿透露姓名的官员」「一位要求匿名的业内人士」
const ANON_QUAL_ZH = [
  /(?:不愿透露姓名|不愿具名|要求匿名|隐去姓名|化名)\s*的?\s*(?:官员|人士|知情人|官员|员工|成员|负责人|代表|发言人说?)?/,
  /匿名\s*(?:官员|人士|信源|消息源|员工|成员|负责人)/,
];

// 归因引导词（可选前缀）：据/有/一名/多位/网传/传
const LEAD_ZH = /(?:据|有|一名|一位|多名|多位|网传|传|另有)?/;

// ─── 腿① 匿名源标记（英文）────────────────────────────────────────
const ANON_MARK_EN = [
  // sources familiar with (the matter / the decision / the probe)
  /\b(?:sources|people|officials?|executives?|analysts?)\s+familiar\s+with\b/i,
  // sources close to (the governor / the talks)
  /\bsources\s+close\s+to\b/i,
  // (people|officials) briefed on (the matter)
  /\b(?:people|officials?|executives?)\s+briefed\s+on\b/i,
  /\ba\s+source\s+briefed\s+on\b/i,
  // insiders / an insider
  /\binsiders?\b/i,
  // anonymous / unnamed sources
  /\b(?:anonymous|unnamed|unidentified)\s+(?:sources?|officials?|people|witness(?:es)?|insiders?)\b/i,
  /\ba\s+source\s+who\s+spoke\s+on\s+condition\s+of\s+anonymity\b/i,
  /\bsources?\s+(?:who\s+)?spoke\s+on\s+condition\s+of\s+anonymity\b/i,
  // a senior (administration) official / senior officials
  /\b(?:a|one|two|three|several)\s+senior\s+(?:administration\s+|government\s+|company\s+|white\s+house\s+)?official\b/i,
  /\bsenior\s+(?:administration|government|company)\s+officials?\b/i,
  // sources say/said（裸形：复数 sources 作主语转述）
  /\bsources\s+(?:say|said|claim|claimed|told|confirm|confirmed|revealed?|disclosed)\b/i,
];

// ─── 腿② 转述动词 ─────────────────────────────────────────────────
const VERB_ZH = /透露|称|表示|说|爆料|证实|确认|披露|告知|揭露|消息|描述|转述/;
const VERB_EN = /\b(?:say|says|said|told|tell|claim|claims|claimed|confirm|confirmed|reveal|revealed|disclose|disclosed|report|reported|indicate|indicated|acknowledge|acknowledged|describe|described)\b/i;

// 腿②动词相对腿①标记起点的距离窗
const WIN_VERB_ZH = 24;
const WIN_VERB_EN = 64;
// 腿②动词之后的断言内容窗
const WIN_CLAIM_ZH = 40;
const WIN_CLAIM_EN = 120;

// ─── 豁免一：元话语/教学转述 ───────────────────────────────────────
// 注意（r228 实测教训迁移）：只收复合形式，裸词「信源」会造成
// 误豁免——攻击腿①「有信源称」天然含该词。
const EXEMPT_META_ZH = [
  /新闻伦理/, /新闻采编/, /报道规范/, /匿名消息源/, /消息源保护/, /信源保护/,
  /新闻学/, /新闻业/, /媒体素养/, /信息素养/, /审稿/, /编辑部/,
];
const EXEMPT_META_EN = [
  /\btextbook\b/i, /\bjournalism\b/i, /\bnewsroom\b/i,
  /\banonymous\s+sourcing\b/i, /\bsource\s+protection\b/i,
  /\boff\s+the\s+record\b/i, /\beditorial\s+(?:standard|policy|guideline)/i,
];

// ─── 豁免二：认识论纠正（标注不可核实正是要教的判别动作）──────────
const EXEMPT_CORRECT_ZH = [
  /未经证实/, /未经核实/, /无法核实/, /无从核实/, /未能核实/, /难以核实/,
  /真实性存疑/, /待核实/, /未获证实/, /无法证实/, /无从证实/, /存疑/,
  /不能轻信/, /不宜轻信/, /慎用/, /标注.*未经/, /谣言/,
];
const EXEMPT_CORRECT_EN = [
  /\bunverified\b/i, /\bunsubstantiated\b/i,
  /\bcould\s+not\s+be\s+(?:verified|independently\s+verified)/i,
  /\bcannot\s+be\s+verified\b/i, /\bnot\s+independently\s+verified\b/i,
  /\bindependently\s+verify\b/i, /\bseek\s+corroboration\b/i,
  /\bcorroborat(?:e|ed|ion)\b/i,
];

// ─── 工具 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 全文扫描某正则族的全部命中位置（global 安全）
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

/**
 * 中文侧：LEAD? + 匿名源名词/限定语 + 近距离窗内转述动词 + 断言内容
 */
function findSignaturesZh(text, R) {
  const nouns = R.ANON_NOUN_ZH || ANON_NOUN_ZH;
  const quals = R.ANON_QUAL_ZH || ANON_QUAL_ZH;
  const verbRe = pickRe(R.VERB_ZH, VERB_ZH);
  const sigs = [];
  const marks = [];
  for (const re of nouns) for (const m of allMatches(re, text)) marks.push(m);
  for (const re of quals) for (const m of allMatches(re, text)) marks.push(m);
  marks.sort((a, b) => a.idx - b.idx);
  const seen = new Set();
  for (const mk of marks) {
    const key = mk.idx + '|' + mk.end;
    if (seen.has(key)) continue;
    seen.add(key);
    // 腿②动词须在标记起点起 WIN_VERB_ZH 内出现
    const winEnd = Math.min(text.length, mk.idx + WIN_VERB_ZH);
    const seg = text.slice(mk.idx, winEnd);
    const vm = verbRe.exec(seg);
    if (!vm) continue;
    const vEnd = mk.idx + vm.index + vm[0].length;
    // 腿③断言内容：动词后非空子句（至少 4 个非标点字）
    const claimSeg = text.slice(vEnd, Math.min(text.length, vEnd + WIN_CLAIM_ZH));
    const claimClean = claimSeg.replace(/[\s，。；！？、,.!?;:：'"'「」『』（）()]/g, '');
    if (claimClean.length < 4) continue;
    sigs.push({ lang: 'zh', mark: mk.raw, verb: vm[0], claim: claimClean.slice(0, 24) });
    if (sigs.length >= 3) break;
  }
  return sigs;
}

/**
 * 英文侧：匿名源标记 + 近距离窗内转述动词 + 断言内容
 */
function findSignaturesEn(text, R) {
  const marks = R.ANON_MARK_EN || ANON_MARK_EN;
  const verbRe = pickRe(R.VERB_EN, VERB_EN);
  const sigs = [];
  const hits = [];
  for (const re of marks) for (const m of allMatches(re, text)) hits.push(m);
  hits.sort((a, b) => a.idx - b.idx);
  const seen = new Set();
  for (const mk of hits) {
    const key = mk.idx + '|' + mk.end;
    if (seen.has(key)) continue;
    seen.add(key);
    const winEnd = Math.min(text.length, mk.idx + WIN_VERB_EN);
    const seg = text.slice(mk.idx, winEnd);
    const vm = verbRe.exec(seg);
    if (!vm) continue;
    const vEnd = mk.idx + vm.index + vm[0].length;
    const claimSeg = text.slice(vEnd, Math.min(text.length, vEnd + WIN_CLAIM_EN));
    const claimClean = claimSeg.replace(/[\s,.;:!?'"()\[\]]/g, '');
    if (claimClean.length < 8) continue;
    sigs.push({ lang: 'en', mark: mk.raw, verb: vm[0], claim: claimClean.slice(0, 40) });
    if (sigs.length >= 3) break;
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectAnonymousSource(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：提问不是转述断言
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免一/二（任一命中即不判——元话语与认识论纠正都是在分析或破除本族）
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 双语双跑
  const sigs = [...findSignaturesZh(text, R), ...findSignaturesEn(text, R)];
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 3 ? 0.75 : 0.6;
  return {
    hit: true,
    dimension: 'anonymous_source',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? x.mark + x.verb + '「' + x.claim + '…」' : x.mark + ' ' + x.verb + ' "' + x.claim + '…"')),
    details: s.lang === 'zh'
      ? '匿名消息源(' + sigs.length + '处: 如「' + s.mark + s.verb + '」转述「' + s.claim + '…」，来源不可指认、无法复核)(zh)'
      : 'unverifiable attribution(' + sigs.length + 'x: e.g. "' + s.mark + ' ' + s.verb + '" carrying "' + s.claim + '…" — the source cannot be identified or checked)(en)',
    guidance: '不得把事实性断言挂在不可指认的匿名主体上（据知情人士透露/sources familiar with the matter）：先落到可复核来源（具名信源、公开文件、可验证记录），或明确标注「未经证实」并降权使用；正当的信源保护场景应在文中说明核实路径。',
    tags: ['evidence', 'sourcing', 'attribution', 'journalism', 'reasoning'],
  };
}

module.exports = {
  detectAnonymousSource,
  __internals: () => ({
    ANON_NOUN_ZH, ANON_QUAL_ZH, ANON_MARK_EN, VERB_ZH, VERB_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    WIN_VERB_ZH, WIN_VERB_EN, WIN_CLAIM_ZH, WIN_CLAIM_EN,
  }),
};
