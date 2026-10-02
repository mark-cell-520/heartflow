// r401 守卫：r400 修复的情感记忆桥三条饱和失败路径
// 背景（scripts/round-400/probe-*.js 实测）：
//   ① getMeaningfulMemory() 把 require 的模块对象 {MeaningfulMemory: class} 赋给 _mm，
//      模块上没有 store/add → appraisalToMemory 恒抛 store/add method not found，重试耗尽返 STORE_FAILED
//   ② MeaningfulMemory.store() 真返回 id 字符串、不带 success 字段，
//      原判定 !storeResult.success 把真写入也判失败
//   ③ validateInput 的 'object' 类型用 Array.isArray 排除数组，
//      batchAppraisalToMemory / extractCognitivePattern 传数组第一行就 return 空
// 本守卫锁住这三条；负例变异负责证明「摘掉修复就会红」。
'use strict';

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const path = require('path');
const fs = require('fs');
const E = require(path.join(ROOT, 'src/memory/emotional-memory-bridge.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; failures.push(label); console.log('   ❌ FAIL: ' + label); }
}

const APPRAISAL = {
  threatType: 'harm_loss',
  primaryAppraisal: { trajectory: { value: -0.5 } },
  secondaryAppraisal: { control: 0.2 },
  copingStrategies: [{ type: 'avoidance' }],
};
const PAD = { intensity: 0.85, pleasure: -3.2, arousal: 0.5, dominance: -2 };
const LOW_PAD = { intensity: 0.2, pleasure: 1.5 };
const SRC = fs.readFileSync(path.join(ROOT, 'src/memory/emotional-memory-bridge.js'), 'utf8');

function section(t) { console.log('\n── ' + t + ' ──'); }

(async () => {
  // ───── A 组：单条写入路径（①+②） ─────
  section('A 组 单条写入：stored=true（原恒 STORE_FAILED）');
  const r = await E.appraisalToMemory('高显著性挫败文本 r401guard-a01', APPRAISAL, PAD);
  ok(r.success === true, 'A1 appraisalToMemory success=true');
  ok(r.stored === true, 'A2 高显著性写入 stored=true（原恒 false）');
  ok(r.layer === 'core', 'A3 高显著性落 core 层');
  ok(r.salience && typeof r.salience.score === 'number', 'A4 salience.score 是数字');
  ok(!/not found/i.test(String(r.error || r.reason || '')), 'A5 无 store/add method not found');

  // ───── B 组：显著性门（②的三态判定不能把失败当真成功） ─────
  section('B 组 低显著性必须正确拒绝');
  const low = await E.appraisalToMemory('中性闲聊文本 r401guard-b01', { threatType: 'neutral' }, LOW_PAD);
  ok(low.success === true, 'B1 低显著性仍算一次有效评估');
  ok(low.stored === false, 'B2 低显著性 stored=false（三态判定不误放）');
  ok(low.reason === 'Below salience threshold', 'B3 拒绝原因是低于显著性阈值');
  ok(low.salience && low.salience.score <= 0.5, 'B4 显著性不高于阈值 0.5');

  // ───── C 组：去重路径 ─────
  section('C 组 去重：同文本二次命中');
  E.clearDedupCache();
  const d1 = await E.appraisalToMemory('去重唯一串 r401guard-c', APPRAISAL, PAD);
  const d2 = await E.appraisalToMemory('去重唯一串 r401guard-c', APPRAISAL, PAD);
  ok(d1.stored === true, 'C1 首次写入成功');
  ok(d2.isDuplicate === true, 'C2 二次判定 isDuplicate');
  ok(!!d2.similarEntry, 'C3 二次带回 similarEntry');

  // ───── D 组：verifyPersistence（②同口径 + searchByKeywords 发现） ─────
  section('D 组 持久化验证走 searchByKeywords');
  const v = await E.appraisalToMemory('持久化验证唯一串 r401guard-d', APPRAISAL, PAD,
    { verifyPersistence: true, skipDedup: true });
  ok(v.success === true, 'D1 verifyPersistence 场景 success=true');
  ok(v.verification && v.verification.verified === true, 'D2 verification.verified=true');
  ok(v.verification && v.verification.checkMethod === 'searchByKeywords',
    'D3 验证方法为 searchByKeywords（原先四个方法名一个都不存在，恒 false）');

  // ───── E 组：批量路径（③ 'array' 类型分支） ─────
  section('E 组 批量写入（原数组第一行即 return 空）');
  const batch = await E.batchAppraisalToMemory([
    { text: '批量唯一串 r401guard-e1', appraisalResult: APPRAISAL, padState: PAD },
    { text: '批量唯一串 r401guard-e2', appraisalResult: APPRAISAL, padState: PAD },
  ], { skipDedup: true });
  ok(batch.summary && batch.summary.total === 2, 'E1 批量总数 2');
  ok(batch.summary && batch.summary.stored === 2, 'E2 批量 stored=2（原全空）');
  ok(batch.summary && batch.summary.failed === 0, 'E3 批量 failed=0');

  // ───── F 组：认知模式提取（③同一根因，另一条调用面） ─────
  section('F 组 认知模式提取（原数组入参被判非法）');
  const pat = E.extractCognitivePattern([
    { text: '我不行', primaryAppraisal: { trajectory: { value: -0.5 } }, secondaryAppraisal: { control: 0.2 }, copingStrategies: [{ type: 'avoidance' }] },
    { text: '我也不行', primaryAppraisal: { trajectory: { value: -0.6 } }, secondaryAppraisal: { control: 0.15 }, copingStrategies: [{ type: 'avoidance' }] },
    { text: '还是不行', primaryAppraisal: { trajectory: { value: -0.4 } }, secondaryAppraisal: { control: 0.25 }, copingStrategies: [{ type: 'problem_focused' }] },
  ]);
  ok(pat && pat.count === 3, 'F1 模式覆盖 3 条');
  ok(pat && pat.pattern === 'hopelessness', 'F2 模式识别为 hopelessness');

  // ───── G 组：validateInput 类型矩阵（③的判据本体，含负例） ─────
  // 签名：validateInput(value, name, rules)
  section('G 组 validateInput 类型矩阵');
  ok(E.validateInput('x', 'p', { type: 'string', required: true }).valid === true, 'G1 string 合法');
  ok(E.validateInput(42, 'p', { type: 'number', required: true }).valid === true, 'G2 number 合法');
  ok(E.validateInput({}, 'p', { type: 'object', required: true }).valid === true, 'G3 object 合法');
  ok(E.validateInput([], 'p', { type: 'array', required: false }).valid === true, 'G4 array 合法（400 轮新增分支）');
  ok(E.validateInput([], 'p', { type: 'array', required: true }).valid === true, 'G5 空数组配 required 仍合法（数组可为空）');
  ok(E.validateInput(null, 'p', { type: 'array', required: true }).valid === false, 'G6 null 配 array 非法');
  ok(E.validateInput('str', 'p', { type: 'array' }).valid === false, 'G7 字符串配 array 非法');
  ok(E.validateInput([1, 2], 'p', { type: 'object' }).valid === false, 'G8 数组配 object 仍非法（负例：object 分支未放松）');
  ok(E.validateInput({ a: 1 }, 'p', { type: 'array' }).valid === false, 'G9 对象配 array 非法');
  ok(E.validateInput(undefined, 'p', { type: 'string', required: true }).valid === false, 'G10 undefined 配 required string 非法');
  ok(E.validateInput('abc', 'p', { type: 'number' }).valid === false, 'G11 字符串配 number 非法');

  // ───── H 组：结构性断言（源码形状，防实现被静默改回） ─────
  section('H 组 实现形状断言');
  ok(/type === 'array'/.test(SRC), 'H1 源码存在 array 类型分支');
  ok(/_mmInstance/.test(SRC), 'H2 源码存在单例实例缓存变量');
  ok(/searchByKeywords/.test(SRC), 'H3 源码引用 searchByKeywords');
  ok(!/const mod = require\([^)]*meaningful-memory[^)]*\);\s*\n\s*_mm = mod;/.test(SRC),
    'H4 不再直接把模块对象整体赋给实例缓存');

  // ───── 汇总 ─────
  console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
  if (fail > 0) {
    console.log('失败项: ' + failures.join(' | '));
    process.exit(1);
  }
})().catch(e => { console.error('ERR', e); process.exit(1); });
