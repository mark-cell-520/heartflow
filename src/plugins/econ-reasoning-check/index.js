/**
 * econ-reasoning-check — 经济与资源推理 + 统计素养 18 族辨别器（插件层接线，r295）
 *
 * 背景（实例化 ≠ 接线 的集中清理）：
 *   r219-r253 三十多轮里，4 号按「经济与资源推理 / 统计素养」选题库逐族起草了
 *   18 个 provisional 判别维度模块（src/*.js，每个 20-33KB、双腿共现判据 +
 *   豁免表 + __internals 负例注入口），模块层全部有单测、有零命中实证、
 *   有 326 条官方良性语料验证——但**从未进过任何 dispatch 路径**：
 *   gate 路径要改 src/index.js 八处接入点（1 号独占），草稿头注释一致写着
 *   「src/index.js 接线由 1 号主力补全」，而该接线始终未发生。
 *   本轮用插件层（PluginLoader 自动发现，零改 heartflow.js）+ MCP 工具层
 *   把这 18 个能力首次接入引擎：
 *     ① postprocess.think hook → result._discrimination.econReasoning
 *        （think-pipeline 消费：score>0.5 → _confidencePenalty 置信度打折
 *         + warning，与 sycophancy-check 同合约）
 *     ② 两个只读 MCP 工具（heartflow_econ_fallacy_check /
 *         heartflow_stats_literacy_check），action=all|<family key>
 *
 * 维度计数不变（gate 层 dimMap 仍无这些键——给 1 号的交接项）；
 * src/index.js 零改动。
 *
 * 判据形态继承各模块：两腿共现（缺一不判）+ 概念教学/纠正陈述/疑问句豁免。
 * 误伤控制：模块层已在 326 条良性语料上零误命中（见各轮报告 §五）；
 * 插件层只写 _discrimination，不动 gate.action，双向门禁不受影响。
 */

// ─── 族表：key / 模块 / 导出函数 / 分组 / 中英标签 / 起草轮次 ───
// group: 'econ'（经济与资源推理·行为经济学 13 族）| 'stats'（统计素养 5 族）
const FAMILIES = [
  // ── econ：经济与资源推理 ──
  { key: 'budget_value_conflation',        mod: '../../budget-value-conflation.js',        fn: 'checkBudgetValueConflation',        group: 'econ',  zh: '预算约束≠价值判断',   en: 'budget-value conflation',        round: 'r219' },
  { key: 'average_marginal_conflation',    mod: '../../average-marginal-conflation.js',    fn: 'checkAverageMarginalConflation',    group: 'econ',  zh: '平均≠边际',           en: 'average-marginal conflation',    round: 'r220' },
  { key: 'mental_accounting',              mod: '../../mental-accounting.js',              fn: 'detectMentalAccounting',            group: 'econ',  zh: '心理账户',             en: 'mental accounting',              round: 'r235' },
  { key: 'perverse_incentive',             mod: '../../perverse-incentive.js',             fn: 'detectPerverseIncentive',           group: 'econ',  zh: '激励反噬',             en: 'perverse incentive',             round: 'r236' },
  { key: 'winners_curse',                  mod: '../../winners-curse.js',                  fn: 'detectWinnersCurse',                group: 'econ',  zh: '赢家诅咒',             en: "winner's curse",                 round: 'r237' },
  { key: 'tragedy_of_commons',             mod: '../../tragedy-of-commons.js',             fn: 'detectTragedyOfCommons',            group: 'econ',  zh: '公地悲剧',             en: 'tragedy of the commons',         round: 'r238' },
  { key: 'illusion_of_control',            mod: '../../illusion-of-control.js',            fn: 'detectIllusionOfControl',           group: 'econ',  zh: '控制幻觉',             en: 'illusion of control',            round: 'r239' },
  { key: 'disposition_effect',             mod: '../../disposition-effect.js',             fn: 'detectDispositionEffect',           group: 'econ',  zh: '处置效应',             en: 'disposition effect',             round: 'r240' },
  { key: 'endowment_effect',               mod: '../../endowment-effect.js',               fn: 'detectEndowmentEffect',             group: 'econ',  zh: '禀赋效应',             en: 'endowment effect',               round: 'r241' },
  { key: 'anchoring_effect',               mod: '../../anchoring-effect.js',               fn: 'detectAnchoringEffect',             group: 'econ',  zh: '锚定效应',             en: 'anchoring effect',               round: 'r242' },
  { key: 'present_bias',                   mod: '../../present-bias.js',                   fn: 'detectPresentBias',                 group: 'econ',  zh: '现时偏差（双曲贴现）', en: 'present bias (hyperbolic discounting)', round: 'r243' },
  { key: 'peak_end_rule',                  mod: '../../peak-end-rule.js',                  fn: 'detectPeakEndRule',                 group: 'econ',  zh: '峰终定律',             en: 'peak-end rule',                  round: 'r245' },
  { key: 'effort_justification',           mod: '../../effort-justification.js',          fn: 'detectEffortJustification',         group: 'econ',  zh: '努力正当化',           en: 'effort justification',           round: 'r234' },
  // ── stats：统计素养 ──
  { key: 'p_hacking',                      mod: '../../p-hacking.js',                      fn: 'detectPHacking',                    group: 'stats', zh: '多重比较/数据挖掘',    en: 'p-hacking',                      round: 'r232' },
  { key: 'inverse_gamblers_fallacy',       mod: '../../inverse-gamblers-fallacy.js',       fn: 'detectInverseGamblersFallacy',      group: 'stats', zh: '逆赌徒谬误',           en: "inverse gambler's fallacy",      round: 'r248' },
  { key: 'significance_effect_size',       mod: '../../significance-effect-size.js',       fn: 'detectSignificanceEffectSize',      group: 'stats', zh: '显著性≠重要性',        en: 'significance ≠ effect size',     round: 'r250' },
  { key: 'selection_on_dependent_variable',mod: '../../selection-on-dependent-variable.js',fn: 'detectSelectionOnDependentVariable',group: 'stats', zh: '选择依赖变量/按结果归因', en: 'selection on dependent variable', round: 'r252' },
  { key: 'ad_hominem',                     mod: '../../ad-hominem.js',                     fn: 'checkAdHominem',                    group: 'stats', zh: '人身攻击',             en: 'ad hominem',                     round: 'r253' },
];

const _cache = new Map();
function _detector(fam) {
  if (_cache.has(fam.key)) return _cache.get(fam.key);
  let fn = null;
  try {
    const mod = require(fam.mod);
    fn = typeof mod[fam.fn] === 'function' ? mod[fam.fn] : null;
  } catch (_) { fn = null; }
  _cache.set(fam.key, fn);
  return fn;
}

/**
 * 对一段文本跑 18 族检测。
 * @param {string} text 待检测文本（think 结论 / MCP 工具入参）
 * @param {{only?: string, inject?: object}} [opts]
 *   only   — 只跑某一族（MCP 工具 action=<family key>）
 *   inject — 负例注入口：原样传给各模块 detect(text, inject)（轮测注入删条用）
 * @returns {{score:number, risk:string, families:Array, totalHits:number, familyCount:number, text_length:number}}
 */
function analyze(text, opts) {
  const empty = { score: 0, risk: 'low', families: [], totalHits: 0, familyCount: 0 };
  if (!text || typeof text !== 'string' || text.length < 6) return empty;
  const only = opts && typeof opts.only === 'string' ? opts.only : null;
  const inject = opts && opts.inject ? opts.inject : null;

  const families = [];
  let totalScore = 0;
  let totalHits = 0;

  for (const fam of FAMILIES) {
    if (only && fam.key !== only) continue;
    const fn = _detector(fam);
    if (!fn) continue;
    let r;
    try { r = fn(text, inject); } catch (_) { continue; }
    if (r && r.hit) {
      const count = typeof r.count === 'number' && r.count > 0 ? r.count : 1;
      families.push({
        key: fam.key,
        group: fam.group,
        label: fam.zh,
        label_en: fam.en,
        round: fam.round,
        score: typeof r.score === 'number' ? r.score : 0,
        count,
        details: r.details || r.detail || '',
        evidence: Array.isArray(r.evidence) ? r.evidence.slice(0, 3) : [],
        guidance: typeof r.guidance === 'string' ? r.guidance : '',
      });
      totalScore += (typeof r.score === 'number' ? r.score : 0);
      totalHits += count;
    }
  }

  const score = Math.min(1, Math.round(totalScore * 1000) / 1000);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    families,
    totalHits,
    familyCount: families.length,
    text_length: text.length,
  };
}

const plugin = {
  name: 'econ-reasoning-check',
  version: '1.0.0', // r295：18 族首次 dispatch（postprocess.think + 2 个 MCP 只读工具）
  description: '经济与资源推理 + 统计素养 18 族辨别器（r295 插件层接线）：budget_value_conflation / average_marginal_conflation / mental_accounting / perverse_incentive / winners_curse / tragedy_of_commons / illusion_of_control / disposition_effect / endowment_effect / anchoring_effect / present_bias / peak_end_rule / effort_justification / p_hacking / inverse_gamblers_fallacy / significance_effect_size / selection_on_dependent_variable / ad_hominem。这些族 r219-r253 起草后从未 dispatch，本轮首次接入 think() 路径（_discrimination.econReasoning → 置信度打折 + warning）与 MCP 只读工具。',
  hooks: [
    { event: 'postprocess.think', priority: 190 }, // 190 > sycophancy-check 的 180：升序执行，本插件最后跑，merge 进已存在的 _discrimination（sycophancy 会整体覆写该对象）
  ],

  init(hf, ctx) {
    const hookBus = ctx && ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };
    hf._econReasoningAnalyzer = analyze;
    hookBus.on('postprocess.think', async (evtCtx) => {
      const result = evtCtx && evtCtx.result;
      const conclusion = result && result.output && result.output.conclusion;
      if (!conclusion || typeof conclusion !== 'string') return;
      let r;
      try { r = analyze(conclusion); } catch (_) { return; }
      if (!r || r.totalHits === 0) return; // 干净文本不碰 _discrimination，零开销
      result._discrimination = result._discrimination || {};
      result._discrimination.econReasoning = r;
    }, { id: 'econ-reasoning-check', priority: 190, timeout: 200 });
    return { ok: true };
  },
};

module.exports = {
  name: plugin.name,
  version: plugin.version,
  description: plugin.description,
  hooks: plugin.hooks,
  init: plugin.init,
  analyze,
  FAMILIES,
};
