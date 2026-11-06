/**
 * src/appeal-to-future.js — 「诉诸未来」检测器
 * （ provisional 第 221 个判别维度，r233 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r233-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228-r232：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232) 八个已起草未接线维度占号，最终编号由 1 号按接线
 * 顺序在 VERIFY_DIMS 登记序重排）
 *
 * [r233 立项] 零命中探针 coordination/agent4/probes/r233-zerohit-probe.js
 * + r233-diag-gate.js（v6.8.145 gate() 全量 findings 实测）：诉诸未来族
 * 15 句攻击（中 10 + 英 5）中 **9 句完全穿引擎**（pass、findings 为空，
 * 无任何维度承重）；另 6 句非 pass 均为泛维度偶发代拦——dehumanization
 * （「机器人什么都能干」误触）、slippery_slope / hypostatization（「AI
 * 会自己纠错」）、absolute_claim / perfect_error（「医学一定能治好」），
 * 无一是专用「诉诸未来」维度。良性 7/7 零误伤、元话语 2/2 零误伤。
 * src/ 下没有任何维度判「未来方案锚点 × 免除当下行动」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r233 海外扫描（原始证据
 * coordination/agent4/scout/*20261106-163401）：Semantic Scholar 429
 * 限流返错；GitHub total_count=0；arXiv 引号短语查询（"self-fulfilling
 * prophecy"/"appeal to the future"/"techno-solutionism"）零相关条目，
 * 非引号查询被 API 拆成 OR、返回最新 ML 泛文无一相关。无可集成的纯
 * 规则实现。判据为心虫自有纯规则实现（家族定义取自逻辑学标准描述：
 * appeal to the future / techno-solutionism / intergenerational
 * buck-passing——以尚未存在、不可验证的未来方案为由，免除或拖延
 * 当下本应采取的行动；心虫只判表述形态，不判未来技术能否兑现）。
 *
 * 辨别的族：诉诸未来（appeal to the future / techno-solutionism）——
 * **抬出一个未指明、不可验证的未来方案**，据此**免除或消解当下的
 * 行动/担忧**，把「以后会解决」当成「现在可以不动」的理由：
 *   未来的技术终将解决碳排放，所以现在不必急着能源转型。
 *   等可控核聚变商用，能源危机自解，现在扩建电网纯属浪费。
 *   AI迟早会自己学会纠错，我们现在不用人工审核。
 *   将来机器人什么都能干，眼下讨论就业保障毫无意义。
 *   Future technology will solve carbon emissions, so there is no
 *   need to transition now.
 *   Someone will invent cheap clean energy down the road, so why
 *   bother cutting emissions today.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：把一个**尚未
 * 存在、无法核验**的未来方案当作免除当下责任的理由，是用不可证伪
 * 的承诺替换可执行的当下决策——它让本可在今天 mitigate 的风险
 * （气候、公共卫生、安全审核、资源枯竭）被无限期推迟。与正当的
 * 「面向未来规划」有明确界线：为将来预留接口、未雨绸缪、居安思危
 * 恰恰是**加强**当下行动，本族豁免。
 *
 * 与既有维度的边界（r233 归因）：
 *   · wishful_thinking（第 147 维）管「信念/愿望 → 结果必然实现」
 *     的因果推断（我相信会成功所以一定成功）；本族不依赖主体信念，
 *     判的是「未来方案 → 免除当下行动」的拖延结构，且通常指向
 *     集体/公共决策而非个人励志。
 *   · nirvana_fallacy（第 198 维）拿**完美方案**否定现实方案
 *     （不完美就干脆不做）；本族拿**未来方案**拖延当下（以后会
 *     解决所以现在不做），一个求全一个拖延。
 *   · affective_forecast 管对未来**情绪**的预测偏差；本族管对
 *     未来**技术/方案**的免责性援引。
 *   · 探针实测：诉诸未来族 9 句完全穿透，无一被上述维度承重
 *     （diag-gate.output.txt）；互不触发。
 *
 * 判据（双腿共现，缺一不判）：
 *   ① 腿① FUTURE 未来方案锚点——抬出尚未存在的未来技术/办法/
 *      突破（未来/将来/以后/日后/迟早/终将/届时/有朝一日/下一代
 *      × 技术/科技/办法/方案/手段/模型/算法/材料/能源/医学/疗法/
 *      突破/进步/成熟/商用/解决/问世/机器人/AI/奇点；EN future
 *      technology/research/breakthrough、will eventually solve、
 *      down the road、the singularity、someone will invent）；
 *   ② 腿② DEFER 免除/拖延当下——现在不必/现在不用/现在没必要/
 *      何必急着/是徒劳/是浪费/毫无意义/是杞人忧天/当务之急不是/
 *      到时候再说/该…照旧；EN no need to … now/yet、why bother …
 *      today、can wait、will sort itself out、premature、no rush。
 *   双腿须落在近距离窗内（ZH 50 字 / EN 160 字符）。
 *
 * 为什么取 VERIFY 级：单句可能是真诚的技术乐观、合理的分阶段规划、
 * 或对时序的正当判断。verify 的语义是「这段话在用不可核验的未来
 * 方案免除当下行动，先确认当下该做什么、未来方案是否可依赖，再
 * 决定是否推迟」。
 *
 * 明确不判的（三组豁免，均可负例注入证明承重）：
 *   · 让步/反驳（未来方案×免除当下签名齐备，但当下行动被肯定：
 *     「未来技术会解决于是现在不必转型——但/然而/而是/绝不能 +
 *      仍/必须/要 + 行动/减排/预防/投入/改变」）——把本族引述出来
 *     再否定/限定，说话者并未 commit 它，正是本族的解药；
 *   · 元话语概念引述（诉诸未来是指…/techno-solutionism is…/把
 *     「以后会解决」当成「现在可以不动」是…的典型表现）——引用
 *     本族名称的教学/定义句；
 *   · 纪律性否定（不能/避免/拒绝/切忌 + 把责任推给未来/寄托于
 *     未来/押宝未来；EN avoid/reject techno-solutionism）——指出
 *     本族错误正是判别动作本身。
 *   （面向未来规划——为将来做准备/未雨绸缪/居安思危/plan for the
 *     future——不另设豁免：此类句肯定当下行动、不含"免除"腿②，
 *     双腿判据天然不命中，已由 326 条官方良性语料零误伤验证。）
 */
'use strict';

// ─── 腿① 未来方案锚点（中文）────────────────────────────────────
// 关键：必须带「方案/技术/突破」语义，裸「未来市场/未来趋势」类
// 预报不入列（那是对未来的判断，不是免贵当下行动的未来方案）。
const FUTURE_ZH = [
  // ①-a 未来时间词 × 方案/技术/动词（未来/将来/以后/迟早/终将/届时…）
  /(?:未来|将来|以后|日后|他日|迟早|终将|终究|届时|有朝一日|不久的将来|未来某天|将来某天|下一代|下下一代|子孙后代)[^。，！？；\n]{0,14}(?:技术|科技|办法|方案|手段|工具|模型|算法|材料|能源|医学|疗法|科研|研究|发展|突破|进步|成熟|完善|商用|普及|解决|问世|发明|机器人|AI|人工智能|奇点|更强|更先进|更高效|更便宜|更强大|无限便宜|廉价|强大|高效|丰富|充裕|发达|一定|肯定|总会|必将)/,
  // ①-b 技术/科学主体 × 将会解决/突破/成熟（技术会自己…、AI迟早会…）
  /(?:技术|科技|科学|医学|AI|人工智能|研究|文明|人类|算法|模型|算力|材料|能源)[^。，！？；\n]{0,8}(?:会|终将|迟早|必将|总会|不断|持续)[^。，！？；\n]{0,8}(?:解决|纠错|完善|成熟|追上|突破|进步|搞定|学会|迭代|进化)/,
  // ①-c 等…研发/突破/成熟/问世/商用（等可控核聚变商用）
  /等[^。，！？；\n]{0,14}(?:研发|发明|突破|成熟|问世|出来|商用|普及|进步|完善|发展|升级)/,
  // ①-d 强未来符号单独形（技术奇点/强AI/通用人工智能）
  /技术奇点|奇点临近|强人工智能|通用人工智能|AGI|超级智能/,
];

// ─── 腿① 未来方案锚点（英文）────────────────────────────────────
const FUTURE_EN = [
  // ①-a future technology/research/breakthrough + will solve/advance
  /\bfuture\s+(?:technology|technologies|tech|research|science|scientific|medical|breakthrough|breakthroughs|innovation|innovations|advance|advances|generation|version|model|models|solution|solutions|medicine|materials|energy)\b/i,
  // ①-b (technology|science|medicine|AI|research) will (eventually|surely|certainly) solve/fix/advance/mature/catch up/figure out
  /\b(?:technology|tech|science|research|medicine|medical|ai|machine\s+learning|algorithms?|models?|computing)\s+(?:will|would|is\s+going\s+to)\s+(?:eventually|surely|certainly|undoubtedly|soon|later|one\s+day|someday|naturally|in\s+time)\b[^.]{0,30}\b(?:solve|fix|advance|mature|improve|catch\s+up|figure\s+out|invent|discover|handle|correct)/i,
  // ①-c will eventually/surely solve（AI will eventually learn to correct itself）
  /\bwill\s+(?:eventually|surely|certainly|undoubtedly|naturally|in\s+due\s+course)\s+(?:solve|fix|figure\s+out|invent|develop|discover|learn|correct|handle|resolve)\b/i,
  // ①-d down the road / someday / one day / before long / sooner or later
  /\b(?:down\s+the\s+road|some\s+day|someday|one\s+day|before\s+long|sooner\s+or\s+later|in\s+due\s+course|in\s+the\s+future|by\s+then)\b/i,
  // ①-e someone/they/we will invent/figure out；a future breakthrough
  /\b(?:someone|they|we|scientists?|researchers?|engineers?)\s+(?:will|would|'ll)\s+(?:eventually\s+)?(?:invent|develop|figure\s+out|discover|solve|build|create)\b/i,
  /\b(?:a\s+)?(?:future|next[- ]generation|later)\s+(?:breakthrough|innovation|version|generation|model|technology|solution)\b/i,
  // ①-f the singularity / AGI
  /\b(?:the\s+)?(?:singularity|artificial\s+general\s+intelligence|AGI)\b/i,
];

// ─── 腿② 免除/拖延当下（中文）────────────────────────────────────
const DEFER_ZH = [
  // ②-a 现在不必/不用/没必要/无须/无需/犯不着（标记从"现在"起，不抓前文，避免与未来锚点重叠）
  /(?:现在|当下|如今|眼前|而今)[^。，！？；\n]{0,6}(?:不必|不用|无须|无需|没必要|用不着|犯不着|不必要)/,
  // ②-b 何必急着/何必现在/何必提早
  /何必(?:急着|现在|当下|提早|早早|急于)/,
  // ②-c …是徒劳/是浪费/纯属浪费/毫无意义/是杞人忧天/是多此/是为时过早/尚早
  /(?:现在|当下|如今|眼前|眼下|此时)[^。，！？；\n]{0,12}(?:是徒劳|是白费|纯属徒劳|是浪费|纯属浪费|毫无意义|没有意义|是杞人忧天|是多此一举|是为时过早|尚早|不到时候|为时过早)/,
  /(?:担心|忧虑|焦虑|投入|讨论|推进|做|准备|预防)[^。，！？；\n]{0,10}(?:是徒劳|是浪费|纯属浪费|毫无意义|是杞人忧天|是多此一举|是为时过早)/,
  // ②-d 当务之急不是/当务之急不在于
  /当务之急(?:不是|不在于|并非是)/,
  // ②-e 自然会解决/自解/消失/被淘汰/到时候再说/船到桥头自然直
  /(?:自然|迟早|终究|总)(?:会)?(?:被)?(?:解决|化解|消失|消散|被淘汰|自解|不是问题)/,
  /到时候再说|船到桥头自然直|留着以后|以后再说|走一步看一步|见招拆招/,
  // ②-f 维持现状/照旧/照常/照样/该…照旧（现在无需改变）
  /(?:维持现状|照旧|照常|照样|一如既往|无需改变|不必改变|不用改变|无须改变)/,
  /该[^。，！？；\n]{0,4}(?:排放|照旧|照常|照样)/,
];

// ─── 腿② 免除/拖延当下（英文）────────────────────────────────────
const DEFER_EN = [
  // ②-a no need to act/worry/invest … now/yet/today
  /\bno\s+(?:need|point|use|reason|rush|urgency)\s+(?:to|in|for)\s+[^.]{0,30}\b(?:now|yet|today|for\s+now|at\s+this\s+(?:time|point|stage)|right\s+now)\b/i,
  /\b(?:we|we'd|we'll|you|there)\s+(?:do\s+not|don't|need\s+not|needn't|does\s+not|doesn't)\s+(?:need\s+to\s+|have\s+to\s+|really\s+need\s+to\s+)?(?:act|worry|bother|invest|prepare|do\s+anything|cut|reduce|transition|respond)\b[^.]{0,20}\b(?:now|yet|today|for\s+now)\b/i,
  // ②-a2 泛化的 "do not need … yet/now"（需腿①未来锚点共现，防误伤）
  /\b(?:do|don't)\s+not\s+need\b[^.]{0,40}\b(?:yet|now|today)\b/i,
  // ②-b why bother … now/today
  /\bwhy\s+(?:bother|rush|act|do\s+anything)\b[^.]{0,30}\b(?:now|today|yet)\b/i,
  // ②-c is unnecessary / does not matter / is premature / not worth it (now)
  /\b(?:now|today|at\s+this\s+(?:point|stage|time))\s+is\s+(?:unnecessary|premature|pointless|futile|wasteful|too\s+early)\b/i,
  /\b(?:premature|too\s+early|no\s+rush|not\s+urgent|not\s+worth\s+it)\b/i,
  /\b(?:today'?s?|current|present)\s+(?:issues?|concerns?|problems?)\s+(?:do\s+not|don't)\s+matter\b/i,
  // ②-d can wait / wait and see / will sort itself out / take care of itself / solve itself
  /\b(?:we|you|they|it)\s+can\s+(?:just\s+)?wait\b/i,
  /\bwait\s+and\s+see\b/i,
  /\b(?:will|would|'ll)\s+(?:sort\s+itself\s+out|sort\s+themselves\s+out|take\s+care\s+of\s+itself|resolve\s+itself|solve\s+itself)\b/i,
  // ②-e not worth acting/investing now
  /\bnot\s+worth\s+(?:acting|investing|doing|preparing|worrying)\b[^.]{0,20}\b(?:now|yet|today)\b/i,
];

// 双腿距离窗
const PAIR_ZH = 50;
const PAIR_EN = 160;

// ─── 豁免一：让步/反驳（嵌入签名但当下行动被肯定 → 并非在犯该谬误）──
// 「未来技术会…于是现在不必…——但/然而/而是/绝非 + 仍/必须/要 + 行动/减排/预防/投入/改变…」
// 这是本族最关键的豁免：把 appeal-to-future 引述出来再加以否定/限定，
// 说话者没有commit它。删除本组后，含真实签名+让步标记的句子会变红。
// 注意：让步标记只取转折连词/“并不意味着”类，不含裸“不能/避免”
// （那归 DISAVOW），确保三组豁免负例注入相互独立承重、不互相掩盖。
const REBUTTAL_ZH = /(?:但是|但|然而|不过|可是|而是|而非|并不意味着|并不代表|不等于|绝非)[^。，！？；\n]{0,20}(?:当下|现在|如今|眼前|仍|还|要|需|应该|必须|不得不|亟待|就得)[^。，！？；\n]{0,12}(?:行动|采取措施|减排|预防|投入|改变|治理|应对|推进|把关|审核|复核|限制|遏制|培养|着手|介入|发力|转型)/;
const REBUTTAL_EN = /\b(?:but|however|yet|nevertheless|nonetheless|still|instead|that\s+does\s+not\s+mean|does\s+not\s+mean|doesn'?t\s+mean)\b[^.]{0,55}\b(?:we|you|must|should|need\s+to|have\s+to|still|cannot|can'?t)\b[^.]{0,25}\b(?:act|reduce|cut|invest|prepare|respond|transition|address|mitigate|regulate|do\s+nothing|wait)\b/i;

// ─── 豁免二：元话语概念引述（引用本族名称的教学/定义句）────────────
// 删本组后，含"诉诸未来/techno-solutionism"命名+真实签名的句子会变红。
const META_ZH = /诉诸未来|技术解决主义|技术万能论|技术乌托邦|(?:把|将)[^。，！？；\n]{0,16}(?:寄托|指望|依赖|押宝)[^。，！？；\n]{0,8}(?:未来|尚未|将来)[^。，！？；\n]{0,8}(?:技术|科技)[^。，！？；\n]{0,10}(?:是|属于|视为|当成)[^。，！？；\n]{0,10}(?:谬误|错误|借口|拖延|逃避|陷阱|谬说)/;
const META_EN = /\bappeal\s+to\s+(?:the\s+)?future\b/i;

// ─── 豁免三：纪律性否定（指出本族错误正是判别动作本身）────────────
// 删本组后，"不能/避免 + 诉诸未来/把责任推给未来"+真实签名的句子会变红。
// 注意：本组不含裸"诉诸未来"字样（那归 META），故用"把责任推给未来/
// 寄托于未来/押宝未来"等变体，确保与 META 负例注入相互独立承重。
const DISAVOW_ZH = /(?:不能|不应|不应该|不可|避免|拒绝|切忌|不得|别)[^。，！？；\n]{0,14}(?:把责任推给未来|寄托于未来|指望未来|押宝未来|推给下一代|甩给未来)/;
const DISAVOW_EN = /\b(?:avoid|reject|stop|never|don'?t)\s+(?:techno-?solutionism|appealing\s+to\s+the\s+future|deferring\s+to\s+the\s+future|kicking\s+the\s+can\s+down\s+the\s+road|passing\s+the\s+buck\s+to\s+the\s+future)\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
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

/**
 * 双腿配对：任一未来方案锚点 × 任一免除当下标记，落在窗内即成一签名。
 */
function findSignatures(text, R) {
  const futureZh = (R.FUTURE_ZH || FUTURE_ZH);
  const futureEn = (R.FUTURE_EN || FUTURE_EN);
  const deferZh = (R.DEFER_ZH || DEFER_ZH);
  const deferEn = (R.DEFER_EN || DEFER_EN);

  const sigs = [];
  const langs = [
    { f: futureZh, d: deferZh, win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh' },
    { f: futureEn, d: deferEn, win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en' },
  ];
  const dedupeOverlap = (arr) => {
    // 去重：同一逻辑锚点被多条模式重叠命中只计一次（保留长片段/靠前者）
    const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
    const out = [];
    for (const x of sorted) {
      if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
      out.push(x);
    }
    return out.sort((a, b) => a.idx - b.idx);
  };
  for (const { f, d, win, lang } of langs) {
    let fm = [];
    for (const re of f) for (const x of allMatches(re, text)) fm.push(x);
    let dm = [];
    for (const re of d) for (const x of allMatches(re, text)) dm.push(x);
    fm = dedupeOverlap(fm); dm = dedupeOverlap(dm);
    if (!fm.length || !dm.length) continue;
    // 每个未来锚点各配窗内最近的免除当下标记（片段不重合），各成一签名
    for (const a of fm) {
      let best = null;
      for (const b of dm) {
        const overlap = a.idx < b.end && b.idx < a.end;
        if (overlap) continue;
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        if (!best || dist < best.dist) best = { dist, defer: b };
      }
      if (best) sigs.push({ lang, future: a.raw, defer: best.defer.raw, dist: best.dist });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectAppealToFuture(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免（任一命中即不判）
  if ((R.REBUTTAL_ZH || REBUTTAL_ZH).test(text) || (R.REBUTTAL_EN || REBUTTAL_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.META_ZH || META_ZH).test(text) || (R.META_EN || META_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.DISAVOW_ZH || DISAVOW_ZH).test(text) || (R.DISAVOW_EN || DISAVOW_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'appeal_to_future',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? '「' + x.future + '」→「' + x.defer + '」' : '"' + x.future + '" -> "' + x.defer + '"')),
    details: s.lang === 'zh'
      ? '诉诸未来(' + sigs.length + '处: 抬出「' + s.future + '」这一不可核验的未来方案，据此「' + s.defer + '」——用未来免去当下行动)(zh)'
      : 'appeal to the future(' + sigs.length + 'x: invokes "' + s.future + '" — an unverifiable future fix — to "' + s.defer + '", deferring present action)(en)',
    guidance: '不要用尚未存在、无法核验的未来方案免除当下行动（未来的技术终将解决它所以现在不必动 / 等…商用了现在投入纯属浪费 / future tech will solve it so there is no need to act now）：把不可证伪的未来承诺当成「现在可以不动」的理由，会让今天本可 mitigate 的风险被无限期推迟。请确认当下该采取的具体行动及其代价，并单独评估该未来方案是否可依赖、何时可验证，再决定是否推迟。',
    tags: ['logic', 'temporal-reasoning', 'appeal-to-the-future', 'techno-solutionism', 'procrastination'],
  };
}

module.exports = {
  detectAppealToFuture,
  __internals: () => ({
    FUTURE_ZH, FUTURE_EN, DEFER_ZH, DEFER_EN,
    REBUTTAL_ZH, REBUTTAL_EN, META_ZH, META_EN, DISAVOW_ZH, DISAVOW_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
