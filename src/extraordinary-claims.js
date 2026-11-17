/**
 * src/extraordinary-claims.js — 「非凡主张的证据比例错配」检测器
 * （r373 新建：econ_reasoning_gate 聚合族第 28 子族 / 插件层第 33 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r373 立项探针（scripts/round-373/probe-r373-pool.js + probe-r373-scope.js，
 *   v6.8.190 pristine 基线）七候选同池定拨：A affect_heuristic 攻击 0/6 全被
 *   存量维度（fallacy_of_relevance/gate_block/ad_hominem/moral_foundations）
 *   代拦、边际价值零；B scope_insensitivity 穿透仅 4/13（存量 false_equivalence/
 *   fallacy_of_relevance/perfect_error 大量代拦，边际价值低）；C ambiguity_
 *   aversion 穿透 2/4 且良性 1 误伤（collider_bias，边界脏）；D extraordinary_
 *   claims 攻击穿透 4/5（真零命中，存量维度零覆盖）；E harking 3/4 但「事前/
 *   事后」欺骗文本不可见、定义不牢；F denominator_neglect 穿透 1/5 且良性脏；
 *   G forking_paths 穿透 1/4（被 researcher_degrees_of_freedom 代拦）且良性脏。
 *   **extraordinary_claims 是唯一「高穿透 × 存量零覆盖」候选**，且与存量
 *   weak_evidence_strong_claim（dim 245，弱证据**类型**——听说/据说/匿名——×
 *   绝对化断言）射程不同（本族管主张**离奇度** × 证据**不成比例**），定拨落地。
 *   二段深探（probe-r373-scope.js）：攻击穿透 4/5、良性经严格三腿设计后干净。
 *   海外扫描：arXiv parse-fail、GitHub repos 0、S2 限流——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自认识论/科学方法的标准论述：
 *   「非凡的主张需要非凡的证据」（extraordinary claims require extraordinary
 *   evidence，休谟/拉普拉斯/萨根传统）——一个主张越背离既有确证，承载它所
 *   需的证据强度就越高；当文本用一个只够支撑普通主张的弱基底（几个个例、
 *   一句证言、一篇未经复现的预印本、缺乏同行评议）去兑现一个离奇主张的
 *   真理性，就犯了证据与主张不成比例的比例谬误。经典形态：绝症疗法仅凭
 *   三五例个例就宣称治愈、永动机仅凭理论自洽就要求颁奖、惊人发现仅凭一篇
 *   预印本就写进教科书。
 *
 * 辨别的族：非凡主张的证据比例错配（evidence–claim proportionality failure /
 * extraordinary claim on ordinary evidence）——文本同时给出三个信号：
 *   腿① EXTRAORDINARY 离奇主张在场——治愈绝症/根治百病/永动机/长生不老/
 *     百分百/包治百病/突破性/颠覆性/史无前例，或显式离奇词 惊人/难以置信/
 *     不可思议；cures every disease / perpetual motion / too good to be true /
 *     extraordinary / unprecedented；
 *   腿② WEAK_BASIS 弱证据基底在场——只有几个个例/仅凭证言/没有复现/未经同行
 *     评议/据说/一面之词；only a few cases / testimonials / no replication /
 *     without peer review；
 *   腿③ SUFFICIENCY 充分性兑现断言在场——把该弱基底直接兑现为「足以证明/
 *     足以采信/应该直接接受/毋庸置疑」；is enough to prove / we should accept /
 *     suffices to confirm；
 *   三腿近距共现，缺一不判。
 *
 * 为什么三腿缺一不可（良性边界因此干净）：
 *   · 只有离奇主张、没有弱基底与充分性兑现（「这是突破性发现，已经过多轮
 *     随机对照验证」）——是正当的确证陈述，不判；
 *   · 只有弱基底、没有离奇主张（「初步只有少量病例支持这一常规改良」）——
 *     普通主张配弱证据是本族射程外，不判；
 *   · 只有离奇主张与弱基底、没有充分性兑现（「虽然只有几例个例，但还需
 *     大规模试验」）——是恰当的存疑，不判（腿③缺省 + CORRECT/HEDGE 豁免
 *     双重排除）。
 *
 * 与既有维度的边界（r373 归因，探针 + 边界实测）：
 *   · weak_evidence_strong_claim（dim 245，r288）管「弱证据**类型**（听说/
 *     据说/网传/匿名信源）× 绝对化断言」——本族管「离奇主张 × 弱**基底** ×
 *     充分性兑现」的比例错配，腿①锁定主张离奇度而非证据类型；探针攻击 4/5
 *     存量零命中证明射程不重叠；
 *   · unsupported_claim 管泛化的无依据断言——本族要求离奇主张在场；
 *   · anecdote_as_proof 管以个案代证明——本族额外要求离奇主张与充分性兑现
 *     共现；
 *   · confidence / absolute_claim 管确定性措辞——本族管证据与主张的比例失
 *     配，三腿共现形状与纯绝对化不同构。
 *
 * 判据（三腿近距共现 + 三组豁免 + 否定守卫，缺一不判）：
 *   ① 腿① EXTRAORDINARY 离奇主张在场；
 *   ② 腿② WEAK_BASIS 弱证据基底在场；
 *   ③ 腿③ SUFFICIENCY 充分性兑现断言在场（受否定守卫：「并不足以/not
 *     enough」是对冲形）；
 *   ④ 三腿须落在邻近窗内（以腿①为锚，ZH 90 字 / EN 260 字符），方向不限；
 *   ⑤ 豁免 A 概念教学（非凡主张需要非凡的证据/extraordinary claims require
 *      extraordinary evidence 原则被点名 + 框架词共现，防前缀绕过）；
 *   ⑥ 豁免 B 正确举证/存疑（需要更多证据/有待验证/保持怀疑/不足以据此/
 *     require more evidence/remains unproven）；
 *   ⑦ 豁免 C 对冲/尚未定论（还需/有待/不过/但是……确认/尚需/still needs/
 *     awaits confirmation）——良性报道常在给出离奇主张后紧跟恰当的谨慎限定。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一个待验证的惊人说法（「据称该
 * 疗法能治愈癌症，目前仅数例报告」是转述——腿③缺省天然排除）。verify 的
 * 语义是「这段话用与主张离奇度不成比例的弱基底兑现了真理性，先补齐与主张
 * 相称的证据（独立复现、随机对照、同行评议）或下调确定性，再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 恰当验证的突破（这是突破性疗法，已经过多轮随机对照验证——腿②缺省）；
 *   · 普通主张配弱证据（初步只有少量病例支持这一常规改良——腿①缺省）；
 *   · 给出弱证据但保持存疑（虽然只有几例个例，但还需大规模试验——腿③缺省）；
 *   · 原则教学句（非凡的主张需要非凡的证据——豁免 A）；
 *   · 正确举证/怀疑（证据不足，需要随机对照才能下结论——豁免 B + 腿③缺省）；
 *   · 对冲报道（惊人疗法初步有效，但仍待同行评议——豁免 C）；
 *   · 否定/对冲形（这几例个例并不足以证明疗法有效——腿③否定守卫）。
 */

'use strict';

// ─── 腿① EXTRAORDINARY 离奇主张在场 ────────────────────────
// 形 A：离奇主张内容（疗效夸张/不可能装置/违背常识的量级）。只收真正离奇的
//   内容（治愈绝症、永动机、长生不老），不收普通正面词（有效/不错/良好）。
const EXTRA_ZH_A = /(?:治愈|根治)(?:一切|所有|各类|任何|百病|绝症|晚期|癌症|糖尿病|艾滋|高血压|慢病|顽疾)|百分百(?:治愈|有效|成功|康复|根除|瘦)|永动机|长生不老|返老还童|起死回生|包治百病|药到病除|万能药|神药|逆转(?:衰老|基因|病变|绝症|晚期)|永不(?:复发|失效|生病|死亡|反弹)|(?:突破|重大|革命)性(?:疗法|药物|发现|突破)|颠覆(?:性)?(?:认知|理论|常识|范式)|史无前例|前所未有|亘古未有|逆天改命|逆天而行/;
// 形 B：显式离奇/惊叹词。
const EXTRA_ZH_B = /惊人|难以置信|不可思议|逆天|超凡|神奇|奇迹般|神话般|惊天动地|骇人听闻|玄之又玄|神乎其神/;
// EN 形 A：离奇主张内容。
const EXTRA_EN_A = /\bcure[sd]?\s+(?:all|every|any|everything)\b|\bcure[sd]?\s+(?:cancer|diabetes|aids|every\s+disease|all\s+diseases|any\s+disease)\b|\bperpetual\s+motion\b|\bimmortal(?:ity)?\b|\bnever\s+(?:fails?|gets?\s+sick|relapses?)\b|\breverses?\s+aging\b|\btoo\s+good\s+to\s+be\s+true\b|\bdefies\s+(?:physics|science|logic)\b|\bmiracle\s+(?:cure|drug|treatment|remedy)\b|\bguaranteed\s+(?:cure|to\s+cure)\b|\bgroundbreaking\b|\brevolutionary\b|\bunprecedented\b/;
// EN 形 B：显式离奇/惊叹词。
const EXTRA_EN_B = /\bextraordinary\b|\bastonishing\b|\bincredible\b|\bunbelievable\b|\bmiraculous\b|\bmind-?blowing\b|\bgame-?chang\w+\b|\bdefies\s+belief\b/i;

const EXTRA_ZH_GROUPS = [['EXTRA_ZH_A', [EXTRA_ZH_A]], ['EXTRA_ZH_B', [EXTRA_ZH_B]]];
const EXTRA_EN_GROUPS = [['EXTRA_EN_A', [EXTRA_EN_A]], ['EXTRA_EN_B', [EXTRA_EN_B]]];

// ─── 腿② WEAK_BASIS 弱证据基底在场 ─────────────────────────
// 形 A：量化弱基底（只有/仅凭 + 少量个例/证言/篇数）。
const WEAK_ZH_A = /只有[^。！？；，]{0,10}(?:例|个例|案例|篇|次|条|句|人|则|说)|仅凭[^。！？；，]{0,12}(?:证言|说法|个例|传闻|故事|经历|理论|自述|感受|转述|介绍|推荐|口碑|单方面)|(?:单|一)(?:例|个|篇|次|则)(?:个案|报告|案例|研究|说法)?|一面之词|不足为凭|片面之词|只凭[^。！？；，]{0,8}(?:说|证言|个例|故事|转述|口碑)/;
// 形 B：缺证据/未验证标记（没有复现、未经同行评议、据说传闻）。
const WEAK_ZH_B = /(?:没有|缺乏|未见|尚无|无)[^。！？；，]{0,6}(?:可复现|复现|证据|验证|同行评议|对照|检验|同行评审)|未经(?:同行评议|同行评审|验证|复现|检验)|(?:传闻|据说|网传|听说|据称|坊间)|(?:朋友|邻居|亲戚|熟人)(?:说|亲测|介绍的|推荐)|自述|自称(?:有效|治愈|成功)/;
// EN 形 A：量化弱基底。
const WEAK_EN_A = /\b(?:only|just)\s+(?:a\s+)?(?:few|couple\s+of|single|one|two|three|several)?\s*\w*\s*(?:cases?|stories|testimonials?|anecdotes?|reports?|patients?|users?|subjects?|instances?)\b|\b(?:a\s+few|several|a\s+couple\s+of)\s+\w*\s*(?:cases?|stories|testimonials?|anecdotes?|reports?|patients?|users?|subjects?|instances?)\b|\ba\s+(?:single|one)\s+(?:study|paper|preprint|report|trial|case|anecdote)\b|\bfewer\s+than\s+\w+\s+(?:cases?|patients?)\b|\bword\s+of\s+mouth\b|\ba\s+friend'?s?\b/i;
// EN 形 B：缺证据/未验证标记。
const WEAK_EN_B = /\bno\s+(?:replication|reproduc\w+|peer\s+review|controlled\s+trial|independent\s+verification)\b|\bwithout\s+(?:any\s+)?(?:real|solid|strong|independent|proper)?\s*(?:evidence|replication|verification|peer\s+review|scrutiny)\b|\bunreplicated\b|\blacking\s+(?:evidence|replication|verification)\b|\bnot\s+(?:been\s+)?(?:replicated|reproduced|verified|peer[- ]reviewed)\b|\bhearsay\b|\bunvetted\b|\bunverified\b/i;

const WEAK_ZH_GROUPS = [['WEAK_ZH_A', [WEAK_ZH_A]], ['WEAK_ZH_B', [WEAK_ZH_B]]];
const WEAK_EN_GROUPS = [['WEAK_EN_A', [WEAK_EN_A]], ['WEAK_EN_B', [WEAK_EN_B]]];

// ─── 腿③ SUFFICIENCY 充分性兑现断言在场 ────────────────────
// 把弱基底直接兑现为「足以证明/足以采信/应该接受/毋庸置疑」。只收证明/采信
// 类断言，不收普通正面陈述（「显示潜力」不是充分性兑现——良性报道常用）。
const SUFF_ZH = /就(?:足以|可以|能够|足以证明|足以说明|足以可信|足以让)|已经?(?:足够|足以)|(?:足以|足可)让我们?(?:相信|接受|认定|确信)|应(?:该)?(?:直接)?(?:采信|接受|相信|认可|奉为|写进|载入)|值得(?:相信|信赖|采信|授予|获奖|颂奖|颁|信任)|(?:足以|足以)(?:证明|证实|说明)了|由此(?:可见|可知|证明)|(?:是|为|属)(?:真实|成立|可信|确凿)的|铁证|实锤|毋庸置疑|毫无疑问|毫无疑义|不容置疑|板上钉钉|盖棺定论/;
const SUFF_EN = /\b(?:is|are)\s+enough\b|\benough\s+to\s+(?:prove|establish|confirm|trust|accept|show|demonstrate)\b|\bsuffices?\s+to\s+(?:prove|establish|confirm|demonstrate)\b|\bwe\s+should\s+(?:accept|trust|believe|adopt|credit|embrace)\b|\b(?:proves?|confirms?|establishes?)\s+(?:that|it|the|this)\b|\b(?:is|are)\s+(?:already\s+|now\s+|thus\s+|therefore\s+)?(?:sufficient|conclusive|definitive|undeniable)\b|\b(?:already|now|thus|therefore)\s+(?:conclusive|sufficient|definitive)\b|\b(?:clearly|undeniably|certainly|definitively)\s+(?:real|true|valid|works?|proven)\b|\b(?:deserves?|warrants?|merits?)\s+(?:acceptance|belief|credence|our\s+trust|the\s+Nobel|a\s+Nobel)\b|\bcompelling\s+enough\b/i;

const SUFF_ZH_GROUPS = [['SUFF_ZH', [SUFF_ZH]]];
const SUFF_EN_GROUPS = [['SUFF_EN', [SUFF_EN]]];

// ─── 距离窗（离奇主张为锚，另两腿须落窗内）───────────────────
const PAIR_ZH = 90;
const PAIR_EN = 260;

// ─── 豁免 A：概念教学（点名比例原则 + 框架词共现）────────────
// 概念名单独出现不豁免（「非凡的主张需要非凡的证据，可这个疗法只有几例」仍
// 可能攻击）——须与框架词共现，防前缀绕过（r368/r369/r371 同款教训）。
const CONCEPT_ZH = /(?:非凡的主张|惊人的主张|离奇的主张)?需要(?:非凡|惊人|更强|相应|相称|更多)的?(?:证据|证明|支撑)[^。，；]{0,30}(?:是指|指|是|一种|属于|原则|法则|格言|常识|准则|道理|规范|科学|方法|认识|谚语|格训)|(?:是指|指|原则|法则|格言|常识|准则|规范|科学方法|认识论|方法论)[^。，；]{0,30}(?:非凡的主张|惊人的主张|离奇的主张)?需要(?:非凡|惊人|更强|相应|相称)的?(?:证据|证明)/;
const CONCEPT_EN = /\bextraordinary\s+claims?\s+(?:require|demand|need)\s+extraordinary\s+evidence\b[^.]{0,60}?\b(?:is|are|principle|maxim|saying|adage|dictum|standard|rule|norm|scientific|skeptic\w+)\b|\b(?:is|are|called|known as|principle|maxim|adage|saying)\b[^.]{0,60}?\bextraordinary\s+claims?\s+(?:require|demand|need)\s+extraordinary\s+evidence\b/i;

// ─── 豁免 B：正确举证/存疑 ──────────────────────────────────
// 收：要求更多/更强证据、承认证据不足、保持怀疑、不可据此下结论。不收裸
// 「复现/证据」（那是腿②弱基底的描述词，会把攻击句误豁免）——须带举证/存疑
// 框架。
const CORRECT_ZH = /需要(?:更多|进一步|更严格|更强|大规模|独立)?的?(?:证据|验证|复现|检验|评议|确认|试验|数据)|有待(?:验证|确认|复现|检验|评议)|尚待|仍待|仍需(?:验证|确认|复现|检验)|保持(?:怀疑|审慎|警惕)|审慎对待|存疑|不足为凭|不足为证|不能据此|不应据此|无法据此|难以据此|不足以(?:据此|说明|证明|支撑|得出)|尚不能(?:得出|断定|下结论)|无法(?:得出|断定|证明)|有待观察|拭目以待/;
const CORRECT_EN = /\brequire[s]?\s+(?:more|further|stronger|additional|independent|rigorous)\b|\bneed[s]?\s+(?:more|further|stronger|additional|independent|rigorous)\b|\bfurther\s+(?:evidence|verification|replication|study|studies|testing|scrutiny)\b|\bremains?\s+(?:unproven|unverified|unconfirmed|uncertain|speculative|tentative|preliminary)\b|\bskeptic\w+\b|\bdemand[s]?\s+(?:replication|evidence|verification|scrutiny)\b|\bcannot\s+(?:conclude|be\s+concluded|yet\s+conclude)\b|\binsufficient\s+to\s+(?:conclude|establish|prove|confirm)\b|\bnot\s+enough\s+(?:evidence|to\s+conclude)\b|\bpreliminary\b/i;

// ─── 豁免 C：对冲/尚未定论 ──────────────────────────────────
// 良性报道常给出离奇主张后紧跟恰当谨慎限定（「惊人疗法初步有效，但仍待同行
// 评议」「不过还需大样本确认」）。收转折-谨慎框架。
const HEDGE_ZH = /但(?:是|需|尚需|还|仍|有待)|不过(?:还|仍|尚|有待)|然而(?:还|仍|尚|有待)|仍需|尚需|尚待|有待(?:进一步|更多|后续)|还需要|尚处(?:于)?(?:早期|初步|研究)|早期(?:阶段|结果)|初步(?:结果|显示|迹象)/;
const HEDGE_EN = /\bbut\s+(?:this|it|that|these|the\s+\w+)?\s*(?:is|are|needs?|requires?|remains?|awaits?|awaits)\b|\bhowever\b|\byet\s+(?:to\s+be|remains?|needs?)\b|\bstill\s+(?:needs?|requires?|awaits?|remains?|pending)\b|\bawaits?\s+(?:confirmation|verification|replication|peer\s+review|validation)\b|\bpreliminary\s+(?:results?|findings?|data)\b|\bearly\s+(?:results?|findings?|days|stage)\b|\btentative\b/i;

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

// 强否定表：命中腿③文本内或紧前出现，说明充分性兑现被否定/对冲——「并不
// 足以」「not enough」是对冲形，不是攻击。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝不|丝毫不|一点都不|并不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|不能|无法|并非|没能|难以|无从|不足以|尚不)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|not\s+enough|does\s+not|did\s+not|cannot|can'?t|couldn'?t|insufficient|fails?\s+to)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 4), idx);
  return /[不没无未非难]/.test(before);
}

function matchAlive(text, x, opts) {
  opts = opts || {};
  if (opts.neg) {
    // 腿③充分性兑现的否定守卫：「并不足以」「远不足以证明」是对冲形。
    if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 40), x.idx);
    if (STRONG_NEG_EN.test(beforeEn)) return false;
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

function collect(text, list, opts) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts)) m.push(x);
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

// 签名收集：腿①离奇主张为锚，腿②弱基底、腿③充分性兑现须均落邻近窗内，
// 方向不限。三腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      extra: resolveGroups(R, EXTRA_ZH_GROUPS),
      weak: resolveGroups(R, WEAK_ZH_GROUPS),
      suff: resolveGroups(R, SUFF_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      extra: resolveGroups(R, EXTRA_EN_GROUPS),
      weak: resolveGroups(R, WEAK_EN_GROUPS),
      suff: resolveGroups(R, SUFF_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const extraM = collect(text, L.extra);
    if (extraM.length === 0) continue;
    const weakM = collect(text, L.weak);
    if (weakM.length === 0) continue;
    // 腿③受否定守卫（对冲形：「并不足以」「not enough」）
    const suffM = collect(text, L.suff, { neg: true });
    if (suffM.length === 0) continue;
    for (const e of extraM) {
      const w = weakM.find(x => dist(x, e) <= L.win);
      if (!w) continue;
      const s = suffM.find(x => dist(x, e) <= L.win);
      if (!s) continue;
      sigs.push({ lang: L.lang, extra: e.raw, weak: w.raw, suff: s.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.extra + '|' + s.weak + '|' + s.suff;
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
 * 非凡主张证据比例错配签名：离奇主张 × 弱证据基底 × 充分性兑现 三腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectExtraordinaryClaims(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论比例原则本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确举证/存疑（要求更多证据、承认不足、保持怀疑）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 C：对冲/尚未定论（离奇主张后紧跟恰当谨慎限定）
  if (exempt(_normInject(R.HEDGE_ZH, HEDGE_ZH), text) || exempt(_normInject(R.HEDGE_EN, HEDGE_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'extraordinary_claims',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '离奇主张「' + x.extra + '」× 弱基底「' + x.weak + '」× 充分性兑现「' + x.suff + '」'
      : 'extraordinary claim "' + x.extra + '" x weak basis "' + x.weak + '" x sufficiency "' + x.suff + '"')),
    details: s.lang === 'zh'
      ? '非凡主张证据比例错配(' + sigs.length + '处: 离奇主张「' + s.extra + '」被弱基底「' + s.weak + '」经充分性兑现「' + s.suff + '」直接兑现为真，证据强度与主张离奇度不成比例)(zh)'
      : 'extraordinary-claim-proportionality(' + sigs.length + 'x: the extraordinary claim "' + s.extra + '" is cashed out as true by the weak basis "' + s.weak + '" via the sufficiency move "' + s.suff + '", evidence strength out of proportion to the claim)(en)',
    guidance: '非凡主张的证据比例错配（extraordinary claims require extraordinary evidence / evidence–claim proportionality）：一个主张越背离既有确证，承载它所需的证据强度就越高——用只够支撑普通主张的弱基底（几个个例、一句证言、一篇未经复现的预印本、缺乏同行评议）去兑现一个离奇主张（治愈绝症、永动机、长生不老、百分百有效）的真理性，就犯了证据与主张不成比例的比例谬误（「这疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信」「他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁奖」）。正当做法是把证据强度调到与主张相称：要求独立复现（「需要独立复现和随机对照才能确认」）、承认初步性（「目前仅数例报告，尚待同行评议」）、或对惊人说法保持怀疑（「证据不足，需要大规模试验才能下结论」）；已经过多轮验证的突破（「这是突破性疗法，已经过多轮随机对照验证」）是正当确证陈述、不在本族射程；点名「非凡的主张需要非凡的证据」原则的教学句、恰当谨慎的报道都是正当做法。',
    tags: ['epistemology', 'scientific-reasoning', 'extraordinary-claims', 'evidence-proportionality', 'sagan', 'burden-of-proof'],
  };
}

module.exports = {
  detectExtraordinaryClaims,
  __internals: () => ({
    EXTRA_ZH_A, EXTRA_ZH_B, EXTRA_EN_A, EXTRA_EN_B,
    WEAK_ZH_A, WEAK_ZH_B, WEAK_EN_A, WEAK_EN_B,
    SUFF_ZH, SUFF_EN,
    EXTRA_ZH_GROUPS, EXTRA_EN_GROUPS,
    WEAK_ZH_GROUPS, WEAK_EN_GROUPS,
    SUFF_ZH_GROUPS, SUFF_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN, HEDGE_ZH, HEDGE_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
