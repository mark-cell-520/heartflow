/**
 * negative-test-concession-coercion-wiring.js — 负例验证（第492轮）
 *
 * 验证 test/round-492-concession-coercion.test.js 真的在守 concession_coercion
 * 四支：把 src/concession-coercion.js 的 CONCEDE_ZH / CALAMITY_ZH /
 * CONCEDE_EN / CALAMITY_EN 逐支置为永不匹配，守卫测试必须变红
 * （断言失败，不是加载崩溃）。
 *
 * 三条踩过的坑（沿用 round-491 负例脚本的教训）：
 *   ① 副本必须整仓拷贝且把测试指向副本目录跑 —— gate.js 要读 VERSION，
 *      路径钉死真实仓库会读到真文件，注入等于没生效。
 *   ② 用「整行替换法」而不是正则体内替换 —— 四支的正则体含 / 字符，
 *      按 / 切分会截断；按 const 声明行整行换成合法正则最稳。
 *   ③ 注入后必须真的改变源码 —— 用替换前后长度差断言，防止 needle 漂移
 *      导致假阴性。
 *   ④ 测试文件里也要指向副本的 src/ —— round-492 测试 require
 *      '../src/concession-coercion.js'，用相对定位，跑副本里的测试即可。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TEST = 'round-492-concession-coercion.test.js';

const BRANCHES = [
  { name: 'CONCEDE_ZH（让步条件·中文）', decl: 'const CONCEDE_ZH = /' },
  { name: 'CALAMITY_ZH（灾难终局·中文）', decl: 'const CALAMITY_ZH = /' },
  { name: 'CONCEDE_EN（让步条件·英文）', decl: 'const CONCEDE_EN = /' },
  { name: 'CALAMITY_EN（灾难终局·英文）', decl: 'const CALAMITY_EN = /' },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg492-'));
execFileSync('cp', ['-r',
  path.join(HF, 'src'),
  path.join(HF, 'VERSION'),
  path.join(HF, 'package.json'),
  tmp]);
// 测试单独跑：它有固定的 require 相对路径，为了避免误放错位置，我先完整拷贝
// test 目录再单独执行，如果找不到文件才按单文件方式复制到指定路径去。
fs.mkdirSync(path.join(tmp, 'test'), { recursive: true });
fs.copyFileSync(
  path.join(HF, 'test', TEST),
  path.join(tmp, 'test', TEST),
);
const ckptFile = path.join(tmp, 'src', 'concession-coercion.js');

let red = 0, green = 0;
for (const b of BRANCHES) {
  const orig = fs.readFileSync(ckptFile, 'utf8');
  const lines = orig.split('\n');
  const idx = lines.findIndex(l => l.startsWith(b.decl));
  if (idx < 0) { console.log(`❌ ${b.name}: 找不到 const 声明行，算未变红`); green++; continue; }
  const mutName = b.decl.replace('const ', '').replace(' = /', '');
  lines[idx] = `const ${mutName} = /^$(?!)/;`;
  const mutated = lines.join('\n');
  if (mutated === orig) { console.log(`❌ ${b.name}: 注入未生效，算未变红`); green++; continue; }
  fs.writeFileSync(ckptFile, mutated, 'utf8');
  let out, failed;
  try {
    out = execFileSync(process.execPath, [path.join(tmp, 'test', TEST)], { encoding: 'utf8', timeout: 90000 });
    failed = false;
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    failed = true;
  }
  if (failed && /攻击命中|删条变异|良性不命中/.test(out) && !/Error|Cannot find|MODULE_NOT_FOUND/.test(out.split('全部通过')[0])) {
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
if (red !== BRANCHES.length) process.exit(1);
