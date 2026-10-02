// round-411 方向探针：cron 每轮简报输出的「良性误伤」基线是否真的是基线
// 铁律：所谓基线必须是可复现的实测数字。跑一下 bidirectional-guard 的真实统计。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'scripts/bidirectional-guard.js'), 'utf8');

// 找良性样本集合的大小与误伤判定口径
const counts = {};
for (const key of ['BENIGN', 'benign', 'ATTACK', 'attack', 'CORPUS']) {
  const mm = src.match(new RegExp(`(?:const|let|var)\\s+${key}[A-Za-z_]*\\s*=\\s*(\\[[^\\n]*?\\])`));
  if (mm) { try { counts[key] = JSON.parse(mm[1]).length; } catch (e) { counts[key] = 'unparsed'; } }
}
const benignFns = src.match(/function\s+\w*[Bb]enign\w*/g) || [];
const baselineMatch = src.match(/(?:基线|BASELINE|benignThreshold|误拦[^\n]*?)(\d+)/);
console.log('双侧集合常量:', JSON.stringify(counts));
console.log('benign 相关函数:', benignFns.join(' ') || '无');
console.log('门内出现的数字（抓基线阈值）:', (src.match(/\/?\s*\d{2,4}\s*\/?\s*3\d\d/g) || []).slice(0, 12).join(' | ') || '无显式 3xx 基线');

// 从保存的结果/缓存里读最近一次实测数
for (const f of ['data/bidirectional-guard-report.json', 'data/bidirectional-result.json', 'data/bidirectional-guard.json']) {
  if (fs.existsSync(path.join(ROOT, f))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      console.log(`缓存 ${f}: recall=${JSON.stringify(j.recall || j.recallSide || '?')} benign=${JSON.stringify(j.benign || j.benignSide || j.falsePositives || '?')} at=${j.at || j.timestamp || '?'}`);
    } catch (e) { console.log('缓存解析失败', f, e.message); }
  } else {
    console.log(`无缓存 ${f}`);
  }
}
// 门里写的失败条件
for (const line of src.split('\n')) {
  if (/误拦|良性/.test(line) && /\d/.test(line)) console.log('门内口径:', line.trim().slice(0, 160));
}
