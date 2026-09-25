/**
 * 守卫：README 测试数自动记账（v6.7.126，第 58 轮）
 *
 * 守的背景：第 55/56/57/58 轮连续四轮报同一个 objection
 * 「README 3606 vs 缓存 3652」——不是 LLM 懒，是**结构性死锁**：
 * 测试数由 run-all.js 产生（机器侧），README 却写在 prompt 硬边界
 * 「不写 README.md」里（人不许改）。机器能判定的记账必须机器做。
 *
 * 本测试守 syncReadmeTestCount() 的三件事：
 *   ① 缓存与 README 不一致时，真的把 README 改成实测值
 *   ② 已一致时不写盘（幂等，不会每轮刷一个无意义 commit）
 *   ③ 缺缓存/缺 README 时明确返回原因，不抛异常、不静默改错文件
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENGINE = path.join(__dirname, '..', 'scripts', 'upgrade-engine.js');

// 从引擎里抽出 syncReadmeTestCount，注入可控的 fs/path/readJson/ROOT
const src = fs.readFileSync(ENGINE, 'utf8');
const start = src.indexOf('function syncReadmeTestCount()');
assert.ok(start >= 0, 'upgrade-engine.js 里找不到 syncReadmeTestCount');
let depth = 0, end = -1;
for (let k = src.indexOf('{', start); k < src.length; k++) {
  if (src[k] === '{') depth++;
  else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break; } }
}
const make = new Function('fs', 'path', 'readJson', 'ROOT',
  src.slice(start, end) + '\nreturn syncReadmeTestCount;');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); console.log('  ✅', name); passed++; }
  catch (e) { console.log('  ❌', name, '→', e.message); failed++; }
}

function scenario() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-readme-sync-'));
  fs.mkdirSync(path.join(tmp, 'data'), { recursive: true });
  const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return {}; } };
  const fn = make(fs, path, readJson, tmp);
  return {
    tmp,
    fn,
    readme: () => fs.readFileSync(path.join(tmp, 'README.md'), 'utf8'),
    writeReadme: (s) => fs.writeFileSync(path.join(tmp, 'README.md'), s),
    writeCount: (o) => fs.writeFileSync(path.join(tmp, 'data', 'test-count.json'), JSON.stringify(o)),
    cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }),
  };
}

console.log('\n[① 不一致时同步]');
{
  const s = scenario();
  try {
    s.writeReadme('A\n× 3,606 passing tests\nB\n');
    s.writeCount({ passed: 3652, failed: 3 });
    const r = s.fn();
    assert.strictEqual(r.synced, true, JSON.stringify(r));
    assert.strictEqual(r.before, '3,606');
    assert.strictEqual(r.after, '3,652');
    assert.ok(s.readme().includes('3,652 passing tests'), 'README 未写入新值');
    console.log('  ✅ 3606 → 3652 写入 README');
    passed++;
  } catch (e) { console.log('  ❌', e.message); failed++; }
  s.cleanup();
}

console.log('\n[② 幂等]');
{
  const s = scenario();
  try {
    s.writeReadme('A\n× 3,652 passing tests\n');
    s.writeCount({ passed: 3652 });
    const r = s.fn();
    assert.strictEqual(r.synced, false, '已一致时不该再写盘');
    assert.strictEqual(r.reason, '已一致');
    console.log('  ✅ 已一致时不重复写盘');
    passed++;
  } catch (e) { console.log('  ❌', e.message); failed++; }
  s.cleanup();
}

console.log('\n[③ 异常输入不抛错]');
{
  const s = scenario();
  try {
    s.writeReadme('A\n无测试数横幅\n');
    s.writeCount({ passed: 3652 });
    const r = s.fn();
    assert.strictEqual(r.synced, false);
    assert.strictEqual(r.reason, 'README 无 passing tests 行');
    console.log('  ✅ README 缺横幅时明确返回原因');
    passed++;
  } catch (e) { console.log('  ❌', e.message); failed++; }
  s.cleanup();
}
{
  const s = scenario();
  try {
    s.writeReadme('A\n× 1,000 passing tests\n');
    // 不写 test-count.json → 缺缓存
    const r = s.fn();
    assert.strictEqual(r.synced, false);
    assert.strictEqual(r.reason, '无 test-count 缓存');
    assert.ok(s.readme().includes('1,000'), '缺缓存时不许动 README');
    console.log('  ✅ 缺缓存时不动 README');
    passed++;
  } catch (e) { console.log('  ❌', e.message); failed++; }
  s.cleanup();
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed ? 1 : 0);
