#!/usr/bin/env node
/**
 * negative-test-en-subjectless-r413.js — 注入-删条守卫（v6.7.131 r413）
 *
 * 验证 test/round-413-en-subjectless-authority.test.js 真的在守门：
 * 把 src/index.js 里本轮新增的四条英文正则逐条删掉（替换成永不匹配的
 * 合法正则），守卫必须变红 —— 对应攻击样本必须回到 pass。
 *
 * 若删条后守卫反而全绿，说明断言没有真正钉在这条判据上（假阴性）。
 *
 * ⚠️ 第一版踩的坑（本轮实测）：用手写锚点（如 `\bdepartment\s+concerned`）
 *    定位正则，结果第一个锚点命中的是**注释里的英文例句**
 *    （「The relevant department is looking into this issue.」），
 *    lastIndexOf('/') + indexOf('/i') 取到一段垃圾文本 —— 注入替换了无关
 *    内容却报「变红」，是假阳性。改成**按行结构化提取正则字面量**：
 *    只认 `^\s{4}/.../i,\s*$` 形态的行，从该行第一个 '/' 取到最后一个 '/i'。
 *
 * 其余沿用 negative-test-absolute-claim-en.js 的教训：
 *   ① 不 require 正式测试文件 —— 它内部 __dirname 钉死真实仓库
 *   ② 不用 node -e 内联脚本 —— 安全扫描会拦
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s）
 *   ④ 还原只许写回内存快照 / 重建副本，不许 git checkout
 *
 * 用法：node scripts/negative-test-en-subjectless-r413.js
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

const BLOCK_START = SRC.indexOf('[r413] 责任主体缺位族（公共机构口径）英文侧');
if (BLOCK_START < 0) { console.error('未找到 r413 新增块'); process.exit(1); }

/** 从新增块里按行提取正则字面量（只认整行就是一条 /.../i, 的形态） */
function extractBlockRegexes() {
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 6000);
  const out = [];
  const lines = seg.split('\n');
  for (const line of lines) {
    if (line.includes('// ===')) break; // 遇到下一个小节头即停
    const m = line.match(/^\s{4}(\/.*\/i),\s*$/);
    if (m) out.push(m[1]);
  }
  return out;
}
const BLOCK_REGEXES = extractBlockRegexes();
if (BLOCK_REGEXES.length !== 4) {
  console.error('期望提取到 4 条新正则，实际 ' + BLOCK_REGEXES.length + ' 条');
  process.exit(1);
}

// 每条注入的代表攻击样本（删它 → 该样本必须回到 pass）
const EXPECT_MISS = [
  'The relevant department is looking into this issue.',
  'The department concerned is handling the case.',
  'Relevant authorities have yet to give an explanation.',
  'Officials are investigating.',
];

const BENIGN_GROUP = [
  'Please submit the documents to the relevant department.',
  'The relevant department replied within three business days.',
  'Relevant authorities issued a statement on Monday.',
  'Officials have confirmed the investigation results.',
  'Authorities are still reviewing the guidance, but a decision is expected Friday.',
  'Relevant authorities have not yet responded to our inquiry.',
  'The department concerned has already sent its reply.',
];

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runProbe(dir, file, samples, mode) {
  const probe = path.join(dir, file);
  fs.writeFileSync(probe, [
    'const { gate } = require(' + JSON.stringify(path.join(dir, 'src', 'gate.js')) + ');',
    'const samples = ' + JSON.stringify(samples) + ';',
    'let n = 0;',
    'for (const s of samples) {',
    '  try {',
    '    const r = gate(s);',
    '    const a = (r.gate && r.gate.action) || "pass";',
    '    if (' + (mode === 'attack' ? 'a === "pass"' : 'a !== "pass"') + ') { n++; console.log((a === "pass" ? "MISS " : "FP " + a + " ") + s.slice(0, 45)); }',
    '  } catch (e) { n++; console.log("ERR " + e.message); }',
    '}',
    'console.log("' + (mode === 'attack' ? 'ATTACK_MISS' : 'BENIGN_FP') + '=" + n + "/" + samples.length);',
    'process.exit(n > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/ATTACK_MISS=(\d+)\/(\d+)/);
  results.push([name, '变红（miss ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
}

// ① 对照副本：未注入 → 攻击全命中、良性全 pass
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-r413-control'), s => s, true);
  try {
    const a = runProbe(dir, '_p_a.js', EXPECT_MISS, 'attack');
    const b = runProbe(dir, '_p_b.js', BENIGN_GROUP, 'benign');
    const okA = /ATTACK_MISS=0\//.test(a);
    const okB = /BENIGN_FP=0\//.test(b);
    if (!okA || !okB) { green++; console.error('对照副本未全绿:\n' + a + '\n' + b); }
    results.push(['对照（未注入）', okA && okB ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ② 逐条注入：攻击必须失守（变红），良性不得被带成误伤
for (let i = 0; i < BLOCK_REGEXES.length; i++) {
  const needle = BLOCK_REGEXES[i];
  const sample = EXPECT_MISS[i];
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-r413-' + i),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runProbe(dir, '_p_a.js', [sample], 'attack');
    if (/ATTACK_MISS=0\//.test(out)) {
      green++;
      results.push(['第 ' + (i + 1) + ' 条正则', '未变红（守卫失守）']);
      continue;
    }
    let fpNote = '';
    try {
      const b = runProbe(dir, '_p_b.js', BENIGN_GROUP, 'benign');
      const m = b.match(/BENIGN_FP=(\d+)\//);
      fpNote = m && m[1] !== '0' ? '；良性误伤 ' + m[1] + '（需评估）' : '；良性 0 误伤';
    } catch (e2) { fpNote = '；良性副本退出非零'; }
    recordRed(out, '第 ' + (i + 1) + ' 条正则' + fpNote);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/ATTACK_MISS=[1-9]/.test(out)) {
      recordRed(out, '第 ' + (i + 1) + ' 条正则');
    } else {
      results.push(['第 ' + (i + 1) + ' 条正则', '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 160)]);
      green++;
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + BLOCK_REGEXES.length + ' 条：' + red + ' 条让守卫变红，' + green + ' 条未变红');
const pass = red === BLOCK_REGEXES.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
