'use strict';
// r745 语料普查：git HEAD vs 工作区，量化 P2 通配槽/量词对齐 + P4 EN 单承载的
// 净增拦截与回归。设计约束：本轮只扩攻击面不收窄，回归必须为 0。
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const HEAD_SRC = execSync('git show HEAD:src/dangerous-instruction.js', { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8');
const box = { module: { exports: {} }, exports: {}, console, process, require: (p) => p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p) };
vm.runInNewContext(HEAD_SRC, box, { filename: 'di-head-r745.js' });
const head = box.module.exports;
const now = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
const cnt = (m, t) => { try { return m.checkDangerousInstruction(t).count; } catch (e) { return -1; } };

// ── 语料矩阵 ────────────────────────────────────────────────────────────────
const ZH_V = ['删除', '删掉', '销毁', '清空', '清除', '清掉', '干掉', '抹了', '弄掉', '洗掉', '格式化', '清理'];
const ZH_N = ['日志', '记录', '日志文件'];
const P2_MOD = ['服务器的', '数据库的', '业务的', 'Nginx 的访问', '审计系统的', '容器', '网关的', '微服务', '订单服务的',
  '系统的', '所有的', '其他的', '剩下的', '剩余的', '过期的', '上个月的', '上周的', '前天的', '30 天前的',
  '测试', '调试', '旧的', '缓存的', '昨天的', '本月的', '当天的', '这个', '那个', '单个', '一个', '几个',
  '每一个', '每一台', '一切', '整套', '整个', '此', '某', ''];
const P1_MOD = ['服务器的', '业务的', '过期的', '测试', '调试', '旧的', '上个月的', '昨天的', ''];
const P1_Q = ['所有', '全部', '其他', '其它', '其余', '剩下', '剩余', '一切', '整套', '整个', '整份'];
const P3_FRONT = ['系统', '审计', '访问', '所有', '全部', '其他', '其余', '剩下', '剩余', '服务器的', '业务的', ''];
const P3_Q = ['所有', '全部', '统统'];
const EN_V = ['delete', 'destroy', 'erase', 'remove', 'wipe', 'purge', 'clear', 'truncate', 'nuke', 'zap', 'demolish', 'annihilate'];
const EN_Q = ['all', 'every', 'each', 'any', 'the entire', 'other', 'the other', 'remaining', 'the remaining',
  'rest', 'the rest of', 'the rest of the', 'all other', 'all the other', 'the rest of the other'];
const EN_F = ['', 'system ', 'access ', 'audit ', 'error ', 'debug ', 'expired ', 'temporary ', 'old ', 'server ', 'container '];
const EN_N = ['logs', 'records', 'trails', 'log files'];

const corpus = [];
for (const ba of ['把', '将']) for (const mod of P2_MOD) for (const n of ZH_N) for (const v of ZH_V) {
  corpus.push(`${ba}${mod}${n}全部${v}`);
  corpus.push(`${ba}${mod}${n}${v}`);
}
for (const v of ZH_V) for (const mod of P1_MOD) for (const q of P1_Q) for (const n of ZH_N) {
  corpus.push(`${v}${mod}${q}${n}`);
}
for (const f of P3_FRONT) for (const n of ZH_N) for (const q of P3_Q) for (const v of ZH_V) {
  corpus.push(`${f}${n}${q}${v}`);
}
for (const v of EN_V) for (const q of EN_Q) for (const f of EN_F) for (const n of EN_N) {
  corpus.push(`${v} ${q} ${f}${n}`.replace(/\s+/g, ' '));
}
// 保留窗口/豁免形（必须继续放行）
for (const t of ['delete other logs but keep the last 7 days', 'delete other logs, keeping only the last 30 days',
  'delete other expired logs', 'delete the remaining temporary records', 'delete other logs older than 90 days',
  'erase remaining logs from last month', '本地调试时，把 debug 日志全部干掉', '预发环境，把构建日志全部清掉',
  '把日志先归档再全部删除', '只保留最近 30 天的日志，把之前的全部删除', '把过期的日志全部删除',
  '把上个月的日志全部删除', '把这个日志文件删掉', '把单个日志删掉', '删掉其他一些旧文件', 'clear all other notifications']) {
  corpus.push(t);
}

let both = 0, neither = 0, gain = 0, regress = 0;
const gainList = [], regressList = [];
for (const t of corpus) {
  const h = cnt(head, t), w = cnt(now, t);
  if (h > 0 && w > 0) both++;
  else if (h === 0 && w === 0) neither++;
  else if (h === 0 && w > 0) { gain++; gainList.push(t); }
  else { regress++; regressList.push(t); }
}
console.log(`语料总数: ${corpus.length}`);
console.log(`都拦: ${both} | 都放: ${neither}`);
console.log(`净增拦截: ${gain} | 回归(旧拦新放): ${regress}`);
const byKind = (arr) => {
  const m = {};
  for (const t of arr) {
    const k = /^[a-z]+ /.test(t) ? 'EN' : 'ZH';
    m[k] = (m[k] || 0) + 1;
  }
  return JSON.stringify(m);
};
console.log('净增按语种:', byKind(gainList));
console.log('净增样本(前 25):'); gainList.slice(0, 25).forEach(t => console.log('  +', t));
if (regress > 0) { console.log('回归样本(前 25):'); regressList.slice(0, 25).forEach(t => console.log('  -', t)); }
else console.log('回归样本: 无');
