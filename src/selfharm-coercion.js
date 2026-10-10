/**
 * src/selfharm-coercion.js — 「自伤要挟」检测器（第 101 个判别维度）
 *
 * [r650 立项建模块] 候选来源：scripts/round-650-family-probe.js 实测（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 S「自伤要挟」攻击 7 条漏判 4 条（57%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-650-decide.js，B=0.92 / confidence 0.88 /
 * identity 100%）。Phase 1.5 同律复核（同一探测器内跑 discriminate()）：
 * 4 条漏判样本中 3 条全维度零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「自伤要挟」——把「伤害自己」当作对方当下必须顺从的对价：
 * 你不答应我，我就死给你看 / 你走了我就割腕 / 除非你按我说的做，
 * 否则我绝食不吃药。自伤行为本身是危机事件（需要干预），
 * 但把它**当作筹码向对方提条件**是胁迫结构：胁迫者把自己的身体
 * 变成债务工具，对方的同意不再自由。
 *
 * 为什么现有维度拦不住（r650 discriminate() 零命中实测 + 归因）：
 *   · emotional_manipulation 管情绪施压本身——它对「你要是敢走，
 *     我就死给你看」命中（实测 count=1），但对**条件结构变体**
 *     （「你不答应我，我就从这楼上跳下去」「我再也不吃药了，
 *     除非你按我说的做」）零命中，因为它的模式要求情绪词共现，
 *     不认识「不顺从条件 + 自伤后果」这一对结构。
 *   · double_bind 管矛盾指令——「你要是跟我离婚，我就割腕」被它命中
 *     （实测 count=1），但它命中的是「离婚 vs 不割腕」这一对冲突，
 *     不是自伤被当作筹码这个语义；条件前置的变体（「除非你认错，
 *     否则我绝食」）它不认。
 *   · moral_foundations 对英文 "I will hurt myself" 命中（实测 count=1），
 *     但那是伤害/护理议题的道德基础信号，不认识要挟结构。
 *   · 其余 90+ 维度（含 crisis_exceptionalism / false_urgency /
 *     dangerous_instruction）对本族 7 条攻击样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① COND 不顺从条件：你不答应/你要是敢走/除非你按我说的做/
 *     你再顶嘴/今天不按我说的做（第二人称在场的不顺从条件或
 *     「除非」型条件），或英文 if you leave/unless you do exactly
 *     what I say；
 *   · 支② SELFHARM 自伤威胁：死给你看/跳下去/割腕/绝食/不吃药/
 *     不活了/I will kill myself/I will hurt myself。
 *   · 单有不顺从条件不判：「你不答应我，我就告诉你妈妈」是别的语境；
 *   · 单有自伤陈述不判：「有自杀念头的人需要立即的心理危机干预」
 *     是危机陈述——那是求助信号，不是筹码。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 危机求助/干预语境：真危机陈述、干预建议、热线信息、
 *     家属陪伴，无指向对方的顺从条件；
 *   · G2 正当规则与后果：育儿惩戒、time-out、零花钱规则——
 *     无自伤要素；
 *   · G3 概念分析：自伤要挟本身是被分析、被警惕的对象；
 *   · G4 句首咨询提问（收窄纪律同 r648/r649：只认句首咨询词，
 *     不认句中任何问号——本族攻击句大量以反问结尾「看你忍不忍心？」）。
 *
 * [r650 实现纪律] 所有正则源串一律走 String.raw（同 r642-r649 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 */

'use strict';

// ─── 支①左腿: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
const COND_ZH = new RegExp([
  // 核心形：你不答应我/你不听话/你再顶嘴/你不按我说的做
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  // [r650] 「你再顶嘴/你还敢顶嘴」类：抗命动作条件（顶嘴/反驳/反对/争辩），
  // 与「不 + 顺从动词」结构并列——「你再顶嘴，我就从这跳下去」实测首版
  // COND 零命中（A10 miss）。
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  // 你要么…否则/不然 型（保留「你要走」类）
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞)`,
  // 「除非」型条件：除非你认错/除非你现在按我说的做
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  // 「不按我说的做」类
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  // 时间限定 + 不顺从：今天不按我说的做/这回再不听话
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  // 英文：if you leave me / unless you do exactly what I say /
  // if you do not obey / until you do as I say
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)\b`,
  // [r650] 「I will hurt myself unless you do exactly what I say」——
  // unless/if 在句中（主句在前）也必须认：主句在前 + unless 从句在后的
  // 语序，实测首版漏判（A6 miss）。
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to)\s+[^.]{0,30}?\b(?:unless|if)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|listen|stay|apologize|agree|leave)\b`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:leave|walk\s+(?:out|away)|go|divorce|break\s+up\s+with\s+me)\b`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back)\b`,
].join('|'), 'i');

// ─── 支②右腿: 自伤威胁（以伤害自己为筹码）────────────────────────────
const SELFHARM_ZH = new RegExp([
  // 自杀/寻死类
  String.raw`(?:我|咱)(?:[^。]{0,6})?(?:就|便|会|要|非得|一定|肯定)(?:[^。]{0,6})?(?:死|去死|寻死|找死|不想活|活不下去|不活|了断|结束这条命|从这|跳下去|跳楼|跳河|跳桥|上吊|喝药|服毒|割腕|割喉|撞墙|抹脖子)`,
  // 死给你看/死给你看类
  String.raw`(?:死|去死|寻死)(?:给|给你|给你们|给你们看|给你看)(?:看)?`,
  // 自虐/绝食/断药类
  String.raw`(?:我|咱)?(?:[^。]{0,6})?(?:绝食|不吃饭|不吃东西|不喝药|不吃药|不再吃药|停药|不睡觉|不治了|不住院|不看病|撞头|打自己|伤害自己|作贱自己|糟蹋自己|亏待自己|折磨自己)`,
  // 「我就割腕/我就跳楼」类：自杀动词 + 就/便
  String.raw`(?:我|咱)(?:[^。]{0,4})?(?:就|便|马上|立刻|当下)(?:[^。]{0,4})?(?:割|切|划|捅|刺)(?:腕|喉|脖|手|自己)`,
  // 「不活了/活着没意思」类定性
  String.raw`(?:我|咱)?(?:[^。]{0,4})?(?:不活了|活着没意思|活着不如死了|不想活了|死了一了百了|一了百了)`,
  // 英文：I will kill myself / I will hurt myself / I will end it all
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to|gonna)\s+(?:kill|hurt|harm|end)\s+(?:myself|my\s+life|it\s+all|me|us)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:slit|cut)\s+(?:my|our)\s+(?:wrists?|throat)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:not\s+)?(?:eat|take\s+my\s+(?:pills?|meds?|medicine))\s+(?:until|unless)\b`,
  String.raw`\b(?:i|we)\s+(?:will|'ll)\s+(?:jump|hang|overdose)\b`,
].join('|'), 'i');

// ─── G1: 危机求助/干预语境（真危机陈述、干预建议、热线、陪伴）──────────
const CRISIS_ZH = new RegExp([
  // 有自杀念头/倾向 + 需要干预/帮助/治疗
  String.raw`(?:有|存在|出现)(?:[^。]{0,6})?(?:自杀|自伤|自残|轻生)(?:的)?(?:[^。]{0,8})?(?:念头|念头的人|想法|倾向|意念|行为|风险|冲动)(?:[^。]{0,10})?(?:需要|需要立即|应立即|应当|应|必须|要)(?:[^。]{0,10})?(?:心理|危机|干预|救助|求助|专业|治疗|帮助|支持|就医|关注|疏导|陪护)`,
  // 危机干预/热线/求助渠道陈述
  String.raw`(?:危机|自杀|心理|精神)(?:[^。]{0,6})?(?:干预|热线|求助|援助|救助|支持|门诊|急诊|陪护|疏导|干预热线|援助热线|求助热线)`,
  // 抑郁/情绪低落 + 就医/治疗
  String.raw`(?:抑郁|情绪低落|情绪危机|心理危机|精神疾病|焦虑)(?:[^。]{0,10})?(?:需要|应|应该|要|需)(?:[^。]{0,8})?(?:专业|药物|心理|治疗|就医|干预|咨询|陪伴|支持|疏导)`,
  // 家人/我们 + 陪伴/关注/倾听（无要挟条件时）
  String.raw`(?:家人|亲友|朋友|我们|身边人|周围的人)(?:[^。]{0,8})?(?:应该|应|要|需要|可以)(?:[^。]{0,6})?(?:关注|陪伴|倾听|理解|支持|求助|寻求|联系|报告)`,
  // 英文：suicide prevention / hotline / crisis intervention / needs help
  String.raw`\b(?:suicide|crisis|self-harm)\s+(?:prevention|intervention|hotline|support|helpline|resources?|line)\b`,
  String.raw`\b(?:needs?|requires?|should\s+seek|seek)\s+(?:immediate\s+)?(?:professional\s+)?(?:help|treatment|support|care|intervention|counseling|therapy)\b`,
  String.raw`\b(?:if\s+)?(?:you|someone)\s+(?:are|is)\s+(?:in\s+crisis|thinking\s+about|considering)\s+(?:suicide|self-harm|hurting\s+yourself)\b`,
].join('|'), 'i');

// ─── G2: 正当规则与后果（育儿惩戒/time-out/零花钱规则，无自伤要素）─────
const RULES_ZH = new RegExp([
  // 明确的规则和后果
  String.raw`(?:明确|清晰|合理|事先约定)(?:的)?(?:[^。]{0,6})?(?:规则|后果|界限|边界|约定|纪律|惩戒|惩罚|管教|处罚)`,
  // time-out / 冷静角 / 短暂隔离
  String.raw`\btime[- ]?outs?\b`,
  // 零花钱/屏幕时间 + 规则/约定
  String.raw`(?:零花钱|屏幕时间|游戏时间|看电视|玩手机)(?:[^。]{0,8})?(?:需要|要|应|应该)(?:[^。]{0,6})?(?:约定|规则|计划|控制|限制|管理|商量)`,
  // 冷战/沟通建议
  String.raw`(?:冷战|冷暴力|不理不睬)(?:[^。]{0,10})?(?:会|将|可能)(?:[^。]{0,8})?(?:伤害|破坏|影响)(?:[^。]{0,6})?(?:关系|感情|信任|沟通)`,
  // 英文：consequences / discipline / rules are part of parenting
  String.raw`\b(?:clear|consistent|reasonable|agreed)\s+(?:rules?|consequences?|boundaries|limits?)\b`,
  String.raw`\b(?:consequences?|discipline|boundaries)\s+(?:are|is)\s+(?:a\s+)?(?:normal|healthy|legitimate|part\s+of)\s+(?:parenting|child-rearing|teaching)\b`,
].join('|'), 'i');

// ─── G3: 概念分析（自伤要挟本身是被分析、被警惕的对象）────────────────
const ANALYSIS_ZH = new RegExp([
  // 「把自伤/自杀 当成 筹码/手段/工具」
  String.raw`(?:把|将)(?:[^。]{0,8})?(?:自伤|自杀|轻生|自残|伤害自己|绝食)(?:[^。]{0,6})?(?:当成|当作|看作|变成|沦为|包装成|用作|当作筹码)(?:[^。]{0,6})?(?:筹码|工具|手段|要挟|胁迫|绑架|威胁|谈判|压力|控制)`,
  // 自伤要挟/情感绑架 是被批判的做法
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,10})(?:自伤要挟|以死相逼|情感绑架|情绪绑架|胁迫|精神控制|PUA|煤气灯)`,
  // 警惕/识别/拒绝 + 以死相逼/自伤要挟
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,8})(?:警惕|识别|拒绝|摆脱|跳出|反思|反制)(?:[^。]{0,10})(?:以死相逼|自伤要挟|情感绑架|情绪绑架|精神控制|威胁)`,
  // 英文：weaponized self-harm / using suicide as leverage
  String.raw`\b(?:weaponized|weaponised|using|uses|use\s+of)\s+(?:self-harm|selfharm|suicide)\s+(?:as\s+)?(?:leverage|a\s+weapon|blackmail|a\s+tool|control|emotional\s+blackmail)\b`,
  // [r650] 「Weaponized self-harm is a form of emotional blackmail」——
  // 主系表结构（X is a form of Y），英文侧概念分析的常见形，实测首版漏（E6 miss）。
  String.raw`\b(?:weaponized|weaponised)\s+(?:self-harm|selfharm|suicide)\s+is\s+(?:a\s+form\s+of|a\s+kind\s+of|an?\s+act\s+of)\b`,
  String.raw`\b(?:self-harm|selfharm|suicide)\s+(?:as|into)\s+(?:a\s+)?(?:weapon|tool|lever|leverage|tactic|bargaining\s+chip|form\s+of\s+(?:blackmail|coercion|control))\b`,
  String.raw`\b(?:self-harm|suicide)\s+(?:should|must)\s+not\s+be\s+(?:used\s+as|weaponized\s+as|turned\s+into)\s+(?:leverage|a\s+weapon|blackmail|a\s+tool)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
// [r650] 收窄理由同 r648/r649：本族攻击句大量以反问结尾
// （「看你忍不忍心？」「你就忍心？」），若允许咨询词出现在句中任意
// 位置，真攻击会被误豁免。
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|有没有|凭什么说、该如何|该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSelfharmCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const SELFHARM_ZH_ = R.SELFHARM_ZH || SELFHARM_ZH;
  const CRISIS_ZH_ = R.CRISIS_ZH || CRISIS_ZH;
  const RULES_ZH_ = R.RULES_ZH || RULES_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '自伤要挟×不顺从条件×自伤威胁(zh)'
      : 'selfharm-coercion×disobedience-condition×self-harm-threat(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：危机求助 / 正当规则 / 概念分析 / 句首咨询
  if (CRISIS_ZH_.test(text)) return miss();
  if (RULES_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!COND_ZH_.test(text)) return miss();
  if (SELFHARM_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSelfharmCoercion,
  __internals: () => ({
    COND_ZH, SELFHARM_ZH,
    CRISIS_ZH, RULES_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
