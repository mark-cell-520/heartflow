/**
 * negative-test-superlative-generic-r222.js — 负例验证（v6.7.125 第 222 轮）
 *
 * 验证 test/superlative-generic-r222.test.js 真的在守门：把本轮新增的
 * superlative generic 判据逐段删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 本轮两个特殊坑（第一版 2/5 变红的教训）：
 *   ① **冗余变异不算红**。/最新(?:的)?(?:版本…)/ 看似必需，但前置
 *      `_supText` 里已有裸 `最新` 全局中性化 —— 删了它探针照样全绿。
 *      变异必须命中**只有新块提供**的保护，否则是无效变异。
 *   ② **删整行会崩**。把 `issues.push({...})` 整行换成永不匹配正则 →
 *      留下光秃秃的 `if (x > 0)` → 语法错误 → 崩溃 ≠ 变红。
 *      改用 plain-text 型变异（只改 detail 字符串），保持语法合法。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'index.js'), 'utf8');

const BLOCK_START = SRC.indexOf('[v6.7.125 第 222 轮] 「最+主观形容词」泛化补形');
function extractBlock(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到第 222 轮新增块');
  const seg = SRC.slice(BLOCK_START, BLOCK_START + 6000);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/g', i);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  return seg.slice(start, end + 2);
}

// ── 注入清单 ───────────────────────────────────────────────────────
// regex 型：从新块内按锚点提取整条正则 → 换成永不匹配（语法保持合法）
// plain 型：逐字文本替换（只改字符串常量，语法必然合法）
// samples = **只有这条规则保护**的中性化样本（删掉该规则必然误命中）。
// ⚠️ 第三版教训：曾把「最大的误差出现在…」当 M4 样本，但它同时被过程量
//    规则保护，删度量规则它照样绿 = 冗余变异（不计红）。每条样本都必须
//    是「只有该规则能挡住它」。
const INJECTIONS = [
  {
    kind: 'regex', name: 'M1 删主判据（最+形容词+的+对象）',
    anchor: '最[\\u4e00-\\u9fff]{1,3}的[\\u4e00-\\u9fff]{1,6}/g',
    samples: ['最后一章的内容需要润色'],
  },
  {
    kind: 'regex', name: 'M2 删「最早」中性化（最早记录族误伤）',
    anchor: '最早(?:的)?(?:记录',
    samples: ['最早的记录可以追溯到去年三月'],
  },
  {
    kind: 'regex', name: 'M3 删度量/序列名词中性化（最大占比族误伤）',
    anchor: '阶段|时期|时段|年份|月份|日期|时长',
    samples: ['最大的占比来自华东区'],
  },
  {
    kind: 'regex', name: 'M4 删序列名词中性化（最大错误族误伤）',
    anchor: '风险|等待时间|样本量|错误',
    samples: ['最大的错误可以修正'],
  },
  {
    kind: 'regex', name: 'M5 删过程量中性化（最XX的YY 是…族误伤）',
    anchor: '是|放在|放在最|出现在',
    samples: ['最贴心的设计是全新的'],
  },
  {
    kind: 'plain', name: 'M6 detail 改名（判据仍算但换了不可识别名字）',
    from: 'superlative generic(', to: 'superlative RENAMED(',
    samples: ['这是最耐用的地板'],
  },
];

// 对所有变异都成立的正向样本：删任何一条中性化规则它们仍必须命中
const POSITIVE = ['这是最耐用的地板', '这是最省心的服务', '这是最难用的界面', '这是最棒的表现'];

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir, samples) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const idx = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const POS = ' + JSON.stringify(POSITIVE) + ';',
    'const NEU = ' + JSON.stringify(samples) + ';',
    'function has(s) {',
    '  const r = idx.checkConfidenceCalibration(s);',
    '  return (r.issues || []).some(i => /superlative generic/.test(String(i.detail)));',
    '}',
    'let fail = 0;',
    'for (const s of POS) if (!has(s)) { fail++; console.log("MISS_POS " + s); }',
    'for (const s of NEU) if (has(s)) { fail++; console.log("FALSE_POS " + s); }',
    'console.log("HIT_FAIL=" + fail + "/" + (POS.length + NEU.length));',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  results.push([name, '变红（' + (m ? ('miss ' + m[1] + '/' + m[2]) : 'miss ?') + '）']);
}

// ① 对照副本：未注入，正向全命中且全部中性化样本零误命中
// ⚠️ M6 的专属样本是「这是最耐用的地板」（同时也是正向样本）——
//    把它放进中性化池会自相矛盾地让对照变红（实测踩过）。专属样本按
//    「只对本注入有意义」处理：正向池与中性化池不相交。
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-sg-control'), s => s, true);
  const allNeutral = [];
  for (const inj of INJECTIONS) {
    for (const s of inj.samples) {
      if (POSITIVE.includes(s)) continue;
      if (!allNeutral.includes(s)) allNeutral.push(s);
    }
  }
  try {
    const out = runGuard(dir, allNeutral);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    // 非 0 退出码抛错但 stdout 可读：HIT_FAIL>0 就是「变红」不是崩溃
    const out = String(e.stdout || '');
    if (/HIT_FAIL=0\//.test(out)) {
      results.push(['对照（未注入）', '全绿']);
    } else {
      console.error('对照副本未全绿：\n' + out + '\n' + String(e.stderr || '').slice(0, 300));
      results.push(['对照（未注入）', '未全绿']);
      green++;
    }
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  let mutate;
  if (inj.kind === 'plain') {
    mutate = s => s.split(inj.from).join(inj.to);
  } else {
    let needle;
    try {
      needle = extractBlock(inj.anchor);
    } catch (e) {
      results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
      green++;
      continue;
    }
    mutate = s => s.split(needle).join(NEVER_MATCH);
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-sg-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    mutate
  );
  try {
    const out = runGuard(dir, inj.samples);
    if (/HIT_FAIL=0\//.test(out)) { green++; results.push([inj.name, '未变红（守卫失守）']); }
    else recordRed(out, inj.name);
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) recordRed(out, inj.name);
    else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      green++;
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
