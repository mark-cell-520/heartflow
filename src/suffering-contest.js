/**
 * src/suffering-contest.js — 「苦难竞赛」检测器（第 78 个判别维度）
 *
 * [v6.8.27] 第 536 轮设计上线。scout 固定池连续第九轮空
 * （/tmp/hf-scout-20261006-536.txt：「未探测到新的零覆盖族」），
 * 按 r505/r522/r526/r533 先例自建族级探针：scripts/round-536-cand-probe.js
 * 扫 5 族后 3 族达标（A 承诺充抵 8/9 穿透 0/6 误伤、C 自惩代偿 8/9 0/6、
 * D 苦难竞赛 9/9 0/6），scripts/round-536-decide.js 本体选向（D 0.8 最高）。
 *
 * 辨别的族：「苦难竞赛」——把自己的处境描述得比对方更惨，据此宣布
 * 对方的正当诉求降级、失效或不再成立。落点不是「受害者也有责任」
 * （victim_blaming 管归因），也不是「伤害没那么严重」
 * （harm_invalidation 管伤害事实本身），而是**用痛苦的量级比较来取消
 * 对方的诉求资格**：只要我能证明我更痛，你那笔账就不用算了。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：自我苦难宣告 × 量级压过 同句共现；
 *   · 路由②（次）：自我苦难宣告 × 诉求取消 同句共现。
 *
 * 为什么现有维度拦不住：
 *   · victim_blaming 责备受害者做错了什么，本族说话人在比惨；
 *   · harm_invalidation 否定伤害事实（想多了/心理作用），本族承认双方都痛，
 *     只否定对方的痛「够不上」；
 *   · performative_responsibility 走认责×归因倒置，本族不认责；
 *   · whataboutism 扯开话题，本族把话题留在同一件事上做量级比较；
 *   · concession_coercion 用让步换对方付出，本族不交换任何东西。
 *
 * → verify 级：单句常是处境说明、工作量对比、情绪自述的复述，
 *   rewrite 会误伤。与 r500/r503/r506/r510/r514/r517/r520/r530/r534 同口径。
 *
 * 明确不判的（豁免——正当的处境说明与并行归责）：
 *   · 承认双方各自的处境而不排序（"我们都难，你的诉求独立成立"）
 *   · 客观的量级/工作量对比且不带诉求取消
 *   · 情绪自述 + 后续补救动作
 *
 * [r536 第一版注记] 首版支序设计过严：把苦难状语硬编码在主语紧后方，
 * 导致「我这半年都没睡过」「我这一年里日复一日地扛着」「我家里都快撑不住」
 * 三条全漏（实测 6/14）。本版统一改为「主语 + ≤8 字弹性状语 + 苦核词」，
 * 并补处境比较支 / 「ten times yours」/「you faced this once」两支英文缺口。
 */

'use strict';

// ─── R1a: 自我苦难宣告（把自己的处境说得很糟）────────────────────
const SUFFER_ZH = new RegExp([
  // 比较级自陈：我(比|比起)(你|你们)更惨/更难/更累
  '(?:我|我们)(?:比|比起来|比起|相较)(?:你|你们|他|他们|人家)(?:还|可|都)?(?:惨|苦|难|累|委屈|不容易|辛苦|艰难|困苦)',
  // 处境比较：比起我的处境/与我相比（暗示我的处境更糟）
  '(?:比起|相较之下|相对于|对比)(?:我|我们)(?:的|所)?(?:的|所)?(?:处境|情况|遭遇|经历|苦|难)',
  // 倍数压过：我(付出|承受)的代价是你的十倍
  '(?:我|我们)(?:付出|承受|扛|受|经历|承担)(?:的|了)?(?:代价|成本|苦|委屈|损失|压力|工作量)(?:是|相当于|等于)(?:你|你们)?(?:的)?(?:十|百|千|几|好几|很多|无数)?(?:倍|番)',
  // 睡眠/进食/休息的丧失（允许状语插入）
  '(?:我|我们|全家人)[^。！？，,；;]{0,8}(?:没|未|不曾|没有)(?:睡过|睡着过|吃过|休息过)[^。！？，,；;]{0,4}(?:觉|饭|假期|周末|休息)',
  // 生存/工作/生活处在崩溃边缘（两种中文语序都覆盖）
  // 语序①：状语前置、崩塌动词后置 ——「我家都快撑不住了」
  '(?:我|我们|我家|我家里|全家人|全家|我这边|我这)[^。！？，,；;]{0,6}(?:都|也|眼看|快|几乎|差点|快要|即将)[^。！？，,；;]{0,6}(?:撑不住|保不住|保不了|维持不了|快撑不下去|扛不住|顾不上|照顾不了|顾不上|管不了|撑不下去了)',
  // 语序②：崩塌动词紧跟处境词 ——「保不住了工作」
  '(?:我|我们|我家|我家里|我们|全家人|全家)[^。！？，,；;]{0,8}(?:保不住|保不了|撑不住了|维持不了|快丢了|快要丢了|快保不住了|再也顾不上)[^。！？，,；;]{0,4}(?:工作|饭碗|职位|生活|家庭|婚姻|房子|命|开销|开支|日子)',
  // 反复折磨句式（整夜失眠/吃不下/崩溃/自责）
  '(?:我|我们)[^。！？，,；;]{0,8}(?:失眠|睡不着|吃不下|咽不下|以泪洗面|崩溃|抑郁|硬撑|苦苦|煎熬|折磨|内疚|自责|没睡好|心力交瘁)',
  // 长时间承受：我(天天|时时刻刻)都在承受
  '(?:我|我们)[^。！？，,；;]{0,6}(?:日复一日|长年|常年|长年累月|时时刻刻|无时无刻|天天|每天)[^。！？，,；;]{0,2}(?:承受|忍受|扛|受|经历|面对|咬牙)',
].join('|'));

const SUFFER_EN = new RegExp([
  // I have it far worse than you
  '\\b(?:i|we)\\s+have\\s+it\\s+(?:far|much|way|even|so)\\s+worse\\s+than\\s+(?:you|yours)\\b',
  // my situation/pain/suffering is (far) worse than yours
  '\\b(?:my|our)\\s+(?:situation|plight|case|pain|suffering|problems?)\\s+(?:is|are)\\s+(?:far|much|way|even|so)\\s+(?:worse|bigger|harder)\\s+than\\s+(?:yours|you)\\b',
  // my losses/pain/cost are (ten times) bigger than yours
  '\\b(?:my|our)\\s+(?:loss(?:es)?|pain|suffering|cost|burden|load)\\s+(?:is|are)\\s+(?:far\\s+|much\\s+|way\\s+)?(?:bigger|greater|larger|heavier)\\s+than\\s+(?:yours|you)\\b',
  '\\b(?:my|our)\\s+(?:loss(?:es)?|pain|suffering|cost|burden|load)\\s+(?:is|are)\\s+\\w+\\s+times?\\s+(?:yours|than\\s+yours)\\b',
  '\\b(?:ten|hundred|a\\s+thousand|many|several|a\\s+few)\\s+times\\s+(?:what\\s+)?(?:yours|than\\s+yours|more\\s+than\\s+yours)\\b',
  // I have not slept/eaten in days|weeks
  '\\b(?:i|we)\\s+(?:have\\s+not|haven\\x27t|had\\s+not|hadn\\x27t)\\s+(?:slept|eaten|rested|had\\s+a\\s+break)\\s+(?:in\\s+)?(?:days|weeks|a\\s+week|two\\s+days|forever)\\b',
  // I am losing my job / I cannot keep this up
  '\\b(?:i|we)\\s+(?:am|are)\\s+(?:about\\s+to\\s+)?(?:lose|losing)\\s+(?:my|our)\\s+(?:job|house|family|mind|marriage)\\b',
  '\\b(?:i|we)\\s+(?:can\\s?not|cannot|can\\x27t)\\s+(?:keep\\s+this\\s+up|take\\s+it|survive\\s+this|go\\s+on)\\b',
  // I live with it every day / guilt tearing me apart
  '\\b(?:i|we)\\s+(?:live|living)\\s+with\\s+(?:it|this)\\s+(?:every\\s+day|all\\s+the\\s+time|constantly)\\b',
  '\\b(?:this|it|my\\s+guilt|the\\s+guilt)\\s+(?:is\\s+)?(?:tearing|tears)\\s+(?:me|myself)\\s+apart\\b',
].join('|'), 'i');

// ─── R1b: 量级压过（宣布对方的痛苦更小、诉求更轻）──────────────────
// 「你这点损失算什么」「根本不值一提」「你才遇到一次」
const OUTRANK_ZH = new RegExp([
  // 你(这点|那点)(损失|委屈|事)算什么
  '(?:你|你们)?(?:这点|那点|这点儿|那点儿|这点事|这些|那点事)(?:小?损失|小委屈|苦|委屈|事|事儿|抱怨|问题|代价|伤害)(?:算|算是|算得上)什么',
  // (根本|完全|压根)不值一提/算不上
  '(?:根本|完全|压根|压根儿|简直)(?:不|没什么|算不上|算不得)(?:值一提|值得一提|一回事)',
  // 对方遇到一次/才受点委屈 —— 时长比较压过
  '(?:你|你们)(?:才|只|不过|只不过)(?:遇到|经历|碰到|碰上)(?:了)?(?:一次|一回|一遍|一天|这点)',
  '(?:你|你们)(?:才|只|不过)(?:受|受点|受了点)(?:委屈|气|苦|伤)',
  // 反问式贬损：你(也)(好意思/有脸)(提|说|抱怨)(这个|这些)
  '(?:你|你们)(?:也|还)?(?:好意思|有脸)(?:提|说|讲|抱怨|计较|叫苦)(?:这个|这些|这|那|这个?事|这点)?',
  // 反问对方"也配/算什么"：你(这)(也)(算|叫)(事|苦|损失)
  '(?:你这|你这点|你那点)(?:也|还|也算|还叫)?(?:算|叫)(?:事|苦|损失|委屈|个事)',
  // "你(还)(在)(这)抱怨/计较" 类持续纠缠贬损
  '(?:你|你们)(?:还|还在|还在)(?:这|那里)?(?:里)?(?:抱怨|计较|叫苦|纠缠|掰扯|翻)',
  // 你(也|还)叫(苦|难|损失|委屈|事)
  '(?:你|你们)?(?:也)?(?:叫|算是|算得上)(?:苦|难|惨|委屈|损失|吃苦|受罪|个事)',
  // 你(还)有脸/有资格/好意思(要|说|提|抱怨)
  '(?:你|你们)(?:还|也)?(?:有脸|有资格|好意思|有立场)(?:要|说|提|叫|来|抱怨|计较|追究)',
  '(?:你|你们)(?:凭|有什么|哪来|哪有)什么(?:资格|权利|脸面|立场)(?:来)?(?:叫|喊|说|要|提|抱怨|计较|追究)',
  // (才|就这么)(这点)(就)(受不了/要说法)
  '(?:才|就这么|只不过|不过)(?:这点|这点事|一次)(?:就|也)?(?:受不了|扛不住|要说法|计较|叫苦|抱怨|哭天喊地)',
  // 你(计较|纠结|抓着)这点(事)
  '(?:你|你们)?(?:就|还|也)?(?:计较|纠结|抓着|盯着)(?:这点|这点事|这点小事|这点委屈|这些小事|这点小钱)',
  // 质疑对方的计较值不值
  '(?:有意思|至于吗|至于|值的吗|值得吗|有必要吗|值当吗|有完没完)(?:吗|么|没完)?[。！？]?$',
  // 斥令对方停止发声（别再叫了/别喊了/吵什么）
  '(?:别|不要再|少|甭|省省)(?:再|还)?(?:叫|喊|吵|嚷嚷|哭诉|嚎|嚷嚷)',
  // 对对方的诉求/抱怨做贬损定性
  '(?:你|你们)(?:的)?(?:这|那|这点)?(?:点)?(?:抱怨|不满|计较|委屈|诉苦)(?:就是|纯属|属于|根本是)(?:小题大做|没事找事|无理取闹|矫情|矫情|玻璃心|无病呻吟|瞎折腾)',
  // 你(也/还/居然)(抱怨|计较|叫苦)(这个|这些) —— 中间副词省略时也成立
  // （"你抱怨这个？"= 反问式贬损；本维度要求 SUFFER 同句共现才命中，
  //  单句"你抱怨这个"不会触发，故副词可安全省略）
  '(?:你|你们)(?:还|也|居然|还居然|就是|在)?(?:抱怨|计较|叫苦|哭|闹|委屈|不满|追究)(?:这个|这些|这点|这事|这|那)?',
].join('|'));

const OUTRANK_EN = new RegExp([
  // your loss/grievance/complaint is nothing
  '\\b(?:your|what\\s+you\\s+(?:have|got))\\s+(?:loss|grievance|complaint|problem|pain|suffering|hardship)\\s+(?:is|are)\\s+(?:nothing|trivial|petty|minor|insignificant)\\b',
  '\\b(?:your|what\\s+you\\s+call)\\s+(?:loss|grievance|complaint|problem|pain|suffering|hardship)\\s+is\\s+nothing\\b',
  // stop complaining / quit whining / enough already
  '\\b(?:stop|quit|enough\\s+with)\\s+(?:your\\s+)?(?:complaining|whining|crying|bitching|whinging)\\b',
  '\\benough\\s+already\\b',
  '\\bwho\\s+are\\s+you\\s+to\\s+(?:complain|cry|whine|ask|claim)\\b',
  // what you call hardship is not hardship
  "\\bwhat\\s+you\\s+call\\s+(?:hardship|pain|suffering|struggle)\\s+(?:is|is\\s+not|barely\\s+counts)\\b",
  // you faced this once
  '\\byou\\s+(?:faced|dealt\\s+with|experienced|went\\s+through)\\s+(?:this|it)\\s+(?:once|one\\s+time|a\\s+single\\s+time)\\b',
  // that is just one time
  '\\b(?:that|it)\\s+(?:is|was)\\s+(?:just\\s+)?(?:one|a\\s+single)\\s+(?:time|occurrence|incident)\\b',
].join('|'), 'i');

// ─── R2: 诉求取消语（配合苦难宣告即可命中）──────────────────────
const CANCEL_ZH = new RegExp([
  '(?:别再|不要|少|甭|省省|不用)(?:再|还)?(?:提|说|讲|叫|喊|抱怨|叫苦|计较|哭|闹|追究|翻)',
  '(?:到此为止|翻篇|不提了|别再提|算了|罢了|不用再|不必再)',
  '(?:还|还要)(?:我|叫|让)(?:怎样|如何|怎么办|不成)',
  '(?:知足|体谅|换位思考|理解一下|站在我的位置|将心比心)',
].join('|'));

const CANCEL_EN = new RegExp([
  '\\b(?:so\\s+)?(?:let\\s+it\\s+go|let\\s+this\\s+go|drop\\s+it|move\\s+on|get\\s+over\\s+it)\\b',
  '\\b(?:have\\s+some|show\\s+some)\\s+(?:sympathy|empathy|perspective)\\s+for\\s+me\\b',
  '\\bput\\s+yourself\\s+in\\s+my\\s+shoes\\b',
  '\\bhow\\s+much\\s+more\\s+do\\s+you\\s+want\\b',
].join('|'), 'i');

// ─── 豁免：正当的处境说明、量级对比与并行归责 ────────────────────
const EXEMPT_ZH = new RegExp([
  // 承认双方各自的处境，不排序
  '(?:两边|双方|我们)(?:都|各自|同样)(?:难|苦|不容易|有压力|有改进空间|需要支持)',
  // 你的诉求独立成立（明确不取消）
  '(?:你|你们)(?:的)?(?:诉求|损失|主张|不满|委屈)(?:独立|另行|仍然|依然)(?:成立|核算|处理|有效)',
  // 分别/逐条处理（不排序）
  '(?:分别|逐条|分项|另行|各自)(?:复盘|计量|核算|处理|归责|对齐)',
  // 补救/整改/闭环动作
  '(?:补救|整改|赔付|修复|补偿|跟进|闭环|推进|改进|方案|时间表|负责人|认领|承担)',
  // 我的处境不影响你的诉求
  '(?:不影响|不等于|不意味着|不代表)(?:你|你们)(?:的)?',
  // 伤害不能互相抵消
  '(?:不能|不可|不得|无法)(?:相互)?(?:抵消|对冲|折抵)',
  // 处境不同，但需分别处理
  '(?:处境|情况|情形)(?:不同|不一样|各异)(?:但|但需|不过)',
].join('|'));

const EXEMPT_EN = new RegExp([
  // both sides are struggling / our situations differ
  '\\b(?:both|all)\\s+sides?\\s+(?:are\\s+)?(?:struggling|under\\s+pressure|affected)\\b',
  '\\bour\\s+(?:situations|circumstances)\\s+(?:differ|are\\s+different)\\b',
  // your grievance/claim still stands (on its own | separately)
  '\\byour\\s+(?:grievance|claim|loss|hardship)\\s+still\\s+stands\\b',
  '\\byour\\s+(?:grievance|claim|loss|hardship)\\s+(?:is|stands)\\s+(?:real|separate|valid)\\b',
  '\\b(?:stands?|is)\\s+(?:separate|on\\s+its\\s+own|independently)\\b',
  '\\bwe\\s+(?:compare|compare\\s+notes|track)\\s+(?:separately|without\\s+ranking)\\b',
  // stress acknowledged + remedial action continues
  '\\b(?:i\\s+feel\\s+(?:awful|stressed|terrible),?\\s+and\\s+separately)\\b',
  '\\b(?:restitution|corrective\\s+action|follow\\+?up)\\s+(?:is\\s+)?(?:attached|continues|tracked)\\b',
  '\\bguilt\\s+is\\s+not\\s+a\\s+substitute\\b',
  '\\bbeing\\s+worked\\s+on\\s+is\\s+not\\s+done\\b',
  '\\bsituations?\\s+(?:differ|are\\s+different)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSufferingContest(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当的处境说明、并行归责与补救动作 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const sufferZH = SUFFER_ZH.test(text);
  const sufferEN = SUFFER_EN.test(text);
  if (!sufferZH && !sufferEN) return { hit: false, score: 0, detail: '', count: 0 };

  // 路由①：自我苦难宣告 × 量级压过
  const outrankZH = OUTRANK_ZH.test(text);
  const outrankEN = OUTRANK_EN.test(text);
  if (outrankZH || outrankEN) {
    return {
      hit: true,
      score: 0.76,
      count: 1,
      detail: isZh ? '苦难竞赛×量级压过(zh)' : 'suffering-contest×outranking(en)',
    };
  }

  // 路由②：自我苦难宣告 × 诉求取消
  const cancelZH = CANCEL_ZH.test(text);
  const cancelEN = CANCEL_EN.test(text);
  if (cancelZH || cancelEN) {
    return {
      hit: true,
      score: 0.72,
      count: 1,
      detail: isZh ? '苦难竞赛×诉求取消(zh)' : 'suffering-contest×cancellation(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSufferingContest,
  // 供守卫测试做「注入指定支必须变红」的注入-删条-必须变红用。
  __internals: () => ({
    SUFFER_ZH, SUFFER_EN, OUTRANK_ZH, OUTRANK_EN,
    CANCEL_ZH, CANCEL_EN, EXEMPT_ZH, EXEMPT_EN,
  }),
};
