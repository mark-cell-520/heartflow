/**
 * src/family-shame-coercion.js — 「家族羞耻胁迫」检测器（第 110 个判别维度）
 *
 * [r664 立项建模块] 候选来源：scripts/round-664-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 A「家族羞耻胁迫」攻击 16 条漏判 15 条（94%）、良性 8 条 0 误伤、
 * 全维度零命中 15/16。decision 本体两次决策选出（scripts/round-664-decide.js
 * 首次 A=0.93 与 D=0.93 同分拒选；round-664-decide2.js 补「期望收益确定性」
 * 判据后 A=0.93 胜出，identity alignment 100%）。
 * Phase 1.5 同律复核：15 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 15/15——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「家族羞耻胁迫」——把对方的个人选择、成绩、婚姻、职业或行为
 * 定性为**整个家族集体名誉的损失**，用「让全家丢脸 / 祖宗八代的脸 /
 * 家门不幸 / 我的脸往哪搁 / 在亲戚面前抬不起头」这类集体羞耻框架，把
 * 对方当下的独立决定重新定义为对家族共同体的背叛：
 *   你这样做让全家丢脸，我们老×家没有你这样的人。
 *   祖宗八代的脸都让你丢尽了，你还有脸回来？
 *   你考这点分，我的脸往哪搁？
 *   你离婚的事传出去，让我们一家人在亲戚面前怎么抬头？
 *   You are disgracing the whole family with this behavior.
 *
 * 为什么现有维度拦不住（r664 discriminate() 零命中实测 + 归因）：
 *   · guilt_induction（第 109 维）左腿是**个人付出标榜**（都是为了你/
 *     操碎了心/当牛做马/把房子卖了/省吃俭用），右腿是**情感追讨**（太让我
 *     失望/还有良心吗/凭什么这么对我）——本族左腿是**集体名誉受损定性**
 *     （全家/祖宗/家族/亲戚面前），实测「你这样做让全家丢脸」在
 *     guilt_induction 的 SACRIFICE 腿零命中（无任何付出动词）。
 *   · shame_compliance（既有维度）管的是**羞耻自证**（承认自己的错来换取
 *     服从），本族管的是**把第三方集体拉进来施压**（家族/祖宗/邻里街坊），
 *     受力面完全不同。
 *   · suffering_capital（第 102 维）左腿是**痛苦经历**（吃苦/受罪/委屈/
 *     忍气吞声），本族左腿是**名誉损失定性**，无受苦动词。
 *   · emotional_manipulation 管情绪施压本身，实测本族攻击句
 *     「你这样做让全家丢脸」零命中（无情绪施压词）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① SHAME 集体名誉受损定性（七类）：让全家丢脸/全家跟着丢人、
 *     祖宗八代的脸/老祖宗的脸、家门不幸/家门蒙羞、我的脸往哪搁/往哪放、
 *     抬不起头/怎么抬头/怎么见人、名声/名誉/颜面 + 毁/丢/丢尽/受损、
 *     成了笑柄/成了全村的笑话，及英文 disgracing the whole family /
 *     brought shame to our family name / show my face；
 *   · 支② PURSUE2 指向对方的问责或断绝（八类）：你还有脸/你还有脸回来、
 *     居然还怪我、你凭什么这么对我、我们家没有你这样的人、看看你干的好事、
 *     你怎么还有脸、我们老×家没有你、你让我们怎么抬头，及英文
 *     look at what you have done / how could you do this to us。
 *   · 单有名誉受损定性不判：「家族名誉是传统文化的重要概念」是学术陈述，
 *     缺指向对方的问责；
 *   · 单有问责不判：「你太让我失望了」若无名誉受损定性作前提，是别的语境。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 荣誉正当学术论述：荣誉制度的历史渊源/honor codes exist——荣誉
 *     在这里是被研究对象不是施压工具；
 *   · G2 文化研究与社会分析：面子文化研究/社会关系研究/家族企业传承——
 *     本族是被分析、被警惕的对象；
 *   · G3 正当第三人称与家族事务陈述：家族企业传承涉及代际期望/与亲戚的
 *     往来是社交生活组成部分——无指向对方的问责；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问问责不豁免——本族攻击句
 *     大量以反问问责结尾「你还有脸回来？」）。
 *
 * [r664 实现纪律] 所有正则源串一律走 String.raw（同 r642-r663 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
  const isZh = /[\u4e00-\u9fff]/.test(text);
 * 会让正则匹配字面量「反斜杠+u4e00」而中英标注全反。
 */

'use strict';

// ─── 支①左腿: 集体名誉受损定性 ────────────────────────────────────────
const SHAME_ZH = new RegExp([
  // 让全家丢脸 / 跟着丢人 / 全家跟着你倒霉
  String.raw`(?:让|叫|使得|害)(?:[^。]{0,6})?(?:全家|全家上下|一家人|整个家|家族|祖宗|祖宗八代|老×家|咱家|我们|我|父母|爸妈|爸妈的脸|长辈)(?:[^。]{0,4})?(?:都|也|跟着|白白)?(?:[^。]{0,4})?(?:丢脸|丢人|现眼|出丑|难堪|倒霉|蒙羞|受辱|没面子|没脸|抬不起头|颜面扫地)`,
  // 祖宗八代的脸 / 老祖宗的脸 / 先人的脸
  String.raw`(?:祖宗|祖宗八代|老祖宗|先人|前辈|上辈)(?:八代)?(?:[^。]{0,4})?(?:的)?(?:[^。]{0,4})?(?:脸|脸面|颜面|名声|名誉|英名)(?:[^。]{0,4})?(?:都|也|全|尽)?(?:[^。]{0,4})?(?:丢|丢尽|丢光|丢尽|扫|损|毁|辱|赔上)`,
  // 家门不幸 / 家门蒙羞 / 家运衰败
  String.raw`(?:家门|家运|家风|家声|家族的名声|家族的名誉)(?:[^。]{0,4})?(?:不幸|蒙羞|受辱|受损|败坏|衰败|扫地|尽失|毁于|毁在|葬送)`,
  // 我的脸往哪搁 / 往哪放 / 叫我怎么见人
  String.raw`(?:我|我们|父母|爸妈|这)?(?:[^。]{0,4})?(?:老)?(?:脸|脸面|颜面|老脸)(?:[^。]{0,4})?(?:往|叫|教)(?:[^。]{0,4})?(?:哪|哪里|哪儿)(?:[^。]{0,4})?(?:搁|放|摆|放|去|见人|出门|露面)`,
  // 抬不起头 / 怎么抬头 / 在亲戚面前怎么见人
  String.raw`(?:让|叫|使得|害)(?:[^。]{0,6})?(?:我们|全家|一家人|家族|父母|爸妈|我)(?:[^。]{0,4})?(?:在|于)(?:[^。]{0,6})?(?:亲戚|亲友|邻里|街坊|邻居|同事|外人|众人|人前|熟人|全村|全县|大家)(?:[^。]{0,4})?(?:面前|跟前|中间|眼里|眼里)(?:[^。]{0,4})?(?:怎么|如何|哪能|岂能)(?:[^。]{0,4})?(?:抬头|抬头做人|见人|露面|做人|抬头来|说话)`,
  // 名声 / 名誉 / 颜面 + 毁 / 丢 / 丢尽
  String.raw`(?:把|将)(?:[^。]{0,6})?(?:全家|整个家|家族|咱家|我们|我|父母|祖宗|老×家|家里)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,4})?(?:名声|名誉|颜面|脸面|荣誉|名节|清誉)(?:[^。]{0,4})?(?:都|也|全|一下子|一下子全)(?:[^。]{0,4})?(?:毁|丢|丢尽|败坏|葬送|赔上|搭上|玷污|抹黑)`,
  // 成了笑柄 / 成了全村的笑话 / 成了别人的谈资
  String.raw`(?:让|叫|使得|害)(?:[^。]{0,6})?(?:我们|全家|家族|咱家|家里|父母|祖宗)(?:[^。]{0,4})?(?:成|变成|沦为)(?:[^。]{0,6})?(?:了)?(?:[^。]{0,6})?(?:全村|全县|全镇|全城|大家|所有人|邻里|亲戚|众人)(?:[^。]{0,4})?(?:的)?(?:[^。]{0,4})?(?:笑柄|笑话|笑料|谈资|谈柄|把柄|反面教材|茶余饭后的)`,
  // ── 英文
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+(?:disgracing|disgracin')\s+(?:the\s+)?(?:whole|entire)\s+(?:family|clan|name)\b`,
  String.raw`\b(?:you|u)\s+(?:brought|bring|have\s+brought)\s+shame\s+(?:to|on|upon)\s+(?:our|the|this)\s+(?:whole\s+)?(?:family|name|house|household)\b`,
  String.raw`\b(?:how\s+do\s+you\s+expect\s+me\s+to\s+)?(?:show|hold\s+up)\s+my\s+face\b`,
  String.raw`\b(?:embarrassed|humiliated)\s+(?:us|me|the\s+whole\s+family)\s+in\s+front\s+of\s+(?:everyone|everybody|all\s+our|the\s+whole)\b`,
  // [r664] 中文左腿补支（断绝式羞辱 / 第一人称受事 / 受事归责）
  String.raw`(?:从来|从未|历来|一直|还)(?:[^。]{0,4})?(?:没|没有|未)(?:[^。]{0,4})?(?:出过|生过|有过|见)(?:[^。]{0,4})?(?:你|您)(?:[^。]{0,8})?(?:这样|这种|这么一个)(?:[^。]{0,6})?(?:丢人|现眼|丢脸|东西|玩意|人|货|种)`,
  String.raw`(?:我|我们)(?:[^。]{0,8})?(?:在|于)(?:[^。]{0,8})?(?:亲戚|亲友|邻里|街坊|邻居|同事|外人|众人|人前|熟人|全村|全县|大家|家族|祖宗)(?:[^。]{0,4})?(?:面前|跟前|中间|眼里)(?:[^。]{0,6})?(?:还|可|叫|让)?(?:[^。]{0,4})?(?:怎么|如何|哪能|岂能)(?:[^。]{0,4})?(?:见人|抬头|露面|做人|出门|抬头来|说话)`,
  String.raw`(?:名声|名誉|颜面|脸面|荣誉|名节|清誉)(?:[^。]{0,8})?(?:全|都|一下子|一下子全|顿时|顷刻)(?:[^。]{0,4})?(?:毁|丢|败坏|葬送|赔上|搭上|玷污|抹黑|毁掉)(?:在|到)(?:你|您)`,
].join('|'), 'i');

// ─── 支②右腿: 指向对方的问责或断绝 ────────────────────────────────────
const PURSUE2_ZH = new RegExp([
  // 你还有脸 / 你还有脸回来 / 你怎么还有脸
  String.raw`(?:你|您)(?:[^。]{0,6})?(?:还|居然|竟然|怎么|如何)(?:[^。]{0,4})?(?:有脸|好意思|敢|肯)(?:[^。]{0,6})?(?:回来|见我|回家|出现|提|说|讲|进门|露面)`,
  // 我们家没有你这样的人 / 老×家没有你
  String.raw`(?:我们|咱|咱们|我|老)?(?:[^。]{0,4})?(?:家|家里|家族|家门|老×家)(?:[^。]{0,4})?(?:没有|不认|不承认|容不下|出不起)(?:[^。]{0,6})?(?:你|您)(?:[^。]{0,6})?(?:这样|这种|这么一个|这样的人|这种人|东西|玩意)`,
  // 居然还怪我 / 你凭什么这么对我 / 你看看你干的好事
  String.raw`(?:你|您)?(?:[^。]{0,6})?(?:居然|竟然|还)(?:[^。]{0,4})?(?:怪我|埋怨我|责怪我|说我|挑我|要求我|跟我讲|跟我提|顶撞我|反驳我|拒绝我)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:凭什么|有什么资格|哪来的资格)(?:[^。]{0,6})?(?:这么|这样|如此|跟|与|对我|说我|讲|顶|怪|埋怨|要求|挑)`,
  String.raw`(?:你|您)(?:[^。]{0,6})?(?:看看|瞧瞧|想想|看看你|瞧瞧你)(?:[^。]{0,6})?(?:干|做|闯|惹)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:好事|好戏|祸|麻烦|岔子|成绩|表现)`,
  // 让我们怎么抬头 / 怎么有脸见人
  String.raw`(?:让|叫)(?:[^。]{0,6})?(?:我们|全家|一家人|家族|父母|我)(?:[^。]{0,6})?(?:怎么|如何|哪能|岂能)(?:[^。]{0,4})?(?:抬头|见人|露面|做人|出门|在)`,
  // 断绝定性：我没有你这个孩子 / 你不配姓
  String.raw`(?:我|我们|咱)(?:[^。]{0,4})?(?:没有|不认|不承认)(?:[^。]{0,4})?(?:你|您)(?:[^。]{0,4})?(?:这个|这么个|这样的)?(?:[^。]{0,6})?(?:孩子|儿子|女儿|晚辈|后代|骨肉)`,
  // ── 英文
  String.raw`\b(?:look\s+at|look\s+what)\s+(?:what\s+)?(?:you|u)\s+(?:have\s+)?(?:done|caused|brought)\b`,
  String.raw`\bhow\s+could\s+you\s+(?:do\s+this\s+to|bring\s+shame\s+to)\s+(?:us|this\s+family|your\s+family|me)\b`,
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+(?:no\s+(?:longer\s+)?(?:a\s+)?(?:son|daughter|child|member)\s+of\s+this\s+family|not\s+my\s+(?:son|daughter|child)\s+anymore)\b`,
  // [r664] 英文问责族：左腿已定性名誉，右腿以 you + 问责动词承接
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+(?:disgracing|disgracin'|shaming|humiliating|embarrassing)\s+(?:the|our|your|this)\s+(?:whole\s+)?(?:family|clan|house|household|name)\b`,
  String.raw`\b(?:you|u)\s+(?:brought|bring|have\s+brought|has)\s+(?:shame|disgrace|dishonor|humiliation)\s+(?:to|on|upon)\s+(?:our|the|this|your)\s+(?:whole\s+)?(?:family|name|house|household)\b`,
  String.raw`\b(?:you|u)\s+(?:embarrassed|humiliated|disgraced|shamed)\s+(?:us|me|the\s+whole\s+family)\s+in\s+front\s+of\s+(?:everyone|everybody|all|the)\b`,
  String.raw`\b(?:you|u)\s+(?:did|do|have\s+done)\s+(?:this|that)\s+(?:to\s+)?(?:us|this\s+family|your\s+family|your\s+parents|me)\b`,
  String.raw`\b(?:you|u)\s+(?:disappointed|disappoints|let\s+down)\s+(?:us|me|the\s+whole|all)\s+(?:family|of\s+us)\b`,
  String.raw`\b(?:you|u)\s+(?:made|make)\s+(?:us|me|the\s+family|your)\s+(?:lose\s+face|look\s+bad)\b`,
  String.raw`\b(?:you|u)\s+(?:do|did|have\s+done)\s+(?:it|this)\s+(?:to|with)\s+(?:our|the)\s+(?:family|reputation|name)\b`,
  String.raw`\b(?:you|u)\s+(?:are|'re)\s+(?:a\s+)?(?:disgrace|shame|embarrassment|dishonor)\s+(?:to|for)\s+(?:this|our|the|your)\s+(?:family|house|name)\b`,
  String.raw`\b(?:you|u)\s+(?:did|do|have\s+done)\s+(?:that|this)\s+(?:to\s+)?(?:your\s+family|your\s+parents|us)\b`,
  String.raw`\b(?:you|u)\s+(?:have\s+)?(?:ruined|destroyed|damaged|tarnished)\s+(?:our|the|your)\s+(?:family\s+)?(?:name|reputation|honor|standing)\b`,
  // [r664] 中文右腿补支（你让我们 / 反问问责 / 行为定性 / 受事归责）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:让|叫|使得|害)(?:[^。]{0,4})?(?:我|我们|咱|咱们|全家|家里人|家族)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:知不知道|知不知道？|知道不知道|明白|清楚|意识到)(?:[^。]{0,4})?(?:吗|么|呢|？|\?)?`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:干的|做的|闯的|惹的|搞的)(?:[^。]{0,4})?(?:事|好事|祸|麻烦|岔子)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:还|居然|竟然|就|也|到底)?(?:[^。]{0,4})?(?:这样|这么|如此)(?:[^。]{0,4})?(?:做|干|考|搞|闹|折腾|来|去|对待)`,
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:考|拿|挣)(?:[^。]{0,4})?(?:这点|这么点|这一点|那点|这点点)(?:[^。]{0,4})?(?:分|成绩|分数|钱|出息)`,
  String.raw`(?:毁|丢|败坏|葬送|赔上|搭上|砸)(?:在|到)(?:你|您)(?:[^。]{0,4})?(?:手里|手上|身上|头上)`,
  // [r664] 英文反问问责族（show my face / how could you / after what you did）
  String.raw`\b(?:how|why)\s+(?:do|did|would|can|could|should)\s+(?:you|u)\s+(?:expect|want|ask)\s+(?:me|us)\s+to\s+(?:show|hold\s+up|face|live\s+with)\b`,
  String.raw`\b(?:after|given)\s+(?:all\s+)?(?:what|everything)\s+(?:you|u)\s+(?:have\s+)?(?:done|caused|did)\b`,
  String.raw`\b(?:you|u)\s+(?:did|do|have\s+done|went\s+and)\s+(?:this|that|it)\s+(?:to|with)\s+(?:your|our|the|this)\b`,
  String.raw`\b(?:how|could|why)\s+(?:could|can|would)\s+(?:you|u)\s+(?:do|say|act|behave|treat)\b`,
].join('|'), 'i');

// ─── G1: 荣誉正当学术论述（荣誉是被研究对象，不是施压工具）──────────────
const HONOR_STUDY_ZH = new RegExp([
  // 荣誉制度 / 荣誉体系 / 荣誉文化 + 历史/学术动词
  String.raw`(?:荣誉|名誉|声誉|名节)(?:制度|体系|文化|观念|机制|传统|概念|思想)(?:[^。]{0,10})?(?:的)?(?:[^。]{0,10})?(?:历史|渊源|起源|演变|发展|形成|研究|变迁|衰落|消亡|复兴)`,
  // 学术研究 + 荣誉/面子
  String.raw`(?:研究|学者|论文|著作|学科|课题)(?:[^。]{0,8})?(?:中|里|中的)?(?:[^。]{0,6})?(?:荣誉|面子|名誉|羞耻|声望)(?:[^。]{0,8})?(?:文化|观念|现象|机制|体系|概念|研究|议题)`,
  // 荣誉 + 动词 + 对象（第三人称研究语境）
  String.raw`(?:荣誉|荣光|荣耀)(?:[^。]{0,8})?(?:属于|归于|归于|献给|授予|颁给|授予)(?:[^。]{0,8})?(?:那些|这些|他|她|他们|她们|为国|为人民|集体)`,
  // 英文
  String.raw`\b(?:honor\s+codes?|honor\s+systems?|honor\s+culture)\s+(?:exist|existed|emerged|originated|developed|vary|differ|are\s+(?:studied|examined|analyzed))\b`,
  String.raw`\b(?:scholars|researchers|studies|anthropologists|sociologists)\s+(?:of\s+)?(?:honor|shame|face|reputation|prestige)\b`,
].join('|'), 'i');

// ─── G2: 文化研究与社会分析语境（本族是被分析、被警惕的对象）─────────────
const CULTURE_ZH = new RegExp([
  // 面子文化 / 耻感文化 / 荣誉文化 + 研究/讨论
  String.raw`(?:面子|耻感|羞辱|羞耻|荣誉|名誉|声誉)(?:文化|心理|观念|现象|机制|逻辑|社会)(?:[^。]{0,8})?(?:是|为|属于)(?:[^。]{0,8})?(?:中国|东亚|传统|社会|人际|关系)(?:[^。]{0,8})?(?:研究|关系|文化|现象|课题|对象|议题|学术)`,
  // 社会研究 + 家庭期望/名誉
  String.raw`(?:社会学|社会|文化|人类学|心理学)(?:[^。]{0,6})?(?:研究|学者|视角|分析|观察)(?:[^。]{0,8})?(?:家庭|家族|集体|群体)(?:[^。]{0,6})?(?:期望|压力|名誉|荣誉|约束|规范|舆论)`,
  // 家族名誉不应 / 不能 + 绑架/成为工具
  String.raw`(?:家族|家庭|集体)(?:[^。]{0,6})?(?:名誉|荣誉|名声|期望|面子)(?:[^。]{0,6})?(?:不应|不能|不该|别|不要|绝非)(?:[^。]{0,8})?(?:成为|当成|当作|沦为|异化|绑架|要挟|工具|筹码|压力)`,
  // 警惕/反思 + 家族名誉施压
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,8})(?:警惕|反思|摆脱|跳出|识别|拒绝)(?:[^。]{0,10})(?:家族|家庭|集体)(?:[^。]{0,8})(?:名誉|荣誉|期望|面子|羞耻|压力)`,
  // 英文
  String.raw`\b(?:face|honor|shame)\s+(?:culture|dynamics|politics|sociology)\s+(?:is|are|shapes|influences|has\s+been)\b`,
  String.raw`\b(?:studies|research|analysis)\s+(?:of|on)\s+(?:family|collective)\s+(?:honor|shame|expectations|pressure)\b`,
].join('|'), 'i');

// ─── G3: 正当第三人称与家族事务陈述（无指向对方的问责）─────────────────
const THIRDPERSON_ZH = new RegExp([
  // 家族企业 / 家族传承 + 事务动词
  String.raw`(?:家族|家庭)(?:企业|事业|生意|传承|传统|历史)(?:[^。]{0,8})?(?:涉及|需要|要求|意味着|往往|通常|常常)(?:[^。]{0,10})?(?:代际|世代|两代|几代|前后)(?:[^。]{0,8})?(?:期望|协调|磨合|交接|传承|经营|管理)`,
  // 与亲戚的往来 / 走动 + 社交/生活
  String.raw`(?:与|和)(?:[^。]{0,6})?(?:亲戚|亲友|族人|同乡|邻里)(?:[^。]{0,6})?(?:的)?(?:[^。]{0,6})?(?:往来|走动|联系|交往|相处|关系)(?:[^。]{0,8})?(?:是|为|构成)(?:[^。]{0,10})?(?:社交|生活|人情|关系|网络|常态|部分|组成)`,
  // 传统村落 + 公共舆论约束（第三人称描述）
  String.raw`(?:传统|乡土|村落|民间|地方)(?:[^。]{0,8})?(?:中|里|社会)(?:[^。]{0,8})?(?:公共|集体|社群)(?:[^。]{0,6})?(?:舆论|目光|评价|压力|约束|监督)(?:[^。]{0,8})?(?:对|会|起着)(?:[^。]{0,8})?(?:个人|行为|成员|村民)`,
  // 英文
  String.raw`\b(?:family|kinship)\s+(?:business|enterprise|succession|legacy)\s+(?:involves|requires|often|typically)\s+(?:intergenerational|generational|multi-generational)\b`,
  String.raw`\b(?:keeping\s+in\s+touch|maintaining\s+ties)\s+with\s+(?:relatives|extended\s+family|kin)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问问责不豁免）──────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFamilyShameCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SHAME_ZH_ = R.SHAME_ZH || SHAME_ZH;
  const PURSUE2_ZH_ = R.PURSUE2_ZH || PURSUE2_ZH;
  const HONOR_STUDY_ZH_ = R.HONOR_STUDY_ZH || HONOR_STUDY_ZH;
  const CULTURE_ZH_ = R.CULTURE_ZH || CULTURE_ZH;
  const THIRDPERSON_ZH_ = R.THIRDPERSON_ZH || THIRDPERSON_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '家族羞耻胁迫×集体名誉受损×指向对方问责(zh)'
      : 'family-shame-coercion×collective-honor-loss×accusation(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：荣誉学术论述 / 文化研究 / 正当第三人称 / 句首咨询
  if (HONOR_STUDY_ZH_.test(text)) return miss();
  if (CULTURE_ZH_.test(text)) return miss();
  if (THIRDPERSON_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① × 支② 双腿共现
  if (!SHAME_ZH_.test(text)) return miss();
  if (PURSUE2_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkFamilyShameCoercion,
  __internals: () => ({
    SHAME_ZH, PURSUE2_ZH,
    HONOR_STUDY_ZH, CULTURE_ZH, THIRDPERSON_ZH, QUESTION_ZH,
  }),
};
