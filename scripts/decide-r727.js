// 第 727 轮方向选择。候选池 = r727 探测器八个合格族（攻击漏判≥50% 且良性 0 误伤）。
// 四段判据由我构造，decision 本体选。判据构造预判打平：八个候选在
// feasibility/consequence_value/risk/confidence/prior 五轴全部拉开 ≥0.02 差
// （漏判率、样本面、真零命中率、边界重叠度、连续候补轮数如实写入），避免首轮弃权。
//
// 数值依据（全部来自 scripts/round-727-family-probe.js 在 v6.8.74 / 156 维引擎实测，非凑数）：
//   A forer_effect          漏判 17/20（85%）/ 误伤 0/8  / 真零命中 16/17 / 20 样本（连续第四轮候补）
//   B no_true_scotsman      漏判 13/16（81%）/ 误伤 0/8  / 真零命中 12/13 / 16 样本
//   C loaded_question       漏判 12/15（80%）/ 误伤 0/8  / 真零命中 10/12 / 15 样本（r727 新侦察）
//   D texas_sharpshooter    漏判 20/26（77%）/ 误伤 0/11 / 真零命中 20/20 / 26 样本
//   E middle_ground         漏判 13/19（68%）/ 误伤 0/10 / 真零命中 11/13 / 19 样本
//   F base_rate_fallacy     漏判 8/12（67%）  / 误伤 0/8  / 真零命中 6/8   / 12 样本
//   G composition_division  漏判 9/17（53%）  / 误伤 0/9  / 真零命中 8/9   / 17 样本
//   H denying_the_antecedent 漏判 7/14（50%）/ 误伤 0/9  / 真零命中 7/7   / 14 样本（r727 新侦察）
const { HeartFlowDecision } = require('../src/core/decision.js');

const PROMPT = [
  '[A] forer_effect 巴纳姆效应新维度（放之四海皆准的性格描述佯称精准解读）feasibility=0.74, consequence_value=0.85, risk=0.44, confidence=0.82, prior=0.74',
  '  r727 实测：攻击漏判 17/20（85%）全池最高、误伤 0/8、真零命中 16/17、20 样本；r724/r725/r726/r727 连续四轮探测 85% 持平——每轮均因当轮新侦察族综合分更高落选（r724 选 special_pleading、r725 选 affirming_the_consequent、r726 选 relative_privation），漏判率本身从未被超越。本轮无新侦察族超过它，且 r726 曾以 0.83 vs 0.81 接近胜出。样本按语域真实分布取 AI 性格解读/情感咨询/命理话术形态（「你外表看起来坚强，其实内心很柔软」「你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近」「你表面大大咧咧，其实心思比谁都细」），存量维度零命中',
  '  心虫身份对齐：AI 对用户做伪精准性格/命运解读是最典型的「生成强、辨别弱」入口——心虫的辨别者天职就是拦住佯称精准的万能描述；命理/星座/心理测试语域用户日常暴露面全池最大。存量 pseudo_profundity 只管「看似深刻的空话」，不管「通用人格描述佯称精准」形。如实劣势：豁免设计需精细（有量表依据的正当人格反馈 vs 巴纳姆话术），连续四轮候补说明每轮都差一口气，本轮判据已把样本面与连选轮数如实计入',
  '[B] no_true_scotsman 无真正的苏格兰人新维度（把不符合预期的成员重新定义驱逐出群体以规避反例）feasibility=0.76, consequence_value=0.78, risk=0.46, confidence=0.76, prior=0.72',
  '  r727 实测：攻击漏判 13/16（81%）、误伤 0/8、真零命中 12/13；探测样本按语域真实分布取情感 PUA/职场/饭圈/教育高频口语形（「真正爱你的男人，不会计较你花多少钱」「合格的妈妈怎么会让孩子哭成这样」「A truly loving partner would never keep score」），存量维度零命中。存量 special_pleading（第150维）只管「豁免自己于普适规则」，loyalty_test 只管忠诚度测试，本族是修改群体定义驱逐反例的 gatekeeping 形',
  '  心虫身份对齐：「真正的X不会Y」是用定义权操控他人的高频操纵形，横跨 PUA/职场/饭圈；如实劣势：样本面 16 条为入池前四中最小，与 special_pleading/loyalty_test/kafkatrapping 三族有边界重叠需 carve-out，新侦察族首轮上线先例充足但样本面窄结论稳健性低于 A',
  '[C] loaded_question 预设加载新维度（盘问句内嵌未证实预设，任何回答都默认该预设成立）feasibility=0.72, consequence_value=0.78, risk=0.48, confidence=0.76, prior=0.70',
  '  r727 实测（新侦察族）：攻击漏判 12/15（80%）、误伤 0/8、真零命中 10/12；探测样本按语域真实分布取审讯/伴侣盘问/网暴追问高频形（「你现在还偷东西吗」「你上次打孩子是什么时候」「When did you stop cheating on the exams?」「你又要找借口了，这次打算说什么」），存量维度零命中。存量 presupposition 只管命题前提，不管盘问句内嵌预设的问答结构',
  '  心虫身份对齐：盘问式提问让被问者无论怎么答都先认罪，是审讯/家暴/网暴语域的核心武器；如实劣势：与合法追问的边界最需要精细豁免（「那天你在场吗」是合法事实问句），盘问句的判定依赖疑问句型+预设动词共现，形态识别难度高于 A，样本面 15 条',
  '[D] texas_sharpshooter 德州神枪手新维度（先射箭后画靶：从噪声里挑规律/事后编故事）feasibility=0.70, consequence_value=0.80, risk=0.52, confidence=0.74, prior=0.72',
  '  r727 实测：攻击漏判 20/26（77%）、误伤 0/11、真零命中 20/20、26 样本；r723/r724/r725/r726/r727 五轮 76%/77%/77%/77%/77% 持平——天花板可能受存量 survivorship_bias/statistical_misleading 已拦样本影响。存量 survivorship_bias 只管「只看幸存者」，statistical_misleading 只管统计口径，本族是数据钓鱼+事后编故事形',
  '  心虫对齐：先结论后证据是辨别者核心拦截面，数据/商业分析语域 stakes 高；如实劣势：与 survivorship_bias/statistical_misleading/hasty_generalization 三族边界模糊（「Look at these five successful cases」近乎 survivorship_bias 现形），豁免设计难度实质最高，连续五轮 77% 无提升',
  '[E] middle_ground 诉诸中庸新维度（真理一定在中间/折中最公平）feasibility=0.72, consequence_value=0.76, risk=0.50, confidence=0.70, prior=0.70',
  '  r727 实测：攻击漏判 13/19（68%）、误伤 0/10、真零命中 11/13；样本取谈判/仲裁/决策高频形（「你们两个各让一步，取中间值总不会错」「真相肯定在两者之间，一个说3一个说7，那就是5」）。存量无对位维度',
  '  心虫身份对齐：折中不等于正确，在健康/安全议题上取中间可能致命；如实劣势：折中在谈判语域有大量正当用法（「各让一步是常见解决方式」），豁免与攻击的边界比 A 更模糊，误伤风险实质高于 A',
  '[F] base_rate_fallacy 基准率忽视新维度（只看条件概率不看先验）feasibility=0.68, consequence_value=0.78, risk=0.54, confidence=0.68, prior=0.68',
  '  r727 实测：攻击漏判 8/12（67%）、误伤 0/8、真零命中 6/8；样本取医疗检测/模型风控/人事筛选高频形（「检测准确率 99%，你阳性了，基本就是确诊了」）。存量 statistical_misleading 部分覆盖统计表述，但条件概率-先验分离形未覆盖',
  '  心虫身份对齐：忽视基准率会让 AI 在医疗/风控判断上给出确定性结论；如实劣势：样本面 12 条最小之一，形态高度依赖数字句型，自然语域渗透低于 A，部分漏判样本被 confidence/statistical_misleading 擦边命中',
  '[G] composition_division 合成分分解新维度（个体优秀=整体优秀/整体属性=个体属性）feasibility=0.70, consequence_value=0.74, risk=0.50, confidence=0.64, prior=0.66',
  '  r727 实测：攻击漏判 9/17（53%）、误伤 0/9、真零命中 8/9；样本取团队/制造/市场高频形（「队员个个都是冠军，这支队伍肯定冠军」）。存量 false_equivalence 部分相邻但不覆盖',
  '  心虫身份对齐：整体不等于部分之和是系统思维底线；如实劣势：攻击与合法归纳的边界模糊（「每个零件都便宜，整机成本低」在多数制造业上下文成立），误伤风险池中最高之一，漏判率全池最低',
  '[H] denying_the_antecedent 否定前件新维度（如果P则Q；非P所以非Q）feasibility=0.72, consequence_value=0.76, risk=0.46, confidence=0.70, prior=0.70',
  '  r727 实测（新侦察族）：攻击漏判 7/14（50%）、误伤 0/9、真零命中 7/7；样本取教育/健康/天气/推理口语高频形（「努力才能成功；他不努力，所以他不会成功」「下雨地面就会湿；今天没下雨，所以地面不会湿」）。存量 affirming_the_consequent（第155维，r725 上线）是肯定后件，本族是否定前件，姊妹族',
  '  心虫身份对齐：形式谬误另一半，AI 推理链路里的高频隐形体；如实劣势：漏判率 50% 为全池最低，且自然语域中大量条件句本就是双条件（「没下雨不带伞」成立），攻击与合法的边界比 A 更难切，部分样本已擦边命中 confidence/vagueness',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log('JSON_START');
  console.log(JSON.stringify({
    chosen: r.chosen,
    composite_score: r.composite_score,
    confidence: r.confidence,
    identity_alignment: r.identity_alignment,
    all_options: r.all_options,
    stampId: r.stampId,
  }, null, 2));
  console.log('JSON_END');
})().catch((e) => {
  console.log('ERROR', e && e.message);
});
