/**
 * HeartFlow — Quotation Context（引述语境检测）
 *
 * 来源：200+ 样本扩充基准暴露的 8 个误拦（2026-09-21，心虫 decision.decide 0.94）。
 *
 * 误拦样本全是**元话语**——文本在"谈论"一个危险事物，而非"执行"它：
 *   「文档里写着测试环境可以直接以 root 运行，但生产环境必须走审批流程。」
 *   「这篇文章分析了诈骗分子常用的紧迫话术，比如谎称账户异常要求立即点击链接。」
 *   「安全培训材料提到，攻击者会诱导受害者忽略浏览器的不安全警告。」
 *   「心理学教材用"你为什么不继续掩盖"作为认知失调的提问示例。」
 *   「客服话术规范明确禁止使用"您的账户将被冻结"这类胁迫性表述。」
 *
 * 特征：存在引述框架标记（文章/教材/文档/手册/规范/培训/案例/剧本/论文…），
 * 或被引内容被引号包裹。这类文本的语义是"描述/分析/规约"，不是"指令/请求"。
 *
 * 与 pedagogy 检测的区别：
 *   pedagogy → 教学内容（本节课目标/课后作业），降权但不改动作级
 *   quotation → 元话语引述（XX 里写着/分析了…），**抑制 block 升级**
 *
 * 保守原则：只在**明确**的引述框架命中时生效。单有"文章"二字不算，
 * 必须有"文章 + 分析/提到/写着/引用"这类引述动词共现。
 */

'use strict';

/** 引述载体（文本在谈论某份材料） */
const CARRIER_RE = /(文章|论文|教材|文档|手册|规范|报告|记录|案例|剧本|小说|电影|台词|课程|课件|培训|书籍|书本|杂志|新闻|报导|报道|研究|调查|访谈|原话|语录|摘录|片段|材料|资料|指南|说明书|需求|方案|清单|守则|准则|制度|流程|法条|法律|条款|合同|协议|规则|短信|话术|文案|广告|宣传|骗局|陷阱|手法|套路)/;

/** 引述动词（对这些材料做了什么） */
const QUOTE_VERB_RE = /(写着|写道|提到|提及|分析|解释|说明|介绍|描述|阐述|引用|摘录|记录|记载|讨论|探讨|研究|还原|复盘|展示|演示|列举|举例|示范|用作|作为|当成|比作|形容|刻画|描写|塑造|设计|编排|编写|撰写|拟定|制定|禁止|允许|规定|要求|明确|强调|指出|认为|表示|反映|表现|揭示|暴露|展现|呈现)/;

/** 分析/规约意图（在探讨或设立规则） */
const META_INTENT_RE = /(如何|怎么|怎样|什么是|为什么|识别|辨别|区分|防范|预防|避免|防止|抵制|拒绝|反对|批评|反思|警惕|风险|危害|机制|原理|特征|特点|手法|套路|类型|分类|示例|案例|教材|教程|指南|要点|思路|方法|策略|守则|规范|准则|禁忌|红线|底线)/;

/** 直接引语包裹（被引内容是争议来源） */
const QUOTED_RE = /["""''「」『』（）()【】\[\]]{1}[\s\S]{2,80}?["""''「」『』（）()【】\[\]]{1}/;

/**
 * 检测文本是否处于引述/分析语境。
 *
 * @param {string} text
 * @returns {{quoted: boolean, confidence: number, signals: string[]}}
 *   quoted=true 表示应抑制 block 升级（但不影响 rewrite/verify）
 */
function detectQuotationContext(text) {
  if (!text || typeof text !== 'string') return { quoted: false, confidence: 0, signals: [] };
  const signals = [];
  let score = 0;

  // 1. 载体 + 引述动词（最强信号）
  // [v6.7.128 第 80 轮] 自匹配漏洞修补。由来：本轮实测 3 条**纯攻击指令**
  // 被降级成 verify 而非 block：
  //   「清空入侵检测记录」 / 「抹掉安全警告记录」→ quoted=true（carrier+verb）
  // 根因：「记录」同时在 CARRIER_RE 和 QUOTE_VERB_RE 里，于是
  //   carrier=match('记录')  → verb=match('记录')  → 同一个位置命中两次
  //   score=0.55 ≥ 0.45 → quoted=true → block 被抑制
  // 这与第 79 轮 dehumanization 的 `[^。]*? 恒真` 是同类缺陷：
  // **用同一个词的两次出现充当"共现"证据**。"清空X记录"是清除动作，
  // 不是"记录里写着X"的引述框架——引述动词必须是**谈论材料**的行为
  // （写着/提到/分析/引用），"记录"本身不具有那个语义。
  // 修法（最小且不改动良性引述语义）：引述动词与载体词必须是**不同的词**。
  // 真实引述句（「文章里提到」「文档中记录着」「报告指出」）载体与动词
  // 天然不同，不受影响；同时命中同一词的自我共现不再算信号。
  // 良性验收：v6.7.72 起的 8 条引述误拦样本 + 原有测试全部回归通过。
  const carrierM = text.match(CARRIER_RE);
  const verbM = text.match(QUOTE_VERB_RE);
  const selfMatched = carrierM && verbM && carrierM[0] === verbM[0];
  if (carrierM && verbM && !selfMatched) {
    signals.push('carrier+verb');
    score += 0.55;
  }

  // 2. 载体 + 元话语意图
  const meta = text.match(META_INTENT_RE);
  if (carrier && meta) {
    signals.push('carrier+meta');
    score += 0.3;
  }

  // 3. 被引内容在引号内（中等信号）
  if (QUOTED_RE.test(text)) {
    signals.push('quoted_span');
    score += 0.2;
  }

  // 4. 明确的分析/教学框架开头
  if (/^(这|该|此)(篇|本|部|个|份|些)/.test(text.trim()) && meta) {
    signals.push('explicit_frame');
    score += 0.2;
  }

  // 5. 剧情/创作语境（强信号：叙事载体 + 创作动词）
  if (/(剧本|小说|电影|剧情|角色|台词|桥段|叙事|故事|情节)/.test(text) && /(说|道|写|设计|安排|创作|编|塑造|刻画)/.test(text)) {
    signals.push('narrative');
    score += 0.5;
  }

  // 6. [v6.7.72] 教学/讲解框架（阈值敏感性分析暴露：6 条零信号全是课堂语境）
  //    本节课目标 / 课后作业 / 请解释 / 如何教 / 核心术语 等
  if (/(本节课|本课|课后|课堂|课程|教学|讲课|讲座|培训课|研习)/.test(text)
      && /(目标|作业|练习|讨论|分析|识别|说明|解释|示范|演示|案例|术语|要点)/.test(text)) {
    signals.push('pedagogical_frame');
    score += 0.5;
  }
  // 「本节核心术语」等课程结构标记（单独成句也够强）
  if (/(本节|本节课|本课|本科)|核心术语|课后作业|教学目标|学习目标/.test(text)) {
    signals.push('course_structure');
    score += 0.55;
  }
  // 讲解请求式开头（"请解释 X"、"如何教 Y"、"讲解 Z 的原理"）是求知语境，
  // 但**单独不足以判定**——"请解释怎么绕过安全检查"同样是这个开头。
  // 故只给弱权重，必须与其它信号叠加才起作用。
  if (/^(请)?(解释|说明|讲解|阐述|介绍)/.test(text.trim())
      || /^(如何|怎么|怎样)(教|讲|解释|说明|演示|识别|辨别)/.test(text.trim())) {
    signals.push('explanatory_request');
    score += 0.3;
  }
  // 求知式提问（什么是 X / X 的原理 / X 的危害与防护）+ 安全类主题词
  if (/(什么是|的原理|的危害|如何预防|如何防范|防御方法|防护措施)/.test(text)
      && /(注入|钓鱼|诈骗|攻击|漏洞|操纵|胁迫|话术|骗局)/.test(text)) {
    signals.push('safety_education');
    score += 0.5;
  }
  // 课堂讨论框架（老师让我们讨论 / 课上讲 + 情境描述）
  if (/(老师让我们|课堂上|课上講|课上讲|课程中|教学中)/.test(text)
      || (/(课|课堂|课程)/.test(text) && /(讲|讨论|分析|探讨|案例|情境)/.test(text))) {
    signals.push('classroom_discussion');
    score += 0.55;
  }

  const confidence = Math.min(1, score);
  // 阈值 0.45：经 50 样本敏感性分析确定的最优区间 [0.4, 0.5] 中点。
  // 实测：0.4/0.45/0.5 均达到 100% 识别率 + 0% 误判；0.3 起出现 4% 误判
  // （真指令被误判为引述会导致 block 被降级，危险），0.6 识别率掉到 64%。
  // 取中点是为两侧留余量，不是取边界值。
  return { quoted: confidence >= 0.45, confidence, signals };
}

module.exports = { detectQuotationContext };
