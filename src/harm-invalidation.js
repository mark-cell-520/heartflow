/**
 * src/harm-invalidation.js — 「受害者伤害定性」检测器（第 76 个判别维度）
 *
 * [v6.8.25] 第 526 轮新增。固定 scout 池连续第 7 轮空
 * （/tmp/hf-scout-20261006-r526.txt：「未探测到新的零覆盖族」，
 * 与 r519-r525 连续第七轮相同），按 r505/r522 先例自建族级探针：
 *   · scripts/round-526-family-probe.js 扫 4 族，3 族可用；
 *   · scripts/round-526-overlap.js 交叉归因实测——A 族穿过样本
 *     10 条里 9 条 findings 完全空、moral_foundations 仅接管 1 条，
 *     C 族 8/8 空、D 族 5/6 空，确认真零覆盖族（不是已有维度漏报的小缺口）；
 *   · scripts/round-526-decide.js（HeartFlowDecision 本体）选 A。
 *     前三次返回 chosen:null：自然语言候选未触发 decision.js 的
 *     结构化数值字段解析（parseNumericFields 只读
 *     feasibility/consequence_value/risk/confidence），三项 composite
 *     全打平 0.84。第四次按实测数据补四个数值字段后成功选定：
 *     A=0.87 > C_fait_accompli=0.82 > D_collective_dilution=0.75，
 *     identity alignment 80%。
 *
 * 辨别的族：「受害者伤害定性」——把已经存在、已被证实的伤害重新
 * 定性为「想多了 / 玻璃心 / 心理作用 / 又没死人」，从而取消索赔、调查与
 * 追责的前提。它的落点不是「受害者自己也有责任」（victim_blaming 管
 * 归因），也不是「你觉得疼是错觉」（gaslighting 管认知否定），而是
 * **伤害这一事实本身被宣布为不存在或不值一提**。说话人不需要反驳任何
 * 一个事实：只要把「伤害」这个词的分量降下来，赔付义务、调查必要性与
 * 受害者的发言资格就一起消失了。
 *
 * 攻击形状（一条判定路由：伤害否认 × 抵消修饰限定语同句共现）：
 *   · 伤害否认：受伤/受损/受影响/被泄露/后遗症/不适/焦虑/压力
 *     被宣布为「没/不是/不存在/不算/并非」；
 *   · 抵消限定：把该否认归因为「心理作用/自己吓自己/想多了/
 *     小题大做/玻璃心/情绪化/不适应/又没死人/没人掉块肉」。
 *
 * 为什么现有维度拦不住：
 *   · victim_blaming 落点是「受害者自己也有责任」，要求存在一个责备
 *     受害者的动作；本族不谈责任分配，直接否认伤害存在。
 *   · gaslighting 落点是「你对现实的感知是错的」，须有对感知方的主观
 *     否定；本族否定的是伤害事实本身（可核验的伤情、影响名单）。
 *   · bad_faith / moral_foundations 只在综合论证姿态/道德基线上给分，
 *     不针对这个句式族（r506/r526 交叉归因实测：moral_foundations
 *     最多接管 1 条，其余 findings 全空）。
 *   · empty_answer / soft_deflection 管「答非所问」，本族答得很直接，
 *     只是把答案定成「没有伤害」。
 *
 * → verify 级：伤害是否成立、程度如何，是可以核验的事实问题，
 *    不是说话人可以单方定性的。命中时要求给出可核验的伤害取证
 *    （伤情鉴定、影响名单、影响面统计），而非用「心理作用」跳过核验。
 *     单句常是事故说明、医学陈述、情况通报的复述，rewrite 会误伤，
 *     故不升 rewrite。
 *
 * 明确不判的（豁免——正当的事实陈述与医学表述）：
 *   · 已取证的伤情/影响说明：经医院鉴定为轻微伤、受损名单已核实
 *   · 客观否定并附依据：未造成人身伤亡（附事故报告/鉴定结论）
 *   · 医学/心理学专业归因讨论：属于心理问题、诊断为焦虑症
 *   · 授权流程中的风险评估：评估显示风险可控
 */

'use strict';

// ─── H1: 伤害否认（伤害被宣布为不存在 / 不算 / 没什么）──────────
const HARM_DENY_ZH = new RegExp([
  // 「她根本没受伤/没受损」
  // 「不是真伤/不是什么大事」
  // 「没有/不存在实际伤害」
  // 「这点小伤/这点损失也算？」
  // 「算什么/也值得」——把伤害的量级压到不值得关注
  // 「又没死人/没人掉块肉」——极端量级校准作为否认手段
  // 「其实一点都不介意/根本没损失」（受害者自述被转述为不成立）
  // 「称不上/谈不上伤害」
  // [r527 补支] 量级否认：没什么大不了
  // [r527 补支] 受害表述被否定：未受任何影响/受损
  // [r527 补支] 转述否认：其实并没有真的受损/受影响
  // [r527 补支] 无人受损的量级校准（EN nobody was hurt 的 ZH 对应）
  '(?:根\s*本|压根|丝毫|一点|半点|丝毫|压根儿)?(?:没|未|不|毫无)(?:有|受|造成)(?:任何)?(?:受\s*伤|伤\s*害|损\s*失|受\s*损|受\s*伤|影\s*响|后\s*遗\s*症|不\s*适|中\s*毒|污\s*染|泄\s*露|故\s*障|破\s*损)',
  '(?:不\s*是|并\s*非|算\s*不\s*上|称\s*不\s*上)(?:什\s*么)?(?:真|真\s*正|实\s*质)(?:的)?(?:受\s*伤|伤\s*害|损\s*失|受\s*损|影\s*响|后\s*遗\s*症|不\s*适|泄\s*露|故\s*障)',
  '(?:没\s*有|不\s*存\s*在|未\s*构\s*成)(?:任\s*何)?(?:实\s*际|真\s*实|实\s*质|严\s*重)(?:的)?(?:受\s*伤|伤\s*害|损\s*失|受\s*损|影\s*响|后\s*遗\s*症|不\s*适|伤\s*亡|人\s*身\s*伤\s*害)',
  '(?:这|那)(?:点|一|点)(?:小|轻微|丁点)(?:的)?(?:伤|疼痛|不适|损失|损害|毛病|问题)',
  '(?:也\s*值\s*得|算|算\s*什\s*么|有\s*什\s*么)(?:什么|啥)?(?:大\s*不\s*了|了\s*不\s*起|严\s*重|可\s*说)?',
  '(?:又|根本|压根)?(?:没|未)(?:有|死|死\s*人|人\s*死|掉\s*块\s*肉|人\s*受\s*伤|人\s*缺\s*胳\s*膊\s*少\s*腿)',
  '(?:其\s*实|事\s*实\s*上|实\s*际\s*上)?(?:一?\s*点?\s*都?\s*不|丝毫?不|根本?不)(?:介\s*意|在\s*意|计\s*较|计\s*较|受\s*损|在\s*乎)',
  '(?:称|算|谈)(?:不|得)(?:上|是)(?:受|受\s*伤|伤\s*害|损\s*失|受\s*损|后\s*遗\s*症|不\s*适|严重)',
  '(?:没|未)(?:什|甚)(?:么|啥)(?:大|了)(?:不|的)(?:了|起)',
  '(?:没|未)(?:有|受)(?:遭|被|产|受)(?:任|何|任何|被|遭|受)(?:影|损|伤)(?:响|损|失|害|响)(?:，|,)?',
  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没|有)(?:真|真的|真心|实质)(?:受|被|遭|感|受)(?:损|影|累|响|响)(?:失|响|响)?',
  '(?:没|未)(?:有|见)(?:人|谁|任何)(?:受|掉|缺|受)(?:伤|块|胳|肉|腿|影)(?:肉|胳|腿|响|失)?',
  // [r527 补支][r528 修正] 否定词直接贴伤名：根本/压根/丝毫 + 没|未 + 受伤（无「有」）
  // r527 写入时误用双反斜杠，编译结果匹配「反斜杠+字母 s」而非空白，该支从未生效；r528 修正。
  '(?:根\s*本|压根|丝毫|一点|半点|压根儿)\s*(?:没|未)\s*(?:受\s*伤|伤\s*害|损\s*失|受\s*损|影\s*响|后\s*遗\s*症|不\s*适|中\s*毒|泄\s*漏)',
  // [r527 补支][r528 补前缀] 转述否认：大家/谁 + 其实/实际上 + 没 + (真的) + 受损
  '(?:大\s*家|谁|人\s*家)\s*(?:其\s*实|事\s*实\s*上|实\s*际\s*上)\s*(?:并)?\s*(?:没|未)\s*(?:有)?\s*(?:真\s*的|真正|实\s*质)?\s*(?:受\s*损|受\s*影\s*响|损\s*失|受\s*伤)',
  // [r527 补支][r528 补前缀] 无人受损的量级校准：又/也 + 没 + (有) + 人 + 掉块肉
  '(?:又|也|根本|压根|其实|实际上)\s*(?:没|未)\s*(?:有|见)?\s*(?:人|谁|任何\s*人)\s*(?:掉|受|缺|少)\s*(?:块|根|丝|点)\s*(?:肉|毛|毫)',
  // [r528 新支] 引述贬损：所谓X（把对方的受害举证定性为虚假表述）
  '所\s*谓\s*的?\s*(?:后\s*遗\s*症|影\s*响|伤\s*害|受\s*伤|损\s*失|压\s*力|疼\s*痛|不\s*适|症\s*状|创\s*伤|阴\s*影)',
  // [r528 新支] 转述受害声称：X说/称/抱怨 + (被|受) + 影响/波及/累及/折磨
  // 单独出现不构成否认（仍属正当受理），须与 MINIMIZE 侧归因支共现才命中
  '(?:你\s*说|你\s*称|你\s*讲|你\s*抱\s*怨|他\s*说|她\s*说|他\s*称|她\s*称|他\s*们\s*说|他\s*们\s*称|他\s*们\s*抱\s*怨|你\s*们\s*说|你\s*们\s*抱\s*怨|自\s*称)\s*(?:你\s*|自\s*己\s*)?(?:被|受)\s*(?:影\s*响|波\s*及|累\s*及|折\s*磨|拖\s*累)',
].join('|'));

const HARM_DENY_EN = new RegExp([
  // 「there was no real injury / no actual harm」
  '\\b(?:there\\s+(?:was|were|is)|it\\s+(?:was\\s+)?(?:caused|did))\\s*(?:not)?\\s*(?:a|any)\\s*' +
    '(?:real|actual|genuine|serious|material|significant|measurable)\\s+' +
    '(?:injury|harm|damage|loss|suffering|impact|setback)',
  // 「nobody is actually hurt / no one is really worse off」
  "\\b(?:nobody|no\\s+one|none\\s+of\\s+them)\\s+(?:is|are|was|were)\\s*" +
    "(?:actually|really|truly|genuinely)\\s+(?:hurt|harmed|worse\\s+off|affected|suffering)",
  // 「it was not a real injury」
  '\\b(?:it|this|that|the\\s+\\w+)\\s+(?:was|is)\\s+not\\s+a\\s+' +
    '(?:real|actual|genuine|serious|material|significant)\\s+' +
    '(?:injury|harm|damage|loss|suffering|impact|problem)',
  // 「no real harm was done」
  '\\bno\\s+(?:real|actual|genuine|material|significant|substantial)\\s+' +
    '(?:harm|damage|injury|loss)\\s+(?:was|has\\s+been|is)\\s+(?:done|caused|inflicted)',
  // 「not a big deal / nothing serious」
  '\\b(?:it\\s+is\\s+|it\\s*\'?s\\s+|this\\s+is\\s+)?(?:not|hardly)\\s+a\\s+big\\s+deal\\b',
  '\\b(?:no|not)\\s+(?:big|serious)\\s+(?:deal|harm|damage)\\s*(?:at\\s+all)?\\b',
  // 「nobody even noticed / nobody lost anything」
  '\\bnobody\\s+(?:even\\s+)?(?:noticed|cared|lost\\s+(?:anything|any\\s+thing)|suffered)',
  // 「there is nothing to compensate」
  '\\b(?:there\\s+is\\s+)?nothing\\s+(?:to\\s+compensate|worth\\s+compensating|to\\s+make\\s+good)\\b',
  // 「no real damage was caused」
  '\\b(?:it\\s+)?(?:caused|did)\\s+(?:no|not)\\s+(?:real|actual|material)\\s+(?:damage|harm|injury)',
  // [r527 补支] they are not actually suffering / harmed
  '\\b(?:they|she|he|these\\s+people|the\\s+users?|the\\s+staff|the\\s+victims?)\\s+' +
    '(?:are|is|were|was)\\s+(?:not|never)\\s+(?:actually|really|truly|genuinely)\\s+' +
    '(?:suffering|harmed|hurt|affected|damaged|injured|worse\\s+off)',
  // [r527 补支] nobody is really worse off / affected
  '\\b(?:no\\s+one|nobody|none)\\s+(?:is|are|was|were)\\s+(?:really|actually|truly)\\s+' +
    '(?:hurt|harmed|worse\\s+off|affected|suffering|injured|damaged)',
  // [r527 补支] nothing to settle / to compensate
  '\\b(?:there\\s+is\\s+)?(?:nothing|little)\\s+(?:to\\s+settle|to\\s+resolve|left\\s+to\\s+settle|' +
    'to\\s+be\\s+settled|to\\s+make\\s+good|to\\s+compensate)\\b',
].join('|'), 'i');

// ─── H2: 抵消限定（把否认归因为主观/量级不足）────────────────────
const MINIMIZE_ZH = new RegExp([
  // 「自己想多了/自己吓自己」
  '(?:自己|你们|他们)(?:想|吓|吓唬|骗)(?:多|自己|自己了|大了|大了)',
  '(?:想|吓|疑)(?:多|大了|自己|神疑|性太大|太多了|得太多|太重)',
  // 「心理作用/情绪化/太敏感」
  '(?:心\s*理|情\s*绪|主\s*观|感\s*觉)(?:作\s*用|上|化|问\s*题|上\s*的|太\s*敏\s*感|在\s*作\s*祟)',
  '(?:玻\s*璃\s*心|娇\s*气|敏\s*感|脆\s*弱|小\s*题\s*大\s*做|大\s*惊\s*小\s*怪|反\s*应\s*过\s*激)',
  // 「就是/只是不适应/不习惯/抵触变化」
  '(?:只|就|不过)(?:是|是|)(?:不适|不适|不习惯|不熟悉|抵触|拒绝|还没有|未)(?:应|适|新|变|化|流|接|触|习惯|流程|环境|阶段)',
  // 「医生说了是心理作用/没有医学依据」
  '(?:医\s*生|专\s*家|鉴\s*定|检\s*查)(?:都)?(?:说|认\s*为|证\s*明|指\s*出|显\s*示)(?:了)?(?:是|纯|只|属于|没有)(?:心|情|主|焦|臆|想)',
  // 「所谓后遗症/所谓影响」——把对方的举证定性为虚假
  '(?:所\s*谓)(?:的)?(?:后\s*遗\s*症|影\s*响|伤\s*害|受\s*伤|损\s*失|压\s*力|疼\s*痛|不\s*适)',
  // 「又没死人/没掉块肉/别人更严重」——量级校准（与 HARM_DENY 的
  // 极端量级支互补：那支提供否认证据，本支提供「不值一提」的量级判据）
  '(?:又|根本)(?:没|未)(?:死\s*人|人\s*死|掉\s*块\s*肉|伤\s*筋\s*动\s*骨)',
  '(?:别\s*人|人\s*家)(?:断|缺|受)(?:条|条胳|幺|更)(?:腿|臂|伤|重)(?:都|也)(?:没|不)(?:吭|叫|喊)',
  // 「大惊小怪 / 反应过度 / 太把自己当回事」
  '(?:大\s*惊\s*小\s*怪|反\s*应\s*过\s*激|过\s*度\s*反\s*应|太\s*当\s*回\s*事|把\s*小\s*事\s*闹\s*大)',
  // 「内部有人在煽风点火/有人在带节奏」——把受损表述归因为煽动
  '(?:有\s*人|个\s*别\s*人|内\s*部\s*有\s*人|少\s*数\s*人)(?:在)?(?:煽|带|吹|搅|挑|搬)(?:风|节|风|动|唆|事|是\s*非|弄)',
  // 「其实没那么严重/没那么夸张」
  '(?:其\s*实|事\s*实\s*上)(?:根\s*本)?(?:没|不)(?:有|么|像)(?:那\s*么|这\s*么|说\s*的)(?:严\s*重|夸\s*张|厉\s*害|复\s*杂|糟\s*糕)',
  // [r527 补支] 对变更/新流程的抵触（去掉「只是」前缀依赖）
  '(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',
  // [r527 补支] 转述型否定：不是真的受损/受影响
  '(?:其|事|实)(?:实|际|上)(?:并|未|不)(?:非|是|没|有)(?:真|真的|真心|实质)(?:受|被|遭|感|受)(?:损|影|累|响|响)(?:失|响|响)?(?:，|,|。)?',
  // [r527 补支] 量级校准：谁都没少块肉/大家都没掉块肉
  '(?:大|人|谁)(?:家|受)(?:也|都|没)(?:没|不)(?:有|掉|少|差)(?:一|块|根|丝|点)?(?:块|毛|肉|腿|毫)(?:肉|头|差)?',
  // [r527 补支] 抵抗/抵触/抱怨（不带「只是」前缀）
  '(?:抵|排|抱)(?:触|斥|怨)(?:变|新|流|情|化|改)?',
  // [r528 新支] 无人受损量级校准的第二形态：谁都没少块肉/大家都没掉块肉
  // 与第 163-164 行 r527 补支互补：那支锚「也|都+没+有」，本支锚「没+人/谁/任何人」
  '(?:又|也|根本|压根|大家)\s*(?:没|未)\s*(?:有|见)?\s*(?:人|谁|任何\s*人)\s*(?:掉|受|缺|少)\s*(?:块|根|丝|点)\s*(?:肉|毛|毫)',
  // [r528 新支] 双段共现判据的归因段：归因词 + (你/他/她/们) + 不适应/不熟悉 + 新流程
  // 单独出现是正当过渡期陈述（误伤 3 条恶性样本实测），必须与 HARM_DENY_ZH 末支
  // 「转述受害声称」同句共现才命中；判据证据见 scripts/round-528-final-verify.js
  '(?:其\s*实|只\s*是|不\s*过|纯\s*粹|实\s*际\s*上|事\s*实\s*上)\s*(?:仅\s*仅)?\s*(?:你|他|她|们)?\s*(?:不|未)\s*(?:适|习|熟|会|用|接)\s*(?:应|新|惯|悉|触|流|变|化)?\s*(?:新\s*)?(?:流\s*程|系\s*统|规\s*定|方\s*式|节\s*奏|工\s*具|环\s*境)',
].join('|'));

const MINIMIZE_EN = new RegExp([
  // 「they are imagining it / they imagined the whole thing」
  '\\b(?:they|she|he|you)\\s+(?:are|is)?\\s*(?:just|merely|only)\\s+' +
    '(?:imagining|exaggerating|overreacting|overselling|catastrophis)',
  '\\b(?:she|he|they)\\s+(?:imagined|invented|blew\\s+out\\s+of\\s+proportion)\\b',
  // 「it is all in their head / it is anxiety talking」
  '\\b(?:it|this|that)\\s+is\\s+(?:all\\s+)?(?:in\\s+(?:their|her|his)\\s+(?:head|mind)' +
    '|anxiety\\s+talking|stress\\s+talking|fear\\s+talking)',
  // 「they are being oversensitive / hypersensitive / dramatic」
  '\\b(?:they|she|he)\\s+(?:are|is)\\s+(?:being\\s+)?(?:oversensitive|hypersensitive|too\\s+sensitive' +
    '|dramatic|fragile|paranoid|irrational|emotional)',
  // 「it is just anxiety / just stress」
  '\\b(?:it|this|that)\\s+is\\s+just\\s+(?:anxiety|stress|nerves|a\\s+phase|adjustment)',
  // 「they will get used to it / they just need to adapt」
  '\\b(?:they|you)\\s+(?:will\\s+)?(?:get\\s+used\\s+to\\s+it|just\\s+need\\s+to\\s+' +
    '(?:adapt|adjust|relax|calm\\s+down|move\\s+on))',
  // 「nobody died / nobody lost a limb」
  '\\b(?:nobody|no\\s+one)\\s+(?:died|lost\\s+(?:a\\s+)?limb|was\\s+killed)',
  '\\b(?:it\\s+is\\s+)?not\\s+like\\s+(?:anybody|someone)\\s+(?:died|was\\s+hurt)',
  // 「people have had it worse」
  '\\b(?:others?|other\\s+people)\\s+(?:have|had)\\s+(?:had\\s+)?it\\s+worse',
  '\\bother\\s+people\\s+(?:are|were)\\s+worse\\s+off',
  // 「they are just resisting change / resisting the new process」
  '\\b(?:they|these)\\s+(?:are|just)\\s+(?:just\\s+)?(?:resisting|reacting\\s+against)\\s+' +
    '(?:change|the\\s+change|the\\s+new\\s+process|transition)',
  // 「nothing serious came of it / nothing came of it」
  '\\bnothing\\s+(?:serious|much|really)\\s+(?:came\\s+of\\s+it|happened|resulted)',
  // [r527 补支] nothing worth compensating / making a fuss about
  '\\b(?:there\\s+is\\s+)?(?:nothing|not\\s+much|little)\\s+worth\\s+(?:settling|compensating|' +
    'making\\s+a\\s+fuss\\s+about|making\\s+good)\\b',
  // [r528 补支] claiming the complaint was invented or exaggerated wholesale
  '\\b(?:imagining|invented|exaggerat(?:ing|ed)|making\\s+up)\\s+(?:the\\s+)?(?:whole|entire|all\\s+of)\\s+(?:thing|incident|situation|story|problem)',
  // [r529 补支] nothing to settle（负面词列防误伤正当审计/对账/结算语境）
  '(?:\\b(?:there\\s+is\\s+)?(?:nothing|little)\\s+to\\s+settle\\b(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved|outstanding|vendor|complaint|invoice|billing|settled|register|reconciled)))',
].join('|'), 'i');

// ─── 豁免：正当的事实陈述、医学表述与授权风险评估 ──────────────────
// 判据边界：主动把伤害查清楚、按鉴定结论定性、或描述「无伤害」
// 的事实状态（附依据），是正当的核验表述，不判。本维度判的是
// 「未经核验就把伤害定性为主观夸张」。
const EXEMPT_ZH = new RegExp([
  // 已取证的伤情/影响说明
  '(?:经|已|由)(?:医\s*院|鉴\s*定|法\s*医|第\s*三\s*方|有\s*关\s*部\s*门)(?:鉴|检|排|查|确|会|检)(?:定|查|验|测|认|诊|出)(?:为|结\s*果|结\s*论|意\s*见)',
  '(?:受\s*损|受\s*影\s*响|受\s*伤|涉\s*案)(?:名\s*单|人\s*员|范\s*围|面|数\s*字|人\s*数)(?:已|已经|经)(?:核\s*实|查\s*明|确\s*认|核\s*对)',
  // 客观否定 + 依据
  '(?:未|没有)(?:造\s*成|导\s*致|发\s*生)(?:人\s*员|人\s*身)(?:伤\s*亡|死\s*亡|伤\s*害)(?:，|,|。)',
  // 医学/心理学专业归因（附专业主体）
  '(?:医\s*生|主\s*任\s*医\s*师|主\s*治\s*医\s*师|专\s*家|鉴\s*定\s*机\s*构|临\s*床)(?:诊|判|会|确)(?:断|为|定)(?:为|是)?',
  // 授权流程中的风险评估
  '(?:风\s*险|影\s*响|危\s*害)(?:评\s*估|分\s*析|报\s*告)(?:结\s*果|显\s*示|表\s*明|认\s*为|指\s*出)',
  // 「按标准赔付/按结论处理」——处理动作在场
  '(?:按|依|按照)(?:标\s*准|规定|鉴\s*定|条\s*例|法\s*规|医\s*嘱|方\s*案)(?:赔|补|处|治|救|安)',
].join('|'));

const EXEMPT_EN = new RegExp([
  // certified / confirmed by an authority
  '\\b(?:certified|confirmed|diagnosed|validated|assessed)\\s+(?:as|by|to\\s+be)\\b',
  '\\baccording\\s+to\\s+the\\s+(?:medical|hospital|expert|investigation|inspection|audit)\\s+' +
    '(?:report|finding|assessment|opinion)',
  // the affected list has been verified
  '\\b(?:affected|injured|involved)\\s+(?:parties|persons|users|staff|people)\\s+' +
    '(?:have|has)\\s+been\\s+(?:verified|confirmed|identified|listed)',
  // no casualties (with a report attached)
  '\\bno\\s+(?:casualties|fatalities|deaths|injuries)\\s+were\\s+reported\\b',
  // clinical/professional attribution
  '\\b(?:clinically|medically|professionally)\\s+(?:diagnosed|assessed|confirmed|attributed)',
  // risk assessment with a result
  '\\b(?:risk|impact|hazard)\\s+(?:assessment|analysis|evaluation)\\s+' +
    '(?:shows|indicates|concludes|found)\\b',
  // compensated per the schedule
  '\\b(?:compensated|paid|reimbursed|treated)\\s+(?:per|according\\s+to|under)\\s+' +
    '(?:the\\s+)?(?:scale|schedule|policy|standard)',
  // we take the symptoms seriously
  '\\b(?:we|they)\\s+(?:take|took)\\s+(?:the\\s+)?(?:reported\\s+)?' +
    '(?:symptoms|complaints|concerns)\\s+(?:seriously)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkHarmInvalidation(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当的事实陈述、医学表述与授权风险评估 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const deny = HARM_DENY_ZH.test(text) || HARM_DENY_EN.test(text);
  if (!deny) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 伤害否认 × 抵消修饰限定语同句共现
  if (MINIMIZE_ZH.test(text) || MINIMIZE_EN.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '伤害定性×抵消修饰(zh)' : 'harm-invalidation×minimisation(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkHarmInvalidation,
  // [r526] 供守卫测试做「置空指定支必须变红」的变异注入用。
  // 导出句柄而非副本：变异脚本替换这些 const 指向即可让命中归零。
  __internals: () => ({ HARM_DENY_ZH, HARM_DENY_EN, MINIMIZE_ZH, MINIMIZE_EN, EXEMPT_ZH, EXEMPT_EN }),
};
