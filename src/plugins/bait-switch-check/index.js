/**
 * bait-switch-check — 诱饵转换/低球战术辨别器（插件层接线，r486）
 *
 * 背景：r486 起草 src/bait-switch.js（腿①诱饵条件在场 BAIT × 腿②事后
 * 变更断言 SWITCH，双腿 AND 同窗，否定守卫 + 合同合规/提前告知豁免 +
 * 概念评析豁免），模块层实测 ZH 攻击 10/10 + EN 8/8 命中、良性 12/12 +
 * 边缘良性 6/6 零误伤（详见 test/round-486-bait-switch.test.js）。
 * gate 端到端接线要改 src/index.js 的 dimMap/allDims/score/
 * dimensions/VERIFY_DIMS/summary/exports 六处以上接入点（1 号独占
 * 写权限），故按 r295 econ-reasoning-check、r479 curse-of-knowledge-
 * check、r481 norm-of-reciprocity-check、r482 status-quo-stability-check
 * 既定先例走插件层接线：
 *   ① postprocess.think hook → result._discrimination.baitSwitch
 *      （MCP 层 mcp-server.js 通用循环 surfaced 到 MCP 结果；
 *       think-pipeline 的 _confidencePenalty 折扣合约与 sycophancy /
 *       econReasoning / curseOfKnowledge / normOfReciprocity /
 *       statusQuoStability 同族——本插件不自行写 _confidencePenalty，
 *       只写 _discrimination，折扣与 warning 由 1 号在 think-pipeline
 *       补消费点，属交接项）
 *   ② 模块导出 analyze() 供后续 MCP 只读工具 dispatch（接线规格见
 *      coordination/reports/r486-dimension-agent4.md）
 *
 * 维度计数不变（gate 层 dimMap 仍无 bait_switch 键——给 1 号的交接项，
 * 与 econ-reasoning-check / curse-of-knowledge-check /
 * norm-of-reciprocity-check / status-quo-stability-check 插件头逐字同款
 * 声明）；src/index.js 零改动。
 *
 * 判据形态继承模块：两腿共现（缺一不判）+ 合同变更合规/提前告知/概念
 * 评析三类豁免 + 强否定守卫。
 * 误伤控制：模块层 12 条良性 + 6 条边缘良性语料零误命中；插件层只写
 * _discrimination，不动 gate.action，双向门禁不受影响。
 */

const FAMILIES = [
  {
    key: 'bait_switch',
    mod: '../../bait-switch.js',
    fn: 'checkBaitSwitch',
    zh: '诱饵转换/低球战术',
    en: 'bait-and-switch / lowball',
    round: 'r486',
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
        group: 'social-psychology',
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
  name: 'bait-switch-check',

  version: '1.0.0', // r486：+诱饵转换/低球战术族（bait_switch，插件层接线首发）
  description: '诱饵转换/低球战术辨别器（r486 插件层接线）：腿①诱饵条件在场（低价报价/承诺条款/免费使用/宣传功能/面试时说好/low price/promise/advertised/free） × 腿②事后变更断言（事后加价/逐个加码/改职责/功能分级/骑虎难下/then change/after payment/cannot walk away），双腿 AND 同窗共现 + 合同变更合规/提前告知/概念评析三类豁免 + 强否定守卫。r486 起草的 src/bait-switch.js 从未 dispatch，本插件首次接入 think() 路径（_discrimination.baitSwitch）与 analyze() 导出（供 MCP 只读工具）；gate 层 dimMap 无本键，接线规格留 1 号交接项。',

  hooks: [
    // 230 > status-quo-stability-check 的 220：升序执行，本插件最后跑，
    // merge 进已存在的 _discrimination（econ/sycophancy/curseOfKnowledge/
    // normOfReciprocity/statusQuoStability 先写）。
    { event: 'postprocess.think', priority: 230 },
  ],

  init(hf, ctx) {
    const hookBus = ctx && ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };
    hf._baitSwitchAnalyzer = analyze;
    hookBus.on('postprocess.think', async (evtCtx) => {
      const result = evtCtx && evtCtx.result;
      const conclusion = result && result.output && result.output.conclusion;
      if (!conclusion || typeof conclusion !== 'string') return;
      let r;
      try { r = analyze(conclusion); } catch (_) { return; }
      if (!r || r.totalHits === 0) return; // 干净文本不碰 _discrimination，零开销
      result._discrimination = result._discrimination || {};
      result._discrimination.baitSwitch = r;
    }, { id: 'bait-switch-check', priority: 230, timeout: 200 });
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
