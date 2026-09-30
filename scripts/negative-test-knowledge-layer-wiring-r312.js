/**
 * 第 312 轮负例：注入四种退化，守卫必须变红
 *
 * 用法: node scripts/negative-test-knowledge-layer-wiring-r312.js
 * 结束自动还原，还原后守卫应复绿。
 *
 * 注入项：
 *   ① 摘掉 heartflow.js 的 lazy 注册行
 *   ② 摘掉 start() 里的实例化语句
 *   ③ 摘掉 engine-lifecycle.js 的 'knowledgeLayer' 白名单登记
 *   ④ 给目标模块打「已合并」免责注释（triality-memory 形态复活）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HF = path.join(ROOT, 'src', 'core', 'heartflow.js');
const LC = path.join(ROOT, 'src', 'core', 'engine-lifecycle.js');
const KL = path.join(ROOT, 'src', 'archive', 'knowledge-layer.js');
const GUARD = path.join(ROOT, 'test', 'knowledge-layer-wiring-round312.test.js');

const backup = {};
function save(p) { if (!(p in backup)) backup[p] = fs.readFileSync(p, 'utf8'); }
function restore() { for (const [p, c] of Object.entries(backup)) fs.writeFileSync(p, c); }

function runGuard() {
  try {
    const out = execFileSync('node', [GUARD], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/(\d+)\s*通过,\s*(\d+)\s*失败/);
    return { ok: true, passed: m ? parseInt(m[1], 10) : -1, failed: m ? parseInt(m[2], 10) : -1 };
  } catch (e) {
    const o = (e.stdout || '') + '';
    const m = o.match(/(\d+)\s*通过,\s*(\d+)\s*失败/);
    return { ok: false, passed: m ? parseInt(m[1], 10) : -1, failed: m ? parseInt(m[2], 10) : -1, tail: o.slice(-400) };
  }
}

function inject(name, files, fn, expectFail) {
  save(HF); save(LC); save(KL);
  fn();
  const r = runGuard();
  const caught = !r.ok && r.failed >= expectFail;
  console.log((caught ? '  ✅ ' : '  ❌ ') + name);
  console.log('      守卫: ' + (r.ok ? '全绿(未被抓到!)' : r.passed + ' 通过 / ' + r.failed + ' 失败') +
    '  | 预期至少 ' + expectFail + ' 个失败');
  restore();
  return caught;
}

console.log('=== 第 312 轮负例注入 ===\n');
let allCaught = true;

// ① 摘 lazy 注册行
allCaught &= inject('① 摘 heartflow.js 的 _KnowledgeLayer lazy 注册', null, () => {
  let s = fs.readFileSync(HF, 'utf8');
  s = s.replace(/const _KnowledgeLayer = _lazy\('knowledgeLayer'[^\n]*\n/, '');
  fs.writeFileSync(HF, s);
}, 1);

// ② 摘实例化
allCaught &= inject('② 摘 start() 里的 this.knowledgeLayer 实例化', null, () => {
  let s = fs.readFileSync(HF, 'utf8');
  s = s.replace(/this\.knowledgeLayer = new \(_KnowledgeLayer\(\)\.KnowledgeLayer\)\(\{[\s\S]*?\}\);\n/, '');
  fs.writeFileSync(HF, s);
}, 2);

// ③ 摘白名单登记
allCaught &= inject("③ 摘 engine-lifecycle.js 的 'knowledgeLayer' 登记", null, () => {
  let s = fs.readFileSync(LC, 'utf8');
  s = s.replace(/'memory', 'knowledge', 'knowledgeLayer',/, "'memory', 'knowledge',");
  fs.writeFileSync(LC, s);
}, 1);

// ④ 伪装已合并（triality 形态）
allCaught &= inject('④ 给目标模块打「已合并」免责注释', null, () => {
  let s = fs.readFileSync(KL, 'utf8');
  s = '// knowledge-layer.js 已合并到 meaningful-memory.js，本文件保留仅为兼容\n' + s;
  fs.writeFileSync(KL, s);
}, 1);

restore();
const after = runGuard();
console.log('\n还原后守卫: ' + (after.ok ? after.passed + ' 通过 / ' + after.failed + ' 失败（已复绿）' : '仍红: ' + after.failed));
console.log(allCaught && after.ok ? '\n✅ 4/4 注入全部被守卫抓到，还原后复绿' : '\n❌ 存在漏抓或还原失败');
process.exit(allCaught && after.ok ? 0 : 1);
