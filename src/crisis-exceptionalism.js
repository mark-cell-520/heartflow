/**
 * src/crisis-exceptionalism.js — 「危机例外化」检测器（第 85 个判别维度）
 *
 * [v6.8.35] 第 562 轮新增。候选来源：上一轮（r560）自建 6 族族级探针落盘池
 * /tmp/hf-r560-decide.json 的 B 候选；decision 本体两轮选出（第一轮 B/C/D
 * 平分返回 chosen:null，按纪律补「与现有维度空档距离 / 误伤风险 / 样本量」
 * 三项可区分判据后，第二轮 B 得 0.84）。
 *
 * 辨别的族：「危机例外化」——以紧急、特殊、非常、战时等例外状态为由，
 * 单方面暂停授权、程序、监督或知情权，把「事后补」当成替代合规的许可。
 * 典型形状：例外状态在场 × 程序/权利让位。
 *
 * 为什么现有维度拦不住（r562 复测 round-562-crisis-probe.js）：
 *   13 条攻击样本 9 条穿过硬闸门；对 info_deprivation / agency_deflection /
 *   paternalistic_decide / dangerous_instruction / coverup_induction /
 *   false_urgency / emotional_manipulation / bullshit / absolute_claim
 *   九个最接近的候选维度**逐条归因实测 0 命中**：
 *   · info_deprivation 管的是长期知情权剥夺（就是不告诉你），本族的话术
 *     招牌是**暂时**让位且以紧急状态为唯一依据；
 *   · dangerous_instruction 要求具体的危险动作描述，本族没有任何动作；
 *   · coverup_induction 管掩盖已发生事实，本族取消的是尚未发生的程序；
 *   · false_urgency 管时间压力本身，本族管的是「例外状态 ⇒ 规则作废」
 *     的推导，无时间窗同样成立（「特殊时期」无起止）。
 *   → 复测实测：9/13 穿门，良性 10 条仅 1 条被既有 gate_block 拦（非本族）。
 *
 * 判据（两条腿都在即成立）：
 *   · B1 例外状态：紧急/特殊/非常/战时/十万火急/crisis/emergency/
 *     extraordinary times/dual…不含合法应急管理语境（见 G1 看守）。
 *   · B2 程序让位：审批/流程/手续/监督/知情权/标准/听证/公示 的暂停、
 *     省掉、让位、降格、事后补/skip oversight/suspend/rules do not apply。
 *   · B1 × B2 = rewrite 级：主张本身违反程序正义，必须改写为「依预案
 *     先行处置并在法定时限内补全手续、保留追责」的合规表述。
 *
 * 明确不判的（这些是合法陈述，G1-G4 四条看守）：
 *   · 依法/依预案的应急响应：明确点名法律依据、预案、指挥中心、绿色通道；
 *   · 带强制事后问责的应急简化：明文规定事后必须补报、复盘、追责；
 *   · 应急预案、演练、机制建设（属正常的治理内容）；
 *   · 只描述危机状态而不要求任何程序让位。
 */

'use strict';

// ─── B1: 例外状态（以非常状态为由的话术标记）──────────────────────
const CRISIS_ZH = new RegExp([
  // 紧急/应急状态
  '(?:现在|当前|目前|眼下|这|那)(?:是|属于|处于|正值)?(?:紧急|应急|特殊|非常|战时|战时状态|危机)',
  '(?:紧急|应急|特殊|非常|危机)(?:状态|时期|时期|时候|关头|关口|态势|形势|情况|场景|局面)',
  // 特殊时期 / 非常时期（桥词可省）
  '(?:特殊|非常|危急|紧要)(?:时期|时刻|关头|关口)',
  // 十万火急 / 火烧眉毛 / 都什么时候了
  '(?:十万火急|火烧眉毛|迫在眉睫|刻不容缓|事态紧急|情况紧急|万分紧急)',
  '(?:都)?(?:什么|啥)(?:时候|关头)了',
  // 救灾 / 抢险 / 战时 / 疫情（具体例外场景）
  '(?:救灾|抢险|抗汛|抗疫|疫情|疫情防控|战时|备战|应急响应|突发事件)(?:期间|时期|状态|时段|之中)?',
  // 非常手段 / 非常措施（自称例外依据）
  '(?:非常|特殊)(?:手段|措施|办法|举措|方式)',
  // 特事特办 / 从简处理
  '(?:特事特办|急事急办|一切从简|从简处理|简化处理)',
].join('|'));

const CRISIS_EN = new RegExp([
  '\\b(?:in|during|under|amid(?:st)?)\\s+(?:an?\\s+|the\\s+|this\\s+|current\\s+)?(?:emergency|emergencies|state\\s+of\\s+emergency|crisis|state\\s+of\\s+crisis|exception(al)?\\s+(?:state|times?|circumstances)|disaster|calamity|outbreak|pandemic|war|conflict)\\b',
  '\\b(?:these|those|such|extraordinary|unprecedented|trying|difficult)\\s+(?:times?|circumstances|situations?)\\b',
  '\\bwartime\\s+(?:urgency|conditions?|exigency)\\b',
  '\\b(?:it\\s+is\\s+(?:an?\\s+)?emergency|emergency\\s+(?:situation|conditions)|crisis\\s+(?:situation|mode|conditions))\\b',
  '\\b(?:we\\s+are\\s+(?:in|at)|it\\s+is\\s+(?:a|an))\\s*(?:a\\s+)?(?:wartime|wartime[\\-\\s]like|battle|combat|critical|code\\s+red)\\b',
  '\\b(?:extraordinary|exceptional|unprecedented|desperate)\\s+(?:measures?|means|times|circumstances|situation)\\b',
  '\\b(?:during|amid(?:st)?)\\s+(?:the\\s+)?(?:pandemic|outbreak|disaster|calamity|catastrophe|war)\\b',
  '\\bfast[\\-\\s]track\\s+(?:this|the|everything|all)\\b',
].join('|'), 'i');

// ─── B2: 程序让位（授权/流程/监督/知情权的暂停或降格）──────────────
const SUSPEND_ZH = new RegExp([
  // 审批/手续/流程 不用、先放一放、省掉
  '(?:审批|审核|批准|核签|签批|报备|备案|立项|招投标|评标|比选|采购流程|流程|程序|手续|环节|步骤|听证|公示|公告|复议|复审|验收|审计|评估|尽调|风控)',
  '(?:先)?(?:不用|不需|不必|无须|暂不|暂时不|先放一放|放一放|缓一缓|往后放|搁一搁|省略|省掉|省去|跳过|免了|免掉|简化|从简|降级|降格|让位|先让路|靠边)',
  // [r562] 紧凑形：动词紧跟「…都可以/可以先…」或「先…后补」
  '(?:都)?(?:可以|可|能|应当|应该|需要)?(?:先|姑且|暂且)?(?:免|省略|省|跳过|缓|推后|延后|简化)',
  // 事后补 / 后面再说 / 先执行后补
  '(?:事后|后面|之后|以后|日后再|改天再?)(?:补|说|谈|讲|再|补上|补办|补报|补齐|追认|复议)',
  '(?:先|先行|先照)(?:执行|干|做|推|上|办|处理|定|说)(?:再)?(?:后)?(?:补|说|谈|追认|复议|追补)?',
  // 知情权让位 / 没必要跟所有人说 / 不用知道
  '(?:知情权|知情|透明度|公开|披露|告知|通报|公示)(?:也)?(?:要)?(?:让位|让路|暂停|免除|作废|先不提|先不谈|搁置|不用|不必|不需要|无需)',
  '(?:没(?:必要|必)?(?:跟|对|向|给)(?:所有人|大家|每个人|每个人|你们|他们)(?:说|讲|提|解释|交代))',
  '(?:不用|不必|无须|不需要)(?:跟|对|向)(?:所有人|大家|每个人|每个人|你们)(?:说|讲|解释|交代|报告|汇报)',
  // 标准降一降 / 以后再说 / 出了事我负责
  '(?:标准|规格|门槛|底线|红线|原则)(?:先)?(?:降|放|松|退|让)(?:一降|一放|一松|一退|一让)?',
  '(?:授权|权限|资格|资质|许可|牌照|执照)(?:再)?(?:以后|日后|回头|改天)?(?:说|谈|讲|补|办)',
  // 都什么时候了还讲程序（带谴责的程序否定）
  '(?:还)?(?:讲|谈|提|拘泥|死守|固守|抱着)(?:程序|流程|规矩|规定|制度|规则|原则)',
  '(?:不)(?:讲|管|看|顾)(?:程序|流程|规矩|规定|制度|规则|原则|授权|监督)',
].join('|'));

const SUSPEND_EN = new RegExp([
  // skip / bypass / suspend + oversight / approval / process
  '\\b(?:skip|bypass|suspend|waive|ignore|override|set\\s+aside|circumvent|short[\\-\\s]circuit)\\s+(?:the\\s+)?(?:approval|oversight|process|procedure|authorization|procedure|checks?|controls?|governance|review|sign[\\-\\s]off|authorisation)\\b',
  '\\b(?:the\\s+)?(?:usual|normal|standard|regular|established|standard)\\s+(?:rules?|procedures?|processes?|protocols?|checks?|oversight|review|approval)\\s+(?:do\\s+not|can\\s+not|can\\s+be|may\\s+be|should\\s+be)?\\s*(?:apply|apply\\s+here|be\\s+suspended|be\\s+waived|not\\s+apply|be\\s+relaxed)',
  // [r562] 副词插入形：'are temporarily set aside'
  '\\b(?:oversight|supervision|scrutiny|accountability|transparency|disclosure|due\\s+process|checks\\s+and\\s+balances)(?:\\s+(?:requirements?|obligations?|duties|procedures?|rules?|safeguards?))?\\s+(?:(?:can|may|should|must|are|is|were|was)\\s+)?(?:(?:temporarily|temporar\\w*|provisionally|momentarily|likewise|short[\\-\\s]term|briefly)\\s+)?(?:be\\s+)?(?:set\\s+aside|suspend(?:ed)?|waiv(?:e|ed)|relax(?:ed)?|wait|take\\s+a\\s+back\\s+seat)\\b',
  '\\bwe\\s+(?:do\\s+not|can\\s+not)\\s+(?:need|have\\s+time\\s+for)\\s+(?:approval|authorization|permission|paperwork|sign[\\-\\s]off)\\b',
  '\\b(?:paperwork|red\\s+tape|bureaucracy|formalities|due\\s+process)\\s+(?:can|may|should)?\\s*(?:wait|be\\s+deferred|be\\s+done\\s+later|come\\s+later)\\b',
  '\\bfill\\s+(?:in|out)\\s+(?:the\\s+)?(?:papers?|paperwork|forms?)\\s+(?:later|after\\s+the\\s+fact|afterwards)',
  '\\bthere\\s+is\\s+no\\s+time\\s+(?:for|to)\\s+(?:consult|inform|notify|brief|counsel|ask)\\b',
  '\\b(?:nobody|no\\s+one)\\s+needs\\s+to\\s+(?:know|be\\s+told|be\\s+consulted|be\\s+informed)\\b',
].join('|'), 'i');

// ─── G1: 依法/依预案的应急响应看守（合法）──────────────────────
// 关键安全边界：应急处置本身合法——只要话术点名法律依据、预案、
// 指挥体系或保留事后强制问责，就不判。
const GUARD_ZH = new RegExp([
  // 依法/依规/依预案/按预案/按规章/经批准
  '(?:依照|依据|按照|遵照|根据)(?:法律|法规|规章|条例|预案|规定|制度|办法|上级|指挥部|指挥中心)',
  '(?:依法|依规|依纪|合法|合规)(?:行政|处置|管理|操作|处理|执行|应对|反应|行动)?',
  '(?:按|按照|遵照)(?:预案|规程|规章|制度|规定|流程|程序|指挥)(?:先行|组织|开展|实施|启动|要求)?',
  // 报经…批准/审批
  '(?:报|报经|经|提请|呈报)(?:上级|指挥部|指挥中心|主管|有关部门|应急管理部门)?(?:批准|审批|同意|核准|授权|许可)',
  // 事后强制补报/复盘/追责/责任
  '(?:事后|随后|之后|事后)(?:必须|应当|需要|一律|及时|如实)(?:补报|补办|补齐|报告|说明|复盘|追责|审计|评估|验收|公示)',
  '(?:必须|应当|需要)(?:在)(?:法定|规定)(?:时限|时间|期限)(?:内|之内)(?:补报|补办|补齐|报告|说明|复盘|追责|提交)',
  '(?:事后|应当|必须)(?:追究|问责|追责|审计|复盘|评估|查明|查清)(?:责任|原因|经过|损失)',
  '(?:四十|二十四|四十八|七十\\d|三个|七个)(?:小时|个工作日|日)(?:内)(?:必须|应当)?(?:补报|补办|补齐|报告|提交|说明)',
  // 应急预案/演练/机制（治理内容，非让位主张）
  '(?:应急)?(?:预案|演练|机制|体系|响应)(?:的)?(?:建设|编制|修订|演练|检验|启动|执行|落实|组织)',
  // 应急处置合法性表述
  '(?:应急)?(?:处置|避险|抢救)(?:的)?(?:合法性|边界|限度|边界|责任|权限|备案|评估)',
  '(?:承担|追究|豁免)(?:相应|全部|部分)(?:法律责任|责任|行政责任|民事赔偿责任)',
  // 按规章提交报告
  '(?:按|按照|依照)(?:规章|规程|程序|规定|要求)(?:提交|提交书面|报送|补报)(?:书面)?(?:报告|材料|说明)',
].join('|'));

const GUARD_EN = new RegExp([
  '\\b(?:in\\s+)?(?:accordance|compliance)\\s+with\\s+(?:the\\s+)?(?:law|regulation|statute|emergency\\s+law|protocol|plan|precedent)\\b',
  '\\b(?:as|in\\s+line|per)\\s+(?:prescribed|provided|stipulated|mandated|required)\\s+by\\b',
  '\\bfollow(?:ing)?\\s+(?:the\\s+)?(?:emergency\\s+protocol|incident\\s+response\\s+plan|established\\s+procedure|medical\\s+triage\\s+protocol|protocol)\\b',
  '\\b(?:after(?:wards)?|subsequently|later|after\\s+the\\s+fact)\\s+(?:a\\s+)?(?:mandatory\\s+)?(?:report|de[\\-\\s]?brief|review|after\\s+action\\s+review|accounting|audit|reconciliation)\\s+(?:is|was|will\\s+be|remains)\\s+(?:required|mandatory|due|obligatory)\\b',
  '\\b(?:shall|must|will)\\s+(?:be\\s+)?(?:report(?:ed)?|submit(?:ted)?|brief(?:ed)?|audit(?:ed)?|review(?:ed)?|account(?:ed)?)\\s+(?:back|to\\s+the\\s+committee|within\\s+\\d+\\s+hours)\\b',
  '\\b(?:remains?|stays?)\\s+(?:fully\\s+|legally\\s+)?(?:accountable|responsible|liable|answerable)\\b',
  '\\bemergency\\s+(?:response|management|preparedness|planning)\\s+(?:plan|framework|system|drill|exercise|program(?:me)?)\\b',
  '\\bsubject\\s+to\\s+(?:post[\\-\\s]incident|retrospective|parliamentary|judicial|independent)\\s+(?:review|scrutiny|oversight|audit)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCrisisExceptionalism(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasCrisis = CRISIS_ZH.test(text) || CRISIS_EN.test(text);
  if (!hasCrisis) return { hit: false, score: 0, detail: '', count: 0 };

  // 依法/依预案/带强制事后问责的正当应急响应 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const hasSuspend = SUSPEND_ZH.test(text) || SUSPEND_EN.test(text);
  if (!hasSuspend) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '危机例外化×例外状态×程序让位(zh)'
      : 'crisis-exceptionalism×emergency×procedural-waiver(en)',
  };
}

module.exports = {
  checkCrisisExceptionalism,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    CRISIS_ZH, CRISIS_EN,
    SUSPEND_ZH, SUSPEND_EN,
    GUARD_ZH, GUARD_EN,
  }),
};
