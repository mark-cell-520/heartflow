/**
 * src/medical-coercion.js — 「医疗自主胁迫」检测器（第 124 个判别维度）
 *
 * [r680 立项建模块] 候选来源：r678/r679 探测器遗留队列，本轮用
 * scripts/round-680-family-probe.js 在 123 维引擎上复量（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格）：
 * C 族攻击 10 条漏判 8 条（80%）、全维度零命中 8 条、良性 6 条 0 误伤
 * （另 2 条分别被 liberty_restriction / sarcasm 判 verify，新维度仍命中）。
 * decision 本体一次选出（scripts/round-680-decide.js 读
 * /tmp/decide-opts-680.json，composite_score 0.92 / confidence 0.88 /
 * identity alignment 100%，无拒选）：B medical_coercion 0.92 >
 * A deprivation_coercion 0.90 > C substance_coercion 0.89 >
 * D love_bombing 0.83。本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「医疗自主胁迫」（medical coercion）——操控者以**禁止就医、
 * 强制停药或强制替代疗法、阻断就医渠道、控制医疗资源、否定病情**的
 * 方式剥夺对方的医疗自主权，逼迫对方放弃治疗或服从自己的「治疗」
 * 安排。这是权力不对等场景中虐待与控制的早期健康信号（Duluth 控制轮
 * 的「使用男性特权」与健康控制形态）：
 *   不许你去医院，那些医生都是骗子。
 *   我让你停药你就得停，不吃出问题我负责。
 *   信我的方子，再敢偷偷买药我打断你的腿。
 *   Do not see a doctor; faith alone will cure you, trust me.
 *
 * 为什么现有 123 个维度拦不住（r680 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——emotional_manipulation 管
 *   情感绑定、dangerous_instruction 管危险操作指令、liberty_restriction
 *   管行动物品控制（手机/证件/钥匙），都不覆盖「禁止/强制医疗行为」
 *   这个医疗自主剥夺组合；样本 7（医保卡锁起）虽被 liberty_restriction
 *   判 verify，但其对象是**医疗资源**且本维度提供更精确的医疗语境判据。
 *
 * 判据（五类独立通路 + 一类双腿共现，任中一类即判定）：
 *   · P1 禁止医疗行为（禁止动词 × 医疗对象，两种语序都收）；
 *   · P2 强制医疗决定（控制者宣告腿 × 医疗覆决定腿，或替代疗法结构）；
 *   · P3 就医阻断威胁（再敢/再提 × 医疗行为 × 威胁后件）；
 *   · P4 医疗资源控制（对方医疗物品 × 控制动作，须带归属标记）；
 *   · P5 病情否定 × 就医阻断（双腿共现，须指向对方）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 权利/规范/教育陈述（患者有权/知情同意/不得非法/宗教信仰自由）；
 *   · G2 建议就医（及时就医/延误治疗/should see a doctor——方向相反）；
 *   · G3 医疗流程语境（术前禁食/空腹/检验前——正当医疗指令）；
 *   · G4 句首咨询提问（如何…/What should I do…）。
 *
 * [r680 实现纪律] 同 r642-r679：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义
 *   （r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，只影响 detail
 *   文案；字面端点不含任何反斜杠，零风险）。
 */

'use strict';

// ─── P1: 禁止医疗行为（禁止动词 × 医疗对象，两种语序）────────────────
// 语序 A：禁止动词在前（「不许你去医院」「不准产检」）
const FORBID_ZH = new RegExp([
  // 不用「不能」——「这个药不能停」是常规医嘱，收进来会误伤（见 G3 同源教训）
  String.raw`(?:不许|不准|不让|禁止|别想|不准许|甭想|不许去|不准去)[^。]{0,12}(?:去医院|看医生|看病|就医|住院|产检|检查|复查|体检|买药|抓药|吃药|打针|输液|心理医生|心理咨询|治疗|复诊|配药|拿药|问诊|手术|化疗|透析)`,
  // 通用形：禁止动词 + 医疗动作 + 药物/器械（「禁止吃任何药」）
  String.raw`(?:不许|不准|不让|禁止|别想)[^。]{0,8}(?:吃|喝|服用|打|输|用|买|购买)[^。]{0,6}(?:药|药品|针剂|药剂|处方|胰岛素|止痛药)`,
  // 语序 B：医疗对象在前（「打针吃药都不许」「产检别想了」）
  String.raw`(?:医院|医生|药|药品|产检|检查|治疗|打针|吃药|输液|心理|住院|手术|复查|化疗|透析)[^。]{0,6}(?:都不许|不许|不让|都不行|也不行|禁止|别去|别想|不准|免谈)`,
].join('|'), 'i');

const FORBID_EN = new RegExp([
  String.raw`\b(?:do\s+not|don'?t|never|not\s+allowed\s+to|can'?t|cannot)\s+(?:see|visit|go\s+to|consult|take|get)\b[^.]{0,30}\b(?:doctor|hospital|physician|clinic|medication|medicine|pills?|therapy|treatment|checkup|therapist|psychiatrist)`,
  String.raw`\b(?:doctor|hospital|medication|medicine|pills?|therapy|treatment|checkup)\b[^.]{0,20}\b(?:is|are)\s+(?:not\s+allowed|forbidden|off[-\s]?limits)\b`,
].join('|'), 'i');

// ─── P2: 强制医疗决定 ────────────────────────────────────────────────
// 腿 A：控制者宣告（第一人称强制语气；不含裸「你必须」——那是医嘱常见形）
const OVERRIDE_VOICE_ZH = new RegExp([
  String.raw`我让你`,
  String.raw`我数到三`,
  String.raw`听我的`,
  String.raw`我说了算`,
  String.raw`由我(?:来)?(?:决定|说了算|定)`,
  String.raw`必须听我`,
  String.raw`我管你`,
  String.raw`你敢不听`,
  String.raw`我负责`,
  String.raw`不信拉倒`,
].join('|'), 'i');

// 腿 B：医疗覆决定（停药/否定治疗必要/硬扛）
const MEDICAL_OVERRIDE_ZH = new RegExp([
  String.raw`停药`,
  String.raw`停针`,
  String.raw`停止治疗`,
  String.raw`暂停治疗`,
  String.raw`不用治`,
  String.raw`不治了`,
  String.raw`没必要治`,
  String.raw`不必治`,
  String.raw`硬扛`,
  String.raw`扛过去`,
  String.raw`忍忍就好`,
  String.raw`自己会好`,
  // 动宾后置形（「把药停了」「疗程断了」——口语把字句，词面模式最大盲区）
  String.raw`(?:药|药品|治疗|疗程|针剂|胰岛素)[^。]{0,4}(?:停了|停掉|断了|戒了)`,
  // 单方管辖宣告（须指向对方的医疗安排）
  String.raw`(?:你的|他的|她的|孩子的|对方的)[^。]{0,8}(?:治疗|医疗|用药|手术|检查|复查|方案)[^。]{0,8}(?:由我|我来|我说了|听我|我定|我说了算|我做主)`,
].join('|'), 'i');

// P2c 替代疗法结构（独立通路：以仪式/偏方替代正规医疗本身即胁迫形状）
const RITUAL_ZH = new RegExp([
  String.raw`信教治病`,
  String.raw`信教能治`,
  String.raw`信教就可以治`,
  String.raw`求神治病`,
  String.raw`喝符水`,
  String.raw`画符治病`,
  String.raw`跳大神`,
  String.raw`拜佛治病`,
  String.raw`祈祷治病`,
  String.raw`念经治病`,
  String.raw`气功治病`,
  String.raw`信我的(?:方子|法子|偏方|秘方|话)`,
  String.raw`(?:偏方|秘方|符水|神药|仙丹)[^。]{0,8}(?:能治|治好|管用|比药强|胜过大药|包治)`,
  String.raw`(?:不用|不需要|别)(?:吃药|打针|去医院|看医生)[^。]{0,8}(?:信|拜|求|祈祷|念)`,
].join('|'), 'i');

const OVERRIDE_VOICE_EN = new RegExp([
  String.raw`\bi\s+(?:told|made|order|force)\w*\s+you\b`,
  String.raw`\blisten\s+to\s+me\b`,
  String.raw`\bmy\s+(?:way|decision|call)\b`,
  String.raw`\bi\s+(?:decide|say\s+so)\b`,
  String.raw`\byou\s+(?:will|'ll)\s+do\s+(?:as|what)\s+i\s+(?:say|tell)\b`,
].join('|'), 'i');

const MEDICAL_OVERRIDE_EN = new RegExp([
  String.raw`\bstop\s+(?:taking|using)\s+(?:your\s+)?(?:meds?|medication|pills?|medicine|treatment|therapy|insulin)`,
  String.raw`\byou\s+don'?t\s+need\s+(?:that\s+)?(?:medicine|medication|treatment|therapy)\b`,
  String.raw`\byou\s+don'?t\s+need\s+(?:a\s+)?doctor\b`,
  // 控制者宣告 + 医疗安排（「You will do as I say about your treatment」）
  String.raw`\bas\s+i\s+(?:say|tell)\s+(?:you\s+)?about\s+(?:your\s+)?(?:treatment|medical|medication|therapy|health|care)`,
  String.raw`\byour\s+(?:treatment|medical\s+care|medication)\s+is\s+(?:my|up\s+to\s+me)\b`,
].join('|'), 'i');

// P2c 英文侧（仪式/信仰替代医疗）
const RITUAL_EN = new RegExp([
  String.raw`\bfaith\s+(?:alone|healing)\b`,
  String.raw`\bprayer\s+(?:will|can)\s+(?:heal|cure)\b`,
  String.raw`\b(?:faith|prayer|god|jesus|allah|buddha)\b[^.]{0,24}\b(?:cure|heal)\w*\b`,
  String.raw`\b(?:cure|heal)\w*\b[^.]{0,24}\b(?:faith|prayer)\b`,
  String.raw`\b(?:homeopathy|herbs?|rituals?)\s+(?:will|can)\s+(?:cure|fix|heal)\b`,
  String.raw`\bgod\s+will\s+(?:heal|cure)\s+you\b`,
  String.raw`\bonly\s+(?:god|faith|prayer)\s+can\s+(?:heal|cure)\b`,
].join('|'), 'i');

// ─── P3: 就医阻断威胁（再敢/再提 × 医疗行为 × 威胁后件）────────────────
const BLOCK_THREAT_ZH = new RegExp([
  String.raw`(?:再敢|再提|要是再|如果)[^。]{0,12}(?:去医院|看医生|看病|就医|买药|抓药|吃药|产检|检查|治疗|住院|复诊|心理咨询|心理医生|问诊|配药)[^。]{0,20}(?:就|我)[^。]{0,14}(?:打断|滚|揍|打你|离|赶|饶|好看|后果|试试|厉害|瞧|剁|撕|砸|摔|收|删|关|罚|离|撵)`,
].join(''), 'i');

const BLOCK_THREAT_EN = new RegExp([
  String.raw`\b(?:if\s+you\s+)?(?:mention|see|visit|call|contact)\w*\s+(?:a\s+)?(?:doctor|hospital|therapist)\b[^.]{0,30}\b(?:i\s+will|you'?ll\s+(?:be|regret|pay))`,
  String.raw`\b(?:one\s+more\s+word|another\s+word)\s+about\s+(?:the\s+)?(?:doctor|hospital|therapy|medication)\b`,
].join('|'), 'i');

// ─── P4: 医疗资源控制（须带归属标记，排除自述与正当保管）──────────────
const RESOURCE_ZH = new RegExp([
  // 归属在前（「你的医保卡和药都锁起来了」）
  String.raw`(?:你的|他的|她的|孩子的|对方的|病人的)[^。]{0,8}(?:医保卡|社保卡|合作医疗卡|病历|病历本|处方|诊断书|检查报告|药|药品|药剂|胰岛素|止痛药)[^。]{0,10}(?:锁|收走|收了|扣着|扣下|扣了|藏|断|停|剪|撕|拿走|没收)`,
  // 控制者动作在前（「我停了你的药」）
  String.raw`(?:我把|我将|我)[^。]{0,6}(?:锁|收|扣|藏|断|停|剪|撕)[^。]{0,6}(?:你|他|她)的[^。]{0,6}(?:药|药品|针剂|医保卡|病历|处方)`,
].join('|'), 'i');

const RESOURCE_EN = new RegExp([
  String.raw`\b(?:your|his|her|their)\s+(?:medication|medicine|pills?|prescriptions?|insurance\s+card|medical\s+records?|insulin|inhaler|epipen|medical\s+supplies?)\b[^.]{0,20}\b(?:locked|hid|withheld|took|kept|confiscated|cut|stopped)`,
  String.raw`\bi\s+(?:locked|hid|withheld|took|kept|confiscated|cut|stopped)\b[^.]{0,20}\b(?:your|his|her)\s+(?:medication|medicine|pills?|prescriptions?|insurance|insulin|inhaler|epipen|medical\s+supplies?)`,
].join('|'), 'i');

// ─── P5: 病情否定 × 就医阻断（双腿共现，须指向对方）──────────────────
// 严腿：病情词在前、否定词在后（「你的病都是自己想出来的」）
const DENY_ILL_ZH = new RegExp([
  String.raw`(?:你|他|她)[^。]{0,8}(?:病|疼|痛|抑郁|焦虑|难受|不舒服|生病)[^。]{0,14}(?:是想出来的|想出来的|装|矫情|娇情|没病|不是病|小病|心理作用|闲的|懒|夸张|放大)`,
].join(''), 'i');

// 松腿：否定词在前（「你没病」「你就是懒，不是抑郁」）——必须与强阻断腿共现，
// 单独出现可能是医生安慰（「你没病，注意观察」）不自判
const DENY_ILL_LOOSE_ZH = new RegExp([
  String.raw`(?:你|他|她)(?:根本|其实|就是|压根|完全)?(?:没病|没得病|没有病|不是病|不是什么病|没病没灾|小毛病|小病)`,
  String.raw`(?:你|他|她)(?:就是|纯粹|只是|根本)[^。]{0,4}(?:懒|矫情|娇情|装的|闲的|夸张|想太多|钻牛角尖)`,
].join('|'), 'i');

// 强就医阻断腿（用于松腿组合）
const DENY_CARE_STRONG_ZH = new RegExp([
  String.raw`不许看`,
  String.raw`别去(?:医院|看)`,
  String.raw`别治`,
  String.raw`回去睡觉`,
  String.raw`睡觉就好`,
  String.raw`躺躺就好`,
  String.raw`忍忍`,
  String.raw`扛过去`,
  String.raw`自己(?:会|就)好`,
  String.raw`熬过去`,
  String.raw`硬扛`,
].join('|'), 'i');

// 弱就医阻断腿（只与严腿组合）
const DENY_CARE_ZH = new RegExp([
  String.raw`不用治`,
  String.raw`不用看`,
  String.raw`不需要看`,
  String.raw`没必要看`,
  String.raw`没必要治`,
].join('|'), 'i');

const DENY_ILL_EN = new RegExp([
  String.raw`\byou\s+(?:are\s+)?(?:not\s+(?:really\s+)?(?:sick|ill|depressed)|don'?t\s+(?:really\s+)?(?:have|need)\b[^.]{0,20}\b(?:depression|anxiety|disorder|illness))\b`,
  String.raw`\byou\s+(?:don'?t|do\s+not)\s+have\s+(?:a\s+)?(?:real\s+)?(?:illness|disease|condition|disorder)\b`,
  String.raw`\b(?:it'?s|it\s+is|that'?s|that\s+is)\s+(?:all\s+)?in\s+your\s+head\b`,
  String.raw`\byou(?:'?re|\s+are)\s+just\s+(?:lazy|dramatic|exaggerating|seeking\s+attention|being\s+dramatic)\b`,
].join('|'), 'i');

const DENY_CARE_EN = new RegExp([
  String.raw`\b(?:you\s+)?(?:don'?t|do\s+not)\s+need\s+(?:a\s+)?(?:doctor|therapy|treatment|medication|pills?|therapist|counseling|psychiatrist)\b`,
  String.raw`\b(?:just\s+)?(?:sleep\s+it\s+off|get\s+over\s+it|tough\s+it\s+out|walk\s+it\s+off)\b`,
  String.raw`\bno\s+(?:doctor|therapy|treatment)\s+(?:needed|required)\b`,
].join('|'), 'i');

// ─── G1/G2/G3: 守门（权利/规范/教育、建议就医、医疗流程语境）──────────
const CONCEPT_ZH = new RegExp([
  // 权利与规范陈述
  String.raw`(?:患者|病人|儿童|未成年人|每个人|任何人|公民)[^。]{0,12}(?:有权|权利|权益)`,
  String.raw`知情同意`,
  String.raw`医疗自主`,
  String.raw`自主选择`,
  String.raw`(?:不得非法|任何人不得|法律禁止|严禁|明令禁止)[^。]{0,10}(?:扣押|扣留|剥夺|阻碍|干涉|限制)`,
  String.raw`宗教信仰自由`,
  String.raw`信仰自由`,
  String.raw`拒绝(?:必要的)?医疗(?:救助|救治|服务)[^。]{0,8}(?:违法|不可以|不允许|构成)`,
  // 建议就医（方向与攻击相反）
  String.raw`(?:建议|应该|应|宜|请尽早|请及时|要及时|及时|尽早就|尽快|立刻|立即)[^。]{0,6}(?:就医|看病|看医生|去医院|检查|诊断|治疗|复查|产检|问诊|咨询)`,
  String.raw`延误[^。]{0,10}(?:就医|治疗|诊断|病情|抢救)`,
  String.raw`(?:就医|看病|治疗|检查)[^。]{0,6}(?:权利|自由|保障|重要|必要|是关键|别拖|不能拖|不宜拖)`,
  // 医疗流程语境（术前/检验前禁食禁药是正当医疗指令）
  String.raw`术前`,
  String.raw`产前`,
  String.raw`检验前`,
  String.raw`空腹`,
  String.raw`禁食`,
  String.raw`(?:医生|医师|大夫)(?:说|建议|要求|交代|嘱咐)[^。]{0,12}(?:停|禁|暂)`,
  // 求助与教育
  String.raw`报警|求助|卫健委|医患办|医疗纠纷|投诉渠道|12320`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\bright\s+to\s+(?:refuse|choose|consent|decide)\b`,
  String.raw`\binformed\s+consent\b`,
  String.raw`\bmedical\s+(?:autonomy|freedom)\b`,
  String.raw`\b(?:not\s+allowed|illegal|unlawful|a\s+crime)\b[^.]{0,24}\b(?:withhold|deny|block|prevent)\b`,
  String.raw`\bfreedom\s+of\s+religion\b`,
  String.raw`\b(?:seek|get|consult)\s+(?:medical\s+)?(?:care|attention|advice|help)\b`,
  String.raw`\bshould\s+(?:see|visit|consult)\s+(?:a\s+)?(?:doctor|physician|therapist)\b`,
  String.raw`\bdelaying\s+(?:treatment|care)\b`,
  String.raw`\bdo\s+not\s+delay\b`,
  String.raw`\b(?:pre-?op|before\s+surgery|fasting)\b[^.]{0,20}\b(?:eat|drink|food|medication)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首，句中反问不豁免）──────────────────────
// 疑问形状含疑问词与指示代词主语（「这个偏方真的能治病吗？」是质疑不是
// 胁迫——r680 双向门禁实测该样本被 RITUAL 族误判，补指示代词开头后豁免）
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对|这个|那个|这种|那种|有人|别人|大家|网上|据说|听说)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMedicalCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const FORBID_ZH_ = R.FORBID_ZH || FORBID_ZH;
  const FORBID_EN_ = R.FORBID_EN || FORBID_EN;
  const OVERRIDE_VOICE_ZH_ = R.OVERRIDE_VOICE_ZH || OVERRIDE_VOICE_ZH;
  const MEDICAL_OVERRIDE_ZH_ = R.MEDICAL_OVERRIDE_ZH || MEDICAL_OVERRIDE_ZH;
  const RITUAL_ZH_ = R.RITUAL_ZH || RITUAL_ZH;
  const OVERRIDE_VOICE_EN_ = R.OVERRIDE_VOICE_EN || OVERRIDE_VOICE_EN;
  const MEDICAL_OVERRIDE_EN_ = R.MEDICAL_OVERRIDE_EN || MEDICAL_OVERRIDE_EN;
  const RITUAL_EN_ = R.RITUAL_EN || RITUAL_EN;
  const BLOCK_THREAT_ZH_ = R.BLOCK_THREAT_ZH || BLOCK_THREAT_ZH;
  const BLOCK_THREAT_EN_ = R.BLOCK_THREAT_EN || BLOCK_THREAT_EN;
  const RESOURCE_ZH_ = R.RESOURCE_ZH || RESOURCE_ZH;
  const RESOURCE_EN_ = R.RESOURCE_EN || RESOURCE_EN;
  const DENY_ILL_ZH_ = R.DENY_ILL_ZH || DENY_ILL_ZH;
  const DENY_ILL_LOOSE_ZH_ = R.DENY_ILL_LOOSE_ZH || DENY_ILL_LOOSE_ZH;
  const DENY_CARE_ZH_ = R.DENY_CARE_ZH || DENY_CARE_ZH;
  const DENY_CARE_STRONG_ZH_ = R.DENY_CARE_STRONG_ZH || DENY_CARE_STRONG_ZH;
  const DENY_ILL_EN_ = R.DENY_ILL_EN || DENY_ILL_EN;
  const DENY_CARE_EN_ = R.DENY_CARE_EN || DENY_CARE_EN;
  const CONCEPT_ZH_ = R.CONCEPT_ZH || CONCEPT_ZH;
  const CONCEPT_EN_ = R.CONCEPT_EN || CONCEPT_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]/（等价 \u4e00-\u9fff）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式被写成双层反斜杠恒 false，只影响
  // detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '医疗自主胁迫×禁止就医/强制医疗决定/阻断威胁/资源控制/病情否定(zh)'
      : 'medical-coercion×forbid-care/force-override/block-threat/resource-control/deny-illness(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：权利/规范/教育陈述、句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // P1 禁止医疗行为（独立通路，两种语序各自成立）
  if (FORBID_ZH_.test(text)) return hitResult;
  if (FORBID_EN_.test(text)) return hitResult;
  // P2 强制医疗决定（腿 A × 腿 B 共现）
  if (OVERRIDE_VOICE_ZH_.test(text) && MEDICAL_OVERRIDE_ZH_.test(text)) return hitResult;
  if (OVERRIDE_VOICE_EN_.test(text) && MEDICAL_OVERRIDE_EN_.test(text)) return hitResult;
  // P2c 替代疗法结构（独立通路）
  if (RITUAL_ZH_.test(text)) return hitResult;
  if (RITUAL_EN_.test(text)) return hitResult;
  // P3 就医阻断威胁（独立通路）
  if (BLOCK_THREAT_ZH_.test(text)) return hitResult;
  if (BLOCK_THREAT_EN_.test(text)) return hitResult;
  // P4 医疗资源控制（独立通路）
  if (RESOURCE_ZH_.test(text)) return hitResult;
  if (RESOURCE_EN_.test(text)) return hitResult;
  // P5 病情否定 × 就医阻断（双腿共现：严腿×任意阻断，或松腿×强阻断）
  if (DENY_ILL_ZH_.test(text) && (DENY_CARE_ZH_.test(text) || DENY_CARE_STRONG_ZH_.test(text))) return hitResult;
  if (DENY_ILL_LOOSE_ZH_.test(text) && DENY_CARE_STRONG_ZH_.test(text)) return hitResult;
  if (DENY_ILL_EN_.test(text) && DENY_CARE_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkMedicalCoercion,
  __internals: () => ({
    FORBID_ZH, FORBID_EN,
    OVERRIDE_VOICE_ZH, MEDICAL_OVERRIDE_ZH, RITUAL_ZH,
    OVERRIDE_VOICE_EN, MEDICAL_OVERRIDE_EN, RITUAL_EN,
    BLOCK_THREAT_ZH, BLOCK_THREAT_EN,
    RESOURCE_ZH, RESOURCE_EN,
    DENY_ILL_ZH, DENY_ILL_LOOSE_ZH, DENY_CARE_ZH, DENY_CARE_STRONG_ZH,
    DENY_ILL_EN, DENY_CARE_EN,
    CONCEPT_ZH, CONCEPT_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
