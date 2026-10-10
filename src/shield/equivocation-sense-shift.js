/**
 * src/shield/equivocation-sense-shift.js
 *
 * [r645] equivocation_sense_shift — 「一词多义被用于跨义位推理」检测器
 * 心虫第 67 判别维度。
 *
 * 论文来源（2026-10-10 升级轮调研）：
 *   arXiv 2606.31039《Truth or Sophistry? LoFa: A Benchmark for LLM
 *   Robustness Against Logical Fallacies》。实测 10 类谬误的 LFR@k：
 *     · LLM 对「Distraction/Distortion」类谬误最脆弱
 *     · Equivocation（一词多义/义位偷换）LFR@3 仅 29.4%，全部谬误中最低
 *     · 模型能「识别」谬误结构，却在被动说服场景下被击穿
 *   佐证：Beyond Logical Forms (ArgMining 2026) 实测 Equivocation
 *   在所有模型上「entirely undetected」。
 *
 * 心虫侧缺口（scripts/round-645-probe.js 实测，真实 gate.checkOutput）：
 *   攻击 10 条 → 8 条 pass（80% 漏判）；良性 12 条 → 0 误伤。
 *   既有 ambiguity_fallacy 只认元话语（"the word has multiple
 *   meanings"），即「谈论词义本身」；本维度判**推理结构**——同一个
 *   多义词在前提与结论中取不同义位却得出结论。两者互补。
 *
 * 判定结构（三段共现，缺一不可）：
 *   ① 多义词出现 ≥2 次（英文允许复数/所有格变形）
 *   ② 两次出现的邻近上下文分别命中两个**不相交语义域**的标记词
 *   ③ 前提与结论之间有推理连接词
 *
 * 保守边界（明确不收，防误伤）：
 *   · 该词只出现一次 → 无从谈义位切换
 *   · 两次落在同一语义域 → 正常重复
 *   · 元话语/语言讨论语境 → 由 ambiguity_fallacy 负责
 *   · 只有语义域标记、没有推理连接 → 并列事实，不是谬误论证
 */

'use strict';

// ─── 多义词表：词 → [语义域A标记, 语义域B标记] ─────────────────────────
// 入选判据：① 语义域区分度高 ② 有真实攻击样本验证漏判 ③ 使用频率足够
// 标记词判据：**语义域的强指示词**，不要求逐字出现在攻击样本里，
// 而是「该词出现时最可能的伴随词」。用动词/名词/领域词，不用虚词。
const POLYSEMY_TABLE = {
  // ── 中文 ──
  '平等': [
    ['法律', '权利', '人格', '尊严', '机会', '公民', '公平', '对待', '男女', '种族', '选举', '判决', '条款'],
    ['数量', '数值', '数学', '份额', '一样多', '平均分', '对半', '盐和糖', '分配', '分成', '重量', '长度', '面积', '比分'],
  ],
  '精神': [
    ['意志', '面貌', '心理', '士气', '振作', '奉献', '团队', '面貌', '饱满', '风险', '精神文明'],
    ['大脑', '神经', '意识', '脑部', '扫描', '物质', '哲学', '唯物主义', '产物', '细胞'],
  ],
  '意思': [
    ['含义', '意义', '理解', '指的是', '意思是', '表达', '传达'],
    ['心意', '礼数', '表示', '给点', '一下', '送礼', '红包', '客气', '意思意思'],
  ],
  '银行': [
    ['金融', '贷款', '存款', '账户', '信贷', '利息', '办理', '工作', '业务'],
    ['河', '岸', '水', '泥', '堤', '钓鱼'],
  ],
  '学校': [
    ['教育', '学生', '上课', '老师', '入学', '班级'],
    ['鱼', '群', '游', '鲨', '海豚'],
  ],
  '光线': [
    ['亮', '照', '灯', '明', '暗', '阳光'],
    ['重', '轻', '质量', '重量'],
  ],
  // ── 英文 ──
  'light': [
    ['bright', 'brightness', 'color', 'lamp', 'sun', 'dark', 'shine', 'beam', 'dim', 'room'],
    ['weight', 'heavy', 'feather', 'weigh', 'kg', 'pounds', 'grams', 'lift'],
  ],
  'bank': [
    ['financial', 'money', 'loan', 'account', 'deposit', 'interest', 'credit', 'institution'],
    ['river', 'mud', 'water', 'stream', 'fishing', 'shore'],
  ],
  'school': [
    ['education', 'student', 'learn', 'teach', 'classroom', 'pupil', 'study'],
    ['fish', 'shark', 'swim', 'dolphin', 'whale'],
  ],
  'staff': [
    ['employee', 'worker', 'team', 'office', 'hire', 'colleague', 'company', 'staff', 'management'],
    ['stick', 'walking', 'shepherd', 'wooden', 'rod', 'cane'],
  ],
  'fine': [
    ['penalty', 'ticket', 'parking', 'violation', 'charge', 'pay', 'fee', 'ticket', 'summons'],
    ['good', 'excellent', 'quality', 'nice', 'great', 'okay', 'acceptable', 'satisfactory'],
  ],
  'equal': [
    ['rights', 'law', 'people', 'citizens', 'dignity', 'justice', 'treatment', 'society'],
    ['number', 'numbers', 'math', 'equation', 'value', 'values', 'sum', 'algebra'],
  ],
  'right': [
    ['entitle', 'entitled', 'legal', 'freedom', 'claim', 'deserve', 'constitutional'],
    ['correct', 'correctly', 'direction', 'opposite', 'left', 'answer', 'choice'],
  ],
  'match': [
    ['game', 'competition', 'sport', 'tournament', 'score', 'win', 'play'],
    ['fire', 'burn', 'ignite', 'flame', 'combustion', 'strike'],
  ],
  'current': [
    ['electric', 'electrical', 'wire', 'circuit', 'voltage', 'power', 'ampere'],
    ['present', 'now', 'today', 'flow', 'trend', 'situation'],
  ],
};

// 推理连接词：前提 → 结论
const INFERENCE_ZH = [
  /(?:所以|因此|因而|故而|从而|可见|这就说明|那么由此)/,
  /(?:既然|如果)[^。；\n]{0,24}(?:那么|就|则)/,
];
const INFERENCE_EN = [
  /\b(?:therefore|thus|hence|so|consequently|which means|it follows)\b/i,
  /\b(?:since|if)\b[^.]{0,40}\b(?:then|so)\b/i,
];

// 元话语：在谈论词义本身（由 ambiguity_fallacy 负责，本维度豁免）
const METALINGUISTIC = [
  /一词多义|多义词|歧义|这个词有|这个字有|不同含义|两种意思|几种意思|字面意思/,
  /\b(?:has|have)\s+(?:multiple|several|two|different)\s+meanings?\b/i,
  /\b(?:word|term)\s+(?:is|means)\s+(?:ambiguous|polysemous)\b/i,
  /\bpolysemy\b|\bpolysemous\b/i,
];

// 语义域匹配窗口：多义词出现位置前后 N 个字符
const WINDOW = 90;

// 英文后缀：复数/所有格/动词变形，用于词边界守卫放行
const EN_SUFFIX_RE = /^(?:s|es|'s|s')?$/i;

function detect(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, findings: [], confidence: 0, topSeverity: 0, count: 0 };
  }

  // 元话语语境 → 整个豁免（那是语言讨论，不是谬误论证）
  for (const re of METALINGUISTIC) {
    if (re.test(text)) return _clean();
  }

  // 必须有推理连接（没有就不是论证，只是并列陈述）
  const hasInference =
    INFERENCE_ZH.some(r => r.test(text)) || INFERENCE_EN.some(r => r.test(text));
  if (!hasInference) return _clean();

  const findings = [];

  for (const word of Object.keys(POLYSEMY_TABLE)) {
    const [domainA, domainB] = POLYSEMY_TABLE[word];

    const positions = _findAll(text, word);
    if (positions.length < 2) continue;

    // 对每次出现，判定它落在哪个语义域（取首次命中的域）
    let hitA = false;
    let hitB = false;
    let evidenceA = null;
    let evidenceB = null;

    for (const pos of positions) {
      const ctx = text.slice(Math.max(0, pos - WINDOW), pos + WINDOW).toLowerCase();
      let inA = false;
      let inB = false;
      for (const marker of domainA) {
        if (ctx.includes(marker.toLowerCase())) { inA = true; break; }
      }
      for (const marker of domainB) {
        if (ctx.includes(marker.toLowerCase())) { inB = true; break; }
      }
      if (inA && !hitA) {
        hitA = true;
        evidenceA = text.slice(Math.max(0, pos - 14), pos + word.length + 14).trim();
      }
      if (inB && !hitB) {
        hitB = true;
        evidenceB = text.slice(Math.max(0, pos - 14), pos + word.length + 14).trim();
      }
    }

    // 两个不相交语义域都被命中 → 义位切换
    if (hitA && hitB) {
      findings.push({
        dimension: 'equivocation_sense_shift',
        severity: 0.58,
        matched: word,
        detail: '多义词「' + word + '」在同一论证中被用于两个不同义位（出现 ' +
                positions.length + ' 次），构成 Equivocation 谬误',
        evidence: [
          evidenceA ? '义位一: ' + evidenceA.slice(0, 40) : null,
          evidenceB ? '义位二: ' + evidenceB.slice(0, 40) : null,
        ].filter(Boolean),
        pattern: 'equivocation:' + word,
      });
    }
  }

  if (findings.length === 0) return _clean();

  return {
    score: 0.58,
    findings,
    confidence: 0.8,
    topSeverity: 0.58,
    count: findings.length,
  };
}

/**
 * 找出多义词所有出现位置。
 * 英文：允许 s/es/'s 等后缀（banks、bank's），但拒绝 bankaccount 这种
 * 与其他字母直接相连的词（真·不同词）。
 */
function _findAll(text, word) {
  const out = [];
  const isEn = /^[a-z]+$/i.test(word);
  let idx = text.toLowerCase().indexOf(word.toLowerCase());
  while (idx !== -1) {
    if (isEn) {
      const afterRaw = text.slice(idx + word.length, idx + word.length + 4);
      const before = idx > 0 ? text[idx - 1] : '';
      const beforeIsLetter = /[a-z]/i.test(before);
      // 后缀必须正好是 s/es/'s/s' 且后面不能再跟字母
      const m = afterRaw.match(/^([a-z']{0,3})/i);
      const suffix = m ? m[1] : '';
      const rest = afterRaw.slice(suffix.length, suffix.length + 1);
      const restIsLetter = rest !== '' && /[a-z]/i.test(rest);
      const suffixOk = suffix === '' || (EN_SUFFIX_RE.test(suffix) && !restIsLetter);
      if (!beforeIsLetter && suffixOk) {
        out.push(idx);
      }
    } else {
      out.push(idx);
    }
    idx = text.toLowerCase().indexOf(word.toLowerCase(), idx + 1);
  }
  return out;
}

function _clean() {
  return { score: 0, findings: [], confidence: 0, topSeverity: 0, count: 0 };
}

module.exports = { detect, POLYSEMY_TABLE };
