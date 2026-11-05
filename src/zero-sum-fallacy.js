/**
 * src/zero-sum-fallacy.js — 「零和误判 / fixed-pie misjudgment」检测器
 * （第 212 个判别维度，r218 起草；8 处 src/index.js 接线由 1 号主力补全，
 * 接线规格见 coordination/reports/r218-dimension-agent4.md §六）
 *
 * [r218 立项] r217 研究轮零命中探针（coordination/agent4/probes/
 * r217-zerohit-probe.js，v6.8.144 实测）：「B 零和误判」族攻击样本
 * 5 条中 4 条 gate.action=pass（中英双语均漏；唯一被代拦的 B1 由
 * loyalty_test 错维度承重，r217 已记录交接 2 号），良性对照 BB1/BB2
 * 2/2 pass（零误伤）。覆盖度检查：zero_sum / 零和 / fixed-pie 在
 * src/ 下 0 命中；false_equivalence（等价混淆）、sunk_cost_coercion
 * （沉没成本×弃羞耻）、relative_privation（相对贫困化）、appeal_to_pity
 * （诉诸怜悯）均不覆盖本族——没有一个判「自愿交换被当作一方所得即
 * 另一方所失」。
 *
 * 外部来源：空返，按既有形态自建。r217 海外扫描（arXiv 宽查询被 API
 * 拆成 OR 零相关、GitHub 短语查询 0、S2 连续 429）无可用纯规则实现；
 * 判据为心虫自有纯规则实现（家族定义取自零和误判 / fixed-pie error /
 * zero-sum misconception 的标准经济学与逻辑学描述）。
 *
 * 辨别的族：零和误判（zero-sum misconception / fixed-pie error）——
 * 把**自愿交易/交换**当成**一方之所得即另一方之所失**：
 *   这笔贸易里对方赚了大头，说明我们这边肯定亏了。
 *   他们出口越多赚得越多，我们买得越多就亏得越多。
 *   买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。
 *   They profited from the deal, which means we must have lost.
 *   Every dollar they earn from this trade is a dollar taken from us.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：自愿交换的
 * 结构是**双方各以所余换所缺、退出成本为零时成交即双方主观获益**——
 * 收益不是从对方口袋里转移过来的，而是交换释放的存量价值。零和误判
 * 把「一方账面上的所得」直接对偶成「另一方账面上的所失」，进而推出
 * 「贸易必然有人吃亏」「保护主义才能少亏」一类结论。它是固定馅饼
 * 假设（fixed-pie assumption）的话语形态，是反贸易、反合作、阵营对
 * 抗叙事的推理底座。
 *
 * 与既有维度的边界（r218 归因）：
 *   · false_equivalence（第 66 维附近）管两个不同事物被当成同一事
 *     物；本族管交换的价值总量被误设为恒定（所得=所失的对偶断言）。
 *   · sunk_cost_coercion（第 98 维）管「已投入×退出可耻」的操控；
 *     本族管交换结果被解释成单向转移。
 *   · relative_privation 管「别人更惨所以你不算惨」；本族管交易
 *     双方的损益被绑定成镜像。
 *   · appeal_to_pity 管诉诸怜悯；本族不诉诸情感，只做损益对偶的
 *     结构性误断。
 *
 * 判据（腿① 交换语境 × 腿② 零和断言，缺一不判；腿②五形任一）：
 *   · 腿① CONTEXT 交换语境：交易事件词（贸易/交易/买卖/进出口/出口/
 *     进口/成交/合作/订单/合同/生意/供货/采购/谈判/议价/买家/卖家/
 *     买方/卖方/商家/供应商/客户；EN trade/deal/exchange/import/
 *     export/purchase/contract/transaction/business/market/buyer/
 *     seller/vendor/supplier/customer/partner）或交换双方指称
 *     （对方/另一方/他们/我们/人家；EN they/them/their/we/us/our/
 *     the other side/one side）。
 *   · 腿② ZEROSUM 零和断言（五形任一，命中位置前 8 字 / 14 字符内
 *     不得有否定标记——「并不意味着我们吃亏」是正确判别不是误判）：
 *     E-1 显式零和短语：零和/零和博弈/零和游戏/零和思维/固定馅饼/
 *       一进一出/总有人吃亏/有人赚就有人亏/所得即所失/一方所得/
 *       此消彼长/你多我少/羊毛出在羊身上/赢家通吃/你死我活；
 *       EN zero-sum / fixed pie / winner-takes-all / one side's gain
 *       is the other side's loss / taken from us / out of our pockets /
 *       at our expense / our loss / what they win ... we lose。
 *     E-2 损益方程形：所得方（赚/获利/盈利/得利/拿走/省了钱）在
 *       「等于/即是/相当于/无非/说白了」之后接所失方（亏/吃亏/损失/
 *       多付/代价/买单/被拿走）。
 *     C-1 推断链形：所得方 →（推断词 所以/因此/说明/意味着/肯定/
 *       必然/一定/注定；EN so/which means/therefore/must）→ 所失方。
 *     C-2 比较级平行形：越…越赚 … 越…越亏（EN the more ... earn
 *       ... the more ... lose）。
 *     C-3 每A即B形：每多赚/每获利 … 亏/损/代价。
 *
 * 为什么取 VERIFY 级：单句也可能是对真实零和局面的客观描述（奖牌
 * 名额固定、一块蛋糕的分配、座位有限的拍卖），也可能是新闻报道的
 * 转述、课堂案例；rewrite 会误伤。verify 的含义是「这段文本把自愿
 * 交换断言成了单向损益转移，需要回到交换双侧主观估价与退出成本再
 * 下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 教学/概念转述（教材/课堂/论文/悖论/称为/定义为/概念/所谓/是
 *     指/博弈论/理论上；EN textbook/lecture/paradox/called/defined/
 *     concept/game theory）——讨论这个概念本身不是运用它；
 *   · 正确响应形（自愿交易让双方受益/双赢/互利/不是零和/并非零和/
 *     零和谬误/把蛋糕做大/价值创造；EN voluntary exchange/both sides
 *     benefit/win-win/not zero-sum/fallacy/grows the pie）——指出
 *     交换可以双侧获益，正是本族要教的判别动作（「不是零和」后接
 *     「是什么」的反问形不豁免：那是用否定句式包装的断言）；
 *   · 无腿②（只有交易语境、没有损益对偶断言）——缺零和断言即无
 *     误判可判；
 *   · 疑问句（含 ?/？）——但反问标记（难道/岂/何尝/岂不是/谈何；
 *     EN isn't it/doesn't that/how else/what else/if not）不豁免：
 *     用问号包装的断言仍是断言。
 */
'use strict';

// ─── 腿① CONTEXT 交换语境（中文）──────────────────────────────────
const CONTEXT_ZH = [
  /贸易|交易|买卖|进出口|出口|进口|成交|合作|订单|合同|生意|供货|采购|商业|谈判|议价|讨价还价|竞价|成交价|市场化|互通有无|各取所需/,
  /买家|卖家|买方|卖方|商家|客户|供应商|生产商|经销商|贸易商|厂商|甲方|乙方/,
  /对方|另一方|他们|我们|人家|彼此|双方/,
];

// ─── 腿② 所失方 LOSS（中文；r161 教训：收裸词形态）────────────────
const LOSS_ZH = [
  /亏了|亏得|亏钱|亏本|吃亏|受损失|有损失|遭受损失|损失了|利益受损|血本无归|赔了|赔钱|倒了霉|晦气/,
  /多付|付了代价|付出代价|买单|流失|被拿走|被抢走|被占了|亏损|蚀本|折本|吐出去|多掏|掏了|让利(?![的])/,
];

// ─── 腿② 所得方 GAIN（中文）──────────────────────────────────────
const GAIN_ZH = [
  /赚了|赚得|挣了|多赚|赚的|挣的|赚大头|挣大头|拿大头|捞一笔|捞一票|获利|盈利|得利|受益|发了财|发财|省了钱|省钱|获益|渔利|牟利|分到大头|占了大头|拿走|拿到|利润|收益|毛利|营收|营业额|报酬/,
];

// ─── 腿② C-1 推断词（中文）───────────────────────────────────────
const INFER_ZH = /所以|因此|因而|可见|说明|意味着|证明|显然|肯定|必然|一定|注定|那就|相当于|等于|即是|无非|不过就是|说白了|说到底|也就|自然|势必|全是|都是|是因为|因为/;

// ─── 腿② E-1 显式零和短语（中文）─────────────────────────────────
const EXPLICIT_ZH = [
  /零和|固定馅饼|定量馅饼|常量馅饼|一进一出|总有人吃亏|有人赚就有人亏|有人赢就有人输|所得即所失|一方所得|一方之所得|所失|此消彼长|你多我少|你多我就少|羊毛出在羊身上|赢家通吃|你死我活|零和游戏|零和博弈/,
  // E-2 损益方程形：赚的就是…亏的 / 每一分钱都等于从…拿走 / 拿走的全是…吐出去的
  /(?:赚|获利|盈利|得利|拿)的?[^。；]{0,12}(?:就是|等于|即是)[^。；]{0,12}(?:亏|损|失|代价|拿走)/,
  /(?:拿|赚|获|取)走?的[^。；]{0,12}(?:全是|都是|正是|即是)[^。；]{0,12}(?:吐|付|亏|损|失|代价)/,
  /每[^。；，]{0,12}(?:赚|获利|得利|多拿|多挣)[^。；]{0,16}(?:亏|损|失|代价)/,
  /(?:所赚|所获|所得)[^。；，]{0,8}(?:即|就是|全是)[^。；，]{0,8}(?:所失|所亏|损失|代价)/,
  // 反问族：「难道A赚…，我们还能不亏吗」——用反问句式包装的零和断言。
  // 收紧在「还能不/岂不/不得不/不能不 + 损益词」形，放过质疑式反问
  // （「难道他们赚大头，就证明我们亏了吗？」是在质疑零和叙事，不判）。
  /难道[^。？]{0,24}(?:赚|获利|盈利|得利|拿走|获益)[^。？]{0,24}(?:还能不|岂不|不得不|不能不)[^。？]{0,8}(?:亏|损|失|吃亏|代价)/,
  /岂[^。？]{0,20}(?:赚|获利|盈利)[^。？]{0,20}(?:还能不|岂不|不得不|不能不)[^。？]{0,8}(?:亏|损|失|吃亏)/,
];

// ─── 腿② C-2 比较级平行形（中文）：越…赚 … 越…亏 ──────────────────
const COMP_ZH = /越[多较高][^。；，]{0,14}(?:赚|获利|盈利|得利|受益)[^。；]{0,26}越[多较高][^。；，]{0,14}(?:亏|损|失|少)/;

// ─── 英文常量 ───────────────────────────────────────────────────
const CONTEXT_EN = [
  /\b(?:trade|trading|deals?|exchange|imports?|exports?|purchase|purchases|purchased|contract|contracts|transaction|transactions|business|commerce|market|buyers?|sellers?|vendors?|suppliers?|customers?|clients?|partners?|partnership)\b/i,
  /\b(?:they|them|their|we|us|our|the\s+other\s+(?:side|party)|one\s+side|another\s+party|both\s+sides)\b/i,
];
const GAIN_EN = [
  /\b(?:earn|earns|earned|earnings|earning|profit|profits|profited|profitable|gain|gains|gained|benefit|benefits|benefited|save|saves|saved|savings|pocket|pocketed|rake\s+in|rakes\s+in|raked\s+in|cash\s+in|cashes\s+in)\b/i,
];
const LOSS_EN = [
  /\b(?:lose|loses|lost|loss|losses|taken|taking|paying|pay|paid|expense|suffer|suffers|suffered|worse\s+off|shortchanged|ripped\s+off|fleeced|left\s+with\s+less|overpay\w*|overcharg\w*)\b/i,
];
const INFER_EN = /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|means|implies|hence|consequently|must|necessarily|inevitably|basically|equivalent\s+to|equals?|because|since)\b/i;
const EXPLICIT_EN = [
  /\bzero[\s-]?sum\b/i,
  /\bfixed[\s-]?pie\b/i,
  /\bwinner[\s-]takes[\s-]all\b/i,
  /\bone\s+side'?s\s+gain\s+is\s+(?:the\s+)?other'?s\s+loss\b/i,
  /\btheir\s+gain\s+is\s+our\s+loss\b/i,
  /\btaken\s+from\s+us\b/i,
  /\bout\s+of\s+our\s+pockets?\b/i,
  /\bat\s+our\s+expense\b/i,
  /\bour\s+loss\b/i,
  /\bwhat\s+they\s+win\b[^.]{0,40}\bwe\s+(?:lose|lost)\b/i,
  /\bevery\s+(?:dollar|cent|unit|euro|yuan)\s+they\s+earn\b[^.]{0,40}\b(?:taken|lost|from\s+us)\b/i,
  // E-2 损益方程形（EN）：what they earn is what we lose / their gain equals our loss
  /\bwhat\s+they\s+(?:earn|gain|profit)\b[^.]{0,30}\b(?:is|equals?)\b[^.]{0,30}\b(?:we\s+(?:lose|lost)|our\s+(?:loss|losses))\b/i,
  /\btheir\s+(?:gain|profit|earnings?)\s+(?:is|equals?|means)\s+our\s+(?:loss|losses)\b/i,
  // C-3 每A即B形（EN）：every dollar they make is a dollar off our books
  /\bevery\s+(?:dollar|cent|unit|euro|yuan)\s+they\s+(?:make|earn|take)\b[^.]{0,40}\b(?:off\s+our|from\s+our|out\s+of\s+our)\b/i,
];
const COMP_EN = /\bthe\s+(?:more|less|better|harder)\b[^.]{0,40}\b(?:earn|profit|gain|sell|sells|sold|export|exports|ship|benefit)\b[^.]{0,60}\bthe\s+(?:more|less|worse)\b[^.]{0,40}\b(?:lose|lost|loss|pay|paid|suffer|worse\s+off)\b/i;

// ─── 豁免一：教学/概念转述（讨论概念本身不是运用它）────────────────
const EXEMPT_META_ZH = [
  /教材|课堂|教科书|讲座|教案|习题|论文|文献|称为|定义为|概念|所谓|是指|悖论|理论上|博弈论|学术|研讨|谬误|误区|思维陷阱|认知偏误/,
];
const EXEMPT_META_EN = [
  /\b(?:textbook|lecture|paradox|called|defined|definition|concept|game\s+theory|theory|fallacy|misconception|cognitive\s+bias|paper|study\s+(?:shows|found))\b/i,
];

// ─── 豁免二：正确响应形（指出交换可双侧获益，正是要教的判别动作）───
// 「不是零和」后接「是什么」是反问形（用否定句式包装的断言），不豁免。
const EXEMPT_CORRECT_ZH = [
  /自愿交易|自愿交换|自愿合作/,
  /双方都受益|双方受益|互惠互利|互利共赢|共赢|是双赢|双赢的|双赢局面|双赢结果|实现双赢|达到双赢|共同受益|皆大欢喜|各得其所|把蛋糕做大|蛋糕做大|价值创造|创造价值|正和/,
  /不是零和(?!是什么)|并非零和|不属于零和|不等于零和|不是此消彼长|谈不上零和/,
  /零和谬误|零和思维是|零和误判|把贸易当成零和|把交易看成零和|固定馅饼谬误|固定馅饼思维/,
];
const EXEMPT_CORRECT_EN = [
  /\bvoluntary\s+(?:exchange|trade|transaction)\b/i,
  /\bboth\s+sides\s+(?:benefit|gain|better\s+off|win|profit)\b/i,
  /\bmutually\s+beneficial\b/i,
  /\bwin[\s-]win\b/i,
  /\bnot\s+(?:a\s+)?zero[\s-]?sum\b/i,
  /\b(?:fallacy|misconception|mistake|myth)\b/i,
  /\b(?:grows?|expand(?:s|ing)?|enlarges?)\s+the\s+pie\b/i,
  /\bcreates?\s+(?:new\s+)?value\b/i,
];

// ─── 否定守卫（窗口化：查腿命中位置前的否定标记）──────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不会造成|不会导致|不是说|不能说|谈不上|谈不上是|并不意味着|并没有|也不存在/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|neither|nor|no\s+longer)\b/i;

// 邻近窗（中文按字、英文按字符）
const WIN_CTX_ZH = 200;   // 腿① ↔ 腿②（同句内即可，句长上限兜底）
const WIN_CTX_EN = 500;
const WIN_GAIN_INFER_ZH = 40;  // 所得方 ↔ 推断词
const WIN_GAIN_INFER_EN = 120;
const WIN_INFER_LOSS_ZH = 40;  // 推断词 ↔ 所失方
const WIN_INFER_LOSS_EN = 120;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；INFER 单正则注入替换正则
// （负例脚本用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 找列表中任一命中的首个位置
function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 全量命中位置（global 扫描）
function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ idx: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 窗口化否定守卫：命中位置前 n 字/字符内不得有否定标记
function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：交换语境
function findContextLeg(text, isZh, R) {
  const list = isZh ? (R.CONTEXT_ZH || CONTEXT_ZH) : (R.CONTEXT_EN || CONTEXT_EN);
  return firstIdx(list, text);
}

// 腿② E-1/E-2/C-3：显式短语族（任一命中且未被窗口否定）
function findExplicitLeg(text, isZh, R) {
  const list = isZh ? (R.EXPLICIT_ZH || EXPLICIT_ZH) : (R.EXPLICIT_EN || EXPLICIT_EN);
  for (const hit of allIdx(list, text)) {
    if (!negatedBefore(text, hit.idx, isZh)) return hit;
  }
  return null;
}

// 腿② C-2：比较级平行形
function findCompLeg(text, isZh, R) {
  const re = isZh ? pickRe(R.COMP_ZH, COMP_ZH) : pickRe(R.COMP_EN, COMP_EN);
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = reG.exec(text)) !== null) {
    if (!negatedBefore(text, m.index, isZh)) return { idx: m.index, text: m[0] };
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return null;
}

// 腿② C-1：推断链形 所得方 → 推断词 → 所失方（所失方不得被窗口否定）
function findChainLeg(text, isZh, R) {
  const gains = isZh ? (R.GAIN_ZH || GAIN_ZH) : (R.GAIN_EN || GAIN_EN);
  const losses = isZh ? (R.LOSS_ZH || LOSS_ZH) : (R.LOSS_EN || LOSS_EN);
  const inferRe = isZh ? pickRe(R.INFER_ZH, INFER_ZH) : pickRe(R.INFER_EN, INFER_EN);
  const winGI = isZh ? WIN_GAIN_INFER_ZH : WIN_GAIN_INFER_EN;
  const winIL = isZh ? WIN_INFER_LOSS_ZH : WIN_INFER_LOSS_EN;

  for (const g of allIdx(gains, text)) {
    const inferG = new RegExp(inferRe.source, inferRe.flags.includes('g') ? inferRe.flags : inferRe.flags + 'g');
    let im;
    while ((im = inferG.exec(text)) !== null) {
      if (im.index < g.idx || im.index - g.idx > winGI) continue;
      for (const l of allIdx(losses, text)) {
        if (l.idx < im.index || l.idx - im.index > winIL) continue;
        if (negatedBefore(text, l.idx, isZh)) continue;
        return { idx: l.idx, text: g.text + ' → ' + im[0] + ' → ' + l.text };
      }
    }
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkZeroSumFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：仅当句中无反问标记时豁免（用问号包装的断言仍是断言）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|谁不知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  // 豁免一：教学/概念转述
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免二：正确响应形
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①：交换语境（交易事件词或交换双方指称）
  const ctxIdx = findContextLeg(text, isZh, R);
  if (ctxIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：零和断言五形任一（E-1/E-2/C-3 显式 / C-2 比较平行 / C-1 推断链）
  const forms = [];
  const ex = findExplicitLeg(text, isZh, R);
  if (ex) forms.push({ form: 'E', hit: ex });
  const cp = findCompLeg(text, isZh, R);
  if (cp) forms.push({ form: 'C-2', hit: cp });
  const ch = findChainLeg(text, isZh, R);
  if (ch) forms.push({ form: 'C-1', hit: ch });
  if (forms.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: forms.length,
    detail: isZh
      ? '零和误判：自愿交换被当作一方所得即另一方所失(zh, ' + forms.map(f => f.form).join('+') + ')'
      : 'zero-sum misconception: voluntary exchange treated as one side gain = other side loss(en, ' + forms.map(f => f.form).join('+') + ')',
  };
}

module.exports = {
  checkZeroSumFallacy,
  __internals: () => ({
    CONTEXT_ZH, GAIN_ZH, INFER_ZH, LOSS_ZH, EXPLICIT_ZH, COMP_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, NEG_ZH,
    CONTEXT_EN, GAIN_EN, INFER_EN, LOSS_EN, EXPLICIT_EN, COMP_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, NEG_EN,
  }),
};
