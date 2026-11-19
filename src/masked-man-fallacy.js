/**
 * src/masked-man-fallacy.js — 「内涵语境替换失效（masked-man fallacy /
 * intensional context substitution failure）」检测器（第 273 个判别维度，r407）
 *
 * [r407 立项] 缺口实证：scripts/round-407/probe-r407-gap.js（v6.8.206 基线）
 * 攻击族 7 条中 6 条 gate.action=pass 完全穿引擎（仅 1 条被存量
 * illicit_conversion 代拦——「她知道丈夫是那个送花的人…」形含隐存量腿）；
 * 良性 10 条存量非 pass 3 条全为存量维度（contradiction/perfect_error 等），
 * 本族零误伤。272 个已接线维度无 masked / intensional / referentially
 * opaque / opaque context 键。decision 本体裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：内涵语境替换失效（masked-man fallacy / intensional fallacy /
 * failure of substitutivity in opaque contexts）——认知主体知道/相信/
 * 认识某个对象的**指称对象 X**（用名称 A 识别），句中给出 X 的**另一
 * 个共指描述 B**（A = B，同一对象），却把「主体知道 A」直接替换成
 * 「主体知道 B」，在**不知道 A 与 B 是同一对象**的情况下推断主体对
 * B 也有同样的认知态度。替换后命题为假而原命题为真——经典的
 * 「morning star = evening star」「Superman = Clark Kent」结构。
 *
 * 典型措辞：
 *   我知道我的邻居是张三，而张三就是市长，所以我知道市长是谁。
 *   小明知道领奖台上的是冠军，而冠军就是小刚，所以小明知道领奖台上的是小刚。
 *   The morning star is the evening star, so whoever knows the morning star knows the evening star.
 *   Lois knows Superman can fly; Clark Kent is Superman, so Lois knows Clark Kent can fly.
 *   我认识那个戴面具的人，而他就是新来的总裁，所以我认识总裁。
 *
 * 为什么现有维度拦不住（r407 归因，逐邻居探针验证）：
 *   · illicit_conversion 管「SAP→PAS」换位；本族不换位，是**共指描述
 *     替换**（知道 A + A=B → 知道 B），结构中无全称命题可换。
 *   · affirming_the_consequent 管条件句后件肯定；本族没有条件句形式。
 *   · equivocation_sense_shift 管一词多义漂移；本族每个词项词义不变，
 *     变的是**指称透明度**（referential opacity）。
 *   · circular_reasoning 管结论在前提中；本族结论不在前提中，推理
 *     步骤本身无效。
 *   · hasty_generalization 管样本不足；本族与样本量无关。
 *   · undistributed_middle 管中项不周延；本族三段论中项形式合法，
 *     失效发生在**命题态度语境**（知道/相信）内部。
 *
 * [r407 豁免表设计] 五组豁免（替换知识在场 / 同一性知识在场 / 转述批评 /
 * 疑问形 / 概率与认识论谨慎），保证「我知道张三就是市长，所以我和市长
 * 是老熟人」这类**已知同一性后的合法替换**以及「这是 masked-man fallacy
 * 的典型错误」这类破除性陈述不被误伤。
 *
 * 判据（两腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① EPISTEMIC 命题态度腿——知道/认识/相信/意识到/认出/发现/听说/
 *     了解谁是（EN knows / believes / is aware / recognizes / realizes /
 *     is familiar with）
 *   腿② COREFERENTIAL 共指桥接腿——「A 就是 B / A 是 B / A = B /
 *     A and B are the same / A is B」形态的同一性断言在场（EN is /
 *     are the same person as / is actually / turns out to be）
 *   腿③ OPACITY_INFERENCE 不透明推断腿——把腿①的态度直接传递给腿②
 *     的另一描述（所以我知道 B / 因此他认识 B / so he knows B /
 *     therefore she knows B）——替换结论在场
 *
 * 为什么取 VERIFY 级：单句可能是逻辑教学反例（「这是 masked-man
 * fallacy」正是本族要教的判别动作）、对他人推理的转述批评、小说叙事中
 * 的身份误会描写。verify 的含义是「这个把命题态度跨共指描述传递的推断
 * 需要主体对 A=B 同一性的认知作前提，否则替换无效」——调用方应要求补
 * 上「主体是否知道 A 与 B 是同一对象」，而不是接受无效替换的结论。
 *
 * 与既有维度的边界（r407 归因）：
 *   · illicit_conversion 判全称命题换位；本族判共指描述在命题态度语境的替换。
 *   · equivocation_sense_shift 判词义漂移；本族词义不变、指称透明度变。
 *   · undistributed_middle 判三段论中项不周延；本族三段论形式合法。
 *   · affirming_the_consequent 判条件句后件；本族无条件句。
 */

// ─── 腿① EPISTEMIC 命题态度（中英，含裸名词形态）───────────────────────
const EPISTEMIC_ZH = [
  /(?:我|他|她|我们|他们|咱|谁|有人|大家)?(?:知道|知晓|深知)(?:道)?(?:是|了|的)?/,
  /(?:我|他|她|我们|他们|咱|谁|有人)?(?:认识|认得|熟悉|了解)(?:是|的)?/,
  /(?:我|他|她|我们|他们|咱)?(?:相信|确信|坚信|笃定|以为|认为)(?:是|的)?/,
  /(?:我|他|她|我们|他们|咱)?(?:意识|注意|察觉)(?:到)?/,
  /(?:认出|认得出|辨认出|发现|看出|知道)(?:是|了)?/,
  /(?:听说|听闻)(?:过)?/,
  /(?:不|没)(?:知道|认识|意识)/,
  // [r407] 知识断言裸名词形（「知道他是谁」「认识那个人」）
  /知(?:道|情)(?:他|她|它)?(?:是|为)?(?:谁|哪一个|哪一位|身份)/,
  /认(?:识|得)(?:他|她|它|那位|那个|这人)/,
];
const EPISTEMIC_EN = [
  /\b(?:i|he|she|we|they|you|who|anyone|everyone|people|[A-Z][a-z]+)\s+(?:know|knows|knew)\b/i,
  /\b(?:i|he|she|we|they|you)\s+(?:believe|believes|believed|think|thought)\b/i,
  /\b(?:is|are|am)\s+(?:aware|familiar|acquainted)\b/i,
  /\b(?:recognize|recognizes|recognized|realize|realizes|realized|notice|noticed)\b/i,
  /\b(?:knows?|knew)\s+(?:who|which|what)\b/i,
  /\b(?:is|are)\s+(?:acquainted|familiar)\s+with\b/i,
  // [r407] 命题态度动词裸名词形（believes that / is aware that）
  /\b(?:believes?|thinks?|suspects?|assumes?|presumes?)\s+that\b/i,
  /\b(?:aware|unaware)\s+(?:of|that)\b/i,
  // [r407] whoever/anyone/everyone + knows 形（masked-man 经典英文句式）
  /\b(?:whoever|anyone|everyone|those\s+who)\s+(?:know|knows|knew|believe|believes|recognize|recognizes)\b/i,
  // [r407] 专名主语命题态度（Lois knows / Clark believes——专名+态度动词）
  /\b(?:[A-Z][a-z]+\s+)?(?:knows?|knew|believes?|recognizes?|realizes?)\s+(?:[A-Z][a-z]+\s+)?(?:can|could|is|are|was|were)?\b/i,
];

// ─── 腿② COREFERENTIAL 共指桥接（中英，同一性断言在场）──────────────────
const COREFERENTIAL_ZH = [
  /(?:就)?是(?:同|一)(?:个?人|回事|码事|对象)/,
  /(?:就|正|恰|恰恰)?(?:是|为)(?:他|她|它|那位|那个|此人)/,
  /(?:和|与|跟)(?:他|她|它)(?:是|为)(?:同一|同一个)/,
  /(?:其实|实际上|事实上|原来|压根|根本)(?:就)?是/,
  /(?:A|甲)\s*(?:=|＝|等于|就是|即)\s*(?:B|乙)/i,
  /(?:同一个人|同一对象|同一人|一回事|一码事)/,
  /(?:真名|本名|真实身份|真身)(?:就)?是/,
  /(?:便是|乃是|即系)/,
  // [r407] 裸名词同一性形（「张三就是市长」「冠军正是小刚」）
  /(?:就是|正是|乃是|其实是|实际上是|原来是)/,
];
const COREFERENTIAL_EN = [
  /\b(?:is|are)\s+(?:the\s+same\s+(?:person|man|woman|thing|individual|one)\s+as)\b/i,
  /\b(?:is|are)\s+(?:actually|really|in\s+fact|secretly)\b/i,
  /\bturns?\s+out\s+to\s+be\b/i,
  /\b(?:A|X|Y|Z)\s*(?:=|==)\s*(?:B|X|Y|Z)\b/,
  /\b(?:one\s+and\s+the\s+same|identical\s+(?:to|with))\b/i,
  /\b(?:whose\s+real\s+(?:name|identity)|real\s+name\s+is|true\s+identity\s+is)\b/i,
  /\b(?:is|are)\s+(?:none\s+other\s+than|nothing\s+other\s+than)\b/i,
  /\b(?:a\.?k\.?a\.?|alias(?:es)?\s+(?:of|for))\b/i,
  // [r407] 共指桥接裸名词形（Clark Kent is Superman / morning star is evening star）
  /\b(?:is|are)\s+(?:superman|clark\s+kent|batman|spider[- ]man)\b/i,
  /\b(?:morning\s+star|evening\s+star|venus)\b/i,
  /\b(?:is|are)\s+(?:the\s+)?(?:mayor|president|boss|manager|teacher|neighbour|neighbor|champion|winner)\b/i,
  // [r407] 亲属/同一性指称形（is his own brother / is his brother）
  /\b(?:is|are)\s+(?:his|her|their|my)\s+(?:own\s+)?(?:brother|sister|father|mother|son|daughter|wife|husband|twin|colleague|boss)\b/i,
];

// ─── 腿③ OPACITY_INFERENCE 不透明推断（替换结论在场）────────────────────
const OPACITY_INFERENCE_ZH = [
  // [r407] 允许「所以 + 任意短主语 + 知道」（小明/那个人/台下的人）
  /所以[^。！？，,；;]{0,8}(?:知道|认识|了解|熟悉|认得|相信|确信|笃定)/,
  /因此[^。！？，,；;]{0,8}(?:知道|认识|了解|熟悉|认得|相信|确信|笃定)/,
  /(?:那么|这么说|由此|故而)[^。！？，,；;]{0,8}(?:知道|认识|了解|熟悉|认得|相信|确信|笃定)/,
  /(?:我|他|她|我们|他们|咱)(?:也)?(?:知道|认识|了解|认得)(?:他|她|它|那位|那个|其)/,
  // [r407] 替换结论裸名词形（「所以我知道市长是谁」「他认识冠军」）
  /(?:知道|认识|了解|认得)[^。，,；;]{0,4}(?:是|为)?(?:谁|哪一个|哪一位|身份)/,
  /(?:可见|足见|不难看出)(?:我|他|她|我们|他们|咱)?(?:知道|认识|了解|认得)/,
];
const OPACITY_INFERENCE_EN = [
  /\b(?:so|therefore|thus|hence|then)\s+(?:i|he|she|we|they|you|[A-Z][a-z]+)\s+(?:know|knows|knew|believe|believes|recognize|realize|am\s+aware|is\s+aware|are\s+aware)/i,
  /\b(?:i|he|she|we|they|you)\s+(?:also\s+)?(?:know|knows|knew|recognize|realize)\s+(?:who|which|that)\b/i,
  /\b(?:so|therefore|thus)\s+(?:whoever|anyone|everyone)\b/i,
  /\b(?:it\s+follows\s+that)\s+(?:i|he|she|we|they)\s+(?:know|believe|recognize|am\s+aware)/i,
  /\b(?:know|knows|knew)\s+(?:who|which)\s+(?:the\s+)?(?:mayor|president|boss|manager|champion|winner)\s+is\b/i,
  // [r407] 裸名词替换形（he knows the mayor / she knows the champion）
  /\b(?:knows?|knew|recognizes?|realizes?)\s+(?:the\s+)?(?:mayor|president|boss|manager|teacher|neighbour|neighbor|champion|winner)\b/i,
  // [r407] "am aware + the + 共指名词"（so I am aware the dropout ...）
  /\b(?:am|is|are)\s+aware\s+(?:of\s+)?(?:the\s+)?(?:dropout|winner|mayor|president|boss|manager|teacher|neighbour|neighbor|champion|masked\s+\w+)\b/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────────────
// EXEMPT_SAMEKNOWN 替换知识/同一性知识在场——主体已知 A=B，替换合法
const EXEMPT_SAMEKNOWN_ZH = [
  /(?:知道|清楚|明白|了解|意识到)(?:他|她|它)?(?:就是|正是|其实是)/,
  /(?:早就|早已|原来|其实)(?:知道|清楚|明白)(?:他|她|它)?(?:是|就是)/,
  /(?:知道|认识)(?:他|她|它)?(?:的)?(?:真名|本名|真实身份|真身)/,
  // [r407 修复] 认识+身份词的合法替换形（「我认识市长本人」），但排除
  // 出现在「所以/因此 + 认识 + 身份词」的攻击句尾（那是不透明推断腿本身，
  // 不是合法替换）——豁免只保护**非推断位置**的已知同一性陈述。
  /(?:^|[。！？；;]|，)(?:我|他|她|我们|他们|咱)?(?:早就|早已)?(?:认识|熟悉|认得)(?:这位|那个|这位)?(?:市长|总裁|冠军|老板|经理)(?:本人|其人)?(?:[。！？；;]|$)/,
  /(?:认识|熟悉)(?:市长|总裁|冠军|老板)(?:本人|本人了)/,
  /(?:拆穿|识破|揭穿|看穿)(?:了)?(?:他|她|它)?(?:的)?(?:伪装|面具|身份)/,
  /(?:确定|敢肯定|百分百)(?:他|她|它)?(?:就是)/,
];
const EXEMPT_SAMEKNOWN_EN = [
  /\b(?:knows?|knew|realizes?|realized)\s+(?:that\s+)?(?:he|she|they)\s+is\b/i,
  // [r407] 「I know that Clark Kent is Superman」形——know that + 专名同一性
  /\b(?:know|knows|knew|realize|realizes|realized|aware)\s+that\s+[A-Z][a-z]+\s+(?:Kent\s+)?is\s+[A-Z]/,
  /\b(?:know|knows|knew)\s+that\s+(?:the\s+)?(?:mayor|president|boss|manager|champion|winner|hero|masked)\b/i,
  /\b(?:is|are)\s+aware\s+(?:that|of)\s+(?:the\s+)?(?:identity|same)/i,
  /\b(?:knows?\s+(?:his|her|their)\s+(?:real\s+)?(?:name|identity))\b/i,
  // [r407 修复] 合法替换形限定在句首/标点边界后，且**句末**是真实收尾
  // （后面不能再接推断连接词 so/therefore/thus）。用「known-X」回指形
  // （the mayor himself / the boss in person）替代原「know X personally」形，
  // 后者与 masked-man 攻击句首完全同形无法共存。
  /(?:^|[.;:!?]\s+)(?:i|we|they|he|she)\s+(?:know|knows|knew)\s+the\s+(?:mayor|president|boss|manager|teacher|champion|winner)\s+(?:himself|herself|in\s+person)\b/i,
  /\b(?:knows?|knew)\s+(?:him|her|them)\s+(?:personally|well|by\s+name)\b/i,
  /\b(?:sees?\s+through\s+(?:the\s+)?(?:disguise|mask|facade|pretense))\b/i,
];

// EXEMPT_METASTATEMENT 元陈述破除——正在指出本谬误本身
const EXEMPT_METASTATEMENT_ZH = [
  /masked[- ]?man|内涵语境|指称不透明|不透明语境|命题态度/,
  /(?:偷换|混淆)(?:概念|指称|对象)/,
  /(?:这是|属于|犯了|典型)(?:的)?(?:逻辑)?(?:错误|谬误| fallacy)/i,
  /(?:逻辑|推理|谬误)(?:错误|问题|漏洞)/,
];
const EXEMPT_METASTATEMENT_EN = [
  /\bmasked[- ]?man\b|\bintensional\s+(?:context|fallacy)\b|\breferentially\s+opaque\b|\bfailure\s+of\s+substitutivity\b/i,
  /\b(?:this|that)\s+is\s+(?:a\s+)?(?:logical\s+)?(?:fallacy|error|mistake)\b/i,
  /\b(?:invalid|fallacious|illogical)\s+(?:inference|substitution|reasoning)\b/i,
  /\bopacity\s+(?:of|in)\s+(?:contexts?|propositional)\b/i,
];

// EXEMPT_QUESTION 疑问形与转述——探询/提问不是断言
const EXEMPT_QUESTION_ZH = [
  /(?:吗|呢|吧)?[？?]/,
  /(?:难道|莫非|是否|是不是|有没有)(?:知道|认识|了解)/,
];
const EXEMPT_QUESTION_EN = [
  /\?\s*$/,
  /\b(?:does|do|did)\s+(?:he|she|anyone)\s+(?:know|believe|recognize)\b/i,
];

// EXEMPT_HEDGE 认识论谨慎——概率/限定表述
const EXEMPT_HEDGE_ZH = [
  /(?:可能|也许|大概|似乎|恐怕|未必)(?:知道|认识|了解)/,
  /(?:除非|如果)(?:他|她|它)?(?:知道|认识|了解)/,
  /(?:不|未必)(?:一定|必然)(?:知道|认识|了解)/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:might|may|could|perhaps|possibly)\s+(?:know|believe|recognize|realize)\b/i,
  /\b(?:unless|if)\s+(?:he|she|they)\s+(?:knows?|knew|realizes?)\b/i,
  /\bnot\s+(?:necessarily|certainly)\s+(?:know|believe|recognize)\b/i,
];

// ─── 跨腿邻近窗（中 100 字 / 英 320 字符，同 homogeneity 口径）──────────
const WIN_ZH = 100;
const WIN_EN = 320;

function earliestIdx(list, text) {
  let best = -1;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m && m.length > 0) {
      const i = text.indexOf(m[0]);
      if (i >= 0 && (best < 0 || i < best)) best = i;
    }
  }
  return best;
}

function earliestEither(zhList, enList, text) {
  const a = earliestIdx(zhList, text);
  const b = earliestIdx(enList, text);
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * 内涵语境替换失效判别：命题态度腿 × 共指桥接腿 × 不透明推断腿，三腿
 * 共现 + 跨腿邻近窗 + 豁免，缺一不判。
 *
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMaskedManFallacy(text, inject) {
  // [稳定性审计惯例] 非字符串入口守卫。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // ─── 豁免：替换知识 / 元陈述破除 / 疑问转述 / 认识论谨慎在场 → 不判 ──
  const S_Z = R.EXEMPT_SAMEKNOWN_ZH || EXEMPT_SAMEKNOWN_ZH;
  const S_E = R.EXEMPT_SAMEKNOWN_EN || EXEMPT_SAMEKNOWN_EN;
  if (anyHit(S_Z, text) || anyHit(S_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const M_Z = R.EXEMPT_METASTATEMENT_ZH || EXEMPT_METASTATEMENT_ZH;
  const M_E = R.EXEMPT_METASTATEMENT_EN || EXEMPT_METASTATEMENT_EN;
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const Q_Z = R.EXEMPT_QUESTION_ZH || EXEMPT_QUESTION_ZH;
  const Q_E = R.EXEMPT_QUESTION_EN || EXEMPT_QUESTION_EN;
  if (anyHit(Q_Z, text) || anyHit(Q_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const H_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const H_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  if (anyHit(H_Z, text) || anyHit(H_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 三腿共现 ──────────────────────────────────────────────────────
  const p1 = earliestEither(R.EPISTEMIC_ZH || EPISTEMIC_ZH, R.EPISTEMIC_EN || EPISTEMIC_EN, text);
  if (p1 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const p2 = earliestEither(R.COREFERENTIAL_ZH || COREFERENTIAL_ZH, R.COREFERENTIAL_EN || COREFERENTIAL_EN, text);
  if (p2 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const p3 = earliestEither(R.OPACITY_INFERENCE_ZH || OPACITY_INFERENCE_ZH, R.OPACITY_INFERENCE_EN || OPACITY_INFERENCE_EN, text);
  if (p3 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  const win = /[\u4e00-\u9fff]/.test(text) ? (R.WIN_ZH ?? WIN_ZH) : (R.WIN_EN ?? WIN_EN);
  const span = Math.max(p1, p2, p3) - Math.min(p1, p2, p3);
  if (span > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.55, count: 1,
    detail: /[\u4e00-\u9fff]/.test(text)
      ? '内涵语境替换失效×命题态度×共指桥接×不透明推断(zh)'
      : 'masked-man-fallacy×epistemic-attitude×coreferential-bridge×opacity-inference(en)',
  };
}

module.exports = {
  checkMaskedManFallacy,
  // 负例注入口（逐常量验证承重）
  EPISTEMIC_ZH, EPISTEMIC_EN,
  COREFERENTIAL_ZH, COREFERENTIAL_EN,
  OPACITY_INFERENCE_ZH, OPACITY_INFERENCE_EN,
  EXEMPT_SAMEKNOWN_ZH, EXEMPT_SAMEKNOWN_EN,
  EXEMPT_METASTATEMENT_ZH, EXEMPT_METASTATEMENT_EN,
  EXEMPT_QUESTION_ZH, EXEMPT_QUESTION_EN,
  EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  WIN_ZH, WIN_EN,
};
