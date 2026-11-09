/**
 * src/affirming-disjunct.js
 * [r256] 第 231 判别维度 affirming_disjunct（或然析取肯定 / affirming a
 * disjunct：把日常相容析取错误地当成排他析取，用「一支为真」排除另一支）。
 *
 * 形态：给出析取「A或B」（日常语言里 A、B 常可同时成立），随后确认其中
 * 一支为真，据此断言另一支为假。该推理**仅在析取确为排他时有效**，而日常
 * 「或者 / or」几乎都是相容的——「他在北京或者上海工作」并不排斥他两地
 * 都有据点。
 *
 * 攻击形状（探针实测穿透率 6/8，见 /tmp/hf-scout/r256-family-probe.js）：
 *   · 他在北京或者上海工作，昨天有人在北京见到他，所以他不在上海。
 *   · 她不是去了图书馆就是去了实验室，同学说在图书馆看到她了，那她没去实验室。
 *   · 会议定在周一或者周二，秘书确认了周一，因此周二没有安排。
 *   · 报告是用 Python 或者 R 写的，作者承认用了 Python，可见 R 并没有被使用。
 *   · He works in Beijing or Shanghai; someone saw him in Beijing, so he is
 *     not in Shanghai.
 *   · The meeting is on Monday or Tuesday; the invite says Monday, so it is
 *     not on Tuesday.
 *
 * 与既有维度的射程边界（刻意错开，不抢占）：
 *   · false_dilemma（第65维）管**把多元局面压成两个选项**（排除第三选项/
 *     排除中间路线），本族的析取**已经摆在句子里**，攻击动作是「由一支为
 *     真排除另一支」，不要求存在被压掉的第三选项。
 *   · illicit_conversion（第167维）管**全称命题主谓对调**（所有A是B∴所有
 *     B是A），本族是**析取支的真值排除**，无全称量词、无主谓对调。
 *   · affirming_the_consequent（第155维）管**条件句反向**（若P则Q，Q∴P），
 *     本族无充分条件关系，是「或」关系。
 *   · fallacy_of_relevance（第230维）管**前提与结论主题域不相干**（零共享
 *     实词），本族两支与结论**共享析取支内容**，相关性成立、缺陷在真值
 *     推理形式。
 *   · whole_part_transfer（第170维）管**整体属性移到部分**，本族两支是
 *     并列析取而非整体-部分。
 *
 * 判据（四腿共现，缺一不判）：
 *   腿① DISJ 相容析取标记 —— 句子含「或者 / 或是 / 或 / 不是A就是B /
 *       or」，且能切出两个非空析取支。
 *   腿② EVIDENCE 支真证据段 —— 析取标记之后、推断词之前存在一段内容
 *       （「有人在北京见到他」「作者承认用了 Python」），确认其中一支。
 *   腿③ INFER 推断词 —— 证据段之后出现推断词（所以/因此/因而/可见/那/
 *       therefore/thus/so）引导结论段。
 *   腿④ EXCLUDE 支假排除 —— 结论段中某一支 X 被**否定**（X 与否定词在
 *       ±12 字窗口内共现），且 X 在证据段中**未被否定**（否则是有效的
 *       析取三段论 ¬X∴Y，不判），另一支 Y 在结论段中缺席或被肯定。
 *   → verify 级：须补明该析取是排他还是相容；相容时一支为真推不出另一支为假。
 *
 * 关键鉴别（r256 核心设计）：**否定式排除才是谬误，否定式肯定是有效推理**。
 * 「有人说不在北京，所以他在上海」是有效的析取三段论（¬A∴B）；「有人在
 * 北京见到他，所以他不在上海」才是或然析取肯定（A∴¬B）。两者差别在**证据
 * 段有没有先否定掉该支**——故腿④要求「X 在证据段中未被否定」。
 *
 * 为什么取 VERIFY 级：**排他析取下该推理完全有效**（「开关是开或者关，
 * 它是开的，所以它不是关的」），日常语言里也有大量真排他的析取（制度性
 * 二元、物理状态二元）。verify 的含义是「该排除结论依赖一个未言明的排他性
 * 前提，需先确认析取类型」。与 r206-r255 同口径只登记 VERIFY。
 *
 * 明确不判的（豁免——全部可被负例注入置空，见
 * test/round-256-affirming-disjunct.js）：
 *   · EXCLUSIVE_FORM 显式排他形式：要么…要么 / either…or / 二者择一 /
 *     二选一 / 只能选 / 取其一 / 互斥 / mutually exclusive / XOR ——
 *     说话人已宣告排他，此时排除推理有效。
 *   · EXHAUSTIVE_PAIRS 穷尽二元对：开-关/真-假/是-否/正-反/赞成-反对/
 *     及格-不及格/亮-灭/0-1/on-off/true-false/yes-no/pass-fail/买入-卖出/
 *     支持-反对/同意-拒绝/通过-驳回/上涨-下跌/启用-停用/在线-离线……
 *     物理或制度上的真二元，两支互斥且穷尽。另含**否定孪生规则**：一支
 *     为「不/没/非 + 另一支」时（不通+过 / 不及格+及格）同样构成穷尽二元。
 *   · META_CONCEPT 谬误概念转述与教学（析取谬误/选言推理/or fallacy）。
 *   · TEACH 教学语境（课堂/教材/例题/课件）。
 *   · HEDGE 对冲结论（可能/也许/大概/perhaps/probably）。
 *   · QUESTION 疑问句（两支并存无排除断言）。
 */
'use strict';

// ─── 腿①：相容析取标记（显式排他标记走 EXCLUSIVE_FORM 豁免）──────────
// 中文：或者/或是/或。「要么…要么」是显式排他，不在此列。
const DISJ_ZH = [
  /或者/, /或是/, /或(?!者)/,
];

// 英文：or。either…or 是显式排他，走 EXCLUSIVE_FORM 豁免。
const DISJ_EN = [
  /\bor\b/i,
];

// ─── 腿③：推断词（析取证据段之后连接结论的标记）──────────────────────
const INFER_ZH = [
  /所以/, /因此/, /因而/, /故而/, /可见/, /可知/, /这说明/, /这表明/,
  /这证明/, /意味着/, /足以证明/, /足以说明/, /由此/, /那么/, /[，。；]那/,
];
const INFER_EN = [
  /\btherefore\b/i, /\bthus\b/i, /\bhence\b/i, /\bconsequently\b/i,
  /\baccordingly\b/i, /,\s*so\s+/i, /\bwhich\s+means\b/i,
  /\bthis\s+(?:proves?|shows?|means?)\b/i, /\bas\s+a\s+result\b/i,
];

// ─── 腿④：否定排除词 ────────────────────────────────────────────
const NEG_ZH = [
  /不/, /没/, /未/, /非/, /无/, /别/, /莫/, /勿/,
  /排除了?/, /排除在/, /不可能/, /并不会/, /并没有/,
];
const NEG_EN = [
  /\bnot\b/i, /\bno\b/i, /\bnever\b/i, /\bisn'?t\b/i, /\baren'?t\b/i,
  /\bwasn'?t\b/i, /\bweren'?t\b/i, /\bdoesn'?t\b/i, /\bdidn'?t\b/i,
  /\bcannot\b/i, /\bcan'?t\b/i, /\bruled\s+out\b/i, /\beliminated\b/i,
  /\bexcluded\b/i, /\bimpossible\b/i,
];

// ─── 豁免：显式排他形式（说话人已宣告排他，排除推理有效）──────────
const EXCLUSIVE_FORM = [
  /要么[^，。；]{0,20}要么/, /二者择一/, /二选一/, /二者只能选/,
  /只能选/, /取其一/, /择一/, /互斥/, /互相排斥/,
  /mutually\s+exclusive/i, /\beither\b[^.!?]{0,40}\bor\b/i,
  /exclusive\s+or/i, /\bXOR\b/,
];

// ─── 豁免：穷尽二元对（物理/制度真二元）────────────────────────
const EXHAUSTIVE_PAIRS = [
  ['开', '关'], ['真', '假'], ['是', '否'], ['正', '反'], ['男', '女'],
  ['昼', '夜'], ['黑', '白'], ['有', '无'], ['成功', '失败'], ['及格', '不及格'],
  ['启用', '停用'], ['开机', '关机'], ['在线', '离线'], ['上行', '下行'],
  ['上涨', '下跌'], ['涨', '跌'], ['买入', '卖出'], ['买', '卖'],
  ['支持', '反对'], ['赞成', '反对'], ['同意', '拒绝'], ['接受', '拒绝'],
  ['通过', '驳回'], ['亮', '灭'], ['真迹', '赝品'], ['成功', '不成功'],
  ['on', 'off'], ['true', 'false'], ['yes', 'no'], ['0', '1'],
  ['pass', 'fail'], ['right', 'wrong'], ['left', 'right'], ['up', 'down'],
  ['buy', 'sell'], ['long', 'short'], ['open', 'closed'], ['in', 'out'],
  ['genuine', 'fake'], ['real', 'fake'], ['support', 'oppose'],
];

// ─── 豁免：谬误概念转述/教学/对冲/疑问 ─────────────────────────
const META_CONCEPT = [
  /析取/, /选言/, /排他/, /相容析取/, /析取谬误/, /选言推理/,
  /affirming\s+a\s+disjunct/i, /disjunctive\s+syllogism/i, /exclusive\s+or/i,
  /inclusive\s+or/i, /逻辑谬误/, /谬误/,
];
const TEACH = [
  /课堂/, /教材/, /例题/, /课件/, /老师/, /教学/, /课程/,
  /textbook/i, /lecture/i, /\bexam(?:ple)?\b/i,
];
const HEDGE = [
  /可能/, /也许/, /大概/, /或许/, /恐怕/, /说不定/,
  /perhaps/i, /\bprobably\b/i, /\bmaybe\b/i, /\bmight\b/i, /possibly/i,
];
const QUESTION = [
  /？/, /\?/, /吗[。！]?$/, /呢[。！]?$/,
];

// ─── 工具函数 ────────────────────────────────────────────────

function _MISS() { return { hit: false, score: 0, detail: '', count: 0 }; }

function _hasAny(res, text) { return res.some(re => re.test(text)); }

function _hasNeg(text, lang) {
  return lang === 'zh' ? _hasAny(NEG_ZH, text) : _hasAny(NEG_EN, text);
}

function _splitByInfer(text, lang) {
  const INFER = lang === 'zh' ? INFER_ZH : INFER_EN;
  let best = -1, bestLen = 0;
  for (const re of INFER) {
    const m = text.match(re);
    if (m && m.index > 0) {
      if (best === -1 || m.index < best) { best = m.index; bestLen = m[0].length; }
    }
  }
  if (best <= 0) return null;
  return { pre: text.slice(0, best), post: text.slice(best + bestLen), idx: best };
}

// ── 析取支核心词抽取（支必须紧贴析取标记，不横跨子句）──────────────
// r256 首版 bug：右支允许横跨后续子句，「他在北京或者上海工作，昨天有人在
// 北京见到他」的右支被取成整段 → 与结论段「他不在上海」对不上，整族 0/8
// 命中。修正：以析取标记为锚，左支向左取最后一个实词 run、右支向右取第一
// 个实词 run，各截断到 2 字/1 词。
const ZH_WIN = 10;  // 中文支最大窗口（字）
const EN_WIN = 48;  // 英文支最大窗口（字符）

const ZH_LEAD_STRIP = /^(他|她|它|你|您|我|我们|你们|他们|她们|这|那|其|该|此|在|去|到了?|前往|工作|生活|学习|出现|存在|发生|是|有|处于|用|以|被|把|让|使|从|向|对|跟|和|住|写|调|承|认)+/;
const EN_SKIP = new Set(['he','she','it','they','we','you','i','his','her','its','their','the','a','an','is','are','was','were','be','been','being','in','at','on','to','for','of','and','with','by','from','as','that','this','works','work','lives','live','went','goes','saw','seen','says','said','says','using','used','uses','shows','show','says']);

// 混合实词 run 序列：中文连续段与拉丁/数字词都算支候选
// r256 二版 bug：只取中文 run，「报告是用 Python 或者 R 写的」的右支
// 「R」被完全忽略 → 整句漏判。修正：中英数字混排时两侧都收。
function _zhRuns(s) {
  return (s.replace(/[^\u4e00-\u9fa5]+/g, '|').match(/[\u4e00-\u9fa5]+/g)) || [];
}
function _mixedRuns(s) {
  return (s.match(/[\u4e00-\u9fa5]{1,}|[A-Za-z][A-Za-z0-9_+#.-]*|\d+/g)) || [];
}
// 英文实词序列（跳过功能词）
function _enWords(s) {
  const raw = s.match(/[A-Za-z][A-Za-z0-9_+#.-]*/g) || [];
  return raw.filter(w => !EN_SKIP.has(w.toLowerCase()));
}

// 左支：窗口内最后一个中文 run 的末 2 字 / 最后一个英文实词
function _branchLeft(win) {
  const runs = _mixedRuns(win);
  if (runs.length) {
    const last = runs[runs.length - 1];
    if (/[\u4e00-\u9fa5]/.test(last)) return { text: last.slice(-2), full: last };
    return { text: last.toLowerCase(), full: last };
  }
  return null;
}

// 右支：窗口内第一个中文 run 的首 2 字 / 第一个拉丁实词
// r256 四版 bug：英文右支常先撞上「module A or module B」的 module 等
// 框架名词，取不到真正的支词 B。修正：右支在英文侧跳过框架名词。
// r256 五版 bug：「只有 0 或 1 两种取值」右支先撞上中文 run「两种」，
// 取不到紧贴标记的数字 1 → 穷尽二元豁免失效。修正：右支取**紧贴标记
// 的非中文 token**（数字/拉丁）优先，其次中文 run 首 2 字。
const EN_FRAME = new Set(['module','modules','class','classes','function','functions','branch','branches','server','servers','node','nodes','team','teams','report','reports','file','files','option','options','choice','choices','way','ways','case','cases','scenario','scenarios','reason','reasons','cause','causes','part','parts','side','sides','level','levels','type','types','kind','kinds','area','areas','field','fields','place','places','city','cities','country','countries','office','offices','room','rooms']);
function _branchRight(win) {
  // 优先级1：紧贴标记的数字/拉丁实词（跳过框架名词）
  const toks = (win.match(/[A-Za-z][A-Za-z0-9_+#.-]*|\d+/g)) || [];
  for (const t of toks) {
    const tl = t.toLowerCase();
    if (EN_SKIP.has(tl) || EN_FRAME.has(tl)) continue;
    return { text: tl, full: t };
  }
  // 优先级2：中文 run 首 2 字
  const runs = _mixedRuns(win);
  for (const r of runs) {
    if (/[\u4e00-\u9fa5]/.test(r)) return { text: r.slice(0, 2), full: r };
  }
  return null;
}

// 穷尽二元对判定（子串包含即可，容忍支词被截断）
function _isExhaustivePair(a, b) {
  const la = String(a).toLowerCase(), lb = String(b).toLowerCase();
  // 否定孪生：一支 = 否定词 + 另一支（不通↔过、不及格↔及格）
  for (const pre of ['不', '没', '非', '未']) {
    if (la.startsWith(pre) && lb === la.slice(pre.length)) return true;
    if (lb.startsWith(pre) && la === lb.slice(pre.length)) return true;
  }
  for (const [x, y] of EXHAUSTIVE_PAIRS) {
    const lx = x.toLowerCase(), ly = y.toLowerCase();
    if ((la.includes(lx) && lb.includes(ly)) || (la.includes(ly) && lb.includes(lx))) return true;
  }
  return false;
}

// 支在文本中的真值状态（宽松子串 + ±12 字否定窗口）
// r256 三版 bug：支取 2 字截断（如「了图书馆」）时，结论段里常只出现
// 「实验室」→ 子串匹配失败，整族漏判。修正：匹配策略降级为「支的任一
// 2 字滑窗在文本中出现」，并要求**至少连续 2 字命中**（单字命中易误伤）。
function _branchState(branch, text, lang) {
  const b = String(branch).toLowerCase();
  const p = text.toLowerCase();
  if (!b) return { present: false };
  const norm = lang === 'en'
    ? s => s.toLowerCase()
    : s => s.toLowerCase();
  // 生成支的匹配单元：中文按 2 字滑窗，英文按整词
  let units = [];
  if (/[\u4e00-\u9fa5]/.test(b)) {
    for (let i = 0; i + 2 <= b.length; i++) units.push(b.slice(i, i + 2));
  } else {
    units.push(b);
  }
  let present = false, negated = false;
  for (const u of units) {
    if (lang === 'en') {
      const re = new RegExp('\\b' + u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
      let m;
      while ((m = re.exec(p)) !== null) {
        present = true;
        const wStart = Math.max(0, m.index - 12);
        const wEnd = Math.min(p.length, m.index + u.length + 12);
        if (_hasNeg(p.slice(wStart, wEnd), lang)) negated = true;
      }
    } else {
      let idx = p.indexOf(u);
      while (idx !== -1) {
        present = true;
        const wStart = Math.max(0, idx - 12);
        const wEnd = Math.min(p.length, idx + u.length + 12);
        if (_hasNeg(p.slice(wStart, wEnd), lang)) negated = true;
        idx = p.indexOf(u, idx + 1);
      }
    }
  }
  return { present, negated };
}

/**
 * 主判别函数。
 * @param {string} text 已归一化文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAffirmingDisjunct(text) {
  if (typeof text !== 'string' || text.length < 6) return _MISS();

  // ── 豁免：谬误概念转述/教学/对冲/疑问/显式排他 ──
  for (const re of META_CONCEPT) if (re.test(text)) return _MISS();
  for (const re of TEACH) if (re.test(text)) return _MISS();
  for (const re of HEDGE) if (re.test(text)) return _MISS();
  for (const re of QUESTION) if (re.test(text)) return _MISS();
  for (const re of EXCLUSIVE_FORM) if (re.test(text)) return _MISS();

  // 语言分支（r256 六版 bug：按字符数比较会把「源码托管在 GitHub 或者
  // GitLab…」判成 en（拉丁字母 24 > 汉字 23），随后英文 \bor\b 匹配不到
  // 中文句 → br=null → 整句漏判）。修正：以**析取标记的语言**为准——先
  // 探测中文析取标记（或者/或是/或/不是A就是B），命中即走中文分支。
  const zhHits = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const enHits = (text.match(/[A-Za-z]/g) || []).length;
  const hasZhDisj = /或者|或是|或(?!者)|不是[^，。；]{1,10}就是|非[^，。；]{1,10}即/.test(text);
  const hasEnDisj = /\bor\b/i.test(text);
  const lang = hasZhDisj ? 'zh' : (hasEnDisj ? 'en' : (zhHits >= enHits ? 'zh' : 'en'));

  // 腿③：证据段之后须有推断词连接结论
  const sp = _splitByInfer(text, lang);
  if (!sp) return _MISS();

  // 腿①②：在证据段（pre）切出两个析取支 + 定位析取标记
  let br = null;
  if (lang === 'zh') {
    // 句式A：不是A就是B / 非A即B（标记横跨两支，支取去前缀全串）
    const corr = sp.pre.match(/(不是|非)([^，。；]{1,10})(就是|即)([^，。；]{1,10})/);
    if (corr) {
      const aRaw = corr[2].replace(ZH_LEAD_STRIP, '');
      const bRaw = corr[4].replace(ZH_LEAD_STRIP, '');
      if (aRaw && bRaw) br = { a: aRaw.slice(0, 6), b: bRaw.slice(0, 6), marker: corr[0], mIdx: corr.index };
    }
    // 句式B：A或者B / A或B（标记居中，支取 2 字截断）
    if (!br) {
      for (const re of DISJ_ZH) {
        const m = sp.pre.match(re);
        if (!m || m.index === undefined) continue;
        const leftWin = sp.pre.slice(Math.max(0, m.index - ZH_WIN), m.index);
        const rightWin = sp.pre.slice(m.index + m[0].length, m.index + m[0].length + ZH_WIN);
        const L = _branchLeft(leftWin);
        const R = _branchRight(rightWin);
        if (L && R) br = { a: L.text, b: R.text, marker: m[0], mIdx: m.index };
        break;
      }
    }
  } else {
    for (const re of DISJ_EN) {
      const m = sp.pre.match(re);
      if (!m || m.index === undefined) continue;
      const leftWin = sp.pre.slice(Math.max(0, m.index - EN_WIN), m.index);
      const rightWin = sp.pre.slice(m.index + m[0].length, m.index + m[0].length + EN_WIN);
      const L = _branchLeft(leftWin);
      const R = _branchRight(rightWin);
      if (L && R) br = { a: L.text, b: R.text, marker: m[0], mIdx: m.index };
      break;
    }
  }
  if (!br) return _MISS();

  // 豁免：穷尽二元对
  if (_isExhaustivePair(br.a, br.b)) return _MISS();

  // 腿②：证据段（析取标记之后到推断词之前）须有实质内容
  // 「不是A就是B」句式：标记横跨两支，证据段在**右支结束之后**起算，
  // 否则 corr 的 end 正好落在右支末尾 → ev 恒空，整句被腿②误杀。
  let evStart = br.mIdx + br.marker.length;
  if (br.marker.includes('就是') || br.marker.includes('即')) {
    // 右支 b 文本结束位置
    const bPos = sp.pre.indexOf(br.b, br.mIdx);
    if (bPos >= 0) evStart = bPos + br.b.length;
  }
  const ev = sp.pre.slice(evStart);
  if (ev.replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, '').length < 4) return _MISS();

  // 腿④：结论段中一支被否定，且该支在证据段中未被否定
  const stA = _branchState(br.a, sp.post, lang);
  const stB = _branchState(br.b, sp.post, lang);
  const evA = _branchState(br.a, ev, lang);
  const evB = _branchState(br.b, ev, lang);

  let excl = null, aff = null;
  if (stA.negated && !evA.negated) { excl = br.a; aff = br.b; }
  else if (stB.negated && !evB.negated) { excl = br.b; aff = br.a; }
  else return _MISS();

  // 另一支在结论段中须缺席或被肯定（未被否定）
  const otherSt = excl === br.a ? stB : stA;
  if (otherSt.negated) return _MISS();

  return _HIT(br.a, br.b, aff, excl, br.marker, lang);
}

function _HIT(bA, bB, aff, excl, marker, lang) {
  const score = 70;
  return {
    hit: true,
    score,
    detail: `或然析取肯定(${lang}: 析取「${bA}」|「${bB}」标记「${marker}」→ 以「${aff}」为真排除「${excl}」，排他性未言明)`,
    count: 1,
  };
}

module.exports = { checkAffirmingDisjunct };
