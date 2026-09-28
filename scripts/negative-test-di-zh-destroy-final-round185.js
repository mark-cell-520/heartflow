#!/usr/bin/env node
/**
 * negative-test-di-zh-destroy-final-round185.js
 * 第 185 轮负例守卫：验证「中文销毁动词 × 高危语境 × 中文表对象（动词后置
 * 语序族）」两支判据真的在守门。
 *
 * 手法（第 134 轮同款骨架）：逐支从 DANGEROUS_PATTERNS **物理删除**该正则行。
 * 删掉后，对应语序的攻击样本必须重新 di=0（pass）——若仍命中，说明样本被别支
 * 顺带拦，如实记账 NOT_RED。
 *
 * ⚠️ 锚点从**源码自取**，不手写正则字面量（第 113 轮教训：手写 needle 多写
 *    一层反斜杠 → 全部注入「未生效」假阴性）。定位口径：
 *      · 正则行 = trim 后以 '/' 开头、以 '/i,' 结尾（注释行同形字样会骗过
 *        裸 indexOf，第 134 轮首轮 7/9 NOT_RED 就是这个根因）
 *      · 本轮两支独有的共现标记 = 行内同时含「过期|失效|历史」与「归档」
 *        （293 行的同族负向断言只有前者、无「归档」，故可唯二分出两行）
 *      · 两行再按「含 把|将」区分：含者为把字句支，不含者为陈述语序支
 *
 * ⚠️ 崩溃 ≠ 变红：删整行正则不会语法错误，若崩单独归类 crashed。
 * ⚠️ 探针只报数字，样本不贴 stdout 之外的任何地方。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'dangerous-instruction.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

/** 从源码自取本轮两支正则行文本（供删除用） */
function extractBranches() {
  const lines = SRC.split('\n');
  const found = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    if (!t.startsWith('/') || !t.endsWith('/i,')) return;
    if (t.indexOf('过期|失效|历史') < 0) return;
    if (t.indexOf('归档') < 0) return;
    found.push({
      line: i,
      text: t,
      isBaZi: t.indexOf('把|将') >= 0,
    });
  });
  return found;
}

const BRANCH_LINES = extractBranches();
if (BRANCH_LINES.length !== 2) {
  console.log('❌ 预期从源码取到 2 支本轮判据，实际 ' + BRANCH_LINES.length + ' 支');
  process.exit(1);
}
// 索引 0 = 先出现者（把字句支），1 = 陈述语序支（按源码顺序固定）
const BAZI = BRANCH_LINES[0];
const DECL = BRANCH_LINES[1];

// 每支的专属样本（实测：删本支+共覆盖另一支后该样本归零）
const BRANCHES = [
  { name: '把字句支：把+高危语境+表对象+副词+中文动词', key: BAZI, sample: '把生产库的用户表全部删除' },
  { name: '陈述语序支：高危语境+表对象+副词+中文动词（无把/与）', key: DECL, sample: '生产库的用户表全部删除' },
];

function makeCopy(dir, target, alsoDelete) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const fp = path.join(dir, 'src', 'dangerous-instruction.js');
  const before = fs.readFileSync(fp, 'utf8');
  const lines = before.split('\n');
  const toDelete = [target].concat(alsoDelete || []);
  // ⚠️ 必须**按行号降序**删：升序删会让后续行号全部前移 1（边删边移），
  //    第二个 delete 必然「未找到目标行」（本轮第一次就是这么崩的）。
  const sorted = toDelete.slice().sort((x, y) => y.line - x.line);
  for (const tgt of sorted) {
    if (tgt.line >= lines.length || lines[tgt.line].trim() !== tgt.text) {
      throw new Error('副本内目标行不匹配: ' + tgt.line);
    }
    lines.splice(tgt.line, 1);
  }
  const after = lines.join('\n');
  if (after === before) throw new Error('注入未改变源码');
  fs.writeFileSync(fp, after);
  return dir;
}

function runProbe(dir, sample) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const di = require(' + JSON.stringify(path.join(dir, 'src', 'dangerous-instruction.js')) + ');',
    'const s = ' + JSON.stringify(sample) + ';',
    'const r = di.checkDangerousInstruction(s);',
    'console.log("DI_COUNT=" + r.count);',
  ].join('\n'));
  try {
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = /DI_COUNT=(\d+)/.exec(out);
    return { count: m ? Number(m[1]) : -1, crashed: !m };
  } catch (e) {
    return { count: -1, crashed: true, err: String(e.message || '').slice(0, 120) };
  }
}

let red = 0, green = 0, crashed = 0, controlOk = 0;
const rows = [];

// ① 对照：未注入副本，两条专属样本必须全命中
{
  const dir = path.join(os.tmpdir(), 'hf-di-zh185-control');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const miss = BRANCHES.filter(b => runProbe(dir, b.sample).count === 0);
  if (miss.length === 0) { rows.push(['对照（未注入）2 条专属样本全命中', 'PASS']); controlOk++; }
  else { rows.push(['对照未全命中: ' + miss.map(m => m.name).join('/'), 'FAIL']); }
}

// ② 逐支删除（连带删共覆盖的另一支）：对应样本必须重新 di=0
//    两支对本族形是共覆盖（样本同时命中两支），故删单支另一支仍会命中。
//    判据是「本族形由本轮两支独立覆盖」——删掉两支后必须归零。
for (const b of BRANCHES) {
  const other = BRANCHES.find(x => x !== b);
  try {
    const dir = makeCopy(
      path.join(os.tmpdir(), 'hf-di-zh185-' + Buffer.from(b.name).toString('hex').slice(0, 8)),
      b.key,
      [other.key]
    );
    const r = runProbe(dir, b.sample);
    if (r.crashed) { rows.push([b.name, '崩溃（不计红）']); crashed++; }
    else if (r.count === 0) { rows.push([b.name, '变红（守卫生效）']); red++; }
    else { rows.push([b.name + ' 仍命中 count=' + r.count, 'NOT_RED']); green++; }
  } catch (e) {
    rows.push([b.name, '异常: ' + String(e.message).slice(0, 60)]); crashed++;
  }
}

console.log('\n=== 第185轮 中文销毁动词语序族负例守卫 ===');
for (const [n, r] of rows) console.log('  ' + String(r).padEnd(40) + ' ' + n);
console.log('\n注入 ' + BRANCHES.length + ' 支：' + red + ' 支删后攻击转 pass（真守卫）'
  + ' / ' + green + ' 支未转 pass / ' + crashed + ' 异常');
const ok = controlOk === 1 && crashed === 0 && red === BRANCHES.length;
console.log(ok ? '\n负例验证通过（2/2 真守卫）' : '\n负例验证未通过');
process.exit(ok ? 0 : 1);
