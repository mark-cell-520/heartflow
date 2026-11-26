/**
 * look-elsewhere-effect-check — look-elsewhere effect / 多重搜索下假阳性
 * 误读辨别器（插件层接线，r483）
 *
 * 背景：r483 起草 src/look-elsewhere-effect.js（腿①搜索空间宽度陈述 ×
 * 腿②显著性当验证断言，双腿 AND 同窗 ZH 80 / EN 220，否定守卫 +
 * 三类豁免），模块层实测 ZH 攻击 10/10 + EN 8/8 命中、良性 12/12 +
 * 边缘良性 6/6 零误伤。候选池穿透实测：look-elsewhere 族 5/9 穿透
 * （coordination/agent4/r483-probe-pool.output.txt）。
 *
 * gate 端到端接线要改 src/index.js 的 dimMap/allDims/score/dimensions/
 * VERIFY_DIMS/summary/exports 六处以上接入点（1 号独占写权限），故按
 * r295 econ-reasoning-check、r479 curse-of-knowledge-check、r481
 * norm-of-reciprocity-check、r482 status-quo-stability-check 既定先例走
 * 插件层接线：
 *   ① postprocess.think hook → result._discrimination.lookElsewhereEffect
 *      （MCP 层 mcp-server.js 通用循环 surfaced 到 MCP 结果；
 *       think-pipeline 的 _confidencePenalty 折扣合约与 sycophancy /
 *       econReasoning / curseOfKnowledge / normOfReciprocity /
 *       statusQuoStability 同族——本插件不自行写 _confidencePenalty，
 *       只写 _discrimination，折扣与 warning 由 1 号在 think-pipeline
 *       补消费点，属交接项）
 *   ② 模块导出 analyze() 供后续 MCP 只读工具 dispatch（接线规格见
 *      coordination/reports/r483-dimension-agent4.md）
 *
 * 维度计数不变（gate 层 dimMap 仍无 look_elsewhere_effect 键——给 1 号
 * 的交接项，与 econ-reasoning-check / curse-of-knowledge-check /
 * norm-of-reciprocity-check / status-quo-stability-check 插件头同款
 * 声明）；src/index.js 零改动。
 *
 * 判据形态继承模块：两腿共现（缺一不判）+ 校正纪律在场/阴性收敛在场/
 * 概念评析三类豁免 + 强否定守卫。
 * 误伤控制：模块层 12 条良性 + 6 条边缘良性语料零误命中；插件层只写
 * _discrimination，不动 gate.action，双向门禁不受影响。
 */

const FAMILIES = [
  {
    key: 'look_elsewhere_effect',
    mod: '../../look-elsewhere-effect.js',
    fn: 'checkLookElsewhereEffect',
    zh: '多重搜索下的显著性误读',
    en: 'look-elsewhere effect / multiple comparisons misreading',
    round: 'r483',
  },
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
 * 对一段文本跑本族检测。
 * @param {string} text 待检测文本（think 结论 / MCP 工具入参）
 * @param {{only?: string, inject?: object}} [opts]
 *   only   — 只跑某一族（MCP 工具 action=<family key>）
 *   inject — 负例注入口：原样传给模块 check(text, inject)（轮测注入删条用）
 * @returns {{score:number, risk:string, families:Array, totalHits:number, familyCount:number, text_length:number}}
 */
function analyze(text, opts) {
  const empty = { score: 0, risk: 'low', families: [], totalHits: 0, familyCount: 0, text_length: 0 };
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
        group: 'statistical-reasoning',
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
  name: 'look-elsewhere-effect-check',

  version: '1.0.0', // r483：+look-elsewhere effect 族（look_elsewhere_effect，插件层接线首发）
  description: '多重搜索下显著性误读辨别器（r483 插件层接线）：腿①搜索空间宽度陈述（N 个团队/机构/实验室/课题组 + 独立/分别/各自 + 搜索动词；N 个国家/城市/地区；N 个指标/子群/参数/变量；N 次重复实验；EN 同构） × 腿②显著性当验证断言（信号为真/不是噪声/交叉验证/足以证明结论稳健/报告了显著/came out significant/reported significance/confirmed），双腿 AND 同窗共现（ZH 80 / EN 220）+ 校正纪律在场（Bonferroni/FDR/多重比较校正/trials factor/preregistered）/阴性收敛在场/概念评析三类豁免 + 强否定守卫。r483 起草的 src/look-elsewhere-effect.js 从未 dispatch，本插件首次接入 think() 路径（_discrimination.lookElsewhereEffect）与 analyze() 导出（供 MCP 只读工具）；gate 层 dimMap 无本键，接线规格留 1 号交接项。',

  hooks: [
    // 230 > status-quo-stability-check 的 220：升序执行，本插件最后跑，
    // merge 进已存在的 _discrimination（econ/sycophancy/curseOfKnowledge/
    // normOfReciprocity/statusQuoStability 先写）。
    { event: 'postprocess.think', priority: 230 },
  ],

  init(hf, ctx) {
    const hookBus = ctx && ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };
    hf._lookElsewhereEffectAnalyzer = analyze;
    hookBus.on('postprocess.think', async (evtCtx) => {
      const result = evtCtx && evtCtx.result;
      const conclusion = result && result.output && result.output.conclusion;
      if (!conclusion || typeof conclusion !== 'string') return;
      let r;
      try { r = analyze(conclusion); } catch (_) { return; }
      if (!r || r.totalHits === 0) return; // 干净文本不碰 _discrimination，零开销
      result._discrimination = result._discrimination || {};
      result._discrimination.lookElsewhereEffect = r;
    }, { id: 'look-elsewhere-effect-check', priority: 230, timeout: 200 });
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
