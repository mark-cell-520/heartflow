/**
 * src/broken-window-fallacy.js — 「破窗谬误」检测器
 * （ provisional 第 218 个判别维度，r230 起草；8 处 src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r230-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228/r229：远端 v6.8.145 已接线 214 维，
 * 另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229) 五个已起草未接线维度占号，最终编号由 1 号按
 * 接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r230 立项] 零命中探针 coordination/agent4/probes/r230-zerohit-probe.js
 * （v6.8.145 实测）：破窗族 24 句攻击 **22 句完全穿引擎**（pass、findings
 * 为空），另 2 句由 presupposition / gate_block 代拦且均非本族承重。
 * src/ 下没有任何维度判「破坏事件 × 强制重置支出被当成净收益」——
 * pseudo_causal 管强行因果、cost_externalization 管成本转嫁他人，
 * 都不管「成本根本未入账」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r230 海外扫描（原始证据
 * coordination/agent4/scout/20261106-095127、20261106-095135）：arXiv
 * 短语查询被拆成 OR（各返回最新 15 条，无一与破窗谬误/经济谬误检测
 * 相关）；GitHub repos total_count=0；Semantic Scholar 429 限流。
 * 无可集成的纯规则文本检测模块。判据为心虫自有纯规则实现（家族定义
 * 取自 Bastiat「可见的与不可见的」标准论述：灾后重建的可见收益掩盖
 * 了被挤占的机会成本——那笔钱本可投向别处）。
 *
 * 辨别的族：破窗谬误（broken window fallacy / destruction-as-stimulus
 * / seen-vs-unseen）——把**破坏/灾害/报废事件**说成经济利好，理由是
 * 它「拉动内需、创造就业、刺激消费」，却对被挤占的机会成本（那笔
 * 重置支出本可投向别处）完全不入账：
 *   地震摧毁了老城区，但重建工程会拉动内需、促进经济增长。
 *   战争虽然摧毁了大量工厂，却刺激了军工生产，创造了就业岗位。
 *   台风过境后，重建需求将带动建材和家电消费，对经济反而是利好。
 *   窗户被砸破了必须更换，玻璃工、安装工都有了生意，这难道不是
 *   促进了经济吗？
 *   The earthquake destroyed the old town, but reconstruction will
 *   stimulate demand and boost growth.
 *   Breaking a window creates work for the glazier — surely that is
 *   good for the economy.
 *
 * 为什么这是判别者的核心缺口：该族在灾难叙事、战争经济、疫情后
 * 复苏、设备报废更新的话语里极其常见，且方向完全判反——把价值
 * 毁灭包装成增长引擎。它的错误不是因果不存在（重建确实产生支出），
 * 而是**只计入了可见的强制重置支出，没有计入不可见的被挤占用途**。
 * 媒体定调、财政辩护、投资判断都会引用这套结构。
 *
 * 与既有维度的边界（r230 归因）：
 *   · cost_externalization 管「成本转嫁给他人承担」（谁付账的
 *     问题）；本族管「成本根本没有入账」（可见收益 vs 被挤占的
 *     不可见用途，是计量问题）。
 *   · pseudo_causal 管无依据的强行因果；本族的因果链真实存在
 *     （重建确实花钱），错在净效应计量口径。
 *   · activity_outcome_confusion 管「活动量当成结果量」；本族
 *     判的是支出结构的机会成本忽略。
 *   · 破窗效应（broken windows theory，犯罪学）是同名不同物：
 *     指环境失序诱发越轨，本族不判（豁免族 C 处理）。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① DESTRUCTION 破坏事件标记：灾害/事故/战争名词（地震/
 *     台风/洪水/火灾/饥荒/疫情/战乱/事故/爆炸）、毁灭动词（摧毁/
 *     毁/烧毁/冲毁/报废/砸/破损/raze/destroy/demolish/wreck/
 *     devastate）、资源损耗（浪费/挥霍/损耗/消耗/waste/squander/
 *     wipe out/discard）——必须是**非计划的价值毁灭**，「淘汰/
 *     更新换代」等计划性替换不算；
 *   ② 腿② STIMULUS 强制重置支出收益断言：拉动内需/刺激消费/
 *     创造就业/带动消费/提振/投资热潮/有了生意/受益/利好/
 *     stimulate demand/boost growth/spur construction/create
 *     jobs/drive GDP/fuel the economy/replacement purchases 等
 *     需求侧措辞——「提高效率/产业升级」等非支出侧收益不算；
 *   ③ 腿③ LINK 破坏→收益的因果/对比连接：但/却/反而/势必/将/
 *     尽管/不如说/but/yet/however/will/leaving/forces 等。
 *   三腿须落在近距离窗内（ZH 80 字 / EN 200 字符）。
 *
 * 为什么取 VERIFY 级：灾后复苏评估、设备更新论证在计入机会成本
 * 的前提下是正当分析；本族拦的是「只计可见、不计被挤占用途」的
 * 单边陈述。verify 的含义是「这段文本把破坏说成了净收益，补齐
 * 机会成本口径再下结论」。
 *
 * 明确不判的（豁免）：
 *   · 认识论纠正（机会成本/看不见的代价/净效应为负/忽略了成本/
 *     站不住脚/谬误/opportunity cost/unseen/net effect/fallacy/
 *     ignores the cost）——指出本族错误正是判别动作本身；
 *   · 计入机会成本的双边分析（本可用于/取决于/could have been
 *     spent）——已把不可见用途入账的正确论证；
 *   · 破窗效应犯罪学理论（broken windows theory）——同名不同物；
 *   · 纯破坏陈述（无腿②天然不判）与一般经济表述（无腿①天然
 *     不判）。
 */
'use strict';

// ─── 腿① 破坏事件标记（中文）────────────────────────────────────────
// 注意：「淘汰/更新换代/产能过剩」等计划性替换词不入表——市场竞争
// 淘汰落后产能是正常演化，不是价值毁灭。
const DESTRUCT_ZH = [
  /地震/, /台风/, /洪水/, /饥荒/, /疫情/, /瘟疫/, /战乱/, /战争/,
  /火灾/, /大火/, /爆炸/, /事故/, /灾难/, /灾害/, /海啸/, /旱灾/,
  /摧毁/, /毁坏/, /毁灭/, /烧毁/, /冲毁/, /报废/, /砸了/, /砸破/,
  /破损/, /破坏/, /损耗/, /挥霍/, /浪费/, /消耗/, /毁了/,
];

// ─── 腿① 破坏事件标记（英文）────────────────────────────────────────
const DESTRUCT_EN = [
  /\b(?:earthquake|hurricane|typhoon|flood|famine|pandemic|plague|war|wartime|fire|explosion|accident|disaster|catastrophe|tsunami|drought)\b/i,
  /\b(?:destroy(?:ed|s|ing)?|destruction|demolish(?:ed|ing|ition)?|wreck(?:ed|ing|age)?|raz(?:e|ed|ing)|devastat(?:e|ed|es|ing|ion)|burn(?:ed|t)?\s+down|broke|broken|breaks?|breaking|smash(?:ed|ing)?|scrap(?:ped|ping|s)?|write-?offs?)\b/i,
  /\b(?:waste|wasted|squander(?:ed)?|deplet(?:e|ed|ion)|wipe[ds]? out|wiped out|discard(?:ed)?|throw(?:n)? away|obsolete capacity)\b/i,
];

// ─── 腿② 强制重置支出收益断言（中文，需求侧措辞）────────────────────
// 收两类：①需求侧支出措辞（拉动内需/创造就业/投资热潮）；②被迫升级
// 收益（产业升级/更新换代/轻装上阵——破坏"倒逼"进步的经典话术）。
// 间隔容忍 [^。，；]{0,8}：吸收「刺激了企业扩大生产」「提振制造业
// 产出」类修饰嵌套。「淘汰/产能过剩」等计划性替换词不入腿①。
const STIMULUS_ZH = [
  /拉动(?:了|出)?[^。，；]{0,8}(?:内需|消费|增长|经济|GDP|gdp|地方)/,
  /刺激(?:了|出)?[^。，；]{0,8}(?:消费|生产|需求|经济|内需|军工|增长)/,
  /带动(?:了)?[^。，；]{0,8}(?:消费|需求|产业|产业链|建材|家电|制造业|地方|增长)/,
  /提振(?:了)?[^。，；]{0,8}(?:消费|需求|经济|制造业|地方|产出)/,
  /创造(?:了)?(?:大量)?(?:的)?就业/, /就业岗位/, /就业数据/, /就业/,
  /(?:重建|灾后|恢复|复苏|投资|建设|消费)?热潮/,
  /(?:新的)?生意/,
  /托举/, /受益/, /利好/,
  /促进(?:经济)?增长/, /经济增长/,
  /产业升级/, /技术升级/, /更新换代/, /升级换代/, /轻装上阵/,
];

// ─── 腿② 强制重置支出收益断言（英文）────────────────────────────────
const STIMULUS_EN = [
  /\bstimulat(?:e|es|ed|ing)\s+(?:\w+\s+){0,2}(?:demand|consumption|the economy|growth|production|industry)/i,
  /\bboost(?:s|ed|ing)?\s+(?:\w+\s+){0,2}(?:growth|the economy|demand|consumption)/i,
  /\bspur(?:s|red|ring)?\s+(?:\w+\s+){0,2}(?:construction|consumption|demand|growth|the economy|industry)/i,
  /\bcreat(?:e|es|ed|ing)\s+(?:\w+\s+){0,2}(?:work|jobs|demand|spending|growth)\b/i,
  /\bdrive\s+(?:GDP\s+)?growth/i,
  /\bfuel(?:s|ed|ing)?\s+the\s+(?:local\s+|national\s+)?economy/i,
  /\b(?:reconstruction|recovery|replacement)\s+(?:boom|spending|purchases?)/i,
  /\blift(?:s|ed|ing)?\s+(?:manufacturing\s+)?output/i,
  /\bgood\s+for\s+the\s+economy/i,
  /\beconomy\s+(?:is\s+|becomes\s+)?stronger/i,
  /\brestocking\s+will/i,
  /\baccelerat(?:e|es|ed|ing)\s+innovation/i,
];

// ─── 腿③ 破坏→收益的连接（中文）─────────────────────────────────────
// 必须是连接成分（对比/因果/使动），收益动词本身（带动了/促进了）不算
// ——否则「口罩产能扩大带动了上游消费」这类事实性市场反应会自触发。
// 「将/will」只在其后 6 字内紧跟收益措辞时算数（防止「政府将保障
// 就业」类政策表述误触）。
const LINK_ZH = /但是|但|却|反而|反倒|势必|必然|由此|从而|进而|这才|尽管|虽然|虽|不如说|何乐而不为|不容忽视|不愧|堪称|使|让|令|催生|必须|更换|重置|难道|都能|才能|方能|也可以|能(?:够)?(?=[^。，；]{0,6}(?:拉动|刺激|带动|提振|创造|就业|受益|利好|托举|增长|热潮|生意|轻装上阵|升级|投资|重建|恢复|复苏|消费|需求))|将(?=[^。]{0,6}(?:拉动|刺激|带动|提振|创造|就业|受益|利好|托举|增长|热潮|生意|轻装上阵|升级|投资|重建|恢复|复苏))|(?:灾后|战后|震后|之后|过后|后)[^。，；]{0,4}(?:重建|恢复|复苏|投资|建设|采购|更新)|(?:重建|恢复|复苏|投资|采购|更新)[^。，；]{0,4}(?:热潮|需求|带动|拉动|刺激|创造|就业)/;

// ─── 腿③ 破坏→收益的连接（英文）─────────────────────────────────────
const LINK_EN = /\b(?:but|yet|however|leaving|forces?|that|which|means?|thus|thereby|surely|in turn|as \w+ as)\b|\bwill\b(?=\s+(?:\w+\s+){0,2}(?:stimulat|boost|spur|creat|drive|fuel|lift|restock|accelerat))|\b(?:good|great|boon)\s+for\s+the\s+economy\b|\b(?:post-?\w+|reconstruction|recovery|restocking|replacement)\s+(?:demand|spending|purchases?|boom|work|orders?)\b|\bcreat(?:e|es|ed|ing)\s+(?:\w+\s+){0,2}(?:thousands\s+of\s+)?jobs\b/i;

// 三腿共现的距离窗
const WIN_PAIR_ZH = 80;
const WIN_PAIR_EN = 200;
// 腿③连接允许落在腿①之前的前缀窗内（句首对比词 But/然而 先于破坏
// 事件出现：「But saying the war created jobs ignores…」）
const WIN_PRE_ZH = 24;
const WIN_PRE_EN = 80;
// [r231 接手] 腿③连接允许落在收益腿之后的后缀窗内：收益断言先落地、
// 对比/总结连接后置是极常见语序（「地震之后重建需求拉动内需，这场
// 灾难反而让经济更繁荣」/「重建刺激了消费，创造了就业，这对经济
// 反而是利好」）。只扫两腿跨度会整族漏判。
const WIN_POST_ZH = 40;
const WIN_POST_EN = 120;

// ─── 豁免一：认识论纠正（指出本族错误正是判别动作本身）──────────────
// 注意（r228/r229 教训迁移）：只收复合/结构化形式，不收会在攻击句
// 里自然出现的裸词。
const EXEMPT_CORRECT_ZH = [
  /机会成本/, /看不见的代价/, /不可见的/, /被挤占/,
  /净效应(?:取决于|为负|可能为负|存疑|未知|不确定)/,
  /忽略(?:了|了被)?[^。]{0,16}(?:成本|代价|资金|支出)/,
  /忽视(?:了)?[^。]{0,16}(?:成本|代价)/,
  /本可(?:用于|以|投向)/, /站不住脚/, /谬误/, /判反/, /误以?为/,
  /只见[^。]{0,12}不见/,
];
const EXEMPT_CORRECT_EN = [
  /\bopportunity\s+cost/i, /\bunseen\b/i, /\bnet\s+effect/i,
  /\bignor(?:e|es|ed|ing)\s+the\s+(?:cost|trade-?offs?|opportunity)/i,
  /\bcould\s+have\s+(?:been\s+)?(?:built|spent|invested|used|gone)/i,
  /\bfallacy\b/i, /\bbastiat\b/i, /\bmistakes?\s+visible/i,
];

// ─── 豁免二：破窗效应犯罪学理论（同名不同物）────────────────────────
const EXEMPT_THEORY_ZH = [/破窗效应/, /破窗理论/, /环境失序/, /违法/];
const EXEMPT_THEORY_EN = [/broken\s+windows?\s+theory/i, /signs\s+of\s+disorder/i];

// ─── 工具 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

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
 * 三腿配对：任一破坏标记 × 任一收益断言 × 连接标记，两两落在窗内即成一签名。
 * 窗口以破坏标记与收益断言的起止距离度量（ZH 80 字 / EN 200 字符）。
 */
function findSignatures(text, R) {
  const destruct = (R.DESTRUCT_ZH || DESTRUCT_ZH);
  const destructEn = (R.DESTRUCT_EN || DESTRUCT_EN);
  const stimulus = (R.STIMULUS_ZH || STIMULUS_ZH);
  const stimulusEn = (R.STIMULUS_EN || STIMULUS_EN);
  const linkZh = R.LINK_ZH || LINK_ZH;
  const linkEn = R.LINK_EN || LINK_EN;

  const sigs = [];
  const langs = [
    { d: destruct, s: stimulus, l: linkZh, win: WIN_PAIR_ZH, pre: WIN_PRE_ZH, post: WIN_POST_ZH, lang: "zh" },
    { d: destructEn, s: stimulusEn, l: linkEn, win: WIN_PAIR_EN, pre: WIN_PRE_EN, post: WIN_POST_EN, lang: "en" },
  ];
  for (const { d, s, l, win, pre, post, lang } of langs) {
    const dm = [];
    for (const re of d) for (const m of allMatches(re, text)) dm.push(m);
    const sm = [];
    for (const re of s) for (const m of allMatches(re, text)) sm.push(m);
    for (const a of dm) {
      for (const b of sm) {
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        // 腿③连接须落在两腿跨度 + 腿①前前缀窗 + 收益腿后后缀窗内
        const lo = Math.max(0, Math.min(a.idx, b.idx) - pre);
        const hi = Math.min(text.length, Math.max(a.end, b.end) + post);
        const seg = text.slice(lo, hi);
        if (!l.test(seg)) continue;
        sigs.push({ lang, destruction: a.raw, stimulus: b.raw });
        break; // 同一破坏标记只记一次
      }
      if (sigs.length >= 3) break;
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectBrokenWindow(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：认识论纠正 / 破窗效应犯罪学理论（任一命中即不判）
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_THEORY_ZH || EXEMPT_THEORY_ZH, text) || anyHit(R.EXEMPT_THEORY_EN || EXEMPT_THEORY_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.7 : 0.6;
  return {
    hit: true,
    dimension: 'broken_window',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? x.destruction + ' → ' + x.stimulus : x.destruction + ' -> ' + x.stimulus)),
    details: s.lang === 'zh'
      ? '破窗谬误(' + sigs.length + '处: 「' + s.destruction + '」被说成拉动「' + s.stimulus + '」，只计可见重置支出、被挤占的机会成本未入账)(zh)'
      : 'broken window fallacy(' + sigs.length + 'x: "' + s.destruction + '" framed as driving "' + s.stimulus + '" — visible replacement spending counted, displaced opportunity cost not)(en)',
    guidance: '不要把破坏/灾害/报废事件说成经济利好（地震重建拉动内需/destruction creates jobs）：强制重置支出的可见收益只是账目的一半，被挤占的用途（那笔钱本可投向别处）必须一并计入；计入机会成本后的双边分析不受此限。',
    tags: ['economics', 'reasoning', 'opportunity-cost', 'statistics', 'seen-vs-unseen'],
  };
}

module.exports = {
  detectBrokenWindow,
  __internals: () => ({
    DESTRUCT_ZH, DESTRUCT_EN, STIMULUS_ZH, STIMULUS_EN, LINK_ZH, LINK_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN, EXEMPT_THEORY_ZH, EXEMPT_THEORY_EN,
    WIN_PAIR_ZH, WIN_PAIR_EN,
  }),
};
