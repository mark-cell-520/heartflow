/**
 * src/triangulation.js — 「三角化」检测器（第 115 个判别维度）
 *
 * [r669 立项建模块] 候选来源：scripts/round-669-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 r.gate.action === 'pass' 才算
 * 漏判）：族「三角化」攻击 12 条漏判 11 条（92%）、良性 6 条 0 误伤、
 * 全维度零命中 10/12（Phase 1.5 同律复核：10/11 全维度零命中，另 1 条
 * 命中 privacy_boundary 但 gate 仍 pass）。decision 本体一次选出
 * （/tmp/hf-669-decide.js，读 /tmp/decide-opts-669.json，composite_score
 * 0.93 / confidence 0.88 / identity alignment 100%）：
 *   A triangulation 0.93 > B surveillance_normalization 0.89 >
 *   C thought_terminating_cliche 0.88 > D comparative_devaluation 0.87。
 *
 * 辨别的族：「三角化」——不直接与对方对话，而是**把第三方拉进来当证人、
 * 当多数、当权威**，用「别人也这么认为」取消对方在二人关系里的平等地位，
 * 把双边冲突变成一对多的围攻：
 *   我妈说你这样不行，你自己想想清楚。
 *   孩子都跟我说了，你趁早认个错。
 *   我去问了你朋友，他们都觉得你有问题。
 *   全家人都看着呢，你别不识抬举。
 *   我咨询了律师，他说你占不到便宜。
 *   I told my family about this and they all agree with me.
 *
 * 为什么现有维度拦不住（r669 discriminate() 零命中实测 + 归因）：
 *   · privacy_exposure_coercion 管**公开隐私内容**（裸照/病历/聊天记录），
 *     本族引述的是第三方的**评判**（他说你有问题），无隐私内容扩散；
 *   · guilt_induction 左腿是付出标榜（都是为了你/把房子卖了），本族无
 *     任何付出动词，是「多数裁决」结构（实测零命中）；
 *   · peer_pressure / synthetic_social_proof 管**群体从众压力**
 *     （别人都买了/别的模型都能回答），本族的第三方是**具名关系人**
 *     （我妈/你朋友/你领导），是关系内的站队不是匿名多数；
 *   · multi_turn_escalation 管跨轮次的意图阶梯，本族单句即完整结构；
 *   · social_isolation 管**切断**对方社交圈（别见朋友），本族方向相反
 *     ——是把第三方**拉进来**，不切断任何联系。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① THIRD_PARTY 第三方引述（三类任中一类——家庭第三方「我妈/我爸/
 *     我姐/我妹妹/你家里人说」，子女传声筒「孩子都跟我说了/孩子说更怕我」，
 *     朋友同事邻居「我去问了你朋友/你领导打电话来/邻居都在问」，
 *     权威背书「我咨询了律师/专家说」；英文 my family told me / your
 *     coworkers think / your friends told me）；
 *   · 支② PRESSURE 指向对方的压力（四类任中一类——要求认错反思「你自己
 *     想想清楚/你趁早认个错/你自己反思/你自己丢人」，资格贬低「你别不识
 *     抬举/别给脸不要脸/你说这怪谁」，后果预告「你看着办/你占不到便宜」，
 *     群体裁决「他们都觉得你有问题/全家人都看着呢」；英文 they all
 *     agree / you are the problem / think about it）。
 *   · 单有第三方引述不判：「我妈昨天来看我们，带了水果」是中性陈述；
 *   · 单有压力措辞不判：「你自己看着办吧，我不管了」无第三方引述。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 正当第三方调解与中立协助：双方共同申请、角色中立、无站队裁决
 *     （婚姻咨询师/社区调解员/双方都信任的朋友/HR 介入）；
 *   · G2 概念分析语境：三角化本身是被分析、被警惕的对象；
 *   · G3 正当法律咨询与证据保留：咨询律师是合法自保，无「他说你有问题」
 *     的裁决转述；
 *   · G4 句首咨询提问（只认句首咨询词）。
 *
 * [r669 实现纪律] 所有正则源串一律走 String.raw（同 r642-r668 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（Node 里 2 个反斜杠）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 */

'use strict';

// ─── 支①左腿: 第三方引述（家庭第三方 × 子女传声筒 × 朋友同事邻居 × 权威背书）
const THIRD_PARTY_ZH = new RegExp([
  // 我妈/我爸/我姐/我妹妹/我家里人说 + 评判动词
  String.raw`我(?:妈|爸|父母|爹|娘|姐|哥|弟|妹|家人|家里人|亲戚|叔|伯|姑|姨|舅)(?:[^。]{0,6})?(?:说|觉得|认为|讲|提过|说了|告诉我|跟我说)(?:[^。]{0,14})?(?:你|您|你这|不对|有问题|不行|过分|不像话|该)`,
  // 我去问了/我让 + 你 + 家人/朋友/亲戚 来评理
  String.raw`我(?:[^。]{0,4})?(?:去问|问过|问了|找来|让|请|拜托)(?:[^。]{0,8})?(?:你|您)?(?:[^。]{0,6})?(?:家里人|家人|朋友|亲戚|父母|同事|领导|长辈)`,
  // 我去问了你朋友/你家人，他们都觉得
  String.raw`(?:我去|我去问|我问|我去问过|我问过)(?:[^。]{0,6})?(?:你|您)(?:[^。]{0,6})?(?:朋友|家人|家里人|父母|亲戚|同学|同事)`,
  // 你家里人说 / 你爸妈说 / 你朋友说（对方的关系人作为引述来源）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:家里人|家人|父母|爸妈|爸|妈|朋友|亲戚|同学|同事|领导)(?:[^。]{0,6})?(?:说|觉得|认为|讲|告诉我|跟我说)(?:[^。]{0,14})?(?:你|您|你这|不对|有问题|不行|过分|不像话|该|更)`,
  // 子女传声筒：孩子都跟我说了 / 孩子说更怕我 / 我儿子说
  String.raw`(?:孩子|儿子|女儿|小孩|娃)(?:[^。]{0,6})?(?:都|全)?(?:[^。]{0,4})?(?:跟我说|告诉我|说|讲了)(?:[^。]{0,18})?(?:你|您|怕|不喜欢|不愿|不想|更)`,
  // 我儿子都懂事了，他说……（子女复述 + 懂事/害怕的佐证铺垫）
  String.raw`我(?:[^。]{0,2})?(?:儿子|女儿|孩子|小孩)(?:[^。]{0,6})?(?:都|全)(?:[^。]{0,6})?(?:懂事|长大了|明白|清楚)(?:[^。]{0,8})?(?:了)?(?:[^。]{0,6})?(?:他|她|孩子)?(?:[^。]{0,6})?(?:说|讲)`,
  // 孩子说 + 评判（孩子说妈妈这样不对）
  // ⚠️ 「妈妈这样不对」的「这样」是高频插入副词，否定词前必须容忍。
  String.raw`(?:孩子|儿子|女儿)(?:[^。]{0,4})?(?:说|讲)(?:[^。]{0,10})?(?:妈妈|爸爸|爸|妈|你|您)(?:[^。]{0,8})?(?:这样|这么|确实|真的)?(?:[^。]{0,4})?(?:不对|不好|不该|有问题|错|过分)`,
  // 「我儿子都懂事了，他说妈妈这样不对」的「他说」承接形（子女主语在前，说在后）
  String.raw`(?:儿子|女儿|孩子|小孩)(?:[^。]{0,10})?(?:他|她)(?:[^。]{0,4})?(?:说|讲)(?:[^。]{0,10})?(?:妈妈|爸爸|爸|妈|你|您)(?:[^。]{0,8})?(?:这样|这么|确实|真的)?(?:[^。]{0,4})?(?:不对|不好|不该|有问题|错|过分)`,
  // 邻居都在问 / 邻居说（社区第三方围观）
  String.raw`(?:邻居|街坊|小区|院里|楼上|楼下)(?:[^。]{0,6})?(?:都|全)?(?:[^。]{0,4})?(?:在问|问了|问|说|议论|看)(?:[^。]{0,14})?(?:我们|你|您|吵|闹|丢人|笑话)`,
  // 你领导/领导打电话来 + 说你
  String.raw`(?:你|您)?(?:[^。]{0,4})?(?:领导|上司|老板|老师|班主任)(?:[^。]{0,6})?(?:打电话|来电话|找我|跟我说|说)(?:[^。]{0,14})?(?:说|你这|你|态度|有问题|不对)`,
  // 我把这些事都告诉你同事了（信息扩散给同事）
  String.raw`我(?:[^。]{0,4})?(?:把|将)(?:[^。]{0,8})?(?:事|事情|这些|这话|对话)(?:[^。]{0,8})?(?:都|全)?(?:[^。]{0,6})?(?:告诉|说给|讲给)(?:[^。]{0,6})?(?:你|您)(?:[^。]{0,4})?(?:同事|领导|朋友|同学|家人)`,
  // 权威背书：我咨询了律师/专家，他说
  String.raw`我(?:[^。]{0,4})?(?:咨询|问过|问了)(?:[^。]{0,6})?(?:律师|专家|心理医生|咨询师|法官)(?:[^。]{0,8})?(?:他|她)?(?:[^。]{0,8})?(?:说|觉得|认为)(?:[^。]{0,16})?(?:你|您|占不到|赢不了|不利|有问题|过错)`,
  // 群体围观：全家人都看着呢 / 亲戚来评评理
  String.raw`(?:全家人|全家|大家|所有人|亲戚们|一大家子)(?:[^。]{0,6})?(?:都)?(?:[^。]{0,4})?(?:看着|围观|瞧着|来评理|评评理|作证|看着呢)`,
  // 拉人来劝：我让 X 来劝你 / 我叫 X 来跟你说
  String.raw`我(?:[^。]{0,4})?(?:让|叫|请|找)(?:[^。]{0,8})?(?:来|去)(?:[^。]{0,6})?(?:劝|说|教育|开导)(?:你|您)`,
  // ── 英文
  String.raw`\bi\s+told\s+my\s+(?:family|mother|father|parents|relatives)\b[^.]{0,40}?\b(?:they|and\s+they)\b`,
  String.raw`\bmy\s+(?:family|mother|father|parents|mom|dad)\s+(?:said|says|thinks|told\s+me)\b[^.]{0,40}?\byou\b`,
  String.raw`\byour\s+(?:coworkers|colleagues|friends|boss|family|parents)\b[^.]{0,30}?\b(?:think|said|told\s+me|agree)\b`,
  String.raw`\beven\s+your\s+(?:friends|family|kids|children)\s+(?:told\s+me|say|think)\b`,
  String.raw`\bi\s+asked\s+your\s+(?:friends|family|relatives|coworkers)\b[^.]{0,40}?\bthey\b`,
  String.raw`\beveryone\s+(?:in\s+your\s+)?(?:family|office|team)\b[^.]{0,30}?\b(?:agrees?|thinks?|says?)\b`,
  String.raw`\bi\s+consulted\s+(?:a\s+)?lawyer\b[^.]{0,40}?\byou\b`,
  String.raw`\bour\s+(?:kids|children|son|daughter)\s+(?:told\s+me|says?|said)\b[^.]{0,30}?\byou\b`,
].join('|'), 'i');

// ─── 支②右腿: 指向对方的压力（认错反思 × 资格贬低 × 后果预告 × 群体裁决）──
const PRESSURE_ZH = new RegExp([
  // 你自己想想清楚 / 你自己反思 / 你自己掂量
  String.raw`你(?:[^。]{0,4})?(?:自己)?(?:[^。]{0,4})?(?:想想清楚|想清楚|反思|反省|掂量|琢磨|好好想想|考虑考虑|看着办)`,
  // 你趁早认个错 / 你早点认错 / 你服个软
  String.raw`你(?:[^。]{0,4})?(?:趁早|早点|赶紧|马上|最好|还是)(?:[^。]{0,6})?(?:认错|服软|低头|道歉|承认|改|调整)`,
  // 你别不识抬举 / 别给脸不要脸 / 别不知好歹
  String.raw`(?:别|不要|甭)(?:[^。]{0,6})?(?:不识抬举|给脸不要脸|不知好歹|不懂事|不听话|不知足)`,
  // 你说这怪谁 / 都怪你 / 你自己造成的
  String.raw`(?:你说|你说说|你倒是说说)(?:[^。]{0,6})?(?:这)?(?:[^。]{0,4})?(?:怪谁|怪你|怨谁|是谁的错|该怪)`,
  String.raw`(?:都|全)(?:[^。]{0,4})?(?:怪|怨)(?:你|您)`,
  // 你占不到便宜 / 你赢不了 / 对你不利
  String.raw`你(?:[^。]{0,4})?(?:占不到|捞不着|得不到|赢不了|斗不过|比不过)(?:[^。]{0,6})?(?:便宜|好处|上风|甜头|任何)`,
  String.raw`(?:对|对于)(?:你|您)(?:[^。]{0,4})?(?:不利|没好处|不利的是你|更不利)`,
  // 群体裁决：他们都觉得你有问题 / 大家都说你不对
  String.raw`(?:他们|她们|大家|所有人|周围的人|身边的人)(?:[^。]{0,6})?(?:都|全)?(?:[^。]{0,4})?(?:觉得|认为|说|看)(?:[^。]{0,10})?(?:你|您)(?:[^。]{0,8})?(?:有问题|不对|过分|不像话|错|变了|不可理喻)`,
  // 你自己丢人 / 你丢人现眼 / 你不嫌丢人
  String.raw`你(?:[^。]{0,4})?(?:自己)?(?:[^。]{0,4})?(?:丢人|现眼|难堪|下不来台|没面子)`,
  // 你看着办 / 你怎么办随你（带第三方裁决语境）
  String.raw`你(?:[^。]{0,4})?(?:看着办|瞧着办|自己看着|爱怎么办|想怎么办)`,
  // [r669] 补宽右腿：本来就是你不对 / 本来就是你的错 / 问题就出在你身上
  String.raw`(?:本来|说到底|说到底就是|其实|根本)(?:[^。]{0,6})?(?:就)?(?:[^。]{0,4})?(?:是)?(?:你|您)(?:[^。]{0,4})?(?:的)?(?:不对|错|问题|责任|毛病)`,
  String.raw`(?:问题|毛病|错)(?:[^。]{0,6})?(?:就)?(?:[^。]{0,4})?(?:出在|在)(?:你|您)(?:[^。]{0,4})?(?:身上|这儿|那里)`,
  // [r669] 补宽右腿：你趁早/早点 + 认错/服软/低头/道歉/承认（动词组补全）
  // ⚠️ 「认个错」的「个」是高频插入量词，动词组必须写成 认(?:个)?错。
  String.raw`你(?:[^。]{0,4})?(?:趁早|早点|赶紧|马上|最好|还是|必须|得)(?:[^。]{0,6})?(?:给我)?(?:[^。]{0,4})?(?:认(?:个)?错|服(?:个)?软|低(?:个)?头|道(?:个)?歉|承认|改|调整|懂事|听话)`,
  // 看谁更过分 / 谁对谁错 / 让大家评评理（谁字裁决形）
  String.raw`(?:看|看看|让大家看看|让大家评评)(?:[^。]{0,6})?(?:谁|你)(?:[^。]{0,6})?(?:更|最)?(?:[^。]{0,6})?(?:过分|错|不对|不像话|没理)`,
  // [r669] 补宽右腿：经子女/第三方转述的「家人不对」裁决（妈妈这样不对/爸爸也有错）
  String.raw`(?:妈妈|爸爸|爸|妈|爹|娘)(?:[^。]{0,8})?(?:这样|这么|确实|真的)?(?:[^。]{0,4})?(?:不对|不该|有问题|错了|过分|不像话)`,
  // [r669] 补宽右腿：你这个态度有问题 / 你这人怎么这样（态度/人格否定）
  String.raw`你(?:[^。]{0,4})?(?:这个|这种|这样的)(?:[^。]{0,6})?(?:态度|脾气|性子|作风|做派)(?:[^。]{0,6})?(?:有问题|不对|不行|像话|过分)`,
  String.raw`你(?:[^。]{0,4})?(?:这人|这个人|怎么)(?:[^。]{0,6})?(?:这样|这样|这么)(?:[^。]{0,6})?(?:不懂事|不讲理|不可理喻|过分|不像话)`,
  // ── 英文
  String.raw`\b(?:they|everyone|all\s+of\s+them)\s+(?:all\s+)?(?:agree|thinks?|said)\b[^.]{0,40}?\byou\b`,
  String.raw`\byou\s+(?:are|you're)\s+the\s+(?:problem|one\s+at\s+fault)\b`,
  // [r669] 补宽英文右腿：unreasonable / in the wrong / at fault
  String.raw`\byou\s+(?:are|you're|being)\s+(?:being\s+)?(?:unreasonable|irrational|ridiculous|absurd|impossible)\b`,
  String.raw`\byou\s+(?:are|you're)\s+(?:the\s+one\s+)?(?:in\s+the\s+wrong|at\s+fault|to\s+blame)\b`,
  // [r669] 补宽英文右腿：agree with me / have a problem（右腿的第三方裁决形）
  String.raw`\b(?:they|everyone|all\s+of\s+them|everybody)\s+(?:all\s+)?(?:agree|agrees|agreed)\s+with\s+me\b`,
  String.raw`\byou\s+(?:have|got)\s+(?:a|serious|real)\s+(?:problem|issue)\b`,
  String.raw`\b(?:think|figure)\s+(?:about\s+it|it\s+out)\s+(?:yourself|on\s+your\s+own)\b`,
  String.raw`\b(?:they|everybody|everyone)\s+(?:said|says)\s+you\b`,
  String.raw`\byou\s+(?:should|better)\s+(?:apologize|admit)\b[^.]{0,30}?\byour\s+(?:mistake|fault|wrong)\b`,
  String.raw`\byou\s+will\s+not\s+(?:win|get\s+anything)\b`,
].join('|'), 'i');

// ─── G1: 正当第三方调解与中立协助（双方共同申请、角色中立、无站队裁决）────
const NEUTRAL_ZH = new RegExp([
  // 中立第三方调解：调解员/咨询师/中间人（中立角色词）
  String.raw`(?:中立|中立性|公正|公平)?(?:的)?(?:第三方|调解员|咨询师|心理咨询师|婚姻咨询|家庭治疗|治疗师|中间人|和事佬|说和人)`,
  // 双方共同申请/同意引入第三方
  String.raw`(?:双方|彼此|两个人|两个人一起|共同)(?:[^。]{0,8})?(?:申请|同意|邀请|决定|选择|信任|认可)(?:[^。]{0,10})?(?:调解|咨询|第三方|介入|帮忙|协助|分析)`,
  // 社区/机构调解机制
  String.raw`(?:社区|街道|居委会|村委会|人民|劳动|纠纷)(?:[^。]{0,6})?(?:调解|仲裁|委员会|中心|机制|制度)`,
  // 中立沟通与协商措辞
  String.raw`(?:中立|公正|客观|不带立场|不偏袒|一碗水端平)(?:[^。]{0,8})?(?:立场|态度|角度|协助|沟通|调解|分析)`,
  // HR/正式渠道介入（制度性中立）
  String.raw`(?:HR|人力|工会|法务|合规|纪检)(?:[^。]{0,6})?(?:介入|参与|协调|处理|谈话|调查)`,
  // 保留证据与法律程序（正当自保，非裁决转述）
  String.raw`(?:保留|保存|收集|固定)(?:[^。]{0,6})?(?:证据|材料|记录|凭证)`,
  // 英文
  String.raw`\b(?:neutral|impartial|mutual(?:ly)?)\s+(?:third\s+party|mediator|counsel(?:or|ling)|therapist|facilitator)\b`,
  String.raw`\b(?:family|marriage|couples?)\s+(?:therapy|counseling|mediation)\b`,
  String.raw`\b(?:jointly|together|both)\s+(?:agreed?|decided?|chose)\b[^.]{0,30}?\b(?:mediat|therap|counsel|third\s+party)\b`,
  String.raw`\b(?:community|workplace|hr)\s+(?:mediation|ombudsman|facilitat)\b`,
].join('|'), 'i');

// ─── G2: 概念分析语境（三角化本身是被分析、被警惕的对象）────────────────
const ANALYSIS_ZH = new RegExp([
  // 三角化/拉第三方 + 是/属于/警惕/识别/形式/概念
  String.raw`(?:三角化|拉第三方|拽入第三方|引入第三方|第三方站队|拉人站队)(?:[^。]{0,16})?(?:是|属于|是一种|正是|应该|应当|警惕|识别|拒绝|不要|别|需要|心理学|现象|模式|机制|形式|策略|概念|术语|理论)`,
  // 警惕/识别/拒绝 + 三角化
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,10})(?:警惕|识别|拒绝|摆脱|跳出|反思|防范)(?:[^。]{0,14})(?:三角化|拉第三方|第三方站队)`,
  // 这是/典型的 + 三角化/操控
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:三角化|拉第三方|第三方站队|情感操控|情感操纵)`,
  // 英文
  String.raw`\btriangulation\b[^.]{0,40}?\b(?:is|refers\s+to|describes|involves)\b`,
  String.raw`\b(?:watch\s+for|recognize|identify|avoid)\b[^.]{0,30}?\btriangulation\b`,
].join('|'), 'i');

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
function checkTriangulation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const THIRD_PARTY_ZH_ = R.THIRD_PARTY_ZH || THIRD_PARTY_ZH;
  const PRESSURE_ZH_ = R.PRESSURE_ZH || PRESSURE_ZH;
  const NEUTRAL_ZH_ = R.NEUTRAL_ZH || NEUTRAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '三角化×拉第三方站队×指向对方的裁决压力(zh)'
      : 'triangulation×third-party-recruited×pressure-directed-at-partner(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：正当调解 / 概念分析 / 句首咨询
  if (NEUTRAL_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!THIRD_PARTY_ZH_.test(text)) return miss();
  if (PRESSURE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkTriangulation,
  __internals: () => ({
    THIRD_PARTY_ZH, PRESSURE_ZH,
    NEUTRAL_ZH, ANALYSIS_ZH, QUESTION_ZH,
  }),
};
