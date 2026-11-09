'use strict';
/**
 * monocausal_attribution —— 单因归因（把结果压到单一原因，否认/忽略其他成因）
 *
 * 为什么单独成维：
 *   混因混杂（confounding）、post hoc、monocause 三个已有维度都能在通用模式上
 *   命中「单一变量 + 结果」，但它们要么不认「枚举多因再宣布其无关」的句式
 *   （A, B, C are not a contributing factor），要么不认口语化的
 *   「it's all because X」，要么不认中文散文式的「一方面……另一方面」与单因
 *   判断同句并置。本维度专门收这一类归因错误。
 *
 * 三条腿（两腿判据 + 豁免表）：
 *   L1 归因压缩  —— 「全都是因为 X」「唯一原因在于 X」「问题就出在 X」
 *   L2 枚举否认  —— 句中先枚举 ≥2 个候选成因，随后出现「X 不是contributing
 *                    factor / 与问题无关 / 不承担责任」式否认
 *   L3 归因相消  —— 同一句内既出现单因压缩句式、又出现多因并列句式（且中间
 *                    存在枚举），构成自相矛盾的归因声明
 *   豁免：句内出现显式对冲（may/might/could/possibly/可能/也许）或显式多因
 *         措辞且无 L2 否认时，不命中。
 *
 * [r267 扩展] 池化探针实测 2/3 穿透的新措辞家族（scripts/round-267/
 * r267-probe-pool.js，v6.8.157）：① 口语归怪族（全怪/都怪/只怪/全赖/
 * 全凭一己/全仗）；② 口语否证族（其他都是次要的/其余可以忽略）；
 * ③ EN 唯一理由族（for one reason only / one reason only）。良性对照
 * （有…的因素但…同样有责任/many reasons including）零误伤。
 */

/* ── L1 归因压缩：把因果压到单一原因 ───────────────────────────── */

const COMPRESS_EN = [
  /\ball\s+because\s+of\s+one\b/i,
  /\ball\s+because\b/i,
  /\beverything\s+because\b/i,
  /\bjust\s+because\b/i,
  /\bdue\s+solely\s+to\b/i,
  /\b(?:is|are|was|were)\s+due\s+entirely\s+to\b/i,
  /\bexplained\s+(?:entirely|solely|completely)\s+by\b/i,
  /\b(?:is|are|was|were)\s+(?:entirely|solely|completely|purely|largely|mostly)\s+(?:due|attributable)\s+to\b/i,
  /\b(?:is|are|was|were)\s+(?:entirely|solely|completely|purely)\s+(?:down\s+to|about)\b/i,
  /\ball\s+because\s+of\s+(?:one|a\s+single|this)\b/i,
  /\bexplains?\s+(?:it\s+)?all\b/i,
  /\bdriven\s+(?:entirely|solely|completely)\s+by\s+(?:a\s+single|one|this)\b/i,
  /\bboils?\s+down\s+to\s+(?:just\s+)?(?:one|a\s+single|this)\b/i,
  /\bcomes?\s+down\s+to\s+(?:just\s+)?(?:one|a\s+single|this)\b/i,
  /\breduced\s+to\s+(?:a\s+single|one)\b/i,
  /\bcan\s+be\s+reduced\s+to\s+one\b/i,
  /\bthe\s+(?:one\s+and\s+only|single|sole|only)\s+(?:reason|cause|explanation|driver|factor|source)\b/i,
  /\bthe\s+entire\s+(?:problem|issue|phenomenon|result|outcome|story)\s+(?:is|comes\s+down\s+to|stems\s+from|rests\s+on)\s+(?:one|a\s+single|this)\b/i,
  /\b(?:the\s+)?(?:sole|only)\s+(?:reason|cause|factor|explanation|driver)\s+(?:is|was)\b/i,
  /\bone\s+(?:factor|variable|thing|driver)\s+(?:explains|accounts\s+for|drives|causes)\s+(?:everything|all\s+of\s+(?:it|this))\b/i,
  /\b(?:a\s+)?single\s+(?:factor|variable|cause|driver)\s+(?:explains|accounts\s+for|drives|causes)\s+(?:everything|all\s+of\s+(?:it|this))\b/i,
  /\beverything\s+(?:can\s+be\s+)?(?:traced|attributed)\s+back\s+to\s+(?:one|a\s+single|this)\b/i,
  /\b(?:all|everything)\s+(?:of\s+)?(?:it|this)\s+(?:comes\s+down\s+to|stems\s+from)\s+(?:one|a\s+single|this)\b/i,
  /\bit'?s\s+all\s+down\s+to\b/i,
  // [r267] 唯一理由族（for one reason only / one reason only）——探针
  // 2/3 穿透落地：The product flopped for one reason only: marketing.
  /\bfor\s+(?:one|just\s+one|a\s+single|exactly\s+one)\s+reason\s+only\b/i,
  /\b(?:one|a\s+single)\s+reason\s+only\b/i,
];

const COMPRESS_ZH = [
  /全都是因为/,
  /全是因为/,
  /全都是由于/,
  /全(?:都)?(?:是)?(?:由于|因为)/,
  /完全(?:是)?(?:因为|由于|取决于|取决于)/,
  /完全(?:是)?(?:由|靠)(?:一个|单一)/,
  /(?:唯一|单一)(?:的)?(?:原因|因素|根源|变量|解释)/,
  /(?:问题|矛盾|冲突|差距)(?:的)?(?:根本)?(?:原因|根源)?(?:就|只)(?:是|在于)/,
  /(?:根子|根源)(?:就|只)(?:是|在于)/,
  /一句话(?:概括|总结|说)/,
  /(?:只|仅仅)(?:是|因为|由于)/,
  /(?:完全|彻底)(?:取决于|取决于|由)/,
  /(?:所有|全部)(?:问题|矛盾|现象)(?:的)?(?:唯一|单一|根本)?(?:原因|根源|症结)/,
  /(?:说到底|归根到底|归根结底|一句话|总的来说)(?:来)?(?:就|只)?(?:是|因为|由于)/,
  /(?:只有|仅有|只存)(?:一个|单一|唯一)(?:原因|因素|根源|变量|解释|缘故)/,
  /(?:所有|全部|整件事|一切)(?:的)?(?:问题|矛盾|现象|事情)?(?:都是|全是|只因)/,
  /都是因为/,
  /只因(?:为)?/,
  // [r267] 口语归怪族（全怪/都怪/只怪/全赖/全凭一己/全仗）——探针 2/3
  // 穿透落地：「项目失败全怪需求变更，其他都是次要的。」
  // [r267] 口语归怪族（全怪/都怪/只怪/全赖）——集体名词负向前查：
  // 「全赖大家/全靠众人」是人人有份的多因陈述，不是单因归怪
  /(?:(?:全|都|只|就)(?:怪|赖))(?!大家|所有人|每个人|诸位|全员|各位|各方|团队|众人|人人|大伙|全员)/,
  /全凭(?:一己|自己|一个人)/,
  /全仗(?:一人|自己)/,
];

/* ── L2 枚举否认：先列成因，再宣布其无关 ────────────────────────── */

const ENUM_SPLIT = /,|\band\b|\bplus\b|\balong\s+with\b|\btogether\s+with\b|\bas\s+well\s+as\b|\bnot\s+to\s+mention\b/i;

// 中文枚举连接词（顿号/及/和/与/以及/还有/加上）。注意：中文逗号「，」已在
// ENUM_SPLIT 的英文逗号分支之外，这里显式补上，否则中文枚举句永远切不出 ≥3 段。
const ENUM_SPLIT_ZH = /[，,、；;]|\band\b|\bas\s+well\s+as\b|\balong\s+with\b|\btogether\s+with\b|\bplus\b|以及|还有|加上|与|和|跟|及|并|且/;

const DISMISS_EN = [
  /\b(?:is|are|was|were)\s+not\s+(?:a\s+)?(?:contribut(?:ing|ory|or)|relevant|responsible|implicated|connected|related|involved)\s+(?:factor|cause|reason|driver|variable|part|player)\b/i,
  /\bplays?\s+no\s+(?:role|part)\b/i,
  /\bplayed\s+no\s+(?:role|part)\b/i,
  /\bhas?\s+no\s+(?:role|part|bearing)\b/i,
  /\bhas?\s+nothing\s+to\s+do\s+with\b/i,
  /\bcontributes?\s+(?:nothing|little)\s+to\b/i,
  /\b(?:is|are)\s+(?:irrelevant|immaterial|inconsequential)\s+to\b/i,
  /\bbears?\s+no\s+(?:responsibility|blame)\b/i,
  /\bnot\s+to\s+blame\b/i,
  /\bnot\s+even\s+(?:a\s+)?(?:small|minor|tiny|slight)\s+(?:part|role|factor)\b/i,
  /\bnot\s+a\s+(?:real|meaningful|significant)\s+(?:factor|cause|reason|driver)\b/i,
  /\bno\s+part\s+of\s+the\b/i,
  /\b(?:is|are)\s+not\s+responsible\s+for\b/i,
  /\b(?:can\s+be\s+)?ruled\s+out\s+entirely\b/i,
  /\b(?:is|are)\s+(?:entirely|completely|totally)\s+(?:irrelevant|unrelated)\b/i,
];

const DISMISS_ZH = [
  /(?:并|却|但|而)(?:不|没有)(?:是|构成)(?:任何)?(?:原因|因素|变量|条件)/,
  /(?:与|跟)(?:此|该|这)(?:毫无|没有)(?:关系|关联|因果)/,
  /(?:起不到|不起)(?:任何)?(?:作用|影响)/,
  /(?:不|没)(?:承担|负有)(?:任何)?(?:责任|因果)/,
  /(?:完全|根本)(?:无关|不相干)/,
  /(?:并非|不是)(?:真正|有效)(?:的)?(?:原因|因素|变量)/,
  /(?:排除|剔除)(?:在)?(?:原因|因素)(?:之外|之列)/,
  /(?:不|没)(?:起|发挥)(?:任何)?(?:作用|影响)/,
  // [r267] 口语否证族（其他都是次要的/其余可以忽略）——探针穿透落地
  /(?:其他|其余|别的)(?:都)?(?:是)?(?:次要的|次要|不重要|无关紧要|可以忽略|忽略不计|不值一提|微不足道|无关大局|无关痛痒)/,
  /(?:都不算|都不算数|都不作数)/,
];

/* ── L3 多因并列：用于识别句内的多因陈述 ───────────────────────── */

const MULTI_EN = [
  /\b(?:multiple|many|several|various|diverse|numerous|complex|interacting|combined|joint|competing)\s+(?:factors?|causes?|reasons?|variables?|drivers?|forces?|influences?|elements?)\b/i,
  /\b(?:a\s+)?(?:combination|mix|confluence|convergence|interplay|interaction|interactions)\s+of\b/i,
  /\bmultifactorial\b/i,
  /\bmulticausal\b/i,
  /\bpolycausal\b/i,
  /\bboth\s+(?:play|contribute|matter|are|were|helped)\b/i,
  /\bmore\s+than\s+(?:one|a\s+single)\s+(?:cause|factor|reason|explanation|driver)\b/i,
  /\b(?:a\s+)?(?:wide|broad|large)\s+(?:range|array|variety)\s+of\s+(?:factors?|causes?|reasons?|influences?|drivers?)\b/i,
  /\b(?:combined|joint|collective|compounding)\s+(?:effect|influence|role|effects)\b/i,
  /\b(?:not\s+)?(?:reduce|attributed)\s+to\s+(?:a\s+)?single\b/i,
  /\b(?:cannot|can'?t|could\s+not)\s+be\s+reduced\s+to\s+(?:a\s+single|one)\b/i,
  /\b(?:complex|complicated|nuanced)\s+(?:picture|situation|phenomenon|issue|problem|reality|process)\b/i,
  /\b(?:a\s+)?(?:host|range|variety|set)\s+of\s+(?:factors|causes|reasons|drivers)\b/i,
  /\b(?:factors|causes|reasons|drivers|influences)\s+(?:such\s+as|like|including)\b/i,
  /\b(?:together|jointly|collectively)\s+(?:led|led\s+to|produced|caused|drove|contributed)\b/i,
  /\b(?:stem|stems|stemmed)\s+from\s+(?:a\s+)?(?:combination|mix|variety|number)\b/i,
  /\b(?:a\s+)?(?:number\s+of|series\s+of)\s+(?:factors|causes|reasons)\b/i,
  /\b(?:among|amongst)\s+(?:other\s+)?(?:factors|causes|reasons|things)\b/i,
  /\b(?:no|not|without|never)\s+(?:a\s+|one\s+|just\s+one\s+|any\s+)?(?:single|sole)\s+(?:factor|cause|driver|explanation|reason)\b/i,
  /\b(?:no|not|without|never)\s+(?:just\s+)?(?:one|a\s+single|any)\s+(?:factor|cause|driver|explanation|reason)\b/i,
  /\b(?:no\s+)?(?:one|single)\s+(?:factor|cause|reason)\s+(?:alone|by\s+itself)\b/i,
];

const MULTI_ZH = [
  /多(?:种|方面|重|个|元|层|因素|因|重性)/,
  /(?:多种|诸多|许多|各种|若干)(?:因素|原因|变量|力量|条件|驱动)/,
  /(?:综合|复杂|多元)(?:的)?(?:结果|作用|因素|成因|过程|格局)/,
  /(?:共同|相互|交互|交织|叠加|叠加)(?:作用|影响|导致|造成|促成)/,
  /一方面[\s\S]{0,80}?另一方面/,
  /(?:既)?(?:有|包含)[\s\S]{0,40}?(?:也|又|还|同时)有/,
  /(?:不能|无法)(?:简单|完全|单)(?:归结|归因|归咎)/,
  /(?:不止|不限于|不仅限于)(?:一个|单一|一种)(?:因素|原因|变量|解释)/,
  /(?:多重|多元)(?:因果|归因|因素|驱动)/,
  /(?:受到|受)[\s\S]{0,40}?(?:等|以及)[\s\S]{0,20}?(?:共同|综合)(?:影响|作用)/,
  /(?:内外|主客观|多方面)(?:因素|原因|条件)/,
];

/* ── 豁免：显式对冲或显式多因且无否认 ─────────────────────────── */

const HEDGE_EN = [
  /\b(?:may|might|could|possibly|perhaps|likely|probably|tend(?:s|ed)?\s+to|appears?\s+to|seems?\s+to)\b/i,
  /\b(?:one\s+of\s+the|among\s+the)\s+(?:main|key|primary|principal|leading|major|biggest|most\s+important)\b/i,
  /\b(?:a|one\s+of\s+the)\s+(?:major|key|primary|main|leading|principal)\s+(?:factor|cause|reason|driver|contributor)\b/i,
  /\b(?:largely|mostly|primarily|mainly|chiefly|predominantly)\s+(?:because|due\s+to|driven\s+by)\b/i,
  /\b(?:at\s+least\s+in\s+part|in\s+large\s+part)\b/i,
];

const HEDGE_ZH = [
  /可能/,
  /也许/,
  /大概/,
  /之一/,
  /(?:主要|关键|核心|首要)(?:的)?(?:原因|因素)(?:之一)?/,
  /(?:很可能|大概率|倾向于)/,
  /(?:至少|部分)(?:是|由于|因为)/,
];

/* ── 句子切分 ─────────────────────────────────────────────────── */

function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  // 中英混排：按句末标点 + 换行切分，保留感叹号/问号
  return text
    .split(/(?:[.!?;]+(?:\s|$)|[\n\r]+|；|。|！|？)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function anyMatch(patterns, s) {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(s)) return true;
  }
  return false;
}

function hasEnumeration(sentence) {
  const partsEn = sentence.split(ENUM_SPLIT).map((p) => p.trim()).filter(Boolean);
  if (partsEn.length >= 3) return true;
  const partsZh = sentence.split(ENUM_SPLIT_ZH).map((p) => p.trim()).filter(Boolean);
  return partsZh.length >= 3;
}

function collectMatches(patterns, sentence, out) {
  for (let i = 0; i < patterns.length; i++) {
    const m = sentence.match(patterns[i]);
    if (m && m[0]) out.push(m[0]);
  }
  return out;
}

/* ── 否定式多因（拒绝单因归因的正确陈述）────────────────────── */

// 这些句式在 MULTI 侧命中，但 COMPRESS 侧的 "single (factor|cause)" 也会命中
// 其中嵌入的 "single" 一词，造成 L3 双腿同句误判。它们是良性陈述——
// 语义方向与单因归因相反（拒绝单因），故在 L1/L3 前置排除。
const NEGATED_MULTI_EN = [
  /\b(?:no|not|without|never)\s+(?:a\s+|one\s+|just\s+one\s+|any\s+)?(?:single|sole)\s+(?:factor|cause|driver|explanation|reason)\b/i,
  /\b(?:no|not|without|never)\s+(?:just\s+)?(?:one|a\s+single|any)\s+(?:factor|cause|driver|explanation|reason)\b/i,
  /\b(?:no\s+)?(?:one|single)\s+(?:factor|cause|reason)\s+(?:alone|by\s+itself)\b/i,
  /\bnot\s+(?:just|merely|simply|only)\s+(?:about\s+)?(?:one|a\s+single|one\s+thing)\b/i,
  /\bmore\s+than\s+(?:just\s+)?(?:one|a\s+single)\b/i,
];

const NEGATED_MULTI_ZH = [
  /(?:并非|不是|绝非|不能|不可|不应)(?:仅仅|只|单)(?:是|因为|由于)/,
  /(?:没有|毫无)(?:任何)?(?:单一|唯一|一个)(?:的)?(?:原因|因素|变量|解释)/,
  /(?:不能|不可|不应)(?:归(?:结|因|咎)于|全归于|都归于)/,
  /(?:不只|不仅仅|不单是|不单单是)/,
];

/* ── 主判定 ───────────────────────────────────────────────────── */

function detectMonocausal(text, inject) {
  // [r267] 负例注入-删条支持（同族模块约定）：R 覆盖腿常量，删条后守卫须变红
  const R = inject || {};
  const COMPRESS_EN_R = R.COMPRESS_EN || COMPRESS_EN;
  const COMPRESS_ZH_R = R.COMPRESS_ZH || COMPRESS_ZH;
  const DISMISS_EN_R = R.DISMISS_EN || DISMISS_EN;
  const DISMISS_ZH_R = R.DISMISS_ZH || DISMISS_ZH;
  // 引擎约定（同 incredulity.js 等维度）：无命中/异常输入一律返回
  // { hit:false, score:0 } 安全对象，绝不可返回 null——index.js:2711
  // 判定点直接读 .score，null 会让整条 pipeline 抛 "Cannot read
  // properties of null"。[r230 修复] 原顶部 `if (!sentences.length)
  // return null;` 是 r220 接线遗漏：splitSentences 对 null/undefined/
  // ''/纯标点输入返回空数组 → null → 判定点崩溃。实测 bad-faith-en-r226、
  // dangerous-instruction-pat4-gap-round205 等多个测试文件因此
  // Command failed（非本轮引入，HEAD a896a5d 已存在）。
  if (!text || typeof text !== 'string') return { hit: false, score: 0, detail: '', count: 0 };
  const sentences = splitSentences(text);
  if (!sentences.length) return { hit: false, score: 0, detail: '', count: 0 };

  const l1 = [];
  const l2 = [];
  const l3 = [];
  let sentenceCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (s.length < 6) continue;
    sentenceCount++;

    const hedged = anyMatch(HEDGE_EN, s) || anyMatch(HEDGE_ZH, s);

    // 豁免：句中显式多因措辞，且无枚举否认 → 良性多因陈述
    const multiHere = anyMatch(MULTI_EN, s) || anyMatch(MULTI_ZH, s);

    // L1：归因压缩
    // 排除 NEGATED_MULTI：句中显式"拒绝单因"（no single factor explains
    // it all / 并非只有一个原因）——即使 COMPRESS 命中其中嵌入的 "single"，
    // 语义方向也与单因归因相反，属良性陈述。
    if (!hedged && !multiHere &&
        !anyMatch(NEGATED_MULTI_EN, s) && !anyMatch(NEGATED_MULTI_ZH, s)) {
      const enHits = [];
      const zhHits = [];
      collectMatches(COMPRESS_EN_R, s, enHits);
      collectMatches(COMPRESS_ZH_R, s, zhHits);
      if (enHits.length || zhHits.length) {
        l1.push({ sentence: s, en: enHits, zh: zhHits });
      }
    }

    // L2：枚举 + 否认
    if (hasEnumeration(s) && (anyMatch(DISMISS_EN_R, s) || anyMatch(DISMISS_ZH_R, s))) {
      const d = [];
      collectMatches(DISMISS_EN_R, s, d);
      collectMatches(DISMISS_ZH_R, s, d);
      l2.push({ sentence: s, dismiss: d });
    }

    // L3：归因相消（单因压缩句式 + 多因并列句式同句）。
    // 宽松口径：只要同句既有 COMPRESS 命中又有 MULTI 命中即构成自相矛盾的
    // 归因声明，不再强制要求 ≥3 段枚举——矛盾句常只切成两段
    // （"It's all because of one factor, though multiple factors are
    // involved." / "虽然这是多因素造成的，但说到底只有一个原因。"）。
    //
    // 排除：NEGATED_MULTI（no/not/without a single factor 等"拒绝单因"句式）。
    // 该句式在 MULTI 侧命中，同时 "single (factor|cause)" 在 COMPRESS 侧命中，
    // 双腿同句会被误判为自相矛盾——但句意恰是**拒绝单因归因**，与
    // 单因归因方向相反，属良性陈述（"The project failed for many reasons,
    // and no single factor explains it all."）。
    if (
      !hedged &&
      multiHere &&
      !anyMatch(NEGATED_MULTI_EN, s) &&
      !anyMatch(NEGATED_MULTI_ZH, s) &&
      (anyMatch(COMPRESS_EN_R, s) || anyMatch(COMPRESS_ZH_R, s))
    ) {
      const c = [];
      const m = [];
      collectMatches(COMPRESS_EN_R, s, c);
      collectMatches(COMPRESS_ZH_R, s, c);
      collectMatches(MULTI_EN, s, m);
      collectMatches(MULTI_ZH, s, m);
      l3.push({ sentence: s, compress: c, multi: m });
    }
  }

  // 引擎约定（同 incredulity.js 等维度）：无命中时返回 { hit:false,
  // score:0 } 安全对象，绝不可返回 null——index.js 的判定点直接读
  // .score，null 会让整条 pipeline 抛 "Cannot read properties of null"。
  if (sentenceCount === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const score = Math.min(
    1,
    l1.length * 0.45 + l2.length * 0.6 + l3.length * 0.75
  );
  if (score < 0.2) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    dimension: 'monocausal_attribution',
    severity: Math.round(score * 100),
    score,
    sentenceCount,
    legs: {
      compress: l1.length,
      enumerateDismiss: l2.length,
      contradiction: l3.length,
    },
    evidence: l2.concat(l3).slice(0, 2).map((e) => e.sentence).concat(
      l1.slice(0, 1).map((e) => e.sentence)
    ),
    details:
      '单因归因(' +
      (l1.length ? '压缩' + l1.length + '处 ' : '') +
      (l2.length ? '枚举否认' + l2.length + '处 ' : '') +
      (l3.length ? '归因相消' + l3.length + '处 ' : '') +
      (l2.length || l3.length
        ? '如「' + (l2[0] || l3[0]).sentence.slice(0, 60) + '」'
        : '如「' + l1[0].sentence.slice(0, 60) + '」') +
      ')',
    guidance:
      '不要把结果压到单一原因：显式承认其他候选成因，或说明为何排除它们（带证据）。' +
      '若句中先列举多个成因又宣布其无关，需给出排除依据，否则改为多因表述。',
    tags: ['causal', 'monocausal', 'attribution', 'reasoning'],
  };
}

module.exports = { detectMonocausal, splitSentences };
