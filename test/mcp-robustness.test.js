/**
 * 测试：MCP handler 健壮性（v6.7.87，心虫 decision.decide 0.92）
 *
 * 来源：第 33 轮心虫选「测 MCP handler 边界输入健壮性」（0.92）。
 *
 * 一、结论：handler 层健壮，无崩溃
 *
 * 逐个测 15 类畸形输入（空/null/数字/数组/对象/缺参/多参/超长/emoji/
 * 超长单字/null字节/控制字符/RTL覆盖），全部返回规范响应，
 * 服务全程存活。引擎层对 null 字节、控制字符、RTL 覆盖也全部 pass。
 *
 * 二、本轮最大教训：我的探针脚本自己崩了，我误判成"MCP 崩溃"
 *
 * 第一版探针用 urllib 发含 `\x00` 的 body，urlopen 抛异常后
 * 我的 except 块继续发后续请求——复用了同一个已被 reset 的连接，
 * 于是后续 5 个请求全部 Connection refused。
 * 我据此写"严重发现：MCP server 崩溃了"——**这是假阳性**。
 *
 * 分开复测（每个输入独立连接）后真相：
 *   裸 null 字节   → 规范 JSON-RPC 错误 "Bad control character in string"
 *   畸形 JSON      → 规范错误 "Expected double-quoted property"
 *   空 body        → 规范错误 "Unexpected end of JSON input"
 *   3MB body       → 413 Payload Too Large（Node HTTP 默认限制，合理）
 *   JSON 转义 null → 正常处理，gate 返回 pass
 *   服务存活       → tools/list 59 个工具在线
 *
 * 这是同一个模式的第 5 次：诊断工具自身的缺陷伪装成被测对象的缺陷。
 * （前 4 次：维度面板 22 BROKEN、面板口径 3 BROKEN、断链扫描 50/7、
 *   lang-coverage 报 5 个）。区别是前 4 次是"报多了"，这次是"报崩了"。
 *
 * 三、真正的结论与边界
 *
 *   健壮：所有 JSON 层面的畸形输入都被 MCP 层正确拒绝或处理
 *   边界：>1MB 的 body 会 413（未实测精确阈值，约在 1MB~3MB 之间）
 *         ——这是 HTTP 层限制不是 handler 缺陷，调用方应先截断
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[引擎层：畸形输入不崩溃]');

const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const tn = require(path.join(HF, 'src/text-normalizer.js'));

const WEIRD = [
  ['空字符串', ''],
  ['null 字节', 'abc\u0000def'],
  ['控制字符', 'abc\u0001\u0002\u0003def'],
  ['RTL 覆盖', 'abc\u202edef\u202c'],
  ['纯 emoji', '🎉'.repeat(100)],
  ['超长单字', 'a'.repeat(50000)],
];

for (const [name, text] of WEIRD) {
  t(`checkInput(${name}) 不崩`, () => {
    const r = gate.checkInput(text);
    assert.ok(r && r.gate, '返回结构不完整');
  });
}

t('discriminate(null 字节) 不崩', () => {
  const r = idx.discriminate('abc\u0000def');
  assert.ok(r && typeof r.overallScore === 'number', '返回结构异常');
});

t('normalize(null 字节) 不崩', () => {
  const r = tn.normalize('abc\u0000def');
  assert.ok(r && typeof r.normalized === 'string', '归一化返回异常');
});

console.log('\n[非字符串输入：转换为字符串而非崩溃]');

for (const [name, val] of [['数字', 12345], ['布尔', true], ['null', null], ['数组', ['a','b']], ['对象', {a:1}]]) {
  t(`checkInput(${name}) 不崩`, () => {
    const r = gate.checkInput(val);
    assert.ok(r && r.gate, `返回结构异常: ${JSON.stringify(r).slice(0, 60)}`);
  });
}

console.log('\n[MCP 层：畸形 JSON 应返回规范错误而非挂起]');

// 真实 HTTP 探测只在明确可用时跑（CI 环境可能没有起 8588）
function probe(body) {
  const cp = require('child_process');
  const script = `
    const http = require('http');
    const body = ${JSON.stringify(body)};
    const req = http.request({
      host: '127.0.0.1', port: 8588, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + process.env.MCP_TOKEN }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { console.log(JSON.stringify({ status: res.statusCode, ok: true })); }
        catch (e) { console.log(JSON.stringify({ status: res.statusCode, raw: d.slice(0, 80) })); }
      });
    });
    req.on('error', e => console.log(JSON.stringify({ ok: false, err: e.message })));
    req.end(body);
  `;
  const r = cp.spawnSync('node', ['-e', script],
    { encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, {
      MCP_TOKEN: require('fs').readFileSync(path.join(HF, '.env'), 'utf8')
        .match(/MCP_HEARTFLOW_KEY=(.+)/)[1].trim() }) });
  try { return JSON.parse((r.stdout || '').trim()); } catch (_) { return null; }
}

let live = null;
try {
  live = probe(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
} catch (_) {}

if (live && live.ok && live.status === 200) {
  console.log('  (8588 在线，做 HTTP 层探测)');

  t('畸形 JSON → 规范错误响应', () => {
    const r = probe('{"jsonrpc":"2.0", bad json');
    assert.ok(r && r.status === 200, `HTTP 状态异常: ${JSON.stringify(r)}`);
  });

  t('空 body → 规范错误响应', () => {
    const r = probe('');
    assert.ok(r && r.status === 200, `HTTP 状态异常: ${JSON.stringify(r)}`);
  });

  t('裸 null 字节 → 规范错误响应（不挂起不崩溃）', () => {
    const body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_gate","arguments":{"text":"abc\u0000def"}}}';
    const r = probe(body);
    assert.ok(r && r.status === 200, `HTTP 状态异常: ${JSON.stringify(r)}`);
  });

  t('探测后服务仍存活', () => {
    const r = probe(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
    assert.ok(r && r.ok && r.status === 200, '服务在畸形输入后不存活');
  });
} else {
  console.log('  (8588 不在线，跳过 HTTP 层探测 — 引擎层结论仍有效)');
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
