/**
 * src/absence-of-problems.js
 * [r184] 第 182 维度 absence_of_problems（未检出≠不存在）
 *
 * 谬误形状：把一次**有限检验**的**阴性结果**当作**完备证明**——「测试全跑过
 * 了没报错，所以代码肯定没问题」「扫了一遍没发现漏洞，说明系统是安全的」
 * 「没人投诉，说明产品体验没问题」「三年没出过事故，这座桥绝对安全」。
 *
 * 检验的效力受其覆盖范围约束：测试只覆盖已写下的用例，扫描只匹配已知漏洞
 * 特征库，审查只覆盖审查者看得见的层面，调研只覆盖愿意开口的人。把「本次
 * 未检出」升级为「不存在」，是用有界搜索的阴性结果冒充无界全域的证明——
 * 它让**未被检验的部分**获得与**已检验部分**相同的可信度。这是 AI 工程汇报、
 * 代码审查结论、产品上线评审中最典型的似是而非：听起来是验证结论，实则是
 * 验证范围的静默扩张。
 *
 * 判据（两腿共现，缺一不判；同句或相邻句）：
 *   腿① CHECK 已执行检验 + 阴性结果（未检出问题）三形：
 *      · CN-A 阴性结果形：[检验动词 可选前缀] → [≤12字] → 否定 → [≤6字]
 *        → {检出动词 → [≤10字] → 问题名词 | 自足投诉类}
 *        （「扫了一遍没发现漏洞」有动词，「没发现问题」「三年没出过事故」
 *        无动词亦可——工程汇报里动词省略是常态）
 *      · CN-B 通过形：检验动词 → [≤8字] → （全部/完全/都/皆/悉数）
 *        → [≤4字] → 通过/合格/达标/过关/全绿/一次过
 *      · CN-C 失败裸形：检验动词 → [≤12字] → 否定 → [≤6字]
 *        → 出错/报错/失败/挂掉/崩溃/超时/漏数据（无需问题名词后缀）
 *      · EN-A 检验名词 + 阴性动词（tests passed / did not fail /
 *        found no / reported no / came back clean）
 *        EN-B no + 问题名词 + were found/reported/detected
 *        EN-C 检验名词 + all passed / are green
 *   腿② SEAL 全称化结论（阴性结果 → 无问题的确定性断言）三形：
 *      · CN-A 连接词 + 无问题族结论（所以/因此/说明/证明/表明/可见/足见
 *        → [≤25字] → 没问题/没有漏洞/是安全的/是正确的/可放心…）
 *      · CN-B 连接词 + 确定性副词 + 其他结论（所以…完全/肯定/百分百/毫
 *        无疑问 → [≤10字] → 可行/成立/有效/可靠/安全/正确）
 *      · CN-C 无连接词 + 确定性副词 + 无问题族结论（「绝对安全」「完全
 *        没问题」「百分百可靠」——跨句亦判）
 *      · EN-A so/therefore/thus/hence/which means/proves/shows + 无问题族
 *        EN-B so/therefore + must be/certainly/definitely/100% + 结论
 *
 * 与存量维度边界（全部错开，无一维覆盖「有限检验阴性结果 × 确定性全称
 * 结论」这一结构本身）：
 *   · appeal_to_ignorance（第62维）管**举证责任分配**——「你拿不出反证，
 *     所以你是错的」，无「检验已执行」腿；本族核心恰是检验已执行、只是
 *     覆盖有界。
 *   · scrutiny_evasion（第72维）管「**检验这个动作不该发生**」（别查了，
 *     查就是不信任我），落点在拒绝检验；本族落点是检验已发生、结果被
 *     全称化。
 *   · unsupported_claim / confidence / absolute_claim 管断言强度与依据
 *     缺失，本族有明确的「检验陈述 → 全称结论」两步结构。
 *   · perfect_error S6「无来源」管长断言无来源，本族腿①恰是**有**执行
 *     记录的检验陈述。
 *
 * 豁免常量（全部可被负例注入置空）：
 *   SCOPE 范围限定（在…范围内/仅限于/就…而言/截至目前；EN within/limited
 *     to/as far as）——阴性结论被明确限定在有界范围内，是正确判别。
 *   HEDGE 对冲（可能/也许/未必/不能排除/难以排除；EN may/might/cannot
 *     rule out）——承认可能有未检出项。
 *   NEGFLIP 拒绝推断（不等于/不代表/不意味着/推不出/不能说明/不足以；
 *     EN does not mean/cannot conclude/does not prove）——明确区分
 *     「未检出」与「不存在」。
 *   META 概念/教学转述（测试覆盖/覆盖率/假阴性/漏检/贝叶斯/证据缺席；
 *     EN test coverage/false negative/absence of evidence）——讨论检验
 *     局限本身是正确判别。
 *   EXHAUSTIVE 构造上完备的检验（穷举/枚举了全部/逐一验证所有/数学证明；
 *     EN exhaustively/mathematical proof/verified all）——这是真正的
 *     完备性证明，不是谬误。
 *   QUESTION 疑问句（逐句）。
 *
 * r184 实测（探针 /tmp/hf-probe-r184.js，当前引擎 181 维）：本族 6 条攻击
 * 样本 **5 条真零命中**（仅「We scanned and found no vulnerabilities,
 * therefore the system is secure.」被 confidence 代拦），良性 6/6 干净。
 * 外部来源：arXiv:2405.02318（NL2FOL 谬误检测，LLM 路线，只作概念背景）
 * + GitHub 5 个谬误检测仓库全为模型路线，无可移植纯规则判据——判据为
 * 心虫自有纯规则实现。侦察落盘 /tmp/hf-scout-r184.txt。
 */
'use strict';

// ─── 判定常量（可变对象——负例注入的承重目标） ────────────────

const RE = {
  // ═══ 腿① CHECK：已执行检验 + 阴性结果 ═══

  // CN-A：阴性结果形——[检验动词 可选前缀] → [≤12字] → 否定 → [≤6字]
  //      → {检出动词 → [≤10字] → 问题名词 | 自足投诉类}
  // **检验动词刻意设为可选前缀**：「扫了一遍没发现漏洞」有动词，「没发现问题」
  // 「三年没出过事故」无动词亦可——工程汇报里动词省略是常态，且 r184 首跑
  // 实测证明：若把「有检验动词」单列一个常量，它是本常量的严格子集
  // （本常量的否定→检出段 gap 更宽），负例注入永远无法承重，属死常量。
  // 161 轮教训：全部收裸名词形态（收「风险」而非只收「风险点」，收「隐患」
  // 而非只收「隐患项」，收「投诉」而非只收「投诉量」）。
  // 内部分枝：投诉/举报/抱怨/质疑/反对/反映/异议 本身即问题名词，**不得再
  // 要求后接问题名词**——「回访没收到投诉，说明政策没有问题」的「投诉」后
  // 紧跟逗号，若强制后置名词整句漏判（r184 首跑实测 5 漏之一）。
  CHECK_ZH_A_RE: /(?:测试|跑过|回归|扫描|检查|审查|核查|排查|审计|验证|复测|体检|走访|调研|问卷|回访|抽查|化验|检测|验收|评审|复盘|对照|巡检|观察|试用|实测|压测|演练|试运行|评测|筛查|尽调|背调|复查|复审|复核|校验|自查|互查|巡查|专访|暗访|抽样)?[^。，？！；\n]{0,12}(?:没|未|没有|并无|未能|不曾|从无|毫无|压根没|根本没|从未)[^。，？！；\n]{0,6}(?:(?:报错|发现|找到|查出|检出|测出|暴露|出现|触发|冒出|见到|遇到|收到|得到|报出|显现|看出|听出|出过|发生过)[^。，？！；\n]{0,10}(?:问题|漏洞|缺陷|错误|异常|故障|风险|隐患|毛病|弊病|差错|事故|副作用|不良反应|反馈|差评|恶评|意见|不满|异议|警告|报警|疑点|破绽|把柄|bug|Bug|BUG)|(?:投诉|举报|抱怨|质疑|反对|反映|异议|有意见|提意见|告状|上访))/,

  // CN-C：通过形——检验动词 → [≤8字] → （全部/完全/都/皆/悉数）→ [≤4字] → 通过/合格/达标
  CHECK_ZH_C_RE: /(?:测试|跑过|回归|扫描|检查|审查|核查|排查|审计|验证|复测|体检|走访|调研|问卷|回访|抽查|化验|检测|验收|评审|复盘|对照|巡检|观察|试用|实测|压测|演练|试运行|评测|筛查|尽调|背调|复查|复审|复核|校验|自查|互查|巡查|专访|暗访|抽样)[^。，？！；\n]{0,8}(?:全部|完全|都|皆|悉数|尽数|无一例外|清一色)?[^。，？！；\n]{0,4}(?:通过|合格|达标|过关|全绿|绿灯|一次过|顺利过)/,

  // CN-D：失败裸形——检验动词 → [≤12字] → 否定 → [≤6字] → 出错/报错/失败
  // （「跑了三遍没出错」——无需问题名词后缀，纯失败动词即构成阴性结果）
  CHECK_ZH_D_RE: /(?:测试|跑过|回归|扫描|检查|审查|核查|排查|审计|验证|复测|体检|走访|调研|问卷|回访|抽查|化验|检测|验收|评审|复盘|对照|巡检|观察|试用|实测|压测|演练|试运行|评测|筛查|尽调|背调|复查|复审|复核|校验|自查|互查|巡查|专访|暗访|抽样)[^。，？！；\n]{0,12}(?:没|未|没有|并未|毫无|无从|未曾|不曾)[^。，？！；\n]{0,6}(?:出错|报错|失败|挂掉|崩溃|卡住|卡死|超时|漏数据|掉数据|丢数据|漏单|掉单)/,

  // EN-A：检验名词 + 阴性动词（tests passed / did not fail / found no / came back clean）
  // **过去时态必须显式收**：`\bscans?\b` 匹配不到 "scanned"（scan 后紧跟
  // ned，词边界失败）——r184 首跑实测「We scanned and found no
  // vulnerabilities, therefore the system is secure.」整句漏判即因此。
  CHECK_EN_A_RE: /\b(?:tests?|test\s+suite|regression(?:\s+tests?)?|checks?|scan(?:s|ned|ning)?|audits?|audit(?:ed|ing)?|reviews?|reviewed|inspections?|inspected|surveys?|surveyed|probes?|probed|pen(?:etration)?[-\s]?tests?)\b[^.]{0,30}\b(?:passed|did\s+not\s+fail|didn'?t\s+fail|found\s+(?:no|nothing)|reported\s+no|showed\s+no|produced\s+no|came\s+back\s+clean|returned\s+no|detected\s+no|identified\s+no|turned\s+up\s+nothing|uncovered\s+no|revealed\s+no)\b/i,

  // EN-B：no + 问题名词 + were found/reported/detected（"no failures were found"）
  CHECK_EN_B_RE: /\b(?:no|zero|without)\s+(?:failures?|errors?|bugs?|issues?|problems?|defects?|vulnerabilit(?:y|ies)|complaints?|objections?|warnings?|exceptions?|incidents?|findings?|red\s+flags?)\s+(?:were\s+|have\s+been\s+|was\s+)?(?:found|reported|detected|observed|raised|seen|encountered|identified|logged|surfaced)\b/i,

  // EN-C：检验名词 + all passed / are green
  CHECK_EN_C_RE: /\b(?:tests?|checks?|scans?|audits?|reviews?|suites?)\s+(?:all\s+|have\s+all\s+)?(?:passed|came\s+back\s+clean|are\s+green|went\s+green|came\s+back\s+green|passed\s+cleanly)\b/i,

  // ═══ 腿② SEAL：全称化结论 ═══

  // CN-A：连接词 → [≤25字] → 无问题族结论（无需确定性副词）
  // gap 刻意允许跨逗号（`[^。？！；\n]` 而非 `[^。，？！；\n]`）——「审计没发现
  // 问题，所以可以先上线，系统是安全的」的结论被逗号隔开，禁逗号会整句漏判。
  SEAL_ZH_A_RE: /(?:所以|因此|因而|可见|足见|据此|故而|于是|那么|说明|证明|表明|足以说明|足以证明|也就是说|即)[^。？！；\n]{0,25}(?:没问题|没有问题|没有啥问题|毫无问题|没有任何问题|没漏洞|没有漏洞|没有缺陷|没有错误|没有异常|没有隐患|没有风险|无风险|是安全|是正确|是可靠|是可行|是成立|是有效|可放心|可以放心|放心使用|放心用|万无一失|固若金汤|天衣无缝|一点儿问题都没有|什么问题都没有)/,

  // CN-B：连接词 → [≤25字] → 确定性副词 → [≤10字] → 其他结论
  // 结论族含「成立/有效/正确」——这类词单独出现（无确定性副词）时
  // SEAL_ZH_A 也不收（其结论族已限定为无问题族），只有**确定性副词在场**
  // 才判，避免误伤「数据说明理论成立」这类合法科学陈述（r184 误拦纪律）。
  SEAL_ZH_B_RE: /(?:所以|因此|因而|可见|足见|据此|故而|于是|那么|说明|证明|表明|足以说明|足以证明)[^。？！；\n]{0,25}(?:肯定|一定|必然|必定|势必|完全|绝对|百分之百|百分百|毫无疑问|毋庸置疑|不容置疑|毫无|丝毫|压根|根本|铁定|稳稳|妥妥)[^。？！；\n]{0,10}(?:没问题|没有问题|安全|正确|可靠|可行|成立|有效|稳定|健康|干净|靠得住|说得通|站得住|成功|受欢迎|叫好)/,

  // CN-C：无连接词 → 确定性副词 → [≤8字] → 无问题族结论（跨句亦判）
  // 结论族刻意不含「成立/为真/有效」——「数据说明理论成立」是合法科学
  // 陈述，只有带确定性副词时才由 SEAL_ZH_B 收（见该常量注释）。
  SEAL_ZH_C_RE: /(?:肯定|一定|必然|必定|势必|完全|绝对|百分之百|百分百|毫无疑问|毋庸置疑|不容置疑|毫无|丝毫|压根|根本|铁定|稳稳|妥妥|十二分|万分)[^。？！；\n]{0,8}(?:没问题|没有问题|没漏洞|没有漏洞|没有缺陷|没有错误|没有异常|没有隐患|没有风险|无风险|安全|可靠|靠得住|合格|达标|过关|可放心|放心|万无一失|固若金汤|天衣无缝)/,

  // EN-A：so/therefore/thus/hence/which means/proves/shows → 无问题族结论
  SEAL_EN_A_RE: /\b(?:so|therefore|thus|hence|which\s+means|that\s+means|meaning|it\s+proves|proves|shows|demonstrates|indicates|confirms|establishes)\b[^.]{0,40}\b(?:no\s+problems?|no\s+issues?|no\s+bugs?|no\s+defects?|no\s+vulnerabilit(?:y|ies)|no\s+risks?|nothing\s+wrong|is\s+safe|is\s+secure|is\s+correct|is\s+reliable|is\s+sound|is\s+fine|is\s+clean|is\s+ok|is\s+okay|are\s+safe|are\s+secure|are\s+correct|are\s+reliable|are\s+sound|works?\s+perfectly|works?\s+fine|is\s+100\s*%|is\s+completely\s+safe|is\s+entirely\s+safe)\b/i,

  // EN-B：so/therefore + must be/certainly/definitely/100% → 结论
  SEAL_EN_B_RE: /\b(?:so|therefore|thus|hence|which\s+means|proves|shows|demonstrates)\b[^.]{0,40}\b(?:must\s+be|is\s+(?:certainly|definitely|absolutely|completely|totally|entirely)|are\s+(?:certainly|definitely|absolutely|completely|totally|entirely)|certainly|definitely|absolutely|completely|totally|entirely|100\s*%|without\s+a\s+doubt|no\s+doubt)\b[^.]{0,25}\b(?:safe|secure|correct|reliable|sound|viable|valid|fine|solid|working|works|stable|clean)\b/i,

  // ═══ 豁免常量（可被负例注入置空） ═══

  // 范围限定：阴性结论被明确限制在有界范围内（正确判别）
  SCOPE_ZH_RE: /(?:在[^。，？！；\n]{0,14}(?:范围内|之内|以内|覆盖的|之内|这部分|这个层面|该环节|该阶段)|仅限于|只限于|仅就|只就|就[^。，？！；\n]{0,10}而言|截至目前|到目前为止|迄今为止|就目前|在现阶段|在此范围内)/,
  SCOPE_EN_RE: /\b(?:within|inside|limited\s+to|only\s+for|as\s+far\s+as|so\s+far|for\s+now|in\s+the\s+(?:covered|tested|scanned|audited)\s+(?:scope|range|cases|set)|to\s+the\s+extent|at\s+this\s+stage)\b/i,

  // 对冲：承认可能有未检出项
  HEDGE_ZH_RE: /(?:可能|也许|或许|未必|不一定|不见得|说不定|很难说|说不准|不能排除|难以排除|无法排除|不排除|有待|尚需|还需|仍需|待观察|待验证|待定)/,
  HEDGE_EN_RE: /\b(?:may|might|could|possibly|perhaps|maybe|not\s+necessarily|cannot\s+(?:rule\s+out|exclude)|can'?t\s+(?:rule\s+out|exclude)|still\s+(?:possible|be\s+possible)|remains?\s+(?:possible|unclear)|to\s+be\s+determined|pending)\b/i,

  // 拒绝推断：明确区分「未检出」与「不存在」
  NEGFLIP_ZH_RE: /(?:不等于|不代表|不意味着|并不意味着|推不出|推断不出|不能说明|不足以|并不说明|无法说明|算不了|算不上|说明不了|证明不了|不构成|不能据此|无法据此|不可据此)/,
  NEGFLIP_EN_RE: /\b(?:does\s+not\s+mean|doesn'?t\s+mean|does\s+not\s+prove|doesn'?t\s+prove|cannot\s+conclude|can'?t\s+conclude|no\s+(?:evidence|basis)\s+(?:for|to)|not\s+the\s+same\s+as|absence\s+of\s+(?:evidence|problems)\s+is\s+not)\b/i,

  // 概念/教学转述：讨论检验的局限本身（正确判别）
  META_ZH_RE: /(?:测试覆盖|覆盖率|覆盖不足|假阴性|漏检|误检|贝叶斯|证据缺席|检验的局限|验证的局限|不能证明|样本偏差|抽样误差|检出限|盲区|黑盒测试|白盒测试|边界用例|回归范围|测试用例设计)/,
  META_EN_RE: /\b(?:test\s+coverage|code\s+coverage|coverage\s+rate|false\s+negative|false\s+positives?|absence\s+of\s+evidence|verification|falsifiab\w+|null\s+result|underpowered|sampling\s+error|selection\s+bias|detection\s+limit|blind\s+spot)\b/i,

  // 构造上完备的检验：真正的完备性证明，不是谬误
  EXHAUSTIVE_ZH_RE: /(?:穷举|枚举了|逐一验证|逐一核对|逐个验证|逐个核对|全部枚举|遍历了所有|遍历全部|数学证明|形式化验证|可证明|定理证明|完全归纳|所有可能的输入|每一种情况|无一遗漏|面面俱到)/,
  EXHAUSTIVE_EN_RE: /\b(?:exhaustively|all\s+possible|every\s+possible|complete\s+enumeration|mathematical\s+proof|proved\s+(?:for\s+all|by|formally)|verified\s+(?:all|every)|brute[-\s]?forced?\s+(?:all|every)|full\s+(?:exhaustive|formal)\s+(?:proof|verification)|by\s+exhaustion)\b/i,
};

const EMPTY = { hit: false, score: 0, count: 0, matches: [], details: '' };

// ─── 句子切分（带偏移，供「同句/相邻句」与豁免跨度判定） ──────

function splitSentencesWithSpan(text) {
  const parts = text.split(/([。！；\n]+|(?<=[a-z])\.\s+)/i);
  const sents = [];
  let pos = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const raw = parts[i] || '';
    const delim = parts[i + 1] || '';
    const lead = raw.length - raw.trimStart().length;
    if (raw.trim().length > 0) {
      sents.push({ text: raw.trim(), start: pos + lead, end: pos + raw.length });
    }
    pos += raw.length + delim.length;
  }
  return sents;
}

// ─── 腿匹配 ─────────────────────────────────────────────────

function leg1In(s) {
  return RE.CHECK_ZH_A_RE.test(s)
    || RE.CHECK_ZH_C_RE.test(s) || RE.CHECK_ZH_D_RE.test(s)
    || RE.CHECK_EN_A_RE.test(s) || RE.CHECK_EN_B_RE.test(s)
    || RE.CHECK_EN_C_RE.test(s);
}

function leg2In(s) {
  return RE.SEAL_ZH_A_RE.test(s) || RE.SEAL_ZH_B_RE.test(s)
    || RE.SEAL_ZH_C_RE.test(s)
    || RE.SEAL_EN_A_RE.test(s) || RE.SEAL_EN_B_RE.test(s);
}

// ─── 主检测 ─────────────────────────────────────────────────

function checkAbsenceOfProblems(text) {
  if (typeof text !== 'string' || text.length === 0) return EMPTY;

  // 整篇豁免：概念/教学转述、拒绝推断、构造完备证明不是运用该谬误
  if (RE.META_ZH_RE.test(text) || RE.META_EN_RE.test(text)
    || RE.NEGFLIP_ZH_RE.test(text) || RE.NEGFLIP_EN_RE.test(text)
    || RE.EXHAUSTIVE_ZH_RE.test(text) || RE.EXHAUSTIVE_EN_RE.test(text)) {
    return EMPTY;
  }

  const sents = splitSentencesWithSpan(text);
  const matches = [];

  for (let i = 0; i < sents.length; i++) {
    const a = sents[i];
    if (/[?？]/.test(a.text)) continue;      // 疑问句豁免（逐句）
    if (!leg1In(a.text)) continue;

    // 同句或相邻句（「测试全部通过。代码没有问题。」是最常见攻击形）
    for (let j = i; j <= Math.min(i + 1, sents.length - 1); j++) {
      const b = sents[j];
      if (/[?？]/.test(b.text)) continue;
      if (!leg2In(b.text)) continue;

      // 局部豁免：范围限定 + 对冲（跨度 = 腿①句首 → 腿②句尾）
      const span = text.slice(a.start, b.end);
      if (RE.SCOPE_ZH_RE.test(span) || RE.SCOPE_EN_RE.test(span)) continue;
      if (RE.HEDGE_ZH_RE.test(span) || RE.HEDGE_EN_RE.test(span)) continue;

      matches.push({
        sentence: (a === b ? a.text : a.text + ' ▸ ' + b.text).slice(0, 90),
      });
      break;
    }
  }

  if (matches.length === 0) return EMPTY;

  // 评分：单处共现 75；强全称词（毫无疑问/百分之百/100%/without a doubt）或多处 90
  const strong = matches.length >= 2
    || /(?:毫无疑问|毋庸置疑|不容置疑|百分之百|百分百|毫无)/.test(text)
    || /\b(?:100\s*%|without\s+a\s+doubt|no\s+doubt)\b/i.test(text);
  const score = strong ? 90 : 75;
  const count = matches.length;
  const details = '未检出≠不存在（把有限检验的阴性结果当作完备证明）(' + count + '处: '
    + matches.map(m => m.sentence.slice(0, 40)).join('；') + ')';

  return { hit: true, score, count, matches, details };
}

module.exports = {
  checkAbsenceOfProblems,
  __internals: RE,
};
