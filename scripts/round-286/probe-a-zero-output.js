/**
 * [round-286 probe] 复测「run-all 零输出假失败」是否仍成立。
 *
 * 背景：283/284 交接簿称 run-all 有 123/142 个文件零输出被判失败。
 * 285 轮证据：正确 runner 下无零输出，疑 runWithBestRunner 的 isMount 误判。
 *
 * 本探针不跑测试，只静态分类 test/ 下全部 .test.js：
 *   1) 按 run-all 第 219 行同一套 isMount 正则分类 mount / jest / sub
 *   2) sub 类中「跑裸 node 也不会吐 N 通过, M 失败 汇总行」的文件 = 假失败候选
 *   3) mount 类中等价检查（_mount.js 只认模块导出函数）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const TEST_DIR = path.join(ROOT, 'test');

function collect(dir, base = dir) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'archive') continue;
      out.push(...collect(full, base));
    } else if (ent.name.endsWith('.test.js') && ent.name !== 'run-all.test.js') {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort();
}

const files = collect(TEST_DIR);
const IS_MOUNT = /module\.exports\s*=\s*(?:function\b|[A-Za-z_$][\w$]*\s*;|\(?[^)]*\)?\s*=>)/;

const cats = { mount: [], jest: [], sub: [] };
for (const rel of files) {
  let src = '';
  try { src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8'); } catch (e) { continue; }
  if (IS_MOUNT.test(src)) cats.mount.push(rel);
  else if (/\bdescribe\s*\(/.test(src) && !/require\(['"][^'"]*mini-expect/.test(src)) cats.jest.push(rel);
  else cats.sub.push(rel);
}

// 「能吐汇总行」= 源码里出现汇总行格式串之一
const SUMMARY_PATS = [
  /\d+\s*通过/,
  /通过[，,]\s*\d+\s*失败/,
  /\bpassed\b/i,
  /\bfailed\b/i,
  /mini-expect/,
];

function canEmitSummary(src) {
  return SUMMARY_PATS.some((p) => p.test(src));
}

const subNoSummary = cats.sub.filter((rel) => {
  const src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8');
  return !canEmitSummary(src);
});
const subNoExport = cats.sub.filter((rel) => {
  const src = fs.readFileSync(path.join(TEST_DIR, rel), 'utf8');
  return /module\.exports/.test(src);
});

const report = {
  round: 286,
  total: files.length,
  counts: { mount: cats.mount.length, jest: cats.jest.length, sub: cats.sub.length },
  subNoSummaryCount: subNoSummary.length,
  subNoSummary: subNoSummary,
  subHasExportButNotMount: subNoExport,
  mountFiles: cats.mount,
};
fs.writeFileSync(path.join(ROOT, 'scripts', 'round-286', 'probe-a-zero-output.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('total       =', report.total);
console.log('mount/jest/sub =', cats.mount.length, '/', cats.jest.length, '/', cats.sub.length);
console.log('sub 无汇总行候选(假失败候选) =', subNoSummary.length);
console.log('sub 有 module.exports 但非 mount 正则 =', subNoExport.length);
for (const f of subNoSummary) console.log('  [NOSUM]', f);
for (const f of subNoExport) console.log('  [EXPORT-NOMOUNT]', f);
