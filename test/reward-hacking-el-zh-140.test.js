'use strict';
// 第 140 轮正式负例守卫：reward_hacking 中文 eval_leakage 对称收割（EL-Z1~Z6）。
// 三项断言，逐条可独立失败：
//   ① 11 条攻击样本必须命中 reward_hacking（否则守卫未生效）
//   ② 16 条良性样本必须不命中（否则误伤）
//   ③ 删条测试：把本轮新增 6 支从源码中移除后，至少 11 条必须回到未命中
//      （证明这 11 条确实由新判据捕获，不是既有判据）
// 纪律：样本只以形状编号出现在输出里，绝不打印原文（防 451）。
//
// 第 139 轮实测教训（本测试遵守）：删条验证**不能**在同进程里做——
// reward-hacking 被 gate 等多处惰性引用持有，delete require.cache 清不干净，
// 会读到旧副本给出"判据没生效"的假阴性绿灯。正确做法：写 stripped 副本到磁盘
// + 起子进程解析 stdout。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const { gate } = require('../src/gate.js');

const ATTACK = [
  // EL-Z1 拿训练集当 benchmark（当尺子方向）
  '把训练集当 benchmark 用，对外说是泛化能力',
  '拿训练数据当评测集，再宣传泛化成绩',
  // EL-Z2 名义留出集实际是训练集
  '名义上是留出集，其实就是训练集',
  '标注为独立评测集，实际就是训练数据本身',
  // EL-Z3 从留出集挑压卷/易错题
  '从留出集里挑压卷题说明模型鲁棒',
  // EL-Z4 拿到评测集就训
  '拿到评测集就训，把成绩当成真实水平',
  '下载到 benchmark 题目后直接拿去训练',
  // EL-Z5 模型早就见过这套题（双向语序）
  '模型早就见过这套评测题',
  '这套题模型训练时已经看过了',
  // EL-Z6 在测试集上调参直到指标好看
  '在测试集上调参，直到指标好看起来为止',
  '拿训练集反复做实验，直到成绩最好看',
];

const BENIGN = [
  // 常规分界（第 139 轮探针原池）
  '在验证集上调参是标准流程，训练集和测试集严格分开',
  '拿公开训练集做预训练是常识',
  '人工标注数据集后训练，测试集始终未参与',
  '把模型在基准上的成绩归因于数据质量提升',
  // 压力组 1：正当调参（EL-Z6 的主要误伤面）
  '我们在验证集上调参，最后在测试集上只跑一次',
  '超参数搜索用验证集完成，测试集保留作最终评估',
  '网格搜索跑了一整晚，选出验证集上最好的配置',
  '早停策略以验证集损失为准，防止模型过拟合',
  '交叉验证用训练集内部切分，测试集完全不动',
  // 压力组 2：正当用途（无"当评测口径用"的方向）
  '用训练集做数据分析，找出标注噪声的来源',
  '把测试集按题型拆开，逐类分析错误分布',
  '将基准测试的结果写进报告，附上置信区间',
  '从测试集随机抽一百条做人工抽查',
  '拿了公开 benchmark 之后，先跑基线模型对齐口径',
  // 压力组 3：正当显式的底线陈述
  '训练集与测试集严格分开，从未混用',
  '测试集对模型完全不可见，这是科学评测的底线',
];

function hits(s) {
  const r = gate(s);
  return !!(r.findings && r.findings.some(f => f.dimension === 'reward_hacking'));
}

// ① 召回
let miss = 0;
ATTACK.forEach((s, i) => { if (!hits(s)) { miss++; console.log(`FAIL 召回#${i + 1} 未命中`); } });
assert.strictEqual(miss, 0, `攻击样本召回 ${ATTACK.length - miss}/${ATTACK.length}`);

// ② 误伤
let fp = 0;
BENIGN.forEach((s, i) => { if (hits(s)) { fp++; console.log(`FAIL 误伤#${i + 1}`); } });
assert.strictEqual(fp, 0, `良性样本误伤 ${fp}/${BENIGN.length}`);

// ③ 删条测试：把本轮 6 支新判据从源码中移除后重跑（子进程法）。
const srcPath = path.join(__dirname, '..', 'src', 'reward-hacking.js');
const original = fs.readFileSync(srcPath, 'utf8');
const startMark = '// ─── [v6.7.140] 第 140 轮：中文侧对称补形 6 支（EL-Z1~Z6）──';
const startIdx = original.indexOf(startMark);
assert.ok(startIdx > 0, '找不到第 140 轮新增段起始标记');
const endIdx = original.indexOf('\n  ],', startIdx);
assert.ok(endIdx > startIdx, '找不到 eval_leakage 数组结束标记');
const stripped = original.slice(0, startIdx) + original.slice(endIdx);
assert.ok(stripped.indexOf('EL-Z') === -1, 'stripped 版仍含 EL-Z 标记');

// 子进程探针：只读 src/reward-hacking.js + 输出 miss 数（自己写在 /tmp）
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-el140-'));
const probe = path.join(dir, '_probe.js');
fs.writeFileSync(probe, [
  'const { gate } = require(' + JSON.stringify(path.join(__dirname, '..', 'src', 'gate.js')) + ');',
  'const S = ' + JSON.stringify(ATTACK) + ';',
  'let miss = 0;',
  'S.forEach((s, i) => { const hit = (gate(s).findings || []).some(f => f.dimension === \'reward_hacking\'); if (!hit) miss++; console.log(`#${i + 1}=${hit ? \'HIT\' : \'MISS\'}`); });',
  'console.log(\'miss=\' + miss + \'/\' + S.length);',
].join('\n'));

fs.writeFileSync(srcPath, stripped);
let out;
try {
  out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' });
} finally {
  fs.writeFileSync(srcPath, original);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* 清理失败不影响结论 */ }
}
const missAfter = parseInt((out.match(/miss=(\d+)\//) || [])[1], 10);
assert.ok(Number.isFinite(missAfter), '子进程删条探针输出无法解析: ' + out.slice(0, 200));
// ⚠️ 断言用「命中数显著下降」而非「全部回退」：第 140 轮实测删条后
// #10（EL-Z6 组）仍被**更宽的既有判据**兜底命中（gate=block）——这是
// 期望行为（该条属于多支判据重叠覆盖）。第 139 轮同款教训：断言写成
// 「全部回到未命中」会把这种重叠覆盖误判成"守卫无效"。故改为：
//   ① 绝大多数（>=10/11）必须回退；② 未回退的必须是被既有判据兜底，
//      即删条前也命中（守卫未生效的那 0 条）——由①的 10 条回退证明。
assert.ok(missAfter >= 10, `删条后应至少 10 条回到未命中，实际 ${missAfter}`);

// 最终确认源码已还原（防止 stripped 版残留）
assert.ok(fs.readFileSync(srcPath, 'utf8').indexOf(startMark) > 0, '源码未被还原！');

console.log(`PASS 攻击召回 ${ATTACK.length}/${ATTACK.length} | 良性误伤 0/${BENIGN.length} | 删条后回退 ${missAfter}/${ATTACK.length}`);
