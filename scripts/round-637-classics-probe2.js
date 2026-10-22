// r637 探针 2：新旧候选列表解析对比 + 消费方
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const os = require('os');
const fs = require('fs');
const cb = require(__HF + '/src/knowledge/classics-base.js');

console.log('HERMES_HOME =', JSON.stringify(process.env.HERMES_HOME));
console.log('os.homedir() =', os.homedir());
console.log('--- 当前(未提交)解析结果 ---');
console.log('CLASSICS_BASE =', String(cb.CLASSICS_BASE));
console.log('resolveClassicsBase() =', String(cb.resolveClassicsBase()));
console.log('isAvailable() =', String(cb.isAvailable()));
console.log('SCRIPT =', String(cb.SCRIPT));

// 重建 HEAD 版本的候选列表，看旧列表会不会漏
function oldList() {
  const l = [];
  if (process.env.DAIZHIGEV20_PATH) l.push(process.env.DAIZHIGEV20_PATH);
  if (process.env.CLASSICS_BASE) l.push(process.env.CLASSICS_BASE);
  l.push(path.join(__dirname, '..', '..', '..', '..', 'daizhigev20'));
  const homes = [os.homedir(), '/root', '/home/claude-bot'];
  for (const h of homes) l.push(path.join(h, '.hermes', 'skills', 'daizhigev20'));
  l.push('/usr/local/share/hermes/skills/daizhigev20');
  l.push('/opt/hermes/skills/daizhigev20');
  return [...new Set(l)];
}
function newList() {
  const l = [];
  if (process.env.DAIZHIGEV20_PATH) l.push(process.env.DAIZHIGEV20_PATH);
  if (process.env.CLASSICS_BASE) l.push(process.env.CLASSICS_BASE);
  l.push(path.join(__dirname, '..', '..', '..', '..', 'daizhigev20'));
  const bases = [process.env.HERMES_HOME, os.homedir(), '/root', '/home/claude-bot'];
  for (const b of bases) {
    if (!b) continue;
    l.push(path.join(b, 'skills', 'daizhigev20'));
    l.push(path.join(b, '.hermes', 'skills', 'daizhigev20'));
    l.push(path.join(b, '.stepcode', 'agent', 'skills', 'daizhigev20'));
    const parent = path.dirname(b);
    if (parent && parent !== '/' && parent !== b) l.push(path.join(parent, 'hermes8', 'skills', 'daizhigev20'));
  }
  l.push('/usr/local/share/hermes/skills/daizhigev20');
  l.push('/opt/hermes/skills/daizhigev20');
  return [...new Set(l.filter(Boolean))];
}
const o = oldList(), n = newList();
const hit = (list) => list.find((p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } });
console.log('--- 候选列表命中对比 ---');
console.log('旧列表候选数', o.length, '命中 =', String(hit(o)));
console.log('新列表候选数', n.length, '命中 =', String(hit(n)));
console.log('--- 新列表相对旧列表新增的候选（在本机存在的）---');
for (const p of n) {
  if (o.includes(p)) continue;
  let ok = false; try { ok = fs.statSync(p).isDirectory(); } catch {}
  if (ok) console.log('NEW-HIT', p);
}
// 本机真实位置
console.log('--- 本机真实位置是否在新列表里 ---');
for (const p of ['/root/hermes8/skills/daizhigev20', '/root/hermes8/profiles/hermes1/skills/daizhigev20', '/root/.stepcode/agent/skills/daizhigev20']) {
  console.log((n.includes(p) ? 'IN ' : 'OUT') + ' ' + p);
}
