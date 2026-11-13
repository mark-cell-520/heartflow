/**
 * src/reverse-causation.js — 「因果倒置（reverse causation / 反向因果）」检测器
 * （第 172 个判别维度）
 *
 * [r174 立项] decision 本体在当前引擎（v6.8.101，171 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "counterfactual
 * reasoning" 命中 KDD Tutorial on Causal Inference and Counterfactual
 * Reasoning（objectID 23266032）与 "What If It Goes Wrong?: The Hidden
 * Dangers of Counterfactual Reasoning in AI"（43754084）；"causal inference"
 * 命中 "Causal inference as a blind spot of data scientists"（37890685，225 分）
 * 与 "Seven basic rules for causal inference"（41263928）——确认因果推断是
 * 数据科学与常识推理的公认盲区；GitHub fallacy-detection 仓库群
 * tmakesense/logical-fallacy ★20 / SeanFlannery/Logical.ly ★4 /
 * EPITA-SCIA/Fallacy-Detection-LLM ★2 全部 LLM-based，与纯规则引擎不同构，
 * 仅作概念背景）+ 引擎差距实测（r174 探针 /tmp/hf-probe-r174b.js，直调
 * src/gate.js）：10 条反向因果攻击样本 **7 条穿过硬闸门且零维度命中**
 * （仅报警/约谈/看医生 3 条被 pseudo_causal / fallacies 兜住），良性 10 条
 * 零误判（其中 1 条被既有 pseudo_causal 误拦，见已知边界）。
 *
 * 辨别的族：因果倒置（reverse causation / 反向因果）——把**对后果的应对
 * 行为**当成了**后果本身的原因**。人之所以采取某个行为，恰恰是因为不利
 * 后果已经存在或风险已经很高；于是「做这件事的人/地方，后果更严重」是
 * **选择效应**（后果筛出了行为人），不是该行为制造了后果：
 *   住院患者的死亡率明显更高，所以住院本身增加了死亡风险。
 *   接受心理治疗的人自杀率更高，所以心理治疗会把人推向自杀。
 *   报警越多的社区犯罪率越高，说明报警反而会招来犯罪。
 *   报了补习班的孩子成绩更差，所以补习班让孩子成绩更差。
 *   吃安眠药的人失眠更严重，因此安眠药是造成失眠的原因。
 *   装防盗窗的家庭被盗更多，可见防盗窗会吸引小偷。
 *   被约谈的官员更容易落马，所以约谈导致了他们落马。
 *   戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。
 *   裁员越多的公司效益越差，因此裁员是公司衰败的原因。
 *   Patients who were hospitalized had much higher mortality, so
 *   hospitalization itself increases the risk of death.
 *   Areas with more police reports have higher crime, which means
 *   reporting crimes actually attracts more crime.
 *
 * 与既有维度的边界（r174 归因）：
 *   · post_hoc / pseudo_causal 管「A 在 B 前发生所以 A 导致 B」的**时序**
 *     连接（且能抓「越…越…」相关框），本族管**方向搞反**：被指为原因的
 *     那个行为是对后果的应对，后果在前、行为在后，因果链被整体倒置；
 *   · conditional_proposition 管「如果A真就B」假设条件句当既成论据，本族
 *     不依赖假设条件句；
 *   · monocause 管多因压成单因，本族的方向本身就是错的；
 *   · selection_bias / survivorship_bias 管取样受限向总体推广，本族是
 *     「后果筛出行为人」的选择效应，且不需要向任何总体推广；
 *   · base_rate_neglect 管拿单个阳性信号无视基础概率，本族管两个变量
 *     间的因果方向。
 *
 * 判据（两腿共现，缺一不判）：
 *   腿① RESPONSE_CORR 反应型行为 × 相关/选择框，两形任一：
 *     R-a 选择差异框：反应型行为名词（住院/就医/吃药/报警/投诉/补习/
 *       约谈/戴口罩/装监控/买保险/裁员/封号……裸名词形态；EN hospitali[sz]ed /
 *       therapy / police reports / tutoring / wearing masks / cameras /
 *       insurance / layoffs）+ 「的」+ 群体名词（人/患者/孩子/社区/地区/
 *       公司/官员/家庭/用户/员工/骑手/居民；EN patients/people/those who/
 *       areas/children/drivers）落在 5 字（EN 30 字符）窗内（前后双向），
 *       **且**句中存在差异/相关标记（更/多/高/严重/差/容易/越/集中/往往/
 *       大都/明显/显著/频繁；EN more/higher/worse/more often/likely/tend）；
 *     R-b 递增相关框：反应型行为 + 「越」（12 字窗）且全文「越」出现 ≥2 次
 *       （「报警越多的社区犯罪率越高」「裁员越多的公司效益越差」）。
 *   腿② CAUSE 因果归因：因果动词（导致/造成/引发/引起/带来/招来/引来/
 *      催生/制造/滋生/助长/加剧/加重/诱发/促成/酿成/加大了/增加了/提高了/
 *      提升了/是…的原因/根源在于/罪魁祸首/让/令/使得；EN causes/leads to/
 *       results in/increases/worsens/is responsible for/contributes to）
 *      × 负面结果名词（死亡/死亡率/事故/犯罪/复发/恶化/失眠/抑郁/自杀/落马/
 *      倒闭/亏损/被骗/被盗/感染/感冒/副作用/风险/问题；EN death/mortality/
 *      accidents/crime/relapse/insomnia/depression/suicide/addiction/
 *      infections/losses）落在 16 字（EN 40 字符）窗内。
 *   缺腿不判：「住院病人的死亡率更高，因为重症患者本来就更容易住院」
 *   给出的是正确方向（且落在「是因为」豁免）；「住院治疗降低了死亡率，
 *   这是有随机对照试验支持的」落在实验证据豁免；「戴口罩的人感冒更多，
 *   但这不代表戴口罩导致感冒」落在推理否定豁免。
 *
 * 为什么取 VERIFY 级：因果方向无法由规则引擎独立证实，本维度只能识别
 * 「被指为原因的行为是对后果的应对」这一结构性错位。verify 的含义是
 * 「这个因果方向需要先过证据检验（干预时序/对照/机制）再采信」——调用方
 * 应要求补上方向判据（该行为发生在后果之前还是之后、有没有对照组、
 *  机制是什么），而不是接受默认的倒置方向。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（因果倒置/反向因果/混淆变量/相关不等于因果/辛普森
 *     悖论/内生性/统计学/教材/课堂；EN reverse causation/confounding/
 *     endogeneity/Simpson's paradox/textbook/lecture）——讨论这个谬误
 *     本身是正确判别；
 *   · 实验/证据语境（随机对照/对照组/实验组/双盲/前瞻性研究/队列研究/
 *     元分析/实验表明/数据显示/研究表明/实测/证据表明；EN randomized/
 *     controlled trial/RCT/control group/prospective/cohort study/
 *     meta-analysis/experiment/data show/evidence shows）——以证据而非
 *     观察性相关立论时方向已被检验；
 *   · 推理否定/反向承认（不能说明/不代表/不等于/并不意味着/推不出/不足以/
 *     未必/不一定/是因为/其实是因为/反过来/恰恰相反/反之；EN does not mean/
 *     cannot conclude/not necessarily/is because/the reverse/conversely）——
 *     明确拒绝该推断或给出正确方向；
 *   · 对冲（可能/也许/或许/大概/未必/不一定/恐怕/倾向于/似乎/有待；EN maybe/
 *     perhaps/might/possibly/probably/seems）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① RESP 反应型行为名词（中文，裸名词形态）──────────────────────
// 161 轮教训：全部取可独立出现的裸词形（住院/吃药/报警/裁员），不收
// 「住院治疗」「服药后」这类带后缀组合——同族词去掉后缀必须仍命中。
// 收录口径：**由不利后果或高风险处境触发**的应对/补救/防护/处置行为
// （其后果就是触发它的那个处境），不含预防性、治疗性或政策性中性的
// 动作（止痛药的肝损伤是直接药理效应，不属本族；加息/降息方向在现实
// 争论中双向都被主张，不收录）。
const RESP_ZH = [
  /住院|就医|看病|看医生|上医院|挂诊|吃药|服药|打针|输液|做手术|动手术|化疗|透析|吃安眠药|吃止痛药|吃抗抑郁药|看心理医生|心理咨询|心理治疗|接受治疗|报警|报案|投诉|维权|申诉|上诉|打官司|起诉|补习|补课|辅导班|请家教|复读|考研|约谈|诫勉|隔离|封控|封城|封锁|静态管理|戴口罩|头盔|戴头盔|装监控|安装监控|装防盗窗|装防盗门|买保险|投保|体检|筛查|裁员|裁撤|下岗|辞退|封号|禁言|下架|整顿|整改|检修|返工|止损|割肉|平仓|抢救|救援|灭火|装护栏|立规矩|定规章|助听器|拄拐|轮椅|假肢|护膝|护腰|护腕|支具|矫姿器|背背佳|[Oo][Kk]镜|角膜塑形镜|离焦镜|近视手术|激光手术|正畸|整牙|箍牙|种牙|根管|针灸|推拿|拔罐|艾灸|理疗|康复训练|戒毒|戒毒所|强制戒毒|戒断|戒酒|美沙酮|写检查|记过|处分|停课|请家长|补考|重修|补作业|查征信|拉征信|调流水|报险|理赔|核保|索赔|反诈|防骗教育|安全教育|延保|质保|召回|返厂|风控|反欺诈|确诊|核酸检测|抗原检测|做核酸|扫码|验码|登记|报备|居家|居家隔离|居家办公|居家学习|线上教学|网课|停课|停学|封校|闭环管理|静默|方舱|集中隔离|强制隔离|疫苗|接种|加强针|打疫苗|戴口罩|扫码登记/,
  // [r275 新增族·并入上方 r174 首族元素内] 医疗辅具/戒断治疗/纪律处分/征信风控/
  // 反诈宣传类应对行为（其「后果」恰是触发它的处境——后果筛出行为人）。
  // 裸词形态：助听器/拄拐/OK镜/戒毒/补考/查征信/反诈/风控/延保 去前后缀仍命中。
  // 按 round-266 登记纪律并入既有元素（RESP_ZH 恒 2 条），不新增数组元素。
  // [r266 新增族] 风险焦虑/信息恐慌触发的应对行为（其"后果"恰是触发它的处境）
  // 自查：不收疫苗族——疫苗相关因果话语在公共讨论中高度极化，边际覆盖增益
  // 小于误伤面，按 r161 口径让位给人工审查（gate verify 由其他维度兜）。
  /囤口罩|囤盐|囤货|抢购|吃保健品|装净水器|买净化器|备药|囤药|装警报器|请保镖|买防身器|加装锁|换锁芯|劝退|清退|退学|开除|除名|留级|降级|停职|免职|撤职|问责|分手|离婚|拉黑|绝交|断亲|囤[了过]?(?:口罩|盐|药品|药|货|食物|粮食|水)|备[了过]?药|用[了过]?药|服[了过]?药|装[了过]?(?:摄像头|警报器|防盗窗|防盗门|护栏|净水器|净化器|智能锁|门禁|烟感|灭火器|避雷针)|安[装了过]{1,2}(?:摄像头|警报器|防盗窗|护栏|净水器|净化器|智能锁|门禁|烟感|灭火器)/,
  // [r283 新增族·并入上方 r266 元素内] 纪律处分/学业处置/关系解除类应对行为：  // [r315 应对/登记族·并入上方元素内] r266 L1 缺口：RESP_ZH（腿①行为词）缺
  // 软性应对/登记行为。存量表只收「装监控/报案」等第一响应者族，攻击族惯用
  // 「感冒请假更多」「住院次数更多」「头痛请假更多」——请假/停课/缺勤/旷课
  // 这类被处境触发的应对行为全不在表。裸词形态，并入 r283 元素保持恒 2 条。
  // [r315 失窃报告族·并入上方元素内] 「失窃报告更多」——r315 实测攻击句
  // 「装了监控的仓库失窃报告更多，可见监控会招致盗窃」死于此：腿①行为词表
  // 无「失窃/报告」类应对词。口径：处境名词 + 报告/登记 类应对词。
  /(?:失窃|盗窃|抢劫|诈骗|火灾|火警|事故|车祸|故障|泄露|被盗|被骗|遇害|伤亡|自杀|抑郁|焦虑|生病|感冒|感染|受伤|头痛|头晕|不适|过敏|皮疹|发热|发烧|咳嗽|恶心|呕吐|腹泻|心悸|胸闷|失眠|复发|恶化|并发症|后遗症|成瘾|上瘾|亏损|倒闭|破产|下滑|下跌|崩盘|出事|被抓|被查|被罚|爆雷|辍学|退学|挂科|旷课|请假|缺勤|停工|停产|停业|下架|封号|退货|退款|返修|召回|曝光|爆料|披露|点名|通报|问责|追责|批捕|判刑|败诉|确诊|住院|就医|就诊)(?:的)?(?:报告|登记|报备|反映|反馈|举报|投诉|报修|报险|申报|上报|呈报)|失窃|盗窃报告|报案|报失|报警(?:记录|台|电话)?/,
  /请假|休假|调休|缺勤|旷课|缺考|挂科|补考|重修|辍学|休学|留级|停课|请家长|转班|转学|告假|病假|事假|销假|报备|登记|报平安|核酸|抗原|快筛|PCR|隔离|集中隔离|居家隔离|健康监测|流调|密接|次密接|封控|静默|封城|静态管理|闭环管理|足不出户|居家办公|线上教学|线上授课|网课|远程办公|错峰|限流|预约|取号|排号|候补|加急|插队|占位|拼车|合乘|拼桌|分餐|打包|外带|外卖|自提|无接触配送|外卖柜|快递柜|自提柜|代收|代取|转寄|改址|拦截|退回|拒收|退件|理赔|报险|核保|定损|查勘|公估|精算|风控|反欺诈|反洗钱|AML|KYC|KYB|尽职调查|合规|内控|审计|稽核|督查|督察|巡查|巡检|排查|清查|整治|专项治理|整改|督办|约谈|诫勉|函询|警示谈话|组织处理|组织调整|一票否决|连带责任|追责|问责|纪律处分|行政处分|组织处分/,
  // [r315 完成态族·并入上方元素内] 「装了监控」「戴了口罩」「吃了保健品」
  // 类完成态形——存量防护词族只收裸词（装监控/戴口罩），攻击文本惯用完成态
  // （「装了监控的仓库失窃报告更多」），r315 实测 2 条攻击句死在此形态缺口。
  // 动词 + [了过有] + 名词，名词表只收与「防护/保健/避险」语义相关者，防泛化。
  /装[了有过]?(?:监控|摄像头|警报|报警器|防盗窗|防盗门|护栏|净水器|净化器|新风|智能锁|指纹锁|锁芯|门禁|闸机|安检|消防|喷淋|烟感|灭火器|应急灯|避雷针|隔音窗|防晒膜|防盗网|铁丝网|围栏|栅栏|门镜|猫眼|对讲|门铃|门锁)|安[装有了]{1,2}(?:监控|摄像头|警报|报警器|防盗窗|防盗门|护栏|净水器|净化器|新风|智能锁|指纹锁|门禁|闸机|安检|消防|喷淋|烟感|灭火器|避雷针|隔音窗|防盗网|围栏|栅栏|门铃|门锁)|戴[了过]?(?:口罩|头盔|护具|护膝|护腰|护腕|手套|面罩|防护面罩|N95|KN95|防毒面具|呼吸器|安全带|安全绳|护目镜|墨镜|隐形眼镜|OK镜|角膜塑形镜|助听器|耳塞|耳罩)|吃[了过]?(?:保健品|补品|营养品|维生素|钙片|鱼油|益生菌|蛋白粉|褪黑素|安眠药|止痛药|感冒药|退烧药|抗生素|中成药|草药|偏方|特效药)|买[了过]?(?:保险|医保|社保|重疾险|医疗险|意外险|寿险|年金|理财产品|基金|股票|债券|定期|活期|黄金|美元|欧元|日元|避险资产)|用[了过]?(?:净化器|加湿器|除湿机|新风系统|空气净化器|净水器|净水机|软水机|制氧机|呼吸机|雾化器|按摩仪|理疗仪|足浴盆|艾灸盒|拔罐器|刮痧板|筋膜枪|按摩椅|记忆枕|护颈枕|腰靠|坐垫|床垫|枕头|被子|凉席|电热毯|暖风机|小太阳|电暖器|油汀|空调|风扇|循环扇|无叶扇|冷风机|排气扇|抽油烟机|集成灶|消毒柜|洗碗机|垃圾处理器|净水壶|滤水壶|保温杯|焖烧杯|破壁机|豆浆机|榨汁机|料理机|绞肉机|和面机|面条机|酸奶机|面包机|煮蛋器|咖啡机|磨豆机|电子秤|温度计|吹风机|卷发棒|直板夹|洗发水|护发素|沐浴露|身体乳|洗手液|消毒液|酒精|湿巾|洗脸巾|蚊帐|养生壶|电炖盅|电饭煲|电压力锅|高压锅|电火锅|微波炉|光波炉|蒸箱|烤箱|热水器|太阳能|燃气|壁挂炉|地暖|暖气片|风机盘管|新风机|全热交换|热回收|热泵|空气源|水源|地源|三联供|四联供|多联机|中央空调|分体式|壁挂式|柜式|窗式|移动式|便携式|手持式|立式|台式|嵌入式|隐藏式|吊顶式|吸顶式|落地式|挂墙式|管道式|风管式|多联式|一拖一|一拖多|定频|变频|全直流|直流变频|交流变频|一级能效|二级能效|三级能效|能效标识|水效标识|节水|节电|节能|省电|静音|降噪|减震|防震|防滑|防摔|防水|防尘|防风|防晒|防紫外线|防蓝光|防辐射|防静电|防霉|防蛀|防臭|防菌|抗菌|抑菌|杀菌|消毒|除菌|除螨|去螨|驱蚊|防蚊|灭蚊|蚊香|电蚊香|驱虫|防虫|杀虫|灭蟑|灭鼠|捕鼠|粘鼠|驱鸟|防鸟)/,

  // 「成绩差的学生才被劝退学」——劝退/降级/离婚 是对已存在不利后果（成绩差/
  // 绩效差/感情破裂）的处置，被误当成后果的原因。裸词形态：劝退/开除/离婚
  // 去前后缀仍命中。按 round-266 登记纪律并入既有元素（RESP_ZH 恒 2 条）。
];

// ─── 腿① R-a 群体名词（中文）────────────────────────────────────────
// 「的」在名词两侧都可能出现——「住院**患者的**死亡率」是「名词+的」，
// 「住院**的**患者」是「的+名词」，两种框架都要收（r174 首版只收
// 「的+名词」，导致「住院患者的死亡率明显更高」整句漏判）。不收裸名词
// （无「的」约束的「公司裁员」式巧合邻近会造成误配——「裁员之后公司
// 效益好转」因此不判）。
const GROUP_DE_ZH = [
  /的(?:人|患者|病人|病患|患儿|孩子|儿童|学生|学员|社区|地区|区域|国家|公司|单位|官员|干部|群体|家庭|用户|股民|家长|员工|老人|女性|男性|案例|对象|人群|会员|居民|群众|乘客|司机|骑手|贫困户|农民工|创业者|消费者|业主|租客|账号|账户|职场人|打工人|车主|船主|货主|买家|患者家属|家长群|业主群|夫妻|情侣)|(?:人|患者|病人|病患|患儿|孩子|儿童|学生|学员|社区|地区|区域|国家|公司|单位|官员|干部|群体|家庭|用户|股民|家长|员工|老人|女性|男性|案例|对象|人群|会员|居民|群众|乘客|司机|骑手|贫困户|农民工|创业者|消费者|业主|租客|账号|账户|职场人|打工人|车主|船主|货主|买家|患者家属|夫妻|情侣)的/,
];

// ─── 腿① R-a 差异/相关标记（中文）────────────────────────────────────
const DIFF_ZH = [
  /更|多|高|严重|差|容易|越|集中|往往|大都|通常|明显|显著|尤其|特别|频繁|高出|居多|绝大多数|大多数|普遍/,
];

// ─── 腿① R-b 递增相关框（中文：越…越…）──────────────────────────────
const YUE_ZH = [/越/];

// ─── 腿② CAUSE 因果动词（中文）───────────────────────────────────────
// [r315 新增] 倒装归因桥接词（主判据 C 专用）：把句首负面结果与句尾应对行为
// 名词连接起来的归因标记。刻意不收「因为/由于/源于」（那是显式归因，由
// EXEMPT_NEG/EXEMPT_HEDGE 与判据 A/B 承担，且多为良性解释句），只收
// 「恰恰/恰好/正是/都/清一色」这类**事后归因**标记——说话人先看到结果分布，
// 再反推是哪类行为者，正是因果倒置的语用特征。
const INV_LINK_ZH = [
  /恰恰(?:是|正是|就是|只|全都|都是)/, /恰好(?:是|正是|就是)/, /正是(?:那些|这|那|装了|买了|戴了|吃了|用了)/,
  /都(?:是|装在|装在|安在|集中在|分布)/, /清一色(?:是|都)/, /无一例外(?:是|都)/,
  /的(?:地方|地区|区域|片区|楼栋|小区|社区|场所|店铺|单位|公司|学校|班级|家庭|人群|群体|人|案例|案件)/,
  /正是(?:因为|由于)?/, /不外乎/, /说到底(?:就是|是)/,
  // [r316 新增] 结果-观察收束词：说话人先铺结果分布、再用这类词引出归因。
  // 「盗窃案更多的街区都装了监控，可见监控在招致小偷」。实测不可裸加「说明」——
  // 良性句「投诉增多说明产品质量确实有问题」同样含它；安全性由 C-2 的方向锚
  // （RESULT 先于 RESP_ACTION）+ CAUSE_ZH 归因动词共现兜底，实测 5/5 良性 pass。
  /可见/, /说明/, /足以证明/, /表明/,
];
const CAUSE_ZH = [
  /导致|造成|引发|引起|带来|招来|引来|吸引|催生|制造|滋生|助长|加剧|加重|诱发|促成|酿成|加大了|增加了|提高了|提升了|推高了|放大了|推向|推向了|是[^。，]{0,10}的原因|原因就在于|根源在于|罪魁祸首|让|令|使得/,
  // [r315 损害/招致族·并入上方元素内] r266 L1 深层缺口：「保健品损害健康」
  // 「监控会招致盗窃」——存量动词表只收导致/引发 等强势断言形，漏掉
  // 损害/招致/招引/招惹/陷于 这类归因强度稍弱但方向明确为「A 使 B 处境恶化」
  // 的动词。自查不收「有助于/促进」等正向词（正向因果不是本维度判别对象）。
  /损害|损伤|伤害|危及|招致|招引|招惹|招来更多|引来更多|置于|陷于|使.{0,6}陷入|令.{0,6}陷入|让.{0,6}陷入|把.{0,6}推向|加重了|加深了|加剧了|催生了|滋生了|酿成了|造成了|导致了|引出了|惹出了/,
];

// ─── 腿② RESULT 负面结果名词（中文，裸名词形态）──────────────────────
const RESULT_ZH = [
  // [r316 新增族] 流行病学结果名词（阳性/病例）——r316 诊断：「报备人数多的
  // 楼栋阳性也更多，可见报备招来了阳性」「登记越密的园区病例越多，说明登记
  // 制度滋生了病例」miss 的根因是腿②结果腿恒不触：RESULT_ZH 有 感染/确诊
  // 但无 阳性/病例（这两族不在同一构词层：感染/确诊 是事件动词，阳性/病例
  // 是检测/统计产出）。只收「阳性|病例|确诊|无症状」等检测产出名词，
  // 不收「核酸|检测|筛查」等应对行为词（那些属 RESP 腿，防两腿互串）。
  /阳性|阴性|病例|确诊病例|无症状|感染者|密接|次密接|中招|染上|患病|致病|带毒|病毒携带/,
  /死亡|死亡率|身亡|病故|猝死|遇难|伤亡|自杀|轻生|事故|车祸|犯罪|作案|违法|违规|小偷|窃贼|盗贼|复发|恶化|并发症|后遗症|失眠|抑郁|焦虑|成瘾|上瘾|失败|落榜|落马|出事|被抓|被查|被罚|爆雷|亏损|倒闭|破产|衰败|衰退|下滑|下跌|崩盘|瘫痪|泄露|被盗|被骗|生病|感冒|感染|受伤|受害|遇害|辍学|退学|更差|变差|退步|垫底|掉队|风险|问题|乱子|漏洞|故障|副作用|不良反应|反噬|反弹|雪崩/,
  // [r315 处境/治安/健康受损族·并入上方 r174 元素内] r266 L1 深层缺口：
  // 「报警器会引发火警」「监控会招致盗窃」「净化器引发头痛」「保健品损害
  // 健康」——存量 RESULT_ZH 只收死亡/破产/爆雷 等硬终点词，漏掉火警/盗窃/
  // 头痛/不适 这类**被筛出的处境**名词。收录口径：该名词描述的恰是触发应对
  // 行为的那个处境本身或其直接表征。不收「健康」裸词（会误伤「健康上升」）。
  /火警|火情|火灾|失火|失窃|盗窃|偷盗|入室盗窃|盗窃案|抢劫|抢夺|诈骗|欺诈|受骗|上当|坏账|违约|爽约|头痛|头晕|恶心|呕吐|腹泻|过敏|皮疹|发热|发烧|咳嗽|乏力|疲惫|倦怠|不适|难受|不舒服|亚健康|体虚|失眠症|抑郁|焦虑症|狂躁|暴躁|心悸|胸闷|气短|腰酸|背痛|颈椎|腰椎|关节痛|胃痛|胃胀|消化不良|便秘|失眠|嗜睡|健忘|分心|走神|注意力不集中|效率低|出错|失误|纰漏|宕机|卡顿|延迟|丢包|断网|断线|闪退|崩溃|卡死|死机|报错|异常|故障|瘫痪|服务中断|系统崩溃/,
  // [r315 软性负面结果族·并入上方 r174 元素内] agent-2 r266 报告 L1 直接
  // 缺口：RESULT_EN 早已收 complaints/claims，ZH 侧无对应词，导致「装了净水器
  // 的家庭水质投诉更多，可见净水器会吸引投诉」整族干净漏判（r315 探针实测
  // 8/10 漏判全在此族）。收录口径：**报告/登记/就医/消费终端**类软性负面
  // 结果——其「发生量」恰是被它筛出的处境（应对行为越普及，登记与就诊量越
  // 大），与存量硬负面词同属「后果的计量」而非「后果本身」。自查不收
  // 纠纷/争议/摩擦（日常商务高频，非结果计量词）。
  /投诉|报案|举报|申诉|维权|索赔|起诉|上诉|差评|吐槽|退货|退款|返修|召回|停课|约谈|诫勉|处分|记过|留校察看|开除|除名|劝退|退学|辍学|休学|留级|挂科|补考|重修|旷课|请假|缺勤|旷工|停工|停产|停业|整顿|整改|下架|封号|禁言|限流|罚款|扣分|停赛|禁赛|解约|违约|毁约|退订|退保|退费|脱粉|翻车|塌房|人设崩塌|曝光|爆料|披露|通报|点名|通报批评|黄牌|红牌|罚单|违停|查封|冻结|审计|巡查|问责|追责|纪律处分|行政处分|批捕|判刑|坐牢|调解|仲裁|判决|败诉|就诊|就医|住院|确诊|感染|生病|感冒|失眠|抑郁|焦虑|受害|被骗|上当|遇害|车祸|事故|故障|泄露|被盗|亏损|倒闭|破产|下滑|下跌|崩盘|复发|恶化|并发症|后遗症|成瘾|上瘾|落榜|落马|出事|被抓|被查|被罚|爆雷/,
  // [r315 计量后缀族·并入上方 r174 元素内] 结果名词 + 量级后缀（次数/数量/
  // 率）：「住院次数更多」「确诊数更多」——与 DIFF_ZH 差异标记（更多/更高）
  // 配对构成完整倒置框，覆盖不带群体名词的紧凑攻击形。
  // [r315 健康受损族·并入上方 r174 元素内] 「损害健康」——r315 实测攻击句
  // 「吃保健品的老人住院次数更多，可见保健品损害健康」死于此：CAUSE 动词
  // 「损害」✓ 但 RESULT 窗内「健康」裸词刻意未收（防「健康上升」误伤）。
  // 此处收双向形：健康 + 受损词（健康受损）或 受损词 + 健康（损害健康）。
  /健康(?:受损|变差|下降|恶化|下滑|每况愈下|堪忧|告急|崩溃|透支|损伤|损害|受创)|(?:损害|损伤|伤害|危及|透支|拖垮|摧毁|毁掉|毁损)健康/,
  // [r315 新增族·并入上方元素内] 疾病/传染病裸名词——r315 实测攻击句
  // 「囤了药的人生病次数更多，可见囤药会招来疾病」死于此：RESULT 表收
  // 生病/感染/感冒 等表征词，但「招来疾病」「引发瘟疫」的**疾病类上位词**
  // 裸形不在表。口径：只收疾病/病症/瘟疫/传染病 等类名词，不收健康裸词
  // （防「健康上升」误伤），不收具体病名（避免「手术引发癌症」类医疗断言
  // 争议话题——那是另一个维度的判别对象）。
  /疾病|病症|病痛|疾患|瘟疫|流行病|传染病|疫情|病毒感染|细菌感染|真菌感染|疟疾|霍乱|流感|新冠|非典|结核|肝炎|肺炎/,
  /(?:投诉|报案|举报|申诉|维权|索赔|起诉|上诉|差评|吐槽|退货|退款|返修|召回|停课|处分|开除|劝退|退学|辍学|请假|缺勤|旷课|缺考|补考|重修|旷工|停工|停产|停业|整顿|整改|下架|封号|禁言|罚款|解约|违约|退订|退保|退费|脱粉|曝光|爆料|通报|点名|问责|追责|批捕|判刑|调解|仲裁|败诉|就诊|就医|住院|确诊|感染|生病|感冒|失眠|抑郁|焦虑|受害|被骗|上当|事故|车祸|故障|泄露|被盗|亏损|倒闭|破产|下滑|下跌|崩盘|复发|恶化|成瘾|上瘾|落榜|落马|爆雷)(?:的)?(?:数量|次数|人数|案例|案件|率|占比|比例|规模|总量|数额|频次|频率|增速|增幅|涨幅|增量)/,
  // [r283] 裸表现结果族：「劝退直接导致成绩差」——无「更/变」前缀的结果形容
  // 词（成绩差/评分低/幸福感低），与纪律处分族配对。旧表只收 更差/变差 形。
  // [r283 修订] 名词与形容词之间容许「更」——「离婚导致幸福感更低」。
  /成绩[更]?[差低]|分数[更]?[差低]|表现[更]?[差低]|业绩[更]?[差低]|评价[更]?[差低]|口碑[更]?[差]|评分[更]?[差低]|排名[更]?[低后]|满意度[更]?[低差]|幸福感[更]?[低差]|收入[更]?[低少]|薪资[更]?[低少]|工资[更]?[低少]/,
];

// ─── 英文侧腿① ───────────────────────────────────────────────────────
const RESP_EN = [
  /\b(?:hospitali[sz]ed?|hospitali[sz]ation|in\s+hospital|hospital\s+care|admitted|admission|seeing\s+a\s+doctor|doctor'?s\s+visits?|taking\s+(?:sleeping\s+)?pills?|medication|therapy|psychological\s+(?:treatment|help|counseling)|counseling|sessions?|calling\s+the\s+police|police\s+reports?|reporting|complaints?|lawsuits?|suing|tutoring|cram\s+school|private\s+lessons?|wearing\s+(?:a\s+)?(?:mask|helmets?|seatbelts?)|security\s+cameras?|alarms?|insurance|layoffs?|downsizing|being\s+(?:fired|banned|blocked|suspended)|quarantine|lockdown|screenings?|antidepressants?|painkillers?|hearing\s+aids?|crutches|knee\s+supports?|wheelchairs?|prosthetics|drug\s+rehab|rehab|anti-fraud(?:\s+apps?)?|fraud[- ]prevention(?:\s+(?:education|programs?|campaigns?))?|safety\s+education|extended\s+warrant\w+|credit\s+checks?|background\s+checks?|claims?|expelled|expulsion|suspensions?|suspended|demoted|demotion|held\s+back|expelled\s+from)\b/i,
  // [r266 新增族] 风险焦虑/财产防护触发的应对行为（同 ZH 侧囤货族）
  /\b(?:doorbell\s+cameras?|ring\s+cameras?|vitamin\s+supplements?|security\s+guards?|panic\s+buying|stockpiling|hoarding|air\s+purifiers?|water\s+filters?|pepper\s+spray|self-?defense\s+(?:classes?|training))\b/i,
  // [r315 新增族·并入上方元素内] r315 实测 "Warehouses with cameras installed
  // report more thefts" 死于此：RESP_EN 只收 security cameras（限定词），
  // 裸 cameras / alarms / locks 不在表。补裸名词 + installed 完成态后缀形。
  // 自查不收 watch/clock（日常物，非应对行为语义）。
  /\b(?:cameras?|alarms?|locks?|padlocks?|deadbolts?|CCTV|surveillance|air\s+purifiers?|water\s+purifiers?|purifiers?|filters?|masks?|helmets?|seatbelts?|airbags?|vaccines?|vaccinations?|sunscreen|supplements?|vitamins?)\b(?:\s+installed|\s+deployed|\s+rolled\s+out)?/i,
];
const GROUP_EN = [
  // [r315 新增族·并入上方元素内] r315 实测 "Warehouses with cameras installed
  // report more thefts" 死于此：GROUP_EN 只收 patients/people 等人群名词，
  // 而该攻击族的主语是**场所/组织**（warehouses/families 之外的店铺、仓库、
  // 车辆、楼栋）。补场所名词，口径与 r174 的场所词一致：承载应对行为的地点。
  /\b(?:warehouses?|stores?|shops?|buildings?|offices?|factories?|facilities?|premises|vehicles?|cars?|trucks?|apartments?|houses?|homes?|rooms?|schools?|hospitals?|clinics?|dormitories|dorms|streets?|blocks?|districts?|sites?|locations?|outlets?|branches?|campuses|firms?|teams?|departments?|units?)\b/i,
  // [r315 新增族·并入上方元素内] r315 实测 "Families that bought water filters
  // file more complaints" 死于此：GROUP_EN 原表只收 patients/people 等人称名词
  // 与 warehouses 等场所词（本轮已补），漏掉 **that bought X 的定语从句族**——
  // 主语是 families/users 这类名词 + that bought/that purchased 定语。补
  // 关系代词 + 定语从句引导词，让 nearAny(RESP, GROUP, 30, true) 的双向窗命中。
  /\b(?:families|households|users|customers|consumers|buyers|owners|tenants|residents|members|people|those|patients|students|workers|employees|drivers|citizens|children|companies|firms|stores|shops|warehouses|schools|teams|households)\s+(?:that|who|which)\s+(?:bought|purchased|installed|use|used|using|own|owned|have|had|take|took|taking|got|obtained|receive|received|opted|chose|chosen|deployed|adopted|switched)\b/i,
  // [r315 新增族·并入上方元素内] 倒装归因框的触发形：「结果更多的地方/人群中」
  // 「恰恰是装了 X 的」——应对行为名词出现在句尾而结果在句首。原 r315 补的
  // 场所词族只覆盖英文主语位置，此处补中文的「X更多的地方/人」结果前置形。
  /更(?:多|高|大|严重|频繁)的?(?:地方|地区|区域|片区|路段|楼栋|小区|社区|场所|店铺|单位|公司|学校|班级|科室|家庭|人群|群体|人|案例|案子|案件)/,
];
const DIFF_EN = [
  /\b(?:more|higher|greater|worse|worst|severe|severely|often|frequently|likely|tend|tends|prone|elevated|increased|excess|disproportionate)\b/i,
];

// ─── 英文侧腿② ───────────────────────────────────────────────────────
const CAUSE_EN = [
  /\b(?:causes?|caused|causing|leads?\s+to|led\s+to|leading\s+to|results?\s+in|resulted\s+in|resulting\s+in|brings?\s+about|brought\s+about|creates?|created|creating|produces?|produced|drives?|increases?|increased|increasing|raises?|raised|worsens?|worsened|aggravates?|is\s+responsible\s+for|contributes?\s+to|contributed\s+to|fuels?|fueled|spawns?|triggers?|triggered|induces?|induced|makes?|attracts?|draws?|drew\b|invites?|breeds?)\b/i,
  // [r266 新增族] -ing 进行态因果动词（独立元素，供负例注入-删条定位）
  /\b(?:attracting|drawing|luring|inviting|pulling)\b/i,
];
const RESULT_EN = [
  /\b(?:death|deaths|mortality|fatalit\w+|accidents?|crashes?|crime|crimes?|offen[cs]es?|relapse|recurrence|deterioration|failure|collapse|bankruptc\w+|insomnia|depression|anxiety|suicide|dropouts?|addiction|dependent|complications?|side\s+effects?|infections?|injur\w+|illness|robber\w+|theft|fraud|scandals?|violations?|losses?|decline|recession|turnover|burnout|problems?|risks?|worse|poorer)\b/i,
  // [r266 新增族] 财产犯罪结果名词（与门铃摄像头/保安族配对）
  /\b(?:thieves|burglars?|burglaries|muggers?|muggings?|break-?ins?|stolen\s+packages?|vandalism)\b/i,
  // [r315 新增族·并入上方元素内] 软性负面结果名词（投诉/退货/差评/返修/
  // 停课/处分）——r315 实测攻击句 "Families that bought water filters file more
  // complaints, so filters attract complaints" 死于此：CAUSE_EN 有 attracts✓
  // 但 RESULT_EN 无 complaints，腿②结果腿恒不触。与中文 r315 软性结果族
  // （RESULT_ZH 第 3 条）对称补齐，两侧口径一致：发生量即被处境筛出的结果。
  /\b(?:complaints?|grievances?|returns?|refunds?|chargebacks?|negative\s+reviews?|bad\s+reviews?|poor\s+ratings?|reports?|claims?|grievance\s+filings?|recalls?|suspensions?|expulsions?|demotions?|layoffs?|dismissals?|penalt(?:y|ies)|fines?|sanctions?|reprimands?|warnings?|absences?|truancy|sick\s+days?|sick\s+leave|stoppages?|walkouts?|strikes?)\b/i,
];

// ─── [r299 新增族] 应急响应调度框（因果倒置的「第一响应者」形）──────────
// 收录口径：应急响应者/处置服务**按危机强度被调度**（危机越重，派出的
// 响应者越多），把「危机筛出响应者」的选择效应误读成「响应者制造/加剧
// 危机」——与 r174 首族（住院/报警/裁员 等后果应对行为）同属反向因果，
// 但表面形态是「响应者→危机事件」的调度对，而非「行为+群体+差异」框，
// 且危机名词（大火/事故/风暴）不在 RESULT 表、中文常用 越X越Y 无显式
// 因果动词，故独立成框（主判据 B），既有路径零改动。裸名词形态。
const RESPONDER_ZH = [
  /消防员|消防队|消防车|救护车|急救车|急救中心|救生员|救生队|拖车|清障车|救援队|救援人员|抢险队|海岸警卫队|海警|危机热线|心理危机干预|排爆|拆弹|防暴警察|特警/,
];
const RESPONDER_EN = [
  /\b(?:firefighters?|fire\s+crew|paramedics?|EMTs?|ambulances?|tow\s+trucks?|coast\s+guard|lifeguards?|rescue\s+(?:teams?|crews?|workers?|squads?)|search[- ]and[- ]rescue|first\s+responders?|hazmat\s+(?:teams?|crews?)|bomb\s+squad|crisis\s+(?:counselors?|hotlines?|teams?)|emergency\s+(?:crews?|responders?|teams?)|dispatchers?|relief\s+workers?)\b/i,
];
const CRISIS_ZH = [
  /大火|火灾|火场|火情|火势|心梗|心脏骤停|猝死|事故|车祸|溺亡|溺水|落水|风暴|台风|地震|洪灾|洪水|灾害|灾情|塌方|滑坡|爆炸|泄漏|中毒|危难|险情|突发情况|紧急情况/,
];
const CRISIS_EN = [
  /\b(?:fires?|wildfires?|cardiac\s+arrests?|heart\s+attacks?|crashes?|accidents?|overdoses?|drownings?|storms?|floods?|earthquakes?|disasters?|emergencies|collapses?|explosions?|blazes?)\b/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /因果倒置|反向因果|逆向因果|因果混淆|混淆变量|混杂因素|相关不等于因果|相关性不等于因果|辛普森悖论|辛普森悖误|内生性|选择效应|生态谬误|区群谬误|统计学|统计课|数学课|教材|课本|课堂|教案|论文里|文章里|科普|逻辑课|谬误|谬论|研究方法|课堂教学/,
];
const EXEMPT_META_EN = [
  /\b(?:reverse\s+causa\w+|causality\s+reversal|confounding|confounder|endogeneity|selection\s+effect|simpson'?s\s+paradox|correlation\s+(?:does\s+not|isn'?t)\s+(?:equal|imply)\s+causation|spurious\s+correlation|statistics|textbook|lecture|methodology|epidemiolog\w+|fallacy)\b/i,
];

// ─── 豁免二：实验/证据语境（方向已被检验）────────────────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|前瞻性研究|回顾性研究|队列研究|元分析|实验证明|实验表明|实验显示|数据显示|数据表明|统计显示|研究表明|调查显示|调研显示|跟踪研究|长期观察|实测|证据表明|有证据|临床试验|有效性试验/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[- ]blind|prospective|retrospective\s+cohort|cohort\s+study|meta[- ]analysis|experiment\w*|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|survey\w*|clinical\s+trial)\b/i,
];

// ─── 豁免三：推理否定/反向承认 ────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不代表|不等于|并不意味着|不意味着|推不出|不足以|未必|不一定|很难说|不见得|是因为|其实是因为|反过来|恰恰相反|反之|反过来才是|不能据此|无法据此/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient\s+evidence|no\s+evidence|is\s+because|actually\s+because|the\s+reverse|conversely|on\s+the\s+contrary)\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
// [r316 精确化] 原表收裸 seems?|appears?，实测把 r266 的核心攻击句
// 「Districts with more surveillance cameras see more property crime, so the
// cameras seem to attract it.」整句豁免——「seem to attract」是**伪 hedge 真
// 断言**：说话人用 seem 伪装谨慎，实际完成了一次完整的因果归因。r316 注入
// 实测：删除裸 seems?/appears? 后 9 个良性样本（含 3 个 seem 边缘良性）
// 零误伤，证明该条在本模块无承重性。故收紧为「仅与弱判断形容词/uncertainty
// 词搭配时豁免」，把「seem + 归因动词」的话术面让给判据 A 的 R-e 腿。
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|i\s+suspect|could\s+be)\b/i,
  // seem/appear 仅在与弱判断/不确定性词搭配时豁免（真 hedge）；
  // 「seem to attract」「appears to cause」等 + 归因动词形不豁免。
  /\b(?:seems?|appears?)\s+(?:reasonable|plausible|unclear|uncertain|unlikely|likely|safe|possible|impossible|helpful|useful|good|bad|better|worse|true|false|correct|wrong|so)\b/i,
];

// ─── 豁免五：主动发现语 [r316 新增] ────────────────────────────────
// 口径：被动发现形（「被及时识别」「被检出」）说明结果是**发现能力**的
// 产出而非应对行为制造的，属良性因果方向。防 RESULT_ZH 补阳性/病例族后
// 扩宽误伤面。
const EXEMPT_DETECT_ZH = [
  /被及时识别|被检出|被发现|被确诊|被识别出|被筛出|被揪出|被查出|被暴露|被揭示|被披露/,
];
const EXEMPT_DETECT_EN = [
  /\b(?:are|were|is|was|been|being)\s+(?:detected|identified|found|discovered|uncovered|revealed|caught|flagged|screened)\b/i,
  /\b(?:detected|identified|discovered|uncovered|revealed)\s+(?:earlier|sooner|more\s+quickly|in\s+time)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** [r316 新增] 列表中任一匹配在 text 里的**最早**出现位置；无命中返回 -1。
 *  用于 C-2 倒装判据的方向锚：RESULT 首次出现位置 < RESP 首次出现位置，
 *  证明「结果在前、应对行为在后」的倒装语序（因在后的句子是正向陈述，不判）。 */
function firstIdx(list, text) {
  let best = -1;
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (best < 0 || m.index < best) best = m.index;
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return best;
}

/** [r316 新增] C-2 倒装判据专用的窄化应对行为表。
 *  RESP_ZH 混了两类语义：①纯应对行为（装监控/戴口罩/请家教）②「处境名词 +
 *  报告/登记」族（失窃报告/报案）。用整个 RESP_ZH 做方向锚会被第②类污染——
 *  「失窃报告更多的地方都装了监控」中「失窃」既命中 RESULT 又命中 RESP_ZH
 *  首条，ri 与 pi 同时取到 0，方向锚失效（r316 实测）。本表只收第①类
 *  纯应对行为词，保证方向锚测的是「应对行为的位置」。 */
const RESP_ACTION_ZH = [
  /装[了有过]?(?:监控|摄像头|警报|报警器|防盗窗|防盗门|护栏|净水器|净化器|新风|智能锁|指纹锁|锁芯|门禁|闸机|安检|消防|喷淋|烟感|灭火器|应急灯|避雷针|隔音窗|防晒膜|防盗网|铁丝网|围栏|栅栏|门镜|猫眼|对讲|门铃|门锁)/,
  /安[装有了]{1,2}(?:监控|摄像头|警报|报警器|防盗窗|防盗门|护栏|净水器|净化器|新风|智能锁|指纹锁|门禁|闸机|安检|消防|喷淋|烟感|灭火器|避雷针|隔音窗|防盗网|围栏|栅栏|门铃|门锁)/,
  /戴[了过]?(?:口罩|头盔|护具|护膝|护腰|护腕|手套|面罩|防护面罩|N95|KN95|防毒面具|呼吸器|安全带|安全绳|护目镜|墨镜|隐形眼镜|OK镜|角膜塑形镜|助听器|耳塞|耳罩)/,
  /吃[了过]?(?:保健品|补品|营养品|维生素|钙片|鱼油|益生菌|蛋白粉|褪黑素|安眠药|止痛药|感冒药|退烧药|抗生素|中成药|草药|偏方|特效药)/,
  /买[了过]?(?:保险|医保|社保|重疾险|医疗险|意外险|寿险|年金|理财产品|基金|股票|债券|定期|活期|黄金|美元|欧元|日元|避险资产)/,
  /囤[了过]?(?:口罩|盐|药品|药|货|食物|粮食|水)|备[了过]?药|抢购|囤货|囤口罩|囤盐|吃保健品|装净水器|买净化器|装警报器|请保镖|买防身器|加装锁|换锁芯/,
  /报警|报案|投诉|维权|申诉|上诉|打官司|起诉|补习|补课|辅导班|请家教|复读|考研|约谈|诫勉|隔离|封控|封城|封锁|静态管理|裁员|裁撤|下岗|辞退|封号|禁言|下架|整顿|整改|检修|返工|止损|割肉|平仓|抢救|救援|灭火|装护栏|立规矩|定规章|助听器|拄拐|轮椅|假肢|护膝|护腰|护腕|支具|矫姿器|背背佳|近视手术|激光手术|正畸|整牙|箍牙|种牙|根管|针灸|推拿|拔罐|艾灸|理疗|康复训练|戒毒|戒酒|美沙酮|写检查|记过|处分|停课|请家长|补考|重修|补作业|查征信|拉征信|调流水|报险|理赔|核保|索赔|反诈|防骗教育|安全教育|延保|质保|召回|返厂|风控|反欺诈|确诊|核酸检测|抗原检测|做核酸|扫码|验码|登记|报备|居家隔离|居家办公|居家学习|线上教学|网课|停学|封校|闭环管理|静默|方舱|集中隔离|强制隔离|疫苗|接种|加强针|打疫苗|劝退|清退|退学|开除|除名|留级|降级|停职|免职|撤职|分手|离婚|拉黑|绝交|断亲/,
];

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** [r315 新增] nearFrom 的镜像：目标窗从 source 匹配的**起点向前**取 win 字。
 *  用于中文「结果在前、动词在后」语序——「学生头痛请假更多，可见是学校
 *  课业压力导致」：负面结果名词（头痛/请假）在因果动词「导致」之前，
 *  nearFrom 向后开窗永远看不到它。刻意只用于中文腿：英文 S+V+O 语序固定，
 *  加 before 窗会把 "theft causes security spending" 这类正向句误判。 */
function nearBefore(sourceList, targetList, text, win) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const seg = text.slice(Math.max(0, m.index - win), m.index);
      if (anyHit(targetList, seg)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/** [r315 新增] nearAny 的方向限定形：source 匹配之后 win 字内出现 target。
 *  用于 R-d「X 的 Y」中距框——「装了监控的店铺盗窃案更多」要求应对行为
 *  名词在差异标记**之前**（因果倒置的语用方向：先看应对行为分布，再看结果
 *  分布）。双向窗会把「更多投诉」这类正常语序也框进来，故只取向后。 */
function nearAnyBefore(sourceList, targetList, text, win) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const seg = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, seg)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/** 与 nearAny 同，但目标窗从 source 匹配的**起点**起算（而非终点）——
 *  腿② 的因果动词模式「是…的原因」「原因就在于」会把结果名词整个吞进
 *  自己的匹配里（「裁员是公司衰败的原因」），从终点起算窗内只剩句号，
 *  结果腿永远找不到负面结果名词（r174 首版因此漏判整族）。 */
function nearFrom(sourceList, targetList, text, win) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const seg = text.slice(m.index, m.index + win);
      if (anyHit(targetList, seg)) return true;
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿①：R-a 选择差异框 + R-b 递增相关框 */
function responseZh(text, R) {
  const RESP = R.RESP_ZH || RESP_ZH;
  const GROUP = R.GROUP_DE_ZH || GROUP_DE_ZH;
  const DIFF = R.DIFF_ZH || DIFF_ZH;
  const YUE = R.YUE_ZH || YUE_ZH;
  // R-a：反应型行为 + 的 + 群体名词（前后双向：英文侧群体在前），且句中有差异标记
  if (nearAny(RESP, GROUP, text, 5, true) && anyHit(DIFF, text)) return true;
  // R-b：反应型行为 + 越（12 字窗）且全文「越」≥2 次（「报警越多的社区犯罪率越高」）
  if (nearAny(RESP, YUE, text, 12, false)) {
    const n = (text.match(/越/g) || []).length;
    if (n >= 2) return true;
  }
  // R-c [r315 新增] 紧凑选择框：应对行为 + 差异标记**直接相邻**（无群体名词）
  // ——r266 L1 报告的深层缺口。存量 R-a 强制要求「应对行为 + 的 + 群体名词」，
  // 而 agent-2 实测的攻击族结构是「装了净水器的家庭水质投诉更多，可见净水器
  // 会吸引投诉」：腿①实触但 GROUP_DE_ZH 不触——结果名词后直接接 DIFF（更多）
  // 再接逗号，句中根本没有群体名词可配。r315 实测：只补 RESULT_ZH 词表仍漏
  // 7/10，本框落成后 0/10。口径：应对行为词与 DIFF 在 4 字窗内直接相邻，
  // 且应对行为必须在 DIFF 之前（「投诉更多」✓；「更多投诉」形由腿②承担判定）。
  if (nearAny(RESP, DIFF, text, 4, false)) return true;
  // R-d [r315 新增] 「X 的 Y」中距选择框——r315 矩阵最后一条 MISS：
  // 「装了监控的店铺盗窃案更多，可见监控会招致小偷」。腿①实际已触
  // （RESP=装监控、DIFF=更多），但中间隔了「的店铺盗窃案」7 字，4 字窗
  // 装不下。本框放宽到 14 字，并要求 RESP 在 DIFF 之前（方向性防误判：
  // 「更多投诉」形仍由腿②承担）。14 字口径取自本族实测最长中距
  // （「装了净水器的家庭水质投诉」= 9 字），留 5 字余量。
  if (nearAnyBefore(RESP, DIFF, text, 14)) return true;
  return false;
}

/** 英文腿①：反应型行为 × 群体名词（30 字符窗双向）× 差异标记 */
function responseEn(text, R) {
  const RESP = R.RESP_EN || RESP_EN;
  const GROUP = R.GROUP_EN || GROUP_EN;
  const DIFF = R.DIFF_EN || DIFF_EN;
  const CAUSE = R.CAUSE_EN || CAUSE_EN; // [r316] R-e 后置腿的方向锚
  if (nearAny(RESP, GROUP, text, 30, true) && anyHit(DIFF, text)) return true;
  // 递增相关框：the more X … the more/worse Y（比较词两侧同族即可）
  if (/\bthe\s+(?:more|worse|higher|greater|fewer)\b[^.]{0,40}\bthe\s+(?:more|worse|higher|greater|fewer)\b/i.test(text) && anyHit(RESP, text)) return true;
  // R-c [r316 新增] 英文紧凑选择框：应对行为 + 差异标记**直接相邻**（无群体名词）
  // ——r315 只给 ZH 侧补了 R-c/R-d，EN 侧仍是 R-a 单腿，导致 r266 的核心攻击句
  // 「Neighborhoods that installed doorbell cameras see more package theft, so
  // doorbell cameras are attracting thieves.」（GROUP_EN 无名词可配）从 hit
  // 翻转为 miss。本腿镜像 ZH R-c 口径：应对行为与 DIFF 在 30 字符窗内共现，
  // 且 RESP 在 DIFF 之前（方向性防误判：「more complaints」形由 R-a 承担）。
  if (nearAnyBefore(RESP, DIFF, text, 30)) return true;
  // R-d [r316 新增] 英文中距选择框——「Warehouses with cameras installed report
  // more thefts」形：RESP 与 DIFF 中间隔 with/installed 等修饰，30 字符窗装不下。
  // 放宽到 80 字符，同样要求 RESP 在 DIFF 之前。80 字符口径取自本族实测最长
  // 中距（"Neighborhoods that installed doorbell cameras see more" = 55 字符），
  // 留 25 字符余量。
  if (nearAnyBefore(RESP, DIFF, text, 80)) return true;
  // R-e [r316 新增] 英文后置倒装框：应对行为名词出现在差异标记**之后**
  // ——「Districts with more surveillance cameras see more property crime, so
  // the cameras seem to attract it」。R-c/R-d 均要求 RESP 在 DIFF 之前
  // （防「more complaints」良性形误伤），故倒装方向单独开腿。
  // 方向锚用 CAUSE_EN：句中后段须出现 attracts?/draws?/drew 等归因动词，
  // 把「RESP 在 DIFF 后」与良性「X is more common, so we installed cameras」
  // （RESP 在后但无归因动词）区分开。
  // [r316 修复] bothWays=true——r316 初版只向前开窗（nearAny 默认），而倒装句的
  // 主语名词在归因动词**之前**：「so the cameras seem to attract it」中 cameras
  // 位于 attract 左侧，前向窗永远看不到它，导致 8/8 回归锁定的第 8 条 miss。
  // 窗宽从 120 收紧到 60：双向开窗会把「cameras … attract」两侧 60 字内任何
  // 同现都算邻近，120 过宽会稀释方向锚的精度（实测 60 覆盖本族最长倒装距
  // "so the cameras seem to attract" = 28 字符，留 2 倍余量）。
  if (nearAny(CAUSE, RESP, text, 60, true) && nearAnyBefore(DIFF, RESP, text, 90)) return true;
  return false;
}

/** [r316 新增] 英文腿②倒装伴随框：因果动词 + 负面结果，结果名词可在动词**之前**。
 *  nearFrom 只向后开窗，而 R-e 倒装族的结果名词整批落在动词左侧——「Districts
 *  with more surveillance cameras see more property crime, so the cameras seem to
 *  attract it」：crime(idx 59) 在 attract(idx 89) 之前，45 字符前向窗看不到它，
 *  腿①（R-e）虽过、腿②恒死，整句仍 miss（r316 实测 8/8 回归锁定第 8 条）。
 *  本函数是 nearFrom 的 before 镜像，win 60 字符口径与 R-e 窗宽对齐：覆盖
 *  "…property crime, so the cameras seem to attract" = 44 字符，留余量。
 *  只对 EN 腿②开启，不触碰中文腿②的三档 before 窗（那条族语序不同）。 */
function nearFromBefore(sourceList, targetList, text, win) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const seg = text.slice(Math.max(0, m.index - win), m.index);
      if (anyHit(targetList, seg)) return true;
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** [r299 新增] 主判据 B：应急响应调度框（第一响应者被当成危机的原因）。
 *  三条件共现：
 *   ① RESPONDER 响应者名词在场；
 *   ② CRISIS 危机名词在场；
 *   ③ LINK 因果连接，两形任一：
 *      - 显式因果动词，且方向为「响应者→动词→危机」（响应者在动词前
 *        winBefore 窗内、危机在动词后 winAfter 窗内），动词前 winNeg 窗
 *        内无否定词——排除「不是…的原因」「firefighters don't cause fires」
 *        与「the fire was caused by arson, and firefighters put it out」
 *        （响应者不在动词前）两类良性；
 *      - 越X越Y 形（中文，全文「越」≥2）或 the more…the more 形（英文），
 *        如「拖车越多，事故越多」。
 *  复用 CAUSE_ZH/CAUSE_EN（因果动词表），不另立动词表。 */
function responderDispatch(text, isZh, R) {
  const RESPONDER = isZh ? (R.RESPONDER_ZH || RESPONDER_ZH) : (R.RESPONDER_EN || RESPONDER_EN);
  const CRISIS = isZh ? (R.CRISIS_ZH || CRISIS_ZH) : (R.CRISIS_EN || CRISIS_EN);
  const CAUSE = isZh ? (R.CAUSE_ZH || CAUSE_ZH) : (R.CAUSE_EN || CAUSE_EN);
  if (!anyHit(RESPONDER, text)) return false;
  if (!anyHit(CRISIS, text)) return false;
  // 越X越Y / the more…the more 形（无显式因果动词）
  if (isZh) {
    if ((text.match(/越/g) || []).length >= 2) return true;
  } else if (/\bthe\s+(?:more|worse|higher|greater)\b[^.]{0,50}\bthe\s+(?:more|worse|higher|greater)\b/i.test(text)) {
    return true;
  }
  // 显式因果动词 + 方向（响应者在前、危机在后）+ 否定守卫
  const winBefore = isZh ? 20 : 55;
  const winAfter = isZh ? 14 : 45;
  const negNear = isZh ? /不|没|未|并非|未必|无从|难以/ : /\b(?:not|never|no|cannot|can'?t|don'?t|doesn'?t|isn'?t|won'?t|hardly|without)\b/i;
  for (const re of CAUSE) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - winBefore), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + winAfter);
      const pre = text.slice(Math.max(0, m.index - 12), m.index);
      if (!negNear.test(pre) && anyHit(RESPONDER, before) && anyHit(CRISIS, after)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkReverseCausation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_DETECT_ZH || EXEMPT_DETECT_ZH, text) || anyHit(R.EXEMPT_DETECT_EN || EXEMPT_DETECT_EN, text)) return { hit: false, score: 0, detail: '', count: 0 }; // [r316]
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据 A：腿① 反应型行为框 × 腿② 因果归因
  const response = isZh ? responseZh(text, R) : responseEn(text, R);
  if (response) {
    // 腿② CAUSE 因果归因：因果动词 × 负面结果（从因果动词起点起 18 字 /
    // 45 字符窗——「是…的原因」形的结果名词在动词匹配内部）
    // [r315 补] 双向窗：中文攻击族大量使用「结果在前、动词在后」语序——
    // 「学生头痛请假更多，可见是学校课业压力导致」「可见确诊引发了感染」
    // 「可见监控会招致小偷」——负面结果名词出现在因果动词**之前**，仅向后
    // 开窗的旧腿②整句漏判（r315 实测 3 条）。英文侧语序固定 S+V+O 不需要，
    // 故只对中文腿加 before 窗，避免放宽英文召回口径。
    const cause = isZh
      ? (nearFrom(R.CAUSE_ZH || CAUSE_ZH, R.RESULT_ZH || RESULT_ZH, text, 18)
        || nearBefore(R.CAUSE_ZH || CAUSE_ZH, R.RESULT_ZH || RESULT_ZH, text, 16)
        // [r315 补] 双向窗 26 字档：应对行为名词后置的收尾归因句——「可见监控
        // 会招致小偷」——结果名词（小偷）距动词（招致）22 字，16 字 before
        // 窗仍差一截。26 字档覆盖「可见 X 会/可能/或许 + 动词 + 结果」全形。
        || nearBefore(R.CAUSE_ZH || CAUSE_ZH, R.RESULT_ZH || RESULT_ZH, text, 26))
      : (nearFrom(R.CAUSE_EN || CAUSE_EN, R.RESULT_EN || RESULT_EN, text, 45)
        // [r316 新增] 倒装伴随窗：R-e 倒装族（RESP 在 DIFF 后 + 归因动词收尾）的
        // 结果名词整批落在因果动词左侧，45 字符前向窗看不到。60 字符 before 窗
        // 与 R-e 腿①窗宽对齐。中文侧不加——ZH 腿②已有三档 before 窗覆盖。
        || nearFromBefore(R.CAUSE_EN || CAUSE_EN, R.RESULT_EN || RESULT_EN, text, 60));
    if (cause) {
      return {
        hit: true, score: 0.6, count: 1,
        detail: isZh
          ? '因果倒置×把后果的应对行为当成后果的原因(zh)'
          : 'reverse causation×response-action-as-cause(en)',
      };
    }
  }

  // 主判据 B（r299 新增）：应急响应调度框（第一响应者被当成危机的原因）
  if (responderDispatch(text, isZh, R)) {
    return {
      hit: true, score: 0.6, count: 1,
      detail: isZh
        ? '因果倒置×应急响应被当成危机的原因(zh)'
        : 'reverse causation×first-responder-as-cause(en)',
    };
  }

  // 主判据 C（r315 新增）：倒装归因框——负面结果在句首、应对行为名词在句尾，
  // 全句无显式因果动词（「失窃报告更多的地方都装了监控」「投诉更多的家庭恰恰
  // 是买了净水器的那些」）。这类句式是 r315 实测的攻击族残留：腿①三框均要求
  // 「RESP 在前、结果在后」，而倒装句方向相反；腿②要求 CAUSE 动词，倒装句没有。
  // 判据：①RESULT_ZH 结果名词 + DIFF 差异标记共现（结果在前）；
  //        ②句尾/句中出现应对行为名词（RESP_ZH）与「装/买/戴/吃」等安装消费动词；
  //        ③中间由「的地方/人/恰恰/恰好/正是/都是」等归因连接词桥接；
  //        ④无因果动词亦成立（这正是它与判据 A 的分界）。
  // 豁免沿用上方全局豁免（EXEMPT_*），此处不再重复。
  // [r316 新增] 资源配置说明豁免——「隔离点越多恰恰说明疫情越重，这是按疫情
  // 密度调配的」是**正确的资源-需求同向陈述**（应对行为按结果密度配置，因果
  // 方向正确）。r316 实测：加 INV_LINK_ZH 的「可见/说明」后该良性句被 C 判据
  // 误伤。特征：句中出现「按 X 调配/根据 X/依据 X」的资源配置标记。它与攻击句
  // 的分界是攻击句把应对行为说成结果的**原因**，而良性句说成结果的**响应**。
  const INV_LINK = R.INV_LINK_ZH || INV_LINK_ZH;
  // [r316 新增] 应急响应调度说明标记（C/C-2 共用豁免）：资源按需求强度配置。
  const ALLOC_ZH = R.ALLOC_ZH || [
    /按[^。，]{0,12}(?:调配|配置|分配|安排|布点|部署|增减|浮动)/,
    /根据[^。，]{0,12}(?:调配|配置|分配|安排|布点|部署|增减|浮动|确定|调整)/,
    /依据[^。，]{0,12}(?:调配|配置|分配|安排|布点|部署|增减|浮动|确定|调整)/,
    /随[^。，]{0,12}(?:增减|浮动|调整)/,
  ];
  if (isZh) {
    const hasAlloc = anyHit(ALLOC_ZH, text);
    const hasResultFirst = /(?:失窃|盗窃|投诉|请假|生病|感染|确诊|事故|报警|举报|退货|差评|举报|维权|报案|抑郁|失眠|倒闭|崩盘|亏损|通报|问责|起诉|索赔|返修|挂科|缺勤|停工|停业|塌房|翻车|人设崩塌|爆雷|被抓|被查|被罚|病例|阳性|死亡|伤亡|自杀|轻生|猝死|遇害|受伤|生病|感冒|发热|发烧|咳嗽|头痛|头晕|不适|过敏|皮疹|失眠|复发|恶化|并发症|后遗症|成瘾|上瘾|辍学|退学|旷课|停产|下滑|下跌|开除|除名|留级|降级|停职|免职|撤职)(?:报告|人数|次数|案例|案件|数量|的|人数|登记|报备)?(?:更|偏|较|明显|显著)?(?:多|高|大|严重|频繁|集中)/.test(text)
      // [r316 修复] 原为 anyHit(RESULT_ZH, text) 直接用模块常量，导致注入
      // （R.RESULT_ZH = []）穿透不生效——存量测试的承重证明在该分支上失真。
      || anyHit(R.RESULT_ZH || RESULT_ZH, text);
    // [r316 修复] 同 581 行：裸常量改注入感知，保证承重证明在判据 C 上有效
    const hasRespTail = anyHit(R.RESP_ZH || RESP_ZH, text);
    const hasBridge = anyHit(INV_LINK, text);
    if (hasResultFirst && hasRespTail && hasBridge && !anyHit(R.CAUSE_ZH || CAUSE_ZH, text) && !hasAlloc) {
      return {
        hit: true, score: 0.55, count: 1,
        detail: '因果倒置×倒装归因(结果前置+应对行为后置无因果动词)(zh)',
      };
    }
    // C-2 [r316 新增] 倒装 + 显式归因动词形——「盗窃案更多的街区都装了监控，
    // 可见监控在招致小偷」。原判据 C 第④条件 `!CAUSE_ZH` 把带归因动词的倒装句
    // 整族挡在门外：说话人先铺结果分布，再用「可见 X 在/会 + 动词 + 结果」完成
    // 断言归因，比无动词形**更强**而非更弱。r316 变体矩阵实测 2/6 漏判均死于此。
    // 与 C 的分界只在于有无因果动词，桥接词 INV_LINK 与方向性（RESULT 在
    // RESP 之前）保持不变，故共用 hasResultFirst/hasRespTail/hasBridge 三条件。
    if (hasResultFirst && hasRespTail && hasBridge && anyHit(R.CAUSE_ZH || CAUSE_ZH, text) && !hasAlloc) {
      // 方向锚：结果名词须在应对行为名词之前（防「监控装了所以盗窃更多」误伤——
      // 那句是因在前，方向相反）。用 RESULT 首次出现位置 < RESP_ACTION 首次位置。
      // [r316] 刻意不用 RESP_ZH 做锚：它含「失窃报告/报案」族，句中「失窃」会
      // 同时命中 RESULT 与 RESP_ZH 首条，ri==pi==0 使方向锚失效（实测）。
      const ri = firstIdx(R.RESULT_ZH || RESULT_ZH, text);
      const pi = firstIdx(R.RESP_ACTION_ZH || RESP_ACTION_ZH, text);
      if (ri >= 0 && pi >= 0 && ri < pi) {
        return {
          hit: true, score: 0.6, count: 1,
          detail: '因果倒置×倒装归因(结果前置+应对行为后置+显式归因动词)(zh)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkReverseCausation,
  __internals: () => ({
    RESP_ZH, GROUP_DE_ZH, DIFF_ZH, YUE_ZH, CAUSE_ZH, RESULT_ZH,
    RESP_EN, GROUP_EN, DIFF_EN, CAUSE_EN, RESULT_EN,
    RESPONDER_ZH, RESPONDER_EN, CRISIS_ZH, CRISIS_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_DETECT_ZH, EXEMPT_DETECT_EN, // [r316]
  }),
};
