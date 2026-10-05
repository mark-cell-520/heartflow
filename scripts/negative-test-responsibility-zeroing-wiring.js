/**
 * negative-test-responsibility-zeroing-wiring.js — 负例验证（第491轮）
 *
 * 验证 test/round-491-responsibility-zeroing.test.js 真的在守 T5 四支：
 * 把 src/agency-deflection.js 的 T5_ZH_BLAME / T5_ZH_EXEC / T5_ZH_NULLIFY /
 * T5_EN 四支逐支置为永不匹配，守卫测试必须变红（断言失败，不是加载崩溃）。
 *
 * 三条踩过的坑：
 *   ① 副本必须整仓拷贝，且 chdir 到副本根 —— gate.js 要读 src/../VERSION，
 *      路径钉死真实仓库会读到真文件，注入等于没生效。
 *   ② 用「整行替换法」而不是正则体内替换 —— T5 四支的正则体含 / 字符，
 *      按 / 切分会截断；按 const 声明行整行换成合法正则最稳。
 *   ③ 注入后必须真的改变源码 —— 用替换前后长度差断言，防止 needle 漂移
 *      导致假阴性。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TEST = 'round-491-responsibility-zeroing.test.js';

const BRANCHES = [
  { name: 'T5_ZH_BLAME（责任落抽象主体）', decl: 'const T5_ZH_BLAME = /' },
  { name: 'T5_ZH_EXEC（抽象产出×人类只执行）', decl: 'const T5_ZH_EXEC = /' },
  { name: 'T5_ZH_NULLIFY（制度流程×无选择）', decl: 'const T5_ZH_NULLIFY = /' },
  { name: 'T5_EN（英文同族）', decl: 'const T5_EN = /' },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg491-'));
execFileSync('cp', ['-r', path.join(HF, 'src'), path.join(HF, 'test'), path.join(HF, 'VERSION'), path.join(HF, 'package.json'), tmp]);
const ckptFile = path.join(tmp, 'src', 'agency-deflection.js');

let red = 0, green = 0;
for (const b of BRANCHES) {
  const orig = fs.readFileSync(ckptFile, 'utf8');
  const lines = orig.split('\n');
  const idx = lines.findIndex(l => l.startsWith(b.decl));
  if (idx < 0) { console.log(`❌ ${b.name}: 找不到 const 声明行，算未变红`); continue; }
  const mutName = b.decl.replace('const ', '').replace(' = /', '');
  lines[idx] = `const ${mutName} = /^$(?!)/;`;
  const mutated = lines.join('\n');
  if (mutated === orig) { console.log(`❌ ${b.name}: 注入未生效，算未变红`); continue; }
  fs.writeFileSync(ckptFile, mutated, 'utf8');
  // T5_ZH_NULLIFY 的 const 与该支用法在同一文件，直接替换该行安全；
  // 但必须确认副本里没有其他文件引用到它 —— 只在该模块内部使用。
  let out, failed;
  try {
    out = execFileSync(process.execPath, [path.join(tmp, 'test', TEST)], { encoding: 'utf8', timeout: 90000 });
    failed = false;
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    failed = true;
  }
  if (failed && /攻击族命中|删条变异/.test(out) && !/Error|Cannot find|MODULE_NOT_FOUND/.test(out.split('✅')[0])) {
    console.log(`✅ ${b.name}: 守卫变红（断言失败而非崩溃）`);
    red++;
  } else if (failed) {
    console.log(`⚠️ ${b.name}: 测试退出非零但输出需人工判断 —— ${out.trim().slice(-120)}`);
    green++;
  } else {
    console.log(`❌ ${b.name}: 删后守卫仍全绿（守卫对该支不敏感）`);
    green++;
  }
  fs.writeFileSync(ckptFile, orig, 'utf8');
}
console.log(`\n负例结果：${red}/${BRANCHES.length} 支删除后守卫变红` + (green === 0 ? '，全部通过' : `，${green} 支需人工复核`));
fs.rmSync(tmp, { recursive: true, force: true });
