/**
 * scripts/negative-test-burden-shift-demand.js
 *
 * [r707] appeal_to_ignorance「举证倒置-需求形」守卫有效性负例验证。
 *
 * 方法同 r703/r704/r705/r706：把 src/appeal-to-ignorance.js 里各承重
 * 常量/路由行逐一置为永不匹配（改文件再跑 test/round-707-burden-shift-
 * demand.js，证明测试文件本身能抓住每处失效），确认测试由 11/11 全绿
 * 变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 11/11 PASS → 每个注入点 FAIL（至少 1 个断言红，且
 * 不是 SyntaxError/Cannot find module/ReferenceError/TypeError 崩溃
 * 红）→ 还原后 11/11 PASS 且 md5 与基线一致。
 *
 * 注入点 24 处（本模块常量全是**单行正则字面量**，注入粒度是整常量/
 * 整路由行，不是块内分支——r706 的块内分支定位用不上，归因靠每个注入
 * 点的**专属样本**保证：只有该常量/路由承重的样本在该点注入后变红）：
 *   R2 中文腿（DEMAND_A/B/C/D/E/F/G_ZH × SILENCE_ZH）8 处、
 *   R3 中文路由（OBJECTION_ZH）1 处、
 *   R2/R2b 英文腿（DEMAND_A/B/C/D/F/GATE_EN × SILENCE_EN）8 处、
 *   R3 英文路由（OBJECTION_EN）1 处、
 *   路由判定行 5 处（demandZh/demandEn/objectionZh/objectionEn/GATE）、
 *   R1 防回归 2 处（BURDEN_ZH/CONCLUDE_ZH）。
 *
 * 归因纪律（r705/r706 同族）：每个注入点都配一条只由该常量/路由承重
 * 的专属样本。注意「空口无凭说我有问题，你先举证」被 DEMAND_C_ZH 与
 * DEMAND_E_ZH 双腿覆盖（首版 E 支对象组必填导致 E 从未承重，负例归因
 * 当场抓出并修成可选）——E 的专属样本是「你先拿出证据再质疑」（C 支
 * 无「空口无凭」不沾边）。
 *
 * 替换值是永不匹配的正则字面量 `/__negtest_never__/`（保留 flags），
 * 不是空串也不是裸字符串——空串正则可匹配空、裸字符串没有 .test()
 * 会 TypeError 崩溃红，两者都让「分支失效」的证明失真（r703 纪律）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/appeal-to-ignorance.js');
const TEST = path.join(HF, 'test/round-707-burden-shift-demand.js');

// 注入点：decl = 常量声明行前缀（整行替换为永不匹配正则，保留 flags）；
// route = 路由行片段（整行替换为 false 短路）
const INJECTS = [
  // ─── R2 中文腿 ───
  { name: 'DEMAND_A_ZH 反证指向（你拿不出反例凭什么推翻这个结论 专属——就得按我说的做那条被 G 支双腿覆盖，专属样本另配）', decl: 'const DEMAND_A_ZH = ' },
  { name: 'DEMAND_B_ZH 门槛条件（必须拿出依据才能质疑/如果不能证明就按X防 专属）', decl: 'const DEMAND_B_ZH = ' },
  { name: 'DEMAND_C_ZH 无证据 dismissal（没有证据表明我错了你凭什么反对 专属）', decl: 'const DEMAND_C_ZH = ' },
  { name: 'DEMAND_D_ZH 反将一军（你说我记错了那你记得你说过什么吗 专属）', decl: 'const DEMAND_D_ZH = ' },
  { name: 'DEMAND_E_ZH 先举证（你先拿出证据再质疑 专属，C 支不沾边）', decl: 'const DEMAND_E_ZH = ' },
  { name: 'DEMAND_F_ZH 带驱离后缀索证（你说这个方法不行你拿出证据来啊 专属）', decl: 'const DEMAND_F_ZH = ' },
  { name: 'DEMAND_G_ZH 否定条件禁声（你拿不出证据就别乱说/找不到依据就不许质疑 专属）', decl: 'const DEMAND_G_ZH = ' },
  { name: 'OBJECTION_ZH 对话方质疑在场（R3 两条专属）', decl: 'const OBJECTION_ZH = ' },
  { name: 'SILENCE_ZH 取消资格/要求服从（R2 中文全部专属）', decl: 'const SILENCE_ZH = ' },
  // ─── R2/R2b 英文腿 ───
  { name: 'DEMAND_A_EN 反证指向（Show me the counterevidence 专属）', decl: 'const DEMAND_A_EN = ' },
  { name: 'DEMAND_B_EN 门槛条件（cannot prove I am wrong 专属）', decl: 'const DEMAND_B_EN = ' },
  { name: 'DEMAND_C_EN 无证据 dismissal（No evidence says I am mistaken 专属）', decl: 'const DEMAND_C_EN = ' },
  { name: 'DEMAND_D_EN 反将一军（Then you recite what I said 专属）', decl: 'const DEMAND_D_EN = ' },
  { name: 'DEMAND_F_EN 带 first/then 后缀索证（show me the evidence first 专属）', decl: 'const DEMAND_F_EN = ' },
  { name: 'DEMAND_GATE_EN 门槛形单腿（must show proof before allowed to question 专属）', decl: 'const DEMAND_GATE_EN = ' },
  { name: 'OBJECTION_EN 对话方质疑在场（R3 英文两条专属）', decl: 'const OBJECTION_EN = ' },
  { name: 'SILENCE_EN 取消资格/要求服从（cannot prove I am wrong + counterevidence 专属）', decl: 'const SILENCE_EN = ' },
  // ─── 路由判定行 ───
  { name: 'R2 中文路由行 demandZh 计算（R2 中文全部专属）', route: 'const demandZh = DEMAND_A_ZH.test(text)', to: 'const demandZh = false; // [negtest]' },
  { name: 'R2 英文路由行 demandEn 计算（R2 英文两条专属）', route: 'const demandEn = DEMAND_A_EN.test(text)', to: 'const demandEn = false; // [negtest]' },
  { name: 'R2b 门槛形路由行（must show proof 专属）', route: 'if (DEMAND_GATE_EN.test(text)) {', to: 'if (false) { // [negtest]' },
  { name: 'R3 中文路由行 objectionZh 计算（R3 中文两条专属）', route: 'const objectionZh = OBJECTION_ZH.test(text);', to: 'const objectionZh = false; // [negtest]' },
  { name: 'R3 英文路由行 objectionEn 计算（R3 英文两条专属）', route: 'const objectionEn = OBJECTION_EN.test(text);', to: 'const objectionEn = false; // [negtest]' },
  // ─── R1 防回归（E 组承重） ───
  { name: 'BURDEN_ZH 举证责任在场（R1 中文推定形专属）', decl: 'const BURDEN_ZH = ' },
  { name: 'CONCLUDE_ZH 推定成立（R1 中文推定形专属）', decl: 'const CONCLUDE_ZH = ' },
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
if (!/结果: 11 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（11 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 11/11 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  // 路由行在函数体内有 2 空格缩进，定位必须按 trim 后的行首（decl 行
  // 在模块顶层无缩进，trim 后同样成立——r707 实测：不 trim 会让 5 个
  // 路由注入点全部定位失败）
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
  let replacement;
  if (inj.decl) {
    // 常量整行 → 永不匹配正则字面量，保留 flags（/i）
    const flags = /\/[a-z]*$/.exec(lines[idx].trim());
    const fl = flags ? flags[0].slice(1) : '';
    replacement = inj.decl + '/__negtest_never__/' + fl + ';';
  } else {
    replacement = inj.to;
  }
  const killed = lines.slice();
  killed[idx] = replacement;
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
    // 只取 ❌ 失败项行——不能用「行首空白+任意字符」的宽匹配，那会把
    // 同组的 ✅ 行抓出来当失败明细，归因核对时看得似是而非（r707 实测）
    const failLine = (r.out.match(/^\s*❌\s+.+$/m) || ['(未见失败项行)'])[0].trim();
    console.log('  ✅ ' + inj.name + ' :: 断言红（' + failLine.slice(0, 90) + '）');
  }
}

// ── 2. 还原校验 ──────────────────────────────────────────────────
const afterMd5 = md5(SRC);
console.log('还原后 md5=' + afterMd5.slice(0, 12) + '（基线 ' + baseMd5.slice(0, 12) + '）' + (afterMd5 === baseMd5 ? ' 一致' : ' 不一致！'));
const final = runTest();
const finalOk = final.ok && /结果: 11 通过, 0 失败/.test(final.out);
console.log(finalOk ? '还原后测试: 11/11 PASS' : '还原后测试异常: ' + final.out.slice(-300));
console.log(allRed && finalOk ? '\n负例验证通过：' + INJECTS.length + '/' + INJECTS.length + ' 注入点全部断言红，还原恢复全绿' : '\n负例验证失败：见上方 ✗ 项');
process.exit(allRed && finalOk ? 0 : 1);
