// percent_basis_shift（连续百分比变化基数变换谬误）——第 280 维度（r441 接线）
//
// 判据：一句话宣告**两次（或多次）百分比变化可以相互抵消、相加或平均**——
// 「先涨50%再跌50%，一来一回等于没涨没跌」——忽略每次百分比变化的基数
// 已被上一次变化改写：涨50%后基数是1.5，跌50%跌的是1.5的50%，净结果是
// 0.75 而不是 1。百分比变化是**乘法**不是加法，连续变化不可加、同幅涨跌
// 不互抵。
//
// 与既有维度射程分工（源码逐链核对）：
// - percentage_overflow（第 265 维）管**静态分配语境**下分项百分比之和
//   超过100（「A占60%、B占70%」），本族是**连续时间序列上的基数变换**，
//   没有分项分配语义。
// - statistical_misleading（第 58 维）管「基数隐藏的比例变化」——单次
//   比例变化不交代基数（「转化率提升了50%」但不说从多少到多少），本族
//   至少有两次变化且核心错误是**把两次变化做加法/抵消运算**。
// - count_rate_conflation（第 233 维）管绝对计数缺分母（「患者增加了
//   一倍」不知分母）；本族百分比与分母都在场，错在运算律误用。
// - perfect_error（第 55 维）的 METRIC_NOUNS 豁免会把带「占比」类度量
//   名词的句子整体放过；探针实测本族良性边缘样本「先涨50%又跌50%，
//   但从100元起步最后只有75元」恰被其误拦——射程相反，互不代管。
//
// 为什么取 VERIFY 级：单句可能是对他人口误的转述、金融科普的反例、
// 或作者正要指出基数问题的引子。verify 的含义是「这个抵消/相加结论
// 忽略了百分比变化的乘法本质，采信前必须按复利逐段计算净变化」。
//
// 探针实证（scripts/round-441/probe-r441-pool.js + probe-r441-pct.js，
// v6.8.217 gate 层）：攻击池 6+ 条中英双语（同幅涨跌 50/20/10/一成、
// 倒装、长句形）全部穿透零维度承重；良性池（单次变化/给了复利数值/
// 对冲）全部 pass。
//
// [r441 修复] 上一轮写入时正则字面量中的反斜杠被吞（\d→d、\.→.、\s→s、
// \u4e00-\u9fff→一-鿿），导致腿① PCT_ZH/PCT_EN/SEQUENCE_EN 全部失配、
// 攻击样本模块层 0 命中。本轮用 write_file 整文件重写修正（不再 patch）。

'use strict';

// ============ 腿① PCT_CHANGE 百分比变化事件（中英）============
// 161 轮教训：收裸动词形「涨」「跌」+ 数字%，不只收「涨了50%」——
// 同族词去掉宾语/助词后仍独立命中。
// 中文两种数字形：阿拉伯数字 + %/％；口语「一成/三成/两成/五成」。
// 注意：动词与数字%必须组合在**同一个分支**内（161 轮教训：分成两个并列
// 分支会让「涨」和「50%」各算一次事件，单次变化的句子也被误计为连续两次）。
// 且 EN 句中不得走 ZH 腿：ZH 分支要求动词左侧是中文语境（行首、中文
// 标点后、或中文字符后），否则 "then fell 50%" 里的裸英文字母串会被
// [^，。；！？]{0,10}? 跨语言误配成「ZH 百分比事件」。
const PCT_ZH = new RegExp([
  // 变化动词 × 阿拉伯数字百分比（动词与数字组合在**同一个字符串元素**内，
  // 再 join('|')——161 轮教训：拆成两个数组元素会让「涨」和「50%」各自
  // 成为顶层可选分支，单次变化句也被误计为连续两次事件）。
  // 动词左侧必须是行首或中文标点（EN 句 "then fell 50%" 中 fell 前是
  // 空格，不用 \s 避免 ZH 腿跨语言误配）。
  '(?:^|[，。；！？、（）()])(?:涨|上涨|升|上升|跌|下跌|降|下降|回落|下调|缩水|增长|减少|抬升|抬高|拉低|升值|贬值|涨幅|跌幅|反弹|跳水)[^，。；！？]{0,10}?\\d+(?:\\.\\d+)?\\s*[%％]',
  // 变化动词 × 口语成数（一/二/三/…/十/两成）
  '(?:^|[，。；！？、（）()])(?:涨|上涨|升|跌|下跌|降|下降|缩水|跳水)[^，.；！？]{0,4}(?:一|二|三|四|五|六|七|八|九|十|两)成',
  // 动词在句中（前面是任意非标点中文内容）——「股价先涨50%」的「先涨」
  // 左侧是「股价」而非标点。用「左侧非空中文串」形补收，同时要求右侧紧跟
  // 数字%/成数，不会把单独动词误计为事件。
  '[\\u4e00-\\u9fff]{1,6}(?:涨|上涨|升|上升|跌|下跌|降|下降|回落|下调|缩水|增长|减少|抬升|抬高|拉低|升值|贬值|涨幅|跌幅|反弹|跳水)[^，。；！？]{0,10}?\\d+(?:\\.\\d+)?\\s*[%％]',
  '[\\u4e00-\\u9fff]{1,6}(?:涨|上涨|升|跌|下跌|降|下降|缩水|跳水)[^，.；！？]{0,4}(?:一|二|三|四|五|六|七|八|九|十|两)成',
].join('|'));

const PCT_EN = new RegExp([
  // 变化动词 × 数字百分比（动词与数字组合在**同一个字符串元素**内——
  // 161 轮教训：拆成两个数组元素 join('|') 后，「rose」和「50%」各自成为
  // 顶层可选分支，单次变化的句子也会被计成两个事件）。
  '\\b(?:rose|risen|raise[ds]?|gain(?:ed)?|gained|climbed|climb|jumped|jump|surged|soared|grew|growth|up|fell|fall|fallen|dropped|drop|declined|decline|loss|losses|lost|shed|shrank|shrunk|down)\\b[^.]{0,12}?\\b\\d+(?:\\.\\d+)?\\s*(?:%|percent)(?=[^a-z]|\\s|$)',
  // 数字百分比 × 变化名词（"a 50% gain followed by..."）
  '\\b\\d+(?:\\.\\d+)?\\s*(?:%|percent)\\s+(?:gain|loss|rise|drop|decline|increase|decrease|jump|fall)\\b',
].join('|'), 'i');

// ============ 腿② SEQUENCE 连续两次变化 ============
// 同一句内出现两个百分比变化事件（count>=2），或显式时序链连接
// （先…再/又/然后/随后/接着/先…后；EN and then / then / after that /
// followed by）。两次变化是基数变换的必要条件——只有一次百分比变化的
// 句子（「股价去年涨了50%」）天然缺此腿。
const SEQUENCE_ZH = new RegExp([
  // 先…再/又/然后/随后/接着/继而/之后 显式时序链（中间可出现百分比变化）
  '先[^，。；]{0,14}(?:再|又|然后|随后|接着|继而|之后|后)[^，。；]{0,14}(?:涨|跌|升|降|成|%|％)',
  '[^，。；]{0,14}(?:再|又|然后|随后|接着|继而)[^，。；]{0,14}(?:涨|跌|升|降|成|%|％)',
  '一涨一跌', '涨了又跌', '跌了又涨',
  '连续(?:两次|两次以上|上涨|下跌)', '两[次个]?(?:涨跌|变化)',
  '又(?:涨|跌|升|降)了', '再(?:涨|跌|升|降)了',
  // 同一句两个百分比变化事件本身即构成连续变化（腿① count>=2 兜底路径，
  // 此条覆盖无显式连接词但同句给出两次百分比的句式）
  '[^，。；]{0,20}(?:涨|跌|升|降)[^，。；]{0,20}%[^，。；]{0,20}(?:涨|跌|升|降)[^，。；]{0,20}%',
].join('|'));

const SEQUENCE_EN = new RegExp([
  '\\b(?:and\\s+then|then\\s+(?:fell|rose|dropped|lost|gained|declined|rose|shrank|shrunk|up|down)|after\\s+that|followed\\s+by|first[^.]{0,24}then)\\b',
  '\\b(?:rose|gained|up|grew)[^.]{0,24}\\band\\s+(?:then\\s+)?(?:fell|lost|dropped|declined|shrank|down)\\b',
  '\\b(?:fell|lost|dropped|down)[^.]{0,24}\\band\\s+(?:then\\s+)?(?:rose|gained|up|grew|climbed)\\b',
  '\\b(?:yesterday|last\\s+\\w+)[^.]{0,16}\\b(?:today|this\\s+\\w+)\\b',
  '\\b\\d+(?:\\.\\d+)?\\s*%[^.]{0,24}\\b\\d+(?:\\.\\d+)?\\s*%\\b',
].join('|'), 'i');

// ============ 腿③ BASIS_CLAIM 抵消/相加/互换断言 ============
// 宣告净效果为零/回到起点/两次变化可加或可平均。轨A 显式抵消断言；
// 轨B 复利互换误用（把乘法当加法算：「涨跌相抵」「加起来正好」）。
const CANCEL_ZH = new RegExp([
  // 轨A：回到起点/净零
  '等于没涨没跌', '没涨没跌', '等于没变', '等于原价', '等于白[涨跌]',
  '回到[^，。；]{0,6}(?:起点|原点|原价|起点|原位|老样子)',
  '还是原价', '还是原样', '回到[^，。；]{0,4}(?:价|价码)',
  '扭平', '打平', '扯平', '抹平', '抵消', '抵平', '相抵',
  '一来一回', '一手进一手出', '正负相抵', '涨跌相抵',
  '白涨', '白跌', '白忙', '等于没[涨跌赚亏]',
  '不赚不亏', '没亏', '没赚', '没变化', '没有任何变化',
  '净变化?(?:为|是)?零', '净为零', '净收益?为零',
  '还是在[^，。；]{0,4}(?:水平|价位|位置)',
  // 轨B：可加/可平均运算断言
  '平均一下', '平均下来', '平均就是', '加起来', '相加',
  '涨幅[与和]跌幅', '一加一减',
].join('|'));

const CANCEL_EN = new RegExp([
  '\\bback\\s+to\\s+(?:square\\s+one|where\\s+(?:it|we|you|they)\\s+(?:started|began)|the\\s+(?:original|starting|same)\\s+(?:price|point|level|value))\\b',
  '\\bexactly\\s+where\\s+(?:it|we)\\s+started\\b',
  '\\bends?\\s+up\\s+(?:unchanged|where\\s+(?:it|we)\\s+started|the\\s+same)\\b',
  '\\bended\\s+up\\s+(?:unchanged|where\\s+(?:it|we)\\s+started)\\b',
  '\\bleaving\\s+it\\s+(?:exactly\\s+)?(?:where\\s+(?:it|we)\\s+(?:started|began)|unchanged|back\\s+at)\\b',
  '\\bleaves?\\s+(?:it|the\\s+value|them)\\s+(?:exactly\\s+)?(?:where\\s+(?:it|we)\\s+(?:started|began)|unchanged|back\\s+at)\\b',
  '\\b(?:it|we)\\s+(?:began|started)\\s+(?:the\\s+day|unchanged)\\b',
  '\\bno\\s+net\\s+(?:change|effect|gain|loss|movement)\\b',
  '\\bnets?\\s+(?:to\\s+)?(?:zero|nothing)\\b',
  '\\bnet\\s+(?:change|effect|gain|loss)\\s+(?:is|of|was)\\s+zero\\b',
  '\\bcancels?\\s+out\\b', '\\bcancel(?:led)?\\s+each\\s+other\\b',
  '\\bnegate\\s+each\\s+other\\b', '\\bwashed\\s+out\\b',
  '\\bbreak\\s*even\\b', '\\bas\\s+if\\s+nothing\\s+happened\\b',
  '\\bzero\\s+sum\\b',
  '\\baverage(?:d)?\\s+out\\s+to\\s+zero\\b',
  '\\badd(?:ed)?\\s+(?:them\\s+)?(?:up\\s+)?(?:together\\s+)?(?:and\\s+)?(?:get|got)\\s+zero\\b',
].join('|'), 'i');

// ============ 豁免组 ============

// 豁免①：正确复利/基数纪律语言在场——给出逐段数值、点明基数改变、
// 明确净变化非零、或讨论复利概念本身。这正是本维度要的纪律。
const EXEMPT_COMPOUND_ZH = new RegExp([
  '从[^，。；]{0,12}(?:涨|升|提高|增加)到[^，。；]{0,12}再',
  '由[^，。；]{0,12}(?:涨|升|提高|增加)到[^，。；]{0,12}再',
  '基数', '基期', '复利', '连乘', '相乘', '乘法', '不是加法',
  '不能相加', '不可加', '不能简单相加', '不能直接相加', '不能抵消',
  '不是简单', '净值?(?:为|是)?[^，。；]{0,4}\\d',
  '最终(?:只|仅|剩)?有?\\d', '最后(?:只|仅|剩)?有?\\d',
  '剩[下了]?\\d', '结果是?\\d', '相当于\\d',
  '实际(?:收益率|回报|涨幅)', '年化', '几何平均',
  '验算', '按复利', '精确(?:计算|值)',
].join('|'));

const EXEMPT_COMPOUND_EN = new RegExp([
  '\\bfrom\\s+[\\d.,]+\\s+to\\s+[\\d.,]+\\b',
  '\\bbaseline\\b', '\\bcompounded\\b', '\\bcompound\\s+(?:interest|growth|return)\\b',
  '\\bmultiplicative\\b', '\\bmultiply\\b', '\\bnot\\s+additive\\b',
  "\\bcan'?t\\s+(?:just\\s+)?(?:add|cancel|offset)\\b",
  '\\bcannot\\s+(?:be\\s+)?(?:added|cancelled|canceled|offset)\\b',
  '\\bnet\\s+(?:result|change|effect)\\s+(?:is|of|was)\\s+[\\d.]+\\s*%?\\b',
  '\\bends?\\s+(?:up\\s+)?at\\s+[\\d.,]+\\b', '\\bfinal\\s+value\\b',
  '\\bpercentage\\s+points?\\b',
  '\\bgeometric\\s+mean\\b', '\\bannualized\\b',
  '\\breal\\s+(?:return|yield)\\b',
].join('|'), 'i');

// 豁免②：统计教学/谬误分析转述——在讨论这个概念本身
const EXEMPT_PEDAGOGY_ZH = /(?:谬误|案例|反例|错误示范|教学|教材|课本|课程|举例|示例|比如|剖析|拆解|这句话的问题|错在|常见误区|误区|误解|科普|反例)/;

const EXEMPT_PEDAGOGY_EN = /(?:\bfallacy\b|\bcase\s+study\b|\bfor\s+example\b|\bfor\s+instance\b|\billustrates?\b|\btextbook\b|\bwhat'?s\s+wrong\s+with\b|\bcommon\s+misconception\b|\bmisunderstood\b|\bmistake\b)/i;

// 豁免③：对冲/疑问——概率化结论或提问不是抵消宣告
const EXEMPT_HEDGE_ZH = /(?:可能|也许|或许|未必|不一定|大概|恐怕|说不定|似乎|好像|估计|待观察|吗|呢|？|\?)/;
const EXEMPT_HEDGE_EN = /\b(?:maybe|perhaps|might|may|could|possibly|probably|unclear|uncertain|tbd|seems?|appears?)\b|\?/i;

function _normText(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/[\u3000]/g, ' ').replace(/\s+/g, ' ');
}

function _countMatches(text, re) {
  const m = text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  return m ? m.length : 0;
}

function checkPercentBasisShift(text, inject) {
  const t = _normText(text);
  if (!t || t.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const R = inject || {};
  const P_Z = R.PCT_ZH || PCT_ZH;
  const P_E = R.PCT_EN || PCT_EN;
  const S_Z = R.SEQUENCE_ZH || SEQUENCE_ZH;
  const S_E = R.SEQUENCE_EN || SEQUENCE_EN;
  const C_Z = R.CANCEL_ZH || CANCEL_ZH;
  const C_E = R.CANCEL_EN || CANCEL_EN;
  const EC_Z = R.EXEMPT_COMPOUND_ZH || EXEMPT_COMPOUND_ZH;
  const EC_E = R.EXEMPT_COMPOUND_EN || EXEMPT_COMPOUND_EN;
  const EP_Z = R.EXEMPT_PEDAGOGY_ZH || EXEMPT_PEDAGOGY_ZH;
  const EP_E = R.EXEMPT_PEDAGOGY_EN || EXEMPT_PEDAGOGY_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;

  // 四组豁免，任一在场即不判
  if (EC_Z.test(t) || EC_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EP_Z.test(t) || EP_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EH_Z.test(t) || EH_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(t) && !P_E.test(t);

  // 腿①：百分比变化事件在场
  const hasPct = isZh ? P_Z.test(t) : (P_Z.test(t) || P_E.test(t));
  if (!hasPct) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：连续两次变化——A) 同句两个 PCT 事件；或 B) 显式时序链连接
  const pctCount = _countMatches(t, isZh ? P_Z : P_E);
  const hasSeq = pctCount >= 2 || (isZh ? S_Z.test(t) : S_E.test(t));
  if (!hasSeq) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③：抵消/相加/互换断言
  const hasCancel = isZh ? (C_Z.test(t) || C_E.test(t)) : C_E.test(t);
  if (!hasCancel) return { hit: false, score: 0, detail: '', count: 0 };

  const reasons = [];
  if (pctCount >= 2) reasons.push('pct×' + pctCount);
  if (isZh ? S_Z.test(t) : S_E.test(t)) reasons.push('seq');
  reasons.push(isZh ? 'zh' : 'en');

  return {
    hit: true,
    score: 0.55,
    count: 1,
    detail: `百分比连续涨跌基数变换(${reasons.join(', ')}, 变化不可加/同幅不互抵)`,
  };
}

module.exports = {
  checkPercentBasisShift,
  __internals: () => ({
    PCT_ZH, PCT_EN,
    SEQUENCE_ZH, SEQUENCE_EN,
    CANCEL_ZH, CANCEL_EN,
    EXEMPT_COMPOUND_ZH, EXEMPT_COMPOUND_EN,
    EXEMPT_PEDAGOGY_ZH, EXEMPT_PEDAGOGY_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
