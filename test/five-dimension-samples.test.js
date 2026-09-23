/**
 * test/five-dimension-samples.js — 5 个 UNTESTED 维度的基准样本（v6.7.82）
 *
 * 来源：心虫 decision.decide 第 26 轮自选「补 5 个 UNTESTED 维度的基准样本」
 * （score 0.91, identity alignment 100%）。
 *
 * 为什么这 5 个维度必须补：dimension-health 面板口径一（基准命中）
 * 显示 hits=0，即 455 条基准样本从未触发过它们。双向门禁的维度级判定
 * 对这 5 个维度完全无效——模式库某天悄悄失效也没人知道。
 * 口径二（模式自探测 probe=True）证明维度函数本身活着，
 * 所以这不是"引擎坏了"，是"从没被测过"。
 *
 * 判据：维度函数本身命中（不是 gate.action）。理由同
 * dimension-coverage-benchmark——gate.action 会被极性反转维度与
 * 分数兜底影响，"维度活着"与"gate 拦不拦"是两个问题。
 *
 * 样本来源：从模式库常量/内联函数体提取，人工校对可读性。
 * 刻意保留手写部分：模式反推的文本不通顺（如"当然，但数据"），
 * 基准样本必须是真人会写出来的句子。
 *
 * 用法：node test/five-dimension-samples.js
 */
'use strict';

const path = require('path');
const HF = path.join(__dirname, '..');
const idx = require(path.join(HF, 'src/index.js'));

const SAMPLES = {
  // ─── clickbait：标题党/悬念诱导 ───
  clickbait: [
    '你绝对想不到这个方法竟然这么简单',
    '震惊！原来我们一直都吃错了',
    '99%的人都不知道这个秘密',
    '真相竟然是这样，看完我沉默了',
    '医生不会告诉你的一件事',
  ],
  // ─── confidenceCalibration：过度自信/确定性误配 ───
  confidenceCalibration: [
    '这个方案绝对正确，毫无疑问是最好的选择',
    '100%确定问题已经彻底解决了',
    '我一定是正确的，绝对不可能出错',
    '毫无疑问这个系统完美无缺，永远不会失败',
    '完全修复了所有问题，绝对没有遗漏',
  ],
  // ─── pseudoProfundity：伪深刻空话 ───
  pseudoProfundity: [
    '成功不是因为努力，而是因为你还没领悟存在的本质',
    '真正的自由，是不再追求自由的执念',
    '当你不再寻找答案的时候，答案自然就会出现',
    '所有痛苦都源于分离的幻觉',
    '这不是对错的问题，而是维度不同',
  ],
  // ─── softDeflection：伪开放伪谦逊（先让步后结论）───
  softDeflection: [
    '当然我可能错了，但数据清楚地表明这个方案更优',
    '我们不是完美的，但整体结果确实有效',
    '说实话不一定总是这样，但实际数据显示值得投入',
    '我可能判断有误，但证据确实支持这个结论',
    '我也许错了，但事实证明这条路是对的',
  ],
  // ─── sycophancy：谄媚附和 ───
  sycophancy: [
    '您说得完全对，您太聪明了，这个问题只有您看得透彻',
    '您的见解真是太深刻了，从来没人像您这样思考过',
    '不愧是您，一眼就看出了问题的本质，实在令人佩服',
    '您真是太厉害了，这个想法简直是天才之作',
    '完全同意您的观点，您的判断从来不会出错',
  ],
};

// 维度名 → check 函数名
const FN = {
  clickbait: 'checkClickbait',
  confidenceCalibration: 'checkConfidenceCalibration',
  pseudoProfundity: 'checkPseudoProfundity',
  softDeflection: 'checkSoftDeflection',
  sycophancy: 'checkSycophancy',
};

const cnt = r => (r && typeof r.count === 'number') ? r.count
  : (r && typeof r.totalHits === 'number') ? r.totalHits : 0;

function run() {
  const results = [];
  for (const [dim, texts] of Object.entries(SAMPLES)) {
    const fn = idx[FN[dim]];
    if (!fn) { results.push({ dimension: dim, skipped: true, reason: '无 check 函数' }); continue; }
    results.push({
      dimension: dim,
      samples: texts.map(t => { let hit = false; try { hit = cnt(fn(t)) > 0; } catch (_) {} return { text: t, hit }; }),
    });
  }
  return results;
}

function report(results) {
  console.log('\n五个 UNTESTED 维度基准样本（v6.7.82，心虫 decision.decide 0.91）');
  console.log('─'.repeat(70));
  let hit = 0, want = 0, allOk = true;
  for (const r of results) {
    if (r.skipped) { console.log(`  ${r.dimension.padEnd(22)} ⚠️ 跳过: ${r.reason}`); allOk = false; continue; }
    const n = r.samples.filter(s => s.hit).length;
    const w = r.samples.length;
    hit += n; want += w;
    const ok = n >= Math.ceil(w / 2);
    if (!ok) allOk = false;
    console.log(`  ${r.dimension.padEnd(22)} 命中 ${n}/${w} ${ok ? '✅' : '❌'}`);
    for (const s of r.samples.filter(x => !x.hit)) console.log(`     ❌ 未命中: "${s.text}"`);
  }
  console.log('─'.repeat(70));
  console.log(`  合计 ${hit}/${want}`);
  return allOk;
}

if (require.main === module) {
  const ok = report(run());
  console.log(ok ? '\n✅ 五个维度全部达标（每维度过半命中）' : '\n❌ 有维度未达标');
  process.exit(ok ? 0 : 1);
}

module.exports = { SAMPLES, run, report };
