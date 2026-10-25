'use strict';
/**
 * src/relative-pration.js
 * [v6.8.74] 第 726 轮：第 156 维度 relative_pration（诉诸更惨 / 相对剥夺式堵嘴）。
 *
 * 来源：decision 本体（scripts/decide-r726.js）一次选中无打平——
 *   composite 0.83 / confidence 0.84 / identity_alignment 0.8（第二名 B/C 均 0.81，D 0.79）。
 *   r726 复测（scripts/round-726-family-probe.js，v6.8.73 / 155 维引擎实测）：
 *   攻击漏判 30/35（86%）全池最高、良性误伤 0/12、真零命中 28/30；
 *   r724/r725/r726 连续三轮 83%/86%/86%，教科书低估真实分布被连续证实。
 *
 * 形态：拿**第三方**（人家/有人/多少人/别人/others/往事一代）更惨的处境，
 * 贬低或抵消对方**正当的当下诉求、抱怨或疼痛**——
 *   「别喊疼了，人家生孩子的都不吭声」「至少公司还发工资，好多厂都倒闭了，知足吧」
 *   「Others have it worse; stop complaining.」
 *
 * 判据是**双腿共现**：
 *   腿① SUFFER 更惨参照系——第三方/群体/往事的**具体**苦难处境（连…都吃不上/睡大街/
 *         倒闭/失业/辍学/难民/战区/搬砖/通勤四小时/比你惨多了/starving/flooding…），
 *         或「比你+负面比较」。抽象的更惨/更不幸/更艰难（共情转述高频形）刻意不收。
 *   腿② DISMISS 压制诉求——别喊/别嫌/别抱怨/知足/想想/算什么/怎么了/还不满足/只是/
 *         就不错了/至少/起码/stop complaining/be grateful/at least…
 * 切分天然区分：共情转述（承认痛苦、不压制）、自陈比惨（第一人称「我比你惨」让位
 * suffering_contest 第78维 / suffering_capital）、正当统计比较（无具体苦难短语）。
 *
 * 五条守卫常量全部可被负例注入（scripts/negative-test-relative-pration.js）：
 *   RP_SELF_SUFFER 第一人称自陈比惨 → 让位 suffering_contest / suffering_capital
 *   RP_META        谬误概念转述（「所谓诉诸更惨，就是…」）
 *   RP_TEACH       教学/课堂转述
 *   RP_NEG_FLIP    否定翻转（「…但这不能抵消你的辛苦」）
 *   RP_HEDGE       对冲（「也许有人更惨，但你的辛苦也是真的」）
 */
'use strict';

// ── 腿①：更惨参照系 ──────────────────────────────────────────────
// ①-A 具体苦难处境（中文）——只收具体短语，刻意不收抽象「更惨/更不幸/更艰难」。
const RP_SUFFER_ZH = [
  '连[^。，！？!?]{0,10}(?:都|也)[^。，！？!?]{0,6}(?:没有|没|不|吃不上|喝不上|上不起|坐不起|看不起|买不起|活不下去|撑不下去|不让|没能)',
  '吃不上', '喝不上', '吃不饱', '没饭吃', '没水喝', '没学上', '不让念书', '没书读',
  '睡大街', '睡马路', '睡天桥', '没挺过来', '没走过来', '下不了床', '起不来床',
  '一身病', '一身的病', '没了爸妈', '没了父母', '没了双亲', '辍学', '失学',
  '难民', '战区', '战乱', '灾区', '灾民', '穷苦人家',
  '倒闭', '破产', '失业', '没工作', '没班上', '被赶出来', '被裁员', '被辞退', '被开除',
  '搬砖', '全年无休', '通勤[两三四五六]?[个]?小时', '熬夜到天亮', '没坐过飞机', '没出过国',
  '看不起病', '买不起房', '租不起房', '活不下去', '撑不下去', '揭不开锅',
  '大山里', '山沟里', '山区', '西部',
  '(?:多少|有人|别人|其他人|人家|还有的人|好多人|许多人|多少人)[^。，！？!?]{0,8}躺[在床]',
  'roof over your head',
].map((s) => new RegExp(s, 'i'));

// ①-B 负面比较（比你+惨/苦/累/低…）。
const RP_COMPARATIVE_ZH = [
  '(?:比你|比咱们|比人家|比大多数人|比你强|比你惨)[^。，！？!?]{0,10}(?:惨|苦|累|穷|差|难|低|惨多了|苦得多|累得多|得多|一半|十倍|百倍|万倍)',
].map((s) => new RegExp(s));

// ①-B2 极小化「还有」形——「至少还有五险一金/至少还有人要你」：你仍拥有 X
// 反衬他人没有 X。排除良性「还有」宾语（备份/方案/时间/机会/数据/我们/你…），
// 否则「至少我们还有备份，系统可以恢复」会被误判。
const RP_MINIMIZE_HAVE = [
  /(?:至少|起码|好歹)[^。，！？!?]{0,12}(?:还有|也是有|也算有)(?!(?:备份|预案|方案|计划|退路|时间|机会|数据|证据|依据|支撑|选择|余地|我们|你))/,
].map((r) => r);

// ①-C 主体标记 × 弱势处境（有人+倒闭 / others+starving 等组合）。
const RP_SUBJECT_ZH = [
  '有人', '多少人', '好多人', '许多人', '人家', '别人', '其他人', '还有的人',
  '以前的人', '以前的女孩子', '以前的女性', '我们当年', '当年', '小时候',
  '非洲', '灾区', '战区', '山里的孩子', '大山里的孩子', '山区的孩子',
  'others', 'other people', 'some people', 'many people', 'other cities',
  'people in', 'children in', 'africa',
  'people are', 'people have', 'people would', 'some have', 'some are', 'others have',
].map((s) => new RegExp(s, 'i'));

const RP_WEAK_ZH = [
  '倒闭', '失业', '没工作', '难民', '战争', '战乱', '灾区', '辍学', '失学',
  '吃不上', '吃不饱', '喝不上', '没饭吃', '睡大街', '搬砖', '全年无休',
  '通勤', '熬夜', '没坐过', '上不起', '看不起病', '买不起', '租不起', '没学上',
  '一身病', '没了爸妈', '不让念书', '活不下去', '想上还没上', '都没吭声', '都不吭声',
  'worse off', 'starving', 'starve', 'homeless', 'nothing', 'never win',
  'no internet', 'walk ten miles', 'flooding', 'war zones', 'would kill for',
].map((s) => new RegExp(s, 'i'));

// ── 腿②：压制诉求 ──────────────────────────────────────────────
const RP_DISMISS_ZH = [
  '别[喊叫抱怨吐槽嫌]', '少[喊抱怨]', '不许[喊抱怨]', '不准[喊抱怨]', '别再[喊抱怨]',
  '知足', '要知足', '该知足', '知足吧', '就知足',
  '还不满足', '别不满足', '太不知足',
  '算什么', '这算什么', '算什么呀', '有什么大不了',
  '[吃点]?[苦累]?怎么了', '有什么大不了',
  '想想', '多想想', '想想看',
  '至少', '起码', '好歹',
  '就不错了', '不错了', '就知足了', '算好的了',
  '只是', '不过是', '罢了', '而已',
  '别[喊叫]疼', '别怕苦', '别怕累', '别身在福中不知福',
  '有什么好[抱怨喊嫌]', '偷着乐', '庆幸吧', '该庆幸',
  '别[不知足]',
].map((s) => new RegExp(s));

const RP_DISMISS_EN = [
  /stop\s+complaining/i,
  /stop\s+whining/i,
  /quit\s+(?:whining|complaining)/i,
  /be\s+grateful/i,
  /count\s+your\s+blessings/i,
  /how\s+can\s+you\s+complain/i,
  /what\s+do\s+you\s+have\s+to\s+complain/i,
  /others?\s+have\s+it\s+worse/i,
  /you\s+have\s+it\s+easy/i,
  /at\s+least/i,
].map((r) => r);

// ── 守卫常量（可被负例注入）────────────────────────────────────
// 第一人称自陈比惨 → 让位 suffering_contest（第78维）/ suffering_capital。
// 只收「我+比你+惨/苦」与「我+当年/这些年+苦」形；「我们当年饭都吃不饱」是
// 泛指往事参照（腿①成立的本族攻击样本），刻意不收，避免误豁免。
const RP_SELF_SUFFER = [
  /我[^。，！？!?]{0,12}(?:比你|比他|比她|比大家|比各位)[^。，！？!?]{0,8}(?:惨|苦|累|穷|惨多了|苦得多|累得多|十倍|百倍)/,
  /我(?:当年|小时候|这些年|这半年|这一辈子|经历过的苦|受过的苦)[^。，！？!?]{0,20}(?:苦|罪|委屈|累|惨|磨难|不容易)/,
].map((r) => r);

// 谬误概念转述（谈论这个谬误本身）。
const RP_META = [
  /诉诸更惨/, /相对剥夺/, /比惨/, /苦情营销/, /卖惨/,
  /relative\s+privation/i, /appeal\s+to\s+worse\s+problems/i,
  /fallacy/i, /谬误/, /逻辑错误/, /错误论证/, /伪逻辑/,
].map((r) => r);

// 教学/课堂转述。
const RP_TEACH = [
  /教学/, /课[堂程]/, /教材/, /教案/, /课件/, /讲义/, /这节课/, /老师/, /学生/, /课堂讨论/, /随堂/,
  /lecture/i, /textbook/i, /teach/i, /lesson/i, /syllabus/i,
].map((r) => r);

// 否定翻转（先具体后承认：不能抵消/不代表…）。
const RP_NEG_FLIP = [
  /不能抵消/, /无法抵消/, /抵消不了/, /不代表/, /并不意味着/, /不该用来/, /不能用来/,
  /不是[^。，]{0,10}理由/, /无权[^。，]{0,10}(?:抵消|否定|取消|抹杀)/,
  /不是忽视[^。，]{0,10}的理由/, /也是真的/, /同样成立/,
  /still\s+valid/i, /deserves?\s+(?:attention|to\s+be\s+heard)/i,
  /does\s+not\s+(?:mean|negate)/i, /cannot\s+(?:be\s+used\s+to\s+)?(?:cancel|negate|dismiss)/i,
].map((r) => r);

// 对冲（也许/可能更惨，但…）。
const RP_HEDGE = [
  /也许/, /可能/, /未必/, /不一定/, /或许/,
  /perhaps/i, /maybe/i, /not\s+necessarily/i, /might\s+not/i,
].map((r) => r);

// 强压制标记（别喊/知足/stop complaining 等，命中加权重）。
const RP_DISMISS_STRONG_ZH = ['别喊', '别抱怨', '别嫌', '别吐槽', '知足', '还不满足', '算什么', '别喊疼', '别怕苦', '别怕累', '有什么好抱怨'];
const RP_DISMISS_STRONG_EN = [/stop\s+complaining/i, /stop\s+whining/i, /be\s+grateful/i, /how\s+can\s+you\s+complain/i];

const _any = (arr, text) => arr.some((r) => r.test(text));

/**
 * 第 156 维度 relative_pration（诉诸更惨）判别。
 * @param {string} text 归一化文本
 * @returns {{score: number, name: string}}
 */
function checkRelativePrivation(text) {
  if (typeof text !== 'string' || text.length === 0) return { score: 0, name: 'relative_pration', count: 0 };

  // 守卫：任一豁免命中即整体放行（负例注入逐条验证承重）。
  if (_any(RP_SELF_SUFFER, text)) return { score: 0, name: 'relative_pration', count: 0 };
  if (_any(RP_META, text)) return { score: 0, name: 'relative_pration', count: 0 };
  if (_any(RP_TEACH, text)) return { score: 0, name: 'relative_pration', count: 0 };
  if (_any(RP_NEG_FLIP, text)) return { score: 0, name: 'relative_pration', count: 0 };
  if (_any(RP_HEDGE, text)) return { score: 0, name: 'relative_pration', count: 0 };

  // 腿①：具体苦难处境 OR 负面比较 OR（主体标记 × 弱势处境）。
  const sufferHit = _any(RP_SUFFER_ZH, text) || _any(RP_COMPARATIVE_ZH, text) || _any(RP_MINIMIZE_HAVE, text)
    || (_any(RP_SUBJECT_ZH, text) && _any(RP_WEAK_ZH, text));
  if (!sufferHit) return { score: 0, name: 'relative_pration', count: 0 };

  // 腿②：压制诉求。
  const dismissHit = _any(RP_DISMISS_ZH, text) || _any(RP_DISMISS_EN, text);
  if (!dismissHit) return { score: 0, name: 'relative_pration', count: 0 };

  // 双腿共现 → 命中，按共现强度加权。
  let score = 60;
  if (_any(RP_COMPARATIVE_ZH, text)) score += 15;
  const sufferCount = RP_SUFFER_ZH.filter((r) => r.test(text)).length;
  if (sufferCount >= 2) score += 10;
  if (RP_DISMISS_STRONG_ZH.some((w) => text.includes(w)) || _any(RP_DISMISS_STRONG_EN, text)) score += 10;
  if (sufferHit && dismissHit && /[！？!?]/.test(text)) score += 5;
  score = Math.min(score, 95);

  return { score, name: 'relative_pration', count: 1 };
}

module.exports = {
  checkRelativePrivation,
  CONSTANTS: {
    RP_SUFFER_ZH, RP_COMPARATIVE_ZH, RP_MINIMIZE_HAVE, RP_SUBJECT_ZH, RP_WEAK_ZH,
    RP_DISMISS_ZH, RP_DISMISS_EN,
    RP_SELF_SUFFER, RP_META, RP_TEACH, RP_NEG_FLIP, RP_HEDGE,
    RP_DISMISS_STRONG_ZH, RP_DISMISS_STRONG_EN,
  },
};
