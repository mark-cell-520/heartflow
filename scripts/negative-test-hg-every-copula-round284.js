// 第 284 轮负例守卫：对 fix1（281 判据群体表补 39 词）做源码变异，验证守卫有效。
// 三支真变异（删词/破坏分组/去否定排除）+ 一支无效变异对照。
// 纪律：只报数字，不贴样本原文。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const IDX = 4919; // 281 主判据所在行（0-based）

function readJudgeLine() {
  const lines = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n');
  return lines[IDX];
}

function writeJudgeLine(newLine) {
  const p = path.join(ROOT, 'src', 'index.js');
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  lines[IDX] = newLine;
  fs.writeFileSync(p, lines.join('\n'));
}

function run281() {
  try {
    const out = execSync(`node ${JSON.stringify(path.join(ROOT, 'test', '_mount.js'))} ${JSON.stringify(path.join(ROOT, 'test', 'hasty-every-copula-round281.test.js'))}`,
      { cwd: ROOT, encoding: 'utf8', timeout: 120000, maxBuffer: 48 * 1024 * 1024 });
    return { exit: 0, out };
  } catch (e) {
    return { exit: e.status === undefined ? 'err' : e.status, out: (e.stdout || '').toString() };
  }
}

function summary(out) {
  const m = out.match(/共 (\d+) 个断言: (\d+) 通过, (\d+) 失败/);
  return m ? { total: +m[1], pass: +m[2], fail: +m[3] } : null;
}

const original = readJudgeLine();
const results = [];

// M1：删除新增的 5 个测试池词（players/drivers/voters/readers/patients）
const M1 = original.replace('|players?', '|XPLAYERSX?');
writeJudgeLine(M1);
let r = run281();
results.push({ id: 'M1', desc: '删 players（破坏 281 测试池 player 族）', exit: r.exit, sum: summary(r.out) });
writeJudgeLine(original);

// M2：删除全部 39 个新词中的 voters（复数族）
const M2 = original.replace('|voters?', '|XVOTERSX?');
writeJudgeLine(M2);
r = run281();
results.push({ id: 'M2', desc: '删 voters（复数族全漏）', exit: r.exit, sum: summary(r.out) });
writeJudgeLine(original);

// M3：破坏否定排除（删否定前瞻）——284 轮实测为**无效变异**。
// 285 轮 probe-prove-redundant 证明：前瞻语义冗余，因为 is\s+ 后紧跟的
// `(?:a\s+|an\s+)?` 结构本来就无法吃掉 `not`（dropped 判据下
// 'every user is not a fool.' 仍 false）；改写成显式 `(?:not\s+)?`
// 才让 NEG 开始命中。故删前瞻不改变任何行为，移入无效变异组。
// 真变异由 M5（删冠词可选组）承担结构面守卫。

// M5：删除冠词可选组 `(?:a\s+|an\s+)?` —— 正例句族依赖它，必须变红
const M5 = original.replace('(?:a\\s+|an\\s+)?', 'XXXXXXXXX');
let rM5 = { exit: 'NO_MATCH', out: '' };
if (M5 !== original) {
  writeJudgeLine(M5);
  rM5 = run281();
  results.push({ id: 'M5', desc: '删冠词可选组 (正例句族全漏)', exit: rM5.exit, sum: summary(rM5.out) });
  writeJudgeLine(original);
} else {
  results.push({ id: 'M5', desc: '删冠词可选组', exit: 'NO_MATCH', sum: null });
}

// M4：无效变异（在注释文字里改一个无关字符）——必须全绿
const M4 = original.replace('[第 283 轮]', '[第 284 轮]');
writeJudgeLine(M4);
r = run281();
results.push({ id: 'M4', desc: '无效变异（改注释轮次号）', exit: r.exit, sum: summary(r.out) });
writeJudgeLine(original);

// 对照：恢复后必须全绿
r = run281();
results.push({ id: 'RESTORE', desc: '恢复原判据', exit: r.exit, sum: summary(r.out) });

console.log(JSON.stringify(results, null, 1));
const bad = results.filter(x => x.id !== 'RESTORE' && (!x.sum || x.sum.fail === 0));
const restoreBad = results.filter(x => x.id === 'RESTORE' && (!x.sum || x.sum.fail > 0));
console.log('MUTANTS_RED ' + (results.filter(x => ['M1', 'M2', 'M5'].includes(x.id) && x.sum && x.sum.fail > 0).length) + '/3');
console.log('INVALID_MUTANT_GREEN ' + (results.filter(x => ['M4'].includes(x.id) && x.sum && x.sum.fail === 0).length) + '/1');
console.log('RESTORE_GREEN ' + (restoreBad.length === 0 ? 1 : 0) + '/1');
if (bad.length || restoreBad.length) process.exit(1);
