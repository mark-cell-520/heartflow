/**
 * src/shield/adversarial-variant.js — 对抗变体检测器
 *
 * 启发来源：Hermes 合伙人专访（2026-08-10 微信文章）
 * 「任何智力没有远超全人类的模型，都是可以越狱的。因为你有无限次尝试，
 *   去骗一个没有记忆的东西。每一次失败，其实是你在拿自己做强化学习。」
 *
 * 推论：心虫模式库修掉一个已知绕过（如 NFKC 弯引号）之后，攻击者还会
 * 用零宽字符、同形字（homoglyph）、词拆分、Unicode 变体继续试。把攻击者的
 * "无限次尝试"内置成检测器自己的变体攻击面，主动暴露而非被动等绕过。
 *
 * 纯规则，零 LLM 依赖。输出与心虫 gate 兼容（{action, risk, evidence}）。
 */

// ─── 检测信号 ───

/** S1: 零宽字符 — U+200B..U+200D, U+2060, U+FEFF 等不可见字符 */
const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/;

/** S2: 同形字混淆 — 西里尔/希腊字母伪装成拉丁字母（а→a, е→e, о→o, р→p, с→c, х→x, ν→v, Ι→l） */

// [v6.7.122] 原判据 `[\u0400-\u04FF\u0370-\u03FF]` 命中**整个西里尔块 + 整个希腊块**，
// 与"是否假扮拉丁字母"无关。实测后果（scripts/ 下的探针，v6.7.121 第 21 轮）：
//   - 俄文正常句（44 个西里尔字符）被判 gate rewrite「对抗变体: 同形字混淆」
//   - 希腊字母数学式（α/β/π）同样 rewrite
//   - 双向门禁 benign 组里任何含西里尔/希腊的正常内容都被动抬高误拦
// 而**真同形攻击从未依赖"整块命中"**：`kиll` / `раssword` / `Аdmin` 都只是
// 在拉丁词里替换 1~2 个视觉同形字母。整段西里尔文（俄文文章）反而是正常内容。
//
// 修正判据：只有"视觉同形字母"出现在拉丁字母上下文中才算攻击。三层条件：
//   ① 字符必须在视觉同形集合内（CYR_HOMOGLYPH_LOOKALIKE，与 text-normalizer
//      的 CYRILLIC_HOMOGLYPH 同一族概念——只收确实长得像拉丁的）；
//   ② 同一段文本里必须有拉丁字母（否则是纯俄文/希腊文，正常）；
//   ③ 同形字符占比要低（正常俄文接近 100%，攻击样本 < 20%）——
//      攻击者只换几个字母，换多了人眼就能看出来，攻击不成立。
/** 视觉同形的西里尔/希腊字母（与 text-normalizer.js 的 CYRILLIC_HOMOGLYPH 同族）
 *  [v6.7.122] 比 text-normalizer 的表多收 U+0438（и，反向 n）与 U+0405（Ѕ，像 S）：
 *  实测 `kиll` / `Ѕее` / `How do I kиll this process?` 三条因这两个字符缺席而漏判。
 *  它们是西里尔块里最高频的同形字母，攻击者最省事的选择。 */
const CYR_HOMOGLYPH_LOOKALIKE = new Set([
  '\u0430', '\u0435', '\u043e', '\u0440', '\u0441', '\u0443', '\u0445', '\u0455', '\u0456',
  '\u0458', '\u04bb', '\u0501', '\u051b', '\u0261',
  '\u0438', '\u0405', '\u0406', '\u0408',
  '\u0410', '\u0415', '\u041e', '\u0420', '\u0421', '\u0425', '\u0423', '\u0406',
  '\u0418', '\u0405',
  '\u0412', '\u041a', '\u041c', '\u041d', '\u0422',
  '\u03bf', '\u03b1', '\u03b5', '\u03c1', '\u03c5', '\u039f', '\u0391', '\u0395', '\u03a1', '\u03a5',
]);
/** 拉丁字母（攻击必须发生在拉丁上下文里） */
const LATIN_LETTER_RE = /[A-Za-z]/;
/** 同形字符占比上限：超过此比例说明整段就是西里尔/希腊文，不是假扮 */
const HOMOGLYPH_RATIO_MAX = 0.3;

/** 判断是否"拉丁上下文中的同形字母假扮"（区别于正常俄文/希腊文） */
function _findHomoglyphAttack(text) {
  let letters = 0;      // 拉丁 + 视觉同形字母总数（用作占比分母）
  let lookalikes = 0;   // 视觉同形字母数
  const hits = [];
  for (const ch of text) {
    if (LATIN_LETTER_RE.test(ch)) { letters++; continue; }
    if (CYR_HOMOGLYPH_LOOKALIKE.has(ch)) { letters++; lookalikes++; hits.push(ch); }
  }
  // ① 没有视觉同形字母 → 不是同形攻击（纯俄文里的大量非同形西里尔字母走这里）
  if (lookalikes === 0) return null;
  // ② 没有拉丁字母 → 纯西里尔/希腊文本，属正常内容。
  //    [v6.7.122] 试过对「≤6 个同形字母的极短串」也判命中（想抓 `Ѕее` 这种
  //    全同形载荷），但**回归**：正常希腊语句的视觉同形字母数同样 ≤6，
  //    被打成 rewrite。没有拉丁上下文时「假扮某拉丁词」与「正常西里尔/希腊短词」
  //    在纯规则层不可区分——强行收窄只会误伤。结论：维持放行，把
  //    `Ѕее` 一类记为已知局限（见 UPGRADE_LOG 遗留节），等有语义层能力再收。
  if (!LATIN_LETTER_RE.test(text)) return null;
  // ③ 占比过高 → 整段就是该文字（俄文文章、希腊文文献），不是假扮
  if (lookalikes / letters > HOMOGLYPH_RATIO_MAX) return null;
  return hits;
}

/** S2b: 弯引号/弯撇号 — U+2018/2019/201C/201D 是 ASCII 引号的视觉同形，模式库常只写 ASCII 变体 */
const CURLY_QUOTE_RE = /[\u2018\u2019\u201C\u201D]/g;

/** S3: 全角/异体字符残留 — 全角字母数字（ｈａｔｅ 是 FF48/FF41/FF54/FF45）＋异体残留（排除中文全角标点） */
const FULLWIDTH_RE = /[\uFF01-\uFF0E\uFF10-\uFF19\uFF1A-\uFF20\uFF21-\uFF3A\uFF3B-\uFF40\uFF41-\uFF5A\uFF5B-\uFF5E]/;
/** 中文全角标点（正常中文文本，不视为变体）
 *  [v6.7.122] 两处修正：
 *   ① 原来没有 `g` 标志 → `String.replace` 只删第一个命中，第二个及以后的
 *      中文逗号/分号/冒号全部残留，被 FULLWIDTH_RE 当成全角变体 → 任何含两个
 *      以上中文标点的正常句子都判 verify。实测「总价 ¥3,580，折扣 12%，实付 ¥3,150。」
 *      仅因第二个 `，` 残留就命中 fullwidth。
 *   ② 原来的 `""` / `''` 是 **ASCII 引号**（U+0022/U+0027），不是中文弯引号。
 *      作者本意是 U+201C/U+201D/U+2018/U+2019，被输入法转成 ASCII。
 *      但弯引号在 S2b 里本身就是高危攻击信号（模式库写 can't 时 U+2019 会绕过），
 *      **不能**在这里豁免——否则等于自己拆掉弯引号检测。
 *      结论：维持 ASCII 引号（无害：它们在 FULLWIDTH_RE 范围外），但改用码位书写，
 *      让意图与字符不再脱节。 */
const CN_PUNCT_RE = /[\u3002\uFF0C\u3001\uFF1B\uFF1A\uFF1F\uFF01\uFF08\uFF09\u3010\u3011\u300A\u300B\u300C\u300D\u300E\u300F\u3008\u3009\u2026\u00B7]/g;

/** S4: 组合字符/修饰符 — 重音堆叠（e\u0301），可绕过子串匹配 */
const COMBINING_RE = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF]/;

/** S5: 数字混淆 — 全角数字 １２３、上标 ¹²³、带圈数字 ① */
const DIGIT_OBFUS_RE = /[\uFF10-\uFF19\u00B9\u00B2\u00B3\u2070-\u2079\u2460-\u2473]/;

/** S6: 词拆分 — 单词内插入空格/符号（"h a t e"、"f*ck"）
 *  要求 ≥4 个单字母间隔（h a t e）或字母+符号插入，避免误伤正常英文 "is a n"（跨单词） */
const WORD_SPLIT_RE = /(?:[a-zA-Z]\s{1,2}[a-zA-Z]\s{1,2}[a-zA-Z]\s{1,2}[a-zA-Z]|[a-zA-Z][*@#$%^&][a-zA-Z])/;

// ─── 主检测 ───

/**
 * 检测文本中的对抗变体信号
 * @param {string} text
 * @returns {{action: string, risk: 'high'|'medium'|'low'|'none', signals: Array, normalized: string|null}}
 *   action: 'pass'（无变体）/ 'verify'（可疑）/ 'rewrite'（高变体——建议先归一化再判别）
 */
function checkAdversarialVariant(text) {
  if (typeof text !== 'string' || !text.length) {
    return { action: 'pass', risk: 'none', signals: [], normalized: null };
  }

  const signals = [];

  // 零宽字符：攻击者用它打断敏感词匹配，视觉不可见
  const zw = text.match(ZERO_WIDTH_RE);
  if (zw) signals.push({ id: 'zero_width', name: '零宽字符', count: zw.length, severity: 0.9 });

  // 同形字：拉丁上下文中的西里尔/希腊视觉同形字母假扮——"kill" 用 киll
  // [v6.7.122] 只有"少数几个同形字母混进拉丁文本"才算攻击；整段俄文/希腊文是正常内容
  const hg = _findHomoglyphAttack(text);
  if (hg) signals.push({ id: 'homoglyph', name: '同形字混淆', count: hg.length, severity: 0.85 });

  // 弯引号：模式库写 can't 时 U+2019 会绕过——归入同形字类高危
  const cq = text.match(CURLY_QUOTE_RE);
  if (cq) signals.push({ id: 'curly_quote', name: '弯引号', count: cq.length, severity: 0.85 });

  // 全角残留：未归一化的全角字母/数字（"ｈａｔｅ"）——先剔除中文全角标点（那是正常中文）
  const fwText = text.replace(CN_PUNCT_RE, '');
  const fw = fwText.match(FULLWIDTH_RE);
  if (fw) signals.push({ id: 'fullwidth', name: '全角字符', count: fw.length, severity: 0.7 });

  // 组合字符：重音堆叠拆词
  const cb = text.match(COMBINING_RE);
  if (cb) signals.push({ id: 'combining', name: '组合字符', count: cb.length, severity: 0.6 });

  // 数字混淆
  // [v6.7.122] 上标数字 ¹²³ 与带圈数字 ① 确实是混淆手法，但**数学幂运算的
  // 上标**（x²、y³、r²）是正常表达。判据：上标紧跟【拉丁字母、右括号、右方括号】
  // 时是数学上标（底数在前），剔除后再判；独立的 `¹²³`、`①号操作` 仍算混淆。
  // 实测：「设 x² + y² = r²，则面积 A = πr²。」原判据命中 digit_obfus:1 → verify。
  const dgText = text.replace(/(?<=[A-Za-z0-9\)\]\u03c0\u00b0])[\u00B9\u00B2\u00B3\u2070-\u2079]/g, '');
  const dg = dgText.match(DIGIT_OBFUS_RE);
  if (dg) signals.push({ id: 'digit_obfus', name: '数字混淆', count: dg.length, severity: 0.5 });

  // 词拆分
  const ws = text.match(WORD_SPLIT_RE);
  if (ws) signals.push({ id: 'word_split', name: '词拆分', count: ws.length, severity: 0.75 });

  if (signals.length === 0) return { action: 'pass', risk: 'none', signals: [], normalized: null };

  // 风险分级：零宽/同形字是高危（直接绕过模式匹配）；组合/全角中危；数字低危
  // 2026-08-10 修正：任何变体信号都不应 pass——单信号最低 verify
  const highCount = signals.filter(s => s.severity >= 0.8).length;
  const weighted = signals.reduce((sum, s) => sum + s.severity, 0);
  const risk = highCount > 0 || weighted >= 1.5 ? 'high' : 'medium'; // 有信号即至少 medium
  const action = risk === 'high' ? 'rewrite' : 'verify'; // 任何变体都 verify 起步

  // 提供归一化建议（调用方可用 NFKC 折叠后重新判别）
  let normalized = null;
  try {
    normalized = text.normalize('NFKC')
      .replace(CURLY_QUOTE_RE, m => ({ '‘': "'", '’': "'", '“': '"', '”': '"' })[m])
      .replace(ZERO_WIDTH_RE, '').replace(COMBINING_RE, '');
  } catch (e) { /* ignore */ }

  return { action, risk, signals, normalized };
}

module.exports = { checkAdversarialVariant };
