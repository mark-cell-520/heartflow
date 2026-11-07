/**
 * src/prosecutors-fallacy.js — 「检察官谬误」检测器
 * （ provisional 第 235 个判别维度，r247 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r247-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r246：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers 二十一个已起草
 * 未接线维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r247 立项] 零命中探针 coordination/agent4/probes/r247-probe-round1.js
 * + r247-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：
 * 五候选两轮实测——C 均值-离群误读 5/8 穿透且疑难良性 1/4 被既有维度
 * 拦、D 检查悖论 2/8 穿透且疑难良性 1/4 被拦，两候选穿透不足且纠缠，
 * 淘汰；B 逆赌徒谬误 12/12 穿透 + 疑难良性 0/8、E 趋势外推 12/12 +
 * 疑难良性 0/8，均干净但**A 检察官谬误 12/12 穿透 + 疑难良性维度级
 * 误伤 0/8**（4 条被 hold 的疑难良性 dims 均为空，属 gate 对含百分比/
 * 条件概率语句的默认 verify 路径，非任何维度命中），且外部文献支撑
 * 最强（arXiv 2502.03217v1 2025 法证 likelihood ratio 专文）、决策
 *  stakes 最高（DNA 比对、医学筛检、错案纠正），双干净胜出。
 * src/ 下没有任何维度判「把证据侧概率当成假设侧概率」这一结构
 * （base_rate_neglect 管先验缺席但不判条件概率方向互换，
 * conditional_transposition 是 r228 草稿管条件命题互换、
 * 无证据×假设双腿与法证/检测语境锚点，false_precision 管数字
 * 精度、statistical_misleading 管统计呈现手法，均不判
 * 「匹配概率只有百万分之一，所以他无辜的概率也只有百万分之一」）。
 *
 * 外部来源：arXiv 2502.03217v1（2025）"The Prosecutor's Fallacy and
 * Expert Testimony: A Modern Take Using Likelihood Ratios"——法证
 * 报告标准要求以似然比表述证据强度以避免该谬误；arXiv 2203.08801v1
 * （2022）"Base-Rate Fallacy Redux and a Deep Dive Review in
 * Cybersecurity"——基础比率与假阳性在入侵检测中的同一结构；
 * GitHub 侧无可集成的纯规则实现（logical-fallacy 相关仓库全为
 * LLM/T5 模型路线，redsandr/cognifi 1★ 且面向印尼语，均不符合零
 * 依赖纯规则铁律）。判据为心虫自有纯规则实现，家族定义取自上述
 * 文献的标准表述：prosecutor's fallacy = 把 P(证据|假设) 误作
 * P(假设|证据)（the fallacy of the transposed conditional）。
 *
 * 辨别的族：检察官谬误（prosecutor's fallacy / 条件概率倒置）——
 * **证据侧概率陈述**（匹配/比对/配型的概率只有百万分之一、误报率
 * 千分之二、准确率 99%、这种证据出现的概率极低、巧合的概率那么小；
 * EN the match probability is one in a million / the false positive
 * rate is 0.1% / the odds of a coincidence are tiny）与**假设侧
 * 倒置结论**（他无辜的概率也只有百万分之一、他不是凶手的概率同样
 * 极低、说有病就一定有病、凶手就是他、准过千分之二、绝不可能是
 * 巧合；EN so the probability he is innocent is also one in a
 * million / coincidence is ruled out / the test is right 99.9% of
 * the time）近距共现。把「证据有多罕见」直接当成「假设有多大
 * 可能」，是同一条件概率的两个方向被混为一谈。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：条件概率的
 * 方向差之毫厘，结论谬以千里。DNA 匹配概率百万分之一，被说成
 * 「无辜的概率也只有百万分之一」——在千人数据库里比中时，真实
 * 的无辜概率可能是三分之一。准确率 99% 的检测用在患病率极低的
 * 人群中，阳性多数是假阳性，却被说成「说有病就基本没跑」。这是
 * 法庭错案、过度诊断、误判告警的结构性根源，也是普通人最常被
 * 数字说服的方式。听者需要意识到：P(E|H) 与 P(H|E) 不是一回事，
 * 中间的桥是基础比率。与正当推理有明确界线：引入基础比率/先验、
 * 使用似然比、指出二者不可混用、要求复测或独立验证——均豁免。
 *
 * 与既有维度的边界（r247 归因）：
 *   · base_rate_neglect（169）管**先验基础比率缺席**（不看基础
 *     比率直接下结论）；本族要求证据侧概率陈述 × 假设侧倒置结论
 *     的近距结构，且显式覆盖「概率方向互换」这一错误动作本身。
 *   · conditional_transposition（r228 草稿）管**条件命题互换**
 *     （若A则B 推出 若B则A）；本族判概率条件的方向互换，有
 *     证据侧×假设侧双腿与法证/检测语境锚点，非命题级互换。
 *   · false_precision（188）管**数字精度虚假**（精确到小数点后
 *     三位的伪精确）；本族概率数字本身可以是真的，错在指称对象。
 *   · statistical_misleading（58）管**统计呈现手法**；本族判
 *     概率陈述的方向错误，与呈现手法无关。
 *   · appeal_to_probability（81）管**可能性当必然**；本族有
 *     证据侧概率陈述作腿①，非单纯的可能性推必然。
 *
 * 判据（双腿链，腿②假设侧倒置结论须与腿①证据侧概率陈述近距共现）：
 *   ① 证据侧概率陈述——强证据词（误报率/误判率/准确率/灵敏度/
 *      特异度/检出率/匹配概率/比中）单独成腿；或弱证据词（证据/
 *      痕迹/巧合/概率/匹配）× 极端比率值（百万分之一/千分之二/
 *      99%/0.1%/微乎其微/那么低）近距共现；
 *   ② 假设侧倒置结论——清白侧概率（无辜/无罪/清白/不是凶手…
 *      的概率同样极低）、患病侧结论（有病/阳性/异常…就一定/肯定/
 *      基本没跑/确诊）、凶手锁定（凶手的概率/就是他/锁定）、
 *      准确度倒推（准过/准到/可信度就是/几乎不可能错）、巧合排除
 *      （绝不可能是巧合/coincidence is ruled out）；
 *   ③ 近距离窗 ZH60/EN180，腿①弱证据词查否定前缀；
 *   ④ 豁免：概念讨论（检察官谬误/条件概率/基础比率/先验概率/
 *      贝叶斯/似然比/P(E|H)/患病率——CONCEPT）与正当做法
 *      （不可混用/要看基础比率/结合先验/复测/会高估/误导——
 *      CORRECTIVE）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次证据概率（确实需要
 * 核实其结论方向），也可能是引述谬误案例的教学句。verify 的语义
 * 是「这段话把证据侧概率当成了假设侧概率，先补上基础比率与条件
 * 方向核对，再决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（检察官谬误/条件概率/基础比率/先验概率/贝叶斯/
 *     似然比/P(E|H)/prosecutor's fallacy/likelihood ratio——CONCEPT）；
 *   · 正当推理（不可混用/要看基础比率/复测/会高估/误导/需要更多
 *     数据——CORRECTIVE）；
 *   · 单腿句（只「误报率千分之二」无假设侧结论、只「他是无辜的
 *     概率很低」无证据侧陈述——后者与腿①零距重叠，不成交距对）；
 *   · 与证据概率无关的或然推断（下雨的概率只有三成，所以明天
 *     肯定下雨——腿②无清白/患病/凶手/巧合/准确度语义）。
 */
'use strict';

// ─── 腿①a 强证据词：本身即证据侧概率陈述（无需比率值）──────────
const STRONG_ZH = [
  /(?:误报|误判|错判|错误|假阳性|假阴性|漏检|虚报|误诊)(?:率|概率|几率)/,
  /(?:准确率|精确率|精准率|灵敏度|特异度|检出率|召回率|命中率|一致率|符合率|确诊率)/,
  /(?:匹配|比对|配型|吻合|重合)(?:成功)?(?:的)?(?:概率|几率)/,
  /(?:比中|比对中|数据库中比中|比中了|库中比中)/,
  /似然/,
];
const STRONG_EN = [
  /\bfalse\s+positive\s+rate\b/i,
  /\bfalse\s+negative\s+rate\b/i,
  /\berror\s+rate\b/i,
  /\bmisdiagnosis\s+rate\b/i,
  /\b(?:accuracy|precision|sensitivity|specificity|detection\s+rate|hit\s+rate)\b/i,
  /\b(?:match|matching|DNA)\s+probability\b/i,
  /\bDNA\s+match\b/i,
  /\blikelihood\s+ratio\b/i,
  /\bodds\s+of\s+(?:a\s+)?(?:coincidence|match)\b/i,
  /\bprobability\s+of\s+(?:this|the|that|such)\s+(?:evidence|match|fingerprint|trace)\b/i,
  /\bprobability\s+of\s+a\s+(?:coincidence|match|false\s+positive)\b/i,
  /\blikelihood\s+of\s+(?:this|the|that|such)\b/i,
];

// ─── 腿①b 弱证据词：须与极端比率值近距共现才成腿 ────────────────
const WEAK_ZH = [
  /(?:证据|痕迹|线索|物证|指纹|DNA|血型|纤维|足迹|监控|录像)/,
  /(?:巧合|偶然|碰巧|同时发生|撞车|重复出现|巧了)/,
  /(?:概率|几率|可能性)/,
  /(?:匹配|比对|配型|吻合|重合|相似)/,
];
const WEAK_EN = [
  /\b(?:evidence|fingerprint|trace|match|coincidence|probability|chance|odds|likelihood)\b/i,
];
// 极端比率值：极小概率 / 极高概率 / 忽略级措辞
const RATE_ZH = /(?:百万分之一|十万分之一|万分之一|亿分之一|十亿分之一|亿万分之一|千分之[一二三四五六七八九十]|百分之[零一二三四五六七八九]+(?:点[零一二三四五六七八九]+)?|\d+(?:\.\d+)?\s*%|0\.\d+|微乎其微|可以忽略|忽略不计|极低|极小|那么低|那么小|低到|小到|高达|接近于零|几乎为零|只有|仅仅|不到|不足|低于)/;
const RATE_EN = /\b(?:one\s+in\s+(?:a\s+|one\s+)?(?:million|billion|thousand|hundred)|1\s+in\s+[\d,]+|0\.\d+\s*%?|\d+(?:\.\d+)?\s*%|tiny|minuscule|negligible|vanishingly\s+small|extremely\s+(?:low|small|unlikely)|astronomically|so\s+(?:small|low|unlikely)|only\s+\d)/i;

// ─── 腿② 假设侧倒置结论 ────────────────────────────────────────
const INVERTED_ZH = [
  // 清白侧概率主张：无辜/无罪/清白/不是凶手 … 概率/同样/也/极低
  /(?:无辜|无罪|清白|洗清|蒙冤|不是凶手|并非凶手|绝非凶手|没作案|没有作案|与本案无关|与案无关|被冤枉)[^。，！？；\n]{0,14}(?:概率|机率|可能|同样|也|一样|极低|很低|那么低|那么小|微乎其微|不高|很小)/,
  /(?:概率|机率|可能|几率)[^。，！？；\n]{0,14}(?:无辜|无罪|清白|不是凶手|并非凶手|绝非凶手|没作案)/,
  // 患病侧结论：有病/患病/确诊/感染/阳性 … 就一定/肯定/必然/基本没跑/真有/确诊
  /(?:有病|患病|确诊|感染|患上|中了|阳性|异常|超标)[^。，！？；\n]{0,12}(?:就一定|一定|肯定|必然|基本没跑|基本可以|坐实|铁证|实锤|真有|确诊|可以直接认定|跑不掉|八九不离十|百分百|百分之百|准是|没跑|没错)/,
  /(?:说|判|判为|定为|报告|显示|提示|诊断为|认定为)[^。，！？；\n]{0,8}(?:有病|有问题|阳性|异常|超标|感染|确诊)/,
  // 凶手侧：凶手的概率 / 就是他 / 锁定
  /(?:凶手|真凶|罪犯|行凶者|作案者|嫌疑人)[^。，！？；\n]{0,6}(?:的概率|的可能|的几率|可能性)/,
  /(?:凶手|真凶|罪犯|行凶|作案)[^。，！？；\n]{0,8}(?:就是|准是|肯定|必然|没跑|跑不掉|铁证|实锤|锁定|坐实|八九不离十)/,
  /(?:就是|准是|锁定|坐实|拿下)[^。，！？；\n]{0,4}(?:凶手|真凶|罪犯|行凶者|作案者)/,
  // 准确度从错误率倒推：准过/准到/可信度就是/不可能错
  /(?:准过|准到|胜过|比[^。，！？；\n]{0,6}还准|精度(?:达到|就是)|可信度(?:就)?是|几乎不可能错|不可能错|不会错|绝不会错|基本没跑|万无一失)/,
  // 巧合排除
  /(?:绝不|不可能|排除|排除了|排除掉|并无|没有|绝非)[^。，！？；\n]{0,5}巧合/,
  /巧合[^。，！？；\n]{0,10}(?:排除|不存在|可以排除|被排除|杜绝|为零)/,
  // 确定性措辞：铁证/实锤/坐实（证据侧陈述在场时即为倒置主张）
  /(?:铁证|铁板钉钉|板上钉钉|确证|确凿|实锤|坐实)/,
];
const INVERTED_EN = [
  // 清白侧/有罪侧概率主张
  /\b(?:probability|chance|odds|likelihood)\s+(?:that\s+)?(?:he|she|it|they|the\s+\w+|this|that|the\s+defendant|the\s+suspect)?\s*(?:is|are|was|were)?\s*(?:not\s+)?(?:guilty|innocent|a\s+match|matching|the\s+source|the\s+culprit|wrong|right|correct|reliable)\b/i,
  /\b(?:guilty|innocent|the\s+culprit|the\s+perpetrator|the\s+source|the\s+match)\b[^.]{0,24}\b(?:probability|chance|odds)\b/i,
  /\bso\s+(?:he|she|it|they|the\s+\w+|we)\s+(?:is|are|must\s+be|can\s+be)\s+(?:guilty|innocent|the\s+one|the\s+source|the\s+culprit|a\s+match|cleared)\b/i,
  // 患病侧/检测侧结论
  /\b(?:positive|negative|test)\s+result\s+is\s+(?:wrong|correct|right|reliable|accurate)\s+only\b/i,
  /\bthe\s+test\s+is\s+(?:right|correct|accurate|reliable)\b/i,
  /\bmeans?\s+(?:a\s+|any\s+)?(?:positive|negative)\s+result\s+is\b/i,
  /\bso\s+(?:a\s+|any\s+)?(?:positive|negative|match|hit)\s+(?:means|proves|shows)\b/i,
  /\b(?:coincidence|chance|luck|accident)\s+(?:is|are)\s+(?:ruled\s+out|excluded|impossible|off\s+the\s+table)\b/i,
  /\b(?:ruled\s+out|excluded|impossible|can'?t\s+be|cannot\s+be)\b[^.]{0,24}\bcoincidence\b/i,
  // 确定性措辞
  /\b(?:slam\s+dunk|ironclad|conclusive\s+proof|proof\s+positive|beyond\s+(?:any\s+)?doubt)\b/i,
];

// ─── 距离窗（证据侧概率陈述 × 假设侧倒置结论）──────────────────
const PAIR_ZH = 60;
const PAIR_EN = 180;

// ─── 豁免：概念讨论（条件概率方向/基础比率/贝叶斯/似然比教学句）──
const CONCEPT_ZH = /(?:检察官谬误|条件概率|基础比率|先验概率|贝叶斯|似然比|似然函数|贝叶斯定理|贝叶斯方法|P\s*\(\s*E\s*\|\s*H\s*\)|P\s*\(\s*H\s*\|\s*E\s*\)|概率方向|方向(?:弄|搞|弄反|颠倒|反了)|混为一谈|混淆|倒置|患病率|发病率|流行率|基率|验前概率|验后概率|条件概率的?(?:方向|顺序))/;
const CONCEPT_EN = /prosecutor'?s\s+fallacy|conditional\s+probability|base\s+rate|prior\s+probability|\bBayes\b|likelihood\s+ratio|transposed\s+conditional|inverted\s+conditional|P\s*\(\s*E\s*\|\s*H\s*\)|P\s*\(\s*H\s*\|\s*E\s*\)|fallacy\s+of\s+the\s+transposed|\bprevalence\b|incidence\s+rate|confus(?:e|ed|ing|ion)|invert(?:s|ed|ing)?\s+the\s+conditional/i;

// ─── 豁免：承认方向不可混用/引入先验/要求复测的正当做法 ──────────
const CORRECTIVE_ZH = /(?:不能混用|不可混用|不能等同|二者不同|不是一回事|并不能说明|说明不了|证明不了|不足以|不能只凭|不能单看|单看|要结合|结合(?:基础|先验|患病|发病)|先看|再看|综合(?:判断|考虑|评估)|交叉验证|独立(?:复测|验证|复核)|复测|复查|二次检测|重新检测|复核|会高估|高估|低估|误导|多数是假阳性|大量是假阳性|需要更多(?:数据|证据|样本)|还要看|也要看|取决于|不能据此|顺序不能颠倒|方向不能反)/;
const CORRECTIVE_EN = /\bnot\s+(?:the\s+same|equivalent|interchangeable)\b|\bcan'?t\s+(?:be\s+)?(?:equat|infer|conclude|assume)\b|\bcannot\s+(?:be\s+)?(?:equat|infer|conclude|assume)\b|\bdoes\s+not\s+(?:imply|mean|tell)\b|\bdo\s+not\s+(?:imply|mean|tell)\b|\bmisleading\b|\boverstates?\b|\bunderstates?\b|\bbase\s+rate\b|\bprior\b|\blikelihood\s+ratio\b|\bre-?test\b|\bre-?check\b|\bindependent(?:ly)?\s+verif|\bsecond\s+(?:test|opinion|sample)\b|\bconfirmatory\s+(?:test|analysis)\b|\bmore\s+(?:data|evidence|samples)\b|\bconfus(?:e|ed|ing|ion)\b|\binvert(?:s|ed|ing)?\s+the\s+conditional\b|\bnot\s+enough\b/i;

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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|而非是)/;

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  if (!ababForm && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
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

// 签名收集：腿②须与腿①近距共现（零距重叠不计——单腿的「他是无辜的
// 概率很低」没有证据侧陈述，不是谬误主张）。
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      strong: R.STRONG_ZH || STRONG_ZH,
      weak: R.WEAK_ZH || WEAK_ZH,
      rate: R.RATE_ZH || RATE_ZH,
      inv: R.INVERTED_ZH || INVERTED_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      strong: R.STRONG_EN || STRONG_EN,
      weak: R.WEAK_EN || WEAK_EN,
      rate: R.RATE_EN || RATE_EN,
      inv: R.INVERTED_EN || INVERTED_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 腿①：强证据词单独成腿；弱证据词须与极端比率值近距（20）共现
    const strongM = collect(text, L.strong, true);
    const weakM = collect(text, L.weak, true);
    const rateM = collect(text, [L.rate], true);
    const legs = strongM.slice();
    for (const w of weakM) {
      if (rateM.some(v => dist(w, v) <= (L.lang === 'zh' ? 20 : 60))) legs.push(w);
    }
    if (legs.length === 0) continue;
    // 腿②：假设侧倒置结论（不倒置核查——清白侧主张天然含「不是凶手」）
    const invM = collect(text, L.inv, false);
    for (const e of legs) {
      const u = invM.find(w => dist(w, e) <= L.win && dist(w, e) !== 0);
      if (!u) continue;
      sigs.push({ lang: L.lang, kind: 'pair', evidence: e.raw, verdict: u.raw });
    }
  }
  return sigs;
}

/**
 * 检察官谬误签名：证据侧概率陈述 × 假设侧倒置结论 近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectProsecutorsFallacy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（条件概率方向/基础比率/贝叶斯/似然比教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免：承认方向不可混用/引入先验/要求复测的正当做法
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.76 : 0.66;
  return {
    hit: true,
    dimension: 'prosecutors_fallacy',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '证据侧概率「' + x.evidence + '」× 假设侧结论「' + x.verdict + '」'
      : 'evidence-side probability "' + x.evidence + '" x hypothesis-side verdict "' + x.verdict + '"')),
    details: s.lang === 'zh'
      ? '检察官谬误(' + sigs.length + '处: 把证据侧概率「' + s.evidence + '」直接当成假设侧结论「' + s.verdict + '」，条件概率方向被倒置)(zh)'
      : 'prosecutor\'s fallacy(' + sigs.length + 'x: evidence-side probability "' + s.evidence + '" treated as the hypothesis-side verdict "' + s.verdict + '" — transposed conditional)(en)',
    guidance: '检察官谬误指把 P(证据|假设) 误当成 P(假设|证据)（the fallacy of the transposed conditional）——DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一 / 检测假阳性率只有千分之二，所以检测结果准过千分之二 / 无罪的人身上出现这种证据的概率极低，所以他无罪的概率同样极低 / 巧合的概率那么小，所以这绝不可能是巧合 / The probability of this evidence if he were innocent is one in a million, so the probability he is innocent is also one in a million / The false positive rate is 0.1%, so the test is right 99.9% of the time / Since the odds of a coincidence are tiny, coincidence is ruled out。证据有多罕见和假设有多大可能是两个不同的条件概率，中间的桥是基础比率（先验概率）：在千人数据库里比中时，即使匹配概率只有百万分之一，无辜的概率也可能远高于此；准确率 99% 的检测用在患病率极低的人群中，阳性结果多数反而是假阳性。请补上论证：给出先验概率/基础比率，或用似然比（likelihood ratio）表述证据强度，分开陈述 P(证据|假设) 与 P(假设|证据)，需要时说明复测或独立验证的结果。指出二者不可混用、引入基础比率、使用似然比、要求复测，都是正当做法；若这段话只是转述他人的谬误案例或统计教学，核实其主张再决定是否采信。',
    tags: ['statistics', 'statistical-literacy', 'prosecutors-fallacy', 'transposed-conditional', 'conditional-probability', 'base-rate', 'cognitive-bias', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectProsecutorsFallacy,
  __internals: () => ({
    STRONG_ZH, STRONG_EN,
    WEAK_ZH, WEAK_EN,
    RATE_ZH, RATE_EN,
    INVERTED_ZH, INVERTED_EN,
    CONCEPT_ZH, CONCEPT_EN,
    CORRECTIVE_ZH, CORRECTIVE_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
