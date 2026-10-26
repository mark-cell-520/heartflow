/**
 * src/no-true-scotsman.js
 * [r728] 第 159 维度 no_true_scotsman（无真正的苏格兰人：定义驱逐反例）。
 *
 * 谬误形状：先立一个带 authenticity 标准的类别（「真正的X」「true X」），
 * 再用行为把反例驱逐出该类别（「不会/根本不/算不上」），使类别不可证伪。
 * 经典形：No true Scotsman puts sugar on his porridge.
 *
 * 判据（双腿共现，缺腿不判）：
 *   腿① AUTH authenticity 短语——authenticity 标记（真正/真心/真爱/合格/
 *     称职/但凡/true/real/genuine/proper）× 社会角色名词（专家/粉丝/朋友/
 *     领导/学生…/fan/expert/friend/partner…）。角色名词限制是防误伤的关键：
 *     「真正的风险」「true statement」这类真正+抽象名词不放判。
 *   腿② EXCLUSION 驱逐断言——否定行为谓词（不会/从来不/怎么会/算不上/
 *     根本不是/就不配/不需要…/would never/never/not a true…），或 DENIAL
 *     类别否认（根本不是/算不上/就不是），或 CONDITIONAL 反事实条件句
 *     （如果她是真朋友，早就…/If she were a real friend, she would have…）。
 *
 * 豁免常量（全部可被负例注入置空）：
 *   META_NOUN 谬误概念转述（无真正的苏格兰人/no true scotsman/谬误/fallacy）
 *   DEFINITION_SETTING 术语约定与定义先行（先定义/约定术语/可检验的定义）
 *   HEDGE 对冲（也许/可能/未必/not necessarily）
 *   NEGATION_FLIP 否定翻转（不是不会/不意味着/does not mean）
 *   EVIDENCE_CHALLENGE 证据挑战（自称+拿不出/说不清/缺乏依据）
 *
 * r728 实测（scripts/round-728-family-probe.js，当前引擎 158 维）：
 * 攻击漏判 18/24（75%）、良性 0/10 误伤、漏判中真零命中 17/18；
 * decision 本体一次选中（scripts/decide-r728.js，composite 0.83 /
 * confidence 0.86 / identity_alignment 0.8，第二名 loaded_question 0.82）。
 * 连续 5 轮候补（r724-r728），样本面全池最大（24 攻击 + 10 良性）。
 */
'use strict';

// ─── 腿① AUTH：authenticity 短语 ─────────────────────────────

// 中文角色名词（社会身份/角色类别，非抽象名词）
const ROLE_NOUNS_CN = '人|者|粉丝|专家|朋友|兄弟|男人|女人|父亲|母亲|爸爸|妈妈|父母|孩子|男生|女生|领导|学生|设计师|艺术家|球员|歌手|演员|工程师|程序员|医生|律师|老师|作家|球迷|爱好者|消费者|员工|同事|伙伴|伴侣|爱人|管理者|负责人|专业人士|技术人员|同行|内行|大佬|极客';

// 英文角色名词
const ROLE_NOUNS_EN = 'fan|fans|expert|experts|friend|friends|partner|partners|leader|leaders|manager|artist|artists|designer|designers|professional|professionals|parent|parents|mother|father|player|players|engineer|developer|colleague|colleagues|christian|muslim|scotsman|scot|patriot|man|woman|boy|girl|musician|believer|member|artist';

// CN-1：authenticity 标记 × 角色名词（标记与角色之间允许修饰语）
//   「真正爱你的男人」「真正有格局的领导」「合格的妈妈」「称职的父亲」
const AUTH_CN_ROLE_RE = new RegExp(
  '(真正|真心|合格|称职|敬业|忠诚|孝顺|靠谱|懂事|有格局|吃得苦|想学好|想改|上进|有良心|有自尊)' +
  '[^，。；！？\\n]{0,10}(' + ROLE_NOUNS_CN + ')'
);

// CN-2：真爱/真心 独立 authenticity 标记（关系语境，无需角色名词共现）
//   「真爱一个人就不会计较得失」「真心想改的人」
const AUTH_CN_LOVE_RE = /真爱|真心/;

// CN-3：但凡…的人（普遍资格排除句式）
//   「但凡有点良心的人都不会在背后议论同事」
const AUTH_CN_WHOEVER_RE = new RegExp('但凡[^，。；！？\\n]{0,12}(人|者)');

// CN-4：美德短语 × 人（「有点自尊的男人」「真正吃得苦的人」）
const AUTH_CN_VIRTUE_RE = new RegExp(
  '(有良心|有自尊|吃得苦|想学好|想改|上进|懂事|靠谱|敬业|忠诚|孝顺)' +
  '[^，。；！？\\n]{0,6}(人|男人|女人|者)'
);

// CN-5：真+角色简称（「真兄弟」「真粉丝」「真朋友」）
const AUTH_CN_TRUE_SHORT_RE = new RegExp('真(兄弟|朋友|粉丝|爱|心)');

// EN-1：authenticity 标记 × 角色名词（允许一个形容词间隔）
//   「a true fan」「No real expert」「a truly loving partner」
const AUTH_EN_ROLE_RE = new RegExp(
  '\\b(true|truly|real|really|genuine|genuinely|proper|properly|legitimate)\\s+(\\w+\\s+)?(' + ROLE_NOUNS_EN + ')\\b',
  'i'
);

// EN-2：否认形 authenticity（「He is not a true fan」「no real expert」）
const AUTH_EN_DENIAL_RE = new RegExp(
  '\\b(not|isn\'?t|no)\\s+(a\\s+|an\\s+)?(true|truly|real|really|genuine|proper)\\s+(\\w+\\s+)?(' + ROLE_NOUNS_EN + ')\\b',
  'i'
);

// ─── 腿② EXCLUSION：驱逐断言 / 类别否认 / 反事实条件 ──────────

// CN：否定行为谓词 + 类别否认
const EXCLUSION_CN_RE = new RegExp(
  '(不会|绝不会|从来不|从来不会|根本不会|压根不|怎么会|岂会|怎么可能|' +
  '算不上|根本不是|就不是|就不配|不需要|不可能|也不会|都不会|的就是不|不配称)'
);

// EN：否定行为谓词 + 类别否认
const EXCLUSION_EN_RE = new RegExp(
  '\\b(would never|would not|wouldn\'?t|never|isn\'?t a real|couldn\'?t be a|can\'?t be a|not a true|no real)\\b',
  'i'
);

// CONDITIONAL：反事实条件句（条件+authenticity+反事实结果）
//   CN：「如果她是真朋友，早就…」 EN：「If she were a real friend, she would have…」
const CONDITIONAL_CN_RE = new RegExp(
  '(如果|要是|若)[^。！？；\\n]{0,16}(真|真正|真心)[^。！？；\\n]{0,14}(早就|就会|一定|肯定|定然|怎会)'
);
const CONDITIONAL_EN_RE = new RegExp(
  'if\\s+(she|he|they|you|we|i)\\s+(were|was|had been)\\s+(a\\s+|an\\s+)?(true|truly|real|genuine|proper)\\s+\\w+',
  'i'
);

// ─── 豁免常量（可被负例注入置空） ─────────────────────────────

// 谬误概念转述/元话语（讨论该谬误本身）
const META_NOUN_RE = /无真正的苏格兰人|真正的苏格兰人|no true scotsman|true scotsman|循环定义|定义驱逐|诉诸定义|特殊辩护|谬误|谬论|逻辑谬误|fallacy|fallacies/i;

// 术语约定与定义先行（先给可检验定义再讨论）
const DEFINITION_SETTING_RE = /先定义|先给出|约定术语|先说清|说清哪些行为|要写明标准|先约定|可检验的|可操作的指标|定义.{0,8}指|operational(ly)? defin|testable defin|define .{0,24}first/i;

// 对冲表述（承认可能的反例）
const HEDGE_RE = /也许|可能|未必|不一定|大概|或许|perhaps|maybe|possibly|probably|not necessarily|might also/i;

// 否定翻转（不是不会/不意味着——明确拒绝该推理）
const NEGATION_FLIP_RE = /不是不会|并非不|并不意味着|不代表|不等于|不能说明|does not mean|doesn'?t mean|doesn'?t imply|not mean that/i;

// 证据挑战（自称+拿不出证据——挑战主张而非驱逐反例）
const EVIDENCE_CHALLENGE_RE = /自称|拿不出|说不清|缺乏依据|没有证据|未经证实|无从验证|self-?proclaim|no evidence|unsubstantiated/i;

// ─── 句子切分 ────────────────────────────────────────────────

function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  return text
    .split(/[。！？；\n]+|(?<=[a-z])\.\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── 主检测 ──────────────────────────────────────────────────

function checkNoTrueScotsman(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  // 豁免：任一豁免形命中即整篇不判（元话语/定义先行不是运用该谬误）
  if (META_NOUN_RE.test(text)) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  const exemption = DEFINITION_SETTING_RE.test(text) || HEDGE_RE.test(text)
    || NEGATION_FLIP_RE.test(text) || EVIDENCE_CHALLENGE_RE.test(text);
  if (exemption) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  const sentences = splitSentences(text);
  const matches = [];

  for (const sent of sentences) {
    const authHit = AUTH_CN_ROLE_RE.test(sent) || AUTH_CN_LOVE_RE.test(sent)
      || AUTH_CN_WHOEVER_RE.test(sent) || AUTH_CN_VIRTUE_RE.test(sent)
      || AUTH_CN_TRUE_SHORT_RE.test(sent)
      || AUTH_EN_ROLE_RE.test(sent) || AUTH_EN_DENIAL_RE.test(sent);
    if (!authHit) continue;

    const exclusionMatches = sent.match(new RegExp(EXCLUSION_CN_RE, 'g')) || [];
    const exclusionEnMatches = sent.match(new RegExp(EXCLUSION_EN_RE, 'g')) || [];
    const exclusionCount = exclusionMatches.length + exclusionEnMatches.length;
    const conditional = CONDITIONAL_CN_RE.test(sent) || CONDITIONAL_EN_RE.test(sent);

    if (exclusionCount > 0 || conditional) {
      matches.push({
        sentence: sent.slice(0, 80),
        exclusionCount,
        conditional,
        denial: exclusionCount > 0 && /(算不上|根本不是|就不是|就不配|的就是不|不配称|not a true|no real|isn'?t a real)/i.test(sent),
      });
    }
  }

  if (matches.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  // 评分：单处共现 70；多处共现或含类别否认/反事实条件 95
  const strong = matches.some(m => m.exclusionCount >= 2 || m.conditional || m.denial);
  const score = strong ? 95 : 70;
  const count = matches.length;
  const details = '无真正的苏格兰人（定义驱逐反例）(' + count + '处: '
    + matches.map(m => m.sentence.slice(0, 40)).join('；') + ')';

  return { hit: true, score, count, matches, details };
}

module.exports = {
  checkNoTrueScotsman,
  __internals: {
    AUTH_CN_ROLE_RE,
    AUTH_CN_LOVE_RE,
    AUTH_CN_WHOEVER_RE,
    AUTH_CN_VIRTUE_RE,
    AUTH_CN_TRUE_SHORT_RE,
    AUTH_EN_ROLE_RE,
    AUTH_EN_DENIAL_RE,
    EXCLUSION_CN_RE,
    EXCLUSION_EN_RE,
    CONDITIONAL_CN_RE,
    CONDITIONAL_EN_RE,
    META_NOUN_RE,
    DEFINITION_SETTING_RE,
    HEDGE_RE,
    NEGATION_FLIP_RE,
    EVIDENCE_CHALLENGE_RE,
    splitSentences,
    ROLE_NOUNS_CN,
    ROLE_NOUNS_EN,
  },
};
