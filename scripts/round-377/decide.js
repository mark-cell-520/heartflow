// r377 方向选择：候选均带实测证据
const path = require('path');
const { HeartFlowDecision } = require(path.join(__dirname, '..', '..', 'src', 'core', 'decision.js'));

const prompt = [
  '[A] capability_probe 英文支窗口放宽：当前英文支 {0,6} 词距窗口，r375 实测偏窄（英文支召回不完整），需先跑良性池 326 条全量确认零新增误伤再放宽',
  '[B] 扫 test/ 里 indexOf("re: /") 型源码定位的静默失效守卫：r376 实测发现源码改命名常量后旧守卫全变假绿灯（r342 修前 2 failed 即为该模式），属系统性测试债务',
  '[C] 维度覆盖扫描显示 46 维未测 0、良性误伤 0/12，唯一异常是 multi_turn_escalation 闸门放过 1/2（norm 层耦合口径，r372 记录为老账未清）'
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
