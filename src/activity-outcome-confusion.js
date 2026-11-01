/**
 * src/activity-outcome-confusion.js — 「活动/投入当成果（以工代果）」检测器
 * （第 184 个判别维度，r186 立项）
 *
 * [r186 立项] decision 本体在当前引擎（v6.8.113，183 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。加速依据是缺口实证 + 轮换纪律：
 *   · 缺口实证（/tmp/hf-probe-r186b.js，直调 gate.js v6.8.113）：本族 5 条
 *     攻击样本**全部 gate.action=pass、findings 全空**（零命中），5 条良性
 *     样本全部 pass（零误伤）——整族无任何维度覆盖。
 *   · 外部来源（真实，未编造）：HN Algolia "vanity metrics" 命中 Eric Ries
 *     《Vanity Metrics vs. Actionable Metrics》（42 分，
 *     https://news.ycombinator.com/item?id=617517）与《Vanity Metrics》
 *     （79 分，https://news.ycombinator.com/item?id=14167843）——把**感觉
 *     良好的活动/投入计数**当成**真实成果**；"Goodhart's law" 多篇高分
 *     （229/187/178 分，https://news.ycombinator.com/item?id=17320640 等）
 *     作概念背景。Semantic Scholar 两次检索 HTTP 429 空返；GitHub
 *     vanity/actionable metrics 无高星纯规则方案（最高 1★ 无关）。判据为
 *     心虫自有纯规则实现。侦察落盘 /tmp/hf-scout-r186.txt。
 *
 * 辨别的族：活动/投入当成果（activity-outcome confusion / 以工代果）——
 * 把**做了多少事、投入多少工**（会议场次、发文份数、加班时长、代码行数、
 * 走访户数、培训班次……这些是**过程与手段**）当作**成果与绩效**的证据：
 *   我们开了 50 场会、发了 100 份文件，所以项目推进得很好。
 *   团队天天加班到深夜，说明大家干劲十足、成绩显著。
 *   代码写了几万行，可见进展巨大。
 *   今年走访了几百户群众，足以证明基层工作卓有成效。
 *   他每天都忙得脚不沾地，足以证明工作卓有成效。
 *   We held dozens of meetings, so the project is clearly on track.
 *   The team pulled countless all-nighters, which shows remarkable results.
 *
 * 与既有维度的边界（r186 归因，刻意错开）：
 *   · reward_hacking（第?维，BLOCK）及其 metric_substitution /
 *     metric_denominator_gaming / best_run_picking / HAP-Z* 等族，管的是
 *     **自认式指标作弊**——句中必有「换成/改为/优化…而不是/刷分/让指标
 *     好看」这类把作弊意图说出口的标记；本族是**无欺骗的推理谬误**：陈述
 *     者真诚地相信「做了这么多 = 成果这么大」，句中不含任何作弊自认。
 *     两者可同句共现但判定结构不同。
 *   · Goodhart 代理**指标**族（点击率/GDP/停留时长/分数——**测得的量**被
 *     当作目标）：本族腿①刻意只收**活动/投入**（开会/加班/代码行/走访——
 *     **做的事、花的工**），不收任何**度量名词**；「下载量破百万所以满足
 *     需求」「分数上去所以教学变好」归 Goodhart/代理族射程，本维度不碰，
 *     从词表层保证两族不混。
 *   · bullshit / unsupported_claim 管断言缺依据的强度，本族有明确的
 *     「活动量×抽象成果×因果连接」三件结构。
 *
 * 判据（活动腿 × 成果结论腿 × 因果连接词，三腿共现，缺一不判）：
 *   · 腿① ACT 活动/投入——两类：
 *       A 可计数活动名词（名词在场即可，天然是过程/手段）：
 *         会议/例会/复盘会/动员会/座谈会/研讨会/调度会；文件/发文/函件；
 *         代码行/代码量/行数/字数；加班/工时/值班/值守/演练/演习；
 *         走访/巡查/巡察/排查/视察/督察；培训/宣讲/开班/讲座；
 *         邮件/消息(量)；出勤；对接/沟通/拜访/约谈； unmistakable 忙碌标记
 *         忙得脚不沾地/夜以继日/起早贪黑/通宵/熬夜；
 *         EN meetings / memos / emails / reports / training sessions /
 *         inspections / site visits / overtime / hours / lines of code /
 *         all-nighters / paperwork。
 *       B 泛指投入词（投入/付出/辛劳/辛苦/操劳/心血/汗水/精力/奔波）——
 *         **必须与强度/数量标记同现**（大量/很多/许多/巨量/天天/每天/
 *         日夜/连夜/长时间/夜以继日/数十/上百/几百/几千/几万/无数/诸多），
 *         否则不判（「投入研发取得突破」是正常因果叙述，避免误伤）。
 *   · 腿② OUT 抽象成果结论（**只收抽象成功/进展/绩效词，不收具体结果**——
 *     具体结果交付归良性）：推进得(好|顺利)/进展(巨大|显著|顺利|喜人)/
 *     成效(显著|卓著)/成绩(显著|突出|斐然)/卓有成效/效果(好|显著)/
 *     (圆满)成功/势头(好|喜人)/落实有力/扎实有效；
 *     EN on track / going well / (great|significant|remarkable|substantial)
 *     progress / fruitful / productive / successful / highly effective /
 *     remarkable results。
 *   · 腿③ CONN 因果连接词（活动腿与成果腿之间有推理连接）：所以/因此/
 *     因而/足见/据此/可见/于是/那么/这说明/这意味着/说明/证明/表明/
 *     足以证明/足以说明/显然/无疑；EN so/therefore/thus/which means/which
 *     shows/which proves/proving/demonstrating。活动腿与成果腿总跨度
 *     ≤80 字（EN 160 字符）。
 *
 * 为什么取 VERIFY 级：单句也可能是**附带具体成果**的正常汇报（加了具体
 * 交付物就不是谬误）、文学对白、或对「忙碌文化」的概念讨论。verify 的
 * 含义是「用活动量给成果背书，需要补上成果本身的证据」——调用方应要求
 * 给出可验证的结果数据，而不是接受活动计数替代成果。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 正确分离过程与成果（只是过程/只是手段/不等于/不代表/不能等同/
 *     不能混为一谈/不能只看/不能只靠/关键要看/才是…目标/衡量…的方式/
 *     而不是/而非；EN is only a proxy / what matters is / outcomes are /
 *     not the same as / doesn't equal / a means, not an end）——主动区分
 *     活动与成果是正确判别；
 *   · 具体成果在场（交付/上线/发布/出货/发货/签单/成交/签订了/收入/营收/
 *     利润/转化率/留存率/用户增长/达标了；EN shipped/delivered/deployed/
 *     launched/released/revenue/signed/conversion）——成果已被具体结果
 *     背书，不再是拿活动计数充数；
 *   · 对冲（可能/也许/或许/未必/不一定/大概/恐怕/说不定；EN maybe/perhaps/
 *     might/probably）——概率化结论不作谬误判定（同 r161/r185 口径）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① ACT 可计数活动名词（中文，名词在场即命中，含裸名词形）──────────
// 161 轮教训：全部收裸名词形态（收「会议」而非只收「会议场次」，收「加班」
// 而非只收「加班时长」）——同族词去掉后缀仍独立命中。
const ACT_ZH = [
  /开会|会议|例会|复盘会|动员会|座谈会|研讨会|调度会|总结会|评审会|汇报会|[0-9一二三四五六七八九十百千万几多]+\s*(?:场|次|届|期|个|回|批)?\s*会/,
  /文件|发文|函件|通知|方案|材料|报告|汇报/,
  /代码|代码行|代码量|行数|字数|篇幅|页数|条款数/,
  /加班|工时|值班|值守|演练|演习|拉练|出勤/,
  /走访|巡查|巡察|排查|视察|督察|督查|摸底/,
  /培训|宣讲|开班|讲座|授课|辅导/,
  /邮件|消息|微信|短信|函电/,
  /对接|沟通|拜访|约谈|会谈|洽谈|座谈/,
  /忙得脚不沾地|脚不沾地|夜以继日|起早贪黑|通宵|熬夜|废寝忘食|马不停蹄/,
];

// ─── 腿① ACT（英文）────────────────────────────────────────────────────
const ACT_EN = [
  /\bmeetings?\b/i, /\bmemos?\b/i, /\bemails?\b/i, /\breports?\b/i,
  /\btraining\s+sessions?\b/i, /\binspections?\b/i, /\bsite\s+visits?\b/i,
  /\bovertime\b/i, /\b(all[- ]?nighters?|late\s+nights)\b/i,
  /\b(lines?\s+of\s+code|man[- ]?hours)\b/i, /\bpaperwork\b/i,
  /\bclock(?:ed)?\s+(?:in\s+)?(?:long\s+)?hours\b/i,
];

// ─── 腿① ACT_EFFORT 泛指投入词（中文）——须与强度标记同现────────────────
// 单独出现不判（「投入研发取得突破」是正常叙述），避免误伤正常因果句。
const EFFORT_ZH = [
  /投入|付出|辛劳|辛苦|操劳|操持|呕心沥血|殚精竭虑|耗费|花费/,
  /心血|汗水|精力|心力|心思/,
  /奔波|忙碌|忙得|耗时|费力|心力交瘁/,
];

// ─── 强度/数量标记（配合 EFFORT 腿，任一在场即赋予 EFFORT 腿资格）────────
const INTENSITY_ZH = [
  /大量|很多|许多|巨量|海量|无数|诸多|颇多|不少|满满/,
  /天天|每天|日夜|连夜|长时间|长期|起早贪黑|夜以继日|通宵达旦/,
  /数十|上百|几百|几千|几万|成百上千|成千上万/,
  /[0-9一二三四五六七八九十百千万]+\s*(?:场|次|份|个|届|回|轮|批|套|趟|户|家|条|篇)/,
];
const INTENSITY_EN = [
  /\b(?:a\s+lot\s+of|lots?\s+of|countless|numerous|tons?\s+of|endless|tireless)\b/i,
  /\b(?:day\s+and\s+night|around\s+the\s+clock|every\s+(?:day|night)|long\s+hours)\b/i,
  /\b(?:dozens|hundreds|thousands)\s+of\b/i,
  /\b\d+\s+(?:meetings?|hours?|nights?|reports?|files?|lines?)\b/i,
];

// ─── 腿② OUT 抽象成果结论（中文，只收抽象成功/进展/绩效，不收具体结果）──
// 名词与形容词之间留 [^。！？]{0,6} 强度窗——中文常在「进展/成绩/成效」与
// 「巨大/显著/斐然」之间插入「很/十分/非常/必然/确实/大幅」等强度副词，
// 首版写成紧邻导致「推进得很好」「成绩必然斐然」「绩效十分突出」整句漏判。
const OUT_ZH = [
  /推进得[^。！？]{0,4}(?:好|顺利|不错|有声有色)|推进顺利|推进有力|推进有序/,
  /进展[^。！？]{0,6}(?:巨大|很大|显著|顺利|喜人|可观|飞快|不俗)/,
  /成效[^。！？]{0,6}(?:显著|卓著|突出|明显|斐然|不俗)/,
  /成绩[^。！？]{0,6}(?:显著|突出|斐然|喜人|不俗)/,
  /卓有成效|富有成果|成果丰硕|硕果累累|斐然/,
  /效果[^。！？]{0,4}(?:好|显著|明显|不错|突出)/,
  /(?:很|更|相当|非常|格外|颇|圆满)?(?:成功|圆满)|圆满成功|取得成功|大获成功/,
  /势头[^。！？]{0,4}(?:好|喜人|强劲|不错)|形势[^。！？]{0,4}(?:好|喜人)|状态[^。！？]{0,4}(?:好|佳|不错)/,
  /落实有力|扎实有效|开展得[^。！？]{0,4}(?:好|有声有色)|干得[^。！？]{0,4}(?:好|出色|漂亮)/,
  /干劲十足|士气[^。！？]{0,4}(?:高涨|高昂|旺盛)|斗志昂扬/,
  /业绩[^。！？]{0,6}(?:突出|斐然|喜人|不俗)|绩效[^。！？]{0,6}(?:优秀|突出|显著)/,
];

// ─── 腿② OUT（英文）────────────────────────────────────────────────────
const OUT_EN = [
  /\b(?:on\s+track|going\s+well|off\s+to\s+a\s+(?:good|great)\s+start)\b/i,
  /\b(?:great|significant|remarkable|substantial|excellent|impressive|real|tremendous)\s+(?:progress|results?|success|headway)\b/i,
  /\b(?:progress|results?)\s+(?:is|are|has\s+been|have\s+been)\s+(?:great|significant|remarkable|substantial|impressive|excellent)\b/i,
  /\b(?:fruitful|productive|successful|effective|highly\s+effective)\b/i,
  /\b(?:highly|very|really|truly)\s+(?:successful|effective|productive)\b/i,
  /\b(?:a\s+)?(?:great|remarkable|huge|major)\s+success\b/i,
];

// ─── 腿③ CONN 因果连接词（活动腿与成果腿之间的推理连接）────────────────
const CONN_ZH = [
  /所以|因此|因而|故而|足见|据此|可见|于是|那么|这说明|这意味着|足以证明|足以说明|毫无疑问|显然|说明|证明|表明|印证/,
];
const CONN_EN = [
  /\b(?:so|thus|therefore|hence|which\s+(?:means|shows|proves|demonstrates)|meaning|consequently|proving|demonstrating|showing)\b/i,
];

// ─── 豁免一：正确分离过程与成果（主动说清活动≠成果 = 正确判别）──────────
const EXEMPT_SEP_ZH = [
  /只是(?:过程|手段|方式|途径|一环|一部分|一个方面)|仅仅是一种|不过是过程/,
  /不等于|不代表|不意味着|并不能说明|说明不了|证明不了|推不出|算不上|称不上/,
  /不能等同|不能混为一谈|不能只看|不能只靠|不能仅凭|不能只凭|不能只以|不应只看|勿以/,
  /关键要看|关键在于|要看|得看|重点看|核心是|重要的是|终究要看|最终要看/,
  /才是(?:目标|目的|关键|重点|根本|成果|结果|实质|落脚点|归宿)/,
  /衡量[^。！？]{0,12}(?:的)?方式|度量[^。！？]{0,8}方式/,
  /而不是|而非|并不等于|而非是/,
];
const EXEMPT_SEP_EN = [
  /\bis\s+(?:only|just)\s+a\s+(?:proxy|means|process|step|part)\b/i,
  /\bwhat\s+matters?\s+is\b/i, /\boutcomes?\s+(?:are|is)\s+what\b/i,
  /\bnot\s+the\s+same\s+(?:as|thing)\b/i, /\bdoesn'?t\s+(?:equal|mean|guarantee)\b/i,
  /\bdoes\s+not\s+(?:equal|mean|guarantee)\b/i,
  /\ba\s+means?,?\s+not\s+an?\s+end\b/i, /\bactivity\s+metric\b/i,
  /\bvanity\s+metric\b/i, /\brather\s+than\s+(?:the\s+)?(?:actual|real|true)\b/i,
];

// ─── 豁免二：具体成果在场（成果已被具体结果背书，非拿活动计数充数）──────
const EXEMPT_CONCRETE_ZH = [
  /交付|上线|发布|出货|发货|签单|签约|成交|签订|签署|拿下|中标/,
  /收入|营收|利润|成本|转化率|留存率|复购|续费|用户增长|下载量|装机量/,
  /达标|完成了|达成了|落地了|投入运营|正式运行|投产/,
  /完成率|通过率|准确率|故障率|满意度|NPS|净推荐/,
];
const EXEMPT_CONCRETE_EN = [
  /\b(?:shipped|delivered|deployed|launched|released|rolled\s+out)\b/i,
  /\b(?:revenue|profit|conversion|retention|sign(?:ed|ing)|closed)\b/i,
  /\b(?:completed|achieved|met)\s+(?:the\s+)?(?:target|goal|milestone|deadline)\b/i,
];

// ─── 豁免三：对冲（概率化结论，同 r161/r185 口径）───────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|多半|说不定|很难说|有待|仍需|还需/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|possibly|probably|not\s+necessarily|unclear|remains\s+to\s+be\s+seen)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkActivityOutcomeConfusion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ACTZ = R.ACT_ZH || ACT_ZH;
  const ACTE = R.ACT_EN || ACT_EN;
  const EFFZ = R.EFFORT_ZH || EFFORT_ZH;
  const INTZ = R.INTENSITY_ZH || INTENSITY_ZH;
  const INTE = R.INTENSITY_EN || INTENSITY_EN;
  const OUTZ = R.OUT_ZH || OUT_ZH;
  const OUTE = R.OUT_EN || OUT_EN;
  const CONNZ = R.CONN_ZH || CONN_ZH;
  const CONNE = R.CONN_EN || CONN_EN;
  const SEPZ = R.EXEMPT_SEP_ZH || EXEMPT_SEP_ZH;
  const SEPE = R.EXEMPT_SEP_EN || EXEMPT_SEP_EN;
  const CONCZ = R.EXEMPT_CONCRETE_ZH || EXEMPT_CONCRETE_ZH;
  const CONCE = R.EXEMPT_CONCRETE_EN || EXEMPT_CONCRETE_EN;
  const HDGZ = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const HDGE = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;

  // 全局豁免：正确分离 / 具体成果在场 / 对冲 / 疑问句
  if (anyHit(SEPZ, text) || anyHit(SEPE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(CONCZ, text) || anyHit(CONCE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(HDGZ, text) || anyHit(HDGE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const ACT = ACTZ.concat(ACTE);
  const OUT = OUTZ.concat(OUTE);
  const CONN = CONNZ.concat(CONNE);
  const EFFORT = EFFZ;
  const INTENSITY = INTZ.concat(INTE);
  const SPAN = isZh ? 80 : 160;

  // 找活动腿：A 可计数活动名词在场即可；B 泛指投入词须与强度标记同现
  const actStrong = firstMatch(ACT, text, 0);
  let actEffort = firstMatch(EFFORT, text, 0);
  if (actEffort && !anyHit(INTENSITY, text)) actEffort = null; // 投入词无强度标记不算
  const act = actStrong || actEffort;
  if (!act) return { hit: false, score: 0, detail: '', count: 0 };

  // 逐个成果结论腿匹配，统计共现次数
  let count = 0;
  let bestScore = 0;
  let firstDetail = '';
  for (let from = 0; from < text.length;) {
    const out = firstMatch(OUT, text, from);
    if (!out) break;
    // 活动腿与成果腿总跨度约束
    const lo = Math.min(act.idx, out.idx);
    const hi = Math.max(act.idx + act.len, out.idx + out.len);
    if (hi - lo <= SPAN) {
      // 因果连接：显式连接词（所以/因此/说明/可见…）落在两腿跨度窗口内，
      // **或**两腿以逗号并置且无转折词（"投入很多，进展顺利"——中文逗号
      // 常承载隐性因果，是本族高频形态）；句号分隔或含转折词（但/然而/却/
      // 不过/虽然）则不判——那是并列或反向陈述，不是"以工代果"断言。
      const window = text.slice(lo, hi);
      const contrast = /但是|然而|却|不过|虽然|尽管|只是|仅|可惜|遗憾|反而/.test(window);
      const hasConn = anyHit(CONN, window);
      const juxtapose = /[，,]/.test(window) && !contrast;
      if (hasConn || juxtapose) {
        count++;
        if (count === 1) {
          // 强连接词（足以证明/充分证明/无疑/显然/百分之百）提分
          const strong = /足以证明|足以说明|充分证明|毫无疑问|毋庸置疑|百分之百|100%|铁证|\b(?:proves|conclusively|undoubtedly)\b/i.test(window);
          bestScore = strong ? 0.72 : 0.62;
          firstDetail = isZh
            ? '活动投入当成果×' + (actStrong ? '活动计数' : '投入付出') + '冒充绩效(zh)'
            : 'activity-outcome-confusion×activity-counted-as-achievement(en)';
        } else if (bestScore < 0.72) {
          bestScore = 0.72; // 多处共现提分
        }
      }
    }
    from = out.idx + out.len;
  }

  if (count > 0) {
    return { hit: true, score: bestScore, detail: firstDetail, count };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkActivityOutcomeConfusion,
  __internals: () => ({
    ACT_ZH, ACT_EN, EFFORT_ZH, INTENSITY_ZH, INTENSITY_EN,
    OUT_ZH, OUT_EN, CONN_ZH, CONN_EN,
    EXEMPT_SEP_ZH, EXEMPT_SEP_EN, EXEMPT_CONCRETE_ZH, EXEMPT_CONCRETE_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
