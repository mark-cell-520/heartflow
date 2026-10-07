/**
 * src/exclusive-trust.js — 「虚假排他信任」检测器（第 90 个判别维度）
 *
 * [v6.9.0] 第 581 轮立项、第 582 轮收口。候选来源：r581 家族探针（famprobe
 * 四族实测全零误伤）+ decision 本体两轮裁决，落盘 /tmp/hf-r581-decide2.out。
 * 复测：scripts/round-581-c-scale.js —— 20 条攻击样本 11 条零命中穿过硬闸门，
 * 3 条良性对照 0 误伤。
 *
 * 辨别的族：「虚假排他信任」——把「信任」与「核验」对立成互斥二选一，
 * 用「要么全信、要么视为敌对」取消「有条件信任」这个合法中间态。
 * 典型形状：信任互斥宣告 × 核验污名化。它不是真的在讨论信任，
 * 而是在**撤掉对方核查的权利**。
 *
 * 为什么现有维度拦不住（r581 归因实测 scripts/round-581-c-scale.js）：
 *   20 条样本 11 条穿门时 findings 维度全为 none；已被其他维度拦下的 9 条
 *   归因分别是 induced_trust / scrutiny_evasion / moral_foundations /
 *   perfect_error / loyalty_test / complexity_shield / contradiction /
 *   fallacies / paternalistic_decide ——逐条核对：
 *   · scrutiny_evasion 管「把监督要求定性为人际猜疑」，本族的招牌是
 *     **互斥逼选**（「要么全信要么走人」），即使完全没有人际猜疑措辞也成立；
 *   · induced_trust 管「要求盲目信任」，本族不必要求信任任何人，
 *     只要求对方放弃核验动作；
 *   · false_dilemma 管「排除第三选项」的一般形式，本族的第三选项是
 *     特指的「有条件信任/边信边查」，且第二腿必须是核验污名化，
 *     单凭二选一句式不成立（见 G2 看守）。
 *
 * 判据（两条腿都在即成立）：
 *   · A1 信任互斥宣告：要么全信 / 要么视为敌对或不合作，不存在中间态；
 *   · A2 核验污名化：查证、要凭证、问细节、复核被定性为不信任/见外/伤人。
 *   · A1 × A2 = verify 级：把核验义务取消掉了，必须先补充可核验依据再决策。
 *
 * 明确不判的（看守 G1-G5）：
 *   · G1 审计/内控的正当边界声明：按流程、制度、规章复核（不涉及人身信任定性）；
 *   · G2 一般性二选一（不含核验腿）：选供应商、选方案等合理择优表述；
 *   · G3 分类分级的信息管控：按密级/权限/保密制度管理信息，非针对个人忠诚；
 *   · G4 无条件授权的范围界定：为特定任务划定决策范围，未取消全部核查权；
 *   · G5 反思性陈述：承认自己曾要求无条件信任，或分析这种结构的问题。
 *
 * [v6.9.0 r582 实现纪律] 所有正则源串一律走 String.raw：
 * r581 的教训是单反斜杠写进普通单引号字符串（'\s' → 's'、'\b' → 退格），
 * 磁盘文本"看起来正确"而运行时值全错，探针 8/8 全 miss 才暴露。
 * String.raw 让磁盘字节与运行时 source 逐字符一致，杜绝这一层。
 */

'use strict';

// ─── A1: 信任互斥宣告（要么全信要么视为敌对/不合作）────────────────
// 三组形状：① 「要么…要么…」二元框架  ② 「没有中间地带/没有商量」
//          ③ 质疑/核查即定性为不信任（质疑污名直接腿）
const EXCLUSIVE_ZH = new RegExp([
  // ① 「要么完全…要么就是敌人」
  String.raw`(?:要么|或者|要不然|不然)(?:[^。；，,]{0,12})(?:完全|彻底|无条件|百分百|死心塌地)(?:[^。；，,]{0,8})(?:相信|信任|信|服从|跟|跟着|站)`,
  String.raw`(?:完全|彻底|无条件|百分百)(?:[^。；，,]{0,6})(?:相信|信任|服从|跟着我|跟着我们)(?:[^。；，,]{0,14})(?:要么|要不然|不然|否则)(?:[^。；，,]{0,10})(?:敌人|对手|敌|对立|滚|出去|再见|免谈|没得商量|另请|另找|换人|散伙)`,
  // ② 明确取消中间态
  String.raw`(?:没有|不存在|不存在什么|谈不上)(?:[^。；，,]{0,6})(?:中间|折中|过渡|缓冲)(?:[^。；，,]{0,6})(?:地带|状态|余地|空间|选项|路线)`,
  String.raw`(?:不|没什么|不存在)(?:[^。；，,]{0,4})(?:折中|中间|骑墙|半信半疑|边信边查)`,
  String.raw`(?:只有|就只有)(?:两种|两个|两类)(?:选择|选项|状态|立场|可能)`,
  // ③ 核验动作被定性为不信任本身（质疑污名直腿）
  String.raw`(?:怀疑|质疑|查证|核查|复核|审计|查账|审|验|核|问|打听|过问|干预|追问|要凭证|看材料)(?:[^。；，,]{0,10})(?:就是|便是|等于|说明|代表|意味着)(?:[^。；，,]{0,10})(?:不|没|别)(?:[^。；，,]{0,4})(?:相信|信任|信|当自己人|见外|拿我当|把我当)`,
  String.raw`(?:就是|便是|等于)(?:[^。；，,]{0,10})(?:不|没)(?:[^。；，,]{0,4})(?:相信|信任)(?:我|我们|你|你们)`,
  // 「信不过/不信我就别用我」
  String.raw`(?:信不过|不相信|不信任|信不着)(?:[^。；，,]{0,8})(?:就|那就|那您|那你)(?:[^。；，,]{0,10})(?:别|不用|不要|另请|找别人|另找|换人|散伙|合作|谈)`,
  // ① 的反向语序：跟了我就不该再有自己的判断
  String.raw`(?:跟着|跟着我|既然跟着|选择了|既然选择|既然委派|既然把)(?:[^。；，,]{0,10})(?:就|就不该|就不该再|就不能|就不必|无须|不必)(?:[^。；，,]{0,14})(?:有|再|抱|存)(?:[^。；，,]{0,8})(?:自己|独立|个人|别的|其他)(?:[^。；，,]{0,6})(?:判断|看法|主见|想法|疑虑|意见)`,
  // 提问/追责与忠诚挂钩：自己人不查账
  String.raw`(?:自己人|家里人|咱们|咱们之间|兄弟|朋友|熟人|内部)(?:[^。；，,]{0,6})(?:从来不|从不会|不需要|不用|不兴|不谈|不说)(?:[^。；，,]{0,6})(?:查|审|核|验|问|计较|见外|客气|讲证据|要凭证)`,
  String.raw`(?:要|需要|讲究|讲)(?:[^。；，,]{0,4})(?:凭证|证据|手续|流程|文件|票据|合同)(?:[^。；，,]{0,8})(?:就是|便是|等于)(?:[^。；，,]{0,6})(?:见外|生分|不信任|把我当|拿我当)`,
].join('|'));

// ─── A1③: 核验/质疑动作被直接定性为不信任（独立成立的完整攻击形状）──
// 与 EXCLUSIVE_ZH ①② 的分界：①② 是「全信 vs 敌对」的互斥逼选，需要 A2
// 核验对象腿配合；③ 本身就把核验动作取消掉了，单独即成立。
// 与「为什么不信我」这类纯情绪质疑的分界：③ 要求被污名的是**核验动作**
// （查/审/核/问/质疑/要凭证），不是情绪或态度本身。
const STIGMA_ZH = new RegExp([
  // 核验动词 × 「就是不信任/见外/把自己人」互斥定性
  String.raw`(?:怀疑|质疑|查证|核查|复核|审计|查账|审|验|核|问|打听|过问|干预|追问|要凭证|要证据|看材料|对账|验货|验收)(?:[^。；，,]{0,10})(?:就是|便是|等于|说明|代表|意味着)(?:[^。；，,]{0,10})(?:不|没|别)(?:[^。；，,]{0,4})(?:相信|信任|信|当自己人|见外|拿我当|把我当|自己人)`,
  // 核验动词 × 「不把我当自己人 / 把我当外人」（含「一家人/自己人」引述）
  String.raw`(?:查|审|核|验|问|计较|见外|客气|讲证据|要凭证)(?:[^。；，,]{0,8})(?:就是|便是|等于)(?:[^。；，,]{0,8})(?:不|没|别)(?:[^。；，,]{0,6})(?:自己人|一家人|家里人|兄弟|朋友|内部人|当自己人|见外|生分|客气)`,
  // 「你（再）核就是把我当外人」语序（核验动词前置在句首亦可）
  String.raw`(?:你再|你还|你居然|你竟然)(?:[^。；，,]{0,6})(?:核|查|审|验|问|计较|客气|讲证据)(?:[^。；，,]{0,10})(?:就是|便是|等于)(?:[^。；，,]{0,8})(?:外人|不信任|见外|生分|没把我|不把我)`,
  // 质疑连坐团队/集体：「质疑 X 就是不信任 Y」
  String.raw`(?:怀疑|质疑|查证|核查|复核|审计|查账|审|验|核|问|打听|过问|干预|追问|要凭证|要证据)(?:[^。；，,]{0,12})(?:就是|便是|等于)(?:[^。；，,]{0,10})(?:不|没|别)(?:[^。；，,]{0,6})(?:相信|信任)(?:团队|集体|组织|公司|我们|大伙|大家)`,
  // 「真正的信任不需要查证」类：信任定义与核验互斥
  String.raw`(?:真正|真正意义上|百分之百|完全)(?:的)?(?:信任|相信|忠诚|感情|交情)(?:[^。；，,]{0,8})(?:不|没|无需|无须|不需要|用不着)(?:[^。；，,]{0,4})(?:需要|要|用得着|谈得上)(?:[^。；，,]{0,6})(?:查证|查|审|核|验|质疑|怀疑|证明|凭证|证据|解释|说明)`,
  String.raw`(?:信任|忠诚|感情|交情)(?:[^。；，,]{0,8})(?:是|本该|应该)(?:[^。；，,]{0,6})(?:不需要|无须|无须乎|不靠)(?:[^。；，,]{0,6})(?:查证|查|审|核|验|质疑|怀疑|证据|凭证|证明|解释)`,
  // 「自己人从来不查账」：自己人身份与核验动作互斥
  String.raw`(?:自己人|家里人|咱们|咱们之间|兄弟|朋友|熟人|内部|信得过的人)(?:[^。；，,]{0,8})(?:从来不|从不会|不需要|不用|不兴|不谈|不说|不问|不讲)(?:[^。；，,]{0,8})(?:查|审|核|验|问|计较|见外|客气|讲证据|要凭证|怀疑|质疑|过问|干预)`,
  // 「连…都要查/怀疑」：以最小事项的核验证明对方全盘不信任
  String.raw`(?:连|就连)(?:[^。；，,]{0,12})(?:都|也)(?:要|得|还要)(?:查|审|核|验|问|怀疑|质疑|确认|跟进|过问|计较)`,
  // 半信半疑被定性为最伤人/最伤人状态
  String.raw`(?:半信半疑|边信边查|将信将疑|有条件(?:地)?信任|有条件(?:地)?相信)(?:[^。；，,]{0,12})(?:最|才|才是|真)(?:[^。；，,]{0,6})(?:伤人|伤感情|可怕|危险|要不得|不该|不可以|不行)`,
].join('|'));

const EXCLUSIVE_EN = new RegExp([
  String.raw`\beither\s+you\s+(?:trust|are\s+with)\s+(?:me|us)\s+completely\s+or\s+(?:you\s+are\s+)?(?:against|gone|out)\b`,
  String.raw`\b(?:trust|are\s+with)\s+(?:me|us)\s+(?:completely|fully|totally|unconditionally|one\s+hundred\s+percent)\s+or\s+(?:you\s+are\s+)?(?:against|gone|out|done|an\s+enemy|find\s+(?:someone|somebody)\s+else|get\s+(?:someone|somebody)\s+else)\b`,
  String.raw`\bthere\s+is\s+(?:no|not\s+any)\s+(?:middle\s+ground|in-between|middle\s+option|partial\s+trust)\b`,
  String.raw`\bno\s+(?:middle\s+ground|in-between|halfway|compromise)\s+(?:here|in\s+this|on\s+this)\b`,
  String.raw`\b(?:question(?:ing)?|doubt(?:ing)?|audit(?:ing)?|check(?:ing)?|verif(?:y|ying|ication)|ask(?:ing)?\s+(?:for|about)|double-?check(?:ing)?)\s+(?:this|that|it|my\s+work|the\s+numbers)\s+(?:means|is|shows|proves)\s+(?:you\s+)?(?:do\s+not|don't|no\s+longer)\s+(?:trust|believe\s+in)\s+(?:me|us)\b`,
  String.raw`\byou\s+(?:do\s+not|don't)\s+trust\s+(?:me|us)\b`,
  String.raw`\bif\s+you\s+(?:cannot|can't)\s+trust\s+(?:me|us)\s+(?:on|about)\s+(?:this|it|that)\b`,
  String.raw`\b(?:once|after)\s+you\s+(?:delegate|hand\s+(?:this|it)\s+over|put\s+me\s+in\s+charge)\b[^.]{0,40}\b(?:you\s+)?(?:should\s+not|shouldn't|stop)\s+(?:ask(?:ing)?|question(?:ing)?|interfer(?:e|ing))`,
  String.raw`\b(?:asking|ask)\s+for\s+(?:the\s+)?(?:invoice|receipts|proof|documentation)\s+means\s+you\s+(?:do\s+not|don't)\s+trust\b`,
  String.raw`\breal\s+(?:trust|loyalty)\s+(?:does\s+not|doesn't)\s+(?:need|require)\s+(?:verification|checking|proof)\b`,
  String.raw`\byou\s+(?:either|either,\s+)\s*trust\s+(?:me|us)\s+(?:completely\s+)?or\s+(?:find|get)\s+(?:someone\s+else|another\s+person)\b`,
  String.raw`\b(?:no|zero|without)\s+(?:questions?|second-?guess(?:ing)?)\s+(?:from|by)\s+you\b`,
].join('|'), 'i');

// ─── A1③(EN): 核验/质疑动作被直接定性为不信任（独立成立）────────────
const STIGMA_EN = new RegExp([
  String.raw`\b(?:question(?:ing)?|doubt(?:ing)?|check(?:ing)?|audit(?:ing)?|verif(?:y|ying|ication)|second-?guess(?:ing)?|ask(?:ing)?\s+(?:for|about))\s+(?:me|us|this|that|it)\s+(?:means|is|shows|proves)\s+(?:you\s+)?(?:do\s+not|don't)\s+(?:trust|believe\s+in)\s+(?:me|us|the\s+team)\b`,
  String.raw`\b(?:real|genuine|true|complete|total)\s+(?:trust|loyalty)\s+(?:does\s+not|doesn't|never)\s+(?:need|require|involve)\s+(?:verification|checking|proof|questions?)\b`,
  String.raw`\b(?:friends|family|our\s+own|insiders|one\s+of\s+us)\s+(?:do\s+not|don't|never)\s+(?:check|audit|question|second-?guess)\s+(?:each\s+other|us|our\s+own)\b`,
  String.raw`\b(?:if|once)\s+you\s+(?:question|doubt|check|audit)\s+(?:this|that|it|me|us)\s*,?\s+(?:then\s+)?(?:nothing|none\s+of\s+it)\s+(?:we\s+say|can\s+be)\s+trusted\b`,
  String.raw`\bif\s+you\s+doubt\s+(?:this\s+)?(?:one\s+)?(?:detail|point|thing)\s*,?\s+(?:then\s+)?(?:nothing|none\s+of\s+it)\s+(?:we\s+say|can\s+be)\s+trusted\b`,
  String.raw`\b(?:once|after)\s+you\s+(?:delegate|hand\s+(?:this|it)\s+over|put\s+me\s+in\s+charge|join)\s*(?:me|us|this\s+team)?\s*,?\s+(?:you\s+)?(?:stop|should\s+not|shouldn't|no\s+longer)\s+(?:ask(?:ing)?|question(?:ing)?|interfer(?:e|ing)|check(?:ing)?)\b`,
  String.raw`\b(?:doubting|questioning|checking)\s+(?:me|us)\s+(?:on\s+)?(?:even\s+)?(?:one\s+)?(?:detail|point|thing)\s+(?:means|shows)\s+(?:you\s+)?(?:do\s+not|don't)\s+(?:trust|believe\s+in)\b`,
  String.raw`\bif\s+you\s+(?:question|doubt|check)\s+(?:this|that|it)\s+one\s+(?:detail|point)\s*,?\s+(?:then\s+)?(?:nothing|none)\s+(?:we\s+say|can\s+be)\s+trusted\b`,
  String.raw`\b(?:you|we)\s+(?:either|either,\s+)\s*(?:trust|are\s+with)\s*(?:me|us)?\s*(?:completely|fully|totally|unconditionally)?\s*,?\s*or\s+(?:you\s+(?:do\s+not|don't))\s+(?:trust|believe)\s*(?:me|us|at\s+all)?\b`,
].join('|'), 'i');

// ─── A2: 核验污名化（查证、要凭证、问细节、复核被定性为不信任/见外/伤人）──
const DEMAND_ZH = new RegExp([
  String.raw`(?:查|查证|查账|审|核|核实|核查|核对|复核|审计|验收|验|印证|追问|过问|询问|打听|问细节|要|要求|出示|提供|调取|翻看|看|调)(?:[^。；，,]{0,6})(?:账|凭据|凭证|票据|证据|单据|记录|材料|文件|合同|流水|底稿|案卷|原件|数据|代码|日志|邮件|纪要)`,
  String.raw`(?:这么|这点|这种|这点子)?(?:小事|小问题|细节|小事儿|流程|程序|东西)(?:都|也|还要)?(?:要查|要审|要核|要问|要验证|要说明|要解释|要过问|要跟进)`,
  String.raw`(?:连|就连)(?:[^。；，,]{0,10})(?:都|也)(?:要|得)(?:查|审|核|验|问|怀疑|质疑|确认)`,
  String.raw`(?:审|查|核|问|验|怀疑|质疑|过问|干预|介入)(?:[^。；，,]{0,10})(?:就是|便是|等于)(?:[^。；，,]{0,6})(?:不|没)`,
].join('|'));

const DEMAND_EN = new RegExp([
  String.raw`\b(?:ask(?:ing)?\s+(?:you\s+)?for|request(?:ing)?|show|produce|provide|pull|submit)\s+(?:the\s+)?(?:invoice|receipts?|bill|proof|records?|document(?:s|ation)?|contract|log|logs|audit|paperwork|evidence)\b`,
  String.raw`\b(?:double-?check|verif(?:y|ication)|audit|re-?audit|review|inspect|examine)\s+(?:your|the|these|this|it|numbers|figures|work)\b`,
  String.raw`\b(?:audit|check|verify|review|question|ask\s+(?:about|into))\s+(?:this|that|it)\b`,
  String.raw`\bwhy\s+(?:do\s+)?(?:you\s+)?(?:need|want)\s+(?:to\s+)?(?:see|check|verify|audit)\b`,
].join('|'), 'i');

// ─── G1: 审计/内控/合规的正当边界声明（合法）──────────────────────
const GUARD_ZH = new RegExp([
  String.raw`(?:按|依照|按照|依据|根据|遵照|严格执行)(?:[^。；，,]{0,10})(?:流程|制度|规章|规定|规范|程序|标准|纪律|审计制度|内控制度|财务制度|合规要求|审计法|会计法)`,
  String.raw`(?:审计|内控|合规|风控|财务|纪检|监察|独立董事|第三方)(?:[^。；，,]{0,6})(?:独立|依法|依规|依制度)(?:[^。；，,]{0,6})(?:进行|开展|执行|监督|核查|审计|复核|审查)`,
  String.raw`(?:这是|属于|按)(?:[^。；，,]{0,6})(?:职责|职权|法定|授权)(?:[^。；，,]{0,6})(?:范围|内的事|要求|程序)`,
  String.raw`(?:不是|并非)(?:[^。；，,]{0,6})(?:针对|冲着|因为)(?:[^。；，,]{0,6})(?:个人|你个人|某个人|人品|忠诚)`,
].join('|'));

const GUARD_EN = new RegExp([
  String.raw`\b(?:per|according\s+to|in\s+line\s+with|under)\s+(?:the\s+)?(?:policy|procedure|regulation|standard|audit\s+protocol|internal\s+controls?|compliance\s+policy)\b`,
  String.raw`\b(?:this\s+is\s+)?(?:routine|standard|normal|mandatory|required|statutory)\s+(?:audit|review|check|verification|oversight)\b`,
  String.raw`\b(?:not|nothing)\s+(?:personal|against\s+(?:you|anyone))\b`,
  String.raw`\bthe\s+(?:auditor|internal\s+controls?|compliance\s+team|independent\s+reviewer)\s+(?:independently|routinely)\b`,
].join('|'), 'i');

// ─── G2: 一般性二选一看守（不含核验腿的合理择优表述）──────────────────
// 排除：选供应商、选方案、二选一的正当决策表述。
const PICK_ZH = new RegExp([
  String.raw`(?:要么|或者)(?:[^。；，,]{0,12})(?:用|选|采购|采用)(?:[^。；，,]{0,6})(?:方案|供应商|产品|服务商|版本|路线|策略)`,
  String.raw`(?:二选一|两选一|择一|选其中之一|各有利弊|权衡|取舍)`,
].join('|'));

// ─── G3: 信息分级管控看守（按密级/权限管理信息，非针对个人忠诚）──────
const CLASSIFY_ZH = new RegExp([
  String.raw`(?:按|依照|根据)(?:[^。；，,]{0,6})(?:密级|密别|保密|涉密|权限|等级|分级)(?:[^。；，,]{0,6})(?:管理|控制|限定|划分|传阅|知悉|保管|传递|接触)`,
  String.raw`(?:涉密|保密|机密)(?:[^。；，,]{0,8})(?:不得|禁止|限制)(?:[^。；，,]{0,6})(?:打听|询问|知悉|外传|记录|复制|拍照|传出)`,
].join('|'));

const CLASSIFY_EN = new RegExp([
  String.raw`\b(?:per|according\s+to|under)\s+(?:the\s+)?(?:classification|clearance|security\s+clearance|need-?to-?know|data\s+classification)\s+(?:level|policy|requirement)\b`,
  String.raw`\b(?:classified|confidential|secret)\s+information\s+(?:is\s+)?(?:handled|shared|distributed)\s+on\s+a\s+need-?to-?know\s+basis\b`,
  String.raw`\bthis\s+(?:document|data|material)\s+is\s+restricted\s+by\s+(?:classification|security\s+policy)\b`,
].join('|'), 'i');

// ─── G4: 任务范围授权看守（划清决策范围，未取消全部核查权）───────────
const SCOPE_ZH = new RegExp([
  String.raw`(?:在|限于)(?:[^。；，,]{0,8})(?:范围|权限|额度|事项)(?:之|以)(?:内|内)(?:[^。；，,]{0,8})(?:由|归)(?:你|您)(?:全权|自主|自行|独立)(?:决定|处理|决断|定夺)`,
  String.raw`(?:授权|委托)(?:你|您|你方)(?:[^。；，,]{0,8})(?:在|于)(?:[^。；，,]{0,8})(?:额度|范围|金额|事项|权限)(?:内|以上|以下)(?:[^。；，,]{0,8})(?:自主|自行|独立)(?:决定|审批|处理)`,
  String.raw`(?:超出|逾越|越出)(?:[^。；，,]{0,6})(?:范围|权限|额度|授权)(?:[^。；，,]{0,6})(?:仍需|还得|还是要|请)(?:[^。；，,]{0,8})(?:报批|请示|复核|上报|审核)`,
].join('|'));

const SCOPE_EN = new RegExp([
  String.raw`\bwithin\s+(?:the\s+)?(?:scope|limit|budget|authority|mandate)\s+(?:delegated|granted)\s+to\s+you\b`,
  String.raw`\byou\s+(?:have\s+)?(?:full|sole|final)\s+authority\s+(?:over|for|on)\s+(?:this|the)\s+(?:matter|decision|project)\b[^.]{0,40}\b(?:above|beyond|outside)\s+(?:that|the\s+limit)\b[^.]{0,40}\b(?:report|escalate|check\s+back)\b`,
  String.raw`\banything\s+(?:above|beyond|outside)\s+(?:that|this)\s+(?:threshold|limit|scope)\s+(?:still\s+)?(?:requires|needs)\s+(?:my|our|your)\s+(?:approval|sign-?off|review)\b`,
].join('|'), 'i');

// ─── G5: 反思性陈述看守（讨论这种结构本身，不是在行使它）──────────────
const REFLEXIVE_ZH = new RegExp([
  String.raw`(?:这种|这类|这类人|上述)(?:[^。；，,]{0,8})(?:做法|话术|说法|逻辑|结构|态度|要求)(?:[^。；，,]{0,10})(?:是|属于)(?:[^。；，,]{0,6})(?:不对|错误|有问题|危险的|有害的|应当警惕|要警惕|值得反思|要反思)`,
  String.raw`(?:要|应当|应该|需要)(?:警惕|拒绝|反对|批评|破除|避免)(?:[^。；，,]{0,6})(?:这种|这类)(?:[^。；，,]{0,6})(?:无条件|盲目|片面)(?:[^。；，,]{0,4})(?:信任|服从|忠诚)`,
  String.raw`(?:盲目|无条件)(?:[^。；，,]{0,4})(?:信任|服从|忠诚)(?:[^。；，,]{0,10})(?:不|没|绝非|并非)(?:[^。；，,]{0,6})(?:等于|意味|代表)(?:[^。；，,]{0,6})(?:安全|忠诚|尊重|团结)`,
  String.raw`(?:分析|讨论|研究|考察)(?:[^。；，,]{0,8})(?:无条件|排他|二元)(?:[^。；，,]{0,4})(?:信任|忠诚)(?:[^。；，,]{0,4})(?:的|这种)`,
].join('|'));

const REFLEXIVE_EN = new RegExp([
  String.raw`\b(?:this|such)\s+(?:demand|logic|pattern|rhetoric|framing)\s+of\s+(?:unconditional|total|absolute)\s+(?:trust|loyalty|obedience)\b[^.]{0,40}\b(?:is|are)\s+(?:dangerous|manipulative|a\s+red\s+flag|problematic|wrong)\b`,
  String.raw`\bwe\s+should\s+(?:be\s+)?(?:wary\s+of|reject|avoid|guard\s+against)\s+(?:unconditional|blind|total)\s+(?:trust|loyalty|obedience)\b`,
  String.raw`\bblind\s+(?:trust|loyalty|obedience)\s+(?:is\s+)?(?:not|never)\s+(?:the\s+same\s+as|equal\s+to)\s+(?:real|healthy|mutual)\s+(?:trust|respect)\b`,
  String.raw`\b(?:analy(?:z|s)(?:e|ing)|discuss(?:ing)?|examining)\s+(?:the\s+)?(?:framing|logic|rhetoric)\s+of\s+(?:all-?or-?nothing|exclusive)\s+trust\b`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkExclusiveTrust(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '虚假排他信任×信任互斥宣告×核验污名化(zh)'
      : 'exclusive-trust×mutually-exclusive-trust×verification-stigmatized(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 判据三段（任一成立即命中）：
  //   支① STIGMA（核验动作被直接定性为不信任）——独立完整的攻击形状；
  //   支② EXCLUSIVE（互斥逼选：要么全信要么敌对/没有中间态）× DEMAND
  //        （核验对象腿：账/凭证/流程）——互斥句式必须有核验对象配合，
  //        单纯站队/谈判/择优句式不判（见 G2 看守）。
  // r581 原设计是 A1 × A2 两条腿都独立命中，实测 21 条同族攻击只有
  // 5 条双腿齐备——「质疑就是不信任团队」这类句子本身就是完整攻击
  // （互斥 + 污名在同一个分句里），再要求另外出现核验对象是把判据拧到
  // 本族所针对的语义子集之外。r582 拆成两支。
  const hasStigma = STIGMA_ZH.test(text) || STIGMA_EN.test(text);
  const hasExclusive = EXCLUSIVE_ZH.test(text) || EXCLUSIVE_EN.test(text);
  if (!hasStigma) {
    if (!hasExclusive) return miss();
    // 支② 先过看守，再看 DEMAND 腿
    if (GUARD_ZH.test(text) || GUARD_EN.test(text)) return miss();
    if (PICK_ZH.test(text) || CLASSIFY_ZH.test(text) || CLASSIFY_EN.test(text)) return miss();
    if (SCOPE_ZH.test(text) || SCOPE_EN.test(text)) return miss();
    if (REFLEXIVE_ZH.test(text) || REFLEXIVE_EN.test(text)) return miss();
    const hasDemand = DEMAND_ZH.test(text) || DEMAND_EN.test(text);
    if (!hasDemand) return miss();
    return hitResult;
  }

  // 支① 看守：正当边界 / 一般性二选一 / 信息分级 / 任务授权 / 反思性陈述 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return miss();
  }
  if (PICK_ZH.test(text) || CLASSIFY_ZH.test(text) || CLASSIFY_EN.test(text)) {
    return miss();
  }
  if (SCOPE_ZH.test(text) || SCOPE_EN.test(text)) {
    return miss();
  }
  if (REFLEXIVE_ZH.test(text) || REFLEXIVE_EN.test(text)) {
    return miss();
  }

  return hitResult;
}

module.exports = {
  checkExclusiveTrust,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    EXCLUSIVE_ZH, EXCLUSIVE_EN,
    STIGMA_ZH, STIGMA_EN,
    DEMAND_ZH, DEMAND_EN,
    GUARD_ZH, GUARD_EN,
    PICK_ZH, CLASSIFY_ZH, CLASSIFY_EN,
    SCOPE_ZH, SCOPE_EN,
    REFLEXIVE_ZH, REFLEXIVE_EN,
  }),
};
