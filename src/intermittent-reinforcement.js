/**
 * src/intermittent-reinforcement.js — 「间歇性强化」检测器（第 121 个判别维度）
 *
 * [r676 立项建模块] 候选来源：r670 探测器产出四族合格候选，r672-r675 先后
 * 做掉 thought_terminating_cliche / comparative_devaluation /
 * pet_harm_coercion / reproductive_coercion 后，本轮在当前 120 维引擎上
 * 实测量（/root/.hermes/cache/scratch/r676-probe.js，判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格）：族
 * 「间歇性强化」攻击 12 条漏判 10 条（83%）、良性 6 条 0 误伤、全维度
 * 零命中 6/12（Phase 1.5 同律复核成立）。decision 本体一次选出
 * （scripts/round-676-decide.js，读 /tmp/decide-opts-676.json，
 * composite_score 0.92 / confidence 0.85 / identity alignment 100%，
 * 无拒选）：intermittent_reinforcement 0.92 > reproductive_imperative_
 * binding 0.90 > love_bombing 0.87 > hidden-instance 接线 0.77。
 *
 * 辨别的族：「间歇性强化」（intermittent reinforcement）——操控者以
 * **不规律的好/坏交替**（忽冷忽热、时好时坏、看心情）作为控制手段，
 * 要求对方忍受坏、感激好、把伤害常态化。这是 Duluth 控制轮与操作性
 * 条件反射交叉的经典操控策略：坏行不是被否认，而是被**框架化为爱的
 * 证明**与**好日子的对价**：
 *   我这个人对你好坏看心情，你要学会珍惜我对你好的时候。
 *   我打你是因为我在乎你，打完我会更爱你。
 *   我对你时好时坏都是因为太爱你，你要习惯我的反复无常。
 *   别把我说的话当真，我时好时坏，你忍耐着就行。
 *   I blow hot and cold, so learn to appreciate the days I am nice.
 *
 * 为什么现有 120 个维度拦不住（r676 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——emotional_manipulation 管
 *   单次情感施压句式、victim_blaming 管归责、gaslighting 管现实否定，
 *   都不覆盖「好坏交替声明 × 适配要求」这个结构组合。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿 A「坏极/交替」（任中一类）：
 *     A1 交替声明（时好时坏/忽冷忽热/反复无常/喜怒无常/阴晴不定/
 *        blow hot and cold）；
 *     A2 单方意志（看心情/随我/由着我/我说了算/热度只有三分钟/
 *       脾气来得快去得也快）；
 *     A3 坏行指向对方（打你/骂你/吼你/冷淡/突然冷淡/冷战/别来烦我/
 *       惹我生气/气我/对你发脾气/对你坏/懒得搭理你/不愉快）；
 *   · 腿 B「适配绑定」（任中一类）：
 *     B1 适配要求（学会/习惯/忍耐/忍受/适应/理解/担待 + 我的坏脾气/
 *       我的反复无常/这两个我/这一切；英文 learn to appreciate/
 *       tolerate/accept）；
 *     B2 好作诱饵（珍惜/感激/记住 + 我对你好的时候/好的日子）；
 *     B3 坏行归因于爱（打你/骂你/对你坏 + 是因为太爱你/在乎你；
 *       那都是我太在乎你了）；
 *     B4 压制记忆（别记着/别放在心上/别当真/别计较/翻篇）；
 *     B5 好极条件化（等我心情好了自然会对你温柔/想理你的时候自然
 *       会理你/要是不惹我生气我对你自然是极好的/只有把我哄开心了
 *       才不会对你发脾气）；
 *     B6 撤回诱饵（别求我/你会求我理你/你就知道好歹/你会后悔）。
 *   · 单腿不判：「他打了我一顿，我报警了」是陈述无适配绑定；
 *     「你要学会控制自己的情绪」是正常建议无坏极交替。
 *
 * 明确不判的（守门 G1-G3）：
 *   · G1 概念分析语境：间歇性强化作为被分析、被解释的对象
 *     （「间歇性强化是一种情感操控手段」「Intermittent
 *     reinforcement is a manipulation tactic.」）；
 *   · G2 情绪健康正当语境：情绪管理/调节/心理咨询类正常讨论；
 *   · G3 句首咨询提问（只认句首咨询词，句中反问不豁免）。
 *
 * [r676 实现纪律] 同 r642-r675：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（单层反斜杠，Node 正则可识别）。
 */

'use strict';

// ─── 腿 A1: 交替声明（时好时坏/忽冷忽热）────────────────────────────
const ALT_ZH = new RegExp([
  String.raw`(?:时好时坏|忽冷忽热|冷热不定|反复无常|喜怒无常|阴晴不定|说变就变|一阵一阵|好坏不定|冷热无常)`,
].join('|'), 'i');

const ALT_EN = new RegExp([
  String.raw`\b(?:blow|blows|blew|blowing)\s+hot\s+and\s+cold\b`,
  String.raw`\bhot\s+and\s+cold\s+(?:with|toward|towards)\s+(?:you|me|him|her|them)\b`,
].join('|'), 'i');

// ─── 腿 A2: 单方意志决定待遇 ────────────────────────────────────────
const MOOD_ZH = new RegExp([
  String.raw`(?:看心情|看我心情|看我当时的心情|随我|由着我|由我|我说了算|热度只有三分钟|抓不住我|脾气来得快去得也快|全看我当时)`,
].join('|'), 'i');

// ─── 腿 A3: 坏行指向对方 ────────────────────────────────────────────
const BADACT_ZH = new RegExp([
  // 直接伤害动词指向对方（打你/骂你/吼你/吵你）
  String.raw`(?:打你|揍你|骂你|吼你|吵你|凶你|罚你)`,
  // 冷暴力类（冷淡/冷战/晾着/懒得搭理）
  String.raw`(?:冷淡|冷战|晾着你|懒得搭理你|不想搭理你|不理你|别理你)`,
  // 撤回关注类（别来烦我/别惹我/气我）
  String.raw`(?:别来烦我|别惹我|惹我生气|惹我|气我|烦我|别打扰我)`,
  // 定性否定（对你坏/对你不好/对你发脾气/不愉快）
  String.raw`(?:对你坏|对你不好|对你发脾气|跟你发脾气|不愉快|给你气受|给你脸色)`,
].join('|'), 'i');

// ─── 腿 B1: 适配要求（学会/习惯/忍耐 + 我的坏）──────────────────────
const ADAPT_ZH = new RegExp([
  String.raw`(?:学会|习惯|忍耐|忍受|适应|承受|包容|理解|担待|体谅)[^。]{0,6}(?:我的(?:坏|臭脾气|脾气|反复无常|时好时坏|两面|两面性|折腾|折腾劲)|这一切|这样的我|这两个我|我这个|我的那些事)`,
].join('|'), 'i');

const ADAPT_EN = new RegExp([
  String.raw`\blearn\s+to\s+(?:appreciate|tolerate|accept|put\s+up\s+with|deal\s+with)\b`,
  String.raw`\b(?:you\s+)?(?:have|has|had)\s+to\s+(?:learn|get\s+used)\s+to\b`,
].join('|'), 'i');

// ─── 腿 B2: 好作诱饵（珍惜/记住 + 我对你好的时候）────────────────────
const BAIT_ZH = new RegExp([
  String.raw`(?:珍惜|感激|庆幸|感恩|记住|感谢)[^。]{0,8}(?:我对你好的时候|对你温柔的时候|理你的时候|好的日子|好日子|不惹我生气的时候|听话的时候|我哄你的时候)`,
].join('|'), 'i');

const BAIT_EN = new RegExp([
  String.raw`\b(?:appreciate|cherish|be\s+grateful\s+for)\s+(?:the\s+)?(?:days?|times?|moments?)\s+(?:when\s+)?I(?:'m|\s+am)\s+(?:nice|good|kind|sweet)\b`,
].join('|'), 'i');

// ─── 腿 B3: 坏行归因于爱（打你是因为太爱你）────────────────────────
const LOVEBLAME_ZH = new RegExp([
  // 支1：坏行/交替 + 是因为 + 太爱你/在乎你
  String.raw`(?:打你|揍你|骂你|吼你|吵你|对你坏|冷淡你|时好时坏|忽冷忽热|反复无常)[^。]{0,8}是因为[^。]{0,6}(?:太)?(?:爱你|在乎你|关心你|重视你|为你好)`,
  // 支2：那/这 + 都(是) + (我)? + 太爱你/在乎你（无「是因为」连接词）
  String.raw`(?:那|这)都(?:是)?(?:我)?(?:太)?(?:爱你|在乎你|关心你|为你好)`,
].join('|'), 'i');

const LOVEBLAME_EN = new RegExp([
  String.raw`\b(?:hit|hits|hurt|hurts|beat|beats|yell|yells|yelled|shout|shouts|scream|screams)\s+(?:at\s+)?you\b[^.]{0,30}\bbecause\s+I\s+(?:love|care\s+about)\s+you\b`,
].join('|'), 'i');

// ─── 腿 B4: 压制记忆（别记着/别当真/翻篇）───────────────────────────
const SUPPRESS_ZH = new RegExp([
  String.raw`(?:别记着|别放在心上|别当真|别计较|翻篇|别介意|别在意|别再提|过去的事[^。]{0,4}再提|别把[^。]{0,10}当真|别把[^。]{0,10}放在心上)`,
].join('|'), 'i');

const SUPPRESS_EN = new RegExp([
  String.raw`\bdon'?t\s+take\s+(?:it|what\s+I\s+said|my\s+words)\s+(?:seriously|to\s+heart)\b`,
].join('|'), 'i');

// ─── 腿 B5: 好极条件化（等我心情好了自然会理你）─────────────────────
const CONDGOOD_ZH = new RegExp([
  // 支1：等(我)心情/气 + 好/消/过去/缓 + 自然会/才会 + 理你/对你好/温柔
  String.raw`(?:等|等我|等我把)(?:心情|情绪|气|这口气|火)(?:好|消|过去|缓过来)(?:了)?[^。]{0,8}(?:自然会|才会|自然|才)[^。]{0,8}(?:理你|搭理你|对你好|温柔|说话|说句话|搭理)`,
  // 支2：想/愿意 + 理你/对你好 + 的时候 + 自然会/才会
  String.raw`(?:想|愿意|乐意)(?:理你|搭理你|对你好)的时候[^。]{0,8}(?:自然会|才会|自然|才)`,
  // 支3：条件交换（要是不惹我生气，我对你自然是极好的）
  String.raw`(?:要是|如果|只要|只有|唯有)[^。]{0,12}(?:不|没|把我|将我|把我)[^。]{0,8}(?:惹我|气我|哄|听话|乖乖|顺从|答应)[^。]{0,16}(?:才不会|自然|才是|极好|对你好|给你好脸色|有好脸色)`,
].join('|'), 'i');

const CONDGOOD_EN = new RegExp([
  String.raw`\bwhen\s+I'?m\s+(?:in\s+a\s+)?(?:good|better)\s+mood\b[^.]{0,30}\b(?:I'?ll|I\s+will)\s+(?:be\s+)?(?:nice|kind|good\s+to\s+you)\b`,
  String.raw`\bunless\s+you\s+(?:keep\s+me\s+happy|obey|behave|do\s+what\s+I\s+say)\b`,
].join('|'), 'i');

// ─── 腿 B6: 撤回诱饵（别求我/你会求我理你/知道好歹）──────────────────
const WITHDRAW_ZH = new RegExp([
  String.raw`(?:别求我|求我(?:回来|理你|原谅|开口)|你就知道好歹|知道好歹了|你会后悔|到时候你别想|别再找我|别来找我)`,
].join('|'), 'i');

// ─── G1: 概念分析语境（间歇性强化作为被分析、被解释的对象）────────────
const CONCEPT_ZH = new RegExp([
  String.raw`(?:间歇性强化|间歇强化|变率强化)[^。]{0,12}(?:是|属于|构成|正是|就是|归为|列为)[^。]{0,16}(?:一种|手段|策略|机制|概念|理论|现象|模式|方式|解释|心理学|行为主义|操控|控制)`,
  String.raw`(?:心理学|行为主义|心理学中|社会学)[^。]{0,8}(?:间歇性强化|间歇强化)[^。]{0,12}(?:解释|描述|用来|指|理论)`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\bintermittent\s+reinforcement\b`,
].join('|'), 'i');

// ─── G2: 情绪健康正当语境 ───────────────────────────────────────────
const MOOD_HEALTH_ZH = new RegExp([
  String.raw`(?:情绪|心情|脾气)(?:管理|调节|控制|健康|稳定|疏导)[^。]{0,12}(?:是|需要|方法|建议|课程|训练|很重要|有助于|可以帮助)`,
  String.raw`(?:心理咨询|心理治疗|心理医生|心理健康)[^。]{0,12}(?:情绪|心情|脾气)`,
].join('|'), 'i');

// ─── G3: 句首咨询提问（只认句首咨询词，句中反问不豁免）──────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkIntermittentReinforcement(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ALT_ZH_ = R.ALT_ZH || ALT_ZH;
  const ALT_EN_ = R.ALT_EN || ALT_EN;
  const MOOD_ZH_ = R.MOOD_ZH || MOOD_ZH;
  const BADACT_ZH_ = R.BADACT_ZH || BADACT_ZH;
  const ADAPT_ZH_ = R.ADAPT_ZH || ADAPT_ZH;
  const ADAPT_EN_ = R.ADAPT_EN || ADAPT_EN;
  const BAIT_ZH_ = R.BAIT_ZH || BAIT_ZH;
  const BAIT_EN_ = R.BAIT_EN || BAIT_EN;
  const LOVEBLAME_ZH_ = R.LOVEBLAME_ZH || LOVEBLAME_ZH;
  const LOVEBLAME_EN_ = R.LOVEBLAME_EN || LOVEBLAME_EN;
  const SUPPRESS_ZH_ = R.SUPPRESS_ZH || SUPPRESS_ZH;
  const SUPPRESS_EN_ = R.SUPPRESS_EN || SUPPRESS_EN;
  const CONDGOOD_ZH_ = R.CONDGOOD_ZH || CONDGOOD_ZH;
  const CONDGOOD_EN_ = R.CONDGOOD_EN || CONDGOOD_EN;
  const WITHDRAW_ZH_ = R.WITHDRAW_ZH || WITHDRAW_ZH;
  const CONCEPT_ZH_ = R.CONCEPT_ZH || CONCEPT_ZH;
  const CONCEPT_EN_ = R.CONCEPT_EN || CONCEPT_EN;
  const MOOD_HEALTH_ZH_ = R.MOOD_HEALTH_ZH || MOOD_HEALTH_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '间歇性强化×好坏交替声明×适配绑定(zh)'
      : 'intermittent-reinforcement×alternating-declaration×adaptive-binding(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：概念分析 / 情绪健康 / 句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (MOOD_HEALTH_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 腿 A：坏极/交替（三类任中一类）
  const legA = ALT_ZH_.test(text) || ALT_EN_.test(text) ||
    MOOD_ZH_.test(text) || BADACT_ZH_.test(text);
  if (!legA) return miss();

  // 腿 B：适配绑定（六类任中一类）
  if (ADAPT_ZH_.test(text)) return hitResult;
  if (ADAPT_EN_.test(text)) return hitResult;
  if (BAIT_ZH_.test(text)) return hitResult;
  if (BAIT_EN_.test(text)) return hitResult;
  if (LOVEBLAME_ZH_.test(text)) return hitResult;
  if (LOVEBLAME_EN_.test(text)) return hitResult;
  if (SUPPRESS_ZH_.test(text)) return hitResult;
  if (SUPPRESS_EN_.test(text)) return hitResult;
  if (CONDGOOD_ZH_.test(text)) return hitResult;
  if (CONDGOOD_EN_.test(text)) return hitResult;
  if (WITHDRAW_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkIntermittentReinforcement,
  __internals: () => ({
    ALT_ZH, ALT_EN, MOOD_ZH, BADACT_ZH,
    ADAPT_ZH, ADAPT_EN, BAIT_ZH, BAIT_EN,
    LOVEBLAME_ZH, LOVEBLAME_EN, SUPPRESS_ZH, SUPPRESS_EN,
    CONDGOOD_ZH, CONDGOOD_EN, WITHDRAW_ZH,
    CONCEPT_ZH, CONCEPT_EN, MOOD_HEALTH_ZH, QUESTION_ZH,
  }),
};
