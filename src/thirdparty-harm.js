/**
 * src/thirdparty-harm.js — 「他者伤害要胁」检测器（第 108 个判别维度）
 *
 * [r662 立项建模块] 候选来源：scripts/round-662-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 W「他者伤害要胁」攻击 12 条漏判 6 条（50%）、良性 8 条 0 误伤。
 * decision 本体选出（scripts/round-662-decide.js，composite_score 0.94 /
 * confidence 0.92 / identity alignment 100%）。
 * Phase 1.5 同律复核：6 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 5/6——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「他者伤害要胁」——把「伤害对方在乎的第三方或物品」当作对方
 * 当下必须顺从的对价：威胁把猫从窗户扔出去、把狗送走、把心爱的东西全砸了：
 *   你不答应我，我就把这只猫从窗户扔出去。
 *   你再顶嘴，我就把你养的狗送走。
 *   你不听话，我就告诉你弟弟，让他好看。
 *   你再还嘴，我就把你手机摔了。
 *   今天不认错，我就把你攒的模型全送人。
 *   If you do not obey me, I will get rid of your dog.
 *
 * 为什么现有维度拦不住（r662 discriminate() 零命中实测 + 归因）：
 *   · selfharm_coercion（r650）要胁对象是**胁迫者自己的身体**（死给你看/
 *     割腕/绝食），本族要胁对象是**第三方宠物/物品/他人**——把伤害指向
 *     对方在乎的他者，是更常见的家庭内控制手段。
 *   · emotional_manipulation 管情绪施压本身，实测本族攻击句「我就把这只
 *     猫从窗户扔出去」零命中——没有情绪词共现，是纯粹的条件-威胁结构。
 *   · dangerous_instruction 管指令安全（代码/系统操作），不认「把 X 摔了」
 *     这类物理威胁的句式。
 *   · dehumanization 管指人贬损，不认宠物/物品作为抵押物的结构。
 *   · privacy_exposure_coercion（r661）抵押物是**隐私内容的公开传播**，
 *     本族抵押物是**他者/物品的人身或物理安全**。
 *   · 其余 107 个维度对本族 5 条零命中样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① HARM 他者伤害威胁（把伤害指向第三方宠物/物品/他人——摔/砸/
 *     扔/送走/处理掉/让他好看/get rid of/throw away）；
 *   · 支② COND/COERCE 要胁顺从标记（六类，任一类即算这一腿）：
 *     a 不顺从条件（你不答应我/你再顶嘴/除非你认错/if you leave me）；
 *     b 后果威胁（否则/不然/or I will）；
 *     c 时间状语宣告（再敢/明天就/今天就）；
 *     d 祈使要求（Do what I say / 按我说的做）；
 *     e 赎金式条件（今天不转钱/不签字就不…）；
 *     f 正当行为惩罚（你敢报警/再敢提分手/你要敢走）——威胁的触发点正是
 *        对方的正当退出行为。
 *   · 单有伤害威胁不判：「虐待动物是违法行为」是规范陈述；
 *   · 单有要胁标记不判：「这件事你必须自己承担后果」没有伤害对象。
 *
 * [r662 实现纪律] 所有正则源串一律走 String.raw（同 r642-r661 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选（v6.7.xx 教训）。
 *
 * 明确不判的（看守 G1-G5）：
 *   · G1 法律规范与正当陈述：动物保护法/损坏他人物品需赔偿/送养需商量；
 *   · G2 概念分析与规范陈述：威胁伤害宠物作为被分析、被否定的对象；
 *   · G3 正当育儿与规则后果：time-out/零花钱规则/取消周末安排——目标是
 *     纠正行为而非伤害他者，且无腿①的物理毁灭动作；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问不豁免）；
 *   · G5 相邻维度域：selfharm_coercion（自伤要胁）、privacy_exposure_coercion
 *     （r661，隐私曝光要胁）的样本不进本维度——各自有主维度。
 */

'use strict';

// ─── 支①右腿: 他者伤害威胁（把伤害指向第三方宠物/物品/他人）──────────────
// 名词组必填（受害对象：宠物/物品/人），动作组收「毁灭/夺走」类动词。
const HARM_ZH = new RegExp([
  // ── a 宠物与动物：猫/狗/宠物/鸟/鱼
  String.raw`(?:把|将|拿)(?:你|您|你们)?(?:[^。]{0,8})?(?:猫|狗|宠物|狗狗|猫咪|小鸟|鸟|鱼|仓鼠|兔子|乌龟|鹦鹉)`,
  // ── b 心爱物品与财产：手机/游戏机/电脑/模型/手办/收藏/东西
  String.raw`(?:把|将|拿)(?:你|您|你们)?(?:[^。]{0,8})?(?:手机|电话|平板|电脑|笔记本|游戏机|switch|ps5|账号|模型|手办|收藏|宝贝|心爱|最爱|喜欢|攒的|存的东西|所有东西|一切|全部家当)`,
  // ── c 第三方他人：弟弟/妹妹/家人/父母/孩子/朋友/同事
  String.raw`(?:把|将|拿)?(?:你|您|你们)?(?:[^。]{0,6})?(?:弟弟|妹妹|哥哥|姐姐|家人|父母|爸妈|孩子|儿子|女儿|朋友|同事|同学|亲戚|家人)`,
  // ── 毁灭/夺走动作（与上面三类名词组共现）
  String.raw`(?:摔|砸|扔|掷|丢|撇|踹|踩|撕|烧|剪|切|砍|毁|灭|送|送人|送走|扔掉|处理掉|拿走|没收|变卖|卖掉|捐|借|借走)(?:出去|掉|走|人|了|碎|烂|掉)?`,
  String.raw`(?:从|往|朝)(?:[^。]{0,6})?(?:窗户|窗口|阳台|楼|楼上|楼下|街上|外面|垃圾|垃圾桶)(?:[^。]{0,6})?(?:扔|扔出去|丢|丢出去|抛|推|踹|冲|冲出去|赶|赶出去)`,
  String.raw`(?:让|叫|使得)(?:你|您|你们)?(?:[^。]{0,6})?(?:好看|好受|舒服|痛快|满意|知道|尝尝|体验|明白)`,
  String.raw`(?:告诉|告知|通报)(?:你|您|你们)?(?:[^。]{0,8})?(?:弟弟|妹妹|哥哥|姐姐|爸妈|父母|老师|领导|老板|单位|公司|学校|班主任)`,
  // ── 英文
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:get\s+rid\s+of|throw\s+(?:away|out)|throw\s+your|throw\s+the|throw\s+it|drop|drop\s+your|break|smash|crush|destroy|damage|ruin|sell|give\s+away|take\s+away|take\s+your)\s+(?:your|the|these|those|it|him|her|them)?\s*(?:dog|cat|pet|pets|animal|animals|phone|computer|laptop|console|stuff|things|belongings|collection|possessions|everything|all\s+your)`,
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:hurt|harm|injure|tell\s+on|punish|teach\s+(?:your|you)|make\s+(?:your|you))\s+(?:your|the|you|them)?\s*(?:brother|sister|mom|dad|parents?|family|friends?|kid|child|son|daughter|dog|cat|pet|pets|a\s+lesson)`,
].join('|'), 'i');

// ─── 支②左腿 a: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
const COND_ZH = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|配合|转钱|签字|给钱|拿钱|还钱|打钱)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|嘴硬|闹|提|说|走|离开|报警|分手|辞职|退学|拒绝)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若|敢)(?:[^。]{0,6})?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞|说出去|讲出去|告诉)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来|签字|转钱|配合)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今晚|这回|这次|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软|转钱|签字|配合)`,
  String.raw`(?:^|[，,。；;！!？?\s])(?:不|没|别)(?:答应|同意|听话|配合|转钱|签字|签名|打钱|汇款|付款|认错|道歉|服软|给钱)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:敢|竟敢|居然)(?:[^。]{0,4})?(?:不|没)(?:听|按|照|依|答应|同意|服从|顺从|配合|理|理我)`,
  String.raw`(?:^|[，,。；;！!？?\s])(?:再|又|还)(?:闹|折腾|作|作妖|闹腾|吵|纠缠|捣乱|找事|惹事)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|refuse|will\s+not|won't|leave|go|walk|break\s+up|end|report|tell|obey|comply|cooperate|agree|sign|pay|transfer)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:keep|continue|start|are|keep\s+on)\s+(?:arguing|talking\s+back|disobeying|refusing|seeing|meeting|texting|calling|asking|demanding)`,
].join('|'), 'i');

// ─── 支②左腿 b-f: 其余五类强制信号（后果威胁/时间状语/祈使/赎金式/
//    正当行为惩罚）────────────────────────────────────────────────────
const COERCE_ZH = new RegExp([
  String.raw`(?:否则|不然|要不然)(?:[^。]{0,8})?(?:我|给我|你)?(?:[^。]{0,10})?(?:就|会|要|马上|立刻|直接)`,
  String.raw`\b(?:or\s+else|otherwise|or\s+i\s+will|or\s+i'll|or\s+i\s+am\s+going\s+to)\b`,
  String.raw`(?:再|在)(?:敢|要)(?:[^。]{0,8})?(?:提|说|走|离开|报警|分手|拒绝|顶嘴|闹|反对|告诉)`,
  String.raw`(?:明天|今天|今晚|回头|稍后|待会儿|接下来|以后|往后)(?:[^。]{0,6})?(?:我)?(?:就|会|要)(?:[^。]{0,10})?(?:把|将)`,
  String.raw`\b(?:do|listen)\s+(?:what|as)\s+(?:i|we)\s+(?:say|tell|say\s+or|told)\b`,
  String.raw`(?:按|照|依)(?:我|咱们|我)(?:说|讲|教|安排|吩咐)(?:的)?(?:做|办|来|去)`,
  String.raw`(?:今天|今晚|现在|立刻|马上)(?:[^。]{0,6})?(?:不|没)(?:[^。]{0,6})?(?:转钱|打钱|给钱|拿钱|汇款|签字|签名|付款|打款|答应|同意|配合)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,6})?(?:要是|如果|若|敢|再敢)(?:[^。]{0,8})?(?:报警|报案|起诉|告诉|说出去|讲出去|分手|离婚|离开|走人|搬出去|躲起来|求助)`,
  String.raw`\b(?:do|listen)\s+(?:what|as)\s+(?:i|we)\s+(?:say|tell)\s+or\b`,
  String.raw`\b(?:or|unless)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|pay|sign|agree|transfer)`,
].join('|'), 'i');

// ─── G1: 法律规范与正当陈述（动物保护/损害赔偿/送养程序）────────────────
const LEGAL_ZH = new RegExp([
  String.raw`(?:动物|宠物)(?:[^。]{0,8})?(?:受|受法律|依法)(?:[^。]{0,6})?(?:保护)`,
  String.raw`(?:虐待|伤害|遗弃)(?:[^。]{0,6})?(?:动物|宠物)(?:[^。]{0,10})?(?:是|属于|构成)(?:[^。]{0,8})?(?:违法|犯罪|侵权|不可取|不该|错误)`,
  String.raw`(?:损坏|毁坏|弄坏)(?:[^。]{0,6})?(?:他人|别人|对方)(?:的)?(?:[^。]{0,6})?(?:物品|财物|财产)(?:[^。]{0,10})?(?:需要|应当|应该|要)(?:[^。]{0,6})?(?:赔偿|照价赔偿)`,
  String.raw`(?:领养|收养|送养|转送)(?:[^。]{0,6})?(?:宠物|动物)(?:[^。]{0,10})?(?:需要|应当|应该|要)(?:[^。]{0,8})?(?:商量|协商|同意|手续|程序)`,
  String.raw`(?:动物|宠物)(?:[^。]{0,8})?(?:保护法|保护条例|保护法)(?:[^。]{0,10})?(?:规定|明确|要求)`,
  String.raw`\b(?:animal|cruelty)\s+(?:welfare|protection|abuse)\s+(?:laws?|regulations?|is|are)\b`,
  String.raw`\b(?:damaging|destroying|breaking)\s+(?:someone|someone's|another\s+person's)\s+(?:property|belongings|possessions)\s+(?:is|are)\s+(?:illegal|unlawful|a\s+crime|against\s+the\s+law)`,
].join('|'), 'i');

// ─── G2: 概念分析与规范陈述（他者伤害要胁作为被分析、被否定的对象）────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:以|用|拿|把)(?:[^。]{0,10})?(?:伤害|威胁|恐吓|吓唬)(?:[^。]{0,8})?(?:宠物|动物|孩子|家人|亲人)(?:[^。]{0,10})?(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫|逼|勒索|敲诈)`,
  String.raw`(?:威胁|恐吓|要挟|胁迫)(?:[^。]{0,8})?(?:伤害|扔掉|送走|处理)(?:[^。]{0,8})?(?:宠物|动物|物品|东西)(?:[^。]{0,10})?(?:是|属于|构成|正是|就是)(?:[^。]{0,10})?(?:违法|犯罪|侵权|操控|控制|胁迫|勒索|敲诈|暴力|虐待|不可取|不该|错误|典型)`,
  String.raw`(?:家长|父母|大人)(?:[^。]{0,6})?(?:不该|不能|不应|不可以|别)(?:[^。]{0,8})?(?:拿|用|把)(?:[^。]{0,8})?(?:孩子|宠物)(?:[^。]{0,8})?(?:心爱|喜欢|最爱)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:东西|物品|玩具|宠物)(?:[^。]{0,6})?(?:作威胁|当威胁|要挟|逼迫)`,
  String.raw`\b(?:threatening|coercion|blackmail)\s+(?:to\s+)?(?:harm|hurt|get\s+rid\s+of|throw\s+away|abandon)\s+(?:a\s+)?(?:pet|dog|cat|animal|child|family\s+member|beloved)\s+(?:is|are)\s+(?:a\s+)?(?:recognized|common|classic|well[-\s]?known)\s+(?:form|type|tactic|pattern|sign)\s+of\s+(?:coercion|abuse|control|manipulation)`,
].join('|'), 'i');

// ─── G3: 正当育儿与规则后果（time-out/零花钱/取消安排——纠正行为，
//    无物理毁灭动作）────────────────────────────────────────────────
const PARENTING_ZH = new RegExp([
  String.raw`(?:取消|暂停|没收)(?:[^。]{0,6})?(?:今天|本周|这个周末|周末|这周|本月)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:安排|活动|出游|出门|玩耍|游戏时间|娱乐|零花钱|奖励)`,
  String.raw`(?:time[-\s]?out|零花钱|奖励|惩罚)(?:[^。]{0,10})?(?:规则|制度|方式|手段|方法)(?:[^。]{0,8})?(?:是|属于)(?:[^。]{0,8})?(?:常见|常用|合理|正当|正常)`,
  String.raw`(?:让|叫)(?:孩子|小孩|子女)(?:[^。]{0,6})?(?:面壁|冷静|反思|反省|站一会儿|坐一会儿)`,
  String.raw`\b(?:time[-\s]?out|grounding|losing\s+privileges|removing\s+screen\s+time)\s+(?:is|are)\s+(?:a\s+)?(?:common|widely|accepted|standard|reasonable)\s+(?:disciplinary|parenting)\s+(?:tool|technique|strategy|method)`,
].join('|'), 'i');

// ─── G5: 相邻维度域（selfharm_coercion 自伤要胁 / privacy_exposure_coercion
//    隐私曝光要胁）────────────────────────────────────────────────────
const ADJACENT_ZH = new RegExp([
  // selfharm_coercion（r650）：要胁对象是胁迫者自己的身体
  String.raw`(?:我|咱|老子)(?:[^。]{0,6})?(?:就)?(?:死|去死|跳下去|跳楼|割腕|绝食|不吃药|不活了|自杀|自残|伤害自己|喝药|上吊)`,
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:kill|hurt|harm|end)\s+(?:myself|me\s+own|my\s+own)\b`,
  // privacy_exposure_coercion（r661）：抵押物是隐私内容的公开传播
  String.raw`(?:把|将|拿)(?:你|您|你们)?(?:[^。]{0,10})?(?:聊天|对话)(?:记录|截图)`,
  String.raw`(?:把|将|拿)(?:你|您|你们)?(?:[^。]{0,10})?(?:私密|私人|隐私|不雅|裸|露骨|亲密)(?:照片|相片|图片|视频|录像|影像|照)`,
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:post|publish|share|send|leak|expose|upload|spread|show)\s+(?:your|the|these|those)\s+(?:private|personal|intimate|nude|secret|confidential)\s+(?:photos?|images?|pictures?|videos?|messages?|texts?|chats?|screenshots?|conversations?|details?|information|data)`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该、该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkThirdpartyHarmCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const HARM_ZH_ = R.HARM_ZH || HARM_ZH;
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const COERCE_ZH_ = R.COERCE_ZH || COERCE_ZH;
  const LEGAL_ZH_ = R.LEGAL_ZH || LEGAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const PARENTING_ZH_ = R.PARENTING_ZH || PARENTING_ZH;
  const ADJACENT_ZH_ = R.ADJACENT_ZH || ADJACENT_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '他者伤害要胁×伤害威胁×要胁顺从标记(zh)'
      : 'thirdparty-harm-coercion×harm-threat×coercion-marker(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（五类共用）：法律规范 / 概念分析 / 正当育儿 / 相邻维度 / 句首咨询
  if (LEGAL_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (PARENTING_ZH_.test(text)) return miss();
  if (ADJACENT_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① 他者伤害威胁（右腿）必中
  if (!HARM_ZH_.test(text)) return miss();
  // 支② 要胁顺从标记（左腿）：六类任中一类
  if (!COND_ZH_.test(text) && !COERCE_ZH_.test(text)) return miss();

  return hitResult;
}

module.exports = {
  checkThirdpartyHarmCoercion,
  __internals: () => ({
    HARM_ZH, COND_ZH, COERCE_ZH,
    LEGAL_ZH, ANALYSIS_ZH, PARENTING_ZH, ADJACENT_ZH, QUESTION_ZH,
  }),
};
