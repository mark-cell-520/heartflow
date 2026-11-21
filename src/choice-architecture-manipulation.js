// choice_architecture_manipulation（选择结构操纵 / dark patterns）——第 279 维度（r438 接线）
//
// 判据：一段话在描述或推荐某种**选择结构操纵手段**——不改变选项本身的
// 价值主张，而是通过「结构」让用户做出本不会做出的选择：隐瞒成本、
// 伪装选项、强迫行动、误导视觉、默认不利勾选、阻碍取消、伪造社会证明。
//
// 立意在「结构欺骗」而非「话语施压」：心虫存量 coercion 族（guilt_induction
// / flattery_pressure / fear_projection / family_shame_coercion 等十余维）
// 管的是话语内容层的情感施压（羞辱/威胁/内疚话术）；false_urgency 管泛化
// 时间压力话术（话术层，不限界面）。本族管的是**界面/交互结构层的选择
// 操纵**——文本在陈述「按钮怎么摆、勾选怎么设、流程怎么绕、数字怎么编」
// 以及这么做「用户就怎样了」。
//
// 探针实证（scripts/round-438/probe-r438-gap.js，v6.8.217 gate 层）：
// 攻击池 21 条（10 个 dark patterns 家族 × ZH/EN），13/21 完全穿透零维度
// 承重——混淆问句 trick_question、强迫行动 forced_action、隐性成本
// sneaky_cost、视觉误导 misdirection、取消阻碍 obstruction、伪造社会
// 证明 social_proof_fabrication 整族 gate=pass。存量非 pass 的 8 条承重
// 维度（framing_effect/stereotype/instrumental_reasoning/false_urgency/
// confidence/claimed_verification_without_trail）全部是旁路误中，语义射程
// 均不对口（如 preselection 被 confidence 拦下是巧合）。
//
// 与既有维度射程分工（已写入 guidance）：
// - false_urgency 管「话术层时间压力」（「仅限今天」「错过等一年」），
//   不限界面结构；本族管「界面结构操纵」，时间压力只是其中一族的实现
//   手段（假倒计时 false_countdown 族），且必须腿③效果陈述在场。
// - instrumental_reasoning 管「把他人当工具」的一般推理；本族管「选择
//   结构欺骗」这一具体手段族。
// - confidence / perfect_error 等存量旁路命中是巧合承重，不占射程。
// - preset coercion 族（guilt_induction 等）管话语内容层，本族管结构层。
//
// 三腿判据（缺一不判）：
// 腿① STRUCTURE：选择结构元素在场（按钮/选项/勾选框/弹窗/结算页/流程/
//   步骤/页面/文案/问卷/注册/订阅/退订）。
// 腿② MANEUVER：结构操纵手段词（隐瞒/隐藏/不显示/最后一步才/默认勾选/
//   缩成灰色/必须/只能/不…就/做成/设计成/写成/编造/写死/自动重置）。
// 腿③ EFFECT：操纵效果陈述（不敢点/降低退订率/无法进入/被扣款/制造
//   紧迫感/按最贵的扣费/用户就/转化率提升/没有人在点）。
//
// 豁免四组：
// ① 善意优化/透明设计在场（减少步骤、明码标价、金额一致、入口同样显眼、
//    可跳过、真实有效、无障碍、对比度、文字标签）——同构「流程×效果」
//    句子但方向相反，是正常 UX 工作。
// ② 教学/批评/监管转述（欧盟黑名单、dark pattern 批判、UX 教材、论文
//    分析界面操纵现象）——在讨论这件事本身，不是在实施操纵。
// ③ 疑问/假设/教学提问（「如果按钮做得不显眼会怎样」是方法论提问）。
// ④ 无效果陈述的纯描述（只说「按钮是灰色的」不说「所以用户就…」）。

'use strict';

// ============ 腿① STRUCTURE：选择结构元素 ============
// 界面/交互选择结构的载体词。r438 实证：只收「用户要在上面做选择」的
// 结构名词，不收泛化「页面/系统」（误伤面太大）。
// 腿① STRUCTURE：选择结构元素。
// [r438 收尾修复] 原版只收具象结构名词，导致「把真实价格藏到最后一步才
// 显示」「活动页上写着仅剩 3 件是编造的」这类**只陈述操纵设计本身**的
// 典型 dark pattern 描述整族漏判（单测 5 条攻击全断在腿①——探针
// probe-r438-diag-fix.js 实证：HIDE/FAKE/FORCE 手段腿命中但结构腿零
// 命中）。r227 起教训：三腿判据的**本体腿**不能靠语义在场而词表缺席。
// 修正：腿①拆两轨——
//   轨A 具象结构名词（原样保留，按钮/勾选/结算页/流程…）；
//   轨B 选择语义本体（价格/费用/库存/件数/权限/通讯录/信息/数据/
//      条款/协议/活动/优惠券）——被操纵的**选择对象**本身，配合腿②
//      手段词出现时，「对这个东西做结构操纵」的语义完备（「把真实
//      价格藏起来」价格就是选择对象，无需再说「页面」）。
// 误伤控制：轨B 名词必须与腿②手段共现（单腿不判），「明码标价」类
// 良性句由豁免① BENIGN_UX 兜底。
const STRUCTURE_ZH = /(按钮|选项|勾选框|复选框|勾选|单选|弹窗|弹层|确认框|提示框|结算页|结算界面|详情页|下单页|问卷|表单|注册|订阅|退订|取消订阅|续费|会员|套餐|档位|流程|步骤|入口|链接|小字|文案|默认选项|默认勾选|自动续费|服务费|手续费|处理费|倒计时|限时|优惠|引导|布局|界面|页面|弹窗|确认弹窗|拒绝按钮|下一?页|下一?步|首页|主页|落地页|着陆页|真实价格|实际价格|真实费用|隐藏费用|额外费用|附加费|库存|件数|余量|权限|通讯录|个人信息|隐私信息|信息|数据|资料|条款|协议|活动|活动页|优惠券|折扣)/;
// [r438 收尾修复] EN 轨B 等价物——与 ZH 腿①轨B（选择语义本体）对应：
// app/site/service/platform（产品本体）、access/data/information/
// contacts/permission（被操纵的选择对象）。实证：`Users must grant
// permission to continue using the app.` 手段腿（grant permission）
// 与后果腿（continue）均命中，仅因「app」不在结构表而整句漏判。
const STRUCTURE_EN = /\b(?:button|checkbox|opt[\s-]?in|opt[\s-]?out|pop[\s-]?up|modal|dialog|checkout|form|survey|questionnaire|subscription|unsubscribe|cancel(?:lation)?|renewal|plan|tier|pricing|fee|countdown|timer|default|pre[\s-]?select(?:ed|ion)?|toggle|switch|link|fine\s?print|copy|wording|layout|page|screen|flow|step|steps?|decline|accept|option|choice|answer|counter|badge|contacts?|account|download|next\s+(?:page|step|screen)|click|clicks|phone\s+call|call|waiting\s+period|fine\s+print|process|journey|onboarding|app|application|website|web\s?site|site|platform|service|product|permission|permissions|access|privacy|data|information|details?|address\s?book|location|terms|policy|agreement|price|prices|cost|fee[sd]?|stock|inventory|quantity|offer|deal|discount|coupon)\b/i;

// ============ 腿② MANEUVER：结构操纵手段 ============
// 分五组，对应探针实证的 10 个家族：
// M1 隐瞒/延迟披露（sneaky_cost / hidden_subscription）：
//    成本或订阅义务在用户承诺前不出现。
const MANEUVER_HIDE_ZH = /(不显示|没有显示|未显示|不展示|不出现|最后(?:一)?步才|到最后(?:一)?步|结算时?才|付款时?才|付钱时?才|快完成时?才|到最后|藏起|隐藏在?[了在]?|隐蔽|默认勾选|默认选中|预先勾选|事先勾选|自动勾选|默认订阅|默认续费|默认开通|自动续费|自动扣[款项]|顺手(?:注册|订阅|开通)|一并不?(?:同意|订阅))/;
const MANEUVER_HIDE_EN = /\b(?:hidden|hide[sd]?|conceal(?:ed|s)?|not\s+(?:shown|displayed|visible|mentioned|disclosed)|only\s+(?:appears?|shows?|showed)\s+(?:at|in|on)\s+(?:the\s+)?(?:final|last|checkout|payment)|appears?\s+(?:only\s+)?(?:at|in)\s+(?:the\s+)?(?:final|last)\s+(?:step|stage|checkout)|checked\s+by\s+default|pre[\s-]?check(?:ed|ing)?|pre[\s-]?select(?:ed|ing|ion)?|auto[\s-]?renew(?:s|ed|al)?|automatically\s+(?:renewed|charged|enrolled|subscribed|signed\s+up)|enrolled\s+by\s+default|default(?:s|\s+to)?\s+(?:to\s+)?(?:opt[\s-]?in|subscribe|renew|charge))\b/i;
// M2 伪装/误导措辞（confirm_shaming / trick_question）：
//    选项文字与真实含义相反，或必选答案违背用户意图。
// [r438 收尾修复] 补「同意即表示已阅读」类**同意捆绑**形——点击继续
// 即视为同意全部条款（by continuing you agree），措辞把「继续使用」
// 与「接受条款」绑定，用户不同意的唯一方式是放弃产品。原表只有
// worded so/phrased so 转述形，不收这种捆绑陈述本身。
// 补 grant permission / grant access 强迫形——「must grant permission
// to continue」把权限授予设为继续前提（原表只到 share contacts）。
// [r443 审计修复] 去裸「话术/措辞/文案写」形——良性反诈/教学陈述
// （「反诈宣传文案列举诱导信任话术」）整句三腿误触发。承重攻击族
// （P1a/P1c/P2a 三条 confirm_shaming/trick_question）全部走「写成/设计
// 成/设成」的**绑定形**（写成「…」、设计成「…」、答案设成「…」），
// 不依赖裸名词。161 轮教训：同族词去修饰后仍须命中——绑定形在表。
const MANEUVER_DISGUISE_ZH = /(写成|写成[了着]?|设计成[了着]?|做[成做]?[了着]?「|勾掉|取消勾选|选[「「]|不选|反选|无法(?:进入|继续|提交|通过)|点了也白点|按不下去|同意即|继续(?:即|就)?表示|看[了着]?即|勾选即|打勾即|点击即|注册即|默认同意|视为同意|推定同意|不(?:点|选|勾)(?:同)?意[拒]|把.{0,12}(?:写成|设计成|做成|设成)|答案设[成置]|选项设[成置])/;
const MANEUVER_DISGUISE_EN = /\b(?:word(?:ed|ing)?\s+(?:so|as|to)|phrased\s+(?:so|as|to)|reads?\s+["“]|worded\s+["“]|cannot\s+(?:proceed|continue|submit|enter)|can'?t\s+(?:proceed|continue|submit|move)|uncheck(?:ing)?\s+(?:it\s+)?means|checking\s+(?:it\s+)?means|decline\s+(?:option|button)\s+(?:reads?|says?)|opt[\s-]?out\s+(?:means|is)|trick(?:s|ed|ing)?\b|by\s+continuing\s+you\s+agree|(?:clicking|pressing|tapping|continuing|signing\s+up|registering|scrolling)\s+(?:you\s+)?(?:means|implies|constitutes|counts\s+as|indicates)\s+(?:your\s+)?(?:acceptance|agreement|consent)|deemed\s+(?:to\s+have\s+)?(?:agreed|accepted|consented)|assumed\s+(?:to\s+have\s+)?(?:agreed|accepted)|silence\s+(?:means|implies|will\s+be\s+taken\s+as)|grant(?:s|ed|ing)?\s+(?:access|permission|permissions)|permission\s+(?:is\s+)?required\s+to|requires?\s+(?:you\s+to\s+)?(?:grant|give)\s+permission)\b/i;
// M3 强迫行动（forced_action）：把不相关动作设为继续的前提。
// [r438 收尾修复] 去掉裸「授权」形——医疗/法律合规陈述（「病历资料涉及隐私，
// 调阅需授权」）会三腿误触发（STRUCTURE「资料」+ FORCE「授权」+ NOUN「资料」）。
// 攻击族3 的承重分支是「只能/不…就/要求…才能」等动作指向形，不依赖裸「授权」。
const MANEUVER_FORCE_ZH = /(必须|只能|非得|不得不|强制|要求.{0,10}(?:才能|才可|方可)|先.{0,12}才[能可](?:下载|进入|继续|使用|查看|领取|参与)|不.{0,12}就(?:无法|不能|不让|不给|休想)|填写完整|填完|共享.{0,6}(?:联系|通讯|信息|数据))/;
// [r438 修复] 裸祈使形补收：force（原只收 forced to/must/have to，
// 「Force users to share contacts」整句漏判）。161 轮教训：同族词去
// 后缀后仍须命中。
const MANEUVER_FORCE_EN = /\b(?:must|have\s+to|has\s+to|required\s+to|forced?\s+to|force[sd]?\s+(?:users?|people|customers?|them|visitors?)\s+to|can'?t\s+(?:proceed|continue|download|use|access|view)\s+(?:until|unless|without)|only\s+(?:after|by)\s+(?:creating|signing|filling|sharing|providing)|to\s+(?:proceed|continue|download)\s*,?\s+(?:users?\s+)?(?:must|need\s+to|have\s+to))\b/i;
// M4 视觉误导/阻碍（misdirection / obstruction）：显著性错配、取消路径
//    长于订阅路径。
// [r438 修复] 裸形容词形补收：浅灰/做小/调暗（原只收「灰色小字」固定
// 搭配，「按钮颜色做成浅灰，用户压根注意不到」漏判）。161 轮教训：
// 同族词去修饰后仍须命中。
// [r443 审计修复] 去裸「比…长/麻烦/复杂」比较形——良性技术陈述
// （「服务调用链路比较复杂」「退订流程比注册麻烦」）整句三腿误触发。
// 攻击族（P6b/P9b）承重于具象显著性形（做小/调暗/角落/等N个工作日），
// 不依赖裸比较形。161 轮教训：同族词去修饰后仍须命中——具象形在表。
const MANEUVER_OBSTRUCT_ZH = /(又大又亮|又大又醒目|缩小|缩[成小]|灰色小字|浅[灰蓝]|深[灰蓝]|做[成做]?[小暗浅淡]|调[成暗小]|颜色[做调]?[成浅暗]|不显眼|放在角落|藏[在到]角落|难以[找看]|找不到|要打客服|等[0-9一二三]个工作日|等[0-9一二三]天|绕[远圈]|多[步道])/;
const MANEUVER_OBSTRUCT_EN = /\b(?:bright\s+(?:green|blue|orange)|tiny|small|gray|grey|hidden\s+in\s+the\s+corner|hard\s+to\s+find|difficult\s+to\s+(?:find|locate|cancel)|requires?\s+(?:a\s+)?phone\s+call|waiting\s+period|more\s+(?:steps|clicks|effort))/i;
// M5 伪造数据/假稀缺（social_proof_fabrication / false_countdown）：
//    编造不存在的社会证明数字、不会真正归零的倒计时。
// [r438 修复] 裸词形补收：写死（原只收「写死的」，「首页写死一个数字」漏判）。
// 161 轮教训：同族词去后缀后仍须命中。
const MANEUVER_FAKE_ZH = /(写死|固定[的数]|编[造编]|假[的装]|虚构|凭空|根本没人|没有(?:人)?统计|不存在|自动重置|重置|归零|不会(?:真[的正]?)?(?:结束|停)|永远|循环|反复|刷新)/;
const MANEUVER_FAKE_EN = /\b(?:hard[\s-]?coded|fake|fictional|fabricated|made[\s-]?up|invented|not\s+real|no\s+one\s+(?:is\s+)?(?:actually\s+)?(?:counting|tracking|measuring)|resets?\s+(?:itself|when)|refreshes?\s+(?:itself|automatically)|never\s+(?:actually\s+)?(?:ends?|runs?\s+out|expires?)|loops?|cycles?)/i;

// ============ 腿③ EFFECT：操纵效果陈述 ============
// 效果腿分两轨：
// 轨A 显式效果词——「不敢点」「降低退订率」「转化率」「so that」「users
//   end up」「charged」「pays more」。r438 实证：转化率/提升类必须与腿②
//   操纵手段共现（善意优化也用转化率），单腿不判。
// 轨B 后果名词——手段自带的用户侧后果：「下载/订阅/扣款/退订/客服/
//   工作日/统计/浏览/人数」与 EN 的 download/sign up/cancel/checkout/
//   fee/charge/call/waiting。r438 实证修正：forced_action/sneaky_cost/
//   misdirection/obstruction/fake_proof 五族的效果在真实文本里几乎总
//   是名词化的（「必须先订阅才能下载」「最后一步加上一笔处理费」），
//   只认显式效果词会漏 11/21（探针实测）。后果名词腿的语义是「这句话
//   在陈述一个用户侧后果」——手段 + 后果共现才构成操纵陈述。
// 误伤控制：后果名词本身极常见（「服务费明码标价」也含「服务费」），
// 靠豁免① BENIGN_UX 与腿②手段词的严格性把关——良性句不触发腿②。
const EFFECT_ZH = /(不敢点|没人[点在按]|没有[人点在按]|点了.{0,6}(?:也没|无法)|就(?:会|能|要|得|可)?(?:被|按|选|进|订|扣|付|多付|少付|默认)|用户(?:就|只|都|往往|大多|一看|不好意思|不好意思点|干脆|只好|只能)|从而|因此|于是|所以|以此|借此|显著(?:降低|提升|减少|提高|增加)|大幅(?:降低|提升|减少|提高|增加)|降低(?:退订|取消|流失|跳出|投诉|举报|投诉率|退订率)|减少(?:退订|取消|投诉|举报)|提升(?:转化|订阅|续费|付费|留存|客单|GMV|gmv)|制造(?:紧迫|紧张|焦虑|压力|稀缺|恐慌)|利用|诱导|误导|骗|忽悠|套路|转化率|退订率|留存率|续费率|客单价|订阅率|点击率|无法(?:进入|继续|提交|通过|完成|使用|访问)|进[不入]了?下一页|进[不入]了?下一步|多付|多收|多花|白付|白花|白给|吃亏|被扣|扣款|多扣|稀里糊涂|不明不白|不知不觉|糊里糊涂|压根[儿不]?不知道|根本不知道|不会注意|注意不到|来不及|没想到|想不到)/;
// 轨B：后果名词（ZH）
const EFFECT_NOUN_ZH = /(下载|订阅|续费|扣款|扣费|付款|支付|退订|取消订阅|客服|工作日|工作日|统计|浏览|人数|订单|下单|注册|开通|授权|同意|协议|条款|邮件|通讯|信息|资料|账号|账户|会员|套餐|报告|资料|文件|功能|内容|商品|服务|优惠|折扣|价格|费用)/;
// [r438 收尾修复] 补 forced_action 族效果形——`Users must grant
// permission to continue using the app.` 腿①（app）腿②（grant
// permission）均命中，仅因「continue using」这类**被迫延续动作**不
// 在效果表而漏判。语义：手段 + 被迫继续使用的后果即完整操纵陈述。
const EFFECT_EN = /\b(?:nobody|no\s+one)\s+(?:clicks?|taps?|selects?|reads?|notices?|checks?)\b|\busers?\s+(?:then\s+)?(?:end\s+up|get|are|have\s+to|do|did|keep|stay|rarely|seldom|almost\s+never|don'?t|do\s+not|can'?t|cannot|unwittingly|unknowingly|accidentally)\b|\b(?:can'?t|cannot|unable\s+to)\s+(?:proceed|continue|submit|enter|complete|access|download|use)\b|\b(?:forced|made|required)\s+to\s+(?:grant|give|share|provide|accept|agree|sign)\b|\bto\s+(?:proceed|continue|download|use|access|unlock|enter)\s+(?:using|with|into)?\s*(?:the\s+)?(?:app|service|platform|product|site|website|account)\b|\bso\s+(?:that\s+)?(?:users?|people|customers?|they)\b|\b(?:drives?|driven|boosts?|boosted|increases?|increased|lowers?|lowered|reduces?|reduced|lifts?|lifted|maximi[sz]es?|keeps?|kept|pushes?|pushed|nudges?|nudged|pressures?|pressured|tricks?|tricked|fools?|fooled|misleads?|misled|charges?|charged|bills?|billed)\b|\b(?:conversion|retention|churn|unsubscribe|sign[\s-]?up|renewal|cancel|opt[\s-]?out)\s+rate\b|\bmore\s+(?:revenue|money|subscribers|charges)\b|\b(?:urgency|pressure|anxiety|scarcity|fomo)\b|\bpay(?:s|ing)?\s+(?:more|extra|additional)\b/i;
// 轨B：后果名词（EN）
const EFFECT_NOUN_EN = /\b(?:download|subscribe|subscription|sign[\s-]?up|sign[\s-]?in|register|account|charge[ds]?|billed?|payment|pay|paying|fee|price|pricing|plan|tier|service|order|checkout|purchase|renewal|renew|cancel(?:lation)?|unsubscribe|opt[\s-]?out|opt[\s-]?in|phone\s+call|call|waiting|period|day|days|counter|statistic|data|viewers?|people|number|visitors?|report|file|feature|content|discount|deal|offer|contacts?|information|details?)\b/i;

// obstruction 族的「动作对象」——被阻碍的选择动作本身。手段 + 动作对象
// 共现即完成阻碍陈述（腿③族内放宽，见主函数 obstructsAction）。
const OBSTRUCT_ACTION_ZH = /(继续订阅|取消订阅|退订|订阅|续费|注册|开通|购买|下单|支付|付款|确认|拒绝|接受|同意|继续|下一?步|下一?页|领取|下载|报名|参与)/;
const OBSTRUCT_ACTION_EN = /\b(?:accept|decline|deny|reject|cancel(?:l)?(?:ing|lation)?|unsubscribe|subscrib(?:e|ing|ption)|sign[\s-]?up|signing\s+up|opt[\s-]?out|opt[\s-]?in|continue|proceed|next|purchase|buy|buying|order|pay|paying|checkout|confirm|download|register|enroll(?:ing|ment)?)\b/i;

// ============ 豁免词表（命中即不判）============

// 豁免①：善意优化/透明设计在场——同构「流程×效果」句子但方向相反。
// r438 实证 B 样本（B1-B6、B9-B10）零误伤依赖这组。
const BENIGN_UX_ZH = /(减少(?:步骤|点击|操作|环节|流程)|简化(?:流程|步骤|操作)|明码标价|明示|金额一致|费用透明|同样显眼|一样显眼|入口(?:同样|明显|清晰|醒目)|随时(?:可以|都能)?(?:取消|退订|退出)|不收违约金|无障碍|对比度|文字标签|读屏|视障|可以跳过|都能?提交|真实有效|时间真实|到期(?:自动)?(?:结束|恢复)|不做了?就?(?:能|可以)?(?:取消|停))/;
const BENIGN_UX_EN = /\b(?:fewer\s+(?:steps|clicks|fields)|simplif(?:y|ied|ies|ying)\s+(?:the\s+)?(?:process|flow|steps|sign[\s-]?up)|streamlin(?:e|ed|es)|transparent\s+pricing|prices?\s+(?:is|are)?\s*(?:displayed|shown|listed)\s+upfront|no\s+(?:hidden|extra|additional)\s+fees?|just\s+as\s+(?:visible|prominent|easy)|equally\s+(?:visible|prominent|easy)|cancel\s+any\s?time|no\s+(?:penalty|fee|lock[\s-]?in)|accessib(?:le|ility)|screen\s?reader|contrast\s+ratio|clear\s+(?:label|labels|text|wording)|can\s+(?:be\s+)?skip(?:ped)?|optional|genuinely\s+ends?|actually\s+expires?)/i;

// 豁免②：教学/批评/监管转述——在讨论 dark patterns 这件事本身。
// r438 实证 B8「欧盟拟把十种操纵性设计列入黑名单」零误伤依赖这组。
const PEDAGOGY_ZH = /(黑名单|监管|立法|违[法反]|合规|整治|处罚|批[评判]|批判|谴责|曝光|揭露|点名|教材|论文|研究(?:表明|发现|指出).{0,12}(?:操纵|误导|欺骗)|界面(?:设计)?(?:伦理|道德)|用户(?:权益|体验)保护|consumer\s?protection|ethical\s+design|deceptive\s+design|dark\s?patterns?)/i;
const PEDAGOGY_EN = /\b(?:blacklist(?:ed|ing)?|regulat(?:e|ed|ion|or|ory)|illegal|unlawful|banned?|prohibit(?:ed|ion)?|law\s?suit|sued|fine[ds]?\b|penalt(?:y|ies)|critic(?:ism|ize|ized|al)|expos(?:e|ed|ure)|condemn(?:ed|s)?|textbook|paper|study|studies|research\s+(?:on|about|shows?|found)\b|ethics?|ethically|consumer\s+protection|user\s+(?:rights?|protection)|dark\s?patterns?|deceptive\s+design|manipulative\s+design|coercive\s+design|persuasive\s+design)/i;

// 豁免③：疑问/假设/方法论提问——「如果按钮做得不显眼会怎样」不是在
// 实施操纵，是在分析。
const HEDGE_ZH = /(如果|假如|假设|要是|倘若|若|试想|设想|是不是|会不会|难道|是否|为什么|凭什么|凭什么|凭什么|凭什么)[^。！？]{0,30}(?:会|能|该|怎么办|如何|怎么)/;
const HEDGE_EN = /^\s*(?:what|how|why|when|where|which|who)\b|\bwhat\s+(?:if|would|will|happens?)\b|\bif\s+(?:we|you|they|the\s+\w+)\s+(?:made|make|put|place|designed?|hidden?|showed?|shows?)\b/i;

// 豁免④：第一人称/自述工作汇报——「我把按钮改大了」是工作陈述，
// 不是操纵推荐。但注意与攻击样本的区分：攻击样本是「把 X 设计成 Y
// 从而 Z」的效果推荐形，自述形多无腿③效果陈述（由腿③本身把关）。
const FIRSTPERSON_ZH = /我(们)?(?:把|将|给|帮|替)?(?:改|调|换|做|设|加|减|写|画|布置|摆)/;

// 否定/禁止守卫：只在「整句级批评/禁止转述」时豁免——句首出现
// 「不要/不能这样设计」或在引号/教义语境里陈述「别这么干」。
// r438 实证修正：原版 NEGATION_ZH 收裸「不」导致「用户一看就不敢点」
// 的效果腿被误豁免（P1a 漏判根因）。否定守卫只认「否定词 + 设计动作」
// 或句首祈使形，不认效果描述里的「不」。
const NEGATION_ZH = /^(?:不要|不能|不该|不可|别|禁止|严禁|反对|拒绝|避免|杜绝|防范|切勿|请勿|请不)|(?:不要|不能|不该|千万别|切勿|请勿|严禁)(?:这样|这么|去|把|将|给)?(?:设计|做|搞|弄|设|写|摆|布置|隐藏|勾选|默认)|(?:设计|做|搞|弄)(?:时?)?(?:不要|不能|不该|千万别)/;
const NEGATION_EN = /^(?:don'?t|do\s+not|never|avoid)\b|\b(?:don'?t|do\s+not|should\s+not|shouldn'?t|must\s+not|mustn'?t|never)\s+(?:design|make|build|do|hide|pre[\s-]?check|force|trick|mislead|use)\b|\b(?:design|build|make)\w*\s+(?:should|must)\s+(?:not|never)\b/i;

// ============ 主函数 ============
function checkChoiceArchitectureManipulation(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t || t.length < 6) return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };

  // ---- 全句豁免早退 ----
  if (PEDAGOGY_ZH.test(t) || PEDAGOGY_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  if (BENIGN_UX_ZH.test(t) || BENIGN_UX_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  if (HEDGE_ZH.test(t) || HEDGE_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  // ---- 三腿判据 ----
  // 腿① 结构元素
  const hasStructure = STRUCTURE_ZH.test(t) || STRUCTURE_EN.test(t);
  if (!hasStructure) return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };

  // 腿② 操纵手段（五组任一组）
  const maneuverGroups = [];
  if (MANEUVER_HIDE_ZH.test(t) || MANEUVER_HIDE_EN.test(t)) maneuverGroups.push('hide_cost_or_subscription');
  if (MANEUVER_DISGUISE_ZH.test(t) || MANEUVER_DISGUISE_EN.test(t)) maneuverGroups.push('disguised_wording');
  if (MANEUVER_FORCE_ZH.test(t) || MANEUVER_FORCE_EN.test(t)) maneuverGroups.push('forced_action');
  if (MANEUVER_OBSTRUCT_ZH.test(t) || MANEUVER_OBSTRUCT_EN.test(t)) maneuverGroups.push('obstruction_or_misdirection');
  if (MANEUVER_FAKE_ZH.test(t) || MANEUVER_FAKE_EN.test(t)) maneuverGroups.push('fake_data_or_scarcity');
  if (maneuverGroups.length === 0) return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };

  // 腿③ 效果陈述（轨A 显式效果词 或 轨B 后果名词）
  const hasEffect = EFFECT_ZH.test(t) || EFFECT_EN.test(t) ||
                    EFFECT_NOUN_ZH.test(t) || EFFECT_NOUN_EN.test(t);
  // 族内效果放宽：obstruction 族的手段本身即效果——阻碍的承受者必须是
  // 「被阻碍的那个选择动作」在场（accept/cancel/subscribe/decline/opt
  // out/continue/next）。r438 实证修正：P6b「decline is a tiny gray
  // link」、P9b「cancelling requires a phone call and a waiting period」
  // 无任何显式效果词或后果名词，但「显著性错配/取消路径更长」作为手段
  // 已完成对选择动作的阻碍陈述。若句中无动作对象（孤立一句「按钮是
  // 灰色的」），仍走严格三腿，不判。
  const obstructsAction = maneuverGroups.includes('obstruction_or_misdirection') &&
    (OBSTRUCT_ACTION_ZH.test(t) || OBSTRUCT_ACTION_EN.test(t));
  if (!hasEffect && !obstructsAction) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  // 否定守卫（批评转述之外兜底）
  if (NEGATION_ZH.test(t) || NEGATION_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  const hits = 1;
  const score = 0.72;
  const severity = 72;
  const details = '选择结构操纵(' + maneuverGroups.join(',') +
    '；结构元素×操纵手段×效果陈述三腿共现——界面结构层 dark pattern 族：' +
    '隐瞒成本/伪装选项/强迫行动/误导阻碍/伪造数据，采信前需核对是否为设计推荐)';

  return { score, hits, severity, details, subFamilies: maneuverGroups };
}

module.exports = {
  checkChoiceArchitectureManipulation,
  // 常量导出供负例注入测试逐项验证承重（防空转常量）
  STRUCTURE_ZH, STRUCTURE_EN,
  MANEUVER_HIDE_ZH, MANEUVER_HIDE_EN,
  MANEUVER_DISGUISE_ZH, MANEUVER_DISGUISE_EN,
  MANEUVER_FORCE_ZH, MANEUVER_FORCE_EN,
  MANEUVER_OBSTRUCT_ZH, MANEUVER_OBSTRUCT_EN,
  MANEUVER_FAKE_ZH, MANEUVER_FAKE_EN,
  EFFECT_ZH, EFFECT_EN,
  EFFECT_NOUN_ZH, EFFECT_NOUN_EN,
  OBSTRUCT_ACTION_ZH, OBSTRUCT_ACTION_EN,
  BENIGN_UX_ZH, BENIGN_UX_EN,
  PEDAGOGY_ZH, PEDAGOGY_EN,
  HEDGE_ZH, HEDGE_EN,
  NEGATION_ZH, NEGATION_EN,
};
