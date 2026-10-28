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
const META_EXEMPT_ZH = /(?:循环论证|同义反复|丐词魔术|begging\s*the\s*question|circular\s+reasoning|tautolog)(?:是|属于|是一种|正是|称为|叫做|指|举例|例如|比如|案例|教学|分析|识别|检测)/;
const META_EXEMPT_EN = /\b(?:circular\s+reasoning|begging\s+the\s+question|tautology)\s+(?:is|are|refers\s+to|means|describes)\b/i;

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

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCircularReasoning(text, inject) {
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
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkCircularReasoning,
  __internals: () => ({
    FUNCTION_NGRAM, EVIDENCE_EXEMPT, REPORTING_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN, NUMERIC,
    DEFINITIONAL_MARKERS, RESTART_TAIL, commonZhNgrams, zhDefinitionalFrame, checkZh, checkEn,
    enStem, enWords, enMatch, enDefinitionalFrame,
  }),
};
