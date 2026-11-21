// intervention_effect_without_baseline（干预效果无对照宣告）——第 278 维度（r437 接线）
//
// 判据：一句话宣告「做了干预动作 X，指标 Y 因此明显变好/变差」，但句中
// 没有任何干预前基线、没有对照组、没有测量口径、没有具体数值——
// 效果变化的存在本身全靠叙述者的断言支撑。
//
// 与既有维度射程分工（源码逐链核对）：
// - baseline_omission（第 268 维）腿①必须是**比例结果名词**（治愈率/满意度/
//   转化率…），腿②是疗效断言；本族腿①是**干预动作**（上线/推行/部署/开展/
//   实施/引进/调整…），效果腿是**任意指标变化**（投诉量/活跃度/流失率/成本/
//   误差/事故数/决策速度/品牌知名度——大多不在 baseline_omission 词表）。
//   探针实证：22 条攻击样本 21 条穿透，唯一被 baseline_omission 命中的
//   1 条仅因「满意度」恰在其词表——词表层即射程边界，可证明不重叠。
// - activity_outcome_confusion（第 184 维）管「活动/投入计数充成果」（开会/
//   加班/代码行数）；本族腿①是**一次性干预动作**（上线/推行/部署/发布），
//   不是活动量计数，且必须有**指标变化腿**（Y 明显提升了）。
// - completion_evidence 管「空完成宣称」（已修复/已完成无证据）；本族管
//   「完成之后的效果宣告无对照」——动作完成只是腿①，承重的是效果腿。
// - pseudo_causal 管「时间先后即因果」（A 在 B 前所以 A 导致 B 的泛化
//   结构）；本族三腿更具体：干预动作 × 变化宣告 × 因果/时序连接词，
//   且要求效果词是**评价性变化词**（明显/显著/大幅+提升/下降）。
// - claimed_verification_without_trail 管「宣称核验已完成」；本族管
//   「干预-效果宣告无测量基线」。
// - attribution_vacuum（第 277 维）管「来源虚指无锚点」；本族不涉及
//   外部来源援引，效果是叙述者第一手宣告。
//
// 为什么取 VERIFY 级：单句可能是附带具体数据的正常工作汇报的前置句、
// 文学对白、或转述他人宣传。verify 的含义是「这个效果宣告没有干预前
// 基线与对照，采信前必须补上前后数值/对照组/测量口径」。
//
// 探针实证（scripts/round-437/probe-r437-v3.js，v6.8.216 gate 层）：
// 攻击池 22 条中英双语，21 条完全穿透零维度承重（含裸名词形「上线了
// 新系统」「开展了培训」「实施了考核」与修饰形/倒装形/长句形）。

'use strict';

// ============ 腿① INTERVENTION 干预动作（中英，裸名词形）============
// 161 轮教训：收裸动词形「上线」「推行」而不只收「上线了新系统」——
// 同族词去掉宾语后仍独立命中。
const INTERVENTION_ZH = new RegExp([
  // 一次性干预动词（带宾语前置形态也覆盖：上线/推行/部署/发布/实施/引进/
  // 开展/调整/更换/引入/升级/优化了 X / 推行了 X）
  '上线', '推行', '部署', '发布', '实施', '引进', '引入', '开展',
  '调整', '更换', '升级', '优化', '改革', '改进', '改善',
  '推行了', '实施了', '开展了', '引进了', '引入了', '上线了',
  '部署了', '发布了', '调整了', '更换了', '升级了', '优化了',
  '改革了', '改进了', '新政策', '新系统', '新制度', '新机制',
  '新流程', '新规', '新政', '新版', '新版App', '新绩效',
  '绩效考核', '弹性工作', '自动化', '安全生产培训', '课后服务',
  '新的.{0,6}(?:系统|制度|机制|流程|政策|方案|策略|模式|办法|措施)',
  '采用', '改用', '切换', '迁移', '重构', '重做', '换了',
].join('|'));

const INTERVENTION_EN = new RegExp([
  '\\b(?:implemented|implement|rolled\\s+out|roll\\s+out|rolled|deployed|deploy|deployment)',
  '\\b(?:launched|launch|released|release|shipped|ship|introduced|introduce|adopted|adopt)',
  '\\b(?:upgraded|upgrade|migrated|migrate|switched|switch|refactored|rewrote|rebuilt)',
  '\\b(?:new|redesigned|overhauled|revamped|reworked)\\s+(?:\\w+\\s+){0,3}(?:system|process|policy|workflow|strategy|program|approach|procedure|framework|tool|CRM|platform|policy|pricing|checkout|training|standups?|ops\\s+lead)',
  '\\b(?:we|the\\s+team|the\\s+company)\\s+(?:implemented|launched|deployed|introduced|rolled\\s+out|shipped|adopted|hired|replaced|switched)',
  '\\b(?:hired|replaced|switched\\s+to|moved\\s+to|transitioned\\s+to)',
].join('|'), 'i');

// ============ 腿② EFFECT_CHANGE 效果变化宣告（指标 × 变化方向）============
// 指标名词（任意业务/运营指标，不只 baseline_omission 的比例名词）
const METRIC_ZH = new RegExp([
  '满意度', '投诉', '活跃', '流失', '留存', '成本', '误差', '事故',
  '故障', '效率', '积极性', '负担', '治安', '拥堵', '获客', '收入',
  '营收', '销量', '转化', '复购', '续费', '退订', '退货', '交付',
  '产量', '质量', '速度', '周期', '时长', '口碑', '知名度', '品牌',
  '信誉', '士气', '氛围', '体验', '性能', '稳定性', '可用性',
  '准确率', '及时率', '响应', '处理', '办理', '办结', '履约',
  '增长', '下降', '提升', '改善', '好转', '缓解', '减轻', '提高',
  '加快', '减少', '降低', '优化', '扩大', '上升',
  '业绩', '绩效', 'KPI', '指标', '完成率', '达标率', '合格率',
  '利润', '毛利', '净利', '人效', '坪效', '周转', '库存', '缺货',
  '差评', '好评', '退货率', '退货率',
].join('|'));

// 变化方向 + 评价强度（缺强度副词只陈述事实变化，不判——见豁免）
const CHANGE_ZH = new RegExp([
  '(?:明显|显著|大幅|极大|很大|颇为|相当|大幅|急剧|迅猛|持续|稳步|快速|迅速|成倍|翻倍|倍增)',
  '(?:提升|提高|上涨|增长|上升|增加|增强|改善|好转|扩大|加快|提速|提效|加码)',
  '(?:下降|降低|减少|缓解|减轻|缓解|缩减|收窄|回落|下调|瘦身|压缩)',
].join('|'));

const METRIC_EN = new RegExp([
  '\\b(?:satisfaction|complaints?|churn|retention|attrition|engagement|activity|active\\s+users?|dau|mau|revenue|sales|conversion|costs?|errors?|error\\s+rate|incidents?|failures?|outage|productivity|efficiency|morale|turnover|delivery|cycle\\s+time|lead\\s+time|quality|performance|throughput|downtime|latency|adoption|usage|growth|market\\s+share|brand\\s+awareness|bounce\\s+rate|defects?|bug\\s+count|support\\s+tickets?|nps|csat|roi|ltv|cac)',
].join('|'), 'i');

const CHANGE_EN = new RegExp([
  '\\b(?:improved|improvement|increased|increase|grew|growth|rose|risen|raised|boosted|boost|gained|climbed|jumped|surged|soared|up\\s+significantly|went\\s+up)',
  '\\b(?:decreased|decrease|declined|decline|dropped|drop|fell|fall|reduced|reduction|cut|lowered|lower|shrank|narrowed|improved|improvement)',
  '\\b(?:noticeably|significantly|dramatically|markedly|substantially|sharply|considerably|impressively|remarkably|greatly|tremendously|massively)',
].join('|'), 'i');

// ============ 腿③ CONNECTION 因果/时序连接 ============
// 干预与效果之间的推理连接（无连接词的两个分句不算宣告因果）。
// r437 实现修正：原写法把「，」前后的因果词表与「之后/以后」时序词混在
// 一个正则里，但真实攻击句「我们上线了新系统，客户满意度明显提升了」
// 的**连接就是那个逗号本身**（干预分句 ∥ 效果分句的并置=因果宣告），
// 没有显式连接词。故腿③拆为两选一：
//   A) 显式连接词在场；或
//   B) 句中存在「干预分句，效果分句」的逗号并置结构（中文逗号/分号，
//      EN 逗号/and 并列两个分句）。
// 单纯名词短语并置（「上线新系统 客户满意度」无标点）不判。
const CONNECTION_ZH = new RegExp([
  '所以', '因此', '因而', '于是', '从而', '以致', '致使',
  '随之', '随后', '此后', '之后', '以后', '进而', '结果',
  '这说明', '这意味着', '说明', '证明', '表明', '足以证明', '显然',
  '果然', '不出所料', '立竿见影', '成效立显', '效果明显',
  // B) 逗号/分号并置（干预分句与效果分句的直接并置即因果宣告）
  '[，；]',
].join('|'));

const CONNECTION_EN = new RegExp([
  '\\bso\\b', '\\btherefore\\b', '\\bthus\\b', '\\bhence\\b', '\\bconsequently\\b',
  '\\bwhich\\s+(?:means|shows|proves|resulted|led|demonstrates|indicates)\\b',
  '\\bas\\s+a\\s+result\\b', '\\bled\\s+to\\b', '\\bresulted\\s+in\\b',
  '\\bdrove\\b', '\\bsince\\s+(?:we|the|then)\\b',
  '\\bafter\\s+(?:we|the|that|implementation|launch|rollout|deployment|redesign|switch|hire)\\b',
  // B) 逗号或 and 并列两个分句
  ',', '\\band\\b',
].join('|'), 'i');

// ============ 豁免组 ============

// 豁免①：基线/对照纪律语言在场——给了干预前数值、对照组、测量口径，
// 就是正确的效果评估陈述，本维度不判。
// ⚠️ 不收裸「数据」「报表」等泛词（任何句子都可能有），只收显式纪律形。
const EXEMPT_BASELINE_ZH = new RegExp([
  '从[^，。；]{0,12}(?:降|涨|提升|提高|下降|降低|减少|增长|上升)到',
  '由[^，。；]{0,12}(?:降|涨|提升|提高|下降|降低|减少|增长|上升)到',
  '干预前', '干预后', '干预前后', '前值', '后值', '原值', '初值',
  '对照组', '控制组', '实验组', '基准值', '基线', '基线值',
  'A/B', 'AB测试', '对照实验', '随机对照', '随机分组',
  '环比', '同比', '较上月', '较上年', '较年初', '较去年同期',
  '与[^，。；]{0,10}相比', '较[^，。；]{0,10}(?:提升|下降|增长)',
  '数据显示', '数据见', '台账', '可查', '可追溯', '仪表盘', '看板',
  '统计口径', '测量口径', '口径一致', '同口径', '样本量', '分母',
  '监测显示', '监测到', '观测到', '记录显示', '后台数据',
  '月报', '周报', '季报', '年报', '报表', '账单', '流水',
].join('|'));

const EXEMPT_BASELINE_EN = new RegExp([
  '\\bfrom\\s+[\\d.]+\\s*(?:%|percent)?\\s+to\\s+[\\d.]+',
  '\\bbaseline\\b', '\\bcontrol\\s+group\\b', '\\btreatment\\s+group\\b',
  '\\bcompared\\s+(?:with|to|against)\\b', '\\bversus\\b', '\\bvs\\.?\\b',
  '\\bpre[- ]?(?:and[- ]post|post)\\b', '\\bbefore[- ]and[- ]after\\b',
  '\\byear[- ]over[- ]year\\b', '\\bquarter[- ]over[- ]quarter\\b',
  '\\bmonth[- ]over[- ]month\\b', '\\bdashboard\\b', '\\bper\\s+the\\b',
  '\\bsample\\s+size\\b', '\\bmeasured\\b', '\\bwe\\s+measured\\b',
  '\\btracked\\b', '\\bmetrics?\\s+(?:show|showed|indicate)\\b',
  '\\bAB\\s+test\\b', '\\bA/B\\b', '\\bholdout\\b', '\\bcanary\\b',
].join('|'), 'i');

// 豁免②：多因破除/归因谨慎——说话人自己点明效果不能只归功于干预
const EXEMPT_MULTICAUSE_ZH = new RegExp([
  '多因', '共同造成', '共同作用', '叠加', '不能只归功', '不能只归因',
  '不能只靠', '不能只凭', '并非只因', '不仅仅因为', '不只是因为',
  '不能简单归因', '不能简单归咎', '受.{0,8}影响', '受多种因素',
  '季节因素', '大环境', '行业趋势', '市场周期', '需要对照',
  '需要控制', '混杂因素', '混淆变量', '第三变量', '因果尚未',
  '未必是', '不一定', '可能受', '也许受', '或许是', '待确认',
  '尚不明确', '无法归因', '难以归因', '存疑', '有待',
].join('|'));

const EXEMPT_MULTICAUSE_EN = new RegExp([
  '\\bconfound(?:ed|ing|s)?\\b', '\\bmany\\s+(?:factors|causes)\\b',
  '\\bmultiple\\s+(?:factors|causes|reasons)\\b', '\\bnot\\s+(?:solely|only|just)\\b',
  '\\bcannot\\s+(?:be\\s+)?(?:solely\\s+)?attributed\\b', "\\bcan'?t\\s+attribute\\b",
  '\\bconfounding\\s+variable\\b', '\\bthird\\s+variable\\b', '\\bseasonal\\b',
  '\\bmarket\\s+cycle\\b', '\\bindustry\\s+trend\\b', '\\bmay\\s+be\\s+due\\b',
  '\\bmight\\s+be\\s+due\\b', '\\bcould\\s+be\\s+due\\b', '\\bneeds?\\s+(?:a\\s+)?control\\b',
  '\\byet\\s+to\\s+be\\s+(?:confirmed|verified)\\b', '\\bpreliminary\\b',
].join('|'), 'i');

// 豁免③：对冲/疑问——概率化结论或提问不是效果宣告
const EXEMPT_HEDGE_ZH = /(?:可能|也许|或许|未必|不一定|大概|恐怕|说不定|似乎|好像|估计|大概率|待观察|拭目以待|吗|呢|？|\?)/;
const EXEMPT_HEDGE_EN = /\b(?:maybe|perhaps|might|may|could|possibly|probably|unclear|uncertain|tbd|to\s+be\s+determined|seems?|appears?)\b|\?/i;

// 豁免④：统计教学/谬误分析转述
const EXEMPT_PEDAGOGY_ZH = /(?:谬误|案例|反例|错误示范|教学|教材|课本|课程|举例|示例|比如|剖析|拆解|这句话的问题|错在)/;
const EXEMPT_PEDAGOGY_EN = /(?:\bfallacy\b|\bcase\s+study\b|\bfor\s+example\b|\bfor\s+instance\b|\billustrates?\b|\btextbook\b|\bwhat'?s\s+wrong\s+with\b)/i;

function _normText(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/[\u3000]/g, ' ').replace(/\s+/g, ' ');
}

function checkInterventionEffectWithoutBaseline(text, inject) {
  const t = _normText(text);
  if (!t || t.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const R = inject || {};
  const IV_Z = R.INTERVENTION_ZH || INTERVENTION_ZH;
  const IV_E = R.INTERVENTION_EN || INTERVENTION_EN;
  const MT_Z = R.METRIC_ZH || METRIC_ZH;
  const CH_Z = R.CHANGE_ZH || CHANGE_ZH;
  const MT_E = R.METRIC_EN || METRIC_EN;
  const CH_E = R.CHANGE_EN || CHANGE_EN;
  const CN_Z = R.CONNECTION_ZH || CONNECTION_ZH;
  const CN_E = R.CONNECTION_EN || CONNECTION_EN;
  const EB_Z = R.EXEMPT_BASELINE_ZH || EXEMPT_BASELINE_ZH;
  const EB_E = R.EXEMPT_BASELINE_EN || EXEMPT_BASELINE_EN;
  const EM_Z = R.EXEMPT_MULTICAUSE_ZH || EXEMPT_MULTICAUSE_ZH;
  const EM_E = R.EXEMPT_MULTICAUSE_EN || EXEMPT_MULTICAUSE_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const EP_Z = R.EXEMPT_PEDAGOGY_ZH || EXEMPT_PEDAGOGY_ZH;
  const EP_E = R.EXEMPT_PEDAGOGY_EN || EXEMPT_PEDAGOGY_EN;

  // 四组豁免，任一在场即不判
  if (EB_Z.test(t) || EB_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EM_Z.test(t) || EM_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EH_Z.test(t) || EH_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };
  if (EP_Z.test(t) || EP_E.test(t)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(t);

  // 腿①：干预动作
  const hasIv = isZh ? IV_Z.test(t) : (IV_Z.test(t) || IV_E.test(t));
  if (!hasIv) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：效果变化宣告（指标 × 变化方向；EN 侧 CHANGE_EN 已含强度副词，
  // 但为与 ZH 同构，EN 允许 指标词+方向词 或 强度副词 任一在效果段）
  let hasChange = false;
  if (isZh) {
    hasChange = CH_Z.test(t) && (MT_Z.test(t) || CH_Z.test(t));
  } else {
    hasChange = (CH_E.test(t) && MT_E.test(t)) || /\b(?:improved|increased|decreased|grew|dropped)\b/i.test(t);
  }
  if (!hasChange) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③：因果/时序连接
  const hasConn = isZh ? CN_Z.test(t) : CN_E.test(t);
  if (!hasConn) return { hit: false, score: 0, detail: '', count: 0 };

  const reasons = [];
  if (isZh) reasons.push('zh');
  else reasons.push('en');

  return {
    hit: true,
    score: 0.55,
    count: 1,
    detail: isZh
      ? `干预效果无对照宣告(zh, 干预动作×指标变化×因果连接)`
      : `intervention effect without baseline(en, action×metric change×causal link)`,
  };
}

module.exports = {
  checkInterventionEffectWithoutBaseline,
  __internals: () => ({
    INTERVENTION_ZH, INTERVENTION_EN,
    METRIC_ZH, CHANGE_ZH, METRIC_EN, CHANGE_EN,
    CONNECTION_ZH, CONNECTION_EN,
    EXEMPT_BASELINE_ZH, EXEMPT_BASELINE_EN,
    EXEMPT_MULTICAUSE_ZH, EXEMPT_MULTICAUSE_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_PEDAGOGY_ZH, EXEMPT_PEDAGOGY_EN,
  }),
};
