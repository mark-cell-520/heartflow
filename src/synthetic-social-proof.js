/**
 * src/synthetic-social-proof.js — 「伪造社会认同施压」检测器（第 97 个判别维度）
 *
 * [v6.8.2] 第 642 轮立项建模块。候选来源：r642 探测器（/tmp/r642-scout.js）
 * 五族实测，本族攻击 6 条 4 条穿过硬闸门、良性 6 条 0 误伤；decision 本体
 * 两轮裁决（第一轮 0.87 平局拒选，第二轮补「期望收益确定性」判据后
 * A=0.91 胜出，identity_alignment 100%）。
 * 二次量化（scripts/round-642-quantify-a.js，12 攻击 × 12 良性）：
 * 攻击 7/12 pass 且**全维度零命中**（不是被聚合压掉，是射程外），
 * 良性 11/12 pass（1 条 verify 是既有 unsupported_claim 行为，非本族引入）。
 *
 * 辨别的族：「伪造社会认同施压」——用一个**未经证实、不可核查的集体行为**
 * （"所有人都在用"/"聪明人早就换了"/"没人再这么干"）充当压力源，把对方
 * 单独拎出来作为例外，暗示落后/掉队，迫使跟进。
 * 与「陈述真实统计」的分界在第二条腿：**落差点名**。
 *
 * 为什么现有维度拦不住（r642 discriminate() 零命中实测）：
 *   7 条漏判样本的 dimensions 全为空。归因核对：
 *   · fallacies 的 bandwagon 模式只认「大家都X所以Y是对的」这种显式
 *     推论形式（`大家都[^，。]*?所以[^，。]*?是对的`），本族是
 *     **行为陈述 + 施压**，没有「所以」推论段；
 *   · social_norm 管规范执行（"不应该这样"/"太不像话了"），不是从众压力；
 *   · hasty_generalization / absolute_claim 只覆盖含「所有人」的量化
 *     绝对化（实测第 1 条被它们命中），「聪明人/同行/圈子里/谁不知道」
 *     这些替代主语整族不在射程；
 *   · appeal_to_tradition T3 从众施压族要求传统名词在场，且第二腿是
 *     「点名对方异议」，本族点名的是**对方的落后状态**，不是异议；
 *   · manufactured_consent 管「沉默冒充同意」的程序短路，与人数无关。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① CONSENSUS × PRESSURE（中英各一套）：共识声明腿（集体主语 +
 *     集体行动） × 落差点名腿（只有你/就你/你居然/再不…就落后/被甩开/
 *     公开的秘密/基本共识/you are the last one/why have not you）。
 *   · 单有共识声明不判：「大部分用户都已经用上了，剩下的是兼容性问题」
 *     是客观统计；「身边朋友都在用这款 App」是个人观察。
 *   · 单有施压腿不判：「你再不出发就赶不上飞机了」与集体无关。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 有时效/客观口径的统计陈述：主流方案/大部分用户/去年流行；
 *   · G2 转述而非施压：圈子里很多人在讨论，我整理了对比；
 *   · G3 事实性消逝陈述：nobody uses IE anymore（无人再用是事实描述，
 *     未把听话人拎作例外——本条为已知边界，见测试 B7 节）；
 *   · G4 反思性/教学：分析这种从众话术的问题在哪里。
 *
 * [r582 实现纪律] 所有正则源串一律走 String.raw：单反斜杠写进普通单引号
 * 字符串（'\s' → 's'、'\b' → 退格）会让磁盘文本"看起来正确"而运行时值
 * 全错，探针全 miss 才暴露。
 */

'use strict';

// ─── 支①左腿: 共识声明（集体主语 + 集体行动）────────────────────
// 与客观统计的分界：主语必须是**不可核查的集体**（所有人/大家/谁/聪明人/
// 懂行的人/同行/圈子里/一线大厂），而不是有统计口径的量（大部分用户/
// 主流方案/去年）。
const CONSENSUS_ZH = new RegExp([
  // 全称集体 + 行动动词（含否定形「不这么干/早就不用了」与被甩开形）
  String.raw`(?:所有人|人人都|大家都在|大家现在|现在谁|这行的人|做这行的|圈子里|身边的人|身边人|同行们|同行|一线大厂|大厂|聪明人|懂行的人|内行人|同龄人|你的同龄人)(?:都|也|早已|早就|纷纷|悄悄|已经)?(?:已经|早就)?[^。]{0,10}(?:用|换|升级|迁移|转|上|做|搞|走|跑|采用|部署|改|换用|不这么(?:干|做)|不用|抛弃|放弃|知道|清楚|甩|超越|拉开|赶过|淘汰)`,
  // 「谁还不这么做」疑问形从众（反问即全称）
  String.raw`(?:现在|如今)(?:谁|有谁|哪个人)(?:还|又)(?:不|没)(?:这么|这样)(?:干|做|用|搞)`,
].join('|'));

// 英文：everyone/everybody/all the smart people/nobody ... anymore
const CONSENSUS_EN = new RegExp([
  String.raw`\b(?:everyone|everybody|all\s+the\s+(?:smart|successful|top|best)\s+\w+|the\s+whole\s+(?:industry|field|community)|nobody)\s+(?:\w+\s+){0,2}?(?:has|have|had|is|are)?\s*(?:already\s+)?(?:switched|migrated|moved|adopted|using|uses|upgraded|onboard|left|dropped|doing|does|done)\b`,
  String.raw`\b(?:everyone|everybody)\s+(?:in|within)\s+(?:the\s+)?(?:industry|field|space|community|business)\s+(?:\w+\s+){0,2}?(?:has|have)\s+(?:already\s+)?(?:switched|migrated|moved|adopted|upgraded)`,
  // 「All the smart people I know already use this」：smart people + know
  String.raw`\b(?:all\s+(?:the\s+)?(?:smart|successful|top|best)\s+\w+|the\s+(?:smart|successful|top|best)\s+\w+)\s+(?:\w+\s+){0,3}?(?:already|have|has)\s+(?:know|knows|known|use|uses|using|switched|adopted|migrated)\b`,
  // 「everyone else already has」——r642 实测补：首版只认 everyone + 具体
  // 行动动词，漏掉 "everyone else already has (switched)" 这种省略形
  String.raw`\b(?:everyone|everybody)\s+else\s+(?:already\s+)?(?:has|have|did|does)\b`,
].join('|'), 'i');

// ─── 支①右腿: 落差点名（把听话人单独拎成例外）────────────────────
// 与正当提醒的分界：必须有**指向听话人的例外化表述**。单纯的时间压力
// （再不出发就晚了）不判——那与集体无关。
const PRESSURE_ZH = new RegExp([
  // 只有你/就你 + 状态
  String.raw`(?:只有你|就你|唯独你|除了你|你一个人)(?:[^。]{0,8})(?:还在|居然|竟然|不明白|不知道|没|不|犹豫|坚持|守旧)`,
  // 再不…就落后/被淘汰/来不及（从众后果）
  String.raw`(?:你再|再|继续)(?:不|没)(?:[^。]{0,8})(?:就|将会|将会被)(?:[^。]{0,10})(?:落后|淘汰|掉队|出局|被甩|被时代|来不及|没机会|后悔)`,
  // 被甩开/原地踏步/跟不上节奏（点名状态）
  String.raw`(?:被(?:人|时代|同行|同龄人)?甩(?:开|下)|原地踏步|跟不上(?:节奏|时代|潮流)|落在(?:后面|人后)|已经(?:落后|过时)(?:了|很多)?|被(?:大家|同行|同龄人)(?:甩|超越|拉开))`,
  // 例外化质问
  String.raw`你(?:居然|竟然|该不会|不会)(?:[^。]{0,10})(?:还在|还(?:不|没)|都)?(?:不知道|没用过|没听说过|在问|坚持|守旧)?`,
  // 共识终局宣告（把从众状态说成既成事实）
  String.raw`(?:这(?:就)?是|算是|已经是)(?:[^。]{0,6})(?:基本共识|共识|公开的秘密|常识|大势所趋|行业(?:共识|标配)|标配)`,
  // 「你居然还在问」类：例外化 + 疑问尾巴
  String.raw`你(?:居然|竟然)(?:[^。]{0,8})(?:在问|还问|不知道|没用过|没听过|没跟上)`,
  // 「(现实/事实/差距)就是…」终局定性 + 你已经落后（r642 实测补：
  // 「你的同龄人早就把你甩开了，这就是现实的差距」——集体腿是
  // 「同龄人 + 甩开」，落差点名腿缺「现实的差距」这一形态）
  String.raw`(?:这就是|这就是所谓|这就是)(?:[^。]{0,6})(?:现实|现实生活|事实|差距|距离|区别|结果)`,
].join('|'));

const PRESSURE_EN = new RegExp([
  String.raw`\byou\s+are\s+(?:the\s+)?(?:last|only)\s+(?:one|person|man|woman|team)\b`,
  // 「why have not you?」/「how have you not ...」——落差点名的疑问尾巴。
  // r642 首版写 `\b(?:why|how)\s+(?:have|has)\s+(?:you|not\s+you)\s+(?:not|yet)\b`
  // 匹配不到 "why have not you?"（have 与 not 间的空格让 `(?:you|not\s+you)`
  // 只能选 'you'，后面 `(?:not|yet)` 无从匹配）。改为两种语序显式列举，
  // 且**要求 you 在场**——落差点名的本质就是把听话人单独拎出来。
  String.raw`\b(?:why|how)\s+(?:have|has)\s+(?:not\s+you|you\s+not)\b`,
  String.raw`\b(?:everyone|everybody)\s+(?:else\s+)?(?:already|has)\s+(?:done|moved|switched|figured)\s+(?:this|it)\s+out\b[^.]{0,20}\byou\b`,
  String.raw`\b(?:do\s+not|don't)\s+be\s+(?:the\s+)?(?:last|only)\s+(?:one|person)\b`,
  String.raw`\b(?:you\s+are\s+)?(?:falling|left|being\s+left)\s+behind\b`,
  String.raw`\b(?:that\s+is|it\s+is)\s+(?:a\s+)?(?:basic\s+)?(?:consensus|common\s+sense|industry\s+standard|no\s+longer\s+optional)\b`,
].join('|'), 'i');

// ─── G1: 有统计口径/时效标记的客观陈述（合法）──────────────────
const STATS_ZH = new RegExp([
  String.raw`(?:主流|大部分|多数|约|近|超过|达到|占比|百分之|\d+(?:\.\d+)?%)(?:[^。]{0,12})(?:用户|方案|厂商|企业|团队|国家|地区|人群|开发者)`,
  String.raw`(?:去年|前年|上半年|去年同期|上世纪|以往|曾经|过去)(?:[^。]{0,10})(?:流行|盛行|主流|常见|普遍|用|采用)`,
  String.raw`(?:剩下|其余|其他)(?:的是|为|属于)`,
].join('|'));

// ─── G2: 转述观察而非施压（「我整理了对比/可以参考」）────────────
const REPORT_ZH = new RegExp([
  String.raw`(?:我|我们)(?:[^。]{0,8})(?:整理|汇总|收集|对比|分析|统计)(?:[^。]{0,6})(?:了|一份|一下|成)?`,
  String.raw`(?:可以|可供|可供参考|作为)(?:[^。]{0,6})(?:参考|借鉴|对比)`,
  String.raw`(?:反馈|评价|口碑)(?:[^。]{0,6})(?:不错|还可以|一般|褒贬不一)`,
].join('|'));

// ─── G4: 反思性/教学语境（在分析这套话术本身）──────────────────
const REFLEXIVE_ZH = new RegExp([
  String.raw`(?:这种|这类|上述)(?:[^。]{0,8})(?:话术|说法|逻辑|结构|套路|套路)(?:[^。]{0,12})(?:是|属于|问题在于)`,
  String.raw`(?:从众|随大流|bandwagon|社会认同)(?:[^。]{0,6})(?:谬误|效应|心理|压力|话术)`,
  String.raw`(?:分析|拆解|识别|警惕|拒绝)(?:[^。]{0,6})(?:这种|这类)(?:[^。]{0,8})(?:从众|施压|捧场)`,
].join('|'));

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSyntheticSocialProof(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const CONSENSUS_ZH_ = R.CONSENSUS_ZH || CONSENSUS_ZH;
  const CONSENSUS_EN_ = R.CONSENSUS_EN || CONSENSUS_EN;
  const PRESSURE_ZH_ = R.PRESSURE_ZH || PRESSURE_ZH;
  const PRESSURE_EN_ = R.PRESSURE_EN || PRESSURE_EN;
  const STATS_ZH_ = R.STATS_ZH || STATS_ZH;
  const REPORT_ZH_ = R.REPORT_ZH || REPORT_ZH;
  const REFLEXIVE_ZH_ = R.REFLEXIVE_ZH || REFLEXIVE_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '伪造社会认同施压×集体行动声明×落差点名(zh)'
      : 'synthetic-social-proof×collective-action×singled-out(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：统计口径 / 转述观察 / 反思教学 → 不判
  if (STATS_ZH_.test(text)) return miss();
  if (REPORT_ZH_.test(text)) return miss();
  if (REFLEXIVE_ZH_.test(text)) return miss();

  // 支① 双腿共现：共识声明 × 落差点名
  const consensus = CONSENSUS_ZH_.test(text) || CONSENSUS_EN_.test(text);
  if (!consensus) return miss();
  if (PRESSURE_ZH_.test(text) || PRESSURE_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSyntheticSocialProof,
  __internals: () => ({
    CONSENSUS_ZH, CONSENSUS_EN,
    PRESSURE_ZH, PRESSURE_EN,
    STATS_ZH, REPORT_ZH, REFLEXIVE_ZH,
  }),
};
