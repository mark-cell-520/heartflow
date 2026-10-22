// 第 216 轮负例脚本：注入/删条变异 —— 守卫不被触发就不是守卫。
// 方法：临时把本轮修复逐一回滚，跑守卫测试，必须 FAIL；还原后必须全绿。
// 用法：node scripts/negative-test-skill-verifier-wiring.js
//
// 字符串拼接说明：正则可视字符（引号/反斜杠）用常量拼，避免源码里
// 多层转义漂移导致「锚点未找到」——那种失败是脚本自身的坑，
// 不是守卫的结论，宁可让锚点找不到时报 XXFAIL 也不静默放过。
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SV = path.join(ROOT, 'src/shield/skill-verifier.js');
const VE = path.join(ROOT, 'src/core/verification-engine.js');
const AS = path.join(ROOT, 'src/core/assertions.js');
const GUARD = 'test/round-216-skill-verifier-wiring.test.js';

function runGuard() {
  try {
    const out = execSync('timeout 100 node ' + GUARD, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, c) { fs.writeFileSync(p, c); }

const results = [];
function record(name, expectRed, r) {
  const red = !r.ok;
  const good = red === expectRed;
  results.push({ name, expectRed, red, good });
  console.log((good ? 'PASS ' : 'XXFAIL ') + name + ' => ' + (red ? '红(报错)' : '绿(通过)') + (good ? '' : ' 期望' + (expectRed ? '红' : '绿')));
}

// 每个变异：[名称, 文件, 查找串, 替换串(回滚后的形态)]
// 注意：变异必须是「回到带 bug 的原状」，不能只改周边代码。
const Q = '"';   // 双引号字符
const A = "'";   // 单引号字符
const NL = String.fromCharCode(10);
const BS = String.fromCharCode(92); // 反斜杠字符

// skill-verifier 的 _classifyResult 分支形态：
//   if (message.startsWith('TAG')) { return { message, severity: SEVERITY.X }; }
function clsBranch(tag) {
  return '    if (message.startsWith(' + Q + tag + Q + ')) {' + NL +
    '      return { message, severity: SEVERITY.ERROR };' + NL +
    '    }';
}

const MUTATIONS = [
  // 原状 1：`{ ...error, severity }` —— error 是字符串，展开成字符下标对象
  ['M1 回滚字符下标对象展开', SV,
    "if (message.startsWith('[Frontmatter]') || message.startsWith('[版本]') || message.startsWith('[路径]')) {" + NL +
    "      return { message, severity: SEVERITY.ERROR };",
    "if (String(error).startsWith('[Frontmatter]') || String(error).startsWith('[版本]') || String(error).startsWith('[路径]')) {" + NL +
    "      return { ...String(error), severity: SEVERITY.ERROR };"],
  // 原状 2：同样把字符串展开成对象
  ['M2 回滚 severity 分级统一', SV,
    "if (message.startsWith('[数据]') || message.startsWith('[表述]') || message.startsWith('[结构]')) {" + NL +
    "      return { message, severity: SEVERITY.WARNING };",
    "if (message.startsWith('[数据]') || message.startsWith('[表述]') || message.startsWith('[结构]')) {" + NL +
    "      return { ...message, severity: SEVERITY.WARNING };"],
  // 原状 3：锚点归一化不带 CJK 字符类（\w 不含中文 → 中文标题清成空串）
  ['M3 回滚中文锚点保留', SV,
    '.replace(/[^' + BS + 'w' + BS + 'u4e00-' + BS + 'u9fff-]+/g, ' + A + A + ')',
    '.replace(/[^' + BS + 'w-]+/g, ' + A + A + ')'],
  // 原状 4：版本一致性正则不匹配引号写法
  ['M4 回滚引号 version 一致性比对', SV,
    'const frontmatterVer = content.match(/^version:' + BS + 's*[' + Q + A + ']?v?([' + BS + 'd.]+)[' + Q + A + ']?' + BS + 's*$/m);',
    'const frontmatterVer = content.match(/^version:' + BS + 's*v?([' + BS + 'd.]+)/m);'],
  // 原状 5：直接把 error 当字符串喂 _classifyIssue
  ['M5 回滚 _classifyResults 对象容忍', VE,
    'const classifiedErrors = result.errors.map(e => {' + NL +
    '      const obj = (e && typeof e === ' + A + 'object' + A + ') ? e : null;',
    'const classifiedErrors = result.errors.map(e => ({' + NL +
    '      message: e,' + NL +
    '      severity: this._classifyIssue(e)' + NL +
    '    }));'],
  // 原状 6：把 {message,severity} 对象直接 push 进 issues
  ['M6 回滚 fullVerification issues 取 message', VE,
    'if (!r.ok) results.issues.push(...r.errors.map(e => (e && typeof e === ' + A + 'object' + A + ') ? String(e.message) : String(e)));',
    'if (!r.ok) results.issues.push(...r.errors);'],
  // 原状 7：claimCheck.confidence.score（confidence 是数字 → undefined → 报告崩）
  // 变异点必须是整行 confVal 计算 + 下行赋值，整体回到原状单行取值。
  ['M7 回滚 confidence 取 .score', VE,
    'const confVal = claimCheck && typeof claimCheck.confidence === ' + A + 'object' + A + NL +
    '        ? claimCheck.confidence.score' + NL +
    '        : claimCheck.confidence;' + NL +
    '      results.confidence = (typeof confVal === ' + A + 'number' + A + ' && Number.isFinite(confVal)) ? confVal : 0.5;',
    'results.confidence = claimCheck.confidence.score;'],
  // 原状 8：assertions.skillFrontmatter 的版本正则会话引号
  ['M8 回滚 assertions 引号 version', AS,
    'const hasVersion = /^version:' + BS + 's*[' + Q + A + ']?v?[' + BS + 'd.]+[' + Q + A + ']?' + BS + 's*$/m.test(content);',
    'const hasVersion = /^version:' + BS + 's*v?[' + BS + 'd.]+$/m.test(content);'],
];

const backups = {};
for (const p of [SV, VE, AS]) backups[p] = read(p);

console.log('=== 基线（未变异，应全绿）===');
const base = runGuard();
record('M0 基线还原态', false, base);
if (!base.ok) {
  console.log('基线已红，先修 src 再跑变异。输出尾部：');
  console.log(base.out.split(NL).slice(-25).join(NL));
  process.exit(1);
}

console.log('=== 变异注入（每个都必须变红）===');
for (const [name, file, find, repl] of MUTATIONS) {
  const orig = backups[file];
  if (!orig.includes(find)) {
    console.log('XXFAIL ' + name + ' => 锚点未找到（变异未生效，守卫结论不可信）');
    results.push({ name, expectRed: true, red: false, good: false });
    write(file, orig);
    continue;
  }
  write(file, orig.replace(find, repl));
  const r = runGuard();
  record(name, true, r);
  write(file, orig); // 立即还原
}

console.log('=== 还原复验（应全绿）===');
const after = runGuard();
record('M9 还原后全绿', false, after);

const passed = results.filter(r => r.good).length;
console.log('---');
console.log('负例矩阵: ' + passed + '/' + results.length);
if (passed !== results.length) {
  console.log('未通过的变异（说明对应守卫不够硬）：');
  results.filter(r => !r.good).forEach(r => console.log('  ' + r.name));
  process.exit(1);
}
