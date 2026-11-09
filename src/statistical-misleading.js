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
 *
 * [r263 扩展 · 真升级②：中文「成」数比例 × 模糊小基数全新措辞家族]
 * r263 池化探针实测（coordination/agent4/probes/r263-probe-pool.js，
 * v6.8.153）：本族 6 条新措辞攻击 5 条完全穿透（gate pass 且零维度承重）。
 * 穿透根因是两条腿都只认「书面确切形」：
 *   · C1 新族：「成」数比例（涨了四成/降了两成，一成=10%）——C1_PCT_ZH 只认
 *     \d+%，中文口语比例单位整族漏；EN percent 词形（jumped 40 percent）——
 *     C1_PCT_EN 两条路由都只认 `%` 号，percent 词形 × 全动词表整族漏；
 *   · C2 新族：模糊约数小基数（十几个人/三十几个点击/几起来信/个位数用户；
 *     EN a handful of / a couple of / single digits / a few）——旧腿只认
 *     「数词+单位」确切形（1-30），约数族整族漏。模糊族**单位必填**，
 *     「十几年来」的「年」不在单位表内，不会误喂 C2（r360 时间跨度教训）。
 *   良性边界：大基数提示（样本量+大数）仍在函数头部早退，不受新族影响。
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
// [r263 新增] 「成」数比例（一成=10%）：涨了四成/降了两成/占了三成——中文口径的
// 比例变化表述，无 % 号；C1_PCT_ZH 只认 \d+%，整族穿透（r263 池化探针实测
// 3/3 条「成」攻击全穿）。动词表取 C1_PCT_ZH 同族 + 暴跌族（重挫/飙升/跳水）。
const C1_CHENG_ZH = /(?:提升|增长|上升|上涨|增加|提高|下降|降低|减少|缩减|涨了|降了|回落|收窄|扩大|重挫|暴跌|暴增|大跌|大涨|猛涨|猛降|飙升|跳水)[^。；，]{0,12}[一二两三四五六七八九十]{1,3}成/;
// [r263 新增] 英文「percent 词形」比例变化族：C1_PCT_EN 两条路由都只认 `%` 号，
//   「jumped 40 percent / increased 40 percent」整族不在射程（r263 探针实测）。
//   本常量收**全动词表**（既有书面族 + jumped/surged/soared/climbed/spiked/
//   skyrocketed 口语族）× percent 词形，与 C1_PCT_EN 的 % 号路由互补不重叠。
const C1_PCT_EN_EXT = /\b(?:increased?|decreased?|dropped?|grew|growth|rose|fell|reduced|improved?|cut|doubled?|tripled?|quadrupled?|jumped?|surged?|soared?|climbed|spiked|skyrocketed|ramped|scaled|mushroomed)\b[^.]{0,40}?\b\d+(?:\.\d+)?\s*percent\b/i;

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
// [v6.8.85 审计修复] 「N 个 + 时间单位」（三个季度/两个月/一整年）是时间
// 跨度，不是统计小基数——r360 实测「连续三个季度业绩翻倍」被「三个」喂
// C2 与 C1「翻倍」双腿误伤。单位词后紧跟时间单位词（容 2 字间隔）时，
// 该数量不是基数证据。攻击族（3 个用户/5 单）不受影响。
const SMALL_ABS_ZH = /(?:从\s*)?([0-9]{1,2}|[一二两三四五六七八九十]{1,3})\s*(?:个人|人|次|起|单|例|条|台|件|家|名|位|个)(?![^。]{0,2}(?:季度|个月|月|年|周|天|小时|分钟|秒|轮|届|期|阶段))(?:[^。]{0,6}(?:涨|升|降|增|减|到|至))?/;
// [r263 新增] 模糊小基数（中文）：十几个人/几十个人/三十几个/几起来信/个位数——
// 旧腿只认「数词+单位」确切形（1-30），模糊约数族整族穿透（r263 池化探针
// 实测 4/6 条中文攻击穿在 C2）。单位词表与 SMALL_ABS_ZH 一致且**单位必填**：
// 「十几年来」的「年」不在单位表内，时间跨度不会误喂 C2（r360 教训同款防御）。
const SMALL_ABS_ZH_FUZZY = /(?:十几|几十|好几)[个个人次起单例条台件家名位]|[0-9]{1,3}\s*几\s*[个个人次起单例条台件家名位]|[一二两三四五六七八九十]{1,3}\s*几\s*[个个人次起单例条台件家名位]|几\s*[个个人次起单例条台件家名位]|个位数/;
// [r263 新增] 模糊小基数（英文）：a handful of / a couple of / single digits /
// just a few / only a few / a few dozen——旧腿只认「数词+单位词」确切形，
// r263 探针 2/2 条英文攻击全穿在 C2。
const SMALL_ABS_FUZZY_EN = /\b(?:a\s+handful\s+of|a\s+couple\s+of|single\s+digits?|just\s+a\s+few|only\s+a\s+few|a\s+few\s+dozen|a\s+few)\b/i;

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
 * @param {object} [inject] 负例脚本注入用：以空/过滤后的常量替换指定常量
 *   （r263 起支持；键名见 __internals）
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkStatisticalMisleading(text, inject) {
  if (!text || text.length < 4) return { hit: false, score: 0, detail: '' };
  const R = inject || {};
  const C1_CHENG_ZH_ = R.C1_CHENG_ZH || C1_CHENG_ZH;
  const C1_PCT_EN_EXT_ = R.C1_PCT_EN_EXT || C1_PCT_EN_EXT;
  const SMALL_ABS_ZH_FUZZY_ = R.SMALL_ABS_ZH_FUZZY || SMALL_ABS_ZH_FUZZY;
  const SMALL_ABS_FUZZY_EN_ = R.SMALL_ABS_FUZZY_EN || SMALL_ABS_FUZZY_EN;

  const reasons = [];

  // 明确给了大基数的句子直接放过（样本量 12000 / out of 50,000 等）
  if (BIG_BASE_HINT.test(text) && /\d{3,}/.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  // C1
  const c1 = C1_PCT_EN.test(text) || C1_PCT_ZH.test(text) ||
              C1_FOLD_EN.test(text) || C1_FOLD_ZH.test(text) ||
              C1_FROMTO_EN.test(text) || C1_FROMTO_ZH.test(text) ||
              C1_CHENG_ZH_.test(text) || C1_PCT_EN_EXT_.test(text);
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

  if (!smallBase) {
    // [r263] 中文模糊小基数（十几个人/三十几个点击/几起来信/个位数用户）——
    // 模糊约数族，无确切数值可校验，形状本身即小基数证据
    m = text.match(SMALL_ABS_ZH_FUZZY_);
    if (m) { smallBase = m[0].trim(); reasons.push(`模糊小基数(${smallBase})`); }
  }

  if (!smallBase) {
    // [r263] 英文模糊小基数（a handful of / a couple of / single digits / a few）
    m = text.match(SMALL_ABS_FUZZY_EN_);
    if (m) { smallBase = m[0].trim(); reasons.push(`模糊小基数(${smallBase})`); }
  }

  // 低比率区间：0.1% / 不足 1% —— 百分比变化在这个量级是统计噪声
  // [v6.8.85] 收窄为「完整 from-to 对照」才成立：单期事实陈述
  // （「本季度故障率下降到 0.3%」= SLA 读数）不是误导，只有
  // 「从 30% 下降到 0.3%」这类省略不得的对照翻倍才是统计噪声。
  if (!smallBase && (C1_FROMTO_ZH.test(text) || C1_FROMTO_EN.test(text))) {
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

module.exports = {
  checkStatisticalMisleading,
  // [r263] 负例注入用：暴露全部守卫常量（新常量 + 既有常量同表）
  __internals: () => ({
    C1_PCT_EN, C1_PCT_ZH, C1_FOLD_EN, C1_FOLD_ZH, C1_FROMTO_EN, C1_FROMTO_ZH,
    C1_CHENG_ZH, C1_PCT_EN_EXT,
    SMALL_ABS_EN, SMALL_ABS_BARE_EN, SMALL_ABS_EN_TO, SMALL_ABS_ZH,
    SMALL_ABS_ZH_FUZZY, SMALL_ABS_FUZZY_EN,
    SMALL_RATE_ZH, SMALL_RATE_EN, LOW_PCT_EN, LOW_PCT_ZH,
  }),
};
