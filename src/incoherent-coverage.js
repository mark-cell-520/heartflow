/**
 * src/incoherent-coverage.js — 不完备全覆盖宣告检测器
 *
 * v6.8.29 第 80 个判别维度（心虫升级执行体 r547 轮立项并收口）。
 *
 * 辨别的族：「分配语境下互斥分项之和显著低于 100%，却用无保留的
 * 『覆盖全部』宣称这些分项就是全体」。
 *   这类句子在数字上自证不成立——分项加起来明显不足百，却断言
 *   已覆盖全部。每一句都"像在汇报统计结果"：
 *     · 两个方案/部门的占比之和远未到百，却说已覆盖全部场景
 *     · 受访者的选择分项之和远未到百，却说涵盖全部受访者
 *     · 流量/营收/渠道来源之和远未到百，却说占据全部渠道
 *
 * 为什么 79 个现有维度拦不住：
 *   · percentage_overflow（第 79 维）管的是**和 > 100.5%** 的溢出方向，
 *     本族是反方向——和显著**低于**百。它的 C3 判据 `sum > 100.5` 恒不命中。
 *   · statistical_misleading（第 58 维）要求 C1 比例变化表述
 *     （提升/下降/倍数/from-to），本族是静态分配，无变化动词。
 *   · contradiction 管同一属性的两个互斥值，本族的矛盾是"分项之和
 *     不足百"与"已覆盖全部"这两个**跨句断言**之间的冲突，不存在单点冲突。
 *   · perfect_error 对此族只给弱信号（实测 8/10 条被它以 verify 兜住，
 *     但另有 2 条完全穿过硬闸门判 pass），且它管的是"假精确"，
 *     归因维度错误——把"分配不完整"记成"数字太精确"。
 *
 * 判据（三条都要成立，缺一不可）：
 *   C1 存在**无保留**的全覆盖宣称（覆盖全部/涵盖全部/覆盖所有/全部来源/
 *      covering all/entire set…）——有保留表述（绝大部分/过半/nearly all）
 *      一律排除，那些是合法陈述
 *   C2 分配语境且分项数 ≥ 2（复刻 percentage-overflow 的 C1/C2 判据，
 *      保证两族口径一致、不漂移）
 *   C3 分项之和 ≤ 100 − MARGIN（MARGIN=8 个百分点）——显著低于百，
 *      留容差给"约 55.5% + 约 45.5%"这类四舍五入表述
 *   → C1 × C2 × C3 同时成立 = verify（需补充分项明细才能确认口径）
 *
 * 为什么是 verify 不是 rewrite：单句可能是转述他处统计报告时漏抄了
 * 部分分项，rewrite 会误伤；要求先核清分项明细（与 percentage_overflow
 * 同口径，r530/r534/r545 一致的定级原则）。
 *
 * 明确不判的（合法陈述，靠四类排除规则挡住）：
 *   · 有保留表述（绝大部分/绝大多数/过半/nearly all）——语义上不宣称全覆盖
 *   · 变化语境（增长/下降/同比/从 X% 到 Y%）——同一指标前后值
 *   · 频率统计（日活/月活/每天登录）——不同时间尺度，和可合法超/不足 100
 *   · 时段分期（上半年/下半年/Q1）——不同时间段的各自进度
 */

'use strict';

// ─── C1: 无保留全覆盖宣称 ───────────────────────────────
// 只收"这些分项就是全体"的无保留断言；"绝大部分/过半"这类有保留的
// 表述由 PARTIAL_COVER 显式排除（见下）。
const FULL_COVER = /(?:覆盖全部|涵盖全部|包含全部|覆盖了?所有|涵盖所有|覆盖所有|即[即为]全部|就是全部|合计[即就]?为全部|加起来[就是]全部|全部场景|全部来源|全部受访者|全部学员|全部客户|全部人员|全部渠道|全部市场|全部预算|全部学员群体|covering all|covers all|all needs|all respondents|the entirety|entire set|whole population)/i;
// 有保留的表述（合法，不判）——"绝大部分客户来自搜索，社交仅占 20%"
const PARTIAL_COVER = /(?:绝大部分|绝大多数|九成|八成|七成|过半|大部分|多数客户|most of|vast majority|nearly all|about \d+% of the|剩余部分|剩下[的\d])/i;

// ─── C2: 分配语境（与 percentage-overflow.js 同源判据，口径一致）──
const ALLOC_BEFORE = /(?:占[比到]?为|占|为|是|达[到了]?|voted|chose|chosen|went to|goes to|accounted for|make[s]? up|split|agreed|disagreed|responded|answered|来自|rest)/i;
// [v6.8.29 / r548] C2 补「用」这一分配动词：gate 层实测发现
// 「技术栈 15% 用 Rust，20% 用 Go」这类分项句不被识别为分配语境
// （attacks#6 模块层漏判，之前 11/12）。ALLOC_BEFORE 已有「用于」，
// 右侧 ALLOC_AFTER 缺同源单字。保留 ALLOC_AFTER 其余标记不变。
const ALLOC_AFTER = /(?:用的人|的用户|用|的人|的用户|的客户|的受访者|的学生|的预算|的营收|的团队|的成员|voted|chose|agreed|disagreed|abstained|of (?:the|them|respondents|students)|went to|goes to|用于|归于|归入|是|为|rest|选择了|选择|选|投了|投向|来自|归为|支持|反对|赞成|不赞成|中立|赞成者|反对者|remainder|rest)/i;

// [v6.8.29 / r548] C2 补「用」后 ALLOC_AFTER 的其他判据与 OF_DISTRIB 无变化
const OF_DISTRIB = /\d+(?:\.\d+)?\s*%\s*of\s+(?:the\s+)?(?:respondents?|students?|users?|people|customers?|participants?|voters?|employees?|members)/i;

// [v6.8.29 / r548] 排除规则一：变化语境动词补「上升/下跌」。
// gate 层实测发现「从 X% 上升到 Y%」句式不被排除 → 静态分项被误判为
// 不完备全覆盖（攻击样本穿透排除层）。原判据只收"升至/降至"，不收口语词。
// 实测 recap：加词后良性误伤 0/13 不变、召回 12/12（详见 UPGRADE_LOG r548）。
const CHANGE_CTX = /(?:增长|下降|提升|降低|上升|下跌|同比|环比|从\s*[\d.]+\s*%\s*(?:到|至|升|降)|from\s+[\d.]+\s*%\s+to|百分点|percentage points)/;
const FREQ_HINT = /(?:每天|每周|每月|每年|天天|周周|日活|月活|年活|daily|weekly|monthly|yearly|per day|per week|per month|per year|DAU|MAU)/;
const PHASE_HINT = /(?:上半年|下半年|第一季度|第二季度|第三季度|第四季度|第一周|第二周|第一[期阶阶]|第二[期阶段]|Q[1-4]|first half|second half|first quarter|second quarter)/i;

// C3 阈值：互斥分项之和比百分百至少低这么多个百分点才算"显著不完备"。
// 留 8 个百分点容差：「约 55.5% + 约 45.5%」这类四舍五入到 51% 的
// 表述、以及漏掉一两个小分项的综述句都不该被抓。
// 实测（scripts/round-547-criteria-probe.js）MARGIN 4–10 的攻击命中率
// 与误伤率完全一致（11/12、0/13），说明这是结构判据而非参数调优。
const COVERAGE_MARGIN = 8;

/**
 * 提取文本中所有「分配语境下的百分比分项」。
 * @param {string} text
 * @returns {Array<{v:number}>}
 */
function pctParts(text) {
  const out = [];
  const re = /(\d+(?:\.\d+)?)\s*%/g;
  let m;
  const hasOf = OF_DISTRIB.test(text);
  while ((m = re.exec(text)) !== null) {
    const v = parseFloat(m[1]);
    const idx = m.index;
    const before = text.slice(Math.max(0, idx - 14), idx);
    const after = text.slice(idx + m[0].length, idx + m[0].length + 14);
    if (hasOf && /\d+(?:\.\d+)?\s*%\s*of\b/.test(text.slice(idx, idx + 20))) { out.push({ v }); continue; }
    if (!(ALLOC_BEFORE.test(before) || ALLOC_AFTER.test(after))) continue;
    out.push({ v });
  }
  return out;
}

/**
 * 不完备全覆盖宣告检测。
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkIncoherentCoverage(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 排除规则：四类合法语境任一命中即整体放过
  if (CHANGE_CTX.test(text)) return { hit: false, score: 0, detail: '' };
  if (FREQ_HINT.test(text)) return { hit: false, score: 0, detail: '' };
  if (PHASE_HINT.test(text)) return { hit: false, score: 0, detail: '' };
  if (PARTIAL_COVER.test(text)) return { hit: false, score: 0, detail: '' };

  // C1 无保留全覆盖宣称
  if (!FULL_COVER.test(text)) return { hit: false, score: 0, detail: '' };

  // C2 分配语境 + 分项数 ≥ 2
  const parts = pctParts(text);
  if (parts.length < 2) return { hit: false, score: 0, detail: '' };

  // C3 分项之和显著低于百
  const sum = parts.reduce((s, p) => s + p.v, 0);
  if (sum > 100 - COVERAGE_MARGIN) return { hit: false, score: 0, detail: '' };

  // 分数随缺口扩大递增：缺口 8-20 个百分点 0.75，20-40 为 0.85，更大 0.9
  const gap = 100 - sum;
  let score = 0.75;
  if (gap >= 20) score = 0.85;
  if (gap >= 40) score = 0.9;

  return {
    hit: true,
    score,
    detail: `不完备全覆盖宣告(${parts.length}个互斥分项之和仅 ${sum.toFixed(1)}%，却宣称已覆盖全部)`
  };
}

module.exports = { checkIncoherentCoverage };
