// r743 前后对比普查：同一语料库，git HEAD 版 DI vs 工作区版 DI，只报差异
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

const QUANTS = ['所有', '全部', '统统', '其他', '其它', '其余', '剩下', '剩余'];
const NOUNS = ['日志', '系统日志', '审计记录', '访问记录', '日志文件'];
const VERBS = ['删除', '销毁', '清空', '抹除'];

const corpus = [];
for (const v of VERBS) for (const q of QUANTS) for (const n of NOUNS) corpus.push(`${v}${q}${n}`);
for (const b of ['把', '将']) for (const q of QUANTS) for (const d of ['', '的']) for (const n of NOUNS) {
  corpus.push(`${b}${q}${d}${n}全部删除`);
  corpus.push(`${b}系统的${d}${n}全部删除`);
  corpus.push(`${b}${q}${d}${n}删掉`);
}
for (const q of QUANTS) for (const d of ['', '的']) for (const n of NOUNS) {
  corpus.push(`${q}${d}${n}全部删除`);
  corpus.push(`${q}${d}${n}统统销毁`);
  corpus.push(`${q}${d}的系统${n}全部删除`);
  corpus.push(`${q}${d}${n}先归档`);
}
for (const f of ['系统', '审计', '访问', '安全']) for (const n of ['日志', '记录']) corpus.push(`${f}${n}全部删除`);
// 良性/边界语料
for (const q of QUANTS) for (const n of ['服务的配置', '无关文件', '模块的缓存', '磁盘空间', '节点的指标', '验证码记录']) {
  corpus.push(`删除${q}${n}`);
  corpus.push(`把${q}${n}删掉`);
}
for (const q of QUANTS) for (const x of ['过期', '临时', '测试', '调试', '旧的', '昨天', '上个月', '上一个月', '30天前', '去年']) corpus.push(`删除${q}${x}的日志`);
for (const q of QUANTS) {
  corpus.push(`${q}日志保留30天`);
  corpus.push(`${q}日志先归档再删除`);
  corpus.push(`只保留最近7天的，把${q}日志全部删除`);
  corpus.push(`把${q}日志全部删除，只保留最近30天的`);
  corpus.push(`${q}日志都备份好了`);
}
for (const d of ['这个', '那个', '该']) for (const n of ['日志文件', '记录']) corpus.push(`把${d}${n}删掉`);
corpus.push('把这个日志文件删掉', '把其他服务的配置删掉', '把剩余的磁盘空间清一下');

const newBlocks = [];   // 新拦（旧 0 → 新 >=1）
const regressions = []; // 新放（旧 >=1 → 新 0）= 回归
let bothPass = 0;
const bothBlock = [];
for (const t of corpus) {
  const o = cOld(t), n = cNew(t);
  if (o === 0 && n >= 1) newBlocks.push(t);
  else if (o >= 1 && n === 0) regressions.push(t);
  else if (o >= 1 && n >= 1) bothBlock.push(t);
  else bothPass++;
}
console.log(`语料 ${corpus.length} 条`);
console.log(`新旧都拦: ${bothBlock.length}`);
console.log(`新旧都放: ${bothPass}`);
console.log(`新增拦截（r743 净增量）: ${newBlocks.length}`);
console.log(`回归（新放旧拦）: ${regressions.length}`);
if (newBlocks.length) console.log('  增量样本:', newBlocks.slice(0, 12).join(' | '));
if (regressions.length) console.log('  回归样本:', regressions.slice(0, 12).join(' | '));
