/**
 * information-aversion-check — information aversion / ostrich effect
 * （信息回避/鸵鸟效应）辨别器（插件层接线，r484）
 *
 * 背景：r484 起草 src/information-aversion.js（腿①有用负面信息在场/可得性
 * × 腿②主动回避该信息的决定，双腿 AND 同窗 ZH 60 / EN 160，否定守卫 +
 * 三类豁免）。候选池穿透实测 coordination/agent4/r484-probe-pool.js
 * （v6.8.242 gate() 口径）：八族中 G 族 information aversion 穿透最高
 * ——初始池 4/5 = 80%，扩池后 10/12 = 83%；A naive realism 2/8、
 * B ad baculum 3/7、C belief bias 1/5、D zero-risk 3/5、
 * E illusion of validity 0/5、F semmelweis 2/5、H 对照 0/2。
 * 良性基线 12 条误伤 1/12、边缘良性 3 条误伤 2/3——两批误伤全部由存量
 * 维度（duration_neglect / claimed_verification_without_trail /
 * scrutiny_evasion）代拦，与本族无关；族内零新增误伤。
 *
 * gate 端到端接线要改 src/index.js 的 dimMap/allDims/score/dimensions/
 * VERIFY_DIMS/summary/exports 六处以上接入点（1 号独占写权限），故按
 * r295 econ-reasoning-check、r479 curse-of-knowledge-check、r481
 * norm-of-reciprocity-check、r482 status-quo-stability-check、r483
 * look-elsewhere-effect-check 既定先例走插件层接线：
 *   ① postprocess.think hook → result._discrimination.informationAversion
 *      （MCP 层 mcp-server.js 通用循环 surfaced 到 MCP 结果；
 *       think-pipeline 的 _confidencePenalty 折扣合约与 sycophancy /
 *       econReasoning / curseOfKnowledge / normOfReciprocity /
 *       statusQuoStability / lookElsewhereEffect 同族——本插件不自行写
 *       _confidencePenalty，只写 _discrimination，折扣与 warning 由 1 号
 *       在 think-pipeline 补消费点，属交接项）
 *   ② 模块导出 analyze() 供后续 MCP 只读工具 dispatch（接线规格见
 *      coordination/reports/r484-dimension-agent4.md）
 *
 * 维度计数不变（gate 层 dimMap 仍无 information_aversion 键——给 1 号
 * 的交接项，与 econ-reasoning-check / curse-of-knowledge-check /
 * norm-of-reciprocity-check / status-quo-stability-check /
 * look-elsewhere-effect-check 插件头同款声明）；src/index.js 零改动。
 *
 * 判据形态继承模块：两腿共现（缺一不判）+ 正确处置/成本权衡/委托在场、
 * 概念评析两类豁免 + 强否定守卫。
 * 误伤控制：模块层 12 条良性 + 3 条边缘良性语料零误命中（存量维度代拦
 * 的两条已在模块豁免层排除——「记录了未验证的部分作为已知风险」由
 * DISCIPLINE_ZH 豁免、「权限范围只覆盖已确认事项」由「权限范围/评审范围」
 * 豁免）；插件层只写 _discrimination，不动 gate.action，双向门禁不受影响。
 */

const FAMILIES = [
  {
    key: 'information_aversion',
    mod: '../../information-aversion.js',
    fn: 'checkInformationAversion',
    zh: '信息回避/鸵鸟效应（已知有用负面信息在手仍主动不看）',
    en: 'information aversion / ostrich effect (deliberate avoidance of available negative information)',
    round: 'r484',
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
        group: 'information-behavior',
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
  name: 'information-aversion-check',

  version: '1.0.0', // r484：+information aversion 族（information_aversion，插件层接线首发）
  description: '信息回避/鸵鸟效应辨别器（r484 插件层接线）：腿①有用负面信息的在场或可得性陈述（数据/报告/尽调/结论 + 已拿到手/整理好/放在桌上/就在面前；「再查一轮就能查清楚」；tell me the result yet / have the report in hand / sitting right there / one more check would reveal） × 腿②主动回避该信息的决定（不看/不查/不翻那一页/先别告诉我/不想知道/装作不知道/宁愿不知道/知道得越少；would rather not look / do not tell me / deliberately not opened / rather stay in the dark / reading it now would），双腿 AND 同窗共现（ZH 60 / EN 160）+ 正确处置/成本权衡/委托在场（记录了未验证部分作为已知风险/交给风控/评估后/预算/权限范围/logged the unverified portion as a known risk / delegated to / scope）/概念评析两类豁免 + 强否定守卫。r484 起草的 src/information-aversion.js 从未 dispatch，本插件首次接入 think() 路径（_discrimination.informationAversion）与 analyze() 导出（供 MCP 只读工具）；gate 层 dimMap 无本键，接线规格留 1 号交接项。',

  hooks: [
    // 240 > look-elsewhere-effect-check 的 230：升序执行，本插件最后跑，
    // merge 进已存在的 _discrimination（econ/sycophancy/curseOfKnowledge/
    // normOfReciprocity/statusQuoStability/lookElsewhereEffect 先写）。
    { event: 'postprocess.think', priority: 240 },
  ],

  init(hf, ctx) {
    const hookBus = ctx && ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };
    hf._informationAversionAnalyzer = analyze;
    hookBus.on('postprocess.think', async (evtCtx) => {
      const result = evtCtx && evtCtx.result;
      const conclusion = result && result.output && result.output.conclusion;
      if (!conclusion || typeof conclusion !== 'string') return;
      let r;
      try { r = analyze(conclusion); } catch (_) { return; }
      if (!r || r.totalHits === 0) return; // 干净文本不碰 _discrimination，零开销
      result._discrimination = result._discrimination || {};
      result._discrimination.informationAversion = r;
    }, { id: 'information-aversion-check', priority: 240, timeout: 200 });
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
