// 轮 200：decision.decide 本体选向（三候选，均带实测证据）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] ai_writing_tell 多语言误伤剩余 1 条：第 141 轮修后 probe 复测 12 条多语正当',
  '    文本仍有 1 条误伤（连接词双语对照形，第 50 轮已判为攻击的「首先 Firstly」同型，',
  '    登记为 DELIBERATE_SKIP 边界，第 142 轮注释确认不可分）。决定修订该边界，把该形状',
  '    从误伤改为放行，需同步确认「首先 Firstly…其次 Secondly…」真 AI 样本仍计分。',
  '    改动面小、双向可验；但属边界取舍且可能削弱真 AI 检出。',
  '[B] reward_hacking 中文侧稀疏族补形：本承包 38 族全部非空，但 9 个族 zh<=5（最稀疏',
  '    为 log_scavenging zh=2 / bypass_check zh=3 / reward_task_decoupling zh=3，',
  '    selective_reporting zh=4 / reward_function_edit zh=4）。中文自然语序攻击零命中，',
  '    EN 侧 8-20 支可作对称对照。改动面可逐支删条验证，与第 199 轮同构。',
  '[C] dangerous_instruction 开发语境误拦剩余分叉：round123 池 50 条复测仍有 2 条',
  '    idx5(「鉴权中间件注掉」)、idx33(「关掉防火墙」)block，dev=false 未走豁免。',
  '    逐条窄豁免有放真攻击回来的风险（第 124/125 轮 19 条 MUST_NOT_EXEMPT 守住），',
  '    需大改判据或有意的边界取舍。',
  '',
  '选向判据（本轮背景）：rh 英文侧 38 族已全部饱和（第 199 轮收官），下一轮按铁律优先',
  '处理真缺口；run-all 6544/0 全绿，无存量失败；LLM 401 未解，只能做本地纯规则工作。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 200 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
