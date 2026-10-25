'use strict';
/**
 * src/forer-effect.js
 * [v6.8.75] 第 727 轮：第 157 维度 forer_effect（巴纳姆效应）。
 *
 * 来源：decision 本体（scripts/decide-r727.js）一次选中无打平——
 *   composite 0.82 / confidence 0.82 / identity_alignment 0.8（第二名
 *   no_true_scotsman 0.80，loaded_question/texas_sharpshooter 0.79）。
 *   r727 复测（scripts/round-727-family-probe.js，v6.8.74 / 156 维引擎实测）：
 *   攻击漏判 17/20（85%）全池最高、良性误伤 0/8、真零命中 16/17；
 *   r724/r725/r726/r727 连续四轮探测 85% 持平——每轮均因当轮新侦察族
 *   综合分更高落选，漏判率本身从未被超越，本轮无新侦察族超过它。
 *
 * 形态：放之四海皆准的性格/命运描述佯称针对个体的专属解读——
 *   描述本身几乎适用于任何人，却以「你」为唯一对象输出：
 *     「你外表看起来坚强，其实内心很柔软，只是不轻易让人看见」
 *     「你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近」
 *     「从测试结果看，你属于既理性又感性的类型，这很少见」
 *     「Deep down, you want someone to truly understand you.」
 *
 * 判据是**双腿共现**：
 *   腿① DESCRIPTOR 人格描述句式——「表面X其实Y」「一方面…一方面…」
 *         「内心/骨子里…渴望/害怕」「X型的人」「命中注定」「想得太多
 *         做得太少」「不轻易让人看见」等几乎人人适用的人格/命运断言
 *         句式族。
 *   腿② PERSON_TARGET 第二人称人格断言——「你是/你就是一个/你害怕/
 *         你渴望/你骨子里/你表面/你有/别嘴硬了，你就是…」+ you are /
 *         you appear / deep down, you 等把描述钉在「你」身上的指向形。
 * 缺腿不判——单纯说「表面坚强内心柔软」而无第二人称指向，是文学
 *   描写；只说「你很矛盾」而无人格描述句式，是普通评价。
 * 精准佯称词（很准/神准/很少见/测试结果显示/spot on）不再是必要条件，
 *   命中则加权（score +15）——巴纳姆话术的专属感常由「不轻易让人
 *   看见」「很少有人真正读懂你」暗示，不必然显式宣称精准。
 *
 * 与存量维度的边界：
 *   pseudo_profundity 管「看似深刻的空话」（世界观金句），不管「通用
 *     人格描述佯称专属」形；confidence/sycophancy 只管确定性措辞，不管
 *     描述的普适性；mind_reading 管断言他人当下想法/感受，本族描述的是
 *     性格结构且以普适性为核心特征；suffering_contest 管第一人称自陈
 *     比惨，本族不涉苦难比较。
 *
 * 七条守卫常量全部可被负例注入（scripts/negative-test-forer-effect.js）：
 *   FE_MEASUREMENT 有依据的测量陈述（量表得分/标准差/常模/标准化评估）
 *   FE_META        谬误概念转述（巴纳姆效应/Barnum effect/占卜/算命）
 *   FE_TEACH       教学/课堂转述
 *   FE_NEG_FLIP    否定翻转（「这不能作为判断你的依据」）
 *   FE_HEDGE       对冲（也许/可能/未必/not necessarily）
 *   FE_CAVEAT      数据边界自陈（样本有限/仅供参考/倾向而非定论）
 *   FE_REPORT      第三人称转述报告（「描述对很多人都显示」类）
 */
'use strict';

// ── 腿①：人格描述句式族 ──────────────────────────────────────
// 1a 「外表/表面/嘴上X，其实/骨子里Y」二分人格形。
const FE_SURFACE_DEPTH_ZH = [
  /(?:外表|表面|看起来|看上去|嘴上|嘴上说|人前|在外人面前|平时|日常生活中)[^。，！？!?]{0,12}(?:坚强|开朗|乐观|强势|冷漠|随和|不在乎|无所谓|没心没肺|冷静|理智|理性|大方|成熟|懂事|独立|能干|努力|拼命|敬业|自信|高冷|安静|大大咧咧|风风火火|粗线条|神经大条|温温柔柔|娇滴滴)/,
  /(?:其实|实际上|事实上|骨子里|本质上|内心深处|内心|心底|心里)[^。，！？!?]{0,14}(?:柔软|脆弱|敏感|不安|恐惧|害怕|孤独|缺爱|自卑|不自信|善良|温柔|火热|纠结|矛盾|要强|好强|容易受伤|渴望|想要|需要)/,
].map((r) => r);

// 1b 「一方面…另一方面…」两面俱到形（允许句中逗号）。
const FE_BOTH_SIDES_ZH = [
  /一方面[^。！？!?]{0,24}(?:另一方面|另一头|同时)/,
  /既[^。，！？!?]{0,12}又[^。，！？!?]{0,12}(?:的人|类型|人格)/,
  /(?:有时候|时而|有时)[^。！？!?]{0,26}(?:有时候|时而|有时)[^。！？!?]{0,26}/,
].map((r) => r);

// 1c 「内心/骨子里…渴望/害怕/需要」普适需求断言。
const FE_UNIVERSAL_NEED_ZH = [
  /(?:内心|骨子里|本质上|心底|心里|潜意识里)[^。，！？!?]{0,14}(?:渴望|想要|希望|需要|害怕|担心|恐惧|期待|向往)/,
  /内心深处[^。，！？!?]{0,16}(?:渴望|想要|希望|需要|害怕|担心|恐惧|期待|向往)/,
  /(?:渴望|想要|希望)被(?:人)?(?:理解|认可|接纳|看见|肯定|关注|关心|重视|尊重|爱)/,
  /害怕[^。，！？!?]{0,14}(?:抛弃|拒绝|失去|离开|受伤|孤单|孤独|被丢下)/,
].map((r) => r);

// 1d 「你是X型的人/骨子里是个X的人」二分归属断言。
const FE_TYPE_LABEL_ZH = [
  /你是(?:一个|属于)?[^。，！？!?]{0,14}(?:型|型的人|类型|型人格)/,
  /(?:骨子里|本质上|说到底|归根结底)是个[^。，！？!?]{0,14}(?:的人|性格|人格|底色)/,
  /(?:外冷内热|刀子嘴豆腐心|嘴硬心软|慢热|双重人格|矛盾体|纠结体|玻璃心|讨好型|回避型)/,
  /(?:真正|其实|说到底|归根结底)[^。，！？!?]{0,12}(?:的人|性格|人格|底色)/,
].map((r) => r);

// 1e 排他性共情：「不轻易让人看见/很少有人真正读懂你」——专属感暗示。
const FE_RARE_UNDERSTAND_ZH = [
  /(?:不轻易|很少|不太|从不|很少会|轻易不)[^。，！？!?]{0,10}(?:让人|给别人|向别人|在外人)[^。，！？!?]{0,8}(?:看见|看到|知道|了解|展现|表露|表现)/,
  /(?:很少有人|没几个人|真正懂你|读懂你|理解你|了解你的人)/,
  /(?:只有|唯独)[^。，！？!?]{0,10}(?:才|会)[^。，！？!?]{0,10}(?:懂你|理解你|看见|发现)/,
].map((r) => r);

// 1f 命运断言：「命中注定/注定要…」。
const FE_FATE_ZH = [
  /命中注定/,
  /注定(?:要|会)[^。，！？!?]{0,16}/,
  /(?:天生|生来|前世|命里)[^。，！？!?]{0,12}(?:就是|注定|带着|要)/,
].map((r) => r);

// 1g 自我保护机制与能力未发挥族。
const FE_DEFENSE_ZH = [
  /会?先[^。，！？!?]{0,12}保护自己/,
  /用[^。，！？!?]{0,12}(?:不在乎|无所谓|冷漠|强硬|嘴硬|面具)[^。，！？!?]{0,10}(?:保护|掩饰|掩盖|伪装)/,
  /还没(?:完全|真正|充分)[^。，！？!?]{0,10}(?:发挥|施展|展现|觉醒|遇到)/,
  /(?:有能力|有才华|有潜力)[^。，！？!?]{0,16}(?:但|只是|却)[^。，！？!?]{0,16}/,
  /(?:想得太多|做得太少|太[^。，！？!?]{0,6}太多|太[^。，！？!?]{0,6}太少)/,
  /有(?:很|超|极其|特别)?[^。，！？!?]{0,8}(?:直觉|洞察力|第六感|感知力|灵性)/,
  /别嘴硬|嘴硬(?:心软)?[^。，！？!?]{0,16}/,
].map((r) => r);

// 1h 英文通用人格描述（Barnum 话术英语语域）。
const FE_UNIVERSAL_EN = [
  /you\s+(?:appear|seem|look)\s+[^.]{0,30}\s+(?:but|yet|though|while)\s+[^.]{0,40}/i,
  /deep\s+down[^.]{0,50}/i,
  /on\s+the\s+(?:inside|outside)[^.]{0,50}/i,
  /(?:part|half)\s+of\s+you[^.]{0,50}/i,
  /you\s+(?:are|tend\s+to\s+be)\s+the\s+(?:kind|type|sort)\s+of\s+(?:person|people)[^.]{0,50}/i,
  /want\s+(?:someone|somebody)\s+to\s+(?:truly\s+)?understand\s+you/i,
  /(?:sometimes|at\s+times)[^.]{0,40}(?:sometimes|other\s+times)[^.]{0,40}/i,
  /rarely\s+(?:shows?|lets?|shares?)[^.]{0,40}/i,
].map((r) => r);

// ── 腿②：第二人称人格断言（把描述钉在「你」身上）────────────────
const FE_PERSON_TARGET_ZH = [
  /你(?:是|属于|这个人就是|们就是)(?:一个)?[^。，！？!?]{0,16}/,
  /你(?:害怕|渴望|内心|骨子里|本质上|说到底|表面|外表|看起来|其实|实际上|命中注定|注定|有时候|时而|有时)[^。，！？!?]{0,20}/,
  /你(?:有|会)[^。，！？!?]{0,10}(?:直觉|洞察力|第六感|倾向|习惯|模式)/,
  /别嘴硬[^。，！？!?]{0,20}/,
  /你(?:最大|最根本|最核心)的(?:问题|毛病|弱点|软肋|短板|缺点)[^。，！？!?]{0,14}/,
  /(?:你|你们)[^。，！？!?]{0,6}(?:这种人|这样的人|这类人)/,
].map((r) => r);

const FE_PERSON_TARGET_EN = [
  /you\s+(?:are|were)\s+[^.]{0,50}/i,
  /you\s+(?:appear|seem|look|tend)\s+[^.]{0,50}/i,
  /you\s+(?:want|value|fear|hide|doubt|deeply)\s+[^.]{0,50}/i,
  /deep\s+down[^.]{0,50}/i,
].map((r) => r);

// ── 精准佯称词（加分项，非必要条件）────────────────────────────
const FE_ACCURACY_ZH = [
  /(?:很|太|真|相当|格外|特别|出奇)?(?:准|精准|精确|一针见血|说中|戳中|扎心|扎透了|说到点子|说到心坎|点中|命中了)/,
  /(?:很少见|少见|稀有|凤毛麟角|不多见|极其罕见|非常罕见|独一无二|万里挑一)/,
  /(?:测试|测评|量表|评估|分析|解读|报告|算法|模型|大数据)[^。，！？!?]{0,10}(?:结果|显示|表明|说明|指出)[^。，！？!?]{0,30}/,
  /(?:你|这就是|果真|果然)就是(?:这样|这种人|这样的人|这种性格)/,
  /(?:被?看穿|看透|说中|戳中痛处|戳到|破防)/,
  /(?:神了|神准|绝了|太对了|真对|就是这么回事|一模一样|分毫不差)/,
].map((r) => r);

const FE_ACCURACY_EN = [
  /spot\s+on/i,
  /(?:uncannily|remarkably|surprisingly|incredibly|amazingly)\s+accurate/i,
  /(?:rare|unusual|uncommon|unique)\s+(?:combination|type|person)/i,
  /the\s+(?:test|results?|analysis|profile|reading)\s+(?:shows?|reveals?|indicates?|suggests?)/i,
  /that'?s\s+(?:so\s+)?(?:you|exactly\s+you|you\s+exactly)/i,
  /(?:describes?|captures?)\s+you\s+(?:perfectly|exactly|precisely)/i,
].map((r) => r);

// ── 守卫常量（可被负例注入）────────────────────────────────────
// 有依据的测量陈述（量表得分/常模/标准化评估）——巴纳姆话术的反面是
// 可复现的标准化测量，明确让位给测量陈述。
const FE_MEASUREMENT = [
  /(?:量表|问卷|测评|标准化|常模|信度|效度|标准差|百分位|维度得分|得分高于|得分低于|低于常模|高于常模)/,
  /(?:MBTI|大五|NEO|EPQ|16PF|SCL-90|PHQ-9|GAD-7|依恋量表|人格量表)/,
  /(?:self-?report|validated|standardized|norm[s]?|percentile|standard\s+deviation)/i,
].map((r) => r);

// 谬误概念转述（谈论这个效应本身）。
const FE_META = [
  /巴纳姆/, /福勒/, /星象?/, /算命/, /占卜/,
  /(?:barnum|forer)\s+effect/i, /fallacy/i, /谬误/, /逻辑错误/, /伪科学/,
].map((r) => r);

// 教学/课堂转述。
const FE_TEACH = [
  /教学/, /课[堂程]/, /教材/, /教案/, /课件/, /讲义/, /这节课/, /老师/, /学生/, /课堂讨论/, /随堂/, /公开课/,
  /lecture/i, /textbook/i, /teach/i, /lesson/i, /syllabus/i,
].map((r) => r);

// 否定翻转（先佯称后否认：不能作为/不代表…）。
const FE_NEG_FLIP = [
  /不能(?:作为|当作|当成)[^。，]{0,12}(?:依据|证据|判断|标准|结论|定论)/,
  /不(?:代表|意味着|足以证明)[^。，]{0,14}(?:精准|准确|真实|你就是这样)/,
  /(?:只是|不过是)[^。，]{0,12}(?:笼统|模糊|通用|放之四海)/,
  /(?:不?应该|不能)拿[^。，]{0,10}(?:性格描述|这些话)[^。，]{0,10}(?:当真|当依据|下结论)/,
  /(?:does\s+not|doesn'?t)\s+(?:prove|mean|show)/i,
  /(?:cannot|can'?t)\s+(?:be\s+used\s+as|serve\s+as)/i,
  /too\s+(?:vague|general)\s+to/i,
].map((r) => r);

// 对冲（也许/可能/未必/not necessarily）。
const FE_HEDGE = [
  /也许/, /可能/, /未必/, /不一定/, /或许/, /大概/, /说不准/,
  /perhaps/i, /maybe/i, /not\s+necessarily/i, /might\s+not/i,
].map((r) => r);

// 数据边界自陈（样本有限/仅供参考/倾向而非定论）——负责任解读的免责形态。
const FE_CAVEAT = [
  /(?:仅供|只供|仅供参考|参考而已|不能尽信|别太当真|别当真|仅作参考)/,
  /(?:样本|数据|题量|题数)[^。，！？!?]{0,8}(?:有限|不足|偏少|较小|有局限)/,
  /(?:倾向|倾向性|大概率|可能更接近|更可能是)[^。，！？!?]{0,12}(?:而非|而不是)[^。，！？!?]{0,10}(?:定论|结论|必然)/,
  /(?:需要|还得|应当)[^。，！？!?]{0,12}(?:结合|配合)[^。，！？!?]{0,12}(?:临床|访谈|专业|医生|咨询师|人工)/,
  /for\s+(?:reference|entertainment)\s+only/i,
  /(?:limited|small)\s+sample/i,
].map((r) => r);

// 第三人称转述报告：「描述对很多人都显示/大多数人都这样觉得」——
// 讨论巴纳姆话术的适用面而非对个体做专属判断。
const FE_REPORT = [
  /(?:对|适用于)[^。，]{0,8}(?:大多数人|很多人|大量人群|几乎所有人|谁都)/,
  /(?:大多数|很多|大量)[^。，]{0,6}(?:人|被试|读者|用户)[^。，]{0,10}(?:都|也会|同样)[^。，]{0,10}(?:适用|这样|觉得|中招|相信)/,
  /(?:applies?\s+to|fits?)\s+(?:most|many|almost\s+everyone|anyone)/i,
  /(?:most|many)\s+people[^.]{0,30}(?:would|might|could)/i,
].map((r) => r);

const _any = (arr, text) => arr.some((r) => r.test(text));

/**
 * 第 157 维度 forer_effect（巴纳姆效应）判别。
 * @param {string} text 归一化文本
 * @returns {{score: number, name: string, count: number}}
 */
function checkForerEffect(text) {
  if (typeof text !== 'string' || text.length === 0) return { score: 0, name: 'forer_effect', count: 0 };

  // 守卫：任一豁免命中即整体放行（负例注入逐条验证承重）。
  if (_any(FE_MEASUREMENT, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_META, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_TEACH, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_NEG_FLIP, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_HEDGE, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_CAVEAT, text)) return { score: 0, name: 'forer_effect', count: 0 };
  if (_any(FE_REPORT, text)) return { score: 0, name: 'forer_effect', count: 0 };

  // 腿①：人格描述句式（中/英任一族）。
  const descriptorHit = _any(FE_SURFACE_DEPTH_ZH, text) || _any(FE_BOTH_SIDES_ZH, text)
    || _any(FE_UNIVERSAL_NEED_ZH, text) || _any(FE_TYPE_LABEL_ZH, text)
    || _any(FE_RARE_UNDERSTAND_ZH, text) || _any(FE_FATE_ZH, text)
    || _any(FE_DEFENSE_ZH, text) || _any(FE_UNIVERSAL_EN, text);
  if (!descriptorHit) return { score: 0, name: 'forer_effect', count: 0 };

  // 腿②：第二人称人格断言。
  const personHit = _any(FE_PERSON_TARGET_ZH, text) || _any(FE_PERSON_TARGET_EN, text);
  if (!personHit) return { score: 0, name: 'forer_effect', count: 0 };

  // 双腿共现 → 命中，按描述族数量与精准佯称加权。
  let score = 60;
  const descriptorCount = [FE_SURFACE_DEPTH_ZH, FE_BOTH_SIDES_ZH, FE_UNIVERSAL_NEED_ZH,
    FE_TYPE_LABEL_ZH, FE_RARE_UNDERSTAND_ZH, FE_FATE_ZH, FE_DEFENSE_ZH, FE_UNIVERSAL_EN]
    .filter((arr) => _any(arr, text)).length;
  if (descriptorCount >= 2) score += 10;
  if (_any(FE_ACCURACY_ZH, text) || _any(FE_ACCURACY_EN, text)) score += 15;
  if (/[！？!?]/.test(text)) score += 5;
  score = Math.min(score, 95);

  return { score, name: 'forer_effect', count: 1 };
}

module.exports = {
  checkForerEffect,
  CONSTANTS: {
    FE_SURFACE_DEPTH_ZH, FE_BOTH_SIDES_ZH, FE_UNIVERSAL_NEED_ZH, FE_TYPE_LABEL_ZH,
    FE_RARE_UNDERSTAND_ZH, FE_FATE_ZH, FE_DEFENSE_ZH, FE_UNIVERSAL_EN,
    FE_PERSON_TARGET_ZH, FE_PERSON_TARGET_EN,
    FE_ACCURACY_ZH, FE_ACCURACY_EN,
    FE_MEASUREMENT, FE_META, FE_TEACH, FE_NEG_FLIP, FE_HEDGE, FE_CAVEAT, FE_REPORT,
  },
};
