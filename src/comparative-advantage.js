/**
 * src/comparative-advantage.js — 「绝对优势≠比较优势」检测器
 * （r385 新建：econ_reasoning_gate 聚合族第 37 子族 / 插件层第 42 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r385 立项探针（scripts/round-385/probe-candidates.js，v6.8.192 pristine 基线
 *   HEAD 4884b66）：比较优势候选族攻击穿透 6/8 真零命中（存量维度对「一国/一方
 *   在所有商品/任务上都更有效率，因此贸易/分工无意义」的论证零覆盖），良性 4 条
 *   中 2 条非 pass 均系存量 stereotype/confidence 维度误伤、非本族增量（纠正形
 *   「按比较优势分工仍有获益」腿②缺失天然不判 + CONCEPT 豁免）；同池 moral_hazard
 *   穿透 1/5（已被 accident_fallacy/perfect_error 代拦且良性 3/4 脏，淘汰）、
 *   gresham/adverse_selection、lords_paradox 均穿透不足——本族定拨落地。
 *   海外扫描（hf4-scout.sh topic=statistical causal reasoning... / lead-time bias
 *   / regression to the mean）：arXiv 返回全为不相关物理论文（OR 匹配失效）、
 *   GitHub repos 0、S2 空——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自李嘉图比较优势原理（Ricardo's
 *   theory of comparative advantage）的标准经济学论述：贸易互利的前提是**比较
 *   优势**（机会成本意义上的相对效率），而非**绝对优势**（单位投入产出意义上的
 *   全面领先）。谬误在于：看到一方在所有商品/任务上的生产效率都更高，就断定
 *   贸易/分工对强势方「没必要/无意义/不划算/只会吃亏」——跳过「即便全面落后，
 *   弱势方在自身机会成本最低的环节仍有比较优势，双方按比较优势专业化仍能同时
 *   改善」的机制。这是经济学入门反复澄清的经典误读（绝对优势 vs 比较优势）。
 *
 * 辨别的族：绝对优势≠比较优势误读（absolute-vs-comparative advantage confusion /
 *   "A is better at everything, so trade is pointless"）——文本同时给出两个信号：
 *   腿① ADV 绝对优势前提在场——一方在所有商品/任务/方面/维度上都更高、更强、
 *        更快、更便宜、效率全面领先（produces both goods more efficiently / more
 *        efficient at everything / better at everything / absolute advantage in all）。
 *   腿② NOGAIN 无获益结论在场——据此推出贸易/分工/合作/外包/进口「没必要/毫无
 *        意义/不划算/浪费/只会吃亏/无法获益/对…没好处」（no way trade can benefit /
 *        gains nothing / only makes X worse off / pointless）。
 *   两腿近距共现（腿②为锚，腿①须落窗内：ZH 45 字 / EN 150 字符），缺一不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 纠正形（「即便有绝对优势，按比较优势分工仍有获益」/「取决于机会成本而非
 *     绝对优势」）腿②缺失 + CORRECT 豁免双保险，天然不判；
 *   · 概念讨论（比较优势/绝对优势/opportunity cost 机制本身 + 框架词共现）由
 *     CONCEPT 豁免（防「比较优势其实是错的」前缀绕过，r368/r379 同款教训）；
 *   · 单纯陈述「A 生产率高于 B」而无无获益结论的客观句——腿②缺失天然不判；
 *   · 与 mercantilism（贸易差额 × 财富单边归因，不要求绝对优势前提）、
 *     zero_sum_fallacy（泛化零和断言，无绝对优势前提）射程不重叠。
 *
 * 与既有维度的边界（r385 归因，探针 + 边界实测）：
 *   · mercantilism 管「出口才赚钱/进口=财富外流/顺差越大越富」的贸易差额误读，
 *     不要求「在所有商品上都更强」的绝对优势前提；本族管绝对优势前提 × 无贸易
 *     获益结论。探针实测「从越南进口只会让美国吃亏」类存量族攻击句本族零命中
 *     （因缺腿①）——两者可在极少数句共现但诊断更具体的是本族；
 *   · zero_sum_fallacy 管泛化零和断言（贸易/博弈你赢我输）——本族要求绝对优势
 *     前提在场，排除无该前提的零和句；
 *   · government_household_analogy 管预算约束平移——本族管贸易/分工效率比较。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿① ADV 绝对优势前提在场（ZH 五形 / EN 五形）；
 *   ② 腿② NOGAIN 无获益结论在场（ZH 四形 / EN 四形）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 45 字 / EN 150 字符），方向不限；
 *   ④ 豁免 A 概念讨论（比较优势/绝对优势/opportunity cost + 框架词共现）；
 *   ⑤ 豁免 B 纠正句（取决于机会成本/比较优势而非绝对优势/按比较优势分工）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一种流行观点（「有人觉得全面领先就
 * 不用贸易」——概念句由 CONCEPT 豁免），命中的是把绝对优势直接兑现为「贸易/分工
 * 无意义」的断言。verify 的语义是「这段文本把绝对优势讲成了贸易决策前提，先把
 * 机会成本与比较优势机制对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念讨论（比较优势/绝对优势/opportunity cost 机制本身）；
 *   · 纠正句与机制限定句（贸易获益取决于机会成本/按比较优势分工仍有获益）；
 *   · 单纯效率领先陈述无无获益结论（A 国生产率高于 B 国——无腿②）；
 *   · 泛化零和/贸易差额断言无绝对优势前提（归 zero_sum_fallacy / mercantilism）。
 */

'use strict';

// ─── 腿① ADV 绝对优势前提在场 ─────────────────────────────
// ADV1 全维度更高形：在所有/每一项/每样...商品/任务/方面/领域上 都(更)(高/强/快/便宜/优)
const ADV_ZH_F1 = /(?:所有|每一项|每样|各项|一切|哪个|任何|随便每一|无一)[^。！？，；]{0,12}(?:商品|产品|任务|方面|领域|环节|工序|零件|工作|指标|门类|品类|产线)[^。！？，；]{0,10}(?:都|全|均)[^。！？，；]{0,6}(?:更|较|更加|显著|明显)?[^。！？，；]{0,3}(?:高|强|快|好|优|便宜|低|领先|占优|有效率|厉害)/;
// ADV2 全面优于形：全面/完全/处处/各方面 + 高于/优于/领先/胜过/超过
const ADV_ZH_F2 = /(?:全面|完全|处处|各方面|无一不|清一色)[^。！？，；]{0,8}(?:高于|优于|领先|胜过|超过|强于|领先于|占优)/;
// ADV3 什么都更形：什么都比...更(高/强/快/便宜/好/厉害)
const ADV_ZH_F3 = /(?:什么|任何事|干啥|做啥|哪样|干啥活|凡事)[^。！？，；]{0,6}(?:都|全)?(?:比)?[^。！？，；]{0,10}(?:更|较为|更加)?[^。！？，；]{0,4}(?:高|强|快|好|优|便宜|厉害|省)|(?:什么|干啥|做啥|哪样)[^。！？，；]{0,4}(?:都|全)?(?:比)?[^。！？，；]{0,10}(?:造得|做得|卖得|生产得|干得|来得|产得)[^。！？，；]{0,3}(?:便宜|好|优|快|强)/;
// ADV4 每项都快形：每个/每 + 部门/项/道/件/方面 + (都)(比)(更)(快/好/强/效率高/便宜)
const ADV_ZH_F4 = /每[^。！？，；]{0,4}(?:一项|个|件|方面|道|步|部门|环节|批次|类)[^。！？，；]{0,8}(?:都)?[^。！？，；]{0,4}(?:比)?[^。！？，；]{0,4}(?:更)?[^。！？，；]{0,3}(?:快|好|强|高|省|效率高|便宜)/;
// ADV5 效率/生产率领先形：效率/生产率/产能/技术/工艺 + (都/全/远/显著/明显) + 高于/领先/更高/占优
const ADV_ZH_F5 = /(?:效率|生产率|产能|技术|工艺|水平|机械化)[^。！？，；]{0,6}(?:都|全|远|显著|明显|全面)?[^。！？，；]{0,4}(?:高于|优于|领先|更高|占优|更强|更先进)/;

// EN 腿①五形。
const ADV_EN_F1 = /\b(?:produces?|makes?|manufactures?|grows?|builds?)\s+(?:both|all|every)\b[^.]{0,60}\bmore\s+efficien\w+/i;
const ADV_EN_F2 = /\bmore\s+efficien\w+\s+(?:at|in)\s+(?:everything|all|both|every|anything)\b/i;
const ADV_EN_F3 = /\b(?:better|faster|cheaper|stronger|more\s+productive)\s+at\s+(?:everything|all|every|anything)\b/i;
const ADV_EN_F4 = /\babsolute\s+advantage\s+in\s+(?:all|both|every)\b|\b(?:outproduces?|outperforms?|beats?)\b[^.]{0,40}\bin\s+(?:every|all)\b/i;
const ADV_EN_F5 = /\bfaster\s+at\s+every\s+task\b|\b(?:every|each)\s+task\b[^.]{0,30}\b(?:faster|better|quicker)\s+than\b|\bno\s+(?:one|competitor|rival|country|firm|company|other\s+\w+)\s+can\s+(?:match|beat|outperform|rival)\s+(?:us|our\s+\w+)\s+in\s+(?:anything|everything)\b/i;

// ─── 腿② NOGAIN 无获益结论在场 ───────────────────────────
// NG1 没必要/无须/不必 + 贸易/交易/分工/合作/进口/外包/交换/专业化
const NOGAIN_ZH_F1 = /(?:根本|完全)?(?:没必要|无须|不必|不需要|用不着|犯不着)[^。！？，；]{0,10}(?:贸易|交易|分工|合作|进口|外包|往来|交换|专业化|买卖)/;
// NG2 毫无/没有 + 意义/价值/用处/益处/裨益；或 是(纯粹/单纯)浪费/白费/徒劳
const NOGAIN_ZH_F2 = /(?:毫无|没有|全无|半点|缺乏)[^。！？，；]{0,6}(?:意义|价值|用处|益处|裨益|收益)|(?:纯粹|单纯|完全|根本)?[^。！？，；]{0,4}(?:是)?[^。！？，；]{0,2}(?:浪费|白费|徒劳|无用功|多此一举)/;
// NG3 不划算/划不来；只会/注定/必然 + 吃亏/受损/更糟/不利；吃亏/无利可图/得不偿失
const NOGAIN_ZH_F3 = /(?:总是不|一点都不|根本不|并不|压根不|未必)?划算|划不来|(?:只会|注定|必然|到头来)[^。！？，；]{0,8}(?:吃亏|受损|更糟|更差|不利|被拖累)|吃亏|无利可图|得不偿失|赔本赚吆喝/;
// NG4 对...没好处/无益/不利；没/毫无 + 好处/益处；无法/不能 + 获益/受益/得益
const NOGAIN_ZH_F4 = /(?:没|毫无|不曾|并无)[^。！？，；]{0,4}(?:好处|益处|裨益|收益)|(?:无法|不能|难以|无从)[^。！？，；]{0,6}(?:获益|受益|得益|得到好处)|对[^。！？，；]{0,10}(?:无益|不利|有害|是负担)/;

// EN 腿②四形。
const NOGAIN_EN_F1 = /\bno\s+(?:way|reason|point|benefit|gain)\b[^.]{0,40}\b(?:trad\w+|specializ\w+|specialis\w+|exchang\w+|cooperat\w+|outsourc\w+|import\w*)\b/i;
const NOGAIN_EN_F2 = /\b(?:trade|trading|specialization|specialisation|division\s+of\s+labor|division\s+of\s+labour|outsourcing|exchang\w+|cooperat\w+|import\w*|merger|integration)\b[^.]{0,50}\b(?:pointless|useless|a\s+waste|no\s+benefit|no\s+gain|cannot\s+benefit|can'?t\s+benefit|meaningless)\b/i;
const NOGAIN_EN_F3 = /\b(?:only|just)\s+(?:makes?|leaves?|puts?)\b[^.]{0,30}\b(?:worse\s+off|lose|loser|harmed|hurt|at\s+a\s+disadvantage)\b|\bmakes?\s+\w+\s+worse\s+off\b|\bgains?\s+nothing\b|\bno\s+gain\s+from\b/i;
const NOGAIN_EN_F4 = /\b(?:cannot|can'?t|unable\s+to|no\s+way\s+to)\s+(?:benefit|gain|profit)\b[^.]{0,30}\b(?:from|by)\b[^.]{0,20}\b(?:trad\w+|specializ\w+|exchang\w+|cooperat\w+)\b|\bpointless\s+to\s+(?:trade|specialize|specialise)\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 45;
const WINDOW_EN = 150;

// ─── 豁免 A：概念讨论（比较优势/绝对优势/opportunity cost + 框架词共现，防前缀绕过）──
const CONCEPT_ZH = /(?:比较优势|相对优势|绝对优势|机会成本|相对效率|comparative\s+advantage|absolute\s+advantage|opportunity\s+cost)[^。！？\n]{0,24}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明|描述|解释|假设|前提|核心|定义|是指|原理|现象|而非|而不是|不等于|才是|区分|辨析)/;
const CONCEPT_EN = /\bcomparative\s+advantage\b[^.]{0,70}\b(?:theory|principle|concept|framework|model|rather\s+than|instead\s+of|not\s+the\s+same|distinct\s+from)\b|\babsolute\s+(?:vs\.?|versus|and)\s+comparative\b|\bopportunity\s+cost\b[^.]{0,50}\b(?:principle|basis|foundation|not\s+absolute)\b/i;

// ─── 豁免 B：纠正句（取决于机会成本/比较优势而非绝对优势/按比较优势分工仍有获益）──
const CORRECT_ZH = /(?:取决于|依赖于|受制于|要看|由)[^。！？]{0,12}(?:机会成本|相对效率|比较优势|相对优势)|(?:比较优势|相对优势|相对效率)[^。！？]{0,8}(?:而非|而不是|不等于|才是|决定)[^。！？]{0,10}(?:绝对优势|绝对效率)?|按?比较优势[^。！？]{0,8}(?:分工|专业化|贸易)[^。！？]{0,6}(?:仍|依然|照样)?[^。！？]{0,4}(?:获益|受益|得益|提升|改善)|即便[^。！？]{0,10}(?:绝对优势|全面领先)[^。！？]{0,10}(?:仍|依然)[^。！？]{0,4}(?:获益|受益|得益)/;
const CORRECT_EN = /\b(?:depends?|hinges?|turns?\s+on)\s+on\b[^.]{0,40}\b(?:opportunity\s+cost|comparative\s+advantage|relative\s+efficiency)\b|\bcomparative\b[^.]{0,24}\b(?:rather\s+than|not)\b[^.]{0,24}\babsolute\b|\bcomparative\s+advantage\b[^.]{0,40}\b(?:still|nonetheless|even\s+so)\b[^.]{0,20}\b(?:gain|benefit)\b/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 腿②守卫（r375/r377/r378/r379/r381 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，
//   含否定即「并非无意义/不是不划算」纠正形）+ 对冲短语（腿②前后出现「不意味着/
//   谬误/误解」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same)/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
    const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 20), x.idx);
    const afterZh = text.slice(x.end, x.end + 20);
    const afterEn = text.slice(x.end, x.end + 40);
    for (const re of negZhList) { if (re && re.test && (re.test(beforeZh))) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
    for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
    for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
  }
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    let regs;
    if (Object.prototype.hasOwnProperty.call(R, name)) {
      const v = R[name];
      // 负例注入双契约：空数组 = 删条（整组消失）；永假正则 = 替换（该组退化
      // 为永不匹配）。两者都不得 crash——RegExp 不可 spread（r369 教训）。
      regs = Array.isArray(v) ? v : (v instanceof RegExp ? [v] : []);
    } else {
      regs = defs;
    }
    out.push(...regs);
  }
  return out;
}

// 签名收集：腿②无获益结论为锚（窗内），腿①绝对优势前提在场。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      adv: resolveGroups(R, [
        ['ADV_ZH_F1', [ADV_ZH_F1]],
        ['ADV_ZH_F2', [ADV_ZH_F2]],
        ['ADV_ZH_F3', [ADV_ZH_F3]],
        ['ADV_ZH_F4', [ADV_ZH_F4]],
        ['ADV_ZH_F5', [ADV_ZH_F5]],
      ]),
      nogain: resolveGroups(R, [
        ['NOGAIN_ZH_F1', [NOGAIN_ZH_F1]],
        ['NOGAIN_ZH_F2', [NOGAIN_ZH_F2]],
        ['NOGAIN_ZH_F3', [NOGAIN_ZH_F3]],
        ['NOGAIN_ZH_F4', [NOGAIN_ZH_F4]],
      ]),
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      adv: resolveGroups(R, [
        ['ADV_EN_F1', [ADV_EN_F1]],
        ['ADV_EN_F2', [ADV_EN_F2]],
        ['ADV_EN_F3', [ADV_EN_F3]],
        ['ADV_EN_F4', [ADV_EN_F4]],
        ['ADV_EN_F5', [ADV_EN_F5]],
      ]),
      nogain: resolveGroups(R, [
        ['NOGAIN_EN_F1', [NOGAIN_EN_F1]],
        ['NOGAIN_EN_F2', [NOGAIN_EN_F2]],
        ['NOGAIN_EN_F3', [NOGAIN_EN_F3]],
        ['NOGAIN_EN_F4', [NOGAIN_EN_F4]],
      ]),
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const advM = collect(text, L.adv);
    if (advM.length === 0) continue;
    const nogainM = collect(text, L.nogain, { neg: true }, R);
    if (nogainM.length === 0) continue;
    for (const n of nogainM) {
      const a = advM.find(x => dist(x, n) <= L.win);
      if (!a) continue;
      sigs.push({ lang: L.lang, adv: a.raw, nogain: n.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.adv + '|' + s.nogain;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp。统一成数组供 exempt() 消费。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

/**
 * 绝对优势≠比较优势签名：绝对优势前提 × 无贸易获益结论 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectComparativeAdvantage(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（比较优势/绝对优势/opportunity cost 本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（贸易获益取决于机会成本 / 按比较优势分工仍有获益 / 比较优势而非绝对优势）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'comparative_advantage',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '绝对优势前提「' + x.adv + '」× 无贸易获益结论「' + x.nogain + '」'
      : 'absolute-advantage premise "' + x.adv + '" × no-gain-from-trade conclusion "' + x.nogain + '"')),
    details: s.lang === 'zh'
      ? '绝对优势≠比较优势误读(' + sigs.length + '处: 「' + s.adv + '」被当作贸易/分工无意义的理由，跳过机会成本与比较优势机制)(zh)'
      : 'absolute-vs-comparative advantage confusion(' + sigs.length + 'x: "' + s.adv + '" treated as a reason trade is pointless, ignoring opportunity cost)(en)',
    guidance: '绝对优势≠比较优势误读（absolute-vs-comparative advantage confusion / "A is better at everywhere, so trade is pointless"）：贸易互利的前提是比较优势（机会成本意义上的相对效率），不是绝对优势（单位投入产出的全面领先）。谬误在于：看到一方在所有商品/任务上的生产效率都更高，就断定贸易/分工对强势方「没必要/无意义/不划算/只会吃亏」——跳过「即便全面落后，弱势方在自身机会成本最低的环节仍有比较优势，双方按比较优势专业化仍能同时改善」的机制。分工与贸易的收益来自相对效率差异（谁的机会成本更低），而非绝对效率高低：「A国在粮食和工业品上的生产效率都全面高于B国，所以A国没必要和B国贸易」「发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义」「大厨做每道菜都比学徒快，所以后厨分工对他没有意义」「我们每个部门都比外包公司效率高，外包就总是不划算」「Country A produces both wheat and steel more efficiently than Country B, so trade cannot benefit A」。正当做法是先把机制对齐：区分绝对优势与比较优势（比较优势由机会成本决定，一方全面领先时另一方仍在自身相对最优环节有比较优势）、说明专业化收益来源（按机会成本分工扩大双方可消费集合）、给出绝对优势前提的定性（把绝对优势直接兑现为无贸易获益，忽略了相对效率差异才是贸易基础）；泛化零和断言无绝对优势前提（贸易零和/谈判零和）归 zero_sum_fallacy，贸易差额财富误读（出口才赚钱/进口=财富外流）归 mercantilism，单纯效率领先陈述无无获益结论（A国生产率高于B国）天然不判。',
    tags: ['economics', 'trade', 'comparative-advantage', 'absolute-advantage', 'opportunity-cost', 'specialization'],
  };
}

module.exports = {
  detectComparativeAdvantage,
  __internals: () => ({
    ADV_ZH_F1, ADV_ZH_F2, ADV_ZH_F3, ADV_ZH_F4, ADV_ZH_F5,
    ADV_EN_F1, ADV_EN_F2, ADV_EN_F3, ADV_EN_F4, ADV_EN_F5,
    NOGAIN_ZH_F1, NOGAIN_ZH_F2, NOGAIN_ZH_F3, NOGAIN_ZH_F4,
    NOGAIN_EN_F1, NOGAIN_EN_F2, NOGAIN_EN_F3, NOGAIN_EN_F4,
    WINDOW_ZH, WINDOW_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
