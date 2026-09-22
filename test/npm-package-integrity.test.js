/**
 * 测试：npm 包发布完整性守卫（v6.7.71，心虫 decision.decide 0.93）
 *
 * 来源：第 34 轮心虫选「验证 npm 包完整性」。
 *
 * 一、发现的真问题（本轮已修复并发布 6.7.70）
 *
 * 独立目录 npm install @yun520-1/heartflow 后逐个 require，
 * 8 个核心模块全部 Cannot find module：
 *   text-normalizer / multi-turn-tactics / quotation-context /
 *   discrimination-trace / gate-verdict / false-positive-feedback /
 *   dangerous-instruction / manipulation-tactics
 *
 * 根因：**本地 VERSION 与 npm 最新版都是 6.7.69，但内容不同**。
 * 本地这一个月新增 10+ 模块和大量修复从未发布；npm 上的 6.7.69
 * 是很久以前打的旧包。npm 不允许同版本覆盖发布（403），
 * 所以必须先 bump。
 *
 * 二、关键教训：npm pack --dry-run 通过 ≠ 线上可用
 *
 * 本地 pack 列出 13/13 核心入口全在——本地包是好的。
 * 线上 install 装到的包缺 8 个文件。
 * 唯一可靠的验证是：独立目录 install 后逐个 require。
 *
 * 三、本测试守什么
 *
 *   ① 版本号三处同步（VERSION / package.json / SKILL.md）
 *      ——2026-09-01 的铁律，本轮又踩一次（改 package.json
 *        忘改 SKILL.md，security-audit I5 立刻红灯）
 *   ② 本地源码里所有被 index.js/gate.js require 的兄弟模块
 *      必须能被 npm pack 覆盖（files 含 src/）
 *   ③ npm 上的 latest 版本不得落后本地 VERSION
 *      ——这一条只在网络可用时跑，不可用时跳过不误报
 */
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

const pkg = JSON.parse(fs.readFileSync(path.join(HF, 'package.json'), 'utf8'));
const VERSION_FILE = fs.readFileSync(path.join(HF, 'VERSION'), 'utf8').trim();

console.log('\n[1] 版本号三处同步]');

t('VERSION 文件 = package.json', () => {
  assert.strictEqual(VERSION_FILE, pkg.version,
    `VERSION=${VERSION_FILE} != package.json=${pkg.version}`);
});

t('SKILL.md = package.json（security-audit I5 同款检查）', () => {
  const skill = fs.readFileSync(path.join(HF, 'SKILL.md'), 'utf8');
  const m = skill.match(/^version:\s*["']?([\d.]+)["']?/m);
  assert.ok(m, 'SKILL.md 缺 version frontmatter');
  assert.strictEqual(m[1], pkg.version,
    `SKILL.md=${m[1]} != package.json=${pkg.version}`);
});

console.log('\n[2] files 白名单必须覆盖全部 src 兄弟模块]');

t('files 含 src/', () => {
  assert.ok(Array.isArray(pkg.files) && pkg.files.includes('src/'),
    `files=${JSON.stringify(pkg.files)}，缺 src/`);
});

t('本地 pack 包含 index.js require 的每个 src 兄弟模块', () => {
  const r = cp.spawnSync('npm', ['pack', '--dry-run'],
    { encoding: 'utf8', timeout: 200000, cwd: HF, maxBuffer: 1e8 });
  // 注意：npm pack --dry-run 的文件列表走 **stderr**（stdout 只有 tgz 文件名）
  const packed = new Set();
  const out = (r.stdout || '') + (r.stderr || '');
  for (const m of out.matchAll(/(?:^|\s)(src\/[A-Za-z0-9/._-]+\.js)(?:\s|$)/gm)) packed.add(m[1]);
  assert.ok(packed.size > 50, `pack 只列出 ${packed.size} 个 js 文件（stdout ${(r.stdout||'').length} 字节）`);

  // index.js / gate.js 直接 require 的 src 兄弟模块
  const indexSrc = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const gateSrc = fs.readFileSync(path.join(HF, 'src/gate.js'), 'utf8');
  const required = new Set();
  for (const m of (indexSrc + '\n' + gateSrc).matchAll(/require\(['"]\.\/([\w.-]+\.js)['"]\)/g)) {
    required.add('src/' + m[1]);
  }
  const missing = [...required].filter(f => !packed.has(f));
  assert.strictEqual(missing.length, 0,
    `pack 漏掉 ${missing.length} 个被 require 的模块: ${missing.slice(0, 6).join(', ')}`);
});

console.log('\n[3] npm latest 不落后本地（网络可用时才跑）]');

t('npm latest >= 本地 VERSION', () => {
  const r = cp.spawnSync('npm', ['view', '@yun520-1/heartflow', 'version'],
    { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0 || !r.stdout) {
    console.log('     (网络/npm 不可用，跳过 — 前两项已覆盖主要风险)');
    return;
  }
  const latest = r.stdout.trim();
  const cmp = (a, b) => {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  };
  assert.ok(cmp(latest, pkg.version) >= 0,
    `npm latest=${latest} 落后本地=${pkg.version}。` +
    `本地改过内容但没发布——这正是第 34 轮踩的坑（版本号相同内容不同）。`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
