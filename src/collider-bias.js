/**
 * src/collider-bias.js — 「对撞偏差 / 内生选择偏差」检测器
 * （第 209 个判别维度，r212）
 *
 * [r212 立项] philosophy_decision 在当前引擎（v6.8.140，208 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r212 族探针在当前引擎复测——对撞偏差族攻击样本 7 条中 5 条
 * gate.action=pass（真零命中，含中英双语、裸名词「只看/入选/活过」、
 * 带修饰「在通过初筛的候选人中」、长句变体；其余 2 条被
 * proxy_metric_goal + perfect_error 代拦），良性样本 4/4 pass（零误
 * 伤）。覆盖度检查：collider / endogenous 在 src/ 下 0 文件命中，
 * reverse_causation / common_cause / post_hoc / selection_bias /
 * base_rate_neglect / simpsons_paradox 均未覆盖本族（它们判方向倒
 * 置、共同原因、时间先后、取样范围、基础概率、聚合层逆转，没有一
 * 个判「条件筛选后样本内观察相关 → 当作总体因果结论」）。
 *
 * 外部来源：arXiv 2406.12158（EMNLP 2024，*LLMs Are Prone to
 * Fallacies in Causal Inference*；代码与数据仓库
 * github.com/joshinh/causal-fallacies）——该文系统给出 LLM 在因果
 * 推断上违反的四条规则，其中「从相关/共变跳到因果」与「在条件筛选
 * 后的子集上作因果断言」正是本族；另有 HN 因果推理条目与
 * github.com/causalNLP/logical-fallacy（arXiv 2202.13758, Findings
 * of EMNLP 2022）作旁证。按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：对撞偏差（collider bias / endogenous selection bias）
 * ——把**经条件筛选后的子样本内观察到的相关/共变**，直接当作
 * **总体层面的因果结论**使用：
 *   在留下来的员工里，加班少的反而绩效更高，所以加班会拖累绩效。
 *   只看活过三年的创业公司，创始人的行业经验越少公司估值越高，
 *   可见经验会拖累公司。
 *   在这家医院住院的病人中，接受强化治疗的人死亡率更低，说明
 *   强化治疗很有效。
 *   在入选决赛的选手里，训练时间短的排名反而更高，因此训练时间
 *   越短成绩越好。
 *   Among the admitted students, those with higher test scores tend
 *   to have lower grades, so test scores hurt academic performance.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：当 A、B 都
 * 影响第三个变量 C（对撞因子），而观察范围被限制在 C 的某个取值
 * 上（入院 / 入选 / 存活 / 留下 / 通过筛选）时，A 与 B 在这个子样
 * 本里会呈现出相关——**即使 A、B 在总体中毫无因果关系**。筛选动作
 * 本身制造了关联，再拿这份关联去断言因果，等于把「观察条件的副产
 * 物」当成「世界的因果结构」。这是条件化（conditioning）的结构性
 * 后果，不是数据噪声；它使「越…越…」的相关在子样本里必然出现而
 * 在总体中消失，是最容易被叙述成铁证的一类假因果。
 *
 * 与既有维度的边界（r212 归因）：
 *   · selection_bias（第 168 维度）管取样受限导致推广失效；本族
 *     的取样受限标记只是腿①，承重的是腿②③——**在受限样本内观察
 *     到相关并据此下总体因果结论**。selection_bias 不要求相关观
 *     察，也不要求因果结论。
 *   · survivorship_bias（第 132 维度）管只看幸存者而忽略未幸存
 *     样本；本族同样不要求「忽略未幸存样本」，只要求「在条件筛选
 *     样本内观察相关 → 因果结论」。
 *   · simpsons_paradox（第 206 维度）管聚合层与子群层**方向相
 *     反**；本族只有一个层级（被条件筛选的那一层），问题是这个层
 *     次的相关是否由筛选制造。
 *   · common_cause / reverse_causation（第 174 / 172 维度）管混
 *     杂因素与因果倒置，都假定观察到的共变是真实的；本族的共变
 *     本身就是筛选的产物。
 *   · cum_hoc / post_hoc 管显式相关标记与时间先后；本族不要求
 *     显式「相关」字样（「越少…越高」即可），也不依赖时间先后。
 *
 * 判据（主判据三腿共现 + 邻近窗，缺一不判）：
 *   · 腿① COND 条件筛选标记：介词限定形（「在…里/之中/中间」）+
 *     动作限定形（只看/仅看/局限于/筛选后，**r161 教训：收裸动词
 *     形态**——只看/入选/活过/活下来/留任 去前后缀仍命中）+
 *     筛选结果名词（筛选/初筛/入选/入围/存活/幸存/活过/留下来/
 *     留任/现存/未被淘汰/淘汰后……；EN among the admitted / only
 *     those who / conditioned on / restricted to / survivors /
 *     survived / made it through）。
 *   · 腿② ASSOC 样本内观察到的相关/共变：负相关/正相关/相关性/
 *     成反比/共变（EN negatively correlated / correlated with /
 *     inversely related / associated with）+ 比较级反向共变（越少…
 *     越高 / 反而 / 更低 / 更高 / more…less / the less…the
 *     more）。**不要求显式「相关」字样**——「越少…越高」即足够。
 *   · 腿③ CONCL 总体因果结论（两形任一）：
 *     C-a 推断+因果形：推断词（所以/因此/因而/可见/说明/意味着/
 *       证明/显然/据此；EN so/therethus/thus/which means/shows/
 *       proves）在腿②后 60 字（EN 150 字符）内，且其因果/结论词
 *       （导致/造成/拖累/损害/促进/有助/有害/不利于/更好/更有效/
 *       更安全；EN causes/leads to/hurts/harms/improves/boosts/
 *       better/effective）出现在推断词后 50 字（EN 120 字符）内、
 *       未被否定（匹配点前 8 字内不能/不应/不可/未必/不一定/并非/
 *       不代表；EN not/never/doesn't/cannot）。
 *     C-b 裸结论形：因果/结论词出现在腿②之后 80 字（EN 200 字符）
 *       内、未被否定——「…估值越高，经验会拖累公司」。
 *
 * 为什么取 VERIFY 级：单句也可能是对条件化样本的正当转述、课堂案例、
 * 小说对白、新闻报道的概括（"在留下来的员工里加班少的人绩效更高"
 * 的客观描述本身是正确陈述），rewrite 会误伤（与 r206-r209 评价族
 * 同口径）。verify 的含义是「这段文本用条件筛选后样本内的相关支撑
 * 了总体因果结论，需要回到筛选前的全样本/因果识别策略再下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（对撞偏差/对撞因子/内生选择/选择偏差/自选择
 *     偏差/幸存者偏差/存活者偏差/辛普森/统计学/教材/课堂/论文/悖论；
 *     EN collider bias / endogenous selection / selection bias /
 *     self-selection / survivorship bias / Simpson's paradox /
 *     textbook / statistics——讨论这个概念本身不是运用它）；
 *   · 正确响应形（承认是筛选制造的伪相关并要求回到全样本）：不能
 *     只看/不能只看样本/不能推广/不能外推/不能说明/不能证明/假相
 *     关/伪相关/需要随机对照/需要全样本/需要筛选前的数据/需要因果
 *     识别/是筛选造成的/由筛选制造/是选择造成的/不能据此下结论；
 *     EN can't be generalized / cannot conclude / not evidence /
 *     spurious / artifact of the selection / needs the full sample /
 *     randomized / conditioning on the selection——**指出子样本相关
 *     是筛选的副产物并要求回到全样本，正是本族要教的判别动作**；
 *   · 无腿②（没有观察到任何相关/共变）——缺「相关观察」即无假因
 *     果可断言，不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/
 *     还要看/而不是/而非；EN does not mean / not necessarily /
 *     depends on / cannot conclude）；
 *   · 疑问句（含 ?/？）。
 */
'use strict';

// ─── 腿① COND 条件筛选标记（中文）────────────────────────────────
// 介词限定形：「在…里/…中」把观察范围锁在条件筛选后的子样本
const COND_ZH = [
  /在[^。；，!?]{0,14}(?:里|之中|中间|内部|中)/,
  // 动作限定形（r161 教训：收裸动词形态，只看/入选/活过 去前后缀仍命中）
  /只看|仅看|仅仅看|只观察|仅观察|只统计|仅统计|只统计了|只统计到|局限于|限定于|限制在|限制于|限于/,
  // 筛选结果名词与动词（裸名词形态）
  /筛选|筛后|筛完|初筛|复筛|过滤|入选|入围|中选|被选中|被留下|被录取|被淘汰前|留下来|留存|留任|在职|在岗|仍在|还在|现存|幸存|存活|活过|活下来|存续|续存|未被淘汰|淘汰后|通过初筛|通过筛选|通过选拔|进入决赛|进入下一轮|进入前三|进入前|留下来的人|活下来的|幸存者|存活者/,
];

// ─── 腿② ASSOC 样本内观察到的相关/共变（中文）────────────────────
const ASSOC_ZH = [
  // 显式相关标记
  /负相关|正相关|相关性|相关关系|相关联|有关联|成反比|成正比|共变|伴随出现|一同出现/,
  // 比较级反向共变（不要求显式「相关」字样）
  /越[少低短小差弱轻慢]|越[多高长好大强重快]/,
  /更低|更高|更少|更多|更好|更差|更糟|更弱|更强|较低|较高/,
  /反而|反倒|却更|却是|相反地|逆势/,
];

// ─── 腿③ INFER 推断词（中文）────────────────────────────────────
const INFER_ZH = [
  /所以|因此|因而|可见|说明|意味着|证明|显然|据此|故而|这说明|这表明|这足以说明/,
];

// ─── 腿③ CAUSAL 因果/结论词（中文；r161 教训：裸词 有效/有害/拖累
// 去修饰仍命中）────────────────────────────────────────────────
const CAUSAL_ZH = [
  /导致|造成|引发|引起|使得|促使|拖累|拖垮|损害|伤害|削弱|减弱|抑制|阻碍|促进|提升|有助|有助于|有益|有害|利于|不利于|妨碍|影响|决定|提高|降低|带来|造就|拉低|推高|使[^。；，]{0,6}(?:变|更)/,
  /更安全|很安全|安全|更有效|很有效|有效|更好|很好|更可靠|可靠|更差|更糟|有害|不利|有利|是好事|是坏事|应当|应该|推荐|推广|采纳|照常|可以放心|越好|越好越|越短成绩越好/,
];

// ─── 英文常量 ───────────────────────────────────────────────────
const COND_EN = [
  /\b(?:among|amongst|within|in)\s+(?:the\s+|those\s+)?(?:survivors?|selected|admitted|remaining|those|participants?|cases?|companies?|firms?|employees?|students?|patients?|finalists?|candidates?)\b/i,
  /\b(?:only|just)\s+(?:those|the\s+ones)\s+who\b/i,
  /\b(?:looking|look|looking)\s+only\s+at\b/i,
  /\b(?:restricted|limited|conditioned)\s+to\b/i,
  /\b(?:survivors?|survived|survival|attrition|made\s+it\s+(?:through|past)|those\s+who\s+(?:remained|survived|stayed|made\s+it)|selected\s+sample|endogenous|after\s+(?:the\s+)?(?:filter|screening|selection))\b/i,
];
const ASSOC_EN = [
  /\b(?:negative(?:ly)?\s+correlat\w+|positive(?:ly)?\s+correlat\w+|correlat\w+|inversely\s+related|directly\s+related|associated\s+with|association|linked\s+to|relationship\s+between)\b/i,
  /\b(?:less|fewer|lower|lowest|shorter|weaker|worse)\b[^.]{0,50}\b(?:more|higher|highest|greater|better|stronger|best)\b/i,
  /\b(?:more|higher|highest|greater|stronger|better|best)\b[^.]{0,50}\b(?:less|fewer|lower|lowest|shorter|weaker|worse)\b/i,
  /\b(?:inversely|conversely)\b/i,
  /\b(?:more\s+likely|less\s+likely|tends?\s+to|tend\s+to)\b/i,
  // 单边比较级（降级形容词本身即反向共变信号：slower / lower / higher）
  /\b(?:slower|lower|higher|fewer|weaker|stronger|worse|better|shorter|longer)\b/i,
];
const INFER_EN = [
  /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|shows|proves|suggests|implies|hence|consequently)\b/i,
];
const CAUSAL_EN = [
  /\b(?:causes?|caused|leads?|led\s+to|hurts?|harmed|harms?|damages?|degrades?|degraded|degradation|boosts?|improves?|undermines?|reduces?|increases?|drives?|driven|makes?|creates?|produces?|affects?)\b/i,
  /\b(?:safer|safe|effective|works?|worked|better|best|reliable|harmful|beneficial|detrimental|worse|worst|successful|slower|should|recommend\w*|justified)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /对撞偏差|对撞因子|对撞因|内生选择|内生性|选择偏差|自选择偏差|幸存者偏差|存活者偏差|幸存偏差|辛普森|区群谬误|生态谬误|统计学|统计|教材|课堂|教科书|讲座|教案|习题|悖论|论文|研究指出|因果推断|因果识别/,
];
const EXEMPT_META_EN = [
  /\b(?:collider\s+bias|collider|endogenous\s+selection|selection\s+bias|self-?select\w+|survivorship\s+bias|survivor\s+bias|simpson'?s\s+paradox|ecological\s+fallacy)\b/i,
  /\b(?:textbook|lecture|statistics|stats\s+class|causal\s+inference|causal\s+identification)\b/i,
];

// ─── 豁免二：正确响应形（承认是筛选制造的伪相关 + 回到全样本）───
// 只收「结论层」的正确响应，不收裸「筛选后」——「筛选后可以看到加班
// 少的绩效更高，所以加班拖累绩效」是用筛选开场、仍以子样本相关背书
// 的攻击形（r212 探针实测：把「筛选」整体豁免会放过该攻击样本）。
const EXEMPT_CORRECT_ZH = [
  /不能只看|不能只看样本|不能只看这个样本|不能只看留下|不能只看幸存|不能只看现存|不能只看入选/,
  /不能推广|不能外推|不能推广到|无法推广|不能据此|不能据此下结论|不能得出|不能推出|推不出|不能说明|不能证明|不足以说明|不足以证明/,
  /假相关|伪相关|虚假相关|相关是假的|是筛选造成的|由筛选制造|是选择造成的|由选择制造|是条件筛选|筛选制造的|筛选造成的|观察条件的副产物/,
  /需要随机对照|需要全样本|需要筛选前|筛选前的数据|需要因果识别|需要回到全样本|回到全样本|需要原始样本|需要未筛选/,
  /需要进一步验证|尚需|仍待|有待验证|还需验证|存疑|可疑|站不住|说不通|说明存在|提示存在|暴露了|反映了问题/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:can'?t|cannot|should\s+not)\s+(?:be\s+)?(?:generalized|generalise[dn]?|extrapolated)\b/i,
  /\b(?:cannot|can'?t)\s+(?:conclude|infer|assume)\b/i,
  /\b(?:not\s+evidence|no\s+evidence|spurious|artifact\s+of\s+the\s+selection|artefact\s+of\s+the\s+selection)\b/i,
  /\b(?:needs?|requires?)\s+(?:the\s+)?(?:full\s+sample|pre-?selection|randomiz\w+|randomised|randomized|unselected|unfiltered)\b/i,
  /\b(?:caused\s+by\s+(?:the\s+)?(?:selection|filter|screening|conditioning))\b/i,
  /\b(?:further\s+verification|still\s+requires|remains\s+to\s+be\s+seen)\b/i,
];

// ─── 否定守卫（窗口化：查因果词前的否定标记，不限于紧邻结尾）──
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|并不会使|不会造成|不会导致/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|no|unlikely)\b/i;

// 邻近窗
const WIN_COND_ASSOC_ZH = 30;  // 腿① ↔ 腿②
const WIN_COND_ASSOC_EN = 100;
const WIN_ASSOC_INFER_ZH = 60; // 腿② ↔ 推断词
const WIN_ASSOC_INFER_EN = 150;
const WIN_INFER_CAUSAL_ZH = 50; // 推断词 ↔ 因果词
const WIN_INFER_CAUSAL_EN = 120;
const WIN_ASSOC_CAUSAL_ZH = 80; // 腿② ↔ 因果词（裸结论形）
const WIN_ASSOC_CAUSAL_EN = 200;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表（COND_ZH/ASSOC_ZH…）可注入空数组；INFER 等
// 单正则常量注入一个替换正则（负例脚本用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 逐 marker 找腿①（返回首个命中位置）
function findCondLeg(text, isZh, R) {
  const list = isZh ? (R.COND_ZH || COND_ZH) : (R.COND_EN || COND_EN);
  return firstIdx(list, text);
}

// 腿②：取所有命中位置中离腿①最近者（腿①之后优先）
function findAssocLeg(text, isZh, R, condIdx) {
  const list = isZh ? (R.ASSOC_ZH || ASSOC_ZH) : (R.ASSOC_EN || ASSOC_EN);
  const win = isZh ? WIN_COND_ASSOC_ZH : WIN_COND_ASSOC_EN;
  let best = -1;
  let bestDist = Infinity;
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      const d = Math.abs(m.index - condIdx);
      if (d <= win && d < bestDist) { bestDist = d; best = m.index; }
    }
  }
  return best;
}

// 腿③：C-a 推断+因果形 / C-b 裸结论形
function findConclLeg(text, isZh, R, assocIdx) {
  const winInfer = isZh ? WIN_ASSOC_INFER_ZH : WIN_ASSOC_INFER_EN;
  const winCausal = isZh ? WIN_INFER_CAUSAL_ZH : WIN_INFER_CAUSAL_EN;
  const winBare = isZh ? WIN_ASSOC_CAUSAL_ZH : WIN_ASSOC_CAUSAL_EN;
  const infers = [pickRe(R.INFER_ZH, INFER_ZH[0])];
  const causals = isZh ? (R.CAUSAL_ZH || CAUSAL_ZH) : (R.CAUSAL_EN || CAUSAL_EN);

  // C-a：推断词在腿②之后，因果词在推断词之后、未被否定
  for (const re of infers) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      if (m.index < assocIdx || m.index - assocIdx > winInfer) continue;
      for (const cr of causals) {
        const crG = new RegExp(cr.source, cr.flags.includes('g') ? cr.flags : cr.flags + 'g');
        let cm;
        while ((cm = crG.exec(text)) !== null) {
          if (cm.index < m.index || cm.index - m.index > winCausal) continue;
          if (!negatedBefore(text, cm.index, isZh)) return { form: 'C-a', idx: cm.index };
        }
      }
    }
  }

  // C-b：因果词在腿②之后、未被否定（无推断词的裸结论形）
  for (const cr of causals) {
    const crG = new RegExp(cr.source, cr.flags.includes('g') ? cr.flags : cr.flags + 'g');
    let cm;
    while ((cm = crG.exec(text)) !== null) {
      if (cm.index < assocIdx || cm.index - assocIdx > winBare) continue;
      if (!negatedBefore(text, cm.index, isZh)) return { form: 'C-b', idx: cm.index };
    }
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkColliderBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：承认子样本相关是筛选的副产物并要求回到全样本，
  // 正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 条件筛选 × 腿② 样本内相关观察 × 腿③ 总体因果结论
  const condIdx = findCondLeg(text, isZh, R);
  if (condIdx >= 0) {
    const assocIdx = findAssocLeg(text, isZh, R, condIdx);
    if (assocIdx >= 0) {
      const concl = findConclLeg(text, isZh, R, assocIdx);
      if (concl) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '条件筛选后样本内相关被当作总体因果结论(zh)'
            : 'within-selected-sample correlation used as population-level causal claim(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkColliderBias,
  __internals: () => ({
    COND_ZH, ASSOC_ZH, INFER_ZH, CAUSAL_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH,
    COND_EN, ASSOC_EN, INFER_EN, CAUSAL_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN,
  }),
};
