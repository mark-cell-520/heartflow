/**
 * scripts/negative-test-anecdotal.js
 *
 * [r708] 第 140 维度 anecdotal（个例泛化）守卫有效性负例验证。
 *
 * 方法同 r703-r707：把 src/anecdotal.js 里各承重常量/路由行逐一置为
 * 永不匹配（改文件再跑 test/round-708-anecdotal.js，证明测试文件本身
 * 能抓住每处失效），确认测试由 9/9 全绿变红，还原后恢复全绿，md5
 * 校验一致。
 *
 * 判定标准：基线 9/9 PASS → 每个注入点 FAIL（至少 1 个断言红，且
 * 不是 SyntaxError/Cannot find module/ReferenceError/TypeError 崩溃
 * 红）→ 还原后 9/9 PASS 且 md5 与基线一致。
 *
 * 注入点 20 处。本模块常量是 `new RegExp([...].join('|'))` 多行数组
 * 形态（与 appeal-to-nature 同款），注入粒度是**整常量块**（decl 行
 * 到收尾 `].join('|'));`），不是单行——只换 decl 行会让后续数组行变成
 * 孤儿语法造出 SyntaxError 崩溃红，证明不了断言能抓分支失效。
 * 归因靠每个注入点的**专属样本**保证（只有该常量/路由承重的样本在
 * 该点注入后变红）：
 *   REF_ZH/OUTCOME_ZH → 中文攻击 10 条专属；
 *   REF_EN/OUTCOME_EN → 英文攻击 9 条专属（OUTCOME_EN 的 100k 样本
 *     同时承重 _dual 双通道）；
 *   NEG_ZH/NEG_EN/POS_ZH/POS_EN/PUSH_ZH/PUSH_EN → 各配一条只走该类
 *     结论的专属样本（N 我邻居烟酒不致癌 / N-en My uncle…pointless /
 *     P 外卖很健康 / P-en takeout is healthy / U 你照做就行 /
 *     U-en just copy him）；
 *   HEDGE_ZH/HEDGE_EN → 豁免承重样本（保留语良性被误命中 → C 组红）；
 *   路由行 8 处（refZh/refEn/outZh/outEn/neg/pos/push 计算 + 豁免
 *     早退行）。
 *
 * 替换值是永不匹配的 `new RegExp('__negtest_never__')`（保留构造器
 * 形态），不是空串也不是裸字符串——空串正则可匹配空、裸字符串没有
 * .test() 会 TypeError 崩溃红，两者都让「分支失效」的证明失真
 * （r703 纪律）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/anecdotal.js');
const TEST = path.join(HF, 'test/round-708-anecdotal.js');

// decl = 常量声明行前缀（整块替换）；route = 函数体内路由行片段（整行替换）
const INJECTS = [
  // ─── 常量块 ───
  { name: 'REF_ZH 个例指称中文（中文攻击 10 条专属）', decl: 'const REF_ZH = ' },
  { name: 'REF_EN 个例指称英文（英文攻击 9 条专属）', decl: 'const REF_EN = ' },
  { name: 'OUTCOME_ZH 具体结局中文（中文攻击 10 条专属）', decl: 'const OUTCOME_ZH = ' },
  { name: 'OUTCOME_EN 具体结局英文（英文攻击 9 条专属，含 100k _dual 样本）', decl: 'const OUTCOME_EN = ' },
  { name: 'NEG_ZH 领域否定中文（我邻居烟酒不致癌 专属）', decl: 'const NEG_ZH = ' },
  { name: 'NEG_EN 领域否定英文（My uncle…pointless 专属）', decl: 'const NEG_EN = ' },
  { name: 'POS_ZH 领域正面中文（外卖很健康 专属）', decl: 'const POS_ZH = ' },
  { name: 'POS_EN 领域正面英文（takeout is healthy 专属）', decl: 'const POS_EN = ' },
  { name: 'PUSH_ZH 推及行动中文（你照做就行 专属）', decl: 'const PUSH_ZH = ' },
  { name: 'PUSH_EN 推及行动英文（just copy him 专属）', decl: 'const PUSH_EN = ' },
  { name: 'HEDGE_ZH 豁免中文（孤例保留语良性被误命中 → C 组红）', decl: 'const HEDGE_ZH = ' },
  { name: 'HEDGE_EN 豁免英文（isolated case 良性被误命中 → C 组红）', decl: 'const HEDGE_EN = ' },
  // ─── 路由行 ───
  { name: '路由行 refZh 计算（中文攻击 10 条专属）', route: 'const refZh = REF_ZH_.test(text);', to: 'const refZh = false; // [negtest]' },
  { name: '路由行 refEn 计算（英文攻击 9 条专属）', route: 'const refEn = REF_EN_.test(text);', to: 'const refEn = false; // [negtest]' },
  { name: '路由行 outZh 计算（中文攻击 10 条专属）', route: 'const outZh = OUT_ZH_.test(text);', to: 'const outZh = false; // [negtest]' },
  { name: '路由行 outEn 计算（英文攻击 9 条专属）', route: 'const outEn = OUT_EN_.test(text);', to: 'const outEn = false; // [negtest]' },
  { name: '路由行 neg 计算（N 类攻击专属：中文烟酒 + EN pointless）', route: 'const neg = NEG_ZH_.test(text) || NEG_EN_.test(text);', to: 'const neg = false; // [negtest]' },
  { name: '路由行 pos 计算（P 类攻击专属：外卖很健康 + takeout is healthy）', route: 'const pos = POS_ZH_.test(text) || POS_EN_.test(text);', to: 'const pos = false; // [negtest]' },
  { name: '路由行 push 计算（U 类攻击专属：你照做就行 + just copy him）', route: 'const push = PUSH_ZH_.test(text) || PUSH_EN_.test(text);', to: 'const push = false; // [negtest]' },
  { name: '豁免早退行（保留语良性被误命中 → C 组红）', route: 'if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {', to: 'if (false) { // [negtest]' },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: HF, encoding: 'utf8', timeout: 180000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isCrashRed(out) {
  // 崩溃红（语法错/模块缺失/引用错/类型错）证明不了断言能抓分支失效
  return /SyntaxError|Cannot find module|ReferenceError|TypeError/.test(out);
}

// ── 0. 基线 ──────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 9 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（9 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 9/9 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const needle = inj.decl || inj.route;
  const idx = lines.findIndex(l => l.trim().indexOf(needle) === 0);
  if (idx < 0) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（声明行/路由行未找到）');
    allRed = false;
    continue;
  }
  const cnt = lines.filter(l => l.trim().indexOf(needle) === 0).length;
  if (cnt !== 1) {
    console.log('  ✗ ' + inj.name + ' :: 靶行不唯一（' + cnt + ' 处），中止该项');
    allRed = false;
    continue;
  }
  let killed;
  if (inj.decl) {
    // 常量块整块替换：从 decl 行扫到收尾 `].join('|'));`（可带 , 'i'）
    let end = -1;
    for (let j = idx; j < lines.length; j++) {
      if (/^\]\.join\('\|'\)/.test(lines[j].trim())) { end = j; break; }
    }
    if (end < 0) {
      console.log('  ✗ ' + inj.name + ' :: 常量块收尾行未找到，中止该项');
      allRed = false;
      continue;
    }
    killed = lines.slice(0, idx).concat(["const " + inj.decl.slice(6, -3) + " = new RegExp('__negtest_never__');"]).concat(lines.slice(end + 1));
  } else {
    killed = lines.slice();
    killed[idx] = inj.to;
  }
  fs.writeFileSync(SRC, killed.join('\n'));
  const r = runTest();
  fs.writeFileSync(SRC, lines.join('\n')); // 立即还原，防半改状态
  if (r.ok) {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍然全绿（守卫漏抓）');
    allRed = false;
  } else if (isCrashRed(r.out)) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红（证明不了断言能抓分支失效）');
    allRed = false;
  } else {
    const failLine = (r.out.match(/^\s*❌\s+.+$/m) || ['(未见失败项行)'])[0].trim();
    console.log('  ✅ ' + inj.name + ' :: 断言红（' + failLine.slice(0, 90) + '）');
  }
}

// ── 2. 还原校验 ──────────────────────────────────────────────────
const afterMd5 = md5(SRC);
console.log('还原后 md5=' + afterMd5.slice(0, 12) + '（基线 ' + baseMd5.slice(0, 12) + '）' + (afterMd5 === baseMd5 ? ' 一致' : ' 不一致！'));
const final = runTest();
const finalOk = final.ok && /结果: 9 通过, 0 失败/.test(final.out);
console.log(finalOk ? '还原后测试: 9/9 PASS' : '还原后测试异常: ' + final.out.slice(-300));
console.log(allRed && finalOk ? '\n负例验证通过：' + INJECTS.length + '/' + INJECTS.length + ' 注入点全部断言红，还原恢复全绿' : '\n负例验证失败：见上方 ✗ 项');
process.exit(allRed && finalOk ? 0 : 1);
