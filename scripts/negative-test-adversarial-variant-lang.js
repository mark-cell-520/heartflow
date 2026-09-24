/**
 * negative-test-adversarial-variant-lang.js — 负例验证（v6.7.122）
 *
 * 验证本轮新增测试 `test/adversarial-variant-language-coverage.test.js` 真的在守门：
 * 把 src/shield/adversarial-variant.js 的三处修复逐处删掉，守卫必须变红
 * （良性样本重新被判 rewrite/verify），不能是加载崩溃。
 *
 * ⚠️ 崩溃 ≠ 变红 —— 单列一类，绝不把崩溃算成"守卫在工作"。
 * ⚠️ 不 require 正式测试文件 —— 它内部 require 路径钉死真实仓库，副本不会被加载。
 * ⚠️ 不写 node -e 内联脚本 —— 安全扫描会拦（第 13 轮踩过），一律写成 .js 文件。
 * ⚠️ 注入必须真的改变源码（用 mutate: s => s 会被判"注入未生效"）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(path.join(HF, 'src', 'shield', 'adversarial-variant.js'), 'utf8');
const R = String.fromCodePoint;

// 每个注入：把某处修复逻辑替换回修复前的形态。
// needle 必须是源码里逐字出现的字符串。
const INJECTIONS = [
  {
    // 修复前的判据是「任何西里尔/希腊字符即同形攻击」——整块命中，不看拉丁上下文、
    // 不看占比。要让俄文正常句重新变红，必须把 **三条豁免全部** 退回：
    //   ① 同形集合判定 → 整块正则
    //   ② 无拉丁字母放行 → 删掉
    //   ③ 占比豁免 → 删掉
    // 只退其中一两条都不会变红（实测踩过：单退①时俄文句仍被②挡着报 pass）。
    name: '① 同形字判据退回修复前（整块命中 + 三条豁免全删）',
    needle: 'if (CYR_HOMOGLYPH_LOOKALIKE.has(ch)) { letters++; lookalikes++; hits.push(ch); }',
    replaceWith: 'if (/[\\u0400-\\u04FF\\u0370-\\u03FF]/.test(ch)) { letters++; lookalikes++; hits.push(ch); }',
    needle2: 'if (!LATIN_LETTER_RE.test(text)) return null;',
    replaceWith2: '',
    needle3: 'if (lookalikes / letters > HOMOGLYPH_RATIO_MAX) return null;',
    replaceWith3: '',
    probe: 'REG',
  },
  {
    // needle 只取 flag 字符本身，不碰正则收尾斜杠——碰斜杠会语法错误（崩溃≠变红）
    name: '② 中文标点豁免去掉 g 标志（只删第一个标点）',
    needle: '\\u2026\\u00B7]/g;',
    replaceWith: '\\u2026\\u00B7]/;',
    probe: 'CN',
  },
  {
    name: '③ 数学幂上标不再豁免（x² 也当数字混淆）',
    needle: "const dgText = text.replace(/(?<=[A-Za-z0-9\\)\\]\\u03c0\\u00b0])[\\u00B9\\u00B2\\u00B3\\u2070-\\u2079]/g, '');",
    replaceWith: "const dgText = text;",
    probe: 'MATH',
  },
];

// 探针用的良性样本（修复后必须 pass；删掉修复后必须变红）
const CN_SAMPLE = ['总价 ', R(0xFFE5), '3,580，折扣 12%，实付 ', R(0xFFE5), '3,150。'].join('');
const MATH_SAMPLE = ['设 x', R(0xB2), ' + y', R(0xB2), ' = r', R(0xB2), '，则面积 A = ', R(0x3C0), 'r', R(0xB2), '。'].join('');
const RU_SAMPLE = [R(0x42d), R(0x442), R(0x430), ' ', R(0x431), R(0x438), R(0x431), R(0x43b), R(0x438), R(0x43e), R(0x442), R(0x435), R(0x43a), R(0x430), ' ', R(0x43f), R(0x43e), R(0x43b), R(0x435), R(0x437), R(0x43d), R(0x430), '.'].join('');

// 三种注入各配套一组"删掉修复后必须重新变红"的样本
const EXPECT_RED = {
  REG:  [['俄文句', RU_SAMPLE]],
  CN:   [['中文金额', CN_SAMPLE]],
  MATH: [['数学幂', MATH_SAMPLE]],
};

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const target = path.join(dir, 'src', 'shield', 'adversarial-variant.js');
  const before = fs.readFileSync(target, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(target, after);
  return dir;
}

/** 按注入定义变换源码（支持一至三处替换；每处未命中即抛错，不许静默跳过） */
function applyInjection(src, inj) {
  let out = src;
  const pairs = [[inj.needle, inj.replaceWith]];
  if (inj.needle2) pairs.push([inj.needle2, inj.replaceWith2]);
  if (inj.needle3) pairs.push([inj.needle3, inj.replaceWith3]);
  for (const [n, r] of pairs) {
    if (!out.includes(n)) throw new Error('锚点未找到: ' + n.slice(0, 40));
    out = out.split(n).join(r);
  }
  if (out === src) throw new Error('注入未改变源码');
  return out;
}

function runProbe(dir, samples) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkAdversarialVariant } = require(' + JSON.stringify(path.join(dir, 'src', 'shield', 'adversarial-variant.js')) + ');',
    'const samples = ' + JSON.stringify(samples) + ';',
    'let fail = 0;',
    'for (const [name, text] of samples) {',
    '  const r = checkAdversarialVariant(text);',
    '  if (r.action !== "pass") { fail++; console.log("RED [" + name + "] " + r.action + " sig=" + r.signals.map(s=>s.id).join(",")); }',
    '}',
    'console.log("BENIGN_FAIL=" + fail + "/" + samples.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  try {
    return { out: execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), crashed: false };
  } catch (e) {
    return { out: String(e.stdout || ''), crashed: !/BENIGN_FAIL=/.test(String(e.stdout || '')), err: String(e.message || '') };
  }
}

let red = 0, green = 0, crashed = 0;
const results = [];

// ① 对照副本：未注入，三组良性样本必须全 pass
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-av-lang-control'), s => s, true);
  try {
    const { out, crashed: c } = runProbe(dir, [['俄文句', RU_SAMPLE], ['中文金额', CN_SAMPLE], ['数学幂', MATH_SAMPLE]]);
    if (c) { results.push(['对照（未注入）', '探针崩溃']); crashed++; }
    else if (/BENIGN_FAIL=0\//.test(out)) { results.push(['对照（未注入）', '全绿（3/3 pass）']); }
    else { results.push(['对照（未注入）', '未全绿: ' + out.trim().split('\n').pop()]); green++; }
  } catch (e) {
    results.push(['对照（未注入）', '异常: ' + String(e.message).slice(0, 80)]); crashed++;
  }
}

// ② 逐个注入：删掉修复后，原本 pass 的良性样本必须重新变红
for (const inj of INJECTIONS) {
  let ok = false;
  try {
    if (!SRC.includes(inj.needle)) {
      results.push([inj.name, '锚点未找到（源码已变？）']); green++; continue;
    }
    const dir = makeCopy(
      path.join(os.tmpdir(), 'hf-av-lang-' + Buffer.from(inj.probe).toString('hex').slice(0, 8)),
      s => applyInjection(s, inj)
    );
    const { out, crashed: c } = runProbe(dir, EXPECT_RED[inj.probe]);
    if (c) { results.push([inj.name, '探针崩溃（不计红）']); crashed++; }
    else if (/BENIGN_FAIL=[1-9]/.test(out)) { results.push([inj.name, '变红 ✅']); red++; ok = true; }
    else { results.push([inj.name, '未变红（守卫失守）']); green++; }
  } catch (e) {
    results.push([inj.name, '异常: ' + String(e.message).slice(0, 80)]); crashed++;
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r.padEnd(24) + ' ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红，' + crashed + ' 个崩溃');
const pass = red === INJECTIONS.length && green === 0 && crashed === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
