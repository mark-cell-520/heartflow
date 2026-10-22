/**
 * src/liberty-restriction.js — 「人身自由限制」检测器（第 123 个判别维度）
 *
 * [r679 立项建模块] 候选来源：r678 探测器（scripts/round-678-family-probe.js）
 * 在 122 维引擎上复量（判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；≥50%
 * 攻击漏判且良性 0 误伤才算合格）。decision 本体一次选出
 * （scripts/round-679-decide.js 读 /tmp/decide-opts-679.json，
 * composite_score 0.92 / identity alignment 100%，无拒选）：
 * A liberty_restriction 0.92 > C medical_coercion 0.91 >
 * B deprivation_coercion 0.89 > E substance_coercion 0.88。
 * A 族实测攻击 10 条漏判 8 条（80%）、其中全维度零命中 8 条、良性
 * 6 条 0 误伤（另 2 条已被 social_isolation 判 verify，新维度仍命中）。
 *
 * 辨别的族：「人身自由限制」（liberty restriction）——操控者以
 * **物理拘禁、控制对方行动所需的物品/证件、暴力威胁阻挠离开、
 * 或行踪管制与强制陪同**剥夺对方的人身自由，逼迫对方顺从。这是
 * 亲密关系/监护/权力不对等场景中虐待与控制的早期物理信号
 * （Duluth 控制轮的「恐吓」与「胁迫与威胁」两项的物理形态）：
 *   我把你锁在屋里，你什么时候认错什么时候放出来。
 *   手机和身份证我先没收，你需要申请才能拿。
 *   再跑我就把你的腿打断，看你还怎么出门。
 *   You are not leaving this house until I say so. I locked the door.
 *
 * 为什么现有 122 个维度拦不住（r679 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——social_isolation 管社交
 *   关系隔绝（见人/联系他人）、economic_control 管经济支配、
 *   legal_status_coercion 管法律身份对象（签证/护照/官司），都不
 *   覆盖「拘禁/没收/禁足/行踪管制」这个物理行动控制组合。
 *
 * 判据（四类独立通路，任中一类即判定）：
 *   · P1 拘禁动作（锁在屋里/关起来/反锁了/困在/I locked/I will chain）；
 *   · P2 物品控制（手机证件钥匙 + 没收/收走/藏起来/confiscated）；
 *   · P3 人身强制（绑着你/腿打断/铁链/chain you/break your legs）；
 *   · P4 行踪管制（行踪/去哪儿 + 汇报/报告；没有我陪着；without me）；
 *   · P5 行动禁止 + 控制者许可结构共现（不准踏出/不许离开 + 我的允许/
 *     没有我的话/认错/until I say so）——单有「不准出门」不判（家长
 *     口头管教是正常形态，见 C1 边界锁）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 依法/医疗/纪律语境（依法隔离/医疗约束须遵循规范/以纪律为由/
 *     疫情防控）；
 *   · G2 概念/规范陈述（限制人身自由是违法/操控手段/is a form of abuse）；
 *   · G3 求助与权利陈述（报警/求助/保护令/seek help）；
 *   · G4 句首咨询提问（如何应对…/What should I do…）。
 *
 * [r679 实现纪律] 同 r642-r678：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义
 *   （r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，只影响 detail
 *   文案；字面端点不含任何反斜杠，零风险）。
 */

'use strict';

// ─── P1: 拘禁动作 ──────────────────────────────────────────────────
const CONFINE_ZH = new RegExp([
  // 无主语形（「直接锁在屋里」「关起来」）
  String.raw`(?:锁|关|困|拘禁|禁闭|囚)[^。]{0,6}(?:在|到|起来|住)`,
  // 带主语/宾语形（「我把门反锁了」「把你关起来」）
  String.raw`(?:我把|我将|我早就把|将你|把你|给你)[^。]{0,6}(?:反锁|锁上|锁了|锁住|关起来|关在|困在|囚禁|禁闭)`,
].join('|'), 'i');

const CONFINE_EN = new RegExp([
  String.raw`\byou\s+are\s+not\s+leaving\b`,
  String.raw`\bnot\s+leaving\s+this\s+house\b`,
  String.raw`\byou\s+are\s+grounded\b`,
  String.raw`\bi\s+locked\b`,
  String.raw`\bwe\s+locked\b`,
  String.raw`\bi\s+will\s+chain\b`,
  String.raw`\blocked\s+you\s+in\b`,
  String.raw`\bconfined\s+you\b`,
].join('|'), 'i');

// ─── P2: 物品控制（行动所需物品 + 控制动作）──────────────────────
const ITEM_ZH = new RegExp([
  // 物品在前（「手机和身份证我先没收」「钥匙我收走了」）
  String.raw`(?:手机|电话|证件|身份证|护照|钥匙|钱包|门禁卡|通行证)[^。]{0,10}(?:先没收|没收|收走|拿走|扣着|扣下|藏起来|撕了|断了|我收|被我)`,
  // 动作在前（「我把你的证件藏起来了」）
  String.raw`(?:我把|我将|给你|替你)[^。]{0,8}(?:没收|收走|扣下|藏了|撕了|断了)[^。]{0,8}(?:手机|证件|身份证|钥匙|护照|钱包)`,
].join('|'), 'i');

const ITEM_EN = new RegExp([
  String.raw`\b(?:confiscated|took|hid|kept|withheld)\b[^.]{0,24}\b(?:your\s+)?(?:phone|passport|documents?|id\b|keys?|wallet)`,
  String.raw`\byour\s+(?:phone|passport|keys?|documents?)\b[^.]{0,24}\b(?:confiscated|took|hid|kept|are\s+gone|is\s+gone)`,
].join('|'), 'i');

// ─── P3: 人身强制 ─────────────────────────────────────────────────
const FORCE_ZH = new RegExp([
  // 绑捆须指向人（「绑着你」；「捆绑在一起/捆绑销售」不命中）
  String.raw`(?:绑|捆|拴|铐)[^。]{0,2}着你`,
  String.raw`(?:把你|将你|给你)[^。]{0,4}(?:绑|捆|拴)`,
  // 暴力部位（「把你的腿打断」）
  String.raw`(?:腿|手臂|手脚)[^。]{0,8}(?:打断|打折|扭断|捆住|绑住)`,
  // 拘禁器具
  String.raw`(?:铁链|锁链|手铐|脚镣|绳索)[^。]{0,8}`,
].join('|'), 'i');

const FORCE_EN = new RegExp([
  String.raw`\bchain\w*\s+you\b`,
  String.raw`\bbreak\s+your\s+legs?\b`,
  String.raw`\b(?:tie|handcuff|bind)\s+you\b`,
  String.raw`\byour\s+legs?\b[^.]{0,12}\b(?:break|broke|broken)\b`,
].join('|'), 'i');

// ─── P4: 行踪管制（独立通路）─────────────────────────────────────
const TRACK_ZH = new RegExp([
  // 行踪/去向 + 汇报报告
  String.raw`(?:行踪|行迹|去向|去哪儿|去哪)[^。]{0,10}(?:汇报|报告|审查|核实|掌握)`,
  // 强制陪同（「没有我陪着」）
  String.raw`(?:没有我|没我|须我|要我)[^。]{0,6}(?:陪|陪同|跟着|同行)`,
  // 强制汇报句式
  String.raw`(?:随时|事事|必须)[^。]{0,6}(?:向我|跟我|给我)[^。]{0,4}(?:汇报|报告)`,
].join('|'), 'i');

const TRACK_EN = new RegExp([
  String.raw`\bwhereabouts\b`,
  String.raw`\b(?:report|tell)\s+me\s+(?:where|when|who)\b`,
  String.raw`\byou\s+(?:must|have\s+to|need\s+to)\s+(?:ask|report|check)\s+(?:with|in)\s+me\b`,
  String.raw`\bwithout\s+me\s+you\b[^.]{0,24}\b(?:can'?t|cannot|couldn'?t|can\s+not)\b`,
].join('|'), 'i');

// ─── P5: 行动禁止（须与 PERMIT 控制者许可结构共现）────────────────
const MOVE_ZH = new RegExp([
  String.raw`(?:不准|不许|不能|不让|禁止)[^。]{0,8}(?:出门|外出|离开|踏出|单独|出去|出这个门|去哪儿|见任何人|乱跑)`,
  String.raw`哪儿也不(?:能去|准去|许去|敢去)`,
  String.raw`哪也不能去`,
  String.raw`哪儿都别想`,
].join('|'), 'i');

const MOVE_EN = new RegExp([
  String.raw`\byou\s+(?:can'?t|cannot|can\s+not|won'?t|will\s+not|are\s+not\s+allowed)\s+(?:to\s+)?(?:leave|go|walk|see|out)\b`,
  String.raw`\bnot\s+(?:let|allow)\w*\s+(?:me|you)\s+(?:leave|go|out)\b`,
].join('|'), 'i');

// ─── PERMIT: 控制者许可结构（P5 的第二腿）────────────────────────
const PERMIT_ZH = new RegExp([
  String.raw`我的允许`,
  String.raw`没有我的话`,
  String.raw`没我的话`,
  String.raw`听我的`,
  String.raw`我说了算`,
  String.raw`我说话`,
  String.raw`我决定`,
  String.raw`我同意`,
  String.raw`我批准`,
  String.raw`认错`,
  String.raw`原谅你`,
  String.raw`跟我申请`,
  String.raw`向我申请`,
  String.raw`需要申请`,
  String.raw`求得我`,
  String.raw`看我心情`,
  String.raw`看我表现`,
  String.raw`等我发话`,
  String.raw`我发话`,
  String.raw`我答应`,
].join('|'), 'i');

const PERMIT_EN = new RegExp([
  String.raw`\buntil\s+i\s+say\b`,
  String.raw`\bwhen\s+i\s+decide\b`,
  String.raw`\bmy\s+permission\b`,
  String.raw`\bunless\s+i\b`,
  String.raw`\bi\s+say\s+so\b`,
  String.raw`\bask\s+me\s+first\b`,
  String.raw`\bi\s+(?:decide|allow|permit)\b`,
].join('|'), 'i');

// ─── G1/G2/G3: 守门（概念/规范/求助陈述）─────────────────────────
const CONCEPT_ZH = new RegExp([
  // 规范禁止 + 自由对象（「不应…限制…人身自由」「不得…扣押」）
  String.raw`(?:不应|不能|不可以|请勿|切勿|不得|严禁)[^。]{0,16}(?:人身自由|拘禁|限制|禁足|扣押)`,
  // 违法/操控定性（「非法拘禁是刑事犯罪」「限制人身自由是操控手段」）
  String.raw`(?:非法拘禁|限制人身自由|人身自由)[^。]{0,16}(?:是|属于|构成|需要|应当)[^。]{0,12}(?:违法|犯罪|刑事|责任|操控|要挟|侵权|虐待)`,
  // 依法/医疗/纪律语境
  String.raw`(?:须遵循|应遵循|遵循|依照|按照)[^。]{0,12}(?:规范|法定|程序|规定)`,
  String.raw`依法|依规|法定程序|医疗规范|疫情防控|防控期间|纪律为由`,
  // 求助/权利通道
  String.raw`报警|求助|保护令|热线|保留证据|110|法律援助`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\bis\s+a\s+form\s+of\s+(?:abuse|coercion|control)\b`,
  String.raw`\b(?:but\s+)?not\s+imprison\b`,
  String.raw`\bis\s+(?:illegal|unlawful|a\s+crime)\b`,
  String.raw`\b(?:seek|get)\s+help\b`,
  String.raw`\bcontact\s+(?:the\s+)?(?:police|authorities|lawyer)\b`,
  String.raw`\b(?:medical|legal)\s+(?:procedures?|standards?|protocols?)\b`,
  String.raw`\b(?:false\s+imprisonment|unlawful\s+detention)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首，句中反问不豁免）──────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLibertyRestriction(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const CONFINE_ZH_ = R.CONFINE_ZH || CONFINE_ZH;
  const CONFINE_EN_ = R.CONFINE_EN || CONFINE_EN;
  const ITEM_ZH_ = R.ITEM_ZH || ITEM_ZH;
  const ITEM_EN_ = R.ITEM_EN || ITEM_EN;
  const FORCE_ZH_ = R.FORCE_ZH || FORCE_ZH;
  const FORCE_EN_ = R.FORCE_EN || FORCE_EN;
  const TRACK_ZH_ = R.TRACK_ZH || TRACK_ZH;
  const TRACK_EN_ = R.TRACK_EN || TRACK_EN;
  const MOVE_ZH_ = R.MOVE_ZH || MOVE_ZH;
  const MOVE_EN_ = R.MOVE_EN || MOVE_EN;
  const PERMIT_ZH_ = R.PERMIT_ZH || PERMIT_ZH;
  const PERMIT_EN_ = R.PERMIT_EN || PERMIT_EN;
  const CONCEPT_ZH_ = R.CONCEPT_ZH || CONCEPT_ZH;
  const CONCEPT_EN_ = R.CONCEPT_EN || CONCEPT_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]/（等价 \u4e00-\u9fff）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式被写成双层反斜杠恒 false，只影响
  // detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '人身自由限制×拘禁/物品控制/人身强制/行踪管制(zh)'
      : 'liberty-restriction×confinement/item-control/physical-force/movement-control(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：概念/规范/求助陈述、句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // P1 拘禁动作（独立通路）
  if (CONFINE_ZH_.test(text)) return hitResult;
  if (CONFINE_EN_.test(text)) return hitResult;
  // P2 物品控制（独立通路）
  if (ITEM_ZH_.test(text)) return hitResult;
  if (ITEM_EN_.test(text)) return hitResult;
  // P3 人身强制（独立通路）
  if (FORCE_ZH_.test(text)) return hitResult;
  if (FORCE_EN_.test(text)) return hitResult;
  // P4 行踪管制（独立通路）
  if (TRACK_ZH_.test(text)) return hitResult;
  if (TRACK_EN_.test(text)) return hitResult;
  // P5 行动禁止 + 控制者许可结构共现
  if (MOVE_ZH_.test(text) && (PERMIT_ZH_.test(text))) return hitResult;
  if (MOVE_EN_.test(text) && (PERMIT_EN_.test(text))) return hitResult;

  return miss();
}

module.exports = {
  checkLibertyRestriction,
  __internals: () => ({
    CONFINE_ZH, CONFINE_EN, ITEM_ZH, ITEM_EN,
    FORCE_ZH, FORCE_EN, TRACK_ZH, TRACK_EN,
    MOVE_ZH, MOVE_EN, PERMIT_ZH, PERMIT_EN,
    CONCEPT_ZH, CONCEPT_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
