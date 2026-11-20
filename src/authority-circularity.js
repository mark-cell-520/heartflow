/**
 * src/authority-circularity.js — 「权威互引洗白」检测器（r433 新维度）
 *
 * [r433 立项] 缺口实证：scripts/round-433/probe-r433.js 在当前引擎
 * （v6.8.213，274 维）上实测 15 条攻击样本穿透 12/15（gate 非 pass
 * 仅 3/15），良性 8 条误伤 2/8 且两条均系 completion_evidence /
 * claimed_verification_without_trail 的合法命中、与本族无关。
 * Phase 1.5 同律复核：12 条穿透样本逐条跑 discriminate()，实测
 * 全维度零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：权威互引洗白（authority circularity / citation-cartel
 * reasoning / incestuous amplification）——**链条上没有任何一处
 * 原始证据，"证据"全部是另一个权威**：A 权威认可 B 的研究，B
 * 的研究引用了 C 权威的工作，C 的实验室又资助了这项研究……
 * 每一环单独看都是"有权威背书"，合起来是一个闭环：可信性
 * 在权威之间循环传递，唯独不经过证据。
 *
 *   诺贝尔奖得主认可这位学者的研究，而该研究引用了另一位诺奖
 *   得主的工作。（谱系互引：背书者与被背书的引用对象同属一个
 *   权威圈，没有任何原始数据）
 *   这项研究由该方法发明者的实验室完成同行评议，结论自然可靠。
 *   （同门互证：审稿人正是被审理论的提出者）
 *   福布斯杂志引用了一位亿万富翁的观点，而这位亿万富翁正是
 *   该理论的早期投资者。（利益闭环：引用者与被引用者利益绑定）
 *   该评级机构的评分方法由其被评级对象资助的团队设计。
 *   It was peer reviewed by the same lab that developed the method.
 *   The study was validated by researchers from the institution
 *   that funded it.
 *
 * 与既有维度的边界（r433 归因）：
 *   · appeal_to_authority 管**单一权威诉求**（"专家说所以对"），
 *     本族要件是**两个以上权威/机构**之间的互引或利益绑定，
 *     且互引的每一环都不出示原始证据；
 *   · circular_reasoning 管**同义复述**（"它对因为它对"），
 *     本族前后并不同义——"诺奖得主认可该研究"与"结论可靠"
 *     是两个不同的命题，中间的结构是**权威传递**而非同语
 *     反复；
 *   · credential_dismissal 管**否定对方权威**（"他那个学位
 *     不算数"），方向相反：本族是**用权威互引建立**可信性；
 *   · synthetic_social_proof 管**伪造社会证明**（编造用户
 *     评价/虚构销量），本族的权威都是真实存在的，问题在互引
 *     结构而非伪造；
 *   · conflict_of_interest 不设独立维度（利益声明本身是正当
 *     学术纪律），本族拦的是**把利益关联当可信性论据**的用法。
 *
 * 判据（三腿近距共现，缺一不判）：
 *   腿① BACKING 权威互引动作——认可/赞同/引用/师从/授业/师祖/
 *        弟子/门生/一脉/传承/发表在/同行评议/审稿/评审/资助/
 *        指定/背书/站台/引述/转引/推崇（中）；endorse/cite/
 *        reference/peer review/fund/validate/trained by/
 *        supervise/back/laud（英）；须与权威身份或机构词
 *        （诺奖得主/泰斗/创始人/学界/权威/实验室/课题组/机构/
 *        杂志/委员会/智库/Nobel/leading figure/founder/lab/
 *        journal/institute/committee）同现。
 *   腿② CLOSURE 闭环关联——同一/同门/同课题组/旗下/其/该机构
 *        内部/这一脉/师承/一脉相承/被评级对象/资助方/理事单位/
 *        利益相关/内部人/自己人/圈子（中）；same lab/same
 *        institution/same team/funded by/sponsored by/its own/
 *        internal/from the institution/in-house（英）。
 *   腿③ CREDIBILITY 可信性收束——不会错/错不了/可靠/靠得住/
 *        自然可靠/有分量/有说服力/令人信服/毋庸置疑/不容置疑/
 *        结论一致/结论自然/以此为准/背书有力（中）；sound/
 *        reliable/credible/trustworthy/authoritative/
 *        carry weight/conclusive/beyond doubt/consistent（英）。
 *
 * 为什么取 VERIFY 级：单句可能是正当的学术谱系陈述（"他师从
 * 诺贝尔奖得主，现独立领导一个实验室"是事实介绍）、规范的
 * 基金披露（"本研究由国家自然科学基金资助"）。verify 的含义
 * 是「这段话在用权威互引替代证据，需要回到原始数据」——
 * 调用方应要求出示链条之外的一手证据。
 *
 * 明确不判的（豁免）：
 *   · 利益/谱系的**披露与防范**句（披露/申报/声明无利益关联/
 *     与产业方无关联/独立于/第三方/disclose/conflict of
 *     interest/no conflict）：把关联讲清楚正是本维度要的纪律；
 *   · 概念教学转述（权威互引/引用闭环/引文圈子/循环背书/
 *     citation cartel/incestuous amplification/epistemic
 *     circularity + 讨论语域词）：在分析这个概念本身；
 *   · 独立复现句（独立复现/独立验证/独立机构/第三方复现/
 *     independently replicate/reproduce）：多路径独立验证恰好
 *     破除闭环，是正面结构；
 *   · 纯人事介绍无收束腿（"他是那位教授的弟子"只说关系，
 *     未得出可信性结论）。
 *
 * 来源（真实，未编造）：内部路径——r433 池化探针定拨（同池
 * 四候选：consensus_theater 穿透 6/8 但与 one_sided_dismissal
 * 射程重叠、premise_laundering 2/8、conclusion_preframe 2/8，
 * 本族穿透 12/15 且射程与全部 274 个既有维度零交叠）。海外
 * 扫描（hf4-scout.sh，2026-11-20T19:05Z）：GitHub "citation
 * cartel" 命中 8 个真实 repo（Tx-3011/Scholar-Forensics、
 * AMGrobelnik/ai-invention-* 两个 cartel 检测项目、
 * illinois-or-research-analytics "modeling citations and
 * cartels"、KNOWDYN/Forensix 等），证实权威互引/引文圈子
 * 是真实研究领域；arXiv 侧 parse-fail（r431 同现象）、
 * Semantic Scholar 空返，按既有形态自建判别规则。
 */
'use strict';

// ── 腿①：权威互引动作 ────────────────────────────────────────
const BACKING_ZH = [
  '认可', '赞同', '赏识', '激赏', '推崇', '备加推崇', '站台', '撑腰',
  '引用', '援引', '引述', '转引', '征引', '被引用', '被援引', '被引述',
  '师从', '师承', '授业', '受教于', '拜师', '投在', '门下',
  '师祖', '师爷', '祖师', '弟子', '门生', '徒弟', '传人', '再传',
  '一脉', '一脉相承', '传承', '衣钵', '嫡系', '正脉',
  '发表', '刊载', '刊登在', '被发表', '被刊载',
  '同行评议', '同行评审', '审稿', '评审', '送审', '被评议', '通过评议',
  '资助', '资助方', '拨资', '注资', '出资', '经费来自', '受资助', '获资助',
  '指定', '钦点', '内定', '委任', '聘任', '被指定',
  '背书', '作保', '担保', '认证', '背书称', '被背书',
  '完成评议', '完成评审', '评审通过', '评议通过', '审查通过',
];
const BACKING_EN = [
  'endorse', 'endorses', 'endorsed', 'endorsement', 'backed', 'backs',
  'cite', 'cites', 'cited', 'citation', 'quote', 'quotes', 'quoted',
  'reference', 'references', 'referenced', 'invoke', 'invokes',
  'trained by', 'trained under', 'mentored by', 'student of',
  'disciple of', 'pupil of', 'lineage', 'school of thought',
  'peer review', 'peer reviewed', 'peer-review', 'reviewed by',
  'refereed', 'referee',
  'funded by', 'funds', 'funding from', 'sponsored by', 'sponsors',
  'underwrote', 'underwritten', 'grant from',
  'appointed', 'designated', 'selected by', 'chosen by',
  'validate', 'validated', 'validates', 'certif', 'accredit',
  'laud', 'lauded', 'hail', 'hailed', 'champion', 'championed',
];

// 权威身份/机构词（腿①的共现要件）
const AUTHORITY_ID_ZH = [
  '诺奖', '诺贝尔', '得主', '泰斗', '宗师', '大师', '权威', '巨头',
  '学界', '学术', '学者', '专家', '教授', '院士', '创始人', '奠基人',
  '开创者', '提出者', '发明者', '名家', '名门', '学派', '门派',
  '实验室', '课题组', '研究所', '研究院', '科学院', '工程院',
  '委员会', '理事会', '评审团', '专家组', '编委会',
  '期刊', '杂志', '学报', '出版社', '智库',
  // [r433 补腿] 认证/评级类机构
  '评级', '评估', '审查', '认证', '审计', '标准', '协会', '联盟',
  '机构', '团队', '学派', '研究院',
];
const AUTHORITY_ID_EN = [
  'nobel', 'laureate', 'authority', 'authorities', 'luminary',
  'leading figure', 'leading', 'founder', 'founders', 'pioneer',
  'father of', 'giant', 'eminence', 'preeminent', 'distinguished',
  'professor', 'scholar', 'expert', 'academy', 'academic',
  'lab', 'laborator', 'research group', 'institute', 'institution',
  'committee', 'board', 'panel', 'reviewer', 'referee',
  'journal', 'magazine', 'publisher', 'think tank', 'foundation',
];

// ── 腿②：闭环关联 ────────────────────────────────────────────
const CLOSURE_ZH = [
  '同一', '同一个', '同一家', '同一间', '同一批', '同一支',
  '同门', '同门师兄弟', '同师', '同门中',
  '旗下', '麾下', '门下', '嫡系', '正脉',
  '其理事', '其董事', '其股东', '其成员', '其旗下',
  '该机构内部', '课题组内', '实验室内', '内部', '内部人',
  '被评级对象', '被评估对象', '被审查对象', '被审对象', '受评',
  '资助方', '出资方', '赞助方', '金主', '投资方', '资方',
  '利益相关', '关联方', '利害关系',
  '一脉相承', '师承', '师传', '衣钵相传', '薪火相传',
  '圈子', '小圈子', '自己人', '圈内',
  // [r433 补腿] 回指同一性：引用/背书指向的正是前述同一实体——
  // 「而该研究」「而这位亿万富翁正是该理论」结构里，闭环不靠显式
  // 闭环词，靠回指把引用者与被引者绑成同一个圈层。
  '而该', '而这位', '而这正是', '而其中', '而其', '以及其', '及其',
  '正是该', '正是这位', '正是其', '恰是', '即是',
  '该理论', '该研究', '该方法', '该学说', '该结论', '该方案',
  '这位', '该团队', '该机构', '该实验室', '该课题组',
  '所在机构', '所在实验室', '所在团队', '所在课题组',
  '同一人', '同为', '乃为', '即是',
  // [r433 补腿] 谱系回指形
  '这一脉', '这一派', '这一门', '此脉', '本门', '本派', '本脉',
  '另一位', '又一', '再一位',
];
const CLOSURE_EN = [
  'same lab', 'same laboratory', 'same group', 'same team',
  'same institution', 'same university', 'same department',
  'same journal', 'same publisher', 'same committee',
  'in-house', 'internal', 'internally', 'its own', 'their own',
  'funded by', 'funded through', 'sponsored by', 'bankrolled',
  'from the institution', 'from that lab', 'of that lab',
  'mutual', 'reciprocal', 'cross-citation', 'citation ring',
  'cartel', 'clique', 'circle', 'insider', 'the same people',
  'and its', 'and their', 'the institution that',
  // [r433 补腿] 回指同一性
  'whose', 'the author', 'the same author', 'the same person',
  'that funds', 'that funded', 'that sponsors',
  'the institute that', 'the lab that', 'the team that',
  'the school', 'the same school', 'the department', 'the journal',
];

// ── 腿③：可信性收束 ──────────────────────────────────────────
const CREDIBILITY_ZH = [
  '不会错', '错不了', '靠得住', '可靠性', '可信', '可信度',
  '向来可靠', '素来可靠', '始终可靠', '一向可靠', '历来可靠',
  '自然可靠', '当然可靠', '理应可靠', '必定可靠',
  '有分量', '有说服力', '令人信服', '有公信力', '公信',
  '毋庸置疑', '不容置疑', '无懈可击', '无可挑剔',
  '结论一致', '结论自然', '结论可靠', '结果可靠', '数据可靠',
  '以此为准', '可为准', '可放心', '尽可放心', '放心采纳',
  '权威性', '背书有力', '分量十足', '金字招牌',
  '可靠', '确凿', '扎实',
];
const CREDIBILITY_EN = [
  'sound', 'reliable', 'reliability', 'credible', 'credibility',
  'trustworthy', 'authoritative', 'dependable', 'beyond doubt',
  'beyond question', 'beyond reproach', 'unimpeachable',
  'carry weight', 'carries weight', 'carried weight',
  'conclusive', 'conclusively', 'settled', 'bulletproof',
  'rock solid', 'solid conclusion', 'robust finding',
  'consistent', 'consistent conclusion', 'in agreement',
  'cannot be wrong', "can't be wrong", 'no reason to doubt',
  'safe to rely', 'safely rely', 'rest assured',
];

// ── 守卫：利益/谱系披露句（讲清楚关联是纪律，不是运用） ──────
const DISCLOSURE_ZH = /(?:披露|申报|声明|声明无|已声明|公开声明|如实|注明|载明|利益冲突|无利益关联|与.*无(?:任何)?(?:利益|经济|商业)?(?:关联|关系|瓜葛)|独立于|独立(?:于|进行|机构|评审|第三方)|第三方(?:机构|审计|评估|复现|验证)|无关)/;
const DISCLOSURE_EN = /(?:\bdisclos\w*|\bdeclare\w*|\bconflict of interest\b|no conflict|independent of|independently|third[- ]party|unaffiliated|no financial|no ties|no affiliation)/i;

// ── 守卫：概念教学转述 ───────────────────────────────────────
const META_CONCEPT_ZH = /(?:权威互引|引用闭环|引文圈子|引文闭环|循环背书|互引|圈子化|门阀|学术近亲繁殖|近亲繁殖|引文共谋|互相引用|利益互绑)/;
const META_CONCEPT_EN = /(?:\bcitation cartel\b|\bcitation ring\b|incestuous amplification|epistemic circularity|circular (?:endorsement|citation|authority)|mutual (?:citation|admiration) society|echo chamber of|credit cycl)/i;

// ── 守卫：教学/分析语域 ──────────────────────────────────────
const TEACH_ZH = /(?:教科书|教材|课堂|讲座|课程|教学中|案例分析|谬误|逻辑学|论证分析|这个概念|这一概念|所谓|什么是|如何识别|识别方法)/;
const TEACH_EN = /(?:\btextbook\b|\blecture\b|\bclassroom\b|\bcurricul\w*|\bfallacy\b|\bfallacies\b|logical error|this concept|the concept of|so-called|what is|how to (?:spot|identify|detect))/i;

// ── 守卫：独立复现（正面结构，破除闭环） ─────────────────────
const INDEP_REPRO_ZH = /(?:独立(?:复现|验证|实验|机构|团队|评审|第三方|重复)|第三方(?:复现|验证|重复|复核|审计)|可复现|重复实验|多家机构|跨机构|外部评审)/;
const INDEP_REPRO_EN = /(?:\bindependently (?:replicat\w*|verif\w*|reproduc\w*|confirm\w*|validat\w*)\b|independent replication|independent (?:lab|team|group|review|audit|verification)|replicated by|reproduced by|multiple (?:labs|groups|teams))/i;

// ── 守卫：强否定（对互引结构的否认不是运用它） ───────────────
const NEG_ZH = /(?:不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌|别|不是|没有|未)/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*|instead of|rather than)\b/i;

// 近距共现窗口：三腿须在窗内彼此可达
const WIN_ZH = 90;
const WIN_EN = 220;

function anyHit(list, text) {
  for (const s of list) {
    if (text.includes(s)) return s;
  }
  return null;
}

// 双腿邻近共现：A 与 B 以任一顺序出现在 gap 个非句末字符内即成立。
function _cooccur(legA, legB, gap) {
  const GAP = `[^。！？!?\\n]{0,${gap}}`;
  return new RegExp(`(?:${legA})${GAP}(?:${legB})|(?:${legB})${GAP}(?:${legA})`, 'i');
}

function _esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 把词表编译成单个交替正则（含词边界，防子串误伤）
function _alt(list, isEn) {
  const parts = list.map(s => {
    const e = _esc(s);
    return isEn ? `\\b${e}\\b` : e;
  });
  return `(?:${parts.join('|')})`;
}

function checkAuthorityCircularity(text) {
  if (!text || typeof text !== 'string') {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const isZh = /[\u4e00-\u9fff]/.test(text);

  // ── 豁免组（先于判据） ────────────────────────────────────
  // 披露句：把关联讲清楚是本维度要求的纪律，不是运用本谬误
  if (isZh ? DISCLOSURE_ZH.test(text) : DISCLOSURE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0, exempt: 'disclosure' };
  }
  // 独立复现：多路径独立验证恰好破除闭环
  if (isZh ? INDEP_REPRO_ZH.test(text) : INDEP_REPRO_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0, exempt: 'independent_reproduction' };
  }
  // 概念教学转述：在分析这个概念本身
  const conceptHit = isZh ? META_CONCEPT_ZH.test(text) : META_CONCEPT_EN.test(text);
  if (conceptHit && (isZh ? TEACH_ZH.test(text) : TEACH_EN.test(text))) {
    return { hit: false, score: 0, detail: '', count: 0, exempt: 'meta_concept' };
  }

  const BACKING = isZh ? _alt(BACKING_ZH, false) : _alt(BACKING_EN, true);
  const AUTHORITY = isZh ? _alt(AUTHORITY_ID_ZH, false) : _alt(AUTHORITY_ID_EN, true);
  const CLOSURE = isZh ? _alt(CLOSURE_ZH, false) : _alt(CLOSURE_EN, true);
  const CRED = isZh ? _alt(CREDIBILITY_ZH, false) : _alt(CREDIBILITY_EN, true);
  const GAP = isZh ? WIN_ZH : WIN_EN;

  // 腿① = BACKING × AUTHORITY（互引动作须挂在权威/机构上）
  const leg1 = new RegExp(`(?:${BACKING})[^。！？!?\\n]{0,${GAP}}(?:${AUTHORITY})|(?:${AUTHORITY})[^。！？!?\\n]{0,${GAP}}(?:${BACKING})`, 'i');
  // 腿② = CLOSURE（闭环关联词）
  const leg2 = new RegExp(CLOSURE, 'i');
  // 腿③ = CREDIBILITY（可信性收束）
  const leg3 = new RegExp(CRED, 'i');

  const has1 = leg1.test(text);
  const has2 = leg2.test(text);
  let has3 = leg3.test(text);

  // [r433 补腿] 权威传递收束形：当腿①（互引动作×权威）+腿②（闭环）
  // 成立且文本出现第二个权威实体（"另一位诺奖得主"/"another
  // Nobel laureate"）时，权威传递本身即构成可信性主张——互引
  // 的目的就是把可信性从 A 权威传到结论，无需显式"可靠"词。
  let transferMode = false;
  if (has1 && has2 && !has3) {
    const secondZh = /另一位[^。！？!?]{0,6}(?:得主|权威|泰斗|大师|学者|专家|教授|院士|创始人|诺奖|诺贝尔)|(?:又|再)(?:一|两位?)[^。！？!?]{0,6}(?:得主|权威|泰斗|大师|学者|专家|教授|院士|创始人)/;
    const secondEn = /\b(?:another|other|a second|yet another)\s+(?:\w+\s+){0,2}(?:nobel|laureate|authority|expert|professor|scholar|founder|pioneer|leading)\b/i;
    const transferZh = /(?:引用|援引|引述|认可|推崇|师从|师承|授业|一脉|传承)/;
    const transferEn = /\b(?:cite\w*|endors\w*|reference\w*|invoke\w*|trained by|lineage)\b/i;
    if ((isZh && secondZh.test(text) && transferZh.test(text)) ||
        (!isZh && secondEn.test(text) && transferEn.test(text))) {
      has3 = true;
      transferMode = true;
    }
  }

  // 三腿共现才判；近距校验：三处命中位置的最大跨度不超过 GAP
  if (!(has1 && has2 && has3)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const m1 = leg1.exec(text);
  const m2 = leg2.exec(text);
  let m3 = leg3.exec(text);
  const positions = [m1.index, m2.index, m3 ? m3.index : m2.index + m2[0].length].sort((a, b) => a - b);
  const span = positions[2] - positions[0];
  if (span > GAP) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // ── 守卫：强否定词出现在三腿命中区之前，是对结构的否认 ────
  const negRe = isZh ? NEG_ZH : NEG_EN;
  const head = text.slice(0, positions[0]);
  if (negRe.test(head)) {
    return { hit: false, score: 0, detail: '', count: 0, exempt: 'negation' };
  }

  const credText = m3 ? m3[0].slice(0, 10) : (transferMode ? '权威传递收束' : '');
  const detail = isZh
    ? `权威互引洗白（互引动作「${m1[0].slice(0, 12)}」×闭环关联「${m2[0].slice(0, 10)}」×${transferMode ? '权威传递收束' : `可信性收束「${m3[0].slice(0, 10)}」`}，跨度 ${span} 字）`
    : `authority circularity (backing x closure x ${transferMode ? 'authority-transfer' : 'credibility'}, span ${span} chars)`;

  return {
    hit: true,
    // [r435 口径修复] 0-1 小数制（同 metric-gaming bestScore 0.72/0.62
    // 口径）。r433 原稿误用整数 65——index.js 聚合层 findings.push 按
    // Math.round(d.score * 100) 折算 severity，整数 65 会被放大成 6500，
    // 越过 gate 的 rewrite 阈值（overallScore<0.5 && severity>=60），
    // 使本应落 verify 的族实际落 rewrite（r433 报告已标记该未决风险，
    // 实测确认根因是 score 口径而非门禁逻辑）。
    score: 0.65,
    detail,
    count: 1,
    transfer: transferMode,
    legs: {
      backing: m1[0].slice(0, 30),
      closure: m2[0].slice(0, 30),
      credibility: credText,
    },
  };
}

module.exports = {
  checkAuthorityCircularity,
  __internals: () => ({
    BACKING_ZH, BACKING_EN, AUTHORITY_ID_ZH, AUTHORITY_ID_EN,
    CLOSURE_ZH, CLOSURE_EN, CREDIBILITY_ZH, CREDIBILITY_EN,
    DISCLOSURE_ZH, DISCLOSURE_EN, META_CONCEPT_ZH, META_CONCEPT_EN,
    TEACH_ZH, TEACH_EN, INDEP_REPRO_ZH, INDEP_REPRO_EN,
    NEG_ZH, NEG_EN, WIN_ZH, WIN_EN,
  }),
};
