/**
 * src/censoring-neglect.js — 「删失数据/有限随访当完整结论」检测器
 * （r387 新建：econ_reasoning_gate 聚合族第 39 子族 / 插件层第 44 族，stats 组）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r387 立项探针（scripts/round-387/probe-pool.js + probe-scope.js，v6.8.192
 *   基线）：首段 8 个候选族同池实测——百分点vs百分比 0/7（存量 statistical_
 *   misleading 等全代拦且良性误伤 2，放弃）、censoring_neglect 1/6、regress-
 *   ion_effect 1/6、ratio_averaging 1/6、aggregate_reversal 1/6、多组未校正
 *   0/6、PPV 误读 0/6、发表偏误 0/5。二段对四个有穿透候选各扩 12-14 条攻
 *   击（中英双语、裸名词、带修饰、倒装、长句）：
 *     · censoring_neglect **9/12 穿透**（真零命中，无任何维度承重），
 *       良性 8/8 全 pass——全场最高穿透且良性边界最净；
 *     · regression_effect 仅 3/14 且良性被 perfect_error 误伤 2（放弃）；
 *     · 其余候选 0/12（存量覆盖充分）。
 *   射程确认：immortal_time_bias 只收「起点不一致/起点后移」形（治疗起算 vs
 *   确诊起算、landmark 后移），本族收「随访期未结束/删失被当完整结局」形，
 *   两者前提不同、射程不重叠。
 *
 * 外部来源：空返——r387 阶段1 三层扫描（HN Algolia query=statistical
 * fallacy 仅 2012 年旧文；Semantic Scholar 429 限流；GitHub 50 个 fallacy
 * 仓库均为 LLM-based 或低星，与心虫纯规则引擎定位不符），按既有形态自建
 * （同 r232/r367/r386 记录）。家族定义取自生存分析/临床试验解释的标准纪律：
 *   随访期未结束时的数据是**删失数据（censored）**——患者尚未到达研究终
 *   点、尚未复发、尚未死亡、尚未失联，其结局未知。把删失数据直接当完整
 *   结局读（「观察满一年全部健在 → 一年生存率 100% → 新药完胜」「试验才
 *   到第三年 → 可以宣告有效」「早期无一人死亡 → 数据已经证明更安全」），
 *   是生存分析与临床试验解读中最高频的证据纪律错误之一：删失患者的后续
 *   结局完全可能改变结论，且随访期越长、删失越多，早期「零事件」的断言
 *   越不可外推。
 *
 * 辨别的族：删失数据当完整结论（censoring neglect）——文本同时给出两个
 *   信号：
 *   腿① WINDOW 随访窗口未结束锚在场——随访/观察/统计时点尚未到期（「只
 *         有 18 个月」「随访一年」「试验进行到第三年」「截至目前」「研
 *         究开始时」；EN only N months of follow-up / with just one year /
 *         at 12 months / the trial is ongoing / so far）；
 *   腿② COMPLETE 完整结论断言在场——把上述窗口内的数据当成最终证据（「因
 *         此一年生存率 100%」「可以宣告新药有效」「数据已经证明」「疗效
 *         确凿」「这就证明」「无一人死亡，说明 100% 有效」；EN therefore
 *         … is proven / already show / confirms the diagnosis / proves the
 *         drug / 100% effective）。
 *   两腿近距共现（以腿②为锚，腿①须落窗内：ZH 60 字 / EN 200 字符），且
 *   两腿之间须见推断标记（因此/所以/说明/证明/意味着/可见/足以/宣告；
 *   EN so / therefore / means / proves / shows / confirms / already）——
 *   结论是由不完整窗口**推出来的**，而不是把随访状态并列陈述（「新药组观
 *   察满一年时无死亡病例，但随访期太短」是两个并列事实+限定，不判）。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 正确的谨慎陈述（「随访期太短，还不能下结论」「早期数据只能作为初
 *     步信号」「更长时间的观察可能改变结论」）腿②缺失——完整结论断言族
 *     不收限定/存疑措辞，天然不判；
 *   · 概念教学（删失数据的患者仍在观察中 / censored observations have
 *     unknown outcomes）由 CONCEPT 豁免（防「删失不等于治愈」前缀绕过，
 *     r368/r379 同款教训）；
 *   · 已完成随访的正确结论（十年随访后 / after ten years of follow-up,
 *     …）由 COMPLETED 豁免；
 *   · 与 immortal_time_bias（起点不一致/起点后移）、survivor_time_bias
 *     （幸存者时间偏误）、completion_evidence（完成度证据）、perfect_
 *     error（完美无缺断言）射程不重叠：本族判**随访窗口未结束就下完整
 *     结论**，不论起点选择、不论幸存者资格、不论完成度陈述格式。
 *
 * 判据（两腿近距共现 + 推断标记 + 三组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿① WINDOW 随访窗口未结束锚在场（窗口未到期 ZH/EN + 删失词 ZH/EN）；
 *   ② 腿② COMPLETE 完整结论断言在场（断言族 ZH/EN）；
 *   ③ 两腿之间须见推断标记（限定性前缀后的连接词不算）；
 *   ④ 两腿须落在邻近窗内（以腿②为锚，ZH 60 字 / EN 200 字符），方向不限；
 *   ⑤ 豁免 A 概念讨论（删失/删失数据区别本身的教学/批评句）；
 *   ⑥ 豁免 B 已完成随访的正确结论（十年随访/完整随访后……）；
 *   ⑦ 腿②守卫：紧前否定窗 + 对冲短语（「还不能下结论」「不足以证明」）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项进行中研究的中期状态
 * （「试验进行到第三年，新药组复发数少于对照组」——并列事实无推断标记，
 * 天然不判），命中的是把未结束随访期的数据直接当最终疗效证据的断言。
 * verify 的语义是「这段文本用删失数据下了完整结论，先把随访完整性与
 * 删失处理对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 谨慎限定陈述（随访期太短/还不能下结论/初步信号）——腿②缺失；
 *   · 并列随访状态无推断标记（随访只有 18 个月；新药组复发数少于对照组）；
 *   · 已完成随访的正确结论（十年随访后新药组存活人数更多）——COMPLETED 豁免；
 *   · 概念教学与批评句（删失数据结局未知/censored ≠ cured）——CONCEPT 豁免；
 *   · immortal_time_bias / survivor_time_bias / completion_evidence /
 *     perfect_error 领地。
 */

'use strict';

// ─── 腿① WINDOW 随访窗口未结束锚 ─────────────────────────
// a) 窗口未到期（中文）：限定随访时长 + 未完成标记（只/仅/才/尚/目前/
//   截至/刚开始）+ 时间词；「随访只有 18 个月」「试验进行到第三年」「截至
//   统计时点」「研究开始时」。注意含裸时间词形（161 轮教训：裸名词形态必收）。
const WINDOW_ZH = [
  /(?:随访|观察|统计|追踪|研究|试验)[^。！？，；\n]{0,12}(?:只有|仅有|仅为|才|尚|仅|只)[^。！？，；\n]{0,8}(?:个?月|年|个月|天|周)/,
  /(?:随访|观察|统计|追踪|研究|试验)[^。！？，；\n]{0,14}(?:进行到|进入|到了|截至|截止|截至到)[^。！？，；\n]{0,10}(?:年|月|时点|阶段|期)/,
  /(?:只有|仅有|才|刚刚|尚)[^。！？，；\n]{0,6}(?:个?月|年|个月|天|周)[^。！？，；\n]{0,12}(?:随访|观察|数据|资料)/,
  /(?:截至目前|截止目前|到目前为止|迄今|到目前为止|统计时点|研究开始时|试验开始时)/,
  /(?:早期数据|早期结果|初步数据|初步结果|目前数据|目前结果|现阶段数据)/,
  /(?:随访|观察|追踪)[^。！？，；\n]{0,10}(?:期内|期间|未结束|未完|仍在进行|还在进行|尚在)/,
  /(?:研究|试验)[^。！？，；\n]{0,10}(?:提前结束|中止|终止|暂停|仍在进行|还在进行|尚未结束)/,
  // 非限定完成形：观察满一年/随访三年时/随访两年内/观察 12 个月时——
  // 「满 N」表示随访窗口刚到、尚未超出（161 轮教训：裸名词形态必收，
  // 否则「观察满一年时全部健在 → 一年生存率 100%」整句漏判）
  /(?:随访|观察|追踪|统计)[^。！？，；\n]{0,6}(?:满|满打|满共)[^。！？，；\n]{0,6}(?:个?月|年|个月|天|周)/,
  /(?:随访|观察|追踪)[^。！？，；\n]{0,8}(?:个?月|年|个月)[^。！？，；\n]{0,4}(?:时|时点|期内|期间|之内|以内)/,
  // 尚未结束/不足 N/进行到一半/进行到第 N 形（r387 实测：「随访尚未
  // 结束，已有数据说明」「随访不足一年，但复发数更低」「随访进行到
  // 一半，无严重不良反应，可见新药更安全」整族漏判）
  /(?:随访|观察|追踪|研究|试验)[^。！？，；\n]{0,6}(?:尚未结束|还未结束|没有结束|未完|未完成|不足|不到|未满|短于)/,
  /(?:随访|观察|追踪)[^。！？，；\n]{0,10}(?:进行到|到)(?:一半|过半|第[一二三四五六七八九十\d]+(?:年|月|阶段))/,
  // 队列失访率高/删失多 + 已入组病例全部存活形（r388 实测：「该队列目
  // 前失访率还很高，但已入组的病例全部存活，因此该人群的预后非常好」
  // 整句漏判——原族只收「随访 N 形」锚，不收失访率锚）
  /(?:队列|队列研究|该组|本研究)[^。！？，；\n]{0,12}(?:失访|脱落|删失)[^。！？，；\n]{0,8}(?:率高|很多|较多|不少|大量)/,
  /(?:失访|脱落|删失)[^。！？，；\n]{0,6}(?:率|比例|人数)[^。！？，；\n]{0,8}(?:还|仍|尚且|依然)[^。！？，；\n]{0,4}(?:很高|较高|不低)/,
];
// b) 窗口未到期（英文）：only/just + N + time + follow-up；the trial is
//   ongoing；at N months；so far；early data；follow-up of N。
const WINDOW_EN = [
  // 英文数词形（two years/three months…）+ 数字形（2 years）均收——r387
  // 实测：`\d+` 不匹配 "two"，导致 "With only two years of follow-up"
  // 整句漏判（161 轮裸名词教训的英文对应）
  /\b(?:only|just)\s+(?:a\s+)?(?:few\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty)\s*(?:months?|years?|weeks?|days?)\s*(?:of\s+)?(?:follow[\s-]?up|observation|data)/i,
  /\bwith\s+(?:only\s+)?(?:just\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty)\s*(?:months?|years?|weeks?)\s+of\s+follow[\s-]?up/i,
  // only/just N [time] into the trial/study 形（r387 实测：「Only 18 months
  // into the trial, every patient … still alive, so the cure rate is 100%」
  // 整句漏判——原 only 正则要求 follow-up/observation 紧跟）
  /\b(?:only|just)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty)\s*(?:months?|years?|weeks?)\s+into\s+the\s+(?:trial|study|experiment|research)/i,
  // still recruiting / enrollment ongoing 形（r387 实测：「The trial is
  // still recruiting, and early outcomes already suggest …」整句漏判）
  /\bthe\s+(?:trial|study)\s+is\s+still\s+(?:recruiting|enrolling|enrollment\s+ongoing|in\s+progress)/i,
  /\b(?:at|after|by)\s+\d+\s*(?:months?|years?)\b[^.]{0,60}\b(?:no|zero|none)\b/i,
  /\b(?:the\s+)?(?:trial|study|experiment|research)\s+(?:is\s+)?(?:still\s+)?(?:ongoing|underway|in\s+progress|not\s+(?:yet\s+)?(?:complete|finished|concluded))/i,
  /\bso\s+far\b[^.]{0,60}\b(?:no|nobody|none|not\s+a\s+single)\b/i,
  /\b(?:early|preliminary|initial|interim)\s+(?:data|results?|findings?|analysis)\b/i,
  /\b(?:follow[\s-]?up|observation)\s+(?:of|was|lasted)\s+(?:only\s+)?\d+\s*(?:months?|years?|weeks?)\b/i,
  /\bstudy\s+(?:ended|stopped)\s+(?:early|prematurely)\b/i,
  // followed/watched for only N months and none/nobody had died 形（r388
  // 实测：「Patients in the treatment arm were followed for only 12
  // months and none had died, so one-year survival is 100%」整句漏判——
  // 原 with/of 正则不收 followed for only ... and none ... 形）
  /\b(?:followed|observed|watched|tracked|monitored)\s+for\s+(?:only\s+)?(?:just\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty)\s*(?:months?|years?|weeks?)\b[^.]{0,60}\b(?:and|but|yet)\b[^.]{0,20}\b(?:none|nobody|no\s+one|not\s+a\s+single)\b/i,
  // N months in, there have been no recurrences 形（r388 实测：「Eighteen
  // months in, there have been no recurrences, so the new therapy has
  // achieved a clinical cure」整句漏判——原 only/just 锚不收「N months in」）
  /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty)\s*(?:months?|years?|weeks?)\s+in\b[^.]{0,60}\b(?:no|zero|none|not\s+a\s+single)\b/i,
];
// c) 删失词（中英，独立腿：文本明说结局未定/患者仍在观察）
const CENSOR_ZH = [
  /(?:删失|截尾|失访|失联|脱落|退出研究|尚未观察到|未观察到结局|结局未定|结局未知|仍在观察|仍在随访)/,
];
const CENSOR_EN = [
  /\b(?:censored|censoring|loss\s+to\s+follow[\s-]?up|dropped\s+out|withdrew\s+from\s+the\s+(?:study|trial)|outcome\s+(?:is\s+)?(?:unknown|not\s+yet\s+(?:observed|known))|still\s+(?:under\s+)?(?:observation|follow[\s-]?up))\b/i,
];

// ─── 腿② COMPLETE 完整结论断言 ───────────────────────────
// a) 断言族（中文）：把窗口内数据当最终证据（因此/证明/宣告/确凿/100%/
//   完胜/足以/充分说明 + 有效/安全/疗效/确诊）。含裸名词形（「数据已经
//   证明」「疗效确凿」无谓语动词也可命中）。
const COMPLETE_ZH = [
  /(?:数据|结果|证据|研究|试验)[^。！？，；\n]{0,10}(?:已经|就已|就已|足以|充分)(?:证明|证实|表明|说明)/,
  /(?:可以|足以|能够|理应)(?:宣告|宣布|断定|下定|得出)[^。！？，；\n]{0,8}(?:结论|有效|成功|胜出|完胜)/,
  /(?:因此|足见)(?:一年|两年|三年|短期)?(?:生存率|治愈率|有效率|缓解率|成功率)[^。！？，；\n]{0,6}(?:100|百分之百|满)/,
  /(?:疗效|效果|结论)[^。！？，；\n]{0,8}(?:确凿|确证|实锤|板上钉钉|毋庸置疑|毫无疑问)/,
  /(?:无一人|没有人|无一例|零(?:死亡|复发|事件|感染))[^。！？，；\n]{0,10}(?:说明|证明|意味着|足以)/,
  /(?:完全|彻底|百分百|百分之百)(?:有效|治愈|成功|安全)/,
  /(?:新药|疗法|治疗|疫苗|方案)[^。！？，；\n]{0,8}(?:完胜|大获全胜|碾压|吊打)/,
  // 这/这就证明 X 更有效/更好/更安全 形（r387 实测：「随访仅 6 个月……
  // 这证明新药更有效」整句漏判——原族只收「数据已经证明」主语形）
  /(?:这|这就|这足以|这已|这已经)(?:证明|说明|表明)[^。！？，；\n]{0,8}(?:更|最)(?:有效|好|安全|成功|优)/,
  /(?:疗效|效果|结论)[^。！？，；\n]{0,6}(?:无可争议|无可辩驳|无可置疑|不容置疑|不容争辩)/,
  // 说明/可见/足以说明 + X 更有效/更安全/更低/更高 形（r387 实测：
  // 「随访尚未结束，已有数据说明新药更有效」「随访不足一年，但复发
  // 数明显更低，说明新药有效」「随访进行到一半，无严重不良反应，可
  // 见新药更安全」整族漏判——原族只收「数据已经证明」主语形）
  /(?:说明|可见|足以说明|足以证明|足以表明)[^。！？，；\n]{0,10}(?:更|明显更|显著更|最)(?:有效|安全|好|优|成功)/,
  /(?:说明|可见|足以说明|足以证明|足以表明)[^。！？，；\n]{0,12}(?:复发数|死亡率|不良反应|事件数|风险)[^。！？，；\n]{0,6}(?:更低|更少|更高|更优|显著)/,
  // 说明/可见 X（新药/疗法）有效/安全 裸断言形（r387 实测：「随访不足
  // 一年……说明新药有效」——原族只收带「更」的比较形）
  /(?:说明|可见|足以说明|足以证明|足以表明)[^。！？，；\n]{0,10}(?:新药|疗法|治疗|疫苗|方案|药物)(?:是)?(?:有效|安全|成功|优)/,
  /(?:已有数据|现有数据|目前数据|早期数据)[^。！？，；\n]{0,6}(?:说明|证明|表明|显示)/,
  // 一年/两年生存率（是|为）100% 形（r388 实测：「新药组观察满一年时无
  // 一人死亡，可见这种新药的一年生存率是100%，疗效完胜对照组」整句漏判
  // ——原族只收「因此一年生存率100%」的因此形，不收「是/为 100%」裸断言形）
  /(?:一年|两年|三年|短期|一年内|两年内)(?:生存率|治愈率|有效率|缓解率|成功率)[^。！？，；\n]{0,6}(?:是|为|达到|高达)?[^。！？，；\n]{0,4}(?:100|百分之百|百分百|满)/,
  /(?:生存率|治愈率|有效率|缓解率|成功率)[^。！？，；\n]{0,10}(?:100%|100 %|百分之百|百分百)/,
  // 能彻底预防 X / 可以完全预防 形（r388 实测：「这项研究只跟踪了患者六
  // 个月……所以这种药能彻底预防心梗」整句漏判）
  /(?:能|可以|足以|就能够|即可)[^。！？，；\n]{0,4}(?:彻底|完全|百分百|百分之百)[^。！？，；\n]{0,6}(?:预防|避免|杜绝|消除|阻止)/,
  // 实现了临床治愈 / 达到治愈 形（r388 实测：「随访刚满十八个月，尚无复
  // 发报告，可以认为新疗法已经实现了临床治愈」整句漏判）
  /(?:已经|已)[^。！？，；\n]{0,4}(?:实现|达到|达成)[^。！？，；\n]{0,6}(?:临床治愈|治愈|根治|痊愈|根除)/,
  // 足以证明 X 没有任何长期风险 形（r388 实测：「观察期内这些患者一个
  // 都没出事，足以证明这个方案没有任何长期风险」整句漏判）
  /(?:足以|足以充分|完全可以|能够)[^。！？，；\n]{0,6}(?:证明|说明|表明)[^。！？，；\n]{0,10}(?:没有|无|不存在)[^。！？，；\n]{0,4}(?:任何)?[^。！？，；\n]{0,6}(?:长期风险|风险|隐患|副作用|不良反应)/,
  // 预后非常好/预后良好 形（r388 实测：「该队列目前失访率还很高，但已
  // 入组的病例全部存活，因此该人群的预后非常好」整句漏判）
  /(?:预后|结局|前景)[^。！？，；\n]{0,8}(?:非常|极为|极其|特别|格外)[^。！？，；\n]{0,4}(?:好|良好|乐观|优异)/,
  /(?:该人群|该组|本组|患者|人群)[^。！？，；\n]{0,8}(?:预后|结局)[^。！？，；\n]{0,6}(?:非常好|很好|良好|乐观)/,
];
// b) 断言族（英文）：proven / confirms / proves / already show / 100%
//   effective / complete success / conclusive
const COMPLETE_EN = [
  /\b(?:data|results?|evidence|findings?)\s+(?:already\s+)?(?:proves?|proven|confirms?|demonstrates?|shows?|establish(?:es)?)\b/i,
  /\b(?:therefore|thus|so)\b[^.]{0,50}\b(?:is\s+)?(?:proven|proves|confirms?|a\s+complete\s+success|100%\s+(?:effective|safe|cured))\b/i,
  /\b(?:proven|shown\s+to\s+be)\s+(?:superior|effective|safe|successful)\b/i,
  /\b(?:cure|survival|success|response)\s+rate\s+(?:is\s+)?100%|\b100%\s+(?:cure|effective|successful|safe)\b/i,
  /\b(?:therapy|treatment|drug|vaccine)\s+(?:is\s+)?(?:a\s+)?(?:complete\s+)?(?:success|works?\s+(?:better|best)|outperforms?)\b/i,
  /(?:nobody|no\s+patient|none)\s+(?:has\s+)?(?:died|relapsed|been\s+infected)\b[^.]{0,40}\b(?:so|therefore|which\s+means|proves?)\b/i,
  // nobody [in the X arm] has died …, which proves X is safer 形（r387
  // 实测：原正则 nobody 后直接接 has/died，不收中间插入语 "in the
  // treatment arm"，导致该形整句漏判）
  /\b(?:nobody|no\s+patient|no\s+one|none)\s+(?:in\s+the\s+)?(?:\w+\s+){0,4}(?:has\s+)?(?:died|relapsed|been\s+infected|experienced)\b[^.]{0,60}\b(?:proves?|shows?|means|demonstrates?|confirms?)\b/i,
  // zero events …, proving X is superior 形（r387 实测：censored 样本的腿②
  // 「zero events, proving the drug superior」原族未收）
  /\b(?:zero|no)\s+(?:events?|deaths?|relapses?|infections?|cases?)\b[^.]{0,40}\b(?:proving|proves?|showing|shows?|demonstrating|indicating)\b[^.]{0,30}\b(?:superior|effective|better|safer|works?)\b/i,
  // suggest/indicate the new drug is better 形（r387 实测：「The trial is
  // still recruiting, and early outcomes already suggest the new drug is
  // better」——腿②未收 suggest 断言形）
  /\b(?:suggest\w*|indicat\w+|demonstrat\w+|show\w+|imply|implies)\b[^.]{0,30}\b(?:drug|therapy|treatment|vaccine)\b[^.]{0,20}\bis\s+(?:better|superior|effective|safer)\b/i,
  // the drug is clearly superior / obviously better 形（r388 实测：「...
  // and none had died, so one-year survival is 100% and the drug is
  // clearly superior」整句漏判——原族只收 suggest X is better 的动词形，
  // 不收 clearly/obviously 副词断言形）
  /\b(?:drug|therapy|treatment|vaccine|regimen|approach)\s+is\s+(?:clearly|obviously|plainly|undoubtedly|decisively)\s+(?:superior|better|safer|more\s+effective|effective)\b/i,
  // we can declare / it can be declared the vaccine safe and effective 形
  // （r388 实测：「The trial is only in its third year, but with zero
  // infections in the early data, we can declare the vaccine safe and
  // effective」整句漏判——原族只有 can be declared + conclusion/success）
  /\b(?:we\s+can|one\s+can|it\s+can\s+be|can\s+be|we\s+may|may)\s+(?:safely\s+)?(?:declare|announce|state|conclude|say)\b[^.]{0,40}\b(?:vaccine|drug|therapy|treatment)\b[^.]{0,40}\b(?:safe|effective|successful|superior)\b/i,
  // completely / entirely prevents X 形（r388 实测：「With six months of
  // follow-up and no cardiovascular events recorded, this medication
  // completely prevents heart attacks」整句漏判）
  /\b(?:completely|entirely|totally|fully|absolutely)\s+(?:prevents?|eliminates?|eradicates?|abolish\w+)\b/i,
  // has achieved a clinical cure / has been cured 形（r388 实测 A10 整句
  // 漏判——原族只收 is proven/outperforms 形，不收 achieved a cure）
  /\b(?:has|have)\s+(?:achieved|attained|reached)\s+(?:a\s+)?(?:clinical\s+)?(?:cure|remission|complete\s+response)\b/i,
  /\b(?:therapy|treatment|drug|vaccine|regimen|approach)\s+has\s+(?:been\s+)?(?:cured|eradicated|eliminated)\b/i,
  /\b(?:is\s+)?(?:effectively\s+)?(?:cured|eradicated)\b[^.]{0,40}\b(?:by|with|through)\s+the\s+(?:new\s+)?(?:therapy|treatment|drug)\b/i,
];

// ─── 推断标记（结论由不完整窗口推出，而非并列陈述）─────────────────
// 同 significance-effect-size 范式：限定性前缀（只/仅/仅仅；EN only/merely/
// just/simply）后面的连接词不算推断标记——「早期结果只说明有信号」是
// 正当表述。
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|当然|显然|肯定|一定|反映出|体现出|足见|充分说明|充分证明|足以表明|足以证明|结论就是|就是说|毋庸置疑|毫无疑问|分明|就代表|代表着|据此可以|就可以|可以说|等于|相当于|宣告|证明|可以认为|可认为|能认为|足见|应该说|可以判定|可判定|可以宣布|足以认定)/;
// 裸 means 形（不收 means that 限定形）；already 计入（早期数据已经证明）。
const INFER_EN = /\b(?:so|therefore|thus|hence|means|meaning|which\s+means|which\s+proves|that\s+means|prov(?:es|ing|en)|shows?\s+that|show\w+|indicat\w+|suggest\w+|means\s+that|it\s+follows|this\s+shows|this\s+proves|clearly|obviously|already|confirms?|we\s+can|one\s+can|it\s+can\s+be|this\s+(?:drug|therapy|treatment|vaccine|medication|approach|result)|but\s+with|and\s+the\s+drug)\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH_DIST = 60;
const WINDOW_EN_DIST = 200;

// ─── 豁免 A：概念讨论（删失/随访完整性本身的教学/批评句，防前缀绕过）──
const CONCEPT_ZH = /(?:删失|截尾|失访|脱落)[^。！？，；\n]{0,22}(?:不等于|并非|不代表|不能|不可|不宜|不应|区别|区分|混淆|误读|误用|未知|未定|仍在观察|不可外推|不能算|绝非|并不是)|(?:随访期|观察期)[^。！？，；\n]{0,22}(?:太短|过短|不足|不够|未结束|未完|仍在进行|尚在|不能|不可|不宜)/;
const CONCEPT_EN = /\b(?:censored|censoring|loss\s+to\s+follow[\s-]?up|incomplete\s+follow[\s-]?up)\b[^.]{0,90}\b(?:does\s+not|doesn'?t|do\s+not|don'?t|is\s+not|are\s+not|cannot|can'?t|not\s+the\s+same|unknown|not\s+yet\s+(?:observed|known)|distinct\s+from|misread|misinterpret\w*|confus\w+)\b/i;

// ─── 豁免 B：已完成随访的正确结论（完整随访后……）──
const COMPLETED_ZH = /(?:十年|五年|完整|充分|长期)[^。！？，；\n]{0,10}(?:随访|观察)[^。！？，；\n]{0,14}(?:后|之后|以后|完成)|(?:随访|观察)(?:满|已满|已足)?[^。！？，；\n]{0,6}(?:十年|五年|期满|到位|完整|充分)/;
const COMPLETED_EN = /\b(?:after|following)\s+(?:\d+\s*(?:years?|months?)\s+of\s+)?(?:complete|full|adequate|ten[\s-]?year|five[\s-]?year|long[\s-]?term)\s+follow[\s-]?up\b|\bcomplete\s+follow[\s-]?up\s+(?:was\s+)?(?:achieved|obtained|completed)\b/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 腿②守卫（r375/r377/r378/r379/r381/r385/r386 同款）：紧前否定窗（ZH 4 字 /
//   EN 20 字符，含否定即「还不能下结论/不足以证明」纠正形）+ 对冲短语（腿②
//   前后出现「不意味着/误解/混淆」类）。两者均可负例注入证明承重。
//   注：紧前否定窗含句读跳过——「无一人死亡，数据已经证明」中「，」后的
//   句子边界切断否定传播（r387 实测：6 字窗会跨句读到「无」误杀）。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|还不能|尚不能|不足以|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是|太短|过短|初步|存疑)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|misinterpret\w*|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same|too\s+(?:short|early|soon)|preliminary|insufficient)/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
    const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
    // 紧前否定窗：句读边界切断否定传播（跨句的「无一人死亡，数据已经证明」
    // 不是否定「证明」，r387 实测修）
    let zhStart = Math.max(0, x.idx - 6);
    const zhCut = text.slice(zhStart, x.idx).search(/[。！？；，\n]/);
    if (zhCut !== -1) zhStart = zhStart + zhCut + 1;
    const beforeZh = text.slice(zhStart, x.idx);
    let enStart = Math.max(0, x.idx - 20);
    const enCut = text.slice(enStart, x.idx).search(/[.!?;\n]/);
    if (enCut !== -1) enStart = enStart + enCut + 1;
    const beforeEn = text.slice(enStart, x.idx);
    const afterZh = text.slice(x.end, x.end + 20);
    const afterEn = text.slice(x.end, x.end + 40);
    for (const re of negZhList) { if (re && re.test && re.test(beforeZh)) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
    for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
    for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
  }
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp 或数组。统一成数组供消费（r385/r386 同款）。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  if (Array.isArray(def)) return def;
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

// 限定性前缀（腿①侧）：「只说明/仅表示」后面的连接词不是推断。
const RESTRICTIVE_BEFORE = /(?:只|仅|仅仅|只不|不过|充其量|仅只|顶多)[^。！？，；\n]{0,3}$/;
const RESTRICTIVE_BEFORE_EN = /\b(?:only|merely|just|simply|at\s+most)\s+(\w+\s){0,3}$/i;
// 腿②强断言裸形（自带结论义，免除显式推断标记）——命中这些形态时，窗口
// 锚在场即可判，不要求「因此/说明」类连接词（r387 实测：「截至目前尚无
// 死亡病例，疗效确凿」全句无连接词，但断言裸形在场即漏判）。
const STRONG_RE = /确凿|确证|实锤|板上钉钉|毋庸置疑|毫无疑问|无可争议|无可辩驳|100%|百分之百|完胜|大获全胜|碾压|吊打|百分百|彻底|完全(?:有效|治愈|成功|安全)|complete\s+success|\bproven\b|\boutperforms?\b|\bcure[d]?\b|completely\s+prevent|entirely\s+prevent|彻底预防|完全预防|完全杜绝|实现了临床治愈|达到临床治愈/i;
function inferAlive(text, x, R) {
  const rb = (R && R.RESTRICTIVE_BEFORE !== undefined) ? R.RESTRICTIVE_BEFORE : RESTRICTIVE_BEFORE;
  const rbe = (R && R.RESTRICTIVE_BEFORE_EN !== undefined) ? R.RESTRICTIVE_BEFORE_EN : RESTRICTIVE_BEFORE_EN;
  if (rb.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (rb.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !rbe.test(beforeEn);
}

// 签名收集：腿②完整结论断言为锚（窗内），腿①随访窗口未结束锚在场，两腿
// 之间须见推断标记（腿①在前或腿②在前均可）。两腿缺一不判。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      window: [
        ..._normInject(R.WINDOW_ZH, WINDOW_ZH),
        ..._normInject(R.CENSOR_ZH, CENSOR_ZH),
      ],
      complete: _normInject(R.COMPLETE_ZH, COMPLETE_ZH),
      infer: R.INFER_ZH != null ? R.INFER_ZH : INFER_ZH,
      win: R.WINDOW_ZH_DIST != null ? R.WINDOW_ZH_DIST : WINDOW_ZH_DIST, lang: 'zh',
    },
    {
      window: [
        ..._normInject(R.WINDOW_EN, WINDOW_EN),
        ..._normInject(R.CENSOR_EN, CENSOR_EN),
      ],
      complete: _normInject(R.COMPLETE_EN, COMPLETE_EN),
      infer: R.INFER_EN != null ? R.INFER_EN : INFER_EN,
      win: R.WINDOW_EN_DIST != null ? R.WINDOW_EN_DIST : WINDOW_EN_DIST, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 强断言裸形判据（r387：可注入——「截至目前……疗效确凿」全句无
    // 「因此」类连接词，只有 STRONG_RE 在场才判，负例注入须可验证承重）
    const strongRe = _normInject(R.STRONG_RE, STRONG_RE)[0];
    const winM = collect(text, L.window);
    if (winM.length === 0) continue;
    const compM = collect(text, L.complete, { neg: true }, R);
    if (compM.length === 0) continue;
    // 推断标记可空（强断言裸形兜底：全句无「因此」类连接词但断言形在场
    // 即可判，r387 实测：「截至目前尚无死亡病例，疗效确凿」）
    const inferM = allMatches(L.infer, text).filter(x => inferAlive(text, x, R));
    for (const c of compM) {
      const w = winM.find(x => dist(x, c) <= L.win);
      if (!w) continue;
      // 推断标记须落在两腿之间（方向不限）、紧邻腿②前置（窗口锚→因此→
      // 断言 的标准推理语序：「因此一年生存率 100%」中「因此」就在腿②
      // 起点，中间无缝隙，r387 实测修）、或嵌含在腿②内部（「数据已经
      // 证明」「可以宣告新药有效」——断言动词自身即推断标记，r387 实测修）
      const between = inferM.find(x => (x.idx >= w.end && x.end <= c.idx) || (x.idx >= c.end && x.end <= w.idx));
      const adjacentBefore = inferM.find(x => x.end <= c.idx && (c.idx - x.end) <= 2 && x.idx >= w.end);
      const embedded = inferM.find(x => x.idx >= c.idx && x.end <= c.end);
      const mark = between || adjacentBefore || embedded;
      if (!mark) {
        // 腿②强断言形（自带结论义，免除显式推断词）：确凿/100%/完胜形。
        // 「截至目前新药组尚无死亡病例，疗效确凿」——全句无「因此」类连接
        // 词，但强断言裸形在场即可判（r387 实测修）
        if (!strongRe.test(c.raw)) continue;
      }
      sigs.push({ lang: L.lang, window: w.raw, complete: c.raw, infer: mark ? mark.raw : '(强断言裸形)' });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.window + '|' + s.complete;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 删失数据当完整结论签名：随访窗口未结束锚 × 完整结论断言 两腿近距共现，
 * 且两腿之间见推断标记。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectCensoringNeglect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（删失/随访完整性本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：已完成随访的正确结论
  if (exempt(_normInject(R.COMPLETED_ZH, COMPLETED_ZH), text) || exempt(_normInject(R.COMPLETED_EN, COMPLETED_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'censoring_neglect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '窗口锚「' + x.window + '」→ 完整结论断言「' + x.complete + '」（推断标记「' + x.infer + '」）'
      : 'follow-up window "' + x.window + '" -> complete-conclusion claim "' + x.complete + '" (via "' + x.infer + '")')),
    details: s.lang === 'zh'
      ? '删失数据当完整结论(' + sigs.length + '处: 拿「' + s.window + '」直接推出「' + s.complete + '」——随访未结束时的数据是删失数据，结局未知，不能当最终证据)(zh)'
      : 'censoring neglect(' + sigs.length + 'x: "' + s.window + '" directly used to claim "' + s.complete + '" — incomplete follow-up is censored data with unknown outcomes, not final evidence)(en)',
    guidance: '删失数据当完整结论（censoring neglect）：随访期未结束时的数据是删失数据（censored）——患者尚未到达研究终点、尚未复发、尚未死亡、尚未失联，其结局未知。把删失数据直接当完整结局读（「观察满一年全部健在 → 一年生存率 100% → 新药完胜」「试验才到第三年 → 可以宣告有效」「早期无一人死亡 → 数据已经证明更安全」），是生存分析与临床试验解读中最高频的证据纪律错误之一：删失患者的后续结局完全可能改变结论，且随访期越长、删失越多，早期「零事件」的断言越不可外推。请先把随访完整性与删失处理对齐再下结论：报告实际随访时长与删失比例（多少患者未到期、多少失访）、说明零事件结论只在该随访窗口内成立、把结论限定在观察期内（「18 个月随访内无复发」而非「治愈率 100%」）、用生存分析（Kaplan-Meier 曲线、中位随访时间）呈现时间-事件数据、指出早期结果需要更长随访确认（更长时间的观察可能改变结论）。正确做法还包括：说明删失数据的患者仍在观察中（结局未知）、指出删失不等于治愈、讨论随访期不足对结论外推的限制。若这段话只是并列陈述随访状态与中期数据（「新药组观察满一年时无死亡病例，但随访期太短，还不能下结论」），那是正当的谨慎报告，无需修改。',
    tags: ['statistics', 'statistical-literacy', 'censoring', 'survival-analysis', 'clinical-trials', 'follow-up', 'evidence-discipline', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectCensoringNeglect,
  __internals: () => ({
    WINDOW_ZH, WINDOW_EN, CENSOR_ZH, CENSOR_EN,
    COMPLETE_ZH, COMPLETE_EN,
    WINDOW_ZH_DIST, WINDOW_EN_DIST,
    INFER_ZH, INFER_EN,
    CONCEPT_ZH, CONCEPT_EN, COMPLETED_ZH, COMPLETED_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    RESTRICTIVE_BEFORE, RESTRICTIVE_BEFORE_EN,
    STRONG_RE,
    findSignatures,
  }),
};
