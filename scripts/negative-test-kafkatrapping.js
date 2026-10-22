/**
 * scripts/negative-test-kafkatrapping.js
 *
 * [r712] 第 143 维度 kafkatrapping（卡夫卡陷阱）守卫有效性负例验证。
 *
 * 方法同 r703-r711：把 src/kafkatrapping.js 里各承重常量/路由行逐一置为
 * 永不匹配（改文件再跑 test/round-712-kafkatrapping.js，证明测试文件本身
 * 能抓住每处失效），确认测试由 9/9 全绿变红，还原后恢复全绿，md5
 * 校验一致。
 *
 * 判定标准：基线 9/9 PASS → 每个注入点 FAIL（至少 1 个断言红，且
 * 不是 SyntaxError/Cannot find module/ReferenceError/TypeError 崩溃
 * 红）→ 还原后 9/9 PASS 且 md5 与基线一致。
 *
 * 注入点 16 处。本模块常量是 `new RegExp([...].join('|'))` 多行数组
 * 形态，注入粒度是**整常量块**（decl 行到收尾 `].join('|')` 开头行，
 * ZH 块收尾是 `);`、EN 块是 `], 'i');`，locate 用 `^].join('|')`
 * 前缀匹配两种都认）。归因靠每个注入点的**专属样本**保证：
 *   REACTION_ZH/PROOF_ZH/INNOCENT_ZH/QUESTION_ZH/DENIAL_ZH/EVIDENCE_ZH
 *     → 中文攻击 5 条（A 组红；样本 1/4 走路由①、2/5 走路由②、3 走路由③）；
 *   REACTION_EN/PROOF_EN → 英文攻击 4 条（B 组红）；
 *   HEDGE_ZH → E 组「否认本身就是证据，这种推论在法律上不成立」
 *     （双腿在场：DENIAL × EVIDENCE，杀豁免即误命中 → E 组红；
 *     承重样本双腿先实测在射程内）；
 *   HEDGE_EN → E 组「Treating your protest as proof of guilt is not
 *     admissible in court.」（双腿在场：REACTION_EN × PROOF_EN）；
 *   路由行 6 处：豁免早退行（E 组两条承重样本红）+ route1/route2/route3
 *     三个计算行（A/B 组按样本归属红）+ isZh 判定行（A 组 detail 语言
 *     断言红——EN 攻击被判成 zh detail）+ 最终返回 hit:true 行
 *     （攻击全 miss → A/B/F 组红）。
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
const SRC = path.join(HF, 'src/kafkatrapping.js');
const TEST = path.join(HF, 'test/round-712-kafkatrapping.js');

// decl = 常量声明行前缀（整块替换）；route = 函数体内路由行片段（整行替换）
const INJECTS = [
  // ─── 常量块 ───
  { name: 'REACTION_ZH 反应框架中文（中文攻击 1/4 专属 → A 组红）', decl: 'const REACTION_ZH = ' },
  { name: 'REACTION_EN 反应框架英文（英文攻击 4 条专属 → B 组红）', decl: 'const REACTION_EN = ' },
  { name: 'INNOCENT_ZH 无过框架中文（中文攻击 2/5 专属 → A 组红）', decl: 'const INNOCENT_ZH = ' },
  { name: 'DENIAL_ZH 否认框架中文（中文攻击 3 专属 → A 组红）', decl: 'const DENIAL_ZH = ' },
  { name: 'PROOF_ZH 罪证结论中文（中文攻击 1/4 专属 → A 组红）', decl: 'const PROOF_ZH = ' },
  { name: 'PROOF_EN 罪证结论英文（英文攻击 4 条专属 → B 组红）', decl: 'const PROOF_EN = ' },
  { name: 'QUESTION_ZH 质疑反问中文（中文攻击 2/5 专属 → A 组红）', decl: 'const QUESTION_ZH = ' },
  { name: 'EVIDENCE_ZH 证据化宣告中文（中文攻击 3 专属 → A 组红）', decl: 'const EVIDENCE_ZH = ' },
  { name: 'HEDGE_ZH 豁免中文（E 组法律否定推论承重样本被误命中 → E 组红）', decl: 'const HEDGE_ZH = ' },
  { name: 'HEDGE_EN 豁免英文（E 组 EN 法律否定推论承重样本被误命中 → E 组红）', decl: 'const HEDGE_EN = ' },
  // ─── 路由行 ───
  { name: '豁免早退行（E 组两条承重样本被误命中 → E 组红）', route: 'if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {', to: 'if (false) { // [negtest]' },
  { name: '路由行 route1 计算（中文攻击 1/4 + 英文攻击 4 条 → A/B 组红）', route: 'const route1 = (reZh || reEn) && (prZh || prEn);', to: 'const route1 = false; // [negtest]' },
  { name: '路由行 route2 计算（中文攻击 2/5 专属 → A 组红）', route: 'const route2 = inZh && quZh;', to: 'const route2 = false; // [negtest]' },
  { name: '路由行 route3 计算（中文攻击 3 专属 → A 组红）', route: 'const route3 = deZh && evZh;', to: 'const route3 = false; // [negtest]' },
  { name: 'isZh 判定行（A 组 detail 语言断言 → A 组红）', route: 'const isZh = /[\\u4e00-\\u9fff]/.test(text);', to: 'const isZh = true; // [negtest]' },
  { name: '最终返回 hit:true 行（攻击全 miss → A/B/F 组红）', route: 'hit: true,', to: 'hit: false, // [negtest]' },
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
  // 崩溃红（语法错/模块缺失/引用错/类型错）证明不了断言能抓分支失效。
  // 注意：「X is not defined」消息不含 ReferenceError 字样（r708 实证），
  // 除匹配关键字外，额外把「not defined / is not a function」当崩溃信号。
  return /SyntaxError|Cannot find module|ReferenceError|TypeError|is not defined|is not a function/.test(out);
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
    // 常量块整块替换：从 decl 行扫到收尾 `].join('|')` 开头行
    // （ZH 块收尾是 `].join('|'));`，EN 块是 `].join('|'), 'i');`，两种都认）
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
    // 路由行整行替换：保留原缩进，替换 trim 后以 needle 开头的整行
    const indent = lines[idx].match(/^\s*/)[0];
    killed[idx] = indent + inj.to.trim();
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
