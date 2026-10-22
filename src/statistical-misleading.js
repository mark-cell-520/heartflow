/**
 * src/statistical-misleading.js — 基数隐藏的比例断言检测器
 *
 * v6.8.0 新增第 58 个判别维度（心虫 decision 本体选出，实测缺口 6/7 漏判）。
 *
 * 辨别的族：「用百分比/倍数讲变化，但基数小到让这个比例没有意义」。
 *   攻击样本：
 *     · 用户满意度提升了 300%，从 2 个人涨到了 8 个人。
 *     · 错误率下降了 50%，从万分之二降到万分之一。
 *     · Support ratings tripled, going from 2 users to 8.
 *     · Sales doubled this quarter, from 4 to 9 units.
 *
 * 为什么 57 个现有维度拦不住：
 *   · unsupported_claim 管的是「无依据断言」，这里比例和基数都写明了，
 *     有依据，只是基数小。
 *   · perfect_error 管的是「假精确」（小数/百分比伪装），它的 METRIC_NOUNS
 *     豁免会把带 rate/满意度/rate 名词的句子整体放过——而那正是本族的主场。
 *   · fallacies / hasty_generalization 管推理谬误，不管样本量不足。
 *   → 这一族整体穿过硬闸门（实测 6/7 漏判）。
 *
 * 判据（两类都要命中，避免误伤有基数的大样本陈述）：
 *   C1 比例/倍数表述 —— 百分比变化、N 倍/N 倍增长、fold、tripled、doubled、
 *      涨了/降了/提升了 N、增长/下降 N%
 *   C2 小基数证据 —— 句中给出绝对量，且该绝对量落在「小样本区间」：
 *      · 整数 1-30 的人数/次数/起/单/例（个位数与几十）
 *      · 万分之 N / 千分之 N 这类极小基数比率
 *   → C1 × C2 同时成立 = verify（需给出基数才能判断是否有意义）
 *
 * 明确不判的（这些是合法陈述）：
 *   · 给了大基数：「满意度 30%，样本量 12000」→ C2 不命中
 *   · 绝对量本身就大：「错误率从 12% 降到 3%」→ C2 不命中
 *   · 无比例只有绝对量：「中位数 800ms 降到 240ms」→ C1 不命中
 */

'use strict';

// ─── C1: 比例 / 倍数变化表述 ───────────────────────────────
// 百分比变化（涨/降/提升/增长/下降 + N%）——含英文
const C1_PCT_EN = /\b(?:increased?|decreased?|dropped?|grew|growth|rose|fell|reduced|improved?|cut|doubled?|tripled?|quadrupled?)\b[^.]{0,40}?\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*%\s*(?:increase|decrease|drop|growth|rise|reduction|improvement)\b/i;
const C1_PCT_ZH = /(?:提升|增长|上升|上涨|增加|提高|下降|降低|减少|缩减|涨了|降了|回落|收窄|扩大)[^。；，]{0,18}\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*%(?:的)?(?:提升|增长|上升|上涨|增加|提高|下降|降低|减少|缩减|回落|收窄|扩大)/;
// 倍数表述
const C1_FOLD_EN = /\b(?:doubled?|tripled?|quadrupled?|\d+(?:\.\d+)?\s*[-x×]\s*fold|\d+(?:\.\d+)?\s*times)\b/i;
const C1_FOLD_ZH = /(?:翻[了着过]?[一二两三四五六七八九十]?[倍番]|翻[了着过]?\d+(?:\.\d+)?\s*[倍番]|增长?\s*\d+(?:\.\d+)?\s*倍|是[过]?原先的\s*\d+\s*倍|\d+(?:\.\d+)?\s*倍(?:增长|增长为))/;
// "from X to Y" 的对照结构（英文占比断言常配这个）
const C1_FROMTO_EN = /\bfrom\s+[\d.]+\s*(?:%|percent|users?|people|customers?|units?|orders?|cases?|tickets?)?\s+to\s+[\d.]+/i;
// "从 X 到 Y" 的对照结构：动词后允许「到/至」再接数字（涨到 6 个 / 到 3 万元）
const C1_FROMTO_ZH = /从\s*[\d.]+\s*(?:%|个人|人|次|起|单|例|条|台|件|家|名|位|个|万元|元)?\s*(?:涨|升|降|提高|降低|增|减|到|至)\s*(?:了?\s*)(?:到\s*|至\s*)?[\d.]+/;

// ─── C2: 小基数证据 ───────────────────────────────
// 语音豁免：句中出现「基数/样本/N=」并给出大数 → 不是小基数
const BIG_BASE_HINT = /(?:样本量|基数|样本数|样本容量|n\s*=|N\s*=|sample\s+size|out\s+of|across\s+[\d,]{3,}|respondents?)/i;

// 小整数绝对量：1-30 的人/次/起/单/例/units/users/orders/cases/tickets
// 取「个位数到三十」——统计上这个量级的比例变化不具推断意义
const SMALL_ABS_EN = /\b(?:from\s+)?(\d{1,2})(?:\.\d+)?\s*(?:users?|people|customers?|units?|orders?|cases?|tickets?|incidents?|complaints?|signups?|downloads?)\b/i;
// from 2 to 6 / doubled from 3 to 9 —— 无单位词的小整数对照（C1_FROMTO_EN 已确认
// 是比例/倍数句，C2 只需证明其中一侧是小基数，故不再强制单位词）
const SMALL_ABS_BARE_EN = /\b(?:from\s+(\d{1,2})(?:\.\d+)?\s+to\s+(\d{1,2})(?:\.\d+)?|(\d{1,2})(?:\.\d+)?\s+to\s+(\d{1,2})(?:\.\d+)?)\b/i;
const SMALL_ABS_EN_TO = /\bto\s+(\d{1,2})(?:\.\d+)?\s*(?:users?|people|customers?|units?|orders?|cases?|tickets?|incidents?|complaints?|signups?|downloads?)\b/i;
const SMALL_ABS_ZH = /(?:从\s*)?([0-9]{1,2}|[一二两三四五六七八九十]{1,3})\s*(?:个人|人|次|起|单|例|条|台|件|家|名|位|个)(?:[^。]{0,6}(?:涨|升|降|增|减|到|至))?/;

// 极小基数比率：万分之 N / 千分之 N / per 10k / N out of 1000 以内
const SMALL_RATE_ZH = /(?:万分之|千分)[一二三四五六七八九十百0-9]+/;
const SMALL_RATE_EN = /\b(?:0\.000[0-9]+|0\.00[0-9]+)\b/;

// 基数在 1% 以下的低比率区间（英文 <1%、中文 百分之零点几 / 不足百分之一）
// 「from 0.1% to 0.3%」「不足 0.5%」这类：绝对量为零，但比率本身在
// 低基数区间——百分比翻三倍在 0.1% 层面是统计噪声。
const LOW_PCT_EN = /\b0\.[0-9]+\s*%|\bless\s+than\s+1\s*%|\bunder\s+1\s*%/i;
const LOW_PCT_ZH = /0\.[0-9]+\s*%|不足\s*1\s*%|不到\s*1\s*%|低于\s*1\s*%|百分之[零点]{1,2}[一二两三四五六七八九十0-9]{1,2}/;
// 中文汉字数字（含"十N"形）转阿拉伯
const ZH_NUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
function zhToNum(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (ZH_NUM[s] !== undefined) return ZH_NUM[s];
  // 十二 / 二十 / 二十五 形
  const m = s.match(/^(十)([一二三四五六七八九])?$/) || s.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
  if (m) {
    const a = m[1] ? (ZH_NUM[m[1]] || 1) : 1;
    const b = m[2] ? (ZH_NUM[m[2]] || 0) : 0;
    return a * 10 + b;
  }
  return 0;
}

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkStatisticalMisleading(text) {
  if (!text || text.length < 4) return { hit: false, score: 0, detail: '' };

  const reasons = [];

  // 明确给了大基数的句子直接放过（样本量 12000 / out of 50,000 等）
  if (BIG_BASE_HINT.test(text) && /\d{3,}/.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  // C1
  const c1 = C1_PCT_EN.test(text) || C1_PCT_ZH.test(text) ||
              C1_FOLD_EN.test(text) || C1_FOLD_ZH.test(text) ||
              C1_FROMTO_EN.test(text) || C1_FROMTO_ZH.test(text);
  if (!c1) return { hit: false, score: 0, detail: '' };
  reasons.push('比例/倍数变化表述');

  // C2 —— 三类小基数证据任一命中即可
  let smallBase = null;
  let m = text.match(SMALL_RATE_ZH);
  if (m) { smallBase = m[0]; reasons.push(`极小基数比率(${smallBase})`); }

  if (!smallBase) {
    m = text.match(SMALL_RATE_EN);
    if (m) { smallBase = m[0]; reasons.push(`极小比率(${smallBase})`); }
  }

  if (!smallBase) {
    // 英文小整数绝对值（from 2 users / to 8 units / 4 orders）
    m = text.match(SMALL_ABS_EN) || text.match(SMALL_ABS_EN_TO);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 30) { smallBase = `${n} ${(m[0].match(/\b(users?|people|customers?|units?|orders?|cases?|tickets?|incidents?|complaints?|signups?|downloads?)\b/i) || [])[1] || ''}`.trim(); reasons.push(`小基数绝对量(${smallBase})`); }
    }
  }

  if (!smallBase) {
    // 英文无单位小整数对照（from 2 to 6 / from 4 to 9）
    // 只在 C1 已是「from X to Y 比例句」时才用：裸数字对照本身不构成证据
    m = text.match(SMALL_ABS_BARE_EN);
    if (m && C1_FROMTO_EN.test(text)) {
      const nums = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number);
      if (nums.some(n => n >= 1 && n <= 30)) {
        const n = nums.find(x => x >= 1 && x <= 30);
        smallBase = `${n} (from ${nums[0]} to ${nums[nums.length - 1]})`;
        reasons.push(`小基数绝对量(${smallBase})`);
      }
    }
  }

  if (!smallBase) {
    // 中文小整数绝对值（含汉字数字：五/十二/二十）
    m = text.match(SMALL_ABS_ZH);
    if (m) {
      const n = zhToNum(m[1]);
      if (n >= 1 && n <= 30) { smallBase = `${n}${(m[0].match(/(个人|人|次|起|单|例|条|台|件|家|名|位|个)/) || [])[1] || ''}`; reasons.push(`小基数绝对量(${smallBase})`); }
    }
  }

  // 低比率区间：0.1% / 不足 1% —— 百分比变化在这个量级是统计噪声
  if (!smallBase) {
    if (LOW_PCT_EN.test(text) || LOW_PCT_ZH.test(text)) {
      smallBase = (text.match(LOW_PCT_EN) || text.match(LOW_PCT_ZH) || ['低比率'])[0].trim();
      reasons.push(`低比率区间(${smallBase})`);
    }
  }

  if (!smallBase) return { hit: false, score: 0, detail: '' };

  // C1 × C2 同时成立 → verify 级
  // 倍数越大、基数越小，分数越高（500% × 2 人 比 30% × 25 人 更可疑）
  let score = 0.6;
  const pct = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) {
    const p = parseFloat(pct[1]);
    if (p >= 100) score = 0.75;
    if (p >= 300) score = 0.85;
  }
  if (C1_FOLD_EN.test(text) || C1_FOLD_ZH.test(text)) score = Math.max(score, 0.72);

  return {
    hit: true,
    score: Math.min(score, 0.9),
    detail: `基数隐藏的比例断言(${reasons.join('; ')})`
  };
}

module.exports = { checkStatisticalMisleading };
