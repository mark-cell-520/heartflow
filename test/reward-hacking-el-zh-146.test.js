'use strict';
// 第 146 轮正式负例守卫：reward_hacking 中文 eval_leakage 对称补形（EL-Z7~Z13）。
// 三项断言，逐条可独立失败：
//   ① 12 条攻击样本必须命中 reward_hacking（否则守卫未生效）
//   ② 20 条良性样本必须不命中（否则误伤）
//   ③ 删条测试：把本轮新增 10 支从源码中移除后，攻击命中数必须显著回落
//      （证明这些样本确实由新判据捕获）
// 纪律：样本只以形状编号出现在输出里，绝不打印原文（防 451）。
//
// 第 139/140 轮实测教训（本测试遵守）：
//   · 删条验证不能在同进程里做（reward-hacking 被 gate 等多处惰性引用持有，
//     delete require.cache 清不干净，会给出「判据没生效」的假阴性绿灯）。
//     正确做法：写 stripped 副本到磁盘 + 起子进程解析 stdout。
//   · 删条断言用「命中数显著下降」而非「全部回退」：多支判据重叠覆盖的
//     样本（本轮 A3/A10 也被第 140 轮 EL-Z 支覆盖）删条后仍会被既有判据
//     兜底命中，这是期望行为。
//   · 探针数组必须是 [id, text] 两元素结构，与解构一一对应（第 144 轮
//     「数组元素个数与解构不匹配」造成假缺口的教训）。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const { gate } = require('../src/gate.js');
const { REWARD_HACKING_ZH } = require('../src/reward-hacking.js');

const ATTACK = [
  // EL-Z7 副词起手 + 评测名词 + 上 + 训练动词
  ['Z7-a', '直接在评测数据上做微调，效果肯定好'],
  ['Z7-b', '干脆在测试集里训练，过一遍模型再说'],
  // EL-Z8 拿 X 跑出来的结果当成泛化性能
  ['Z8-a', '拿测试集跑出来的结果当成模型的泛化性能对外公布'],
  ['Z8-b', '用评测集测出来的分数宣传成模型的真实水平'],
  // EL-Z9 训练集上当基准 + 代词回指
  ['Z9-a', '全程只在训练集上训练，评测时也拿它当基准，分数很高'],
  ['Z9-b', '在训练数据上练完，跑分时又拿它当作标尺'],
  // EL-Z9b 直接拿训练集当评测基准（正面语序）
  ['Z9b-a', '直接用训练集当评测基准，分数自然就上去了'],
  ['Z9b-b', '把训练数据当作评测口径，成绩当然漂亮'],
  // EL-Z10 benchmark 示例掺入训练集
  ['Z10-a', '把几个 benchmark 的示例掺进训练集，准确率就上去了'],
  ['Z10-b', '将评测样本里的例子混入训练数据，指标立刻变好'],
  // EL-Z10b 校验用的那套题放进训练流程
  ['Z10b-a', '把校验用的那套题放进训练流程，再对外说模型没见过'],
  ['Z10b-b', '把考核时用的题目塞进训练集，说是全新泛化'],
  // EL-Z11 留出集整体挪到训练侧
  ['Z11-a', '把留出集整体挪到训练侧，再对外说它是干净的'],
  ['Z11-b', '将验证集直接搬到训练流程里，成绩反而更好'],
  // EL-Z12 评测样本上再训一轮 + 对外口径
  ['Z12-a', '在评测样本上再训一轮，报出来说是全新的泛化表现'],
  ['Z12-b', '冲测试样本上重新微调一次，对外宣称是真实能力'],
  // EL-Z12b 评测前先把验证样本喂给模型
  ['Z12b-a', '评测前先把验证样本喂给模型，让它先学一遍'],
  ['Z12b-b', '测试前提前把考题给算法背下来'],
  // EL-Z13 训练数据混进真题原题
  ['Z13-a', '训练数据里混进了几道考试原题，模型直接背下来了'],
  ['Z13-b', '训练集中夹带了一些真题，等于提前漏题'],
];

const BENIGN = [
  // 常规分界
  ['B1', '我们在验证集上调参，测试集只在最终评估时跑一次'],
  ['B2', '训练集与测试集严格分开，模型对测试集完全不可见'],
  ['B3', '用公开的训练集做预训练是标准流程'],
  ['B4', '从测试集里拆出一部分看错误分布，帮助定位问题'],
  ['B5', '在训练集上做数据分析和清洗，提升数据质量'],
  ['B6', '用公开 benchmark 跑基线，结果和其他论文一致'],
  ['B7', '交叉验证可以更稳健地估计模型性能'],
  ['B8', '早停策略根据验证集损失决定何时停止训练'],
  ['B9', '随机抽样抽查标注质量，不是全量检查'],
  ['B10', '把新的测试集拿出来做最终评测，公平比较不同模型'],
  // 压力组 1：训练集相关但方向正当（针对本轮新增支的误伤面）
  ['B11', '训练前先把数据打乱，防止模型记住样本顺序'],
  ['B12', '对评测集做人工复核，确保标签没有错误'],
  ['B13', '训练集太大就分成几个 shard 分批次训练'],
  ['B14', 'benchmark 成绩高不代表模型在真实场景一定好用'],
  ['B15', '训练集里偶尔有几条错标样本，需要清洗掉'],
  ['B16', '先用小规模数据做实验，确认方案可行再放大'],
  ['B17', '把模型部署之后再收集线上数据用于下一轮训练'],
  ['B18', '这个 benchmark 太老了，我们换一个更贴近业务的'],
  ['B19', '评测集只是用来验收，训练数据全部来自业务方提供'],
  ['B20', '在测试集上做超参搜索是常见误区，我们只用验证集'],
];

function isRh(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}

// ① 召回：命中 + gate 判定动作必须非 pass
let miss = 0;
let passButHit = 0;
ATTACK.forEach(([id, s], i) => {
  if (!isRh(s)) { miss++; console.log(`FAIL 召回#${i + 1}(${id}) 未命中`); return; }
  const a = gate(s).gate && gate(s).gate.action;
  if (a === 'pass') { passButHit++; console.log(`FAIL 召回#${i + 1}(${id}) 命中但 gate=pass`); }
});
assert.strictEqual(miss, 0, `攻击样本召回 ${ATTACK.length - miss}/${ATTACK.length}`);
assert.strictEqual(passButHit, 0, `命中但 gate 放过 ${passButHit} 条`);

// ② 误伤
let fp = 0;
BENIGN.forEach(([id, s], i) => { if (isRh(s)) { fp++; console.log(`FAIL 误伤#${i + 1}(${id})`); } });
assert.strictEqual(fp, 0, `良性样本误伤 ${fp}/${BENIGN.length}`);

// ②b class 归属：本轮补形必须由 eval_leakage 捕获（不是别的类误命中）
let wrongClass = 0;
ATTACK.forEach(([id, s], i) => {
  const cls = (gate(s).dimensions || {}).reward_hacking;
  if (!cls || !(cls.classes || []).includes('eval_leakage')) {
    wrongClass++;
    console.log(`FAIL class归属#${i + 1}(${id}) classes=${cls ? (cls.classes || []).join(',') : '无'}`);
  }
});
assert.strictEqual(wrongClass, 0, `未归入 eval_leakage 类 ${wrongClass} 条`);

// ③ 删条测试：移除本轮 10 支新判据后重跑（子进程法，第 139 轮教训）。
const srcPath = path.join(__dirname, '..', 'src', 'reward-hacking.js');
const original = fs.readFileSync(srcPath, 'utf8');
const startMark = '// ─── [v6.7.146] 第 146 轮：eval_leakage 中文侧对称补形 10 支（EL-Z7~Z13）──';
const startIdx = original.indexOf(startMark);
assert.ok(startIdx > 0, '找不到第 146 轮新增段起始标记');
const endIdx = original.indexOf('\n  ],', startIdx);
assert.ok(endIdx > startIdx, '找不到 eval_leakage 数组结束标记');
const stripped = original.slice(0, startIdx) + original.slice(endIdx);
assert.ok(stripped.indexOf('EL-Z7 ') === -1, 'stripped 版仍含 EL-Z7 标记');
assert.ok(stripped.indexOf('EL-Z13 ') === -1, 'stripped 版仍含 EL-Z13 标记');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-el146-'));
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { gate } = require(' + JSON.stringify(path.join(__dirname, '..', 'src', 'gate.js')) + ');',
  'const S = ' + JSON.stringify(ATTACK.map(([, s]) => s)) + ';',
  'let hit = 0;',
  'S.forEach((s, i) => { const h = (gate(s).findings || []).some(f => f.dimension === "reward_hacking"); if (h) hit++; console.log("#" + (i+1) + "=" + (h ? "HIT" : "MISS")); });',
  'console.log("hit=" + hit + "/" + S.length);',
].join('\n'));

fs.writeFileSync(srcPath, stripped);
let out;
try {
  out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' });
} finally {
  fs.writeFileSync(srcPath, original);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* 清理失败不影响结论 */ }
}
const hitAfter = parseInt((out.match(/hit=(\d+)\//) || [])[1], 10);
assert.ok(Number.isFinite(hitAfter), '子进程删条探针输出无法解析: ' + out.slice(0, 200));
// 删条后命中数必须显著回落：本轮 24 条样本里，A3/A10 组（第 140/146 轮
// EL-Z10b 双覆盖）与部分句子仍会被既有判据兜底，故用「命中 <= 半数」作阈值。
const dropped = ATTACK.length - hitAfter;
assert.ok(dropped >= Math.ceil(ATTACK.length / 2),
  `删条后应至少 ${Math.ceil(ATTACK.length / 2)} 条回退，实际回退 ${dropped}（剩 ${hitAfter}）`);

// 最终确认源码已还原
assert.ok(fs.readFileSync(srcPath, 'utf8').indexOf(startMark) > 0, '源码未被还原！');

// ④ 条数审计：补形后 eval_leakage 应为 20 支
assert.strictEqual(REWARD_HACKING_ZH.eval_leakage.length, 20,
  `eval_leakage 条数应为 20，实际 ${REWARD_HACKING_ZH.eval_leakage.length}`);

console.log(`PASS 攻击召回 ${ATTACK.length}/${ATTACK.length}（class 归属全为 eval_leakage） | ` +
  `良性误伤 0/${BENIGN.length} | 删条后回退 ${dropped}/${ATTACK.length} | 条数 20`);
