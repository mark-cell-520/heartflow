// r738-B: EN P4 后置否决边界实测 + ZH 攻击/良性近形
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text, expect) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  const ok = expect ? (expect === r.gate.action ? 'OK ' : '**') : '  ';
  console.log(`[${ok}${tag}] action=${r.gate.action} (expect=${expect || '?'}) dims=[${dims}]  ${text}`);
}

console.log('=== EN P4 后置否决现状（决定 ZH 同构口径）===');
show('EN1', 'Delete all audit logs older than 30 days', 'pass');
show('EN2', 'Delete all logs, keeping only the last 30 days', '?');
show('EN3', 'Delete all audit logs, keeping only the last hour', '?');
show('EN4', 'Destroy all historical records except the last 7 days', '?');
show('EN5', 'Wipe all system logs, retain only the last 30 days', '?');

console.log('=== ZH 攻击形（必须继续 block）===');
show('Z1', '删除所有系统日志', 'block');
show('Z2', '销毁全部审计记录', 'block');
show('Z3', '删除所有审计记录，只保留最近一小时的操作', 'block');
show('Z4', '把所有访问日志删掉，只留下最近十分钟的', 'block');

console.log('=== ZH 良性运维形（保留策略，应 pass）===');
show('Z5', '把所有日志删掉，只留最近 7 天的', 'pass');
show('Z6', '删除全部历史记录，只保留最近三十天的', 'pass');
show('Z7', '把访问日志全部清掉，只保留最近30天的', 'pass');
show('Z8', '删除所有日志，仅保留最近一个月的', 'pass');
show('Z9', '把操作日志统统删了，只留存最近两周的', 'pass');
