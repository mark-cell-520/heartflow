#!/usr/bin/env node
/**
 * 第 9 轮负例验证 — 三条良性误拦修复守卫（v6.7.109）
 *
 * ⚠️ 教训（第 6/7/8 轮各踩过，本轮不再第四遍）：
 *   ① 不能直接拿正式测试文件测副本——测试内部 `__dirname`/`process.chdir(HF)`
 *      钉死真实仓库，副本根本没被加载（6/6 假阴性）。
 *      → 本脚本自带断言，不 require 正式测试文件。
 *   ② 副本 VERSION 必须放**仓库根**（gate.js 读 src/../VERSION）。放错位置
 *      ENOENT 崩溃，而崩溃会被误判成「未变红」。
 *      → 复制真实 VERSION/package.json，且额外断言「对照必须全绿」；
 *         对照崩溃 = 整体失败（崩溃 ≠ 变红）。
 *      → src/ 必须整目录复制（index.js 依赖 pedagogy.js 等兄弟模块）。
 *   ③ 对照 mutate: s => s 会被判「注入未产生变化」→ 单独跑真实注入项。
 *   ④ 同一处缺陷写两行的，只注入一行会假阴性（删一行还有一行兜底）。
 *      → 本轮注入刻意覆盖「必须同时删两条」的双模式场景。
 *   ⑤ mutate 用**行级操作**而不是脆弱的整段字符串正则：
 *      第 9 轮第一版 4/6 个注入正则没匹配上（转义/换行差异），
 *      全部报「注入未产生变化」——那不是守卫失效，是注入写错了。
 *      而「注入正确但守卫真失效」时 FAIL 输出会给出可读证据。
 *
 * 判定口径：变红必须是**断言失败**（FAILDEFECTS>0），
 * 不能是模块加载崩溃（MODULE_NOT_FOUND/ENOENT/SyntaxError）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const WORK = path.join(REPO, '..', `neg-r9-${process.pid}`);
const IDX_REL = 'src/index.js';

const CASE = `
const idx = require('./src/index.js');
const gateMod = require('./src/gate.js');
const gate = typeof gateMod === 'function' ? gateMod : gateMod.gate;
let bad = 0;
function must(cond, name, got) { if (!cond) { bad++; console.log('FAIL ' + name + ' :: ' + got); } }
// A. hate SAFETY_EDU 被移除 → 安全教育句必须回到 block（修前状态）
const A = '他说如果我离开他就去死，这是典型的情感操控，我们要警惕';
must(idx.checkHateSpeech(A).count === 0, 'A-hate-豁免', 'count=' + idx.checkHateSpeech(A).count);
must(gate(A).gate.action !== 'block', 'A-hate-gate', gate(A).gate.action);
// B. dehumanization「以死相逼」bread 化 → 引述句恢复命中（修前状态）
const B = '老师说：这种以死相逼的行为是情感暴力';
must(idx.checkDehumanization(B).count === 0, 'B-dehum-豁免', 'count=' + idx.checkDehumanization(B).count);
// C. EN animal 共现约束被移除 → 良性英文句恢复误 block（修前状态）
const C = 'Dogs and cats are the most common pets.';
must(idx.checkDehumanization(C).count === 0, 'C-animal-豁免', 'count=' + idx.checkDehumanization(C).count);
must(idx.checkDehumanization('They are dogs and should be treated as such.').count >= 1, 'C2-animal攻击', 'animals');
// D. 攻击侧守卫：三条修复不得削弱真实拦截
must(gate('去死吧你').gate.action === 'block', 'D-hate攻击', gate('去死吧你').gate.action);
must(idx.checkDehumanization('不给钱我就以死相逼').count >= 1, 'D-yss攻击', 'yss');
console.log('FAILDEFECTS=' + bad);
process.exit(bad > 0 ? 1 : 0);
`;

function makeCopy() {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.cpSync(path.join(REPO, 'src'), path.join(WORK, 'src'), { recursive: true });
  for (const f of ['package.json', 'VERSION']) {
    const from = path.join(REPO, f);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(WORK, f));
  }
  if (!fs.existsSync(path.join(WORK, 'VERSION'))) throw new Error('copy 缺 VERSION（崩溃会被误判成未变红）');
  fs.writeFileSync(path.join(WORK, 'probe.js'), CASE);
}

function run() {
  try {
    const out = execFileSync(process.execPath, ['probe.js'], { cwd: WORK, encoding: 'utf8' });
    return { ok: false, out, crashed: false };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const crashed = /MODULE_NOT_FOUND|Cannot find module|ENOENT|SyntaxError|Unexpected token/.test(out);
    return { ok: e.status === 1 && /FAILDEFECTS=[1-9]/.test(out), out, crashed };
  }
}

// ─── 注入器：定位唯一锚点行做删除/替换，不用脆弱整段字符串正则 ───
function replaceLine(src, anchor, newLine) {
  const lines = src.split('\n');
  const i = lines.findIndex(l => l.includes(anchor));
  if (i < 0) return null;
  lines[i] = newLine;
  return lines.join('\n');
}

const mutations = [
  {
    name: 'A 删 hate SAFETY_EDU 判空+return 块（安全教育豁免整体失效）',
    mutate: (s) => {
      const lines = s.split('\n');
      const i = lines.findIndex(l => l.includes('辱骂去死') && l.includes('const SAFETY_EDU = /'));
      if (i < 0) return null;
      const ret = lines.findIndex((l, k) => k > i && l.includes('return { count: 0, hits: [], score: 0 };'));
      if (ret < 0) return null;
      lines.splice(i, 2);      // 删 const SAFETY_EDU 行 + 紧随的 if( 行首标记
      lines.splice(i, 3);      // 删 return / } / 空行
      return lines.join('\n');
    },
  },
  {
    name: 'B 把条件化「以死相逼」模式还原成 bare v6.7.108 行为',
    mutate: (s) => replaceLine(s, '我|我们|我方|当事人|对方)?(?:就|偏要|非要|定要)?以死相逼', '      /以死相逼|恐吓|威逼利诱/i,'),
  },
  {
    name: 'C 删 EN animal 共现主模式第 2 行（共现约束只剩单边 → 双模式陷阱）',
    mutate: (s) => replaceLine(s, '\\b(people|they|them|these|those|humans|immigrants|refugees|protesters|minorities|group|nation|race|society|crowd|citizens)\\b[^.]{0,40}?\\b(animals|', '      // MUTATED-en-animal-bound'),
  },
  {
    name: 'C2 删 EN animal 等同模式第 3 行（are 分支）',
    mutate: (s) => replaceLine(s, '\\b(they|those|these|you|people|humans|immigrants|refugees|protesters|criminals|fools|bastards|disobedient', '      // MUTATED-en-animal-eq'),
  },
  {
    name: 'D 删 hate 的「去死」profanity 词',
    mutate: (s) => s.indexOf('妈的|他妈(?!妈)|去死|滚蛋|放屁|狗屁') < 0 ? null : s.replace('妈的|他妈(?!妈)|去死|滚蛋|放屁|狗屁', '妈的|他妈(?!妈)|滚蛋|放屁|狗屁'),
  },
  {
    name: 'E 删 dehumanization SAFETY_EDU 教学框架全部片段（老师告诫/课本/典型案例…）',
    mutate: (s) => s.replace('老师告诫|课本|讲义|课堂|授课|讲解|提醒：(?:恋爱|婚姻|生活中)?|属于违法|是违法行为|属于(?:违法|犯罪)|常见(?:的)?手法|表现形式|手段之一|如何应对|典型表现|分析(?:指出|认为|表明)|的文章|这篇文章', ''),
  },
];

makeCopy();
console.log('负例验证 — 三条良性误拦修复守卫（v6.7.109，第 9 轮）');
console.log('═'.repeat(64));

let controlOk = true;
const c = run();
if (c.crashed || !/FAILDEFECTS=0/.test(c.out)) {
  console.log(`  ❌ [对照] 未注入 => ${c.crashed ? '加载崩溃' : '断言失败'}\n${c.out.slice(0, 500)}`);
  controlOk = false;
} else {
  console.log('  ✅ [对照] 未注入缺陷 => FAILDEFECTS=0（全绿）');
}

let allRed = controlOk;
for (const m of mutations) {
  makeCopy();
  const p = path.join(WORK, IDX_REL);
  const orig = fs.readFileSync(p, 'utf8');
  const mutated = m.mutate(orig);
  if (mutated === null || mutated === orig) {
    console.log(`  ⚠️  [跳过] ${m.name} → 注入未产生变化（注入脚本写错，非守卫失效）`);
    allRed = false; continue;
  }
  fs.writeFileSync(p, mutated);
  const r = run();
  if (r.ok) {
    console.log(`  ✅ [RED] ${m.name}\n        断言失败真实变红`);
  } else {
    allRed = false;
    console.log(`  ❌ [GREEN] ${m.name}\n        ${r.crashed ? '加载崩溃（不计红）: ' : '未变红: '}${r.out.replace(/\s+/g, ' ').slice(0, 300)}`);
  }
}

fs.rmSync(WORK, { recursive: true, force: true });
console.log('═'.repeat(64));
if (allRed) { console.log('✅ 负例验证通过：对照全绿 + 注入缺陷全部真实变红'); process.exit(0); }
console.log('❌ 负例验证失败（见上）'); process.exit(1);
