/**
 * src/appeal-to-majority.js — 「诉诸多数」检测器（第 149 个判别维度）
 *
 * [r718 立项] decision 本体选出（scripts/decide-r718.js，composite_score
 * 0.83 / confidence 0.8 / identity alignment 0.8，无拒选）。候选池来自
 * r718 探测器（scripts/round-718-family-probe.js）在当前引擎（v6.8.63，
 * 148 维）上逐族复测：攻击漏判 6/9（67%）、真零命中 6/6、良性 0/9
 * 误伤。Phase 1.5 同律复核：6 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 6/6——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：诉诸多数（appeal to majority / bandwagon fallacy /
 * appeal to popularity）——**以人数、流行度或投票结果代替论证**，
 * 把「信的人多」当成「是对的」的论据，让观点背负人数背书：
 *   大家都这么认为，肯定是对的。
 *   这么多人用，说明产品没问题。
 *   群众的眼睛是雪亮的，跟着大家走就行。
 *   大多数人不支持，这个方案肯定不行。
 *   全网都在骂，说明他真的有问题。
 *   销量第一，质量肯定最好。
 *   Everyone believes this, so it must be true.
 *   Millions of people use it, so it cannot be wrong.
 *   The majority agrees, therefore it is correct.
 *
 * 与既有维度的边界（r718 归因）：
 *   · synthetic_social_proof 管**伪造社会证明**（编造用户评价/
 *     虚构销量数据/假造口碑），本族管以（真实的）多数意见代替
 *     论证，不涉伪造；
 *   · hasty_generalization 管**无依据概推**（样本不足的推广），
 *     本族要件是人数/流行度被当作论据本身；
 *   · confidence 管**断言强度**（肯定/一定/毫无疑问），本族管
 *     「多数意见→结论」的论证结构，可毫无强度词；
 *   · 其余 148 个维度对本族 6 条漏判样本实测零命中 6/6。
 *
 * 判据（两条腿共现，缺一不判）：
 *   · 腿① MAJORITY 多数/流行度表达——大家都/这么多人/大多数人/
 *     群众/全网/销量第一/用户基数/多数人/普遍/主流（中）；
 *     everyone / everybody / millions / the majority / most
 *     people / widely used / popular / everyone believes（英）；
 *   · 腿② CONCLUSION 以人数收束的结论——肯定是对的/说明没
 *     问题/肯定不行/跟着大家走就行/说明他有问题/质量肯定最好
 *     （中）；so it must be true / cannot be wrong / therefore
 *     it is correct / proves it（英）。
 *   · 缺腿不判：只有腿①（「虽然很多人这么想，但我们要看数据
 *     怎么说」）是正常的人数陈述；只有腿②（「这个方案肯定
 *     不行」）无人数来源，归 confidence。
 *
 * 为什么取 VERIFY 级：单句可能是转述流行观点供分析（「很多人
 * 说这东西有效，我们来看看证据」）、市场调研的正当引用（投票
 * 结果显示大家倾向方案 A，我们按流程推进）、社会现象描述。
 * verify 的含义是「这段话在用人数为观点背书，需要回到论证本
 * 身」——调用方应要求把「对不对」落到证据上，而不是接受人数
 * 叙事。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（诉诸多数/appeal to majority/bandwagon
 *     fallacy 字样在场）：分析这个概念本身不是运用它；
 *   · 有出处的人数陈述在场（数据/调研/样本/统计/调查/投票
 *     结果/报告；survey/sample/poll/data/statistic/research/
 *     study）：带方法的人数陈述是引用不是背书；
 *   · 逻辑教学第三人称语境（逻辑学老师/教材/课堂上/教授/
 *     textbook/lecture/professor）：专业角色复盘反例。
 */
'use strict';

// ─── 腿①：多数/流行度表达（中文）────────────────────────────────
const MAJORITY_ZH = /(?:大家都|大伙都|所有人都|这么多人|那么多人|大多数人|多数人|群众|全网|销量第[一二三四五]|用户基数|用户量|下载量|排行第[一二三四五]|排名第[一二三四五]|人人[都在都]|所有人都在|很多人|不少人|普遍|主流|大伙|十个人|九成|八成|七成|一半以上|过半|半数|乡亲们|粉丝|用户都|人们都|网友都|都在[夸赞好用说]|都在学|都在买)/;

// ─── 腿①：多数/流行度表达（英文）────────────────────────────────
const MAJORITY_EN = /\b(?:everyone|everybody|millions?\s+of|the\s+majority|most\s+people|majority\s+(?:of|agrees|believes|thinks)|widely\s+(?:used|accepted|believed)|popular\s+(?:opinion|belief)|everyone\s+(?:believes|thinks|knows|agrees|uses)|people\s+believe|nobody\s+(?:believes|thinks)|millions?\s+of\s+fans|widely\s+held|commonly\s+(?:believed|accepted|known)|most\s+(?:experts|users|reviewers|critics)\s+(?:agree|think|say|recommend))\b/i;

// ─── 腿②：以人数收束的结论（中文）────────────────────────────────
const CONCLUSION_ZH = /(?:肯定[是对好]|一定是[对好]|准没?错|跟着[^。]{0,8}走就行|跟着[^。]{0,8}准没错|说明[^。]{0,14}(?:没问题|是对的|肯定行|不可靠|有问题|不行|最好|最差|靠谱)|证明[^。]{0,14}(?:有效|是对的|没问题|不行)|质量[^。]{0,6}(?:肯定|一定)[^。]{0,4}(?:最好|最差|好|差)|肯定[不行好有错]|肯定不会?错|不会有?错|这[还那][能]?[有假]?[是假]|他不[火红]谁[火红]|还能有假|有什么可怀疑|不容置疑|铁定的事实)/;

// ─── 腿②：以人数收束的结论（英文）────────────────────────────────
const CONCLUSION_EN = /\b(?:so\s+it\s+must\s+be|it\s+cannot\s+be\s+wrong|therefore\s+it\s+is|that\s+proves\s+(?:it|that)|it\s+must\s+be\s+(?:true|right|good|correct)|so\s+it\s+has\s+to\s+be|which\s+proves|must\s+be\s+(?:true|right|good)|so\s+he\s+must\s+be|so\s+they\s+must\s+be|has\s+to\s+be\s+(?:true|right|good|the\s+best)|cannot\s+be\s+wrong\s+about|so\s+it\s+will)\b/i;

// ─── 豁免一：元话语/概念引述（分析这个概念本身不是运用它）──────────
const META_NOUN = /(?:诉诸多数|appeal\s+to\s+(?:the\s+)?majority|bandwagon\s+fallacy|appeal\s+to\s+popularity|诉诸公众|从众谬误|乐队花车谬误)/i;

// ─── 豁免二：有出处的人数陈述在场（带方法的人数陈述是引用不是背书）
const EVIDENCE_PRESENT = /(?:数据|调研|样本|统计|调查|投票结果|问卷|报告|文献|论文|数据显示|统计显示|survey|sample|poll|data|statistic|research|study|census|questionnaire)/i;

// ─── 豁免三：逻辑教学第三人称语境（专业角色复盘反例）──────────────
const THIRD_PERSON_EXEMPT = /(?:逻辑学老师|逻辑老师|哲学老师|批判性思维课程|教材|课本|课堂上|讲师|教授说|老师说|textbook|lecture|professor|in\s+class|teacher\s+said)/i;

/**
 * 中文路由：腿①×腿② 双腿共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const majority = R.MAJORITY_ZH || MAJORITY_ZH;
  const conclusion = R.CONCLUSION_ZH || CONCLUSION_ZH;
  if (!majority.test(text)) return null;
  if (conclusion.test(text)) return { route: 'zh:majority×conclusion' };
  return null;
}

/**
 * 英文路由：腿①×腿② 双腿共现。
 */
function checkEn(text, R) {
  const majority = R.MAJORITY_EN || MAJORITY_EN;
  const conclusion = R.CONCLUSION_EN || CONCLUSION_EN;
  if (!majority.test(text)) return null;
  if (conclusion.test(text)) return { route: 'en:majority×conclusion' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToMajority(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const EVIDENCE_PRESENT_ = R.EVIDENCE_PRESENT || EVIDENCE_PRESENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 有出处的人数陈述在场 → 带方法的人数陈述是引用不是背书
  if (EVIDENCE_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 逻辑教学第三人称语境：专业角色复盘反例
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
        ? `诉诸多数×人数替代论证(${r.route})`
        : `appeal to majority×popularity-over-argument(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToMajority,
  __internals: () => ({
    MAJORITY_ZH, MAJORITY_EN, CONCLUSION_ZH, CONCLUSION_EN,
    META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT,
  }),
};
