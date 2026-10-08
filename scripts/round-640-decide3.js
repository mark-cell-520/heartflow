// r640: 三判 —— 前两次 5 候选 composite 全 0.74 平局返 null。
// 收窄为二选一（outputChecklist vs memoryIndex），并明确写出唯一可区分的
// 硬判据：是否直接坐落在心虫核心职责（输出 gate 判别链）上。
const { HeartFlowDecision } = require('../src/core/decision.js');

const prompt = [
  '心虫职责铁律：辨别者，只判对错好坏，不生成不推理不执行。',
  '本轮是「零可达 → 可 dispatch」接线，两个候选都已被实测确认 100% route not allowed：',
  '[A] outputChecklist（11 方法）：发送前逐项自检质量/安全/偏好/公正/道德边界/辨别，坐落在输出 gate 链路上，是「心虫自己的输出先过心虫自己的门」这条设计要求里缺失的一环。',
  '[B] memoryIndex（22 方法）：会话间连续性索引，自省数据类，不参与任何 gate 判定。',
  '请只按「哪一个让心虫的辨别能力被外部真正使用到」来判。'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '二选一：接哪个零可达引擎进 dispatch', prompt });
  console.log(JSON.stringify(r));
  process.exit(0);
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
