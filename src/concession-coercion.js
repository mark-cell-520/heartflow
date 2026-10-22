/**
 * src/concession-coercion.js — 让步条件 × 灾难终局检测器（第 63 个判别维度）
 *
 * v6.8.5 新增。心虫 decision 本体选出（/root/.hermes/cache/scratch/.hf-decide-r492.js，
 * 候选 A 得 0.79 分，identity_alignment 0.80）。
 * 探测器候选来源：/tmp/hf-scout-20261005-492.txt（内置池已穿）+ 本轮扩池探针
 * /root/.hermes/cache/scratch/.hf-scout-r492-probe.js（5 个新族，A 被选）。
 * 复测（.hf-r492-reprobe.js，直调 src/gate.js）：12 条攻击样本
 * **10 条穿过硬闸门**（gate=pass），仅 2 条被 slippery_slope / perfect_error
 * 兜住落 verify；6 条良性 0 误判。
 *
 * 辨别的族：「让步条件 × 灾难终局」——把**未来的、不可控的灾难**预支给
 * **当下的一个具体让步**，让接受者以为「只要不松口，灾难就不会来」。
 * 压力落点在未来且被表述为不可逆（让步→崩盘/深渊/没完没了），
 * 与已有维度的区别：
 *   · slippery_slope 要求**传递链**（一步一步恶化），本族不需要链，
 *     一步直达终局，且必须带**让步/同意/松口**这个触发条件；
 *   · false_urgency 管时间窗捏造，本族不管时间，管「让步即灾难」的绑定；
 *   · emotional_manipulation 管当下情绪施压，本族的灾难在未来；
 *   · unsupported_claim 管无依据，本族的灾难陈述往往是**不可证伪的断言**
 *     （「后患就没完没了」），重点不在证据而在绑定结构。
 *
 * 判据（两条件同时在场才判定）：
 *   C1 让步条件在场 —— 让步/同意/批准/松口/say yes/allow/approve/concede
 *   C2 灾难终局在场 —— 崩盘/塌/深渊/后患/连锁反应/不可逆/collapse/falls apart
 *   → verify 级：要求把「让步」与「灾难」的因果关系拆开，各自给可验证依据；
 *     让步是条件决策，不是灾难的开关。
 *
 * 明确不判的（这些是正当陈述，豁免整句）：
 *   · 有量化与依据的风险陈述：「接受这个方案会让Q3收入下降12%，报告中已列出测算依据」
 *   · 带补偿控制的条件批准：「If we approve this exception, we must add the compensating control.」
 *   · 已实测的有限影响陈述：「If we relax the gate, latency may rise by 3ms; measured in staging.」
 *   · 在评析这套话术本身：「滑坡谬误/滑坡论证是一种逻辑谬误」
 */

'use strict';

// ─── C1: 让步条件在场 ──────────────────────────────────────
// 中文：让步/同意/批准/松口/退让/应允/默许/开这个口子
const CONCEDE_ZH = /(?:如果|若|一旦|要是|只要|假如|倘若)[^。，；]{0,12}?(?:让步|退让|松口|同意|答应|批准|采纳|接受|默许|应允|开了这个口子|开这个先例|放行|放它过|低头|妥协)|(?:这次|现在|今天|这回|此时)[^。，；]{0,6}?(?:让步|退让|松口|同意|答应|批准|妥协|放行)|(?:让步|退让|松口|同意|批准|妥协|放行)(?:一次|一回|一步|了这一回)|退(?:了)?一步|不(?:守住|捍卫|坚持|把住|看住|把持)[^。，；]{0,6}(?:底线|这条线|红线|边界|原则|关口|关口|阵线|门槛)/;

// 英文：if/if we allow / say yes / concede / approve / give in / back down
const CONCEDE_EN = /\b(?:if|once|when)\s+(?:we|you|they)\s+(?:allow|approve|accept|concede|give\s+in|back\s+down|say\s+yes|agree|permit|let\s+them)\b|\b(?:conced|give\s+in|back\s+down)\s+(?:now|this\s+time|here)\b|\b(?:say|say)\s+yes\s+(?:here|now|to\s+this)\b/i;

// ─── C2: 灾难终局在场 ──────────────────────────────────────
// 中文：崩盘/崩塌/全线崩溃/深渊/后患/连锁反应/完蛋/全完了/守不住/全线失守
const CALAMITY_ZH = /(?:体系|系统|大局|局面|底线|全线|整条线|全盘)(?:就会|将会|都会|也会|还要|就|将|全会)?(?:崩|塌|崩盘|崩溃|崩塌|垮|坍塌|守不住|失守|垮掉|塌掉|完蛋|全完了|毁于一旦|不复存在|全盘皆输)|(?:崩盘|崩塌|崩溃|坍塌|后患|万丈深渊|无底深渊|连锁反应|骨牌|多米诺|一发不可收拾|没完没了|不可收拾|不可挽回|不可逆转|无法挽回|没法回头|回不了头|没有回头路|彻底失控|全面失控|脱缰|决堤|洪水|蜂拥|一发|拦不住|管不住|收不住|收不了场|收拾不了)|(?:后果|责任|锅|锅)[^。，；]{0,10}(?:由|全部都由|全都由)?(?:所有人|大家|全社会|每个人)(?:一起|共同|一块)?(?:承担|买单|承受|负责)|(?:明天|往后|以后|今后|接下来)[^。，；]{0,8}(?:就)?得?(?:退|让|松口|妥协)(?:十步|百步|更多|更多步|无数步|到哪)/;

// 英文：collapse / falls apart / lose control / no coming back / point of no return
const CALAMITY_EN = /\b(?:everything|the\s+whole\s+(?:system|thing|project|society)|it\s+all)\s+(?:will\s+|would\s+)?(?:collapse|falls?\s+apart|fall\s+apart|comes?\s+apart|comes?\s+crashing\s+down|unravels?|implodes?)\b|\b(?:whole\s+)?(?:system|structure|framework|institution|society|economy)\s+(?:will\s+)?(?:collapse|crumble|fall\s+apart|unravel)\b|\b(?:we|they|it)\s+(?:will\s+)?lose\s+(?:all\s+)?control\b|\bno\s+(?:coming\s+back|turning\s+back|way\s+back)\b|\bpoint\s+of\s+no\s+return\b|\bslippery\s+slope\s+(?:to|into)\s+(?:collapse|disaster|ruin)\b|\b(?:first|next)\s+(?:one|thing|concession)\s+will\s+(?:open|lead\s+to)\b/i;

// ─── 豁免：正当风险陈述 ────────────────────────────────────
// 有量化依据的风险提示（百分比/毫秒/测试口径/报告附件）不是恐吓
const QUANTIFIED_ZH = /\d+\s*(?:%|％|个百分点|倍|ms|毫秒|秒|分钟|天|万元|元)/;
const QUANTIFIED_EN = /\b\d+(?:\.\d+)?\s*(?:%|percent|ms|milliseconds?|seconds?|minutes?|days?|dollars?|usd|bps)\b/i;
const EVIDENCE_MARK_ZH = /(?:报告|附录|测算|实测|数据|依据|记录在案|日志|评审|审计|复盘)/;
const EVIDENCE_MARK_EN = /\b(?:report|appendix|measured|benchmark|staging|test|data|audit|documented|log)\b/i;
// 带补偿控制/缓解措施的条件批准
const MITIGATE_ZH = /(?:补偿控制|缓解措施|兜底|预案|上限|限额|阈值|熔断|限制|约束|审查节点|回滚|退出机制|审计)/;
const MITIGATE_EN = /\b(?:compensating|mitigat|contingency|guardrail|cap|limit|threshold|rollback|safeguard|review\s+gate|monitoring|control)\b/i;

// 在评析这套话术本身 → 不是在运用它
const META_EXEMPT_ZH = /滑坡(?:谬误|论证|论证法)|滑坡(?:论证)?是(?:一种)?(?:逻辑)?谬误/;
const META_EXEMPT_EN = /\bslippery\s+slope\s+(?:is\s+a|fallacy)\b|\bthat'?s\s+a\s+slippery\s+slope\b/i;

const QUALIFY_ZH = /谬误|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思|警惕)/;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\b|\bquestionable\b|\bflawed\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkConcessionCoercion(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 在评析「滑坡/让步要挟」这套论证 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) &&
      (QUALIFY_ZH.test(text) || QUALIFY_EN.test(text))) {
    return { hit: false, score: 0, detail: '' };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // C1 让步条件
  const concedes = isZh
    ? (CONCEDE_ZH.test(text) || CONCEDE_EN.test(text))
    : (CONCEDE_EN.test(text) || CONCEDE_ZH.test(text));
  if (!concedes) return { hit: false, score: 0, detail: '' };

  // C2 灾难终局
  const calamity = isZh
    ? (CALAMITY_ZH.test(text) || CALAMITY_EN.test(text))
    : (CALAMITY_EN.test(text) || CALAMITY_ZH.test(text));
  if (!calamity) return { hit: false, score: 0, detail: '' };

  // 豁免：有量化依据 或 有缓解措施 的正当风险陈述
  const quantified = isZh
    ? (QUANTIFIED_ZH.test(text) || QUANTIFIED_EN.test(text))
    : (QUANTIFIED_EN.test(text) || QUANTIFIED_ZH.test(text));
  const mitigated = isZh
    ? (MITIGATE_ZH.test(text) || MITIGATE_EN.test(text))
    : (MITIGATE_EN.test(text) || MITIGATE_ZH.test(text));
  const evidenced = isZh
    ? (EVIDENCE_MARK_ZH.test(text) || EVIDENCE_MARK_EN.test(text))
    : (EVIDENCE_MARK_EN.test(text) || EVIDENCE_MARK_ZH.test(text));
  // 三项里占两项以上 → 视作正当风险陈述，不是恐吓
  const benignSignals = [quantified, mitigated, evidenced].filter(Boolean).length;
  if (benignSignals >= 2) return { hit: false, score: 0, detail: '' };

  return {
    hit: true,
    score: isZh ? 0.45 : 0.45,
    detail: isZh ? '让步条件×灾难终局(zh)' : '让步条件×灾难终局(en)',
  };
}

module.exports = { checkConcessionCoercion };
