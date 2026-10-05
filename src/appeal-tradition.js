/**
 * src/appeal-tradition.js — 诉诸传统检测器（第 61 个判别维度）
 *
 * v6.8.2 新增。心虫 decision 本体选出（round-484-decide.js，A 得 0.80 分）。
 * 探测器 + 本轮复测（scripts/round-484-att-probe.js，直调 src/gate.js）：
 * 16 条攻击样本 11 条穿过硬闸门（gate=pass），8 条良性 0 误伤。
 *
 * 辨别的族：「以传统/惯例/历来如此压制改变或异议」——
 * 把「从来如此」当作「必须如此」的充分理由，用来挡掉质疑与改革。
 *
 * 为什么现有维度拦不住：
 *   · fallacies 下已有同名子标签 appeal_to_tradition，但只收极窄的
 *     两三个正则（「自古以来…所以…应该继续」等），覆盖不到本族主体句式，
 *     且 fallacies 是聚合维度、子标签不能在 findings 里独立归因。
 *   · unsupported_claim 管「无依据断言」，本族句子不需要证据，
 *     它的问题在论证结构：用历史频率置换正当性。
 *   · absolute_claim 管绝对化措辞，不识别「传统压制」这一语义结构。
 *
 * 判据（两类交叉，两者同时在场才判定）：
 *   T1 传统在场 —— 传统/老规矩/惯例/自古以来/祖祖辈辈/前人/世代传承
 *       tradition / custom / convention / always been done / forefathers
 *   T2 压制改变或异议 —— 不许改/不容置疑/改变就是背叛/就该继续/不需讨论
 *       must continue / cannot be questioned / not negotiable / stop arguing
 *   → verify 级：需给出改变或维持的真实理由，不能只说「历来如此」。
 *
 * 明确不判的（这些是正当陈述）：
 *   · 描述传统而不压制：「传统节日有丰富的民俗」
 *   · 支持合理变革：「老规矩如果不合理也应该改」
 *   · 兼容性引用历史：「公司沿用旧命名规范只为兼容历史代码」
 *   · 在评析这套论证：「诉诸传统是一种逻辑谬误」
 */

'use strict';

// ─── T1: 传统在场 ────────────────────────────────────
// 中文：指向历史传承的名词与时间跨度
const TRADITION_ZH = /传统|老祖宗|祖祖辈辈|祖祖代代|老一辈|古人|前人|前辈|历来|自古以来|世世代代|世代相传|祖传|传承(?:了)?(?:至今|下来|几)|流传(?:了)?(?:至今|下来)|老规矩|老例|旧例|旧制|成规|约定俗成|老办法|老一套|多年(?:的)?(?:习惯|规矩|惯例|做法)|多年(?:如此|下来)|一直(?:都)?(?:是)?(?:这么|这样)|多年如此|自古以来|从来都是|自古至今|几百年|数百年|上千年|数千年|古已有之|前人留下|老祖宗留下|传下来的|传下来至今|中华(?:民族)?传统|文化传统|风俗习惯|习俗|惯例|沿袭|常规|历年|历来如此|一直都是|(?:别人|大家|所有人|人人|全世界|其他人|身边的人|同行(?:们)?|同行们|周围的人|众人)(?:都|全都|也|向来|历来|从来|一直|全)*(?:是)?(?:这么|这样)(?:干|做|来|走|处理)/;

// 英文：tradition / custom / convention / 时间跨度 / 祖先主体
// 边界：单独出现即在场，判定仍需与 T2 交叉，故不会误伤描述性陈述。
const TRADITION_EN = /\btradition(?:ally|al)?\b|\bcustom(?:ary)?\b|\bconventions?\b|\bfor\s+(?:generations|centuries|hundreds\s+of\s+years|as\s+long\s+as)\b|\b(?:our|the)\s+(?:forefathers|ancestors|forebears)\b|\bthe\s+way\s+(?:it|we|things)\s+(?:has|have|had)\s+always\s+been\b|\b(?:has|have|had)\s+always\s+(?:\w+\s+){0,2}this\s+way\b|\balways\s+been\s+(?:done|that\s+way|this\s+way|the\s+practice|the\s+norm)\b|\blong-?standing\b|\btime-?honou?red\b|\bsince\s+time\s+immemorial\b|\bthe\s+old\s+way\b|\bby\s+precedent\b|\bcenturies?-?old\b/i;

// ─── T2: 压制改变或异议 ────────────────────────────────────
// 中文：否定改变 / 要求维持 / 禁止质疑 / 把改变定性为背叛
const SUPPRESS_ZH = /(?:所以|因此|因而|就该|那就|必须|只能|应当|应该|理应|自然|当然|只能)(?:继续|保持|维持|照旧|沿用|守住|延续|执行|传承)|(?:不能|不许|不准|不得|不可以|不该|不应该|绝不允许|绝不允许|不容)(?:擅自|轻易|随便|任意)?(?:说)?(?:改|变更|改变|更改|变动|修改|推翻|质疑|怀疑|挑战|打破|破例|违背|违反|背离)|(?:不容|不许)(?:讨论|商量|置疑|质疑|争议)|(?:没有|无)(?:商量|讨论|争议)的(?:余地|空间)|(?:改变|更改|变更|修改|改革)(?:的人|者)?(?:就是|等于|都是)(?:背叛|忘本|数典忘祖|破坏|大逆不道|对不起|惹祸|犯忌)|(?:不需要|无须|不必|不用)(?:质疑|怀疑|讨论|争辩|争论)|(?:怎么|为何|为什么)(?:就|偏)?(?:你|你们)?(?:特殊|另类|搞特殊|与众不同)|(?:就|只有|偏偏)(?:你|你们)(?:在)?(?:特殊|另类|搞特殊|与众不同)|(?:你|你们)(?:凭什么|凭什么敢)(?:例外|特殊|与众不同|反对|质疑|不一样)|(?:为什么|为何)(?:又)?只有(?:你|你们)(?:在)?(?:反对|质疑|提意见|挑刺|不同意)|照(?:老规矩|旧例|惯例)|按(?:老规矩|惯例|旧例)(?:办|执行|处理)|前人(?:定|立|立下)的(?:规矩|规矩)|古已有之|(?:不能|不得)(?:说改就改|说变就变)|(?:绝不|绝不)(?:能)?(?:改变|更改|变更)/;

// 英文：维持指令 / 禁止质疑 / 终止异议 / 改变定性为破坏
const SUPPRESS_EN = /\b(?:so|therefore|thus|hence)?\s*(?:we\s+|you\s+|it\s+)?(?:must|should|ought\s+to|need\s+to|have\s+to|has\s+to)\s+(?:continue|keep|maintain|preserve|uphold|stick\s+to|follow|carry\s+on|stay\s+the\s+course)|\b(?:cannot|can'?t|must\s+not|should\s+not|shouldn'?t|may\s+not|is\s+not\s+to\s+be|are\s+not\s+to\s+be)\s+(?:be\s+)?(?:changed|altered|questioned|challenged|tampered\s+with|revised|overturned|revisited|broken|undone|second-?guessed)|\b(?:not|never|no\s+longer)\s+(?:up\s+for\s+debate|negotiable|open\s+to\s+question|to\s+be\s+questioned)\b|\b(?:would|will|to|would)\s+break\s+with\b|\bstop\s+(?:arguing|questioning|complaining|whining|second-?guessing)\b|\band\s+that(?:'s|\s+is)\s+(?:final|that)\b|\bend\s+of\s+(?:discussion|story|debate)\b|\bit\s+has\s+(?:served|worked)\s+(?:us|them|everyone)\s+well\b/i;

// ─── 豁免：评析/引述这套论证本身 ───────────────────────────
// 判据边界：句中出现「诉诸传统」这个谬误名 + 定性词，是在评析该论证，
// 不是在运用它——同 fallacies 的 meta-discourse 豁免铁律。
const META_EXEMPT_ZH = /诉诸传统|诉诸惯例|诉诸习俗|拿传统当(?:理由|挡箭牌)/;
const META_EXEMPT_EN = /\bappeal\s+to\s+tradition\b|\btraditional(?:ism)?\s+fallacy\b/i;
const QUALIFY_ZH = /谬误|谬说|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思)/;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\s+(?:argument|reason)\b|\bquestionable\b|\bflawed\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkAppealToTradition(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 在评析「诉诸传统」这套论证 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) && QUALIFY_ZH.test(text)) ||
      (META_EXEMPT_EN.test(text) && QUALIFY_EN.test(text))) {
    return { hit: false, score: 0, detail: '' };
  }

  const trad = TRADITION_ZH.test(text) || TRADITION_EN.test(text);
  if (!trad) return { hit: false, score: 0, detail: '' };

  // T2 压制改变/异议
  if (SUPPRESS_ZH.test(text)) {
    return { hit: true, score: 0.4, detail: '诉诸传统压制改变/异议(zh)' };
  }
  if (SUPPRESS_EN.test(text)) {
    return { hit: true, score: 0.4, detail: '诉诸传统压制改变/异议(en)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkAppealToTradition };
