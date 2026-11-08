'use strict';

/**
 * src/means-as-end.js — 「过程完成当目标达成」（means-as-end / checklist
 * fallacy）检测器（第 227 个判别维度，r251 立项）
 *
 * [r251 立项] 缺口实证（scripts/round-251/probe-gap-r251.js，v6.8.149
 * gate() 实测）：「过程完成→目标达成」族攻击样本 6 条中 5 条
 * gate.action=pass、findings 全空（零命中），余 1 条仅被 overclaim 弱代拦
 * （不承重本族语义）；良性对照 3/3 全 pass（零误伤）。覆盖度检查：
 * means_as_end / checklist fallacy / process completion 在 src/ 下 0 命中；
 * activity_outcome_confusion（第184维，活动/投入计数→抽象成果）、
 * proxy_metric_goal（第187维，测得的量→目标本身）均不覆盖本族。
 *
 * 外部来源：HN Algolia 检索 "statistical fallacy" 无本族高相关 story；
 * Semantic Scholar HTTP 429 按纪律不重试；GitHub "logical fallacy
 * detection" 高星仓库（tmakesense/logical-fallacy 21★ 等）均为 LLM 模型
 * 方案，与纯规则架构不同构，仅作概念背景。判据为心虫自有纯规则实现
 * （家族定义取自 means-ends confusion / checklist fallacy /
 * "the process is complete, so the goal is achieved" 的标准谬误描述）。
 *
 * 辨别的族：过程完成当目标达成（means-as-end confusion）——把**过程、
 * 步骤、流程、清单的完成**当作**最终目标本身已达成**的证据：
 *   流程全部走完了，说明目标本身已经达成。
 *   清单都勾完了，所以这项任务已经圆满成功。
 *   代码都提交了，说明产品已经可以交付给客户。
 *   所有步骤都执行完了，可见计划已经顺利实现。
 *   The checklist is complete, which means the objective has been achieved.
 *   All the tasks are done, so the project has succeeded.
 *
 * 为什么这是判别者的核心缺口（对齐「能准确寻找答案」与「agent 执行验证」）：
 * 过程是为目标服务的手段，手段完成只说明**动作已执行**，不说明**目标状态
 * 已出现**——清单可以勾完而客户没有续约，流程可以走完而故障没有修复，
 * 步骤可以执行完而指标没有改善。把「做完了」直接读成「达成了」，是目标
 * 侧证据缺失下的替代性满足：它用动作的完成度替换了结果的检验，是 AI
 * 执行汇报、项目管理陈述中最典型的似是而非——听起来是严谨的过程管理，
 * 实则是把里程表当成了目的地。
 *
 * 与既有维度的边界（r251 归因，刻意错开）：
 *   · activity_outcome_confusion（第184维）管「活动/投入**计数**→抽象
 *     成果」（开会场次/加班时长/代码行数——**量的累积**），腿①是可计数
 *     活动名词且常带数量标记；本族腿①收**过程/步骤/流程/清单/程序**
 *     （**结构性的完成**，句中常无数量词——「流程走完」「清单勾完」），
 *     两族词表互斥，同一句可共现但判定结构不同（「开了50场会所以目标
 *     达成」归第184维，「流程走完所以目标达成」归本维度）。
 *   · proxy_metric_goal（第187维）管「**测得的量**（点击率/GDP/覆盖率/
 *     满意度打分）→ 目标」，腿①必须是度量读数；本族腿①不含任何度量
 *     名词（「流程/清单/步骤/程序/环节/手续」都不是度量），从词表层
 *     保证两族不混。
 *   · necessity_sufficiency_confusion（第183维）管必要条件误当充分
 *     条件的**逻辑形式**误判；本族是**语义族**——完成的是过程动作、
 *     推出的是目标状态，可同句共现但攻击结构不同。
 *   · bullshit / unsupported_claim 管断言缺依据的强度；本族有依据在场
 *     （过程已完成）但依据**类型无效**——错在拿手段完成当目的达成。
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① PROC 过程/步骤语义（中英）：流程/程序/步骤/环节/手续/清单/
 *         检查表/流程表/表单/审批/节点/工序/议程/日程/规程/规范/指引/
 *         任务/事项/工作项/部署/配置/安装/迁移/上线前的/待办/议程项
 *         （**全部裸名词形态**，161 轮教训）；EN process / procedure /
 *         steps? / checklist / workflow / protocol / agenda / tasks? /
 *         items? / pipeline / checklist items / to-dos。
 *   腿② DONE 完成语义（中英）：走完/跑完/做完/执行完/完成/勾完/勾选/
 *         打勾/签完/审完/批完/过完/巡完/填完/提交/部署完/配置完/装完/
 *         迁移完/搞定/弄完/办完/了结/收尾/完工/完毕/完结/结束/都已/
 *         全部/所有/通通/尽数/无一遗漏/清零/了却；
 *         EN (is |are |has been |have been )?(complete|completed|done|
 *         finished|submitted|signed off|closed|wrapped up|fulfilled|
 *         checked off|ticked off)。
 *   腿③ GOAL 目标达成结论（中英）：目标(就)?(自然)?(已经)?(达成|实现|
 *         完成|达到|落地|兑现)/目的(就)?(已经)?(达成|实现)/战略(就)?
 *         (自然)?(实现|达成|落地)/任务(就)?(已经)?(圆满)?(完成|成功|
 *         达成)/计划(就)?(已经)?(顺利)?(实现|完成)/项目(就)?(已经)?
 *         (圆满)?(成功|完成|交付)/产品(就)?(已经)?(可以)?(交付|上线|
 *         发布)/问题(就)?(已经)?(彻底)?(解决|根治)/需求(就)?(已经)?
 *         (满足|解决)/使命(就)?(已经)?(达成)/愿景(就)?(已经)?(实现)/
 *         大功告成/万事大吉/圆满收官/顺利收官/圆满结束；
 *         EN (goal|objective|target|mission|purpose|vision|strategy|plan|
 *         project|task) (has |have )?(been )?(achieved|accomplished|met|
 *         reached|fulfilled|delivered|realized|succeeded|completed)。
 *   过程腿与目标腿总跨度 ≤80 字（EN 160 字符），可跨分号/逗号并置
 *   （中文逗号常承载隐性因果：「流程走完，目标自然达成」）。
 *
 * 为什么取 VERIFY 级：单句也可能是附带目标侧证据的正常汇报（附了客户
 * 续约率/故障修复率就不再是谬误）、文学对白、或对「流程主义」的概念
 * 讨论。verify 的含义是「用过程完成给目标达成背书，需要补上目标本身的
 * 检验」——调用方应要求给出可验证的结果数据，而不是接受过程完成替代
 * 目标达成。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 主动分离过程与目标（只是过程/只是手段/不等于/不代表/不能等同/
 *     不能混为一谈/不能只看/不能只靠/关键要看/才是…目标/衡量…的方式/
 *     而不是/而非/仅仅是步骤/必经阶段/必要不充分/过程而已；
 *     EN is only a means / not the same as / what matters is / a means,
 *     not an end / merely a step / only a proxy）——主动区分过程与目标
 *     是正确判别（「流程走完只是必要步骤，目标达成要看客户续约率」）。
 *   · 目标侧证据在场（续约率/留存率/复购/故障修复率/客户反馈/访谈/
 *     实测数据/现场验收/第三方检测/审计报告/上线后/发布后的/运行
 *     数据/用户反馈/投诉闭环；EN retention / churn / renewal / measured
 *     directly / verified by / confirmed by / audit / customer feedback /
 *     交付了/签收了/验收了/复盘数据）——目标已被结果侧证据背书，不再
 *     是拿过程完成充数。
 *   · 对冲（可能/也许/或许/未必/不一定/大概/恐怕/说不定/有待/仍需/
 *     尚需；EN maybe/perhaps/might/probably/possibly/remains to be
 *     seen）——概率化结论不作谬误判定。
 *   · 疑问句（含 ?/？）：提问不是断言。
 *
 * 已知边界：① 三腿限同句或相邻分句共现（总跨度 ≤80 字 / EN 160 字符），
 * 跨段形本轮保守不收；② 含转折词（但/然而/却/不过/虽然/尽管）的并置不
 * 判——那是并列或反向陈述（「流程走完了，但目标还没达成」是正确判别）；
 * ③ 「执行力/抗压/态度」等未列入腿③的软性目标暂不判（「流程走完说明
 * 团队执行力强」漏判，保守方向，避免与 activity_outcome_confusion 的
 * 成果腿混层）；④ 将来时条件句（「等流程走完，目标就能达成」）不在射程
 * ——那是条件预测而非过程完成断言，归 conditional_proposition 类。
 */

// ─── 腿① PROC 过程/步骤语义（中文，全部裸名词形态，161 轮教训）──────────
const PROC_ZH = [
  /流程/,
  /程序/,
  /步骤/,
  /环节/,
  /手续/,
  /清单|检查表|勾稽表|待办清单|任务清单|工作清单/,
  /审批|审核流程|报批/,
  /节点/,
  /工序|工步/,
  /议程/,
  /日程|日程表|行程/,
  /规程|规范|指引|操作手册|SOP/,
  /任务|事项|工作项|待办事项|工单|表单工单|受理单/,
  /代码|提交物|交付物|变更|版本/,
  /部署|配置|安装|迁移|上线前|灰度/,
  /表单|表格|模板/,
  /走查|巡检|核验|核对|对账/,
];

// ─── 腿① PROC（英文，全部裸名词形态）────────────────────────────────────
const PROC_EN = [
  /\bprocess(?:es)?\b/i,
  /\bprocedures?\b/i,
  /\bsteps?\b/i,
  /\bchecklist(?:s)?\b/i,
  /\bworkflows?\b/i,
  /\bprotocols?\b/i,
  /\bagendas?\b/i,
  /\btasks?\b/i,
  /\bitems?\b/i,
  /\bpipeline\b/i,
  /\bto-?dos?\b/i,
  /\bform(?:s)?\b/i,
  /\bdeployment\b/i,
  /\bmigration\b/i,
];

// ─── 腿② DONE 完成语义（中文，全部裸名词形态）───────────────────────────
const DONE_ZH = [
  /走完|跑完|做完|执行完|过完|巡完|填完|签完|审完|批完|勾完|办完|弄完|搞完|了结|收尾/,
  /完成|完毕|完结|完工|结束|搞定|清零|了却|告竣|关闭|闭合|结案|归档|销项/,
  /提交|上报|报送/,
  /部署完|配置完|装完|迁移完|上线/,
  /打勾|勾选|打钩|核对完|核验完|对账完/,
  /都已|皆已|全都|全部|所有|通通|尽数|无一遗漏|无遗漏|无一例外|悉数/,
];

// ─── 腿② DONE（英文）────────────────────────────────────────────────────
const DONE_EN = [
  /\b(?:is|are|has\s+been|have\s+been|was|were)\s+(?:complete|completed|done|finished|closed|wrapped\s+up|fulfilled)\b/i,
  /\b(?:submitted|signed\s+off|checked\s+off|ticked\s+off|fulfilled|accomplished)\b/i,
  /\b(?:every|all)\s+(?:step|task|item|box)\w*\s+(?:is|are)?\s*(?:complete|done|checked)\b/i,
  /\b(?:finished|completed|done)\s+with\s+(?:the\s+)?(?:process|checklist|steps?|tasks?)\b/i,
  /\b(?:steps?|tasks?|items?)\s+(?:were|was)\s+(?:followed|executed|carried\s+out|completed)\b/i,
];

// ─── 腿③ GOAL 目标达成结论（中文，裸名词 + 状态词之间留修饰窗）──────────
// 中文常在目标名词与达成动词之间插入「自然/显然/肯定/一定/就/已经/顺利/
// 圆满/彻底」等副词，留 [^。！？；，]{0,8} 修饰窗保证覆盖。
const GOAL_ZH = [
  /(?:目标|目的|使命|愿景)[^。！？；，]{0,12}(?:达成|实现|完成|达到|落地|兑现|收工)/,
  /(?:战略|规划|蓝图)[^。！？；，]{0,12}(?:实现|达成|落地|兑现|贯彻)/,
  /(?:任务|计划|项目|工程|工作)[^。！？；，]{0,12}(?:完成|成功|达成|交付|收官|结束|实现|落地)/,
  /(?:产品|系统|平台|功能|版本)[^。！？；，]{0,12}(?:交付|上线|发布|投产|投用|投入使用)/,
  /(?:问题|故障|缺陷|bug|隐患|痛点)[^。！？；，]{0,12}(?:解决|根治|修复|排除|消除)/,
  /(?:需求|诉求|期望)[^。！？；，]{0,12}(?:满足|解决|响应|覆盖)/,
  /大功告成|万事大吉|圆满收[官篷]|顺利收[官篷]|圆满结束|圆满落幕|功成身退|尘埃落定/,
];

// ─── 腿③ GOAL（英文）────────────────────────────────────────────────────
const GOAL_EN = [
  /\b(?:goals?|objectives?|targets?|missions?|purposes?|visions?|strateg(?:y|ies)|plans?|projects?|tasks?)\s+(?:has|have|is|are)\s+(?:now\s+|been\s+)?(?:achieved|accomplished|met|reached|fulfilled|delivered|realized|completed|succeeded)\b/i,
  /\b(?:goals?|objectives?|targets?)\s+(?:is|are)\s+(?:now\s+)?(?:achieved|met|reached|fulfilled|accomplished)\b/i,
  /\b(?:problems?|issues?|bugs?|faults?)\s+(?:has|have)\s+been\s+(?:fully\s+)?(?:solved|fixed|resolved|eliminated)\b/i,
  /\b(?:product|system|platform|feature|release)\s+(?:is\s+)?(?:now\s+)?(?:ready\s+(?:for|to)\s+)?(?:deliver(?:y|ed)?|ship(?:ped)?|launch(?:ed)?|deploy(?:ed)?)\b/i,
  /\bmission\s+accomplished\b/i,
];

// ─── 腿③ CONN 因果连接词（中文；英文逗号并置即可承载隐性因果）──────────
const CONN_ZH = [
  /所以|因此|因而|足见|据此|可见|于是|那么|这说明|这意味着|说明|证明|表明|显然|无疑|自然就|自然而然|顺理成章|水到渠成/,
];
const CONN_EN = [
  /\bso\b/i, /\btherefore\b/i, /\bthus\b/i, /\bhence\b/i,
  /which\s+(?:means|shows|proves|demonstrates)/i,
  /\bproving\b/i, /\bdemonstrating\b/i, /\bmeaning\b/i,
];

// ─── 豁免：主动分离过程与目标（中文，负例注入可置空）────────────────────
const EXEMPT_SEPARATE_ZH = [
  /只是过程|只是手段|仅仅是步骤|仅是步骤|只是步骤|过程而已|必经阶段|必要不充分/,
  /不等于|不代表|不能等同|不能混为一谈|不能只看|不能只靠|关键要看|才是.{0,6}目标|衡量.{0,6}的方式/,
  /而不是|而非|并非/,
  /尚未|还没|仍未|远未|迟迟未|并未/,
];
const EXEMPT_SEPARATE_EN = [
  /is\s+only\s+a\s+means/i, /not\s+the\s+same\s+as/i, /what\s+matters\s+is/i,
  /a\s+means,\s*not\s+an\s+end/i, /merely\s+a\s+step/i, /only\s+a\s+proxy/i,
  /does\s+not\s+mean/i, /does\s+not\s+prove/i, /not\s+yet/i, /remains?\s+incomplete/i,
];

// ─── 豁免：目标侧证据在场（中文）────────────────────────────────────────
const EXEMPT_EVIDENCE_ZH = [
  /续约率|留存率|复购|流失率|回购率|客户反馈|用户反馈|访谈|实测数据|现场验收|第三方检测|审计报告|复盘数据|验收报告/,
  /交付了|签收了|验收了|投产了|投用了|运行数据|上线后|发布后|运行至今|稳定运行/,
  /故障率|修复率|解决率|投诉闭环|工单闭环|回访/,
];
const EXEMPT_EVIDENCE_EN = [
  /retention/i, /churn/i, /renewal/i, /measured\s+directly/i,
  /verified\s+by/i, /confirmed\s+by/i, /audit/i, /customer\s+feedback/i,
  /in\s+production/i, /live\s+data/i, /sign-?off\s+from/i,
];

// ─── 豁免：对冲（中文）──────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|说不定|有待|仍需|尚需|待定|待观察/,
];
const EXEMPT_HEDGE_EN = [
  /\bmaybe\b/i, /\bperhaps\b/i, /\bmight\b/i, /\bprobably\b/i,
  /\bpossibly\b/i, /remains?\s+to\s+be\s+seen/i, /uncertain/i, /unclear/i,
];

// ─── 豁免：转折词（中文；并置中的反向陈述是正确判别）────────────────────
const EXEMPT_CONTRAST_ZH = [
  /但是|然而|却|不过|虽然|尽管|可是|只不过|殊不知|殊不知|反过来|反之/,
];
const EXEMPT_CONTRAST_EN = [
  /\bbut\b/i, /\bhowever\b/i, /\byet\b/i, /\balthough\b/i, /\bthough\b/i,
];

// ─── 负例注入常量表（键名与 inject 参数对应；未注入的键回落到本体词表）──
const CONSTANTS = {
  PROC_ZH, PROC_EN, DONE_ZH, DONE_EN, GOAL_ZH, GOAL_EN, CONN_ZH, CONN_EN,
  EXEMPT_SEPARATE_ZH, EXEMPT_SEPARATE_EN, EXEMPT_EVIDENCE_ZH, EXEMPT_EVIDENCE_EN,
  EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_CONTRAST_ZH, EXEMPT_CONTRAST_EN,
};

const ANY = (res, s) => res.some((re) => re.test(s));
const _HIT = (text, reList) => {
  for (const re of reList) {
    re.lastIndex = 0;
    if (re.test(text)) return true;
  }
  return false;
};

/**
 * checkMeansAsEnd(text, inject)
 * @param {string} text 待检文本
 * @param {object} [inject] 负例注入：可置空任一词表常量验证承重
 * @returns {{score:number,details:string,guidance:string}}
 */
function checkMeansAsEnd(text, inject) {
  if (!text || typeof text !== 'string') {
    return { score: 0, details: '', guidance: '' };
  }
  const inj = inject || {};
  // 未注入的常量回落到模块词表本体（负例注入的语义是「置空指定常量」，
  // 而非把所有常量都置空——首版把未注入键默认成 []，导致三腿恒假、
  // 攻击样本全 MISS）。
  const T = (k) => (Array.isArray(inj[k]) ? inj[k] : CONSTANTS[k]);

  const procZH = _HIT(text, T('PROC_ZH'));
  const procEN = _HIT(text, T('PROC_EN'));
  const doneZH = _HIT(text, T('DONE_ZH'));
  const doneEN = _HIT(text, T('DONE_EN'));
  const goalZH = _HIT(text, T('GOAL_ZH'));
  const goalEN = _HIT(text, T('GOAL_EN'));
  const connZH = _HIT(text, T('CONN_ZH'));
  const connEN = _HIT(text, T('CONN_EN'));

  const proc = procZH || procEN;
  const done = doneZH || doneEN;
  const goal = goalZH || goalEN;
  const conn = connZH || connEN;

  // 豁免优先：主动分离 / 目标侧证据 / 对冲 / 转折 / 疑问句
  const sepZH = _HIT(text, T('EXEMPT_SEPARATE_ZH'));
  const sepEN = _HIT(text, T('EXEMPT_SEPARATE_EN'));
  const eviZH = _HIT(text, T('EXEMPT_EVIDENCE_ZH'));
  const eviEN = _HIT(text, T('EXEMPT_EVIDENCE_EN'));
  const hdZH = _HIT(text, T('EXEMPT_HEDGE_ZH'));
  const hdEN = _HIT(text, T('EXEMPT_HEDGE_EN'));
  const ctZH = _HIT(text, T('EXEMPT_CONTRAST_ZH'));
  const ctEN = _HIT(text, T('EXEMPT_CONTRAST_EN'));
  const isQuestion = /[?？]/.test(text);

  if (sepZH || sepEN || eviZH || eviEN || hdZH || hdEN || ctZH || ctEN || isQuestion) {
    return { score: 0, details: '', guidance: '' };
  }

  // 三腿共现，缺一不判
  if (!(proc && done && goal)) {
    return { score: 0, details: '', guidance: '' };
  }

  // 腿位置互斥：目标腿的命中区间完整吞掉某个过程腿命中区间时，须看该
  // 目标腿是「已然断言」还是「未然安排」——「任务最后三天要完成」是未然
  // 计划（正常进度安排句），「任务已经圆满成功」是已然断言（本族谬误）。
  // 只有已然断言才算「拿过程完成给目标背书」的替换结构。
  if (_legsOverlap(text, T('PROC_ZH'), T('PROC_EN'), T('GOAL_ZH'), T('GOAL_EN'))) {
    if (!_goalAssertive(text, T('GOAL_ZH'), T('GOAL_EN'))) {
      return { score: 0, details: '', guidance: '' };
    }
  }

  // 跨度约束：过程腿与目标腿的总跨度 ≤80 字（EN 160 字符）。
  // 以首个过程命中位置与首个目标命中位置估算。
  const spanOK = _spanOK(text, T('PROC_ZH'), T('PROC_EN'), T('GOAL_ZH'), T('GOAL_EN'));

  // 连接腿缺失时允许中英逗号并置承载隐性因果（需跨度合规）。
  if (!conn && !spanOK) {
    return { score: 0, details: '', guidance: '' };
  }

  const lang = procEN && !procZH ? 'EN' : (procZH ? 'ZH' : 'EN');
  const details = '过程完成当目标达成(' + lang + '): 过程腿["' +
    _firstHit(text, T('PROC_ZH'), T('PROC_EN')) + '"] × 完成腿["' +
    _firstHit(text, T('DONE_ZH'), T('DONE_EN')) + '"] × 目标腿["' +
    _firstHit(text, T('GOAL_ZH'), T('GOAL_EN')) + '"]' +
    (conn ? ' × 连接腿在场' : '（逗号并置隐性因果）');
  const guidance = '过程完成不等于目标达成——流程/清单/步骤走完只说明动作已执行，' +
    '目标是否出现要用目标侧证据检验（客户续约率/故障修复率/实测数据/验收报告），' +
    '或明示为待验证状态而非既成结论。';
  return { score: 45, details, guidance };
}

function _firstHit(text, zh, en) {
  for (const re of zh) { re.lastIndex = 0; const m = re.exec(text); if (m) return m[0]; }
  for (const re of en) { re.lastIndex = 0; const m = re.exec(text); if (m) return m[0]; }
  return '';
}

function _firstPos(text, zh, en) {
  let best = -1;
  for (const re of zh) { re.lastIndex = 0; const m = re.exec(text); if (m && (best < 0 || m.index < best)) best = m.index; }
  for (const re of en) { re.lastIndex = 0; const m = re.exec(text); if (m && (best < 0 || m.index < best)) best = m.index; }
  return best;
}

// 收集一个词表在文本中的全部命中区间 [start, end)。
function _allSpans(text, zh, en) {
  const spans = [];
  const scan = (re) => {
    re.lastIndex = 0;
    let m;
    let guard = 0;
    while ((m = re.exec(text)) !== null) {
      spans.push([m.index, m.index + m[0].length]);
      // 零宽命中保护：不推进 lastIndex 会死循环（GOAL_ZH 修饰窗可匹配空串）。
      if (m.index === re.lastIndex) re.lastIndex++;
      if (++guard > 512) break;
    }
  };
  for (const re of zh) scan(re);
  for (const re of en) scan(re);
  return spans;
}

// 过程腿与目标腿是否存在「完整包含」关系（目标腿的命中区间整体吞掉
// 某个过程腿命中区间 = 同一段字符串既当过程又当目标，自我短路）。
// 注意：部分重叠不算——「勾清单」里的「任务」是过程角色，「任务已成功」
// 里的「任务」是目标角色，同一词承担两种合法语义，不能因词面共形互杀。
function _legsOverlap(text, procZH, procEN, goalZH, goalEN) {
  const p = _allSpans(text, procZH, procEN);
  const g = _allSpans(text, goalZH, goalEN);
  for (const [ps, pe] of p) {
    for (const [gs, ge] of g) {
      if (gs <= ps && ge >= pe) return true;
    }
  }
  return false;
}

// 已然断言标记：目标腿命中的片段内出现这些词，说明「已实现」是断言而非
// 未然安排。「要/将/应/待/计划/预计/拟/争取/争取在」是未然，不算。
const ASSERTIVE_ZH = /已经|显然|肯定|一定|自然|势必|必将|业已|确已|确实|已然|圆满|彻底|全面|完全|成功|达成|已|皆已/;
const ASSERTIVE_EN = /\b(?:has|have)\s+(?:been\s+)?(?:achieved|accomplished|met|reached|fulfilled|delivered|realized|completed|succeeded)\b|\bis\s+(?:now\s+)?(?:complete|achieved|met|done|ready)\b|\bare\s+(?:now\s+)?(?:complete|achieved|met|done|ready)\b/i;

// 目标腿是否为「已然断言」（误伤豁免判据：未然安排句不算本族）。
function _goalAssertive(text, goalZH, goalEN) {
  for (const re of goalZH) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m && ASSERTIVE_ZH.test(m[0])) return true;
  }
  for (const re of goalEN) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m && ASSERTIVE_EN.test(m[0])) return true;
  }
  return false;
}

function _spanOK(text, procZH, procEN, goalZH, goalEN) {
  const p = _firstPos(text, procZH, procEN);
  const g = _firstPos(text, goalZH, goalEN);
  if (p < 0 || g < 0) return false;
  const dist = Math.abs(g - p);
  // 中文阈值 80 字符；若命中位置之间以英文字符为主则放宽到 160。
  const slice = text.slice(Math.min(p, g), Math.max(p, g) + 40);
  const enish = (slice.match(/[A-Za-z]/g) || []).length > (slice.length / 3);
  return dist <= (enish ? 160 : 80);
}

module.exports = { checkMeansAsEnd };
