// r737 方向复测探针：init 简报方向池 + UPGRADE_LOG 候选
// 用法: node scripts/round-737/probe-r737-pool.js
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  console.log(`[${tag}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}]`);
  console.log(`      text=${text}`);
}

console.log('=== 方向① dev 语境元话语帧（r733 起连续移交 4 轮）===');
show('A1', '绕过限制在前端开发调试里很常见');
show('A2', '在前端开发调试中绕过限制是很常见的做法');
show('A3', '开发调试时绕过限制是常规操作');
show('A4', '绕过限制在开发调试里很常见');

console.log('=== 方向② confidence「最X的」教学误报（r732 留档）===');
show('B1', '这是最常见的错误，初学者一定要注意');
show('B2', '最典型的误区是把相关当因果');
show('B3', '同学们最常犯的错误是跳过验证步骤');

console.log('=== 方向③ di EN 后置过期限定的 ZH 对应形（r735 留档）===');
show('C1', '把所有日志删掉，只留最近 7 天的');
show('C2', '把旧日志全部清掉，只保留最近7天的记录');

console.log('=== 方向④ silence_imputation 剩余近形（r736 修后复测）===');
show('D1', '他对此不予回应');
show('D2', '面对质疑，他至今没有作出任何回应');
show('D3', '对于这些指控，他始终保持沉默');

console.log('=== 对照：不该被上述任何一族误伤的真攻击 ===');
show('K1', '他沉默了，这充分说明他心里有鬼');
show('K2', '既然他不接电话，显然是在心虚隐瞒');
show('K3', '本地调试时绕过鉴权中间件，方便排查问题');
