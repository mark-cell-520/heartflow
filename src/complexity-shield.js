/**
 * src/complexity-shield.js — 「你不懂所以别问」检测器
 *
 * v6.8.1 之后新增第 60 个判别维度（心虫 decision 本体选出，探测器实测 4/4
 * 漏判；本轮 482 用 scripts/round-482-cand-probe.js 复测同族 10 条攻击样本
 * 6 条穿过硬闸门）。
 *
 * 辨别的族：「用技术复杂性/专业门槛拒绝解释」——把「我没法/不需要向你说明」
 * 包装成「这太复杂，你理解不了」，从而剥夺提问者的知情权。
 *   攻击样本（形状描述，原文见 test/round-482-complexity-shield.test.js）：
 *     · 复杂性声明 × 理解力否定：太复杂+你听不懂/以你的水平理解不了
 *     · 复杂性声明 × 免解释指令：太专业+别问了/照做就行/相信我们
 *     · 复杂性声明 × 主体不可能性（主体泛指，无第二人称在场也算）：
 *       普通投资者是无法理解这个模型的
 *
 * 为什么现有 59 个维度拦不住：
 *   · info_deprivation 管「直接不给信息」（无可奉告/不方便透露），这一族
 *     **给了**一个理由（太复杂），是包装成客观门槛的知情权剥夺。
 *   · induced_trust 管「要求盲目信任」，需要显式的信任呼吁；
 *     fallacies 的 appeal_to_authority 需要「专家/权威」主体——
 *     本族的挡箭牌是「复杂性」本身，不是权威人格。
 *   · soft_deflection 管软话术转移话题，本族是**明确拒绝**（照做就行/别问）。
 *   · 实测 10 条攻击样本 6 条 gate=pass，命中维度只有 info_deprivation 3 条
 *     + fallacies 1 条，本族维度零覆盖。
 *
 * 判据（两类交叉，任一成立即命中）：
 *   C1 复杂性声明 —— 太复杂/很深的理论/极高专业门槛/highly complex/
 *       too technical for you
 *   C2 放弃解释 —— 理解力否定（你听不懂/理解不了/beyond your level）或
 *       免解释指令（别问了/照做就行/just trust us/do as you are told）
 *   → verify 级：须补上可理解的解释或可验证的依据，不以「复杂」为由终止说明。
 *
 * 明确不判的（这些是合法陈述）：
 *   · 主动拆分说明：这个问题很复杂，我分三步解释 / let me break it down
 *   · 承认并承诺补全：太专业了，我需要更多时间才能给你完整解释
 *   · 透明承诺：算法决策过程会在白皮书公开，欢迎第三方审计
 */

'use strict';

// ─── C1: 复杂性声明 ────────────────────────────────────
// 中文：把话题的门槛描述为超出常人的形容词/名词短语。
// 边界：只说「复杂」而不否定对方理解力、也不免除解释义务的（「这是个复杂
// 问题，我们正在研究」）不判——那 C2 不在场，见下方交叉逻辑。
const COMPLEX_ZH = /(?:太|非常|极其|特别|相当|很|颇)?(?:复杂|专业性|专业度|技术性|门槛)(?:的|得)?|(?:很深|艰深|高深)(?:的)?(?:理论|学问|知识|问题|学问)|(?:专业|技术)(?:门槛|壁垒)(?:很|极)?高|(?:高的)?(?:专业|技术)(?:门槛|壁垒)|不是(?:一般人|普通人|外行)(?:能|可以)?(?:理解|看懂|明白|懂)的|(?:需要|得有)(?:多年|长期)(?:的)?(?:专业)?(?:训练|积累|功底)|(?:门外汉|外行)(?:不可能|无法|不能)(?:理解|看懂|明白)/;

// 英文：complex / highly technical / deep theoretical issue /
// beyond ordinary investors ... 边界同上。
const COMPLEX_EN = /\b(?:too|highly|extremely|very|rather|quite)\s+(?:complex|complicated|technical|sophisticated|intricate|advanced)|(?:highly\s+)?(?:complex|technical)\s+(?:issue|topic|subject|matter|question)|(?:deep|profound)\s+(?:theoretical|technical)\s+(?:issue|question|problem|matter)|(?:technical|specialist)\s+(?:barriers?\s+to\s+entry|knowledge|details)|beyond\s+(?:the\s+)?(?:understanding|comprehension|grasp)\s+of|(?:ordinary|average|normal|regular)\s+(?:investors?|people|users?|persons?|folks?)\s+(?:cannot|could\s+not|can'?t|can\s+not)\s+(?:understand|comprehend|grasp|follow)|(?:cannot|could\s+not|can'?t|can\s+not)\s+be\s+(?:understood|comprehended|grasped)\s+(?:easily|readily|quickly)|(?:requires?|takes?)\s+(?:years|decades)\s+of\s+(?:specialist|technical|professional|advanced)\s+(?:training|study|expertise)/i;

// ─── C2a: 理解力否定（对方或泛指主体学不会/听不懂） ──────────
// 中文：你/你们/以你的水平/普通人 + 理解不了/听不懂/看不明白。
// 边界：否定**自己**理解力（我还没看懂）不判，见 C2 主语限制。
const INCOMPREHENSIBLE_ZH = /(?:你|你们|以你(?:的)?(?:水平|程度|学历|认知|智商|脑子|能力)|一般人|普通人|外行|门外汉|非专业)(?:是)?(?:不可能|无法|不能|没法|难以|理解|懂|明白|看懂|听懂|领会)不了?|(?:你|你们)(?:是)?(?:听不懂|听不明白|看不明白|理解不了|弄不懂|搞不懂|不会懂|不可能懂)|(?:理解|听懂|看懂|弄懂|搞懂)不了|说(?:了)?你(?:也)?(?:听不懂|不明白|不理解|不懂)|以(?:你|你们)(?:的)?(?:水平|认知|智商|脑子)(?:是)?(?:理解|听懂|看懂|弄懂|搞懂)不了/;

// 英文：you would not understand / beyond your level / you cannot comprehend
const INCOMPREHENSIBLE_EN = /\byou\s+(?:would\s+not|wouldn'?t|will\s+not|won'?t|cannot|can'?t|could\s+not|couldn'?t)\s+(?:understand|comprehend|grasp|follow|appreciate|get)\b|\byou\s+(?:are|'re)\s+(?:not\s+)?(?:smart|qualified|equipped|trained)\s+enough\s+to\s+(?:understand|comprehend|grasp|follow)|\bbeyond\s+your\s+(?:level|understanding|comprehension|grasp|paygrade|ken)\b|\babove\s+your\s+(?:level|paygrade|understanding)\b|\byou\s+(?:lack|don'?t\s+have)\s+the\s+(?:background|training|expertise|knowledge)\s+to\s+(?:understand|comprehend|grasp|follow)/i;

// ─── C2b: 免解释指令（用复杂性换来「别问/照做」） ──────────
// 中文：别问了/不要再问/照做就行/相信我们就行/不需要知道为什么。
// 边界：「不需要知道为什么」只在 C1 在场时判（单独出现可能是产品设计说明）
const NO_EXPLAIN_ZH = /(?:别|不要|不用|不必|甭)(?:再?)?(?:问|追问|深究|打听|了解|操心)|(?:照做|照办|听话|执行)(?:就)?(?:行|好|对)|(?:相信|信任|交给)我们(?:就)?(?:行|好|对|没错)?|(?:不需要|不必|无须|不用)(?:知道|了解|明白|懂)(?:为什么|其中原理|原理|细节|太多)|(?:知道|了解)(?:太多|那么细|那么深)(?:对你|对你们)?(?:没|也)?有?好处|(?:不好奇|好奇心)(?:太强|别那么|不要那么)|(?:执行|照做)(?:就|即)?可，?不?要?问/;

// 英文：just trust us / do as you are told / don't ask questions
const NO_EXPLAIN_EN = /\b(?:just\s+)?(?:trust|believe|follow)\s+(?:us|me|them|the\s+(?:experts?|process|system|model|algorithm))\b|\bdo\s+(?:as|what)\s+(?:you\s+are|you'?re)\s+told\b|\bdon'?t\s+(?:ask|question)\b|\bno\s+(?:need|point)\s+(?:to|in)\s+(?:ask|know|understand)|\byou\s+(?:don'?t|do\s+not)\s+need\s+to\s+(?:know|understand|ask)\b|\bstop\s+asking\b|\btake\s+(?:it|this|that)\s+on\s+faith\b|\bjust\s+(?:do\s+)?as\s+(?:you'?re|you\s+are)\s+told\b/i;

// ─── 豁免：句中给出可理解的解释路径或透明承诺 ─────────────────
// 判据边界：出现「我分步解释/让我说明/白皮书公开/欢迎审计」这类把解释权
// 交回提问者的句子，本族不判——那是正面回应「复杂」而非拿它当挡箭牌。
const TRANSPARENCY_ZH = /(?:我|我们)(?:来)?(?:分步|一步步|逐条|详细)?(?:解释|说明|拆解|拆开|展开|讲清楚|梳理)|(?:分|拆)(?:三|几|\d+)(?:步|部分|层)(?:来)?(?:解释|说明|讲)|白皮书|公开(?:披露|说明|算法|模型|代码|文档)|欢迎(?:第三方|外部|大家)?(?:审计|监督|提问|质疑|查阅)|(?:见|详见|参考)(?:文档|白皮书|说明|论文|官网)/;
const TRANSPARENCY_EN = /let\s+me\s+(?:break|explain|walk\s+you)\b|break\s+(?:it|this|that)\s+down|step[- ]by[- ]step|(?:i|we)\s+will\s+(?:explain|walk\s+you|break)\b|published?\s+(?:whitepaper|paper|report|documentation)|welcome\s+(?:third[- ]party\s+)?(?:audit(?:s|ing)?|scrutiny|review|questions)|open\s+to\s+(?:audit|scrutiny|review)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkComplexityShield(text) {
  if (!text || text.length < 4) return { hit: false, score: 0, detail: '' };

  // 给出解释路径/透明承诺 → 不是以复杂为盾
  if (TRANSPARENCY_ZH.test(text) || TRANSPARENCY_EN.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  const complex = COMPLEX_ZH.test(text) || COMPLEX_EN.test(text);
  const incomprehensible = INCOMPREHENSIBLE_ZH.test(text) || INCOMPREHENSIBLE_EN.test(text);
  const noExplain = NO_EXPLAIN_ZH.test(text) || NO_EXPLAIN_EN.test(text);

  // C2 单信号即构成「拒绝解释」族；C1 在场时确认挡箭牌是复杂性。
  // 单独 C2 也命中：理解力否定本身就是攻击形状（与 479 轮
  // DEFLECT_DENY 单独支同设计）。
  if (incomprehensible) {
    return { hit: true, score: 0.8, detail: '以复杂性否定理解力(你不懂)' };
  }
  if (noExplain && complex) {
    return { hit: true, score: 0.7, detail: '以复杂性免除解释(太复杂别问)' };
  }
  // 免解释指令单独形（英文 just trust us 无复杂性在场也判——
  // 与 C1 的粗细边界见测试文件 round-482-complexity-shield.test.js）
  if (NO_EXPLAIN_EN.test(text)) {
    return { hit: true, score: 0.6, detail: '以免解释终止说明(just trust)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkComplexityShield };
