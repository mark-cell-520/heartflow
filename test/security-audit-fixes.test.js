/**
 * 安全审计修复守护测试
 *
 * 来源：2026-10-10 技能库全面安全审计（716 技能 / 12,325 文件）。
 * 审计判定 789 条静态扫描命中中：误报 ~409、设计使然 ~340、低风险 20、
 * 待人工确认 5、真风险 15。本测试锁定其中已修复的 10 项，防止回归。
 *
 * 为什么需要这个测试：这些修复分散在 5 个不同技能的 12 个文件里，
 * 没有任何单一测试覆盖它们。没有守护的话，下一次"顺手清理"或
 * 自动 commit 就可能把修复改回去（例如把 --no-verify 加回来）。
 *
 * 运行：node test/security-audit-fixes.test.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '..');
const SKILLS = '/root/.hermes/skills';

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

console.log('\n═══════ 安全审计修复守护 ═══════');

// ─────────────────────────────────────────────────────────────
// #2 [高] test/ 不得读仓库 .env —— package.json 的 files 含 test/，
//      读 .env 的代码会随 npm 包分发，在安装者机器上读到他们的凭据。
// ─────────────────────────────────────────────────────────────
console.log('\n#2 test/ 不读 .env（npm 包分发面）');
t('mcp-auth-tier.test.js 从环境变量取 token', () => {
  const s = read(path.join(HF, 'test/mcp-auth-tier.test.js'));
  assert(s.includes('process.env.MCP_HEARTFLOW_KEY'), '未从 env 取 token');
  assert(!/readFileSync\([^)]*\.env/.test(s), '仍在读 .env');
});
t('mcp-robustness.test.js 从环境变量取 token', () => {
  const s = read(path.join(HF, 'test/mcp-robustness.test.js'));
  assert(s.includes('process.env.MCP_HEARTFLOW_KEY'), '未从 env 取 token');
  assert(!/readFileSync\([^)]*\.env/.test(s), '仍在读 .env');
});

// ─────────────────────────────────────────────────────────────
// #6/#9 [中] 不得教 AI 用 --no-verify / --force 绕过 hook
// ─────────────────────────────────────────────────────────────
console.log('\n#6/#9 无 git push --no-verify 教学');
t('全库无实际 git push/pull --no-verify 命令', () => {
  // 用 grep -rn 扫，排除：归档、审计工具自身、测试样本、以及"说明不要用"的警告文字
  let out = '';
  try {
    out = execFileSync('grep', [
      '-rn', '-E', 'git (push|pull).*--no-verify',
      '--include=*.md', '--include=*.sh', '--include=*.js', '--include=*.py',
      SKILLS,
    ], { encoding: 'utf8', timeout: 120000 });
  } catch (e) {
    out = (e.stdout || '').toString(); // grep 无匹配时 exit 1
  }
  const hits = out.split('\n').filter(Boolean).filter(l =>
    !l.includes('/.archive/') &&
    !l.includes('security-audit') &&
    !l.includes('tob-sharp-edges') &&
    !l.includes('/scripts/round') &&
    !l.includes('/test/') &&
    !l.includes('不要一律') && !l.includes('先查 hook') && !l.includes('修 hook') &&
    !l.includes('不要用') && !l.includes('⚠️') && !l.includes('绕过所有'));
  assert(hits.length === 0, `仍有 ${hits.length} 处:\n${hits.slice(0, 5).join('\n')}`);
});
t('heartflow-audit-upgrade-push 无 token 明文占位', () => {
  const s = read(path.join(HF, 'skills/heartflow-audit-upgrade-push/SKILL.md'));
  assert(!s.includes('token ***'), '仍有 token 占位符');
  assert(s.includes('${GITHUB_TOKEN}'), '未改为环境变量形式');
});

// ─────────────────────────────────────────────────────────────
// #7 [中] 密钥文件权限 600
// ─────────────────────────────────────────────────────────────
console.log('\n#7 密钥文件权限');
t('memory/.aes-key 权限 600', () => {
  const m = fs.statSync(path.join(HF, 'memory/.aes-key')).mode & 0o777;
  assert(m === 0o600, `权限是 ${m.toString(8)}`);
});
t('memory/.qtable-hmac-key 权限 600', () => {
  const m = fs.statSync(path.join(HF, 'memory/.qtable-hmac-key')).mode & 0o777;
  assert(m === 0o600, `权限是 ${m.toString(8)}`);
});
t('memory-encrypt.js 有 chmod 自愈（mode 只在创建时生效）', () => {
  const s = read(path.join(HF, 'src/memory/memory-encrypt.js'));
  assert(s.includes('chmodSync'), '缺 chmodSync 自愈');
});
t('self-healing-rl.js 有 chmod 自愈', () => {
  const s = read(path.join(HF, 'src/cortex/self-healing-rl.js'));
  assert(s.includes('chmodSync'), '缺 chmodSync 自愈');
});

// ─────────────────────────────────────────────────────────────
// #8 [中] 版本号校验 + rm -rf 加引号
// ─────────────────────────────────────────────────────────────
console.log('\n#8 版本号守卫');
t('upgrade-engine.js 校验 VERSION 语义化格式', () => {
  const s = read(path.join(HF, 'scripts/upgrade-engine.js'));
  assert(s.includes('不是合法语义化版本号'), '缺版本号校验');
  assert(/\\d\+\\\.\\d\+\\\.\\d\+/.test(s), '缺版本号正则');
});
t('upgrade-engine.js 的 rm -rf 已加引号', () => {
  const s = read(path.join(HF, 'scripts/upgrade-engine.js'));
  assert(s.includes('trySh(`rm -rf "${vdir}"`)'), 'rm -rf 未加引号');
});

// ─────────────────────────────────────────────────────────────
// #12 [中] MCP server 认证 fail-closed
// ─────────────────────────────────────────────────────────────
console.log('\n#12 MCP 认证 fail-closed');
t('mcp-server.js 无 token 拒绝启动', () => {
  const s = read(path.join(HF, 'src/mcp-server.js'));
  assert(s.includes('Refusing to start'), '缺拒绝启动逻辑');
  assert(s.includes('process.exit(1)'), '缺 exit(1)');
});
t('mcp-server.js 无自动生成 token 分支', () => {
  const s = read(path.join(HF, 'src/mcp-server.js'));
  assert(!s.includes('Auto-generated ephemeral token'), '自动生成分支仍在');
});
t('mcp-server.js 与 mcp-server-http.js 策略一致', () => {
  const a = read(path.join(HF, 'src/mcp-server.js'));
  const b = read(path.join(HF, 'mcp/mcp-server-http.js'));
  assert(a.includes('process.exit(1)') && b.includes('process.exit(1)'),
    '两个入口策略不一致');
});

// ─────────────────────────────────────────────────────────────
// #13 [低] agent-manager 硬编码删除 → 参数化
// ─────────────────────────────────────────────────────────────
console.log('\n#13 agent-manager 参数化');
t('cp -r + rm -rf 已参数化为 $SRC/$DST', () => {
  const p = path.join(SKILLS, 'agent-manager/SKILL.md');
  if (!exists(p)) return; // 技能未安装则跳过
  const s = read(p);
  const n = (s.match(/DST=claude11/g) || []).length;
  assert(n >= 2, `仅 ${n} 处参数化`);
});
t('删除前有回显确认', () => {
  const p = path.join(SKILLS, 'agent-manager/SKILL.md');
  if (!exists(p)) return;
  const s = read(p);
  const n = (s.match(/确认继续？/g) || []).length;
  assert(n >= 2, `仅 ${n} 处确认`);
});

// ─────────────────────────────────────────────────────────────
// #14 [低] TLS 校验开关
// ─────────────────────────────────────────────────────────────
console.log('\n#14 TLS 校验可控');
t('rss_parser.py 有 NEWS_RSS_VERIFY_TLS 开关', () => {
  const p = path.join(SKILLS, 'news-aggregator/scripts/rss_parser.py');
  if (!exists(p)) return;
  const s = read(p);
  assert(s.includes('NEWS_RSS_VERIFY_TLS'), '缺 TLS 开关');
  assert(/^import os$/m.test(s), '缺 import os（运行时才 NameError）');
});

// ─────────────────────────────────────────────────────────────
// #15 [低] 条件求值白名单（不用 eval）
// ─────────────────────────────────────────────────────────────
console.log('\n#15 条件求值白名单');
t('subagent_orchestrator.py 不用 eval 求值条件', () => {
  const p = path.join(SKILLS, '@clawhub_q7766206/character-profile-cn/scripts/subagent_orchestrator.py');
  if (!exists(p)) return;
  const s = read(p);
  assert(!/return eval\(condition/.test(s), 'eval 仍在');
  assert(s.includes('_eval_condition_safely'), '缺白名单求值');
  assert(/^import re$/m.test(s), '缺 import re');
});

// ─────────────────────────────────────────────────────────────
// #3 [高] quarkclouddrive 完整性校验
// ─────────────────────────────────────────────────────────────
console.log('\n#3 quarkclouddrive 完整性校验');
t('install.sh 有 sha256 校验关卡', () => {
  const p = path.join(SKILLS, 'quarkclouddrive/scripts/install.sh');
  if (!exists(p)) return;
  const s = read(p);
  const n = (s.match(/EXPECTED_ZIP_SHA256/g) || []).length;
  assert(n >= 4, `校验接线仅 ${n} 处`);
  assert(s.includes('sha256sum') || s.includes('shasum'), '缺哈希工具调用');
  assert(s.includes('校验失败'), '缺失败分支');
});

console.log(`\n═══════════════════════════`);
console.log(`安全审计修复守护: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail ? 1 : 0);
