/**
 * src/shame-compliance.js — 「羞耻施压换服从」检测器（第 88 个判别维度）
 *
 * [v6.8.38] 第 569 轮新增。候选来源：r560 落盘池的 E 候选；本轮先用
 * scripts/round-569-family-verify.js 复测缺口（zh 5/6 穿门、en 5/5 穿门，
 * 良性 0/5 误伤），再用 scripts/round-569-attribution.js 逐条归因确认
 * 11 条样本里 10 条无任何 finding、另 1 条只是被 gate_block 的既有强规则
 * 拦下，没有一个维度以羞耻施压腿命中。decision 本体
 * （scripts/round-569-decide.js）在探测器池已空的情况下按「上一轮遗留的
 * 真缺口」选出本族。
 *
 * 辨别的族：「羞耻施压换服从」——以「你会丢人 / 别人会怎么看 / 你也没资格」
 * 为由，要求对方撤回、沉默或取消表态。典型形状：羞耻或身份贬低 × 压制表态。
 * 它和近邻维度的边界：
 *   · emotional_manipulation 管情绪施压本身（恐惧、愧疚、怜悯等情绪杠杆），
 *     本族专管「羞耻/丢脸/没资格」这一种情绪杠杆，且必须落在「取消表态」
 *     的行为要求上才会 hit；
 *   · gaslighting 管扭曲对方对现实的认知，本族不扭曲事实，只操纵
 *     「别人会怎么看你」的社会评价；
 *   · victim_blaming 管把伤害归咎于受害者，本族是预防性的
 *     （「你说出来会丢人」），不预设已发生的伤害归责；
 *   · loyalty_test 管站队表忠心，本族的代价是社会性羞耻而非忠诚度。
 *
 * 为什么现有维度拦不住（r569 归因实测：11 条攻击样本 10 条 findings 为空，
 * 无一个维度命中；逐条查 emotional_manipulation / gaslighting /
 * victim_blaming / induced_trust / moral_licensing 五邻全部 miss）：
 *   本族的判别力全在「羞耻语汇 × 压制语汇」的**共现**上——单看羞耻词
 *   是不构成要求的陈述（「这事确实丢人」），单看压制词是正常的议程管理
 *   （「这个我们下一步再说」），只有两者同时出现才是把羞耻当筹码
 *   置换对方的表达权。
 *
 * 判据（两条腿都在即成立）：
 *   · S1 羞耻/身份贬低：丢人、丢脸、抹黑、让人笑话、别人会怎么看你、
 *     你也没资格、什么身份、脸上无光……（zh）
 *     ashamed / embarrassing / people will laugh at you / what will others
 *     think / you have no standing to object……（en）
 *   · S2 压制表态：别说了、别在会上提、算了吧、闭嘴、收回你的意见、
 *     别再提……（zh）
 *     keep quiet / drop it / do not bring it up / stay silent /
 *     withdraw your complaint……（en）
 *   · S1 × S2 = rewrite 级：把社会评价当筹码取消对方的表达权，必须改写为
 *     「可以陈述顾虑，由当事人自行决定是否、何时、以何种方式提出」。
 *
 * 明确不判的（这些是正常议事或隐私保护，G1-G3 三条看守）：
 *   · 隐私保护：明确说明涉及隐私、敏感信息，换场合而非要求沉默；
 *   · 议程安排：说明会上时间不够、另约时间讨论、随后补齐材料；
 *   · 已记录在案：说明顾虑已被记录/转办/另行安排，并未取消表态本身。
 */

'use strict';

// ─── S1: 羞耻 / 身份贬低腿 ────────────────────────────────────────
const SHAME_ZH = new RegExp([
  // 直接羞耻词（丢人/丢脸/抹黑/难堪/寒碜）
  '(?:丢人|丢脸|现眼|臊|寒碜|难堪|不体面|没面子|脸上无光|脸上有光|脸面何存|颜面何存|抹黑|辱没|败坏门风|家丑|见不得人)',
  // 被围观/被嘲笑的社会评价
  '(?:让|被|遭|叫|惹)(?:人|别人|大家|外人|旁人|同事们|邻居)(?:笑话|看笑话|说闲话|议论|指指点点|戳脊梁骨|说三道四)',
  '(?:笑话|笑柄|谈资|把柄|闲话)(?:一|定|必然|势必|少)(?:个)?(?:会|定|必然|势必)?(?:成|变成|成了|成为)',
  // 「别人会怎么看你」的第三人称评价
  '(?:别人|他人|人家|大家|外人|旁人|同事|邻居|领导|同事们)(?:会|要|该|该怎么|会怎么|究竟会怎么|到底会怎么)(?:看|看待|评价|议论|说|讲|想|瞧|笑话)(?:你|你们|咱|咱们|他|她|你们家)',
  '(?:你|你们|咱)(?:让|叫|被)(?:别人|大家|人家|外人)(?:怎么|如何看待)(?:看|想|说|议论|评价)',
  // 身份/资格贬低：「也不看看自己什么身份」「你没资格说」
  '(?:也不|也不看看|也不想想|不想想|不瞧瞧|不看看|先看看|先瞧瞧)(?:自己|你|你们)?(?:什么|啥)(?:身份|地位|分量|斤两|资格|本事|能力|水平|位置|身价|资本)',
  '(?:没|没有|毫无|半点)(?:资格|立场|身份|分量|脸面|底气|本事|能耐|分寸)(?:说|讲|提|反对|抗议|质疑|问|插嘴|过问|管|发表|表态)',
  '(?:你|你们|咱|咱们)(?:也|还)?(?:配|够得上|轮得到)(?:说|讲|提|反对|抗议|质疑|问|管)',
  // 反问式身份贬低：「你算什么东西/你算老几」
  '(?:你|你们)?(?:算|算是|算得)(?:什么|啥|老几|哪根葱|什么人|什么东西|哪号人)',
  // 羞耻情绪直指（你该觉得羞耻）
  '(?:你|你们)?(?:该|应该|应当|不觉得|难道不觉得)?(?:羞耻|羞愧|害臊|惭愧|难为情|不好意思|臊得慌)',
  '(?:好意思|还好意思|怎么好意思|怎么张得开口|怎么开得口)(?:反对|抗议|质疑|问|提|说|要|进门|露面|出门|见人)',
  // 对家人/集体的连带羞耻
  '(?:给|令|让|叫)(?:你|你们|你们家|家里人|家人|父母|祖宗|母校|单位|公司|团队|集体)(?:抹黑|丢脸|丢人|蒙羞|辱没|现眼)',
].join('|'));

const SHAME_EN = new RegExp([
  '\\b(?:ashamed|shameful|embarrassed|embarrassing|embarrassment|humiliat(?:e|es|ed|ing|ion)|disgrac(?:e|es|ed|ing)|disgraceful)\\b',
  '\\b(?:laugh|laughed|laughing|mock|mocked|mocking|ridicule[ds]?|make fun of|make a fool of)\\s+(?:at|of)\\s+(?:you|your|him|her|them)\\b',
  '\\b(?:what|how)\\s+(?:will|would|do|did)\\s+(?:others|people|everyone|they|your (?:colleagues|friends|family|peers|neighbou?rs)|the (?:team|office|neighbou?rs))\\s+(?:think|say|see|judge|talk)\\b',
  '\\byou\\s+(?:should|ought to)\\s+be\\s+ashamed\\b',
  '\\b(?:no|not any|zero)\\s+(?:standing|right|place|business|position|say)\\s+(?:to\\s+)?(?:object|speak|ask|complain|say|question|talk back|bring)\\b',
  '\\bwho\\s+are\\s+you\\s+to\\s+(?:object|speak|ask|question|complain|say)\\b',
  '\\bwhat\\s+right\\s+(?:do|would)\\s+you\\s+have\\s+to\\s+(?:object|speak|ask|question|complain|say)\\b',
  '\\b(?:embarrass|disgrace|humiliate|shame|dishono?u?r)\\s+(?:your|the|your own)\\s+(?:family|team|company|name|reputation|household)\\b',
  '\\bnobody\\s+(?:will|would)\\s+(?:respect|take seriously|listen to|trust)\\s+you\\b',
  '\\byou\\s+(?:are|re)\\s+(?:nobody|nothing|a joke|a laughingstock)\\b',
].join('|'), 'i');

// ─── S2: 压制表态腿（沉默 / 撤回 / 取消异议）─────────────────────
const SILENCE_ZH = new RegExp([
  // 「别说了/别在会上提」
  '(?:别|不要|不用|甭|少|莫|休)(?:再|去|到)?(?:说|讲|提|声张|张扬|计较|较真|反对|提意见|发表意见|表态|开口|插嘴|过问|管|问|追究|捅|说出去|讲出去|闹|闹大)',
  '(?:别|不要|不用|甭|少)(?:在会上|当众|公开)(?:说|讲|提|开口|发表|表态)',
  '(?:还是|就|干脆|不如)(?:别|不要|不|甍|少)?(?:说|讲|提|反对|表态|计较|较真|开口)(?:了|为好|算了|好些)',
  // 「算了吧/作罢/不提了」
  '(?:算了|作罢|拉倒|罢了|不提了|不说了|到此为止|息事宁人|大事化小|小事化了)',
  // 「闭嘴/住口/免开尊口」
  '(?:闭嘴|住口|住嘴|少说两句|把嘴闭上|免开尊口|禁声|噤声)',
  // 「收回/撤回你的意见、投诉、上访」
  '(?:收回|撤销|撤回|撤下|咽回去|憋回去|吞回去)(?:你|您|咱)?(?:的|自己)?(?:意见|说法|诉求|投诉|举报|上访|抱怨|异议|话|提案|问题)',
  '(?:把|将)(?:你|您)?(?:的话|意见|投诉|举报|诉求|异议)(?:给|给我|咽|憋|吞)(?:回去)',
  '(?:别提|不要再提|休想再提|不许再提|不准再提|不必再提)(?:这|此|这件|这件事|这种|这个问题|意见|诉求|投诉|举报|上访)',
  '(?:就当|就当作|权当)(?:没|不)(?:发生|说过|提过|这回|这回事|没这回事)',
  '(?:别|不要|甭|不许|不准|不得)(?:再)?(?:提|讲|说)(?:这|此|这件|这件事|这种|这个问题)',
  // 反诘型施压：自己心里没数 / 没掂量——把「别人会怎么看你」的羞耻腿
  // 收束成一句逼人退让的反问。⚠️ 本支与 SHAME_ZH 严格异源：SHAME 侧的
  // 「好意思」绝不进入本支，否则单句「你还好意思反对」双腿齐出，共现
  // 判据退化为恒真（r568 在 moral_licensing 上踩过同型坑）。
  '(?:你|你们|咱|咱们)?(?:自己)?(?:心里|心里头|暗自|暗地里|背地里)(?:没|没有|毫无)(?:数|点数|掂量|分寸|轻重|计较)',
  '(?:你|你们|咱|咱们)?(?:自己)?(?:也不|也不想想|不想想|不掂量|不掂量掂量|不照照)(?:看看|瞧瞧|想想|掂量)?',
  // 听安排 / 按我说的做」的替代：沉默后只留一个声音
  '(?:只听|只信|只认)(?:我|领导|上头|上面的)(?:安排|话|吩咐|指示)',
].join('|'));

const SILENCE_EN = new RegExp([
  '\\b(?:keep|stay)\\s+(?:quiet|silent|silence|mum|hush)\\b',
  '\\b(?:keep|hold)\\s+it\\s+(?:to yourself|in|between us|under wraps)\\b',
  '\\b(?:drop\\s+it|drop\\s+this|let\\s+it\\s+go|let\\s+this\\s+one\\s+go|leave\\s+it\\s+alone|let\\s+it\\s+lie)\\b',
  '\\b(?:do\\s+not|don t|dont)\\s+(?:bring|raise|mention|speak|talk|say)\\s+(?:it|this|that|the matter)\\s+up\\b',
  '\\b(?:do\\s+not|don t|dont)\\s+(?:say|tell|repeat)\\s+(?:anything|a word|this to anyone)\\b',
  '\\bstop\\s+(?:talking|complaining|whining|asking|bringing\\s+it\\s+up|making\\s+a\\s+fuss)\\b',
  '\\b(?:shut\\s+up|zip\\s+it|button\\s+it|clam\\s+up)\\b',
  '\\b(?:withdraw|retract|take\\s+back|pull)\\s+(?:your|the|that|this)\\s+(?:complaint|objection|concern|request|demand|allegation|appeal|report)\\b',
  '\\b(?:forget|let\\s+us\\s+forget)\\s+(?:about\\s+)?(?:it|this|the whole thing|what happened)\\b',
  '\\b(?:say|breathe|utter)\\s+(?:nothing|not a word)\\b',
  '\\b(?:better|best)\\s+(?:to\\s+)?(?:keep|stay)\\s+(?:quiet|silent|mum)\\b',
].join('|'), 'i');

// ─── G1-G3: 看守（合法：隐私保护 / 议程安排 / 已记录在案）─────────
const GUARD_ZH = new RegExp([
  // 隐私/敏感信息：换场合而不取消表态
  '(?:涉及|牵涉|关系到)(?:个人|当事人)?(?:隐私|私事|个人信息|敏感信息|商业秘密|未公开|保密)',
  '(?:不宜|不方便|不适合|不便)(?:公开|在会上|当众)(?:说|讲|提)',
  // 议程安排：另约时间/随后补齐材料
  '(?:另行|另约|另找|换个|改天|择日|稍后|随后|接下来|会后|散会后)(?:安排|再议|沟通|讨论|交流|谈|专题)',
  '(?:今天|会上|这会儿)(?:时间|时长)(?:有限|不足|不够)',
  // 已记录在案 / 转办
  '(?:记录下来|记录在案|登记在册|如实记录|详细记录|予以记录|先行记录)',
  '(?:转办|交办|移交|上报|报送|呈报)(?:给|至|到)(?:相关|有关|职能|主管)?(?:部门|科室|单位|同事|领导)?',
].join('|'));

const GUARD_EN = new RegExp([
  '\\b(?:private|confidential|sensitive|personal|privileged)\\s+(?:matter|conversation|discussion|information|data|details|topic)\\b',
  '\\b(?:involves|concerns|relates to|raises)\\s+(?:personal|private|sensitive|confidential)\\s+(?:data|information|details|matters)\\b',
  '\\blet\\s+us\\s+(?:discuss|cover|go over|take this up|defer this)\\s+(?:it\\s+)?(?:privately|separately|after the meeting|later|one[\\s-]on[\\s-]one|in a closed session|offline)\\b',
  '\\bwe\\s+(?:will|shall|can)\\s+(?:follow up|revisit|circle back|take this offline|schedule)\\s+(?:on|with|about)?\\s*(?:this|it|separately|later|after)?\\b',
  '\\b(?:log|logged|record(?:ed)?|document(?:ed)?|note[d]?|capture[d]?)\\s+(?:your\\s+|the\\s+)?(?:concern|issue|complaint|objection|point|feedback|question)\\b',
  '\\b(?:register(?:ed)?|routed|referred|forwarded|escalated)\\s+(?:your\\s+|the\\s+)?(?:concern|complaint|issue|objection)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkShameCompliance(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasShame = SHAME_ZH.test(text) || SHAME_EN.test(text);
  if (!hasShame) return { hit: false, score: 0, detail: '', count: 0 };

  const hasSilence = SILENCE_ZH.test(text) || SILENCE_EN.test(text);
  if (!hasSilence) return { hit: false, score: 0, detail: '', count: 0 };

  // 隐私保护 / 议程安排 / 已记录在案 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '羞耻施压×社会评价×取消表态(zh)'
      : 'shame-compliance×social-shame×silencing(en)',
  };
}

module.exports = {
  checkShameCompliance,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    SHAME_ZH, SHAME_EN,
    SILENCE_ZH, SILENCE_EN,
    GUARD_ZH, GUARD_EN,
  }),
};
