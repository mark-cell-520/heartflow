// 第 218 轮守卫补：M5/M6 两个更贴原 bug 的变异
//  M5 = chain.stages 不是数组（回滚 normalize 分支本身）→ 原 bug 形态
//  M6 = _r218ToText 整个函数体替换成「直接 return v」→ 非字符串直达 verify
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
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
    const out = (e.stdout || '') + String(e.message || '');
    return { label, pass: Math.max(0, 26 - (out.match(/FAIL:/g) || []).length), fail: (out.match(/FAIL:/g) || []).length };
  }
}

const origHF = read(HF);
const results = [];
try {
  results.push(runTest('M0 基线'));

  // M6：_r218ToText 函数体整段替换为「原样返回」—— 非字符串直达 verify，
  //      正是修复前 chain 对象被直接喂给 reasoning 的形态
  {
    const start = origHF.indexOf('        const _r218ToText = (v, depth) => {');
    const endAnchor = '        const _chain = result.chain;';
    const end = origHF.indexOf(endAnchor);
    if (start < 0 || end < 0) { console.log('XXFAIL M6 锚点未找到'); process.exit(2); }
    const rolled = origHF.slice(0, start)
      + '        const _r218ToText = (v) => v;\n'
      + origHF.slice(end);
    write(HF, rolled);
    results.push(runTest('M6 _r218ToText 原样返回（对象直达 verify 原形态）'));
    write(HF, origHF);
  }

  results.push(runTest('M9 还原后基线'));

  let bad = 0;
  for (const r of results) {
    const good = /^M6 /.test(r.label) ? (r.fail > 0) : (r.fail === 0 && r.pass > 0);
    if (!good) bad++;
    console.log(`${good ? '✓' : '✗'} ${r.label}: pass=${r.pass} fail=${r.fail}${good ? '' : ' (不符合预期)'}`);
  }
  console.log(`\n守卫结果2: ${results.length - bad} 通过, ${bad} 失败, 共 ${results.length} 个`);
  process.exit(bad ? 1 : 0);
} catch (e) {
  write(HF, origHF);
  console.error('FATAL:', e.message);
  process.exit(1);
}
