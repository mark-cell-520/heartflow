// r579 负例脚本 v3（r580 更新锚点）：heartflow_topic_scope MCP 接线的真守卫验证
// 判据：删掉/改坏关键代码段，守卫必须变红（守卫不能被触发就不是守卫）
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRV = path.join(ROOT, 'src/mcp-server.js');
const GUARD = path.join(ROOT, 'test/round-578-topic-scope-wiring.test.js');
// 路由登记实际在 engine-dispatcher.js：generateAllowedRoutes 从
// _modules 原型方法自动生成（非下划线开头）。变异点必须选这里，
// 不能在 src/index.js 里找字符串（那里没有 topicScope 路由）。
const GEN = path.join(ROOT, 'src/core/engine-dispatcher.js');
const HF = path.join(ROOT, 'src/core/heartflow.js');

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; failures.push(name + ' → ' + e.message); console.log('  ❌ ' + name + ' → ' + e.message); }
}

function runGuard() {
  const r = cp.spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 110000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// 通用变异：改 file 的 oldStr→newStr → 守卫必须失败 → 还原
function mutate(label, file, oldStr, newStr) {
  console.log(`\n[变异: ${label}]`);
  const orig = fs.readFileSync(file, 'utf8');
  t(`守卫必须失败：${label}`, () => {
    if (!orig.includes(oldStr)) {
      throw new Error('变异锚点在 ' + path.basename(file) + ' 里找不到（守卫已改口径？）: ' + oldStr.slice(0, 50));
    }
    fs.writeFileSync(file, orig.replace(oldStr, newStr));
    let r;
    try { r = runGuard(); } finally { fs.writeFileSync(file, orig); }
    if (r.code === 0) throw new Error('守卫仍然全绿 —— 这个判据没被守卫覆盖');
  });
}

// [r580 新增] 真·端到端骨架探针：不碰引擎源码，直接起一个 MCP 进程
// 走 socket 调 heartflow_topic_scope，证明「协议层拿到的返回值」本身成立。
// 与 M1-M5（改源码看守卫是否变红）互为补充：那些测「守卫醒着」，
// 这个测「当前挂在源码上的实现真的返回了能力」。
function probeMcp() {
  console.log('\n[探针: MCP 协议层真实返回值]');
  const net = require('net');
  const os = require('os');
  const socks = [];
  t('MCP push→contains→stats→clearAll 全链路返回真实话题状态', () => {
    const sock = path.join(os.tmpdir(), `hf-negprobe-r580-${process.pid}.sock`);
    socks.push(sock);
    try { fs.unlinkSync(sock); } catch (_) {}
    const proc = cp.spawn('node', [path.join(ROOT, 'src/mcp-server.js'), '--socket', sock], {
      cwd: ROOT, stdio: 'ignore',
    });
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline && !fs.existsSync(sock)) {
      if (proc.exitCode !== null) throw new Error('MCP 进程提前退出');
      const until = Date.now() + 250; while (Date.now() < until) {}
    }
    if (!fs.existsSync(sock)) throw new Error('MCP socket 未就绪');
    const until2 = Date.now() + 1500; while (Date.now() < until2) {}

    const call = (name, args) => new Promise((resolve, reject) => {
      const s = net.createConnection(sock, () => {
        s.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) + '\n');
      });
      let buf = '';
      const timer = setTimeout(() => { s.destroy(); reject(new Error('timeout ' + name)); }, 20000);
      s.on('data', d => {
        buf += d.toString();
        if (buf.includes('\n')) {
          clearTimeout(timer);
          try { resolve(JSON.parse(buf.trim())); } catch (e) { reject(e); }
          s.destroy();
        }
      });
      s.on('error', e => { clearTimeout(timer); reject(e); });
    });
    const payload = (res) => {
      const r = res && (res.result || res);
      const text = r && r.content && r.content[0] ? r.content[0].text : '';
      try { return JSON.parse(text); } catch (_) { return { __raw: text.slice(0, 120) }; }
    };

    return (async () => {})()
      .then(() => call('heartflow_topic_scope', { action: 'push', text: '心虫辨别引擎维度守卫' }))
      .then(payload)
      .then((p) => {
        if (p.error) throw new Error('push 返回 error: ' + p.error);
        if (p.stats.currentTopic !== '心虫辨别引擎维度守卫') {
          throw new Error('push 后 currentTopic=' + JSON.stringify(p.stats.currentTopic) + ' —— 不是刚压入的话题');
        }
        return call('heartflow_topic_scope', { action: 'contains', text: '给辨别引擎再加一个判别维度' });
      })
      .then(payload)
      .then((c) => {
        if (c.error) throw new Error('contains 返回 error: ' + c.error);
        if (c.belongs !== true) throw new Error('同话题样本 belongs=' + c.belongs + ' —— 相似度判据没生效');
        return call('heartflow_topic_scope', { action: 'stats' });
      })
      .then(payload)
      .then((s) => {
        if (s.error) throw new Error('stats 返回 error: ' + s.error);
        if (!s.current) throw new Error('stats.current 为空 —— handler 没读真实实例');
        if (!Array.isArray(s.topics) || s.topics.length === 0) throw new Error('stats.topics 为空');
        return call('heartflow_topic_scope', { action: 'clearAll' });
      })
      .then(payload)
      .then((cl) => {
        if (cl.error) throw new Error('clearAll 返回 error: ' + cl.error);
        if (cl.stats.currentTopic !== null) {
          throw new Error('clearAll 后 currentTopic=' + JSON.stringify(cl.stats.currentTopic) + ' —— 清空语义没实现');
        }
        if (cl.stats.stackDepth !== 0) throw new Error('clearAll 后 stackDepth=' + cl.stats.stackDepth);
      })
      .catch((e) => { throw e; })
      .finally(() => { try { proc.kill(); } catch (_) {} });
  });
  for (const s of socks) { try { fs.unlinkSync(s); } catch (_) {} }
}

probeMcp();

// M1：handler 退回「每次 new 全新实例」（r578 定位的坏形状①）
mutate('MCP handler 退回每次 new 空实例', SRV,
  'const ts = (heartflow && heartflow.topicScope) || _topicScopeFallback();',
  'const { TopicScope } = require(\'./memory/topic-scope.js\');\n      const ts = new TopicScope({ silent: true });');

// M2：handler 调不存在的 getCurrentTopic（r578 定位的坏形状②）
// 注意：断言窗口必须覆盖 handler 尾部，否则守卫看不见这次变异。
mutate('MCP handler 改回调不存在的 getCurrentTopic', SRV,
  'const stats = ts.getStats ? ts.getStats() : null;',
  'const current = ts.getCurrentTopic ? ts.getCurrentTopic() : null;\n      const stats = ts.getStats ? ts.getStats() : null;');

// M3：handler 不再读真实实例的 current（stats 返回空状态）
// [r580 修锚点] r579 原锚点是重组前的单行 return，handler 已在 r579/r580
// 结构化重组；现锚点取现役的 tail-return 常量行，改坏后 E2E stats.current
// 断言必红。
mutate('MCP handler 不再返回真实话题状态', SRV,
  'const current = ts.current !== undefined ? ts.current : null;',
  'const current = null;');

// M4：路由生成器把 topicScope 的方法滤掉（非下划线方法不再生成路由）
mutate('路由生成器丢弃 topicScope 模块', GEN,
  'for (const [name, mod] of Object.entries(modules)) {',
  'for (const [name, mod] of Object.entries(modules)) {\n    if (name === \'topicScope\') continue;');

// M5：引擎接线删掉（_modules 注册那 13 行）
mutate('引擎 _modules.topicScope 注册删掉', HF,
  "this._modules['topicScope'] = this.topicScope;",
  '/* 变异：注册已删 */');

// M6（r580 新增）：clearAll 归零分支被拿掉（退回模块原语义，只清 store）
// 这是 r580 修的那个真 bug 的守卫：删掉强制归零后 E2E clearAll 判据必须红。
mutate('MCP clearAll 归零分支删掉', SRV,
  "            if (ts._stack) ts._stack.length = 0;\n            if (ts._topics) ts._topics.clear();",
  "            /* 变异：归零分支已删 */");

// M7（r580 新增）：reset 动作退化成空操作
// r580 新加的 reset 判据：栈不归零就必须被守卫抓到。
mutate('MCP reset 动作退化成空操作', SRV,
  "          } catch (e) { return { error: 'reset 失败: ' + e.message }; }",
  "          } catch (e) { return { error: 'reset 失败: ' + e.message }; }\n          return { action, stats: ts.getStats(), timestamp: Date.now() };");

console.log(`\n${'─'.repeat(50)}`);
console.log(`负例结果: ${pass} 通过, ${fail} 失败`);
if (fail > 0) {
  console.log('\n失败项:');
  failures.forEach(f => console.log('  · ' + f));
  process.exit(1);
}
