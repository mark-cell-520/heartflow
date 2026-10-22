/**
 * src/concern-trolling.js — 「伪关心」检测器（第 145 个判别维度）
 *
 * [r714 立项] decision 本体选出（scripts/decide-r714.js，composite_score
 * 0.84 / confidence 0.7 / identity alignment 0.8）。候选池来自 r714
 * 探测器（scripts/round-714-family-probe.js）在当前引擎（v6.8.59，
 * 144 维）上逐族复测：攻击漏判 9/10（90%）、真零命中 7/9、良性
 * 0/12 误伤。Phase 1.5 同律复核：9 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 7/9——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：伪关心（concern trolling）——**用「关心/为你好」的包装
 * 实施控制、贬低或打压**，把伤害性的话语装扮成善意提醒，同时取消
 * 对方不接受的权利：
 *   我是为你好，才指出你这些问题的。
 *   我这么说都是关心你，别人谁愿意跟你说这些。
 *   为你好才提醒你，你这样下去不行。
 *   别不识好人心，我这些都是为你好。
 *   我关心你才说这些难听话，换别人我才不管。
 *   我是担心你才批评你的，这是负责任的表现。
 *   I am only saying this because I care about you.
 *   A real friend would tell you these hard truths, and I care
 *   enough to do it.
 *
 * 与既有维度的边界（r714 归因）：
 *   · guilt_induction / emotional_manipulation 管**情感债务制造**
 *     （我为你付出这么多/你欠我的），本族可以毫无付出叙事，纯
 *     「善意包装 + 贬低内容」的话术结构；
 *   · tone_policing 管**压制表达方式**（你说话客气点），本族管
 *     「以关心之名行贬低之实」的内容替换；
 *   · bad_faith 检测表里的 en_concern_trolling pattern 只认字面
 *     「you are concern trolling」的**指控句**，本族管**运用这套
 *     话术的陈述本身**——两者是「指认」与「运用」的关系；
 *   · 其余 144 个维度对本族 9 条漏判样本实测零命中 7/9。
 *
 * 判据（两条路由，任一成立即判定）：
 *   · 路由一「关心包装×贬低控制」双腿共现，缺一不判：
 *     腿① CARE 关心包装——为你好/关心你/担心你（中）；
 *       because I care / I care about you / for your own good /
 *       I care enough / a real friend would（英）；
 *     腿② BELITTLE 贬低控制内容——你这些问题/你的问题/你这样
 *       下去/你这样不行/你不听/不听劝/批评你/指责你/难听话/
 *       不识好人心/不知好歹/你这个人/你总是/你从来（中）；
 *       hard truths / your problems / these problems / only
 *       saying this / nobody else would（英）。
 *   · 路由二「关心包装×排他垄断」双腿共现：关心包装与排他性
 *     关心垄断（别人谁愿意/换别人/除了我/没人愿意/谁会跟你说/
 *     只有我）共现——「我这么说都是关心你，别人谁愿意跟你说
 *     这些」把「愿意批评你」垄断成自己的特权，正常关心陈述不
 *     争夺批评权的独占。
 *   · 缺腿不判：只有腿①（「我有点担心，想听听你的想法」）是
 *     正常关心；只有腿②（「你这个方案有问题」）是正常批评。
 *
 * 为什么取 VERIFY 级：单句可能是正常的冲突复盘（「他说我这
 * 都是为你好，现在看是在控制我」）、心理咨询中的话术模式分析、
 * 安全教育材料。verify 的含义是「这段话在用关心包装贬低，需
 * 要回到具体事实层面讨论」——调用方应要求把「问题」落到可核对
 * 的事实上，而不是接受善意叙事。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（伪关心/concern trolling 字样在场）：分析
 *     这套话术本身不是运用它；
 *   · 第三人称职务语境（心理咨询师/调解员/咨询师/治疗师/
 *     counselor/therapist/mediator）：专业角色复盘关系模式。
 */
'use strict';

// ─── 腿①：关心包装（中文）────────────────────────────────────────
const CARE_ZH = /(?:为你好|关心你|担心你)/;

// ─── 腿①：关心包装（英文）──────────────────────────────────────
const CARE_EN = /\b(?:because\s+i\s+care|i\s+care\s+about\s+you|for\s+your\s+own\s+good|i\s+care\s+enough|a\s+real\s+friend\s+would)\b/i;

// ─── 腿②：贬低控制内容（中文）──────────────────────────────────
const BELITTLE_ZH = /(?:你这些问题|你的问题|你这样下去|你这样不行|你不听|不听劝|批评你|指责你|难听话|不识好人心|不知好歹|你这个人|你总是|你从来)/;

// ─── 腿②：贬低控制内容（英文）──────────────────────────────────
const BELITTLE_EN = /\b(?:hard\s+truths?|your\s+problems?|these\s+problems|only\s+saying\s+this|nobody\s+else\s+would|no\s+one\s+else\s+would)\b/i;

// ─── 路由二附：排他性关心垄断（……，别人谁愿意 / 换别人我才不管）──
const EXCLUSIVE_ZH = /(?:别人谁愿意|换别人|除了我|没人愿意|谁会跟你说|只有我)/;

// ─── 豁免一：元话语/概念引述（分析这套话术本身不是运用它）──────
const META_NOUN = /(?:伪关心|concern\s+trolling)/i;

// ─── 豁免二：第三人称职务语境（专业角色复盘关系模式）────────────
const THIRD_PERSON_EXEMPT = /(?:心理咨询师|心理咨询|心理医生|调解员|咨询师|治疗师|counselor|therapist|mediator|social\s+worker)/i;

/**
 * 中文路由：路由一（腿①×腿②）+ 路由二（腿①×排他）。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const care = R.CARE_ZH || CARE_ZH;
  const belittle = R.BELITTLE_ZH || BELITTLE_ZH;
  const exclusive = R.EXCLUSIVE_ZH || EXCLUSIVE_ZH;
  if (!care.test(text)) return null;
  if (belittle.test(text)) return { route: 'zh:care×belittle' };
  if (exclusive.test(text)) return { route: 'zh:care×exclusive' };
  return null;
}

/**
 * 英文路由：路由一（腿①×腿②）。
 */
function checkEn(text, R) {
  const care = R.CARE_EN || CARE_EN;
  const belittle = R.BELITTLE_EN || BELITTLE_EN;
  if (!care.test(text)) return null;
  if (belittle.test(text)) return { route: 'en:care×belittle' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkConcernTrolling(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称职务语境：专业角色复盘关系模式
  if (THIRD_PERSON_EXEMPT_.test(text)) {
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
        ? `伪关心×善意包装贬低(${r.route})`
        : `concern trolling×care-wrapped belittlement(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkConcernTrolling,
  __internals: () => ({
    CARE_ZH, CARE_EN, BELITTLE_ZH, BELITTLE_EN, EXCLUSIVE_ZH,
    META_NOUN, THIRD_PERSON_EXEMPT,
  }),
};
