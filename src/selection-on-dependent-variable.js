/**
 * src/selection-on-dependent-variable.js — 「选择依赖变量 / 按结果归因」检测器
 * （provisional 第 240 个判别维度，r252 起草；src/index.js 接线由 1 号主力
 * 补全，接线规格见 coordination/reports/r252-dimension-agent4.md。编号
 * provisional 的原因同 r218-r251：远端 v6.8.145 已接线 214 维，另有
 * zero_sum_fallacy/.../loss_aversion 等二十六个已起草未接线维度占号，
 * 最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排。）
 *
 * [r252 立项] 零命中探针 coordination/agent4/probes/r252-probe-round1.js
 * ~round2.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。七候选两轮定夺：
 *   · A 过度控制偏差：**立项即剔除**——mediator_confusion（第 210 维）
 *     已完整覆盖「控制中介后效应消失→无影响」，连例句「一旦控制了收入，
 *     教育对健康就没有影响了」都在其文档内，同族非零命中；
 *   · C 中项不周延：攻击穿透仅 2/5，多被 affirming_the_consequent /
 *     false_equivalence 代拦（印证 r168「中项不周延族仅 2/8 零命中」旧结论）；
 *   · D 诉诸定义：疑难良性维度级误伤 3/5（「字典上成功确实常解释为发财，
 *     但那只是其中一种释义」被 monocausal_attribution 误拦），攻击与良性
 *     同形度高，纯规则无法稳定区分「以定义为论据」与「列举词义之一」；
 *   · E 量词辖域倒置：良性「每个人都喜欢某个人，但这不意味着…」与攻击
 *     「每个人都喜欢某个人，所以…」被 hasty_generalization 同源误伤，
 *     区分特征（不意味着）恰是被拦点；
 *   · **B 选择依赖变量：round1 攻击穿透 7/7 全零命中 + 疑难良性 5/5 零误伤；
 *     round2 攻击穿透 13/19（6 条被 illicit_conversion「X是关键/正是原因」/
 *     hasty_generalization「无一例外」/medical_coercion「偏方治病」/fallacies
 *     代拦——非漏判，是既有维度已覆盖的子形态），survivorship 正族 3/3 被
 *     survivorship_bias(132) 正确代拦、RCT 报告 3/3 被 collider_bias 代拦，
 *     边界干净**；
 *   · G 麦克纳马拉（5/6 + 4/5）、H 范围限制（4/6 + 5/5）、F 领先时间
 *     （4/6 + 3/5）均劣于 B。
 * B 以「round1 满分零命中 + round2 最高穿透 + 邻接领地零重叠 + 对共享误拦
 * 基线冲击最小」胜出。
 *
 * 外部来源：arXiv 三次查询全部「Rate exceeded」/多词 OR 噪声，Semantic
 * Scholar 连续 429，GitHub 多词查询 total_count=0——海外 API 本轮持续限流
 * （与 r246/r251 同症）。**按既有形态自建**，不编造命中。家族定义取自因果
 * 推断 / 研究方法通识中的「selection on the dependent variable / conditioning
 * on the outcome（按结果选择样本再归因）」：只看达成结果的个案、归纳其共性，
 * 就断定该共性导致了结果，缺反事实对照。
 *
 * 辨别的族：选择依赖变量（selection on the dependent variable）——文本先
 * 圈定一个**由「达成某结果」定义的群体**，指出他们**都有某个特征 X**，
 * 再据此**推断 X 导致了该结果**：
 *   能活下来的公司都融过资，所以融资能救命。
 *   活到九十岁的老人都坚持早起，所以早起能让人长寿。
 *   上岸的考生都报过这个班，所以报这个班就能考上。
 *   战胜癌症的人都心态乐观，所以乐观就能战胜癌症。
 *   Among the companies that survived, all had raised funding, so
 *   raising funding is what saves companies.
 *   Everyone who beat the illness had tried this treatment, so the
 *   treatment is the cure.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：因果识别要靠
 * **反事实对照**——同样没融过资的公司命运如何？只看「活下来的都融过资」，
 * 等于把结果本身当成筛选条件：融过资但死了的公司被系统性看不见，没融过资
 * 却活下来的公司也不在样本里。更常见的是因果被**倒置**——是活下来才融到资、
 * 成绩好才请得起心理教练、康复了才回忆起身心状态。它比虚报数字更隐蔽：
 * 「幸存者都有 X」这个观察可以完全真实，据此推出「X 导致幸存」的结论可以
 * 完全错误。与正当推理的界线很清楚：一旦要求对照组/反事实、指出相关不等于
 * 因果、点明可能是结果而非原因、或明确说这是选择偏差在起作用，就是正当
 * 做法，一律豁免。
 *
 * 与既有维度的边界（r252 归因，探针邻接领地实测）：
 *   · survivorship_bias（第 132 维）管**只看活下来的成功个案 → 推及行动
 *     或领域评价**（「你也该退学」「读书没用」「做主播真轻松」）；本族落点是
 *     **因果归因**（X 导致/拯救了结果），不涉行动建议。实测 survivorship
 *     正族 3/3 被 132 正确代拦，本族零重叠（邻接句见 test）。
 *   · reverse_causation（第 172 维）管**因果方向整体倒置**；本族不判定方向
 *     对错，判的是**以结果为筛选条件**这一取样动作。
 *   · illicit_conversion（第 167 维）管**主谓对调**（所有 A 是 B ∴ 所有 B
 *     是 A）；本族明确**不收「X 是…的关键/正是原因」主谓同位形式**（该形态
 *     归 167），只收「所以 X 能/让/导致 [结果]」的因果动词形式，避开 167 领地。
 *   · collider_bias（第 209 维）管**条件筛选后子样本相关**；本族不依赖
 *     「治疗组/用药组…更高」式条件对比（RCT 报告 3/3 被 209 正确代拦，
 *     本族腿①要求「结果达成群体 + 全称」，治疗组不满足）。
 *   · hasty_generalization 管**无依据概推**；本族腿①要求**以结果定义群体
 *     且全称**在场，不是泛化。
 *
 * 判据（双腿链 + 邻近窗 + 两组豁免，缺一不判）：
 *   ① 腿① SELECT 结果选择标记——圈定「达成某结果的群体 + 全称」：
 *     ZH [结果动词]的[名词](都|全|个个|无一例外|普遍)；EN (who|that)+
 *     [结果动词] 或 (all|every)+…(survivors|winners|champions)；
 *   ② 腿② CAUSE 因果归因结论——推断标记 + 因果动词 + 结果名词：
 *     ZH (所以|因此|可见|证明|说明)[特征](能|让|使|导致|拯救|治好)[结果]；
 *     EN (so|therefore|which proves|shows|this is why)[特征](causes|
 *     saves|cures|is what|is why|is the cure)；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 140 字符），**方向不限**——
 *     「活下来的都融过资，所以融资救命」与「所以融资救命——活下来的都融过资」
 *     都收；推断标记落在两腿之间则加权而非必要；
 *   ④ 两腿均查否定前缀（「不能只看活下来的」「并非因为…所以」→ 失配）；
 *   ⑤ 防自证：腿②须在腿①之外带来新内容（左伸或右伸 ≥2 字）；
 *   ⑥ 豁免 A 概念教学（选择依赖变量/按结果选择/样本选择/幸存者偏差/因果
 *     推断/内生性/selection bias/conditioning on the outcome/collider）；
 *   ⑦ 豁免 B 正确因果与对冲（不能就此断定/推不出/相关不等于因果/需要对照/
 *     需要控制/可能只是/更可能是结果/谁是因谁是果/说明不了；EN cannot
 *     conclude/does not mean/not necessarily/need a controlled/
 *     confounded/could reflect/necessary, not sufficient）。
 *
 * 为什么取 VERIFY 级：单句也可能是在客观转述一个已发表的相关性发现、
 * 课堂案例、或引用他人的谬误示例。verify 的语义是「这段话从按结果圈定的
 * 群体里归纳共性，再推出因果，先补上反事实对照组再采信它的结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（选择偏差的典型表现/what is selection on the dependent
 *     variable）；
 *   · 正确因果与对冲（活下来的公司都融过资，但这值得研究，不能就此断定
 *     融资是原因 / Among the survivors all wore seatbelts, but we still
 *     need a controlled comparison）；
 *   · survivorship_bias 领地（比尔·盖茨辍学成了首富，所以你也该退学——
 *     落点是行动建议，归 132）；
 *   · illicit_conversion 领地（心理教练是夺冠的关键——主谓同位形式，归 167）；
 *   · collider_bias / RCT 领地（用药组存活率显著更高——条件对比，归 209）；
 *   · 单腿句（只有「活下来的都融过资」无因果断语、只有「所以融资能救命」
 *     无结果选择群体）。
 * 已知缺口（有意不收）：把「幸存者都有 X」说成事实并给出正确动作的句子
 * （「活下来的都融过资，所以我们要设对照组」——是正当做法）；以及特征 X
 * 与结果在两句里主语错位但仍在窗内的罕见句式——纯规则无法在不误伤的前提
 * 下收窄，宁缺勿滥。
 */
'use strict';

// ─── 腿① SELECT 结果选择标记（圈定「达成某结果的群体 + 全称」）──────────
// ZH：[结果动词](可带少量修饰)的[名词](都|全|个个|无一例外|普遍|清一色)
const SELECT_ZH = [
  /(?:活下来|活了过来|活过来了|活过|活过来|幸存下来|幸存|存活|上岸|闯出来|闯出|走出来|挺过来|挺过|熬过|熬过来|战胜|夺冠|康复|痊愈|突围|胜出|登顶|治好|治愈|中了|中签|逃过|度过|脱颖而出|逆袭|翻盘|活到[0-9一二三四五六七八九十百两]+岁)[^。，！？；\n]{0,6}的[^。，！？；\n]{0,10}(?:都|全|个个|人人|无一例外|普遍|清一色|全都|尽数|皆)/,
  // 反向语序也收：全称在前（都/凡是 + 成功活过…的）
  /(?:凡是|但凡|所有|全部)[^。，！？；\n]{0,14}(?:活了下来|活过来了|活过|活下来|幸存|存活|上岸|闯出来|挺过来|熬过|战胜|夺冠|康复|痊愈|治好|治愈|登顶|胜出|突围|逆袭|翻盘)[^。，！？；\n]{0,6}的/,
];
// EN：who/that + 结果动词；或 (all|every)+…(survivors|winners|champions)
const SELECT_EN = [
  /\b(?:who|that)\s+(?:survived|beat|passed|reached|won|made\s+it|recovered|summited|escaped|overcame|succeeded|pulled\s+through|outlasted|endured|triumphed|prevailed)\b/i,
  /\b(?:all|every|each|the)\s+(?:[\w]{0,12}\s){0,2}(?:survivors?|winners?|champions?|victors?)\b/i,
];

// ─── 腿② CAUSE 因果归因结论（推断标记 + 因果动词 + 结果名词）────────────
// ZH：推断标记 + [特征] + 因果动词 + [结果名词]（明确不收「X 是…关键/正是
// 原因」主谓同位形式——该形态归 illicit_conversion 第 167 维）
const CAUSE_ZH = [
  /(?:所以|因此|据此|可见|足见|这说明|这证明|足以证明|正说明|充分说明|这意味着|足以表明|表明|说明)[^。！？\n]{0,8}(?:能|让|使|就能|方能|才会|导致|致使|造就|决定|拯救|救了|治好|治愈|带活|成就|换来)[^。！？\n]{0,6}(?:救命|长寿|考上|战胜|康复|痊愈|活[了过]?下[来]?|活命|活过来|活过来了|成功|中签|中奖|登顶|夺冠|幸存|过关|胜出|上岸|逆袭|翻盘|入围|入选|出头)/,
  // 反向语序：结果名词 + 靠的/关键在于 + 特征（罕见，补一刀）
  /(?:活[了过]?下[来]?|活过来|活过来了|幸存|上岸|闯出来|挺过来|熬过|战胜|夺冠|康复|痊愈|登顶|胜出|成功)[^。！？\n]{0,8}(?:靠的?就是|全凭|关键在于|取决于|源自于|来自于)[^。！？\n]{0,16}/,
];
// EN：推断标记 + [特征] + (causes|saves|cures|is what|is why|is the cure)
const CAUSE_EN = [
  /\b(?:so|therefore|thus|hence|which\s+proves|which\s+shows|this\s+proves|this\s+shows|this\s+is\s+why|it\s+proves|it\s+shows|that\s+proves|that\s+shows|proves|shows|meaning|which\s+means)\b[^.]{0,40}?\b(?:causes?|caused|saves?|saved|cures?|cured|leads?\s+to|led\s+to|is\s+what|is\s+why|are\s+what|was\s+what|makes?|made|drives?|drove|enables?|enabled|delivered|is\s+the\s+(?:cure|answer|key|reason|secret|driver|factor|difference))\b/i,
  /\b(?:is|are|was|were)\s+what\s+(?:saves?|saved|cures?|cured|causes?|caused|makes?|made|gets?|got|drives?|drove|enables?|enabled)\b/i,
];

// ─── 豁免 A：概念教学（点名选择依赖变量 / 选择偏差这个概念本身）─────────
const CONCEPT_ZH = /(?:选择依赖变量|按结果选择|以结果选择|结果选择|样本选择|选择偏差|选择性偏误|选择效应|幸存者偏差|生存者偏差|因果推断|因果识别|内生性|选择性样本|对撞|辛普森|研究方法|研究设计|统计学|统计|教材|课堂|课本|教学|论文|这篇研究|这项研究|样本筛选|条件筛选)/;
const CONCEPT_EN = /\b(?:selection\s+(?:bias|on\s+the\s+(?:dependent|outcome)|effect)|conditioning\s+on\s+the\s+outcome|survivorship|survivor\s+bias|collider|endogeneity|selection\s+effect|selected\s+on\s+the\s+outcome|causal\s+inference|causal\s+identification|research\s+method|methodology|textbook|lecture|study\s+found|paper)\b/i;

// ─── 豁免 B：正确因果与对冲（要求反事实对照 / 指出相关不等于因果 / 点明
// 可能是结果而非原因 / 说这是选择偏差在起作用——都是正当判别动作）────────
const CORRECTIVE_ZH = /(?:不能就此断定|不能据此|不能推出|推不出|不足以|说明不了|证明不了|未必|不一定|不代表|不意味着|并不意味|相关不等于因果|相关不意味|需要对照|需要控制|需要随机|需要对比|要有对照|要有控制|对照组|控制组|反事实|可能只是|更可能是结果|也可能是结果|只是必要条件|充分条件|谁是因谁是果|因因果果|倒因为果|倒果为因|混淆了|值得研究|有待|还得看|得看|在控制|在随机|在对照|或是因为|也许源于|可能反映|取样|样本量|或为果|互为因果|需要更多|排除混淆|剔除混淆)/;
const CORRECTIVE_EN = /\b(?:cannot\s+conclude|can'?t\s+conclude|does\s+not\s+mean|doesn'?t\s+mean|not\s+necessarily|we\s+need\s+a\s+controlled|need\s+a\s+controlled|need\s+a\s+comparison|confounded|confounding|may\s+just|might\s+just|could\s+reflect|warrants?\s+(?:study|further|a\s+look)|correlation\s+is\s+not|correlation\s+isn'?t|necessary,?\s+not\s+sufficient|required\s+but\s+not\s+sufficient|reverse\s+causal|reversed|third\s+factor|lurking\s+variable|counterfactual|control\s+group|randomi[sz]ed)\b/i;

// ─── 否定前缀守卫（两腿各自查匹配点之前的否定标记）────────────────────
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|并不会|不属于|不谈|不再|别|并不|并没|从未|绝非|很难|不要|不足以|单靠|仅凭|光靠)[^。，！？；\n]{0,6}$/;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|hardly|barely|far\s+from|nowhere\s+near|without)\s+(?:\w+\s){0,4}$/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 140;

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

function negatedBefore(text, x, isZh) {
  if (x.idx < 0) return false;
  const pre = isZh ? text.slice(Math.max(0, x.idx - 8), x.idx) : text.slice(Math.max(0, x.idx - 50), x.idx);
  return isZh ? NEG_BEFORE_ZH.test(pre) : NEG_BEFORE_EN.test(pre);
}

function collect(text, list, isZh) {
  const m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (negatedBefore(text, x, isZh)) continue;
    m.push(x);
  }
  // 同跨度去重（跨族重叠留给配对循环的防自证判据处理）
  const seen = new Set();
  return m.filter(x => {
    const k = x.idx + ':' + x.end;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.idx - b.idx);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①结果选择群体 × 腿②因果归因，两腿邻近共现（方向不限）
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    { sel: R.SELECT_ZH || SELECT_ZH, cau: R.CAUSE_ZH || CAUSE_ZH, w: R.W_ZH != null ? R.W_ZH : W_ZH, lang: 'zh', isZh: true },
    { sel: R.SELECT_EN || SELECT_EN, cau: R.CAUSE_EN || CAUSE_EN, w: R.W_EN != null ? R.W_EN : W_EN, lang: 'en', isZh: false },
  ];
  for (const L of langs) {
    const selM = collect(text, L.sel, L.isZh);
    if (selM.length === 0) continue;
    const cauM = collect(text, L.cau, L.isZh);
    if (cauM.length === 0) continue;
    for (const s of selM) {
      for (const c of cauM) {
        if (dist(s, c) > L.w) continue;
        // 防自证：腿②须在腿①之外带来新内容（左伸或右伸 ≥2 字）——同一段
        // 话不能既当「结果选择群体」又当「因果归因结论」
        const newRight = c.end > s.end ? c.end - Math.max(c.idx, s.end) : 0;
        const newLeft = c.idx < s.idx ? Math.min(c.end, s.idx) - c.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        sigs.push({ lang: L.lang, sel: s.raw, cau: c.raw });
      }
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.sel + '|' + s.cau;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 选择依赖变量签名：结果选择群体 × 因果归因结论 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSelectionOnDependentVariable(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确因果与对冲
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'selection_on_dependent_variable',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '结果选择群体「' + x.sel + '」→ 因果归因「' + x.cau + '」'
      : 'outcome-selected group "' + x.sel + '" -> causal attribution "' + x.cau + '"')),
    details: s.lang === 'zh'
      ? '选择依赖变量(' + sigs.length + '处: 从按结果圈定的「' + s.sel + '」群体归纳共性，推出「' + s.cau + '」的因果结论，缺反事实对照)(zh)'
      : 'selection-on-dependent-variable(' + sigs.length + 'x: from outcome-selected "' + s.sel + '" to causal claim "' + s.cau + '", no counterfactual comparison)(en)',
    guidance: '选择依赖变量指只挑「达成结果的个案」、归纳他们的共性，就断定该共性导致了结果。问题在于样本是按结果筛出来的：融过资却失败的公司、没融过资却活下来的公司都不在视野里，因果可能被倒置（是活下来才融到资、成绩好才请得起教练、康复了才回忆起身心状态）。要下因果结论，请补上反事实对照：给出未达成结果但特征相同的对照组、说明如何排除混淆变量、或引用随机试验/自然实验中识别出的效应。若只是陈述一个观察（幸存者普遍有某个特征），请把结论限定在相关性，不要外推成「X 导致结果」。要求对照组、指出相关不等于因果、点明可能是结果而非原因、或说明这是选择偏差/幸存者偏差，都是正当做法；若这段话只是在引用他人的谬误示例或课堂案例，核实其主张再决定是否采信。',
    tags: ['causal-inference', 'selection-on-the-dependent-variable', 'conditioning-on-the-outcome', 'research-methods', 'sampling-fallacy'],
  };
}

module.exports = {
  detectSelectionOnDependentVariable,
  __internals: () => ({
    SELECT_ZH, SELECT_EN,
    CAUSE_ZH, CAUSE_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECTIVE_ZH, CORRECTIVE_EN,
    NEG_BEFORE_ZH, NEG_BEFORE_EN, W_ZH, W_EN,
    collect, findSignatures,
  }),
};
