#!/usr/bin/env node
/**
 * scripts/bidirectional-guard.js — 双向回归门禁（v6.7.74，心虫 decision.decide 0.95）
 *
 * 背景（19 轮结构性教训）：连续三轮（16/17/18）都在修上一轮引入的回归，
 * 根因是每轮只测「能不能拦住攻击」，不测「会不会误伤良性文本」。
 *
 * 关键设计澄清（第一版的认知错误，已修正）：
 *   gate-benchmark.js 的 97 条样本**不能整体当攻击样本**——它分 5 类：
 *     benign       正常提问/技术讨论/工作场景      → 期望不拦
 *     technical    技术讨论含危险代码词汇          → 期望不拦
 *     pedagogical  教学内容含案例性反面示例        → 期望不拦
 *     borderline   含敏感词但语境正当              → 期望不升级到 block
 *     malicious    恶意/操纵/注入                  → 期望 block/rewrite
 *   只有 malicious 是"攻击侧"，其余四类是"良性侧"。
 *   按整集算召回率会得出 25% 的假低值（实际是 4/5 的样本本就不该拦）。
 *
 * 本脚本双指标：
 *   召回侧 — malicious 类样本必须维持非 pass 比例（不退化）
 *   误拦侧 — 良性类样本必须全 pass（不增加）
 * 任一方向退化即非零退出。
 *
 * 用法：
 *   node scripts/bidirectional-guard.js            # 跑双指标
 *   node scripts/bidirectional-guard.js --baseline  # 存基线
 *   node scripts/bidirectional-guard.js --check     # 与基线比对
 *   node scripts/bidirectional-guard.js --json      # 机器可读
 */
'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const BENCH_DIR = path.join(ROOT, 'test');
const BASELINE_FILE = path.join(ROOT, 'data', 'bidirectional-baseline.json');

/**
 * 召回下限表。优先从基线文件读（--baseline 生成）；
 * 无基线时用硬编码保守值（当前实测值的 90%，留改进空间但不允许大幅退化）。
 */
let BASELINE_FLOOR = {};
let BASELINE_DIMS = {};
try {
  if (fs.existsSync(BASELINE_FILE)) {
    const base = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    for (const [key, r] of Object.entries(base.report || {})) {
      if (r && r.kind === 'recall') {
        BASELINE_FLOOR[key] = r.flagged;
        if (Array.isArray(r.dims)) BASELINE_DIMS[key] = r.dims;
      }
    }
  }
} catch (_) { /* 无基线则用下方硬编码 */ }
// 硬编码兜底（当前实测：malicious 20 条命中 14 维，adversarial 30）
if (Object.keys(BASELINE_FLOOR).length === 0) {
  BASELINE_FLOOR = { 'attack-97.malicious': 19, 'ext-adversarial': 29 };
}

/** gate-benchmark.js 的 5 类中，哪些算攻击、哪些算良性 */
const ATTACK_CAT = new Set(['malicious']);
const BENIGN_CAT = new Set(['benign', 'technical', 'pedagogical', 'borderline']);

/** 归一化样本数组：兼容 dict / array / {text} / string 四种形态 */
function toArray(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}

/** 取样本文本（兼容 string / {text}） */
function textOf(s) {
  return typeof s === 'string' ? s : (s && s.text) || '';
}

/**
 * 跑一组样本，返回统计。
 * @param {Array} samples 样本数组
 * @param {object} gate gate 模块
 * @param {boolean} wantFlag true=期望被拦（攻击侧），false=期望放行（良性侧）
 */
function runSet(samples, gate) {
  const byAction = { block: 0, rewrite: 0, verify: 0, pass: 0, ERROR: 0 };
  const flaggedItems = [];
  const dims = new Set();   // 被命中过的判别维度名（维度级召回判定用）
  for (const s of samples) {
    const text = textOf(s);
    if (!text) continue;
    let action, result;
    try {
      result = gate.gate(text);
      action = result.gate.action;
    } catch (_) { action = 'ERROR'; }
    byAction[action] = (byAction[action] || 0) + 1;
    // 收集命中维度（trace 里第一条的 dimension 名）
    if (result && Array.isArray(result.trace)) {
      for (const t of result.trace) {
        if (t && t.dimension && t.dimension !== '_normalization') dims.add(t.dimension);
      }
    }
    if (action !== 'pass' && action !== 'verify') {
      flaggedItems.push({ text, action });
    }
  }
  const total = samples.length;
  const nonPass = byAction.block + byAction.rewrite + byAction.verify + byAction.ERROR;
  return {
    total,
    byAction,
    dims: [...dims],
    flagged: nonPass,
    rate: total > 0 ? Math.round(nonPass / total * 1000) / 1000 : 0,
    flaggedItems: flaggedItems.slice(0, 3),
  };
}

async function main() {
  const gate = require(path.join(ROOT, 'src/gate.js'));

  // ─── 收集数据集 ───────────────────────────────────────
  const sets = {};
  try {
    const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
    for (const cat of Object.keys(gb.SAMPLES || {})) {
      const samples = toArray(gb.SAMPLES[cat]);
      if (samples.length === 0) continue;
      const kind = ATTACK_CAT.has(cat) ? 'recall' : 'benign';
      const key = `attack-97.${cat}`;
      // borderline/pedagogical 是"含敏感词但语境正当"，verify 可接受 → 宽松组
      // benign/technical 是干净良性，必须全 pass → 严格组
      const strict = ['benign', 'technical'].includes(cat);
      sets[key] = { kind, samples, label: `gate-97 ${cat}`, strict };
    }
  } catch (e) {
    sets['attack-97'] = { kind: 'error', error: e.message };
  }

  try {
    const ex = require(path.join(BENCH_DIR, 'gate-benchmark-extended.js'));
    const src = ex.SAMPLES || {};
    // SAMPLES 是按 4 类分的 dict：multilingual/longtext/mixed/adversarial。
    // 不能用 toArray 展平——会丢类别信息，把攻击样本与良性样本混在一起
    // （第一版实测教训：展平后得出 20 个 block 全部"误报"的假结论，
    //  实际 adversarial 类的 block 正是期望行为）。
    // adversarial → 召回侧；其余三类 → 误拦侧（宽松：不出现 block）。
    if (Array.isArray(src)) {
      // 兼容未来的数组形态
      sets['ext-flat'] = { kind: 'benign', samples: src, label: 'extended 混合', strict: false };
    } else {
      for (const [cat, list] of Object.entries(src)) {
        const arr = toArray(list);
        if (arr.length === 0) continue;
        if (cat === 'adversarial') {
          sets[`ext-${cat}`] = { kind: 'recall', samples: arr, label: `extended ${cat}`, strict: false };
        } else {
          sets[`ext-${cat}`] = { kind: 'benign', samples: arr, label: `extended ${cat}`, strict: false };
        }
      }
    }
  } catch (e) {
    sets['extended'] = { kind: 'error', error: e.message };
  }

  try {
    const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
    const samples = [];
    for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
      for (const text of list) samples.push({ text, category: cat });
    }
    sets['benign-vert'] = { kind: 'benign', samples, label: '垂直场景 150', strict: true };
  } catch (e) {
    sets['benign-vert'] = { kind: 'error', error: e.message };
  }

  try {
    const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));
    const samples = toArray(bm.SAMPLES).map(text => ({ text }));
    sets['benign-mixed'] = { kind: 'benign', samples, label: '中英混排 25', strict: true };
  } catch (e) {
    sets['benign-mixed'] = { kind: 'error', error: e.message };
  }

  // ─── 执行 ────────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════════');
  console.log('🛡️  双向回归门禁 — 召回不退化 + 误拦不增加');
  console.log('══════════════════════════════════════════════════════════');

  const report = {};
  let anyFail = false;

  const runGroup = (kind, header) => {
    console.log(`\n${header}`);
    for (const [key, s] of Object.entries(sets)) {
      if (s.kind !== kind) continue;
      if (s.kind === 'error' || s.error) {
        console.log(`  ⚠️ ${key}: 加载失败 ${s.error}`);
        anyFail = true;
        continue;
      }
      const r = runSet(s.samples, gate);
      r.kind = kind;
      r.strict = !!s.strict;
      report[key] = r;
      let ok;
      if (kind === 'recall') {
        // 召回判定改为**维度级**而非集合级：
        // 20 条恶意样本每条只依赖单一维度，集合级判定只能容忍 1 条退化
        // （实测：删掉整个中文注入模式，20/20 仍通过——因为该模式只被 1 条用）。
        // 维度级判定：baseline 中每个被命中的维度，现在仍必须至少命中 1 次。
        // 这样删掉任一维度的全部模式都会立即报警。
        const floor = BASELINE_FLOOR[key];
        const baselineDims = BASELINE_DIMS[key] || [];
        const lostDims = baselineDims.filter(d => !(r.dims || []).includes(d));
        ok = lostDims.length === 0 && r.byAction.ERROR === 0
          && (floor === undefined || r.flagged >= floor - 1);
        if (!ok && lostDims.length > 0) {
          console.log(`     ❌ 维度级召回退化: ${lostDims.join(', ')}`);
        }
      } else if (s.strict) {
        // 严格组（良性基准）：必须全 pass，verify 也不允许
        ok = r.byAction.pass === r.total;
      } else {
        // 宽松组（borderline/pedagogical）：只要求不升级到 block
        // （这两类样本"含敏感词但语境正当"，verify 是可接受的行为）
        ok = r.byAction.block === 0;
      }
      if (!ok) anyFail = true;
      const detail = kind === 'recall'
        ? `检出 ${r.flagged}/${r.total} (${(r.rate * 100).toFixed(0)}%)${ok ? '' : ` [下限 ${BASELINE_FLOOR[key] !== undefined ? BASELINE_FLOOR[key] - 1 : '?'}]`}`
        : (s.strict
            ? `pass ${r.byAction.pass}/${r.total}${ok ? '' : ` — 非 pass ${r.flagged}`}`
            : `block ${r.byAction.block}/${r.total} (verify ${r.byAction.verify})${ok ? '' : ' — 出现 block'}`);
      console.log(`  ${ok ? '✅' : '❌'} ${s.label.padEnd(22)} ${detail}`);
      for (const f of r.flaggedItems.filter(x => kind === 'benign' && s.strict)) {
        console.log(`     ❌ [${f.action}] ${String(f.text).slice(0, 44)}`);
      }
    }
  };

  runGroup('recall', '【召回侧】恶意样本必须被处理（不得退化）');
  runGroup('benign', '【误拦侧】良性样本必须全 pass（不得增加）');

  // ─── 基线比对 ────────────────────────────────────────
  if (process.argv.includes('--baseline')) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify({
      version: require(path.join(ROOT, 'package.json')).version,
      timestamp: new Date().toISOString(),
      report,
    }, null, 2));
    console.log(`\n📄 基线已保存: ${BASELINE_FILE}`);
  } else if (process.argv.includes('--check') && fs.existsSync(BASELINE_FILE)) {
    try {
      const base = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      let drift = 0;
      console.log('\n【基线比对】');
      for (const [key, now] of Object.entries(report)) {
        const before = base.report && base.report[key];
        if (!before) continue;
        if (now.kind === 'benign' && now.flagged > before.flagged) {
          drift++;
          console.log(`  ⚠️ ${key} 误拦增加: ${before.flagged} → ${now.flagged}`);
        }
        if (now.kind === 'recall' && now.flagged + 5 < before.flagged) {
          drift++;
          console.log(`  ⚠️ ${key} 召回退化: ${before.flagged} → ${now.flagged}`);
        }
      }
      if (drift > 0) {
        console.log(`\n❌ ${drift} 项双向指标退化 — 禁止提交！`);
        process.exit(1);
      }
      console.log('  ✅ 无双向退化');
    } catch (e) {
      console.log(`\n⚠️ 基线比对失败: ${e.message}`);
    }
  }

  // ─── 汇总 ────────────────────────────────────────────
  const total = { recallSamples: 0, recallFlagged: 0, benignSamples: 0, benignPass: 0 };
  for (const [key, r] of Object.entries(report)) {
    if (r.kind === 'recall') {
      total.recallSamples += r.total;
      total.recallFlagged += r.flagged;
    } else {
      total.benignSamples += r.total;
      total.benignPass += r.byAction.pass;
    }
  }
  console.log('\n══════════════════════════════════════════════════════════');
  const recallPct = total.recallSamples ? (total.recallFlagged / total.recallSamples * 100).toFixed(0) : 0;
  const benignPct = total.benignSamples ? (total.benignPass / total.benignSamples * 100).toFixed(1) : 0;
  console.log(`召回侧: ${total.recallFlagged}/${total.recallSamples} 被处理 (${recallPct}%)`);
  console.log(`误拦侧: ${total.benignPass}/${total.benignSamples} pass (${benignPct}%)`);
  console.log('══════════════════════════════════════════════════════════');

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ total, report }, null, 1));
  }

  if (anyFail) {
    console.log('\n❌ 双向门禁未通过 — 禁止提交');
    process.exit(1);
  }
  console.log('\n✅ 双向门禁通过');
}

// runSet 未导出会迫使测试用 eval 抠源码（脆弱）。
// [v6.7.75] 改为正式导出——门禁的判定函数应可被独立测试。
// main() 只在直接运行时执行：被 require 时若跑 main 会 process.exit 杀掉调用方
// （gate-benchmark.js 曾有完全相同的问题，见其 require.main 守卫注释）。
module.exports = { runSet, textOf, toArray, ATTACK_CAT, BENIGN_CAT, BASELINE_FLOOR, BASELINE_DIMS };

if (require.main === module) main();
