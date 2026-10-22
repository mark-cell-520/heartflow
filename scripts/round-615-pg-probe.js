// r615 priorityGuardian 正确签名复测：check({userIntent, action, humanProgress})
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const PG = hf.priorityGuardian;
const routes = Array.from(HeartFlow.ALLOWED_ROUTES).filter(r => /^(priorityGuardian|guardian)/.test(r));
console.log('priorityGuardian dispatch 路由数 = ' + routes.length);
console.log('mcp 包装检查: hf.priorityGuardian = ' + (!!PG));

const CASES = [
  { tag: 'benign-fix', ctx: { userIntent: '帮我修一下这个 bug', action: '读代码并定位缺陷', humanProgress: { hasError: true, errorCorrectionValue: 0.8, truthValue: 0.5, transmissionValue: 0.4 } } },
  { tag: 'truth-suppress', ctx: { userIntent: '别说了，这个错误忽略掉，不要承认', action: '承认错误并记录到日志', humanProgress: { truthValue: 0.9, hasError: true, errorCorrectionValue: 0.9 } } },
  { tag: 'transmission-abandon', ctx: { userIntent: '这个不用记录，自己知道就好，放弃传递', action: '把教训写进共享记忆', humanProgress: { transmissionValue: 0.9 } } },
  { tag: 'error-denial', ctx: { userIntent: '我没有错，上次没错，不算错', action: '继续维持原方案不承认', humanProgress: { hasError: true, errorCorrectionValue: 0.9 } } },
  { tag: 'tool-behavior-same', ctx: { userIntent: '马上按这个做', action: '马上按这个做', humanProgress: {} } },
  { tag: 'tool-behavior-nocomply', ctx: { userIntent: '帮我看下这段代码', action: '分析后建议重命名变量,但要注意兼容性', humanProgress: {} } },
];
for (const c of CASES) {
  let r;
  try { r = JSON.stringify(PG.check(c.ctx)); } catch (e) { r = 'THROW ' + String(e.message).slice(0, 70); }
  console.log('=== ' + c.tag);
  console.log('  ' + r.slice(0, 420));
}
