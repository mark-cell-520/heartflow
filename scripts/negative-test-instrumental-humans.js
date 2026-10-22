#!/usr/bin/env node
/**
 * scripts/negative-test-instrumental-humans.js
 * [v6.7.108] 负例验证 — instrumental_reasoning 英文"把人当手段"守卫
 *
 * 用法：node scripts/negative-test-instrumental-humans.js
 *
 * 姿势（沿用第 7 轮踩坑后固定的正确做法，别再踩第二遍）：
 *   1. **不能直接跑正式测试文件测副本**——正式测试内部
 *      `path.join(__dirname, '..')` 写死指向真实项目，require 到的是
 *      原引擎，注入的副本永远不生效（本轮第一版就这样，6/6 全部未变红，
 *      差点误判成"守卫失效"）。
 *   2. 正解：把样本断言写成内联探针字符串，require 副本的 index.js
 *      （路径由环境变量 HF_ROOT 注入），输出 `FAILDEFECTS=<n>`。
 *   3. 对照副本必须先 FAILDEFECTS=0（否则证据力归零）。
 *   4. 变红必须是断言失败（FAILDEFECTS>0），不能是加载崩溃。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neginst-'));

// 内联探针：与 test/instrumental-humans-as-means-en.test.js 的样本一致
const PROBE = `
const _t = require(process.env.HF_ROOT + '/src/index.js');
const HITS = [
  'He is just a tool, discard him when done.',
  'Lying is acceptable if it gets us the result we want.',
  'We can leverage their emotions to close the deal.',
  'Efficiency matters more than anyone\\u2019s feelings here.',
  'If it increases profit, the harm to others is irrelevant.',
  'Keep people around while they are useful, then move on.',
  'Employees are consumables, replace them when used up.',
  'Cheating is a valid approach as long as we win.',
  'She is nothing but a resource to the company.',
  'We can use their fear as leverage in negotiations.',
  'The bottom line justifies any harm to the workers.',
  'Profit trumps their safety, that is how business works.',
  'It is fine to deceive customers if we close the deal.',
  'Trust is just a tool for us to get what we want.',
  'Deception is normal when we need to close a sale.',
  'Results justify whatever harm happens along the way.',
];
const BENIGN = [
  'Use this tool and discard it when you are done.',
  'The library is a tool, use it and move on to the next one.',
  'Treat stress as a tool, not an enemy.',
  'This framework is just a means to an end, nothing more.',
  'Use people metrics as a tool, not as a weapon.',
  'We can use data as leverage in the negotiation.',
  'Use the analogy and discard it later.',
  'This knife is a tool; discard it if it gets dull.',
  'Emotions are data we can study in psychology class.',
  'Efficiency matters more than aesthetics for a database index.',
  'The result justifies the effort we put in.',
  'If it increases profit, we should reinvest in the team.',
  'Keep the document while it is useful, then archive it.',
  'Stress is a signal, not an enemy to be discarded.',
  'Use the analogy from physics and discard it when it stops fitting.',
  'Mistakes are learning opportunities, not failures.',
  'Remove unused imports when you are done refactoring.',
  'Lying is not acceptable under any circumstances.',
  'Cheating is never acceptable in an exam.',
  'Replace the faulty component when it wears out.',
  'The team should prioritize wellbeing over throughput.',
  'Disposable gloves are essential in the lab.',
];
let f = 0;
for (const t of HITS) if (_t.checkInstrumentalReasoning(t).count === 0) { f++; console.log('MISS ' + t); }
for (const t of BENIGN) if (_t.checkInstrumentalReasoning(t).count !== 0) { f++; console.log('FALSEPOS ' + t); }
console.log('FAILDEFECTS=' + f);
process.exit(f > 0 ? 1 : 0);
`;

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

let seq = 0;
function makeVariant(mutate) {
  // 副本项目根 = TMP/vN，源码放 TMP/vN/src —— gate.js 与 index.js 读的是
  // 项目根的 VERSION（src/../VERSION），放错位置就是 ENOENT 崩溃，
  // 而崩溃会被误判成"未变红"（第 6/7/8 轮三次踩同一个坑）。
  const dir = path.join(TMP, 'v' + (seq++));
  const projRoot = dir;
  const srcDir = path.join(dir, 'src');
  copyDir(SRC, srcDir);
  fs.writeFileSync(path.join(projRoot, 'VERSION'), fs.readFileSync(path.join(ROOT, 'VERSION')));
  try { fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(projRoot, 'package.json')); } catch (_) {}
  const indexPath = path.join(srcDir, 'index.js');
  const before = fs.readFileSync(indexPath, 'utf8');
  let after;
  try { after = mutate(before); } catch (e) { return { error: e.message }; }
  if (after === before) return { error: '注入未产生变化（needle 未命中）' };
  fs.writeFileSync(indexPath, after);
  const probe = path.join(srcDir, '.probe.js');
  fs.writeFileSync(probe, PROBE);
  let out;
  try {
    out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HF_ROOT: projRoot } });
    return { exit: 0, failed: 0, out };
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    const m = out.match(/FAILDEFECTS=(\d+)/);
    if (m) return { exit: e.status, failed: Number(m[1]), out };
    return { exit: e.status, failed: -1, out }; // 加载崩溃，不算变红
  }
}

function cut(src, fromStr, toStr) {
  const ls = src.split('\n');
  const a = ls.findIndex(l => l.includes(fromStr));
  if (a < 0) throw new Error('未找到起点: ' + fromStr.slice(0, 50));
  const b = ls.findIndex((l, i) => i >= a && l.includes(toStr));
  if (b < 0) throw new Error('未找到终点: ' + toStr.slice(0, 50));
  return ls.slice(0, a).concat(ls.slice(b + 1)).join('\n');
}
function dropLine(src, needle) {
  const ls = src.split('\n');
  const i = ls.findIndex(l => l.includes(needle));
  if (i < 0) throw new Error('未找到行: ' + needle.slice(0, 50));
  return ls.slice(0, i).concat(ls.slice(i + 1)).join('\n');
}

// ── 对照：未注入缺陷的干净副本必须先全绿 ──
{
  const dir = path.join(TMP, 'control');
  const projRoot = dir;
  const srcDir = path.join(dir, 'src');
  copyDir(SRC, srcDir);
  fs.writeFileSync(path.join(projRoot, 'VERSION'), fs.readFileSync(path.join(ROOT, 'VERSION')));
  try { fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(projRoot, 'package.json')); } catch (_) {}
  const probe = path.join(srcDir, '.probe.js');
  fs.writeFileSync(probe, PROBE);
  let r;
  try {
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HF_ROOT: projRoot } });
    r = { exit: 0, failed: 0, out };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const m = out.match(/FAILDEFECTS=(\d+)/);
    r = m ? { exit: e.status, failed: Number(m[1]), out } : { exit: e.status, failed: -1, out };
  }
  if (r.failed === 0 && r.exit === 0) {
    console.log('  ✅ [对照] 未注入缺陷 => FAILDEFECTS=0（全绿）');
  } else {
    console.log(`  ❌ [对照] 未注入缺陷 failed=${r.failed} exit=${r.exit}`);
    console.log('        ' + String(r.out).split('\n').slice(-8).join('\n        '));
    allOk = false;
  }
}
const INJECTIONS = [
  {
    name: '删工具化首选模式（人 + just/merely + tool/consumable）',
    fn: s => dropLine(s, "(?:tool|asset|resource|commodity|consumable|pawn|cog|instrument|means?|object|product|number)/i, 'humans_as_means']"),
  },
  {
    name: '删"工具化首选 + 弃置动词 + 人"双模式（He is just a tool, discard him）',
    // 说明：该样本由两条模式共同兜底，只删一条会假阴性（FAILDEFECTS=0），
    // 第 7 轮踩过同款坑（care 词表出现在两行）。
    fn: s => {
      const o1 = dropLine(s, "(?:tool|asset|resource|commodity|consumable|pawn|cog|instrument|means?|object|product|number)/i, 'humans_as_means'");
      return dropLine(o1, "\\b(?:discard|dump|ditch|dispose\\s+of|replace|swap\\s+out|use\\s+up)\\s+(?:him|her|them|people|employees?|staff|workers?)\\b");
    },
  },
  {
    name: '删"紧缩可弃置名词 + 弃置动词 + 人"双模式（employees are consumables, replace them）',
    fn: s => {
      const o1 = dropLine(s, "(?:consumables?|disposables?|expendables?|replaceables?|units?|headcount|numbers?|cogs?|pawns?)\\b");
      return dropLine(o1, "\\b(?:discard|dump|ditch|dispose\\s+of|replace|swap\\s+out|use\\s+up)\\s+(?:him|her|them|people|employees?|staff|workers?)\\b");
    },
  },
  {
    name: '删"留人到有用为止"模式（keep people while useful）',
    fn: s => dropLine(s, "(?:keep|holding|retain)\\s+(?:people|them|him|her|employees?|staff|friends?)\\s+(?:around\\s+)?(?:while|as\\s+long\\s+as)\\s+they\\b"),
  },
  {
    name: '删情绪当筹码主模式（leverage + their emotions）',
    fn: s => dropLine(s, "(?:emotions?|feelings?|trust|fear|hope|insecurit(?:y|ies)|loneliness|grief|desire)/i, 'emotions_as_leverage'"),
  },
  {
    name: '删结果优先于伤害主模式（outcome + matters more than harm）',
    fn: s => dropLine(s, "\\b(?:harm|pain|suffering|damage|cost|feelings?|safety|wellbeing|welfare|dignity|health)/i, 'outcome_over_harm'"),
  },
  {
    name: '删"结果优先于伤害"复数版（results justify whatever harm）',
    fn: s => dropLine(s, "\\b(?:results?|outcomes?|profits?|goals?|sales?|numbers?)\\s+justif(?:y|ies)\\s+(?:any|whatever|all|the)\\s+(?:harm|damage|cost|means|harmfulness)"),
  },
  {
    name: '删"欺骗常态化"双模式（deception is normal + is valid…if）',
    fn: s => {
      const out1 = dropLine(s, "(?:normal|standard|common|expected|routine|regular|fine|ok(?:ay)?|acceptable|part\\s+of\\s+the\\s+game)\\b/i, 'ends_justify_means'");
      return dropLine(out1, "\\b(?:acceptable|justified|justifiable|fine|ok(?:ay)?|necessary|pragmatic|smart|valid)\\s+to\\s+(?:lie|cheat|deceive|manipulate|betray|mislead|steal|hurt)\\b");
    },
  },
];

console.log('负例验证 — 把人当手段守卫（v6.7.108）');
console.log('═'.repeat(62));
let allOk = true;

for (const inj of INJECTIONS) {
  const r = makeVariant(inj.fn);
  if (r.error) { console.log(`  ⚠️  [SKIP] ${inj.name}\n        ${r.error}`); allOk = false; continue; }
  const red = r.failed > 0;
  if (!red) allOk = false;
  console.log(`  ${red ? '✅' : '❌'} [RED] ${inj.name}`);
  console.log(`        ${red ? 'FAILDEFECTS=' + r.failed + '（断言失败，真实变红）' : '未变红！FAILDEFECTS=' + r.failed + ' exit=' + r.exit}`);
  if (red) {
    String(r.out).split('\n').filter(l => /MISS|FALSEPOS/.test(l)).slice(0, 3)
      .forEach(l => console.log('        ' + l.trim()));
  } else if (r.failed === -1) {
    console.log('        ' + String(r.out).split('\n').slice(-4).join('\n        '));
  }
}

console.log('═'.repeat(62));
console.log(allOk ? '✅ 负例验证通过：对照全绿 + 注入缺陷全部让守卫变红' : '❌ 负例验证未通过');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(allOk ? 0 : 1);
