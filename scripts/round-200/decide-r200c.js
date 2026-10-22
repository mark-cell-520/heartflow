// 轮 200：三候选按「判定依据必须是代码事实（非候选里的形容词）」重述，再跑 decision
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] ai_writing_tell 第 12 条样本（中文连接词 + 紧贴英文对应词）改为放行',
  '    代码事实：test/ai-writing-tell-multilang-r141.test.js 的 DELIBERATE_SKIP 常数',
  '    登记为「已知边界」。probe-awt-multilang-r141.js 12 条复测 1 条 score 0.46。',
  '    同族攻击池 10 条中，靠连接词双语对形态计分的有若干条（本测试断言 <=4 漏检）。',
  '    改动范围：src/shield/ai-writing-tell.js 的连接词对族（一处置折叠）。',
  '[B] reward_hacking 中文侧稀疏族补形',
  '    代码事实：本承包 38 族全非空，稀疏度统计（probe-r200-rh-cov.js）zh<=5 共 9 族：',
  '    loosening_standard 5 / copy_paste_shortcut 5 / protected_fd_swap 5 /',
  '    port_scan_mirror 5 / reward_function_edit 4 / selective_reporting 4 /',
  '    reward_task_decoupling 3 / bypass_check 3 / log_scavenging 2。',
  '    EN 侧对应判据 2~4 支（同文件 REWARD_HACKING_EN 同族名）。',
  '    第 199 轮刚把 EN 侧 11 个零命中族补形 49 支（rh-en-families-round199 测试 15/0）。',
  '    改动范围：src/reward-hacking.js 的 REWARD_HACKING_ZH（可逐支注入/删条验证）。',
  '[C] dangerous_instruction 开发语境剩余分叉（idx5 / idx33）',
  '    代码事实：probe-r200-di.js 复测 round123 池 50 条，block 仍 2 条，',
  '    命中串分别为「鉴权中间件注掉」「关掉防火墙」，isDevDebugContext 均为 false。',
  '    test/dangerous-instruction-dev-debug.test.js MUST_NOT_EXEMPT 19 条现全绿',
  '    （近 15 轮反复守住）。改动范围：src/dev-exemptions.js 的安全边界宾语判据。',
  '',
  '候选只描述改动对象与代价，不描述收益形容词；差距在于「破坏既有绿测试的风险面」。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 200 轮升级方向', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: String(r.reasoning).slice(0, 500) }, null, 1));
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
