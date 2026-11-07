/**
 * src/framing-effect.js — 「框架效应」检测器
 * （ provisional 第 232 个判别维度，r244 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r244-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r243：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/winners_curse(r237)/tragedy_of_commons(r238)/
 * illusion_of_control(r239)/disposition_effect(r240)/
 * endowment_effect(r241)/anchoring_effect(r242)/present_bias(r243)
 * 十八个已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * [r244 立项] 零命中探针 coordination/agent4/probes/r244-probe-round1.js
 * + r244-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——C 框架效应一轮 5/8、二轮 9/10 穿透（唯一代拦为
 * 既有 empty_answer 对英文长句的偶发代拦，无任何维度以「等价双框
 * 架表述×决策反转」语义承重）；A 损失厌恶 13/18、B 货币幻觉 14/18、
 * D 机会成本忽视 14/18（perfect_error/pseudo_causal/hasty_generalization
 * 偶发代拦）、E 峰终定律 14/18（且疑难良性 1 条被既有 confidence 误
 * 伤）。疑难良性两轮 8/8 + 20/20：框架效应族 4/4 零误伤。邻接既有
 * 维度领地（沉没成本/禀赋/处置/虚假精度/语义转移/轻率泛化）实测
 * 全部 pass，零结构重叠。src/ 下没有任何维度判「逻辑等价的同一
 * 信息因表述框架不同导致决策/评价反转」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r244 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-121722* 与 *20261107-121823*）：
 * arXiv 一次 OR 噪声化（15 条全不相关）、一次短语引号查询零条目、
 * GitHub 两次 0 命中、Semantic Scholar 两次 429 限流。判据为心虫
 * 自有纯规则实现（家族定义取自行为经济学/判断与决策科学的标准
 * 描述：framing effect / 框架效应——Tversky & Kahneman 1981：逻辑
 * 等价的信息因表述框架（收益/损失、存活/死亡、成功/失败）不同，
 * 系统性地改变人的选择与评价；亚洲病问题是教科书原型）。
 *
 * 辨别的族：框架效应（framing effect）——**等价双框架表述**
 * （说成活留率九成/说成死亡率一成、包装成成功率高/换成失败率、
 * framed as survival / framed as mortality）与**决策评价反转**
 * （就愿意签字/怎么都不肯做、sailed through / died、接受/拒绝）
 * 共现。同一底层事实、两种逻辑等价的描述、选择随描述翻转——三
 * 要素齐备才是本族形状。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：框架效应是
 * 把「事实」与「表述」拆开后系统性地操纵决策的话语结构。如果一
 * 段话把同一数字换成两种等价说法、并据此让听话人做出相反选择，
 * 那么它展示的不是事实的力量而是措辞的力量——听者需要意识到
 * 两种表述逻辑等价、决策不应被表述方式决定。与正当表述有明确
 * 界线：并列呈现两种框架让人比较、同时列出双方数据、明确讨论
 * 框架效应本身、或按完整数据做决策——均豁免。
 *
 * 与既有维度的边界（r244 归因）：
 *   · equivocation_sense_shift 管**词义转移**（此公平非彼公平）；
 *     本族判等价框架切换决策，无词义漂移。
 *   · false_equivalence 管**错误对等**（把不等价的说成等价）；
 *     本族的两框**逻辑等价**，方向相反。
 *   · doublespeak 管**修辞遮盖**（把裁员说成人员优化）；
 *     本族判选择随框架翻转，无粉饰结构也可命中（死亡率/存活率
 *     数值对本身即框架对）。
 *   · statistical_misleading 管**统计呈现误导**（选择性截取
 *     数据）；本族不涉数据取舍，判表述框架对决策的作用。
 *   · cherry_picking 管**选择性呈现数据**；本族数据完整、
 *     只是换了等价说法。
 *   · appeal_to_future（r233 草稿）管**把价值寄托于未来版本**；
 *     本族判同一事实的框架切换，无未来指向。
 *
 * 判据（双腿链共现，缺一不判）：
 *   ① 框架条件（二择一满足）：
 *      a. 互补框架对——正面框架名词（存活率/成功率/好评率/正常率/
 *         瘦肉占比/惠及…）×负面框架名词（死亡率/失败率/差评率/
 *         异常率/脂肪占比/不受益…）同窗共现；或
 *      b. 框架表述动词（说成/写成/包装成/描述成/表述为/换成/改成/
 *         换个说法/换个措辞/换个框架/换个口径；EN framed as /
 *         described as / phrased as / presented as / pitched as）；
 *   ② 决策评价反转——正面响应词（愿意/肯/签字/支持/放心/抢着买/
 *      挤破头/顺耳…；EN accepted / consented / sailed / embraced）
 *     与负面响应词（不肯/拒绝/没人要/炸了/上街/警惕…；EN refused /
 *     rejected / died / opposed）同窗共现，且两个响应词不在同一
 *     位置重叠（防止单个否定词冒充正负两极）；
 *   ③ 框架条件×两响应词近距离窗（ZH 60 / EN 180），响应词均查
 *      否定前缀（并没有因此就接受/并没有就拒绝）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次措辞实验或历史事
 * 件，也可能是当事人自己指出了框架机制。verify 的语义是「这段话
 * 把同一事实用两种等价框架呈现并让决策随框架翻转，先核实两种
 * 表述是否逻辑等价、决策是否应取决于表述方式，再决定是否采信
 * 其选择」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（框架效应/卡尼曼/特维斯基/前景理论/framing effect/
 *     Tversky/Kahneman——CONCEPT 豁免）；
 *   · 并列呈现两种框架供比较（同时列出存活率和死亡率/交叉验证/
 *     两种问法都跑/避免单向框架/列出双方数据——CORRECTIVE 豁免）；
 *   · 只有框架没有反转（换个说法再讲一遍/坏消息不能包装成好消息）；
 *   · 只有反转没有框架（有人赞成有人反对/投票五五开）；
 *   · 单侧框架名词+单侧响应（异常率上升引起警惕——缺正面框架
 *     名词即无对）；
 *   · doublespeak/cherry_picking/statistical_misleading 领地
 *     （见上边界）。
 */
'use strict';

// ─── 框架条件 a：互补框架对（正面框架名词 × 负面框架名词）────────
// 正面框架名词：以「好的一面」计量的同一底层事实
const POS_FRAME_ZH = [
  /(?:存活|成活|生存|治愈|康复|成功|好评|满意|正常|留存|通过|达标|瘦肉|受益|惠及|中签|中奖|完成|增长|上升|盈利|赞成|支持|安心|放心|改善|提升|正增长)[^。，！？；\n]{0,4}(?:率|比例|占比|面|数|度)/,
  /(?:好评|瘦肉|受益|惠及|赞成|支持|安心|放心|满意|成功)(?:的)?(?:说法|框架|表述|描述|口径|提法|讲法|形式)/,
  /(?:活留|活存|成活)[^。，！？；\n]{0,4}(?:率|比例|占比)/,
  /(?:瘦肉|精肉|优质)[^。，！？；\n]{0,2}(?:占比|比例|率)/,
];
// 负面框架名词：以「坏的一面」计量的同一底层事实
const NEG_FRAME_ZH = [
  /(?:死亡|病死|失败|差评|不满|异常|流失|淘汰|未通过|未达标|未如愿|落选|亏损|下滑|下降|复发|不良|不受益|未惠及|未覆盖|错过|损失|负债)[^。，！？；\n]{0,4}(?:率|比例|占比|面|数|度)/,
  /(?:差评|恶评|反对|拒绝|抵制|脂肪|不受益|未惠及|不满|亏损|下滑|下降)(?:的)?(?:说法|框架|表述|描述|口径|提法|讲法|形式)/,
  /(?:脂肪|肥肉)[^。，！？；\n]{0,2}(?:占比|比例|率)/,
];

// ─── 框架条件 b：框架表述动词（把同一事实换一种等价说法）────────
const FRAME_VERB_ZH = [
  /说成(?!功|败|功率|败率)/,
  /(?:说成是|说作为|写成|写成了|表述为|表述成|描述成|描述为|包装成|包装为|渲染成|呈现为|讲成|诠释成|解读成|解释成)/,
  /(?:换|改|换用)(?:成|为|了|种|个)?[^。，！？；\n]{0,6}(?:说法|措辞|框架|口径|表述|描述|角度|形式|提法|讲法)/,
  /(?:以|用)[^。，！？；\n]{0,6}(?:的)?(?:说法|措辞|框架|口径|形式|表述|描述)(?:来|去)?(?:呈现|表述|描述|讲|说)/,
];

// ─── 决策评价反转：正面响应词 / 负面响应词 ───────────────────────
const FLIP_POS_ZH = [
  /(?:愿意|乐意|肯|接受|支持|拥护|赞成|同意|签字|签约|签下|购买|买下|抢着买|挤破头|蜂拥|叫好|点赞|抢购|报名|参加|预约|动心|心动|放心|安心|松一口气|觉得值|值了|顺耳|舒服|看好|值得投|愿意投|好评如潮|买单|下手|称赞|欣慰|认可|投了赞成票|拍板|定了下来)/,
];
const FLIP_NEG_ZH = [
  /(?:不肯|不愿意|不乐意|拒绝|反对|抵制|否决|否了|没人要|没人肯|没人买|没人来|买不下手|下不去手|不敢买|炸了|炸毛|慌了|恐慌|上街|抗议|被冲|炎上|反感|抵触|警惕|担心|不买|不签|换家|想换|改签别家|撤销|退单|退货|劝退|打退堂鼓|觉得亏|刺耳|别扭|不安|愤怒|生气|质疑|改了主意|转身就走|一哄而散)/,
];

// ─── 英文对应族 ────────────────────────────────────────────────
const POS_FRAME_EN = [
  /\b(?:survival|success|satisfaction|approval|improvement|recovery|lean|positive|gain|gains|benefit|wins?|winning|completion|retention|pass(?:ing)?|healthy)\b[^.]{0,30}\b(?:rates?|ratios?|percents?|proportions?|shares?|terms?|framings?|descriptions?|frames?|numbers?|figures?)\b/i,
  /\b(?:survival|success|satisfaction|approval|recovery|retention|passing|completion|benefit)\s+(?:rates?|ratios?|percents?|proportions?)\b/i,
];
const NEG_FRAME_EN = [
  /\b(?:mortality|death|failure|dissatisfaction|complaint|rejection|loss|losses|negative|fat|decline|defect|error|dropout|attrition|elimination|unaffected|excluded)\b[^.]{0,30}\b(?:rates?|ratios?|percents?|proportions?|shares?|terms?|framings?|descriptions?|frames?|numbers?|figures?)\b/i,
  /\b(?:mortality|failure|dissatisfaction|attrition|elimination|dropout)\s+(?:rates?|ratios?|percents?|proportions?)\b/i,
];
const FRAME_VERB_EN = [
  /\b(?:framed|described|phrased|presented|pitched|worded|cast|labeled|labelled|portrayed|spun|put|reframed)\s+(?:it\s+|them\s+|this\s+|that\s+|the\s+\w+\s+|as\s+)?(?:as|in\s+terms\s+of)\b/i,
];
const FLIP_POS_EN = [
  /\b(?:accepted|acceptance|consented|consent|approved|approval|supported|embraced|welcomed|sailed|bought|purchased|signed|endorsed|agreed|comfortable|reassured|acceptable|worth\s+it|cheered|praised|backed|opted\s+in|signed\s+up)\b/i,
];
const FLIP_NEG_EN = [
  /\b(?:refused|refusal|rejected|declined|opposed|vetoed|died|avoided|balked|unacceptable|alarmed|panicked|protested|walked\s+away|turned\s+(?:it\s+)?down|voted\s+(?:no|against)|backlash|boycott(?:ed)?|shunned|declined\s+outright)\b/i,
];

// ─── 距离窗（框架条件 × 两响应词）──────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（本族名称/创始人/学科术语的教学定义句）────
const CONCEPT_ZH = /(?:框架效应|框架性|措辞效应|表述框架|收益框架|损失框架|框架理论|框架偏差|卡尼曼|特沃斯基|特维斯基|前景理论|亚洲病问题|亚洲疾病问题|框架化|再框架|重新框架)/;
const CONCEPT_EN = /\bframing\s+(?:effect|bias|effects)\b|\bframed\s+in\s+terms\b|\bTversky\b|\bKahneman\b|\bprospect\s+theory\b|\breframing\b|\bframe\s+the\s+(?:same\s+)?(?:fact|information|data)\b/i;

// ─── 豁免：并列呈现两种框架供比较/按完整数据决策的正当做法 ────
const CORRECTIVE_ZH = /(?:同时(?:列出|呈现|给出|展示)[^。，！？；\n]{0,12}(?:和|与|以及|以及|跟|并)[^。，！？；\n]{0,12}(?:率|框架|说法|数据|表述))|(?:两种|两面|两个|两套)[^。，！？；\n]{0,6}(?:框架|说法|表述|问法|口径)[^。，！？；\n]{0,8}(?:都|均|全)[^。，！？；\n]{0,8}(?:跑|列|呈现|验证|对比|比较)|(?:交叉验证|并列呈现|双向呈现|对照呈现|避免单向框架|避免单一框架|不给单一框架|并列列出|一并列出|如实呈现|按完整数据|据完整数据|两种表述下的|同一事实的两种)/;
const CORRECTIVE_EN = /\b(?:lists?|shows?|presents?|reports?|gives?)\s+both\b|\bboth\s+(?:frames?|framings?|phrasings?|descriptions?)\b|\bcross[- ]validat\w*|\bavoid(?:ing)?\s+(?:a\s+)?(?:single|one[- ]sided)\s+frame\b|\bpresent(?:ed|ing)?\s+both\s+(?:the\s+)?(?:survival|mortality|success|failure)\b|\bside[- ]by[- ]side\b|\bwithout\s+(?:the\s+)?(?:spin|framing)\b|\bequivalent\s+(?:descriptions?|statements?)\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  // A不A/V不V 疑问形（好不好/会不会）中的「不」不是对后续断言的否定
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - b.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 双腿链配对：框架条件 × 正面响应 × 负面响应。
// 要求：两响应词位置不重叠（防单个否定词冒充两极），且框架条件
// 与两响应词均落在近距离窗内。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      posF: R.POS_FRAME_ZH || POS_FRAME_ZH, negF: R.NEG_FRAME_ZH || NEG_FRAME_ZH,
      verbF: R.FRAME_VERB_ZH || FRAME_VERB_ZH,
      pos: R.FLIP_POS_ZH || FLIP_POS_ZH, neg: R.FLIP_NEG_ZH || FLIP_NEG_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      posF: R.POS_FRAME_EN || POS_FRAME_EN, negF: R.NEG_FRAME_EN || NEG_FRAME_EN,
      verbF: R.FRAME_VERB_EN || FRAME_VERB_EN,
      pos: R.FLIP_POS_EN || FLIP_POS_EN, neg: R.FLIP_NEG_EN || FLIP_NEG_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const posM = collect(text, L.pos, true);
    const negM = collect(text, L.neg, true);
    if (posM.length === 0 || negM.length === 0) continue;
    // 框架条件：互补框架对，或框架表述动词
    const pairOK = (() => {
      const pf = collect(text, L.posF, false);
      if (pf.length === 0) return [];
      const nf = collect(text, L.negF, false);
      return pf.filter(p => nf.some(n => dist(p, n) <= L.win));
    })();
    const verbM = collect(text, L.verbF, false);
    for (const p of posM) {
      for (const n of negM) {
        if (dist(p, n) === 0) continue;               // 同一位置重叠：单个否定词冒充两极，拒判
        if (dist(p, n) > L.win) continue;
        const frame = pairOK.find(f => dist(f, p) <= L.win && dist(f, n) <= L.win)
          || verbM.find(f => dist(f, p) <= L.win && dist(f, n) <= L.win);
        if (!frame) continue;
        sigs.push({ lang: L.lang, frame: frame.raw, pos: p.raw, neg: n.raw });
      }
    }
  }
  return sigs;
}

/**
 * 双腿链签名：等价双框架表述 × 决策评价反转。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectFramingEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（框架效应/卡尼曼/前景理论教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：并列呈现两种框架供比较/按完整数据决策的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'framing_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '等价框架「' + x.frame + '」× 响应反转「' + x.pos + '」/「' + x.neg + '」'
      : 'equivalent frame "' + x.frame + '" x response reversal "' + x.pos + '" / "' + x.neg + '"')),
    details: s.lang === 'zh'
      ? '框架效应(' + sigs.length + '处: 同一事实以等价双框架「' + s.frame + '」呈现，响应随框架反转「' + s.pos + '」/「' + s.neg + '」，决策被表述方式而非事实决定)(zh)'
      : 'framing effect(' + sigs.length + 'x: equivalent frames "' + s.frame + '" x response reversal "' + s.pos + '" / "' + s.neg + '")(en)',
    guidance: '框架效应指逻辑等价的同一信息因表述框架不同（收益/损失、存活率/死亡率、成功率/失败率）而系统性地改变人的选择与评价——说成活留率九成就愿意做这个手术，说成死亡率一成怎么都不肯做 / 同一批数据，包装成成功率高就显得值得投，换成失败率就没人肯签字 / 换成乐观的说法团队就支持，换成悲观的措辞同一个方案就被否了 / described as ninety percent survival the patients consented, as ten percent mortality they refused / the proposal died when phrased as failure rate and sailed through as success rate。请补上论证：两种表述描述的是同一事实、逻辑等价，决策应由事实本身决定而非措辞；如果确实要在两种框架间取舍，说明依据（风险承受度、基数比率、长期数据），而不是让表述方式单独决定选择。同时列出两种框架供比较、按完整数据决策、明确讨论框架效应本身，都是正当做法；若这段话只是转述他人的框架实验，核实其两种表述是否确实等价再决定是否采信。',
    tags: ['economics', 'behavioral-economics', 'framing-effect', 'cognitive-bias', 'prospect-theory', 'decision-making'],
  };
}

module.exports = {
  detectFramingEffect,
  __internals: () => ({
    POS_FRAME_ZH, NEG_FRAME_ZH, FRAME_VERB_ZH,
    FLIP_POS_ZH, FLIP_NEG_ZH,
    POS_FRAME_EN, NEG_FRAME_EN, FRAME_VERB_EN,
    FLIP_POS_EN, FLIP_NEG_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
