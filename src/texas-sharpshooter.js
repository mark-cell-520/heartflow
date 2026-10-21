/**
 * src/texas-sharpshooter.js — 「德州神枪手」检测器（第 149 个判别维度）
 *
 * [r718 立项] decision 本体选出（scripts/decide-r718-round2.js，首轮
 * A/C 打平 0.85 弃权后按实测差异细化判据重跑，composite_score
 * 0.87 / confidence 0.85 / identity alignment 0.8）。候选池来自 r718
 * 探测器（scripts/round-718-family-probe.js）在当前引擎（v6.8.63，
 * 148 维）上逐族复测：攻击漏判 8/9（89%）、真零命中 8/8、良性
 * 0/9 误伤。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 * r717 的 texas_sharpshooter 候选（漏判 8/9 同数字）本轮复量仍成立，
 * 是 r716/r717/r718 三轮记录的「先有结论再画靶心」预测伪装窄口。
 *
 * 辨别的族：德州神枪手谬误（Texas sharpshooter fallacy）——**先开枪
 * 再画靶心，先有结论再回头挑数据凑规律，把随机噪声讲成必然规律，
 * 把事后凑的规律讲成先见之明**：
 *   先开枪再画靶心，怎么解释都说得通。
 *   他先有了结论，再回头找数据凑出规律。
 *   数据里随机出现的巧合，被他讲成了必然规律。
 *   先定好答案，再从一堆数据里挑出能对上的一段。
 *   事后把散落的点连起来，说这就是趋势。
 *   结果出来之后才划定范围，然后宣称预测精准。
 *   He drew the target around the bullet holes and called it accuracy.
 *   They found a pattern in random noise and presented it as a law.
 *   She decided the conclusion first, then picked the data that fit.
 *
 * 与既有维度的边界（r718 归因）：
 *   · cherry_picking（第 148 维，r717）管**单边证据的隐瞒动作**（只
 *     挑/略过/删掉 × 有利/不利对照），本族管**事后划定范围的预测伪
 *     装**（先开枪再画靶/事后连点成线 × 噪声被讲成规律）——cherry_
 *     picking 实测能覆盖「先定好答案，再从一堆数据里挑出能对上的一
 *     段」一条（「挑出」×「对上」形状），但画靶心族整体仍漏判 8/9；
 *   · pseudo_causal 管**虚假因果机制**（A 导致 B 的具体机制错误），
 *     本族管**事后拟合的预测伪装**（规律是倒着画出来的）；
 *   · statistical_misleading 管**统计数据的呈现误导**（百分比滥
 *     用/基数隐藏），本族管把随机波动当成规律呈现；
 *   · hasty_generalization 管**匆忙归纳**（小样本下的一般化），本
 *     族管样本倒着挑（先有靶心后开枪）；
 *   · 其余 148 个维度对本族 8 条漏判样本实测零命中 8/8。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① POSTHOC 事后拟合——先开枪再画靶/先有结论再回头/事后/之
 *     后才划定/先定好答案再挑/先射箭再画靶/事后诸葛（中）；drew the
 *     target around / after the fact / afterwards / worked backwards /
 *     reverse-engineered / decided the conclusion first / connected
 *     the dots after（英）；
 *   · 腿② = 腿②a NOISE_SRC 噪声来源 × 腿②b LAW_PRESENT 规律呈现：
 *     噪声源=巧合/随机/波动/噪声/散点/偶然（中；random noise /
 *     coincidence / randomness / scattered / noise 英），规律呈现=把
 *     噪声讲成规律的动作（讲成必然规律/说这就是趋势/划定范围宣称精
 *     准/挑出能对上的（中）；presented it as a law / called it
 *     accuracy / found a pattern in random noise / picked the data
 *     that fit（英））；
 *   · 双通路：通路一 posthoc×noise×law（腿①×腿②，事后拟合的预测
 *     伪装）；通路二 noise×law（纯噪声被直接讲成规律，如「数据里
 *     随机出现的巧合，被他讲成了必然规律」无显式事后词）；
 *   · 缺腿不判：只有腿①（「事后想起来有点后怕」）是正常的时间叙
 *     述；只有腿②a（「数据里有些波动」）是正常的数据描述；只有
 *     腿②b（「这个规律在三个独立数据集上都复现了」）是正当的规律
 *     报告——必须噪声源×规律呈现共现。
 *
 * 为什么取 VERIFY 级：单句可能是正当的统计诚实陈述（样本量小差异可
 * 能是随机波动/预先注册假设/多重比较校正/独立样本验证/holdout 检
 * 验/规律未复现）、正当的方法复盘（连接散点前先做显著性检验）、
 * 元话语概念分析（德州神枪手谬误是一种事后拟合）。verify 的含义
 * 是「这个规律的来历可疑——疑似先有结论后画靶心，需要核对规律的
 * 推导顺序」，调用方应要求先声明假设再检验，而不是接受倒着画的
 * 规律。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（德州神枪手/先开枪再画靶/事后诸葛亮/先射箭
 *     再画靶/马后炮字样作为被分析对象；EN: Texas sharpshooter /
 *     drawing the target around / post-hoc fallacy 作概念名在场）：
 *     分析这套谬误本身不是运用它——但注意「先开枪再画靶心，怎么解
 *     释都说得通」这类攻击样本本身就以成语形式陈述运用，豁免只认
 *     「是一种/谬误/fallacy/定义上」等概念分析语境标记在场时生效；
 *   · 方法透明度在场（预先注册/预注册/独立样本/holdout/多重比较/
 *     显著性检验/复现/局限性/pre-registered/holdout/multiple
 *     comparison/control group/limitations）：声明了假设先于检验
 *     或报告了完整检验结果的是正当科研陈述；
 *   · 第三人称专业复盘（统计学家/审稿人/方法论/评审指出；EN:
 *     statistician/reviewer/methodologist）：专业角色指出事后拟合
 *     问题。
 */
'use strict';

// ─── 腿①：事后拟合（中文）──────────────────────────────────────────
// 注意「事后把散落的点连起来」型：事后与动词之间允许 ≤6 字间隔
const POSTHOC_ZH = /(?:先开枪|先射箭|先打枪|先定好答案|先有结论|先下结论|事后(?:[^。，；]{0,6})?(?:划定|连|找|补|凑|诸葛|想|画|挑|圆)|之后才(?:划定|连|找|补|凑)|出(?:结果|来)(?:之)?后(?:[^。，；]{0,4})?(?:才)?(?:划定|连|找|补|凑)|公布后(?:[^。，；]{0,4})?(?:才)?(?:划定|连|找|补|凑)|结果(?:出来|出来之|出)后(?:[^。，；]{0,4})?(?:才)?(?:划定|连|找|补|凑)|再回头(?:找|补|凑|挑)|回头(?:找|补|凑|挑)数据|倒(?:着)?(?:画|推|找)|事后诸葛亮|马后炮)/;

// ─── 腿①：事后拟合（英文）──────────────────────────────────────────
const POSTHOC_EN = /\b(?:drew\s+the\s+target\s+around|drawing\s+the\s+target\s+around|drew\s+the\s+bullseye\s+around|after\s+the\s+fact|afterwards|worked\s+backwards?|worked\s+backward|reverse[- ]?engineered|decided\s+the\s+conclusion\s+first|picked\s+the\s+data\s+first|picked\s+the\s+data\s+that\s+fit|chose\s+the\s+data\s+that\s+fit|connected\s+the\s+dots\s+after|drew\s+the\s+circle\s+after|moved\s+the\s+goal\s+after|chose\s+the\s+target\s+after)\b/i;

// ─── 腿②a：噪声来源（中文）────────────────────────────────────────
const NOISE_SRC_ZH = /(?:随机|巧合|偶然|碰巧|噪声|噪音|散落的?点|散点|波动|起伏)/;

// ─── 腿②a：噪声来源（英文）────────────────────────────────────────
const NOISE_SRC_EN = /\b(?:random\s+(?:noise|data|fluctuation|coincidence|scatter)|the\s+noise|coincidence|randomness|scattered\s+(?:data|points|dots)|spurious\s+(?:correlation|pattern)|noise)\b/i;

// ─── 腿②b：规律呈现（把噪声讲成规律的动作，中文）──────────────────
const LAW_PRESENT_ZH = /(?:(?:讲成|当成|说成|说这是|说这就是|说这|凑成|凑出|凑了|连成|连起来|拼成|描绘成|渲染成|包装成|伪装成|硬说成|硬说|说成是|发现了|找出)(?:[^。，；]{0,10})?(?:规律|法则|定律|趋势|必然|定论|真理)|(?:怎么|无论)(?:解释|说|讲|圆)(?:都)?(?:说得通|对|圆得通|讲得通)|划定范围|画(?:个|了)?靶心|画个?圆心|宣称(?:预测)?(?:精准|准确|很准|神准)|(?:未卜)?先知|先见之明|料事如神|神机妙算|挑出[^。，；]{0,8}(?:能对上|对得上|对得上号|凑得上|说得通|圆得上))/;

// ─── 腿②b：规律呈现（把噪声讲成规律的动作，英文）──────────────────
const LAW_PRESENT_EN = /\b(?:presented\s+it\s+as\s+(?:a\s+)?(?:law|trend|pattern|rule|proof|truth)|presented\s+(?:random\s+noise|the\s+noise|coincidence|randomness|the\s+scattered\s+data|scattered\s+data)\s+as\s+(?:a\s+)?(?:law|trend|pattern|rule|proof|truth)|presented\s+as\s+(?:a\s+)?(?:law|trend|pattern|rule|proof|truth)|treated\s+(?:the\s+)?(?:random\s+noise|noise|coincidence|randomness)[^.]{0,30}?\s+as\s+(?:a\s+)?(?:law|trend|pattern|rule|proof|truth)|turned\s+(?:the\s+)?(?:random\s+noise|noise|coincidence|randomness)\s+into\s+(?:a\s+)?(?:law|pattern|trend|rule|proof)|(?:random\s+noise|noise|coincidence|randomness|scattered\s+data)\s+wa[rs]\s+turned\s+into\s+(?:a\s+)?(?:law|pattern|trend|rule|proof)|called\s+it\s+(?:a\s+)?(?:accuracy|pattern|precision|trend|evidence|law|proof|rule)|fitted\s+(?:a\s+)?(?:curve|pattern|line)\s+(?:to|into)\s+(?:the\s+)?(?:noise|data|scattered)|picked\s+the\s+data\s+that\s+fit|chose\s+the\s+data\s+that\s+(?:fit|matched|supported)|claimed\s+(?:a\s+)?(?:proven\s+)?(?:rule|law|pattern|trend|proof)|predicted\s+(?:it\s+)?(?:accurately|with\s+perfect\s+accuracy|precisely|perfectly)|found\s+(?:a\s+)?pattern\s+in\s+(?:random\s+noise|the\s+noise|coincidence|randomness|the\s+scattered|scattered\s+data)|reverse[- ]?engineered\s+(?:a\s+)?(?:law|pattern|trend|rule|proof))\b/i;

// ─── 豁免一：元话语/概念引述（概念分析语境在场）
// 注意：攻击样本「先开枪再画靶心」本身含成语，但无概念分析语境标记
// （是一种/谬误/fallacy/definition），不触发本豁免
const META_DISCOURSE = /(?:(?:德州神枪手|先开枪再画靶|先射箭再画靶|事后诸葛亮|马后炮|靶心谬误|神枪手谬误)(?:[^。，；]{0,10}?)(?:是|属于|属于一|是一|叫做|称为|定义|逻辑谬误|谬误|fallacy|错误|陷阱|手段|方式|套路)|(?:是|属于|一种|一类)(?:[^。，；]{0,12}?)(?:德州神枪手|先开枪再画靶|先射箭再画靶|事后诸葛亮|马后炮|靶心谬误|神枪手谬误)|Texas\s+sharpshooter(?:\s+fallacy)?|drawing\s+the\s+target\s+around\s+(?:is|refers|means)|sharpshooter\s+fallacy|post[- ]hoc\s+fallacy|this\s+is\s+(?:called|known\s+as)\s+the\s+Texas)/i;

// ─── 豁免二：方法透明度在场（假设先于检验/完整报告是正当科研陈述）
const METHOD_TRANSPARENT = /(?:预先注册|预注册|预先(?:设定|登记|声明)|事先(?:声明|设定|公布)|独立样本|holdout|多重比较|多重检验|显著性(?:检验|水平|校正)|统计显著性|校正|复现|可复现|重复性|局限性|局限部分|报告(?:了)?所有|包括不显著|对照(?:组|实验)|样本外|交叉验证|pre-?registered|preregistered|independent\s+(?:sample|dataset|replication|validation)|holdout|multiple\s+comparison|bonferroni|significance\s+(?:test|level|correction)|statistical\s+significance|replicat|cross[- ]?validat|out[- ]of[- ]sample|control\s+group|reported\s+all|limitations?)/i;

// ─── 豁免三：第三人称专业复盘（专业角色指出事后拟合问题）──────────
const THIRD_PERSON_EXEMPT = /(?:统计学家|审稿人|方法学|方法论|评审(?:意见|指出)|教授说|老师说|专家指出|审稿|statistician|reviewer|methodologist|professor|peer\s+reviewer|editor\s+noted)/i;

/**
 * 中文路由（双通路，腿②b 承重）：
 *   通路一 posthoc×law：腿①事后拟合 × 腿②b 规律呈现（先开枪再画靶）
 *   通路二 noise×law：腿②a 噪声源 × 腿②b 规律呈现（随机巧合讲成规律）
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const posthoc = R.POSTHOC_ZH || POSTHOC_ZH;
  const noiseSrc = R.NOISE_SRC_ZH || NOISE_SRC_ZH;
  const lawPresent = R.LAW_PRESENT_ZH || LAW_PRESENT_ZH;
  if (!lawPresent.test(text)) return null;
  if (posthoc.test(text)) return { route: 'zh:posthoc×law' };
  if (noiseSrc.test(text)) return { route: 'zh:noise×law' };
  return null;
}

/**
 * 英文路由（双通路，腿②b 承重）：同中文路由结构。
 */
function checkEn(text, R) {
  const posthoc = R.POSTHOC_EN || POSTHOC_EN;
  const noiseSrc = R.NOISE_SRC_EN || NOISE_SRC_EN;
  const lawPresent = R.LAW_PRESENT_EN || LAW_PRESENT_EN;
  if (!lawPresent.test(text)) return null;
  if (posthoc.test(text)) return { route: 'en:posthoc×law' };
  if (noiseSrc.test(text)) return { route: 'en:noise×law' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkTexasSharpshooter(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_DISCOURSE_ = R.META_DISCOURSE || META_DISCOURSE;
  const METHOD_TRANSPARENT_ = R.METHOD_TRANSPARENT || METHOD_TRANSPARENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_DISCOURSE_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 方法透明度在场 → 假设先于检验或完整报告的是正当科研陈述
  if (METHOD_TRANSPARENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称专业复盘：专业角色指出事后拟合问题
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
        ? `德州神枪手×事后拟合的预测伪装(${r.route})`
        : `Texas sharpshooter×post-hoc fitting(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkTexasSharpshooter,
  __internals: () => ({
    POSTHOC_ZH, POSTHOC_EN, NOISE_SRC_ZH, NOISE_SRC_EN, LAW_PRESENT_ZH, LAW_PRESENT_EN,
    META_DISCOURSE, METHOD_TRANSPARENT, THIRD_PERSON_EXEMPT,
  }),
};
