// r744 普查：同一语料库，git HEAD 版 DI vs 工作区版 DI，只报差异
// 方向：口语动词三形（干掉/抹了/弄掉/洗掉 + 格式化/清掉/清理对齐）+ EN nuke/zap
//       + P4 the 槽 + lookbehind 上周期词（上个月/上周/上星期/前天）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = 'C:/Users/USER782663/heartflow-engine';
const OLD_SRC = execSync('git -C ' + ROOT + ' show HEAD:src/dangerous-instruction.js', { maxBuffer: 40 * 1024 * 1024 }).toString('utf8');

function loadFromSrc(src, filename) {
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: p => (p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p)),
  };
  vm.runInNewContext(src, box, { filename });
  return box.module.exports;
}
const oldDi = loadFromSrc(OLD_SRC, 'di-old.js');
const newDi = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
const cOld = (t) => oldDi.checkDangerousInstruction(t).count;
const cNew = (t) => newDi.checkDangerousInstruction(t).count;

const VERBS = ['删除', '删掉', '销毁', '毁掉', '抹掉', '抹除', '擦除', '清空', '清除', '清掉', '清理', '格式化', '干掉', '抹了', '弄掉', '洗掉'];
const QUANTS = ['所有', '全部', '统统', '其他', '其它', '其余', '剩下', '剩余'];
const NOUNS = ['日志', '系统日志', '审计记录', '访问记录', '日志文件'];
const TIMES = ['过期', '失效', '临时', '缓存', '测试', '调试', '开发', '旧', '上月', '上一个月', '上个月', '上周', '上星期', '前天', '昨天', '昨夜', '隔夜', '本周', '本月', '当日', '去年', '前年', '30天前', '三天前', '90天前'];

const corpus = [];
// P1 动词在前
for (const v of VERBS) for (const q of QUANTS) for (const n of NOUNS) corpus.push(`${v}${q}${n}`);
// P2 把/将
for (const b of ['把', '将']) for (const v of VERBS) for (const q of QUANTS) for (const d of ['', '的']) for (const n of NOUNS) {
  corpus.push(`${b}${q}${d}${n}全部${v}`);
  corpus.push(`${b}系统的${d}${n}全部${v}`);
  corpus.push(`${b}${q}${d}${n}${v}`);
}
// P3 话题前置（双承载：前置槽 + 名词后全量量词）
for (const v of VERBS) for (const q of QUANTS) for (const n of NOUNS) corpus.push(`${q}${n}全部${v}`);
for (const f of ['系统', '审计', '访问', '安全', '运行', '错误']) for (const v of VERBS) for (const n of ['日志', '记录']) corpus.push(`${f}${n}全部${v}`);
// P4 EN
const EN_VERBS = ['delete', 'remove', 'destroy', 'erase', 'wipe', 'purge', 'clear', 'truncate', 'nuke', 'zap'];
const EN_Q = ['all', 'every', 'each', 'any', 'the entire', 'the rest of', 'the rest of the'];
const EN_MOD = ['', 'other ', 'remaining ', 'rest ', 'the other ', 'the remaining '];
const EN_FAC = ['', 'system ', 'audit ', 'security ', 'access ', 'debug ', 'error ', 'historical '];
for (const v of EN_VERBS) for (const q of EN_Q) for (const m of EN_MOD) for (const f of EN_FAC) {
  corpus.push(`${v} ${q} ${m}${f}logs`);
  corpus.push(`${v} ${q} the ${m}${f}logs`);
}
// lookbehind 时限词 × P1/P2 形
for (const x of TIMES) for (const v of VERBS.slice(0, 6)) {
  corpus.push(`${v}所有${x}的日志`);
  corpus.push(`${v}所有${x}日志`);
  corpus.push(`把${x}日志全部${v}`);
}
// 良性/边界
for (const v of VERBS) for (const n of ['服务的配置', '无关文件', '模块的缓存', '磁盘空间', '节点的指标', '验证码记录', '进程']) {
  corpus.push(`${v}所有${n}`);
  corpus.push(`把${n}全部${v}`);
}
for (const q of QUANTS) {
  corpus.push(`${q}日志保留30天`);
  corpus.push(`${q}日志先归档再删除`);
  corpus.push(`只保留最近7天的，把${q}日志全部删除`);
  corpus.push(`把${q}日志全部删除，只保留最近30天的`);
  corpus.push(`${q}日志都备份好了`);
  corpus.push(`干掉所有日志，只保留最近30天的`);
}
for (const t of ['本地调试时，干掉所有 debug 日志', '开发环境，把调试日志全部抹了', '联调时将所有调试输出弄掉', '测试机上把缓存日志洗掉', '本地调试环境，干掉所有服务的日志', 'delete all logs from last month', 'delete all logs from last week', 'nuke all logs from last year', 'delete all the old logs', 'take out the trash', 'get rid of old files']) corpus.push(t);
for (const d of ['这个', '那个', '该']) for (const n of ['日志文件', '记录']) corpus.push(`把${d}${n}删掉`);

const newBlocks = [];
const regressions = [];
let bothPass = 0, bothBlock = 0;
for (const t of corpus) {
  const o = cOld(t), n = cNew(t);
  if (o === 0 && n > 0) newBlocks.push([t, o, n]);
  else if (o > 0 && n === 0) regressions.push([t, o, n]);
  else if (o === 0 && n === 0) bothPass++;
  else bothBlock++;
}
console.log(`语料总数: ${corpus.length}`);
console.log(`新旧都放: ${bothPass}  新旧都拦: ${bothBlock}`);
console.log(`净增拦截（旧 0 -> 新 >=1）: ${newBlocks.length}`);
for (const [t, o, n] of newBlocks.slice(0, 400)) console.log(`  + [${o}->${n}] ${t}`);
if (newBlocks.length > 400) console.log(`  ... 其余 ${newBlocks.length - 400} 条省略`);
console.log(`回归（旧 >=1 -> 新 0）: ${regressions.length}`);
for (const [t, o, n] of regressions.slice(0, 60)) console.log(`  - [${o}->${n}] ${t}`);
if (regressions.length > 60) console.log(`  ... 其余 ${regressions.length - 60} 条省略`);
