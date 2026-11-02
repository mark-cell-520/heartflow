/**
 * src/ad-nauseam.js — 「诉诸重复」检测器
 * （第 191 个判别维度，r193 立项）
 *
 * [r193 立项] decision 本体在当前引擎（v6.8.120，190 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证：现有 190 维全部是**单句内容型**谬误（诉诸/因果/概率/操纵…），
 *     无一覆盖**重复密度型**论证缺陷——把同一断言在文本里重复多遍、以重复
 *     频率冒充论据强度（argumentum ad nauseam / appeal to repetition /
 *     broken record）。侦察落盘 /tmp/hf-scout-<ts>.txt：HN Algolia 命中
 *     arXiv:2405.02318（NL→FOL 逻辑谬误检测）；GitHub fallacy-detection
 *     仓库全为 LLM/T5 方案（tmakesense/logical-fallacy 21★ 等），对纯规则
 *     引擎无可复用代码——判据为心虫自有纯规则实现（零 LLM 依赖）。
 *   · 该族在 AI 反复强调式输出里高发（"这个方案是安全的。这个方案是安全的。
 *     这个方案是安全的。"用复读代替论证），是「似是而非」的典型：看起来态度
 *     笃定，实则是用出现次数冒充证据强度。
 *
 * 辨别的族：诉诸重复（argumentum ad nauseam）——把**同一断言**（≥6 个汉字
 * 的内容子句 / ≥3 个英文词的短语）在**多句内重复 ≥3 遍**（或 ≥2 遍且带显式
 * 重复标记），以重复频率冒充论据强度：
 *   这个方案绝对安全。这个方案绝对安全。这个方案绝对安全。
 *   我已经反复强调过，数据是真实的。数据是真实的。
 *   The policy will work. The policy will work. The policy will work.
 *   As I've said many times, the science is settled. The science is settled.
 *
 * 与既有维度的边界（刻意错开）：
 *   · sycophancy 管「迎合讨好」的语气，本族不管语气、管**重复即证据**的
 *     论证结构缺陷。
 *   · absolute_claim 管「绝对化措辞」，本族不管措辞绝对与否、管同一断言
 *     被复读的次数。
 *   · relative_pration（诉诸更惨）/ 其余 appeal_* 家族管**内容型**谬误，
 *     本族是**结构型**（重复密度）判别，与所有单句内容维度正交。
 *
 * 判据（重复单元 × 出现次数两腿 + 分组豁免，缺一不判）：
 *   · 腿① UNIT 重复单元——把文本按句读/标点切子句，归一化（去标点空白、
 *     小写）后，取满足长度门槛的**内容子句**作为候选重复单元：
 *       · 中文：归一化后含 ≥MIN_LEN_ZH_CJK(6) 个汉字（裸名词/裸子句形态，
 *         不收「好的」「要诚实」这类 ≤5 字口头禅——r161 教训：枚举腿收裸形态，
 *         复读腿以「子句」为单位天然覆盖裸名词与倒装形）。
 *       · 英文：原子句 ≥MIN_WORDS_EN(3) 个词且归一化后含 ≥3 连续字母
 *         （排除版本号/纯数字/代码 token 的偶然重复）。
 *   · 腿② COUNT 出现次数——该单元在全文归一化串 N 中的**非重叠出现次数**：
 *       · 纯复读路径：COUNT ≥ MIN_COUNT_PURE(3)（同一子句原样或作为更长句
 *         的子串出现 ≥3 次——覆盖倒装/嵌套/部分重复形）。
 *       · 标记路径：全文带显式重复标记（我已经反复强调/我再说一遍/as I've
 *         said/over and over…）且 COUNT ≥ MIN_COUNT_MARKER(2)。
 *
 * 为什么取 VERIFY 级：重复既可能是真诚的强调（演讲/口号/教学复述），也可能是
 * 用复读冒充论证；单凭次数无法断定是操纵。verify 的含义是「这段把同一断言复读
 * 了多遍却没有递进证据/论证——请确认它不是在用出现次数代替论据，或改用递进式
 * 论证（补机制/补数据/补反例）」。调用方应要求给出**递进内容**而非复读。
 *
 * 明确不判的（豁免，全部可负例注入置空验证承重）：
 *   · 引文内复读（「…」「""」《》内的对话/歌词/引文重复是转述不是论证）——
 *     先剥离引文再统计（QUOTE_STRIP）。
 *   · 元讨论（重复论证/argumentum ad nauseam/ad nauseam/诉诸重复/老调重弹
 *     是谬误/repetition is a fallacy…——讨论这个谬误本身是正确判别）。
 *   · 否定/劝止（别再重复/不要重复/停止重复/避免重复/stop repeating/don't
 *     repeat——劝人别复读是正确判别，不是复读）。
 *   · 累积式并列（研究表明A…另有研究表明B…还有研究表明C…——各子句不同、
 *     无同一单元重复，是正当的证据累积，不是诉诸重复）。
 *   · 疑问句不整体豁免（修辞性复读质问"Does it work? Does it work?"正是本
 *     族攻击形）；但纯疑问无重复单元时不判（无重复腿自然不判）。
 */
'use strict';

// ─── 显式重复标记（标记路径降门：COUNT≥2 即判）────────────────────
const REPEAT_MARKER_ZH = [
  /我(?:已经)?(?:反复|多次|一再|屡次|时常|不断|不停)(?:地)?(?:强调|说|提|讲|指出|重申|重复)/,
  /我(?:再)?说(?:一)?遍|再说(?:一)?遍|重申(?:一)?遍|重复(?:一)?遍/,
  /再次强调|一再强调|反复强调|三令五申|不厌其烦|翻来覆去|车轱辘话|老调重弹/,
  /我(?:已经)?(?:说|讲|提)过(?:很)?多(?:次|遍)/,
];
const REPEAT_MARKER_EN = [
  /\bas i(?:'ve| have)? said\b/i,
  /\blike i said\b/i,
  /\bi keep saying\b/i,
  /\bi've said this\b/i,
  /\bover and over\b/i,
  /\bagain and again\b/i,
  /\btime and (?:time )?again\b/i,
  /\bas (?:i|we)(?:'ve| have)? (?:said|mentioned|stated|noted)\b/i,
  /\bto repeat\b/i,
  /\brepeating (?:myself|ourselves)\b/i,
  /\bmany times before\b/i,
];

// ─── 豁免一：元讨论（讨论这个谬误本身是正确判别）──────────────────
const EXEMPT_META_ZH = [
  /重复(?:论证|论证法|的?谬误|诉求|手法|论证谬误)/,
  /诉诸重复|argumentum ad nauseam|ad nauseam|broken record/,
  /老调重弹(?:是|属于|这种|的谬误|指)/,
  /复读(?:机|式)?(?:是|属于|这种|的?谬误)/,
];
const EXEMPT_META_EN = [
  /appeal to repetition/i,
  /argumentum ad nauseam/i,
  /ad nauseam/i,
  /repetition (?:is|as a) (?:fallacy|technique)/i,
  /broken record/i,
];

// ─── 豁免二：否定/劝止（劝人别复读是正确判别）──────────────────────
const EXEMPT_NEG_ZH = [
  /(?:别|不要|不用|不必|停止|避免|杜绝|切忌|少)(?:再)?(?:重复|老调重弹|翻来覆去|复读)/,
  /不要(?:再)?(?:翻来覆去|不厌其烦)/,
];
const EXEMPT_NEG_EN = [
  /stop repeating/i,
  /don'?t repeat/i,
  /quit repeating/i,
  /no need to repeat/i,
  /stop (?:being a )?broken record/i,
];

// ─── 引文剥离（引文内复读是转述不是论证）──────────────────────────
const QUOTE_STRIP = [
  /「[^」]*」/g,
  /“[^”]*”/g,
  /"[^"]*"/g,
  /《[^》]*》/g,
  /【[^】]*】/g,
];

// ─── 默认阈值 ─────────────────────────────────────────────────────
const DEFAULTS = {
  MIN_LEN_ZH_CJK: 6,   // 中文重复单元最少汉字数
  MIN_WORDS_EN: 3,     // 英文重复单元最少词数
  MIN_LEN_NORM: 6,     // 归一化后最短长度（中英共用下限）
  MIN_COUNT_PURE: 3,   // 纯复读路径：同一单元最少出现次数
  MIN_COUNT_MARKER: 2, // 标记路径：带显式重复标记时的最少出现次数
};

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 统计 unit 在 N 中的非重叠出现次数 */
function countOcc(N, unit) {
  if (!unit) return 0;
  let c = 0, i = 0;
  while ((i = N.indexOf(unit, i)) !== -1) { c++; i += unit.length; }
  return c;
}

/** 把原子句归一化为重复单元；不满足长度/语种门槛返回 null */
function clauseUnit(raw, cfg) {
  if (!raw) return null;
  const hasCJK = /[\u4e00-\u9fff]/.test(raw);
  const norm = raw.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  if (norm.length < cfg.MIN_LEN_NORM) return null;
  if (hasCJK) {
    const cjk = (norm.match(/[\u4e00-\u9fff]/g) || []).length;
    if (cjk < cfg.MIN_LEN_ZH_CJK) return null;
    return norm;
  }
  const words = (raw.match(/[a-zA-Z0-9]+/g) || []).length;
  if (words < cfg.MIN_WORDS_EN) return null;
  if (!/[a-z]{3,}/.test(norm)) return null; // 排除纯数字/版本号/短代码 token
  return norm;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/改值替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAdNauseam(text, inject) {
  if (!text || text.length < 8) return { hit: false, score: 0, detail: '', count: 0 };
  const norm = v => (Array.isArray(v) ? v : [v]);
  const R = inject || {};
  const cfg = Object.assign({}, DEFAULTS, R.cfg || {});
  const MKZ = norm(R.REPEAT_MARKER_ZH || REPEAT_MARKER_ZH);
  const MKE = norm(R.REPEAT_MARKER_EN || REPEAT_MARKER_EN);
  const MTZ = norm(R.EXEMPT_META_ZH || EXEMPT_META_ZH);
  const MTE = norm(R.EXEMPT_META_EN || EXEMPT_META_EN);
  const NGZ = norm(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH);
  const NGE = norm(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN);
  const QS = norm(R.QUOTE_STRIP || QUOTE_STRIP);

  // 句级豁免：元讨论 / 否定劝止（在原文上判——反映说话者意图）
  if (anyHit(MTZ, text) || anyHit(MTE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(NGZ, text) || anyHit(NGE, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 剥离引文后做重复统计
  let bare = text;
  for (const re of QS) bare = bare.replace(re, ' ');

  const markerPresent = anyHit(MKZ, bare) || anyHit(MKE, bare);

  // 切子句（强+软标点），取内容重复单元
  const clauses = bare.split(/[。！？；.!?;\n，,、]+/);
  const units = new Set();
  for (const c of clauses) {
    const u = clauseUnit(c, cfg);
    if (u) units.add(u);
  }
  if (!units.size) return { hit: false, score: 0, detail: '', count: 0 };

  // 全文归一化串 N
  const N = bare.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '');

  const isZh = /[\u4e00-\u9fff]/.test(bare);
  let best = null; // {occ, viaMarker}
  for (const u of units) {
    const occ = countOcc(N, u);
    if (occ >= cfg.MIN_COUNT_PURE) {
      if (!best || occ > best.occ) best = { occ, viaMarker: markerPresent };
    } else if (markerPresent && occ >= cfg.MIN_COUNT_MARKER) {
      if (!best || occ > best.occ) best = { occ, viaMarker: true };
    }
  }
  if (!best) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：基础 0.62；标记在场 +0.04；超出纯路径门槛每 1 次 +0.03（封顶 0.82）
  let score = 0.62;
  if (best.viaMarker) score += 0.04;
  const extra = Math.max(0, best.occ - cfg.MIN_COUNT_PURE);
  score = Math.min(0.82, score + extra * 0.03);

  const detail = isZh
    ? `诉诸重复×同一断言复读${best.occ}遍冒充论据(zh)`
    : `ad-nauseam×repetition-as-evidence×${best.occ}(en)`;

  return { hit: true, score: Math.round(score * 100) / 100, detail, count: best.occ };
}

module.exports = {
  checkAdNauseam,
  __internals: () => ({
    REPEAT_MARKER_ZH, REPEAT_MARKER_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    QUOTE_STRIP, DEFAULTS,
  }),
};
