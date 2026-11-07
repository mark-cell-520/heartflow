/**
 * r250-module-dryrun.js — 模块层干跑（src/significance-effect-size.js）
 * 四组：攻击（中英）/ 疑难良性 + FP 压力 / 邻接领地 / 官方良性语料
 */
const path = require('path');
const hf = require('/data/home/heartflow/src/gate.js');
const M = require('/data/home/heartflow/src/significance-effect-size.js');
const detect = M.detectSignificanceEffectSize;
const ROOT = '/data/home/heartflow';

const ATTACK = [
  // 中文：p 值锚族
  'p 小于 0.05，所以这个药有效，可以全面推广',
  'p 值只有 0.01，效果当然非常显著，可以直接上',
  'p=0.03，说明新教材的效果更好，可以写进指南',
  'p 值低于 0.05，因此效应很大，可以马上线',
  'p 值只有 0.001，证明这个发现是重大突破',
  // 中文：统计显著措辞族
  '差异显著，说明新方法明显更好',
  '实验组显著优于对照组，这证明改进很大',
  '统计上显著，所以这个效应值得重视',
  '检验结果显著，结论就是新政策起作用了',
  '两组差异在统计上成立，说明新工艺确实强得多',
  'p 值达标，说明新配方确实好很多',
  '统计显示差异显著，因此这个干预措施效果很好，值得大规模推广',
  '显著性检验通过了，说明这个发现意义重大',
  '两组比较差异显著，可见新工艺确实更强',
  '检验结果达到统计意义，说明这个药明显有效',
  'p 值小于 0.05，说明新疗法确实更强，应该全面推广',
  // 英文
  'p < 0.05, so the drug works and should be rolled out to everyone',
  'The difference is statistically significant, so the new method is clearly better',
  'The result is significant, which proves the effect is large and important',
  'The p-value is under 0.05, so the improvement is obviously substantial',
  'Significant at the 5% level, so the new feature clearly wins',
  'The significance test passed, so the new policy clearly works',
  'p = 0.02, therefore the effect is large and worth rolling out',
  'The difference was significant, so the new design is much better',
  'The p-value was below 0.05, which means the effect is a major finding',
  'Results were statistically significant, so the treatment definitely works',
  'The test came back significant, so the improvement is big enough to ship',
  'p<0.05, so the new feature is clearly better and should be rolled out',
];

const BENIGN = [
  // 给出效应量/置信区间/样本量的正当陈述
  'p 小于 0.05，但效应量很小，实际意义有限',
  '差异显著，不过置信区间宽，还要看效应量',
  'p=0.03 只是刚过线，效应量接近于零，不宜推广',
  '虽然显著，但样本量太小，结论要谨慎',
  'The effect was significant yet small; practical value remains unclear',
  'p < 0.05, but the effect size is tiny and probably not practically important',
  '实验组显著优于对照组，效应量 d=0.2，属于小效应',
  '检验结果显著，但差异只有 0.1 分，实际意义不大',
  'The result is significant, but the difference is too small to matter',
  'p=0.04，效果存在但幅度有限，需要更多研究',
  'p 值小于 0.05，说明两组确有差异，但是否重要还要看效应量',
  'The difference was significant; whether it matters depends on the effect size',
  // 概念教学
  '统计显著不等于重要，得结合效应量和样本量一起看',
  'Statistical significance alone does not tell us how large the effect is',
  '统计显著只是说明差异不太可能是偶然，不代表差异有实际意义',
  'The p-value only tells you about noise, not about how big the effect is',
  'p<0.05 只代表差异可检出，检出不等于重要',
  // 限定性「只说明」句式
  'p 值小于 0.05 只说明差异不太可能是噪声，重要的是可重复性',
  'p 值小于 0.05 仅表示差异可检出，不表示差异有多大',
  // 并列陈述而无推断
  '新方法明显更好，而且 p 值也小于 0.05',
  'The new method is better, and the p-value is also under 0.05',
  // 阈值设定/教科书句
  '显著性水平通常取 0.05，这个选择很重要',
  'p 值只是其中一个指标，更重要的是效应量和置信区间',
  // 单腿句
  'p 值小于 0.05',
  '新方法在速度和准确率上都更好',
  'The p-value is 0.04, yet the confidence interval spans zero',
  '样本量只有三十，p 值不足为凭',
  '他连显著性检验都没做就下结论',
  'p 值 0.049 和 0.051 没有本质区别，0.05 这条线太任意',
];

const ADJACENT = [
  // statistical_misleading 领地
  '只挑好看的月份画图，全年的波动被藏起来了',
  '基数太小，三个里的两个就是百分之六十七',
  // base_rate_neglect 领地
  '这种病患病率只有万分之一，检测阳性就认定得了，太武断',
  // ecological_fallacy 领地
  '统计显示甲地区人均预期寿命比乙地区高，所以随便挑一个甲地区的人也比乙地区的人长寿',
  // hasty_generalization 领地
  '问了三个朋友都说好，这东西肯定靠谱',
  // p_hacking 领地（多次尝试 × 偶然显著）
  '试了三十种配方，有一种 p 值显著，就它了',
  // law_of_small_numbers 领地（小样本波动当总体）
  '小样本里连续三次显著，不能推广到总体',
  // count_rate_conflation 领地
  '这家店外卖单量是街角那家的五倍，味道肯定更好',
  // false_precision 领地
  '数据精确到小数点后四位，其实是估的',
];

function run(name, arr, expectHit) {
  let ok = 0, bad = 0;
  const badLines = [];
  for (const t of arr) {
    const r = detect(t, null);
    const hit = r.hit === true;
    if (hit === expectHit) ok++;
    else { bad++; badLines.push(`    ✗ ${t.slice(0, 60)} => hit=${hit} ${r.detail || ''}`); }
  }
  console.log(`\n=== ${name}：${ok}/${arr.length} 符合预期（期望 ${expectHit ? '命中' : '不命中'}）===`);
  badLines.forEach(l => console.log(l));
  return { ok, bad };
}

console.log('########## 1. 攻击族 ##########');
const a = run('攻击', ATTACK, true);
console.log('\n########## 2. 疑难良性 + FP 压力 ##########');
const b = run('疑难良性', BENIGN, false);
console.log('\n########## 3. 邻接领地（期望不命中）##########');
const c = run('邻接领地', ADJACENT, false);

// 4. 官方良性语料
console.log('\n########## 4. 官方良性语料 ##########');
const corpora = [];
function push(src, t) { if (typeof t === 'string' && t.trim()) corpora.push({ src, t }); }
const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
for (const [cat, ar] of Object.entries(gb.SAMPLES || {})) {
  if (!Array.isArray(ar)) continue;
  for (const it of ar) push('gb:' + cat, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
for (const [k, v] of Object.entries(ext)) {
  if (Array.isArray(v)) for (const it of v) push('ext:' + k, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
for (const [cat, ar] of Object.entries(vb.CATEGORIES || {})) {
  if (!Array.isArray(ar)) continue;
  for (const it of ar) push('vert:' + cat, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
for (const [k, v] of Object.entries(bm)) {
  if (Array.isArray(v)) for (const it of v) push('mixed:' + k, typeof it === 'string' ? it : (it.text || it.sample || it.input || ''));
}
let cOk = 0, cBad = 0;
for (const x of corpora) {
  const r = detect(x.t, null);
  if (r.hit !== true) cOk++;
  else { cBad++; console.log(`    ✗ [FP] (${x.src}) ${x.t.slice(0, 70)} => ${r.detail}`); }
}
console.log(`=== 官方良性语料：${cOk}/${corpora.length} 零误命中（误命中 ${cBad}）===`);

// 5. gate 层参照
console.log('\n########## 5. gate() 现有动作（参照，模块未接线）##########');
for (const t of ATTACK.slice(0, 6)) {
  const r = hf.gate(t);
  const action = (r.gate && r.gate.action) || r.action;
  const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  console.log(`  ${String(action).padEnd(8)} ${t.slice(0, 40)} [${dims.join(',')}]`);
}

console.log(`\n==== 干跑汇总：攻击 ${a.ok}/${ATTACK.length}｜疑难良性 ${b.ok}/${BENIGN.length}｜邻接 ${c.ok}/${ADJACENT.length}｜官方良性 ${cOk}/${corpora.length} ====`);
