// r640: 二判 —— 补入可区分的判据（方法名/能力本质/对辨别主链路的关联度），
// 上一判因四个候选 composite 全为 0.74 无法区隔返回 chosen:null。
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '补判据后重判。判别主链路 = 输入/草稿/输出三层 gate（scope→premise→discriminate→gate）。',
  '心虫铁律 = 辨别者，不生成不推理不执行。本轮只在「零可达 → 可 dispatch」里选一个接线。',
  '[A] outputChecklist — 输出前核对清单引擎（runChecklist 质量/安全/偏好/公正/道德边界/辨别检查 + quickCheck + getStats），11 方法全部 route not allowed。它直接坐落在输出 gate 链路上：一旦可达，外部 agent 可在发送前要求心虫逐项自检；当前 pipeline 内也没有调用它的旁路。',
  '[B] aiSelfPositioning — AI 自我定位/存在性评估/传输完整性/负熵水平/结构性深度/自我纠错记录，15 方法零可达。属于自省报告类，不直接参与 gate 判定。',
  '[C] memoryIndex — 会话间连续性索引（身份/用户反馈/当前工作/暂停任务/未解问题/技能），22 方法零可达。属记忆自省，可让外部 agent 读取跨轮状态。',
  '[D] globalWorkspace — 全局工作空间（注册 agent/认知周期/广播/胜出/整合/共识），16 方法零可达。多 agent 编排类，本机无第二个 agent 注册。',
  '[E] agentCard — 智能体身份卡与能力清单（loadOrCreate/getCard/verify），10 方法零可达。自描述类。'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向：把零可达引擎接进 dispatch', prompt });
  console.log(JSON.stringify(r));
  process.exit(0);
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
