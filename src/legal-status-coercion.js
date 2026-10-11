/**
 * src/legal-status-coercion.js — 「法律身份胁迫」检测器（第 122 个判别维度）
 *
 * [r678 立项建模块] 候选来源：r678 探测器（scripts/round-678-family-probe.js）
 * 在当前 121 维引擎上实测量（判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；≥50%
 * 攻击漏判且良性 0 误伤才算合格）。六族全部合格，decision 本体一次选出
 * （scripts 目录外 runner 读 /root/.hermes/cache/scratch/decide-opts-r678.json，
 * composite_score 0.94 / confidence 0.90 / identity alignment 100%，无拒选）：
 * D legal_status_coercion 0.94 > B deprivation_coercion 0.89 >
 * A liberty_restriction 0.89 > C medical_coercion 0.86。D 族实测攻击
 * 10 条漏判 9 条（90%）、其中全维度零命中 9 条、良性 6 条 0 误伤。
 *
 * 辨别的族：「法律身份胁迫」（legal status coercion）——操控者把
 * **对方的法律身份、法律程序结果或法律性生计后果**当作胁迫筹码，
 * 逼迫对方顺从或放弃离开/求助。这是移民依赖与经济依赖型家暴最
 * 常见的控制手段（Duluth 控制轮的「恐吓」与「利用移民身份」两项）：
 *   你敢离婚，我就让你遣返回国，你试试。
 *   报警？警察认识我，你告不倒我。
 *   你的签证在我手里，不听话就给你断了。
 *   离开我，我让你在这个行业永远找不到工作。
 *   If you leave, I will make sure you are deported. Remember that.
 *
 * 为什么现有 121 个维度拦不住（r678 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——economic_control 管经济
 *   支配（钱/财产/账目）、social_isolation 管社交关系隔绝、
 *   privacy_exposure_coercion 管隐私内容暴露、helplessness_induction
 *   管无依据无助声明，都不覆盖「法律身份对象 × 胁迫句式」这个组合。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿 A「法律身份/法律后果对象」（三类任中一类）：
 *     A1 身份对象（遣返/签证/护照/绿卡/户籍/户口/身份/移民局/工签；
 *        英文 deport/visa/passport/green card/citizenship/immigration）；
 *     A2 法律程序对象（报警/警察/法院/法官/律师/官司/起诉/吃官司/
 *         拘留/坐牢/看守所/派出所；英文 police/court/judge/lawsuit/
 *         sue/arrest/jail）；
 *     A3 法律性生计/声誉对象（行业/圈子/单位/公司/学校/领导/接不到活/
 *         混不下去/找不到工作/身败名裂；英文 industry/company/job/
 *         career/reputation）；
 *   · 腿 B「胁迫句式」（七类任中一类，全部指向对方）：
 *     B1 恐吓后件（我就让你/叫你 + 遣返/混不下去/找不到工作/吃官司/
 *        哪儿都去不了；英文 i will make sure + 法律后果词）；
 *     B2 条件绑定（你敢/你再敢/不听话 + 就给你/就让你/看我；英文
 *        if you leave/go/try + 法律后果词）；
 *     B3 求助阻断（报警也没用/警察认识我/我认识法官/打点好了/告不倒/
 *        告不赢/打官司必输/死了这条心/没人信你；英文 the police know
 *        me / you will lose / reporting me is useless）；
 *     B4 扣押要挟（证件/签证/护照/户籍/绿卡 + 在我手里/在我这/我扣着/
 *        没收/给你断了/收回来/吊销；英文 i have/hold your passport）；
 *     B5 生计封杀（让你 + 在这个行业/圈子/城市 + 混不下去/接不到/
 *        永远别想；我一句话你就接不到活）；
 *     B6 单位施压（去你单位/公司/学校闹/找你领导/让所有人都知道）；
 *     B7 生存绑定（离开我/没有我 + 你连/怎么活/活不下去/什么都不是；
 *        英文 without me you can't/couldn't）。
 *   · 单腿不判：「签证还有三个月到期，需要准备续签材料」是身份对象
 *     无胁迫句式；「不听话就不给你糖吃」是胁迫句式无法律身份对象。
 *
 * 明确不判的（守门 G1-G2）：
 *   · G1 概念/规范/求助陈述：身份「不应成为威胁的筹码」、威胁「属于
 *     违法行为」、is a form of abuse、受法律保护、可以/请及时报警、
 *     申请人身安全保护令、不得非法扣押；
 *   · G2 句首咨询提问（只认句首咨询词，句中「报警？」反问不豁免——
 *     「报警？警察认识我」正是本族攻击形）。
 *
 * [r678 实现纪律] 同 r642-r677：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（单层反斜杠）——r675/r676 曾被
 *    patch 写成双层反斜杠导致恒 false（只影响 detail 文案，不影响
 *    判定，本轮起新模块一律单层，见 test D 组 isZh 断言）。
 */

'use strict';

// ─── 腿 A1: 法律身份对象 ──────────────────────────────────────────
const IDENT_ZH = new RegExp([
  String.raw`(?:遣返|遣送|递解出境)`,
  String.raw`(?:签证|护照|绿卡|居留权|居留卡|工签|工作签证|国籍|户籍|户口|身份证明|身份证|移民局|出入境)`,
  String.raw`(?:你没有身份|没有身份|黑户|黑下来)`,
].join('|'), 'i');

const IDENT_EN = new RegExp([
  String.raw`\b(?:deport\w*|deportation)\b`,
  String.raw`\b(?:visa|passport|green\s+card|residency|citizenship|immigration\s+status|work\s+permit)\b`,
].join('|'), 'i');

// ─── 腿 A2: 法律程序对象 ──────────────────────────────────────────
const LEGAL_ZH = new RegExp([
  String.raw`(?:报警|报什么警|报案|警察|公安局|派出所|看守所|监狱)`,
  String.raw`(?:法院|法庭|法官|律师|检察官|起诉|官司|吃官司|拘留|坐牢|牢狱|案底)`,
  String.raw`(?:告到|告我|起诉你|法庭上见)`,
].join('|'), 'i');

const LEGAL_EN = new RegExp([
  String.raw`\b(?:police|court|judge|lawsuit|sue|arrest\w*|jail|prison|parole)\b`,
].join('|'), 'i');

// ─── 腿 A3: 法律性生计/声誉对象 ───────────────────────────────────
const CAREER_ZH = new RegExp([
  String.raw`(?:这个行业|这个圈子|这一行|这个城市|这个专业|这个领域)`,
  String.raw`(?:单位|公司|学校|领导|上司|同事|客户|货源|活路|差事)`,
  String.raw`(?:找不到工作|接不到活|混不下去|待不下去|身败名裂|名誉|名声|前途)`,
].join('|'), 'i');

const CAREER_EN = new RegExp([
  String.raw`\b(?:industry|company|job|career|reputation|profession|business)\b`,
  // 生计后果短语（「never work in this town again」——腿 A 对象缺失时的
  // 后果锚点；用空格写法不用 \s，避免写盘层转义分歧）
  String.raw`(?:never work|never find a job|won'?t hire|no one will hire)`,
].join('|'), 'i');

// ─── 腿 B1: 恐吓后件（我就让你 + 法律后果）────────────────────────
const THREAT_ZH = new RegExp([
  String.raw`(?:我就|我就会|我一定|我保证|我肯定|我会|看我)(?:让你|叫你|使你)[^。]{0,18}(?:遣返|递解|混不下去|待不下去|找不到工作|接不到|吃官司|坐牢|拘留|身败名裂|难堪|好看|哪儿都去不了|什么都干不成|翻不了身)`,
  String.raw`(?:让你|叫你)[^。]{0,6}(?:在这个行业|在这个圈子|在这一行|在这个城市|在这个领域)[^。]{0,12}(?:混不下去|待不下去|找不到工作|接不到|永远别想|抬不起头|翻不了身)`,
].join('|'), 'i');

const THREAT_EN = new RegExp([
  String.raw`\b(?:i\s+will\s+make\s+sure|i'?ll\s+make\s+sure|i\s+will\s+have\s+you|i\s+promise\s+you)\b[^.]{0,40}\b(?:deport\w*|arrest\w*|jail\w*|sue\w*|never\s+work|never\s+find|homeless|ruin\w*|regret)`,
].join('|'), 'i');

// ─── 腿 B2: 条件绑定（你敢 X 我就 / 不听话就）─────────────────────
const COND_ZH = new RegExp([
  String.raw`(?:你敢|你再敢|再敢|要是你敢|如果你敢|你若敢)[^。]{0,12}(?:我就|我就让|我一定|看我不|我让你|我叫你)`,
  String.raw`(?:不听话|不听我的|不乖乖|不顺着我|再提|再敢|敢反抗)[^。]{0,8}就(?:给你|让你|叫你|把我)`,
].join('|'), 'i');

const COND_EN = new RegExp([
  String.raw`\bif\s+you\s+(?:leave|go|try|walk|run|escape)\b[^.]{0,40}\b(?:deport\w*|arrest\w*|jail\w*|sue\w*|lawsuit|regret|never\s+work|never\s+find|homeless|nothing)`,
].join('|'), 'i');

// ─── 腿 B3: 求助阻断（报警也没用/我认识人）────────────────────────
const BLOCKHELP_ZH = new RegExp([
  String.raw`(?:报警也没用|报警没用|报什么警|警察认识我|我认识法官|我认识警察|我有人|我上面有人|打点好了|打点过|法院有人)`,
  String.raw`(?:你告不倒|告不赢|打官司必输|必输无疑|死了这条心|省点力气|没人会信你|没人信你|白告|告也白告)`,
  String.raw`(?:律师|法官|检察院)(?:是我|是我家|我有人)`,
].join('|'), 'i');

const BLOCKHELP_EN = new RegExp([
  String.raw`\bthe\s+police\s+know\s+me\b`,
  String.raw`\breporting\s+me\s+is\s+(?:useless|pointless|no\s+use)\b`,
  String.raw`\byou\s+will\s+(?:lose|never\s+win)\b`,
  String.raw`\bnobody\s+will\s+(?:believe|hire)\s+you\b`,
].join('|'), 'i');

// ─── 腿 B4: 扣押要挟（证件 + 在我手里/没收/断了）───────────────────
const WITHHOLD_ZH = new RegExp([
  // 证件在前（「你的签证在我手里」）
  String.raw`(?:签证|护照|证件|身份证|户口|户籍|绿卡|身份|材料|卡)[^。]{0,8}(?:在我手里|在我这|在我手上|我藏着|我扣着|我没收|我给你断|给你断了|收回来|吊销|撕了|藏起来)`,
  // 动作短语形（「护照我先扣着」——先扣/扣着/先收，无「在我手里」连接词）
  String.raw`(?:签证|护照|证件|身份证|户口|户籍|绿卡|身份)[^。]{0,4}(?:先扣|扣着|扣下|先收|收着|先锁|锁着|先藏|藏起来)`,
  // 动作在前（「我把你的证件藏起来了」）
  String.raw`(?:我把|我将|我早就把)[^。]{0,6}(?:签证|护照|证件|身份证|户口|户籍|绿卡|材料)[^。]{0,6}(?:藏|扣|收|断|锁|撕|吊销)`,
].join('|'), 'i');

const WITHHOLD_EN = new RegExp([
  String.raw`\bi\s+(?:have|hold|keep|locked|took|hid)\b[^.]{0,24}\b(?:passport|visa|documents?|papers?|id\b)`,
  String.raw`\byou\s+are\s+not\s+going\s+anywhere\b[^.]{0,30}\b(?:passport|visa|documents?|papers?)\b`,
].join('|'), 'i');

// ─── 腿 B5: 生计封杀 ──────────────────────────────────────────────
const CAREERLOCK_ZH = new RegExp([
  String.raw`(?:我一句话|我吭一声|我打个招呼)[^。]{0,12}(?:你就|谁都)[^。]{0,10}(?:接不到|找不到|混不下|吃不开|做不了)`,
  String.raw`(?:在这个行业|在这个圈子|在这一行|在这个城市|在这个领域)[^。]{0,14}(?:没有我|离了我|离开我)[^。]{0,10}(?:你|谁)[^。]{0,6}(?:混不下|待不下|找不到|接不到|吃不开)`,
].join('|'), 'i');

// ─── 腿 B6: 单位施压 ──────────────────────────────────────────────
const WORKPRESSURE_ZH = new RegExp([
  String.raw`(?:去你单位|去你公司|去你学校|去你家里|上你单位|闹到你|找你领导|找你们领导|找你们老板)[^。]{0,16}`,
  String.raw`让所有人都知道你[^。]{0,12}`,
  String.raw`(?:发到|曝光到|捅到|闹到)[^。]{0,6}(?:网上|单位|公司|学校|群里|朋友圈)[^。]{0,12}`,
].join('|'), 'i');

// ─── 腿 B7: 生存绑定（离开我 + 生存威胁）─────────────────────────
const SURVIVAL_ZH = new RegExp([
  String.raw`(?:离开我|离开了我|没有我|没了我)[^。]{0,16}(?:你连|你怎么活|吃什么|住哪|活不下去|混不下去|谁敢要你|谁敢接盘|就是废物|什么都不是|去要饭|流落街头)`,
].join('|'), 'i');

const SURVIVAL_EN = new RegExp([
  String.raw`\bwithout\s+me\s+you\b[^.]{0,40}\b(?:can'?t|couldn'?t|will\s+not|won'?t|never|are\s+nothing|would\s+be\s+nothing)\b`,
].join('|'), 'i');

// ─── G1: 概念/规范/求助陈述（守门）────────────────────────────────
const CONCEPT_ZH = new RegExp([
  // 「移民身份不应成为威胁对方的筹码」类
  String.raw`(?:不应|不能|不可以|请勿|切勿|不得|严禁)[^。]{0,14}(?:成为|把|将|拿)[^。]{0,10}(?:威胁|筹码|把柄|控制|要挟|手段)`,
  // 「威胁、恐吓他人属于违法行为」类
  String.raw`(?:威胁|恐吓|胁迫|要挟)[^。]{0,10}(?:属于|是|构成)[^。]{0,8}(?:违法|犯罪|家暴|虐待|控制|管控|侵权行为)`,
  // 法律保护/求助通道陈述
  String.raw`(?:受法律保护|有权依法|可以报警|请及时报警|建议报警|及时报警|寻求帮助|求助热线|咨询律师|申请人身安全保护令|保留证据|拨打\s*110|报警电话|法律援助)`,
  // 规范禁止扣押
  String.raw`(?:不得|严禁|禁止|不应)[^。]{0,12}(?:非法|擅自|强行)[^。]{0,8}(?:扣押|没收|限制|扣留)`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\bis\s+a\s+form\s+of\s+(?:abuse|coercion|control)\b`,
  String.raw`\brecognized\s+as\b`,
  String.raw`\bshould\s+not\s+be\s+used\b`,
  String.raw`\bis\s+(?:illegal|unlawful|a\s+crime)\b`,
  String.raw`\b(?:seek|get)\s+help\b`,
  String.raw`\bcontact\s+(?:the\s+)?(?:police|authorities|lawyer|attorney)\b`,
  String.raw`\breport\s+(?:it|them|this)\s+to\b`,
].join('|'), 'i');

// ─── G2: 句首咨询提问（只认句首，句中反问不豁免）──────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLegalStatusCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const IDENT_ZH_ = R.IDENT_ZH || IDENT_ZH;
  const IDENT_EN_ = R.IDENT_EN || IDENT_EN;
  const LEGAL_ZH_ = R.LEGAL_ZH || LEGAL_ZH;
  const LEGAL_EN_ = R.LEGAL_EN || LEGAL_EN;
  const CAREER_ZH_ = R.CAREER_ZH || CAREER_ZH;
  const CAREER_EN_ = R.CAREER_EN || CAREER_EN;
  const THREAT_ZH_ = R.THREAT_ZH || THREAT_ZH;
  const THREAT_EN_ = R.THREAT_EN || THREAT_EN;
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const COND_EN_ = R.COND_EN || COND_EN;
  const BLOCKHELP_ZH_ = R.BLOCKHELP_ZH || BLOCKHELP_ZH;
  const BLOCKHELP_EN_ = R.BLOCKHELP_EN || BLOCKHELP_EN;
  const WITHHOLD_ZH_ = R.WITHHOLD_ZH || WITHHOLD_ZH;
  const WITHHOLD_EN_ = R.WITHHOLD_EN || WITHHOLD_EN;
  const CAREERLOCK_ZH_ = R.CAREERLOCK_ZH || CAREERLOCK_ZH;
  const WORKPRESSURE_ZH_ = R.WORKPRESSURE_ZH || WORKPRESSURE_ZH;
  const SURVIVAL_ZH_ = R.SURVIVAL_ZH || SURVIVAL_ZH;
  const SURVIVAL_EN_ = R.SURVIVAL_EN || SURVIVAL_EN;
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
      ? '法律身份胁迫×法律身份对象×胁迫句式(zh)'
      : 'legal-status-coercion×legal-status-object×coercion-frame(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（两类共用）：概念/规范/求助陈述、句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // 腿 A：法律身份/法律后果对象（三类任中一类）
  const legA = IDENT_ZH_.test(text) || IDENT_EN_.test(text) ||
    LEGAL_ZH_.test(text) || LEGAL_EN_.test(text) ||
    CAREER_ZH_.test(text) || CAREER_EN_.test(text);
  if (!legA) return miss();

  // 腿 B：胁迫句式（七类任中一类）
  if (THREAT_ZH_.test(text)) return hitResult;
  if (THREAT_EN_.test(text)) return hitResult;
  if (COND_ZH_.test(text)) return hitResult;
  if (COND_EN_.test(text)) return hitResult;
  if (BLOCKHELP_ZH_.test(text)) return hitResult;
  if (BLOCKHELP_EN_.test(text)) return hitResult;
  if (WITHHOLD_ZH_.test(text)) return hitResult;
  if (WITHHOLD_EN_.test(text)) return hitResult;
  if (CAREERLOCK_ZH_.test(text)) return hitResult;
  if (WORKPRESSURE_ZH_.test(text)) return hitResult;
  if (SURVIVAL_ZH_.test(text)) return hitResult;
  if (SURVIVAL_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkLegalStatusCoercion,
  __internals: () => ({
    IDENT_ZH, IDENT_EN, LEGAL_ZH, LEGAL_EN, CAREER_ZH, CAREER_EN,
    THREAT_ZH, THREAT_EN, COND_ZH, COND_EN,
    BLOCKHELP_ZH, BLOCKHELP_EN, WITHHOLD_ZH, WITHHOLD_EN,
    CAREERLOCK_ZH, WORKPRESSURE_ZH, SURVIVAL_ZH, SURVIVAL_EN,
    CONCEPT_ZH, CONCEPT_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
