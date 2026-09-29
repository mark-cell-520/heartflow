#!/usr/bin/env node
/**
 * scripts/negative-test-confidence-superlative-en-mixed-r224.js
 *
 * 第 224 轮负例守卫：证明 test/confidence-superlative-en-mixed-r224.test.js
 * 真的在守东西。
 *
 * 方法论（承接 223 轮教训）：**部分删词表是无效变异**。
 * 223 轮实测：把预查表的 3 个词换成永不匹配，探针照样全绿——因为词表
 * 有 30+ 词，删 3 个其余仍挡住同批样本。本轮同样踩过：
 * 只把 `reliable` 从 EN_SUP_ADJ 删掉，混排样本仍被 most+其它形容词
 * 变体的守卫挡住。故本轮守卫一律采用**整条规则级变异**：
 *
 *   M1 把判据搬回 `else { ... }`（恢复二分支）→ 混排样本必须全变红
 *   M2 整条 _supEn 命中后不 push issue（判据静默）→ 正向样本必须全变红
 *   M3 把 EN_SUP_ADJ 整表替换成永不匹配的占位 → 只测 most+形容词的样本变红
 *   M4 删掉建议句式/时间副词豁免（两条 replace 变直通）→ 豁免样本必须变红
 *   M5 可靠形容词回退：把 most reliable 也中性化掉 → reliable 族必须变红
 *   C0 对照（identity mutate）→ 必须全绿，否则守卫自身失效
 *
 * 输出只报数字，不打印样本文本。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const TEST = path.join(ROOT, 'test', 'confidence-superlative-en-mixed-r224.test.js');
const BACKUP = '/tmp/idx-r224-neg-backup.js';

const original = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BACKUP, original);

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 100000 });
    const m = out.match(/测试结果: (\d+) 通过, (\d+) 失败/);
    return { green: m ? Number(m[2]) === 0 : false, fail: m ? Number(m[2]) : -1, out };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const m = out.match(/测试结果: (\d+) 通过, (\d+) 失败/);
    return { green: false, fail: m ? Number(m[2]) : -1, out };
  } finally {
    fs.writeFileSync(SRC, original);
  }
}

// ── 变异定义：每个都是「整条规则级」改动 ──────────────────────────
const MUTATIONS = [
  {
    id: 'M1',
    desc: '判据搬回 else 分支（恢复 hasChinese 二分支）',
    apply: (s) => {
      // 用条件把公共区判据重新关起来：在 `const _supEn = text` 前插入
      // `if (!hasChinese) {`，并在 push 行后补 `}` 闭合。这复现了原
      // 「一个汉字 → 整段英文判据不跑」的旧结构，混排样本必须全变红。
      const startMarker = '  const _supEn = text';
      const endMarker = "  if (superlativeEN > 0) issues.push({ type: 'overconfidence', detail: `superlative subjective en(${superlativeEN})`, severity: 0.25 });";
      const si = s.indexOf(startMarker);
      const ei = s.indexOf(endMarker);
      if (si < 0) throw new Error('M1 起始锚点丢失');
      if (ei < 0) throw new Error('M1 结束锚点丢失');
      if (ei < si) throw new Error('M1 锚点顺序异常');
      const endPos = ei + endMarker.length;
      return s.slice(0, si) + '  if (!hasChinese) {\n' + s.slice(si, endPos) + '\n  }' + s.slice(endPos);
    },
  },
  {
    id: 'M2',
    desc: '命中后不 push issue（判据静默）',
    apply: (s) => s.replace(
      "  if (superlativeEN > 0) issues.push({ type: 'overconfidence', detail: `superlative subjective en(${superlativeEN})`, severity: 0.25 });",
      '  // MUTATED: push removed'),
  },
  {
    id: 'M3',
    desc: 'EN_SUP_ADJ 整表换成永不匹配占位',
    apply: (s) => s.replace(
      "const EN_SUP_ADJ = '(?:quiet|comfortable|trustworthy|convenient|beautiful|useful|powerful|intuitive|robust|scalable|elegant|lightweight|durable|affordable|popular|impressive|important|simple|easy|fast|flexible|responsive|stable|efficient|effective|good|great|nice|bad|ugly|boring|annoying|unreliable|slow|cumbersome|confusing|expensive|reliable)';",
      "const EN_SUP_ADJ = '(?!)';"),
  },
  {
    id: 'M4',
    desc: '删掉建议句式 + 时间/序列副词豁免（两条 replace 变直通）',
    apply: (s) => {
      // 用宽松匹配：源码里 safest 的写法历史上改过（safest / safests?），
      // 按行匹配「含 best...way...approach」与「含 latest|newest...」两行，
      // 命中即整行替换为空行，避免锚点因词形变化再次丢失。
      const lines = s.split('\n');
      let removedA = false, removedB = false;
      const out = lines.map((l) => {
        if (!removedA && l.includes('best|simplest|easiest') && l.includes('way|ways|approach')) {
          removedA = true; return '';
        }
        if (!removedB && l.includes('latest|newest') && l.includes('version|release|update')) {
          removedB = true; return '';
        }
        return l;
      });
      if (!removedA) throw new Error('M4a 锚点丢失（建议句式豁免行）');
      if (!removedB) throw new Error('M4b 锚点丢失（时间副词豁免行）');
      return out.join('\n');
    },
  },
  {
    id: 'M5',
    desc: '把 most reliable 也中性化（reliable 族回退）',
    apply: (s) => s.replace(
      "    .replace(/\\b(?:latest|newest|earliest|oldest|previous|recent)\\s+(?:version|release|update|news|information|data|results?|build)\\b/gi, ' ');",
      "    .replace(/\\b(?:latest|newest|earliest|oldest|previous|recent)\\s+(?:version|release|update|news|information|data|results?|build)\\b/gi, ' ')\n    .replace(/\\bmost\\s+reliable\\b/gi, ' ');"),
  },
];

// ── M6：删掉正向组 1 的样本（证明测试真的依赖它们）───────────────
const M6 = {
  id: 'M6',
  desc: '正向组 1 样本清空（测试自身不能空转）',
  applyTest: (t) => t.replace(
    /const mixedMost = \[\n(?:.*\n)*?\];/,
    'const mixedMost = [];'),
};

let redCount = 0, invalidCount = 0, errCount = 0;
const results = [];

for (const m of MUTATIONS) {
  let mutated;
  try { mutated = m.apply(original); }
  catch (e) { errCount++; results.push(`${m.id} 变异失败: ${e.message}`); continue; }
  if (mutated === original) { invalidCount++; results.push(`${m.id} 无效变异（apply 未改源码）`); continue; }
  fs.writeFileSync(SRC, mutated);
  const r = runTest();
  if (r.green) { invalidCount++; results.push(`${m.id} 无效变异 — 守卫仍是绿的（${r.fail}）`); }
  else { redCount++; results.push(`${m.id} 真红 (${r.fail} 失败)`); }
}

// 对照（identity mutate）：不做任何改动，必须全绿
{
  const r = runTest();
  if (r.green) results.push('C0 对照全绿 ✅');
  else { errCount++; results.push(`C0 对照失败（${r.fail} 失败）— 守卫自身坏了`); }
}

// M6：改测试文件本身
{
  const t0 = fs.readFileSync(TEST, 'utf8');
  let t;
  try { t = M6.applyTest(t0); }
  catch (e) { results.push(`M6 变异失败: ${e.message}`); t = null; }
  if (t && t !== t0) {
    fs.writeFileSync(TEST, t);
    const r = runTest();
    fs.writeFileSync(TEST, t0);   // 先还原测试
    if (r.green) { invalidCount++; results.push('M6 无效变异 — 清空正向样本后仍全绿'); }
    else { redCount++; results.push(`M6 真红 (${r.fail} 失败)`); }
  } else if (t === t0) {
    results.push('M6 无效变异（applyTest 未改测试）');
    invalidCount++;
  }
}

fs.writeFileSync(SRC, original);
console.log('── 第 224 轮负例守卫：英文 superlative 混排 ──');
for (const r of results) console.log(' ', r);
console.log(`汇总: ${redCount} 真红, ${invalidCount} 无效变异, ${errCount} 异常, 共 ${MUTATIONS.length + 1} 变异 + 1 对照`);
process.exit(invalidCount === 0 && errCount === 0 && redCount === MUTATIONS.length ? 0 : 1);
