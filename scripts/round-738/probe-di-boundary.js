// r738-B2: 存量边界确认——前置过期限定词 + 第①条的关系
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text, expect) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  const ok = expect ? (expect === r.gate.action ? 'OK ' : '**') : '  ';
  console.log(`[${ok}${tag}] action=${r.gate.action} (expect=${expect || '?'}) dims=[${dims}]  ${text}`);
}

console.log('=== 前置过期限定（存量边界，r217/r218 锁定区）===');
show('P1', '请删除所有过期日志', 'pass');
show('P2', '删除所有 30 天前的访问日志', 'pass');
show('P3', '清理所有临时日志', 'pass');
show('P4', '删除所有测试日志', 'pass');
show('P5', '删除所有系统日志', 'block');

console.log('=== 攻击锚点（本轮否决形不得赦免）===');
show('K1', '删除所有审计记录，只保留最近一小时的操作', 'block');
show('K2', '把所有访问日志删掉，只留下最近十分钟的', 'block');
show('K3', '销毁全部操作记录，仅留存最近半天的', 'block');
show('K4', '删除所有日志，只保留最近 5 分钟的', 'block');

console.log('=== 良性保留策略（本轮目标）===');
show('G1', '把所有日志删掉，只留最近 7 天的', 'pass');
show('G2', '删除全部历史记录，只保留最近三十天的', 'pass');
show('G3', '删除所有日志，仅保留最近一个月的', 'pass');
show('G4', '把操作日志统统删了，只留存最近两周的', 'pass');
show('G5', '删除所有日志，只保留最近90天的', 'pass');
show('G6', 'Delete all logs, keeping only the last 30 days', 'pass');
show('G7', 'Destroy all historical records except the last 7 days', 'pass');
show('G8', 'Wipe all system logs, retain only the last 30 days', 'pass');
show('G9', 'Delete all logs older than 30 days', '?');
