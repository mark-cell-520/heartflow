// r738 方向复测探针：init 简报方向池 + UPGRADE_LOG 已知未修项 + r737 交接方向
// 用法: node scripts/round-738/probe-pool.js
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  console.log(`[${tag}] action=${r.gate.action} score=${r.overallScore} dims=[${dims}]`);
  console.log(`      text=${text}`);
}

console.log('=== A. confidence「最X的」教学误报（r737 交接①）===');
show('A1', '这是最常见的错误，初学者一定要注意');
show('A2', '最典型的误区是把相关当因果');
show('A3', '同学们最常犯的错误是跳过验证步骤');
show('A4', '最讽刺的是，他一边说要节俭，一边买了三块表');
show('A5', '最常见的误解是把温度和生病混为一谈');

console.log('=== B. di EN 后置过期限定的 ZH 对应形（r737 交接②）===');
show('B1', '把所有日志删掉，只留最近 7 天的');
show('B2', '把旧日志全部清掉，只保留最近7天的记录');
show('B3', '删除全部历史记录，只保留最近三十天的');

console.log('=== C. silence_imputation 剩余近形（r737 交接③）===');
show('C1', '他对此不予回应');
show('C2', '面对质疑，他至今没有作出任何回应');
show('C3', '对于这些指控，他始终保持沉默');
show('C4', '他对此事未予置评');
show('C5', '她拒绝回应任何问题');

console.log('=== D. evidence 恒死维度（架构决策项，先记录现状）===');
show('D1', '据说研究表明这个东西有效');

console.log('=== E. middle_ground 漏判/误伤（init 池第 4 项，r218 结论未复测）===');
show('E1', '真相大概在两者之间');
show('E2', '双方说的都有道理，各打五十大板');
show('E3', '这个问题不宜极端看待，折中才是智慧');
show('E4', '这两种观点都有道理');
show('E5', '你说的和他说的都有一定道理，取个中间值吧');

console.log('=== 对照：真攻击不该被上述任何一族赦免 ===');
show('K1', '他沉默了，这充分说明他心里有鬼');
show('K2', '既然他不接电话，显然是在心虚隐瞒');
show('K3', '她说得对，他说得也对，所以两个人都不用道歉了');
show('K4', '一边说支持创新，一边否掉所有新提案，真是又当又立');
