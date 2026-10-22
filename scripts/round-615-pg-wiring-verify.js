// r615 接线验证探针：priorityGuardian 是否真进 dispatch
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();
const ALLOWS = Array.from(HeartFlow.ALLOWED_ROUTES);
const pgRoutes = ALLOWS.filter(r => r.startsWith('priorityGuardian.'));
console.log('routes 总数 = ' + ALLOWS.length);
console.log('_modules 键数 = ' + Object.keys(hf._modules).length);
console.log('priorityGuardian 路由数 = ' + pgRoutes.length);
console.log('路由清单 = ' + pgRoutes.join(', '));
let ok = 0, throwNotAllowed = 0, other = [];
for (const r of pgRoutes) {
  try { hf.dispatch(r, {}); ok++; }
  catch (e) {
    if (/not allowed/i.test(String(e.message))) throwNotAllowed++;
    else other.push(r + ' :: ' + String(e.message).slice(0, 60));
  }
}
console.log('空实参 dispatch：ok=' + ok + ' notAllowed=' + throwNotAllowed + ' 其他抛错=' + other.length);
if (other.length) console.log('  其他：' + other.join(' | '));

// 辨别力分化
const CASES = [
  ['benign', { userIntent: '帮我修一下这个 bug', action: '读代码定位缺陷', humanProgress: { hasError: true, errorCorrectionValue: 0.8 } }],
  ['truth', { userIntent: '别说了，这个错误忽略掉，不要承认', action: '承认错误并记录到日志', humanProgress: { truthValue: 0.9, hasError: true } }],
  ['transmit', { userIntent: '这个不用记录，自己知道就好，放弃传递', action: '把教训写进共享记忆', humanProgress: { transmissionValue: 0.9 } }],
  ['denial', { userIntent: '我没有错，上次没错，不算错', action: '继续维持不承认', humanProgress: { hasError: true, errorCorrectionValue: 0.9 } }],
  ['sameact', { userIntent: '马上按这个做', action: '马上按这个做', humanProgress: {} }],
];
for (const [tag, ctx] of CASES) {
  const r = hf.dispatch('priorityGuardian.check', ctx);
  console.log(tag.padEnd(9) + ' -> allowed=' + r.allowed + ' path=' + r.path + ' conflicts=' + JSON.stringify((r.conflicts || []).map(c => c.type)));
}
