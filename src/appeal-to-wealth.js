/**
 * src/appeal-to-wealth.js — 「诉诸财富/诉诸贫穷谬误」检测器（第 186 个判别维度）
 *
 * [r189 立项] 轮前探针 /tmp/hf-probe-r189.js 直调 gate()（v6.8.116 / 185 维引擎）
 * 三候选族缺口实证：
 *   · 零和思维（fixed-pie）：攻击 6/6 被 fallacies/absolute_claim/confidence
 *     代拦且良性 2 条误伤——不是干净缺口，淘汰。
 *   · 均值回归（regression to the mean）：攻击 4/6 零命中，但良性 3 条被
 *     contradiction/post_hoc 误伤（含「故障排除后恢复」被 post_hoc 判
 *     rewrite）——存量误伤未清，淘汰。
 *   · 诉诸财富/诉诸贫穷：攻击 6 条中 4 条真零命中（身家几十亿/穷得叮当响/
 *     EN billionaire sound/EN richest superior），6 条边缘良性零误伤
 *     （亲身经历建议/审计业绩/巴菲特也犯错/按证据评估/EN first-hand
 *     experience/EN poverty does not determine）——唯一干净缺口，立项。
 *
 * 辨别的族：「诉诸财富/诉诉贫穷谬误」（argumentum ad crumenam /
 * argumentum ad lazarum）——把个人的**财富状态**（有钱/富翁/身家/亿万/
 * 成功人士）或**贫困状态**（穷/贫寒/穷得叮当响/底层出身）当作其**观点
 * 正确性、判断力、可信度、认知水平或言论价值**的证据：
 *   他那么有钱，说的话当然有道理，人家身家几十亿，认知能不比我们高吗？
 *   比尔·盖茨这么成功，他关于慈善的建议一定是对的，听成功人士的总没错。
 *   马云说的都是真理，他能赚到几千亿身家，眼光还能错吗？
 *   一个穷得叮当响的人，观点能有什么价值？
 *   他穷过苦日子，所以最懂老百姓的心，说的话才真正靠谱。
 *   He is a billionaire, so his advice on the economy must be sound.
 *   She married into one of the richest families, so her judgment is
 *   obviously superior.
 *
 * 为什么是无效推理：财富与贫困是**处境属性**，观点对错、判断力高低、
 * 结论可信度是**认知属性**，两者之间没有可传递的证据链——有钱不增加
 * 任何命题为真的概率，穷不减少任何论证的有效性。该谬误把「经济地位」
 * 偷换成「认知权威」，在名人言论、商业建议、阶层讨论中极常见，且
 * 常以反问句（眼光还能错吗）与顺带结论（听成功人士的总没错）形态出现。
 *
 * 与既有维度的边界：
 *   · appeal_to_authority 管**资质类**权威（名校/博士/头衔/获奖/执业——
 *     与论题相关的资格），本族腿①刻意只收**财富/贫困状态词**、不收任何
 *     资质词；两族词表互斥。
 *   · halo_effect 管**无关正面特征迁移**（外貌/名气/包装/口才），本族
 *     管经济地位→认知有效性的证据结构，不收外貌名气类词。
 *   · absolute_claim / confidence 只管断言强度，本族有明确的「状态词×
 *     有效性结论×连接」三件结构（probe 中 absolute_claim 对 2 条本族
 *     样本的沾边命中是泛化绝对语言，非本族设计）。
 *   · unsupported_claim / no_fallback 管依据缺失的强度，本族依据在场
 *     （财富状态）但依据类型无效。
 *
 * 判据（两腿 + 连接，缺一不判）：
 *   · 腿① STATUS 财富/贫困状态词（ZH/EN，全部裸名词形态——161 轮教训：
 *     同族词去掉前后缀仍独立命中；不收裸「穷」（穷尽/穷尽可能误伤）、
 *     不收裸「富」（丰富误伤）、不收裸「成功」（实验成功误伤）、不收裸
 *     「底层」（底层逻辑/架构误伤），均以限定搭配收录）；
 *   · 腿② VALIDITY 认知有效性结论（有道理/是对的/高明/靠谱/眼光好/
 *     最懂/更懂…；EN sound/right/superior/credible/gets it…）——必须
 *     是**对观点/判断/言论有效性**的断言，不收「值得参考」（经验价值）、
 *     不收「犯错/失误」（错误承认）、不收「业绩/收益」（业绩数据）；
 *   · 腿③ 连接——路线 A（正向断言）：腿①与腿②之间有推断连接词
 *     （所以/当然/一定/因为…；EN so/because/must/obviously…）且间距
 *     ≤50 字（EN 110 字符）；路线 B（反问断言）：腿① ±50 字（EN 110）
 *     内有反问有效性形（眼光还能错吗/能有什么价值；EN how could he
 *     be wrong），反问自身携带推断、免连接词。
 *
 * 为什么取 VERIFY 级：单句可能是正当的阶层事实陈述（「富裕家庭平均
 * 教育投入更高」）、正当的人物叙事（「他白手起家创立了公司」）、正当
 * 的批评（「富人也会犯错」），rewrite/block 会误伤（与 r672-r705 全部
 * 评价/诉诸族同口径）。verify 的含义是「这段以财富/贫困状态为依据的
 * 有效性断言需要补认知证据」——调用方应要求给出与财富状态无关的论据。
 *
 * 明确不判的（豁免）：
 *   · 评析这套话术本身（诉诸财富是一种逻辑谬误/argumentum ad crumenam/
 *     逻辑谬误/老师/课堂/textbook…）；
 *   · 对冲结论（可能/也许/往往/maybe…——概率化结论不作谬误判定，看 raw
 *     原串）；
 *   · 有效性断言前的否定（不是因为眼光好/观点不总是对的/does not
 *     determine whether someone is right——否认状态与有效性的关联是
 *     正确判别）；
 *   · 经验/业绩依据（建议来自亲身经历/历史业绩经过审计/first-hand
 *     experience——依据是亲历或实测数据而非财富状态，天然不判）；
 *   · 无腿②的纯状态陈述（他有钱买房/身家清白/穷人更需要保障——只有
 *     状态词、无有效性断言）。
 */
'use strict';

// ─── 腿① STATUS 财富/贫困状态断言（中文）────────────────────────
// 限定搭配收录：不收裸「穷/富/成功/底层/收益」——「穷尽」「丰富」
// 「实验成功」「底层逻辑」「收益稳定」全是高频良性形。
const STATUS_ZH = new RegExp(
  // a 富有路线裸名词形态
  '有钱人|有钱|富翁|富豪|财阀|大户人家|大户|身家|家产|富贵|巨富|首富|大亨|大佬|富人|富裕|成功人士|大老板|千万富翁|亿万富翁|顶级富豪|白手起家|财务自由|财富自由|有钱人的世界' +
  // b 成功修饰形（限成功+人/修饰副词，不收裸「成功」）
  '|(?:这么|那么|很|非常|足够|真|挺|太)成功|成功的(?:企业家|商人|老板|创业者|人士|人物|精英)' +
  // c 赚钱形
  '|赚钱|挣钱|赚(?:到|了)?[一两三四五六七八九十百千万亿几\\d]+[块钱元]?' +
  // d 贫困路线（不收裸「穷」「富」）
  '|穷人|穷困|贫穷|贫寒|穷苦|一贫如洗|家徒四壁|穷得叮当响|穷得揭不开锅|苦出身|穷过苦日子|穷过|吃过苦|苦日子|底层(?:人民|百姓|民众|大众|家庭|出身|长大|生活|打拼|摸爬滚打)|寒门'
);

// 英文腿与中文对齐：a rich/wealthy/billionaire/tycoon、b made
// fortune/worth billions、c self-made/rags-to-riches、d poor/poverty/
// broke/the poor 四支。\brich\b 保留（rich data/experience 等良性形
// 由腿②纪律挡住——无有效性断言不判）。
const STATUS_EN = new RegExp(
  // a billionaire / millionaire / tycoon / rich / wealthy
  "\\b(?:billionaire|millionaire|multi[- ]?millionaire|tycoon|magnate|rich|wealthy|affluent|loaded|the rich)\\b" +
  // b made his fortune / made billions / worth billions / net worth
  "|\\bmade (?:his |her |them )?(?:a )?(?:fortune|millions|billions)\\b" +
  "|\\bworth billions\\b|\\bnet worth\\b" +
  // c self-made / rags-to-riches / one of the richest
  "|\\bself[- ]made (?:man|woman|millionaire|billionaire)\\b" +
  "|\\brags[- ]to[- ]riches\\b|\\bone of the richest\\b" +
  // d poor / poverty / broke / the poor / grew up poor
  "|\\b(?:poor|poverty|broke|penniless|destitute|dirt[- ]?poor|underprivileged)\\b" +
  "|\\b(?:from|grew up in) (?:a )?(?:poor|humble|working[- ]class) (?:background|family|upbringing)\\b" +
  "|\\bgrew up (?:poor|in poverty)\\b|\\bthe poor\\b",
  'i'
);

// ─── 腿② VALIDITY 认知有效性结论（中文）────────────────────────
// 只收「对观点/判断/言论有效性」的断言。刻意不收：值得参考（经验
// 价值）、犯错/失误（错误承认）、业绩/收益/成绩（实测数据）、
// 评估/分析（方法论动作）、信任裸形（信他/听他的，误伤面大）。
const VALIDITY_ZH = new RegExp(
  '有道理|在理|说得对|是对的|没错|真理|正确|高明|靠谱|值得信|可信|水平高|有水平|认知高|有见识|有远见|眼光好|眼光准|眼光独到|判断力强|金玉良言|至理名言|最懂|更懂|才懂|真正懂|见过人间疾苦|有见地|有智慧'
);

// 英文有效性结论：a sound/right/superior/credible、b makes sense/
// gets it、c knows real life/understands better、d speaks for us。
const VALIDITY_EN = new RegExp(
  "\\b(?:sound|correct|reliable|credible|trustworthy|valid|wise|superior|insightful|spot on|on point|makes sense|can be trusted|gets it|sharp|clued in|right)\\b" +
  "|\\bknows? (?:real )?life\\b" +
  "|\\b(?:understand|know)s?[^.]{0,30}\\bbetter\\b" +
  "|\\bspeaks for (?:us|ordinary|working|regular)\\b",
  'i'
);

// ─── 反问断言腿（路线 B：反问自身携带推断，免连接词）──────────────
// 只收「不可能错/没有价值」的反问断言形；不收裸「错了吗/会错吗」
// ——那是 genuine question（「有钱人这次错了吗」是正确质疑）。
const RHETORICAL_ZH = new RegExp(
  '还能错吗|怎么可能错|怎么会错|怎能错|岂会错|能有什么价值|有什么价值|有何价值|能值几个钱|值几个钱|能不对吗|有什么不对|懂什么'
);
const RHETORICAL_EN = new RegExp(
  "(?:how|who) could [^.]{0,24} be wrong" +
  "|couldn'?t possibly be wrong|can'?t possibly be wrong" +
  "|(?:what|how much) value (?:is|are)",
  'i'
);

// ─── 连接词（路线 A）────────────────────────────────────────────
const CONNECTOR_ZH = new RegExp(
  '所以|因此|因而|可见|足见|故而|说明|证明|当然|必然|一定|肯定|显然|无疑|既然|因为|足以说明|足以证明|正说明|这就意味着'
);
const CONNECTOR_EN = new RegExp(
  "\\b(?:so|therefore|thus|hence|because|since|must|obviously|clearly|certainly|of course|proves|shows|means)\\b",
  'i'
);

// ─── 豁免：评析话术本身 / 概念教学 ──────────────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:诉诸财富|诉诸贫穷|诉诸金钱|诉诸贫富|拜金谬误)' +
  '|(?:argumentum ad crumenam|argumentum ad lazarum|appeal to wealth|appeal to poverty|ad crumenam|ad lazarum)' +
  '|(?:逻辑谬误|形式谬误|非形式谬误|谬误清单|常见谬误|识别谬误|辨别谬误|谬误分析)' +
  '|(?:老师|课堂|教材|课本|教案|教授|讲义|课文)'
);
const META_EXEMPT_EN = new RegExp(
  "\\bappeal to (?:wealth|poverty|richness)\\b" +
  "|\\bargumentum ad (?:crumenam|lazarum)\\b" +
  "|\\b(?:logical|informal) fallac(?:y|ies)\\b" +
  "|\\b(?:textbook|lecture|professor|teacher|classroom)\\b",
  'i'
);

// ─── 豁免：对冲结论（看 raw 原串）───────────────────────────────
const HEDGE_ZH = new RegExp('可能|也许|或许|大概|恐怕|似乎|好像|说不定|未必|不一定|待定|存疑');
const HEDGE_EN = new RegExp("\\b(?:maybe|perhaps|might|probably|uncertain|not sure|debatable)\\b", 'i');

// ─── 有效性断言的否定守卫（腿②前置 10 字短语 / 前置 4 字单字否定）──
// 「不是因为眼光好」「观点不总是对的」「does not determine whether
// someone is right」——否认状态与有效性关联是正确判别。
const NEG_ZH = new RegExp('不是因为|不能说明|并非因为|未必|不一定|不代表|不等于|不意味着|说明不了|推不出|很难说|不见得|不能证明|证明不了|谈不上|算不上|不总是|不完全|无从谈起');
const NEG_EN = new RegExp("(?:does not|doesn'?t|cannot|can'?t|isn'?t|aren'?t|not necessarily|no (?:reason|basis|evidence)|hardly|far from)", 'i');
// 单字否定窗（前置 4 字内的 不/没/未/非/别）——与 NEG_ZH 短语互补，
// 「不是因为眼光好」「观点不总是对的」的短语否定落在 4 字窗外时由它兜底。
const NEG1_ZH = /[不没未非别]/;

const NO_HIT = { hit: false, score: 0, detail: '', count: 0 };

/** 收集一个正则的全部命中（含位置） */
function _matches(text, re) {
  const out = [];
  if (!re) return out;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m[0].length === 0) g.lastIndex++;
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToWealth(text, inject) {
  if (!text || text.length < 6) return { ...NO_HIT };
  const R = inject || {};
  const ST_Z = R.STATUS_ZH || STATUS_ZH;
  const ST_E = R.STATUS_EN || STATUS_EN;
  const VA_Z = R.VALIDITY_ZH || VALIDITY_ZH;
  const VA_E = R.VALIDITY_EN || VALIDITY_EN;
  const RH_Z = R.RHETORICAL_ZH || RHETORICAL_ZH;
  const RH_E = R.RHETORICAL_EN || RHETORICAL_EN;
  const CO_Z = R.CONNECTOR_ZH || CONNECTOR_ZH;
  const CO_E = R.CONNECTOR_EN || CONNECTOR_EN;
  const ME_Z = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const ME_E = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const HE_Z = R.HEDGE_ZH || HEDGE_ZH;
  const HE_E = R.HEDGE_EN || HEDGE_EN;
  const NG_Z = R.NEG_ZH || NEG_ZH;
  const NG_E = R.NEG_EN || NEG_EN;
  const NG1_Z = R.NEG1_ZH || NEG1_ZH;

  // 评析话术本身 → 不是运用它
  if (ME_Z.test(text) || ME_E.test(text)) return { ...NO_HIT };
  // 对冲结论 → 概率化表述不作谬误判定
  if (HE_Z.test(text) || HE_E.test(text)) return { ...NO_HIT };

  // 腿②命中 + 否定守卫：断言前置有否定/否认时不是有效性断言
  const validityOk = (m) => {
    const prev10 = text.slice(Math.max(0, m.start - 10), m.start);
    const prev4 = text.slice(Math.max(0, m.start - 4), m.start);
    if (NG_Z.test(prev10) || NG_E.test(prev10)) return false;
    if (NG1_Z.test(prev4)) return false;
    return true;
  };

  // 两条泳道：中文泳道（窗口 50 字）与英文泳道（窗口 110 字符）
  const lanes = [
    { status: _matches(text, ST_Z), valid: _matches(text, VA_Z).filter(validityOk), rhet: _matches(text, RH_Z), conn: CO_Z, win: 50, tag: 'zh' },
    { status: _matches(text, ST_E), valid: _matches(text, VA_E).filter(validityOk), rhet: _matches(text, RH_E), conn: CO_E, win: 110, tag: 'en' },
  ];

  let count = 0;
  let viaRhet = false;
  for (const L of lanes) {
    if (L.status.length === 0) continue;
    // 路线 B：腿① ±窗口 内有反问断言形（免连接词）
    for (const s of L.status) {
      for (const r of L.rhet) {
        const gap = Math.max(r.start - s.end, s.start - r.end);
        if (gap >= 0 && gap <= L.win) { count++; viaRhet = true; }
      }
    }
    // 路线 A：腿① × 腿②，间距 ≤窗口 且两腿之间有推断连接词
    for (const s of L.status) {
      for (const v of L.valid) {
        const gap = Math.max(v.start - s.end, s.start - v.end);
        if (gap < 0 || gap > L.win) continue;
        const between = v.start > s.end ? text.slice(s.end, v.start) : text.slice(v.end, s.start);
        if (L.conn.test(between)) count++;
      }
    }
  }

  if (count === 0) return { ...NO_HIT };
  const detail = /[\u4e00-\u9fff]/.test(text)
    ? '诉诸财富/诉诸贫穷×财富(贫困)状态×认知有效性结论' + (viaRhet ? '·反问断言(zh)' : '(zh)')
    : 'appeal to wealth/poverty×wealth-status×epistemic-validity' + (viaRhet ? '·rhetorical(en)' : '(en)');
  return { hit: true, score: 0.5, count: Math.min(count, 5), detail };
}

module.exports = {
  checkAppealToWealth,
  __internals: () => ({
    STATUS_ZH, STATUS_EN, VALIDITY_ZH, VALIDITY_EN,
    RHETORICAL_ZH, RHETORICAL_EN, CONNECTOR_ZH, CONNECTOR_EN,
    META_EXEMPT_ZH, META_EXEMPT_EN, HEDGE_ZH, HEDGE_EN, NEG_ZH, NEG_EN, NEG1_ZH,
  }),
};
