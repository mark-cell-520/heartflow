/**
 * src/lump-of-labor.js — 「劳动总量谬误」检测器
 * （r381 新建：econ_reasoning_gate 聚合族第 36 子族 / 插件层第 41 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r381 立项探针（scripts/round-381/probe-r381-pool.js 13 候选同池 +
 *   probe-r381-scope.js 四候选深探，v6.8.190 pristine 基线 HEAD 16c52eb）：
 *   A lump_of_labor 深探穿透 8/10 真零命中（存量维度对「工作总量固定」
 *   零覆盖），良性 7 条中 1 条非 pass（completion_evidence 存量误伤，
 *   非本族增量）；同池 E phillips_permanent 7/10 良性 1、B surrogate_
 *   endpoint 6/10 良性 0、K diversification 5/8 良性 2——A 为「最高穿透
 *   × 良性边界可辩护 × econ 组射程最合」，定拨落地。
 *   海外扫描（hf4-scout.sh topic=economic reasoning bias fallacy flat
 *   rate misuse sunk cost）：arXiv parse-fail / GitHub repos 0 / S2 429
 *   ——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自经济学标准论述的劳动总量
 *   谬误（lump of labor fallacy / fixed work-pool assumption）：把就业
 *   总量看成固定不变的份额，任何一员进入劳动力市场都被认为直接挤占他人
 *   岗位——移民/女性就业/机器自动化/延迟退休都被讲成零和抢夺，跳过「成本
 *   下降会扩张总需求、生产率提升会重构而非消灭就业」的补偿机制。该谬误
 *   自 19 世纪起被反复用于反移民与反自动化论述（参阅经济学教科书对
 *   lump of labor fallacy 的标准处理）。
 *
 * 辨别的族：劳动总量谬误（lump of labor fallacy / fixed work-pool
 *   assumption）——文本同时给出两个信号：
 *   腿① JOBS 劳动力市场语境在场——岗位/工作/就业/饭碗/职位/失业/裁员/
 *       招工/劳动力/退休/用工；jobs / employment / unemployment /
 *       workforce / labor market / hiring / layoffs / automation /
 *       robots / immigrants / retirement。
 *   腿② FIXED 固定份额断言在场——五种形：
 *       · F1 总量固定形：总量/总数/一共 + 就那么多/固定/有上限/一个萝卜
 *         一个坑（the total pool of jobs is fixed / a finite pool of
 *         work）；
 *       · F2 挤占岗位形：取代/抢走/抢占/占了/挤走/砸了 + 岗位/工作/饭碗/
 *         职位（robots replace workers / immigrants take jobs）；
 *       · F3 效率-失业形：效率/生产率/自动化 提高/提升/干得快 + 失业/没活干/
 *         岗位减少（the more efficient, the fewer jobs）；
 *       · F4 一人上岗形：一个人干了/占了 + 另一个就没活干/只能失业（one
 *         person's job means another's unemployment）；
 *       · F5 占位不让形：占着/占住 + 岗位/位置 + 不让/不腾出 + 就没工作。
 *   两腿近距共现（腿②为锚，腿①须落窗内：ZH 40 字 / EN 140 字符），缺一
 *   不判。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 概念讨论（劳动总量谬误/lump-of-labor fallacy 机制本身 + 框架词共现）
 *     由 CONCEPT 豁免——概念名与框架词共现防前缀绕过（r368/r379 同款教训）；
 *   · 纠正句（忽略了补偿机制/取决于需求去向而非/不应把就业看成固定份额）
 *     由 CORRECT 豁免 + 腿②紧前否定窗/对冲短语双守卫承担；
 *   · 非劳动力语境的零和断言（贸易零和/博弈零和）天然不判——腿①要求劳动
 *     力市场标记在场，与 zero_sum_fallacy（泛化零和断言）射程不重叠。
 *
 * 与既有维度的边界（r381 归因，探针 + 边界实测）：
 *   · zero_sum_fallacy 管泛化零和断言（贸易/博弈/谈判你赢我输）——本族管
 *     劳动力市场 × 固定份额断言，腿①排除无就业语境的零和句；探针实测
 *     「贸易就是零和博弈」类存量族攻击句本族零命中；
 *   · sunk_cost_coercion（dim 98）管已投入 × 放弃可耻——本族管岗位挤占
 *     叙事，无已投入标记；
 *   · hasty_generalization 管泛化枚举——本族管「总量固定」这一具体经济
 *     机制误读，非样本外推。
 *
 * 判据（两腿近距共现 + 两组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿① JOBS 劳动力市场语境在场（ZH 名词组 / EN 组）；
 *   ② 腿② FIXED 固定份额断言在场（ZH 五形 / EN 四形）；
 *   ③ 两腿须落在邻近窗内（以腿②为锚，ZH 40 字 / EN 140 字符），方向不限；
 *   ④ 豁免 A 概念讨论（劳动总量谬误/lump of labor fallacy + 框架词共现）；
 *   ⑤ 豁免 B 纠正句（忽略了补偿机制/取决于需求去向/不应把就业看成固定）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一种流行观点（「有人觉得工作
 * 总量固定」——概念句由 CONCEPT 豁免），命中的是把就业总量讲成固定份额、
 * 并据此推出挤占/失业结论的断言。verify 的语义是「这段文本把劳动总量谬误
 * 讲成了分配前提，先把补偿机制与需求弹性对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念讨论（劳动总量谬误/lump-of-labor fallacy 机制本身）；
 *   · 纠正句与机制限定句（就业影响取决于需求去向/忽略了补偿机制）；
 *   · 泛化零和断言无就业语境（贸易零和/谈判零和——归 zero_sum_fallacy）；
 *   · 具体裁员叙事无固定份额断言（公司裁员 200 人——无 F1-F4 标记）。
 */

'use strict';

// ─── 腿① JOBS 劳动力市场语境在场 ─────────────────────────────
const JOBS_ZH = /岗位|工作|就业|饭碗|职位|招工|招聘|失业|待业|裁员|劳动力|务工|打工|入职|跳槽|退休|用工|工种|劳动力市场|上班|差事|活计/;
const JOBS_EN = /\b(?:jobs?|employment|unemployment|workforce|labo(?:u)?r\s+market|hiring|layoffs?|positions?|vacanc(?:y|ies)|automation|robots?|immigrants?|retirement\s+age|pension\s+age|workers?|employees?)\b/i;

// ─── 腿② FIXED 固定份额断言在场 ─────────────────────────────
// F1 总量固定形：(总量/总数/一共 + 就那么多/固定/有上限/一个萝卜一个坑)
//   或反向（就那么多/零和 + 工作/岗位）。
const FIXED_ZH_F1 = /(?:总量|总数|一共|总共|蛋糕|份额|池子|盘子)[^。！？，；]{0,6}(?:就那么多|就那些|固定|是有上限|有上限|不变|恒定|是死的|有限)|(?:就那么多|就那些|有上限|一个萝卜一个坑|零和|此消彼长)[^。！？，；]{0,8}(?:工作|岗位|就业|位置|坑|饭碗|职位)/;
// F2 挤占岗位形：(取代/抢走/抢占/占了/挤走/砸了 + 岗位/工作/饭碗/职位)
const FIXED_ZH_F2 = /(?:取代|替代|抢走|抢了|抢占|占了|挤走|砸了|顶了|吃掉|吞了)[^。！？，；]{0,6}(?:岗位|工作|饭碗|职位|坑|位置|活计)/;
// F3 效率-失业形：(效率/生产率/自动化/机器/速度/产出 + 提高/提升/增长/越快/干得快
//   + 失业/没活干/岗位减少)。中段允许跨逗号（「机器干得快，就等于人没活干了」）。
const FIXED_ZH_F3 = /(?:效率|生产率|自动化|机器|速度|产出)[^。！？；]{0,10}(?:每)?(?:提高|提升|上涨|增长|越快|干得快)[^。！？；]{0,14}(?:失业|没活干|没工作|没饭吃|岗位[^。！？；]{0,4}(?:减少|变少)|工作[^。！？；]{0,4}(?:减少|变少)|岗位(?:就)?少|工作(?:就)?少)/;
// F4 一人上岗形：一个人干了/占了 + 另一个就没活干/只能失业。
const FIXED_ZH_F4 = /(?:一个人|一人|有人)[^。！？，；]{0,8}(?:干了|占了|去了|有了|顶上)[^。！？；]{0,10}(?:另一个|别人|其他人)[^。！？；]{0,8}(?:就没|只能|就得|就)[^。！？；]{0,4}(?:活干|工作|失业|没饭吃)/;
// F5 占位不让形：占着/占住/赖着 + 岗位/位置/坑 + 不让/不腾出 + 就没工作/没活干。
const FIXED_ZH_F5 = /(?:占着|占住|赖着|捂着)[^。！？，；]{0,6}(?:岗位|位置|坑|职位|编制)[^。！？；]{0,12}(?:不让|不腾|不放手|腾不出来|没活干|没工作|就没)/;

// EN 腿②四形。
const FIXED_EN_F1 = /\b(?:total|fixed|finite|limited|constant)\s+(?:pool|number|amount|supply|quantity|stock)\s+of\s+(?:jobs?|work|employment)\b|\b(?:jobs?|work|employment)\s+(?:is|are)\s+(?:a\s+)?(?:fixed|finite|zero[- ]sum|limited)\b|\bfixed\s+pool\s+of\s+work\b|\b(?:amount|pool|total|supply|quantity)\s+of\s+(?:jobs?|work|employment)\s+(?:is\s+)?(?:never\s+)?(?:chang\w+|fixed|constant|finite|limited)\b/i;
const FIXED_EN_F2 = /\b(?:robots?|automation|immigrants?|machines?|new\s+(?:entrants|workers))\b[^.]{0,40}\b(?:takes?|steals?|take|steal|replaces?|replace|destroy|displace|crowd\s+out|removes?|remove)\w*\b[^.]{0,30}\b(?:jobs?|work|positions?|livelihoods?|workplaces?|posts?)\b|\b(?:jobs?|work|positions?)\s+(?:taken|stolen)\s+(?:by|from)\b/i;
const FIXED_EN_F3 = /\b(?:the\s+)?more\s+efficien\w+\b[^.]{0,50}\b(?:fewer|less)\s+(?:jobs?|work|employment)\b|\befficienc(?:y|ies)\s+(?:gains?|improvements?)\b[^.]{0,40}\b(?:destroy|eliminate|reduce)\w*\b[^.]{0,20}\b(?:jobs?|work|employment)\b/i;
const FIXED_EN_F4 = /\b(?:one|a\s+single)\s+(?:person|worker|immigrant)\b[^.]{0,40}\b(?:means?|leaves?|pushes?)\b[^.]{0,40}\b(?:unemployed|jobless|without\s+a\s+job|out\s+of\s+work)\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 40;
const WINDOW_EN = 140;

// ─── 豁免 A：概念讨论（概念名 + 框架词共现，防前缀绕过）──────────
const CONCEPT_ZH = /(?:劳动总量谬误|劳动总量|零和就业|岗位零和|工作总量固定)[^。！？\n]{0,20}(?:理论|框架|学说|观点|视角|模型|争论|争议|认为|指出|机制|概念|分析|讨论|说明|介绍|表明|描述|解释|假设|前提|核心|定义|是指|原理|现象|效应|谬误|谬论|说法|看法|误解|误区)/;
const CONCEPT_EN = /\blump[- ]of[- ]labor\s+fallacy\b|\bfixed[- ]pool\s+(?:of\s+jobs|of\s+work)\b[^.]{0,60}\b(?:fallacy|assumption|myth|misconception|theory|concept)\b|\bwork\s+is\s+not\s+a\s+fixed\b/i;

// ─── 豁免 B：纠正句（忽略了补偿机制/取决于需求去向/不应把就业看成固定）──
const CORRECT_ZH = /(?:忽略|无视|跳过|免掉|抹杀)[^。！？]{0,12}(?:补偿|需求|创造|扩张|新岗位|新工作|机制|总需求)|(?:取决于|依赖于|受制于|要看)[^。！？]{0,10}(?:需求|弹性|结构|去向|补偿)|不应(?:该|该)?把[^。！？]{0,8}(?:就业|工作|岗位)[^。！？]{0,8}(?:看成|当成|讲成|理解为)[^。！？]{0,6}(?:固定|零和|份额)|就业(?:并|却)?非[^。！？]{0,8}(?:零和|固定|总量固定)|不是[^。！？]{0,6}(?:固定|零和)(?:的)?(?:份额|总量|博弈)/;
const CORRECT_EN = /\b(?:ignores?|overlooks?|neglects?|misses?)\b[^.]{0,40}\b(?:compensating|demand|new\s+jobs|new\s+work|offsetting|expansion)\b|\bnot\s+a\s+(?:fixed|zero[- ]sum)\b|\b(?:depends?|hinges?)\s+on\b[^.]{0,40}\b(?:demand|elasticity|structure)\b|\bwork\s+is\s+not\s+a\s+fixed\b/i;

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

// 腿②守卫（r375/r377/r378/r379 同款）：紧前否定窗（ZH 6 字 / EN 20 字符，含否定即
//  「并非总量固定/不是抢走岗位」纠正形）+ 对冲短语（腿②前后 20/40 字内出现
//  「不意味着/谬误/理性做法」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未|未必|不一|不|没|无|别)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|高估|低估|夸大|歪曲|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|bias|overestimat\w+|underestimat\w+|does\s+not\s+mean|doesn'?t\s+mean|misread|irrational|shouldn'?t|ignores?|overlooks?)/i;

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

// 签名收集：腿②固定份额断言为锚（窗内），腿①劳动力市场语境在场。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      jobs: resolveGroups(R, [['JOBS_ZH', [JOBS_ZH]]]),
      fixed: resolveGroups(R, [
        ['FIXED_ZH_F1', [FIXED_ZH_F1]],
        ['FIXED_ZH_F2', [FIXED_ZH_F2]],
        ['FIXED_ZH_F3', [FIXED_ZH_F3]],
        ['FIXED_ZH_F4', [FIXED_ZH_F4]],
        ['FIXED_ZH_F5', [FIXED_ZH_F5]],
      ]),
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      jobs: resolveGroups(R, [['JOBS_EN', [JOBS_EN]]]),
      fixed: resolveGroups(R, [
        ['FIXED_EN_F1', [FIXED_EN_F1]],
        ['FIXED_EN_F2', [FIXED_EN_F2]],
        ['FIXED_EN_F3', [FIXED_EN_F3]],
        ['FIXED_EN_F4', [FIXED_EN_F4]],
      ]),
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const jobsM = collect(text, L.jobs);
    if (jobsM.length === 0) continue;
    const fixedM = collect(text, L.fixed, { neg: true }, R);
    if (fixedM.length === 0) continue;
    for (const f of fixedM) {
      const j = jobsM.find(x => dist(x, f) <= L.win);
      if (!j) continue;
      sigs.push({ lang: L.lang, jobs: j.raw, fixed: f.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.jobs + '|' + s.fixed;
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
 * 劳动总量谬误签名：劳动力市场语境 × 固定份额断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectLumpOfLabor(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（劳动总量谬误/lump-of-labor fallacy 本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（忽略了补偿机制 / 取决于需求去向 / 不应把就业看成固定份额）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'lump_of_labor',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '劳动力市场语境「' + x.jobs + '」× 固定份额断言「' + x.fixed + '」'
      : 'labor-market context "' + x.jobs + '" × fixed-pool assertion "' + x.fixed + '"')),
    details: s.lang === 'zh'
      ? '劳动总量谬误(' + sigs.length + '处: 「' + s.fixed + '」把就业总量讲成固定份额，跳过需求扩张与就业重构的补偿机制)(zh)'
      : 'lump-of-labor fallacy(' + sigs.length + 'x: "' + s.fixed + '" treats total work as a fixed pool, ignoring demand expansion and job reallocation)(en)',
    guidance: '劳动总量谬误（lump of labor fallacy / fixed work-pool assumption）：把就业总量看成固定不变的份额，任何一员进入劳动力市场都被认为直接挤占他人岗位——移民/女性就业/机器自动化/延迟退休都被讲成零和抢夺。谬误在于跳过补偿机制：自动化降低成本会扩张总需求并创造新岗位，生产率提升重构而非消灭就业总量，新增劳动者既供给劳动也创造需求。就业是供需匹配的结果，不是「一个人占了坑另一个就没活干」的零和分配：「机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的」「移民抢走了本地人的饭碗，一个人占了坑，另一个人就只能失业，工作总量就那么多」「Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed」「生产效率越高失业越严重，产出总量有上限，干得快的人把慢的人的饭碗砸了」。正当做法是先把机制对齐：区分总量与结构（自动化消灭特定岗位但总需求扩张会创造新岗位）、说明补偿机制（效率红利既降低价格也创造新的服务需求）、给出固定份额前提的定性（把就业看成固定份额的争夺忽略了总需求的扩张）；泛化零和断言无就业语境（贸易零和/谈判零和）不在本族射程，归 zero_sum_fallacy；具体裁员叙事无固定份额断言（公司裁员 200 人）天然不判。',
    tags: ['economics', 'labor-economics', 'lump-of-labor-fallacy', 'zero-sum', 'employment'],
  };
}

module.exports = {
  detectLumpOfLabor,
  __internals: () => ({
    JOBS_ZH, JOBS_EN,
    FIXED_ZH_F1, FIXED_ZH_F2, FIXED_ZH_F3, FIXED_ZH_F4, FIXED_ZH_F5,
    FIXED_EN_F1, FIXED_EN_F2, FIXED_EN_F3, FIXED_EN_F4,
    WINDOW_ZH, WINDOW_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
