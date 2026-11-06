/**
 * src/effort-justification.js — 「努力正当化」检测器
 * （ provisional 第 222 个判别维度，r234 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r234-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228-r233：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233) 九个已起草未接线维度占号，
 * 最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r234 立项] 零命中探针 coordination/agent4/probes/r234-zerohit-probe.js
 * + r234-fp-stress.js（v6.8.145 gate() 全量 findings 实测）：努力正当化族
 * 攻击句中 4/5 完全穿引擎（pass、findings 为空或仅泛维度噪声、无专用
 * 「努力→质量」维度承重）；唯一非 pass 的 D5（"After all that effort,
 * the conclusion has to be sound."）被泛化层 fallacies 偶发代拦，非专用
 * 维度。良性侧：8 条疑难良性（含"第三方测试通过所以可靠"/"虽然投入精力
 * 但仍需验证"/"投入与正确无关"）当前全 pass 或被既有维度代拦，无一被
 * 本族语义承重。src/ 下没有任何维度判「精力/成本投入 × 推断性桥梁 ×
 * 质量/正确性结论」这一结构——sunk_cost_coercion(第98维)判"不退出"的
 * 胁迫语境、sunk_cost_fallacy（fallacies 子标签）判"继续投入"，均不判
 * "付出→产出质量/正确性"的推论。
 *
 * 外部来源：空返，按既有形态自建。r234 海外扫描（原始证据
 * coordination/agent4/scout/*r234*）：见报告 §依据来源。判据为心虫
 * 自有纯规则实现（家族定义取自认知偏差标准描述：effort justification /
 * IKEA effect——把投入的劳动/成本当作产出质量或结论正确性的证据；
 * 逻辑上，付出量与产出对错、质量高低彼此独立，"花了很大力气"本身
 * 从不构成"它是对的/好的"的理由）。
 *
 * 辨别的族：努力正当化（effort justification / IKEA effect）——把
 * **投入的精力、心血、时间、成本、算力**当成**产出质量或结论正确性**
 * 的证据，用"我们付出了这么多"推断"所以它一定对/好/靠谱"：
 *   我们熬了几个月做出来的方案，质量肯定没问题。
 *   投入了这么多研发经费，产品不可能失败。
 *   团队这么努力，成绩一定好。
 *   We worked on this for months, so it has to be correct.
 *   After all that effort, the conclusion has to be sound.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：付出量与对错/质量
 * 之间**没有推论关系**——通宵的成果可能恰恰是错的，巨资砸出的产品可能
 * 恰恰是废的。用"我们很努力/花了这么多"替代对产出本身的检验，是把
 * **过程投入**偷换成**结果证据**，让未经独立验证的结论凭情感与沉没
 * 感获得不应有的可信度。与正当表述有明确界线：以**独立证据/测试/数据**
 * 支撑质量（"经第三方测试合格"）、坦承努力但要求验证（"虽投入很多，
 * 仍需检验"）、或明确指出付出与对错无关（"花多少时间与正误无必然
 * 联系"）——均豁免。
 *
 * 与既有维度的边界（r234 归因）：
 *   · sunk_cost_coercion（第 98 维）判"已经投入所以不该退出"的胁迫/
 *     弃羞耻结构（管继续/退出决策）；本族判"已经投入所以它对/好"的
 *     质量/正确性推论（管对产出的采信），一个管去留一个管采信。
 *   · sunk_cost_fallacy（fallacies 子标签）同样管"继续投入"；本族不
 *     依赖任何特定动词短语，判"付出→质量"推论本身。
 *   · absolute_claim / perfect_error 只在句中出现"一定/必然/绝不"
 *     等绝对词时偶发代拦（如 D-atk-X3"成绩一定好"）；本族判的是
 *     **努力→质量**这一因果结构，去绝对词后（"团队很努力，成绩应该
 *     不错"式）依然成立，absolute_claim 不覆盖该结构。
 *   · appeal_to_authority 引人类/机构专家为证据；本族的"权威"是
 *     **自己的付出**，不是外部专家。
 *   · 探针实测：努力正当化攻击 4/5 完全穿透，无一被上述维度以本族
 *     语义承重（fp-stress.output.txt）；互不触发。
 *
 * 判据（双腿共现，缺一不判）：
 *   ① 腿① EFFORT 投入锚点——熬(夜/通宵/了几个月)/爆肝/投入(大量)精力/
 *      心血/耗费(巨量)算力/花了(很大)功夫/呕心沥血/奋战数月/投入这么多
 *      经费/研发成本；EN poured blood sweat and tears / months of hard
 *      work / after all that effort / invested so much time/resources /
 *      countless sleepless nights / worked on it for months；
 *   ② 腿② QUALITY 推断性质量结论——**必须带推断性桥梁**（所以/因此/
 *      足见/可见/肯定/一定/必然/势必/想必/毫无疑问/显然；EN so/thus/
 *      must/has to/has got to/can't be wrong/certainly）+ 对/正确/没错/
 *      靠谱/可靠/高质量/优质/值得信/成立/不会错；EN be right/be correct/
 *      be sound/be reliable/be solid/can't be wrong。桥梁是关键：良性句
 *      多以"测试合格/数据表明/confirm"陈述质量（无推断桥梁），双腿判据
 *      天然不命中。
 *   双腿须落在近距离窗内（ZH 50 字 / EN 160 字符）。
 *
 * 为什么取 VERIFY 级：单句可能是真诚地为扎实工作辩护（若质量确有独立
 * 证据支撑则非谬误），或合理的质量陈述。verify 的语义是「这段话在用
 * 付出/成本推断产出质量或结论对错，先用独立于'我们多努力'的证据核实
 * 质量，再决定是否采信」。
 *
 * 明确不判的（四组豁免，均可负例注入证明承重）：
 *   · 让步/举证（努力在场，但质量被要求**独立验证**：「虽然/尽管 +
 *     投入…精力/心血 + 但/然而/仍需 + 验证/测试/检验/数据/证据」；
 *     EN although/despite … still must verify/validate/test/confirm）——
 *     说话者把努力与质量解耦，正是本族的解药；
 *   · 明确解耦（"精力/投入/时间 + 与/和 + 无关/不代表/不等于/没有必然
 *     + 质量/正确/对错/价值"；EN effort/time … unrelated/independent …
 *     quality/correctness）——直接否定本族推论；
 *   · 独立举证在场（经/通过/经过 + 测试/实验/验证/基准/复现/实测/同行
 *     评议/数据 + 质量结论）——质量由证据而非付出承载；
 *   · 元话语概念引述（努力正当化是指…/IKEA effect…/effort justification
 *     is…）——引用本族名称的教学/定义句。
 *   （纯陈述努力而无推断性质量结论、以成就动词"终于实现/达到了"叙述真实
 *     结果、以证据动词"证明/显示"引出质量——均因腿②缺推断桥梁，双腿判据
 *     天然不命中，另由 326 条官方良性语料零误伤验证。）
 */
'use strict';

// ─── 腿① 投入锚点（中文）──────────────────────────────────────
// 关键：只取**实质性付出/成本**（大量/巨量/无数/几个月/通宵/呕心沥血），
// 不取"认真/仔细/用心"等轻度态度词（那可能是正当严谨，不是本族谬误）。
const EFFORT_ZH = [
  // ①-a 熬/爆肝 + 时间量（熬了几个月/熬通宵/爆肝数周）
  /(?:熬|爆肝|肝|苦熬)(?:了|过)?(?:整整|好几|无数|多少|数|几|十几|几十|百余|半年|一年)?(?:个)?(?:月|周|通宵|夜晚|晚上|日子|年头|小时|礼拜)/,
  // ①-b 投入/耗费/花费/花了/用了/下了/费了 + 强量化 + 精力/心血/时间/成本/算力/经费/资源/功夫
  /(?:投入|投入了|耗费|花费|花了|用了|下了|费了|砸了|搭上)(?:了|过)?[^。，！？；\n]{0,8}(?:大量|巨量|海量|巨大|很多|这么多|这么大|那么大|如此多|如此大|无数|整整|诸多|可观|半个|几个|大半)[^。，！？；\n]{0,6}(?:精力|心血|时间|成本|资源|人力|物力|经费|资金|算力|功夫|心思|代价|金钱|钱财|银子|钱)/,
  // ①-c 强努力成语（呕心沥血/殚精竭虑/费尽心思/深耕多年/奋战数月/夜以继日）
  /(?:呕心沥血|殚精竭虑|费尽心思|费尽心血|费了很大功夫|下了很大功夫|下了苦功|奋战数月|奋战数月之久|煞费苦心)/,
  // ①-c2 深耕X多年/数十年（深耕这个领域十几年）
  /深耕[^。，！？；\n]{0,6}(?:多年|数十年|十几年|十余年|良久|很久|许久)/,
  // ①-d 这么/那么 + 努力/拼命/卖力（团队这么努力）
  /(?:这么|那么|如此|这么的|那么的)(?:努力|拼命|卖力|刻苦|辛苦|拼)/,
  // ①-d2 搏命类强努力（拼了命赶工/豁出命干）
  /(?:拼了命|拼上命|豁出命|豁出性命|以命相搏|卖了命|卖命)/,
  // ①-e 努力/拼命 + 了 + 这么久/这么多（努力了这么久）
  /(?:努力|拼命|卖力|付出)(?:了|过)?(?:这么|那么|如此)(?:久|多|长时间)/,
];

// ─── 腿① 投入锚点（英文）──────────────────────────────────────
const EFFORT_EN = [
  // ①-a poured/put/invested/devoted … blood sweat tears / heart / countless hours / months / years
  /\b(?:poured|put|invested|devoted|channeled|sunk|poured)\b[^.]{0,25}\b(?:blood|sweat|tears|heart|soul|countless hours|so much (?:time|effort|energy)|months?|years?|weeks?)\b/i,
  // ①-b blood, sweat, and tears
  /\bblood,?\s+sweat,?\s+and\s+tears\b/i,
  // ①-c (we|they|the team|i) worked/toiled/labored/slaved … for/on months|years|weeks|countless|so long
  /\b(?:we|they|the team|i|our team)\s+(?:worked|toiled|labored|slaved|poured|ground|hacked)\b[^.]{0,30}\b(?:for|on|away)\s+(?:months?|years?|weeks?|countless|so long|so many|endless)\b/i,
  // ①-d after all that/this time/effort/work/investment
  /\bafter\s+all\s+(?:that|this)\s+(?:time|effort|work|investment|toil|labor)\b/i,
  // ①-e invested/spent/devoted so much/considerable/enormous/vast effort/time/resources/money/budget/energy
  /\b(?:invested|spent|devoted|committed)\s+(?:so much|considerable|enormous|vast|significant|substantial|a lot of)\s+(?:effort|time|resources|money|budget|energy|work)\b/i,
  // ①-f months/years of hard work/effort/toil/labor ; countless sleepless nights
  /\b(?:months?|years?|weeks?)\s+of\s+(?:hard\s+)?(?:work|effort|toil|labor|grind)\b/i,
  /\b(?:countless|endless|many|sleepless)\s+(?:hours|nights)\b/i,
];

// ─── 腿② 推断性质量结论（中文）────────────────────────────────
// 关键：必须带**推断性桥梁**（所以/肯定/一定/必然/势必…）+ 对/正确/靠谱/
// 可靠/高质量/优质/值得信/成立/不会错。无桥梁的"质量可靠/数据表明稳定"
// 不命中——那是陈述或举证，不是"付出→质量"推论。
const QUALITY_ZH = [
  // ②-a 推断桥梁 × 正确/对/没错/靠谱/可靠/成立/高质量/优质/值得信/稳妥
  /(?:所以|因此|因而|足见|可见|这说明|足以证明|毫无疑问|无疑|显然|肯定|一定|必然|势必|想必|注定|当然)[^。，！？；\n]{0,10}(?:是对的|是正确的|没错|靠[谱得住]+|可靠|可信|成立|可行|高质量|优质|上乘|值得信|稳妥|正确的|对的|好的|棒的|出色的|不会错|错不了|差不了|靠得住|没问题)/,
  // ②-b 质量名词 × 肯定/一定/必然 × 好/对/成/靠/没错/没问题/高质量/靠谱
  /(?:质量|结果|结论|答案|方案|产品|成果|成绩|它|这|其)[^。，！？；\n]{0,4}(?:肯定|一定|必然|势必|想必|毫无疑问)[^。，！？；\n]{0,6}(?:好|对|行|成|靠|没错|没问题|高质量|高|佳|优|靠谱|可靠|错不了|差不了|过硬|上乘)/,
  // ②-c 不可能/绝不会/不会 + 错/失败/有问题/出差错
  /(?:不可能|绝不会|不会|决不能|想必不会)[^。，！？；\n]{0,4}(?:错|失败|有问题|出差错|掉链子|出岔子)/,
  // ②-d 一定/肯定/必然 + 没错/不会错（"一定没错"）
  /(?:一定|肯定|必然|势必|百分百|百分之百)(?:是)?(?:没错|不会错|错不了|对的|正确)/,
];

// ─── 腿② 推断性质量结论（英文）────────────────────────────────
const QUALITY_EN = [
  // ②-a so/therefore/thus/hence/which means + must/has to/can't + be right/correct/sound/good/reliable/…
  /\b(?:so(?!\s+(?:much|many))|therefore|thus|hence|which means|it follows that|meaning)\b[^.]{0,30}\b(?:must|has to|has got to|is bound to|cannot|can't|will)\b[^.]{0,20}\b(?:be right|be correct|be sound|be good|be reliable|be solid|be flawless|work|succeed|pay off|be valid|be high[- ]quality)\b/i,
  // ②-b (it|the result|conclusion|answer|product|solution|output) must/has to be right/correct/sound/reliable/solid/flawless/valid
  /\b(?:it|the (?:result|conclusion|answer|product|solution|output|design))\s+(?:must|has to|has got to)\s+be\s+(?:right|correct|sound|good|reliable|solid|flawless|valid|trustworthy)\b/i,
  // ②-c can't/couldn't/won't be wrong/incorrect/bad/flawed
  /\b(?:can'?t|cannot|couldn'?t|won'?t|wouldn'?t)\s+be\s+(?:wrong|incorrect|bad|flawed|mistaken)\b/i,
  // ②-d certainly/definitely/surely/undoubtedly + right/correct/sound/reliable/good
  /\b(?:certainly|definitely|surely|undoubtedly|obviously)\s+(?:right|correct|sound|reliable|good|valid)\b/i,
];

// 双腿距离窗
const PAIR_ZH = 50;
const PAIR_EN = 160;

// ─── 豁免一：让步/举证（努力在场，但质量被要求独立验证）──────────
// 「虽然/尽管 + 投入…精力/心血 + 但/然而/仍需 + 验证/测试/检验/数据/证据」
// 说话者把努力与质量解耦、要求独立核实，正是本族解药。删除本组后，
// 含真实签名+让步标记的句子会变红。让步标记只取转折+验证类，不含裸
// "所以质量肯定好"（那正是本族），确保与其它豁免独立承重。
const CONCEDE_ZH = /(?:虽然|尽管|固然|虽说|纵然)[^。！？\n]{0,28}(?:但|然而|但是|可是|不过|仍|还是|却|也|依然|仍然)[^。！？\n]{0,18}(?:验证|测试|检验|确认|复核|数据|证据|核实|把关|审视|benchmark|试点|独立)/;
const CONCEDE_EN = /\b(?:although|though|even though|while|despite|even after)\b[^.]{0,55}\b(?:still|nevertheless|nonetheless|yet|must|need to|has to|should)\b[^.]{0,25}\b(?:verify|validate|test|confirm|check|evidence|data|benchmark|independent)\b/i;

// ─── 豁免二：明确解耦（"精力/投入 + 与/和 + 无关/不代表/没有必然 + 质量/正确"）──
// 删本组后，"投入多少与正误无关/花时间不与质量挂钩"类句子会变红。
const DECOUPLE_ZH = /(?:精力|心血|投入|努力|付出|时间|成本|功夫|心思|代价)[^。！？\n]{0,8}(?:与|和|跟|同)[^。！？\n]{0,12}(?:毫无关系|没有关系|无关|不代表|不等于|并非|没有必然|没有直接|不成正比|不划等号)/;
const DECOUPLE_EN = /\b(?:effort|time|investment|work|hours|cost)\b[^.]{0,25}\b(?:unrelated|independent|irrelevant|not (?:the same|related|correlated)|no (?:bearing|relation|guarantee))\b[^.]{0,20}\b(?:quality|correctness|value|accuracy|merit|worth)\b/i;

// ─── 豁免三：独立举证在场（经/通过 + 测试/实验/验证/基准/复现/数据 + 质量）──
// 质量由证据而非付出承载时豁免。删本组后，"经第三方测试合格"类句子会变红。
// 注意：本组锚定"经/通过 + 验证类 + 质量结论"，不含裸"努力/投入"（那归腿①），
// 与 CONCEDE/DECOUPLE 负例注入相互独立承重。
const EVIDENCE_ZH = /(?:经|通过|经过|经由|凭借|依据|基于)[^。，！？；\n]{0,10}(?:测试|实验|验证|基准|复现|实测|同行评议|同行评审|盲测|对照|统计|数据|benchmark|pilot)[^。，！？；\n]{0,12}(?:合格|通过|可靠|正确|对|成立|高质量|优质|稳定|达标|没问题)/;
const EVIDENCE_EN = /\b(?:passed|validated|confirmed|verified)\b[^.]{0,30}\b(?:test|tests|testing|benchmark|trial|trials|evaluation|review)\b[^.]{0,25}\b(?:reliable|correct|sound|solid|robust|quality)\b/i;

// ─── 豁免四：元话语概念引述（引用本族名称的教学/定义句）──────────
const META_ZH = /努力正当化|IKEA效应|IKEA 效应|心血辩护|付出合理化|沉没成本谬误|(?:把|将)[^。，！？；\n]{0,14}(?:付出|投入|努力|心血)[^。，！？；\n]{0,8}(?:当成|视为|当作|看作)[^。，！？；\n]{0,8}(?:质量|正确|对错)[^。，！？；\n]{0,8}(?:证据|理由|依据|证明)/;
const META_EN = /\b(?:effort justification|IKEA effect|sunk[- ]cost fallacy)\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
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

/**
 * 双腿配对：任一投入锚点 × 任一推断性质量结论，落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const effortZh = (R.EFFORT_ZH || EFFORT_ZH);
  const effortEn = (R.EFFORT_EN || EFFORT_EN);
  const qualityZh = (R.QUALITY_ZH || QUALITY_ZH);
  const qualityEn = (R.QUALITY_EN || QUALITY_EN);

  const sigs = [];
  const langs = [
    { f: effortZh, q: qualityZh, win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh' },
    { f: effortEn, q: qualityEn, win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en' },
  ];
  const dedupeOverlap = (arr) => {
    // 去重：同一逻辑锚点被多条模式重叠命中只计一次（保留长片段/靠前者）
    const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
    const out = [];
    for (const x of sorted) {
      if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
      out.push(x);
    }
    return out.sort((a, b) => a.idx - b.idx);
  };
  for (const { f, q, win, lang } of langs) {
    let fm = [];
    for (const re of f) for (const x of allMatches(re, text)) fm.push(x);
    let qm = [];
    for (const re of q) for (const x of allMatches(re, text)) qm.push(x);
    fm = dedupeOverlap(fm); qm = dedupeOverlap(qm);
    if (!fm.length || !qm.length) continue;
    // 每个投入锚点各配窗内最近的质量结论（片段不重合），各成一签名
    for (const a of fm) {
      let best = null;
      for (const b of qm) {
        const overlap = a.idx < b.end && b.idx < a.end;
        if (overlap) continue;
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        if (!best || dist < best.dist) best = { dist, quality: b };
      }
      if (best) sigs.push({ lang, effort: a.raw, quality: best.quality.raw, dist: best.dist });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectEffortJustification(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免（任一命中即不判）
  if ((R.CONCEDE_ZH || CONCEDE_ZH).test(text) || (R.CONCEDE_EN || CONCEDE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.DECOUPLE_ZH || DECOUPLE_ZH).test(text) || (R.DECOUPLE_EN || DECOUPLE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.EVIDENCE_ZH || EVIDENCE_ZH).test(text) || (R.EVIDENCE_EN || EVIDENCE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.META_ZH || META_ZH).test(text) || (R.META_EN || META_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'effort_justification',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? '「' + x.effort + '」→「' + x.quality + '」' : '"' + x.effort + '" -> "' + x.quality + '"')),
    details: s.lang === 'zh'
      ? '努力正当化(' + sigs.length + '处: 以「' + s.effort + '」的付出推断「' + s.quality + '」——把投入当成质量/正确性的证据)(zh)'
      : 'effort justification(' + sigs.length + 'x: infers "' + s.quality + '" from "' + s.effort + '" — treating expenditure as evidence of quality/correctness)(en)',
    guidance: '不要用投入的精力/时间/成本推断产出的质量或结论的对错（熬了几个月所以肯定没问题 / 投入这么多经费不可能失败 / we worked for months so it has to be correct）：付出量与对错、质量高低彼此独立，通宵的成果可能恰恰是错的。请用独立于"我们多努力"的证据——测试、数据、复现、第三方评议——来核实质量或结论，再决定是否采信；投入量本身不构成采信理由。',
    tags: ['logic', 'cognitive-bias', 'effort-justification', 'ikea-effect', 'sunk-cost-adjacent', 'quality-warrant'],
  };
}

module.exports = {
  detectEffortJustification,
  __internals: () => ({
    EFFORT_ZH, EFFORT_EN, QUALITY_ZH, QUALITY_EN,
    CONCEDE_ZH, CONCEDE_EN, DECOUPLE_ZH, DECOUPLE_EN,
    EVIDENCE_ZH, EVIDENCE_EN, META_ZH, META_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
