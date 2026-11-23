/**
 * src/narrative-fallacy.js — 「叙事谬误（narrative fallacy）」检测器
 * （第 289 个判别维度）
 *
 * [r463 立项] decision 本体在当前引擎（v6.8.228，288 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自内部缺口实证（r463 探针
 * /root/hermes1/cache/scratch/probe-r463-nf.js，直调 src/gate.js）：
 * 叙事谬误族 5 条攻击样本 **5 条穿过硬闸门且零维度命中**（「把这件事从头
 * 到尾串起来看，他的失败是注定的。」「回头一看，每一步都环环相扣，这个
 * 结果毫无意外。」「整件事情顺着脉络捋一遍，公司倒闭是迟早的事。」EN
 * "Looking back, every step led inevitably to this outcome."「把线索连起
 * 来看，这一切都是精心策划的。」），良性 3/3 零误判。概念来源为 Nassim
 * Nicholas Taleb《黑天鹅》中的 narrative fallacy（事后连贯化叙述把随机/
 * 多因结果讲成单一必然故事）——纯规则引擎可实现该形状的判别，不引入任何
 * LLM 依赖。
 *
 * 辨别的族：叙事谬误（narrative fallacy）——**用「串起来看/环环相扣/顺着
 * 脉络捋」的连贯化叙述框架，配上「注定/迟早/毫无意外」的必然化断言，把
 * 充满偶然与多因的结果追认成单一必然故事**。与事后聪明偏差的分工：
 * hindsight_bias（第175维）管「事后本可预见」的**判断力虚构**（早知如
 * 此/明眼人/迹象一直都在），腿①是回望立场标记（事后看来/looking back）；
 * 本族腿①是**连贯化叙述动作**（把线索连起来/顺着脉络捋一遍/every step
 * led）——强调「叙述自身制造了连贯感」，且腿②必然化断言不必是事前可预
 * 见形（「迟早的事」是事后归因，不是事前预言）。二者可共现但要件不同：
 *   把这件事从头到尾串起来看，他的失败是注定的。
 *   回头一看，每一步都环环相扣，这个结果毫无意外。
 *   整件事情顺着脉络捋一遍，公司倒闭是迟早的事。
 *   这些线索拼在一起，真相已经很明显了。
 *   Looking back, every step led inevitably to this outcome.
 *   Piece the clues together and the pattern is unmistakable.
 *   The whole thing fits together too neatly to be a coincidence.
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① COHERE 连贯化叙述框架（中文）：把…串起来/连起来/拼在一起/拢在一
 *     起/拼图/拼起来/环环相扣/一环扣一环/丝丝入扣/严丝合缝/顺着脉络/顺着
 *     线索/顺着时间线/捋一遍/捋一捋/梳理下来/串成线/连成线/对上了/全都对
 *     上了/越看越/回过头看/从头到尾/整体来看/联系起来/贯连/因果链/一条线
 *     （EN: string together / piece together / connect the dots / it all
 *     fits / fits together / hangs together / adds up / the whole thing /
 *     every step led / led to this / links up / the pattern / the bigger
 *     picture / woven together / thread through / falls into place）；
 *   腿② INEVIT 必然化断言（中文）：注定/迟早/早晚/必然/毫无意外/毫无悬念/
 *     一点都不意外/不是偶然/绝非偶然/注定如此/命定/在劫难逃/大势所趋/
 *     不可逆转/顺理成章/水到渠成/意料之中/毫无二致/一环都少不了/少任何
 *     一步都/剧本/写好的/安排好的/精心策划/蓄谋已久/早有预谋/不是巧合/
 *     太巧合（EN: inevitable / inevitably / bound to / doomed / no accident
 *     / not a coincidence / too neat / too perfect / meant to be / written
 *     in the stars / scripted / choreographed / orchestrated / by design /
 *     premeditated / masterminded / planned all along / foregone
 *     conclusion / only a matter of time）。
 *   窗：中文 60 字双朝向（覆盖「连贯框架在前、必然断言在后」主形与
 *   「注定失败，把线索串起来看确实如此」倒装形）；EN 150 字符双朝向。
 *
 * 为什么取 VERIFY 级：叙事谬误是**认识论立场错误**而非事实错误——结论可
 * 能对，但「连贯叙述 = 必然性」的推断把事后编故事的能力当成对因果结构的
 * 理解，会系统性高估世界的可解释性、低估随机性与多因性，进而错误总结规
 * 律、错误追责、对巧合赋予解释力。规则引擎无法判定该结果是否真的注定，
 * 只能识别「连贯化框架 × 必然化断言」的形态。verify 的含义是「先核查是
 * 否存在真正的必然机制再采信」：调用方应要求补上机制证据、偶然性空间与
 * 反事实检验，而不是把叙述的流畅当成真理的代理。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（叙事谬误/叙事偏差/叙述谬误/后见之明/认知偏差/心理学/
 *     行为经济学/黑天鹅/反脆弱/教科书/教材/文献/概念/理论/谬误/偏见/偏差/
 *     效应/启发式/随机性/概率论；EN narrative fallacy / cognitive bias /
 *     behavioral economics / black swan / antifragile / textbook / fallacy /
 *     literature / randomness / probability / heuristic）——讨论这个概念本身
 *     是正确判别；
 *   · 偶然性承认（偶然/巧合/随机/未必/不一定/多种可能/存在变数/充满不确定/
 *     谁也想不到/没人能预料/难以预料/无法预测/事出偶然/一念之差/一步之遥/
 *     差一点/侥幸；EN coincidence / random / by chance / serendipity / could
 *     have gone either way / unpredictable / no way to know / luck / fluke）——
 *     承认偶然与多因是叙事谬误的**反面**；
 *   · 多因陈述（多因/多种因素/多个因素/因素很多/错综复杂/交织/叠加/共同作用/
 *     综合作用/不是单一/不能简单归结/不能一概而论/不能简单归因；EN multiple
 *     causes / many factors / a combination of / confluence of / complex
 *     interplay / cannot be reduced to / not a single）——把结果归给多因
 *     是正确的因果纪律；
 *   · 推理否定/劝诫（不可取/要不得/别把/不能把/不可将/警惕/避免/防止/切忌/
 *     拒绝/不等于/并不意味着/不能说明/不可由此/叙事谬误的问题/当心/谨防；
 *     EN do not / don't / avoid / beware / resist / guard against / is a
 *     mistake / should not）——拒绝该倾向本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/似乎/好像/说不定/多半/很难说/
 *     不见得/待验证/有待/按理/照理；EN maybe / perhaps / might / possibly /
 *     probably / seems / appears / could be）——概率化表述不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① COHERE 连贯化叙述框架（中文；161 轮教训自查：裸名词形态）─────────
// 形状是「把分散事件编成一个连贯整体」的叙述动作，而非单纯回望立场——
// 这是与 hindsight_bias 腿① HS 的分界线。
const COHERE_ZH = [
  /串起来|串成[一]?[条线]|串成一|连起来|连成[一]?[条线]|连成一|拼在一起|拼起来|拼成一|拢在一起|归纳到|归拢到/,
  /环环相扣|一环扣一环|一环紧扣|丝丝入扣|严丝合缝|环环相连|环环相因/,
  /顺着脉络|顺着线索|顺着时间线|顺着这条线|沿[着]?脉络|沿[着]?线索/,
  /捋一遍|捋一捋|捋清|梳理下来|梳理一遍|理一遍|理清楚|串[起成]?线索/,
  /对上了|全对上了|都对上了|完全吻合|严丝合缝|完全印证|彼此印证/,
  /从头到尾|来龙去脉|前因后果|因果关系链|因果链|一条线|贯穿下来|贯连|一脉相承/,
  /拼图|拼成[一]?[幅张]?[完整]?|图景|全貌|完整[的故]?事|故事[的全]?貌/,
  /回过头看|回头再看|整体[看起]?来|总体来看|合起来看|放在一起|联想到一起/,
  /越看越/,
];

// ─── 腿② INEVIT 必然化断言（中文）──────────────────────────────────────
const INEVIT_ZH = [
  /注定|迟早|早晚|必然|毫无意外|毫无悬念|一点都不意外|并不意外|不是偶然|绝非偶然|绝非偶发|事出必然/,
  /命定|在劫难逃|大势所趋|不可逆转|不可阻挡|顺理成章|水到渠成|意料之中|毫无二致/,
  /一环都少不了|少任何[一]?步|少了[哪]?一步|一步都[不]?错|每[一]?步[都]?精[确准]/,
  /剧本|写好的|安排好的|精心策划|蓄谋已久|早有预谋|蓄意[安谋]?排|不是巧合|太过?巧合|太完美/,
  /逃不掉|躲不掉|避无可避|无以避免|无法避免|不可避免|无从避免/,
  // [r463 收尾补] 轮测发现的腿②缺口：「真相已经很明显了」「明摆着」
  //   ——「拼在一起/串起来」的连贯动作配上「真相明显」的断言，即把
  //   叙述流畅当成真相确凿。与「毫无疑问/确凿」分工：本族收事后
  //   追认形（真相/事实 + 明显/清楚/摆在），不收论证中的确定性表态。
  /真相(?:已经|早就|已|显然|根本)?(?:很|非常|再|显然)?(?:明显|清楚|明白|摆在|明摆)/,
  /事实(?:已经|早就|已)?(?:很|再)?(?:明显|清楚|明白)/,
  /明摆着|昭然若揭|一目了然|一目便知|再清楚不过|再明显不过|毫无疑义|毫无疑问|确凿无疑|铁证如山/,
];

// ─── 英文侧 ─────────────────────────────────────────────────────────────
const COHERE_EN = [
  /\b(?:string\s+(?:it\s+)?together|piece[sd]?\s+(?:it\s+)?together|connect\s+the\s+dots|put\s+(?:it\s+|the\s+pieces\s+)?together|fits?\s+together|hangs?\s+together|adds?\s+up|it\s+all\s+fits|comes\s+together|fell\s+into\s+place|falls\s+into\s+place|links?\s+up|ties?\s+(?:it\s+)?together|weave[sn]?\s+together|thread(?:ed|s)?\s+through)\b/i,
  /\b(?:every\s+step\s+(?:led|leads|pointed)|led\s+(?:inevitably|directly|straight)\s+to|led\s+to\s+this|led\s+us\s+here|led\s+to\s+the|chain\s+of\s+events|links?\s+in\s+the\s+chain|one\s+thing\s+led\s+to)\b/i,
  /\b(?:the\s+whole\s+thing|the\s+bigger\s+picture|the\s+pattern|the\s+full\s+picture|the\s+narrative|the\s+story\s+(?:all|comes)|the\s+timeline)\b/i,
  /\b(?:too\s+neat|too\s+perfect|too\s+convenient|too\s+tidy|suspiciously\s+(?:neat|perfect|convenient|tidy))\b/i,
];
const INEVIT_EN = [
  /\b(?:inevitable|inevitably|unavoidable|bound\s+to|doomed|foregone\s+conclusion|no\s+accident|not\s+a\s+coincidence|wasn'?t\s+an\s+accident|weren'?t\s+an\s+accident|meant\s+to\s+be|written\s+in\s+the\s+stars)\b/i,
  /\b(?:scripted|choreographed|orchestrated|by\s+design|premeditated|masterminded|planned\s+all\s+along|engineered|set\s+up|rigged|stacked\s+the\s+deck)\b/i,
  /\b(?:only\s+a\s+matter\s+of\s+time|was\s+always\s+going\s+to|were\s+always\s+going\s+to|had\s+to\s+happen|was\s+inevitable|could\s+never\s+have\s+(?:worked|succeeded|been\s+avoided))\b/i,
  // [r463 收尾补] 轮测发现的腿②缺口：「the pattern is unmistakable」
  //   ——连贯化框架配上「真相确凿」断言，把叙述流畅当成证据确凿。
  /\b(?:the\s+(?:truth|answer|picture|pattern|story|explanation)\s+is\s+(?:unmistakable|clear|obvious|indisputable|crystal\s+clear|plain\s+to\s+see)|unmistakable|indisputable|cannot\s+be\s+a\s+coincidence|can'?t\s+be\s+a\s+coincidence|leaves?\s+no\s+doubt|beyond\s+(?:any\s+)?doubt)\b/i,
  // 「too neatly to be a coincidence」形（Taleb 原文句式）：连贯得过分
  //   所以不是巧合。r463 轮测攻击[7]「The whole thing fits together
  //   too neatly to be a coincidence.」专项补收。
  /\btoo\s+(?:neatly|perfectly|smoothly|cleanly|tidily|well|conveniently)\s+to\s+be\s+(?:a\s+)?(?:coincidence|accident|chance)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /叙事谬误|叙事偏差|叙述谬误|叙事陷阱|后见之明|事后聪明|认知偏差|认知偏见|心理学|行为经济学|行为金融|黑天鹅|反脆弱|随机性|概率论|教科书|课本|教材|文献|综述|概念|理论|谬误|误区|偏见|偏差|效应|启发式|认识论/,
];
const EXEMPT_META_EN = [
  /\b(?:narrative\s+fallacy|cognitive\s+bias|behavioral\s+economics|behavioural\s+economics|black\s+swan|antifragile|textbook|fallacy|literature|heuristic|randomness|probability\s+theory|epistemolog\w+|meta[- ]analysis)\b/i,
];

// ─── 豁免二：偶然性承认（叙事谬误的反面）───────────────────────────────
const EXEMPT_CHANCE_ZH = [
  /偶然|巧合|随机|未必|不一定|多种可能|存在变数|充满不确定|谁也不[想知]?到|没人能[预料想]?|难以预料|无法预测|难以预测|事出偶然|一念之差|一步之遥|差一点|侥幸|运气|变数|不可预料/,
];
const EXEMPT_CHANCE_EN = [
  /\b(?:coincidence|coincidental|random|by\s+chance|serendipity|fortuitous|could\s+have\s+gone\s+either\s+way|unpredictable|no\s+way\s+to\s+know|just\s+luck|fluke|turn\s+of\s+events|chance\s+events?)\b/i,
];

// [r463 收尾补] 「否认偶然」语境守卫：下列形里的 coincidence/accident/
// chance 处于否认偶然的语义（too X to be a coincidence / not merely a
// coincidence / more than a coincidence / beyond coincidence），是必然化
// 断言的组成部分，不得触发「承认偶然」豁免。
// r463 轮测攻击[7] 误杀实证："The whole thing fits together too neatly
// to be a coincidence."——腿①腿②均已命中，却因句尾 coincidence 被整句
// 豁免。注意守卫正则自身含 coincidence，不能放进 EXEMPT_CHANCE_EN 列表
// （anyHit 会自我触发），必须走独立条件判断。
const NEGATED_CHANCE_EN = [
  /\btoo\s+\w+\s+to\s+be\s+(?:a\s+)?(?:coincidence|accident|chance)\b/i,
  /\b(?:not\s+merely|more\s+than\s+just|far\s+more\s+than|hardly\s+)?(?:a\s+)?(?:coincidence|accident)\b[^.]{0,40}\b(?:but|rather|instead|it'?s|it\s+is|was|is)\b/i,
  /\bbeyond\s+(?:mere\s+|simple\s+|pure\s+)?(?:coincidence|chance|accident)\b/i,
];

// ─── 豁免三：多因陈述（把结果归给多因是正确的因果纪律）─────────────────
const EXEMPT_MULTI_ZH = [
  /多因|多种因素|多个因素|因素[很太]?多|错综复杂|交织|叠加|共同作用|综合作用|不是单一|不能简单归结|不能一概而论|不能简单归因|诸[多]?因|各有[贡作]?献|缺一不可|多[种个]?因素[共]?同/,
];
const EXEMPT_MULTI_EN = [
  /\b(?:multiple\s+causes|many\s+factors|several\s+factors|a\s+combination\s+of|confluence\s+of|complex\s+interplay|cannot\s+be\s+reduced\s+to|not\s+a\s+single|multifactorial|many\s+things\s+contributed|contributed\s+to)\b/i,
];

// ─── 豁免四：推理否定/劝诫 ──────────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不可取|要不得|别把|别将|不能把|不能将|不可将|警惕|要避免|须避免|尽量避免|以避免|避免陷入|防止|切忌|拒绝|抵制|当心|谨防|不等于|并不意味着|不能说明|不可由此|勿以|莫以|留神/,
];
const EXEMPT_NEG_EN = [
  /\b(?:do\s+not|don'?t|avoid|beware|resist|guard\s+against|is\s+a\s+mistake|should\s+not|shouldn'?t|cautionary|be\s+careful\s+not|is\s+not\s+to\s+say)\b/i,
];

// ─── 豁免五：对冲 ───────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|很难说|不见得|待验证|有待|按理|照理|估计|大约|左右/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|possibly|probably|seems?|appears?|could\s+be|i\s+suspect|roughly|approximately|around)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿：COHERE × INEVIT 双朝向 60 字窗 */
function narrativeZh(text, R) {
  if (nearAny(R.COHERE_ZH || COHERE_ZH, R.INEVIT_ZH || INEVIT_ZH, text, 60, true)) return 'cohere×inevit';
  return null;
}

/** 英文腿：COHERE × INEVIT 双朝向 150 字符窗 */
function narrativeEn(text, R) {
  if (nearAny(R.COHERE_EN || COHERE_EN, R.INEVIT_EN || INEVIT_EN, text, 150, true)) return 'cohere×inevit';
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkNarrativeFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 偶然性承认 / 多因陈述 / 推理否定劝诫 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 豁免二：偶然性承认（叙事谬误的反面）——带 NEGATED_CHANCE_EN 守卫：
  // r463 轮测攻击[7]「The whole thing fits together too neatly to be a
  // coincidence.」误杀实证——两腿均命中，却因句尾 coincidence 触发本
  // 豁免整句放行。守卫设计见上方 NEGATED_CHANCE_EN 注释：too X to be a
  // coincidence 族里的 coincidence 处于「否认偶然」语义（是必然化断言的
  // 组成部分），不得触发本豁免。
  if (!anyHit(R.NEGATED_CHANCE_EN || NEGATED_CHANCE_EN, text)) {
    if (anyHit(R.EXEMPT_CHANCE_ZH || EXEMPT_CHANCE_ZH, text) || anyHit(R.EXEMPT_CHANCE_EN || EXEMPT_CHANCE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_MULTI_ZH || EXEMPT_MULTI_ZH, text) || anyHit(R.EXEMPT_MULTI_EN || EXEMPT_MULTI_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const leg = isZh ? narrativeZh(text, R) : narrativeEn(text, R);
  if (!leg) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.6, count: 1,
    detail: isZh
      ? '叙事谬误×连贯化叙述冒充必然性(' + leg + ',zh)'
      : 'narrative fallacy×coherent-narrative-as-inevitability(' + leg + ',en)',
  };
}

module.exports = {
  checkNarrativeFallacy,
  __internals: () => ({
    COHERE_ZH, INEVIT_ZH, COHERE_EN, INEVIT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_CHANCE_ZH, EXEMPT_CHANCE_EN,
    NEGATED_CHANCE_EN,
    EXEMPT_MULTI_ZH, EXEMPT_MULTI_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
