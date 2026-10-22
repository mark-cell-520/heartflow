/**
 * src/manufactured-consent.js — 冒充集体同意检测器（第 64 个判别维度）
 *
 * v6.8.6 新增。心虫 decision 本体选出（/root/.hermes/cache/scratch/.hf-decide-r493-r3.js，
 * 候选 A 得 0.87 分，identify_alignment 0.80；前两轮 0.81/0.84 平局弃权后，
 * 第三轮用显式数值通道才分出高下，第二名 identity_fusion_attack 0.84）。
 * 探测候选来源：内置 5 族 + 第 492 轮 6 族已被做穿，
 * 本轮扩池探针 /root/.hermes/cache/scratch/.hf-scout-r493-probe.js（10 个新族）。
 * 复测（同探针直调 src/gate.js）：6 条攻击样本 **6/6 穿过硬闸门**
 * （gate=pass，零覆盖），3 条良性 0 误判。
 *
 * 辨别的族：「程序伪装」——把**一次从未发生的表决**写成交互上
 * 已被默认通过的同意。压力机制：用「你没有反对」这个**沉默事实**
 * 冒充「你已同意」这个**意志行为」，让后续的反对变成「出尔反尔」。
 * 与已有维度的区别：
 *   · social_norm 管「大家都这样所以你也该」的经验性从众压力，
 *     本族管的是**会议/决策程序被短路**（没有唱票、没有记录、没有复议），
 *     与人数无关，一个人沉默也照样判；
 *   · appeal_to_tradition 管「历来如此」，本族管「此刻即通过」；
 *   · apparatus_deflection 管把责任推给流程，本族是**主动宣称
 *     程序已经完成并产生多数同意**；
 *   · unsupported_claim 管无依据断言，本族的同意声明不是可证伪的
 *     事实命题，而是「无反对即成立」的**程序性偷换**。
 *
 * 判据（两条件同时在场才判定）：
 *   M1 沉默现状在场 —— 无人反对/没人举手/没意见/不说话/沉默/no objection
 *   M2 由沉默推出同意 —— 宣布通过/就这么定了/视为一致/默认就是同意/
 *     take it as unanimous/视为通过/代表你们同意
 *   → verify 级：要求把实际表决（票数、弃权、反对票）与是否通过分开陈述，
 *     沉默不等于同意；若确实推进，须补记名表决或书面确认。
 *
 * 明确不判的（这些是正当陈述，三项良性信号占二即豁免）：
 *   · 具名票数的表决结果：「表决结果：3 票赞成、1 票弃权，会议记录已归档」
 *   · 反对意见有记录并复议：「反对意见已记入附录，并于下周三复议」
 *   · 无应答被如实记为无应答：「我们把无答复如实记为未反馈，不作同意」
 *   · 在评析这套话术本身（「诉诸沉默」是一种逻辑谬误）
 */

'use strict';

// ─── M1: 沉默现状在场（无人反对/没人举手/不说话） ──────────────
// 中文：无人反对 / 没人（有）意见 / 没人举手 / 不说话 / 不表态 / 保持沉默 / 没有异议
const SILENCE_ZH = /(?:无人|没有人|没人|没有看见有人|未见到有人|大家都没|都没|大家都|全都)[^。，；]{0,8}(?:反对|异议|有意见|意见|举手|提出|出声|发言|表态|站|说|支持|答应|附和|呼应)|(?:没人|无人|不)[^。，；]{0,4}(?:举手|说话|出声|发言|表态)|(?:保持|选择)?沉默(?:的人|者)?|(?:不|没)[^。，；]{0,6}(?:开口|作声|作言|愿意|响应|答复|回话)/;

// 英文：no objections / nobody objected / nobody raised a hand / nobody spoke up
const SILENCE_EN = /\b(?:no|zero|without\s+a)\s+(?:objection|objections|objectors|dissent|hands?|questions?|response)\b|\b(?:nobody|no\s+one|nobody\s+here)\s+(?:objected?|objects?|raised|spoke\s+up|said\s+anything|disagreed?|is\s+objecting)\b|\bnobody\s+(?:raised|put\s+up)\s+(?:a\s+)?(?:hand|finger)\b|\bsilence\b|\bthe\s+(?:room|floor)\s+is\s+(?:silent|quiet)\b/i;

// ─── M2: 由沉默推出同意 ──────────────────────────────────────
// 中文：就这么定了 / 宣布通过 / 视为一致 / 默认就是同意 / 代表你们同意 /
//       一致通过 / 我宣布 / 全票 / 通过（动作）
const CONSENT_ZH = /(?:就)?(?:这么|这样|照此)(?:定了|办|定|敲定|定了)|宣布(?:通过|方案|决定|立项|敲定|批准|同意)|(?:视为|看作|算作|等同于|视作|默认|认定)(?:一致|同意|赞成|默认同意|通过|大家同意|无异议)?|代表(?:你们|大家|大家就|你们就)?(?:都)?(?:同意|赞成|默许|认了)|(?:不表态|沉默|不说话|没人说话|没意见)\s*(?:的?人)?(?:就是|等于|算是|当作)(?:默认|同意|赞成|认了)?|一致(?:通过|同意|认可|认同)|全票(?:通过|同意)|我(?:就)?(?:宣布|认定)(?:通过|大家|这|这事)?|默认(?:大家|你们|各位|全员)?(?:都)?(?:同意|赞成|认了|通过|没意见)|这(?:事|件事|方案|项目)?(?:就)?(?:定|定下来|敲定)(?:了|下来)?|(?:我理解|我当)(?:成|作)(?:大家|你们|各位)?(?:都)?(?:没意见|同意|赞成)/;

// 英文：把沉默读成同意的多种表述（直接等值型 / 形容词前置型 / 逆序型 / 全员一致型）
const CONSENT_EN = new RegExp([
  // 直接等值型：take/treat/count/see/read/interpret + (可选沉默名词) + as/to be + 同意词
  // 直接等值型：(可选主语) + counts/treats/… + (可选沉默名词) + as/to be + 同意词
  '\\b(?:i|we|you|they|it|this|that)?\\s*(?:counts?|treats?|treat(?:ed)?|takes?|interpret(?:s|ed)?|reads?|sees?|understand(?:s|ing)?|hears?)(?:\\s+(?:this|that|it|silence|the\\s+silence|no\\s+\\w+|these|those))?\\s+(?:as|to\\s+(?:mean|be)|as\\s+being|as\\s+a)\\s+(?:unanimous|approval|consent|a\\s+yes|agreement|approved|accepted|agreed|a\\s+go-?ahead|a\\s+green\\s*light)',
  // 形容词前置型：unanimously / by consensus + 通过词
  '\\b(?:unanimous|unanimously|by\\s+consensus|by\\s+acclamation|without\\s+dissent|by\\s+default)\\s+(?:approv|accept|agree|passed|adopt)',
  // 逆序型：passed / approved / accepted + by consensus / unanimously
  '\\b(?:approv|accept|agree|passed?|adopt(?:ed)?|proceed(?:ing)?)\\s+(?:by\\s+(?:consensus|acclamation|default)|unanimously)',
  // 全员一致型：we are all agreed / everyone is agreed / all in agreement
  '\\b(?:we|everyone|all|everybody)\\s+(?:are\\s+|is\\s+|are\\s+all\\s+|all\\s+)?(?:agreed|in\\s+agreement|of\\s+one\\s+mind)',
  // 沉默等同型：silence means / silence counts as
  '\\bsilence\\s+(?:means|counts\\s+as|is\\s+(?:as\\s+)?)',
].join('|'), 'i');

// ─── 豁免信号 ────────────────────────────────────────────────
// ① 具名票数/表决数字：票数、弃权、反对票记录在案 → 真表决不是冒充
const VOTE_COUNT_ZH = /\d+\s*(?:票|\s*人)\s*(?:赞成|同意|反对|弃权|保留)|(?:赞成|同意|反对|弃权|保留)\s*\d+\s*(?:票|\s*人)|投票(?:结果|记录|明细)|(?:记名|实名)(?:投票|表决)|匿名(?:投票|表决|问卷)/;
const VOTE_COUNT_EN = /\b\d+\s*(?:in\s+favor|for|against|abstain(?:ed|ing)?|abstentions?|votes?)\b|\bvote(?:d|r)?\s*(?:count|result|tally|record)\b|\b(?:recorded|logged|logged\s+in\s+the\s+minutes|minuted)\b/i;
// ② 程序合规痕迹：记录在案 / 复议 / 归档 / 书面确认 / circulated the minutes
const PROCEDURE_ZH = /(?:记录在案|会议记录|纪要|归档|复议|再议|复审|书面(?:确认|回执|签字)|签名|签收|公告|公示|征求意见|回执|逾期视为)/;
const PROCEDURE_EN = /\b(?:minutes|meeting\s+record|minuted|circulated|ratified|second(?:ed)?\s+by|motion\s+(?:carried|failed|tabled)|brought\s+back|re-?vote|walkthrough|written\s+confirm|sign-?off|on\s+record)\b/i;
// ③ 沉默被如实记为沉默：no response recorded / 未反馈不作同意
const NO_SILENT_EQUATE_ZH = /(?:未反馈|没有(?:回复|答复|回应)|无应答|逾期)[^。，；]{0,8}(?:不(?:视为|算作|当作|等于))?(?:同意|赞成|认可|通过|默认)|(?:不(?:能|可以|得))[^。，；]{0,6}(?:视为|当作|算作)(?:同意|赞成|认可)/;
const NO_SILENT_EQUATE_EN = /\b(?:non-?response|no\s+response|silence)\s+(?:is\s+)?not\s+(?:consent|approval|agreement|a\s+yes)\b|\bwe\s+(?:do\s+not|don'?t)\s+(?:count|treat|read)\s+(?:silence|non-?response)\s+as\b|\bno\s+response\s+(?:is\s+)?(?:logged|recorded)\s+(?:as|only)\b/i;

// 在评析这套话术本身 → 不是在运用它
const META_EXEMPT_ZH = /诉诸(?:沉默|沉默多数|无人反对)|(?:斯德哥尔摩|从众)(?:谬误|效应)/;
const META_EXEMPT_EN = /\bappeal\s+to\s+silence\b|\bargumentum\s+(?:ad\s+)?silentio\b|\bmanufactured\s+consent\s+is\b|\bthat'?s\s+(?:an?\s+)?appeal\s+to\s+silence\b/i;

const QUALIFY_ZH = /谬误|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思|警惕)/;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\b|\bquestionable\b|\bflawed\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkManufacturedConsent(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析「无人反对即同意」这套论证 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) &&
      (QUALIFY_ZH.test(text) || QUALIFY_EN.test(text))) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // M1 沉默现状
  const silence = isZh
    ? (SILENCE_ZH.test(text) || SILENCE_EN.test(text))
    : (SILENCE_EN.test(text) || SILENCE_ZH.test(text));
  if (!silence) return { hit: false, score: 0, detail: '', count: 0 };

  // M2 由沉默推出同意
  const consent = isZh
    ? (CONSENT_ZH.test(text) || CONSENT_EN.test(text))
    : (CONSENT_EN.test(text) || CONSENT_ZH.test(text));
  if (!consent) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免：真表决（票数在场）/ 程序痕迹 / 沉默被如实记为不表态
  const voted = isZh
    ? (VOTE_COUNT_ZH.test(text) || VOTE_COUNT_EN.test(text))
    : (VOTE_COUNT_EN.test(text) || VOTE_COUNT_ZH.test(text));
  const procedure = isZh
    ? (PROCEDURE_ZH.test(text) || PROCEDURE_EN.test(text))
    : (PROCEDURE_EN.test(text) || PROCEDURE_ZH.test(text));
  const noEquate = isZh
    ? (NO_SILENT_EQUATE_ZH.test(text) || NO_SILENT_EQUATE_EN.test(text))
    : (NO_SILENT_EQUATE_EN.test(text) || NO_SILENT_EQUATE_ZH.test(text));
  // 三项良性信号占二以上 → 视作正规程序陈述，不是冒充同意
  const benignSignals = [voted, procedure, noEquate].filter(Boolean).length;
  if (benignSignals >= 2) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: isZh ? 0.45 : 0.45,
    count: 1,
    detail: isZh ? '沉默现状×冒充同意(zh)' : '沉默现状×冒充同意(en)',
  };
}

module.exports = { checkManufacturedConsent };
