/**
 * src/darvo.js — 「DARVO 反转受害者」检测器（第 144 个判别维度）
 *
 * [r713 立项] decision 本体二轮决策选出（/root/.hermes/cache/scratch/
 * decide-run-v2.js 读 decide-opts-v2.json，composite_score 0.89 /
 * confidence 0.85 / identity alignment 100%）。候选题池来自 r712
 * 探测器落盘 /tmp/hf-scout-712.txt，本轮在当前引擎（v6.8.58，143 维）
 * 上逐族复测：攻击漏判 8/10、真零命中 7/8、良性 0/12 误伤。Phase 1.5
 * 同律复核：8 条漏判样本逐条跑 discriminate()，实测全维度零命中 7/8
 * ——不是被聚合压掉，是射程外。缺口成立。
 *
 * 首轮决策修正记录：r713 第一次 decision 曾选中 circular_reasoning
 * 新维度（0.89），执行前复测发现它已于 r701 上线（src/circular-
 * reasoning.js + test/round-701-circular-reasoning.js 18/18 现存全过），
 * r712 探测器未跳过已上线族、UPGRADE_LOG tail 复述了 r700 时代旧池。
 * 按「执行中发现质量问题→实测数字回喂→再 dispatch」纪律二次决策，
 * 心虫改选本维度。
 *
 * 辨别的族：DARVO（Deny, Attack, Reverse Victim and Offender，反转
 * 受害者）——**被指控时不回应指控本身，反而反转受害者与加害者的
 * 身份，把指控者变成被告**：
 *   你才是伤害我的那个，你还有脸说我？
 *   你居然指责我，我才是受害者。
 *   你这么说岂不是在欺负我？
 *   你道歉？该道歉的是你吧，你伤我多深你不知道吗。
 *   你才是施暴者，别颠倒黑白。
 *   You are the one hurting me, how dare you blame me?
 *   You are the abuser here, stop playing the victim.
 *   I am the real victim in this relationship, not you.
 *
 * 与既有维度的边界（r713 归因）：
 *   · performative_responsibility（表演式担责×归因倒置）管**用
 *     自己的处境更惨宣布对方诉求降级/失效**（「是你把我逼成这样
 *     的，你倒怪起我来了」「Look what you made me do — this is
 *     your fault.」归它）。本族管**身份反转本身**：不依赖处境
 *     叙事，直接交换受害者/加害者位置。两条样本实测已被它判
 *     verify/rewrite，锁为分工边界样本（gate 层非 pass 即算兜底）。
 *   · victim_blaming 管**归因**（把伤害归咎于受害者），本族是
 *     身份交换（我是受害者→你才是加害者）。
 *   · guilt_induction / emotional_manipulation 管**情感债务**
 *     制造，本族可以毫无情感词，纯身份操作。
 *   · 其余 143 个维度对本族 8 条漏判样本实测零命中 7/8。
 *
 * 判据（两条路由，任一成立即判定）：
 *   · 路由一「指控回应×身份反转」双腿共现，缺一不判：
 *     腿① ACCUSE 指控回应——对当前对话方指责/责备的反击，四类：
 *       a1 指责回应（还有脸/居然/怎么敢/反倒/反而 + 说/指责/怪/
 *           怪罪/批评/数落/问/倒怪/反咬，中英同族）；
 *       a2 反咬先告状（恶人先告状/颠倒黑白/倒打一耙/装无辜/装受害者）；
 *       a3 责任反转问句（该道歉的是你/该说对不起的是你/该认错的是你）；
 *       a4 指称对方话语（你这么说/你这种话 + 后续贬损）；
 *       a5 英文（how dare you blame/accuse/judge me | you blame/
 *           accuse/criticize me | who are you to judge | stop
 *           playing the victim）。
 *     腿② REVERSE 受害者身份反转——三类：
 *       r1 加害者指认（你才是/你是 + 伤害/施暴/欺负/逼/骗 + 我；
 *           EN: you are the one hurting/harming me | you are the
 *           abuser/abusive | the one who is abusive）；
 *       r2 受害者自称（我才是/我这是 + …… + 受害者，允许插入语；
 *           EN: I am the (real) victim）；
 *       r3 伤害量化反问（你伤我多深/你欺骗了我/受伤害的人是我）。
 *   · 路由二「受害者自称×排他」单支判定：受害者自称与排他否定
 *     （not you / 而不是你）共现——「I am the real victim in this
 *     relationship, not you.」「我才是受害者，而不是你」。排他性
 *     身份争夺本身即是反转：正常受伤陈述不会争夺唯一受害者身份，
 *     无需腿①在场。
 *   · 缺腿不判：只有腿①（「你居然指责我」）是普通争辩；只有腿②
 *     无排他（「你才是伤害我的那个人」出现在叙事复述、小说对白
 *     里）可能是正常内容。
 *
 * 为什么取 VERIFY 级：单句可能是正常的冲突复盘（「吵架时他说你
 * 才是伤害我的那个人，事后看双方都有问题」）、心理咨询中的关系
 * 模式分析（「这是典型的 DARVO，把指控者变成被告」）、安全教育
 * 材料。verify 的含义是「这段话术在交换受害者与加害者的身份，
 * 需要回到事实层面讨论」——调用方应要求双方就事论事，不按身份
 * 叙事定责。
 *
 * 明确不判的（豁免）：
 *   · 双向同判（双方/互相/彼此/各自 + 受害者/伤害/责任；both/
 *     mutual + victim/hurt/responsibility）：「你和他都是受害者，
 *     应该互相作证」「We both got hurt; let us look at the
 *     pattern together.」——双向承认不是身份反转；
 *   · 沟通/修复意向在场（想和你好好说/需要一起面对/可以分开谈/
 *     我们一起/let's talk/talk about it/work it out）：陈述受伤
 *     感受并邀请沟通是正常关系修复；
 *   · 第三人称职务语境（心理咨询师/调解员/咨询师/counselor/
 *     therapist/mediator）：专业角色复盘关系模式；
 *   · 元话语评析（DARVO/反转受害者 是指/是一种/is/refers to）：
 *     分析这套话术本身不是运用它。
 */
'use strict';

// ─── 腿①：指控回应（中文四类）────────────────────────────────────
const ACCUSE_ZH = /(?:还有脸|居然|怎么敢|反倒|反而|恶人先告状|颠倒黑白|倒打一耙|装无辜|装受害者)|(?:说|指责|怪|怪罪|批评|数落|问|倒怪|反咬)(?:我|吾)?|你(?:这么|这样)(?:说|讲|话)|该道歉的是你|该说对不起的是你|该认错的是你|道歉的应该是你/;

// ─── 腿①：指控回应（英文）──────────────────────────────────────
const ACCUSE_EN = /\b(?:how\s+dare\s+you\s+(?:blame|accuse|criticize|judge)|(?:you|u)\s+(?:dare\s+to\s+)?(?:blame|accused?|criticiz\w+|judg\w+)\s+me|who\s+are\s+you\s+to\s+(?:talk|judge|blame|accuse)|stop\s+playing\s+the\s+victim)\b/i;

// ─── 腿②：受害者身份反转（中文三类）─────────────────────────────
const REVERSE_ZH = /(?:你|您)才?(?:是|为)(?:真的?|真正)?(?:把)?[^。！？!?]{0,6}(?:伤害|迫害|施暴|欺负|欺凌|逼|骗|中伤|毁)了?(?:掉)?(?:我|者|的人)?|(?:是|为)(?:你|您)把?(?:我)?(?:逼|伤害|欺负|骗|迫害|中伤|毁)|(?:你|您)[^。！？!?]{0,8}(?:欺负|欺凌|迫害|伤害)了?我|我(?:才|这)是[^。！？!?]{0,12}受害者|(?:你|您)(?:伤|骗)了?我?(?:多深|这么深|那么深|最深|多少)?|(?:受伤害|被伤害|被害)的人是我/;

// ─── 腿②：受害者身份反转（英文三类）─────────────────────────────
const REVERSE_EN = /\b(?:you\s+(?:are|'re)\s+(?:the\s+)?(?:real\s+)?(?:one\s+)?(?:who\s+is\s+)?(?:hurting|harming|abusing|abusive|abuser|the\s+abuser|toxic|the\s+monster)|i\s+am\s+(?:the\s+)?(?:real\s+)?victim\b)/i;

// ─── 路由二附：排他性身份争夺（……，not you / 而不是你）────────────
const EXCLUSIVE_EN = /\bnot\s+you\b/i;
const EXCLUSIVE_ZH = /而不是你|不是你/;

// ─── 豁免一：双向同判（双向承认不是身份反转）────────────────────
const MUTUAL_EXEMPT_ZH = /(?:双方|互相|彼此|各自|两人)[^。]{0,12}(?:都是|都有|也有|共同)?\s*(?:受害者|伤害|责任|问题)|(?:受害者|伤害|责任)[^。]{0,8}(?:双方|互相|彼此|各自)/;
const MUTUAL_EXEMPT_EN = /\b(?:both|mutual(?:ly)?|each\s+other)\b[^.]{0,40}\b(?:victim|hurt|responsib)/i;

// ─── 豁免二：沟通/修复意向在场 ─────────────────────────────────
const REPAIR_EXEMPT_ZH = /(?:想和你好好说|想好好谈谈|需要一起面对|可以分开谈|我们一起|一起面对|好好谈谈|沟通|修复|和解|复合|协商|调解|说清|解释清楚|复盘|各自说说|分开谈)/;
const REPAIR_EXEMPT_EN = /\b(?:let'?s\s+talk|talk\s+about\s+it|work\s+(?:this\s+)?out|repair|counseling|need\s+to\s+talk|want\s+to\s+talk)\b/i;

// ─── 豁免三：第三人称职务语境（专业角色复盘关系模式）──────────────
const THIRD_PERSON_EXEMPT = /(?:心理咨询师|心理咨询|心理医生|调解员|咨询师|治疗师|counselor|therapist|mediator|social\s+worker|survey|study\s+of)/i;

// ─── 豁免四：元话语评析这套话术本身 / 概念名词裸引述 ────────────
const META_EXEMPT = /(?:darvo|反转受害者|受害者反转|指责者变成被告)(?:是|属于|是一种|正是|称为|叫做|指|模式|现象|手法|策略|is|are|refers\s+to|means|describes)/i;
const META_NOUN = /(?:darvo|反转受害者)/i;

/**
 * 中文路由：路由一（腿①×腿②）+ 路由二（腿②×排他）。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const accuse = R.ACCUSE_ZH || ACCUSE_ZH;
  const reverse = R.REVERSE_ZH || REVERSE_ZH;
  const exclusive = R.EXCLUSIVE_ZH || EXCLUSIVE_ZH;
  const rev = reverse.test(text);
  if (!rev) return null;
  if (exclusive.test(text)) return { route: 'zh:reverse×exclusive' };
  if (accuse.test(text)) return { route: 'zh:accuse×reverse' };
  return null;
}

/**
 * 英文路由：路由一（腿①×腿②）+ 路由二（腿②×排他）。
 */
function checkEn(text, R) {
  const accuse = R.ACCUSE_EN || ACCUSE_EN;
  const reverse = R.REVERSE_EN || REVERSE_EN;
  const exclusive = R.EXCLUSIVE_EN || EXCLUSIVE_EN;
  const rev = reverse.test(text);
  if (!rev) return null;
  if (exclusive.test(text)) return { route: 'en:reverse×exclusive' };
  if (accuse.test(text)) return { route: 'en:accuse×reverse' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDarvo(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const MUTUAL_EXEMPT_ZH_ = R.MUTUAL_EXEMPT_ZH || MUTUAL_EXEMPT_ZH;
  const MUTUAL_EXEMPT_EN_ = R.MUTUAL_EXEMPT_EN || MUTUAL_EXEMPT_EN;
  const REPAIR_EXEMPT_ZH_ = R.REPAIR_EXEMPT_ZH || REPAIR_EXEMPT_ZH;
  const REPAIR_EXEMPT_EN_ = R.REPAIR_EXEMPT_EN || REPAIR_EXEMPT_EN;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;
  const META_EXEMPT_ = R.META_EXEMPT || META_EXEMPT;
  const META_NOUN_ = R.META_NOUN || META_NOUN;

  // 元话语评析 / 概念名词裸引述 → 不是运用它
  if (META_EXEMPT_.test(text) || META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称职务语境：专业角色复盘关系模式
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 双向同判：双向承认不是身份反转
  if (MUTUAL_EXEMPT_ZH_.test(text) || MUTUAL_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 沟通/修复意向在场：陈述受伤并邀请沟通是正常修复
  if (REPAIR_EXEMPT_ZH_.test(text) || REPAIR_EXEMPT_EN_.test(text)) {
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
        ? `DARVO×受害者身份反转(${r.route})`
        : `DARVO×victim-offender reversal(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkDarvo,
  __internals: () => ({
    ACCUSE_ZH, ACCUSE_EN, REVERSE_ZH, REVERSE_EN, EXCLUSIVE_ZH, EXCLUSIVE_EN,
    MUTUAL_EXEMPT_ZH, MUTUAL_EXEMPT_EN, REPAIR_EXEMPT_ZH, REPAIR_EXEMPT_EN,
    THIRD_PERSON_EXEMPT, META_EXEMPT, META_NOUN,
  }),
};
