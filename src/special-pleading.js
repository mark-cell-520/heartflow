/**
 * src/special-pleading.js — 「特殊辩护」检测器（第 150 个判别维度）
 *
 * [r719 立项] decision 本体选出（scripts/decide-r719.js，composite_score
 * 0.85 / confidence 0.8 / identity alignment 0.8，无拒选）。候选池来自
 * r719 探测器（scripts/round-719-family-probe.js）在当前引擎（v6.8.66，
 * 149 维）上逐族复测：攻击漏判 9/9（100%）、真零命中 9/9、良性 0/9
 * 误伤。Phase 1.5 同律复核：9 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 9/9。缺口成立。
 *
 * 辨别的族：特殊辩护（special pleading / double standard）——**主张
 * 同一套规则、标准或纪律对别人有效、对自己无效，且提不出正当理由**，
 * 用「身份特殊」或「情况特殊」作单向豁免：
 *   规则是给普通人定的，我不一样。
 *   我情况特殊，所以可以例外。
 *   别人迟到要扣钱，我迟到是有原因的。
 *   这个规定对我不适用，我的层次不一样。
 *   大家都是凡人，只有我超脱了规则。
 *   规矩是约束别人的，我自有分寸。
 *   The rules apply to everyone else, but I am different.
 *   That policy is for regular employees; I am above that.
 *   Normal standards do not apply to someone like me.
 *
 * 与既有维度的边界（r719 归因）：
 *   · standard_shift 管**契约/标准事后单方面作废**（之前说的不算数），
 *     本族管同一套标准的**双向适用**问题（对别人有效对自己无效）；
 *   · responsibility_absolution 管**责任开脱**（这不是我的责任），
 *     本族管规则适用权的双标，不涉具体事件归责；
 *   · 其余 149 个维度对本族 9 条漏判样本实测零命中 9/9。
 *   · r716-r718 三连出局的历史：存量维度 crisis_exceptionalism 曾误伤
 *     良性样本「特殊情况需要特批，但要走正规流程」（B1×B2 名词单独成支），
 *     r719 全局修复已将其 GUARD_ZH 补「走正规流程」看守支，fp 清零后
 *     本族才首次够格——上线后与该存量修复并存，射程互补。
 *
 * 判据（四条路由任一成立）：
 *   · 路由一「规则他指×自我例外」双腿共现：腿①规则他指（规则/规定/
 *     规矩/标准/政策/纪律/流程 + 给普通人/约束别人/对别人适用/别人都
 *     要/大家都要；EN: rules apply to everyone else / for regular
 *     employees / normal standards）× 腿②自我例外（我不一样/我特殊/
 *     不适用于我/我的层次/我超脱/我自有分寸；EN: I am different /
 *     I am above / do not apply to me / someone like me）；
 *   · 路由二「对比双标」双腿共现：腿①他人受管（别人/大家/所有人/员工
 *     + 要/必须/得/扣/罚/遵守；EN: everyone else must / others have
 *     to）× 腿②自我豁免（我 + 不用/不必/例外/是有原因/无所谓/可以免；
 *     EN: but I / except me / I don't have to）；
 *   · 路由三「特殊身份×例外许可」双腿共现：腿①特殊身份自我宣告
 *     （我情况特殊/我与众不同/我身份特殊/我的层次/我的地位；EN: I am
 *     special / my situation is special / my position）× 腿②例外许可
 *     （所以可以例外/可以网开一面/应当通融/能够变通；EN: make an
 *     exception for me / I can be excepted）。
 *   · 路由四「同行为不同定性」（r261 新增）双腿共现：腿①他人同一行为
 *     的负面定性（别人熬夜伤身 × 我熬夜是热爱工作——同样的行为，落在
 *     别人身上是透支/浪费/犯错，落在自己身上是热爱/奉献/情怀）× 腿②
 *     自我同一行为的正面重述，**两腿须含同一个行为词**（捕获腿①行为
 *     词回填腿②，防「别人熬夜伤身，我十点就睡」式伪双标）。EN:
 *     "Everyone else who stays up late is being irresponsible; when
 *     I stay up late it is dedication."
 *   · 缺腿不判：只有规则他指（「公司有特批流程，符合条件的人可以
 *     申请例外」）是正当程序陈述；只有自我描述（「我情况确实比较
 *     特殊」）无例外主张，归 factual。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人双标言论供分析（「他说规则
 * 是给普通人定的，这是典型双标」）、文学对白、合规讨论中的反例。
 * verify 的含义是「这段话在主张规则的双向适用不一致，需要回到同一
 * 套标准」——调用方应要求把「为什么你可以例外」落到正当理由上，
 * 而不是接受身份叙事。
 *
 * 明确不判的（豁免）：
 *   · 正当程序/资质在场（特批/正规流程/书面批准/审批/资质/权限/
 *     合理便利/产品设计/合规；approval/qualification/permit/
 *     documented/design）：走程序的例外是制度设计不是双标；
 *   · 元话语/概念引述（特殊辩护/双重标准/double standard/special
 *     pleading 字样在场）：分析这个概念本身不是运用它；
 *   · 更严审查在场（更严/不是更松/更加严格/stricter/more
 *     stringent）：对特定人群的更严要求是反向双标的反面，不判；
 *   · 对称要求在场（仅路由四：同一个标准/一视同仁/the same
 *     standard）：主张一视同仁不是双标。
 */
'use strict';

// [r261] 立项记录：探针 coordination/agent4/probes/r261-probe-pool.js
// （v6.8.153，hf.gate() 全量 findings 口径）实测本维度 6/6 全新自然措辞
// 穿透胜出（其余候选族见报告）。本轮到位的全新措辞家族：
//   · 腿①（路由一）补同义反复形「规定是规定」——规则自指即「规则
//     是规则（对你是）」的双标前奏；
//   · 腿①（路由二）补他人违规否定形「别人插队不行」与合规动作普遍
//     要求形「大家都得打卡」——他人受管不再只认迟到/扣钱族；
//   · 腿②（路由一）补「我是例外」「我情况不一样」；腿②（路由二）补
//     「我这是特殊情况」；EN 补 "my case is different" / "I am the
//     exception"；
//   · 新增路由四「同行为不同定性」：同一行为词在他人名下被判负面、
//     在自己名下被判正面（别人熬夜伤身 × 我熬夜是热爱工作），两腿
//     须含同一行为词（捕获回填），对称要求在场（同一个标准/一视同仁/
//     the same standard）豁免。

// ─── 腿①（路由一）：规则他指 ─────────────────────────────────────
const RULE_OTHERS_ZH = /(?:(?:规则|规定|规矩|标准|政策|纪律|制度|流程|条款|协议)[^。]{0,10}(?:是|都)?(?:给|用于|适用于|约束|管|要求)[^。]{0,8}(?:普通人|别人|他人|其他人|一般人|大众|员工|下属|大家|老百姓)|(?:别人|他人|其他人|大家|所有人|每个人|员工)[^。]{0,6}(?:都)?(?:要|必须|得|遵守|服从|遵照)[^。]{0,6}(?:规则|规定|规矩|标准|制度|纪律|流程)|(?:规则|规定|规矩|标准|政策|纪律|制度|流程|条款)[^。]{0,8}(?:对我不适用|对我无效|不约束我|管不了我|与我无关)|(?:大家|所有人|别人|他人|凡人|普通人)[^。]{0,8}(?:都是|全是|要|必须|得)[^。]{0,6}(?:凡人|普通人|遵守|受[约管]|服从|守规矩)|(?:规定|规则|规矩|制度|纪律|标准|政策|流程|条款)(?:毕竟|终究|到底)?是(?:规定|规则|规矩|制度|纪律|标准|政策|流程|条款))/;

const RULE_OTHERS_EN = /\b(?:rules?\s+(?:apply|are)\s+(?:for|to)\s+(?:everyone\s+else|others|regular|normal|ordinary)|for\s+(?:the\s+)?(?:regular|ordinary|normal|junior|senior)\s+(?:employees|people|staff|workers)|normal\s+standards?\s+(?:do\s+not\s+)?(?:apply|are)|bind(?:s)?\s+(?:everyone\s+(?:else|but)|the\s+(?:team|others|rest|staff))|everyone\s+else\s+(?:has|must|should)\s+to|everyone\s+(?:is|else)\s+(?:a\s+)?(?:mortal|ordinary|regular)|(?:applies?|apply)\s+to\s+everyone\s+but|others\s+(?:must|have|need)\b|(?:ordinary|regular|normal|junior)\s+(?:employees|staff|workers|people)\s+(?:need|must|have)\b)\b/i;

// ─── 腿②（路由一）：自我例外 ─────────────────────────────────────
const SELF_EXCEPT_ZH = /(?:我不一样|我不同|我特殊|对我(?:不适用|无效|例外)|不适用于我|我的层次|我超脱|我自有分寸|我例外|我自然不同|我这人不一样|我身份不同|管不到我|与我无关|我想来就来|我说了算|是我定|我带头|我(?:是|就是|算是|属于|当作)(?:一个)?例外|我(?:的)?(?:情况|状况|处境)(?:确实|的确|根本|其实|比较|就是|还)?(?:不一样|不同))/;

const SELF_EXCEPT_EN = /\b(?:I\s+am\s+(?:different|above|exceptional|special|exempt|beyond)|do\s+not\s+apply\s+to\s+(?:me|someone\s+like\s+me)|does\s+not\s+apply\s+to\s+me|someone\s+like\s+me|I\s+am\s+not\s+bound|except\s+me|of\s+my\s+caliber|I\s+make\s+the\s+rules|I\s+(?:simply\s+)?do\s+not\s+bother|my\s+(?:case|situation|circumstances?|position|status)\s+is\s+(?:different|special|exceptional|not\s+the\s+same|unique)|I\s+am\s+(?:the\s+)?exception)\b/i;

// ─── 腿①（路由二）：他人受管 ─────────────────────────────────────
const OTHERS_BOUND_ZH = /(?:(?:别人|他人|其他人|大家|所有人|每个人|员工|下属|同事)[^。]{0,8}(?:要|必须|得|需要|应当)(?:被)?(?:扣|罚|遵守|服从|遵照|执行|守|通报|批评|考核|检讨|检查)|(?:别人|他人|大家|他们)[^。]{0,4}(?:迟到|早退|请假|犯错|出错|违规)[^。]{0,10}(?:扣钱|扣工资|罚款|处罚|开除|挨骂|受罚|通报|批评|写检查|做检讨)|(?:签到|打卡|考勤|流程|审批|培训|考核|着装)[^。]{0,6}(?:对|给)(?:他们|别人|他人|其他)[^。]{0,6}(?:是)?(?:硬)?(?:要求|规定|制度|硬性)|(?:别人|他人|其他人|大家|他们|一般人)[^。；;，,]{0,8}(?:插队|加塞|违章|违规|作弊|抄袭|迟到|早退|旷工|酒驾|闯红灯|走后门|托关系)[^。；;，,]{0,8}(?:不行|不可以|不允许|不能|该罚|要罚|有问题|是错|算违规|违纪|说不过去)|(?:大家|所有人|每个人|别人|他人|员工|同事|下属)[^。]{0,6}(?:都)?(?:得|要|必须|需要|应当)[^。]{0,6}(?:打卡|签到|考勤|考核|着装|穿工服|戴口罩|填表|写周报))/;

// ─── 腿②（路由二）：自我豁免 ─────────────────────────────────────
const SELF_EXEMPT_ZH = /(?:我[^。]{0,6}(?:不用|不必|无须|不需要|可以免|是例外|是有原因|是有道理|无所谓|能通融|是弯路|是摸索|是探索|情有可原|特殊对待)|对我[^。]{0,4}(?:网开一面|通融|例外)|我[^。]{0,4}(?:想来就来|说了算|带头)|我(?:这)?(?:是|属于|算|就是一个?|本来就是)?[^。]{0,2}(?:情况|状况|处境)?(?:比较|真的|确实|相当|有点)?特殊)/;

// ─── 腿①（路由三）：特殊身份自我宣告 ─────────────────────────────
const SPECIAL_SELF_ZH = /(?:我情况特殊|我与众不同|我身份特殊|我的层次|我的地位|我身份不同|我这个人特殊|我比较特殊|我确实特殊|我情况确实特殊)/;

// ─── 腿②（路由三）：例外许可 ─────────────────────────────────────
const EXCEPTION_GRANT_ZH = /(?:所以可以例外|可以例外|可以网开一面|应当通融|能够变通|可以通融|理应例外|可以破例)/;

// ─── 英文侧（路由二/三合并支）────────────────────────────────────
const DOUBLE_STANDARD_EN = /\b(?:everyone\s+else\s+(?:has|must|should|needs)\s+to[^.]{0,30}?\bbut\s+I\b|others\s+(?:have|must)\s+to[^.]{0,30}?\bbut\s+I\b|I\s+(?:am|'m)\s+special[^.]{0,20}?\bso\s+I\b|my\s+situation\s+is\s+special[^.]{0,20}?\bso\b|make\s+an\s+exception\s+for\s+me|I\s+can\s+be\s+excepted)\b/i;

// ─── 豁免一：正当程序/资质在场 ────────────────────────────────────
const EVIDENCE_PRESENT = /(?:特批|正规流程|正式流程|书面(?:批准|审批|确认|授权)|审批|资质|权限|合理便利|产品设计|合规|报备|备案|申请例外|符合条件|documented|written\s+approval|approval\s+from|qualification|permit|licen[sc]e|design|clause|policy\s+requires|requires\s+approval)/i;

// ─── 豁免二：元话语/概念引述 ──────────────────────────────────────
const META_NOUN = /(?:特殊辩护|双重标准|special\s+pleading|double\s+standard|双标)/i;

// ─── 豁免三：更严审查在场（对特定人群的更严要求，不判）────────────
const STRICTER_PRESENT = /(?:更严|不是更松|更加严格|更为严格|stricter|more\s+stringent|tighter\s+oversight|additional\s+scrutiny)/i;

// ─── 路由四（r261 新增）：同行为不同定性 ─────────────────────────
// 腿①：他人同一行为的负面定性（捕获组 1 = 行为词，回填腿②）
const OTHERS_NEG_ZH = /(?:别人|他人|其他人|大家|他们|一般人|普通人)[^。；;，,]{0,10}(熬夜|加班|拼命|应酬|喝酒|抽烟|拼搏|奋斗|冒险|冲动|折腾|走关系|托关系|拼命工作|打游戏|刷手机)[^。；;，,]{0,10}(伤身|伤身体|有害|不好|不行|是错|犯错|不健康|透支|不要命|浪费|堕落|腐败|违法|傻)/;
// 腿②模板：%W% 处由腿①捕获的行为词回填（同一行为才判双标）
const SELF_POS_ZH = /我[^。；;，,]{0,6}%W%[^。；;，,]{0,10}(?:是|叫|算|属于|为了|因为)[^。；;，,]{0,12}(热爱|奉献|敬业|负责|拼搏|奋斗|有意义|值得|上进|理想|事业|责任|梦想|情怀|人情|世故|练手|训练)/;
// EN 腿①：捕获组 1 = 行为词词干（stay/smoke/drink…），词干回填腿②
const OTHERS_NEG_EN = /\b(?:others|other\s+people|everyone\s+else|they|them)\b[^.]{0,40}?\b(stay|smoke|drink|overwork|burn|game|gamble|slack|cut|risk)\w*\b[^.]{0,40}?\b(?:is|are|it'?s)\s+(?:\w+\s+){0,2}(?:harmful|bad|wrong|unhealthy|irresponsible|a\s+waste(?:\s+of)?|wasting|lazy|selfish|reckless|poor\s+discipline|a\s+bad\s+habit)\b/i;
// EN 腿②模板：%W% 处由腿①词干回填
const SELF_POS_EN = /\bI\b[^.]{0,40}?%W%\w*[^.]{0,30}?\b(?:is|are|it'?s)\s+(?:(?:called|termed|labeled|labelled|seen|viewed|considered|branded)\s+){0,2}(?:[a-z]+(?:-[a-z]+){0,2}\s+){0,2}(?:passion|dedication|love|my\s+calling|commitment|craft|serious\s+work|drive|focus|recovery|training|investment)\b/i;

// ─── 豁免四（仅路由四）：对称要求在场 ─────────────────────────────
// 「同一个标准」「一视同仁」式的对称表述不是双标主张
const SYMMETRY_ZH = /(?:同一个标准|同一标准|一个标准|一视同仁|同等要求|同等对待|对谁都|对自己也|双方都|一样要求|同等标准)/;
const SYMMETRY_EN = /(?:same\s+standard|the\s+same\s+rules?|apply\s+the\s+same|hold\s+(?:everyone|others)\s+to\s+the\s+same|equally\s+(?:to|for)\s+(?:all|everyone|both)|one\s+standard\s+for\s+(?:all|everyone))/i;

/**
 * 路由四：同行为不同定性（别人做是透支/犯错，我做是热爱/奉献）。
 * 两腿须含同一行为词——捕获腿①行为词回填腿②模板，防止「别人熬夜
 * 伤身，我十点就睡」式伪双标（两腿描述的行为不同）。
 * @param {string} text
 * @param {object} R 负例注入用
 * @param {boolean} isZh
 */
function checkSameValence(text, R, isZh) {
  const neg = isZh ? (R.OTHERS_NEG_ZH || OTHERS_NEG_ZH) : (R.OTHERS_NEG_EN || OTHERS_NEG_EN);
  const posTpl = isZh ? (R.SELF_POS_ZH || SELF_POS_ZH) : (R.SELF_POS_EN || SELF_POS_EN);
  const symmetry = isZh ? (R.SYMMETRY_ZH || SYMMETRY_ZH) : (R.SYMMETRY_EN || SYMMETRY_EN);
  const m = neg.exec(text);
  if (!m) return null;
  const w = m[1];
  if (!w) return null;
  const src = posTpl instanceof RegExp ? posTpl.source : String(posTpl);
  if (!src || src === '(?:)') return null;
  const posRe = new RegExp(src.split('%W%').join(w), isZh ? '' : 'i');
  if (!posRe.test(text)) return null;
  // 对称要求在场 → 主张一视同仁，不是双标
  if (symmetry.test(text)) return null;
  return { route: (isZh ? 'zh' : 'en') + ':same-behavior×opposite-valence(' + w + ')' };
}

/**
 * 中文路由：四条路由任一成立。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const ruleOthers = R.RULE_OTHERS_ZH || RULE_OTHERS_ZH;
  const selfExcept = R.SELF_EXCEPT_ZH || SELF_EXCEPT_ZH;
  const othersBound = R.OTHERS_BOUND_ZH || OTHERS_BOUND_ZH;
  const selfExempt = R.SELF_EXEMPT_ZH || SELF_EXEMPT_ZH;
  const specialSelf = R.SPECIAL_SELF_ZH || SPECIAL_SELF_ZH;
  const exceptionGrant = R.EXCEPTION_GRANT_ZH || EXCEPTION_GRANT_ZH;
  // 路由一：规则他指 × 自我例外
  if (ruleOthers.test(text) && selfExcept.test(text)) return { route: 'zh:rule-others×self-except' };
  // 路由二：他人受管 × 自我豁免
  if (othersBound.test(text) && selfExempt.test(text)) return { route: 'zh:others-bound×self-exempt' };
  // 路由三：特殊身份 × 例外许可
  if (specialSelf.test(text) && exceptionGrant.test(text)) return { route: 'zh:special-self×exception-grant' };
  // 路由四：同行为不同定性（同一行为词，他人负面 × 自我正面）
  const r4 = checkSameValence(text, R, true);
  if (r4) return r4;
  return null;
}

/**
 * 英文路由：路由一（规则他指×自我例外）+ 路由二/三合并支 + 路由四。
 */
function checkEn(text, R) {
  const ruleOthers = R.RULE_OTHERS_EN || RULE_OTHERS_EN;
  const selfExcept = R.SELF_EXCEPT_EN || SELF_EXCEPT_EN;
  const doubleStandard = R.DOUBLE_STANDARD_EN || DOUBLE_STANDARD_EN;
  if (ruleOthers.test(text) && selfExcept.test(text)) return { route: 'en:rule-others×self-except' };
  if (doubleStandard.test(text)) return { route: 'en:double-standard' };
  const r4 = checkSameValence(text, R, false);
  if (r4) return r4;
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSpecialPleading(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const EVIDENCE_PRESENT_ = R.EVIDENCE_PRESENT || EVIDENCE_PRESENT;
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const STRICTER_PRESENT_ = R.STRICTER_PRESENT || STRICTER_PRESENT;

  // 正当程序/资质在场 → 走程序的例外是制度设计不是双标
  if (EVIDENCE_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 更严审查在场 → 对特定人群的更严要求是反向双标的反面
  if (STRICTER_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `特殊辩护×双标结构(${r.route})`
        : `special pleading×double-standard(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSpecialPleading,
  __internals: () => ({
    RULE_OTHERS_ZH, RULE_OTHERS_EN, SELF_EXCEPT_ZH, SELF_EXCEPT_EN,
    OTHERS_BOUND_ZH, SELF_EXEMPT_ZH, SPECIAL_SELF_ZH, EXCEPTION_GRANT_ZH,
    DOUBLE_STANDARD_EN, EVIDENCE_PRESENT, META_NOUN, STRICTER_PRESENT,
    OTHERS_NEG_ZH, SELF_POS_ZH, OTHERS_NEG_EN, SELF_POS_EN,
    SYMMETRY_ZH, SYMMETRY_EN,
  }),
};
