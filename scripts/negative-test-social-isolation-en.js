/**
 * scripts/negative-test-social-isolation-en.js
 *
 * [r691] social_isolation 英文腿守卫有效性负例验证。
 *
 * 方法同 r685-r690 negative-test-*.js：把 src/social-isolation.js 里各
 * 承重分支逐一置为永不匹配（(?!)，改文件再跑测试文件的方式，证明
 * test/round-691-social-isolation-en.js 本身能抓住每个分支失效），
 * 确认测试由 15/15 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 15/15 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError 崩溃红）→
 * 还原后 15/15 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：本轮新增 12 条英文正则支（I1-I6a/b、C1-C6）逐一置空
 * + QUESTION_EN 窗口 {0,90} 退回 {0,50}（C2b 样本守护点）。特征串
 * 一律用 String.raw 与源文件同形（单层反斜杠），不用 split('|')
 * 切分（分支内部的选择支 | 会把正则切碎，定位必然落空）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/social-isolation.js');
const TEST = path.join(HF, 'test/round-691-social-isolation-en.js');

// 注入点：name = 人类可读说明；feat = 源行定位特征（String.raw 同形）；
// repl = 替换方式（'kill' = 整行换成永不匹配；'win50' = 窗口退回）
const INJECTS = [
  { name: 'I1 否定愿望隔绝（I do not want you to see）',
    feat: String.raw`\bi\s+(?:do\s+not|don't)\s+want\s+(?:you|u)` },
  { name: 'I2 stop + 动名词 + with/to（Stop hanging out with）',
    feat: String.raw`\bstop\s+(?:hang(?:ing)?\s+out` },
  { name: 'I3 no more + 动名词（No more chatting with）',
    feat: String.raw`\bno\s+more\s+(?:hang(?:ing)?` },
  { name: 'I4 删除/拉黑群体指代（Block them all）',
    feat: String.raw`\b(?:block|delete|remove|unfriend)\s+(?:them` },
  { name: 'I5 cut off + 宾语前置（cut off all your friends）',
    feat: String.raw`\bcut\s+off\s+(?:all\s+)?(?:your|u)` },
  { name: 'I6a 排他接触（you only need me）',
    feat: String.raw`\byou\s+only\s+(?:need|have)\s+(?:me|us)` },
  { name: 'I6b 排他接触（Nobody else matters）',
    feat: String.raw`\bnobody\s+else\s+(?:matters?` },
  { name: 'C1 影响贬损（They are a bad influence）',
    feat: String.raw`\b(?:they|those\s+people|he|she)\s+(?:are|is)` },
  { name: 'C2 爱情条件（if you love me）',
    feat: String.raw`\bif\s+you\s+(?:really\s+)?(?:love|care\s+about)` },
  { name: 'C3 禁止宣告（I forbid it）',
    feat: String.raw`\bi\s+(?:forbid|prohibit|do\s+not\s+allow` },
  { name: 'C4 anymore 隐式终结（not allowed ... anymore）',
    feat: String.raw`\b(?:not|never|no)\s+(?:\w+\s+){0,6}?` },
  { name: 'C5 占有宣告（You belong to me only）',
    feat: String.raw`\byou\s+belong\s+to\s+(?:me|us)\s+only` },
  { name: 'C6 from now on + 第二人称指令',
    feat: String.raw`\b(?:from\s+(?:now\s+on|today|this\s+day\s+on|then\s+on))\b[^.]{0,40}?\byou\s+(?:only` },
  { name: 'QUESTION_EN 窗口 {0,90} 退回 {0,50}（C2b 守护点）',
    feat: String.raw`(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,90}\?`,
    mode: 'win50' },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: HF, encoding: 'utf8', timeout: 60000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isCrashRed(out) {
  // 崩溃红（ SyntaxError/模块缺失/引用错误）证明不了守卫能抓分支失效
  return /SyntaxError|Cannot find module|ReferenceError|TypeError/.test(out);
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 15 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（15 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 15/15 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const lines = fs.readFileSync(SRC, 'utf8').split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('String.raw') && lines[i].includes(inj.feat)) hits.push(i);
  }
  if (hits.length !== 1) {
    console.log('  ✗ ' + inj.name + ' :: 特征行数异常 ' + hits.length + '（应为 1）');
    allRed = false;
    continue;
  }
  const orig = lines[hits[0]];
  if (inj.mode === 'win50') {
    // 注意：源行是 [^.]{0,90}\?（反斜杠+问号两字符），split 串不能带 ?，
    // 否则目标串不存在、replace 静默不发生（python/node replace 坑）
    lines[hits[0]] = orig.split('{0,90}').join('{0,50}');
  } else {
    // 整行替换为永不匹配（带尾逗号——r690 坑4：漏尾逗号会让下一行 SyntaxError，
    // 那种崩溃红证明不了断言能抓住分支失效）
    lines[hits[0]] = '  String.raw`(?!)`,';
  }
  fs.writeFileSync(SRC, lines.join('\n'));
  const r = runTest();
  const crash = !r.ok && isCrashRed(r.out);
  if (!r.ok && !crash) {
    console.log('  ✓ ' + inj.name + ' :: 断言红（守卫有效）');
  } else if (crash) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + r.out.split('\n').filter(l => /Error/.test(l))[0]);
    allRed = false;
  } else {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍全绿（守卫漏抓）');
    allRed = false;
  }
  fs.writeFileSync(SRC, lines.slice(0, hits[0]).concat([orig], lines.slice(hits[0] + 1)).join('\n'));
}

// ── 2. 还原校验 ────────────────────────────────────────────────────
const afterMd5 = md5(SRC);
if (afterMd5 !== baseMd5) { console.error('还原后 md5 不一致！'); process.exit(1); }
const after = runTest();
if (!after.ok || !/结果: 15 通过, 0 失败/.test(after.out)) {
  console.error('还原后未恢复 15/15'); process.exit(1);
}
console.log('还原: md5 一致，15/15 PASS');
console.log(allRed ? '负例验证通过：全部 ' + INJECTS.length + ' 个注入点均断言红' : '负例验证失败：存在漏抓注入点');
process.exit(allRed ? 0 : 1);
