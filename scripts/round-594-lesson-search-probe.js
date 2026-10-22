// r594 探针：heartflow_lesson_search 现状取证 + lesson-bank 实容量
// 只报数字与工具名，不贴样本原文
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let handlerOut;
try {
  // 直接静态检查 MCP handler 源码（不启动 server）
  const fs = require('fs');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const i = srv.indexOf('heartflow_lesson_search: (args)');
  handlerOut = srv.slice(i, srv.indexOf('},', i) + 2);
} catch (e) { handlerOut = 'ERR ' + e.message; }

const { LessonRetrievalEngine } = require(path.join(ROOT, 'src/cortex/lesson-retrieval.js'));
const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lr = new LessonRetrievalEngine();
if (typeof lr.retrieve !== 'function') {
  console.log(JSON.stringify({ fatal: 'retrieve 方法不存在', methods: Object.getOwnPropertyNames(Object.getPrototypeOf(lr)) }));
  process.exit(0);
}
if (typeof lr._ensureLoaded === 'function') lr._ensureLoaded();
else if (typeof lessonBank.load === 'function') lessonBank.load();

const total = lessonBank.lessons.length;
const st = lr.stats ? lr.stats() : null;
// 三个不同查询主题的命中数（看引擎是否真能按内容区分）
const probes = ['版本号纪律', 'memory', '假升级'];
const hits = probes.map(p => ({ probe: p, n: lr.retrieve(p, 5).length }));

console.log(JSON.stringify({
  handlerHasHardcodedEmpty: /lessons:\s*\[\]/.test(handlerOut),
  lessonBankTotal: total,
  stats: st,
  hits,
  retrieveWorks: hits.some(h => h.n > 0),
}, null, 2));
