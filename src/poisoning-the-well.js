/**
 * src/poisoning-the-well.js — 「井里投毒」检测器（第 134 个判别维度）
 *
 * [r698 立项] decision 本体在 133 维引擎上选出（/tmp/decide-run-698.js 读
 * /tmp/decide-opts-698.json，composite_score 0.92 / confidence 0.92 /
 * identity alignment 100%，无拒选）。探测器 /tmp/round-698-pre-probe.js
 * （落盘 /tmp/hf-scout-698.txt，判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判）：攻击 10 条漏判 10/10（100%）、
 * 真零命中 10/10、误伤 0/12（良性集含看内容再评估/先看论据再看立场/
 * 上次失败但复盘认真/竞品同事不同视角等正当采信与反诈提醒）。
 * Phase 1.5 同律复核：10 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 10/10——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「井里投毒」（poisoning the well，预先污名化×因人废言）——
 * 说话者的**动机、历史、身份被预先定性为不可信**，并以此为据**拒绝
 * 采信其观点或建议**。这不是合理的资历核验，而是「不听内容先否定人」：
 *   他反对这个方案？别听他的，他向来别有用心。
 *   她提的建议肯定是为了她自己，不用看内容。
 *   这个人上次就站错队，这次也别信。
 *   他一个竞品过来的，能安什么好心。
 *   别问他意见，他向来喜欢抬杠。
 *   Don't listen to him, he has always had an agenda.
 *   Ignore her proposal, she is only looking out for herself.
 *
 * 与既有维度的边界（r698 探测器实测归因）：
 *   · appeal_to_motive（fallacies 紧凑形）管**动机揣测单句**（你不就是
 *     为了刷绩效才提的吗）——无拒绝采信腿；本维度要件是**预先否定 ×
 *     拒绝听内容**两腿共现，单有动机揣测不判。
 *   · stereotype（既有维度）管**身份标签泛化贬损**（女人写的代码可靠
 *     性不如男人），本维度是**特定人的动机/历史定性 + 拒绝采信结论**，
 *     落点是不听内容而非群体能力评价。
 *   · genetic_fallacy（既有维度）管**来源-质量推断**（年轻人提的所以
 *     不成熟），本维度左腿含动机揣测与历史污名、右腿是拒绝采信动作
 *     （别听/别信/不用看），不含来源名词也能判。
 *   · bad_faith 管整体论证态度预设立场，本维度只管「因人废言」的
 *     预先人身否定结构。
 *   · victim_blaming 管受害者归责；sealioning 管反复质问骚扰。
 *   · 其余 133 个维度对本族 10 条漏判样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「污名化定语 × 拒绝采信结论」这一双腿结构在模式库里没有任何一条
 *   腿——appeal_to_motive 的紧凑形只认「你不就是为了……才」的当场揣测，
 *   不收「别听他的」这类预先否定结论；bad_faith 无拒绝采信词表。这是
 *   整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① SMEAR 预先污名定性（三类任中一类）：
 *     a 动机揣测（别有用心/没安好心/动机不纯/居心不良/针对/想推卸/
 *         想甩锅/带节奏/被收买/水军/阴阳怪气……）；
 *     b 历史污名（站错队/搞砸过/有前科/翻过车/被通报/老毛病/一贯如此/
 *         向来如此/每次都/又来了/改不了/本性难移……）；
 *     c 身份贬低（实习生/新人/刚来的/算什么/懂什么/也配/没资格/走后门/
 *         关系户/外包/乙方/无名小卒……）。
 *   · 腿② DISMISS 拒绝采信结论（三类任中一类）：
 *     a 直接否定（别听他的/别信/信不过/不用搭理/理他干什么/别问/当耳旁风/
 *         别浪费时间/直接跳过/不用看/看了也白看……）；
 *     b 观点宾语在场（他的建议/她的方案/他的意见/他说的话……）+ 上述否定；
 *     c 反问式否定（听他的干什么/信他干嘛/看他干什么）。
 *   · 单有污名不判：「他这个位置说这话，可能有立场因素」无拒绝采信
 *     腿——那是正常的立场提醒（立场披露本身是正当学术实践）。
 *   · 单有拒绝不判：「网传的说法别信」——对象不是特定人的观点，
 *     是匿名消息源质疑（正当新闻素养，见豁免）。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/沟通课反面
 * 教材/会议冲突转述，rewrite 会误伤（与 r672-r697 全部评价/胁迫族
 * 同口径）。verify 的含义是「这段对说话者的预先否定需要复核」——
 * 因人废言的文本，调用方应暂停采信其否定结论。
 *
 * 明确不判的（豁免——这些是正当的质疑、提醒与概念分析）：
 *   · 反诈安全提醒：文本含具体危险内容词（密码/验证码/转账/汇款/
 *     链接/中奖/刷单/身份证号/钓鱼/木马）时——「他说他是官方客服
 *     让你转账，别信」是正当防骗提醒，拒绝对象是陌生请求不是特定人
 *     的观点，良性集已覆盖；
 *   · 匿名消息源质疑：拒绝采信的对象是网传/据说/传言/谣言/未经
 *     证实/来源不明时——「网上传的别信」是新闻素养，不针对人；
 *   · 立场披露：「他有行业背景，观点可能有利益相关性，需要说明」
 *     是正当的同行评议实践（有披露无否定动作）；
 *   · 评析这套话术本身（井里投毒是一种谬误/识别井里投毒）。
 */
'use strict';

// ─── 腿① SMEAR 预先污名定性（三类合并：动机揣测 × 历史污名 × 身份贬低）──
// 中文三支：a 动机揣测 / b 历史污名 / c 身份贬低。
// 与 appeal_to_motive 紧凑形的区别：那边是当场「你不就是为了X」的
// 质问形，本腿是陈述/转述形预设定性（别有用心/站错队/实习生）。
const SMEAR_ZH = new RegExp(
  // a 动机揣测（别有用心/动机不纯/针对/想甩锅/带节奏/被收买/水军……）
  '(?:别有用心|没安好心|不安好心|动机不纯|居心不良|目的不纯|用心险恶|不怀好意|心怀不轨|另有企图|别有企图|别有目的|另有目的|别有用心' +
  '|就是针对|冲着我|冲着[她他]来|想推卸|想甩锅|想推责|想邀功|想上位|想表现|想刷|想出名|想炒作|带节奏|蹭热度|博眼球|刷存在感|故意找茬|存心找茬|成心找事|借题发挥|小题大做|含沙射影|指桑骂槐|拆台|拆我的台|看不得人好|眼红|嫉妒' +
  '|被[^。]{0,4}收买|收了钱|拿了好处|拿了人的|是水军|水军|洗地|跪久了|阴阳怪气|冷嘲热讽|说风凉话' +
  // a2 利己归因（为了她自己/是为自己/替自己打算——把观点动机归因于私利）
  '|(?:是为了|纯粹是为了|不过是为了|无非是为了|就是为了)(?:她|他|自己|自个儿|自身|本人)?(?:自己|打算|捞|争|抢|往上爬|好处|利益|私利)' +
  '|(?:她|他|对方|这人)(?:这么|那么)?(?:说|做|提|反对|支持)(?:是)?(?:纯粹|完全|就是)?(?:为了|替)(?:自己|她|他|自身|本人|好处|利益|私利|上位|出头)' +
  // a3 身份归因污名（竞品/对手公司过来的——来源连带否定）
  '|(?:竞品|对手公司|别家公司|同行过来的|从别家来的|友商)(?:过来|来的|出来的|背景)?)' +
  // b 历史污名（站错队/搞砸过/有前科/翻过车/被通报/老毛病/一贯如此……）
  '|(?:站错队|站错边|搞砸过|搞砸了|搞砸|搞黄了|搞坏了|出过事|有前科|翻过车|塌过房|上过热搜|被通报|被处分|被开除|被辞退|被开除过|被辞退过|背过锅|栽过跟头|摔过跤|犯过错|出过岔子|捅过篓子|拖过后腿|掉过链子|放过大错|误过事' +
  '|老毛病|一贯如此|向来如此|一直以来都|每次都这样|每次都|又不是第一次|又来了|老样子|改不了的|本性难移|无可救药|没救的|这种人|这种人我见多了|我早就看透|早就看穿|信不过' +
  // b2 抬杠/抄袭形（爱抬杠/杠精/抄的——行为模式污名）
  '|(?:爱|喜欢|就爱|向来|一贯|特别)(?:抬杠|杠|挑刺|找茬|反对)|杠精|(?:方案|设计|代码|文章|报告|成果)[^。]{0,4}(?:抄的|抄来的|拼凑的|东拼西凑|七拼八凑|缝合的))' +
  // c 身份贬低（实习生/新人/算什么/懂什么/也配/走后门/关系户/乙方……）
  '|(?:实习生|新来的|刚来的|新人|小孩子|小姑娘|小孩子家|黄毛丫头|乳臭未干|嘴上没毛|办事不牢' +
  '|算什么|算什么东西|懂什么|懂个什么|能懂个|也配|哪配|没资格|哪有资格|凭什么' +
  '|走后门|关系户|拼爹|靠关系|上位的|转正的|外包|乙方|第三方|小人物|无名小卒|无名之辈|草根|底层|没地位|没背景|没靠山|没人罩)'
);

// 英文：has an agenda / messed up before / just an intern / can't be trusted。
// 三支与中文对齐：a motive speculation / b history smear / c status dismissal。
const SMEAR_EN = new RegExp(
  // a motive speculation
  "\\b(?:has\\s+an?\\s+agenda|had\\s+an?\\s+agenda|have\\s+an?\\s+agenda|with\\s+an?\\s+agenda" +
  "|only\\s+looking\\s+out\\s+for|just\\s+looking\\s+out\\s+for|looking\\s+out\\s+for\\s+(?:him|her|them)self" +
  "|only\\s+trying\\s+to|just\\s+trying\\s+to|is\\s+being\\s+paid|is\\s+on\\s+the\\s+payroll" +
  "|is\\s+a?\\s*plant|is\\s+trolling|is\\s+a\\s+shill|is\\s+bought|in\\s+someone'?s\\s+pocket" +
  "|is\\s+biased|has\\s+always\\s+been\\s+biased|is\\s+prejudiced" +
  "|is\\s+targeting|is\\s+out\\s+to\\s+get|wants\\s+to\\s+cover|trying\\s+to\\s+shift\\s+(?:the\\s+)?blame" +
  "|seeking\\s+attention|attention\\s+seeking|stirring\\s+up\\s+trouble|making\\s+trouble|playing\\s+the\\s+victim)\\b" +
  // b history smear
  "|\\b(?:messed\\s+up|screwed\\s+up|blew\\s+it|failed\\s+before|has\\s+a\\s+history\\s+of|had\\s+a\\s+history\\s+of" +
  "|always\\s+complains|never\\s+delivers|couldn'?t\\s+deliver|let\\s+(?:us|them|everyone)\\s+down" +
  "|got\\s+caught|was\\s+fired|got\\s+fired|was\\s+reprimanded|was\\s+disciplined|was\\s+called\\s+out" +
  "|can'?t\\s+be\\s+trusted|cannot\\s+be\\s+trusted|is\\s+not\\s+trustworthy|isn'?t\\s+trustworthy" +
  "|has\\s+a?\\s+track\\s+record|always\\s+has|always\\s+does\\s+this|does\\s+this\\s+every\\s+time|here\\s+we\\s+go\\s+again|never\\s+changes|will\\s+never\\s+change)\\b" +
  // c status dismissal
  "|\\b(?:just\\s+an?\\s+intern|just\\s+a\\s+junior|just\\s+a\\s+new|only\\s+a\\s+|a\\s+mere\\s+|a\\s+nobody|who\\s+is\\s+(?:he|she)\\s+to|what\\s+does\\s+(?:he|she)\\s+know|not\\s+qualified|unqualified" +
  "|got\\s+the\\s+job\\s+through|connected|nepotism|an?\\s+outsider|an?\\s+underling|a\\s+minion|a\\s+grunt)\\b",
  'i'
);

// ─── 腿② DISMISS 拒绝采信结论（三类）────────────────────────────
// 中文三支：a 直接否定 / b 观点宾语在场 / c 反问式否定。
// 判据核心：结论是**不采信这个人的话**（别听/别信/不用看/白听），
// 不是对内容的正常批评（「方案有问题」无污名定语，腿①不命中）。
const DISMISS_ZH = new RegExp(
  // a 直接否定（别听他的/别信/信不过/不用搭理/理他干什么/别问/当耳旁风……）
  '(?:别听他|别听她|别听他的|别听她的|不用听他|不用听她|不必听|别信他|别信她|别信|信不过|不能信|不可信|信不得' +
  '|不用搭理|别搭理|不用理|别理|理他干什么|理她干什么|理他干嘛|理她干嘛|听他干什么|听她干什么|看他干什么|看她干什么' +
  '|别问|问他干什么|问她干什么|问他干嘛|问她干嘛|不用问|不必问|问了也白问' +
  '|当耳旁风|左耳进右耳出|别管|不用管|不必理会|不用理会|无视|忽略|别浪费|白费口舌' +
  '|不用看|不必看|看了也白看|说也白说|说了也白说|直接跳过|跳过就行|不用理会)' +
  // b 观点宾语在场（他的建议/她的方案/他说的话……）+ 上述否定
  '|(?:别|不用|不必|无须|不须|用不着|犯不着)(?:去|再)?(?:听|信|看|理|问|睬|管)(?:他的|她的|此人的|对方的)?(?:建议|方案|意见|观点|话|报告|分析|结论|想法|看法|说法|提议|提案|主张|思路)' +
  // b2 宾语前置倒装形（他的建议也不用听/这份报告不必看——观点宾语在前、否定词在后）
  '|(?:他的|她的|此人的|对方的|这次的|那份|那个)(?:建议|方案|意见|观点|报告|分析|结论|想法|提议|提案|主张|思路)(?:也)?(?:不用|不必|无须|别|用不着|犯不着)(?:去|再)?(?:听|信|看|理|睬)' +
  // c 反问式否定（听他的干什么/信他干嘛/看他干什么）
  '|(?:听|信|看|理|问)(?:他的|她的)?(?:干什么|干嘛|有(?:什么用|屁用))' +
  // c2 能力性质疑反问（能安什么好心/有什么好想法/想得出来——以反问否定发言资格）
  '|(?:能|可)(?:安|有)(?:什么|啥)(?:好心|好想法|好主意|好点子|好心眼|好心肠)' +
  '|(?:能|可)(?:想|写|做|搞)(?:得出来|的出)'
);

// 英文：don't listen to him / ignore her / discount anything / not worth reading。
// 三支与中文对齐：a direct dismissal / b object-qualified / c rhetorical。
const DISMISS_EN = new RegExp(
  // a direct dismissal
  "\\b(?:don'?t\\s+listen\\s+to|do\\s+not\\s+listen\\s+to|never\\s+listen\\s+to|stop\\s+listening\\s+to" +
  "|don'?t\\s+(?:listen|believe|trust)\\b|don'?t\\s+pay\\s+attention|pay\\s+no\\s+attention" +
  "|ignore\\s+(?:him|her|them|everything|anything|it)\\b|discount\\s+(?:anything|everything|him|her|them)\\b" +
  "|don'?t\\s+bother|no\\s+need\\s+to\\s+(?:read|listen|consider)|not\\s+worth\\s+(?:reading|listening|considering)" +
  "|tune\\s+(?:him|her|them)\\s+out|write\\s+(?:him|her|them)\\s+off|disregard\\s+(?:him|her|them|it)\\b" +
  "|take\\s+it\\s+with\\s+a\\s+grain\\s+of\\s+salt|don'?t\\s+take\\s+(?:his|her|their)|do\\s+not\\s+take\\s+(?:his|her|their))\\b" +
  // b object-qualified（his suggestion / her proposal + dismissal）
  "|\\b(?:his|her|their)\\s+(?:suggestion|proposal|idea|opinion|advice|analysis|recommendation|report)\\s+(?:is\\s+)?(?:worthless|useless|garbage|nonsense|invalid|irrelevant|pointless)\\b" +
  "|\\bwhatever\\s+(?:he|she|they)\\s+(?:says?|said|proposes?|proposed|suggests?)\\b[^.]{0,10}?\\bis\\s+(?:worthless|useless|garbage|nonsense|invalid|irrelevant|pointless|unreliable)\\b" +
  "|\\b(?:ignore|disregard|forget)\\s+(?:his|her|their)\\s+(?:suggestion|proposal|idea|opinion|advice|analysis|recommendation)\\b" +
  // c rhetorical（why listen to him / what does he know / why bother with her）
  "|\\bwhy\\s+(?:listen\\s+to|bother\\s+with|care\\s+about)\\s+(?:him|her|them)\\b" +
  "|\\bwhat\\s+does\\s+(?:he|she)\\s+know\\b",
  'i'
);

// ─── 豁免一：反诈安全提醒（拒绝对象是陌生请求/危险内容，不是特定人的观点）──
const ANTIFRAUD_EXEMPT = /(?:密码|验证码|转账|汇款|打款|汇款单|银行卡|信用卡|身份证|中奖|刷单|返利|红包链接|陌生链接|陌生来电|钓鱼|木马|恶意软件|勒索|账号被盗|异常登录)/;

// ─── 豁免二：匿名消息源质疑（对象是网传/据说/传言，不是特定人）──
const ANON_SOURCE_EXEMPT = /(?:网传|网上传|据说|听说|传言|谣传|谣言|流言|小道消息|朋友圈|未经证实|无从证实|无法证实|来源不明|无出处|没有出处|查无实据|道听途说|subreddit| rumors?|unverified|unconfirmed)/i;

// ─── 豁免三：评析这套话术本身 / 概念分析 ─────────────────────────
const META_EXEMPT_ZH = /(?:这|那就是|这就是|这正是|那正是一种|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:井里投毒|预先污名化|因人废言|以人废言|预设定性)|(?:井里投毒|预先污名化|因人废言|以人废言|预设定性)(?:是|属于|是一种|正是)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)/;
const META_EXEMPT_EN = /\b(?:poisoning\s+the\s+well|preemptive\s+(?:discrediting|smear)|appeal\s+to\s+(?:motive|character))\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPoisoningTheWell(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SMEAR_ZH_ = R.SMEAR_ZH || SMEAR_ZH;
  const SMEAR_EN_ = R.SMEAR_EN || SMEAR_EN;
  const DISMISS_ZH_ = R.DISMISS_ZH || DISMISS_ZH;
  const DISMISS_EN_ = R.DISMISS_EN || DISMISS_EN;
  const ANTIFRAUD_EXEMPT_ = R.ANTIFRAUD_EXEMPT || ANTIFRAUD_EXEMPT;
  const ANON_SOURCE_EXEMPT_ = R.ANON_SOURCE_EXEMPT || ANON_SOURCE_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 反诈安全提醒：拒绝对象是危险内容不是人的观点
  if (ANTIFRAUD_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 匿名消息源质疑：对象是网传/据说不是特定人
  if (ANON_SOURCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const smearZh = SMEAR_ZH_.test(text);
  const smearEn = SMEAR_EN_.test(text);
  const dismissZh = DISMISS_ZH_.test(text);
  const dismissEn = DISMISS_EN_.test(text);

  // 双腿共现：预先污名定性 × 拒绝采信结论（缺一不判）
  if ((smearZh || smearEn) && (dismissZh || dismissEn)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '井里投毒×预先污名×因人废言(zh)' : 'poisoning the well×preemptive smear×dismissal(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkPoisoningTheWell,
  __internals: () => ({ SMEAR_ZH, SMEAR_EN, DISMISS_ZH, DISMISS_EN, ANTIFRAUD_EXEMPT, ANON_SOURCE_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
