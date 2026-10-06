/**
 * src/percentage-overflow.js — 分配占比合计溢出检测器
 *
 * v6.8.28 新增第 79 个判别维度（心虫升级执行体 r545 轮自建族级探针选出，
 * r544 轮立项、本轮实测收口）。
 *
 * 辨别的族：「同一整体下的互斥分项占比之和 > 100%」。
 *   这类数字在数学上不可能成立，但每一句都"看着像统计报告"：
 *     · 多个互斥分项（用户选择 A / 选择 B / 未填写、预算的用途、
 *       部门的占比、市场的营收占比）的百分比加起来超过 100。
 *     · 攻击样本形状见 test/percentage-overflow.test.js（原文不进上下文，
 *       按 451 纪律只以形状描述）。
 *
 * 为什么 78 个现有维度拦不住：
 *   · statistical_misleading（第 58 维）管"基数隐藏的比例变化"，要求
 *     C1 比例变化表述（提升/下降/倍数/from-to），本族是静态分配、
 *     没有变化动词，C1 恒不命中。
 *   · unsupported_claim 管"无依据断言"，这里百分比都写明了，有数字、
 *     有出处，只是分项之和自相矛盾。
 *   · contradiction 管显式的自相矛盾（同一属性两个互斥值），本族的矛盾
 *     是**和溢出**这个隐含约束上，不存在单点冲突。
 *   · perfect_error 的 METRIC_NOUNS 豁免会把带"占比"这类度量名词的句子
 *     整体放过。
 *   → 本族整体穿过硬闸门（探针实测 11/16 条攻击在 gate 层零维度命中，
 *     其余被 verify 抓到但仅来自 unsupported_claim 的弱信号，0 条被 rewrite）。
 *
 * 判据（三层都要成立，缺一不可）：
 *   C1 分配语境 —— 每个百分比前后 14 字内出现分配标记
 *     （占/为/是/达到/用于/归于/voted/chose/went to…）或分配对象
 *     （的用户/的预算/of respondents…），证明这是"占总量的比例"
 *   C2 分项数 ≥ 2 —— 单个百分比不存在"合计溢出"，必须有两个以上分项
 *   C3 和 > 100.5 —— 互斥分项之和超过百分之百（留 0.5 个百分点的
 *     容差给"约 55.5%"这类四舍五入表述）
 *   → C1 × C2 × C3 同时成立 = rewrite（数字必须重新核算后才能使用）
 *
 * 明确不判的（这些是合法陈述，靠四类排除规则挡住）：
 *   · 变化语境（增长/下降/同比/从 12% 到 35%/percentage points）——
 *     同一个指标的前后值，不是互斥分项
 *   · 频率统计（每天登录/每周登录/日活/月活/DAU/MAU）——
 *     同一现象在不同时间尺度的统计，和可以合法超 100
 *   · 时段分期（上半年/下半年/Q1/Q2/first half）——
 *     不同时间段各自的进度
 *   · 完成度语境（完成度/进度/done/completed）——
 *     不同模块的完成进度
 *   · 比率指标（率/ratio/准确率/召回率/F1/覆盖率 RATE_HINT）——
 *     两个不同指标各自的比率，和溢出不等于矛盾
 */

'use strict';

// ─── C1: 分配语境标记 ───────────────────────────────────
// 百分比**之前**的分配动词/系词（"A 占 80%"、"总预算的 48% 用于人力"）
// 含 "of"：英文常见 "60% of respondents chose A" —— of 出现在百分比之后、
// 但它是 distribution-of 结构而非"某个指标自己的值"，需与 of X chose/voted
// 这类结构区分（后者是比率统计）。这里只把 of + 分配对象视为分配语境，
// 单纯 "88% adoption" 无 of 不算。
const ALLOC_BEFORE = /(?:占[比到]?为|占|为|是|达[到了]?|voted|chose|chosen|went to|goes to|accounted for|make[s]? up|split|agreed|disagreed|responded|answered|来自|rest)/i;
// 百分比**之后**的分配对象/去向（"选择 A 的用户"、"goes to R&D"）
const ALLOC_AFTER = /(?:的人|的用户|的客户|的受访者|的学生|的预算|的营收|的团队|的成员|voted|chose|agreed|disagreed|abstained|of (?:the|them|respondents|students)|went to|goes to|用于|归于|归入|是|为|rest|选择了|选择|选|投了|投向|来自|归为|支持|反对|赞成|不赞成|中立|赞成者|反对者|remainder|rest)/i;
// 百分比**之后**的地理/机构来源词（"45% from India"）——from 单独不作标记，
// 需配合后文出现地名/机构名（印度/欧洲/China/Europe 这类），用 ALLOC_FROM 兜底
const ALLOC_FROM = /\s*from\s+[A-Z一-龥]/;
// of 结构前置（"60% of respondents" / "60% of the students"）——
// of 出现在百分比之后但与 respondents/students 同时出现即分配语境
const OF_DISTRIB = /\d+(?:\.\d+)?\s*%\s*of\s+(?:the\s+)?(?:respondents?|students?|users?|people|customers?|respondent|participants?|voters?|employees?|members)/i;

// ─── 排除规则（误伤防御，四类）─────────────────────────
// ① 变化语境：同一指标的前后值，不是互斥分项
const CHANGE_CTX = /(?:增长|下降|提升|降低|同比|环比|从\s*[\d.]+\s*%\s*(?:到|至|升至|降至)|from\s+[\d.]+\s*%\s+to|百分点|percentage points)/;
// ② 频率统计：同一现象在不同时间尺度的统计，和可以合法超 100
const FREQ_HINT = /(?:每天|每周|每月|每年|天天|周周|日活|月活|年活|daily|weekly|monthly|yearly|per day|per week|per month|per year|DAU|MAU)/;
// ③ 时段/分期：不同时间段各自的进度
const PHASE_HINT = /(?:上半年|下半年|第一季度|第二季度|第三季度|第四季度|第一周|第二周|第一[期阶阶]|第二[期阶段]|Q[1-4]|first half|second half|first quarter|second quarter)/i;
// ④ 累计完成度：不同模块的完成进度
const PROGRESS_HINT = /(?:完成度|进度|已完成|done|completed|progress)/i;
// ⑤ 不同指标的比率本身（准确率/召回率/F1/覆盖率…）：两个独立指标的
//    各自比率，和溢出不等于矛盾（"准确率 95%，误报率 2%"）
//    注意：只用「率/比例/ratio/rate/召回/F1/准确」等**指标词**，不含「覆盖」——
//    「覆盖全部场景」是动词短语不是指标，误排除会让真攻击漏判（r545 实测）。
const RATE_HINT = /(?:率|比例|ratio|rate|准确|召回|F1)/;

// C3 阈值：互斥分项之和超过这个值判定溢出。
// 留 0.5 个百分点容差：「约 55.5% + 约 45.5%」这类四舍五入表述不该被抓。
const SUM_THRESHOLD = 100.5;

/**
 * 提取文本中所有「分配语境下的百分比分项」。
 * @param {string} text
 * @returns {Array<{v:number}>} 百分比数值列表
 */
function pctParts(text) {
  const out = [];
  const re = /(\d+(?:\.\d+)?)\s*%/g;
  let m;
  const hasOfDistrib = OF_DISTRIB.test(text);
  while ((m = re.exec(text)) !== null) {
    const v = parseFloat(m[1]);
    const idx = m.index;
    const before = text.slice(Math.max(0, idx - 14), idx);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 14);
    if (RATE_HINT.test(before) || RATE_HINT.test(after)) continue;
    // of 分配结构：整句含 "N% of respondents/students..." 即视为分配语境
    if (hasOfDistrib && /\d+(?:\.\d+)?\s*%\s*of\b/.test(text.slice(idx, idx + 20))) {
      out.push({ v });
      continue;
    }
    if (ALLOC_FROM.test(after) && /from\s+[A-Z一-龥]/.test(after)) { out.push({ v }); continue; }
    if (!(ALLOC_BEFORE.test(before) || ALLOC_AFTER.test(after))) continue;
    out.push({ v });
  }
  return out;
}

/**
 * 分配占比合计溢出检测。
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkPercentageOverflow(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 排除规则：四类合法语境任何一个命中即整体放过
  if (CHANGE_CTX.test(text)) return { hit: false, score: 0, detail: '' };
  if (FREQ_HINT.test(text)) return { hit: false, score: 0, detail: '' };
  if (PHASE_HINT.test(text)) return { hit: false, score: 0, detail: '' };
  if (PROGRESS_HINT.test(text)) return { hit: false, score: 0, detail: '' };

  // C1 分配语境 + C2 分项数 ≥ 2
  const parts = pctParts(text);
  if (parts.length < 2) return { hit: false, score: 0, detail: '' };

  // C3 和 > 100.5
  const sum = parts.reduce((s, p) => s + p.v, 0);
  if (sum <= SUM_THRESHOLD) return { hit: false, score: 0, detail: '' };

  // 分数随溢出程度递增：超 5 个百分点以内 0.7，超 105% 0.85
  let score = 0.7;
  if (sum >= 105) score = 0.85;
  if (sum >= 115) score = 0.9;

  return {
    hit: true,
    score,
    detail: `分配占比合计溢出(${parts.length}个互斥分项之和 ${sum.toFixed(1)}%，超过百分之百)`
  };
}

module.exports = { checkPercentageOverflow };
