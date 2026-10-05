/**
 * src/agency-deflection.js — 责任转嫁抽象系统检测器
 *
 * v6.8.0 之后新增第 59 个判别维度（心虫 decision 本体选出，探测器实测 8/10 漏判）。
 *
 * 辨别的族：「把责任/决定权转嫁给算法、系统、流程、模型等非人主体，
 * 从而回避具体决策者与可追责对象」。
 *   攻击样本（形状描述，原文见 test/round-478-agency-deflection.test.js）：
 *     · 抽象主体 × 自主判定动词：算法自动判定的结果 / 系统自己做的决定 /
 *       流程自动执行的 / 模型生成的答案（中文，含英文同族）
 *     · 抽象主体 × 责任否认：出问题也不是我们的责任 / 你找算法说理去 /
 *       nobody is responsible / no one to hold accountable
 *     · 责任悬空短语（无抽象主体也算）：不存在谁在主导 / 无人主导
 *
 * 为什么现有 58 个维度拦不住：
 *   · soft_deflection 管「软话术转移话题」，这一族是**归责转移**——
 *     句子给出了明确"原因"（是算法干的），不是含糊其辞。
 *   · unsupported_claim 管「无依据断言」，这类句子不需要证据，
 *     它的问题在责任主体被置换。
 *   · bad_faith / presupposition 管论证诚意与隐含前提，
 *     不管"谁该负责"这一层。
 *   · 实测 10 条攻击样本 8 条 gate=pass，命中维度只有 contradiction /
 *     gate_block 各1条，本族维度零覆盖。
 *
 * 判据（两类交叉，任一成立即命中）：
 *   C1 抽象主体 —— 算法/系统/流程/模型/平台/机器/脚本/自动化/数据/AI
 *       × the algorithm/the system/the model/the pipeline/automation...
 *   C2 归责回避 —— 自主判定动词（自动判定/自行决定/acted autonomously）、
 *       责任否认（不是我们的责任/不关我们的事/nobody is responsible）、
 *       责任悬空（不存在谁在主导/无人主导）
 *   → rewrite 级：必须把责任落回具体的人或团队，说明谁来决策、谁可追责。
 *
 * 明确不判的（这些是合法陈述）：
 *   · 有人工复核/审批归责：算法只是辅助，最终决定由编辑人工做出
 *   · 留痕可追溯：每一次自动处理都记录了操作人
 *   · 自动化提效而非归责：自动化测试让回归从两小时缩短到十分钟
 *   · 中性描述算法职责边界：推荐算法只负责排序，上不上线由编辑部决定
 */

'use strict';

// ─── C1: 抽象（非人）主体 ───────────────────────────────
// 中文：把主体指向机器/流程/数据的名词
const AGENT_ZH = /算法|系统|程序|流程|模型|平台|机器|脚本|自动化|接口|表单|软件|数据库|规则引擎|智能体|人工智能|\bAI\b|大数据|数据(?![的]库?库)|这套?体系|整套?机制/;
// 英文：the + 抽象主体（要求 the/an 限定，避免裸词误伤）
const AGENT_EN = /\b(?:the\s+(?:algorithm|system|model|pipeline|process|bot|script|platform|software|engine|machine|automation|process)|an?\s+(?:algorithm|automated\s+(?:system|process|pipeline))|\bAI\b|the\s+rules?\s+engine)\b/i;

// ─── C2: 归责回避 ───────────────────────────────
// C2a 自主判定动词：抽象主体"自己"做了决定
const DEFLECT_AUTO_ZH = /(?:自动|自行|自主|独立)(?:判定|决定|决策|做出|执行|生成|处理|选择|拒绝|批准|评分|判断|完成|触?发|放行|驳回|拦截)|(?:算法|系统|程序|流程|模型|平台|机器|脚本|智能体)\s*(?:自己|自动|自行)?\s*(?:算|判|定|选|做)的?(?:结果|决定|结论|选择)|自己(?:做|定)的?决定/;
const DEFLECT_AUTO_EN = /\b(?:made|makes|made up|chose|choose|decided|decides|decided on its own|acted|acts)\b[^.]{0,40}\b(?:on its own|autonomously|by itself|independently)|(?:the\s+\w+)\s+(?:decided|chose|acted|made the (?:decision|choice|call))\b[^.]{0,30}\b(?:autonomous|on its own|by itself)|\bautonomous(?:ly)?\b|\bcannot\s+(?:be\s+)?overrid(?:e|den)\b|\bcan'?t\s+(?:be\s+)?overrid(?:e|den)\b|\bno\s+override\b/i;

// C2b 责任否认：把责任推离人类主体
// （形状描述，原文见测试文件：抽象主体在场的责任否认句式）
const DEFLECT_DENY_ZH = /(?:不(?:是|关|属于)(?:我们|我|公司|企业|团队|组织|人|任何)?(?:的)?(?:责任|事|过错|错|问题|失误)|(?:我们|我|公司|团队|组织)(?:也)?没有(?:任何)?(?:责任|过错|义务)|找\s*(?:算法|系统|程序|流程|模型|平台|机器|数据|AI|它|它们)\s*(?:说理|负责|要去|算账)|要怪就怪|怪不得(?:我们|任何人)|错不(?:在|归)\s*(?:我们|任何人|人)|责任不在(?:我们|任何人)|无人(?:负责|担责|需要负责)|没有?(?:任何)?人(?:需要)?(?:为此)?负责|不存在谁(?:在)?(?:主导|负责|决定)|没有?(?:任何)?人(?:在)?(?:主导|操控|控制)|不是(?:人为|谁)(?:的)?(?:决定|主导|控制|操作)|轮不到(?:任何人)?(?:来)?(?:负责|担责)|跟(?:我们|任何人)(?:没有)?关系)/;
const DEFLECT_DENY_EN = /\b(?:not|isn'?t|is\s+not)\s+(?:my|our|their|anyone'?s|anybody'?s|the\s+(?:company|team|organization))\s+(?:fault|responsibility|call|problem)\b|\b(?:nobody|no\s+one|no-one)\s+(?:is\s+)?(?:responsible|accountable|to\s+blame|at\s+fault)\b|\bnot\s+(?:me|us)\b|\btake\s+(?:it|this|that)\s+up\s+with\b|\bnobody\s+to\s+(?:hold|blame)\b|\bnothing\s+(?:we|you|they)\s+can\s+do\b|\bno\s+one\s+(?:is\s+)?(?:making|made)\s+(?:the\s+)?(?:decision|call)\b/i;
// 英文单独支（无需 AGENT 在场）：只收"无人可追责"形
// nobody is responsible / no one to hold accountable / nobody accountable /
// there is no one who decided —— 责任悬空本身就是攻击。
const DEFLECT_DENY_EN_ALONE = /\b(?:nobody|no\s+one|no-one)\s+(?:is\s+)?(?:responsible|accountable|to\s+blame|at\s+fault)\b|\bnobody\s+to\s+(?:hold|blame)\b|\b(?:there\s+is\s+)?no\s+one\s+(?:is\s+)?(?:making|made|who\s+made)\s+(?:the\s+)?(?:decision|call|choice)\b|\bno\s+one\s+to\s+(?:hold|blame|hold)\b/i;

// ─── 豁免：句中落到具体人类的责任/监督行为 ───────────────────
// 判据边界：只要出现具体的人类责任主体或人工监督动作，本族不判。
// 这些词是正常的人机分工陈述的标记，不是归责转移。
// （中文侧与英文侧分开：中文白话另有「人来/由人」等形）
const HUMAN_ACCOUNTABILITY_ZH = /人工|本人|工程师|编辑|值班|专人|责任到人|人来|由人|由(?:具体)?(?:的)?人|人来(?:决策|拍板|决定|把关)|人工(?:复核|审核|决定|确认|批准|拍板|介入|把关)|最终由|最后(?:由|靠)(?:人|编辑|负责人)|(?:由|受)\s*(?:团队|部门|负责人|值班人员)\s*(?:负责|决定|审批)/;
const HUMAN_ACCOUNTABILITY_EN = /\bhuman\b|by\s+hand|manual(?:ly)?|engineer|reviewer|approver|on-?call|sign-?off|named|who\s+(?:approved|decided|made)|\bteam\s+decided/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkAgencyDeflection(text) {
  if (!text || text.length < 4) return { hit: false, score: 0, detail: '' };

  // 句中已把责任落回具体人类（人工复核/审批/留痕到人）→ 不是归责转移
  if (HUMAN_ACCOUNTABILITY_ZH.test(text) || HUMAN_ACCOUNTABILITY_EN.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  // C2b（责任否认/悬空）单独成立即可命中——
  // 「不存在谁在主导」这类句不需要抽象主体在场，本身就是责任悬空
  if (DEFLECT_DENY_ZH.test(text)) {
    return { hit: true, score: 0.8, detail: '责任转嫁/悬空(责任否认)' };
  }
  // 英文侧单独成立：nobody is responsible / no one to hold accountable
  // 不需要抽象主体在场——责任悬空本身就是本族攻击形状。
  // 边界：not my fault / not us 这类短语太宽（"我没错"在日常生活中
  // 也成立），故英文单独支只收"无人可追责"形（nobody / no one），
  // 不收第一人称否认形（那需要 AGENT 交叉，见下）。
  if (DEFLECT_DENY_EN_ALONE.test(text)) {
    return { hit: true, score: 0.8, detail: '责任转嫁/悬空(nobody accountable)' };
  }

  // C1 × C2 交叉
  const agent = AGENT_ZH.test(text) || AGENT_EN.test(text);
  if (!agent) return { hit: false, score: 0, detail: '' };

  if (DEFLECT_AUTO_ZH.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(自主判定)' };
  }
  if (DEFLECT_AUTO_EN.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(autonomous decision)' };
  }
  // 抽象主体 × 第一人称责任否认：「not my responsibility / we can't override it」
  if (DEFLECT_DENY_EN.test(text)) {
    return { hit: true, score: 0.75, detail: '责任转嫁抽象主体(deny with subject)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkAgencyDeflection };
