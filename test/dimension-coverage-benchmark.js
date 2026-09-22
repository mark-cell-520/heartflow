#!/usr/bin/env node
/**
 * test/dimension-coverage-benchmark.js — 未覆盖维度补充基准（v6.7.76）
 *
 * 来源：维度健康度面板量化出基准覆盖率仅 20%（50 维度只 10 个 healthy），
 * 其中 14 个维度活着但**从未被任何基准验证**（UNTESTED）：
 *   hateSpeech / doubleBind / presupposition / infoDeprivation / emptyAnswer
 *   fallacies / falseEquivalence / stereotype / dogwhistle / sealioning
 *   tonePolicing / clickbait / counterfactual / confidenceCalibration
 *
 * 后果：这些维度的判别"永不被验证"——双向门禁的维度级判定对它们无效，
 * 模式库某天失效也没人知道。
 *
 * 本基准的样本**从模式库自身正则反推生成**，不手写。
 * 原因（第 21 轮教训）：手写探针句式不可靠——「你态度好一点」不命中
 * tonePolicing（真实模式是「你态度不对」）；「如果当初我选了另一条路」
 * 不命中 counterfactual（真实模式是 `如果(没有|不)[^。]*?就不会`）。
 * 必须保留 alternation 内容并给 `[^。]` 类变量填值，见 toText()。
 *
 * 判据：**目标维度函数本身命中**，而非 gate.action。
 * gate.action 会被极性反转维度（reasoning_coherence 高分=好）与分数兜底
 * 影响——"维度活着"与"gate 拦不拦"是两个问题。
 *
 * 用法：
 *   node test/dimension-coverage-benchmark.js          # 跑基准
 *   node test/dimension-coverage-benchmark.js --json   # JSON 输出
 */
'use strict';
const path = require('path');
const fs = require('fs');

const HF = path.join(__dirname, '..');
const IDX = path.join(HF, 'src/index.js');
const idx = require(IDX);
const src = fs.readFileSync(IDX, 'utf8');

/**
 * 正则 source → 可测试文本。
 *
 * 关键：**不能只删元字符**。`如果(没有|不|不是|没)[^。]*?就(不会|...)`
 * 删完只剩"如果 就"这种残片，必然不命中（第 21 轮实测 15/42 未命中即因此）。
 * 必须：保留 alternation 内容 + 给字符类变量填合理值。
 */
function toText(r) {
  let s = r.replace(/^\//, '').replace(/\/[gimsuy]*$/, '');
  s = s.replace(/\[\^?[^\]]*\]/g, m => {
    if (m.includes('。') || m.includes('，')) return '什么';
    if (/[0-9]/.test(m)) return '5';
    return 'x';
  });
  s = s.replace(/[+*?]/g, '');
  s = s.replace(/\(([^()]*)\)/g, (m, inner) => {
    const first = inner.split('|').filter(Boolean)[0] || '';
    return first.replace(/\?:/g, '');
  });
  s = s.replace(/[\\^$.{}|()]/g, ' ').trim();
  return s;
}

/** 括号配对提取常量体（非贪婪 `\n};` 会在内部第一个 `\n};` 停） */
function bodyOf(name) {
  const st = src.indexOf(`const ${name}`);
  if (st < 0) return null;
  const iBrace = src.indexOf('{', st);
  const iBracket = src.indexOf('[', st);
  const b0 = (iBrace >= 0 && (iBracket < 0 || iBrace < iBracket)) ? iBrace : iBracket;
  if (b0 < 0) return null;
  const open = src[b0], close = open === '{' ? '}' : ']';
  let d = 0;
  for (let i = b0; i < src.length; i++) {
    if (src[i] === open) d++;
    else if (src[i] === close) { d--; if (d === 0) return src.slice(b0, i + 1); }
  }
  return null;
}

/**
 * 取维度的模式体：先找独立常量，再回退到 checkXxx 函数体（内联模式）。
 *
 * 为什么需要回退：checkConfidenceCalibration 的模式全内联在函数体里
 * （`text.match(/一定|绝对|.../i)`），没有独立 CONST。只看常量会跳过它。
 */
function patternBody(dim) {
  const fnName = 'check' + dim.charAt(0).toUpperCase() + dim.slice(1);
  const byConst = constCandidates(dim).map(bodyOf).find(b => b);
  if (byConst) return byConst;
  const st = src.indexOf(`function ${fnName}(`);
  if (st < 0) return null;
  const b0 = src.indexOf('{', st);
  let d = 0;
  for (let i = b0; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (d === 0) return src.slice(b0, i + 1); }
  }
  return null;
}

/** 维度名 → 模式常量候选（含单复数别名：fallacies → FALLACY） */
function constCandidates(dim) {
  const snake = dim.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
  const c = [`${snake}_PATTERNS`, `${snake}_ZH`, `${snake}_EN`];
  // 单复数别名：fallacies → FALLACY_PATTERNS（去 S 得 FALLACIES→FALLACY，
  // 但机械去 S 得 FALLACIE，必须显式映射 IES→Y）
  const SINGULAR = { FALLACIES: 'FALLACY', WHATABOUTISMS: 'WHATABOUTISM' };
  if (SINGULAR[snake]) c.unshift(`${SINGULAR[snake]}_PATTERNS`);
  else if (snake.endsWith('S')) c.push(`${snake.replace(/S$/, '')}_PATTERNS`);
  return c;
}

const cnt = r => (r && typeof r.count === 'number') ? r.count
  : (r && typeof r.totalHits === 'number' ? r.totalHits : 0);

/** 待覆盖维度（上层面板实测 UNTESTED）+ 期望的最小命中数 */
const TARGETS = {
  hateSpeech: 3, doubleBind: 3, presupposition: 3, infoDeprivation: 3,
  emptyAnswer: 3, fallacies: 3, falseEquivalence: 3, stereotype: 3,
  dogwhistle: 3, sealioning: 3, tonePolicing: 3, clickbait: 3,
  counterfactual: 3, confidenceCalibration: 3,
};

/** 从模式库生成样本并验证目标维度命中 */
function run() {
  const results = [];
  for (const [dim] of Object.entries(TARGETS)) {
    const fnName = 'check' + dim.charAt(0).toUpperCase() + dim.slice(1);
    const fn = idx[fnName];
    const body = patternBody(dim);
    if (!fn || !body) {
      results.push({ dimension: dim, skipped: true, reason: !fn ? '无 check 函数' : '无模式常量' });
      continue;
    }
    const regexes = body.match(/\/[^/\n]+\/[gimsuy]*/g) || [];
    const got = [];
    for (const r of regexes) {
      const t = toText(r).slice(0, 40);
      if (t.length < 2) continue;
      // 去重（多个模式可能生成同样文本）
      if (got.some(g => g.text === t)) continue;
      got.push({ text: t, hit: cnt(fn(t)) > 0 });
      if (got.filter(g => g.hit).length >= 5) break;
    }
    results.push({ dimension: dim, samples: got });
  }
  return results;
}

function report(results) {
  console.log('\n未覆盖维度补充基准（样本由模式库反推生成）');
  console.log('─'.repeat(70));
  let totalHit = 0, totalWant = 0, allOk = true;
  for (const r of results) {
    if (r.skipped) {
      console.log(`  ${r.dimension.padEnd(22)} ⚠️ 跳过: ${r.reason}`);
      allOk = false;
      continue;
    }
    const want = TARGETS[r.dimension];
    const hit = r.samples.filter(s => s.hit).length;
    totalHit += hit; totalWant += want;
    const ok = hit >= want;
    if (!ok) allOk = false;
    console.log(`  ${r.dimension.padEnd(22)} 命中 ${hit}/${want} ${ok ? '✅' : '❌'}`);
    for (const s of r.samples.filter(x => !x.hit)) {
      console.log(`     ❌ 未命中: "${s.text}"`);
    }
  }
  console.log('─'.repeat(70));
  console.log(`  合计命中样本 ${totalHit}（要求 ≥ ${totalWant}）`);
  return allOk;
}

if (require.main === module) {
  const results = run();
  const ok = report(results);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ results }, null, 1));
  }
  console.log(ok ? '\n✅ 全部维度达标' : '\n❌ 有维度未达标');
  process.exit(ok ? 0 : 1);
}

module.exports = { run, report, TARGETS, toText };
