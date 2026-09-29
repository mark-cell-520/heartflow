// 第 217 轮守卫：_sleep seam 负例测试
// 判据必须查**实测耗时**，不只是「字段在不在」——
// 216 轮教训：只查布尔存在的守卫会被「挂了个空实现」骗过。
const path = require('path');
const Module = require('module');

const out = { cases: [] };
function rec(id, ok, detail) { out.cases.push({ id, ok, detail }); }

const SE_PATH = path.join(process.cwd(), 'src/cortex/self-evolution-v2.js');

(async () => {
  // ── 1) seam 存在性 + 语义：环境变量置零时必须真的不等 ──
  {
    const { SelfEvolutionV2 } = require(SE_PATH);
    const se = new SelfEvolutionV2();
    const hasFn = typeof se._sleep === 'function';
    rec('S1-sleep-method-exists', hasFn, 'typeof _sleep = ' + typeof se._sleep);

    // 注入 _sleepFn：记录被调用的 ms
    const calls = [];
    se._sleepFn = (ms) => { calls.push(ms); return Promise.resolve(); };
    const t0 = Date.now();
    await se._sleep(1234);
    const dt = Date.now() - t0;
    rec('S2-injected-fn-called', calls.length === 1 && calls[0] === 1234,
      JSON.stringify({ calls, dt }));
    rec('S3-injected-fn-fast', dt < 200, 'dt=' + dt + 'ms');
  }

  // ── 2) 环境变量分支：HEARTFLOW_TEST_NO_SLEEP=1 时必须立即返回 ──
  {
    const prev = process.env.HEARTFLOW_TEST_NO_SLEEP;
    process.env.HEARTFLOW_TEST_NO_SLEEP = '1';
    // 清缓存重新加载，确保读到新环境变量
    delete require.cache[require.resolve(SE_PATH)];
    const { SelfEvolutionV2 } = require(SE_PATH);
    const se = new SelfEvolutionV2();
    const t0 = Date.now();
    await se._sleep(99999);
    const dt = Date.now() - t0;
    rec('S4-env-no-sleep-fast', dt < 200, 'dt=' + dt + 'ms');
    if (prev === undefined) delete process.env.HEARTFLOW_TEST_NO_SLEEP;
    else process.env.HEARTFLOW_TEST_NO_SLEEP = prev;
    delete require.cache[require.resolve(SE_PATH)];
  }

  // ── 3) 生产路径未破坏：无 seam、无环境变量时必须真的 sleep ──
  {
    delete process.env.HEARTFLOW_TEST_NO_SLEEP;
    delete require.cache[require.resolve(SE_PATH)];
    const { SelfEvolutionV2 } = require(SE_PATH);
    const se = new SelfEvolutionV2();
    const t0 = Date.now();
    await se._sleep(300);
    const dt = Date.now() - t0;
    rec('S5-real-sleep-preserved', dt >= 250, 'dt=' + dt + 'ms (期望 >=250)');
  }

  const pass = out.cases.filter(c => c.ok).length;
  const fail = out.cases.length - pass;
  console.log('SEAM-RESULT ' + JSON.stringify({ total: out.cases.length, pass, fail }));
  for (const c of out.cases) if (!c.ok) console.log('XXFAIL ' + c.id + ' ' + c.detail);
  console.log(fail === 0 ? 'SEAM-TEST PASS' : 'SEAM-TEST FAIL');
})().catch(e => console.log('SEAM-FATAL ' + (e && e.message)));
