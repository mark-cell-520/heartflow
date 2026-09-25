'use strict';
/**
 * negative-test-slippery-zh-round46.js — 负例验证（v6.7.127 第 46 轮）
 *
 * 验证 test/slippery-slope-zh-vernacular-round46.test.js 真的在守门：
 * 把 src/index.js 里第 46 轮新增的 5 条判据替换成永不匹配的正则，
 * 守卫必须变红（攻击样本 0 命中）。
 *
 * [第 46 轮修正] 第一版逐条注入全部落「有兜底」——族内 5 条判据互相覆盖，
 * 旧判据（sooner_or_later 早晚会/迟早会）也兜底。改为**整族注入**：
 * 5 条一起换成永不匹配，攻击样本必须全部归零（旧判据覆盖不到的样本兜不住）。
 * 语义等价于「回滚本族判据 = 回到第 46 轮之前，攻击必须全漏判」。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'index.js');
const NEVER_MATCH = '/^$(?!)/';

const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const LINES = SRC.split('\n');

const TYPES = ['give_in_then_disaster', 'concession_then_collapse', 'precedent_multiplier', 'erosion_of_standard'];
const TAIL_RE = new RegExp(",\\s*'(?:" + TYPES.join('|') + ")'\\s*\\]\\s*,?\\s*$");

// 攻击样本：整族删除后必须全部归零（旧判据覆盖不到的样本兜不住）
const ATTACK = [
  '如果今天允许员工居家办公，用不了多久大家就都不来公司了，公司很快就会倒闭',
  '如果现在放开这个审批，以后什么人都能混进来，用不了多久系统就会全面崩盘',
  '一旦允许这个口子，接下来所有团队都会效仿，标准会一降再降',
  '现在放宽一次标准，用不了多久底线就会被彻底击穿',
  '要是这次破例，以后每次都会拿这次当先例，制度很快就名存实亡',
  '如果今天不阻止这种行为，明天整个行业都会跟着烂下去',
  '这次让了步，下一次就会得寸进尺，最后我们会完全失去主动权',
  '如果这次妥协，很快同样的要求就会越来越多，最后崩盘',
  '现在松一寸，往后就会松一尺，规矩很快会名存实亡'
];

const rows = [];
LINES.forEach((line, i) => {
  const m = line.match(TAIL_RE);
  if (m && /^\s*\[\//.test(line)) rows.push({ line: i + 1, bodyEnd: m.index, raw: line });
});

console.log('═══ 注入前校验（本族判据行，漂移即中止）═══');
if (rows.length !== 5) {
  console.error('❌ 本族判据行数 ' + rows.length + ' != 5，源码已漂移');
  process.exit(1);
}
for (const r of rows) console.log('  ✅ 行 ' + r.line + ' → ' + r.raw.slice(6, 64) + '…');

function mutateAll(src) {
  let out = src;
  for (const r of rows) {
    let needle = LINES[r.line - 1].slice(0, r.bodyEnd).trim();
    if (needle.startsWith('[')) needle = needle.slice(1);
    const i = out.indexOf(needle);
    if (i === -1) throw new Error('needle not found at line ' + r.line);
    out = out.slice(0, i) + NEVER_MATCH + out.slice(i + needle.length);
  }
  return out;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-neg46-'));
const proj = path.join(tmp, 'proj');
fs.mkdirSync(proj);
fs.cpSync(path.join(HF, 'src'), path.join(proj, 'src'), { recursive: true });
fs.copyFileSync(path.join(HF, 'VERSION'), path.join(proj, 'VERSION'));
const p = path.join(proj, 'src', 'index.js');
fs.writeFileSync(p, mutateAll(fs.readFileSync(p, 'utf8')));
const probePath = path.join(proj, 'probe.js');
fs.writeFileSync(probePath, '\n  const idx = require(\'./src/index.js\');\n  const samples = ' + JSON.stringify(ATTACK) + ';\n  console.log(JSON.stringify(samples.map(t => idx.checkSlipperySlope(t).count || 0)));\n');

console.log('\n═══ 整族注入（5 条判据 → 永不匹配）═══');
let counts;
try {
  counts = JSON.parse(execFileSync('node', [probePath], { cwd: proj, encoding: 'utf8', timeout: 60000 }).trim());
} catch (e) {
  console.log('❌ 探针崩溃（不是变红）— ' + String(e.message).slice(0, 80));
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}
const survivors = counts.map((n, i) => [n, ATTACK[i]]).filter((x) => x[0] > 0);
console.log('  注入后命中分布: ' + JSON.stringify(counts));
if (survivors.length === 0) {
  console.log('  ✅ 攻击样本全部 0 命中（守卫变红）——本族判据是真守卫');
  console.log('\n═══ 负例结果：真守卫（整族 5 条）/ 0 有兜底 / 0 崩溃 ═══');
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}
console.log('  ⚠️  注入后仍有 ' + survivors.length + ' 条被旧判据兜底:');
for (const s of survivors) console.log('     count=' + s[0] + ' ' + s[1].slice(0, 40));
console.log('\n═══ 负例结果：0 真守卫 / 有兜底 ═══');
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(1);
