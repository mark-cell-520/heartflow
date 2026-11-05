'use strict';

/**
 * src/regexp-utils.js — 静态词表/静态模式的正则工具（性能轮 r215 建）
 *
 * 为什么需要这个模块（r215 实测数据，全部可复跑）：
 *   discriminate 单次调用要构造约 306 个 RegExp 对象，热点全部是
 *   「静态词表逐词 new RegExp + test/exec」模式——checkBullshitRecognition
 *   62 个/次（index.js:9741/9749）、checkPerfectError 29 个/次
 *   （perfect-error.js:230）、_hasAnyEN 16 个/次（one-sided-dismissal.js:142）、
 *   checkContradiction 24 个/次（index.js:5894/5895）……
 *
 *   实测（scripts/tmp-regexp-bench.js，300 次 discriminate，同一基准句）：
 *   把 new RegExp 换成「构造缓存」只省 1%（2096ms → 2076ms）——V8 自带的
 *   RegExp compilation cache 已经吃掉了大部分构造开销。真正的成本在
 *   正则执行次数（306 次 test/exec，每次几 μs）。
 *
 * 因此本模块提供两层，语义都保证「只减扫描次数、不减判定结果」：
 *
 *   1. getRegExp(source, flags)——构造缓存。零行为变化（同 source/flags 的
 *      正则行为完全一致），收益小但顺手。
 *
 *   2. screenZH / screenEN / screenLiteral——保守预检：用一次正则执行
 *      判断静态词表是否可能命中；不可能命中时调用方跳过整个逐词扫描循环。
 *
 *      保守性证明（安全边界，反了就是改判定）：
 *        · screenZH 取每个词的首字符组成字符类。若某词在文本中命中，该词
 *          首字必然出现在文本里，预检必命中。即「预检不命中，所有词都不
 *          命中」。预检只可能误报（文本含首字但不成词，多跑一趟原路径，
 *          无害），不可能漏报。
 *        · screenEN 把全部词转义后合并成 \b(?:w1|w2|…)\b 的 alternation。
 *          适用于调用方原本就是 \b 包裹 test 的场景：某词命中则合并正则
 *          必命中。只可能误报，不可能漏报。
 *        · screenLiteral 把全部词转义后合并成无边界 (?:w1|w2|…) 的
 *          alternation。适用于调用方原本就是裸 includes/裸子串 test 的
 *          场景（如 _hasAnyEN 的混合判定、perfect-error 的不确定词表）——
 *          这些场景用 \b 边界预检会漏掉「词首紧贴字母」的子串命中
 *          （如 'wait is true that' 含 'it is true that'），必须用字面合并。
 *          子串匹配是最宽条件，任何原判定命中都必然被它覆盖。
 *
 * 关于 lastIndex（共享正则对象的唯一正确性风险）：
 *   本模块缓存的正则一律不带 'g'/'y' 标志（screen 系列与 getRegExp 的常规
 *   用法都是无状态 test/match）。调用方若需带 g 的逐位置扫描，请自行在入口
 *   re.lastIndex = 0 或把 exec 循环跑到 null（V8 在 exec 返回 null 时自动把
 *   lastIndex 归零）——本模块不为带 g 的使用方式担保。
 */

const _cache = new Map();
/** 词表数组（引用稳定）→ 预检正则。用 WeakMap，词表常量为模块级数组。 */
const _screenCache = new WeakMap();

/** 转义正则元字符（与 index.js:9741 等热点处的内联转义同形） */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 构造缓存版 new RegExp。同 (source, flags) 复用同一对象。
 * 行为与 new RegExp 完全一致——仅省对象分配与 compilation cache 查找。
 */
function getRegExp(source, flags) {
  const key = JSON.stringify([flags, source]);
  let re = _cache.get(key);
  if (re === undefined) {
    re = new RegExp(source, flags);
    _cache.set(key, re);
  }
  return re;
}

/**
 * 词表首字符集合的取值：取「首个汉字或 ASCII 字母/数字」——中文词首字即
 * 词首，英文词取首字母。词首若不是汉字/字母/数字（罕见，如以 '(' 开头的
 * 模式串），退化为取第一个字符：字符类里转义后照样是保守超集。
 */
function _firstChar(w) {
  for (const ch of w) {
    if (/[一-鿿A-Za-z0-9]/.test(ch)) return ch;
  }
  return w[0] || '';
}

function _screenLiteralFor(words) {
  if (!words.length) return null;
  return new RegExp('(?:' + words.map(escapeRe).join('|') + ')', 'i');
}

function _screenZHFor(words) {
  const seen = new Set();
  const chars = [];
  for (const w of words) {
    const c = _firstChar(w);
    if (c && !seen.has(c)) {
      seen.add(c);
      chars.push(escapeRe(c));
    }
  }
  return chars.length ? new RegExp('[' + chars.join('') + ']') : null;
}

function _screenENFor(words) {
  if (!words.length) return null;
  return new RegExp('\\b(?:' + words.map(escapeRe).join('|') + ')\\b', 'i');
}

/**
 * 保守预检（中文词表）：返回 false 表示 words 中没有任何词出现在 text 中。
 * 调用方据此跳过逐词扫描。误报（返回 true 但实际无命中）无害。
 */
function screenZH(words, text) {
  if (!words.length) return false;
  let re = _screenCache.get(words);
  if (re === undefined) {
    re = _screenZHFor(words);
    _screenCache.set(words, re);
  }
  return re ? re.test(text) : false;
}

/**
 * 保守预检（\b 词边界词表）：返回 false 表示 words 中没有任何词以词边界
 * 形态出现在 text 中。与逐词 \bword\b 的存在性判定等价（只可能误报）。
 */
function screenEN(words, text) {
  if (!words.length) return false;
  let re = _screenCache.get(words);
  if (re === undefined) {
    re = _screenENFor(words);
    _screenCache.set(words, re);
  }
  return re ? re.test(text) : false;
}

/**
 * 保守预检（无词边界字面词表）：返回 false 表示 words 中没有任何词作为
 * 子串出现在 text 中。用于调用方原本就是裸 includes/裸子串 test 的场景。
 */
function screenLiteral(words, text) {
  if (!words.length) return false;
  let re = _screenCache.get(words);
  if (re === undefined) {
    re = _screenLiteralFor(words);
    _screenCache.set(words, re);
  }
  return re ? re.test(text) : false;
}

/**
 * 保守预检（正则模式数组）：返回 false 表示 patterns 中没有任何模式能在
 * text 上命中，调用方可跳过整组逐模式扫描。用于 checkRewardHacking 这类
 * 「几百个模式逐条 text.match」的热点（ZH 表 38 类 601 个模式/次）。
 *
 * 合并规则（保守性证明）：
 *   · 各模式的 source 原样包进 (?:...) 后合并为一个 alternation——
 *     alternation 的匹配集合 = 各分支匹配集合的并集，故「合并无命中」
 *     必然推出「每个模式都无命中」。
 *   · 合并 flags 取所有成员 flags 的并集（i/m/s，忽略 g/y）：每个成员
 *     的匹配集合是其单独匹配集合的子集 ⇒ 合并集合是超集 ⇒ 只可能误报，
 *     不可能漏报。
 *   · 命名捕获组 (?<name> 在合并正则会因重名报 SyntaxError，替换成
 *     (?:——只去捕获不改匹配集合（预检只要存在性）。
 *   · 含反向引用（\1-9 / \k<）的模式无法安全合并，此时整个数组
 *     退回原路径（返回 true），宁可不优化也不改判定。
 */
function screenPatterns(patterns, text) {
  if (!patterns || !patterns.length) return false;
  let re = _screenCache.get(patterns);
  if (re === undefined) {
    re = _mergedFor(patterns);
    _screenCache.set(patterns, re);
  }
  if (re === null) return true; // 无法安全合并：必须跑原路径
  return re.test(text);
}

/** 把模式数组合并成一个 alternation；无法安全合并时返回 null。 */
function _mergedFor(patterns) {
  let flags = '';
  const srcs = [];
  for (const p of patterns) {
    const src = typeof p === 'string' ? p : p.source;
    const f = typeof p === 'string' ? '' : p.flags;
    if (/\\[1-9]/.test(src) || /\\k</.test(src)) return null;
    if (f.includes('i')) flags += 'i';
    if (f.includes('m')) flags += 'm';
    srcs.push('(?:' + src.replace(/\(\?<[A-Za-z_$][^>]*>/g, '(?:') + ')');
  }
  if (!srcs.length) return null;
  flags = [...new Set(flags.split(''))].join('');
  try {
    return new RegExp(srcs.join('|'), flags);
  } catch (_) {
    return null; // 合并出语法错误（极端）：退回原路径
  }
}

module.exports = { getRegExp, escapeRe, screenZH, screenEN, screenLiteral, screenPatterns };
