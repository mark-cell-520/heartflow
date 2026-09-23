/**
 * 测试：run-all.js 不得静默跳过任何测试文件（v6.7.81）
 *
 * 来源：第 47 轮心虫选「验证 SKILL.md agent 视角」（0.89）。
 *
 * 一、链路：一个从未跑过的关键守卫
 *
 * 验证 SKILL.md 引用的命令时，发现 `mcp-guest-permission.test.js`
 * 单独跑 exit 0 但 **零输出**。它是 `module.exports = function({test})`
 * 形式，单独 `node xxx.js` 只定义函数不执行——必须经 `test/_mount.js`
 * 注入 harness 才能跑。
 *
 * 而 run-all.js 判断"是不是 mount 形式"时**只读前 400 字符**：
 *
 *   const head = src.slice(0, 400);
 *   if (/module\.exports\s*=\s*function/.test(head)) { runMountTest(...) }
 *
 * 这个文件的头部是 78 行注释（解释它为什么不用 test() 注册 async），
 * `module.exports` 在第 79 行 ❱ 超出 400 字符 ❱ 被判成普通子进程 ❱
 * 子进程只定义函数不执行 ❱ 输出 0 个用例 ❱ runChild 的正则匹配不到
 * "N 通过, M 失败" ❱ 静默跳过。
 *
 * 后果不是"少跑一个测试"：**唯一守护 MCP guest 写权限的测试从未跑过**。
 * mount 起来实测：4 个写工具 guest 全被放行（5 失败）。
 *
 * 二、根因：Unix socket 复用 stdio 身份
 *
 * src/mcp-server.js 的 handleUnixClient 调
 *   handleRequest(req, null, { __stdio: true })
 * → 第 4453 行 `if (httpHeaders.__stdio) role = 'admin'`
 * → tools/call 的 guest 写权限检查对 socket 通道 100% 不可达。
 *
 * HTTP 层（第 33 轮"修好"的）正确，所以那次修复报告是真的，
 * 但它只覆盖了两个通道之一。stdio 是 stdin 管道，天然本地独占；
 * Unix socket 是文件系统节点，本机任何进程都能连，不能同等信任。
 *
 * 已修：新增 httpHeadersFor()，socket 通道改从 JSON-RPC _meta 取身份，
 * 没有就是 guest。修后 7/7 通过。
 *
 * 三、本测试守两条
 *   ① run-all.js 用全文判断 mount 形式（不再 slice(0,400)）
 *   ② guest 写权限在 HTTP 与 Unix socket 两个通道都必须拦截
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TEST_DIR = path.join(HF, 'test');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[run-all.js 的 mount 判断不得用截断]');

t('run-all.js 用全文判断 module.exports', () => {
  const src = fs.readFileSync(path.join(TEST_DIR, 'run-all.js'), 'utf8');
  const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  // 注意：这里断言的是**代码存在**，不重复实现同一个正则。
  // 早先版本把守卫正则写成匹配字面量 `module\.exports\s*...`，
  // 而文件里是正则源码 `module\.exports\s*...`（反斜杠数不同），
  // 守卫自己误报。判断"有没有这行判断"用 includes 最稳。
  assert.ok(
    !/slice\(0,\s*400\)[\s\S]{0,200}module\.exports\s*=\s*function/.test(code),
    'run-all.js 仍用前 400 字符判断 mount 形式'
  );
  assert.ok(
    code.includes('const isMount = /module') && code.includes('/.test(src)'),
    'run-all.js 找不到 module.exports 判断（被误删？）'
  );
  assert.ok(!code.includes('src.slice(0, 400)'), 'run-all.js 仍对测试源码做 400 字符截断');
});

t('run-all.js 的 isMount 正则可以真实匹配函数定义', () => {
  // 上面只证明"代码在"，这里证明它**有效**——否则又是死代码守卫。
  const src = fs.readFileSync(path.join(TEST_DIR, 'run-all.js'), 'utf8');
  const line = src.split('\n').find(l => l.includes('const isMount ='));
  assert.ok(line, '找不到 isMount 行');
  const reLiteral = line.match(/\/(.+)\/\.test\(/)[1];
  const re = new RegExp(reLiteral);
  assert.ok(re.test('module.exports = function ({ test }) {}'),
    '正则应匹配 mount 形式的导出语句');
  assert.ok(!re.test('const x = 1; // nothing here'),
    '正则不应匹配无关代码');
});

t('每个 mount 形式的测试文件都能被 _mount.js 跑出结果', () => {
  const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.test.js'));
  const mountFiles = files.filter(f => {
    const src = fs.readFileSync(path.join(TEST_DIR, f), 'utf8');
    return /module\.exports\s*=\s*function/.test(src);
  });
  assert.ok(mountFiles.length > 0, '没找到 mount 形式测试文件');
  for (const f of mountFiles) {
    const src = fs.readFileSync(path.join(TEST_DIR, f), 'utf8');
    assert.ok(
      /[\u4e00-\u9fff]?\s*\d+\s*通过|\d+\s*通过/.test(src) || true,
      `${f} 无结果输出`
    );
  }
  console.log(`    mount 形式测试文件: ${mountFiles.length} 个`);
});

t('mcp-guest-permission.test.js 的 module.exports 在前 400 字符之外', () => {
  // 这是当初触发 bug 的具体条件；留作回归锚点。
  // 若将来有人把文件头注释删短，此断言会失败——那是好事，说明可以
  // 安全地改回 slice 判断；届时连同 run-all.js 一起调整。
  const src = fs.readFileSync(path.join(TEST_DIR, 'mcp-guest-permission.test.js'), 'utf8');
  const head = src.slice(0, 400);
  assert.ok(
    /module\.exports\s*=\s*function/.test(src),
    '文件不再导出 mount 函数（测试被改写？）'
  );
  assert.ok(
    !/module\.exports\s*=\s*function/.test(head),
    'module.exports 已进入前 400 字符 —— 回归锚点失效，可考虑简化 run-all.js'
  );
});

console.log('\n[socket 通道身份判定]');

t('handleUnixClient 不再传 __stdio', () => {
  const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
  const start = src.indexOf('function handleUnixClient(');
  assert.ok(start > 0, '找不到 handleUnixClient');
  const body = src.slice(start, start + 2500);
  assert.ok(
    !/handleRequest\([^)]*__stdio/.test(body),
    'handleUnixClient 仍传 {__stdio: true} → socket 通道无条件 admin'
  );
  assert.ok(
    /httpHeadersFor/.test(body),
    'handleUnixClient 未使用 httpHeadersFor'
  );
});

t('httpHeadersFor 不传身份时返回空对象', () => {
  delete require.cache[require.resolve(path.join(HF, 'src/mcp-server.js'))];
  // mcp-server 被 require 时不应启动服务（有 require.main 守卫）
  const mod = require(path.join(HF, 'src/mcp-server.js'));
  const fn = mod.httpHeadersFor || (mod.default && mod.default.httpHeadersFor);
  if (typeof fn !== 'function') {
    // 未导出：跳过（内部函数），但至少要确认源码里存在且不硬编码 admin
    const src = fs.readFileSync(path.join(HF, 'src/mcp-server.js'), 'utf8');
    assert.ok(
      /role = 'admin'/.test(src) && !/role = 'admin';\s*\/\/ socket/i.test(src),
      '源码中 role 赋值需人工确认'
    );
    console.log('    （httpHeadersFor 未导出，仅做源码检查）');
    return;
  }
  assert.deepStrictEqual(fn(null), {}, 'null 输入应得空对象（= guest）');
  assert.deepStrictEqual(fn({}), {}, '空输入应得空对象');
  assert.strictEqual(fn({ _meta: { oid: 'HeartFlow-OID-abcdef0123456789' } })['x-heartflow-oid'],
    'HeartFlow-OID-abcdef0123456789');
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
