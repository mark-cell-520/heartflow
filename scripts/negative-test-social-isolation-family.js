'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
/**
 * scripts/negative-test-social-isolation-family.js
 *
 * [r683] social_isolation（第 106 维）补句式族负例验证脚本。
 * 逐一把本轮新增的六个分支置空（永不被匹配的正则），确认
 * test/round-683-social-isolation-family.js 全部变红；
 * 基线（无注入）必须 exit 0。每次注入前从内存原文重写，
 * 注入后立即还原，结束做 md5 校验。
 *
 * 注入目标（src/social-isolation.js，按行内容 marker 定位，不靠行号）：
 *   1. h 支  任何朋友/邻居名词扩展（ISOLATE_ZH）
 *   2. i 支  删除型隔绝动词后置语序（ISOLATE_ZH）
 *   3. k 支  排他性接触指令（ISOLATE_ZH）
 *   4. l 支  家门形态扩展（ISOLATE_ZH）
 *   5. IMPERATIVE_ZH  把字句祈使自明单腿
 *   6. COERCE i 支  为你好正常化框定
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = __HF;
const SRC = path.join(HF, 'src', 'social-isolation.js');
const TEST = path.join(HF, 'test', 'round-683-social-isolation-family.js');

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const ORIGINAL = fs.readFileSync(SRC, 'utf8');
const ORIGINAL_MD5 = md5(ORIGINAL);

function runTest() {
  try {
    execFileSync(process.execPath, [TEST], { cwd: HF, stdio: 'pipe' });
    return { exit: 0 };
  } catch (e) {
    return { exit: e.status, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}

// marker: 行内唯一内容片段；定位到该行后把整行的 String.raw`...` 换成永假正则
const INJECTIONS = [
  { name: 'h 支 任何朋友/邻居名词扩展置空', marker: '外人|陌生人' },
  { name: 'i 支 删除型动词后置语序置空', marker: '都)?(?:删了|删掉' },
  { name: 'k 支 排他性接触指令置空', marker: '只能|只可以|只能够|惟有|唯有' },
  { name: 'l 支 家门形态扩展置空', marker: '出家门|出门口|离家|离开家门|离开房间' },
  { name: 'IMPERATIVE_ZH 把字句祈使置空', marker: '兄弟姐妹|兄弟|姐妹|爸妈|父母|家人|亲戚' },
  { name: 'COERCE i 支 为你好框定置空', marker: '你(?:好|着想)' },
];

function locateLine(src, marker) {
  const lines = src.split('\n');
  const idx = lines.findIndex(l => l.includes('String.raw`') && l.includes(marker) && /(?:陌生人|删了|只能|出家门|兄弟姐妹|着想)/.test(l));
  return { lines, idx };
}

// ─── 基线：无注入必须 exit 0 ───────────────────────────────────────────
const base = runTest();
console.log('基线（无注入）: exit=' + base.exit + (base.exit === 0 ? ' ✅' : ' ❌ 基线就红，脚本不成立'));
if (base.exit !== 0) { console.log(base.out || ''); process.exit(1); }

// ─── 逐项注入 ─────────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTIONS) {
  const { lines, idx } = locateLine(ORIGINAL, inj.marker);
  if (idx < 0) {
    console.log('❌ ' + inj.name + ' :: 定位失败（marker 未命中或命中行不含 String.raw）');
    allRed = false;
    continue;
  }
  const origLine = lines[idx];
  const mutated = origLine.replace(/String\.raw`[^`]*`/, 'String.raw`(?!x)x`');
  if (mutated === origLine) {
    console.log('❌ ' + inj.name + ' :: 第 ' + (idx + 1) + ' 行替换未生效');
    allRed = false;
    continue;
  }
  const mutatedLines = lines.slice();
  mutatedLines[idx] = mutated;
  fs.writeFileSync(SRC, mutatedLines.join('\n'));
  const r = runTest();
  fs.writeFileSync(SRC, ORIGINAL); // 立即还原
  const ok = r.exit !== 0;
  if (!ok) allRed = false;
  const firstFail = ok ? ((r.out || '').split('\n').find(l => l.includes('::')) || '').slice(0, 90) : '';
  console.log((ok ? '✅' : '❌') + ' ' + inj.name + ' :: exit=' + r.exit + (ok ? '（测试变红）' : '（测试仍绿——负例失效）') + (firstFail ? ' | ' + firstFail.trim() : ''));
}

// ─── md5 校验还原一致 ─────────────────────────────────────────────────
const finalMd5 = md5(fs.readFileSync(SRC, 'utf8'));
const restored = finalMd5 === ORIGINAL_MD5;
console.log((restored ? '✅' : '❌') + ' 还原校验: md5 ' + (restored ? '一致' : '不一致！'));
if (!restored) allRed = false;

console.log(allRed ? '=== 负例验证通过：6/6 注入全部变红，基线绿，还原一致 ===' : '=== 负例验证失败 ===');
process.exit(allRed ? 0 : 1);
