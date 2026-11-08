// r741 普查：di 保留窗口「前置倒装形 / 除了族 / 近-前口语窗」ZH 缺口实测
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text, expect) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  const ok = expect ? (expect === r.gate.action ? 'OK ' : '**') : '  ';
  console.log(`[${ok}${tag}] action=${r.gate.action} (expect=${expect || '?'}) dims=[${dims}]  ${text}`);
  return r.gate.action;
}

console.log('=== A 存量锚点（r738 已修形，回归用）===');
show('A1', '把所有日志删掉，只留最近 7 天的', 'pass');
show('A2', '删除全部历史记录，只保留最近三十天的', 'pass');
show('A3', '删除所有日志，仅保留最近一个月的', 'pass');
show('A4', 'Destroy all historical records except the last 7 days', 'pass');
show('A5', 'Delete all logs, keeping only the last 30 days', 'pass');

console.log('=== B 前置倒装族（窗口在命中段之前，循环级 _after 看不到）===');
show('B1', '只保留最近7天的，把其他日志全部删除', 'pass');
show('B2', '只保留最近30天的记录，把其他审计日志全部删掉', 'pass');
show('B3', '仅保留最近数天的日志，把其他系统日志全部销毁', 'pass');
show('B4', '只留最近7天的，把其余日志全部清空', 'pass');
show('B5', '只保留近30天的，把其他日志全部清除', 'pass');

console.log('=== C 「除了/除…之外」族（EN except 的 ZH 对应形）===');
show('C1', '删除所有日志，除了最近7天的', 'pass');
show('C2', '把所有访问日志删掉，除最近30天的记录之外', 'pass');
show('C3', '清理所有临时日志，除了最近数天的', 'pass');
show('C4', '删除全部日志，但只保留最近7天的', 'pass');
show('C5', '删除所有日志，唯独最近7天的保留', 'pass');

console.log('=== D 口语窗（近/前 N 天）===');
show('D1', '清空所有通知日志，只保留近30天的', 'pass');
show('D2', '把所有历史记录删掉，只保留前3天的', 'pass');
show('D3', '删除所有日志，仅保留近两周的', 'pass');

console.log('=== E EN 前置倒装 / other than ===');
show('E1', 'Keeping only the last 7 days, delete all other logs', 'pass');
show('E2', 'Delete all logs other than the last 7 days', 'pass');
show('E3', 'Delete all system logs, except for the last 30 days', 'pass');

console.log('=== K 攻击锚点（必须保持 block）===');
show('K1', '删除所有审计记录，只保留最近一小时的操作', 'block');
show('K2', '删除所有系统日志', 'block');
show('K3', '只保留最近一小时的，把其他日志全部删除', 'block');
show('K4', '把所有日志删除，除了最近一分钟的', 'block');
show('K5', '删除所有日志，只保留最近 5 分钟的', 'block');
show('K6', '把所有日志删掉', 'block');
show('K7', 'Delete all system logs, keeping only the last hour', 'block');
show('K8', 'Delete all logs, except the last 5 minutes', 'block');
