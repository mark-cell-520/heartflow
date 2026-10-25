/**
 * src/gamblers-fallacy.js — 「赌徒谬误」检测器（第 148 个判别维度）
 *
 * [r717 立项] decision 本体选出（scripts/decide-r717.js，composite_score
 * 0.84 / confidence 0.8 / identity alignment 0.8，无弃权）。候选池来自
 * r717 探测器（scripts/round-717-family-probe.js）在当前引擎（v6.8.62，
 * 147 维）上逐族复测：攻击漏判 8/9（89%）、真零命中 8/8、良性 0/9
 * 误伤。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，实测
 * 全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：赌徒谬误（gambler's fallacy / Monte Carlo fallacy）——**把
 * 独立事件的历史频率当成未来概率的依据**，认为连胜之后「该输了」、
 * 连败之后「该赢了」、出现次数少的「该出现了」，让随机序列背负
 * 「平衡义务」：
 *   已经连输五把了，下一把肯定赢。
 *   都出十次小了，该出大了。
 *   连续三把没中，这次中奖概率更高了。
 *   前面几次都是反面，这次肯定是正面。
 *   输了这么多把，运气该回来了。
 *   硬币出了五次正面，下一次反面的概率大多了。
 *   It has been tails five times in a row, so heads is due next.
 *   After ten losses, a win is statistically more likely now.
 *   The coin landed heads four times, so tails is overdue.
 *
 * 与既有维度的边界（r717 归因）：
 *   · statistical_misleading 管**统计数据的呈现误导**（挑选性
 *     展示/基数误导/图表操纵），本族管独立事件概率的认知错误，
 *     不涉及数据呈现；
 *   · confidence 管**断言强度**（肯定/一定/毫无疑问），本族管
 *     「历史频率→未来概率」的推断结构，可毫无强度词；
 *   · pseudo_causal 管**虚假因果机制**（A 导致 B 的具体机制
 *     错误），本族管的不是因果机制而是概率分布误判；
 *   · 其余 147 个维度对本族 8 条漏判样本实测零命中 8/8。
 *   · src/index.js 既有 3 条同族英文 pattern（en_streak_due 表
 *     内）是指认不是运用，不占维度键——本模块上线后与其并存，
 *     射程互补（那 3 条只认特定英文句型，本维度管双腿判据）。
 *
 * 判据（两条腿共现，缺一不判）：
 *   · 腿① STREAK 历史连胜/连败/高频重复表达——连输/连赢/连败/
 *     连胜/连续N[把次回]/N次没中/前几次/这么[多长][把次回下]
 *     （中）；N times in a row / a streak of / N consecutive /
 *     N losses / N wins（英）；
 *   · 腿② DUE 反转/概率升高预期——下一[把次回]肯定赢/该出[大小]/
 *     概率更[高多大了]/运气该回来/风水轮流转/该转运/肯定是[正面
 *     反面]/这次一定中/该轮到了（中）；is due / overdue / more
 *     likely / bound to（英）。
 *   · 缺腿不判：只有腿①（「虽然连输五把，但每把都是独立事件，
 *     概率不变」）是正确概率陈述；只有腿②（「这个事情一定会
 *     成功」）无历史频率来源，归 confidence。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误（「他说连输五把
 * 下一把肯定赢，我劝他别这么想」）、概率教学中的反例讲解（「很
 * 多人认为十次没中下次概率更高，这是赌徒谬误」）、游戏/赌博
 * 场景的叙事引用。verify 的含义是「这段话在把历史频率当未来
 * 概率，需要回到独立事件与概率论的常识层面」——调用方应要求
 * 把「下一次的概率」落到独立事件的定义上，而不是接受平衡
 * 幻觉。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（赌徒谬误/gambler's fallacy/Monte Carlo
 *     fallacy 字样在场）：分析这个概念本身不是运用它；
 *   · 正确概率陈述在场（独立事件/概率不变/不影响/与历史无关/
 *     不会累积/50%/对照组/大数定律；independent/regardless/
 *     remains the same/do not affect/law of large numbers）：
 *     陈述独立性原理的话是在破除谬误；
 *   · 概率教学第三人称语境（概率论老师/统计学老师/教材/课堂上/
 *     教授/textbook/lecture/professor）：专业角色复盘反例。
 */
'use strict';

// ─── 腿①：历史连胜/连败/高频重复表达（中文）────────────────────────
const STREAK_ZH = /(?:连[输赢败开押下注]|连胜|连败|连续[二三四五六七八九十百千\d]+[把次回下个局]|连续[输赢败中开]|[二三四五六七八九十百千\d]+[把次回下][没中都开是赢都][^。]{0,4}?(?:了|哩|咯)?|[二三四五六七八九十百千\d]+次[没中开是赢都]|[二三四五六七八九十\d]+次?[的正反]面|前[面那]?几[次把回下]|这么[多长][把次回下]|连着[二三四五六七八九十\d]*[把次回下局]|已经[输赢开]了?[二三四五六七八九十\d]*[把次回下]?|十次|五次|好几次|连续[二三四五六七八九十\d]+次|手气[正很][旺顺]|手气好|势头[正很][旺猛好]|还没吐分|没吐分|没出分|该吐分|[把场局]输了|连输|连开|连押)/;

// ─── 腿①：历史连胜/连败/高频重复表达（英文）────────────────────────
const STREAK_EN = /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|several|multiple|so\s+many)\s+(?:times?\s+in\s+a\s+row|consecutive\s+(?:times|losses|wins|flips|tosses)|losses|wins|times|tosses|flips|draws|tails|heads|reds|blacks|spins|hands|rounds|rolls|pulls|games)\b|\b(?:a\s+streak\s+of|streak\s+of|a\s+(?:losing|winning|hot|cold)\s+streak)\b|\b(?:has\s+been|have\s+been|it\s+has\s+been)\s+(?:tails|heads|red|black|winning|losing|on\s+a\s+(?:losing|winning)\s+streak)\b|\b(?:has|have)\s+not\s+paid\s+out/i;

// ─── 腿②：反转/概率升高预期（中文）────────────────────────────────
const DUE_ZH = /(?:下一[把次回下][肯定一][会定][赢中]|下一次[肯定一][会定][赢中]|该出[大小]了|该出[大小]|该开[大小]|开[大小]了|[肯肯定]定?开[大小]|必开[大小]|(?:概率|几率)[更]?[大高多][多了高]|运气该回来|运气要回来|运气会回来|风水轮流转|该转运了|转运的时候|肯定是[正反]面|一定是[正反]面|这次一定[会中赢]|这次[肯定一][会定][中赢]|该轮到[我了它了]|反转的时候到了|时来运转|否极泰来|必中|下一[把次回下]?还能赢|一次赢回来|赢回来|运气攒着|攒着)/;

// ─── 腿②：反转/概率升高预期（英文）────────────────────────────────
const DUE_EN = /\b(?:is\s+due|are\s+due|due\s+next|due\s+to\s+(?:happen|come\s+up|change)|due\s+for|overdue|must\s+be\s+(?:next|due)|more\s+likely\s+(?:now|next|this\s+time)|bound\s+to\s+(?:happen|come\s+up|win|change)|luck\s+is\s+(?:due|going\s+to\s+(?:turn|change))|a\s+win\s+is\s+(?:due|coming)|my\s+luck\s+will\s+turn|statistically\s+more\s+likely)\b/i;

// ─── 豁免一：元话语/概念引述（分析这个概念本身不是运用它）──────────
const META_NOUN = /(?:赌徒谬误|gambler'?s?\s+fallacy|monte\s+carlo\s+fallacy|蒙特卡洛谬误|hot\s+hand\s+fallacy|热手谬误)/i;

// ─── 豁免二：正确概率陈述在场（陈述独立性原理的话是在破除谬误）────
const EVIDENCE_PRESENT = /(?:独立事件|概率不变|概率不会?[累积变]|与历史无关|不受[之前上次]结果影响|不影响[下之]?一[次个]|互不[相影响]|50\s*%|对照组|大数定律|independent\s+event|regardless\s+of|remains?\s+the\s+same|do(?:es)?\s+not\s+affect|law\s+of\s+large\s+numbers|control\s+group|same\s+probability)/i;

// ─── 豁免三：概率教学第三人称语境（专业角色复盘反例）──────────────
const THIRD_PERSON_EXEMPT = /(?:概率论老师|统计学老师|数学老师|概率论教授|统计学教授|教材|课本|课堂上|讲师|教授说|老师说|textbook|lecture|professor|in\s+class|teacher\s+said)/i;

/**
 * 中文路由：腿①×腿② 双腿共现。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const streak = R.STREAK_ZH || STREAK_ZH;
  const due = R.DUE_ZH || DUE_ZH;
  if (!streak.test(text)) return null;
  if (due.test(text)) return { route: 'zh:streak×due' };
  return null;
}

/**
 * 英文路由：腿①×腿② 双腿共现。
 */
function checkEn(text, R) {
  const streak = R.STREAK_EN || STREAK_EN;
  const due = R.DUE_EN || DUE_EN;
  if (!streak.test(text)) return null;
  if (due.test(text)) return { route: 'en:streak×due' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGamblersFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const EVIDENCE_PRESENT_ = R.EVIDENCE_PRESENT || EVIDENCE_PRESENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确概率陈述在场 → 陈述独立性原理是在破除谬误
  if (EVIDENCE_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 概率教学第三人称语境：专业角色复盘反例
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
        ? `赌徒谬误×频率替代概率(${r.route})`
        : `gambler's fallacy×frequency-over-probability(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkGamblersFallacy,
  __internals: () => ({
    STREAK_ZH, STREAK_EN, DUE_ZH, DUE_EN,
    META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT,
  }),
};
