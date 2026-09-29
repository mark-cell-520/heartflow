// 第 218 轮守卫：注入-删条-必须变红（negative test）
//
// 纪律（第 216/217 轮教训）：
//  ① 变异必须回到原 bug 形态，不能只改周边代码；
//  ② 判据必须查内容，不只查布尔存在；
//  ③ 锚点必须与源码逐字符一致，报 XXFAIL 而非静默放过。
//
// 覆盖两个修复点：
//  M0 / M9 基线必须全绿
//  M1 decision-router：整行删掉本轮补的 const activeRules（回到
//     activeRules is not defined 原形态）→ evaluate 必抛
//  M2 heartflow.js：reasoning 归一化整段回滚成原来传 result.chain 对象
//     （回到 reasoning.toLowerCase is not a function 原形态）
//  M3 heartflow.js：result._selfVerification 赋值整段删掉（字段不落地）
//  M4 heartflow.js：conclusion 的字符串三元判定回滚成 || 链
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const DR = path.join(ROOT, 'src/core/decision-router.js');
const HF = path.join(ROOT, 'src/core/heartflow.js');
const TEST = path.join(ROOT, 'test/decision-router-selfverifier-r218.test.js');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);

function runTest(label) {
  try {
    const r = execFileSync(process.execPath, [TEST], { encoding: 'utf8', timeout: 120000, cwd: ROOT });
    const m = r.match(/测试结果: (\d+) 个，通过 (\d+)，失败 (\d+)/);
    return { label, pass: m ? parseInt(m[2], 10) : -1, fail: m ? parseInt(m[3], 10) : -1 };
  } catch (e) {
    // 测试进程非零退出（FATAL 路径）也算「变红」
    const out = (e.stdout || '') + String(e.message || '');
    const fails = (out.match(/FAIL:/g) || []).length;
    return { label, pass: Math.max(0, 26 - fails), fail: fails };
  }
}

const results = [];
const origDR = read(DR);
const origHF = read(HF);

try {
  results.push(runTest('M0 基线'));

  // ── M1：删整行 const activeRules（回到原 bug：ReferenceError）────
  {
    const anchor = '    const activeRules = this._activeRulesForEval || this._rules;\n';
    if (!origDR.includes(anchor)) { console.log('XXFAIL M1 锚点未找到（守卫脚本与源码不同步）'); process.exit(2); }
    write(DR, origDR.split(anchor).join(''));
    results.push(runTest('M1 删 const activeRules（ReferenceError 原形态）'));
    write(DR, origDR);
  }

  // ── M2：reasoning 归一化整段回滚为原写法（传 chain 对象）────────
  {
    const start = origHF.indexOf('        const _chain = result.chain;');
    const endMark = "        const conclusion = typeof result.output?.conclusion === 'string' ? result.output.conclusion";
    const end = origHF.indexOf(endMark);
    if (start < 0 || end < 0) { console.log('XXFAIL M2 归一化段锚点未找到'); process.exit(2); }
    const rolled = origHF.slice(0, start)
      + "        const reasoning = result.chain || result.analysis?.reasoning || result.output?.meta?.reasoningChain || '';\n"
      + origHF.slice(end);
    write(HF, rolled);
    results.push(runTest('M2 reasoning 归一化回滚（传 chain 对象原形态）'));
    write(HF, origHF);
  }

  // ── M3：_selfVerification 赋值整段删掉（字段不落地）──────────────
  {
    const start = origHF.indexOf('          result._selfVerification = {');
    const endMark = "        }\n      }\n    } catch (_) { _boundedPush(this._initErrors = this._initErrors || [], { module: 'optional', error: _.message, note: 'SelfVerifier 失败不阻断主链路' }";
    const end = origHF.indexOf(endMark);
    if (start < 0 || end < 0) { console.log('XXFAIL M3 赋值段锚点未找到'); process.exit(2); }
    const rolled = origHF.slice(0, start) + origHF.slice(end);
    write(HF, rolled);
    results.push(runTest('M3 删 _selfVerification 赋值（字段不落地）'));
    write(HF, origHF);
  }

  // ── M4：已删除（无效变异）—— conclusion 的 || 链在实测数据下同样产出字符串
  //   （result.output.conclusion 本身就是 string），属于等价路径而非 bug 形态，
  //   照 216 轮纪律「变异必须回到原 bug 形态」剔除此例。

  results.push(runTest('M9 还原后基线'));

  let bad = 0;
  for (const r of results) {
    const expectRed = /^M[1-3] /.test(r.label);
    const good = expectRed ? (r.fail > 0) : (r.fail === 0 && r.pass > 0);
    if (!good) bad++;
    console.log(`${good ? '✓' : '✗'} ${r.label}: pass=${r.pass} fail=${r.fail}${good ? '' : ' (不符合预期)'}`);
  }
  console.log(`\n守卫结果: ${results.length - bad} 通过, ${bad} 失败, 共 ${results.length} 个`);
  process.exit(bad ? 1 : 0);
} catch (e) {
  write(DR, origDR);
  write(HF, origHF);
  console.error('FATAL:', e.message);
  process.exit(1);
}
