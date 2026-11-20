/**
 * src/calibration-mismatch.js — 「断言语气强度超出证据等级（calibration
 * mismatch / overconfidence relative to evidence）」检测器
 * （第 274 个判别维度，r421）
 *
 * [r421 立项] 缺口实证（scripts/round-421/probe-r421-gap.js，v6.8.209 基线）
 * 攻击族 12 条中 11 条 gate.action=pass 完全穿引擎（仅 1 条被存量
 * absolute_claim 代拦）；良性 12 条存量非 pass 2 条均为存量维度
 * （unsupported_claim/confidence），本族零误伤。272 个已接线维度无
 * calibration / overconfidence-relative 键。decision 本体裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：断言语气强度超出证据等级（calibration mismatch）——文本对
 * 某个命题给出**高强度确定性断言**（毫无疑问/绝对/必然/铁定/百分百），
 * 但**同一句或邻近句中没有任何证据等级与之匹配的支撑**（无来源、无
 * 数据、无样本量、无对照、无检验动作，或只给出「大家都这么说」这类
 * 不可核验的群体印象）。语气强度与证据支撑度之间的**落差本身**就是
 * 可判别的认知缺陷，与「有没有依据」「依据是否有效」是两个正交的
 * 攻击面。
 *
 * 典型措辞：
 *   毫无疑问，这款产品是市面上最好的，用户用了都说好。
 *   绝对是革命性的突破，没有任何竞争对手能比。
 *   这必然是正确的选择，放心吧。
 *   百分百有效，你完全不用担心副作用。
 *   It is undoubtedly the best product on the market, everyone loves it.
 *   This is absolutely a breakthrough, no competitor can compare.
 *
 * 为什么现有维度拦不住（r421 归因，逐邻居探针验证）：
 *   · confidence 管确定性词本身（一定/绝对/毫无疑问/最X）的**出现**，
 *     不要求证据缺陷腿在场——「数据表明该药有效率 95%，绝对安全」
 *     有依据时 confidence 仍判，本族明确不判（证据在场）。
 *   · absolute_claim 管绝对化措辞（唯一/完全/所有/根本）的**形式**，
 *     本族管语气强度与证据等级的**落差**。
 *   · unsupported_claim 管断言无依据（单腿），本族要求「高强度断言 ×
 *     证据缺陷」两腿共现。
 *   · bullshit 管不顾真假的陈述，本族不涉及真值、只涉及语气与
 *     证据的匹配关系。
 *   · weak_evidence_strong_claim 管**弱证据类型→强结论**（有证据在场
 *     只是类型弱），本族管**证据缺位→强断言**，两族在证据是否在场上
 *     互补而非重叠。
 *
 * [r421 豁免表设计] 六组豁免（证据等级匹配 / 对冲限定 / 元陈述破除 /
 * 疑问形 / 引述转述），保证「实验数据显示有效率 95%，因此可以确定该
 * 方法有效」这类**证据在场**的合法推断、以及「这是校准失配的典型例
 * 子」这类破除性陈述不被误伤。
 *
 * 判据（两腿共现 + 跨腿邻近窗 + 豁免，缺一不判）：
 *   腿① CERTAINTY 高强度确定性断言腿——确定性断言词（毫无疑问/
 *     毋庸置疑/绝对/必然/肯定/铁定/百分百/百分之百/一定；EN
 *     undoubtedly / absolutely / certainly / definitely / bound to /
 *     100% / no doubt）落在**断言动词或结论形容词**附近
 *   腿② EVIDENCE_DEFICIT 证据缺陷腿三类任一——
 *     a 证据空转（大家都这么说/群众的眼睛是雪亮的/口碑爆棚/销量说明
 *       一切/事实证明；EN everyone says / everyone knows / it's
 *       obvious / common sense）——给出的是不可核验的群体印象
 *     b 主观体验担保（放心/放心吧/包在你身上/保证; EN rest assured /
 *       trust me / guarantee）
 *     c 无来源强断言（句中无来源词/无数据词/无检验动词）
 *
 * 为什么取 VERIFY 级：单句可能是营销文案转述、对他人过度自信表述的
 * 批评、或修辞教学案例。verify 的含义是「这段文本的确定性语气超出了
 * 它自己给出的证据等级，需要先补上匹配等级的证据（来源/数据/检验）
 * 再评估该断言」，调用方应要求补证据而不是直接否定结论——结论仍
 * 可能为真，只是当前陈述没有提供与之匹配的支撑。
 *
 * 已知边界：
 *   ① 腿①腿②限同句或相邻分句（邻近窗 60 字 / EN 200 字符），跨段形
 *      本轮保守不收；
 *   ② 腿② 的「无来源」判定基于同句词面，跨句引用前文来源的情形不判；
 *   ③ 证据等级匹配豁免只认显式证据词（实验/数据/统计/研究/试验/对照/
 *      样本/测量/记录/EN study/data/trial/measurement），不认隐式支撑。
 *
 * [r421 修复] 英文侧全部正则统一加 i 标志：初版漏加导致句首大写
 * "Without a doubt" 整族不命中（JS 正则默认区分大小写，\b 不解决）。
 */

'use strict';

// ─── 腿① CERTAINTY 高强度确定性断言 ────────────────────────────────
// 161 轮教训：全部收裸名词/裸动词形态（「百分百」不带「的」也命中）。
const CERTAINTY_ZH = [
  /毫无疑问|毋庸置疑|毫无疑义|不容置疑/,
  /绝对(?:正确|错误|是|能|会|可以|安全|可靠|有效|没问题|不是|不可能|没错)/,
  /必然(?:是|会|能|正确|导致|成功|失败|有效)/,
  /铁定|板上钉钉|十拿九稳|万无一失|绝无问题/,
  /(?:百分百|百分之百|100%)(?:的)?(?:确定|正确|有效|安全|可靠|没问题|可行|成功|准确)/,
  /一定(?:会|能|是|正确|没错|可以|没问题)/,
];

// [r421] 全部加 i：句首大写 Without / It is Undoubtedly 等必须命中。
const CERTAINTY_EN = [
  /\bundoubtedly\b|\bwithout (?:a )?doubt\b|\bno doubt\b|\bindisputably\b|\bunquestionably\b/i,
  /\babsolutely (?:certain|sure|correct|right|the best|safe|reliable|effective|no question)\b/i,
  /\babsolutely (?:a|an|the)\s+(?:\w+\s+){0,2}(?:breakthrough|revolution|game.?changer|miracle|guarantee|winner|solution)\b/i,
  /\bdefinitely\b|\bcertainly\b|\bbound to\b|\bguaranteed to\b/i,
  /\b100%\s*(?:certain|sure|correct|effective|safe|accurate|reliable)\b/i,
  /\bthe only\b[^.!?]{0,40}\b(?:correct|right|best|viable)\b/i,
];

// ─── 腿② EVIDENCE_DEFICIT 证据缺陷 ─────────────────────────────────
// 三形：a 证据空转 / b 主观体验担保 / c 无来源强断言标记
const EVIDENCE_SPIN_ZH = [
  /(?:大家|所有人|每个人|众人|用户|消费者|客户|买家)(?:都|全|均)?(?:这么|这样)?(?:说|认|讲|夸|推荐|称赞|好评)/,
  /群众的眼睛是雪亮的|口碑(?:爆棚|极好|很好|一流)|销量说明|卖爆了|断货王/,
  /事实证明|实践证明|历史已经证明|无数人验证/,
  /信我|包在我身上|放心(?:吧|用|买|吃|啦|，)|保证(?:有效|没问题|不骗你)/,
  /业界(?:公认|共识|标准)|专家(?:一致|都)认为|圈内(?:公认|共识)/,
];

const EVIDENCE_SPIN_EN = [
  /\beveryone (?:says|knows|agrees|thinks|recommends|loves)\b/i,
  /\bit'?s (?:obvious|common sense|well known|widely known)\b/i,
  /\brest assured\b|\btrust me\b|\bguaranteed\b|\bi promise\b/i,
  /\bindustry (?:standard|consensus|agreed)\b|\bexperts (?:all )?(?:agree|consensus)\b/i,
];

// 无来源标记：断言在场但无任何来源/数据/检验词
const SOURCE_MARKER_ZH = /(?:根据|据|依据|来自|引自|出自)[^。，]{0,20}(?:研究|报告|数据|统计|调查|实验|论文|期刊|机构|部门|官方)/;
const DATA_MARKER_ZH = /(?:实验|试验|数据|统计|调查|测量|记录|样本|对照组|随机|双盲|元分析|系统评价|临床试验|p\s*[<=＜]|置信区间|标准差|样本量|n\s*=)/i;
const SOURCE_MARKER_EN = /\b(?:according to|based on|per|from)\b[^.!?]{0,40}(?:study|research|report|data|trial|paper|journal|agency|survey)/i;
const DATA_MARKER_EN = /\b(?:study|data|trial|experiment|measurement|sample|control|randomized|blind|meta-analysis|p\s*[<=]|confidence interval|standard deviation|n\s*=)\b/i;

// ─── 豁免表 ────────────────────────────────────────────────────────
// 证据等级匹配：同句有来源/数据/检验词 → 合法推断，不判
const EXEMPT_EVIDENCE_ZH = [
  /(?:实验|试验|研究|数据|统计|调查|测量|记录|样本|对照|双盲|随机|元分析|系统评价|临床试验)/,
  /(?:p\s*[<=＜]|置信区间|标准差|方差|均值|中位数|百分位|样本量|n\s*=|有效率|治愈率|复发率|灵敏度|特异度)/i,
  /(?:根据|据|依据|引自|来自)[^。，]{0,25}(?:研究|报告|论文|数据|统计|调查|实验|机构|部门|官方|期刊)/,
];
const EXEMPT_EVIDENCE_EN = [
  /\b(?:study|studies|trial|experiment|data|statistics|survey|measurement|sample|cohort|randomized|double-blind|meta-analysis|systematic review|clinical)\b/i,
  /\b(?:p\s*[<=]|confidence interval|standard deviation|variance|mean|median|percentile|sample size|n\s*=)\b/i,
  /\b(?:according to|based on|per|from)\b[^.!?]{0,40}\b(?:study|research|report|data|trial|paper|journal|agency|survey)/i,
];

// 对冲限定：结论被概率化 → 不作谬误判定
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|倾向于|有待|仍需|尚待/,
  /大概率|小概率|有机会|有风险|存在.*可能/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:may|might|could|possibly|perhaps|probably|likely|not necessarily|remains to be seen)\b/i,
];

// 元陈述破除：讨论这个概念本身
const EXEMPT_METASTATEMENT_ZH = [
  /校准|过度自信|语气.*证据|证据.*语气|认知偏差|置信度|标定/,
  /(?:是|属于|称为|叫作|这是)一?种?(?:常见的)?(?:谬误|偏差|错误|问题|现象)/,
];
const EXEMPT_METASTATEMENT_EN = [
  /\b(?:calibration|overconfidence|miscalibrat\w+|epistemic)\b/i,
  /\b(?:is|this is|an?) (?:example of a? )?(?:fallacy|bias|error|mistake)\b/i,
];

// 疑问形
const EXEMPT_QUESTION_ZH = [/[?？]\s*$/, /难道|凭什么|何尝|岂不是/];
const EXEMPT_QUESTION_EN = [/\?\s*$/, /\b(?:isn'?t it|doesn'?t that|how else|what else)\b/i];

// 引述转述：明确标注在引用/转述他人
const EXEMPT_QUOTED_ZH = [
  /(?:他|她|有人|某人|对方|报告|文章|广告|宣传)(?:说|认为|声称|宣称|写道|表示)/,
  /(?:广告|宣传语|口号|文案)(?:中|里)?(?:说|写道|宣称)/,
];
const EXEMPT_QUOTED_EN = [
  /\b(?:he|she|they|the ad|the report|the article)\s+(?:says?|said|claims?|claimed|writes?|argues?)\b/i,
];

// ─── 工具函数 ──────────────────────────────────────────────────────
function _anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function _earliestEither(zhList, enList, text) {
  let best = -1;
  for (const re of zhList) {
    const m = re.exec(text);
    if (m && (best < 0 || m.index < best)) best = m.index;
  }
  for (const re of enList) {
    const m = re.exec(text);
    if (m && (best < 0 || m.index < best)) best = m.index;
  }
  return best;
}

function _hasSourceOrData(text) {
  return SOURCE_MARKER_ZH.test(text) || DATA_MARKER_ZH.test(text)
      || SOURCE_MARKER_EN.test(text) || DATA_MARKER_EN.test(text);
}

/**
 * 主检测函数。
 * @param {string} text
 * @param {object} inject — 常量注入（测试用）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCalibrationMismatch(text, inject) {
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // ─── 豁免组 1：证据等级匹配（同句有来源/数据/检验词）→ 合法推断 ──
  if (_hasSourceOrData(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 豁免组 2-6 ───────────────────────────────────────────────
  const hedgeZ = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const hedgeE = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  if (_anyHit(hedgeZ, text) || _anyHit(hedgeE, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const metaZ = R.EXEMPT_METASTATEMENT_ZH || EXEMPT_METASTATEMENT_ZH;
  const metaE = R.EXEMPT_METASTATEMENT_EN || EXEMPT_METASTATEMENT_EN;
  if (_anyHit(metaZ, text) || _anyHit(metaE, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const qZ = R.EXEMPT_QUESTION_ZH || EXEMPT_QUESTION_ZH;
  const qE = R.EXEMPT_QUESTION_EN || EXEMPT_QUESTION_EN;
  if (_anyHit(qZ, text) || _anyHit(qE, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const quoZ = R.EXEMPT_QUOTED_ZH || EXEMPT_QUOTED_ZH;
  const quoE = R.EXEMPT_QUOTED_EN || EXEMPT_QUOTED_EN;
  if (_anyHit(quoZ, text) || _anyHit(quoE, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 腿① CERTAINTY 高强度确定性断言 ────────────────────────────
  const p1 = _earliestEither(
    R.CERTAINTY_ZH || CERTAINTY_ZH,
    R.CERTAINTY_EN || CERTAINTY_EN,
    text
  );
  if (p1 < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 腿② EVIDENCE_DEFICIT 证据缺陷 ─────────────────────────────
  const spinZ = R.EVIDENCE_SPIN_ZH || EVIDENCE_SPIN_ZH;
  const spinE = R.EVIDENCE_SPIN_EN || EVIDENCE_SPIN_EN;
  const spinHit = _anyHit(spinZ, text) || _anyHit(spinE, text);

  // c 形：腿①命中 + 无来源/数据 → 证据缺位（本族的核心承重路径）
  const noSource = !_hasSourceOrData(text);
  if (!spinHit && !noSource) return { hit: false, score: 0, detail: '', count: 0 };

  // ─── 邻近窗约束（同句或相邻分句）─────────────────────────────
  const isZh = /[\u4e00-\u9fff]/.test(text);
  const win = isZh ? (R.WIN_ZH ?? 60) : (R.WIN_EN ?? 200);
  if (spinHit) {
    const p2 = _earliestEither(spinZ, spinE, text);
    const span = Math.max(p1, p2) - Math.min(p1, p2);
    if (span > win) return { hit: false, score: 0, detail: '', count: 0 };
  }

  const detail = isZh
    ? `断言语气超出证据等级×确定性断言${spinHit ? '×证据空转' : '×无来源支撑'}(zh)`
    : `calibration-mismatch×certainty-claim${spinHit ? '×evidence-spin' : '×no-source'}(en)`;

  return { hit: true, score: 0.55, count: 1, detail };
}

module.exports = {
  checkCalibrationMismatch,
  CERTAINTY_ZH,
  CERTAINTY_EN,
  EVIDENCE_SPIN_ZH,
  EVIDENCE_SPIN_EN,
  EXEMPT_EVIDENCE_ZH,
  EXEMPT_EVIDENCE_EN,
  EXEMPT_HEDGE_ZH,
  EXEMPT_HEDGE_EN,
  EXEMPT_METASTATEMENT_ZH,
  EXEMPT_METASTATEMENT_EN,
  EXEMPT_QUESTION_ZH,
  EXEMPT_QUESTION_EN,
  EXEMPT_QUOTED_ZH,
  EXEMPT_QUOTED_EN,
  _hasSourceOrData,
};
