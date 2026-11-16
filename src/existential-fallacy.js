/**
 * src/existential-fallacy.js — 「存在谬误」检测器
 * （第 259 个判别维度，r366 立项）
 *
 * [r366 立项] decision 本体在当前引擎（v6.8.188，258 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证（scripts/round-366/probe-existential-fallacy.js，直调
 *     gate.js v6.8.188）：本族 10 条攻击样本中 2 条**真零命中**
 *     （gate.action=pass，零维度代拦）：
 *     A7 条件前提→存在「如果按下这个按钮就能获得奖励，那么一定存在
 *     获得过奖励的人。」；A9 定义前提→存在「凤凰被定义为百鸟之王，
 *     因此存在百鸟之王。」其余 8 条虽非 pass，但归因维度是
 *     quantifier_scope_shift（量词辖域）/perfect_error 等代拦，判的
 *     不是「无存在承诺前提→存在结论」的推论方向，且代拦只覆盖
 *     「全称→存在」一个形状，条件/规范/定义前提形状完全无覆盖。
 *   · 外部来源（真实，未编造）：arXiv 2405.02318「Translating natural
 *     language to first-order logic for logical fallacy detection」
 *     （Lalwani et al.，HN Algolia 258 分，
 *     https://news.ycombinator.com/item?id=43257719）——框架 NL2FOL
 *     把自然论证形式化为 FOL 后用 SMT 求解器检验逻辑有效性，其有效性
 *     判定的经典失效族之一即存在谬误（布尔解释下全称命题 vacuously
 *     true、不断言对象存在）。GitHub 搜索（fallacy detection
 *     argument，sort=stars）最高 1★，无成熟代码方案可参考。心虫判据
 *     为自有纯规则实现（零 LLM 依赖，不引入 FOL 求解器）。侦察落盘
 *     /tmp/hf-scout-round366.txt。
 *
 * 辨别的族：存在谬误（existential fallacy / illicit subalternation）——
 * 从一个**不含存在承诺**的前提集推出**存在性结论**，而没有为该结论
 * 断言对象的存在提供任何独立证据。亚里士多德-布尔传统：全称命题
 * （「所有 S 都是 P」）不断言任何 S 存在（vacuously true），条件命题
 * （「若 P 则 Q」）不断言 P 有实例，规范命题（「X 应当 Y」）不断言
 * 有 X 在 Y，定义命题（「X 被定义为 Y」）只是元语言约定不断言实例。
 * 因此这四类前提推不出「存在……」结论。
 *   「所有喝过这款茶的人都改善了睡眠，所以存在喝茶助眠的人。」
 *   「如果按下这个按钮就能获得奖励，那么一定存在获得过奖励的人。」
 *   「每个人都应该遵守交通规则，所以存在遵守交通规则的人。」
 *   「凤凰被定义为百鸟之王，因此存在百鸟之王。」
 *   All unicorns have horns, so there exists a unicorn with a horn.
 *   There must be a perfect solution, because every problem can be solved.
 *
 * 与既有维度的边界（r366 归因，刻意错开）：
 *   · quantifier_scope_shift（第258维）管**量词辖域顺序移位**
 *     （∀x∃y 偷换 ∃y∀x），腿②是存在量词但必须与腿①辖域前提
 *     构成同谓域共享；本族管**推论方向本身**（无存在承诺前提→存在
 *     结论），不要求谓域共享、不涉及辖域顺序——条件/规范/定义前提
 *     形状是 qss 结构（四腿：辖域前提×存在×推断×谓域共享）覆盖不到
 *     的（探针实证：A7/A9 两条在 qss 在场时仍零命中）。
 *   · undistributed_middle（第229维）管三段论中项不周延（双前提
 *     共享谓项×主项不同×结论等同）；本族单前提即可成立，结论是
 *     **存在断言**而非主项等同。
 *   · affirming_the_consequent / denying_the_antecedent /
 *     conditional_transposition 管条件句方向错误；本族句中条件
 *     前提本身合法，错的是从条件推出存在实例。
 *   · hasty_generalization 管证据不足的归纳；本族是**演绎形式
 *     无效**，前提可以完全为真而结论无据。
 *
 * 判据（双腿共现 + 邻近窗 + 豁免组，缺一不判）：
 *   · 腿① NON_EXISTENTIAL_PREMISE 无存在承诺前提：全称量词前提
 *     （所有/全部/凡是/一切/任何/每个；EN all/every/each/any/no/
 *     none）、条件前提（如果/若/倘若/只要/一旦；EN if/whenever/
 *     provided）、规范前提（应该/应当/必须/理应；EN should/ought/
 *     must）、定义前提（被定义为/所谓/指的是；EN is defined as/
 *     by definition/refers to）。**前提段内不得出现存在承诺词**
 *     （有/存在/有些/有的/例如/比如；EN some/something/there is）
 *     ——带存在承诺的前提是非空域，推出存在结论合法（豁免）。
 *   · 腿② EXISTENTIAL_CONCLUSION 存在性结论：结论段出现存在断言
 *     （存在/必定存在/一定存在/必有/有大把/大有人在；EN there
 *     is/are、there exists、must be），且结论段跟在前提段之后
 *     （跟句模式）或带推断词前置（倒装模式「一定存在X，因为所有Y」）。
 *   · 邻近窗：前提段与结论段之间隔 ≤3 个子句（长文中远离的段落
 *     可能是两个独立话题）。
 *   · 豁免（全部可负例注入置空）：EXISTENCE_COMMITMENT 前提带存在
 *     承诺、MATH_CONSTRUCT 数学合法存在构造、OBSERVATION 直接观察/
 *     经验报告、META_CONCEPT 谬误概念转述与教学、TEACH 教学语境、
 *     HEDGE 对冲结论、NEGATION_META 否定转移（「不能推出存在」——
 *     元层面正确陈述）、COHERENCE 正当的多因/并列陈述（结论只复述
 *     前提的谓域、不做存在断言时本就不命中腿②）。
 *
 * 为什么取 VERIFY 级：存在结论本身**偶然可能为真**（茶可能真有
 * 人喝过、问题可能真有完美解），错的是**推理形式**没给存在性提供
 * 支撑；verify 的含义是「该存在断言缺少有效推理支撑，需补上实例
 * 证据或独立的存在性论证」。与 r206-r259 同口径只登记 VERIFY。
 */
'use strict';

// ─── 腿①：全称量词（中文，裸名词形态；161 轮教训：去后缀仍命中）────────
// 不限句首（「显然所有…」「数据显示凡是…」前缀常见）。长的在前。
const UNIV_ZH = [
  /(?:所有|全部|凡是|凡|一切|任何|每个|每一|个个|统统|皆|清一色)(?:的)?/,
];

const UNIV_EN = [
  /\b(?:all|every|each|any)\s+(?:the\s+)?(?:single\s+)?/i,
  // no/none 也是无存在承诺前提（「No unicorn can fly」不断言独角兽存在）
  /\bno\s+[a-z]/i, /\bnone\s+of\b/i,
];

// ─── 腿①：条件前提标记（中文/英文）────────────────────────────────────
// 条件命题不断言前件有实例。「只要/一旦/倘若」与「如果/若」同族。
const COND_ZH = [
  /(?:如果|若|倘若|倘|只要|一旦|设若|若是)/,
];

const COND_EN = [
  /\bif\b/i, /\bwhenever\b/i, /\bprovided\b/i, /\bassuming\b/i,
];

// ─── 腿①：规范前提标记（中文/英文）────────────────────────────────────
// 规范命题（应当/必须）描述应有状态，不断言现实实例。
const NORM_ZH = [
  /(?:应该|应当|应该|理应|须要|必须|务必|理当)/,
];

const NORM_EN = [
  /\bshould\b/i, /\bought\s+to\b/i, /\bmust\b/i, /\bneeds?\s+to\b/i,
];

// ─── 腿①：定义前提标记（中文/英文）────────────────────────────────────
// 定义是元语言约定，不断言被定义对象存在（「凤凰被定义为百鸟之王」
// 不蕴含凤凰存在）。
const DEF_ZH = [
  /被定义为/, /所谓/, /指的是/, /是指/, /定义为/, /的含义是/, /即所谓/,
];

const DEF_EN = [
  /\bis\s+defined\s+as\b/i, /\bare\s+defined\s+as\b/i,
  /\bby\s+definition\b/i, /\brefers?\s+to\b/i, /\bmeans?\s+(?:a|an|the)\b/i,
];

// ─── 腿①：存在承诺词（前提段出现即豁免——非空域，合法推出存在结论）────
// 这是本族与「带存在前提的合法推理」的分界。
const EXISTENCE_ZH = [
  /(?:有些|有的|某些|不少人|许多人|很多人|有人|有人)/,
  /存在/, /(?:例如|比如|举例|举例说|譬如)/,
];
const EXISTENCE_EN = [
  /\bsome\b/i, /\bsomeone\b/i, /\bsomething\b/i,
  /\bthere\s+(?:is|are|exists?)\b/i, /\bexists?\b/i,
  /\bfor\s+(?:example|instance)\b/i,
];

// ─── 腿②：存在性结论标记（中文，含裸名词与倒装形）────────────────────
// 「存在」「有」必须是断言形态（存在 X / 有 X），不收「有害」「认为」
// 「有没有」这类非断言组合（与 most-transitivity 同口径：谓词分界
// 用断言结构而非裸字）。
const EXIST_CONCL_ZH = [
  /(?:所以|因此|因而|故而|可见|可知|这说明|这表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:存在|必定存在|一定存在|必然存在|必有|有大把|不乏|大有人在)/,
  /(?:一定|必然|必定|势必)[^。；，,]{0,20}?(?:存在|有)/,
  /(?:存在|必有)[^。；，,]{0,24}(?:的|这样|如此)/,
  /(?:可见|可知|这说明)[^。；，,]{0,30}(?:大有人在|不乏其人|比比皆是)/,
];

const EXIST_CONCL_EN = [
  /\b(?:so|therefore|thus|hence|then|which\s+means)\b[^.]{0,60}?\bthere\s+(?:is|are|must\s+be|exists?)\b/i,
  /\bthere\s+(?:must\s+be|has\s+to\s+be|exists?|is|are)\b[^.]{0,40}/i,
  /\b(?:must|has\s+to)\s+(?:therefore\s+)?exist\b/i,
];

// ─── 豁免：数学合法存在构造（对每个实数 x 存在 y 使 x+y=0）───────────
// r366 修复教训：首版英文腿收了裸 /\bexists?\s+(?:a|an|the)?...\b/，把
// "there exists a unicorn with a horn"（本族标准攻击形）误判为数学构造
// 而全数误杀（实测 EN 2/2 MISS）。修正：数学存在构造必须有**量词域
// 共现**（for every/each/any ... exists y such that），裸 "exists a X
// with Y" 不是数学构造而是日常存在断言。
const MATH_CONSTRUCT = [
  /对每[个种]/, /对任意/, /任给/, /对于任意/,
  /实数/, /整数/, /自然数/, /素数/, /集合/, /映射/, /函数/,
  /\bfor\s+(?:every|each|any)\s+\w+[^.]{0,60}\bexists?\b/i,
  /\bexists?\s+(?:a|an|the)?\s*(?:unique\s+)?\w+\s+such\s+that\b/i,
];

// ─── 豁免：直接观察/经验报告（我看到/调研数据显示——存在性有经验证据）
const OBSERVATION = [
  /(?:我看(?:到|见)|调查(?:显示|发现)|调研(?:显示|发现)|数据(?:显示|表明)|统计(?:显示|表明)|研究(?:发现|表明)|实验(?:证明|表明)|记录(?:显示|表明)|观测(?:到|发现)|发现|观察(?:到|发现))/,
  /\b(?:I\s+)?(?:saw|see|observed|found)\b/i, /\b(?:data|survey|study|research|experiment|records?)\s+(?:show|shows|found|indicate|indicates|suggest|suggests)\b/i,
  /\baccording\s+to\b/i, /\breport(?:ed|s)?\b/i,
];

// ─── 豁免：谬误概念转述/教学（「存在谬误是指…」——讨论谬误本身不是犯谬误）
const META_CONCEPT = [
  /存在谬误/, /存在推论/, /布尔解释/, /空真/, /空虚真/,
  /existential\s+fallacy/i, /illicit\s+subalternation/i,
  /vacuously\s+true/i, /existential\s+(?:import|commitment)/i,
  /形式逻辑/, /谓词逻辑/, /一阶逻辑/, /first[- ]order\s+logic/i,
];

// ─── 教学语境（只收句法性/动词性标记——r253 教训：不收可当主语的裸名词）
const TEACH = [
  /例如/, /比如/, /举例/, /举个/, /例题/, /课本里/, /教材里/, /课堂上/, /课堂里/,
  /老师(?:说|讲|在)/, /学生(?:问|答|在)/, /作业里/, /习题/, /讲解/, /假设/, /设想/, /反例/,
  /(?:for|as an?)\s+example/i, /for instance/i, /suppose/i, /consider/i,
  /in (?:this|the) (?:lecture|class|textbook)/i,
];

// ─── 对冲结论——概率化/限定化的结论不作谬误判定
const HEDGE = [
  /可能/, /也许/, /大概/, /或许/, /未必/, /不一定/, /恐怕/, /看来/,
  /似乎/, /好像/, /估计/, /八成/, /倾向于/,
  /\bmaybe\b/i, /\bperhaps\b/i, /\bpossibly\b/i, /\bmight\b/i, /\bprobably\b/i,
  /\bit seems\b/i, /\bappears\b/i,
];

// ─── 否定转移：「不能推出存在…」是元层面正确陈述（本维度保护的行为）
const NEGATION_META = [
  /(?:不能|无法|不足以|推不出|得不出|证明不了)[^。；，,]{0,24}?(?:存在|有)/,
  /(?:并非|不等于|不代表|不意味着)[^。；，,]{0,24}?(?:存在|有)/,
  /\b(?:cannot|can't|does\s+not|doesn't|do\s+not|don't)\b[^.]{0,40}\b(?:exist|there\s+(?:is|are))\b/i,
];

// 疑问句——提问不是存在断言。
function _isQuestion(text) {
  return /[?？]/.test(text) || /^(?:请问|试问|难道|是否|是不是|能不能|为什么|怎么)/.test(text.trim());
}

// [r366] 未命中返回值。引擎惯例：维度函数永不返回 null，未命中返回零分
// 对象（对照 src/undistributed-middle.js 的 _MISS）。src/index.js 的
// dimMap 对所有维度一律无条件读 `.score`，返回 null 会让 checkOutput
// 在任何不命中输入上抛 TypeError。
function _MISS() {
  return { hit: false, score: 0, detail: '', count: 0, name: 'existential_fallacy' };
}

// ─── 子句切分：中文按句内停顿（逗号/冒号/分号）与句末标点同级切分
// （「所有A是B，所以存在C」是逗号分句）；英文只按句末标点切（三段论
// 用句号分句，逗号是句内停顿）。与 undistributed-middle 同口径。
function _splitClauses(text, isEN) {
  const s = String(text || '');
  const segs = isEN
    ? s.split(/[.;!?\n]+|(?<=[.]) /).map(x => x.trim()).filter(Boolean)
    : s.split(/[。；;!！?？\n]+|(?<=[.]) |[，,：:]/).map(x => x.trim()).filter(Boolean);
  return segs;
}

// ─── 主检测函数。返回 { score, name, hit, detail, legs }（命中）或零分
// 对象（未命中）——**永不返回 null**。
// 负例注入测试通过把常量置空验证每条腿承重。
function checkExistentialFallacy(text) {
  const raw = String(text || '');
  if (!raw || raw.length < 8) return _MISS();
  if (_isQuestion(raw)) return _MISS();

  const isEN = /[a-zA-Z]{3,}/.test(raw) && !/[\u4e00-\u9fa5]/.test(raw);
  const segs = _splitClauses(raw, isEN);
  // r366 教训：首版设 segs.length < 2 硬门禁，英文三段论整句常无句号
  // 分隔（"All unicorns have horns, so there exists a unicorn with a
  // horn." 按句号切分后只有 1 段），全部英文标准形被门禁挡在判据之前
  // （EN 2/2 MISS）。修正：只要非空即可，同段共现由腿②的位置有序
  // 逻辑（premisePos !== conclIdx）保证不是同语复述。
  if (segs.length < 1) return _MISS();

  // 整句级豁免（先判，全部可负例注入置空）
  for (const re of META_CONCEPT) if (re.test(raw)) return _MISS();
  for (const re of MATH_CONSTRUCT) if (re.test(raw)) return _MISS();
  for (const re of OBSERVATION) if (re.test(raw)) return _MISS();
  for (const re of TEACH) if (re.test(raw)) return _MISS();
  for (const re of HEDGE) if (re.test(raw)) return _MISS();
  for (const re of NEGATION_META) if (re.test(raw)) return _MISS();

  const UNIV = isEN ? UNIV_EN : UNIV_ZH;
  const COND = isEN ? COND_EN : COND_ZH;
  const NORM = isEN ? NORM_EN : NORM_ZH;
  const DEF = isEN ? DEF_EN : DEF_ZH;
  const EXISTENCE = isEN ? EXISTENCE_EN : EXISTENCE_ZH;

  // 腿①：找无存在承诺前提段。一个段只要含任一族前提标记、且**前提
  // 标记之前**的文本不含存在承诺词，即是候选前提。
  // r366 教训：首版做段级存在承诺检查（整段任何位置出现 some/there
  // is 即取消前提资格），英文标准形 "All unicorns have horns, so there
  // exists a unicorn with a horn" 里 "there exists" 在**结论侧**却让
  // 前提整段作废（EN 2/2 MISS）。修正：存在承诺只看到前提标记**之前**
  // 的文本——「有些 S 是 P，所以存在 S」的前提自带承诺在前提标记前；
  // 而结论侧的存在断言不污染前提资格。
  const premiseIdxs = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    let premisePos = -1, premiseRe = null;
    for (const re of [...UNIV, ...COND, ...NORM, ...DEF]) {
      const pm = seg.match(re);
      if (pm) { premisePos = pm.index; premiseRe = re; break; }
    }
    if (premisePos === -1) continue;
    // 存在承诺词出现在前提标记之前 → 前提自带存在承诺，非空域（豁免）
    const before = seg.slice(0, premisePos);
    if (EXISTENCE.some(re => re.test(before))) continue;
    premiseIdxs.push(i);
  }
  if (premiseIdxs.length === 0) return _MISS();

  // 腿②：找存在性结论段，且与某前提段距离 ≤3 子句（邻近窗）。
  // 倒装模式（结论在前、前提在后作理由）也覆盖：结论段索引小于
  // 前提段索引时同样检查窗距。
  // r366 教训：英文三段论按句号切分后前提与结论常在**同一段**内
  // （"All unicorns have horns, so there exists a unicorn with a horn."
  // 整句无句号分隔），简单要求 pi!==ci 会漏掉全部英文标准形。修正：
  // 同段共现时要求前提标记与结论标记在段内**位置有序**（前提在前
  // 即顺推、结论在前即倒装），保证「前提→结论」的推论方向真实存在；
  // 只有当前提标记与结论标记位置重合（同语复述）才豁免。
  const CONCL = isEN ? EXIST_CONCL_EN : EXIST_CONCL_ZH;
  let best = null;
  for (let ci = 0; ci < segs.length; ci++) {
    let conclMatched = null;
    for (const re of CONCL) {
      const m = segs[ci].match(re);
      if (m) { conclMatched = { re, idx: m.index }; break; }
    }
    if (!conclMatched) continue;
    for (const pi of premiseIdxs) {
      if (Math.abs(pi - ci) > 3) continue;
      if (pi === ci) {
        // 同段共现：前提标记须与结论标记错开位置（顺推：前提在前；
        // 倒装：结论在前），同位置重合视为同语复述，豁免。
        let premisePos = -1;
        for (const re of [...UNIV, ...COND, ...NORM, ...DEF]) {
          const pm = segs[pi].match(re);
          if (pm) { premisePos = pm.index; break; }
        }
        if (premisePos === conclMatched.idx) continue;
      }
      best = { premiseIdx: pi, conclIdx: ci, seg: segs[ci] };
      break;
    }
    if (best) break;
  }
  if (!best) return _MISS();

  const premiseSeg = segs[best.premiseIdx];
  const conclSeg = segs[best.conclIdx];

  // 前提族归类（供 detail 报告）
  let premiseKind = 'universal';
  if ([...UNIV].some(re => re.test(premiseSeg))) premiseKind = isEN ? 'universal (all/every/no)' : 'universal (全称)';
  else if ([...COND].some(re => re.test(premiseSeg))) premiseKind = isEN ? 'conditional (if/whenever)' : 'conditional (条件)';
  else if ([...NORM].some(re => re.test(premiseSeg))) premiseKind = isEN ? 'normative (should/must)' : 'normative (规范)';
  else if ([...DEF].some(re => re.test(premiseSeg))) premiseKind = isEN ? 'definitional (defined as)' : 'definitional (定义)';

  return {
    score: 0.7,
    name: 'existential_fallacy',
    hit: true,
    detail: `存在谬误：无存在承诺前提（${premiseKind}）推不出存在性结论——布尔解释下全称/条件/规范/定义前提均不断言对象存在（vacuously true），存在断言需独立实例证据${isEN ? '(en)' : ''}`,
    legs: {
      premise: premiseSeg,
      conclusion: conclSeg,
      premiseKind,
      windowGap: Math.abs(best.premiseIdx - best.conclIdx),
    },
    count: 1,
  };
}

module.exports = {
  checkExistentialFallacy,
  // 导出常量供负例注入测试逐条置空验证承重
  UNIV_ZH, UNIV_EN, COND_ZH, COND_EN, NORM_ZH, NORM_EN, DEF_ZH, DEF_EN,
  EXISTENCE_ZH, EXISTENCE_EN, EXIST_CONCL_ZH, EXIST_CONCL_EN,
  MATH_CONSTRUCT, OBSERVATION, META_CONCEPT, TEACH, HEDGE, NEGATION_META,
};
