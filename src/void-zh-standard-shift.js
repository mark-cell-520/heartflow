/**
 * src/void-zh-standard-shift.js — 「单方作废约定」检测器（第 148 个判别维度）
 *
 * [r717 立项] decision 本体选出（scripts/decide-r717.js，composite_score
 * 0.82 / confidence 0.8 / identity alignment 0.8）。候选池来自 r717
 * 探测器（scripts/round-717-family-probe.js）在当前引擎（v6.8.62，
 * 147 维）上逐族复测：攻击漏判 5/7（71%）、误伤 0/6。
 *
 * 辨别的族：单方作废约定（void standard shift）——**事后单方面宣布
 * 已经达成的共识、承诺或契约「不算数/不作数/作废」**，用指称既往
 * 事项的名词短语（那件事/那次承诺/协议/约定/旧标准）而非显式既往
 * 动词（答应/说好）引出作废动作：
 *   当初那件事不作数，你别拿它说事。
 *   那次承诺不算，我改主意了。
 *   旧标准作废，按我今天说的来。
 *   我们之前的协议不作数了，一切从头讲。
 *   约定不作数了，以前的不算。
 *
 * 与既有维度的边界（r717 归因）：
 *   · self-imposed-standard-shift 的路由② VOID_ZH 管的是「既往动词
 *     （答应/说好/约定/承诺）× 作废动词」双腿共现——漏判样本全部
 *     缺显式既往动词，事项以名词指称出场（那件事/协议/旧标准），
 *     本族正是这个窄口：腿①收**既往事项指称**（指代词 × 事项
 *     名词，或既往时间词 × 事项名词），腿②收**作废动词**；
 *   · PAST_COMMITMENT_ZH（r700 支）管关系语域的「既往付出 × 当下
 *     否定」，腿①收的是行为付出（随叫随到/陪着我），不涉及作废
 *     契约语义，本族落点是**共识被单方推翻**；
 *   · concession_coercion 管让步胁迫，本族无让步动作，只有作废
 *     宣告；no_fallback 管封死退路，本族的退出通道被作废的是
 *     **约定本身**而不是选项。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① PAST_MATTER 既往事项指称——两种形态任一：
 *     形态 A「指代词 × 事项」：那件/那次/那桩/这档/那份/此前那 +
 *       件事/承诺/协议/约定/说法/规矩/事情/安排/计划/条款/约定；
 *     形态 B「既往时间词 × 事项」：之前/原先/原来/当初/过去/此前/
 *       旧的/老的 + 事项名词（含插入容忍 ≤4 字，不容句读——防
 *       「之前的口头约定没有书面记录，建议补签」跨句配对）；
 *   · 腿② VOID_ACT 单方作废动词——不算数/不作数/作废/不算/
 *     不算了/无效了/失效/取消/推翻/收回/撕毁/一笔勾销/不认账/
 *     翻篇/宣布无效（含句尾「了」变体与「一律/全部/所有」范围词）。
 *   · 豁免 EXEMPT 流程正当性——按流程/书面/合同里写了/协商一致/
 *     双方同意/依法/照章在场时不判（正式变更流程不是单方作废）。
 *
 * 为什么取 VERIFY 级：单句可能是正当的合同复盘（「原合同里写了
 * 变更条款，按流程来就行」）或对话引用（「他说之前的约定不算数，
 * 我当时就录音了」）。verify 的含义是「这段话在单方作废既有约定，
 * 需要回到约定的原始内容与生效程序上讨论」。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（单方作废/void standard shift 字样在场）；
 *   · 第三人称职务语境（律师/法官/调解员/咨询师）；
 *   · 流程正当性（按流程/书面/协商一致/双方同意/依法/照章/
 *     合同里写了）。
 */
'use strict';

// ─── 腿①：既往事项指称（中文，两种形态）──────────────────────────
// 形态 A：指代词 × 事项名词（「那件事」「那次承诺」「这份协议」）
const PAST_MATTER_DEICTIC_ZH = new RegExp(
  '(?:那件|那桩|那次|那回|那档|那份|这档|此前那|当初那|原来那)' +
  '(?:的)?' +
  '(?:事情|事|承诺|协议|约定|说法|规矩|安排|计划|条款|条件|待遇|标准|价钱|价格|口头约定)'
);
// 形态 B：既往时间词/旧称 × 事项名词（插入容忍 ≤4 字，不容句读）
const PAST_MATTER_TEMPORAL_ZH = new RegExp(
  '(?:之前|原先|原来|当初|过去|此前|从前|旧的|老的|原有)' +
  '[^。；;，,！!？?\n]{0,4}' +
  '(?:的)?' +
  '(?:协议|约定|承诺|说法|规矩|标准|条款|条件|安排|计划|事情|承诺书|合同|口头约定)'
);
// 形态 C：既往事项裸名词 × 作废动词紧邻（「旧标准作废」「约定不作数了」）——
// 无时间词无指代词前缀，靠「共识类名词 + 作废动词」紧邻共现，插入容忍 ≤3 字
// 不容句读（防「新标准下，旧协议需要重新评估」这类正当陈述跨段配对）。
const PAST_MATTER_BARE_ZH = new RegExp(
  '(?:^|[，,。！!？?；;\s])' +
  '(?:旧|老|原|先前|原定|既定)?' +
  '(?:的)?' +
  '(?:标准|规矩|约定|协议|承诺|条款|条件|说法|安排|计划)' +
  '[^。；;，,！!？?\n]{0,3}' +
  '(?:不算数|不作数|不作数了|不算|不算了|作废|作废了|无效|无效了|失效|取消|推翻|收回|撕毁|一笔勾销|不认账|翻篇)'
);
const PAST_MATTER_ZH = new RegExp(
  PAST_MATTER_DEICTIC_ZH.source + '|' + PAST_MATTER_TEMPORAL_ZH.source + '|' + PAST_MATTER_BARE_ZH.source
);

// ─── 腿②：单方作废动词（中文，含句尾「了」变体与范围词）──────────
const VOID_ACT_ZH = new RegExp(
  '(?:不算数|不作数|不作数了|不算|不算了|作废|作废了|无效|无效了|失效|失效了|' +
  '取消|取消了|推翻|收回了|收回|撤回|撤回|撕毁|撕毁了|一笔勾销|勾销|' +
  '不认账|不认了|翻篇|宣布无效|宣告无效|声明作废|宣布作废)' +
  '|(?:一律|全部|所有|全都|尽数)(?:不算数|不作数|作废|无效|取消)'
);

// ─── 豁免一：元话语/概念引述（分析这套话术本身不是运用它）────────
const META_NOUN = /(?:单方作废|void\s+standard\s+shift|voiding\s+the\s+standard|作废约定的话术)/i;

// ─── 豁免二：第三人称职务语境（专业角色复盘/引用当事人陈述）──────
const THIRD_PERSON_EXEMPT = /(?:律师|法官|调解员|咨询师|治疗师|心理咨询师|lawyer|judge|mediator|counselor|therapist|他说|她说|对方说|当事人称)/i;

// ─── 豁免三：流程正当性（正式变更流程不是单方作废）──────────────
const PROCEDURE_EXEMPT = /(?:按流程|照流程|走流程|书面|协商一致|双方同意|双方确认|依法|照章|按合同|合同里写了|合同约定|按条款|重新签署|补充协议|书面修订|变更单|per\s+the\s+process|in\s+writing|mutually\s+agree)/i;

/**
 * 中文路由：腿①（既往事项指称）× 腿②（作废动词）共现。
 * 腿①三种形态可分别注入（负例脚本逐一置空验证各形态承重）：
 * 未注入的形态走默认常量，合并正则 PAST_MATTER_ZH 作为整体兜底。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const deictic = R.PAST_MATTER_DEICTIC_ZH || PAST_MATTER_DEICTIC_ZH;
  const temporal = R.PAST_MATTER_TEMPORAL_ZH || PAST_MATTER_TEMPORAL_ZH;
  const bare = R.PAST_MATTER_BARE_ZH || PAST_MATTER_BARE_ZH;
  const voidAct = R.VOID_ACT_ZH || VOID_ACT_ZH;
  const matterHit = deictic.test(text) || temporal.test(text) || bare.test(text);
  if (!matterHit) return null;
  if (voidAct.test(text)) return { route: 'zh:matter×void' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkVoidZhStandardShift(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;
  const PROCEDURE_EXEMPT_ = R.PROCEDURE_EXEMPT || PROCEDURE_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称职务语境：专业角色复盘或引用当事人陈述
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 流程正当性：正式变更流程不是单方作废
  if (PROCEDURE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  if (!isZh) return { hit: false, score: 0, detail: '', count: 0 };

  const r = checkZh(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: `单方作废约定×既往事项指称(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkVoidZhStandardShift,
  __internals: () => ({
    PAST_MATTER_ZH, PAST_MATTER_DEICTIC_ZH, PAST_MATTER_TEMPORAL_ZH,
    VOID_ACT_ZH, META_NOUN, THIRD_PERSON_EXEMPT, PROCEDURE_EXEMPT,
  }),
};
