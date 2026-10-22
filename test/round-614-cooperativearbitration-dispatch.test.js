/**
 * r614 守卫测试：cooperativeArbitration dispatch 接线
 *
 * 覆盖：接线面 / 辨别力 / 删块注入负例 / 稳健性
 * 纪律：样本只以形状描述，不贴攻击话术原文。
 *
 * 背景（r614 实测，非简报描述）：
 *   CooperativeArbitration 类此前只在 _lazy 缓存里（heartflow.js L461 `_lazy('cooperativeArbitration', ...)`，
 *   声明后零引用），`this.arbitration` 始终是 null（L1370 声明后从未赋值）——
 *   engine-lifecycle.js L37 的 subsystemNames 名单里有 'arbitration'，但 L100 的守卫
 *   `if (hf[name] !== null && hf[name] !== undefined)` 因实例为空直接跳过。
 *   r614 接前实测：HeartFlow.ALLOWED_ROUTES 1223 条里 arbitr 零命中，
 *   _modules 无 arbitration 键，dispatch 三条探针全抛 route not allowed。
 *   本轮接线在 src/core/heartflow.js 的 _registerModules 之前实例化
 *   （复用 subsystemNames 已存在的 'arbitration' 入口，不新增接线块）。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');
const CA_PATH = path.join(ROOT, 'src/core/cooperative-arbitration.js');
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { const p = fn(); if (p && typeof p.then === 'function') { failed++; failures.push(name + ' :: async 用例未被 await'); console.log('  ✗ ' + name + ' :: async 用例未被 await'); return; } passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; failures.push(name + ' :: ' + e.message); console.log('  ✗ ' + name + ' :: ' + e.message); }
}

function freshHF() {
  delete require.cache[require.resolve(HF_PATH)];
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();
  return hf;
}
function allows(h) { return Array.from(h.constructor.ALLOWED_ROUTES || []); }

console.log('\n=== 第一组：接线面 ===');

const hf2 = freshHF();

(async function main() {
const hf = freshHF();
t('A1 ALLOWED_ROUTES 命中 5 条 arbitration.*', () => {
  const r = allows(hf).filter(x => x.startsWith('arbitration.'));
  assert.strictEqual(r.length, 5, '期望 5 条, 实得 ' + r.length);
});
t('A2 _modules 有 arbitration 键', () => {
  assert.ok(Object.prototype.hasOwnProperty.call(hf._modules, 'arbitration'));
});
t('A3 实例同一性（_modules 值就是本轮实例化的实例）', () => {
  assert.strictEqual(hf._modules['arbitration'], hf.arbitration);
  assert.notStrictEqual(hf._modules['arbitration'], null);
});
t('A4 路由不含 _ 前缀私有方法（15 个私有被剔除）', () => {
  for (const x of allows(hf).filter(x => x.startsWith('arbitration.'))) {
    assert.ok(!/\._[a-zA-Z]/.test(x), '泄露私有方法路由: ' + x);
  }
});
t('A5 路由全集等于预期 5 个公开方法', () => {
  const r = allows(hf).filter(x => x.startsWith('arbitration.')).sort();
  assert.deepStrictEqual(r, [
    'arbitration.assessState',
    'arbitration.evaluateHealth',
    'arbitration.resolve',
    'arbitration.stats',
    'arbitration.twoPassCheck',
  ].sort());
});
t('A6 模块键总数较接线前 +1（150）', () => {
  assert.strictEqual(Object.keys(hf._modules).length, 150, 'modules=' + Object.keys(hf._modules).length);
});
t('A7 路由总数 1228', () => {
  assert.strictEqual(allows(hf).length, 1228, 'routes=' + allows(hf).length);
});
t('A8 接前状态确认为零可达（_initErrors 无 arbitration 失败记录）', () => {
  const errs = (hf._initErrors || []).filter(e => e.module === 'arbitration');
  assert.strictEqual(errs.length, 0, '实例化失败被记录: ' + JSON.stringify(errs));
});

console.log('\n=== 第二组：辨别力（dispatch 逐条真调） ===');

t('B1 assessState 同立场判共生且不需仲裁', () => {
  const r = hf.dispatch('arbitration.assessState', {
    aiPosition: '应该先备份数据库再上线', userPosition: '先备份数据库再上线',
    emotionalTone: '平静', topic: '上线流程',
  });
  assert.ok(r && typeof r === 'object');
  assert.strictEqual(r.mode, 'symbiosis', '实得 mode=' + r.mode);
  assert.strictEqual(r.needsArbitration, false, '共生态不应要求仲裁');
  assert.strictEqual(r.naturalCooperation, true);
  assert.ok(r.alignment > 0.7, '对齐度应 >0.7, 实得 ' + r.alignment);
});
t('B2 assessState 冲突立场判分歧且需要仲裁', () => {
  const r = hf.dispatch('arbitration.assessState', {
    aiPosition: '这个结论需要交叉验证后才能采信', userPosition: '我不管，现在就按我说的做',
    emotionalTone: '愤怒', topic: '决策方式',
  });
  assert.strictEqual(r.mode, 'conflict', '实得 mode=' + r.mode);
  assert.strictEqual(r.needsArbitration, true, '冲突态必须要求仲裁');
  assert.strictEqual(r.naturalCooperation, false);
  assert.ok(r.tension > 0.5, '紧张度应 >0.5, 实得 ' + r.tension);
});
t('B3 两类输入给出相反结论（非恒定输出）', () => {
  const sym = hf2.dispatch('arbitration.assessState', {
    aiPosition: '应该先备份数据库再上线', userPosition: '先备份数据库再上线', emotionalTone: '平静',
  });
  const con = hf2.dispatch('arbitration.assessState', {
    aiPosition: '需要交叉验证', userPosition: '不要验证直接做', emotionalTone: '愤怒',
  });
  assert.notStrictEqual(sym.mode, con.mode, '两种输入必须给出不同 mode');
  assert.notStrictEqual(sym.needsArbitration, con.needsArbitration);
  assert.notStrictEqual(sym.narrative, con.narrative, '叙述不应恒定');
});
t('B4 twoPassCheck 短句开放式输入触发第一遍建议冲动暂停', () => {
  const r = hf2.dispatch('arbitration.twoPassCheck', '你怎么看这个问题', {});
  assert.ok(r && typeof r === 'object');
  assert.strictEqual(r.pass, 1, '短句应走第一遍, 实得 pass=' + r.pass);
  assert.strictEqual(r.action, 'pause', '实得 action=' + r.action);
  assert.strictEqual(r.blocked, true);
  assert.ok(typeof r.reason === 'string' && r.reason.length > 0);
});
t('B5 twoPassCheck 长句输入进入第二遍且不被阻断', () => {
  // [r614 实测修正] advice-reflex 判据是字数：<30 字 → pass 1/pause；
  // >=30 字 → pass 2/proceed（探针 r614-thresh.json：1/4/8/16/26 字全 pass 1，
  // 44 字 pass 2）。这里用 44 字样本确保落在第二遍。
  const r = hf2.dispatch('arbitration.twoPassCheck',
    '根据2025年的研究数据，这个方案可以提升百分之三十的效率，而且在多个场景下都得到了验证', {});
  assert.ok(r && typeof r === 'object');
  assert.strictEqual(r.pass, 2, '实得 pass=' + r.pass);
  assert.strictEqual(r.action, 'proceed', '实得 action=' + r.action);
  assert.strictEqual(r.blocked, false);
});
t('B6 resolve 冲突输入给出共赢合成策略', () => {
  const r = hf2.dispatch('arbitration.resolve', {
    aiView: '需要先验证证据链再下结论', userView: '直接执行不要验证', topic: '是否先验证', mode: 'conflict',
  });
  assert.ok(r && typeof r === 'object');
  assert.strictEqual(r.success, true);
  assert.strictEqual(r.winWin, true, '仲裁目标是共赢');
  assert.ok(r.strategy && typeof r.strategy === 'string');
  assert.ok(r.action && typeof r.action.message === 'string' && r.action.message.length > 0);
});
t('B7 evaluateHealth 返回合法健康分级', () => {
  const r = hf2.dispatch('arbitration.evaluateHealth');
  assert.ok(r && typeof r === 'object');
  assert.ok(['healthy', 'monitor', 'warning', 'critical'].includes(r.healthLevel), '健康分级非法: ' + r.healthLevel);
  assert.ok(typeof r.resolutionRate === 'number');
  assert.ok(typeof r.narrative === 'string' && r.narrative.length > 0);
});
t('B8 stats 暴露仲裁状态快照（含 version 与 mode）', () => {
  const r = hf2.dispatch('arbitration.stats');
  assert.ok(r && typeof r === 'object');
  for (const k of ['version', 'currentMode', 'tension', 'alignment', 'trajectory', 'sessionExchanges', 'totalInteractions']) {
    assert.ok(k in r, 'stats 缺字段 ' + k);
  }
  assert.strictEqual(typeof r.version, 'string');
  assert.ok(r.version.length > 0);
});
t('B9 assessState 状态被写回（stats 反映最近一次评估 mode）', () => {
  const hf9 = freshHF();
  const assessed = hf9.dispatch('arbitration.assessState', {
    aiPosition: '需要交叉验证', userPosition: '不要验证直接做', emotionalTone: '愤怒',
  });
  const st = hf9.dispatch('arbitration.stats');
  assert.strictEqual(st.currentMode, assessed.mode, 'stats.mode 应等于最近一次评估 mode');
  assert.strictEqual(st.tension, assessed.tension, 'stats.tension 应等于最近一次评估 tension');
  assert.strictEqual(st.alignment, assessed.alignment, 'stats.alignment 应等于最近一次评估 alignment');
});
t('B10 resolve 成功解决时 sessionExchanges 累计（非恒零）', () => {
  const hf10 = freshHF();
  const before = hf10.dispatch('arbitration.stats').sessionExchanges;
  hf10.dispatch('arbitration.resolve', { aiView: '需要先验证证据链再下结论', userView: '直接执行不要验证', topic: '是否先验证', mode: 'conflict' });
  const after = hf10.dispatch('arbitration.stats').sessionExchanges;
  assert.ok(after > before, 'resolve 后会话计数应累计 before=' + before + ' after=' + after);
});

console.log('\n=== 第三组：删块注入负例（删实例化块后必须变红） ===');
const original = fs.readFileSync(HF_PATH, 'utf8');
const { execFileSync } = require('child_process');
const NEG = path.join(ROOT, 'scripts', 'round-614-negative-probe.js');
function runNegProbe() {
  const out = execFileSync(process.execPath, [NEG], { encoding: 'utf8', cwd: ROOT, timeout: 100000 });
  return JSON.parse(out.trim().split('\n').pop());
}
const START_MARK = '    // [r614] cooperativeArbitration 实例化';
const END_MARK = '    // ─── [v5.1.0] 自省注册';
t('C0 前置：实例化块在源文件中唯一', () => {
  const n = original.split(START_MARK).length - 1;
  assert.strictEqual(n, 1, '实例化块标记出现 ' + n + ' 次');
});
(function () {
  t('C1 删实例化块后 dispatch 必须重新抛 route not allowed', () => {
    const s = original.indexOf(START_MARK);
    const e = original.indexOf(END_MARK, s);
    assert.ok(s >= 0 && e > s, '块定位失败 s=' + s + ' e=' + e);
    const mutated = original.slice(0, s) + original.slice(e);
    fs.writeFileSync(HF_PATH, mutated);
    let res;
    try { res = runNegProbe(); } finally { fs.writeFileSync(HF_PATH, original); }
    assert.strictEqual(res.ok, true, '负例探针自身失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 0, '删除后仍有 ' + res.routes + ' 条路由');
    assert.strictEqual(res.modulesKey, false, '_modules 仍有键');
    assert.strictEqual(res.dispatchThrewNotAllowed, true, '删除后 dispatch 未抛 route not allowed');
    assert.strictEqual(res.modulesKeyCount, 149, '删除后模块数应回落 149, 实得 ' + res.modulesKeyCount);
  });
  t('C2 恢复源文件后路由归位且模块计数回到 150', () => {
    const res = runNegProbe();
    assert.strictEqual(res.ok, true, '恢复后探针失败: ' + JSON.stringify(res));
    assert.strictEqual(res.routes, 5, '恢复后路由数 ' + res.routes);
    assert.strictEqual(res.modulesKey, true, '恢复后 _modules 无键');
    assert.strictEqual(res.modulesKeyCount, 150, '恢复后模块数 ' + res.modulesKeyCount);
  });
})();

console.log('\n=== 第四组：稳健性（缺省入参不得内部崩溃） ===');
t('D1 5 条路由逐条空实参 dispatch 零内部故障', () => {
  const rs = allows(hf).filter(x => x.startsWith('arbitration.'));
  assert.strictEqual(rs.length, 5);
  for (const r of rs) {
    try {
      const out = hf.dispatch(r);
      assert.notStrictEqual(out, undefined, r + ' 返回 undefined');
    } catch (e) {
      const m = String(e && e.message);
      assert.ok(
        !/is not a function|is not defined|Cannot read properties of (null|undefined)/.test(m),
        r + ' 内部故障: ' + m
      );
      assert.ok(m.length > 0, r + ' 抛出空错误');
    }
  }
});
t('D2 assessState 缺省/非对象入参回落结构化结果而非抛', () => {
  for (const bad of [undefined, null, 42, 'str']) {
    const r = hf.dispatch('arbitration.assessState', bad);
    assert.ok(r && typeof r === 'object', '入参 ' + String(bad) + ' 应回落对象');
    assert.ok(typeof r.mode === 'string' && r.mode.length > 0, 'mode 应有值');
  }
});
t('D3 twoPassCheck 缺省入参回落 proceed 而非抛', () => {
  for (const bad of [undefined, null, 42]) {
    const r = hf.dispatch('arbitration.twoPassCheck', bad, {});
    assert.ok(r && typeof r === 'object');
    assert.ok(typeof r.pass === 'number');
    assert.ok(typeof r.action === 'string');
  }
});
t('D3b twoPassCheck 第二参 context 为 null/非对象不崩（r614 修的真实缺陷）', () => {
  for (const badCtx of [null, 42, 'str']) {
    const r = hf.dispatch('arbitration.twoPassCheck', '根据2025年的研究数据，这个方案可以提升百分之三十的效率', badCtx);
    assert.ok(r && typeof r === 'object', 'context=' + String(badCtx) + ' 应回落对象');
    assert.strictEqual(r.action, 'proceed');
  }
});
t('D4 resolve 缺省入参返回结构化合成结果', () => {
  const r = hf.dispatch('arbitration.resolve', {});
  assert.ok(r && typeof r === 'object');
  assert.ok(typeof r.success === 'boolean');
  assert.ok(r.action && typeof r.action === 'object');
});
t('D5 重复 start() 不会重复注册（幂等）', () => {
  hf.start();
  hf.start();
  assert.strictEqual(Object.keys(hf._modules).length, 150, '重复 start 后模块数 ' + Object.keys(hf._modules).length);
  assert.strictEqual(allows(hf).filter(x => x.startsWith('arbitration.')).length, 5);
});
t('D6 模块源码保留类导出与三个常量（防接线目标被误改）', () => {
  const src = fs.readFileSync(CA_PATH, 'utf8');
  assert.ok(/module\.exports\s*=/.test(src), 'cooperative-arbitration.js 应保留 module.exports');
  for (const name of ['CooperativeArbitration', 'ARBITRATIONMode', 'RESOLUTION_STRATEGIES']) {
    assert.ok(src.includes(name), '导出缺 ' + name);
  }
});

// [r614] 主实例在第二组已用于多条 dispatch，需在 B3/B6/B7/B8 前就位的第二个实例。
// 提前在此构造，供 B3 之后引用（变量提升由外层 main 作用域覆盖）。
})().then(() => { console.log('\n=== 结果 ==='); console.log('通过 ' + passed + ' / 失败 ' + failed); if (failures.length) { console.log('失败项:\n  ' + failures.join('\n  ')); process.exit(1); } process.exit(0); });
