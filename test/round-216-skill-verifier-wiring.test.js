// 第 216 轮守卫：verification-engine / skill-verifier 接线验收 + 负例变异矩阵
// 判据：注入-删条必须变红 —— 每条守卫都对应「回滚本轮修复即失败」的断言。
const assert = require('assert');
const { skillVerifier } = require('../src/shield/skill-verifier.js');
const ve = require('../src/core/verification-engine.js').verificationEngine;

// ── 固定样本文本（不引用行号，形状自描述）──────────────────────────
const GOOD = [
  '---',
  'name: test-skill',
  'description: 用于测试心虫技能验证引擎的工具模块，覆盖链接与锚点',
  'version: "1.0.0"',
  '---',
  '# Test Skill v1.0.0',
  '',
  '## 触发条件',
  '用户需要验证技能文档时触发。',
  '',
  '## 核心功能',
  '完成技能文档结构与链接校验。',
  '',
  '参见 [触发条件](#触发条件)。',
  '',
  '```javascript',
  'const ok = true;',
  '```',
].join('\n');

// 契约崩坏样本：缺 description、坏 name、缺章节、未标注大数字、外部绝对路径
const BAD = [
  '---',
  'name: Bad_Name!!',
  '---',
  '# Bad Name v1.0.0',
  '',
  '## 随便',
  '收入 $123456 未标注。',
  '这是猜测。',
  '/etc/passwd 绝对路径。',
  '[]()',
  '[x](#nope)',
].join('\n');

let pass = 0;
const fails = [];
function ok(name, fn) {
  try { fn(); pass++; console.log('PASS ' + name); }
  catch (e) { fails.push(name + ' :: ' + e.message); console.log('FAIL ' + name + ' :: ' + e.message); }
}

// ── A 组：契约形状（本轮修复 1 的直接守卫）─────────────────────────
ok('A1 verify() errors 是 {message,severity} 对象，不是字符下标对象', () => {
  const r = skillVerifier.verify(BAD);
  assert.ok(r.errors.length > 0, '坏文档应有错误');
  const e0 = r.errors[0];
  assert.strictEqual(typeof e0, 'object', 'errors[0] 必须是对象');
  assert.strictEqual(typeof e0.message, 'string', 'message 必须是字符串');
  assert.strictEqual(typeof e0.severity, 'string', 'severity 必须是字符串');
  assert.ok(!('0' in e0) && !('1' in e0), '不得残留字符下标属性');
});

ok('A2 每条 error 都带合法 severity', () => {
  const r = skillVerifier.verify(BAD);
  const legal = new Set(['error', 'warning', 'info']);
  for (const e of r.errors) assert.ok(legal.has(e.severity), '非法 severity: ' + e.severity);
});

ok('A3 Frontmatter 类错误判 error 级', () => {
  const r = skillVerifier.verify(BAD);
  const fm = r.errors.find(e => e.message.includes('缺少 description') || e.message.includes('name 应为'));
  assert.ok(fm, '应有 frontmatter 类错误');
  assert.strictEqual(fm.severity, 'error', 'frontmatter 类应为 error');
});

ok('A4 warnings 是 warning 子集且同样带 message', () => {
  const r = skillVerifier.verify(BAD);
  assert.ok(Array.isArray(r.warnings));
  for (const w of r.warnings) assert.strictEqual(typeof w.message, 'string');
});

// ── B 组：双向语义（好文档不误伤）────────────────────────────────
ok('B1 合规文档 0 error 级', () => {
  const r = skillVerifier.verify(GOOD);
  const errs = r.errors.filter(e => e.severity === 'error');
  assert.strictEqual(errs.length, 0, '合规文档不应有 error 级: ' + errs.map(e => e.message).join(' | '));
});

ok('B2 中文小节锚点不得判重复', () => {
  const r = skillVerifier.verify(GOOD);
  const dup = r.errors.filter(e => e.message.includes('重复锚点'));
  assert.strictEqual(dup.length, 0, '中文小节被误判重复锚点: ' + dup.map(e => e.message).join(' | '));
});

ok('B3 内部中文锚点不得判无效', () => {
  const r = skillVerifier.verify(GOOD);
  const bad = r.errors.filter(e => e.message.includes('无效内部锚点'));
  assert.strictEqual(bad.length, 0, '中文锚点被误判无效: ' + bad.map(e => e.message).join(' | '));
});

ok('B4 引号 version 不判缺字段', () => {
  const r = skillVerifier.verify(GOOD);
  const missing = r.errors.filter(e => e.message.includes('缺少 version'));
  assert.strictEqual(missing.length, 0, '带引号 version 被误判缺失');
});

ok('B5 版本一致性真不一致必须报出来', () => {
  const mism = GOOD.replace(/version: "1\.0\.0"/, 'version: "9.9.9"');
  const r = skillVerifier.verify(mism);
  const ver = r.errors.filter(e => e.message.includes('frontmatter=') && e.message.includes('vs 标题'));
  assert.strictEqual(ver.length, 1, '版本不一致必须报出');
  assert.strictEqual(ver[0].severity, 'error');
});

// ── C 组：verification-engine 冒烟（本轮修复 2/3/4 的直接守卫）──────
ok('C1 verifySkill 合规文档不抛且 ok', () => {
  const r = ve.verifySkill(GOOD);
  assert.strictEqual(r.ok, true, 'verifySkill(合规) 应为 ok');
});

ok('C2 verifySkill 坏文档不抛且不 ok', () => {
  const r = ve.verifySkill(BAD);
  assert.strictEqual(r.ok, false, 'verifySkill(坏) 应 not ok');
  assert.ok(r.severityCount, '应带 severityCount');
});

ok('C3 _classifyResults 产出 severityCount 四键', () => {
  const r = ve.verifySkill(BAD);
  for (const k of ['critical', 'major', 'minor', 'info']) {
    assert.ok(typeof r.severityCount[k] === 'number', '缺少 ' + k);
  }
});

ok('C4 verifyCode 双侧：坏代码不 ok、好代码 ok', () => {
  assert.strictEqual(ve.verifyCode('function f(){ return 1', 'js').ok, false);
  assert.strictEqual(ve.verifyCode('function f(){ return 1; }', 'js').ok, true);
});

ok('C5 verifyClaims 返回数字 confidence', () => {
  const r = ve.verifyClaims('研究表明 AI 能提升 30% 的效率，专家认为这必然导致失业。');
  assert.ok(r.claims.length > 0, '应提取到声明');
  assert.strictEqual(typeof r.confidence, 'number', 'confidence 应为数字');
  assert.ok(r.confidence >= 0 && r.confidence <= 1, 'confidence 应在 0-1');
});

ok('C6 healthCheck 全绿', () => {
  const h = ve.healthCheck();
  assert.strictEqual(h.healthy, true, 'healthCheck 应 healthy');
  assert.ok(h.healthScore === 100, 'healthScore 应 100，实际 ' + h.healthScore);
});

// ── D 组：fullVerification 主流程（本轮修复 3/4 的直接守卫）────────
async function dGroup() {
  ok('D1 fullVerification(skill 合规) 不抛', async () => {
    const r = await ve.fullVerification(GOOD, 'skill');
    assert.strictEqual(typeof r.confidence, 'number', 'confidence 应为数字');
    assert.ok(Array.isArray(r.issues), 'issues 应为数组');
  });
  ok('D2 fullVerification(skill 坏) 抓出问题', async () => {
    const r = await ve.fullVerification(BAD, 'skill');
    assert.ok(r.issues.length > 0, '坏文档应抓出 issues');
  });
  ok('D3 fullVerification(code) 不抛', async () => {
    const r = await ve.fullVerification('function f(){ return 1', 'code');
    assert.ok(r.issues.length > 0, '坏代码应抓出 issues');
  });
  ok('D4 fullVerification(general) confidence 不是 undefined', async () => {
    const r = await ve.fullVerification('一些普通文本，包含 100% 绝对化的断言。', 'general');
    assert.notStrictEqual(r.confidence, undefined, 'confidence 不得为 undefined');
    assert.strictEqual(typeof r.confidence, 'number');
  });
  ok('D5 generateReport 不抛且含评分行', async () => {
    const r = await ve.fullVerification(GOOD, 'skill');
    const rep = ve.generateReport(r);
    assert.ok(typeof rep === 'string' && rep.length > 20, '报告应为非空字符串');
    assert.ok(rep.includes('置信度'), '报告应含置信度行');
  });
}

// ── F 组：缓存行为不回退 ─────────────────────────────────────────
ok('F1 clearCache 结构完整', () => {
  const c = ve.clearCache();
  assert.strictEqual(c.cleared, true);
  assert.strictEqual(typeof c.previousSize, 'number');
});
ok('F2 二次同内容命中缓存且结果一致', () => {
  const a = ve.verifySkill(GOOD);
  const b = ve.verifySkill(GOOD);
  assert.deepStrictEqual(a.severityCount, b.severityCount, '缓存两次结果应一致');
});

// ── G 组：接口面存在（接线验收）──────────────────────────────────
ok('G1 九个公开方法齐全', () => {
  for (const m of ['verifySkill', 'verifyCode', 'verifyClaims', 'quickCheck', 'healthCheck', 'clearCache', 'generateReport', 'getLessons', 'recordCorrection']) {
    assert.strictEqual(typeof ve[m], 'function', '缺少 ' + m);
  }
});
ok('G2 skill-verifier 九个方法齐全', () => {
  for (const m of ['verify', 'quickCheck', 'checkVersion', 'bySeverity', 'severityStats', '_classifyResult', '_validateLinks', '_validateCrossReferences', '_detectDuplicateSections']) {
    assert.strictEqual(typeof skillVerifier[m], 'function', '缺少 ' + m);
  }
});

// ── H 组：引擎接线验收（第 216 轮新增 wire + dispatch 两处）────────
async function hGroup() {
  ok('H1 start() 后 verification 挂上引擎', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow();
    await hf.start();
    assert.ok(hf.verification, 'hf.verification 必须存在');
    assert.strictEqual(typeof hf.verification.verifySkill, 'function');
  });
  ok('H2 dispatch 三条路由可用', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow();
    await hf.start();
    assert.strictEqual(hf.dispatch('verification.verifySkill', GOOD).ok, true);
    assert.strictEqual(hf.dispatch('verification.verifyCode', 'function f(){ return 1', 'js').ok, false);
    assert.strictEqual(hf.dispatch('verification.healthCheck').healthy, true);
  });
  ok('H3 未注册的 verification 路由被拒', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow();
    await hf.start();
    assert.throws(() => hf.dispatch('verification.nope'), /not allowed/, '未注册路由必须抛 not allowed');
  });
  ok('H4 _modules 注册 verification（dispatch 前置条件）', async () => {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow();
    await hf.start();
    assert.strictEqual(hf._modules['verification'], hf.verification, 'LATE_ADDITIONS 必须注册 verification');
  });
}

dGroup().then(hGroup).then(() => {
  console.log('---');
  console.log('本轮守卫: ' + (pass + fails.length) + ' 断言, PASS ' + pass + ' / FAIL ' + fails.length);
  if (fails.length) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
}).catch(e => { console.log('ASYNC CRASH: ' + e.message); process.exit(1); });
