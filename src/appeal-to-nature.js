/**
 * src/appeal-to-nature.js — 「诉诸自然谬误」检测器（第 139 个判别维度）
 *
 * [r706 立项] decision 本体在 138 维引擎上选出（/tmp/decide-run-706.js 读
 * /tmp/decide-opts-706.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选）。轮前探针 /tmp/r705-preprobe.js 复量
 * （样本集与 r704/r705 完全一致，跨轮可比）：攻击 10 条漏判 8/10、
 * 漏判中真零命中 5/8、良性误伤 1/12 且全部归因存量维度
 * （unsupported_claim/vagueness/moral_foundations/appeal_to_authority），
 * 本族自身存量误伤 0 → 探测器判定合格。
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判。Phase 1.5 同律复核：5 条真零命中样本逐条跑 discriminate() 实测
 * 全维度零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「诉诸自然谬误」（appeal to nature）——以「天然/自然/野生/
 * 老祖宗传下来的」为依据，断言某事物**更安全、更健康、更优越**，或暗示
 * 「非自然（化学/人工/工业）」即有害：
 *   这是纯天然植物提取的，肯定比化学药安全。
 *   全天然成分，没有任何添加剂，所以放心吃。
 *   这东西是野生的，比养殖的有营养。
 *   自然熟的果子比催熟的健康，这是自然规律。
 *   我们这是纯草本配方，没有任何化学成分。
 *   原始森林里的空气比城里的好，毕竟没有工业污染。
 *   这部手机用的是天然材质，手感肯定更高级。
 *   这个疗法用的是自然疗法，比西医副作用小。
 *   母乳是天然的，所以一定比配方奶好。
 *   老祖宗传下来的做法，自然是经过时间检验的。
 *   It's all-natural plant extract, so it must be safer than chemical
 *   medicine.
 *   Wild-caught fish is more nutritious than farmed fish.
 *   Our formula is 100% herbal with no artificial chemicals.
 *   This phone uses natural materials, so it definitely feels more
 *   premium.
 *
 * 与既有维度的边界（r706 复量归因）：
 *   · moral_foundations 对 3 条本族样本有沾边命中（自然规律/无污染/
 *     自然疗法），但该维度不在 action-forcing 集合，gate.action 恒
 *     pass——它管道德基础框架信号（care/harm 等五基础），本族管
 *     「自然性→优越性」的论证结构，命中同一样本不冲突，本族提供行动级。
 *   · confidence / unsupported_claim / vagueness 管无依据断言与模糊
 *     表述，本族有明确的依据类型（自然性），是另一族。
 *   · 良性「实验室数据显示该化合物在自然条件下会降解」被存量维度
 *     verify（unsupported_claim 等），本维度对它零命中（无优越断言腿）。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「自然性断言 × 优越/安全结论」这一双腿结构在模式库里没有任何一条
 *   腿——moral_foundations 只沾边不行动，confidence 系只管断言强度
 *   不管依据类型，整族射程外。
 *
 * 判据（一条路由）：
 *   · 腿①自然性断言（天然/纯植物/纯草本/野生/自然熟/原生态/老祖宗
 *     传下来/古法/原始森林/无污染/自然疗法/是天然的）× 腿②优越或
 *     安全结论（比X安全/好/健康/有营养/高级/副作用小；肯定/一定+
 *     安全/健康/高级；放心吃/用；没有任何化学成分/添加剂；经过时间
 *     检验）共现；
 *   · 缺一不判——「天然林场的管理需要遵守环保法规」只有自然性名词无
 *     优越断言；「这个新产品采用了最新的加密算法，安全性更高」只有
 *     优越断言无自然性依据；「纯植物提取物也可能引起过敏反应」是保留
 *     语陈述不是论证。
 *
 * 为什么取 VERIFY 级：单句可能是正当的产品说明（「本品为天然成
 * 分，过敏测试报告见附件」）、正当的比较测评（「我们对比一下野生种
 * 和养殖种的营养成分数据」）、食品安全讨论（「纯植物提取物也可能
 * 引起过敏反应」），rewrite/block 会误伤（与 r672-r705 全部评价/胁迫
 * 族同口径）。verify 的含义是「这段以自然性为依据的安全性/优越性断
 * 言需要补证据」——调用方应要求给出对照数据再采信。
 *
 * 明确不判的（豁免）：
 *   · 评析这套话术本身（诉诸自然是一种常见的逻辑谬误/This is an
 *     appeal to nature fallacy. / naturalistic fallacy）；
 *   · 保留语陈述（纯植物提取物也可能引起过敏反应/母乳喂养有诸多益
 *     处，但并非适用于所有情况——无优越断言腿，天然不判）；
 *   · 数据对比请求（我们对比一下野生种和养殖种的营养成分数据——
 *     请求形无比结构，天然不判）；
 *   · 无自然性依据的优越断言（加密算法安全性更高——只有腿②）。
 */
'use strict';

// ─── 腿① NATURE 自然性断言（中文）────────────────────────────────
const NATURE_ZH = new RegExp(
  // a (纯/全/100%)天然 + 植物/成分/材质/提取物/配方/草本
  '(?:纯|全|100%|百分之百)?天然(?:植物|成分|材质|提取物?|配方|草本)' +
  // b 纯(植物/草本)提取/配方
  '|(?:纯|100%|百分之百)?(?:植物|草本)(?:提取物?|配方)' +
  // c 野生/野生的
  '|野生' +
  // d 自然熟/自然种植/自然生长/自然农法/原生态
  '|自然(?:熟|种植|生长|农法|农作法|放养|土鸡|土鸡蛋)' +
  '|原生态' +
  // e 老祖宗/祖祖辈辈/世代 + 传下来/流传 + 做法/配方/疗法/经验
  '|(?:老祖宗|古人|祖祖辈辈|世代|老一辈|祖上)(?:传下来|传下来?的|流传|沿用|留下)(?:的)?(?:做法|配方|疗法|方法|经验|智慧|规矩|偏方)' +
  '|古法(?:制作|炮制|种植|养殖|调理)' +
  // f 原始森林/天然林/深山/乡下 + 空气/环境/水；无工业污染
  '|(?:原始森林|天然林|深山|乡下|农村|郊外)(?:里|中)?的(?:空气|环境|水|负离子)' +
  '|(?:没有|无)(?:任何)?(?:工业)?污染' +
  // g 自然疗法/天然疗法
  '|(?:自然|天然)疗法' +
  // h (母乳/牛奶等)是天然的
  '|(?:母乳|牛奶|羊奶|蜂蜜)(?:是|就属?于|才是)(?:真正|纯正|100%)?天然(?:的)?'
);

// 英文腿与中文对齐：a 天然植物/草本配方、b plant-based、c wild、
// d naturally grown、e 祖传/time-honored、f 原始森林/无污染、
// g natural therapy、h is natural 八支。
const NATURE_EN = new RegExp(
  // a all-natural / pure plant / 100% natural / herbal formula
  "\\b(?:all[- ]?natural|purely? (?:plant|herbal)|100% (?:natural|herbal)|herbal (?:formula|extract|remedy|blend)|natural (?:materials?|ingredients?|components?))\\b" +
  // b plant/herb-based extract or formula
  "|\\b(?:plant|herb)[- ]?(?:based|derived) (?:extract|formula|ingredient)\\b" +
  // c wild / wild-caught / wild-grown
  "|\\bwild(?:[- ]?(?:caught|grown|harvested|picked))?\\b" +
  // d naturally grown / ripened / raised
  "|\\bnaturally (?:grown|ripened|raised|farmed|fermented)\\b" +
  // e passed down from ancestors / time-honored tradition
  "|\\b(?:passed|handed) down (?:from|by) (?:our )?(?:ancestors|forefathers|grandparents|elders)\\b" +
  "|\\btime[- ]?(?:honored|honoured|tested) (?:tradition|method|recipe|practice|way)\\b" +
  // f primeval/pristine forest / no industrial pollution
  "|\\b(?:primeval|pristine|untouched|virgin) (?:forest|nature|wilderness|woods)\\b" +
  "|\\bno (?:industrial )?pollution\\b" +
  // g natural/holistic therapy or remedy
  "|\\b(?:natural|holistic|herbal) (?:therapy|therapies|remedy|remedies|healing|cure)\\b" +
  // h is natural / it's completely natural
  "|\\b(?:is|are|it'?s|they'?re) (?:completely |totally |purely |entirely )?natural\\b",
  'i'
);

// ─── 腿② SUPERIOR 优越/安全结论（中文）──────────────────────────
const SUPERIOR_ZH = new RegExp(
  // a 比较形：比(化学/人工/养殖/催熟/城里/西医/普通/常规/工业)X + 优越词
  '比(?:化学|人工|养殖|催熟|城里|西医|中药|普通|常规|工业|加工|家里养|自家养|散养|圈养|土养|饲料)[^。]{0,12}(?:安全|好|健康|有营养|高级|优越|靠谱|有效|副作用小|纯净|温和)' +
  // a2 比X更/还 + 优越词（泛比较）
  '|比[^。]{0,8}(?:更|还要|还)(?:安全|健康|好|有营养|高级|天然|纯净|靠谱)' +
  // b 肯定/一定/必然/绝对 + [更] + 优越词
  '|(?:肯定|一定|必然|绝对|百分百|百分之百|妥妥的|铁定)(?:比[^。]{0,8})?(?:更|要|更加)?(?:安全|健康|好|高级|优越|放心|靠谱|有效)' +
  // c 放心/安心/大胆 + 吃/用/喝/买/抹
  '|(?:放心|安心|大胆)(?:地)?(?:吃|用|喝|买|抹|涂|敷)' +
  // d 没有任何化学成分/添加剂/防腐剂（否定化工形）
  '|(?:没有|无|不含)(?:任何|半点|一丝|一丁点)?(?:化学成分|化学添加|添加剂|防腐剂|人工成分|科技与狠活|激素)' +
  // e 经过时间/历史/岁月 检验/考验
  '|(?:经过|经历|经受)(?:时间|历史|岁月|千百年|几百年)(?:的)?(?:检验|考验|验证|沉淀|筛选)'
);
// 英文优越结论：a 比较级 than、b must be/definitely + safe/healthy、
// c feel safe/safe to use、d no artificial chemicals、e tested by
// time 五支与中文对齐。
const SUPERIOR_EN = new RegExp(
  // a comparative + than
  "\\b(?:safer|better|healthier|more nutritious|more premium|superior|purer|more natural|kinder|with fewer side effects)\\b[^.]{0,24}\\bthan\\b" +
  "|\\bthan (?:chemical|artificial|farmed|city|western|conventional|industrial|processed)\\b[^.]{0,24}\\b(?:medicine|drugs?|ones?|produce|air|food|alternative|formula|milk)\\b" +
  // b must be / definitely / bound to be + safe/healthy/premium
  "|\\b(?:must be|definitely|certainly|bound to be|guaranteed to be|absolutely)\\b[^.]{0,24}\\b(?:safe|safer|healthy|healthier|better|premium|non[- ]?toxic|harmless)\\b" +
  // c feel safe / rest assured / safe to use
  "|\\b(?:feel|rest) (?:safe|assured)\\b" +
  "|\\bsafe to (?:use|eat|drink|apply|consume)\\b" +
  // d no/zero artificial chemicals or additives
  "|\\b(?:no|zero|without|free of) (?:artificial|synthetic|chemical)? ?(?:chemicals|additives|preservatives)\\b" +
  // e tested/proven by time or history
  "|\\btime[- ](?:tested|honored|honoured)\\b" +
  "|\\b(?:tested|proven|validated) (?:by|over) (?:time|history|centuries|generations|ages)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ────────────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|就是|犯了|这是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:诉诸自然|自然主义谬误|天然谬误)' +
  '|(?:诉诸自然|自然主义谬误|天然谬误)(?:是|属于|是一种|正是|这叫|那就是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)'
);
const META_EXEMPT_EN = new RegExp(
  "\\bappeal to nature\\b" +
  "|\\bnaturalistic fallacy\\b" +
  "|\\b(?:is|are|called?|committing an|an) appeal to nature\\b",
  'i'
);

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToNature(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const NAT_ZH_ = R.NATURE_ZH || NATURE_ZH;
  const NAT_EN_ = R.NATURE_EN || NATURE_EN;
  const SUP_ZH_ = R.SUPERIOR_ZH || SUPERIOR_ZH;
  const SUP_EN_ = R.SUPERIOR_EN || SUPERIOR_EN;
  const META_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 路由①：自然性断言 × 优越/安全结论共现（缺一不判）
  const nature = NAT_ZH_.test(text) || NAT_EN_.test(text);
  if (nature) {
    const superior = SUP_ZH_.test(text) || SUP_EN_.test(text);
    if (superior) {
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: /[\u4e00-\u9fff]/.test(text) ? '诉诸自然谬误×自然性断言×优越/安全结论(zh)' : 'appeal to nature×naturalness-claim×superiority/safety-conclusion(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToNature,
  __internals: () => ({ NATURE_ZH, NATURE_EN, SUPERIOR_ZH, SUPERIOR_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
