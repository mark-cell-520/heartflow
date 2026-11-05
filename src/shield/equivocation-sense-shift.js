/**
 * src/shield/equivocation-sense-shift.js
 *
 * [r645] equivocation_sense_shift — 「一词多义被用于跨义位推理」检测器
 * 心虫第 67 判别维度。
 *
 * [r221 · agent-4 补强] POLYSEMY_TABLE 增补 4 个中英双语多义词家族：
 *   理论(science vs 猜测)、证明(数理推导 vs 经验表明)、模型(数理建模 vs
 *   榜样/样品)、显著(统计显著 vs 重要/巨大)。补强前零命中探针实测这四族
 *   10/10 攻击穿引擎（6 条 gate.action=pass 完全漏判）。此为「已有维度的
 *   全新措辞家族」（真升级类型②），模块已接线故立即激活，无需改 src/index.js。
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
  // ── [r221] agent-4 补强：科学推理/统计素养方向最高频的 Equivocation 四族 ──
  // 判据同既有条目：① 两义位语义域区分度高（域标记不相交）② 真实攻击样本
  // 验证此前漏判（coordination/agent4/probes/r221-zerohit-probe.js 实测 10/10
  // 穿引擎）③ 良性同义重复只命中单一域 → 不误伤。逻辑要求 hitA && hitB 共现，
  // 故纯单义文本天然放行。中英双语，VERIFY 级。
  '理论': [
    ['科学', '验证', '实验', '定律', '假说', '数据', '证据', '相对论', '进化论', '检验', '预测', '物理', '同行评审', '可证伪'],
    ['猜测', '猜想', '臆测', '推测', '没有依据', '未经证实', '纯属', '异想天开', '未必成立', '不一定对'],
  ],
  '证明': [
    ['数学', '定理', '引理', '逻辑', '推导', '公理', '形式化', '充要条件', '严谨'],
    ['表明', '说明', '显示', '足以', '实践', '事实胜于雄辩'],
  ],
  '模型': [
    ['数学', '建模', '拟合', '数据', '算法', '预测', '训练', '参数', '回归', '统计', '仿真'],
    ['榜样', '示范', '模范', '样品', '机型', '模特', '典范', '标杆', '效仿', '学习对象'],
  ],
  '显著': [
    ['统计', 'p值', 'p 值', '显著性', '检验', '样本', '置信', '差异', '方差', '卡方', 't检验'],
    ['重要', '重大', '巨大', '深远', '可观', '突破', '值得推广', '影响力'],
  ],
  'theory': [
    ['scientific', 'evidence', 'experiment', 'tested', 'verified', 'data', 'hypothesis', 'law', 'physics', 'biology', 'evolution', 'relativity', 'peer-reviewed', 'falsifiable'],
    ['guess', 'speculation', 'hunch', 'conjecture', 'mere', 'unproven', 'not necessarily', 'opinion', 'made up'],
  ],
  'prove': [
    ['mathematics', 'theorem', 'lemma', 'logic', 'derivation', 'axiom', 'formal', 'deduce'],
    ['demonstrate', 'guarantee', 'practice', 'effective', 'in practice'],
  ],
  'model': [
    ['mathematical', 'modeling', 'modelling', 'fitted', 'data', 'algorithm', 'predict', 'prediction', 'training', 'parameters', 'regression', 'statistical', 'simulation'],
    ['role', 'exemplar', 'prototype', 'sample', 'citizen', '榜样'],
  ],
  'significant': [
    ['statistical', 'statistically', 'p-value', 'significance', 'test', 'sample', 'confidence', 'difference', 'variance'],
    ['important', 'importance', 'major', 'huge', 'profound', 'breakthrough', 'worth'],
  ],
  // ── [r222] agent-4 补强：逻辑有效性 + 统计常态的 Equivocation 两族 ──
  // 判据同既有条目：① 两义位语义域区分度高且**良性写作中罕见共现**（压误伤）
  // ② 真实攻击样本验证此前漏判（coordination/agent4/probes/r222-zerohit-probe.js
  //    实测：有效-zh 两种变体/正常-zh/normal-en 改动前 gate.action=pass 完全漏判）
  // ③ 良性单一义位只命中单域 → 不误伤。
  // 关键压 FP 决策：域A 只用**严格逻辑/统计标记**（演绎/保真/形式逻辑/均值…），
  //   不收"论证/前提/结论/方案"等泛词——否则"有效的论证+有效的方案+因此"这类
  //   合法双义位共现会被误判。健全/sound 族因"逻辑健全+财务健全"合法共现而被弃。
  // 逻辑要求 hitA && hitB 跨出现位置合并，故纯单义文本天然放行。中英双语，VERIFY 级。
  '有效': [
    // 域A：逻辑有效性（保真/演绎严格标记）
    ['演绎', '归纳', '保真', '形式逻辑', '三段论', '必然为真', '逻辑有效', '有效推理'],
    // 域B：日常"有道理/站得住脚/有效果"
    ['说得过去', '说得通', '站得住脚', '有道理', '顾虑', '诉求', '反对意见', '投诉', '办法', '手段'],
  ],
  '正常': [
    // 域A：统计常态（接近均值/分布）
    ['统计', '均值', '分布', '标准差', '抽样', '基线', '平均', '正态', '样本'],
    // 域B：健康/发育/规范性判断
    ['健康', '身体', '发育', '生病', '就诊', '患病', '体征', '应当', '应该'],
  ],
  'valid': [
    ['deductive', 'inductive', 'truth-preserving', 'syllogism', 'logically valid', 'valid argument', 'logical form', 'necessarily true', 'valid inference'],
    ['objection', 'concern', 'complaint', 'criticism', 'point', 'grievance', 'defensible', 'makes sense', 'reasonable', 'legitimate', 'warranted'],
  ],
  'normal': [
    ['statistical', 'statistically', 'statistics', 'the mean', 'sample mean', 'on average', 'standard deviation', 'distribution', 'baseline', 'bell curve'],
    ['healthy', 'health', 'developed', 'illness', 'sick', 'doctor', 'symptom', 'should be', 'ought'],
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
