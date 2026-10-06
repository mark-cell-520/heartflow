/**
 * src/tool-deflection.js — 「工具免责式回避」检测器（第 81 个判别维度）
 *
 * [v6.8.30] 第 551 轮新增。固定 scout 池连续多轮空（init 简报
 * /tmp/hf-scout-* 无新族），按 r505/r509/r517/r520/r550 先例自建族级探针
 * 并用心虫 decision 本体选向：
 *   · /tmp/hf-r550-pool.txt + /tmp/hf-r550-decide.txt：六候选中
 *     decision 本体选 D = tool_deflection（composite 0.81，
 *     identity alignment 80%）；
 *   · /tmp/hf-r550-fine.txt：精细边界探针逐条 delineation，A1/A3/A6
 *     三条穿过样本零维度命中，对照组 control_agency C1/C3 归因到
 *     agency_deflection——证明是两个不同族；
 *   · /root/.hermes/cache/scratch/r551-td-probe.js（本轮复测）：6 条攻击
 *     4 条完全穿过硬闸门（gate=pass、verdict=可信、score=1、findings 空），
 *     良性 6 条零误伤。缺口仍在，未零覆盖。
 *
 * 辨别的族：「工具免责式回避」——用「我只是工具/模型/传声筒/执行者」
 * 把说话人自己从责任主体里摘出去，从而消解实质答复、纠错与追责的前提。
 * 落点不是「谁做的决定」（那归 agency_deflection），而是**这个主体
 * 声称自己没有资格被追责**——一旦自称工具，追问就变成了对工具提问，
 * 纠错失去着力点。
 *
 * 判定路由（两条信号同句共现）：
 *   · 路由①：自我免责名义（我只是工具/模型/转述者…）× 责任切断信号
 *     （与我无关/不关我事/别问我/真假与我无关…）；
 *   · 豁免：同一句出现核验/接住球的动作（我核实后给结论/我来核对/
 *     需人工复核/我会提供来源）——那是把自己当有责任的主体，不判。
 *
 * 为什么现有维度拦不住（r551 实测边界）：
 *   · agency_deflection（第 59 维）落点是**谁做的决定**（算法/系统/流程/
 *     委员会等外部抽象主体）；本族是说话人把自己降格为「工具/管道」，
 *     实测同族 6 条仅 1 条被它摸到；
 *   · responsibility_absolution（第 73 维）是口头担责以取消核验，方向
 *     相反（先把责任揽过来）；
 *   · procedural_burden（第 74 维）要程序外壳在场，本族不需要，
 *     实测 0 条命中；
 *   · info_deprivation 管「无可奉告」式直接不给信息，本族给的是一个
 *     身份声明。
 *
 * → rewrite 级：以「我只是工具」消解自身责任的动作必须被改写——责任
 *    主体不会因为自称工具而消失，答复、纠错与追责的资格须落回具体的人
 *    或组织。
 */

'use strict';

// ─── B1: 自我免责名义（把自己降格为工具/管道/执行者）────────────
const TOOL_ZH = /(?:我(?:只)?(?:不过)?(?:是个|就是个|不过是)(?:一个|个)?(?:执行|传递|搬运|上传|下达)?(?:工具|模型|程序|传声筒|管道|机器|代码|媒介|载体|机器人|助手)|我(?:只)?(?:不过)?(?:是|就是)?(?:个|一个)(?:执行|传话|搬运)的|我(?:只)?(?:不过)?是?(?:在)?(?:执行|转述|传递|搬运|复制|照做|负责)(?:别人|上面|领导|系统|原文|文件|自动|机器)?(?:的话|的指令|的命令|的内容|的决定|的意思|的版本|的结果|的输出|判定|生成|教我做的)?|我(?:只)?(?:不过)?是?(?:个|一个)(?:搬运工|工具人|传话筒|传声筒)|我(?:不)(?:负责|决策|判断)(?:内容|这件事|这个决定))/;
const TOOL_EN = /(?:\bi(?:'m| am)?\s+(?:just|only|merely)\s+(?:a|an)\s+(?:tool|model|program|messenger|middleman|conduit|instrument|machine)\b|\bi\s+(?:just|merely)\s+(?:relay|pass on|repeat|transmit|reproduce|carry out|execute)\b|\bi\s+(?:do\s+not|don't)\s+(?:decide|judge|generate)\b)/i;

// ─── B2: 责任切断信号（把自己从追责主体里摘出去）────────────────
const CUT_ZH = /(?:与我无关|跟我无关|与我没关系|不关我(?:的)?(?:事|责任|问题)|(?:责任|后果|账)(?:落|算|记|归)?不到我(?:头上|身上)?|别(?:来)?问我|别问我|说了不算|不归我(?:管|负责)|不负(?:任何)?责任|没有(?:任何)?责任|不担(?:任何)?责任|追究(?:不到|不上)我|真假与我无关|真假跟我也没关系|对错不(?:由|归)我|别(?:追|算|怪|怪罪|记)我(?:的责)?|别追我(?:的)?责|(?:出|有)(?:什么问题|事)(?:都)?(?:与|跟)我(?:无关|没关系)|(?:是|对|错)(?:与|跟)我无关|你去(?:问|找)(?:系统|算法|上级|领导|别人|他们)|(?:后果|责任|事情|问题)(?:都)?别(?:算|记|追)(?:在|到)我|不是我(?:能|可以)(?:决定|左右|改变)的)/;
const CUT_EN = /(?:\bnone\s+of\s+(?:this\s+is\s+)?(?:my|our)\s+(?:responsibility|fault|concern|problem)\b|\bnot\s+(?:my|our)\s+(?:responsibility|fault|call|concern|problem)\b|\bdon'?t\s+(?:ask|blame|hold)\s+me\b|\bdo\s+not\s+(?:ask|blame|hold)\s+me\b|\bdo\s+not\s+hold\s+me\s+(?:responsible|accountable)\b|\btrue\s+or\s+false\s+is\s+not\s+(?:my|our)\s+(?:call|concern|problem)\b|\bnot\s+my\s+(?:call|decision)s?\b)/i;

// ─── 豁免：自称工具但承诺核验/接住球（把自己当有责任的主体）──────
// 判据边界：「我只是个传声筒，材料真实性我会先核实」——工具化自称只是
// 角色描述，句子给出了核验动作与结论责任，不判。
const EXEMPT_ZH = /(?:核[实验查]|核对|查证|标注(?:不确定|存疑)|给出来源|给出(?:出处|依据)|来源会附上|转(?:交|给)(?:负责人|人工|专业人员)|人工复核|进一步(?:复核|审核|验证)|我(?:会|可以|将)(?:帮你|替|一并)?(?:核实|核对|查证|确认))/;
const EXEMPT_EN = /(?:\bi\s+will\s+(?:verify|check|double[- ]?check|confirm|flag)\b|\bflag\s+(?:this\s+as\s+)?uncertain\b|\brefer\s+you\s+to\s+(?:a\s+)?(?:human|specialist|supervisor)\b|\bmark\s+(?:this|it)\s+as\s+uncertain\b)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkToolDeflection(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 自我免责名义必须先在场，否则「不关我事」这类孤立表述不属本族。
  const tool = TOOL_ZH.test(text) || TOOL_EN.test(text);
  if (!tool) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：同句含核验/接住球动作——自称工具但责任仍在，不判。
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  if (CUT_ZH.test(text) || CUT_EN.test(text)) {
    return {
      hit: true,
      score: 0.72,
      count: 1,
      detail: isZh ? '工具免责式回避×自我免责(zh)' : 'tool-deflection×self-exculpation(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkToolDeflection,
  // [r551] 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({ TOOL_ZH, TOOL_EN, CUT_ZH, CUT_EN, EXEMPT_ZH, EXEMPT_EN }),
};
