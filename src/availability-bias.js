/**
 * src/availability-bias.js — 「可得性偏差（availability bias / availability
 * heuristic）」检测器（第 200 个判别维度）
 *
 * [r203 立项] philosophy_decision 在当前引擎（v6.8.131，199 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实证：
 * grep -ril '可得性偏差|可得性启发|availability heuristic|老听说|满屏都是'
 * src/ 仅命中 fallacy_fallacy 的概念豁免清单（「可得性偏差」作为谬误
 * 名词出现）与 selection-bias.js 注释，无任何维度以「可得性线索×频率
 * 推断」两腿结构覆盖本族；本族探针在当前引擎复测——攻击 5/5 gate.action
 * =pass（真零命中）、良性 5/5 pass（零误伤）。外部搜索（HN Algolia /
 * Semantic Scholar "availability bias" / GitHub 高星仓库）无纯规则成熟
 * 方案可集成，按心虫既有维度形态自建纯规则实现（谬误族本身为经典目录
 * 中的 availability heuristic，与 base_rate_neglect / selection_bias /
 * clustering_illusion 等认知偏差系列并列）。
 *
 * 辨别的族：可得性偏差——拿**可得性线索**（老听说/经常看到/刷到/满屏
 * 都是/热搜霸榜/电视里天天放/身边全是；EN keep hearing about / all over
 * my feed / keeps coming up / see it all the time）直接推出**频率或概率
 * 推断**（所以很常见/越来越普遍/比比皆是/十有八九/大概率/激增/成风；
 * EN must be common / increasingly common / rampant / happening all the
 * time），把「一件事想起来的容易程度」偷换成「它实际发生的频率」：
 *   最近老听到坠机新闻，看来坐飞机越来越危险了。
 *   打开社交媒体满屏都是诈骗案，可见这类案件如今比比皆是。
 *   电视里天天放车祸视频，所以车祸一定大幅增加了。
 *   身边朋友全在聊基金亏损，八成现在散户都在亏钱。
 *   I keep hearing about plane crashes on the news, so flying must be
 *   getting more dangerous.
 *   All I see on my feed is crypto scams — it must be rampant everywhere.
 *
 * 与既有维度的边界（r203 归因）：
 *   · base_rate_neglect（第 169 维）管**阳性信号×高置信后验**（检测阳性
 *     → 几乎肯定中招——信号是具体的个体化证据）；本族判据是媒体/环境
 *     曝光度，个体可能根本没给出任何具体案例（「满屏都是」不是样本）。
 *   · anecdotal（第 140 维）/ anecdote_as_proof 管**第一人称亲身经历×
 *     推广**（我朋友/我亲戚/我上次）；本族主体常无亲身经历，依据是「看
 *     到听到的密度」而非叙事样本。
 *   · hasty_generalization 管**少数样本×普遍结论**；本族连样本都未给出，
 *     判据是「回忆容易度→频率」这一替代关系本身。
 *   · synthetic_social_proof 管**伪造社会认同**（大家都这么说/网友一致
 *     认为）；本族不主张他人立场，只推断事件的发生频率。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① AVAIL 可得性线索（中英）：老听说/经常听说/时不时看到/刷到/
 *     满屏都是/热搜看多了/电视里老播/新闻里天天放/身边全是/听得多了/
 *     印象里全是；EN keep hearing about / all over my feed / keeps coming
 *     up / see it all the time / everywhere in the news。
 *   · 腿② FREQ 频率/概率推断（中英）：所以很常见/越来越普遍/比比皆是/
 *     屡见不鲜/十有八九/大概率/激增/成风/泛滥；EN must be common /
 *     increasingly common / rampant / happening all the time。
 *   · 缺腿不判：只有腿①（「最近老刷到萌宠视频，很解压」）是主观体验
 *     陈述；只有腿②（「这类案件现在很常见」）无论及曝光来源，归
 *     unsupported_claim。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的可得性论证、认知偏差课堂
 * 讨论、或带证据的口述。verify 的含义是「这个频率结论建立在曝光密度
 * 而非发生率数据上，需要回到：官方统计、历史基线、报道量与实际发生率
 * 的区别」——调用方应要求补基础频率证据，而不是接受「看得多=发生多」。
 *
 * 明确不判的（豁免——这些是正确判别、数据陈述或概念讨论）：
 *   · 数据/统计依据在场（统计显示/数据显示/官方通报/报告显示/研究表明/
 *     调研显示/according to data / statistics show——结论有独立证据
 *     支持时，曝光线索只是引子）；
 *   · 求证/纠正陈述（但要看数据/以数据为准/有待核实/不能据此/不代表/
 *     不等于——认知到偏差并主动求证是正确判别）；
 *   · 概念/教学转述（可得性偏差/可得性启发式/availability bias /
 *     availability heuristic——讨论这个概念本身不是运用它）；
 *   · 疑问句（「最近老听到这事，是不是变多了？」——问的是趋势本身）。
 */
'use strict';

// ─── 腿① AVAIL 可得性线索（中文）──────────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（听说/看到/刷到/热搜/
// 报道 去后缀仍独立命中）；不收「多地/多起/大量案例」等可验证证据词
// （那是证据不是曝光）；「听说」「看到」允许副词/频率前缀紧邻修饰。
const AVAIL_ZH = [
  // 老听说族（听说前可插入频率副词——r161 教训：裸形态+带修饰都收）
  /(?:老|老是|经常|时常|常常|频频|不断|总|隔三差五|时不时|近来|最近)[^。，！？!?]{0,4}?(?:听说|听闻|耳闻|听人说起|听人说)/,
  /听(?:说|说|来)的(?:多|不少|太多了)/,
  // 老听到/经常看到族（r161 教训自查补「听到」——原族只收「看到」导致
  // 「老听到」整句漏判，听说/看到/听到/刷到四个裸动词必须同级收录）
  /(?:老|老是|经常|时常|常常|频频|不断|总|天天|隔三差五|时不时|近来|最近|整天)[^。，！？!?]{0,4}?(?:听到|听得|听见|看到|见到|看见|刷到|撞见|遇见)/,
  // 刷到/满屏/刷屏族（裸名词）
  /刷到|刷屏|满屏(?:都)?是|满屏(?:都)?在|霸屏|霸榜|屠榜/,
  // 热搜/热榜族
  /热搜|热榜/,
  // 媒体轰炸族
  /(?:电视里|电视上|新闻里|媒体|报道|媒体上|新闻上|网络上|网上|朋友圈|短视频)[^。，！？!?]{0,6}(?:老|老是|天天|经常|时常|频频|不断|整天|隔三差五)?[^。，！？!?]{0,2}(?:播|放|推|发|轰炸|连篇累牍|铺天盖地)/,
  /连篇累牍|铺天盖地|狂轰滥炸|大肆报道|密集报道/,
  // 身边/环境全是族（r161 教训自查：收「全在/都在」裸形态——「身边朋友
  // 全在聊」是环境线索主力句式，只收「全是/都是」整词会漏）
  /(?:身边|周围|四下|满眼|放眼|遍地|处处)[^。，！？!?]{0,8}(?:全是|都是|皆是|全在|都在|随处可见|比比皆是|充斥|热议)/,
  // 听得多了/看得多了族
  /(?:听得|看得|见得|遇得)(?:多|太多|不少)了/,
  // 印象里全是族（记忆提取容易度）
  /(?:印象里|印象中|记忆里|回想起来|一想起来|随便一想)[^。，！？!?]{0,10}(?:全是|都是|皆是|一大堆|好些个|好几个|很多)/,
  // 张口就来族（记忆提取容易度——「一想就能想起」「张口就能举出」：
  // 倒装形态，例子名词在后；r161 自查：动词在前的裸形态必须独立收录）
  /(?:一想|张口|随口|信手|随手)(?:就|便)?(?:能|可以)?(?:想|说|举|回忆|回想)起(?:来)?(?:的)?(?:很多|好几个|一堆|一大堆|好多|许多|不少)?/,
  /(?:例子|案例|事例|事情|新闻)(?:一下子|随手|随便|张口)?(?:就能|可以|便可)?(?:想|回忆|回想)起(?:来)?(?:的)?(?:很多|好几个|一堆|一大堆)?/,
];

// ─── 腿① AVAIL 可得性线索（英文）──────────────────────────────────
const AVAIL_EN = [
  /(?:keep|keeps|keeping|always|constantly|continually)\s+(?:hearing|hearing\s+about|seeing|reading\s+about|coming\s+across)/i,
  /all\s+I\s+(?:hear|hear\s+about|see|read\s+about)/i,
  /everywhere\s+(?:I\s+)?(?:look|turn|go)/i,
  /all\s+over\s+(?:my\s+)?(?:feed|timeline|news\s+feed|social\s+media|the\s+news|the\s+internet|the\s+internet)/i,
  /keeps?\s+(?:coming\s+up|popping\s+up|cropping\s+up|showing\s+up)/i,
  /(?:see|seeing|saw)\s+(?:it\s+)?(?:everywhere|all\s+the\s+time|all\s+over\s+the\s+place)/i,
  /(?:news|media|stories|headlines)\s+(?:is|are|keeps?|keep)?\s*(?:full\s+of|filled\s+with|bombarding|nonstop|constant\s+(?:coverage|stream))/i,
  /(?:constant|nonstop|non-stop|24\/7|round-the-clock)\s+(?:coverage|stream\s+of|barrage)/i,
  /bombarded\s+(?:with|by)/i,
  /it'?s\s+everywhere/i,
  /(?:can|could)\s+(?:easily\s+)?(?:recall|remember|name|think\s+of)\s+(?:many|several|lots\s+of|dozens\s+of)/i,
];

// ─── 腿② FREQ 频率/概率推断（中文）─────────────────────────────────
// 否定前缀保护：不代表/未必/不一定/不能说明/不等于/不意味着/推不出/
// 说明不了 紧邻时是对「曝光→频率」推理的拆解（「老听说很多，但不代表
// 真的多」是正确判别）。lookbehind alternation（Node 18 支持变长）。
const NEG_GUARD = '(?<!(?:不代表|未必|不一定|不等于|不意味着|不能说明|无法说明|推不出|说明不了|算不上))';

const FREQ_ZH = [
  // 所以很常见/越来越普遍族（裸名词+连接词形态）
  /(?:很|非常|特别|相当|极其)?(?:常见|普遍|盛行|流行|泛滥|猖獗|猖狂)/,
  /(?:越来越|愈来愈|越发|日益)(?:常见|普遍|多|频繁|严重|猖獗|泛滥)/,
  /比比皆是|屡见不鲜|遍地开花|蔚然成风|已成风气|多如牛毛|数不胜数|俯拾皆是|随处可见|遍地都是|满地都是/,
  // 大幅变化族（频率量的方向推断）
  /(?:大幅|急剧|猛|成倍|翻倍)?(?:上升|增长|增加|激增|暴涨|攀升|猛增)/,
  // 概率模态族（十有八九/大概率/八成）
  /十有八九|大概率|多半|八成|十之八九|八九不离十|想必|想必是/,
  // 高频发生族
  /屡屡(?:发生|出现)|频频(?:发生|出现)|时常发生|家常便饭|见怪不怪|天天都在|时时都在/,
  // 推断连接族（说明/表明/证明/可见 + 频率量）
  new RegExp(NEG_GUARD + '(?:说明|表明|证明|可见|足见|意味着|代表着)[^。，！？!?]{0,10}(?:很多|不少|增多|上升|增加|普遍|常见|流行|成风|泛滥|猖獗|盛行)'),
  // 看来/显然/肯定 + 频率
  new RegExp(NEG_GUARD + '(?:看来|可见|显然|想必|肯定|想必|一定|势必)[^。，！？!?]{0,8}(?:很多|不少|增多|上升|增加|普遍|常见|流行|成风|泛滥|猖獗|盛行|越来越)'),
];

// ─── 腿② FREQ 频率/概率推断（英文）─────────────────────────────────
const FREQ_EN = [
  /(?:must|has\s+to|have\s+to)\s+be\s+(?:very\s+|really\s+|increasingly\s+|getting\s+more\s+|more\s+)?(?:common|widespread|prevalent|rampant|epidemic|everywhere|frequent|dangerous|risky|unsafe|on\s+the\s+rise)/i,
  /(?:must|has\s+to|have\s+to)\s+be\s+getting\s+(?:more\s+)?(?:common|widespread|prevalent|frequent|dangerous|risky|unsafe|worse|out\s+of\s+control)/i,
  /(?:increasingly|more\s+and\s+more|ever\s+more)\s+(?:common|widespread|prevalent|frequent|rampant)/i,
  /(?:happening|occurring)\s+all\s+the\s+time/i,
  /(?:skyrocketing|exploding|surging|spiking)\s+(?:in\s+)?(?:frequency|numbers)?/i,
  /(?:must|certainly|clearly|obviously)\s+be\s+(?:rising|increasing|growing|getting\s+worse|out\s+of\s+control)/i,
  /(?:it'?s|that'?s)\s+(?:an?\s+)?(?:epidemic|epidemic\s+of|rampant|widespread|endemic)/i,
  /(?:so|therefore|thus|hence)\s+(?:it|that|this)\s+must\s+(?:be|mean)/i,
  /(?:proves?|shows?|suggests?)\s+(?:that\s+)?(?:it'?s|things\s+are)\s+(?:everywhere|out\s+of\s+control|rampant|getting\s+worse)/i,
];

// ─── 豁免一：数据/统计依据在场（结论有独立证据支持时曝光只是引子）───
const EXEMPT_EVIDENCE_ZH = [
  /(?:统计|数据|官方|通报|报告|研究|调研|普查|登记|台账)[^。，！？!?]{0,6}(?:显示|表明|指出|证实|反映)/,
  /(?:根据|依据|参照|基于)[^。，！？!?]{0,8}(?:数据|统计|报告|通报|研究|调研|记录|台账)/,
  /同比|环比|发生率|发病率|案发率|增长率/,
];
const EXEMPT_EVIDENCE_EN = [
  /(?:statistics|data|figures|official\s+(?:data|figures|records|reports)|reports|studies|research|surveys?)\s+(?:show|shows|showed|indicate|indicates|suggest|suggests|found|reveal|reveals)/i,
  /(?:according|based)\s+(?:to|on)\s+(?:the\s+)?(?:data|statistics|figures|official\s+records|research)/i,
  /year[- ]over[- ]year|per\s+capita|incidence\s+rate/i,
];

// ─── 豁免二：求证/纠正陈述（认知到偏差并主动求证是正确判别）────────
const EXEMPT_VERIFY_ZH = [
  /(?:但|但是|然而|不过|可是|只是|却|而)[^。]{0,24}(?:要看|得看|须看|待看|以[^。]{0,8}为准|有待核实|有待确认|需要核实|需要查证|还要看|仍要看|再下结论)/,
  /(?:不代表|未必|不一定|不能说明|无法说明|不等于|不意味着|推不出|说明不了|算不上)[^。]{0,12}(?:多|少|常见|普遍|上升|增加|严重|危险|如此|那样)/,
  /(?:求证|核实|查证|待证实|有待证实|需要验证|尚需确认)/,
  /(?:暴露|曝光)(?:度|量|次数)[^。]{0,8}(?:不等于|不代表|并非|不意味着)[^。]{0,8}(?:发生率|频率|概率|数量)/,
];
const EXEMPT_VERIFY_EN = [
  /(?:but|however|though|although|yet)\s+(?:I|we)\s+(?:should|need\s+to|must|have\s+to)\s+(?:check|verify|look\s+at|consult|confirm)/i,
  /(?:doesn'?t|does\s+not|don'?t|do\s+not)\s+(?:necessarily\s+)?(?:mean|prove|show|imply)/i,
  /(?:need|needs)\s+(?:more\s+)?(?:data|evidence|statistics)\s+(?:before|to)/i,
  /(?:not\s+necessarily|no\s+conclusion)\s+(?:about|on)\s+(?:the\s+)?(?:actual|real|true)/i,
  /(?:exposure|coverage|visibility)\s+(?:is|isn'?t)\s+not?\s+(?:the\s+same\s+as\s+)?(?:frequency|incidence|prevalence)/i,
];

// ─── 豁免三：概念/教学转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  /可得性(?:偏差|启发|启发式|偏误)|易得性(?:偏差|启发)/,
  /认知偏差|认知偏误|启发式(?:与|和|及)?偏差/,
];
const EXEMPT_META_EN = [
  /availability\s+(?:bias|heuristic|cascade|error)/i,
  /cognitive\s+(?:bias|biases)/i,
];

const WIN_ZH = 60;    // 中文邻近窗（字）
const WIN_EN = 160;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAvailabilityBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const A_Z = R.AVAIL_ZH || AVAIL_ZH;
  const A_E = R.AVAIL_EN || AVAIL_EN;
  const F_Z = R.FREQ_ZH || FREQ_ZH;
  const F_E = R.FREQ_EN || FREQ_EN;

  // 疑问句：问的是趋势本身，不是以曝光替代频率的断言
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 三组豁免在场 → 不是运用它
  const E_Z = R.EXEMPT_EVIDENCE_ZH || EXEMPT_EVIDENCE_ZH;
  const E_E = R.EXEMPT_EVIDENCE_EN || EXEMPT_EVIDENCE_EN;
  const V_Z = R.EXEMPT_VERIFY_ZH || EXEMPT_VERIFY_ZH;
  const V_E = R.EXEMPT_VERIFY_EN || EXEMPT_VERIFY_EN;
  const M_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const M_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(V_Z, text) || anyHit(V_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(E_Z, text) || anyHit(E_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 可得性线索
  const aZhIdx = firstHit(A_Z, text);
  const aEnIdx = firstHit(A_E, text);
  const aIdx = aZhIdx >= 0 ? aZhIdx : aEnIdx;
  if (aIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 频率/概率推断
  const fZhIdx = firstHit(F_Z, text);
  const fEnIdx = firstHit(F_E, text);
  const fIdx = fZhIdx >= 0 ? fZhIdx : fEnIdx;
  if (fIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「曝光→频率」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(aIdx - fIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '可得性偏差×曝光线索推频率结论(zh)'
      : 'availability bias×exposure-cue-to-frequency-inference(en)',
  };
}

module.exports = {
  checkAvailabilityBias,
  __internals: () => ({
    AVAIL_ZH, AVAIL_EN, FREQ_ZH, FREQ_EN,
    EXEMPT_EVIDENCE_ZH, EXEMPT_EVIDENCE_EN,
    EXEMPT_VERIFY_ZH, EXEMPT_VERIFY_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
