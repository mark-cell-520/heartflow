/**
 * src/agency-deflection.js — 责任转嫁抽象系统检测器
 *
 * v6.8.0 之后新增第 59 个判别维度（心虫 decision 本体选出，探测器实测 8/10 漏判）。
 *
 * 辨别的族：「把责任/决定权转嫁给算法、系统、流程、模型等非人主体，
 * 从而回避具体决策者与可追责对象」。
 *   攻击样本（形状描述，原文见 test/round-478-agency-deflection.test.js）：
 *     · 抽象主体 × 自主判定动词：算法自动判定的结果 / 系统自己做的决定 /
 *       流程自动执行的 / 模型生成的答案（中文，含英文同族）
 *     · 抽象主体 × 责任否认：出问题也不是我们的责任 / 你找算法说理去 /
 *       nobody is responsible / no one to hold accountable
 *     · 责任悬空短语（无抽象主体也算）：不存在谁在主导 / 无人主导
 *
 * 为什么现有 58 个维度拦不住：
 *   · soft_deflection 管「软话术转移话题」，这一族是**归责转移**——
 *     句子给出了明确"原因"（是算法干的），不是含糊其辞。
 *   · unsupported_claim 管「无依据断言」，这类句子不需要证据，
 *     它的问题在责任主体被置换。
 *   · bad_faith / presupposition 管论证诚意与隐含前提，
 *     不管"谁该负责"这一层。
 *   · 实测 10 条攻击样本 8 条 gate=pass，命中维度只有 contradiction /
 *     gate_block 各1条，本族维度零覆盖。
 *
 * 判据（两类交叉，任一成立即命中）：
 *   C1 抽象主体 —— 算法/系统/流程/模型/平台/机器/脚本/自动化/数据/AI
 *       × the algorithm/the system/the model/the pipeline/automation...
 *   C2 归责回避 —— 自主判定动词（自动判定/自行决定/acted autonomously）、
 *       责任否认（不是我们的责任/不关我们的事/nobody is responsible）、
 *       责任悬空（不存在谁在主导/无人主导）
 *   → rewrite 级：必须把责任落回具体的人或团队，说明谁来决策、谁可追责。
 *
 * 明确不判的（这些是合法陈述）：
 *   · 有人工复核/审批归责：算法只是辅助，最终决定由编辑人工做出
 *   · 留痕可追溯：每一次自动处理都记录了操作人
 *   · 自动化提效而非归责：自动化测试让回归从两小时缩短到十分钟
 *   · 中性描述算法职责边界：推荐算法只负责排序，上不上线由编辑部决定
 */

'use strict';

// ─── C1: 抽象（非人）主体 ───────────────────────────────
// 中文：把主体指向机器/流程/数据的名词
const AGENT_ZH = /算法|系统|程序|流程|模型|平台|机器|脚本|自动化|接口|表单|软件|数据库|规则引擎|智能体|人工智能|\bAI\b|大数据|数据(?![的]库?库)|这套?体系|整套?机制/;
// 英文：限定词 + 抽象主体（允许中间有最多两个形容词：the automated pipeline /
// the machine learning model）。人类责任豁免见下方 HUMAN_ACCOUNTABILITY_*，
// 故 AGENT 侧可放宽——命中仍须与 C2 归责回避交叉才判定，单独出现不判。
const AGENT_EN = /\b(?:the\s+(?:\w+\s+){0,2}(?:algorithm|system|model|pipeline|process|bot|script|platform|software|engine|machine|automation|rules?\s+engine)|an?\s+(?:\w+\s+){0,1}(?:algorithm|automated\s+(?:system|process|pipeline))|\bAI\b)/i;

// ─── C2: 归责回避 ───────────────────────────────
// C2a 自主判定动词：抽象主体"自己"做了决定
// EN 侧 "cannot override" 形：句中出现「无法被人推翻」的被动语态即命中——
// 无论主语是 the automated pipeline 还是 our classifier。
// 判据边界：/cannot\s+(?:be\s+)?overrid(?:e|den)/ 已覆盖 cannot override /
// cannot be overridden / can't override 三者，与 C1 交叉使用，不单独判。
const DEFLECT_AUTO_ZH = /(?:自动|自行|自主|独立)(?:判定|决定|决策|做出|执行|生成|处理|选择|拒绝|批准|评分|判断|完成|触?发|放行|驳回|拦截)|(?:算法|系统|程序|流程|模型|平台|机器|脚本|智能体)\s*(?:自己|自动|自行)?\s*(?:算|判|定|选|做)的?(?:结果|决定|结论|选择)|自己(?:做|定)的?决定/;
const DEFLECT_AUTO_EN = /\b(?:made|makes|made up|chose|choose|decided|decides|decided on its own|acted|acts)\b[^.]{0,40}\b(?:on its own|autonomously|by itself|independently)|(?:the\s+\w+)\s+(?:decided|chose|acted|made the (?:decision|choice|call))\b[^.]{0,30}\b(?:autonomous|on its own|by itself)|\bautonomous(?:ly)?\b|\b(?:cannot|can'?t)\s+(?:be\s+)?overrid(?:e|den)\b|\bno\s+override\b|\bno\s+human\s+(?:can|could)\s+(?:override|overrule|stop)\b/i;

// C2b 责任否认：把责任推离人类主体
// （形状描述，原文见测试文件：抽象主体在场的责任否认句式）
const DEFLECT_DENY_ZH = /(?:不(?:是|关|属于)(?:我们|我|公司|企业|团队|组织|人|任何)?(?:的)?(?:责任|事|过错|错|问题|失误)|(?:我们|我|公司|团队|组织)(?:也)?没有(?:任何)?(?:责任|过错|义务)|找\s*(?:算法|系统|程序|流程|模型|平台|机器|数据|AI|它|它们)\s*(?:说理|负责|要去|算账)|要怪就怪|怪不得(?:我们|任何人)|错不(?:在|归)\s*(?:我们|任何人|人)|责任不在(?:我们|任何人)|无人(?:负责|担责|需要负责)|没有?(?:任何)?人(?:需要)?(?:为此)?负责|不存在谁(?:在)?(?:主导|负责|决定)|没有?(?:任何)?人(?:在)?(?:主导|操控|控制)|不是(?:人为|谁)(?:的)?(?:决定|主导|控制|操作)|轮不到(?:任何人)?(?:来)?(?:负责|担责)|跟(?:我们|任何人)(?:没有)?关系)/;
const DEFLECT_DENY_EN = /\b(?:not|isn'?t|is\s+not)\s+(?:my|our|their|anyone'?s|anybody'?s|the\s+(?:company|team|organization))\s+(?:fault|responsibility|call|problem)\b|\b(?:nobody|no\s+one|no-one)\s+(?:is\s+)?(?:responsible|accountable|to\s+blame|at\s+fault)\b|\bnot\s+(?:me|us)\b|\btake\s+(?:it|this|that)\s+up\s+with\b|\bnobody\s+to\s+(?:hold|blame)\b|\bnothing\s+(?:we|you|they)\s+can\s+do\b|\bno\s+one\s+(?:is\s+)?(?:making|made)\s+(?:the\s+)?(?:decision|call)\b/i;
// 英文单独支（无需 AGENT 在场）：只收"无人可追责"形
// nobody is responsible / no one to hold accountable / nobody accountable /
// there is no one who decided —— 责任悬空本身就是攻击。
const DEFLECT_DENY_EN_ALONE = /\b(?:nobody|no\s+one|no-one)\s+(?:is\s+)?(?:responsible|accountable|to\s+blame|at\s+fault)\b|\bnobody\s+to\s+(?:hold|blame)\b|\b(?:there\s+is\s+)?no\s+one\s+(?:is\s+)?(?:making|made|who\s+made)\s+(?:the\s+)?(?:decision|call|choice)\b|\bno\s+one\s+to\s+(?:hold|blame|hold)\b/i;

// ─── 豁免：句中落到具体人类的责任/监督行为 ───────────────────
// 判据边界：只要出现具体的人类责任主体或人工监督动作，本族不判。
// 这些词是正常的人机分工陈述的标记，不是归责转移。
// （中文侧与英文侧分开：中文白话另有「人来/由人」等形）
const HUMAN_ACCOUNTABILITY_ZH = /人工|本人|工程师|编辑|值班|专人|责任到人|人来|由人|由(?:具体)?(?:的)?人|人来(?:决策|拍板|决定|把关)|人工(?:复核|审核|决定|确认|批准|拍板|介入|把关)|最终由|最后(?:由|靠)(?:人|编辑|负责人)|(?:由|受)\s*(?:团队|部门|负责人|值班人员)\s*(?:负责|决定|审批)/;
// [v6.8.6 第488轮] HUMAN 限定为**人类责任动词在场**，不收裸 human——
// 实测「... without any human reading it」这类"无人读过"正是本族攻击形，
// 裸 \bhuman\b 会把攻击句整体赦免（E1 组 1 条穿透即此因）。
// 判据：human + 复核/批准/决定/监督/负责类动词同现才算责任落回人类。
const HUMAN_ACCOUNTABILITY_EN = /\bhuman\s+(?:review(?:er|ed|ing)?|approv\w+|overse\w+|supervis\w+|oversight|accountab\w+|responsib\w+|involve\w+|sign-?off|decid\w+|was\s+(?:involved|responsible|accountable)|read\s+the\s+\w+)\b|by\s+hand|manual(?:ly)?|engineer|reviewer|approver|on-?call|sign-?off|named|who\s+(?:approved|decided|made)|\bteam\s+decided/i;

// ─── T4（第488轮新增）：第一人称无权力/被移交 × 责任否认 ───────────
// 此前零覆盖的新句式族。形状描述，样本见 test/round-488-*.test.js：
//   · 中文「无权力形」：我们无权干涉 / 我们被取消了修改权限 /
//     没有上级授权，我们什么都不能决定 / 我们只是执行层，没有权力叫停 /
//     我们也很无奈，只能这样处理 / 出了什么问题我们也只能配合，改变不了什么
//   · 中文「推诿落点形」：这件事轮不到我们管 / 后续处理不归我们管 /
//     这块业务现在不由我们负责 / 这个责任落不到我们头上 / 你找错对象了
//   · 英文「第一人称无权力形」：We had no say / not the ones who configured /
//     taken out of our hands / sits with the system / just following the process /
//     made above my level / escalated to the algorithm
// 与既有 T1(自主判定)/T2(责任否认) 的分界：T2 收显式的责任否认句式
// （不是我们的责任），本族收**能力剥夺与责任上推**——主体不是否认
// 责任存在，而是宣称自己没有决策权，借此让责任悬空。
// T4_ZH_POWERLESS：第一人称在场 × 无权力/只能配合（跨句短距）
// [第488轮调参] 允许中间出现逗号/顿号——「我们只是执行层，没有权力叫停」
// 这类流水句主语与能力否认之间常有停顿，限定 。；？！ 三个终止符。
const T4_ZH_POWERLESS = /(?:我们|咱|我|我方|本(?:部门|团队|公司)|本人)[^。；？！]{0,10}(?:也无权|无权|没有?权力|没权力|没有?权限|无权限|无权(?:干涉|干预|介入|过问|决定|处理)|插不上手|说不上话|什么都不能决定|什么都决定不了|什么都做不了|无能为力|爱莫能助|只能配合|只能执行|只能服从|只能这样|改变不了|做不了主|被取消(?:了)?(?:的)?(?:修改)?权限|很无奈)/;
// T4_ZH_SHIRK：责任落点被推离本主体（不需要无助词在场）
const T4_ZH_SHIRK = /(?:轮不到|不归|不由|不属于|用不着|不需要)(?:我们|我|我方|咱|本(?:部门|团队|公司))?(?:来|去)?(?:管|负责|决定|处理|过问|操心|插手|担责)|(?:责任|过错|问题|锅|账|这(?:事儿|事|摊子))(?:落|算|归|记|推)(?:不|没|未)?(?:到|在|归|上)(?:我们|我|我方|任何人|谁)?(?:任何(?:人|的))?(?:人|方)?(?:的)?(?:头|身)上|别再来(?:问|找|联系|骚扰)|你?(?:找|问)错(?:了)?(?:对象|人|地方|部门)/;
// [第488轮补支] 被动移交形：「决定已由模型产出并同步给你了」——决定/结论
// 由抽象主体产出并告知用户，没有任何自主判定动词在场。
const T4_ZH_PASSIVE = /(?:决定|结论|结果|判定|通知|回复|邮件|处理意见|答复)(?:已经|已|系|是)?(?:由|被)(?:系统|算法|程序|流程|模型|平台|机器|脚本|智能体|接口|自动)(?:自动|自行|批量|直接)?(?:产出|生成|做出|作出|下发|发出|通知|同步|反馈)|(?:邮件|通知|回复|答复|告知|短信)(?:已经|已|系|是)?(?:系统|算法|程序|流程|模型|平台|机器|脚本|智能体)(?:自动|自行|批量|直接)?(?:发出|下发|推送|发送|生成|告知)/;
const T4_ZH_DENY_ACT = /(?:没有|无|未被)(?:上级|领导|上边)(?:的)?授权|没有?任何(?:权限|权力)(?:决定|修改|干预)|(?:被|受)(?:上|上级)(?:级|面)(?:直接)?(?:接管|接管|接管了)?/;

// ─── [v6.8.7 第490轮] T5：归责归零族 ───────────────────────────
// 此前零覆盖的新句式族。形状描述，样本见 scripts/round-490-t5-probe*.js：
//   · 责任名词直接落到抽象主体：「责任在系统那边」「锅是平台背」
//   · 决策权/话语权归属被宣告归零：「决策权在算法手里」
//   · 抽象主体产出 × 第一人称只执行：「模型给出的结果，我们只是照单执行」
//   · 制度/流程限定 × 第一人称无选择：「公司制度办的，个人没有选择空间」
//   · 英文同族：the algorithm made the call / blame lies with the system /
//     the platform absorbs the blame / just following the automated process
// 与 T4 的分界：T4 收**能力剥夺**（我无权/被移交），本族收**责任归属被
// 宣告为零**——句子不讨论说话者有没有权力，而是直接把责任/决策权的
// 落点从人类整体挪走（责任在系统、锅是平台的）。
// 与 C1×C2 的分界：C2a 需要自主判定动词在场；本族只需责任名词 +
// 抽象主体同现，不问是否有「自动」二字。
const T5_ZH_BLAME = /(?:责任|过错|锅|账|问题|失误|黑锅)(?:都|全|就|要)?(?:在|归|落|算|怪|是)(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据|它|它们)(?:那|这|里|边|上|方面|中)?|怪(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据)|(?:系统|算法|程序|流程|模型|平台|机器|脚本|数据)(?:背|扛|担)(?:锅|责|责任|过错|黑锅)|(?:决策权|决定权|权力|话语权|裁决权)(?:都|全)?(?:在|归|属)(?:算法|系统|程序|流程|模型|平台|机器|脚本)(?:手里|手中|那边|这方面)?/;
// 抽象主体产出 × 第一人称沦为无意志传递环节
const T5_ZH_EXEC = /(?:系统|算法|程序|流程|模型|平台|机器|脚本)(?:给出|产出|生成|输出)(?:的)?(?:结果|决定|结论|指令|答案)?[^。；？！]{0,12}(?:我|我们|个人|大家)(?:只是|只能|不过是|不过是)?(?:照单|照做|执行|接受|服从|传话)|自动(?:化)?流程[^。；？！]{0,14}(?:个人|任何人|谁|大家)(?:只能|不得不|必须)(?:接受|服从|接受)|(?:系统|算法|程序|流程|模型|平台)(?:说|让|要)[^。；？！]{0,12}(?:我|我们|个人)(?:就)?(?:照|只|按)/;
// 制度/流程限定 × 第一人称无选择空间（"我也没办法"式归责归零）
const T5_ZH_NULLIFY = /(?:我|我们|个人|自己)(?:也)?(?:没有|毫无|根本没)(?:任何)?(?:办法|能力|选择|余地|决定权|话语权|置喙)|(?:这是|都是|按|照)?(?:公司)?(?:制度|流程|规定|章程)(?:办的|走的|要求的|定的)[^。；？！]{0,15}(?:我|个人|我们|谁)(?:也)?(?:没|不)(?:有)?(?:任何)?(?:办法|选择|空间|余地|发言权)/;
const T5_EN = /\b(?:the\s+)?(?:algorithm|system|model|pipeline|process|platform|bot|automation)\s+(?:made|owns|holds|makes)\s+(?:the\s+)?(?:call|decision|power|choice)\b|\bnot\s+any\s+(?:person|individual|human)\s+(?:here|involved|at\s+fault)\b|\bblame\s+(?:lies\s+)?(?:on|with)\s+(?:the\s+)?(?:system|algorithm|automation|platform)\b|(?:system|algorithm|platform|automation)\s+absorbs?\s+(?:the\s+)?blame\b|just\s+(?:following|following)\s+(?:the\s+)?(?:automated\s+)?(?:process|system|algorithm|its\s+output)\b|\bno\s+(?:human|person)\s+(?:has\s+)?(?:any\s+)?(?:say|choice|control)\b/i;

// T4_EN_POWERLESS：第一人称无权力/被移交（单独成立，见 CONSTRUCTIVE 豁免）
// [第489轮补支] 隐私/合规保护豁免：权限限制是在保护用户数据（隐私设计、
// 数据保护规定、脱敏等），这类能力边界说明不是责任上推。
const T4_EN_POWERLESS = /\b(?:we|i|my|our)\s+(?:team|department|group|side)?\s*(?:had|have|has|\'?ve)?\s*(?:no\s+say|no\s+control|no\s+authority|no\s+power|no\s+input|no\s+influence|no\s+ability)\b|\b(?:were|was|been)\s+(?:not|never)\s+(?:the\s+ones?\s+who|consulted|asked|involved)\b|\b(?:were|was|been)\s+not\s+the\s+ones?\s+who\b|\b(?:taken|took|take|taking|removed|move|moved|moving)\s+(?:it\s+|this\s+|that\s+|the\s+\w+\s+)?out\s+of\s+(?:our|my)\s+hands\b|\b(?:sits?|rests?|lies|sits)\s+with\s+the\s+(?:system|algorithm|pipeline|process|platform|bot|engine)\b|\b(?:made|decided|approved|signed)\s+above\s+my\s+level\b|\b(?:above|beyond)\s+my\s+pay\s+grade\b|\b(?:i|we)\s+(?:was|were)\s+just\s+(?:follow|following|execut\w+|obey\w+)\b|\b(?:i|we)\s+only\s+(?:execut\w+|follow\w+|obey\w+)\b|\bno\s+(?:single\s+)?(?:individual|person|human)\s+(?:was|is|were)?\s*(?:involved|responsible|accountable)\b|\b(?:escalat\w+|defer\w+|delegat\w+|hand(?:ed)?|pass(?:ed)?|push(?:ed)?|forward(?:ed)?|reassign\w+)\s+(?:it|this|that|the\s+\w+(?:\s+\w+){0,2}|your\s+\w+)\s+(?:up\s+)?to\s+(?:the\s+)?(?:algorithm|system|model|pipeline|process|bot|script|platform|engine)\b|\b(?:was|were|been|is|are)\s+(?:escalat\w+|defer\w+|delegat\w+|hand(?:ed)?|pass(?:ed)?|forward(?:ed)?|reassign\w+|rout\w+|sent)\b[^.]{0,40}\bto\s+(?:the\s+)?(?:algorithm|system|model|pipeline|process|bot|script|platform|engine)\b/i;

// ─── 建设性出路豁免：句子给出了可执行的下一步（谁去找、怎么推进）──────
// [第489轮补支] 隐私/合规保护豁免：权限限制指向用户数据保护时是正当的
// 能力边界说明（隐私设计/不得查看聊天记录/数据脱敏/合规要求），
// 不是把责任转嫁给抽象主体的上推话术。
const T4_PRIVACY_GUARD_ZH = /隐私|脱敏|数据保护|合规|授权(?:目的|范围)|最小(?:必要)?权限|不得查看|不能查看|无权查看|无权访问|保密|加密存储|只读(?:自身|自己)数据/;
const T4_PRIVACY_GUARD_EN = /\bprivacy\b|\bpurpose of (?:the )?(?:protection|consent|processing)\b|\bdata protection\b|\bcompliance (?:with|requirement)\b|\bleast privilege\b|\bminimal access\b|\bcannot (?:view|access|read) (?:your |the )?(?:chat|message|conversation|personal|user)\b|\bfor (?:your |user )?(?:privacy|security)\b|\bdata minimi[sz]ation\b|\bGDPR\b|\bmasked\b/i;
// 判据边界：无助/无权力形本身是中性的陈述（确实没权限是常见情况），
// 只有当它被用来**终止追责**而不是推进解决时才判。出现建设性出路
// 即视为正当的能力边界说明。
const T4_CONSTRUCTIVE_ZH = /帮你(?:联系|转接|反馈|转达|确认|核实|问)|可以帮你|替你(?:联系|问|反馈)|建议你(?:联系|找|直接)|我(?:来)?帮你|已(?:经)?帮你|已经?将|已(?:上报|升级|转交|反馈)|协助你(?:联系|处理)|随时(?:可以)?(?:联系|找)/;
const T4_CONSTRUCTIVE_EN = /\b(?:escalat\w+|forward\w+|pass\w+|referr?\w+|connect(?:ing)?)\s+(?:it|this|that|your\s+\w+|you)\s+to\b|\bconnect\s+you\s+(?:to|with)\b|\brefer(?:ring)?\s+you\s+to\b|\bcan\s+help\s+you\b|\bwill\s+assist\s+(?:you|with)\b|\bon\s+your\s+behalf\b|\braised\s+it\s+with\b|\blet\s+me\s+(?:check|find|ask|connect|escalate)\b|\bhere\s+is\s+(?:who|how)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkAgencyDeflection(text) {
  if (!text || text.length < 4) return { hit: false, score: 0, detail: '' };

  // 句中已把责任落回具体人类（人工复核/审批/留痕到人）→ 不是归责转移
  if (HUMAN_ACCOUNTABILITY_ZH.test(text) || HUMAN_ACCOUNTABILITY_EN.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  // [v6.8.6 第488轮] T4：第一人称无权力/被移交 × 责任悬空
  // 放在 HUMAN_ACCOUNTABILITY 之后：句中已落回具体人类责任的不判。
  // 建设性出路豁免（帮你联系/已上报/escalated to X 等）也在此层——
  // 无助陈述给出可执行下一步时是正当的能力边界说明。
  const _constructive = T4_CONSTRUCTIVE_ZH.test(text) || T4_CONSTRUCTIVE_EN.test(text);
  // [第489轮补支] 隐私/合规保护豁免：权限限制指向用户数据保护（隐私设计、
  // 不得查看聊天记录/脱敏/数据保护规定）——这是正当能力边界，不是责任上推。
  const _privacyGuard = T4_PRIVACY_GUARD_ZH.test(text) || T4_PRIVACY_GUARD_EN.test(text);
  if (!_constructive && !_privacyGuard) {
    if (T4_ZH_POWERLESS.test(text)) {
      return { hit: true, score: 0.7, detail: '责任转嫁(自称无权力/无能为力)' };
    }
    if (T4_ZH_SHIRK.test(text)) {
      return { hit: true, score: 0.7, detail: '责任转嫁(把责任推离本主体)' };
    }
    if (T4_ZH_PASSIVE.test(text)) {
      return { hit: true, score: 0.7, detail: '责任转嫁(决定被动移交抽象主体)' };
    }
    if (T4_EN_POWERLESS.test(text)) {
      return { hit: true, score: 0.7, detail: '责任转嫁(否认第一人称决策权)' };
    }
    // [v6.8.7 第490轮] T5：归责归零族（责任/决策权落点被宣告归零）
    if (T5_ZH_BLAME.test(text) || T5_ZH_EXEC.test(text) ||
        T5_ZH_NULLIFY.test(text) || T5_EN.test(text)) {
      return { hit: true, score: 0.7, detail: '责任转嫁(归责归零：落点被宣告为抽象主体)' };
    }
  }

  // C2b（责任否认/悬空）单独成立即可命中——
  // 「不存在谁在主导」这类句不需要抽象主体在场，本身就是责任悬空
  if (DEFLECT_DENY_ZH.test(text)) {
    return { hit: true, score: 0.8, detail: '责任转嫁/悬空(责任否认)' };
  }
  // 英文侧单独成立：nobody is responsible / no one to hold accountable
  // 不需要抽象主体在场——责任悬空本身就是本族攻击形状。
  // 边界：not my fault / not us 这类短语太宽（"我没错"在日常生活中
  // 也成立），故英文单独支只收"无人可追责"形（nobody / no one），
  // 不收第一人称否认形（那需要 AGENT 交叉，见下）。
  if (DEFLECT_DENY_EN_ALONE.test(text)) {
    return { hit: true, score: 0.8, detail: '责任转嫁/悬空(nobody accountable)' };
  }

  // C1 × C2 交叉
  const agent = AGENT_ZH.test(text) || AGENT_EN.test(text);
  if (!agent) return { hit: false, score: 0, detail: '' };

  if (DEFLECT_AUTO_ZH.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(自主判定)' };
  }
  if (DEFLECT_AUTO_EN.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(autonomous decision)' };
  }
  // 抽象主体 × 第一人称责任否认：「not my responsibility / we can't override it」
  if (DEFLECT_DENY_EN.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(deny with subject)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkAgencyDeflection };
