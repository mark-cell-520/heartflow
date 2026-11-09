/**
 * src/hindsight-bias.js — 「事后聪明偏差（hindsight bias / 后见之明 /
 * knew-it-all-along effect）」检测器
 * （第 175 个判别维度）
 *
 * [r177 立项] decision 本体在当前引擎（v6.8.104，174 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "hindsight bias"
 * 命中 "Hindsight bias: unobvious effects of (in Software Engineering)"
 * （objectID 15429242）、"Hindsight Bias and Innovation"（14115127）、
 * "Software Requirements and Hindsight Bias"（12925764）——确认事后聪明是
 * 公认认知偏差；GitHub 检索无纯规则文本判别实现，均为学术数据科学仓库
 * （Baichenjia/BHER ★7 等），仅作概念背景；Semantic Scholar 无返回，如实
 * 记录）+ 引擎差距实测（r177 探针 /tmp/hf-probe-r177.js，直调 src/gate.js）：
 * 事后聪明族 10 条攻击样本 **7 条穿过硬闸门且零维度命中**（「这件事早就
 * 注定会失败，明眼人一开始都能看出来」「I knew it all along — the outcome
 * was inevitable from the start.」「这场危机早就埋下了伏笔，聪明人一眼
 * 就能看穿」「we all knew this project would collapse eventually」等），
 * 良性 6/6 零误判。
 *
 * 辨别的族：事后聪明偏差（hindsight bias / 后见之明 / knew-it-all-along）
 * ——**把事后已知的结果当成事前本可预见、注定如此的**，用后见之明倒推
 * 事前的判断力，混淆「事后知道」与「事前可知」：
 *   这件事早就注定会失败，明眼人一开始都能看出来。
 *   我早就知道他会背叛我们，一切都在意料之中。
 *   事后看来这一切都很明显，当时我们太迟钝了。
 *   这场危机早就埋下了伏笔，聪明人一眼就能看穿。
 *   This was always going to fail; anyone could have seen it coming.
 *   I knew it all along — the outcome was inevitable from the start.
 *   Hindsight makes it obvious, but we should have known better.
 *   we all knew this project would collapse eventually.
 *
 * 与既有维度的边界（r177 归因）：
 *   · overclaim_already_knew / overclaim_predict 是 overclaim 维度的子信号，
 *     **仅计分不触发闸门**（r176 归因，实测零命中穿过），本族补的正是
 *     闸门级判别；
 *   · perfect_error（第3维族）管「声称零失误/一贯正确」的自我完美化，
 *     本族管「把事后结果倒推为事前注定」的可预见性虚构；
 *   · wishful_thinking（第147维）管「愿望当论据」的将来时一厢情愿，
 *     本族主语是**已发生结果**的回望断言，时态与立场都不同；
 *   · fatalism/决定论表述不判——「一切天注定」类无具体已发生结果锚点，
 *     由本族腿③ OUT 的缺席自然排除。
 *
 * 判据（三形任一，命中即判）：
 *   腿① HS 事后框架（回望立场标记）——强形单腿可命中的只有成语形
 *     （事后诸葛亮/马后炮；EN after-the-fact / Monday morning quarterback）；
 *     弱形（事后/事后诸葛亮之外的事后类/如今/现在回想/回过头/回望/以今天
 *     的眼光；EN in hindsight / with hindsight / looking back / in retrospect
 *     / with the benefit of hindsight / now that we know）必须与腿②共现；
 *   腿② PRED 注定/事前可预见断言——强形（早就注定/从一开始就注定/命定/
 *     不出所料/果不其然/可想而知/迹象一直都在/明眼人/一眼就能看穿/一看
 *     便知；EN was always going to / doomed / inevitable / unavoidable /
 *     should have known / should have seen / could have seen / anyone could
 *     have / we all knew / knew it all along / saw it coming / signs were
 *     there / foregone conclusion / never had a chance / only a matter of
 *     time）**单腿可命中**——这些词形内嵌「从事前起点回望」的事后语义；
 *     事后断言子集 POST（早就知道/早就看出/早就预见/早就明白/迹象一直都
 *     在/伏笔/埋下伏笔/可想而知/本该看出/本可预见/当时就该/显而易见/
 *     很明显）与腿③共现判定；弱形（注定/迟早/早晚/必然/很明显/显而易见；
 *     EN bound to / obvious / clearly / predictable / foreseeable）只与
 *     腿①共现判定（不与 OUT 共现——「这场比赛注定会赢」是赛前打气）；
 *   腿③ OUT 已发生结果事件（失败/倒闭/破产/崩溃/崩塌/爆雷/翻车/暴跌/
 *     暴涨/危机/灾难/出事/分手/离婚/背叛/夺冠/落榜/去世/中奖/没有未来/
 *     垮掉/完蛋/跑路/裁员/退市/崩盘/战败/惨败/栽跟头；EN failed / failure
 *     / collapse / crashed / bankrupt / betrayal / betrayed / fell apart /
 *     blew up / defeat / disaster / crisis / broke up / divorced / lost /
 *     tanked / flopped）——把注定断言锚定到具体已发生结果上，排除「未来
 *     注定会更好」类将来时一厢情愿（归 wishful_thinking）。
 *
 * 为什么取 VERIFY 级：事后聪明是**认识论立场错误**而非事实错误——结论
 * 本身可能对，但「事前本可预见」的推断把后见之明冒充成判断力，会系统性
 * 高估可预测性、低估决策当时的信息约束，进而错误追责、错误总结规律。
 * 规则引擎无法判定该结果事前是否真的可预见，只能识别「事后回望 × 注定
 * 断言」的形态。verify 的含义是「先核查事前信息集再采信」：调用方应要求
 *   补上事前可获得的证据（决策时点的信息集/当时的主流判断/事前概率记录），
 *   而不是把事后结果当成事前判断力的评分依据。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（事后聪明偏差/后见之明偏差/事后偏差/认知偏差/心理学/
 *     行为经济学/决策研究/教科书/文献/概念/理论/谬误/偏见；EN hindsight
 *     bias / cognitive bias / behavioral economics / decision research /
 *     well-documented / classic / textbook）——讨论这个偏差本身是正确判别；
 *   · 正确的事后学习（承认信息边界：新信息/后来才知道/当时无法知道/信息
 *     不足/以现在的/新的证据/事后数据/复盘/反思/现在才知道/谁能想到/谁也
 *     想不到/没人能想到/谁也无法预料/事前无人/无人能预料；EN with new
 *     information / we now know / only later / the data we have now /
 *     information was not available / not available at the time / nobody
 *     could have / no one could have / who could have predicted / could not
 *     have known / impossible to predict / no way to know）——这是事后聪明
 *     的**反面**：用复盘改进事前流程而不是倒推判断力；
 *   · 事前正当评价（事前/事先/在当时的信息/以当时/当时的信息/当时掌握/
 *     当时所知/当时的条件/如果当时/倘若当时/若是当时；EN beforehand /
 *     ex ante / at the time / if we had known / had we known / based on
 *     what we knew then / at that point）——以决策时点信息为参照系的评价是
 *     正确判别；
 *   · 推理否定/劝诫（不可取/要不得/别把/不能把/不可将/警惕/避免/防止/
 *     拒绝做事后诸葛亮/不要做事后诸葛亮；EN do not judge / don'?t judge /
 *     avoid / beware of / resist / guard against / is a mistake / should
 *     not）——拒绝该倾向本身是正确判别；
 *   · 对冲（也许/可能/说不定/或许/大概/似乎/未必/很难说/不见得/恐怕；
 *     EN maybe / perhaps / might / may have / possibly / probably / seems /
 *     appears）——概率化表述不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 *
 * [r265] 全新措辞家族扩展（真升级②，live 生效，维度计数不变）：
 * r265 池化探针（coordination/agent4/probes/r265-probe-pool.js，v6.8.156
 * 实测）本族 7 条新措辞攻击 5 条穿透（gate=pass 且零维度承重），落地：
 *   · PRED_POST_ZH += 事后声言族（我早就说过/当初我就料到/一早就料到）
 *     + 果然/果真应验副词（须与 OUT 共现）
 *   · OUT_ZH += 口语化结果族（出轨/黄了/挂了/离了/吹了/闹翻/谈崩）
 *   · PRED_POST_EN += 第一人称事后应验族（just as I expected/predicted/
 *     as I expected/exactly what I expected/I called it）
 *   · OUT_EN += 企业死亡口语族（died/shut down/folded/went under/wound
 *     down/flamed out/pulled the plug）
 *   · EXEMPT_NEWINFO_EN += post-mortem / retrospective review / lessons
 *     learned（与 ZH 复盘同族的正确事后学习豁免；探针良性句误伤同族扩展）
 *   未落地如实记录：「这对果然分了」的「分了」无动词后缀且多义（把钱分了
 *   为中性义），不造第三条判别路径，改用分手形覆盖。
 */
'use strict';

// ─── 腿① HS 事后框架（中文；161 轮教训自查：裸名词形态）─────────────────
// 「事后」二字即收——「事后看来/事后看去/事后回头」同族全覆盖；「如今/
// 现在回想/回过头/回望」均为回望立场标记。成语形（事后诸葛亮/马后炮）
// 单腿可命中：成语本身就是完整的事后聪明表述。
const HS_ZH = [
  /事后诸葛亮|马后炮/,
  /事后|如今|现在回想|现在回头看|回过头|回头来看|回头想想|回望|以今天的眼光|以现在的眼光|以今日之见|今天再看|今天看来|如今看来|如今再看|站在今天/,
];

// ─── 腿② PRED 强形：单腿可命中（中文，内嵌事后倒推语义）─────────────────
const PRED_STRONG_ZH = [
  /早就注定|从一开始就注定|从一开始就注定|命定|不出所料|果不其然|可想而知|迹象一直都在|明眼人|一眼就能看穿|一看便知|一眼就能看出|一眼就能看透|一开始就能看出|从一开始就能看出/,
];

// ─── 腿② PRED POST 事后断言子集：与腿③ OUT 共现判定（中文）──────────────
const PRED_POST_ZH = [
  /早就知道|早就看出|早就预见|早就明白|早就该知道|伏笔|埋下伏笔|可想而知|迹象一直都在|本该看出|本可预见|当时就该|当时就应该|显而易见|很明显|谁都能看出|都能看出|谁都看得出来|一眼看出|一看就知道|一看便知|意料之中|早在意料|命中注定|冥冥注定|上天注定/,
  // [r265] 新族：「我早就说过/当初我就料到」类事后声言 + 果然/果真（事后
  // 应验副词，须与 OUT 共现）——r265 池化探针实测「事实证明她的眼光一直
  // 很准」「我早说过那个功能没人用」整族穿透（PRED_POST_ZH 无声言形）
  /早就料到|早料到|当初就料到|一早就料到|我早说过|我早就说过|当初我就说|当初我就料到|早就提醒过|早就提醒|果然|果真/,
];

// ─── 腿② PRED WEAK 弱形：只与腿① HS 共现判定（中文）────────────────────
// 刻意不收「注定」与 OUT 共现——「这场比赛我们注定会赢」是赛前打气，
// 良性；「注定」只在 HS 共现（「如今看来注定失败」）时承重。
const PRED_WEAK_ZH = [
  /注定|迟早|早晚|必然|不可避免|很明显|显而易见|早就知道|早就看出|早就预见|伏笔|埋下伏笔|迹象一直都在/,
];

// ─── 腿③ OUT 已发生结果事件（中文，裸名词形态）─────────────────────────
const OUT_ZH = [
  /失败|倒闭|破产|崩溃|崩塌|爆雷|翻车|暴跌|暴涨|危机|灾难|出事|分手|离婚|背叛|夺冠|落榜|去世|中奖|没有未来|没有前途|垮掉|完蛋|跑路|裁员|退市|崩盘|战败|惨败|栽[^，。；！？,.!?;]{0,4}跟头/,
  // [r265] 新族：出轨/黄了/挂了/离了/谈崩——口语化结果事件（探针实测
  // 「他后来果然出轨了」穿透，OUT_ZH 无感情/项目口语结果形）
  /出轨|黄了|挂了|离了|吹了|闹翻|谈崩/,
];

// ─── 英文侧 ─────────────────────────────────────────────────────────────
const HS_EN = [
  /\b(?:after[- ]the[- ]fact|monday\s+morning\s+quarterback)\b/i,
  /\b(?:in\s+hindsight|with\s+hindsight|hindsight\s+makes?|looking\s+back|in\s+retrospect|with\s+the\s+benefit\s+of\s+hindsight|now\s+that\s+we\s+know|rear[- ]?view\s+mirror)\b/i,
];
const PRED_STRONG_EN = [
  /\b(?:was\s+always\s+going\s+to|were\s+always\s+going\s+to|doomed|inevitable|unavoidable|should\s+have\s+known|should\s+have\s+seen|should\s+have\s+realized|should\s+have\s+realised|could\s+have\s+seen|could\s+have\s+been\s+seen|could\s+have\s+predicted|anyone\s+could\s+have|everyone\s+could\s+have|we\s+all\s+knew|knew\s+it\s+all\s+along|knew\s+all\s+along|saw\s+it\s+coming|saw\s+this\s+coming|signs\s+were\s+there|foregone\s+conclusion|never\s+had\s+a\s+chance|never\s+stood\s+a\s+chance|only\s+a\s+matter\s+of\s+time|predictable\s+in\s+hindsight|obvious\s+in\s+hindsight)\b/i,
];
const PRED_POST_EN = [
  /\b(?:knew\s+all\s+along|knew\s+it\s+all\s+along|should\s+have\s+known|should\s+have\s+seen|should\s+have\s+realized|should\s+have\s+realised|signs\s+were\s+there|bound\s+to\s+fail|bound\s+to\s+happen|was\s+foreseeable|were\s+foreseeable|entirely\s+predictable|clearly\s+predictable|anyone\s+can\s+see|everyone\s+can\s+see|anyone\s+could\s+see|came\s+as\s+no\s+surprise|was\s+to\s+be\s+expected|only\s+to\s+be\s+expected)\b/i,
  // [r265] 新族：just as I expected/predicted 直述事后应验——r265 池化
  // 探针实测「just as I expected from day one」「just as I predicted」
  // 整族穿透（PRED_POST_EN 无第一人称事后应验形）
  /\b(?:just\s+as\s+I\s+(?:expected|predicted|said|warned|thought|figured)|as\s+I\s+(?:expected|predicted|warned)|exactly\s+(?:what|as)\s+I\s+(?:expected|predicted)|I\s+called\s+it)\b/i,
];
const PRED_WEAK_EN = [
  /\b(?:bound\s+to|obvious|obviously|clearly|predictable|foreseeable|inevitable|doomed)\b/i,
];
const OUT_EN = [
  /\b(?:failed|failure|fails|collapse|collapsed|crash|crashed|bankrupt|bankruptcy|betrayal|betrayed|fell\s+apart|blew\s+up|blown\s+up|defeat|disaster|crisis|broke\s+up|divorced|lost|losing|tanked|flopped|never\s+stood\s+a\s+chance|never\s+had\s+a\s+chance)\b/i,
  // [r265] 新族：died / shut down / folded / went under——企业死亡与产品
  // 下线的口语形（探针实测「The startup died last month」穿透）
  /\b(?:died|shut\s+down|folded|went\s+under|wound\s+down|flamed\s+out|pulled\s+the\s+plug)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /事后诸葛亮是|事后聪明偏差|事后聪明偏见|后见之明偏差|事后偏差|事后聪明效应|认知偏差|认知偏见|心理学|行为经济学|行为金融|决策研究|判断研究|教科书|课本|教材|文献|综述|概念|理论|谬误|误区|偏见|偏差|效应|启发式/,
];
const EXEMPT_META_EN = [
  /\b(?:hindsight\s+bias|cognitive\s+bias|behavioral\s+economics|behavioural\s+economics|decision\s+research|judgment\s+research|well[- ]documented|textbook|heuristic|fallacy|literature|meta[- ]analysis|is\s+a\s+classic|classic\s+example)\b/i,
];

// ─── 豁免二：正确的事后学习（承认信息边界——事后聪明的反面）──────────────
const EXEMPT_NEWINFO_ZH = [
  /新信息|后来才知道|后来才明白|事后数据|现在才知道|如今才明白|复盘|反思|总结教训|总结经验|当时无法知道|当时无从得知|信息不足|信息有限|所知有限|以现在的|新的证据|事后补充|谁能想到|谁也想不到|没人能想到|谁也无法预料|事前无人|无人能预料|无人能料到|当时没人|没人能预料|天知道|谁想到/,
];
const EXEMPT_NEWINFO_EN = [
  /\b(?:with\s+new\s+information|new\s+information|we\s+now\s+know|only\s+later|the\s+data\s+we\s+have\s+now|information\s+was\s+not\s+available|not\s+available\s+at\s+the\s+time|wasn'?t\s+available\s+at\s+the\s+time|nobody\s+could\s+have|no\s+one\s+could\s+have|who\s+could\s+have\s+predicted|who\s+could\s+have\s+foreseen|could\s+not\s+have\s+known|couldn'?t\s+have\s+known|impossible\s+to\s+predict|impossible\s+to\s+foresee|no\s+way\s+to\s+know|no\s+way\s+of\s+knowing|in\s+fairness|with\s+the\s+benefit\s+of\s+hindsight\s+we)\b/i,
  // [r265] 新族：post-mortem / retrospective review / lessons learned——
  // 正式事后复盘是正确事后学习（与 ZH 复盘/反思同族），探针良性实测误伤
  /\b(?:post-?mortem|retrospective\s+(?:analysis|review|report|look)|lessons\s+learned)\b/i,
];

// ─── 豁免三：事前正当评价（以决策时点信息为参照系）──────────────────────
// 刻意不收裸「当时」——「当时我们太迟钝了」是事后自责（本族攻击形），
// 良性形必须带信息/条件限定（「在当时的信息条件下这个决定是合理的」）。
const EXEMPT_EXANTE_ZH = [
  /事前|事先|在当时的信息|以当时|当时的信息|当时掌握|当时所知|当时的条件|当时情况|如果当时|倘若当时|若是当时|早在之前|预先|先见之明|事前诸葛亮/,
];
const EXEMPT_EXANTE_EN = [
  /\b(?:beforehand|ex\s+ante|at\s+the\s+time|at\s+that\s+point|if\s+we\s+had\s+known|had\s+we\s+known|based\s+on\s+what\s+we\s+knew|based\s+on\s+what\s+was\s+known|with\s+the\s+information\s+available|the\s+information\s+available\s+then)\b/i,
];

// ─── 豁免四：推理否定/劝诫（拒绝该倾向本身是正确判别）───────────────────
const EXEMPT_NEG_ZH = [
  /不可取|要不得|别把|别将|不能把|不能将|不可将|警惕|要避免|须避免|尽量避免|以避免|避免陷入|避免犯错|防止|切忌|不要做事后诸葛亮|别做事后诸葛亮|拒绝|抵制|不等于|并不意味着|不能说明|不可由此|勿以|莫以/,
];
const EXEMPT_NEG_EN = [
  /\b(?:do\s+not\s+judge|don'?t\s+judge|avoid|beware|resist|guard\s+against|is\s+a\s+mistake|should\s+not|shouldn'?t\s+judge|cautionary|no\s+room\s+for)\b/i,
];

// ─── 豁免五：对冲 ───────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|未必|很难说|不见得|待验证|有待/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+have|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
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

/** 中文腿：① PRED_STRONG 单腿；② HS×PRED_ANY 双朝向 60 字；③ OUT×PRED_POST 双朝向 40 字 */
function hindsightZh(text, R) {
  if (anyHit(R.PRED_STRONG_ZH || PRED_STRONG_ZH, text)) return 'strong';
  const HS = R.HS_ZH || HS_ZH;
  const PRED_ANY = (R.PRED_STRONG_ZH || PRED_STRONG_ZH)
    .concat(R.PRED_WEAK_ZH || PRED_WEAK_ZH)
    .concat(R.PRED_POST_ZH || PRED_POST_ZH);
  if (nearAny(HS, PRED_ANY, text, 60, true)) return 'hs×pred';
  if (nearAny(R.OUT_ZH || OUT_ZH, R.PRED_POST_ZH || PRED_POST_ZH, text, 40, true)) return 'out×post';
  return null;
}

/** 英文腿：同结构，窗 120 字符（HS×PRED）× 80 字符（OUT×POST） */
function hindsightEn(text, R) {
  if (anyHit(R.PRED_STRONG_EN || PRED_STRONG_EN, text)) return 'strong';
  const HS = R.HS_EN || HS_EN;
  const PRED_ANY = (R.PRED_STRONG_EN || PRED_STRONG_EN)
    .concat(R.PRED_WEAK_EN || PRED_WEAK_EN)
    .concat(R.PRED_POST_EN || PRED_POST_EN);
  if (nearAny(HS, PRED_ANY, text, 120, true)) return 'hs×pred';
  if (nearAny(R.OUT_EN || OUT_EN, R.PRED_POST_EN || PRED_POST_EN, text, 80, true)) return 'out×post';
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkHindsightBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 正确的事后学习 / 事前正当评价 / 推理否定劝诫 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEWINFO_ZH || EXEMPT_NEWINFO_ZH, text) || anyHit(R.EXEMPT_NEWINFO_EN || EXEMPT_NEWINFO_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EXANTE_ZH || EXEMPT_EXANTE_ZH, text) || anyHit(R.EXEMPT_EXANTE_EN || EXEMPT_EXANTE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const leg = isZh ? hindsightZh(text, R) : hindsightEn(text, R);
  if (!leg) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.6, count: 1,
    detail: isZh
      ? '事后聪明偏差×事后结果倒推为事前注定(' + leg + ',zh)'
      : 'hindsight bias×outcome-as-inevitable-in-hindsight(' + leg + ',en)',
  };
}

module.exports = {
  checkHindsightBias,
  __internals: () => ({
    HS_ZH, PRED_STRONG_ZH, PRED_POST_ZH, PRED_WEAK_ZH, OUT_ZH,
    HS_EN, PRED_STRONG_EN, PRED_POST_EN, PRED_WEAK_EN, OUT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_NEWINFO_ZH, EXEMPT_NEWINFO_EN,
    EXEMPT_EXANTE_ZH, EXEMPT_EXANTE_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
