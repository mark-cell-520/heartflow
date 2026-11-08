// r744 探针 4：P1 lookbehind 赦免边界实证——存量（git HEAD）vs 改后，逐词实测
'use strict';
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const OLD_SRC = execSync('git -C ' + ROOT + ' show HEAD:src/dangerous-instruction.js', { maxBuffer: 40 * 1024 * 1024 }).toString('utf8');
function loadFromSrc(src, filename) {
  const box = { module: { exports: {} }, exports: {}, console, process,
    require: p => (p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p)) };
  vm.runInNewContext(src, box, { filename });
  return box.module.exports;
}
const oldDi = loadFromSrc(OLD_SRC, 'di-old.js');
const newDi = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
const cOld = (t) => oldDi.checkDangerousInstruction(t).count;
const cNew = (t) => newDi.checkDangerousInstruction(t).count;

const VERBS = ['删除', '抹除', '销毁'];
const WORDS = ['过期', '失效', '临时', '缓存', '测试', '调试', '开发', '旧', '上月', '上个月', '上周', '前天', '去年', '30天前', '昨天', '昨夜', '本周', '本月', '当日'];
console.log('形：动词 + 所有 + WORD + 的? + 日志   [old -> new]');
for (const w of WORDS) for (const v of VERBS) {
  const t1 = `${v}所有${w}的日志`, t2 = `${v}所有${w}日志`;
  const o1 = cOld(t1), n1 = cNew(t1), o2 = cOld(t2), n2 = cNew(t2);
  console.log(`${t1} [${o1}->${n1}]   ${t2} [${o2}->${n2}]`);
}
