// [r603] progressJudgment dispatch 接线守卫测试
// 覆盖：①接线真实生效（dispatch 可达 + 返回真实判断）
//       ②矛盾样本必须有差别（伪进步族 vs 真实进步族）——辨别能力不是恒通过
//       ③删块注入负例：把 heartflow.js 的注册行删掉，dispatch 必须重新抛 not allowed
// 只报数字与形状，不贴样本原文。
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const HF = path.join(ROOT, 'src/core/heartflow.js');

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  // ── ① 接线真实生效 ────────────────────────────────────────────
  console.log('== 接线面 ==');
  ok(hf._modules['progressJudgment'] === hf.progressJudgment, '实例进 _modules', 'identity ok');
  const expectRoutes = ['judge', 'checkCoreStandards', 'detectPseudoProgress', 'makeIndependentJudgment', 'formMyJudgment', 'buildStandGround', 'calculateConfidence'];
  for (const m of expectRoutes) {
    ok(HeartFlow.ALLOWED_ROUTES.has('progressJudgment.' + m), 'ALLOWED_ROUTES 含 progressJudgment.' + m);
  }
  const routesVisible = (hf.routes()['progressJudgment'] || []).filter(r => !r.includes('[未注册'));
  ok(routesVisible.length === expectRoutes.length, 'routes() 可见 7 条且均未标「未注册」', '实得 ' + routesVisible.length + '：' + routesVisible.slice(0, 2).join(' / '));

  // ── ② 辨别能力：伪进步族 vs 真实进步族必须分得开 ─────────────
  console.log('== 辨别力 ==');
  const judge = (action, claim, evidence, userIntent) => hf.dispatch('progressJudgment.judge', { action, claim, evidence, userIntent });

  // 族 P：声称进步但无证据 + 表面升级措辞（伪进步族）
  const p1 = judge('把模型放大十倍', '性能更强了', [], '我要更强');
  ok(p1 && typeof p1 === 'object', 'dispatch judge 返回对象');
  ok(p1.isProgress === false, '伪进步族判为 isProgress=false', 'p1=' + p1.isProgress);
  ok(p1.pseudoCheck && p1.pseudoCheck.isPseudo === true, '伪进步族命中伪进步模式', 'patterns=' + JSON.stringify(p1.pseudoCheck.patterns));
  ok(p1.standGround && p1.standGround.myPosition, '伪进步族给出 standGround');

  // 族 P2：装饰升级族（声称更好看但无质量证据）
  const p2 = judge('把文档排版美化一遍', '界面更好看了', [], '让老大满意');
  ok(p2.isProgress === false, '装饰升级族判为 isProgress=false');
  ok(p2.coreCheck && p2.coreCheck.passed === false, '装饰升级族 coreCheck 不通过（缺可验证证据）');

  // 族 R：真实进步族（有证据 + 减少错误 + 可传递）
  const r1 = judge('修复错误率，把准确率从 0.87 提升到 0.94 并写进测试守护', '更正确，减少错误', ['测试报告显示误报从 302 降到 286', '有单文件测试守护该行为'], '持续减少错误');
  ok(r1.isProgress === true, '真实进步族判为 isProgress=true', 'r1=' + r1.isProgress);
  ok(r1.coreCheck && r1.coreCheck.passed === true, '真实进步族 coreCheck 通过');
  ok(r1.pseudoCheck && r1.pseudoCheck.isPseudo === false, '真实进步族未命中伪进步模式');
  ok(r1.standGround === null, '真进步族不触发 standGround');
  ok(r1.confidence > p1.confidence, '真实进步族 confidence 高于伪进步族', r1.confidence + ' > ' + p1.confidence);

  // 族 T：幻觉进步族（说更好但无测量）
  const t1 = judge('发布了新版本', '这个版本更好', [], '照着做');
  ok(t1.isProgress === false, '幻觉进步族判为 isProgress=false');

  // 其余 6 个方法均可 dispatch
  console.log('== 其余路由 ==');
  const cs = hf.dispatch('progressJudgment.checkCoreStandards', '行动', '声称', ['证据']);
  ok(cs && typeof cs === 'object' && 'passed' in cs, 'checkCoreStandards 可 dispatch');
  const dp = hf.dispatch('progressJudgment.detectPseudoProgress', '行动', '声称更好');
  ok(dp && typeof dp === 'object' && 'isPseudo' in dp, 'detectPseudoProgress 可 dispatch');
  const mj = hf.dispatch('progressJudgment.makeIndependentJudgment', '行动', '声称', '意图');
  ok(mj && typeof mj === 'object' && 'isValuable' in mj, 'makeIndependentJudgment 可 dispatch');
  const fj = hf.dispatch('progressJudgment.formMyJudgment', true, {});
  ok(typeof fj === 'string' && fj.length > 0, 'formMyJudgment 可 dispatch');
  const sg = hf.dispatch('progressJudgment.buildStandGround', {}, { passed: false, failures: ['可验证性'] }, { isPseudo: false, patterns: [] });
  ok(sg && typeof sg === 'object' && sg.framing, 'buildStandGround 可 dispatch');

  // ── ③ 删块注入负例 ────────────────────────────────────────────
  // 用仓库标准的 mutation-guard-recovery（arm/disarm/recover）：
  // 侧车备份 + exit/SIGINT/SIGTERM 钩子 + 下轮 recover() 兜底。
  // 绝不用手写 finally 写盘还原 —— r603 实测过一次手写 finally 的
  // 备份清空事故（writeFileSync(bak,'') 后 copyFileSync 读空备份），
  // 直接把 src/core/heartflow.js 6022 行清空。
  console.log('== 删块注入负例（必须变红） ==');
  const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
  recover([HF]);                       // 启动即解上一次硬杀残留
  const src = fs.readFileSync(HF, 'utf8');
  const REG = "this._modules['progressJudgment'] = this.progressJudgment;";
  ok(src.includes(REG), '注册行存在于源码（负例前置确认）');

  arm(HF, src);                        // 写盘变异前 arm
  try {
    const mutated = src.replace(REG, '/* r603 negative-test: registration removed */');
    if (mutated === src) throw new Error('mutation did not change source');
    fs.writeFileSync(HF, mutated);
    // 以隔离模块实例重载：清 require 缓存后重新构造，必现 not allowed
    delete require.cache[require.resolve(HF)];
    const M = require(HF);
    const Fresh = M.HeartFlow || M.default && M.default.HeartFlow || M;
    if (typeof Fresh !== 'function') throw new Error('mutated module export is not a constructor');
    const hf2 = new Fresh();
    hf2.start();
    let threw = false;
    try { hf2.dispatch('progressJudgment.judge', {}); } catch (e) { threw = /not allowed/i.test(e.message); }
    ok(threw, '删掉注册行后 dispatch 重新抛 route not allowed', '负例生效');
    ok(!hf2._modules['progressJudgment'], '删掉注册行后 _modules 无该键');
    ok(Fresh.ALLOWED_ROUTES.has('progressJudgment.judge') === false, '删掉注册行后 ALLOWED_ROUTES 不再含该路由');
  } catch (e) {
    console.log('  FAIL 负例执行异常: ' + e.message);
    fail++;
  } finally {
    // 还原 + disarm（侧车内容比对一致才删侧车，由模块内部保证）
    const { restoreOne } = require('./mutation-guard-recovery.js');
    restoreOne(HF);
    disarm(HF);
    delete require.cache[require.resolve(HF)];
  }

  // 还原后再确认一次仍然可用（防 mutation 污染同进程后续断言）
  delete require.cache[require.resolve(HF)];
  const M2 = require(HF);
  const Fresh2 = M2.HeartFlow || M2.default && M2.default.HeartFlow || M2;
  const hf3 = new Fresh2();
  hf3.start();
  ok(!!hf3._modules['progressJudgment'], '恢复后注册归位');
  ok(fs.readFileSync(HF, 'utf8').includes(REG), '恢复后源码含注册行（字节级确认）');
  const backOk = hf3.dispatch('progressJudgment.judge', { action: '修复误报', claim: '更正确', evidence: ['测试报告'] });
  ok(backOk && typeof backOk === 'object', '恢复后 dispatch 仍返回真实判断');

  // ── ④ 良性：未启动/空参数不得崩 ────────────────────────────────
  console.log('== 稳健性 ==');
  let noThrow = true;
  try {
    hf.dispatch('progressJudgment.judge', {});
    hf.dispatch('progressJudgment.detectPseudoProgress', '', '');
    hf.dispatch('progressJudgment.calculateConfidence', { passed: true }, { isPseudo: false }, { score: 0.5 });
  } catch (e) { noThrow = false; console.log('    空参调用抛: ' + e.message.slice(0, 60)); }
  ok(noThrow, '空参调用零抛');

  console.log('\n== 汇总 ==');
  console.log('passed=' + pass + ' failed=' + fail);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
