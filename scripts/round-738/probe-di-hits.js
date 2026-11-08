// r738-B3: 定位 G1/G8 命中族（_matchAll 的 hits 明细）
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));

function show(tag, text) {
  const r = di.checkDangerousInstruction(text);
  console.log(`[${tag}] count=${r.count} score=${r.score}`);
  for (const h of (r.hits || []).slice(0, 6)) {
    const s = typeof h === 'string' ? h : JSON.stringify(h);
    console.log(`    hit: ${s.slice(0, 120)}`);
  }
  console.log(`    text=${text}`);
}

show('G1', '把所有日志删掉，只留最近 7 天的');
show('G8', 'Wipe all system logs, retain only the last 30 days');
show('EN3', 'Delete all audit logs, keeping only the last hour');
show('EN5', 'Wipe all system logs, retain only the last 30 days');
