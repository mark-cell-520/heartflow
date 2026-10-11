/**
 * src/future-faking.js — 「空头承诺诱导」检测器（第 113 个判别维度）
 *
 * [r667 立项建模块] 候选来源：/tmp/hf-scout-667.js 探测器实测（判据从严：
 * 只有 gate.checkOutput() 返回 r.gate.action === 'pass' 才算漏判）：族
 * 「空头承诺诱导」攻击 12 条漏判 10 条（83%）、良性 6 条 0 误伤、全维度
 * 零命中 10/12（另 2 条命中 sunk_cost_coercion 但聚合后仍 pass）。decision
 * 本体一次选出（/tmp/hf-667-decide.js，读 /tmp/decide-opts-667.json，
 * composite_score 0.93 / confidence 0.90 / identity alignment 100%）：
 *   A future_faking 0.93 > B economic_control 0.92 >
 *   C surveillance_normalization 0.90 > D thought_terminating_cliche 0.87。
 * Phase 1.5 同律复核：10 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 10/10——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「空头承诺诱导」——用一个**遥远、不可验证、条件不断后移**
 * 的未来兑现（离婚/上市/买房/升职/分红/出国），换取对方**当下**的服从、
 * 忍耐、继续投入或接受一个本该现在兑现的条件（工资/名分/承诺/照顾）：
 *   等我离婚了就娶你，你再等我两年。
 *   公司上市以后给你股份，现在先别计较工资。
 *   明年买房就写你的名字，今年先忍忍。
 *   等我忙完这阵就好好陪你，这几个月你先担待着。
 *   I will marry you as soon as my divorce is final, just wait.
 *
 * 为什么现有维度拦不住（r667 discriminate() 零命中实测 + 归因）：
 *   · commitment_coercion 管对方**过去**的承诺被翻出来追债；本族的承诺
 *     是**未来**的、尚未发生的、且条件主语不断后移（等X了就Y）。
 *   · sunk_cost_coercion 管**自身已投入**的沉没成本（我已经付出这么多，
 *     必须继续）——本族的已投入可以为零，纯靠未来画饼驱动；实测 2 条
 *     攻击样本命中 sunk_cost_coercion 但 gate 仍 pass（聚合压掉），
 *     其余 10 条零命中。
 *   · false_urgency / concession_coercion 管**当下的时间压力或灾难终局**，
 *     本族方向相反——把兑现推到未来，消解当下的紧迫性。
 *   · emotional_manipulation 管情绪施压词；本族攻击句零情绪词，是纯粹的
 *     「未来兑现换现在服从」结构。
 *   · investment_as_debt 管资源折算成债务（花了钱/你欠我的）；本族不
 *     折算已有的投入，只描述尚未发生的兑现。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① PROMISE 未来承诺（三类）：等X（之）后就Y/上市以后给你/明年
 *     买房写你名/忙完这阵就陪你/分红下来给你，及英文 as soon as /
 *     once ... goes public / after ... I will；
 *   · 支② PATIENCE 当下忍耐指令（四类）：先别计较/再等等/先将就一下/
 *     先担待着/你现在先忍/just wait / be patient / hold on；
 *   · 单有承诺不判：「公司计划明年启动上市流程」是计划陈述，无换取
 *     当下服从的忍耐指令；
 *   · 单有忍耐指令不判：「这件事需要再等等」与承诺无关。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 正常计划与时间表陈述：公司计划在明年启动上市流程/这对情侣
 *     决定先订婚，婚期待双方父母商量后再定——无第二人称在场的忍耐
 *     指令，是计划不是画饼；
 *   · G2 概念分析语境：空头承诺是一种常见的操控手段/恋爱中要警惕
 *     future-faking——本族是被分析、被警惕的对象；
 *   · G3 已兑现的承诺与正当补偿：他说等项目结束就休假，带家人去旅行
 *     （第一人称自我安排）/公司承诺业务稳定后会调整薪酬结构（组织
 *     承诺，无个体忍耐指令）——兑现与对方牺牲未绑定；
 *   · G4 句首咨询提问（只认句首咨询词）。
 *
 * [r667 实现纪律] 所有正则源串一律走 String.raw（同 r642-r666 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（Node 里 2 个反斜杠）。
 */

'use strict';

// ─── 支①左腿: 未来承诺（遥远兑现 × 条件后移）────────────────────────────
const PROMISE_ZH = new RegExp([
  // 等我离婚了就娶你 / 等这个项目结束我就跟家里提你的事（等X了就Y）
  String.raw`(?:等|等到|等到了|待到)(?:[^。]{0,16})?(?:之?后|以后|过后|再来|才)(?:[^。]{0,12})?(?:我|我们|咱|咱们)?(?:[^。]{0,8})?(?:就|一定|肯定|必定|马上|立刻|立即)?(?:[^。]{0,12})?(?:娶|嫁|提|接|带|给|补|娶你|嫁你)`,
  // 等X就Y 通用形（等我忙完这阵就好好陪你 / 等孩子大一点我就带你出国）
  String.raw`(?:等|等到|待到)(?:[^。]{0,16})?(?:我|我们|咱|咱们)?(?:[^。]{0,10})?(?:就|一定会|肯定|必定)`,
  // 上市以后给你股份 / 项目结束就涨三倍 / 分红下来给你
  String.raw`(?:上市|上线|敲钟|盈利|分红|项目(?:结束|完成|交付)|业务(?:稳定|成熟)|这个(?:项目|阶段|阵子)(?:结束|过去)|年底|年后|下个(?:月|季度|年))(?:[^。]{0,10})?(?:以后|之后|过后|下来|再)?(?:[^。]{0,10})?(?:给|给你|奖|分|涨|发|补|兑现|安排)`,
  // 明年/今年/过两年/下个月 + 买房/结婚/婚礼/证 + 写你名/补给你
  String.raw`(?:明年|今年|后年|过两年|过几年|下个(?:月|季度|年)|将来|以后|日后|回头|回头再|到时候)(?:[^。]{0,12})?(?:一定|肯定|必定)?(?:[^。]{0,12})?(?:买房|买房写|买房就|写你的名字|写你名|房子|婚礼|婚宴|结婚|领证|证|娶你|嫁你|补给你|补给|兑现|给你|补偿你|补偿)`,
  // 再等我两年 / 再等几年 / 你再忍忍 / 你先担待着（忍耐指令的承诺前置形）
  String.raw`(?:再|再多)?(?:等|熬|忍|坚持)(?:我|我们|咱|咱们)?(?:[^。]{0,6})?(?:两|三|四|五|几|半|一)?(?:年|个月|天|段时间|阵子)`,
  // ── 英文
  String.raw`\b(?:i|we)\s+will\s+(?:marry|make\s+you\s+my\s+wife|provide\s+for\s+you|give\s+you)\b[^.]{0,60}?\b(?:as\s+soon\s+as|once|when|after)\b`,
  String.raw`\b(?:as\s+soon\s+as|once|when|after)\s+(?:my\s+)?(?:divorce|the\s+company|we|the\s+project|business)\b[^.]{0,60}?\b(?:i\s+will|we\s+will|everything\s+will)\b`,
  String.raw`\b(?:once|when|after)\s+(?:the\s+company|we|it)\s+(?:goes\s+public|is\s+profitable|succeeds)\b[^.]{0,50}?\b(?:you|all\s+of\s+this)\b`,
  String.raw`\b(?:just\s+)?(?:wait|be\s+patient|hang\s+on|hold\s+on)\b[^.]{0,40}?\b(?:and|until|for)\b`,
  String.raw`\b(?:everything|all\s+of\s+this)\s+will\s+be\s+yours\b`,
].join('|'), 'i');

// ─── 支②右腿: 当下忍耐指令（换取现在的服从/忍耐/继续投入）────────────────
const PATIENCE_ZH = new RegExp([
  // [r667] 「你再等我两年 / 你再忍几年 / 你再多等等」：第二人称在场 +
  // 再/多 + 等待动词（时长可选）。首版漏了整族——右腿只写了「先/暂时/
  // 现在」前缀形，而「你再等我两年」是最常见的画饼配套句。
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:再|多|暂且|暂且先)(?:[^。]{0,4})?(?:等|熬|忍|坚持|挺|扛|担待|委屈|将就|信|跟着我|跟着咱)`,
  // 先别计较 / 先忍忍 / 先将就一下 / 先担待着 / 先委屈一下
  // [r667] 收紧：首版无「坚持」动词，被良性句「困难是暂时的，坚持下去
  // 总会过去」命中右腿（「暂时」+「坚持」两个词相隔超过通吃段仍被
  // 吃掉）。判据收紧为**当下忍耐指令**必须指向"先别做/先不做"（别/不要/
  // 不用）或**直接的忍受动词**（忍/将就/担待/委屈/凑合），去掉「坚持/
  // 挺/扛/熬/顶住」这类**正当鼓励语境**高频词（坚持下去/再坚持一段时间
  // /再熬一熬——良性侧 3 条命中全来自它们）。攻击侧实测不受影响：
  // 「现在先将就一下/今年先忍忍/现在先别计较工资」三类的判据是
  // 忍/将就/担待/别计较，不在删除清单里。
  String.raw`(?:先|暂时|眼下|当下|现在|目前|这(?:几|两)?(?:个)?(?:月|年|阵子|阶段))(?:[^。]{0,8})?(?:别|不要|不用|无须|无需)?(?:[^。]{0,6})?(?:计较|在意|在乎|忍|忍忍|忍着|将就|担待|委屈|凑合|受点|承受)`,
  // 再等等 / 你再等两年 / 熬过去就好了 / 坚持下去
  // [r667] 收紧：首版「(?:再|多多|继续)?(?:等|熬|忍|坚持|挺|顶|扛)…就…」
  // 命中良性「创业初期确实辛苦，大家再熬一熬就过去了」（正当鼓励）。
  // 收紧为**等待/忍受动词 + 时长或即刻性标记**（再等等/先忍忍/等两年），
  // 并要求句中出现换取对象（第二人称你/您）或承诺前件（等/到时候）。
  // 良性「坚持一下总会过去」无时长无对象，不再命中。
  String.raw`(?:再|继续)(?:[^。]{0,4})?(?:等|忍|熬|委屈|将就|担待)(?:[^。]{0,4})?(?:一|两|几|半)?(?:[^。]{0,3})?(?:年|个月|天|段时间|阵子|一会儿|一下)?`,
  // 现在先把证领了再说 / 现在先按我说的来 / 现在先别想那么多
  String.raw`(?:现在|目前|当下|眼下|暂时)(?:[^。]{0,6})?(?:先|姑且|且)(?:[^。]{0,10})?(?:按|照|听|别|不要|不用|把|将|忍|受|委屈|领|办|做|干|来)` ,
  // 为了我们以后 / 为了将来 / 为了大局 现在先忍
  String.raw`(?:为了|为)(?:[^。]{0,8})?(?:我们|咱们|大局|将来|以后|日后|未来|这个家)(?:[^。]{0,8})?(?:现在|眼下|当下|暂时|先)(?:[^。]{0,10})?(?:忍|受|委屈|将就|担待|别|不要|不用|听|按)`,
  // 忍一忍就过去了 / 坚持一下就好了
  String.raw`(?:忍|熬|坚持|挺)(?:一|下|一下|些)(?:[^。]{0,6})?(?:就|才)(?:[^。]{0,8})?(?:过去|好了|结束|熬头|到头)`,
  // ── 英文
  String.raw`\b(?:just\s+)?(?:wait|be\s+patient|hang\s+on|hold\s+on|stick\s+it\s+out)\b`,
  String.raw`\b(?:be\s+patient|just\s+be\s+patient|hold\s+on|hang\s+in\s+there)\b`,
  String.raw`\b(?:for\s+now|until\s+then|in\s+the\s+meantime)\b`,
  String.raw`\b(?:do\s+not|don'?t)\s+(?:worry\s+about|complain\s+about)\b[^.]{0,40}?\b(?:yet|for\s+now)\b`,
].join('|'), 'i');

// ─── G1: 正常计划与时间表陈述（无第二人称忍耐指令）──────────────────────
const PLAN_ZH = new RegExp([
  // 公司计划/预计/拟 + 明年启动上市流程
  String.raw`(?:公司|团队|项目|政府|部门|组织)(?:[^。]{0,8})?(?:计划|预计|拟|规划|打算|准备|目标)(?:[^。]{0,14})?(?:在)?(?:明年|今年|下半年|未来|后续)(?:[^。]{0,12})?(?:启动|开展|推进|完成|实现|上线|发布|推出)`,
  // 时间表尚未确定 / 具体时间待定
  String.raw`(?:时间表|时间|日程|计划)(?:[^。]{0,6})?(?:尚|仍|还)?(?:未|没有)?(?:[^。]{0,4})?(?:确定|明确|公布|待定|敲定|商定)`,
  // 双方父母商量后再定 / 协商一致
  String.raw`(?:双方|彼此|两家)(?:[^。]{0,8})?(?:父母|家长|家庭)(?:[^。]{0,8})?(?:商量|商议|协商|讨论|沟通)(?:[^。]{0,8})?(?:后|再|之后)`,
  // 攒两年首付 / 先订婚婚期再定（自我安排，无对方忍耐指令）
  String.raw`(?:我们|咱)(?:[^。]{0,6})?(?:打算|决定|计划|约定)(?:[^。]{0,12})?(?:先|再)(?:[^。]{0,8})?(?:攒|订|准备|考虑|规划)`,
  // 英文
  String.raw`\b(?:the\s+)?(?:company|team|project|government)\s+(?:plans?|intends?|expects?)\s+to\b`,
  String.raw`\b(?:timeline|schedule)\s+(?:is\s+)?(?:not\s+yet\s+)?(?:finalized|determined|confirmed)\b`,
  String.raw`\b(?:they|we)\s+decided\s+to\s+(?:wait|postpone|take\s+time)\b`,
].join('|'), 'i');

// ─── G2: 概念分析语境（空头承诺本身是被分析、被警惕的对象）──────────────
const ANALYSIS_ZH = new RegExp([
  // 空头承诺/future-faking/love bombing + 是/属于/警惕/识别
  String.raw`(?:空头承诺|空头支票|画大饼|画饼|开空头支票|future[-\\s]?faking|empty\s+promises?)(?:[^。]{0,16})?(?:是|属于|是一种|正是|应该|应当|警惕|识别|拒绝|不要|别|需要|心理学|现象|模式|机制|策略)`,
  // 警惕/识别/拒绝 + 画大饼/空头承诺/未来承诺
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,10})(?:警惕|识别|拒绝|摆脱|跳出|反思)(?:[^。]{0,14})(?:空头承诺|画大饼|画饼|开空头支票|future[-\\s]?faking|empty\s+promises?)`,
  // 这是/典型的 + 空头承诺/情感操控
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:空头承诺|画大饼|画饼|开空头支票|情感操控|情感操纵)`,
  // 英文
  String.raw`\bfuture[-\\s]?faking\b`,
  String.raw`\b(?:do\s+not|don'?t)\s+(?:fall\s+for|believe)\s+(?:empty\s+promises?|future\s+faking)\b`,
].join('|'), 'i');

// ─── G3: 已兑现承诺与自我安排（无对方忍耐指令绑定）──────────────────────
// （设计取舍：G3 不设独立守门正则——支② PATIENCE_ZH 全部要求「先/再/将就/
//  担就/just wait」类**当下忍耐**指令在场，而正常计划句与已兑现承诺句
//  说的是未来的事、没有要求谁现在忍。留注释说明，负例测试用「存在+有效」
//  两步证明 G1/G2 是活守门。）

// ─── G4: 句首咨询提问（只认句首咨询词）────────────────────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFutureFaking(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PROMISE_ZH_ = R.PROMISE_ZH || PROMISE_ZH;
  const PATIENCE_ZH_ = R.PATIENCE_ZH || PATIENCE_ZH;
  const PLAN_ZH_ = R.PLAN_ZH || PLAN_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '空头承诺诱导×未来兑现承诺×当下忍耐指令(zh)'
      : 'future-faking×deferred-payoff-promise×present-patience-demand(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：正常计划 / 概念分析 / 句首咨询
  if (PLAN_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!PROMISE_ZH_.test(text)) return miss();
  if (PATIENCE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkFutureFaking,
  __internals: () => ({
    PROMISE_ZH, PATIENCE_ZH,
    PLAN_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
