#!/usr/bin/env node
/**
 * scripts/negative-test-gaslighting-memory.js — v6.7.105 负例验证
 *
 * 注入缺陷 → 守卫必须变红。自证无效，每个缺陷都注入 src/index.js 的副本。
 * 6 个缺陷：
 *   1. 删除全部 zh_memory_tampering 模式
 *   2. 去掉主体限定（你(?:的)?记忆 → 记忆）
 *   3. 去掉 zh_memory_tampering 单信号升级分支
 *   4. 删除「感知虚构化」类（臆想/幻觉）
 *   5. 删除「记忆被篡」类
 *   6. 删掉双形态兼容（entry.pattern → pat）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const TEST = fs.readFileSync(path.join(ROOT, 'test/gaslighting-memory-tampering.test.js'), 'utf8');

const INJECTIONS = [
  {
    name: '删除全部 zh_memory_tampering 模式',
    apply: (s) => {
      // 从 [v6.7.105] 注释到「责任转嫁」注释之间的对象条目全部删掉
      const start = s.indexOf('// [v6.7.105] 记忆篡改句式');
      const end = s.indexOf('// 责任转嫁', start);
      if (start < 0 || end < 0) throw new Error('锚点未找到');
      return s.slice(0, start) + s.slice(end);
    },
  },
  {
    name: '去掉主体限定（你(?:的)?记忆 → 记忆）',
    apply: (s) => s.split('你(?:的)?记忆').join('(?:你)?记忆'),
  },
  {
    name: '去掉 zh_memory_tampering 单信号升级',
    apply: (s) => {
      const needle = "  if (count === 1 && signals[0] && STRONG_SINGLE_TYPES.has(signals[0].type)) {";
      if (!s.includes(needle)) throw new Error('升级分支锚点未找到');
      return s.replace(needle, '  if (false && count === 1 && signals[0] && STRONG_SINGLE_TYPES.has(signals[0].type)) {');
    },
  },
  {
    name: '删除感知虚构化类（臆想/幻觉/凭空想象）',
    apply: (s) => {
      const a = s.indexOf("{ pattern: /你(?:又)?(?:在)?臆想");
      const b = s.indexOf("{ pattern: /你(?:的)?(?:记忆|印象|认知|感知)");
      if (a < 0 || b < 0 || b <= a) throw new Error('感知虚构化锚点未找到');
      return s.slice(0, a) + s.slice(b);
    },
  },
  {
    name: '删除记忆被篡类',
    apply: (s) => {
      const a = s.indexOf("{ pattern: /你(?:的)?(?:记忆|印象|认知|感知)");
      const b = s.indexOf('// 责任转嫁', a);
      if (a < 0 || b < 0 || b <= a) throw new Error('记忆被篡锚点未找到');
      return s.slice(0, a) + s.slice(b);
    },
  },
  {
    name: '删掉双形态兼容（entry.pattern → pat）',
    apply: (s) => {
      const needle = 'const pat = entry instanceof RegExp ? entry : entry.pattern;';
      if (!s.includes(needle)) throw new Error('兼容分支锚点未找到');
      return s.replace(needle, 'const pat = entry;');
    },
  },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-negtest-'));
const tmpSrc = path.join(tmp, 'src');
const tmpTest = path.join(tmp, 'test');
fs.mkdirSync(tmpSrc, { recursive: true });
fs.mkdirSync(tmpTest, { recursive: true });

let allRed = true;
const results = [];

for (const inj of INJECTIONS) {
  let mutated;
  try { mutated = inj.apply(SRC); }
  catch (e) { results.push({ name: inj.name, ok: false, detail: `注入失败: ${e.message}` }); allRed = false; continue; }

  // 把整个 src 树复制过去，只替换 index.js
  for (const f of fs.readdirSync(path.join(ROOT, 'src'))) {
    const from = path.join(ROOT, 'src', f);
    const to = path.join(tmpSrc, f);
    if (fs.statSync(from).isDirectory()) continue; // 只需顶层文件
    fs.copyFileSync(from, to);
  }
  fs.writeFileSync(path.join(tmpSrc, 'index.js'), mutated);
  // 测试文件：入口路径与 src 距一层，同一布局
  fs.writeFileSync(path.join(tmpTest, 'gaslighting-memory-tampering.test.js'), TEST);

  let red = false;
  let detail = '';
  try {
    const out = execFileSync('node', [path.join(tmpTest, 'gaslighting-memory-tampering.test.js')],
      { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    detail = '测试仍全绿（守卫未变红）';
  } catch (e) {
    const m = (e.stdout || '') + (e.stderr || '');
    const fm = m.match(/(\d+) passed, (\d+) failed/);
    red = true;
    detail = fm ? `变红: ${fm[2]} failed / ${fm[1]} passed` : '非零退出（守卫变红）';
  }
  if (!red) allRed = false;
  results.push({ name: inj.name, ok: red, detail });
}

console.log('\n═══ 负例验证结果 ═══');
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name} — ${r.detail}`);
}
console.log(`\n${allRed ? '✅ 全部缺陷均让守卫变红（6/6）' : '❌ 存在未让守卫变红的缺陷'}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(allRed ? 0 : 1);
