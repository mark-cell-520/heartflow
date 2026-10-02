// r378 方向选择：decision.decide 候选（不内联攻击话术，只用形状描述）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '[A] 维度覆盖扫描加中间态判定：唯一扫描未过项 multi_turn_escalation 1/2。上一轮已给该维度加独立非耦合层，单层命中不再触发 finding（qualifies 未降），扫描口径只读 gate.action，把「已识别但保守不判」误报成「完全没识别」。收益：扫描结果不再误导下一轮，且该中间态可复用到所有维度。上一轮遗留给明。',
  '[B] LADDERS 字段名契约护栏：第 377 轮 text.match(undefined) 回归的根因是耦合层写 up 字段而新独立层读 re 字段，字段名写错不报错。全表静态扫描 + 守卫。上一轮遗留，未复测是否还有其他层写错字段。',
  '[C] 加固第 377 轮 19 条守卫为三态断言：防止「信号不够强」式静默失败再次骗过上限式误伤断言。需先复测是否真红。',
  '[D] 仅扩良性样本池到 40 例以上。低风险低收益，不解决结构性缺口。'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 378 轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch((e) => { console.error('ERR', e && e.message); process.exit(1); });
