/**
 * 负例守卫：bad_faith 自述型坏信念三支（第 348 轮收口 r347）
 *
 * 口径（沿用第 86 轮）：
 *   ① 删条：在整仓副本里把 BADFAITH_SELF_ZH 的某个「半」整块删掉
 *     （只拷 src/index.js 会让 gate.js 加载崩溃——崩溃≠变红）
 *   ② 跑真主测试：副本里跑 test/round-348-bad-faith-self-statement-zh.test.js
 *   ③ 退出码非零 = 真变红（该半确被守卫覆盖）
 *
 * 删的对象：BADFAITH_SELF_ZH 的六个正则半（knows/hides/submits/insincere/
 * promises/escapes）+ 函数体内的三个 if 分支（逐支删）。
 * 每个删除都配专属攻击样本（删后唯一会漏的样本）。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src/index.js');
const MAIN = 'test/round-348-bad-faith-self-statement-zh.test.js';
const COPY = '/root/.hermes/scratch/r348-guard-copy';

function sh(cmd, cwd) {
  try {
    const out = execFileSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout: 110000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: out.toString() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}

// ── 六个半的删条目标：从源码里按键名取整行赋值，替换成永不匹配的正则 ──
const src = fs.readFileSync(IDX, 'utf8');
const SELF_BLOCK_START = src.indexOf('const BADFAITH_SELF_ZH = {');
if (SELF_BLOCK_START < 0) throw new Error('源码里找不到 BADFAITH_SELF_ZH');

// 每个「半」的属性名 + 删掉它后唯一会漏的代表样本（每半一条）
const HALVES = [
  { key: 'knows',     sample: '我早就知道会这样，只是没说而已' },
  { key: 'hides',     sample: '这个问题我一开始就心知肚明，但从没在会上提过' },
  { key: 'submits',   sample: '您教训的是，我完全错了（并无诚意）' },
  { key: 'insincere', sample: '好好好，都是我的错行了吧，你说什么就是什么' },
  { key: 'promises',  sample: '先答应下来，反正到时候再找理由推掉' },
  { key: 'escapes',   sample: '嘴上说全力支持，实际上早就找好退路了' },
];

// ── 建副本：src + 主测试 + VERSION/package.json（r86 同款最小集）──
if (fs.existsSync(COPY)) fs.rmSync(COPY, { recursive: true, force: true });
fs.mkdirSync(path.join(COPY, 'test'), { recursive: true });
fs.cpSync(path.join(HF, 'src'), path.join(COPY, 'src'), { recursive: true });
fs.copyFileSync(path.join(HF, MAIN), path.join(COPY, MAIN));
for (const f of ['package.json', 'VERSION']) {
  const p = path.join(HF, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(COPY, f));
}
const nm = path.join(HF, 'node_modules');
if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(COPY, 'node_modules'), 'dir');

const copyIdx = path.join(COPY, 'src/index.js');
let original = fs.readFileSync(copyIdx, 'utf8');

// ── 对照组：未改动的副本必须全绿 ──
const ctrl = sh(`node ${MAIN}`, COPY);
console.log(`\n[对照组] 主测试 ${ctrl.ok ? 'PASS（对照成立）' : 'FAIL（对照不成立，中止）'}`);
if (!ctrl.ok) { console.log(ctrl.out.slice(-800)); process.exit(1); }

/** 把某个「半」的正则整行替换成永不匹配的合法正则 */
function neutralizeHalf(text, key) {
  // 形如：  knows: /(?:...)/i,
  // 正则很长且含转义，按行定位：从属性名行首找到该行结尾的 `/` 标志位。
  const lines = text.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const L = lines[n];
    const m = L.match(new RegExp(`^(\\s*)${key}:\\s*/`));
    if (!m) continue;
    // 必须以 /i, 结尾（BADFAITH_SELF_ZH 六行都是单行正则）
    if (!/\/i,\s*$/.test(L)) return null;
    lines[n] = `${m[1]}${key}: /^$(?!)/i,`;
    return lines.join('\n');
  }
  return null;
}

// 每个「半」删掉后，主测试里哪几条断言必须变红（逐支敏感点）
const EXPECT_RED = {
  knows: ['A 支'],
  hides: ['A 支'],
  submits: ['B 支'],
  insincere: ['B 支'],
  promises: ['C 支'],
  escapes: ['C 支'],
};

console.log('\n[删条敏感性：删掉任一「半」后主测试必须变红]');
let red = 0, green = 0;
const report = [];

for (const { key, sample } of HALVES) {
  const stripped = neutralizeHalf(original, key);
  if (stripped === null) {
    report.push({ key, status: 'DELETE_FAIL', note: '定位不到该半的正则行' });
    green++;
    continue;
  }
  fs.writeFileSync(copyIdx, stripped);

  // ① 主测试必须变红（退出码非零）
  const main = sh(`node ${MAIN}`, COPY);
  // ② 专属样本必须漏判（per-slot 敏感点，防止「主测试红是因为别处崩」）
  // ⚠️ 不用 node -e 内联：bash -c 里的引号嵌套会把 HIT= 输出吞掉
  //    （r348 第一版踩坑：六个半全被判 RED_NO_MISS，其实删条是有效的）。
  const probeFile = path.join(COPY, '_probe-hit.js');
  fs.writeFileSync(probeFile, [
    'const g = require(' + JSON.stringify(path.join(COPY, 'src', 'gate.js')) + ');',
    'const s = ' + JSON.stringify(sample) + ';',
    "const hit = (g.gate(s).findings || []).some(f => f.dimension === 'bad_faith');",
    "console.log('HIT=' + hit);",
  ].join('\n'));
  const probe = sh('node _probe-hit.js', COPY);
  const miss = /HIT=false/.test(probe.out);

  if (!main.ok && miss) {
    red++;
    report.push({ key, status: 'RED', note: `删后主测试退出码非零 + 专属样本漏判（${EXPECT_RED[key].join('/')} 断言变红）` });
  } else if (main.ok) {
    green++;
    report.push({ key, status: 'NOT_RED', note: '删后半测试仍全绿 → 守卫失守' });
  } else {
    green++;
    report.push({ key, status: 'RED_NO_MISS', note: '主测试红了但专属样本仍命中（可能是别处崩，不计红）' });
  }
  fs.writeFileSync(copyIdx, original);
}

// ③ 函数体三分支整体删掉：防空 push 接线（信号接不回 checkBadFaith）
const CALL_LINE = '  if (hasChinese) signals.push(...badFaithSelfStatement(text));';
const branch = original.indexOf(CALL_LINE);
if (branch < 0) {
  report.push({ key: '调用接线', status: 'DELETE_FAIL', note: '定位不到调用行' });
  green++;
} else {
  fs.writeFileSync(copyIdx, original.replace(CALL_LINE, '  // 负例守卫：临时摘掉调用'));
  const main = sh(`node ${MAIN}`, COPY);
  const probeFile = path.join(COPY, '_probe-hit.js');
  fs.writeFileSync(probeFile, [
    'const g = require(' + JSON.stringify(path.join(COPY, 'src', 'gate.js')) + ');',
    'const s = ' + JSON.stringify(HALVES[0].sample) + ';',
    "const hit = (g.gate(s).findings || []).some(f => f.dimension === 'bad_faith');",
    "console.log('HIT=' + hit);",
  ].join('\n'));
  const probe = sh('node _probe-hit.js', COPY);
  if (!main.ok && /HIT=false/.test(probe.out)) {
    red++;
    report.push({ key: '调用接线', status: 'RED', note: '摘掉 push 接线后主测试变红 + 样本漏判 → 接线确被守卫' });
  } else {
    green++;
    report.push({ key: '调用接线', status: 'NOT_RED', note: main.ok ? '主测试仍全绿 → 守卫失守' : '红了但样本仍命中，不计红' });
  }
  fs.writeFileSync(copyIdx, original);
}

console.log('\n══ 逐条结果 ══');
for (const r of report) {
  const mark = r.status === 'RED' ? '✅' : '❌';
  console.log(`  ${mark} [${r.status}] ${r.key}`);
  if (r.status !== 'RED') console.log(`       ${r.note}`);
}
console.log(`\n真变红 ${red} / 未变红 ${green}（共 ${report.length} 个删除点）`);

fs.rmSync(COPY, { recursive: true, force: true });
const ok = green === 0;
console.log(ok ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(ok ? 0 : 1);
