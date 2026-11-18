/**
 * src/circular-reasoning.js — 「循环论证」检测器（第 136 个判别维度）
 *
 * [r701 立项] decision 本体在 135 维引擎上选出（/tmp/decide-run-r701.js 读
 * /tmp/decide-opts-r701.json，composite_score 0.90 / confidence 0.88 /
 * identity alignment 100%，无拒选；候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt，本轮复验 6/6 仍 pass）。判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判：攻击 10 条
 * 漏判 8/10、真零命中 7/8、良性 0/12 误伤。Phase 1.5 同律复核：8 条
 * 漏判样本逐条跑 discriminate()，实测全维度零命中 7/8——不是被聚合
 * 压掉，是射程外。缺口成立。
 *
 * 辨别的族：「循环论证」（circular reasoning，同义反复 / begging the
 * question）——**把结论本身当作结论的证据**：前提只是把结论换了句话
 * 说，没有任何新的依据、数据或推理：
 *   因为这是对的，所以它是对的。
 *   他可靠，因为他从来不说假话，不说假话的人可靠。
 *   这本书是好书，因为它写的都是好内容。
 *   他是天才，因为天才才写得出这样的作品。
 *   这个规定合理，因为合理的规定才这么写。
 *   数据准确，因为数据从来不会错。
 *   他诚实，诚实的人从不说谎，他没说过谎。
 *   这是真理，因为真理就是这样的。
 *   产品好用，因为好用的产品才好用。
 *   他专业，因为不专业的人做不到这么专业。
 *   It is right because it is right.
 *   This is a good book because it is full of good content.
 *   He is a genius because geniuses write works like this.
 *
 * 与既有维度的边界（r701 归因）：
 *   · FALLACY_PATTERNS 内既有 3 条 circular_reasoning 正则只认
 *     「因为X所以X因为」「这本身就是X这证明」「之所以X是因为X所以」
 *     三种嵌套形，对本族 10 条样本实测零命中（r700 探测器实测）。
 *     本维度是**程序化判定**（跨连接词的同词共现 × 定义式复述框），
 *     不是再加正则。
 *   · contradiction 管**前后语义冲突**（先说 A 后说非 A），本族前后
 *     不冲突——是同一句话说了两遍。
 *   · reasoning_coherence 管**推理链完整性**（有没有前提/推论/
 *     结论标记），本族三段俱全、结构完整，缺的是前提与结论同义。
 *   · evidence 管**有无出处**，本族攻击句常常没有数字也没有来源，
 *     evidence 打分器基线恒返回 {score:1, issues:[]}（r690 起连续
 *     记录），覆盖不到。
 *   · confidence 管**断言强度**（肯定/绝对），本族可以毫无强度词。
 *   · 其余 135 个维度对本族 8 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① REPEAT 同词共现：连接词（因为/由于/because/since）或分号
 *     两侧出现**同一个实词片段**（中文 2-6 字纯汉字 n-gram；英文 4+
 *     字母实词，支持词干/复数/否定前缀包含匹配；或相邻实词对重复）。
 *     功能词片段（他是/因为/就是/这个…）一律跳过——那是代词与连词，
 *     不是论证内容。
 *   · 腿② DEFINITIONAL 定义式复述框：后半句是**对前半句断言的定义
 *     式重述**而非新事实，五类：
 *       f1 主语重启（后半句以重复词或其否定形开头，且紧跟 的/才/
 *          就是/从来/永远/总是/的人/的东西/不/没）；
 *       f3 类指名词化（后半句含 的人/的东西/的产品/的行为/的做法，
 *          与重复词同现，顺序不限）；
 *       f5 恒常习惯（从来/永远/总是，与重复词同现，顺序不限）；
 *       f6 全称判断（都是/全是/无非是/不过是，与重复词同现）；
 *       f7 判言重启（就是/才是/算是/完全是/无疑是，与重复词同现）；
 *       f8 同构复述（前半句与后半句去代词后相同，或后半句是纯系词
 *          句「（它/这/那）是X」且 X 与重复片段互相包含）；
 *       e9 英文类指复数（products/rules/people 等无冠词复数主语）。
 *   · 缺框不判：「他迟到，因为他迟到了」有重复但后半句是同一事件
 *     的重申，没有定义式框架，不判（正常强调句）。
 *   · 缺重复不判：「会议延期，因为延期申请已经批准」——后半句引入
 *     新事实（申请/批准），即使「延期」重复也不判。
 *
 * 为什么取 VERIFY 级：单句可能是正常的定义说明（「他诚实，因为诚实
 * 是他的原则」是价值观陈述）、教学举例、文学对白、元话语分析
 * （「循环论证是指因为这是对的，所以它是对的」），rewrite/block 会
 * 误伤。verify 的含义是「这个论证的前提可能只是结论的复述，需要
 * 独立依据」——调用方应要求给出可核验的证据再采信。
 *
 * 明确不判的（豁免）：
 *   · 依据在场：实验/验证/复核/证实/测试/测量/文献/评分/留存率/
 *     统计/报告/研究表明（有出处的陈述是引用不是循环）；
 *   · 引述动词：说/表示/认为/提到/写道/反映/告诉（转述他人观点是
 *     新信息来源）；
 *   · 评析这套话术本身（循环论证是一种逻辑谬误/circular reasoning
 *     is a common logical fallacy）；
 *   · 数字与百分比在场（量化陈述自带外部锚点）；
 *   · 条件后置（「错了就要认」类——就/如果/要是 开头的后续分句是
 *     条件句不是定义复述）。
 *
 * [r735 扩展·真升级②] 新增**同义反复论证族**（第 5 链，union，与存量四链
 * 互补；src/index.js 零改动、dimMap 键数仍 266——1 号 r397 已接线第 267
 * 维，本族不新增键）——存量判据只认两种语序
 * （「因为A，所以A'」的 because-split 与「A，A'」的逗号 chain），
 * 「A，所以A'」的**结论前置复述**与**同义反复定义当论证前提**整族穿透
 * （r735 二段深探实测：ZH 6/12、EN 10/12 穿透，穿透样本全维度零命中）：
 *   · R5a 定义循环框（四腿共现）：腿① DEF_FRAME 定义式等同框（ZH 的
 *     定义/本质是、所谓…是、句首 X 就是；EN is defined as / is what is /
 *     means）；腿② TAUT 同义反复体——定义体复述术语本身，三形任一：
 *     子串包含（Y 含 X 或 X 含 Y）、反义否定（Y = 没/无/不 + X 的反义
 *     词，ANTONYM_ZH）、同义表（TAUT_SYN_ZH/EN 显式小表，防任意近义词
 *     泛化）；腿③ USE 论证化使用（所以/因此/因而/故而/于是/从而；EN
 *     therefore/thus/hence/so/consequently）——裸定义句不判；腿④
 *     RESTATE_CONC 结论必须是定义体的复述（结论含术语 ∧ 结论与定义体
 *     有共享片段；反义否定形豁免共享要求）。腿④挡掉「教育的本质是培养
 *     人，所以教育要面向全体学生」这类**引入新内容**的假阳性，也把
 *     「爱=心疼」「友谊=互相帮助」这类**可争议词典释义**（persuasive
 *     definition）挡在本维射程外——它们不是同义反复。
 *   · R5b 结论前置复述框（两腿共现）：CONN_ZH/CONN_EN 切出 A|B，复用
 *     存量 REPEAT×FRAME 双腿，并补两个**纯系词应用框**：f9 ZH_COPULAR
 *     （「主语(+副词)+是+谓词」且谓词含重复词——存量 f8 只收「(代词)
 *     是X」形，收不住「这件作品显然是好设计」）；e10（「(主语)+is/are
 *     (+of)+谓词」，右句谓词组**不经 enWords 停词过滤**——just/safe 这
 *     类谓词核心词恰在 EN_STOP 里，过滤后无 pair 可配整族恒死；窗宽 6
 *     词覆盖 "we have had no accidents and are safe" 形）。
 *   · 新增豁免 DEF_HEDGE_ZH/EN：定义被显式标为多家存疑（「这只是其中
 *     一种定义」「one of several definitions」「学界有分歧」）时不判。
 * 验证（r735 实测，含腿④收紧后的复测）：模块层轮测 60/60（34 攻击 + 26 良
 * 性含定义句/教学句/存疑定义形/新内容结论形，scripts/round-735/
 * selftest-module.js 另 63/63）；gate 层攻击 34/34 非 pass
 * 且 circular_reasoning finding 在场；良性误伤与探针基线逐项一致（G1 3/12、
 * G3 1/12 改动前后同批、零新增；承维全为存量：empty_answer ×2 /
 * prompt_injection+moral_foundations ×1 / 无 finding ×1）；存量轮
 * 测不回归：round-701 18/18、round-463 全通过、round-417 全通过、
 * round-431 全通过。变异守卫 13 个新常量逐一作废全变红（见
 * test/round-735-circular-tautology-restate.test.js）。
 */
'use strict';

// ─── 功能词片段停止表（跳过代词/连词/标记词重复）──────────────────
const FUNCTION_NGRAM = new RegExp(
  '^(?:' +
  '他是|她是|我是|你是|这是|那是|不是|就是|才是|可是|但是|因为|所以|如果|虽然|而且|还有|' +
  '这个|那个|这些|那些|我们|你们|他们|她们|它们|什么|怎么|为什么|可以|应该|必须|能够|' +
  '觉得|认为|时候|然后|已经|还是|只是|这样|那样|这么|那么|一样的|的时|是一|是不|为好|' +
  '是为|的了|在不|有时|有所|以此|以及|从来|永远|总是|都是|全是|无非是|不过是|算是|' +
  '无疑是|完全是|的人|的东西|的产品|的行为|的做法|就是' +
  ')$'
);

// ─── 豁免一：依据在场（有出处的陈述是引用不是循环）────────────────
const EVIDENCE_EXEMPT = /(?:实验|验证|复核|证实|测试|测量|文献|评分|留存率|统计|报告|研究表明|数据表明|peer[\s-]?review|according\s+to|study\s+shows|research\s+shows|evidence|proven|tested|measured|confirmed|verified|survey)/i;

// ─── 豁免二：引述动词（转述他人观点是新信息来源）──────────────────
// 只收**主语锚定**的引述（他说/他表示/据报道）与显式转述动词——裸「说」
// 会误伤「不说假话」「从不说谎」「没说过谎」这类攻击句自身的否定表述
// （r701 实测：首版裸「说」把 2/10 攻击样本误豁免）。
const REPORTING_EXEMPT = /(?:[他她你我这它]们?(?:说|表示|认为|提到|透露)|表示|认为|提到|写道|反映|告诉|宣称|声称|据称|据报道|强调|指出|承诺|保证)/;

// ─── 豁免三：评析这套话术本身 / 概念分析 ────────────────────────
const META_EXEMPT_ZH = /(?:循环论证|同义反复|丐词魔术|诉诸定义(?:裁决)?|规定性定义|begging\s*the\s*question|circular\s+reasoning|tautolog)(?:是|属于|是一种|正是|称为|叫做|指|举例|例如|比如|案例|教学|分析|识别|检测)/;
const META_EXEMPT_EN = /\b(?:circular\s+reasoning|begging\s+the\s+question|tautology|definist(?:\s+fallacy)?|persuasive\s+definition)\s+(?:is|are|refers\s+to|means|describes)\b/i;

// ─── 数字/百分比（量化陈述自带外部锚点）────────────────────────
const NUMERIC = /\d|%|％/;

// ─── 定义式标记（与重复词同现即构成复述框，顺序不限）────────────
const DEFINITIONAL_MARKERS = /(?:的人|的东西|的产品|的行为|的做法|从来|永远|总是|都是|全是|无非是|不过是|就是|才是|算是|完全是|无疑是)/;

// ─── 主语重启的后续标记（必须紧跟重复词）──────────────────────
// 恒常词（从来/永远/总是）刻意不在主语重启尾表里——它们必须走 HABITUAL_OK
// （带否定的定义式），否则「事情从来如此」这类传统诉诸会经 f1 误伤
// （r701 实测）。
// [v6.8.85] RESTART_TAIL 移除裸「不|没|无」：「状态不一致」「服务没恢复」
// 这类领域短语重启不是否定定义形（否定重启的收紧判据见 f1b 的
// NEG_RESTART_OK，须带评价/能力尾）。semantic-injection 长文本实测误伤。
const RESTART_TAIL = /^(?:的|才|就是|的人|的东西)/;

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/**
 * 全部公共纯汉字 n-gram 候选（最长优先，去重，跳过功能词片段）。
 * @returns {string[]}
 */
function commonZhNgrams(a, b) {
  const out = [];
  const seen = new Set();
  const max = Math.min(6, a.length, b.length);
  for (let n = max; n >= 2; n--) {
    for (let i = 0; i + n <= a.length; i++) {
      const g = a.substr(i, n);
      if (!/^[\u4e00-\u9fff]+$/.test(g)) continue;
      if (FUNCTION_NGRAM.test(g)) continue;
      if (seen.has(g)) continue;
      if (b.includes(g)) { seen.add(g); out.push(g); }
    }
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * 定义式复述框判定（中文）：后半句是对前半句断言的定义式重述。
 * @param {string} right 连接词之后的半句
 * @param {string} rep 重复片段
 */
function zhDefinitionalFrame(right, rep) {
  if (!right || !rep) return false;
  const neg = '(?:不|没|无)?' + esc(rep);
  // f1 主语重启：以重复词（或其否定形）开头，且紧跟定义式标记
  if (new RegExp('^' + neg).test(right) && RESTART_TAIL.test(right.slice(right.indexOf(rep) + rep.length))) return true;
  // [v6.8.85] f1b 否定重启须带评价/能力尾：「数据从不错」「人不会错」类。
  // 原 RESTART_TAIL 含裸「不|没|无」——工程叙述的领域短语重启
  // （「状态不一致导致…」「服务没恢复」）被误判为否定定义形
  // （semantic-injection 长文本实测误伤）。分界：否定后须在 6 字内
  // 出现评价/能力词（错/对/好/行/可靠/可能/会/能/成立/有效）。
  const NEG_RESTART_OK = /^(?:不|没|无)[^。]{0,6}(?:错|对|好|行|可靠|可能|会|能|成立|有效)/;
  if (new RegExp('^' + neg).test(right) && NEG_RESTART_OK.test(right.slice(right.indexOf(rep) + rep.length))) return true;
  // f3/f6/f7 非恒常标记同现（顺序不限）直接构成复述框
  const NON_HABITUAL = /(?:的人|的东西|的产品|的行为|的做法|都是|全是|无非是|不过是|就是|才是|算是|完全是|无疑是)/;
  // f5 恒常标记（从来/永远/总是）必须带否定才是定义式（从来不会错）——
  // 「他总是有理由」「事情从来如此」是个体习惯陈述与传统诉诸，不是同义
  // 反复（r701 实测：无否定要求的 f5 误伤这 2 条）。
  const HABITUAL_OK = /(?:从来|永远|总是)[^。]{0,4}(?:不|没|无)/.test(right);
  if ((NON_HABITUAL.test(right) || HABITUAL_OK) && right.includes(rep)) {
    // 重复词自身以标记词开头（都是普通人/就是如此）时，命中的是标记复述
    // 不是内容复述，跳过该候选
    if (!DEFINITIONAL_MARKERS.test(rep.slice(0, 3))) return true;
  }
  // f8 纯系词句：「（它/这/那/他/她）是X」且 X 与重复片段互相包含
  const m = right.match(/^(?:它|这|那|他|她|其)?(?:都|全)?是([^。]{0,12})$/);
  if (m && (m[1].includes(rep) || rep.includes(m[1]))) return true;
  return false;
}

/**
 * 中文路由：因为-split + 分号/逗号链。
 */
function checkZh(text) {
  const idx = text.search(/因为|由于/);
  if (idx >= 0) {
    let left = text.slice(0, idx);
    let right = text.slice(idx).replace(/^(因为|由于)/, '');
    // 「因为A，所以B」形：连接词在句首，左半为空 → 改从「所以」切分
    if (!left.trim() && /所以|因此/.test(right)) {
      const j = right.search(/所以|因此/);
      left = right.slice(0, j);
      right = right.slice(j).replace(/^(所以|因此)/, '');
    }
    if (left.length < 2 || right.length < 2) return null;
    for (const rep of commonZhNgrams(left, right)) {
      if (zhDefinitionalFrame(right, rep)) return { rep, route: 'because' };
    }
    return null;
  }
  // 分号/逗号链：「他诚实，诚实的人从不说谎」——无连接词的复述结构
  const m = text.match(/[\u4e00-\u9fff]{0,4}([\u4e00-\u9fff]{2,4})[，,；;]\1/);
  if (!m) return null;
  const rep = m[1];
  const right = text.slice(m.index + m[0].length);
  // 条件后置（错了就要认 / 同意就干）是条件句不是定义复述
  if (/^(?:就|如果|要是|若|那|那么|请|希望)/.test(right)) return null;
  // 帧检查要把重复词本身算进去（链式结构的复述框在重复词之后）
  if (zhDefinitionalFrame(rep + right, rep)) return { rep, route: 'chain' };
  return null;
}

// ─── 英文侧 ────────────────────────────────────────────────────
const EN_STOP = new Set([
  'this', 'that', 'with', 'from', 'have', 'has', 'had', 'been', 'were', 'are',
  'was', 'will', 'would', 'could', 'should', 'there', 'their', 'them', 'then',
  'than', 'when', 'what', 'about', 'into', 'over', 'under', 'more', 'most',
  'very', 'just', 'also', 'only', 'because', 'since', 'which', 'while',
]);

function enStem(w) {
  return w.replace(/(?:es|ed|ing|ly|ness|ity|ment|th)$/, '');
}

function enWords(s) {
  return (s.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !EN_STOP.has(w));
}

function enMatch(a, b) {
  // 同一词干、互为子串（≥4 字母，覆盖 unprofessional/professional）、复数
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  const sa = enStem(a);
  const sb = enStem(b);
  return sa === sb && sa.length >= 4;
}

function enDefinitionalFrame(right, rep) {
  const r = right.toLowerCase();
  const neg = esc(rep.toLowerCase());
  // e1a 主语重启（非否定形）：(the|a|an)? + 重复词开头，且紧跟定义式尾
  if (new RegExp("^(?:the\\s+|a\\s+|an\\s+)?" + neg + "\\b\\s*(?:is|are|means|never|always|cannot|can\\s+not|do\\s+not|who|that|like\\s+this|this\\s+way|by\\s+definition)\\b").test(r)) return true;
  // e1b 否定定义：以 un/in/non + 重复词开头（用否定面定义正面）
  if (new RegExp('^(?:un|in|non)' + neg + '\\b').test(r)) return true;
  // e2 类指关系从句：people who / ones that / those who …
  if (new RegExp('\\b(?:people|ones|things|those)\\s+(?:who|that)\\b[^.]{0,40}?' + neg).test(r)) return true;
  // e3 定义式尾：like this / this way / by definition / that is what
  if (/\b(?:like\s+this|this\s+way|by\s+definition|that\s+is\s+what|is\s+what\s+makes)\b/.test(r)) return true;
  // e6 纯系词复述：it/this/he/she … is (full of) X，X 含重复词
  const m = right.match(/^(?:it|this|that|he|she|they)\s+(?:is|are)\s+(?:full\s+of\s+)?([^.]{0,24})$/i);
  if (m && enMatch(rep, (m[1].toLowerCase().match(/[a-z]{4,}/g) || [])[0] || '')) return true;
  // e9 恒常/定义标记与重复词同现（顺序不限）
  if (/\b(?:never|always|by\s+definition|is\s+what|means?\s+that)\b/.test(r) && r.includes(neg)) return true;
  return false;
}

function checkEn(text) {
  const m = text.match(/\b(?:because|since)\b/i);
  if (m) {
    const idx = m.index;
    const left = text.slice(0, idx).trim();
    const right = text.slice(idx + m[0].length).trim().replace(/[.,;:!?]+$/, '');
    if (left.length >= 3 && right.length >= 3) {
      const lw = enWords(left);
      const rw = enWords(right);
      // 单词重复
      for (const a of lw) {
        for (const b of rw) {
          if (enMatch(a, b) && enDefinitionalFrame(right, a)) {
            return { rep: a + '~' + b, route: 'because' };
          }
        }
      }
      // 相邻实词对重复（works well / work well）
      for (let i = 0; i + 1 < lw.length; i++) {
        for (let j = 0; j + 1 < rw.length; j++) {
          if (enMatch(lw[i], rw[j]) && enMatch(lw[i + 1], rw[j + 1])) {
            return { rep: lw[i] + ' ' + lw[i + 1], route: 'pair' };
          }
        }
      }
      // e4 整句同构复述：去前导代词与标点后两侧完全相同
      const strip = (s) => s.toLowerCase().replace(/^(?:it|this|that|he|she|they)\s+/, '').replace(/[^a-z\s]/g, '').trim();
      if (strip(left) && strip(left) === strip(right)) {
        return { rep: strip(left), route: 'clause' };
      }
    }
  }
  // 分号链：He is honest; honest people never lie …
  const cm = text.match(/([a-z]{4,})\s*[;,]\s*\1/i);
  if (cm) {
    const tail = (cm[1] + text.slice(cm.index + cm[0].length)).trim().replace(/[.,;:!?]+$/, '');
    if (enDefinitionalFrame(tail, cm[1])) {
      return { rep: cm[1], route: 'chain' };
    }
  }
  return null;
}

// ─── [r735 新增族] 同义反复论证族：定义循环 R5a + 结论前置复述 R5b ────────
// 辨别的族：**同义反复的定义被当作论证前提**（「幸福的定义就是感到幸福，
// 所以感到幸福的人一定幸福」——定义体只是把术语换了个说法，再由它推出
// 结论，论证零信息量），以及**结论前置语序的复述论证**（「A，所以A'」）。
// 存量判据只认两种语序：「因为A，所以A'」（连接词在中的 because-split）
// 与「A，A'」（逗号后紧跟重复词的 chain），「A，所以A'」整族穿透——
// r735 探针实测 6/12（ZH）/ 10/12（EN）穿透，穿透样本全维度零命中。
//
// R5a 四腿共现，缺一不判：
//   腿① DEF_FRAME 定义式等同框（ZH 的定义/的本质是/所谓…是/句首 X 就是；
//        EN is defined as / is what is / means）；
//   腿② TAUT 同义反复体——定义体复述术语本身，三形任一：子串包含
//        （Y 含 X 或 X 含 Y）、反义否定（Y = 没/无/不 + X 的反义词）、
//        同义表 TAUT_SYN（显式小表，防任意近义词泛化）；
//   腿③ USE 论证化使用（所以/因此/因而/故而/于是；EN therefore/thus/
//        hence/so/consequently）——定义被拿来推结论才是谬误，裸定义句
//        （「幸福的定义因人而异」）不判；
//   腿④ RESTATE_CONC 结论是定义体的复述（结论含术语 ∧ 与定义体有共享；
//        反义否定形豁免共享）——挡住「定义Y，所以关于X的新断言」。
// R5b 两腿共现：CONN 结论前置连接词切出 A|B，复用存量 REPEAT×FRAME
//    双腿（commonZhNgrams/enMatch × zhDefinitionalFrame/
//    enDefinitionalFrame），并补两个**纯系词应用框** f9/e10（「这件
//    作品显然是好设计」「this verdict is just」——存量 f8/e6 只收
//    「(代词)是X」形，收不住「主语+副词+是+谓词」的应用句）。
// 豁免沿用入口五条全局豁免（META 概念教学/NUMERIC/EVIDENCE/REPORTING），
// 另加 DEF_HEDGE：定义被显式标为多家存疑时不判（「这只是其中一种
//    定义」「one of several definitions」）。

// 腿① R5a 定义式等同框（中文，捕获组 = 被定义术语 X）
const DEF_FRAME_ZH = [
  /^(.{1,12}?)的(?:定义|本质)(?:就)?是/,
  /所谓(.{1,12}?)(?:就)?是/,
  /^(.{1,10}?)就是/,
];
// 腿① R5a 定义式等同框（英文）
const DEF_FRAME_EN = [
  /\b([a-z][a-z\s-]{2,28}?)\s+is\s+(?:defined\s+as|what\s+is)\s+/i,
  /\b([a-z][a-z\s-]{2,28}?)\s+means\s+/i,
];
// 腿③ R5a 论证化使用标记（中文）
const USE_ZH = [/所以/, /因此/, /因而/, /故而/, /于是/, /从而/];
// 腿③ R5a 论证化使用标记（英文）
const USE_EN = [/\b(?:therefore|thus|hence|consequently)\b/i, /\bso\b/i];
// 腿① R5b 结论前置连接词（中文）
const CONN_ZH = [/所以/, /因此/, /因而/, /故而/];
// 腿① R5b 结论前置连接词（英文）
const CONN_EN = [/\b(?:therefore|thus|hence)\b/i, /,\s*so\s+/i];
// 腿② R5a 同义表（显式小表：术语 → 定义体中的同义/复述形）
const TAUT_SYN_ZH = [
  ['真理', /真实|正确的认识/],
  ['健康', /无病/],
  ['成功', /成就|达成目标/],
  ['爱', /心疼|关心|喜爱/],
  ['友谊', /互助|互相帮助/],
  ['教育', /培养|教导/],
  ['正义', /公正|应得/],
  ['勇气', /勇敢|面对恐惧/],
  ['智慧', /明智/],
  ['幸福', /快乐|愉悦/],
  ['公平', /平等|一视同仁/],
  ['安全', /平安/],
];
const TAUT_SYN_EN = [
  ['truth', /\btrue\b|\btruth/],
  ['health', /\bhealth/],
  ['success', /\bsuccess/],
  ['love', /car(?:e|ing|ed)\b|affection|lov(?:e|ing|ed)\b/],
  ['friendship', /\bfriend/],
  ['education', /\beducat/],
  ['justice', /\bjust/],
  ['wisdom', /\bwis/],
  ['courage', /\bcourag/],
  ['happiness', /\bhapp/],
  ['safety', /\bsafe/],
  ['fairness', /\bfair/],
  ['efficiency', /\befficien/],
];
// 腿② R5a 反义否定表（术语 → 反义词；Y = 没/无/不 + 反义词 即复述）
const ANTONYM_ZH = [
  ['安全', /危险/], ['健康', /疾病|病/], ['成功', /失败/],
  ['公平', /偏颇|不公/], ['幸福', /痛苦|不幸/],
];
// 豁免：定义被显式标为多家存疑（呈现定义争议，不是以定义立论）
const DEF_HEDGE_ZH = /定义之一|其中一种|的一种理解|一种界定|各有分歧|存在分歧|学界|尚无定论|众说纷纭/;
const DEF_HEDGE_EN = /\b(?:one\s+of\s+(?:several|many|the)\s+definitions?|one\s+definition|contested|debated|there\s+is\s+no\s+single\s+definition|definitions\s+vary)\b/i;
// 腿② R5b 纯系词应用框（中文 f9）：「主语(+副词)+是+谓词」且谓词含重复词
const ZH_COPULAR = /^(?:这|那|它|其)?[^。]{0,10}?(?:显然|明显|当然|自然|一定|确实|果然|分明)?是([^。]{0,14})$/;

// 腿② R5b 纯系词应用框（英文 e10）：「(主语)+is/are (+of)+谓词」，窗宽 6
// 词覆盖 "we have had no accidents and are safe" 形；右句谓词组不经 enWords
// 停词过滤（just/safe 这类谓词核心词恰在 EN_STOP 里，过滤后无 pair 可配）。
const EN_COPULAR = /^(?:(?:it|this|that|he|she|they|we|our|your|the|a|an)\s+)?(?:[a-z]+\s+){0,6}(?:is|are)\s+(?:of\s+|full\s+of\s+)?([^.]{0,30})$/i;

// ─── [r401 新增族] 诉诸定义裁决族：定义立规 × 案件裁决 ────────────
// 辨别的族：**规定性定义被拿来直接裁决个案**（「教育的本质是筛选，
// 所以只有考高分的学习才是有意义的」——定义体不是同义反复（筛选
// 不复述教育），结论也不是对定义体的复述，而是把定义当尺子给个案
// 下裁决）。存量五链（含 r735 R5a/R5b）对该族 ZH 1/6、EN 1/4 穿透
// （穿透样本全维度零命中，r401 探针实测）。
//
// R6 三腿共现，缺一不判：
//   腿① DEF_STIP 规定性定义框（X 的本质/真正含义/真正意义/核心/实质/
//        真谛/内涵/精髓 是/在于 Y；EN the true meaning/essence/nature
//        of X is Y / real X means Y）——与 R5a 的分界：本腿**不要求**
//        定义体复述术语，定义体是带评价的新内容；
//   腿② USE 论证化使用标记（沿用 R5a 的 USE_ZH/USE_EN）；
//   腿③ VERDICT 案件裁决标记——结论必须是**把定义套到个案上的裁决
//        断语**（只有…才/无论…都/称不上/根本不/说明不/证明不；EN
//        proves/shows/means、anyone who…is not、is not truly、
//        counts as、nothing but），挡住「定义Y，所以关于X的中性
//        新断言」这类非裁决用法。
// 豁免沿用入口全局豁免 + DEF_HEDGE（定义被显式标为多家存疑时不判）。
// 腿① R6 规定性定义框（中文，捕获组 = 被规定术语 X）
const DEF_STIP_ZH = /(?:^|[。，,；;！!？?])(?:所谓的?)?([\u4e00-\u9fff]{1,8}?)(?:的)?(?:本质|真正含义|真正意义|核心|实质|真谛|内涵|精髓)(?:就)?(?:是|在于)/;
// 腿① R6 规定性定义框（英文；捕获组 1 = of 形术语，捕获组 2 = means 形术语）
const DEF_STIP_EN = /\b(?:the\s+)?(?:(?:true|real|actual|essential)\s+)?(?:meaning|essence|nature)\s+of\s+([a-z][a-z\s-]{2,28}?)\s+is\b|\b(?:real|true)\s+([a-z][a-z\s-]{2,28}?)\s+means\b/i;
// 腿③ R6 案件裁决标记（中文）
const VERDICT_ZH = /(?:只有[^。，,；;]{0,14}?才|无论[^。，,；;]{0,14}?都|本身就?是|实质上就是|根本就?不|压根不|完全不算|绝不算|并不算|算不上|称不上|充其量|只不过|不过是|无非[是也]|说明[^。，,；;]{0,10}?(?:不|没)|证明[^。，,；;]{0,10}?(?:不|没))/;
// 腿③ R6 案件裁决标记（英文）
const VERDICT_EN = /\b(?:proves?|shows?|means?|reveals?|confirms?)\b|\b(?:anyone|anything|nobody|nothing|no\s+one|those\s+who|people\s+who)\b|\bi[st]\s+not\s+(?:truly|really|genuinely|real|actual)|cannot\s+be\b|\bcounts?\s+as\b|\bnothing\s+but\b|\bmerely\b|\bdefeats?\s+the\s+purpose\b/i;

/** R5a 腿②（中文）：定义体是否复述术语本身。返回复述形（substring/antonym/syn）或 null */
function tautZh(term, body, R) {
  if (!term || !body) return null;
  if (term.length >= 2 && (body.includes(term) || term.includes(body) && body.length >= 2)) return 'substring';
  for (const [t, anti] of (R.ANTONYM_ZH || ANTONYM_ZH)) {
    // 没/无/不 + (有|是)? + 反义词 —— 「没有危险」「无危险」「不是失败」
    if (term.includes(t) && new RegExp('[没无不](?:有|是)?' + anti.source).test(body)) return 'antonym';
  }
  for (const [t, syn] of (R.TAUT_SYN_ZH || TAUT_SYN_ZH)) {
    if (term.includes(t) && syn.test(body)) return 'syn';
  }
  return null;
}

/** R5a 腿②（英文）：定义体是否复述术语本身。返回复述形或 null */
function tautEn(term, body, R) {
  if (!term || !body) return null;
  const t = term.toLowerCase();
  const b = body.toLowerCase();
  const stem = enStem(t);
  if (stem.length >= 4 && new RegExp('\\b' + esc(stem)).test(b)) return 'substring';
  for (const [w, syn] of (R.TAUT_SYN_EN || TAUT_SYN_EN)) {
    if (t.includes(w) && syn.test(b)) return 'syn';
  }
  return null;
}

/** R5a 腿④（中文）：结论是否是对定义体的复述（而非引入新内容） */
function restateConcZh(term, body, conc, tautRoute) {
  if (!conc || !term || !body) return false;
  // (a) 结论含术语本身（或其 ≥2 字子串）——结论必须是「关于被定义项」的
  let hasTerm = false;
  for (let n = Math.min(4, term.length); n >= 2 && !hasTerm; n--) {
    for (let i = 0; i + n <= term.length; i++) {
      if (conc.includes(term.substr(i, n))) { hasTerm = true; break; }
    }
  }
  if (!hasTerm) return false;
  // 反义否定形（Y = 没/无/不 + 反义词）豁免：定义体是术语的否定面，它的
  // 自然应用句只说术语（「零事故的系统显然足够安全」），与定义体零共享。
  if (tautRoute === 'antonym') return true;
  // (b1) 结论与定义体共享**非术语自身**的片段（「有效」/「成就」/「认识」
  //      这类定义体内容）——复述了定义体的信息。
  for (const g of commonZhNgrams(body, conc)) {
    if (!term.includes(g)) return true;
  }
  // (b2) 术语处于结论**谓词位**（尾 2 字内，且前面 6 字内有修饰/系词）：
  //      「这种分配很公平」是把定义直接套到主词上；而「效率值得重视」
  //      术语在句首当主语、后面跟新谓词，是引入新内容，不判。
  const p = conc.lastIndexOf(term);
  if (p >= 0 && conc.length - (p + term.length) <= 2) {
    if (/(?:是|很|显然|自然|当然|确实|完全|都|也|才|就|相当|非常|极其|特别|明显)/.test(conc.slice(Math.max(0, p - 6), p))) return true;
  }
  return false;
}

/** R5a 腿④（英文）：结论是否是对定义体的复述 */
function restateConcEn(term, body, conc, tautRoute) {
  if (!conc || !term || !body) return false;
  const cw = enWords(conc);
  const bw = enWords(body);
  // (a) 结论含术语词干
  const hasTerm = cw.some((w) => enMatch(w, term.toLowerCase()))
    || (enStem(term.toLowerCase()).length >= 4 && new RegExp(esc(enStem(term.toLowerCase()))).test(conc.toLowerCase()));
  if (!hasTerm) return false;
  if (tautRoute === 'antonym') return true;
  // (b1) 结论与定义体共享**非术语自身**的实词
  for (const a of bw) {
    for (const b of cw) {
      if (enMatch(a, b) && !enMatch(b, term.toLowerCase())) return true;
    }
  }
  // (b2) 术语（或其同根词）是结论的**最后一个实词**——谓词位
  for (let i = cw.length - 1; i >= 0; i--) {
    if (enMatch(cw[i], term.toLowerCase())) return true;
    break;
  }
  return false;
}

/** R5a：定义循环框（四腿共现） */
function defCircular(text, isZh, R) {
  const USE = isZh ? (R.USE_ZH || USE_ZH) : (R.USE_EN || USE_EN);
  // 论证化使用标记的位置即结论起点（腿④要拿结论比对）
  let uIdx = -1;
  for (const re of USE) {
    const m = text.match(re);
    if (m && (uIdx < 0 || m.index < uIdx)) uIdx = m.index;
  }
  if (uIdx < 0) return false;
  const conc = text.slice(uIdx).replace(isZh
    ? /^(?:所以|因此|因而|故而|于是|从而)/
    : /^(?:\b(?:therefore|thus|hence|consequently)\b|so\b)/i, '');
  const FRAMES = isZh ? (R.DEF_FRAME_ZH || DEF_FRAME_ZH) : (R.DEF_FRAME_EN || DEF_FRAME_EN);
  for (const re of FRAMES) {
    const m = text.match(re);
    if (!m) continue;
    const term = (m[1] || '').trim();
    // 定义体只取到第一个分句边界/论证标记为止——否则**结论里的术语会被
    // 当成定义体的复述**（「安全就是不出事故，所以安全很重要」会假阳性：
    // 不出事故 压根没复述 安全，复述它的是结论）。
    let body = text.slice(m.index + m[0].length);
    const cut = body.search(isZh
      ? /[，,。；;、！!？?]|所以|因此|因而|故而|于是|从而/
      : /[,.;:!?]|\b(?:therefore|thus|hence|consequently|so)\b/i);
    if (cut >= 0) body = body.slice(0, cut);
    const taut = isZh ? tautZh(term, body, R) : tautEn(term, body, R);
    if (!taut) continue;
    // 腿④：结论必须是对定义体的复述（含术语 + 与定义体有共享），挡住
    // 「定义Y，所以关于X的新断言」这类假阳性。
    const restate = isZh ? restateConcZh(term, body, conc, taut) : restateConcEn(term, body, conc, taut);
    if (restate) return { term, route: isZh ? 'def-zh' : 'def-en' };
  }
  return false;
}

/** R5b：结论前置复述框（CONN 切分 + REPEAT×FRAME） */
function restateSo(text, isZh, R) {
  const CONN = isZh ? (R.CONN_ZH || CONN_ZH) : (R.CONN_EN || CONN_EN);
  let idx = -1;
  for (const re of CONN) {
    const m = text.match(re);
    if (m && (idx < 0 || m.index < idx)) idx = m.index;
  }
  if (idx < 1) return false;
  const left = text.slice(0, idx).trim();
  const right = text.slice(idx).replace(isZh ? /^(?:所以|因此|因而|故而)/ : /^(?:\b(?:therefore|thus|hence)\b|,\s*so\s+)/i, '').trim().replace(/[。，,．.！!？?；;]+$/, '');
  if (left.length < 3 || right.length < 3) return false;
  if (isZh) {
    for (const rep of commonZhNgrams(left, right)) {
      if (zhDefinitionalFrame(right, rep)) return { rep, route: 'so-zh' };
      // [r735] f9 纯系词应用框：「主语(+副词)+是+谓词」且谓词含重复词
      const cm = right.match(R.ZH_COPULAR || ZH_COPULAR);
      if (cm && cm[1].includes(rep)) return { rep, route: 'so-zh-copular' };
    }
    return false;
  }
  const lw = enWords(left);
  const rw = enWords(right);
  // [r735] e10 纯系词应用框（先于 pair 路由）：「(主语)+is/are (+of)+谓词」
  // 且谓词含左腿实词。右句谓词组**不经过 enWords 停词过滤**——just/safe
  // 这类谓词核心词恰在 EN_STOP 里，过滤后无 pair 可配、整族恒死。
  // 窗宽 6 词覆盖 "we have had no accidents and are safe" 形。
  const em = right.match(R.EN_COPULAR || EN_COPULAR);
  if (em) {
    const predWords = em[1].toLowerCase().match(/[a-z]{3,}/g) || [];
    for (const a of lw) {
      for (const w of predWords) {
        if (enMatch(a, w)) return { rep: a + '~' + w, route: 'so-en-copular' };
      }
    }
  }
  for (const a of lw) {
    for (const b of rw) {
      if (!enMatch(a, b)) continue;
      if (enDefinitionalFrame(right, a)) return { rep: a + '~' + b, route: 'so-en' };
    }
  }
  return false;
}

/** R6：诉诸定义裁决框（三腿共现：规定性定义 × 论证化使用 × 案件裁决） */
function definistVerdict(text, isZh, R) {
  const USE = isZh ? (R.USE_ZH || USE_ZH) : (R.USE_EN || USE_EN);
  // 腿②：论证化使用标记的位置即结论起点
  let uIdx = -1;
  for (const re of USE) {
    const m = text.match(re);
    if (m && (uIdx < 0 || m.index < uIdx)) uIdx = m.index;
  }
  if (uIdx < 0) return false;
  const conc = text.slice(uIdx).replace(isZh
    ? /^(?:所以|因此|因而|故而|于是|从而)/
    : /^(?:\b(?:therefore|thus|hence|consequently)\b|so\b)/i, '');
  // 腿③：结论必须是案件裁决断语（定义被套到个案上）
  const VERDICT = isZh ? (R.VERDICT_ZH || VERDICT_ZH) : (R.VERDICT_EN || VERDICT_EN);
  if (!VERDICT.test(conc)) return false;
  // 腿①：规定性定义框必须出现在论证标记之前（定义先行、裁决在后）
  const FRAME = isZh ? (R.DEF_STIP_ZH || DEF_STIP_ZH) : (R.DEF_STIP_EN || DEF_STIP_EN);
  const fm = text.slice(0, uIdx).match(FRAME);
  if (!fm) return false;
  const term = (fm[1] || fm[2] || '').trim();
  if (!term) return false;
  return { term, route: isZh ? 'definist-zh' : 'definist-en' };
}

/** 数组版 anyHit（正则列表任一命中） */
function anyHitArr(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCircularReasoning(text, inject) {
  // [稳定性审计 2026-11-09] 非字符串入口守卫：直接调用传 object 会让 text.match 崩溃。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const EVIDENCE_EXEMPT_ = R.EVIDENCE_EXEMPT || EVIDENCE_EXEMPT;
  const REPORTING_EXEMPT_ = R.REPORTING_EXEMPT || REPORTING_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const NUMERIC_ = R.NUMERIC || NUMERIC;

  // 评析这套话术本身 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 数字/百分比在场：量化陈述自带外部锚点
  if (NUMERIC_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 依据在场：有实验/验证/文献的陈述是引用不是循环
  if (EVIDENCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 引述动词在场：转述他人观点是新信息来源
  if (REPORTING_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text) : checkEn(text);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `循环论证×同词共现×定义式复述(${r.route}:${r.rep})`
        : `circular reasoning×repeated term×definitional restatement(${r.route}:${r.rep})`,
    };
  }
  // [r735] 新族路由 R5：同义反复论证（定义循环 R5a + 结论前置复述 R5b）。
  // DEF_HEDGE 先行：定义被显式标为多家存疑时不判。
  if (!(R.DEF_HEDGE_ZH || DEF_HEDGE_ZH).test(text) && !(R.DEF_HEDGE_EN || DEF_HEDGE_EN).test(text)) {
    const d5 = defCircular(text, isZh, R);
    if (d5) {
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: isZh
          ? `循环论证×同义反复定义当论证前提(${d5.route}:${d5.term})`
          : `circular reasoning×tautological definition as premise(${d5.route}:${d5.term})`,
      };
    }
    const s5 = restateSo(text, isZh, R);
    if (s5) {
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: isZh
          ? `循环论证×结论前置同义复述(${s5.route}:${s5.rep})`
          : `circular reasoning×conclusion-first restatement(${s5.route}:${s5.rep})`,
      };
    }
    // [r401] 新族路由 R6：诉诸定义裁决（规定性定义立规 × 案件裁决应用）。
    // 与 R5a 的分界：定义体不复述术语（不是同义反复），结论也不是复述
    // 定义体，而是拿定义当尺子给个案下裁决。
    const d6 = definistVerdict(text, isZh, R);
    if (d6) {
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: isZh
          ? `循环论证×诉诸定义裁决(${d6.route}:${d6.term})`
          : `circular reasoning×definist verdict(${d6.route}:${d6.term})`,
      };
    }
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkCircularReasoning,
  __internals: () => ({
    FUNCTION_NGRAM, EVIDENCE_EXEMPT, REPORTING_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN, NUMERIC,
    DEFINITIONAL_MARKERS, RESTART_TAIL, commonZhNgrams, zhDefinitionalFrame, checkZh, checkEn,
    enStem, enWords, enMatch, enDefinitionalFrame,
    // [r735] 同义反复论证族（R5a 定义循环 + R5b 结论前置复述）
    DEF_FRAME_ZH, DEF_FRAME_EN, USE_ZH, USE_EN, CONN_ZH, CONN_EN,
    TAUT_SYN_ZH, TAUT_SYN_EN, ANTONYM_ZH, DEF_HEDGE_ZH, DEF_HEDGE_EN, ZH_COPULAR, EN_COPULAR,
    tautZh, tautEn, defCircular, restateSo, restateConcZh, restateConcEn,
    // [r401] 诉诸定义裁决族（R6 规定性定义 × 论证化使用 × 案件裁决）
    DEF_STIP_ZH, DEF_STIP_EN, VERDICT_ZH, VERDICT_EN, definistVerdict,
  }),
};
