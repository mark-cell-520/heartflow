/**
 * src/bait-switch.js
 *
 * r486 — provisional 第299维 bait_switch（诱饵转换 / 低球战术族）
 *
 * 辨别的族（bait-and-switch / lowball / 先承诺后变更 / 钓鱼式报价）：
 * 先用一个有吸引力的**初始条件**（低价报价 / 承诺条款 / 免费使用 /
 * 宣传功能）换取对方做出**承诺或投入**（签约 / 付款 / 离职 / 上手依赖），
 * 再在对方**难以退出的时点**改变真实条件（加价 / 加条款 / 改职责 /
 * 功能分级），把对方的已投入当作锁定手段。
 *
 * 双腿 AND 结构：
 *   腿① BAIT   ——诱饵条件在场（低价/承诺/免费/宣传/优惠等初始承诺）
 *   腿② SWITCH——事后变更断言（事后加价/加码/改条件，且以对方
 *                已投入/难以退出为锁定理由）
 * 双同时出现才命中；单腿不判（C1/C2 负例注入证明每组承重）。
 *
 * 与存量维度边界（r486-probe-boundary.js 实证）：
 *   · commitment_coercion：对象是「过去做过的承诺」，无「初始诱饵 →
 *     事后变更」的两时点结构；
 *   · sunk_cost_coercion：主体是自身已投入，本族是**设局方**主动设计
 *     诱饵与变更两个时点；
 *   · decoy_effect：操纵选项集之间的相对吸引力，本族是**时间轴上**的
 *     条件变更。
 *
 * 豁免：合同变更合规（书面确认/重新报价/对方可解约）与**提前告知**
 * （价格调整提前通知）压制命中——I3 负例注入证明豁免承重。
 * 否定守卫：明确否认本套路时不判。
 * 概念评析（营销学/心理学/法学概念陈述）不判——G1 边缘良性。
 */
'use strict';

// r488 新族：俗语/口语族（诱饵腿）——诱饵以民间俗语/口语词在场，
// 不带「低价/承诺/条款」等显式诱饵词，也不带 ORIGINAL_ZH 的原条件形。
// 缺口实证（r488-takeover-verify 探针）：「养熟了再割」「先甜后苦」
// 「烧钱抢市场」「免费勾进来」「养着用户」9/11 穿透存量腿。
const COLLOQUIAL_BAIT_ZH = new RegExp(
  '(?:'
  + '养熟|养肥|养着|圈进来|勾进来|吸引过来|揽过来|拉进来'
  + '|烧钱|砸钱|补贴.{0,4}(?:抢|圈|养)|先[甜给]|给(?:足)?(?:好处|甜头)|甜头'
  + '|钓饵|鱼饵|下饵|撒饵|割韭菜|收割|收割|开宰|收网|收刀'
  + '|先礼后兵|先小后大|先优后改|先低后[高加涨]|先免后[收费]|先用后[知付]'
  + '|上钩|咬钩|入局|入套|下套|做局|设局|挖坑|埋坑'
  + ')',
);
// r488 新族：俗语/口语族（变更腿）——变更以口语词断言（变脸/改口/
// 加码/补钱/不认账）。与存量 SWITCH_ZH 的「事后/加价」显式形互补。
const COLLOQUIAL_SWITCH_ZH = new RegExp(
  '(?:'
  + '再割|再收割|再收网|变脸|翻脸|改口|反悔|变卦|食言'
  + '|加码|补钱|补价|追加|再加|再提|再涨|再改'
  + '|不认账|不算数|不作数|不兑现|翻脸不认'
  + '|离不开了|走不掉|跑不掉|脱不了身|下不了船|没法换|退不出'
  + '|没(?:有)?(?:议价|谈判|还手)的余地|任人宰割|人为刀'
  + ')',
);
// r488 新族：俗语/口语族（EN 诱饵腿）——hook / teaser / subsidize /
// signup bonus / pull in 族。存量 BAIT_EN 的 low price/free 显式词族不覆盖。
const COLLOQUIAL_BAIT_EN = new RegExp(
  '(?:'
  + 'hook(?:ed|s)? (?:them|you|users|customers|him|her)|pull(?:ed|s)? (?:them|users|customers) in'
  + '|teaser (?:rate|price|offer)|signup bonus|sign-?up bonus|welcome bonus'
  + '|subsidiz(?:e|ed|es|ing)|onboarding (?:is|was) (?:free|subsidized)'
  + '|bait|the hook|bait[- ]and[- ]switch'
  // r489：giveaway 名词形（a/the giveaway at the start）。成语用法
  // （It's a giveaway that…）靠双腿 AND 契约排除——缺变更腿不判。
  + '|(?:a|the|another) giveaway|giveaway (?:at|to win|to get|offer)'
  + '|giveaway to (?:win|get|bring|lure|hook|draw)'
  + ')',
  'i');
// r488 新族：俗语/口语族（EN 变更腿）——tripled / raised prices once /
// once switching became painful / can no longer walk away 族。
const COLLOQUIAL_SWITCH_EN = new RegExp(
  '(?:'
  + '(?:tripled|doubled|quadrupled|raised|hiked|jacked up) (?:the )?(?:price|prices|fee|fees|rate|cost|subscription)'
  + '|(?:price|prices|fee|fees|rate|cost|subscription)s? (?:was|were|has been|had been|got)? ?(?:tripled|doubled|quadrupled|raised|hiked|jacked up)'
  + '|once (?:switching|leaving|walking away|migrating) (?:became|is|was|gets|got) (?:painful|hard|difficult|expensive|costly)'
  + '|cannot (?:walk away|leave|migrate|switch)|can no longer (?:walk away|leave|switch)'
  + '|locked (?:in|into) (?:the )?(?:platform|ecosystem|contract)'
  + '|face[- ]?lift|switch (?:them|the terms|the deal)|bait[- ]and[- ]switch'
  + '|(?:margin|charge|fee|cost|surcharge|premium|price)s? (?:was|were) (?:added|applied|introduced|charged)'
  + '|(?:added|applied|introduced|charged) (?:once|after) (?:the )?(?:contract|agreement|deal) (?:is|was) (?:non[- ]cancellable|locked|binding|irreversible)'
  // r489：turn into / becomes a lock-in 名词化变更形（turn into a
  // lock-in game / turns into a paywall）。口语族变更断言的名词形。
  + '|turn(?:s|ed|ing)? (?:in|into) (?:a |the )?(?:lock[- ]?in|paywall|trap|money[- ]?pit|treadmill)'
  + '|became? (?:a |the )?(?:lock[- ]?in|paywall|trap)'
  // r489：becomes a paywall / turns into a paywall 的「the moment
  // you depend on it」时点形——口语族变更断言的名词形+依赖时点。
  + '|(?:paywall|lock[- ]?in|trap|pay[- ]to[- ]win) (?:the moment|once|as soon as|when)'
  + ')',
  'i');
// r488 新族：被动/无主语族（变更腿）——变更以被动语态断言，主语是
// 被替换的条件本身（「条件在他入职之后被单方面修改」「报价在签约后
// 被逐条加码」「duties were expanded unilaterally after…」）。
// 存量 SWITCH_ZH 只收主动形「事后/加价/改」，被动形整族穿透。
const PASSIVE_SWITCH_ZH = new RegExp(
  '(?:'
  + '被(?:单方面|单方|擅自|私下|直接|偷偷|悄然|逐一|逐条|大幅|全面|重新)?'
  + '(?:修改|更改|变更|改|修订|加码|追加|扩充|上调|调高|重新解释|重新定义|另作解释|偷换|替换|调换)'
  + ')',
);
// r488 新族：被动/无主语族（EN 变更腿）——were/was + revised/expanded/
// reinterpreted + after/once 时点。
const PASSIVE_SWITCH_EN = new RegExp(
  '(?:'
  + '(?:were|was|been|got) (?:unilaterally|secretly|quietly|revised|expanded|amended|altered|reinterpreted|redefined|raised|increased|rewritten)'
  + '(?: unilaterally| secretly| quietly| upward| afterwards| later| subsequently)?'
  + '|(?:were|was|been|got) (?:revised|expanded|amended|altered|reinterpreted|redefined|raised|increased|rewritten)'
  + '(?: unilaterally| secretly| quietly| upward| afterwards| later| subsequently)'
  + '|(?:revised|expanded|amended|altered|reinterpreted|redefined|raised|increased) (?:upward|unilaterally)'
  + ')',
  'i');

// r488 新族：被动/无主语族（诱饵腿）——被动变更的**对象**即被替换的初始
// 条件本身（报价/条件/条款/职责），以「对象名词 + 在/于…时点」在场。
// 与 PASSIVE_SWITCH_ZH（被…修改）共现才判，缺一不判。
const PASSIVE_BAIT_ZH = new RegExp(
  '(?:'
  + '(?:报价|价格|条件|条款|职责|待遇|约定|承诺|范围|内容|分成|比例|版本|说法)(?:范围|条款|内容|比例)?'
  + '(?:在|于|自|从)[^，。；]{0,14}(?:后|之后|以后|起|之际)'
  + ')',
);
// r488 新族：被动/无主语族（EN 诱饵腿）——对象名词 + were/was 被动形。
const PASSIVE_BAIT_EN = new RegExp(
  '(?:'
  + '(?:the |his |her |their |our )?(?:duties|scope|terms|conditions|responsibilities|price|quote|rate|role|remit|deliverables)'
  + ' (?:were|was|have been|had been)'
  + ')',
  'i');

// ── 腿①：诱饵条件在场（低价/承诺/免费/宣传等初始承诺）──
// r487 补腿：原条件在场族——诱饵条件不必以「低价/承诺」等显式词出现，
// 只要**被替换的初始条件**在场（最初/原来的条款、按这个版本、接受新条件的
// 两时点对照），即构成诱饵时点。此前该族只覆盖显式诱饵词，B 族穿透 13/20。
const ORIGINAL_ZH = new RegExp(
  '(?:'
  + '最初(?:的|约定|版本|条件|报价|条款|承诺)'
  + '|原(?:来)?(?:的)?(?:条件|版本|报价|条款|承诺|说法|职责|待遇|约定)'
  + '|一开始(?:的)?(?:条件|版本|报价|条款|承诺|说法|职责|约定)'
  + '|按(?:这个|原|最初)版本|按(?:最初|原来)的?(?:约定|承诺|条款)'
  + '|先前(?:的)?(?:约定|承诺|条件)'
  // 新条件与旧条件的两时点对照在场
  + '|(?:之所以|因而|因此)[^，。]{0,14}(?:接受|答应|同意)[^，。]{0,10}(?:新条件|新条款|新版本|新说法|新安排|新协议)'
  + ')',
);
const ORIGINAL_EN = new RegExp(
  '(?:'
  + 'original(?:ly)? (?:terms|conditions|deal|quote|price|promise|duties)'
  + '|initial (?:terms|conditions|deal|quote|price|promise|duties)'
  + '|as (?:originally|initially) (?:agreed|promised|advertised|quoted|listed)'
  + '|the (?:terms|deal|conditions) (?:we|they|he|she) (?:first|originally) (?:agreed|promised)'
  + '|per the (?:original|initial)'
  + ')',
  'i');
// r487 新族：裸诱饵短句族 —— 诱饵与变更都退化为裸名词/裸动词短句，
// 存量腿只认「低价/承诺」等显式词或「最初的+名词」完整形，裸短句整族漏
// （探针 r487-takeover-verify 实测后缀剥离 0/3 命中）。
// 腿①裸诱饵：说好的价格 / 谈好的分成 / 把好处给足 / 满口答应 / 先用…锁死 / 忍下这口气
const BARE_BAIT_ZH = new RegExp(
  '(?:'
  + '(?:说好|讲好|谈好|谈定|谈拢|说定|谈成)(?:的)?(?:价格|报价|分成|比例|条件|条款|范围|职责|待遇|说法|项目|版本|单子|订单)'
  + '|(?:把|给)?好处(?:给足|许给)|先给.{0,6}(?:好处|甜头|实惠)'
  + '|满口答应|一口答应|先应下|谈(?:的)?时候.{0,4}答应|原来谈好的'
  + '|先用[^，。；]{0,10}(?:条款|条件|版本|说辞|意向|承诺|单子|合同)[^，。；]{0,6}锁'
  + '|之所以忍|忍下这口气'
  + ')',
);
// 腿②裸变更：付了钱就不算数 / 签了约之后就… / 上船了再… / 辞了职再…
const BARE_SWITCH_ZH = new RegExp(
  '(?:'
  + '付了?钱?就不算数|付了?钱?就变卦|签了?约?之后|签了?字?之后'
  + '|钱交了之后|上船了再|辞了职再|离职之后|付了款之后'
  + ')',
);
// 腿①裸诱饵 EN：initial terms were generous（存量 ORIGINAL_EN 只认
// originally/initially agreed 等动词形，形容词描述形漏）
const BARE_BAIT_EN = new RegExp(
  '(?:initial|original) (?:terms|conditions|deal|offer) (?:were|was) '
  + '(?:generous|attractive|favorable|appealing|sweet|too good)',
  'i');
// 腿②裸变更 EN：the extras appeared after checkout（afterwards 族缺
// 「名词+appeared after+时点」形）
const BARE_SWITCH_EN = new RegExp(
  '(?:extras|surcharges|charges|fees|costs) '
  + '(?:appears?|appeared|surfaced|showed up|turned up) (?:only )?after'
  + '|appeared (?:only )?after (?:checkout|signature|signing|payment|deposit)'
  + '|not (?:what was|as) (?:advertised|promised|listed)',
  'i');

const BAIT_ZH = new RegExp(
  '(?:先用?|先以|一开始先|开始时先|起初先)?(?:'
  + '低(?:价|廉|价|成本|门槛|报价|价)|优惠价|促销价|便宜|免费|免单|不要钱|不设门槛|零门槛'
  + '|承诺|保证|应承|答应|说好|讲好|许诺|拍胸脯'
  + '|宣传|广告|页面上|页上|介绍里|标称'
  + '|含|包含|带|配|赠送|送|含精装|含装修|精装|装修'
  + '|口头|签字前|签约前|签合同前|付款前|付钱前|交定金前|入职前|应聘时|面试时|招聘时|招进来前|成交前'
  + '|钓鱼|引人上手|吸引|揽客'
  // r487 补腿：上钩动词族 + 「低到/低得 + 长修饰 + 价」形
  + '|钩住|上钩|套住|圈住|吊住|低(?:到|得)[^，。；]{0,10}(?:价|报价|价格)'
  + '|低于[^，。；]{0,10}(?:价|价格|报价|水平|行情)'
  + ')'
  + '(?:的?[^，。；]{0,12})?(?:条件|条款|报价|价格|价|功能|说法|承诺|内容|职责|待遇|说法|优惠|条件|范围|项目|东西)?'
  // r487：显式诱饵词缺位时，原条件在场族接棒（见 ORIGINAL_ZH/EN）
  + '|' + ORIGINAL_ZH.source
  // r487：裸诱饵短句族（腿①裸名词/裸动词形，见 BARE_BAIT_ZH）
  + '|' + BARE_BAIT_ZH.source
  // r488：俗语/口语族（诱饵腿，见 COLLOQUIAL_BAIT_ZH/EN）
  + '|' + COLLOQUIAL_BAIT_ZH.source
  // r488：被动/无主语族（诱饵腿，见 PASSIVE_BAIT_ZH/EN）
  + '|' + PASSIVE_BAIT_ZH.source
  + '|' + ORIGINAL_EN.source
  + '|' + BARE_BAIT_EN.source
  + '|' + COLLOQUIAL_BAIT_EN.source
  + '|' + PASSIVE_BAIT_EN.source,
);
const BAIT_EN = new RegExp(
  '(?:^|\\b)(?:'
  + 'low(?:est)?[- ]?(?:price|quote|cost|ball|balling|ball offer)|cheap|free|no[- ]fee|no[- ]cost|zero[- ]fee'
  + '|promise|promised|guarantee|guaranteed|advertise[ds]?|listed|listed as|quoted'
  + '|offer(?:ed)?|signed up with|sign them up'
  + '|(?:listing|posting|page|ad|brochure) said|said (?:it was|they were)|was (?:furnished|included|promised)'
  // r487 补腿：已投入对象族——诱饵以「平台/工具接入」的隐含形在场
  // （invested/locked/committed in the platform），覆盖免费接入→事后收费族
  + '|(?:invested|locked|hooked|dependent|reliant|trapped|committed) (?:in|into|on|to) (?:the |our |this )?(?:platform|app|service|tool|ecosystem)'
  + ')(?:\\b|$)',
  'i');

// ── 腿②：事后变更断言 ──
const SWITCH_ZH = new RegExp(
  '(?:'
  // 变更动作
  + '事后|之后|随后|再(?:说|讲|告诉|解释|通知|告知|逐个|逐项|层层|慢慢)|等他|等她|等对方|等用户|等他们|等客户|等人'
  + '|签约后|签合同后|签了合同后|签后|付了?款?后|付了?钱?后|交(?:了)?定金后|收了?钱后|成交后|购买后|买了?后|付费后'
  + '|入职后|上了?船|上船后|进来后|上手后|投入后|加入后|注册后|试用后|离职后|拒了?后|骑虎难下|下不了船|退不了'
  // r487 补腿：后续时点名词族（铺位/软件/服务接入后的时点）
  + '|进场后|接入后|入驻后|落户后|落地后|开通后|激活后|缴费后|缴款后|办了?后|使用后'
  // 变更理由（以对方已投入为锁定理由）
  + '|付出太多|投入(?:太)?多|(?:已经|已).{0,6}(?:投入|付出|离职|签约|付款)|让他.{0,6}(?:付出|投入|下不了)|被?他.{0,4}退路'
  // 变更内容
  + '|加价|加码|加钱|加条件|加条款|加收|涨价|提价|调整|改(?:变|口|成|为|职责|内容|条件|价格|说法|条款|协议)|变卦|反悔'
  // r487 补腿：分成/抽成族（免费接入→规模起来后抽成）
  + '做起来后|做大后|起来后|上轨道后|有起色后|见成效后'
  // r487 修复：裸「抽成|分成|提成|佣金|抽点」是**诱饵名词**（说好的分成比例）
  // 而非变更腿——裸短句「原来谈好的分成比例」被 分成 单字误判为变更，双腿
  // AND 契约被单字腿击穿。收紧为「变更语义形」：须带变更词（再/又/才/另/
  // 重新/改/变/涨/提）或「比例/额度/点数/部分 + 变更词」才承重。
  + '|(?:再|又|才|另|重新|改|变|涨|提)(?:抽成|分成|提成|佣金|抽点)'
  + '|(?:抽成|分成|提成|佣金|抽点)(?:比例|额度|点数|部分)?(?:也|都|全)?(?:改|变|涨|提|升|另|重|新)'
  // r487：裸变更短句族（腿②裸动词紧缩形，见 BARE_SWITCH_ZH）
  + '|' + BARE_SWITCH_ZH.source
  // r488：俗语/口语族（变更腿，见 COLLOQUIAL_SWITCH_ZH/EN）
  + '|' + COLLOQUIAL_SWITCH_ZH.source
  // r488：被动/无主语族（变更腿，见 PASSIVE_SWITCH_ZH/EN）
  + '|' + PASSIVE_SWITCH_ZH.source
  + '|再?收费|开始收费|收费留人|再?加价|事后加价'
  + '|高级版|另外收费|另外算|另计|后续费用|手续费|分期.*(?:另|其实)|(?:不|并)符合规定|不是.*包含|属于.*才'
  + '|推销更贵|替换成|替代品|换成'
  + ')',
);
const SWITCH_EN = new RegExp(
  '(?:'
  + 'then (?:change|add|charge|tell|explain|revise|reassign|start charging|swap|switch|introduce)'
  + '|after (?:the )?(?:payment|deposit|signature|signing|purchase|they|he|she|you)'
  + '|once (?:they|he|she|you) (?:are|is) (?:committed|locked in|invested|signed)'
  // r487 补腿：完成时形（"once they have invested / has been committed"）
  + '|once (?:they|he|she|you) (?:have|has been) (?:invested|committed|locked|signed|subscribed)'
  + '|when (?:they|he|she|you) (?:cannot|can not|can\'t) (?:walk away|leave|back out|quit)'
  + '|bait[- ]and[- ]switch|lowball|switch (?:them|the terms|the deal)'
  + '|add (?:the )?(?:real |actual |extra |hidden )?(?:charges|fees|costs|surcharges|conditions)'
  + '|revise|reassign|reveal(?:ed)? (?:only )?after'
  + '|adjust|change|alter|switch (?:the )?(?:terms|conditions|deal|duties|scope)'
  + '|new (?:conditions|terms|duties|charges|fees)|revised (?:terms|duties|conditions)'
  // r487 补腿：afterwards 族（"nothing is added afterwards" 形——
  // 事后变更在句尾以 afterwards 收束，此前该支缺位导致豁免样本摘除后不命中）
  + '|(?:added|appears?|introduced|charged) (?:only )?afterwards|added (?:later|after|afterwards)'
  // r487 补腿：变更近义族——「不再作数/不兑现」形（不作数/不算数/翻脸不认/
  // no longer honored）。存量腿只认「change/revise/add」类主动变更动词，
  // 「报价不再被兑现」这类**承诺失效**断言整族漏（A2 族 miss）。
  + '|no longer (?:honored|honoured|valid|applicable|in effect|binding)'
  + '|(?:was|were) not (?:kept|honored|upheld|respected)'
  + '|(?:price|quote|terms|deal|promise|offer) (?:was|were) not (?:kept|honored)'
  + '|not (?:kept|honored) (?:once|after)'
  // r487：裸变更短句族（腿②裸名词+appeared after+时点形，见 BARE_SWITCH_EN）
  + '|' + BARE_SWITCH_EN.source
  // r488：俗语/口语族（变更腿 EN，见 COLLOQUIAL_SWITCH_EN）
  + '|' + COLLOQUIAL_SWITCH_EN.source
  // r488：被动/无主语族（变更腿 EN，见 PASSIVE_SWITCH_EN）
  + '|' + PASSIVE_SWITCH_EN.source
  + ')',
  'i');

// ── 豁免：合同变更合规 + 提前告知 ──
const EXEMPT_ZH = new RegExp(
  '(?:'
  + '书面(?:确认|同意|协议|通知)|重新(?:报价|评估|协商|签约|签订)|补充协议|签署.*(?:变更|确认)'
  + '|列明|讲清楚|说明白|不含糊|如实|据实'
  + '|对方(?:有权|可以|能够)(?:不接受|拒绝|解除|退订|取消|解约)|无责解约|随时(?:退订|取消|退出)'
  + '|提前(?:三十天|\\d+天|一个月|\\d+个月|通知|告知|说明)|协商一致|征得.*同意|经过.*同意'
  + '|(?:变更|调整|修改)条款|合同(?:里|中)的?(?:变更|调整|修改)?条款'
  + '|(?:不|并|未|没|毫无)(?:再|在|会|有)?加价|(?:不|没|未)加价|不在.*加价|不再.*(?:加价|加收|收费)'
  + '|(?:没|未|不)(?:有)?(?:任何)?(?:额外|另行|变相)?(?:加价|加收|收费|追加)'
  + '|(?:要|需|需要|须)(?:调整|变更|修改)(?:的)?部分|(?:调整|变更|修改)(?:的)?部分'
  + '|(?:调整|变更|修改)后'
  + ')',
);
const EXEMPT_EN = new RegExp(
  '(?:'
  + 'written (?:agreement|consent|confirmation|notice)|advance notice|\\d+ days? (?:in advance|notice|before)'
  + '|free to (?:leave|walk away|cancel)|right to (?:decline|reject|terminate)'
  + '|renegotiat\\w+|disclosed (?:before|up front)|documented up front|listed up front|no.*added afterwards'
  + '|nothing is added|requires.*(?:agreement|consent)|mutual (?:agreement|consent)'
  + '|disclos\\w+|up front|before signing|in advance|terms are fixed|fixed by the signed'
  // r487 补腿：提前告知/披露型豁免——良性句在变更断言后声明「已提前告知」
  // （"If the quoted price changes, we tell them before they pay."）。存量
  // 豁免只认 disclosed/up front/in advance 等**前置披露**形，「tell them
  // before they pay」这类**告知对象+时点**形整族漏，导致该良性被双腿判中。
  + '|(?:tell|told|inform|informed|notify|notified|warn|warned|advise|advised) '
  + '(?:them|you|him|her|us|the (?:customer|client|user|buyer|subscriber)s?)'
  + '(?: (?:about|of) it)? ?(?:before|in advance|prior to|ahead of|first)'
  + '|(?:are|is|were|was) (?:told|informed|notified|warned|advised) (?:about|of)? ?(?:it|any|the)? ?(?:change|changes|price|fee|fees|charge|charges)? ?(?:before|in advance)'
  + '|before (?:they|you|he|she) (?:pay|commit|sign|purchase|order|buy)'
  // r487：良性商业断言豁免——免费接入→收费/留存是**已披露的商业模式**
  // （"a documented retention effect" 非事后变更）
  // r487 修复：裸 "business model" 会把真实攻击
  // 「Once they have invested in the platform, we start charging — that is
  //   the business model.」一并豁免（双腿在场仍被压），收紧为「披露/说明型」
  // 商业模式断言才豁免——攻击句里的 business model 是**结论自辩**，不是披露。
  + '|(?:disclosed|documented|explained|stated|published|listed) (?:as |in )?(?:the |our |its )?(?:business model|pricing model|monetization model)'
  + '|business model (?:is|was) (?:disclosed|documented|published|explained)'
  + '|documented (?:retention|effect|practice)|switching costs rise'
  + '|standard (?:practice|model)|industry (?:practice|standard)'
  + '|that is how (?:the )?(?:platform|service) (?:works|makes money)'
  + '|announced|cancel anytime|renegotiate'
  + ')',
  'i');

// ── 概念评析 / 教学陈述（不判）──
const META_ZH = new RegExp(
  '(?:'
  + '是一种(?:营销|心理|谈判|商业|经典|常见)(?:套路|策略|手法|技术|效应|现象|技巧)'
  + '|属于(?:虚假宣传|欺诈|违规|违法|商业欺诈)'
  + '|(?:营销|心理学|谈判学|行为经济)(?:学|里|中|上)?(?:的)?(?:概念|术语|现象|效应|策略|手法|理论)'
  + '|被(?:称为|叫作|归入|列为)|列入.*(?:清单|策略|教材|课)|防止.*(?:套路|伤害|欺诈)|建立制度'
  + '|消费者保护法|广告法|反不正当竞争'
  + '|(?:两种|几种|多种)(?:不同|相反|相似)的?(?:技术|策略|手法)'
  + '|列(?:进|入).{0,8}(?:清单|策略|手段|技巧)|自认为|以为这是|(?:认为|觉得)(?:这是|是).{0,10}(?:有效|好用|管用)'
  + ')',
);
const META_EN = new RegExp(
  '(?:'
  + '(?:is|are) (?:a|an) (?:classic|common|well[- ]known|textbook) (?:tactic|strategy|technique|compliance)'
  + '|regulated as|considered (?:deceptive|fraudulent|illegal)|classified as'
  + '|studied by|described in|refer(?:red)? to as|term(?:inology)? for'
  + '|consumer protection|deceptive advertising|false advertising'
  + '|are (?:two|several|different|classic) (?:strategies|techniques|tactics)'
  + '|to prevent|guard against|in order to prevent'
  + ')',
  'i');

// ── 否定守卫 ──
const NEG_ZH = new RegExp(
  '(?:'
  + '并不是?[「『\"“]?(?:先|用|靠|借|以).{0,10}(?:承诺|应|答|低价|免费|诱饵|套路)'
  + '|不是.{0,6}(?:套路|手法|策略|伎俩|钓鱼|诱饵|先.{0,4}后.{0,4})'
  + '|别(?:再)?(?:用|耍|玩|搞).{0,6}(?:先|套路|诱饵|手段|伎俩)|禁止.{0,8}(?:先|套路|诱饵|变卦)'
  + '|从一开始就(?:讲清楚|说明|列明|坦白)|全部(?:条件|费用|条款)(?:都)?(?:讲清楚|说明白|列明)'
  + ')',
);
const NEG_EN = new RegExp(
  '(?:'
  + '(?:it is |this is )?not (?:a |an )?(?:bait[- ]and[- ]switch|lowball|tactic|trick|scheme|ploy)'
  + '|no(?:t)? (?:a )?(?:bait|switch)|never (?:use|resort to|employ)'
  + '|disclosed (?:everything|all) (?:before|up front)|stated (?:everything|all) (?:up front|from the start)'
  + '|refuse to|we do not (?:use|employ|engage in)'
  + ')',
  'i');

/**
 * 检查文本是否命中「诱饵转换 / 低球战术」族。
 * @param {string} text 待检查文本
 * @param {object} [inj] 可选常量注入（负例注入测试用）
 * @returns {{hit:boolean, dimension:string, legs:object, evidence:string|null, reason:string}}
 */
function checkBaitSwitch(text, inj) {
  const C = Object.assign({
    BAIT_ZH, BAIT_EN, SWITCH_ZH, SWITCH_EN, EXEMPT_ZH, EXEMPT_EN, META_ZH, META_EN, NEG_ZH, NEG_EN,
  }, inj || {});

  if (typeof text !== 'string' || text.length < 4) {
    return { hit: false, dimension: 'bait_switch', legs: {}, evidence: null, reason: 'empty_or_short' };
  }

  // 否定守卫优先
  if (C.NEG_ZH.test(text) || C.NEG_EN.test(text)) {
    return { hit: false, dimension: 'bait_switch', legs: {}, evidence: null, reason: 'negated' };
  }
  // 概念评析 / 教学陈述不判
  if (C.META_ZH.test(text) || C.META_EN.test(text)) {
    return { hit: false, dimension: 'bait_switch', legs: {}, evidence: null, reason: 'meta_discourse' };
  }

  const bait = C.BAIT_ZH.test(text) || C.BAIT_EN.test(text);
  const sw = C.SWITCH_ZH.test(text) || C.SWITCH_EN.test(text);
  const legs = { bait, switch: sw };

  if (!bait || !sw) {
    return { hit: false, dimension: 'bait_switch', legs, evidence: null, reason: bait ? 'switch_only' : 'bait_only' };
  }

  // 豁免：合同变更合规 + 提前告知
  if (C.EXEMPT_ZH.test(text) || C.EXEMPT_EN.test(text)) {
    return { hit: false, dimension: 'bait_switch', legs, evidence: null, reason: 'exempt_compliant' };
  }

  const m = text.match(C.BAIT_ZH);
  const evidence = m ? m[0].slice(0, 40) : text.slice(0, 40);
  return { hit: true, dimension: 'bait_switch', legs, evidence, reason: 'bait_and_switch' };
}

module.exports = {
  checkBaitSwitch,
  __internals: () => ({ BAIT_ZH, BAIT_EN, SWITCH_ZH, SWITCH_EN, EXEMPT_ZH, EXEMPT_EN, META_ZH, META_EN, NEG_ZH, NEG_EN, ORIGINAL_ZH, ORIGINAL_EN, BARE_BAIT_ZH, BARE_BAIT_EN, BARE_SWITCH_ZH, BARE_SWITCH_EN, COLLOQUIAL_BAIT_ZH, COLLOQUIAL_BAIT_EN, COLLOQUIAL_SWITCH_ZH, COLLOQUIAL_SWITCH_EN, PASSIVE_SWITCH_ZH, PASSIVE_SWITCH_EN, PASSIVE_BAIT_ZH, PASSIVE_BAIT_EN }),
};
