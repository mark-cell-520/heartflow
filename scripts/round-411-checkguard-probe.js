/**
 * round-411-checkguard-probe.js — [r413 改口径] 判据对称性探针
 *
 * r413 修订说明（原 r411 版本已过时，每轮产「全部未覆盖」假阴性噪声）：
 * r411 写此探针时，guard-abilities.js 的判据是写死 if 链
 * （`if (s.expectBlock) ... if (s.expectRewrite) ...`），用
 * `/if \(s\.(\w+)/g` 匹配源码就能证明覆盖。
 *
 * r412 已把判据改成表驱动 EXPECT_ACTIONS 登记表 + 遍历：
 *
 *   const EXPECT_ACTIONS = { expectBlock: ['block'], expectRewrite: ['rewrite','verify'], ... };
 *   for (const [field, allowed] of Object.entries(EXPECT_ACTIONS)) { if (s[field] && ...) }
 *
 * 源码里再也搜不到 `if (s.expectXxx`，于是旧口径每轮都报「判据覆盖: 否」
 * → 「全部未覆盖」——这是**探针口径滞后**，不是新缺陷（r412 交接簿已注明）。
 * r413 把口径同步到表驱动：判据覆盖 = 样本声明的每个 expect 字段都在
 * EXPECT_ACTIONS 登记表里出现（同时兼容写死 if 链形态，两种都认）。
 *
 * 用法：node scripts/round-411-checkguard-probe.js
 *   退出码 0 = 期望字段全部覆盖；1 = 有声明未读的期望字段（真缺口）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'scripts', 'guard-abilities.js'), 'utf8');

const m = src.match(/const SAMPLES = (\[[\s\S]*?\n\];)/);
if (!m) { console.log('FATAL: SAMPLES 提取失败'); process.exit(1); }
// eslint-disable-next-line no-eval
const SAMPLES = eval(m[1]);
const gate = require(path.join(ROOT, 'src', 'gate.js'));

console.log('── 判据对称性：checkSamples 实际读取的期望字段（表驱动口径）──');

// r413 新口径：兼容写死 if 链 + 表驱动登记表两种形态
const ifChain = (src.match(/if \(s\.(\w+)/g) || []).map(s => s.replace('if (s.', ''));
const tableKeys = [];
{
  const t = src.match(/const EXPECT_ACTIONS = \{([\s\S]*?)\n\}/);
  if (t) for (const k of t[1].matchAll(/(\w+):\s*\[/g)) tableKeys.push(k[1]);
}
const readExpect = [...new Set([...ifChain, ...tableKeys])];
console.log('判据读到的期望字段: ' + (readExpect.join(' ') || '(无)'));

const declared = new Set();
for (const s of SAMPLES) for (const k of Object.keys(s)) if (k.startsWith('expect')) declared.add(k);
console.log('样本声明的期望字段: ' + [...declared].join(' '));

let uncovered = 0;
for (const k of declared) {
  const covered = readExpect.includes(k);
  console.log(`  ${k.padEnd(16)} 判据覆盖: ${covered ? '是' : '否  <== 该期望形同虚设，样本恒绿'}`);
  if (!covered) {
    uncovered++;
    for (const s of SAMPLES) {
      if (s[k]) {
        const r = gate.checkInput(s.text);
        console.log(`    样本 ${s.id} 声明 ${k}=true，实际 gate=${r.gate && r.gate.action}`);
      }
    }
  }
}

console.log('\n── 每个样本的实际 gate action vs 期望 ──');
for (const s of SAMPLES) {
  let action = 'THROW';
  let fcount = 0;
  try {
    const r = gate.checkInput(s.text);
    action = r.gate && r.gate.action;
    fcount = (r.findings || []).length;
  } catch (e) { action = 'ERR:' + e.message.slice(0, 40); }
  const ok = (s.expectBlock && action === 'block')
    || (s.expectRewrite && (action === 'rewrite' || action === 'verify'))
    || (s.expectVague && (action === 'verify' || action === 'rewrite'))
    || (s.expectClean && action === 'pass');
  const wantAction = s.expectBlock ? 'block' : s.expectRewrite ? 'rewrite/verify' : s.expectVague ? 'verify' : s.expectClean ? 'pass' : '?';
  console.log(`  [${s.id.padEnd(14)}] gate=${String(action).padEnd(8)} 期望=${wantAction.padEnd(12)} findings=${fcount} 守卫判=${ok ? '✅' : '❌'}`);
}

console.log(uncovered === 0 ? '\n✅ 期望字段全部被判据覆盖（表驱动口径）' : `\n❌ ${uncovered} 个期望字段未被判据覆盖`);
process.exit(uncovered === 0 ? 0 : 1);
