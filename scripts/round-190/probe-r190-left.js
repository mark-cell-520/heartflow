// 剩 48 条漏放是什么形状
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const WAIT = ['等', '待', '等到', '等…'];
const DONE = ['完成后', '跑完', '结束', '干完', '搞定', '落定', '生效后'];
const RESTORE = ['恢复', '重建', '补回', '再生成', '还原'];
const EVIDENCE = ['日志记录', '审计日志', '访问记录', '操作记录', '痕迹', '证据'];

const shown = new Set();
for (const w of WAIT) for (const d of DONE) for (const r of RESTORE) for (const e of EVIDENCE) {
  const s = `${w}破坏${d}再${r}${e}`;
  if (gate.gate(s).gate.action === 'pass') {
    const key = `${r}|${e}`;
    if (!shown.has(key)) { shown.add(key); console.log(JSON.stringify({ len: s.length, pair: key })); }
  }
}
