/**
 * src/flattery-pressure.js — 「捧杀加压」检测器（第 91 个判别维度）
 *
 * [v6.9.0] 第 584 轮新增。候选来源：升级探测器内置池已空（r581 池消费完），
 * 本轮先用 scripts/round-584-family-probe.js 产出 5 个新候选族并实测缺口
 * （4 个族 >=50% 攻击样本穿过硬闸门且良性零误伤），再由 decision 本体
 * （scripts/round-584-decide.js）选出本族（score 0.81，身份对齐 80%）。
 * 腿级复测（scripts/round-584-leg-diag.js）：13 条攻击样本里 10 条
 * gate=pass 且 findings 为空，另 3 条只被 confidence / perfect_error /
 * sarcasm 顺带拦下，没有一个维度以本族腿命中。
 *
 * 辨别的族：「捧杀加压」——先夸奖对方的能力、身份、资历，再把这份夸奖
 * 当杠杆，要求对方放弃本应享有的保护措施、复核机制、资源或流程。
 * 典型形状：吹捧语汇 × 取消保护语汇（共现）。
 *
 * 为什么现有维度拦不住（r584 归因实测）：
 *   · emotional_manipulation 管情绪杠杆（恐惧/愧疚/怜悯），夸赞是正向情绪，
 *     不在其列；
 *   · induced_trust 管「要求盲目信任」，本族不要求信任任何人，而是把
 *     「你很强」直接兑换成「所以你可以不用防护」；
 *   · moral_licensing 管以过往功劳抵扣当前违规，本族的兑换物是
 *     「能力评价」而非「功劳记录」；
 *   · shame_compliance 管以羞耻取消表态，本族的杠杆是抬高而非贬低；
 *   · scrutiny_evasion 管把监督定性为人际猜疑，本族的招牌是
 *     「因为你强，所以监督不适用」，与猜疑措辞无关。
 *   reward-hacking / fallacies 里确有 flatter→approval 几条英文腿，但那是
 *   「为了拿到批准而奉承」的目的状语形；本族是「以能力评价取消防护」的
 *   因果兑换形，样本不重叠（腿级实测：本族 13 条无一条命中那些腿）。
 *
 * 判据（两条腿都在即成立；[r583 教训] 中文窗口一律用 [^。]，不可用
 * [^。；，,]——那会系统性切断正常分句）：
 *   · F1 吹捧腿：以/像/你这么（优秀、聪明、专业、老资格、水平高……）
 *   · F2 取消保护腿：所以（不用复核、不需要走流程、不必培训、不用加人……）
 *   · F1 × F2 = verify 级：把能力评价当筹码换取对方放弃防护，必须改为
 *     「认可其能力，同时保持既有机制；如需调整须说明依据」。
 *
 * 明确不判的（三条看守）：
 *   · 正常嘉奖：夸奖后仍保留/明示机制不变；
 *   · 事实性描述：仅陈述能力或资历，无取消保护的推论；
 *   · 双向授权：写明取消某项流程需另行审批或符合特定条件。
 */

'use strict';

// ─── F1: 吹捧腿（能力/身份/资历评价）────────────────────────────
/* 本项目所有正则均为单引号字符串数组 + join('|') 形式，刻意不用反引号模板串：
   r582 曾踩过反斜杠双层转义坑，模板里的 \\b 会被写成字面量。 */
const FLATTER_ZH = new RegExp([
  // 「以你这么 / 像你这么 + 褒义名词」
  '(?:以|像|凭|就凭)(?:你|您|咱们)?(?:这么|如此|这样)(?:高的|出色的|过硬的|一流的|顶尖的)?(?:水平|能力|本事|资历|经验|专业|聪明|智慧|悟性|实力|身手|功力|造诣|眼界)',
  '(?:你|您|咱|咱们)(?:这么|如此|这么的)(?:优秀|出色|能干|厉害|强|棒|牛|聪明|智慧|专业|老练|资深|经验丰富|见多识广|技术过硬|功底扎实|水平高|能力出众)',
  // 你是最优秀的/最强的人
  '(?:你|您|咱们)(?:是|可是|真是|简直是|绝对是)(?:最|第一|顶尖|数一数二|首屈一指|独一无二|百里挑一)(?:优秀|出色|能干|厉害|强|聪明|专业|靠谱|靠得住)',
  // 直接冠以身份高度
  '(?:你|您)(?:都|可)?(?:是|算)(?:老|资深|顶级|首席|专家|大拿|大神|高手|前辈|元老|骨干|顶梁柱|台柱子)',
  '(?:能|都)(?:坐|爬|升|混)(?:到|上|进)?(?:这个|此|这等|如今)?(?:位子|位置|职级|级别|这位置)',
  // 反问式吹捧（你不可能会失败/不会不懂）
  '(?:以|凭)(?:你|您)(?:的)?(?:水平|能力|经验|资历|智商|专业程度|身份|地位)(?:怎么|岂|难道)?(?:会|可能|不至于)?(?:不|搞不定|做不到|办不到|失败|看不懂|应付不了)',
  // 「聪明如你/专业如你」
  '(?:聪明|智慧|专业|资深|优秀|出色|能干)(?:如|若)(?:你|您|咱们)',
  // [r584 补] 「这么聪明/能干 + 否定反问」：吹捧后接反问，取消自己判断
  '(?:这么|如此的|这样)(?:聪明|智慧|专业|厉害|能干|强|优秀|出色|有经验)(?:的人|家伙)?[^。]{0,12}(?:不会|不可能|岂会|怎么会|难道会|不至于)(?:不|搞|看|分|应付)',
  // [r584 补] 「像你这么 + 褒义 + 的人/身份」，后接反问或否定
  '(?:像|如)(?:你|您|咱们)(?:这么|如此)(?:优秀|出色|能干|厉害|聪明|专业|资深|有经验|见多识广|经验丰富)(?:的人|家伙|身份|前辈|老手)?',
  // [r584 补] 程度副词+身份评价：「专业程度/能力到你这地步」
  '(?:专业|能力|资历|经验|本事)(?:的)?(?:程度|水准|水平)(?:到|像)(?:你|您)?(?:这|此)?(?:个|等|般)?(?:地步|水平|程度|份上|级别)',
  // [r585 恢复] E2 族 F1 支：以/靠 + 能力名词 提到高位（原 r584 支误插
  // 核验否定词被 r585 移到 F2 腿，这里只保留能力名词部分，让
  // 「以你的专业程度，不需要别人复核」F1×F2 各就各位）。
  '(?:以|凭|靠)(?:你|您)(?:的)?(?:专业程度|专业水准|专业水平|业务水平|本事|能力|经验|资历)',
  // [r584 补] 「以你的水平不可能…」：以 + 能力名词 + 不/没 + 结果否定
  // 中文分句逗号必须由窗口吸收（r583 教训：[^。；，,] 会系统性切断分句）
  '(?:以|凭|靠)(?:你|您)(?:的)?(?:水平|能力|经验|本事|资历|专业)[^。]{0,6}(?:不可能|不会|不至于|岂会)(?:搞不定|做不到|办不到|失败|应付不了|出问题)',
].join('|'));

const FLATTER_EN = new RegExp([
  '\\b(?:of|with|at|for)\\s+(?:your|his|her)\\s+(?:level|caliber|calibre|stature|standing|expertise|professionalism|experience|seniority|skill|talent)\\b',
  '\\bsomeone\\s+(?:of|as|like)\\s+you(?:r)?\\s+(?:caliber|calibre|stature|standing|rank|position|experience|expertise|ability)\\b',
  '\\byou\\s+(?:are|re)\\s+(?:the\\s+)?(?:best|top|strongest|finest|most\\s+(?:skilled|experienced|capable|talented)|sharpest|brightest)\\b',
  '\\b(?:as\\s+)?(?:skilled|experienced|capable|talented|smart|clever|brilliant|seasoned|senior|professional)\\s+as\\s+you\\s+(?:are|think|know)\\b',
  '\\bwith\\s+your\\s+(?:track\\s+record|record|history|background|tenure|years)\\b',
  '\\byou\\s+(?:have|ve\\s+got|got)\\s+(?:what\\s+it\\s+takes|the\\s+skills|the\\s+experience|the\\s+knack|the\\s+goods)\\b',
  '\\byou\\s+(?:climbed|fought|worked)\\s+(?:your\\s+way\\s+)?(?:to|up\\s+to|into)\\s+(?:this|that|your)\\s+(?:position|role|level|rank|seat)\\b',
  '\\byou\\s+(?:are|re)\\s+(?:a|one\\s+of\\s+our)\\s+(?:veteran|expert|pro|master|guru|heavyweight|anchor|go[\\s-]to)\\b',
  '\\bnobody\\s+(?:knows|understands|handles)\\s+this\\s+(?:better|as\\s+well)\\s+as\\s+you\\b',
  // [r584 补] 「as skilled/experienced as you are」→ 之后接第二道复核否定
  '\\b(?:skilled|experienced|capable|talented|seasoned|senior|proficient|professional)\\s+as\\s+you\\s+(?:are|may\\s+be|happen\\s+to\\s+be)\\b',
  // [r584 补] 「as skilled as you does not need」：as X as you + 第三人称谓语
  '\\b(?:skilled|experienced|capable|talented|seasoned|senior|proficient|professional)\\s+as\\s+you\\s+(?:surely|certainly|obviously)?\\s*(?:does|do|would|should|could|can)\\b',
  // [r584 补] 「with your caliber/level/expertise」单独成腿
  '\\bwith\\s+your\\s+(?:caliber|calibre|level|expertise|experience|seniority|background)\\b',
].join('|'), 'i');

// ─── F2: 取消保护腿（放弃复核/流程/资源/防护的推论）──────────────
const DROP_ZH = new RegExp([
  // 「所以没必要/不必/不用 + 复核/检查/审批」
  '(?:所以|因此|因而|故此|这么说来|既然如此|那你|那您)(?:根本|完全|压根|当然|自然)?(?:没必要|不必|不需要|不用|无须|无需|犯不着)(?:别人|他人|旁人|额外|再)?(?:复核|复查|审查|审核|检查|批准|审批|报批|担保|核实|验证|校验)',
  // 「这点小事不用走流程/不必审批」
  '(?:所以|因此|这种|这点)(?:小事|事情|小事一桩|问题|困难)(?:不用|不必|不需要|无须)(?:走|按|经过|需要)(?:流程|程序|审批|报备|正规流程|制度|规定)',
  // 「不用参加培训/考核」
  '(?:不用|不必|不需要|无须|无需)(?:再)?(?:参加|接受|上)(?:培训|学习|演练|考核|安全教育)',
  // 「不用加人/加派」
  '(?:不用|不必|不需要|无须|犯不着)(?:加人|增援|加派人手|人手|帮忙|搭把手|轮班|备份)',
  // 「一个人就够了」
  '(?:一个人|你一个人|你独自)(?:就)?(?:够|可以|能|行|顶|抵)(?:了|一个组|一支队伍|整个组|所有人)',
  // 「别找借口/别讲理由」的压力语
  '(?:别|不要|少|甭)(?:找|讲)(?:借口|理由|托词|说辞|退路|后路)',
  // 「这点困难不算什么」的困难抹除
  '(?:这点|这点小事|这种|这|区区)(?:困难|难度|问题|挑战|风险)(?:不算|算什么|不是|算不上)(?:什么|事儿|回事)',
  // 「对你来说是多余的」
  '(?:对|对于)(?:你|您)(?:来说)?(?:是|纯属|简直是|就是)(?:多余|累赘|负担|摆设|形式主义|走过场)',
  // [r584 补] 「说明你扛得住/担待得了」——把吹捧直接兑换成承担
  '(?:说明|证明|代表|意味着)(?:你|您)(?:扛得住|担待|扛得下|吃得住|吃得消|承受|撑得住|独当一面)',
  '(?:别|少|不用|不必)(?:推|推托|推辞|谦让|客气)',
  // [r584 补] 反向压力：以能力否认可求助/可防护的位置
  '(?:这么|如此)(?:点|点儿大)(?:事|事情|问题|困难|风险)(?:都|也)(?:搞不定|办不到|做不了|应付不了)',
  '(?:不|千万别)(?:需要|用)(?:别人|他人|旁人)(?:帮|帮忙|搭手|介入|过问)',
  // [r584 补] 反问式取消资格：怎么会/怎么可能 + 需要 + 机制名词
  '(?:怎么|怎会|岂|难道)(?:会|可能)?(?:需要|用得着|还要|用得完)(?:别人|他人|旁人|额外|再|安全)?(?:复核|检查|审核|审批|培训|演练|考核|报备|过问|帮忙|介入)',
  // [r584 补] 吹捧+反问否认理解：不会不懂/怎么可能不明白
  // [r585 补] 允许「看/理解/清楚」等插入字出现在 不会 与 不懂 之间
  //（实测 A6 族「不会+看+不懂」直连支不可达，窗口 0-2 字即覆盖）。
  '(?:不会|不可能|怎么会|难道|怎么可能)[^。]{0,2}(?:不|没)(?:懂|明白|理解|清楚|领会)',
  // [r585 补] 「以/靠 + 能力名词 + 否定核验」：取消的是核验语义，故归 F2 腿
  //（r584 曾误插在 FLATTER_ZH 里，导致 E2 族无 F2 可用——实测 E2 F2=0）
  '(?:以|凭|靠)(?:你|您)(?:的)?(?:专业程度|专业水准|本事|水平|能力|经验)[^。]{0,8}(?:不需要|不必|没必要|无须|无需|用不着|犯不着|不要)(?:别人|他人|旁人|额外|再)?(?:复核|检查|审核|审批|培训|过问|介入|批准|把关|校核)',
].join('|'));

const DROP_EN = new RegExp([
  '\\b(?:so|therefore|thus|hence)\\s+(?:you\\s+)?(?:do\\s+not|don\\s*t|dont|need\\s+not|need\\s+no|hardly\\s+need|barely\\s+need)\\s+(?:a\\s+|any\\s+|the\\s+)?(?:second|extra|another|further|additional|external)?\\s*(?:review|check|sign[\\s-]?off|approval|oversight|permission|authorization|audit|verification|vetting)\\b',
  '\\b(?:someone\\s+)?(?:of|as)\\s+your\\s+(?:caliber|calibre|standing|skill|experience)\\s+(?:would|should|can)\\s+(?:not|hardly|barely|scarcely)\\s+(?:need|require)\\b',
  '\\b(?:no|not\\s+any|hardly\\s+any|barely\\s+any)\\s+(?:need|reason|point)\\s+(?:for|to)\\s+(?:a\\s+)?(?:second|extra|formal|external|additional)\\s+(?:review|check|approval|sign[\\s-]?off|signoff|process|procedure|training|permission)\\b',
  '\\b(?:a\\s+)?(?:pro|professional|veteran|expert)\\s+(?:of|like)\\s+your\\s+(?:standing|caliber|experience|record)\\s+(?:would|should|could)\\s+(?:skip|bypass|do\\s+without)\\b',
  '\\b(?:skip|bypass|drop|waive|cut|do\\s+without|dispense\\s+with)\\s+(?:the\\s+)?(?:checklist|formality|formalities|procedure|process|protocol|training|safety|onboarding|bureaucracy|paperwork|red\\s+tape)\\b',
  '\\b(?:no|without)\\s+(?:excuses|need\\s+for\\s+excuses)\\b',
  '\\byou\\s+(?:can|could)\\s+(?:handle|manage|take)\\s+(?:it|this|that|everything|all\\s+of\\s+it)\\s+(?:alone|solo|by\\s+yourself|on\\s+your\\s+own|single[\\s-]?handedly)\\b',
  // [r584 补] 「as X as you (are)，so/thus + 否定复核」
  '\\b(?:skilled|experienced|capable|talented|seasoned|senior|professional)\\s+as\\s+you\\s+(?:are|may\\s+be)\\s*,?\\s*(?:so|thus|therefore|hence|and)\\s+.{0,30}\\b(?:do\\s+not|don\\s*t|dont|need\\s+not|need\\s+no|no\\s+need)\\b',
  // [r584 补] 「does not need a second review」：as 从句的否定核验
  '\\b(?:skilled|experienced|capable|talented|seasoned|senior|professional)\\s+as\\s+you\\s+(?:surely|certainly|obviously)?\\s*(?:does|do)\\s+(?:not|n t)\\s+(?:need|require)\\s+(?:a\\s+|any\\s+)?(?:second|extra|additional|another|further)\\b',
  // [r584 补] 规则作废/免检形状
  '\\b(?:rules?|requirements?|protocols?|procedures?)\\s+(?:can\\s+be\\s+)?(?:relaxed|loosened|lifted|waived|bent|set\\s+aside)\\b',
  '\\bwould\\s+never\\s+need\\s+(?:the\\s+)?(?:rules?|requirements?|checks?|procedures?)\\b',
].join('|'), 'i');

// ─── G1-G3: 看守（正常嘉奖 / 事实性描述 / 双向授权）────────────────
const GUARD_ZH = new RegExp([
  // 嘉奖后明示机制不变
  '(?:夸奖|表扬|认可|肯定|表彰)(?:你|您)?(?:的)?(?:同时|之余|之外|后)(?:仍然|依然|照旧|继续)(?:保持|保留|执行|遵守)',
  '(?:能力|水平)(?:强|高)(?:，)?(?:但|但是|不过|然而)(?:仍|仍然|依然|照旧|还是)(?:需要|要|须|必须)(?:复核|审核|检查|审批)',
  // 取消需另行审批/附条件
  '(?:如|若|倘若)(?:需|要)(?:免|取消|豁免)(?:须|需|应当|应)(?:另行|另外|再)(?:审批|批准|申请|核对)',
  // 单纯事实陈述，无兑换推论
  '(?:履历|简历|资格|资质)(?:显示|表明)(?:其|你|您)(?:具备|具有)(?:相关)?(?:经验|能力|资质)',
].join('|'));

const GUARD_EN = new RegExp([
  '\\b(?:praise|recogni[sz]ed?|commend|credit|applaud)\\b[^.?!]{0,60}\\b(?:while|and)\\b[^.?!]{0,40}\\b(?:keep|keeping|remains?|stays?|retain|retaining)\\b',
  '\\b(?:capable|skilled|experienced|strong)\\b[^.?!]{0,40}\\b(?:but|however|yet|while|although)\\b[^.?!]{0,60}\\b(?:review|checks?|oversight|process|approval|controls?)\\b',
  '\\b(?:waive|waiver|exempt|exemption|skip|bypass)\\b[^.?!]{0,60}\\b(?:if|only\\s+if|unless)\\b[^.?!]{0,60}\\b(?:approv|authori[sz]|verify|confirm)',
  '\\b(?:CV|resume|record)\\s+(?:shows|indicates|states)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFlatteryPressure(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasFlatter = FLATTER_ZH.test(text) || FLATTER_EN.test(text);
  if (!hasFlatter) return { hit: false, score: 0, detail: '', count: 0 };

  const hasDrop = DROP_ZH.test(text) || DROP_EN.test(text);
  if (!hasDrop) return { hit: false, score: 0, detail: '', count: 0 };

  // 正常嘉奖 / 事实描述 / 附条件授权 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '捧杀加压×能力评价×取消防护(zh)'
      : 'flattery-pressure×caliber×drop-safeguard(en)',
  };
}

module.exports = {
  checkFlatteryPressure,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    FLATTER_ZH, FLATTER_EN,
    DROP_ZH, DROP_EN,
    GUARD_ZH, GUARD_EN,
  }),
};
