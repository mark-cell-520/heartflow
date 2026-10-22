/**
 * src/procedural-burden.js — 「程序性刁难」检测器（第 74 个判别维度）
 *
 * [v6.8.22] 第 520 轮新增。固定 scout 池连续多轮空
 * （/tmp/hf-scout-20261006-1040.txt：「未探测到新的零覆盖族」），按 r505/
 * r509/r510/r511/r517 先例自建族级探针 + 心虫 decision 本体选向：
 *   · scripts/round-520-family-probe.js 扫 4 族，procedural_burden 唯一
 *     GAP（4/5 穿过硬闸门、良性 0/2）；
 *   · scripts/round-520-pb-probe.js 扩样复测 **11/15 攻击穿过硬闸门、
 *     良性 0/8 误伤**（中英双语）；
 *   · scripts/round-520-decide.js（HeartFlowDecision 本体三候选）
 *     选 A：procedural_burden 0.84 > B hesitation_deployment 0.79 >
 *     C complexity_shield 补支 0.74，identity alignment 80%。
 *
 * 辨别的族：「程序性刁难」——把实质答复义务转嫁给形式程序本身。说话人
 * 手里明明有实质信息或权限，却用「按规定/走流程/要找委员会/先提申请」
 * 这类程序外壳，让「要不要回答」这个问题消失：不是他拒绝回答，是程序
 * 还没走到那一步。作用是**把实质责任溶解到形式流程里**，使追问者无从
 * 追责——追问变成了「不懂规矩」。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**流程名义 × 转嫁动作**同句共现（按流程 + 你去找领导/我个人无权）；
 *   · 路由②（次）：**流程名义 × 终结句式**同句共现（per policy that is final/
 *     没什么可谈的/其他渠道没有）。
 *
 * 为什么现有维度拦不住（r520 逐条实测边界）：
 *   · agency_deflection 管责任转嫁给「算法/系统/流程」等抽象主体，
 *     落点是**谁做的决定**；本族说话人往往明确承认自己在按规矩办事，
 *     落点是**答复义务本身被程序外壳顶掉**。实测探针 4 条 agency 族
 *     攻击样本里 3 条能拦，但本族 11 条穿过样本零维度命中。
 *   · complexity_shield 管「太复杂你不懂所以别问」，落点是理解力否定；
 *     本族不需要否定理解力——「按规定」足矣，实测同族样本仅 1/6 命中。
 *   · appeal_to_tradition 管「历来如此所以别改」，实测 1/4 命中。
 *   · info_deprivation 管「无可奉告/不方便透露」这类直接不给信息；
 *     本族给了一个程序性理由并把球踢走，是包装成合规的答复剥夺。
 *   · soft_deflection 管软话术转移，本族是**明确指引去走程序**。
 *
 * → verify 级：形式流程是答复的时间表而非否决权。被程序外壳顶掉的
 *    实质问题应仍被回应——给出流程步骤、时限与当前进度，
 *    不以「要走流程」终止实质答复。
 *
 * 明确不判的（豁免——正当流程推进）：
 *   · 走流程但带推进动作：已提交/已催办/我先准备好材料/一起去
 *   · 给出具体时限：三个工作日内办结
 */

'use strict';

// ─── B1: 流程名义（程序外壳在场）────────────────────────────
const BURDEN_ZH = new RegExp([
  // 「按规定/按制度/依照流程」
  '(?:按|依照|根据|基于)(?:公司|单位|组织|内部)?(?:规定|制度|流程|程序|章程|条例|办法|惯例|老规矩)',
  // 「走流程吧/得走流程/必须走审批」
  '(?:走|得走|要走|必须走|只能走|先走|再走|照走)(?:一下)?(?:流程|程序|审批|手续)',
  // 「流程上/程序上」
  '(?:流程|程序|手续)(?:上|这方面|层面)',
  // 「要过会/要审批/需要签字」
  '(?:要|需要|得|必须)(?:过会|审批|报批|签字|签批|会签|上会|审议)',
  // 「委员会/董事会/领导决定的」
  '(?:委员会|董事会|办公会|党组会|领导|上级|主管|总部)(?:的)?(?:决定|定的|说了算|审核|批准|批|决议)',
  // 「正式申请/书面报告/工单」
  '(?:正式|书面|红头)(?:的)?(?:申请|提案|报告|请示|工单|函件)',
  // 「先提个申请/先去填个表」
  '(?:先|再|去)(?:提|填|交|打|写)(?:个|一份|一张|一下)?(?:正式)?(?:申请|工单|表|单子|报告)',
  // 「按章办事/按规矩办」
  '(?:按章|照章|按规矩|照规矩)(?:办事|办理|处理|执行)',
  // 「系统规定」
  '(?:系统|平台|公司|单位|组织)(?:规定|设定|设定好|默认)(?:这样|这么|如此)?',
  // 「这是规定/这是制度」（把程序外壳当成不容置疑的既成事实）
  '(?:这|那)(?:是|就是|属于)(?:规定|制度|章程|条例)',
  // 「一切以…为准」（程序名义即裁量基准）
  '(?:一切|所有|全部)(?:以|按|照)(?:流程|程序|规定|决议|指示)(?:为准|为算|说来|执行)',
  // 「决议为准/说了算」把裁量权归属程序主体
  '(?:决议|裁定|决定)(?:为准|说了算|为准绳)',
  // 「没有权限/越权」（权限外壳——程序化的权责名义）
  '(?:没有|没|无|超出)(?:我的|个人|本级)(?:的)?(?:权限|权力|职权|职责)',
  '(?:我)?(?:这边|这里|我个人)(?:没有|没)(?:权限|权力|职权)',
  // 「说了不算/不算数」（裁量权被程序名义架空）
  '(?:说不上话|不归我管|不关我事|轮不到我|算不了数|不做数)',
].join('|'));

const BURDEN_EN = new RegExp([
  '\\b(?:per|under|according\\s+to|in\\s+line\\s+with)\\s+(?:the\\s+)?' +
    '(?:company\\s+|current\\s+|internal\\s+)?' +
    '(?:policy|policies|procedure|procedures|rules?|regulations?|guidelines?)',
  '\\bby\\s+the\\s+book\\b',
  '\\bit\\s+goes\\s+through\\s+(?:the\\s+)?(?:process|procedure|committee|board)',
  '\\b(?:that|this|it)\\s+requires?\\s+(?:formal\\s+)?(?:approval|sign-?off|authorization)',
  '\\b(?:standard|official|formal)\\s+(?:procedure|process|channel)s?\\b',
  '\\btake\\s+(?:it|this|that|the\\s+matter)\\s+up\\s+with\\s+(?:the\\s+)?' +
    '(?:board|committee|management|higher-?ups?)',
  '\\bthere\\s+is\\s+a\\s+(?:procedure|process|channel)\\s+for\\s+(?:this|that)',
  '\\bthe\\s+committee\\s+(?:must|has\\s+to|will)\\s+(?:decide|vote|rule)',
  '\\bfile\\s+a\\s+(?:formal\\s+)?(?:request|complaint|ticket|report|application)',
  '\\bit\\s+is\\s+(?:not\\s+)?(?:my|our)\\s+(?:call|decision|department)',
  // 「written approval」（书面审批名义）
  '\\b(?:written|formal|prior)\\s+(?:approval|sign-?off|authorization|consent)\\b',
  '\\bthe\\s+(?:committee|board|management)\\s+(?:has|have)?\\s*(?:decided|resolved|ruled)',
  // 「not up for discussion / not negotiable」（程序即终局）
  '\\bnot\\s+(?:up\\s+for\\s+(?:discussion|debate)|negotiable|open\\s+to\\s+discussion)',
].join('|'), 'i');

// ─── B2a: 转嫁动作（把答复/决定权推给别处或别的人）──────────
const DEFER_ZH = new RegExp([
  // 「你去找主管/找领导/找委员会」
  '(?:你|你们)?(?:去|找|联系|咨询)(?:一下)?(?:主管|领导|上级|委员会|董事会|' +
    '流程负责人|相关部门|责任部门|对接口|窗口)',
  // 「提个申请/填个表/交个报告」
  '(?:提|填|交|打|写)(?:个|一份|一张|一下)?(?:正式)?(?:申请|工单|表|单子|报告)',
  // 「我个人无权/没有权限/不能决定」
  '(?:我|个人|我这边|我这里)(?:无权|没有权限|没权限|说了不算)',
  '(?:我)(?:这里)?(?:没法|无法|不能)(?:决定|更改|改变|处理|答复|回复|解决|批|同意)',
  '(?:没有|没)(?:权限|权力|资质)(?:处理|决定|更改|答复|回复|批)',
  // 「说不上话/插不上手/帮不了忙」
  '(?:说不上话|插不上手|帮不上忙|使不上劲|说不上)',
  // 「只能这样/就这样/改不了/没得改」
  '(?:只能|就|只)(?:这样|如此|能这样)',
  '(?:改不了|没得改|变不了|没法改|动不了)',
  // 「没有其他渠道/办法」
  '(?:没有|没|别无)(?:别的|其他|第二)(?:的)?(?:渠道|办法|选择|余地|途径|路径)',
  // 「别的我办不了/管不了/做不了」
  '(?:别的|其他|这些|那些)?(?:我)?(?:办不了|做不了|管不了|处理不了|解决不了|帮不了)',
  // 「我也没办法/无能为力」
  '(?:我)?(?:也)?(?:没办法|无能为力|使不上劲|插不上手)',
  // 「按规定办/照章办理」（以程序代替答复）
  '(?:照章|按章|依规)(?:办理|处理|执行|办事)',
  // 「只能执行/下面只能执行」（层级溶解）
  '(?:只能|唯有|惟有)(?:执行|照办|服从|听命)',
  // 「谁都/谁都不能例外也无权例外」
  '(?:谁|任何人|没人)(?:都)?(?:不|没)能(?:例外|特殊|变通|通融)',
].join('|'));

const DEFER_EN = new RegExp([
  '\\bit\\s+is\\s+(?:all\\s+)?(?:out\\s+of\\s+my\\s+hands|in\\s+their\\s+hands\\s+now)',
  '\\bi\\s+(?:have|do\\s+not\\s+have|lack)\\s+(?:no\\s+)?(?:authority|power|say)' +
    '(?:\\s+over)?(?:\\s+(?:this|that|it|here))?',
  '\\bnothing\\s+(?:more\\s+)?(?:can\\s+be\\s+done|to\\s+be\\s+done|i\\s+can\\s+do)',
  '\\bnot\\s+(?:up\\s+to\\s+me|my\\s+(?:call|decision|department))\\b',
  '\\bthere\\s+is\\s+no\\s+(?:other|alternative)\\s+(?:channel|route|option|way)',
  '\\byou\\s+will\\s+(?:have\\s+to|need\\s+to)\\s+(?:take\\s+it|go)\\s+(?:up|to)' +
    '\\s+(?:with\\s+)?(?:the\\s+)?(?:board|committee|management|higher-?ups?)',
  '\\bi\\s+cannot\\s+(?:do|change)\\s+(?:anything|something)\\s+about\\s+(?:this|that|it)',
].join('|'), 'i');

// ─── B2b: 终结句式（程序即终局，不容再谈）───────────────────
const FINALIZE_ZH = new RegExp([
  '(?:没|不)(?:什么)?(?:可谈|可商量|可讨论|可讲)',
  '(?:没|不)(?:什么)?(?:余地|空间|商量)',
  '(?:就)?(?:这样|如此)(?:定|定了|定了吧)',
  '(?:最终|最后)(?:解释权|裁定|结论)(?:在|归)',
  '(?:一切|所有)(?:以|按)(?:流程|程序|规定)(?:为准|为算|说来)',
  // 「一切以委员会/领导/决议为准」（r521 补支：程序名义即终局，
  // 与上面「一切以流程为准」同族但裁量主体是委员会/决议——实测族形状。
  // 复合词形「委员会决议/上级批示」必须显式列举：中文里裁量主体常与
  // 其产出物连写（委员会决议、董事会决议、领导批示），只列单个主体
  // 匹配不到连写形——r521 实测 idx15 正漏在此）
  '(?:一切|所有|全部)(?:以|按|照)(?:委员会|董事会|办公会|党组会|领导|上级|主管|总部|决议|裁定|决定)(?:决议|批示|裁定|决定)?(?:为准|为算|说来|执行)',
].join('|'));

const FINALIZE_EN = new RegExp([
  '\\b(?:that|this|it)\\s+is\\s+(?:final|settled|not\\s+negotiable|not\\s+up\\s+for\\s+debate)',
  '\\bthere\\s+is\\s+nothing\\s+(?:more\\s+)?(?:to\\s+(?:discuss|talk\\s+about|say))',
  '\\bno\\s+(?:further\\s+)?(?:discussion|debate|appeal)\\b',
  '\\b(?:the\\s+)?(?:matter|issue|case)\\s+is\\s+closed\\b',
  // 「will have to wait」（程序即等待）
  '\\byou\\s+will\\s+(?:have\\s+to|need\\s+to|just\\s+have\\s+to)\\s+wait\\b',
  // 「not up for discussion / not negotiable」（r521 补支：程序即终局的
  // 直接表述。它同时是 BURDEN_EN 的一支，但作为**第二共现信号**
  // 必须也能单独被路由②识别——实测英文单句族只有 policy/committee
  // 名义在场时应由本支提供终局证据）
  '\\bnot\\s+(?:up\\s+for\\s+(?:discussion|debate)|negotiable|open\\s+to\\s+discussion)',
  // 「will need written approval first」（r521 补支：书面审批即前置门槛，
  // 程序次序本身成为无条件前置条件，实质答复被推迟到审批之后）
  '\\byou\\s+(?:will|would)\\s+(?:have\\s+to|need\\s+to|must)\\s+(?:first\\s+)?' +
    '(?:submit|file|get|obtain|secure)\\s+(?:written\\s+|formal\\s+|prior\\s+)?' +
    '(?:approval|sign-?off|authorization|consent)',
  '\\b(?:written|formal|prior)\\s+(?:approval|sign-?off|authorization|consent)\\s+first\\b',
  // 「first, and nothing before/until」（程序次序即全局前置条件）
  '\\bfirst\\s*,?\\s+and\\s+nothing\\s+(?:before|until|can\\s+start)\\b',
].join('|'), 'i');

// ─── 豁免：正当流程推进（带推进动作或具体时限）────────────────
// 判据边界：只说「要走流程」但没有推进动作、反而把球踢走的才判；
// 「流程要三个工作日，我已帮你提交/催办」这类把程序当作**可推进的
// 时间表**的正当表述不判。
const EXEMPT_ZH = new RegExp([
  // 推进动作：已提交/已催办/先准备好材料/一起去
  '(?:我|我们|我这边)(?:已经|已|这就|马上|立刻|随即|先|正在)?' +
    '(?:帮你|替你|代|一并|着手)?(?:提交|递交|上报|报送|登记|催|催办|跟进|推进|' +
    '准备|拟好|写好|整理|补齐|补充|打包|发起了|发起|提交了)',
  '(?:我)?(?:先)(?:把|将)(?:材料|方案|资料|申请|表格|数据)(?:准备|拟|写|整理|补齐)(?:好|齐)?',
  '(?:一起|陪同)(?:去|找|跑|对接|沟通)',
  // 汇报与上呈（把球接住而不是踢走）
  '(?:已经|已|早就|先前)(?:向|跟|给)(?:上级|领导|总部|委员会)(?:报|汇报|上报|提交|反映|反馈)',
  '(?:报|汇报|上报|提交|反映|反馈)(?:给|至|到)(?:了|完)?(?:上级|领导|总部|委员会)',
  // 具体时限：三个工作日内办结
  '(?:三|两|几|\\d+)(?:个)?(?:工作日|天|小时|分钟)(?:内|之内)(?:办结|完成|答复|回复|给到|出结果)',
  '(?:预计|大约|差不多)(?:三|两|几|\\d+)(?:个)?(?:工作日|天|小时)(?:后|内)?(?:能|可以|会有|出)',
  // 给出替代/临时方案
  '(?:先|临时)(?:给|提供|给个|给一份)(?:一个|一份|个)?(?:临时|过渡|替代|备选)?(?:方案|结果|答复|说明)',
  // 主动说明流程本身（把流程讲清楚而不是拿它当盾）
  '(?:流程|程序)(?:一共|分|共)(?:三|两|几|\\d+)?(?:步|环节|个阶段)',
].join('|'));

const EXEMPT_EN = new RegExp([
  '\\bi\\s+(?:have|have\\s+already|will)\\s+(?:submitted?|filed|escalated|prepared|' +
    'drafted|forwarded|logged)\\b',
  '\\blet\\s+me\\s+(?:check|follow\\s+up|chase|push|escalate)\\b',
  '\\bwithin\\s+(?:two|three|\\d+)\\s+(?:business\\s+)?(?:days?|hours?|weeks?)\\b',
  '\\bi\\s+will\\s+(?:give|provide|come\\s+back\\s+with)\\s+(?:you\\s+)?' +
    '(?:an?\\s+)?(?:update|timeline|answer|temporary)\\b',
  '\\bhere\\s+is\\s+(?:the\\s+)?(?:timeline|breakdown|process\\s+map)\\b',
].join('|'), 'i');

// ─── 豁免无效化：把答复义务彻底扔掉的行为（r521 补支）────────────
// 判据边界：EXEMPT 的本意是「把球接住」——已提交/已催办/给时限/给替代方案。
// 但「已经报给上级了，我现在说不上话」这类句子同时含上呈与弃责信号：
// 上呈只是把球踢走的过场，弃责才是实质。此时豁免不生效。
// 这是 r521 gate 探针实测出的漏检族（测试集索引 16）。
const ABANDON_ZH = new RegExp([
  '(?:说不上话|插不上手|帮不上忙|使不上劲|轮不到我|不归我管事|说不上)',
  '(?:不归我管|不关我事|算不了数|不做数)',
  '(?:只能|唯有|惟有)(?:执行|照办|服从|听命)',
  '(?:我)?(?:也)?(?:无能为力|毫无办法|没有任何办法)',
  '(?:别的|其他)(?:我)?(?:办不了|做不了|管不了|处理不了)',
].join('|'));

const ABANDON_EN = new RegExp([
  '\\bit\\s+is\\s+out\\s+of\\s+my\\s+hands\\b',
  '\\bi\\s+(?:have|do\\s+not\\s+have)\\s+no\\s+(?:authority|power|say)\\b',
  '\\bnothing\\s+(?:more\\s+)?(?:can\\s+be\\s+done|i\\s+can\\s+do)\\b',
  '\\bi\\s+cannot\\s+(?:do|change)\\s+(?:anything|something)\\s+about\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkProceduralBurden(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 走流程且带推进动作/具体时限 → 正当流程推进，不判。
  // 例外（r521）：同句含「弃责」信号时豁免无效化——上呈只是踢走的过场，
  // 弃责才是实质。判据边界：必须先有推进/时限形状，再有弃责形状，
  // 单纯弃责不含推进语义由路由①/② 的正常命中覆盖，不走这里。
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    const abandoned = ABANDON_ZH.test(text) || ABANDON_EN.test(text);
    if (!abandoned) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  const burden = BURDEN_ZH.test(text) || BURDEN_EN.test(text);
  if (!burden) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 路由①：流程名义 × 转嫁动作同句共现
  if (DEFER_ZH.test(text) || DEFER_EN.test(text)) {
    return {
      hit: true,
      score: 0.7,
      count: 1,
      detail: isZh ? '程序性刁难×转嫁答复义务(zh)' : 'procedural-burden×deflection(en)',
    };
  }

  // 路由②：流程名义 × 终结句式同句共现
  if (FINALIZE_ZH.test(text) || FINALIZE_EN.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '程序性刁难×程序即终局(zh)' : 'procedural-burden×finality(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkProceduralBurden,
  // [r521] 供守卫测试做「置空指定支必须变红」的变异注入用。
  // 导出句柄而非副本：变异脚本替换这些 const 指向即可让命中归零。
  __internals: () => ({ BURDEN_ZH, BURDEN_EN, DEFER_ZH, DEFER_EN, FINALIZE_ZH, FINALIZE_EN, EXEMPT_ZH, EXEMPT_EN, ABANDON_ZH, ABANDON_EN }),
};
