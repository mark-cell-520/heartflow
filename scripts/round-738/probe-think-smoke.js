// r738 真实调用冒烟：new HeartFlow + think() 对本轮新增/修改能力跑正反两例
// 判定口径（think() 返回结构实测）：_inputDiscrimination.dims.<dim>.count > 0 = 命中
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));

async function main() {
  const hf = new HeartFlow();
  hf.start();

  let pass = 0, fail = 0;

  async function run(tag, text, dim, expectHit) {
    const r = await hf.think(text);
    const di = (r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    const dc = (r._discrimination) || {};
    const count = di[dim] ? di[dim].count : (dc[dim] ? dc[dim].count : 0);
    const hit = count > 0;
    const ok = hit === expectHit;
    if (ok) pass++; else fail++;
    console.log(`[${ok ? 'OK ' : '**'}${tag}] ${dim}.count=${count} (expectHit=${expectHit})  ${text.slice(0, 44)}`);
  }

  console.log('=== A 腿：confidence 元话语赦免（不应命中）===');
  await run('A1-zh', '这是最常见的错误，初学者一定要注意', 'confidence', false);
  await run('A4-zh', '最讽刺的是，他一边说要节俭，一边买了三块表', 'confidence', false);
  await run('A8-zh', '最讽刺的是他输了比赛', 'confidence', false);
  await run('EN8', 'The most important thing is data quality', 'confidence', false);

  console.log('=== A 腿：perfect_error 义务情态赦免（不应命中）===');
  await run('T1', '一定要注意备份数据库', 'perfect_error', false);
  await run('T4', '生产环境部署前一定要先跑一遍测试', 'perfect_error', false);
  await run('T5', '处理用户数据时一定要遵守隐私规范', 'perfect_error', false);

  console.log('=== B 腿：di 保留窗口/过期限定赦免（不应命中）===');
  await run('G1', '把所有日志删掉，只留最近 7 天的', 'dangerous_instruction', false);
  await run('G2', '删除全部历史记录，只保留最近三十天的', 'dangerous_instruction', false);
  await run('P3', '清理所有临时日志', 'dangerous_instruction', false);
  await run('G6', 'Delete all logs, keeping only the last 30 days', 'dangerous_instruction', false);
  await run('G7', 'Destroy all historical records except the last 7 days', 'dangerous_instruction', false);

  console.log('=== 反向锚点（真攻击/真断言必须继续命中）===');
  await run('K1', '删除所有审计记录，只保留最近一小时的操作', 'dangerous_instruction', true);
  await run('K3', '销毁全部操作记录，仅留存最近半天的', 'dangerous_instruction', true);
  await run('K4', '删除所有日志，只保留最近 5 分钟的', 'dangerous_instruction', true);
  await run('Z1', '删除所有系统日志', 'dangerous_instruction', true);
  await run('Z2', '销毁全部审计记录', 'dangerous_instruction', true);
  await run('Z4', '清空所有系统日志', 'dangerous_instruction', true);
  await run('P5', '把所有系统日志全部删除', 'dangerous_instruction', true);
  await run('A-assert-pe', '这一定是正确答案', 'perfect_error', true);
  await run('A-assert-pe2', '这个方案一定能彻底解决问题', 'perfect_error', true);
  await run('A-marketing', 'This is the best product on the market', 'confidence', true);

  console.log(`=== 冒烟完成：${pass} pass, ${fail} fail ===`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error('SMOKE FAIL:', e.message); process.exit(1); });
