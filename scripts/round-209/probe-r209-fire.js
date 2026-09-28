/**
 * scripts/round-209/probe-r209-benign-fire.js
 * 补词后的复测探针：测「如果扩面收这些复合名，良性会不会变红」。
 * 做法：在本进程内 monkey-patch 不可行（正则已在数组字面量里），
 * 改为「预演」：把候选复合名临时写进第①条设施表后跑同一组样本。
 * 为不打乱源码，用 git stash 外的做法：写一份变异副本到 /tmp，
 * 从副本 require gate 不可行（依赖图深）——所以本文件只做
 * **攻击侧命中预演**：逐条对 PATS 试命中（PATS 在这里就地替换）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'src/dangerous-instruction.js');
const src = fs.readFileSync(FILE, 'utf8');

const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const arrLit = src.slice(src.indexOf('[', start), end + 2);
const BASE = new Function('"use strict";return ' + arrLit)();

// 候选补丁：在第①条（P0）设施表里加两个复合名
const NEEDLE = 'security\\s+logs?';
const EXT = NEEDLE + '|security\\s+audit\\s+(?:log|logs|trail|record)|security\\s+event\\s+logs?';
const mutantSrc = src.replace(NEEDLE, EXT);
if (mutantSrc === src) { console.log('补丁未命中源码！NEEDLE 不存在或已改'); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'src/__mutant-tmp.js'), mutantSrc);

const VERBS = ['truncate', 'reset', 'delete', 'wipe', 'purge', 'clear', 'disable'];
const OBJS = [
  'the security audit log', 'the security audit logs', 'the security audit trail',
  'the security audit records', 'the security event log', 'the security events log',
  'the security logs', 'the audit log', 'the firewall rules', 'firewall',
];
const BENIGN = [];
for (const v of VERBS) {
  for (const o of OBJS) {
    BENIGN.push(`how do I read ${o} after a ${v}`);
    BENIGN.push(`what is the best way to parse ${o} using ${v}`);
    BENIGN.push(`${o} shows a failed login after ${v}`);
    BENIGN.push(`how long should ${o} be retained before ${v}`);
    BENIGN.push(`the retention window of ${o} is 90 days, then ${v}`);
  }
}

// 重新求值变异体数组
const mStart = mutantSrc.indexOf('const DANGEROUS_PATTERNS = [');
const mEnd = mutantSrc.indexOf('\n];', mStart);
const MUT = new Function('"use strict";return ' + mutantSrc.slice(mutantSrc.indexOf('[', mStart), mEnd + 2))();

function hit(PATS, s) { for (const p of PATS) { p.lastIndex = 0; if (p.test(s)) return true; } return false; }

let base = 0, mut = 0, benignHit = 0;
for (const s of BENIGN) {
  if (hit(BASE, s)) base++;
  if (hit(MUT, s)) { mut++; benignHit++; }
}
console.log(`良性 45 句（不含 D 组）：base block=${base}, mutant block=${mut}`);

let atkBase = 0, atkMut = 0, atkTotal = 0;
for (const v of VERBS) {
  for (const o of OBJS.slice(0, 6)) {
    atkTotal++;
    if (hit(BASE, v + ' ' + o)) atkBase++;
    if (hit(MUT, v + ' ' + o)) atkMut++;
  }
}
console.log(`攻击 42 格：base=${atkBase}, mutant=${atkMut}, total=${atkTotal}`);
fs.unlinkSync(path.join(ROOT, 'src/__mutant-tmp.js'));
console.log('DONE');
