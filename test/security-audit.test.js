// test/security-audit.test.js — 2026-08-06 深度安全审计修复回归测试
// 保护：S-1 guardPath 路径约束 / S-2 execFileSync 参数化 / I-4 fuser 无藏错 + PORT 守卫
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── S-1: guardPath 越界拦截 ───
t('S1: guardPath 拒绝 /etc/passwd', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath('/etc/passwd');
  if (r.safe !== false) throw new Error(`expected safe=false, got ${r.safe}`);
});

t('S1: guardPath 拒绝 ~/.ssh 密钥', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath('/Users/apple/.ssh/id_rsa');
  if (r.safe !== false) throw new Error('ssh key path should be rejected');
});

t('S1: guardPath 放行内部 data/benchmark', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath(path.join(PROJECT_ROOT, 'data', 'benchmark'));
  if (r.safe !== true) throw new Error(`internal path should pass: ${r.reason}`);
});

t('S1: guardPath 放行项目内 src 文件', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'));
  if (r.safe !== true) throw new Error(`src path should pass: ${r.reason}`);
});

t('S1: guardPath 拒绝路径穿越 ..', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  // [v6.7.98] 原断言写错了：`PROJECT_ROOT/data/../../etc/passwd` 的解析结果
  // 依赖 PROJECT_ROOT 的深度——装在 /root/.hermes/skills/ai/.../（深）时
  // 越出 root 被拒，但装在 node_modules/@scope/pkg/（浅）时仍落在 root 内，
  // 而 guardPath 放行**自家 root 内的任何路径**是正确设计。
  // 第 75 轮在包内复跑时它 FAIL 过一次，根因是断言假设「穿越必越界」。
  // 改用与安装深度无关的构造：相对 PROJECT_ROOT 逐级上跳直到越界为止。
  const root = path.resolve(PROJECT_ROOT);
  let deep = root;
  for (let i = 0; i < 64 && path.resolve(deep).startsWith(root + path.sep); i++) deep = path.join(deep, '..');
  deep = path.join(deep, '..', 'etc', 'passwd');
  const resolved = path.resolve(deep);
  const r = guardPath(resolved);
  if (!resolved.startsWith(root + path.sep)) {
    if (r.safe !== false) {
      throw new Error(`traversal escaping project root should be rejected: ${r.resolved} (got safe=${r.safe})`);
    }
    return;
  }
  throw new Error(`测试构造失败：无法构造越出 project root 的路径（root=${root}）`);
});

// ─── S-1: MCP 三个 benchmark handler 均含 guardPath 调用 ───
t('S1: 3 个 benchmark handler 都含 guardPath 约束', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const handlers = ['handleBenchmarkStatus', 'handleBenchmarkRun', 'handleBenchmarkImportFailures'];
  for (const h of handlers) {
    const idx = src.indexOf('function ' + h);
    if (idx < 0) throw new Error(`handler ${h} not found`);
    const block = src.slice(idx, idx + 1500);
    if (!block.includes('guardPath')) throw new Error(`${h} 缺少 guardPath 约束`);
  }
});

// ─── S-2: smart-upgrade 参数化（无 shell 字符串拼接） ───
t('S2: smart-upgrade-engine 不再用 execSync shell 拼接', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'cortex', 'smart-upgrade-engine.js'), 'utf-8');
  if (src.includes('execSync(`git')) throw new Error('仍存在 execSync shell 拼接');
  if (!src.includes('execFileSync')) throw new Error('未使用 execFileSync 参数化');
});

t('S2: _verifyGitCommit 真实工作（参数化后仍命中版本）', () => {
  const pkg = require('../package.json');
  const { execFileSync } = require('child_process');
  const fsx = require('fs');
  const pathx = require('path');
  // [v6.7.98] 独立安装的 node_modules 不是 git 仓库（npm 包不带 .git），
  // 无从验证「版本号已提交」。第 75 轮在包内复跑 run-all 时它计 1 失败——
  // 那是**包内无 git 上下文**的预期，不是代码缺陷。显式 SKIP 而不是 FAIL。
  if (!fsx.existsSync(pathx.join(PROJECT_ROOT, '.git'))) {
    console.log(`SKIP S2 (当前目录非 git 仓库：npm 安装场景无从验证版本提交历史)`);
    console.log(`     在 git 检出中运行时本项生效；v6.7.94 起由 publish 前流程保证`);
    return;
  }
  const log = execFileSync('git', ['-C', PROJECT_ROOT, 'log', '--oneline', '--all'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const tags = execFileSync('git', ['-C', PROJECT_ROOT, 'tag', '--list'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const commitHit = log.split('\n').filter(l => l.includes(pkg.version) || l.includes('v' + pkg.version)).length;
  const tagHit = tags.split('\n').filter(t => t.trim() === pkg.version || t.trim() === 'v' + pkg.version).length;
  if (commitHit + tagHit < 1) throw new Error(`git log/tag 未命中 ${pkg.version}（commit ${log.split('\n').length} 条，tag ${tags.split('\n').length} 条）`);
});

// ─── I-4: fuser 无 2>/dev/null 藏错 + PORT 数字守卫 ───
t('I4: fuser 命令不再含 2>/dev/null 藏错', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const fuserIdx = src.indexOf('fuser -k');
  if (fuserIdx < 0) throw new Error('fuser 命令未找到');
  const block = src.slice(fuserIdx - 200, fuserIdx + 300);
  if (block.includes('2>/dev/null')) throw new Error('fuser 仍藏错 2>/dev/null');
});

t('I4: fuser 前有 PORT 数字守卫', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const fuserIdx = src.indexOf('fuser -k');
  const block = src.slice(fuserIdx - 500, fuserIdx);
  if (!block.includes('/^\\d+$/.test(String(PORT))')) throw new Error('PORT 数字守卫缺失');
});

// ─── I-5: 文档与代码一致性 ───
t('I5: SKILL.md 版本与 package.json 对齐', () => {
  const skill = fs.readFileSync(path.join(PROJECT_ROOT, 'SKILL.md'), 'utf-8');
  const pkg = require('../package.json');
  const m = skill.match(/version:\s*"([^"]+)"/);
  if (!m || m[1] !== pkg.version) throw new Error(`SKILL.md ${m?.[1]} != package.json ${pkg.version}`);
});

t('I5: SECURITY.md 不把不存在的代码沙箱描述为当前能力', () => {
  const sec = fs.readFileSync(path.join(PROJECT_ROOT, 'SECURITY.md'), 'utf-8');
  if (!sec.includes('discrimination')) throw new Error('SECURITY.md 未描述辨别引擎定位');
  // 允许提及 code-executor.js，但必须是"not present/历史可选"语境，不能描述为当前能力
  if (sec.includes('code-executor.js') && !sec.includes('not present in this build') && !sec.includes('NOT included in this build')) {
    throw new Error('SECURITY.md 提及 code-executor.js 但未标注为不存在/历史能力');
  }
  // 不能把沙箱描述为当前活跃能力
  if (sec.includes('Used by the sandbox to **run user code')) {
    throw new Error('SECURITY.md 仍把沙箱描述为当前能力');
  }
});

t('I6: SECURITY.md 沙箱表与 no-code-sandbox 声明一致', () => {
  const sec = fs.readFileSync(path.join(PROJECT_ROOT, 'SECURITY.md'), 'utf-8');
  if (!sec.includes('has no code sandbox')) throw new Error('缺少 no code sandbox 声明');
  const table = sec.split('### What gets flagged')[1] || '';
  if (!table.includes('not present in this build')) {
    // 允许整体描述一致：若仍描述沙箱为"当前能力"则矛盾
    if (table.includes('Used by the sandbox to **run user code')) {
      throw new Error('SECURITY.md 沙箱表仍把历史沙箱描述为当前能力');
    }
  }
});

// ─── I-2: tools/call 中央参数校验 ───
t('I2: tools/call 含中央参数 schema 校验', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  if (!src.includes('[AUDIT-FIX I-2]')) throw new Error('I-2 校验标记缺失');
  if (!src.includes('let { name, arguments: args = {} }')) throw new Error('args 未改为 let 可重赋值');
});

t('I2: TOOLS 工具定义均含 inputSchema.properties', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp', 'tools-registry.js'), 'utf-8');
  const toolsStart = src.indexOf('const TOOLS = [');
  const toolsEnd = src.indexOf('];', toolsStart);
  const block = src.slice(toolsStart, toolsEnd);
  if (!block.includes('inputSchema')) throw new Error('TOOLS 缺 inputSchema');
  if (!block.includes('properties')) throw new Error('TOOLS 缺 properties');
});

// ─── P1-4: 错误信息收敛 ───
t('P14: 错误返回含路径收敛标记', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  if (!src.includes('[AUDIT-FIX P1-4]')) throw new Error('P1-4 收敛逻辑缺失');
  if (!src.includes('[path]')) throw new Error('路径收敛替换缺失');
});

console.log(`\n安全审计回归: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
