/**
 * src/baseline-omission.js — 「基线缺失（无对照比例结果断言）」检测器（第 268 个判别维度）
 *
 * [r398 立项] decision 本体在 v6.8.197（266 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。探针实证（/tmp/hf-r398-probe-pool.js，v6.8.197
 * gate 层）：本族攻击 7/7 完全穿透、零维度承重。
 *
 * 辨别的族：基线缺失（baseline omission / uncontrolled rate claim）——报告一个
 * **比例结果**（治愈率/满意度/成功率/缓解率/达标率/留存率/复购率…），却
 * **不交代对照组、基线、分母口径或样本来源**，把一个没有参照系的百分比当成
 * 疗效/效果的证明：
 *   这种新疗法治愈率高达九成，效果惊人。
 *   用了我们的产品，百分之八十的客户都满意。
 *   本课程学员九成实现了收入翻倍。
 *   这种药的缓解率达到百分之八十五。
 *   The new treatment cures ninety percent of patients.
 *   Our product achieves an eighty percent success rate.
 *   After the training, ninety percent of students doubled their income.
 *
 * 与既有维度的边界（r398 归因，源码逐链核对）：
 *   · statistical_misleading（第 58 维）管**基数小到没意义**（满意度从 2 人涨到
 *     8 人）——它要求句中**给出绝对量**且落在小样本区间；本族可完全无数字细节、
 *     只给一个大比例，错在**无对照参照系**而非样本量。它给了大基数（样本量
 *     12000）会早退放过，而「样本量 12000 的治愈率九成」若无对照组仍是本族。
 *   · percentage_overflow 管**百分比数值超 100** 的算术错误，本族百分比完全合法。
 *   · base_rate_neglect（第 169 维）管**阳性信号→高置信后验结论**（检测阳性所以
 *     几乎肯定得病）——错在忽略先验概率；本族错在**缺少对照组**，腿②不是置信
 *     模态词而是疗效/效果断言。
 *   · weak_evidence_strong_claim（第 245 维）管**证据强度与结论强度不匹配**的
 *     泛化结构，不特指比例结果缺对照这一具体证据纪律缺口。
 *   · unsupported_claim 管泛化无依据断言；本族**有**依据（一个百分比结果），
 *     错在依据不完整（无对照），不是无依据。
 *
 * 判据（双腿共现 + 邻近窗 + 三组豁免，缺一不判）：
 *   · 腿① RATE_RESULT 比例结果名词（必须带「率」或 EN rate/percent-of 结构）：
 *     治愈率/缓解率/成功率/满意率/满意度/达标率/留存率/复购率/完成率/合格率/
 *     通过率/有效率/转阴率/降幅/增幅/上涨率/提升率/续费率/退订率/退货率/
 *     完课率/及格率/优秀率/好评率/转化率/中奖率/命中率；EN cure rate /
 *     recovery rate / success rate / satisfaction (rate|level) / retention
 *     rate / repurchase rate / pass rate / completion rate / response rate /
 *     conversion rate / survival rate / graduation rate / refund rate。
 *     **裸名词自查**：腿①收「治愈率」也收去掉「率」字后仍指同一指标的口语形
 *     （「治好了九成」「满意度 90%」），故另设 RATE_RESULT_VERB 形（见下），
 *     防止只收带后缀名词导致整族漏判（161 轮教训）。
 *   · 腿①b RATE_RESULT_VERB 结果动词×比例（「治好了九成」「八成客户都满意」
 *     「九成学员实现」「百分之八十的客户」）——治愈/治好了/缓解/改善/康复/痊愈/
 *     满意/认可/点赞/达标/完成/通过/及格/留存/复购/续费/退订/退货/翻倍/提升/涨了
 *     × 比例（九成/八成/七成…/百分之N/N% / N percent / N out of N）。
 *   · 腿② CLAIM_EFFECT 疗效/效果断言（高达/达到/高达九成/惊人/显著/明显/完胜/
 *     效果看得见/证明有效/说明有效/疗效确切/值得信赖/遥遥领先；EN achieves /
 *     delivers / proves / confirms / remarkable / impressive / dramatic /
 *     significant improvement）。缺腿②只陈述数字不收（「治愈率 90%，待验证」）。
 *
 * 为什么取 VERIFY 级：单句可能是合规披露中的一句、转述他人宣传话术、或作者
 * 正要批判该数据缺对照。verify 的含义是「这个比例结果没有对照参照系，需要补上
 * 对照组、基线或分母口径才能判断它是否构成疗效证据」——调用方应要求补对照数据，
 * 而不是接受孤立百分比当效果证明。
 *
 * 明确不判的（豁免——这些是计及对照的正确陈述或可验证披露）：
 *   · 对照/基线纪律语言在场（对照组/控制组/基线组/基线值/基线水平/安慰剂/双盲/
 *     随机对照/RCT/历史对照/行业均值/行业平均/基准值/分母/样本量/参与人数/
 *     总人数/统计口径/control group / placebo / randomized / baseline /
 *     compared with / versus / out of N / sample size / benchmark）：陈述已在
 *     正确口径上；
 *   · 数字被质疑或待核验的元陈述（治愈率需要验证/数据存疑/样本太小/无法验证/
 *     unverified / needs verification / sample too small）：作者在破除而非运用；
 *   · 纯披露形（试验完成，治愈率数据已提交监管机构备案）无效果断言腿②；
 *   · 统计教学/谬误分析转述（这是典型的缺少对照组的数据、本案例问题在于没有基线）。
 */

const RATE_RESULT_ZH = /(?:治愈率|缓解率|康复率|痊愈率|转阴率|成功率|满意率|满意度|达标率|留存率|复购率|续费率|完成率|合格率|及格率|通过率|优秀率|有效率|好评率|完课率|退货率|退订率|转化率|上涨率|提升率|增幅|降幅|中奖率|命中率|命中率|占有率|使用率|打开率|点击率|阅读率|完播率|及格率)/;
const RATE_RESULT_EN = /(?:\b(?:cure|recovery|survival|success|satisfaction|retention|repurchase|pass|completion|response|conversion|graduation|refund|return|response|engagement|click[- ]?through|open|read)\s+rate|satisfaction\s+level|\brate\s+of\s+(?:cure|recovery|success|survival|response|retention)\b|\d+\s*(?:percent|%)\s+of\b)/i;

// 腿①b：结果动词 × 比例（治好了九成 / 八成客户都满意 / 九成学员实现 / 百分之八十的客户）
const RATE_VERB_ZH = /(?:治愈|治好了|治好|缓解|改善|康复|痊愈|转阴|满意|认可|点赞|好评|达标|完成|通过|及格|留存|复购|续费|翻倍|提升|涨了|上涨|下降|降低|减少|瘦身|提分|提薪|涨薪|上岸|录用|录取|晋升|中标|赢单|得分|拿到)/;
const RATE_NUM_ZH = /(?:[一二三四五六七八九十百]\s*成|百分之\s*[一二三四五六七八九十百零〇两]+\s*(?:%|个百分点)?|\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*个?百分点|大半|过半|一半|多一半)/;
const RATE_VERB_EN = /(?:\b(?:cures?|cured|recovered?|heals?|healed|improves?|improved|satisfied|satisfy|pleased|delighted|approved|recommended|passed|passes|completes?|completed|retained|repurchased|subscribed|renewed|refunded|returned|graduated|promoted|hired|converted|doubled|tripled)\b)/i;
const RATE_NUM_EN = /(?:\b(?:ninety|eighty|seventy|sixty|fifty|forty|thirty|twenty|ten)\s*(?:percent|per\s?cent|%)\b|\b\d+(?:\.\d+)?\s*(?:percent|per\s?cent|%)\b|\bnine\s+(?:out\s+of|in)\s+ten\b|\beight\s+(?:out\s+of|in)\s+ten\b|\bmost\s+of\b)/i;

const CLAIM_EFFECT_ZH = /(?:高达|达到了|达到|惊人|显著|明显|完胜|效果看得见|看得见的效果|证明.{0,4}有效|说明.{0,4}有效|疗效确切|值得信赖|遥遥领先|创历史新高|再创新高|史无前例|空前|行业第一|全国第一|销量第一|口碑第一|实力证明|用实力说话|事实证明|效果出众|效果卓越|极为出色|表现亮眼|成绩斐然|硕果累累|战果辉煌|收益颇丰|回报丰厚|都很满意|均表示满意|纷纷表示满意|都感到满意|都满意|都表示认可|都点赞|都给出了好评|都反馈不错|反响热烈|反响火爆|实现了.{0,8}(?:翻倍|增长|提升|上涨|跃升|逆袭|蜕变|突破)|完成了.{0,10}(?:目标|任务|指标|KPI)|创下|刷新|打破纪录|再创|屡创|轻松实现|顺利实现|圆满|大获成功|大获全胜|大卖|热销|畅销|爆款|卖爆|抢购一空|供不应求|门庭若市|座无虚席|好评如潮|赞誉有加|交口称赞|口碑爆棚|圈粉无数|实力圈粉|很成功|相当成功|非常成功|成效显著|成效明显|说明.{0,8}(?:有效|成功|提升|改善|有用|靠谱))/;
const CLAIM_EFFECT_EN = /(?:\bachieves?\b|\bdelivers?\b|\bproves?\b|\bconfirms?\b|\bremarkable\b|\bimpressive\b|\bdramatic\b|\bsignificant\s+(?:improvement|increase|results?|gain)\b|\boutstanding\b|\bexceptional\b|\bunparalleled\b|\bindustry[- ]leading\b|\bmarket[- ]leading\b|\brecord[- ]breaking\b|\bguaranteed\s+results?\b|\boverwhelmingly\s+(?:positive|satisfied|successful)\b|\ball\s+(?:satisfied|pleased|agreed)\b|\bconsistently\s+(?:high|positive|successful)\b|\bhighly\s+(?:satisfied|effective|successful)\b|\bproven\s+results?\b|\bresults?\s+speak\s+for\s+themselves\b|\b(?:cures?|heals?|fixes?|works?\s+for|boosts?|skyrockets?|supercharges?|transforms?)\s+(?:\w+\s+){0,3}(?:percent|per\s?cent|%|out\s+of)\b|\b(?:users?|customers?|clients?|patients?|students?|members?|buyers?|subscribers?)\s+(?:completed|achieved|reported|experienced)\b|\b(?:doubled|tripled|quadrupled)\s+(?:their|its|his|her)\s+(?:income|revenue|output|performance|sales|score)\b|\b(?:reported|experienced|saw)\s+(?:significant|substantial|dramatic|remarkable)\s+(?:improvement|gains?|growth|results?)\b|\b(?:improves?|improved|boosts?|boosted|enhances?|enhanced)\s+\w+(?:\s+\w+){0,3}\s+for\s+(?:\w+\s+){0,3}(?:percent|per\s?cent|%|out\s+of)\b|\bworks?\s+like\s+a\s+charm\b|\bmiracle\b|\bgame[- ]?changer\b)/i;

// 豁免 A：对照/基线纪律语言在场
const EXEMPT_CONTROL_ZH = /(?:对照组|控制组|对照组数据|基线组|基线值|基线水平|基线调查|基线数据|安慰剂|双盲|随机对照|随机分组|RCT|历史对照|横向对比|纵向对比|行业均值|行业平均|行业水平|基准值|基准线|参照系|分母|样本量|参与人数|总人数|有效样本|统计口径|测量口径|口径一致|同口径|与.{0,6}相比|较.{0,6}提升|环比|同比)/;
const EXEMPT_CONTROL_EN = /(?:\bcontrol\s+group\b|\bplacebo\b|\brandomi[sz]ed\b|\bbaseline\b|\bbenchmark\b|\bcompared\s+(?:with|to)\b|\bversus\b|\bvs\.?\b|\bsample\s+size\b|\bout\s+of\s+\d|\bdenominator\b|\bagainst\s+the\s+(?:average|benchmark|control)\b|\bpeer\s+average\b|\bindustry\s+average\b)/i;

// 豁免 B：被质疑/待核验的元陈述
const EXEMPT_META_ZH = /(?:需要验证|有待验证|待验证|数据存疑|存疑|无法验证|未经证实|缺乏对照|缺少对照|没有对照|样本太小|样本不足|证据不足|孤证|难以复现|不能证明|不足以证明|需要补|待核验|数据不完整|口径不清|来源不明|尚未核验|未核验|未能核实|待核实|待确认|有待确认|数据尚未|尚未公布|未公布|暂未公布)/;
const EXEMPT_META_EN = /(?:\bunverified\b|\bneeds?\s+verification\b|\bsample\s+too\s+small\b|\blacks?\s+(?:a\s+)?control\b|\bno\s+control\s+group\b|\bcannot\s+be\s+verified\b|\binsufficient\s+evidence\b|\bnot\s+enough\s+data\b|\bpreliminary\s+(?:data|results)\b|\bunconfirmed\b)/i;

// 豁免 C：统计教学/谬误分析转述
const EXEMPT_PEDAGOGY_ZH = /(?:谬误| fallacy |案例教学|反例|典型错误|错误示范|教学|教材|课本|课程中|举例|示例|比如这个|剖析|拆解)/;
const EXEMPT_PEDAGOGY_EN = /(?:\bfallacy\b|\bcase\s+study\b|\bfor\s+example\b|\bfor\s+instance\b|\billustrates?\b|\btextbook\b|\bthis\s+is\s+a\s+classic\s+example\b|\bwhat.s\s+wrong\s+with\b)/i;

function _normText(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/[\u3000]/g, ' ').replace(/\s+/g, ' ');
}

function checkBaselineOmission(text, inject) {
  const t = _normText(text);
  if (!t || t.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const R = inject || {};
  const RATE_ZH_ = R.RATE_RESULT_ZH || RATE_RESULT_ZH;
  const RATE_EN_ = R.RATE_RESULT_EN || RATE_RESULT_EN;
  const VERB_ZH_ = R.RATE_VERB_ZH || RATE_VERB_ZH;
  const NUM_ZH_ = R.RATE_NUM_ZH || RATE_NUM_ZH;
  const VERB_EN_ = R.RATE_VERB_EN || RATE_VERB_EN;
  const NUM_EN_ = R.RATE_NUM_EN || RATE_NUM_EN;
  const CE_Z = R.CLAIM_EFFECT_ZH || CLAIM_EFFECT_ZH;
  const CE_E = R.CLAIM_EFFECT_EN || CLAIM_EFFECT_EN;
  const EC_Z = R.EXEMPT_CONTROL_ZH || EXEMPT_CONTROL_ZH;
  const EC_E = R.EXEMPT_CONTROL_EN || EXEMPT_CONTROL_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const EP_Z = R.EXEMPT_PEDAGOGY_ZH || EXEMPT_PEDAGOGY_ZH;
  const EP_E = R.EXEMPT_PEDAGOGY_EN || EXEMPT_PEDAGOGY_EN;

  // 三组豁免，任一在场即不判
  if (EC_Z.test(t) || EC_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EM_Z.test(t) || EM_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EP_Z.test(t) || EP_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(t);

  // 腿①：比例结果名词，或 结果动词×比例 结构
  const hasRateNoun = RATE_ZH_.test(t) || RATE_EN_.test(t);
  let verbNum = null;
  if (!hasRateNoun) {
    if (VERB_ZH_.test(t) && NUM_ZH_.test(t)) verbNum = 'zh';
    else if (VERB_EN_.test(t) && NUM_EN_.test(t)) verbNum = 'en';
    if (!verbNum) return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 腿②：疗效/效果断言
  const hasClaim = CE_Z.test(t) || CE_E.test(t);
  if (!hasClaim) return { hit: false, score: 0, detail: '', count: 0 };

  const reasons = [];
  if (hasRateNoun) reasons.push(isZh ? '比例结果名词' : 'rate-result noun');
  else reasons.push(isZh ? '结果动词×比例' : 'result-verb×proportion');

  return {
    hit: true,
    score: 0.56,
    count: 1,
    detail: isZh
      ? `基线缺失×比例结果无对照断言(zh, ${reasons[0]})`
      : `baseline omission×uncontrolled rate claim(en, ${reasons[0]})`,
  };
}

module.exports = {
  checkBaselineOmission,
  __internals: () => ({
    RATE_RESULT_ZH, RATE_RESULT_EN,
    RATE_VERB_ZH, RATE_NUM_ZH, RATE_VERB_EN, RATE_NUM_EN,
    CLAIM_EFFECT_ZH, CLAIM_EFFECT_EN,
    EXEMPT_CONTROL_ZH, EXEMPT_CONTROL_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_PEDAGOGY_ZH, EXEMPT_PEDAGOGY_EN,
  }),
};
