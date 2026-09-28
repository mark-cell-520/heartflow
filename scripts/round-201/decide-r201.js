// 轮 201：三候选选向（候选描述只含形状与实测数字，不含样本原文）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] 全维度「同源叠票」系统性扫描与修复（第 6 次同型复现的方向）',
  '    背景：同源叠票（同一词表/同一文本片段被多族或多维度当成独立证据）已 5 次同型复现：',
  '      第 130 轮 TIER1/2/3 合并、第 131 轮 transitions 并入、第 132 轮 templated-frames 归并、',
  '      第 141 轮 tier-attributive 折叠、第 142 轮跨维度折叠、第 200 轮 transitions↔double-connective。',
  '    可行性：高——第 132 轮的「区间交集探针」已固化方法，只需写成可复用扫描器覆盖全部 shield 维度。',
  '    攻击回归面：低——扫描器只报告候选族对，是否折叠需逐对过攻击池验证。',
  '    收益可验证性：高——每对可注入/删条验证，与 130/132/141/142/200 五轮完全同构。',
  '[B] reward_hacking 中文侧稀疏族补形（9 个族 zh<=5：loosening_standard 5 /',
  '    copy_paste_shortcut 5 / protected_fd_swap 5 / port_scan_mirror 5 / reward_function_edit 4 /',
  '    selective_reporting 4 / reward_task_decoupling 3 / bypass_check 3 / log_scavenging 2）',
  '    可行性：高——EN 侧每族 2-3 支现成对称；第 199 轮已用同法收割英文侧 9 个空转族。',
  '    攻击回归面：低——新增判据在良性池 43 条 + 326 条基线上逐支验证。',
  '    收益可验证性：高——每支可单独注入/删条验证。',
  '[C] dangerous_instruction 开发语境剩余 2 条 block 分叉（round123 池复测 2 条）',
  '    可行性：低——第 124/125 轮 MUST_NOT_EXEMPT 19 条逐条守住的边界，idx5 属 SECURITY_BOUNDARY',
  '      设计内，idx33 属防火墙真实安全边界；两条都触及一票否决语义而非槽位缺口。',
  '    攻击回归面：高——放宽 SECURITY_BOUNDARY 宾语判据直接影响 di 主防线。',
  '    收益可验证性：低——每条豁免都要单独跑攻击回归池。',
  '',
  '本轮背景：run-all 6557/0 全绿；bidirectional-guard 301/326（0 新增）；LLM 401 未解只能本地纯规则；',
  '第 200 轮已把 ai_writing_tell 最后一处连接词对误伤修到 gate=pass，多语误伤池 12 条非 pass 0 条。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 201 轮升级方向', prompt });
  console.log(JSON.stringify({
    chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning,
    options: (r.all_options || []).map(o => [o.id, o.composite]),
    composite: r.composite || null,
  }, null, 1));
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
