// r643 负例守卫：platformAdapter 接线若被退回，本测试必须变红。
// 口径：① 实例在 _modules ② 5 条路由全部 ALLOWED ③ 白名单三分支
// （合法读放行 / 越界读 path_not_allowed / 越界写 path_not_allowed）
// ④ 删块注入负例：把 _isPathAllowed 置空后越界读必须表现异常（不再是 path_not_allowed）
const path = require('path');
const fs = require('fs');
const repo = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(repo, 'src/core/heartflow.js'));

const results = [];
function t(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
}

async function main() {
  const hf = new HeartFlow();
  try { hf.start(); } catch (e) { /* 启动告警不计入本测试 */ }

  // —— 接线面 ——
  t('实例存在', !!hf.platformAdapter);
  t('已进 _modules', Object.prototype.hasOwnProperty.call(hf._modules || {}, 'platformAdapter'));
  const ar = HeartFlow.ALLOWED_ROUTES || new Set();
  const expectRoutes = ['platformAdapter.sendMessage', 'platformAdapter.receiveInput',
    'platformAdapter.executeCode', 'platformAdapter.readFile', 'platformAdapter.writeFile'];
  let allowedCount = 0;
  for (const r of expectRoutes) if (ar.has(r)) allowedCount++;
  t('5 条路由全在 ALLOWED_ROUTES', allowedCount === 5, allowedCount + '/5');

  // —— 方法零 not-allowed、零内部故障 ——
  const inst = hf.platformAdapter;
  const pubs = Object.getOwnPropertyNames(Object.getPrototypeOf(inst))
    .filter(m => !m.startsWith('_') && m !== 'constructor' && typeof inst[m] === 'function');
  t('公有方法 ≥5', pubs.length >= 5, pubs.length + ' 个: ' + pubs.join(','));
  const na = [], other = [];
  for (const m of pubs) {
    try { const p = hf.dispatch('platformAdapter.' + m); if (p && p.catch) p.catch(() => {}); }
    catch (e) { /not allowed/.test(String(e.message)) ? na.push(m) : other.push(m + ':' + String(e.message).slice(0, 60)); }
  }
  t('零方法 route not allowed', na.length === 0, na.join(','));
  t('零内部故障', other.length === 0, other.join(','));

  // —— 白名单三分支 ——
  const root = hf.rootPath;
  t('rootPath 已赋到 adapter', inst.rootPath === root, 'inst=' + inst.rootPath);

  const r1 = await hf.dispatch('platformAdapter.readFile', path.join(root, 'package.json'));
  t('合法路径读放行', r1 && r1.success === true && typeof r1.content === 'string' && r1.content.length > 100,
    r1 ? 'success=' + r1.success + ' error=' + (r1.error || 'null') : 'no result');

  const r2 = await hf.dispatch('platformAdapter.readFile', '/etc/shadow');
  t('越界读 → path_not_allowed', r2 && r2.success === false && r2.error === 'path_not_allowed',
    r2 ? JSON.stringify({ error: r2.error, success: r2.success }) : 'no result');

  const r4 = await hf.dispatch('platformAdapter.writeFile', '/tmp/r643-neg-probe-should-not-exist.txt', 'x');
  t('越界写 → path_not_allowed', r4 && r4.success === false && r4.error === 'path_not_allowed',
    r4 ? JSON.stringify({ error: r4.error, success: r4.success }) : 'no result');
  t('越界写未落盘', !fs.existsSync('/tmp/r643-neg-probe-should-not-exist.txt'));

  const tmp = path.join(root, 'data', 'r643-write-probe.tmp');
  const r3 = await hf.dispatch('platformAdapter.writeFile', tmp, 'probe');
  t('合法路径写放行', r3 && r3.success === true, r3 ? JSON.stringify({ error: r3.error, success: r3.success }) : 'no result');
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

  // —— 删块注入负例：守卫必须能发现接线被退回 ——
  // 把 _isPathAllowed 置空后 readFile 会抛 TypeError（不是 path_not_allowed），
  // 若此处不报错，说明上面三分支断言抓不到「守卫失效」。
  const saved = inst._isPathAllowed;
  inst._isPathAllowed = undefined;
  let mutated = null;
  try { mutated = await hf.dispatch('platformAdapter.readFile', '/etc/shadow'); } catch (e) { mutated = { threw: e.message }; }
  inst._isPathAllowed = saved;
  t('删块负例：置空 _isPathAllowed 后越界读不再返回 path_not_allowed',
    !(mutated && mutated.error === 'path_not_allowed'),
    mutated ? (mutated.threw ? 'threw:' + mutated.threw : JSON.stringify({ error: mutated.error })) : 'no result');

  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass);
  console.log(JSON.stringify({ pass, fail: fail.length, total: results.length, failed: fail, all: results }, null, 1));
  process.exit(fail.length === 0 ? 0 : 1);
}
main().then(() => { }, e => { console.log('FATAL', e.message); process.exit(1); });
