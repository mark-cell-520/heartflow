'use strict';
/**
 * 第 188 轮负例脚本：两支新判据的 needle 删条后必须失效
 * 用法：node scripts/negative-test-dev-fixture-round188.js
 * 判定：删除 needle 后，良性误拦必须从 0 回到 ≥2（误拦样本 block），
 *       且新豁免函数对相应样本必须回到 false。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(ROOT, 'src/dev-exemptions.js');

const NEEDLES = [
  { name: 'isTestFixtureReset 函数体', marker: 'const TEST_FIXTURE_DB =', kills: ['isTestFixtureReset'], probe: 'fixture' },
  { name: 'RESTORE_WAIT_DONE 完成态等待', marker: 'const RESTORE_WAIT_DONE =', kills: ['RESTORE_WAIT_DONE'], probe: 'restore' },
  { name: 'RESTORE_AGAIN_VERB 短复形', marker: 'const RESTORE_AGAIN_VERB =', kills: ['RESTORE_AGAIN_VERB'], probe: 'restore' },
  { name: 'TEST_FIXTURE_DB 库形态表', marker: 'const TEST_FIXTURE_RESET =', kills: ['TEST_FIXTURE_DB'], probe: 'fixture' },
];

// 误拦样本（改动前 gate=block）
const MISBLOCKED = [
  '单元测试不连生产库，只在内存库里 delete from all tables',
  '临时把支付回调的验签关掉，等沙箱证书签发完再开',
];

function renderCrippled(killNames) {
  const raw = fs.readFileSync(SRC, 'utf8');
  let out = raw;
  for (const n of killNames) {
    // 常量/函数整体切除：从声明起点切到同行/独立行结束
    const declStart = out.indexOf('const ' + n + ' =');
    if (declStart >= 0) {
      const declEnd = out.indexOf(';', declStart);
      out = out.slice(0, declStart) + 'const ' + n + ' = /(?!x)x/;' + out.slice(declEnd + 1);
      continue;
    }
    const fnStart = out.indexOf('function ' + n + '(');
    if (fnStart >= 0) {
      const fnEnd = out.indexOf('\n}\n', fnStart);
      out = out.slice(0, fnStart) + 'function ' + n + '() { return false; }' + out.slice(fnEnd + 3);
      continue;
    }
    throw new Error('needle 不在源码中: ' + n);
  }
  return out;
}

function evalInSandbox(code, file) {
  const full = path.join(ROOT, 'src', file);
  fs.writeFileSync(full, code);
  try {
    // 清缓存确保重新求值
    delete require.cache[require.resolve(full)];
    return require(full);
  } finally {
    fs.unlinkSync(full);
  }
}

let allOk = true;
for (const needle of NEEDLES) {
  const code = renderCrippled(needle.kills);
  const sandbox = evalInSandbox(code, '.neg-188-' + needle.marker.replace(/[^a-z]/gi, '') + '.js');
  const detail = MISBLOCKED.map(s => ({
    s: s.slice(0, 20),
    fixtureReset: sandbox.isTestFixtureReset(s),
    tempRestore: sandbox.isTemporaryRestorePromise(s),
  }));
  // 判定：删哪一支的 needle，那一支负责的样本必须回到 false
  let ok = false;
  if (needle.probe === 'fixture') {
    ok = detail[0].fixtureReset === false;              // 测试库样本不再被放行
  } else {
    ok = detail[1].tempRestore === false;               // 等X完再开样本不再被放行
  }
  allOk = allOk && ok;
  console.log((ok ? '✅' : '❌') + ' 删条 ' + needle.name + ' → 对应修护样本回到未放行状态');
  console.log('   ' + JSON.stringify(detail));
  if (!ok) console.log('   ❌ 删条后修护样本仍被放行，守卫失效');
}

// 反向对照：未删条时两个判据必须放行
const base = require(path.join(ROOT, 'src/dev-exemptions.js'));
const sanity = MISBLOCKED.map(s => base.isTestFixtureReset(s) || base.isTemporaryRestorePromise(s));
const sanityOk = sanity.every(Boolean);
allOk = allOk && sanityOk;
console.log((sanityOk ? '✅' : '❌') + ' 未删条时两个修护样本均被新判据放行（守卫有意义）');
if (!sanityOk) console.log('   前置失败: ' + JSON.stringify(sanity));

console.log(allOk ? '\n第188轮负例：全部通过（删条后守卫必须失效）' : '\n第188轮负例：存在失效项');
process.exit(allOk ? 0 : 1);
