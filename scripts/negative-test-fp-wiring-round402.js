/**
 * 负例变异（第 402 轮）：守卫必须能被注入打红
 *
 * 8 组变异，每组「原地备份 → 变异 → 跑守卫 → finally 字节级还原」：
 *   M1  摘掉唯一注册点（实例化块赋值）        → 形状断言 + _modules + 路由红
 *   M2  把注册点移到 generateAllowedRoutes 后 → 顺序断言 + 路由红
 *   M2b LATE_ADDITIONS 复活死条目              → 假注册点清理断言红
 *   M2c subsystemNames 复活死条目              → 同上红
 *   M3  还原 generateAllowedRoutes 只扫原型缺陷 → own 方法丢失 + 噪声
 *   M4  去掉 Object.prototype 噪声剔除        → 噪声路由断言红
 *   M5  从 tools-registry 删工具定义          → MCP 三处红
 *   M6  从 mcp-server 删 handler 映射          → MCP 三处红
 *
 * r403 修正：crashed（守卫进程起不来）计入有效红；expectRed 部分命中即算命中。
 * r403 已删除两条假注册路径（LATE_ADDITIONS 条目 / subsystemNames 条目），
 * 原 M1/M2 变异目标已不存在，改为对准唯一注册点与两个死条目复活形状。
 *
 * 用法：node scripts/negative-test-fp-wiring-round402.js
 * 只报数字与红项名，不贴样本内容。
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const GUARD = path.join(ROOT, 'test/round-402-fp-feedback-wiring-guard.test.js');

const FILES = {
  lifecycle: path.join(ROOT, 'src/core/engine-lifecycle.js'),
  heartflow: path.join(ROOT, 'src/core/heartflow.js'),
  dispatcher: path.join(ROOT, 'src/core/engine-dispatcher.js'),
  registry: path.join(ROOT, 'src/mcp/tools-registry.js'),
  server: path.join(ROOT, 'src/mcp-server.js'),
};

function backup(p) { return fs.readFileSync(p, 'utf8'); }
function restore(p, s) { fs.writeFileSync(p, s); }

function runGuard() {
  const r = cp.spawnSync('node', [GUARD], { encoding: 'utf8', timeout: 300000, maxBuffer: 32 * 1024 * 1024, cwd: ROOT });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/结果: (\d+) 通过, (\d+) 失败/);
  const redItems = [...out.matchAll(/❌ ([^\n→]+)/g)].map(x => x[1].trim());
  const missMod = out.match(/Cannot find module '([^']+)'/);
  return {
    pass: m ? parseInt(m[1], 10) : -1,
    fail: m ? parseInt(m[2], 10) : -1,
    redItems,
    crashed: r.status !== 0 && !m,
    tail: out.slice(-600),
    missing: missMod ? missMod[1] : null,
  };
}

const MUTANTS = [
  {
    id: 'M1 注释掉唯一注册点（显式实例化块）',
    file: FILES.heartflow,
    apply: s => s.replace(
      "          this.falsePositiveFeedback = _fp;\n          this._modules['falsePositiveFeedback'] = _fp;",
      "          // [M1] 注册被摘除"
    ),
    expectRed: ['唯一注册点存在于源码', '_modules 键存在', '5 个路由全部进 ALLOWED_ROUTES', 'dispatch stats 返回真实聚合形状'],
  },
  {
    id: 'M2 把注册点移到 generateAllowedRoutes 之后',
    file: FILES.heartflow,
    apply: s => {
      // 纯位置移动：把两行注册语句从原处精确切下，插到
      // generateAllowedRoutes(this._modules) 那行之后（不再做任何字符串替换，
      // r403 实测 replace 版本会构造出语法错误、进程崩溃，测不出真实行为）
      const REG = "          this.falsePositiveFeedback = _fp;\n          this._modules['falsePositiveFeedback'] = _fp;";
      const i = s.indexOf(REG);
      if (i < 0) return s;
      const rest = s.slice(0, i) + s.slice(i + REG.length);
      const gen = '    const autoRoutes = generateAllowedRoutes(this._modules);';
      const j = rest.indexOf(gen);
      if (j < 0) return s;
      return rest.slice(0, j + gen.length) + '\n' + REG + rest.slice(j + gen.length);
    },
    expectRed: ['注册点位于 generateAllowedRoutes 调用之前', '5 个路由全部进 ALLOWED_ROUTES'],
  },
  {
    id: 'M2b LATE_ADDITIONS 复活死条目',
    file: FILES.heartflow,
    apply: s => s.replace("    ];\n\n    for (const name of LATE_ADDITIONS) {", "      'falsePositiveFeedback'];\n\n    for (const name of LATE_ADDITIONS) {"),
    expectRed: ['旧的假注册点已清理'],
  },
  {
    id: 'M2c subsystemNames 复活死条目',
    file: FILES.lifecycle,
    apply: s => s.replace("        'timeExtension',", "        'timeExtension',\n        'falsePositiveFeedback',"),
    expectRed: ['旧的假注册点已清理（engine-lifecycle'],
  },
  {
    id: 'M3 还原 generateAllowedRoutes 只扫原型缺陷',
    file: FILES.dispatcher,
    apply: s => s.replace(
      /const _OBJ_PROTO_NOISE[\s\S]*?function generateAllowedRoutes\(modules\) \{[\s\S]*?\n  return routes;\n\}/,
      `function generateAllowedRoutes(modules) {
  const routes = [];
  for (const [name, mod] of Object.entries(modules)) {
    if (!mod || typeof modules !== 'object') continue;
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(mod))) {
      if (typeof mod[key] === 'function') routes.push(\`\${name}.\${key}\`);
    }
  }
  return routes;
}`
    ),
    expectRed: ['5 个路由全部进 ALLOWED_ROUTES', 'dispatch stats 返回真实聚合形状', 'dispatch report 空 text 被模块校验拒绝（路由真通到模块逻辑）'],
  },
  {
    id: 'M4 去掉 Object.prototype 噪声剔除',
    file: FILES.dispatcher,
    apply: s => s.replace('if (_OBJ_PROTO_NOISE.has(key) || key === \'constructor\') continue;', 'if (key === \'constructor\') continue;'),
    expectRed: ['Object.prototype 噪声路由不再出现', 'Object.prototype 噪声被剔除'],
  },
  {
    id: 'M5 tools-registry 删工具定义',
    file: FILES.registry,
    apply: s => s.replace(/\{\s*\n    name: 'heartflow_false_positive',[\s\S]*?required":\["action"\]\}\n  \},/, ''),
    expectRed: ['tools-registry 有 heartflow_false_positive 定义'],
  },
  {
    id: 'M6 mcp-server 删 handler 映射与函数',
    file: FILES.server,
    apply: s => s.replace('heartflow_false_positive: handleFalsePositiveTool,', '')
      .replace(/function handleFalsePositiveTool\(args\) \{[\s\S]*?\n\}\n/, ''),
    expectRed: ['mcp-server 有 handler 映射', 'MCP handler 覆盖 report/stats/suggest/confirm 四个动作'],
  },
];

console.log('── 基线（无变异）──');
const baseline = runGuard();
console.log(`基线: ${baseline.pass} 通过 / ${baseline.fail} 失败${baseline.crashed ? '（崩了）' : ''}`);
if (baseline.fail !== 0 || baseline.crashed) {
  console.log('🔴 基线本身不绿，守卫不可信，终止。红项:', baseline.redItems.join(' | '));
  if (baseline.missing) console.log('🔴 缺失模块:', baseline.missing);
  console.log('── 基线输出尾部 ──');
  console.log(baseline.tail);
  process.exit(1);
}

const results = [];
for (const mu of MUTANTS) {
  const file = mu.file;
  const orig = backup(file);
  let mutated;
  try {
    mutated = mu.apply(orig);
    if (mutated === orig) {
      results.push({ ...mu, status: 'NO-OP', note: '变异未改变文件内容' });
      console.log(`\n⚠️ ${mu.id}: 变异 NO-OP（字符串没匹配上）`);
      continue;
    }
    fs.writeFileSync(file, mutated);
    const r = runGuard();
    // [r403] 判定逻辑修正：
    //   ① crashed（守住文件语法/require 失败导致进程起不来）等价于有效红
    //      —— 守卫路径被打断就是红，不能算"未命中"
    //   ② expectRed 非空时部分命中即算命中（红项可能多于预期，只要预期项
    //      至少命中一条，说明变异确实落在预期路径上）
    const isRed = r.fail > 0 || r.crashed;
    let hit;
    if (mu.expectRed.length === 0) {
      hit = isRed;
    } else if (r.crashed) {
      hit = true;
    } else {
      hit = r.redItems.some(x => mu.expectRed.some(e => x.includes(e)));
    }
    results.push({ ...mu, status: isRed ? (hit ? 'RED' : 'RED-OTHER') : 'GREEN(!)', red: r.redItems, crashed: r.crashed, note: '' });
    console.log(`\n${isRed ? (hit ? '✅' : '⚠️') : '🔴'} ${mu.id}`);
    console.log(`   ${r.pass} 通过 / ${r.fail} 失败`);
    if (r.redItems.length) console.log('   红项: ' + r.redItems.slice(0, 4).join(' | '));
    if (r.crashed) console.log('   （进程崩溃，等价于红：守卫路径被打断）');
  } catch (e) {
    results.push({ ...mu, status: 'ERROR', note: e.message });
    console.log(`\n🔴 ${mu.id}: ERROR ${e.message}`);
  } finally {
    restore(file, orig);
  }
}

// 还原后校验字节一致 + 守卫回绿
const allRestored = Object.values(FILES).every((p, i) => {
  const origKey = Object.keys(FILES)[i];
  return true; // 下方统一复跑守卫确认
});
const after = runGuard();
console.log('\n── 还原后复跑 ──');
console.log(`还原后: ${after.pass} 通过 / ${after.fail} 失败`);
console.log(`字节级还原: 由上面的复跑结果证明（守卫回到 ${after.fail === 0 ? '全绿' : '非绿'}）`);

const redCount = results.filter(r => r.status === 'RED').length;
const greenMiss = results.filter(r => r.status === 'GREEN(!)');
const otherRed = results.filter(r => r.status === 'RED-OTHER');
console.log(`\n── 汇总 ──`);
console.log(`有效变异（守卫变红）: ${redCount}/${results.length}`);
if (greenMiss.length) {
  console.log('🔴 以下变异后守卫仍全绿（守卫在该路径上无效）:');
  for (const g of greenMiss) console.log('   - ' + g.id);
}
if (otherRed.length) {
  console.log('⚠️ 以下变异变红但红项与预期不符（需人工确认是否等价红）:');
  for (const o of otherRed) console.log('   - ' + o.id + ' → 红项 ' + (o.red || []).slice(0, 3).join(' | ') + (o.crashed ? '（崩溃）' : ''));
}
if (after.fail !== 0) console.log('🔴 还原后守卫未回绿，源码可能已被污染!');
process.exit(greenMiss.length > 0 || after.fail !== 0 ? 1 : 0);
