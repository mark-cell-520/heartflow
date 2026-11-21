// aggregation_overreach（聚合越界：多数/部分聚合量词 → 全称断言无效扩张）
// ——第 281 维度（r442 接线）
//
// 立意来源：arXiv 2405.02318《Translating Natural Language to First Order
// Logic for Logical Fallacy Detection》（HN 258 pts，配套仓库
// lovishchopra/NL2FOL）——该论文用 NL→FOL 翻译把自然语言论证转成一阶
// 逻辑再检验推理有效性，其数据集核心族就是**量词辖域与存在性误用**。
// 心虫是纯规则引擎不引 LLM（论文原路线依赖 transformers/torch，不采纳），
// 但借其「量词严格性」立意，把其中规则化程度最高的一族落为规则维度：
// 聚合量词（大多数/多数/部分/一些/几个/不少/过半）在结论侧被静默升级
// 为全称量词（所有/全部/每个/一律/无一例外/全体）——**前提的统计幅度
// 与结论的断言幅度不一致**，这就是 aggregation_overreach。
//
// 为什么是无效推理：逻辑上，∃x(Px) 或「大多数 x(Px)」推不出 ∀x(Px)。
// 从「我见过几个程序员穿连帽衫」到「所有程序员都穿连帽衫」，前提只
// 支持存在性/统计性结论，结论却宣称全称有效性——中间没有任何归纳
// 桥梁（抽样框、样本量、置信度）就被静默抹平。这是最常见的日常统计
// 谬误，比显式 hasty_generalization 更隐蔽：后者通常伴随「以偏概全」
// 的显式叙事，本族常以 **「可见/足见/这说明/足以证明」直接缝合**。
//
// 与既有维度射程分工（源码逐链核对）：
// - hasty_generalization（第 55 族）管「小样本 → 泛化」的**叙事族**：
//   「我遇到三个人都这样，所以这世界就是这样」——叙事主体在场、样本
//   故事在场；本族只管**聚合量词 → 全称断言**的量化词缝合结构，不需要
//   叙事在场。
// - law_of_small_numbers（r440 接线）管小样本的统计显著性错觉（「连抛
//   三次正面说明硬币均匀」）；本族不涉及随机性/显著性。
// - quantifier_scope_shift（第 258 维）管**辖域移位**（∀x∃y ↔ ∃y∀x）：
//   「每个人都爱一个人」推出「有一个人大家都爱」——嵌套量词换序；
//   本族是**单层聚合量词在全称侧被放大**，不涉及嵌套换序。
// - illicit_conversion（第 167 维）管全称命题换位（所有A是B→所有B是A）；
//   本族不改换主谓位置，只放大量化幅度。
// - stereotype（第 55 族附近）管群体属性定型叙事；本族可命中不带任何
//   情感色彩的纯统计句（「大多数用户点了同意，可见全体用户都认可」）。
// - ecological_fallacy（第 211 维）管群体统计 → 个体推断；本族是聚合
//   内部（多数）→ 更大聚合（全体）的幅度扩张，方向相反。
// - appeal_to_majority（第 149 维）管「多数人相信所以是真的」——诉诸
//   信念人数；本族是「多数样本有属性所以全体有属性」——诉诸属性覆盖
//   面，不是真理诉诸。
//
// 为什么取 VERIFY 级：单句可能是对他人言论的转述、作者正要纠正的前
// 提、或抽样框恰好覆盖全域的特例。verify 的含义是「结论的全称幅度超
// 过了前提的聚合幅度，采信前必须给出抽样框与样本量，或把结论降级为
// 统计表述」。
//
// 探针实证（scripts/round-442/probe-r442-gap.js，v6.8.217 gate 层）：
// 「大多数网民支持这个政策，可见全体网民一致支持。」中英双语全部
// 穿透零维度承重（action=pass）。

'use strict';

// ============ 腿① AGGREGATE 聚合量词（非全称的存在/统计幅度）============
// 161 轮教训：收裸名词形，不收只带后缀形。聚合量词本身是完整词，无后缀
// 问题；但「过半/过半以上/五成以上」等口语形必须显式收录。
// EN: most / a majority of / the majority of / many / some / several /
// a few / a number of / quite a few / a good portion of。
// 注意不收 all/every/each/no/none（那些是全称/单称，归腿②）。
const AGG_ZH = new RegExp([
  '大多[数人个]?', '大多[数量]', '多数', '大部[分人个调访问研究]?', '大部分',
  '过半', '过半以[上人]', '一半以[上人]', '五成以[上人]',
  '一些', '有些', '一部分', '部分',
  '几个', '几名', '数个', '不少[数人个]?',
  '相当一?部分', '相[当多]?[数量]?人',
  '广大', '普遍[是]?', '通常大多[数]?',
  '经常', '往往', '多数情况下',
  '常见的', '占多数', '占大半', '占大部',
].join('|'));

const AGG_EN = new RegExp([
  '\\bmost\\b', '\\bmostly\\b',
  '\\b(?:a|the)\\s+majority\\s+of\\b', '\\bmajority\\s+of\\b',
  '\\bmany\\b', '\\bsome\\b', '\\bseveral\\b',
  '\\ba\\s+few\\b', '\\bquite\\s+a\\s+few\\b',
  '\\ba\\s+(?:number|portion|good\\s+portion|lot|great\\s+deal)\\s+of\\b',
  '\\bplenty\\s+of\\b', '\\bnumerous\\b',
  '\\busually\\b', '\\bgenerally\\b', '\\btypically\\b', '\\boften\\b',
].join('|'), 'i');

// ============ 腿② UNIVERSAL 全称越界断言（聚合幅度被放大成全覆盖）============
// 结论侧宣称**无一例外**的覆盖面。161 轮教训：裸名词形「全部」「所有」
// 必须收；「无一例外」「一个不落」「清一色」等口语形显式收。
const UNI_ZH = new RegExp([
  '所有', '全部', '每一[个位种名类家]?', '每个',
  '全体', '统统', '一律', '皆', '悉数',
  '无一例外', '一个不落', '一个不漏', '清一色', '毫无例外',
  '都是', '全是', '都为', '皆[为是]',
  '人人', '个个', '大家', '谁[都也]',
  '百分之百', '百分百',
  '一概', '凡[是之]', '尽[数皆]',
].join('|'));

const UNI_EN = new RegExp([
  '\\ball\\b', '\\bevery\\b', '\\beveryone\\b', '\\beverybody\\b',
  '\\beach\\b', '\\bwithout\\s+exception\\b', '\\bno\\s+exceptions?\\b',
  '\\buniversal(?:ly)?\\b', '\\binvariably\\b', '\\balways\\b',
  '\\bthe\\s+entire\\b', '\\bthe\\s+whole\\b',
  '\\b100\\s*(?:%|percent)\\b', '\\bevery\\s+single\\b',
  '\\bnone\\s+(?:of\\s+(?:them|the\\s+\\w+)\\s+)?(?:disagree|object|oppose)\\b',
].join('|'), 'i');

// ============ 腿③ SEAL 缝合连接（聚合前提 → 全称结论的桥接断言）============
// 越界不是随便把两个词放一起，必须有**推论缝合**：可见/足见/这说明/
// 足以证明/因此/所以。没有缝合连接的两词共现（「大多数人喜欢咖啡，
// 所有菜单都有咖啡」）不是推理句，天然缺此腿，不会误判。
const SEAL_ZH = new RegExp([
  '可见', '足见', '这说明', '这证明', '足以证明', '足以说明',
  '因此', '所以', '故而', '可见一斑', '推而广之',
  '一句话', '说到底', '归根到底', '本质上[都]',
  '说明[他她它]?[们全体]?', '意味[着所有]', '表[明达][了所有]?',
].join('|'));

const SEAL_EN = new RegExp([
  '\\b(?:which|this)\\s+(?:shows?|proves?|means?|suggests?)\\b',
  '\\btherefore\\b', '\\bthus\\b', '\\bhence\\b', '\\bso\\s+all\\b',
  '\\bso\\s+every\\b', '\\bproves?\\s+that\\s+all\\b',
  '\\bshows?\\s+that\\s+all\\b', '\\bmeans?\\s+that\\s+all\\b',
  '\\bclearly\\s+all\\b', '\\bobviously\\s+all\\b',
].join('|'), 'i');

// ============ 豁免组 ============

// 豁免①：纪律语言在场——抽样框/样本量/统计限定/降级表述。这正是本维度
// 要的纪律：要么给出可核验的归纳桥梁，要么把结论降级为统计表述。
const EXEMPT_RIGOR_ZH = new RegExp([
  '抽样', '样本[量大小]', '随机', '置信', '误差范围', '置信区间',
  '不能推广', '不能代表', '不足以', '未必能', '没法推广',
  '统计[上学]?[的地]', '数据[显示表明]', '比例[是为]?\\d',
  '调[查研][显示发现表明结果]', '据调[查研]', '问卷[调查显示]?', '普查[显示数据]?',
  '只能说明', '只反映', '仅代表', '至多说明',
  '降级', '谨慎', '存疑', '有局限',
].join('|'));

const EXEMPT_RIGOR_EN = new RegExp([
  '\\bsample\\b', '\\bsampled\\b', '\\bsurvey(?:ed)?\\b', '\\bpoll(?:ed)?\\b',
  '\\bconfidence\\s+interval\\b', '\\bmargin\\s+of\\s+error\\b',
  "\\bcan'?t\\s+(?:generalize|conclude|infer)\\b",
  '\\bcannot\\s+(?:generalize|conclude|infer)\\b',
  '\\bnot\\s+representative\\b', '\\bself-?selected\\b',
  '\\bstatistically\\b', '\\bpercentage\\b', '\\bproportion\\b',
  '\\bonly\\s+(?:shows?|reflects?|indicates?)\\b',
  '\\bselected\\s+for\\b', '\\bvolunteers?\\b',
].join('|'), 'i');

// 豁免②：统计教学/谬误分析转述——在讨论这个概念本身
const EXEMPT_PEDAGOGY_ZH = /(?:谬误|案例|反例|错误示范|教学|教材|课本|课程|举例|示例|比如|剖析|拆解|这句话的问题|错在|常见误区|误区|误解|科普|以偏概全|逻辑错误|推理错误)/;
const EXEMPT_PEDAGOGY_EN = /(?:\bfallacy\b|\bcase\s+study\b|\bfor\s+example\b|\bfor\s+instance\b|\billustrates?\b|\btextbook\b|\bwhat'?s\s+wrong\s+with\b|\bcommon\s+misconception\b|\bmisunderstood\b|\bmistake\b|\bhasty\s+generalization\b)/i;

// 豁免③：对冲/疑问——概率化结论或提问不是全称宣告
const EXEMPT_HEDGE_ZH = /(?:可能|也许|或许|未必|不一定|大概|恐怕|说不定|似乎|好像|估计|待观察|吗|呢|？|\?)/;
const EXEMPT_HEDGE_EN = /\b(?:maybe|perhaps|might|may|could|possibly|probably|unclear|uncertain|tbd|seems?|appears?)\b|\?/i;

// 豁免④：单称与定义性语境——「所有人都会死」是定义/公理性陈述不是越界；
// 词典释义、数学定义、常识命题没有「聚合→全称」的扩张动作。
// 注意：此豁免只在前两腿**都**命中且句中含有定义/公理标记时生效。
const EXEMPT_DEFINITIONAL_ZH = /(?:定义|公理|定理|命题|恒等|必然|顾名思义|也就是说|即|换言之)/;
const EXEMPT_DEFINITIONAL_EN = /\b(?:definition|axiom|theorem|by\s+definition|tautology|necessarily|in\s+other\s+words|i\.e\.|e\.g\.)\b/i;

function _normText(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/[\u3000]/g, ' ').replace(/\s+/g, ' ');
}

function checkAggregationOverreach(text, inject) {
  const t = _normText(text);
  if (!t || t.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const R = inject || {};
  const A_Z = R.AGG_ZH || AGG_ZH;
  const A_E = R.AGG_EN || AGG_EN;
  const U_Z = R.UNI_ZH || UNI_ZH;
  const U_E = R.UNI_EN || UNI_EN;
  const S_Z = R.SEAL_ZH || SEAL_ZH;
  const S_E = R.SEAL_EN || SEAL_EN;
  const ER_Z = R.EXEMPT_RIGOR_ZH || EXEMPT_RIGOR_ZH;
  const ER_E = R.EXEMPT_RIGOR_EN || EXEMPT_RIGOR_EN;
  const EP_Z = R.EXEMPT_PEDAGOGY_ZH || EXEMPT_PEDAGOGY_ZH;
  const EP_E = R.EXEMPT_PEDAGOGY_EN || EXEMPT_PEDAGOGY_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const ED_Z = R.EXEMPT_DEFINITIONAL_ZH || EXEMPT_DEFINITIONAL_ZH;
  const ED_E = R.EXEMPT_DEFINITIONAL_EN || EXEMPT_DEFINITIONAL_EN;

  // 四组豁免，任一在场即不判
  if (ER_Z.test(t) || ER_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EP_Z.test(t) || EP_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EH_Z.test(t) || EH_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  // 语言分流：含中文且 EN 腿不命中 → 走 ZH 判据；否则双语都试（EN 句中
  // 可能夹中文名词，以 EN 腿为主判、ZH 腿兜底）
  const hasCJK = /[\u4e00-\u9fff]/.test(t);
  const enPct = A_E.test(t) || U_E.test(t);
  const isZh = hasCJK && !enPct;

  // 腿①：聚合量词在场
  const hasAgg = isZh ? A_Z.test(t) : (A_Z.test(t) || A_E.test(t));
  if (!hasAgg) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：全称断言在场
  const hasUni = isZh ? U_Z.test(t) : (U_Z.test(t) || U_E.test(t));
  if (!hasUni) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③：缝合连接在场（聚合前提 → 全称结论的推论桥接）
  const hasSeal = isZh ? S_Z.test(t) : (S_Z.test(t) || S_E.test(t));
  if (!hasSeal) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免④仅在定义/公理语境下生效
  if (ED_Z.test(t) || ED_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿间约束：AGG 与 UNI 必须**同一论证链**——某次 AGG 匹配与某次 UNI
  // 匹配位置间距 ≤40 字符，且中间不被句号/问号/感叹号/分号打断。
  // 无此约束会误伤跨主词句：「大多数人喜欢咖啡，所以所有咖啡馆都卖咖啡」
  // ——AGG 主词是「人」，UNI 主词是「咖啡馆」，是偷换主词不是聚合越界。
  // 只对 ZH 启用：EN 句 AGG→UNI 跨度常超 40（"A few students skipped
  // class, which proves that every student is lazy" = 48 字符），且 EN 的
  // SEAL 短语（so all / proves that all / which shows that all）本身就是
  // 强推论缝合，跨主词误伤风险低于 ZH。
  if (isZh) {
    const aggRe = new RegExp(A_Z.source, A_Z.flags.includes('g') ? A_Z.flags : A_Z.flags + 'g');
    const uniRe = new RegExp(U_Z.source, U_Z.flags.includes('g') ? U_Z.flags : U_Z.flags + 'g');
    // 提取量词匹配位置之后紧随的首个名词性词组（连续 2-6 个汉字）
    function _headNoun(text, from) {
      const m = /^[\u4e00-\u9fff]{2,6}/.exec(text.slice(from));
      return m ? m[0] : '';
    }
    // 人称主词：AGG 侧是「人」类群体
    const PERSON_HEAD = /^[\u4e00-\u9fff]*(?:人|民|众|客|户|员|生|者|家|师|生|友|迷|粉|孩|长|生|男|女|生|医|护|师|律|工|事|敌|伴|手|兵|官|民|商|农|工|警|乘客|观众|读者|用户|玩家|玩家)/;
    // 物件主词：UNI 侧是「物/机构」类
    const OBJECT_HEAD = /^[\u4e00-\u9fff]*(?:馆|店|房|车|机|路|街|楼|城|村|区|县|市|省|国|司|牌|品|商品|版|课程|科目|书|电影|歌|节目|方案|政策|制度|规定|标准|平台|网站|系统|软件|游戏|队伍|民族|国家|地区|学校|大学|医院|银行|酒店|餐馆|工厂|工地|项目|工程|楼盘|小区|房间|座位|航班|车次|菜单|货架|柜台|仓库|车间|工地|场馆|教室|宿舍|食堂|礼堂|剧院|影院|网吧|健身房|瑜伽馆|咖啡馆|奶茶店|火锅店|超市|商场|便利店|书店|花店|药店|诊所|美容院|理发店|洗车店|修车行|房产中介|律师事务所|会计事务所|设计公司|互联网公司|科技公司|创业公司|跨国企业|家族企业|国企|央企|外企|上市公司|初创公司|独角兽|平台|App|app|小程序|公众号|视频号|直播间|短视频|长视频|自媒体|新媒体|传统媒体|官方媒体|门户网站|搜索引擎|社交媒体|电商平台|团购网站|点评网站|旅游网站|招聘网站|教育网站|政府网站|企业官网|个人主页|博客|论坛|贴吧|知乎|微博|微信|QQ|钉钉|飞书|钉钉|企业微信|钉钉)/;
    // 主词错配：人称 × 物件 → 偷换主词（「多数人→所有咖啡馆」）
    // 宁放过不误伤：提取失败、两侧同为人称/同为物件、主词不清一律放行
    function _subjectMismatch(a, b) {
      if (!a || !b) return false;
      return PERSON_HEAD.test(a) && OBJECT_HEAD.test(b);
    }
    const aggPos = [];
    for (const m of t.matchAll(aggRe)) aggPos.push(m.index + m[0].length);
    const uniPos = [];
    for (const m of t.matchAll(uniRe)) uniPos.push(m.index + m[0].length);
    let chained = false;
    for (const ai of aggPos) {
      for (const ui of uniPos) {
        if (ui <= ai) continue;
        const span = t.slice(ai, ui);
        if (ui - ai <= 40 && !/[。；;？！?]/.test(span) &&
            !_subjectMismatch(_headNoun(t, ai), _headNoun(t, ui))) { chained = true; break; }
      }
      if (chained) break;
    }
    if (!chained) return { hit: false, score: 0, detail: '', count: 0 };
  }

  const reasons = ['agg', 'uni', 'seal'];
  return {
    hit: true,
    score: 0.55,
    count: 1,
    detail: `聚合越界(${reasons.join('×')}, ${isZh ? 'zh' : 'en'}：聚合量词的统计幅度被扩张为全称断言)`,
  };
}

module.exports = {
  checkAggregationOverreach,
  __internals: () => ({
    AGG_ZH, AGG_EN,
    UNI_ZH, UNI_EN,
    SEAL_ZH, SEAL_EN,
    EXEMPT_RIGOR_ZH, EXEMPT_RIGOR_EN,
    EXEMPT_PEDAGOGY_ZH, EXEMPT_PEDAGOGY_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_DEFINITIONAL_ZH, EXEMPT_DEFINITIONAL_EN,
  }),
};
