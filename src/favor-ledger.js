/**
 * src/favor-ledger.js — 「恩情账本」检测器（第 86 个判别维度）
 *
 * [v6.8.36] 第 563 轮新增。候选来源：上一轮（r560）的 6 族探针落盘池
 * /tmp/hf-r560-decide.json 的 A 候选；本轮（r563）先用真实 gate 复测缺口
 * （scripts/round-563-family-verify.js：7/10 穿门、良性 5 条零误伤），
 * 再用 decision 本体从剩余三族中选出（scripts/round-563-decide.js，
 * favor_ledger 得 0.84，落盘 /tmp/hf-r563-decide.json）。
 *
 * 辨别的族：「恩情账本」——把过往的付出、人情、照顾、提携记成一本
 * 可随时支取的账，用以换取当下的服从、让步或免责。典型形状：
 * 人情债务陈述 × 索取让步。它不是感谢，感谢不附带义务；它也不是
 * 情感绑架的全部（emotional_manipulation 管情绪施压本身），本族的
 * 招牌是**把历史善行折算成现在的授权额度**。
 *
 * 为什么现有维度拦不住（r563 归因实测 scripts/round-563-favor-attr.js）：
 *   10 条攻击样本 7 条穿门；sunk_cost_coercion / loyalty_test /
 *   concession_coercion / fallacies 逐条归因实测 **0 命中**；
 *   emotional_manipulation 1/10、paternalistic_decide 1/10，且均为
 *   被样本里其他话术腿偶然命中，非恩情账本腿命中：
 *   · sunk_cost_coercion 管「投入越多越不肯停」的自身沉没成本，本族管
 *     **单方面的历史付出折算成对方的义务**，方向相反；
 *   · loyalty_test 管「站队表忠心」的测试，本族不要求表态只要求让利；
 *   · emotional_manipulation 管情绪施压本身，本族可以完全没有情绪
 *     （「按当年的事算，这次你担一下」）；
 *   · appeal_to_authority 管权威背书，本族的权重来源是人情不是专业权威。
 *
 * 判据（两条腿都在即成立）：
 *   · A1 人情债务：当年/过去/这些年 + 帮助、提拔、照应、扛事、提携、
 *     拉票、兜底、covered for you、pulled strings、did for you；
 *   · A2 索取让步：当下要求对方服从、担责、让利、不拒绝、还人情
 *     （必须听我的 / 别推 / 不肯 / you owe me / cannot refuse）。
 *   · A1 × A2 = rewrite 级：主张本身是用历史善行置换当前的程序与自愿，
 *     必须改写为「人情归人情，决策归程序」的表述。
 *
 * 明确不判的（这些是合法陈述，G1-G3 三条看守）：
 *   · 正当致谢与人情往来：只陈述感谢、铭记，不索取当下让步；
 *   · 制度性回报与契约履行：明确说按合同/制度/标准办；
 *   · 回顾式叙述且无当下要求：单纯讲过去谁帮过谁，无索取动作。
 */

'use strict';

// ─── A1: 人情债务（历史付出/人情债务的陈述标记）──────────────────
const LEDGER_ZH = new RegExp([
  // 当年/过去/这些年 + 时间跨度
  '(?:当年|当初|过去|这些年|这些年里|一直以来|从前|以往|早年|那时候|当年在)',
  // 帮助动词：帮/拉/提携/提拔/照应/扛/兜底/扛事
  '(?:帮|帮过|帮了|帮助过|拉过|拉了一把|提拔|提携|照应|照顾|关照|兜底|扛过|扛了|担待|护着|护过|顶着|说情|说过的情|出的力|使的劲)',
  // 恩惠名词：人情/恩情/情分/债务
  '(?:人情|恩情|情分|恩惠|旧情|交情|好处|实惠|甜头)(?:债|账|本)?',
  // 抬举/给机会/带你
  '(?:抬举|提携|带你|领你|引荐|给你机会|给你平台|拉你一把|托了你一把)',
  // 「没有我就没有你」的存在论断
  '(?:没有我|要不是我|若非我|靠我才)',
  // 我方付出陈述
  '(?:我(?:?:当年|当初|这些年来|一直以来)?(?:?:对)?你(?:?:的)?(?:付出|照应|提拔|恩情|好处))',
  '(?:我为你(?:?:付出|扛|担|顶|跑|走关系|拉票|说情|得罪人))',
].join('|'));

const LEDGER_EN = new RegExp([
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:done|did)\\s+(?:so\\s+much|a\\s+lot|a\\s+great\\s+deal|so\\s+many\\s+things)\\s+for\\s+you\\b',
  '\\bafter\\s+(?:all|everything)\\s+(?:i|we)\\s+(?:have\\s+)?(?:done|did)\\s+for\\s+you\\b',
  '\\b(?:i|we)\\s+(?:covered|stood\\s+up|fought|pulled\\s+strings|put\\s+in\\s+a\\s+word|vouched|went\\s+out\\s+on\\s+a\\s+limb)\\s+for\\s+you\\b',
  '\\bwithout\\s+(?:me|us)\\s+you\\s+(?:would\\s+be|are)\\s+(?:nothing|nowhere|worthless)\\b',
  '\\b(?:i|we)\\s+(?:gave|offered|handed)\\s+you\\s+(?:your|this|the)\\s+(?:chance|opportunity|break|job|position|promotion|career)\\b',
  '\\byou\\s+(?:would\\s+be|wouldn\'t\\s+have\\s+been|would\\s+not\\s+have\\s+been)\\s+(?:nothing|nowhere)\\s+(?:without\\s+(?:me|us))\\b',
  '\\bwhen\\s+(?:i|we)\\s+(?:helped|backed|supported|bailed)\\s+you\\s+(?:out|back\\s+then|in\\s+the\\s+past)\\b',
  '\\bi\\s+(?:bailed|got|pulled)\\s+you\\s+(?:out|through)\\s+(?:of\\s+)?(?:that|it|trouble)\\b',
], 'i');

// ─── A2: 索取让步（当下要求服从/担责/让利/不拒绝）────────────────
const CLAIM_ZH = new RegExp([
  // 必须听我的 / 得听 / 照我说的做
  '(?:必须|得|应该|应当|务必要)?(?:听|听我的|听从|照我说的|按我说的|依着我的意思)',
  // 别推 / 不能推 / 别拒绝 / 不准拒绝
  '(?:别|不要|不能|不许|不准|少跟我|别再)(?:推|推辞|推托|推脱|拒绝|推让|推三阻四|讲条件|谈条件)',
  // 不肯 / 好意思 / 这点事都不
  '(?:这点(?:小事|事情|事|忙)(?:都)?(?:不|也不))',
  '(?:你好?意思|你还好意思|亏你好意思)',
  // 担起 / 扛下 / 顶着 / 背着（承担责任）
  '(?:)(?:把|来|去|给)(?:这个|这份|那件|这事)(?:责任|锅|委屈|担子|事情)(?:担|扛|顶|背|揽|认)下?',
  // 让利/让步：让一让 / 让让步 / 吃点亏 / 牺牲一下
  '(?:)(?:就)?(?:让|退|让让|退一步|低个头|吃点亏|受点委屈|牺牲一下|委屈一下)',
  // 「算便宜你了」「便宜你了」的相对让步
  '(?:算|算是|就当)(?:便宜|赏|给你)(?:你了|你的)',
  // 你看着办 / 意思意思 / 表示表示
  '(?:)(?:看着办|掂量着|意思意思|表示表示|表个态|出点血)',
  // 「我的要求」「我的条件」
  '(?:)(?:我|这点|这点小)(?:要求|条件|想法|主意)(?:你|你得)?(?:看着办|办|答应|应下|满足)',
  // 「还我这个人情」「记着当年」
  '(?:)(?:还|记着|记住|念着|想着)(?:我)?(?:这个)?(?:人情|情分|旧情|当年|当初|当年的事|我当年的)',
].join('|'));

const CLAIM_EN = new RegExp([
  '\\byou\\s+(?:cannot|can\'t|must|have\\s+to|should)\\s+(?:refuse|say\\s+no|decline|deny)\\s+(?:me|us|this)?\\b',
  '\\byou\\s+(?:owe|owe\\s+me|owe\\s+us)\\s+(?:me|us|this|this\\s+one)\\b',
  '\\b(?:so\\s+)?(?:do|do\\s+as\\s+i\\s+say|listen\\s+to\\s+me|take\\s+my\\s+word)\\b',
  '\\bthis\\s+is\\s+(?:a\\s+)?(?:small|tiny|little|trivial|simple)\\s+(?:ask|favor|thing|request)\\s+(?:you\\s+)?(?:cannot|can\'t|won\'t)',
  '\\bconsider(?:ing)?\\s+(?:what|everything)\\s+(?:i|we)\\s+(?:did|have\\s+done)\\b',
  '\\bso\\s+the\\s+least\\s+you\\s+can\\s+do\\b',
  '\\bdon\'?t\\s+(?:you\\s+)?(?:dare|even\\s+think\\s+about)?\\s*(?:refuse|push\\s+back)\\b',
], 'i');

// ─── G1: 正当致谢与人情往来看守（合法）──────────────────────
// 只有感谢/铭记/祝愿，不索取当下让步 → 不判。
const GUARD_ZH = new RegExp([
  '(?:)(?:真心|衷心|由衷|非常|特别|万分)?(?:感谢|谢谢|感激|感恩)(?:你|您|大家|各位)(?:?:当年|当初|一直以来|这些年来)?(?:?:的)?(?:?:帮助|提携|照应|支持|指点|栽培|信任)?',
  '(?:)(?:我)?(?:一直|始终|永远|会)(?:记|铭记|念着|想着|感恩)(?:在(?:心里|心上)|着)(?:你|您)?(?:?:的)?(?:?:恩情|人情|情分|帮助)',
  '(?:)(?:祝|愿你|希望你)(?:?:今后|以后|未来)(?:?:一切顺利|越来越好|前程似锦|身体健康|家庭幸福)',
  // 制度性回报：按合同/制度/标准办
  '(?:)(?:按|依照|按照|依据|根据)(?:合同|合约|约定|协议|制度|规定|章程|流程|标准|规范|纪律)(?:办|办理|执行|履行|操作|处理|来|走)',
  '(?:)(?:该|应该|应|须)(?:按|依照|依据)(?:合同|制度|规定|标准|程序|流程)(?:办|走|执行|处理|来)',
  // 明确切割：人情归人情，程序归程序
  '(?:)(?:人情|感情|私交)(?:归|是)(?:人情|感情|私交)',
  '(?:)(?:公事公办|公事|工作)(?:公办|归工作|归公事)',
  // 回顾式叙述+无索取：单纯陈述过去帮助且无当下要求
  '(?:)(?:回顾|回望|回想)(?:这些年|这些年里|过去|往事)',
].join('|'));

const GUARD_EN = new RegExp([
  '\\b(?:thank\\s+you|thanks|grateful|indebted)\\s+(?:so\\s+much\\s+)?(?:to\\s+you|for\\s+everything|for\\s+all)\\b',
  '\\bi\\s+(?:will\\s+)?(?:always\\s+)?(?:remember|cherish|treasure)\\s+(?:your|the)\\s+(?:kindness|help|support|generosity)\\b',
  '\\bper\\s+(?:the\\s+)?(?:contract|agreement|policy|regulation|procedure|terms)\\b',
  '\\bbusiness\\s+is\\s+business\\b',
  '\\bpersonal\\s+(?:favors?|gratitude)\\s+(?:aside|set\\s+aside)\\b',
  '\\bi\\s+will\\s+be\\s+personally\\s+grateful\\s+forever\\b',
], 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFavorLedger(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasLedger = LEDGER_ZH.test(text) || LEDGER_EN.test(text);
  if (!hasLedger) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当致谢/人情往来/制度性回报 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const hasClaim = CLAIM_ZH.test(text) || CLAIM_EN.test(text);
  if (!hasClaim) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '恩情账本×人情债务×索取让步(zh)'
      : 'favor-ledger×past-favor×demand-for-compliance(en)',
  };
}

module.exports = {
  checkFavorLedger,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    LEDGER_ZH, LEDGER_EN,
    CLAIM_ZH, CLAIM_EN,
    GUARD_ZH, GUARD_EN,
  }),
};
