/**
 * src/goal-drift.js — 「目标漂移/使命置换（goal drift / mission substitution）」
 * 检测器（第 197 个判别维度）
 *
 * [r200 立项] decision 本体在当前引擎（v6.8.128，196 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions，goalReviewed=true；cognitiveLoad 与 uncertainty
 * 均为 "unknown"，按轮次纪律不当实质背书）。三层研究：HN Algolia 命中
 * arXiv 2603.03456《Asymmetric Goal Drift in Coding Agents Under Value
 * Conflict》（https://arxiv.org/abs/2603.03456——coding agent 在价值冲突下
 * 会**静默偏离**被雇佣时的目标，且偏离不对称：用户目标让位于习得价值观与
 * 代码库惯性）与 GitHub sunilgentyala/Plumbline ★6（Apache-2.0，zero ML
 * deps：mission drift 是 2026 治理栈「per-action 授权检查」覆盖不到的失效
 * 模式——每个动作都合规，轨迹却整体漂走，需对固定 mission anchor 持续打分）。
 * 二者均为 agent 运行时治理/实证研究，判据为心虫自有纯规则实现（零 LLM
 * 依赖），侦察落盘 /tmp/hf-scout-*.txt。
 *
 * 辨别的族：**以「延续/服务原目标」之名行「置换目标」之实**——文本同时
 * 宣告**原始目标锚点**（腿①）与**向新目标的置换/漂移宣告**（腿②），把一次
 * 未经授权的目标切换叙述成对原目标的延续、演进或「这才是真正重要的」：
 *   这个项目的初衷是帮助用户省钱，但现在我们的重心已经转向了提升平台补贴
 *   核销率——这才是真正该做的事。
 *   我们立项时的使命是降低故障率，如今不知不觉间，重心转移到了把报表做得
 *   更漂亮上。
 *   Our original mission was to reduce customer complaints, but our focus has
 *   drifted to maximizing ticket-closure speed.
 *   We were hired to cut infrastructure costs; what we really do now is grow
 *   the platform's metrics.
 * 与 arXiv 2603.03456 / Plumbline 的对应：论文证明 agent 会**静默**换目标
 * （individual actions authorized，trajectory drifted）；本维度在心虫的
 * 文本判别层识别同一形状的**话语形态**——锚点在场 + 置换宣告在场，即
 * 「mission drift 的自白书」。
 *
 * 与既有维度的边界（r200 归因，确保独立承重、不重叠）：
 *   · goal_misalignment（已计分、无 gate action）是**单腿模式匹配**清单
 *     （列了一组偏离句式各自独立打分，不要求锚点×置换共现、无豁免体系），
 *     本族是**两腿共现 + 邻近窗 + 四组豁免**的成对结构，且落在 VERIFY_DIMS
 *     真正承重 gate.action；
 *   · moving_goalposts 管**辩论中移动成功判据**（「换了标准就能继续宣称
 *     自己对」），本族管**执行轨迹上的目标被整体置换**，不依赖辩论/宣称
 *     胜负的语境；
 *   · proxy_metric_goal 管**用代理指标替换目标**（测得的量被当成目标，
 *     腿①是代理指标族），本族腿①是**原始目标锚点宣告**，腿②是**目标切换
 *     宣告**——「重心从 A 转向 B」整体换目标，而不是拿 B 的指标当 A；
 *   · activity_outcome_confusion 管**活动量冒充成果**，本族不管活动/成果
 *     混淆，管目标本身被更换；
 *   · standard_shift 管**评判标准漂移**（同一对象换尺子），本族管**目标
 *     对象更换**（换的是要什么，不是怎么评）。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① ANCHOR 原始目标/使命锚定宣告（中英，含裸名词形态）：
 *     初衷/初心/本来要/原本要/原先要/最初的目标/最初的任务/原始目标/原任务/
 *     原本的任务/最初的计划/原计划/一开始的(目标|任务|计划|使命)/
 *     立项(时|的|之初)/立项目的/使命/宗旨/被(要求|安排|雇来|请来)/
 *     雇佣(我|我们|它的目的)/受雇于/任务(书|本来|原本|要求)/本来的目的/
 *     原来的目的；
 *     EN original / initial / stated / assigned (goal|task|mission|objective|
 *     mandate|purpose|brief) / what (I|we) (was|were) (hired|asked|assigned|
 *     instructed) to do / the (mission|mandate|brief) / set out to / founded to
 *     — r161 教训自查：「初衷」「初心」「使命」「宗旨」均为裸名词形态，去掉
 *     任何后缀仍命中；「本来要/原本要」收动词形不依赖后缀。
 *   腿② SWITCH 目标置换/漂移宣告（中英，含裸名词形态）：
 *     重心(已经|早已|悄然|慢慢)?(转向|转移到|放在|移到)/重心转移/
 *     重点(转向|转移到|变成)/现在(真正|最)(重要|该做|值得)(的|是)/
 *     真正(重要|该做|值得)(的|是)/实际上(变成|已是|变成了)/已经变成/
 *     变成了/演变成/转变为/转向/漂移(到|至|成了)/不知不觉(中)?(变成|成了)/
 *     如今(的)?(重心|重点|目标)(是|变成)/真正的目标(是|变成了)/
 *     说到底是为了/归根到底是为了/本质上是为了/逐渐沦为；
 *     EN (has|have) (shifted|drifted|moved|pivoted) (to|from|away from) /
 *     focus (has )?(shifted|drifted|moved) to / now focused on / the real
 *     (goal|priority|focus|objective) is / turned into / became about /
 *     really about / morphed into / what (we|it|I) (really|actually) (do|want|
 *     need) is / the true objective is / in essence (became|is) / drifted from
 *     — r161 教训自查：「漂移」「转向」「重心转移」裸名词形态直接命中，
 *     EN "drifted" 裸词命中。
 *   两腿落在 60 字（EN 160 字符）邻近窗内即视为同一次「目标置换」叙述。
 *
 * 为什么取 VERIFY 级：目标切换本身可以是正当治理动作（用户批准的范围变更、
 *   需求变化后的正式重对齐）——规则引擎无法从单句判定这次切换是否获得授权，
 *   只能识别「锚点×置换」共现这个形态。verify 的含义是「先确认切换是否经过
 *   授权再采信」：调用方应要求出示授权依据（谁批准的、何时重对齐的），或把
 *   叙述改写成「未经确认的目标切换，需回到原使命」。
 *
 * 明确不判的（豁免）：
 *   · 显式授权/正式变更（用户批准/经(用户|上级|客户)(同意|批准)/重新对齐/
 *     已确认(新|变更后)的(目标|范围|优先级)/正式(变更|调整|批准)/
 *     授权(变更|调整)/变更后的(目标|范围|优先级)/调整后的(目标|范围)；
 *     EN with the user'?s (approval|consent|blessing) / approved (by|the new) /
 *     formally (approved|revised|re-scoped) / re-anchored / agreed new (scope|
 *     mandate|priority)）——有授权的目标切换是正常治理动作，不是漂移；
 *   · 自我纠正/觉察漂移（发现(偏离|漂移|跑偏)|已经偏离|回到(初衷|初心|正轨|
 *     原目标|使命)|纠正(漂移|偏离|方向)|需要回到|不忘初心|牢记(初心|使命)|
 *     谨记初衷/回到正题；EN (have|has) drifted off / drifted from the (goal|
 *     mission) / need to return / back on track / refocus on the original /
 *     lost sight of）——**指出并纠正漂移是正确判别**，恰是本维度保护的
 *     反面行为，必须整句放行；
 *   · 概念/教学转述（目标漂移/使命漂移/漂移检测/漂移率/治理/管理学/论文/
 *     教材/研究(表明|发现)/案例；EN goal drift / mission drift / drift
 *     detection / governance / case study）——讨论这个概念本身不是运用它；
 *   · 对冲（可能/也许/或许/大概/似乎/好像/说不定/有待；EN maybe / perhaps /
 *     might / probably / seems / appears）——概率化/试探性表述不断言置换；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① ANCHOR 原始目标/使命锚定宣告（中文，裸名词形态）────────────────
// r161 教训自查：初衷/初心/使命/宗旨/原任务/原计划 去掉任何修饰后缀仍命中；
// 「被要求/被安排」收被动指派形；不收「目标」裸词（那是 goal_misalignment
// 的辖区，且裸「目标」在正常陈述中太常见，须带锚定修饰）。
const ANCHOR_ZH = [
  /初衷|初心|本来要|原本要|原先要|最初的目的|原来的目的|本来的目的/,
  /最初(的)?(目标|任务|计划|使命|设想|想法)|原始目标|原任务|原本的任务|最初的使命/,
  /一开始(的)?(目标|任务|计划|使命|想法)|立项(时|之初|的)|立项目的|立项(初衷|使命)/,
  /使命|宗旨|天职/,
  /被(要求|安排|指定|交待|交代|雇来|请来|委派)|雇佣(我|我们|它)|受雇于|受聘(来|于)/,
  /任务(书|本来|原本|要求|说明)|最初的(约定|契约|承诺|职责|职能)/,
];

// ─── 腿② SWITCH 目标置换/漂移宣告（中文，裸名词形态）────────────────────
const SWITCH_ZH = [
  /重心(已经|早已|悄然|慢慢|逐渐|在)?(转向|转移到|放在|移到|投向|倾向)|重心转移|重心变了/,
  /重点(已经|早已|在)?(转向|转移到|变成|放在)|重点转移/,
  /现在(真正|最|其实)?(重要|该做|值得|关键)(的|是)|真正(重要|该做|值得|关键)(的|是)/,
  /实际上(变成|已是|变成了|成了)|已经变成|变成了|演变成|转变为|逐渐沦为|沦为/,
  /漂移(到|至|成了|向)|不知不觉(中)?(变成|成了|变成)|悄无声息地(变成|成了)/,
  /如今(的)?(重心|重点|目标|方向)(是|变成|成了)|真正的目标(是|变成了)/,
  /说到底是为了|归根到底是为了|本质上是为了|说到底还是为了|其实是(为了|变成)/,
  /转向|转到|倒向/,
];

// ─── 英文侧腿① ────────────────────────────────────────────────────────
const ANCHOR_EN = [
  /\b(?:original|initial|stated|assigned|given|intended)\s+(?:goal|task|mission|objective|mandate|purpose|brief|remit)\b/i,
  /\bwhat\s+(?:i|we)\s+(?:was|were)\s+(?:hired|asked|assigned|instructed|commissioned|brought\s+on)\s+to\s+do\b/i,
  /\b(?:i|we)\s+(?:was|were)\s+(?:hired|asked|assigned|instructed|commissioned|brought\s+on)\s+to\b/i,
  /\b(?:the\s+)?(?:mission|mandate|remit)\s+(?:was|is)\b/i,
  /\b(?:set|founded|started|created)\s+out\s+to\b/i,
  /\bthe\s+(?:whole\s+)?point\s+(?:was|is)\b/i,
  /\bour\s+(?:original|initial|founding)\s+(?:goal|mission|purpose|intent)\b/i,
];

// ─── 英文侧腿② ────────────────────────────────────────────────────────
const SWITCH_EN = [
  /\b(?:has|have)\s+(?:shifted|drifted|moved|pivoted|morphed)\s+(?:to|towards?|away\s+from|from)\b/i,
  /\b(?:focus|emphasis|attention)\s+(?:has\s+)?(?:shifted|drifted|moved|pivoted)\s+(?:to|towards?|away\s+from)\b/i,
  /\bnow\s+(?:focused|focusing|centered|centred)\s+on\b/i,
  /\bthe\s+real\s+(?:goal|priority|focus|objective|point)\s+is\b/i,
  /\bturned\s+into\b/i,
  /\bbecame\s+about\b/i,
  /\breally\s+about\b/i,
  /\bmorphed\s+into\b/i,
  /\bwhat\s+(?:we|it|i)\s+(?:really|actually)\s+(?:do|want|need|care)\b.{0,24}\bis\b/i,
  /\bthe\s+true\s+objective\s+is\b/i,
  /\bin\s+essence\s+(?:became|is)\b/i,
  /\bdrifted\s+(?:from|off)\b/i,
  /\bshifted\s+from\b.{0,40}\bto\b/i,
];

// ─── 计分加成：擅自切换标记（不承重，只加分）──────────────────────────
const UNAUTHORIZED_ZH = [/未经|没有(任何)?授权|擅自|默默|悄悄|悄无声息|无声无息|不知不觉|私下|私自|违规|越权/];
const UNAUTHORIZED_EN = [/\bwithout\s+(?:any\s+)?(?:authori[sz]ation|approval|consent|sign-?off)\b/i, /\bquietly\b/i, /\bsilently\b/i, /\bunilaterally\b/i, /\bon\s+its\s+own\b/i];

// ─── 豁免一：显式授权 / 正式变更 ───────────────────────────────────────
const EXEMPT_AUTH_ZH = [
  /用户(批准|同意|认可|授权)|经(用户|上级|客户|领导)(同意|批准|认可|授权|确认)/,
  /重新对齐|已确认(新|变更后|调整后)的?(目标|范围|优先级)|正式(变更|调整|批准|立项|授权)/,
  /授权(变更|调整|切换|调整)|变更后的(目标|范围|优先级)|调整后的(目标|范围|优先级|方向)/,
  /报备|备案|审批(通过|同意|批准)|立项变更|变更(已|获得)(批准|通过|同意)/,
];
const EXEMPT_AUTH_EN = [
  /\bwith\s+the\s+user'?s\s+(?:approval|consent|blessing|sign-?off)\b/i,
  /\bapproved\s+(?:by|the\s+new)\b/i,
  /\bformally\s+(?:approved|revised|re-?scoped|re-?anchored)\b/i,
  /\bre-?anchored\b/i,
  /\bagreed\s+(?:new\s+)?(?:scope|mandate|priority|priorities|direction)\b/i,
  /\bsigned\s+off\s+on\b/i,
];

// ─── 豁免二：自我纠正 / 觉察漂移（指出并纠正漂移是正确判别）────────────
const EXEMPT_SELF_ZH = [
  /发现(了)?(偏离|漂移|跑偏|走偏)|已经偏离|正在偏离|出现了?漂移|有(漂移|偏离)的?迹象/,
  /回到(初衷|初心|正轨|原目标|原使命|使命|本来|起点)|回归(初衷|初心|正轨|本业)/,
  /纠正(漂移|偏离|方向|路线)|矫正(漂移|偏离)|需要回到|应当回到|应该回到|必须回到/,
  /不忘初心|牢记(初心|使命|初衷)|谨记(初衷|使命)|守住初心|秉持初衷|不忘本来/,
  /防止(目标)?漂移|避免(目标)?漂移|警惕(目标)?漂移|杜绝(目标)?漂移/,
];
const EXEMPT_SELF_EN = [
  /\b(?:have|has|had)\s+drifted\s+off\b/i,
  /\bdrifted\s+from\s+(?:the|our)\s+(?:goal|mission|purpose)\b/i,
  /\bneed\s+to\s+return\b/i,
  /\bback\s+on\s+track\b/i,
  /\brefocus(?:ed|ing)?\s+on\s+the\s+(?:original|initial)\b/i,
  /\blost\s+sight\s+of\b/i,
  /\bguard\s+against\s+(?:goal\s+)?drift\b/i,
  /\bprevent\s+(?:goal\s+)?drift\b/i,
];

// ─── 豁免三：概念 / 教学转述 ───────────────────────────────────────────
const EXEMPT_META_ZH = [
  /目标漂移|使命漂移|漂移检测|漂移率|漂移问题|漂移现象|漂移风险|治理漂移/,
  /管理学|组织学|论文|教材|案例研究|研究表明|研究发?现|实验表明|调查显示/,
];
const EXEMPT_META_EN = [
  /\bgoal\s+drift\b/i,
  /\bmission\s+drift\b/i,
  /\bdrift\s+detection\b/i,
  /\bgovernance\b/i,
  /\bcase\s+study\b/i,
  /\bpaper\b/i,
  /\btextbook\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [/可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/];
const EXEMPT_HEDGE_EN = [/\bmaybe\b/i, /\bperhaps\b/i, /\bmight\b/i, /\bmay\s+be\b/i, /\bpossibly\b/i, /\bprobably\b/i, /\bseems?\b/i, /\bappears?\b/i];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 list 中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/** 两腿 + 邻近窗：存在 a∈ANCHOR, s∈SWITCH 使 |a-s|≤WIN */
function legsZh(text, R) {
  const anc = positions(R.ANCHOR_ZH || ANCHOR_ZH, text);
  const sw = positions(R.SWITCH_ZH || SWITCH_ZH, text);
  if (anc.length === 0 || sw.length === 0) return false;
  const WIN = 60;
  for (const a of anc) for (const s of sw) if (Math.abs(a - s) <= WIN) return true;
  return false;
}

function legsEn(text, R) {
  const anc = positions(R.ANCHOR_EN || ANCHOR_EN, text);
  const sw = positions(R.SWITCH_EN || SWITCH_EN, text);
  if (anc.length === 0 || sw.length === 0) return false;
  const WIN = 160;
  for (const a of anc) for (const s of sw) if (Math.abs(a - s) <= WIN) return true;
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永不匹配正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGoalDrift(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：显式授权 / 自我纠正觉察 / 概念讨论 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_AUTH_ZH || EXEMPT_AUTH_ZH, text) || anyHit(R.EXEMPT_AUTH_EN || EXEMPT_AUTH_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_SELF_ZH || EXEMPT_SELF_ZH, text) || anyHit(R.EXEMPT_SELF_EN || EXEMPT_SELF_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? legsZh(text, R) : legsEn(text, R);
  if (!hit) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：基础 0.60 + 擅自切换标记 0.05 + 显式漂移词 0.05，封顶 0.85
  let score = 0.60;
  if (anyHit(R.UNAUTHORIZED_ZH || UNAUTHORIZED_ZH, text) || anyHit(R.UNAUTHORIZED_EN || UNAUTHORIZED_EN, text)) score += 0.05;
  if (/漂移/.test(text) || /\bdrift\w*\b/i.test(text)) score += 0.05;
  if (score > 0.85) score = 0.85;

  return {
    hit: true, score, count: 1,
    detail: isZh
      ? '目标漂移×原始使命锚点×目标置换宣告共现(zh)'
      : 'goal drift×mission anchor×goal-substitution declaration(en)',
  };
}

module.exports = {
  checkGoalDrift,
  __internals: () => ({
    ANCHOR_ZH, SWITCH_ZH, ANCHOR_EN, SWITCH_EN,
    UNAUTHORIZED_ZH, UNAUTHORIZED_EN,
    EXEMPT_AUTH_ZH, EXEMPT_AUTH_EN, EXEMPT_SELF_ZH, EXEMPT_SELF_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
