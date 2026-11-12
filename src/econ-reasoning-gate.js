/**
 * econ-reasoning-gate — 经济学/统计推理谬误族 gate 接线桥（r304）
 *
 * 背景（真升级类型③：接线一个已加载但从未 dispatch 的能力）：
 *   r219-r253 三十多轮起草的 18 个经济/统计推理维度模块（src/*.js，每个
 *   双腿共现判据 + 豁免表 + __internals 负例注入口 + 模块层单测 + 326 条
 *   官方良性语料零误命中实证）在插件层 src/plugins/econ-reasoning-check/
 *   index.js 有 FAMILIES 表并接进了 postprocess.think hook——但插件层只写
 *   `result._discrimination.econReasoning`（think-pipeline 消费 → 置信度打折
 *   + warning），**从未进 gate 判别路径**：gate.action 恒 pass，调用方拿不到
 *   block/rewrite/verify 动作，findings[] 里也没有这些维度。插件头注释明确
 *   写着「src/index.js 接线由 1 号主力补全」，该接线始终未发生。
 *
 * 本模块补上这一环：把 18 族聚合为**单一 gate 维度** `econ_reasoning_gate`
 * （verify 级），判据继承各模块的两腿共现结构，豁免表由各模块自带
 * （教学/纠正陈述/疑问句豁免已在模块层实现）。
 *
 * 为什么聚合成一个维度而不是 18 个独立 dimMap 键：
 *   - 18 族判据形状完全同构（都是「经济学/统计概念 × 误用断言」双腿共现），
 *     独立接线会让 index.js 再增 18 处接入点、8 个文件同步，收益为零而
 *     回归面扩大 18 倍；
 *   - 维度计数纪律：AGENTS.md 的 248 是 dimMap 键数，聚合桥是一个新键，
 *     计数 +1 可度量、可审计；
 *   - 误伤控制：单维度 verify 级（不 block/rewrite），与插件层「不动
 *     gate.action」的保守策略一致，双向门禁不受影响。
 *
 * 维度语义：这段文本把一个经济学/统计概念用错了（或断言一个与激励结构/
 * 样本结构/概率结构相悖的结论），需要按具体子族 guidance 修正后再采信。
 * 子族命中明细通过 __families 暴露，调用方（agent）可逐族修。
 */

// ─── 族表：与插件层 FAMILIES 一一对应（不含 ad_hominem / incentive_blind_spot，
// 那两个已在 r297 独立接进 dimMap，此处不重复接线）──
const path = require('path');

const FAMILIES = [
  { key: 'budget_value_conflation',         mod: './budget-value-conflation.js',        fn: 'checkBudgetValueConflation',        zh: '预算约束≠价值判断',       en: 'budget-value conflation',        round: 'r219' },
  { key: 'average_marginal_conflation',     mod: './average-marginal-conflation.js',    fn: 'checkAverageMarginalConflation',    zh: '平均≠边际',               en: 'average-marginal conflation',    round: 'r220' },
  { key: 'mental_accounting',               mod: './mental-accounting.js',              fn: 'detectMentalAccounting',            zh: '心理账户',                 en: 'mental accounting',              round: 'r235' },
  { key: 'perverse_incentive',              mod: './perverse-incentive.js',             fn: 'detectPerverseIncentive',           zh: '激励反噬',                 en: 'perverse incentive',             round: 'r236' },
  { key: 'winners_curse',                   mod: './winners-curse.js',                  fn: 'detectWinnersCurse',                zh: '赢家诅咒',                 en: "winner's curse",                 round: 'r237' },
  { key: 'tragedy_of_commons',              mod: './tragedy-of-commons.js',            fn: 'detectTragedyOfCommons',            zh: '公地悲剧',                 en: 'tragedy of the commons',         round: 'r238' },
  { key: 'illusion_of_control',             mod: './illusion-of-control.js',            fn: 'detectIllusionOfControl',           zh: '控制幻觉',                 en: 'illusion of control',            round: 'r239' },
  { key: 'disposition_effect',              mod: './disposition-effect.js',             fn: 'detectDispositionEffect',           zh: '处置效应',                 en: 'disposition effect',             round: 'r240' },
  { key: 'endowment_effect',                mod: './endowment-effect.js',              fn: 'detectEndowmentEffect',             zh: '禀赋效应',                 en: 'endowment effect',               round: 'r241' },
  { key: 'anchoring_effect',                mod: './anchoring-effect.js',              fn: 'detectAnchoringEffect',             zh: '锚定效应',                 en: 'anchoring effect',               round: 'r242' },
  { key: 'present_bias',                    mod: './present-bias.js',                  fn: 'detectPresentBias',                 zh: '现时偏差（双曲贴现）',     en: 'present bias',                   round: 'r243' },
  { key: 'peak_end_rule',                   mod: './peak-end-rule.js',                 fn: 'detectPeakEndRule',                 zh: '峰终定律',                 en: 'peak-end rule',                  round: 'r245' },
  { key: 'effort_justification',            mod: './effort-justification.js',          fn: 'detectEffortJustification',         zh: '努力正当化',               en: 'effort justification',           round: 'r234' },
  { key: 'p_hacking',                       mod: './p-hacking.js',                     fn: 'detectPHacking',                    zh: '多重比较/数据挖掘',        en: 'p-hacking',                      round: 'r232' },
  { key: 'inverse_gamblers_fallacy',        mod: './inverse-gamblers-fallacy.js',      fn: 'detectInverseGamblersFallacy',      zh: '逆赌徒谬误',               en: "inverse gambler's fallacy",      round: 'r248' },
  { key: 'significance_effect_size',        mod: './significance-effect-size.js',      fn: 'detectSignificanceEffectSize',      zh: '显著性≠重要性',            en: 'significance ≠ effect size',     round: 'r250' },
  { key: 'selection_on_dependent_variable', mod: './selection-on-dependent-variable.js',fn: 'detectSelectionOnDependentVariable',zh: '选择依赖变量/按结果归因', en: 'selection on dependent variable', round: 'r252' },
];

const _cache = new Map();
function _detector(fam) {
  if (_cache.has(fam.key)) return _cache.get(fam.key);
  let fn = null;
  try {
    // require 相对本模块文件解析（__dirname），不依赖进程 cwd。
    const mod = require(path.join(__dirname, fam.mod));
    fn = typeof mod[fam.fn] === 'function' ? mod[fam.fn] : null;
  } catch (_) { fn = null; }
  _cache.set(fam.key, fn);
  return fn;
}

// 顶层防御：模块 load 失败（语法错/缺文件）时不能拖垮 gate。
function _safeDetect(fam, text, inject) {
  const fn = _detector(fam);
  if (!fn) return null;
  try { return fn(text, inject); } catch (_) { return null; }
}

/**
 * 对一段文本跑 17 族经济学/统计推理检测，聚合为 gate 可用的单一维度结果。
 *
 * @param {string} text 待检测文本（gate 路径的 _normText）
 * @param {{inject?: object}} [opts] inject — 负例注入口（轮测注入删条用）
 * @returns {{hit:boolean, score:number, count:number, families:Array,
 *            details:string, guidance:string, detail:string}}
 */
function checkEconReasoningGate(text, opts) {
  const empty = { hit: false, score: 0, count: 0, families: [], details: '', guidance: '' };
  if (!text || typeof text !== 'string' || text.length < 6) return empty;
  const inject = opts && opts.inject ? opts.inject : null;

  const families = [];
  let totalScore = 0;
  let totalCount = 0;

  for (const fam of FAMILIES) {
    const r = _safeDetect(fam, text, inject);
    if (!r || !r.hit) continue;
    const score = typeof r.score === 'number' && r.score > 0 ? r.score : 0.5;
    const count = typeof r.count === 'number' && r.count > 0 ? r.count : 1;
    families.push({
      key: fam.key,
      zh: fam.zh,
      en: fam.en,
      round: fam.round,
      score,
      count,
      details: r.details || r.detail || '',
      guidance: typeof r.guidance === 'string' ? r.guidance : '',
    });
    totalScore += score;
    totalCount += count;
  }

  if (families.length === 0) return empty;

  // 多族共现时分数不线性叠加到 >1：取 max 再按族数小幅加成（上限 0.85，
  // 与插件层 score>0.6=high 的口径兼容，同时保证 verify 而非 rewrite）。
  const maxScore = Math.max(...families.map(f => f.score));
  const multiBonus = Math.min(0.15, (families.length - 1) * 0.05);
  const score = Math.min(0.85, Math.round((maxScore + multiBonus) * 1000) / 1000);

  const labels = families.map(f => f.zh).join('、');
  return {
    hit: true,
    score,
    count: totalCount,
    families,
    details: `经济学/统计推理误用(${totalCount}处: ${labels})`,
    detail: `经济学/统计推理误用(${totalCount}处: ${labels})`,
    guidance: '按命中子族修正概念误用：' + families
      .slice(0, 3)
      .map(f => `${f.zh}——${f.guidance || '把概念与其适用条件对齐后再下断言'}`)
      .join('；') + '。不得在概念误用未说明的情况下直接给出经济/统计结论',
  };
}

module.exports = {
  checkEconReasoningGate,
  FAMILIES,
};
