/**
 * src/cherry-picking.js — 「摘樱桃」检测器（第 148 个判别维度）
 *
 * [r717 立项] decision 本体选出（scripts/decide-r717.js，composite_score
 * 0.85 / confidence 0.8 / identity alignment 0.8）。候选池来自 r717
 * 探测器（scripts/round-717-family-probe.js）在当前引擎（v6.8.62，
 * 147 维）上逐族复测：攻击漏判 8/9（89%）、真零命中 8/8、良性
 * 0/9 误伤。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：摘樱桃（cherry picking）——**只挑对自己有利的证据呈现，
 * 把反面证据隐瞒/略过不提**，用单边取样代替完整证据面：
 *   他只挑对自己有利的数据说，反面证据一概不提。
 *   只看成功的案例，失败的案例全被隐藏了。
 *   这份报告只列支持结论的部分，反对数据一个没放。
 *   他引用的都是支持自己的研究，反对的研究全部略过。
 *   只讲赚钱的月份，亏钱的月份一个字不提。
 *   数据里挑出几个好看的数字，难看的全部删掉。
 *   He only cites the studies that support his view and ignores the rest.
 *   They cherry-picked the best quarters and left out the losses.
 *   She presents only the successful cases and hides the failures.
 *
 * 与既有维度的边界（r717 归因）：
 *   · selective_minimization 管**对严重性的淡化措辞**（只是小问
 *     题/影响有限），本族管**证据呈现的单边取舍**（只给支持结论的
 *     那一半）；
 *   · statistical_misleading 管**统计数据的呈现误导**（百分比滥
 *     用/基数隐藏），本族管样本/案例层面的选择性纳入与排除；
 *   · survivorship_bias 管**只看存活样本的推断偏差**（活下来的
 *     都这么说），本族管**主动的隐瞒动作**（略过/不提/删掉）；
 *   · unsupported_claim 管**无依据断言**，本族管有依据但依据被单
 *     边裁剪；
 *   · 其余 147 个维度对本族 8 条漏判样本实测零命中 8/8。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① SELECTIVE 排他性选择/隐瞒动作——只挑/只看/只列/只讲/
 *     只引用/一概不提/全部略过/全部删掉/一个字不提/一个没放/全被
 *     隐藏/都是支持/隐瞒/略过/删掉/挑出（中）；only cites / only
 *     presents / cherry-picked / leaves out / hides / omits /
 *     ignores the rest / withholds / suppresses（英）；
 *   · 腿② FAVORABLE 有利/不利对照——对自己有利/支持自己/支持结论/
 *     成功的案例/赚钱的月份/好看的数字/反面证据/失败的案例/亏钱的
 *     月份/难看的/反对数据/反对研究/不利结果（中）；support his
 *     view / best quarters / successful cases / the losses / the
 *     failures / favorable results / contradicting evidence（英）。
 *   · 缺腿不判：只有腿①（「这个分析只覆盖了部分数据，因为其余数据
 *     尚未清洗完成」）是正常的范围说明；只有腿②（「报告列出了支持
 *     和反对两方面的数据」）是完整的双向呈现。
 *
 * 为什么取 VERIFY 级：单句可能是正当的范围声明（样本量限制/数据
 * 未清洗）、正当的方法透明度陈述（预先注册假设/多重比较校正/报告
 * 了所有检验结果）、系统评价的正当纳入标准说明。verify 的含义是
 * 「这段陈述只给了证据的一半，需要回到完整证据面核对」——调用方
 * 应要求把反面证据一并呈现，而不是接受单边叙事。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（摘樱桃/cherry picking/选择性偏差字样在场）：
 *     分析这套偏误本身不是运用它；
 *   · 方法透明度在场（预先注册/纳入标准/多重比较校正/局限性部分/
 *     独立样本/对照组/holdout）：声明了筛选标准与完整报告的是正当
 *     科研陈述；
 *   · 第三人称专业复盘（统计学家/审稿人/方法学/评审）：专业角色
 *     指出证据选择问题。
 */
'use strict';

// ─── 腿①：排他性选择/隐瞒动作（中文）──────────────────────────────
const SELECTIVE_ZH = /(?:只挑|只看|只列|只讲|只引用|只给|只拿|只统计|只报告|一概不提|一概不|全部略过|全部删掉|全部隐藏|一个字不提|一个没放|全被隐藏|都是支持|都是对自己|隐瞒|刻意隐去|刻意略去|选择性(?:地)?(?:呈现|展示|引用|报告|纳入)|挑出|略过|删掉|剔除|隐去)/;

// ─── 腿①：排他性选择/隐瞒动作（英文）──────────────────────────────
const SELECTIVE_EN = /\b(?:only\s+(?:cites?|presents?|lists?|shows?|reports?|mentions?|includes?|uses?|counts?|uses)|cherry[- ]?pick(?:ed|s|ing)?|leaves?\s+out|left\s+out|hides?|hid|omits?|omitted|withholds?|withheld|suppress(?:es|ed)?|ignores?\s+the\s+(?:rest|others?|contradicting|negative|contrary)|excludes?\s+the|leaves\s+out\s+the)\b/i;

// ─── 腿②：有利/不利对照（中文）────────────────────────────────────
const FAVORABLE_ZH = /(?:对自己有利|支持自己|支持结论|支持这个|成功的案例|赚钱的月份|好看的数字|最好的(?:季度|数据|部分|月份)|有利(?:的)?(?:数据|证据|结果|部分)|反面证据|失败的案例|亏钱的月份|难看的|反对(?:的)?(?:数据|研究|意见|证据|结果)|不利(?:的)?(?:数据|结果|证据)|亏损|失败(?:的)?(?:案例|记录)|不利结果|反面数据|出问题|不顺利|问题(?:的)?部分|顺利(?:的)?(?:环节|部分))/;

// ─── 腿②：有利/不利对照（英文）────────────────────────────────────
const FAVORABLE_EN = /\b(?:support(?:s|ing)?\s+(?:his|her|their|my|the)\s+(?:view|claim|argument|case|conclusion|position)|best\s+quarters?|successful\s+(?:cases?|projects?|ones?)|the\s+(?:losses|failures|outliers|downside|negative\s+results?|contradicting\s+(?:evidence|studies|data|findings)|contrary\s+evidence|failed\s+(?:ones?|projects?|cases?)|unsuccessful\s+(?:ones?|projects?))|favorable\s+results?|the\s+(?:good|best)\s+(?:ones|parts)|that\s+support(?:s)?\s+(?:his|her|their|the))\b/i;

// ─── 豁免一：元话语/概念引述（分析这套偏误本身不是运用它）──────────
// 注意：cherry[- ]picking（ing 形式）不匹配攻击样本的 cherry-picked（ed 形式）
const META_NOUN = /(?:摘樱桃|cherry[- ]picking|cherry[- ]pick\s+fallacy|证据选择偏误|选择性(?:偏差|偏误)|selection\s+bias|挑好的说)/i;

// ─── 豁免二：方法透明度在场（声明了筛选标准与完整报告的是正当科研陈述）
const METHOD_TRANSPARENT = /(?:预先注册|纳入标准|多重比较|局限性部分|公开可查|筛选标准|独立样本|对照组|显著性(?:检验|水平|校正)|预先(?:设定|登记)|pre-?registered|inclusion\s+criteria|multiple\s+comparison|holdout|limitations?\s+section|transparen|reproduc|control\s+group|report(?:ed|ing)?\s+all)/i;

// ─── 豁免三：第三人称专业复盘（专业角色指出证据选择问题）──────────
const THIRD_PERSON_EXEMPT = /(?:统计学家|审稿人|方法学|评审意见|教授说|老师说|statistician|reviewer|methodologist|professor|peer\s+reviewer)/i;

/**
 * 中文路由：腿①×腿②共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const selective = R.SELECTIVE_ZH || SELECTIVE_ZH;
  const favorable = R.FAVORABLE_ZH || FAVORABLE_ZH;
  if (!selective.test(text)) return null;
  if (favorable.test(text)) return { route: 'zh:selective×favorable' };
  return null;
}

/**
 * 英文路由：腿①×腿②共现。
 */
function checkEn(text, R) {
  const selective = R.SELECTIVE_EN || SELECTIVE_EN;
  const favorable = R.FAVORABLE_EN || FAVORABLE_EN;
  if (!selective.test(text)) return null;
  if (favorable.test(text)) return { route: 'en:selective×favorable' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCherryPicking(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const METHOD_TRANSPARENT_ = R.METHOD_TRANSPARENT || METHOD_TRANSPARENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 方法透明度在场 → 声明了筛选标准与完整报告的是正当科研陈述
  if (METHOD_TRANSPARENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称专业复盘：专业角色指出证据选择问题
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `摘樱桃×单边证据呈现(${r.route})`
        : `cherry picking×one-sided evidence(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkCherryPicking,
  __internals: () => ({
    SELECTIVE_ZH, SELECTIVE_EN, FAVORABLE_ZH, FAVORABLE_EN,
    META_NOUN, METHOD_TRANSPARENT, THIRD_PERSON_EXEMPT,
  }),
};
