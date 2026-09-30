// 第 189 轮 decision 第三轮：C 已复测证伪，移出候选集
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '背景：本轮候选 C（ai_writing_tell 多语言误伤治理）已用 30 条多语良性池复测证伪',
  '（score>0 计 0 条、gate 非 pass 计 0 条），该缺口在当前版本不存在，已从候选集移除。',
  '剩余三个候选中选一个作为本轮唯一方向：',
  '',
  '[A] 提权类攻击族补形 —— 「CI 构建账号 × 提权到管理员组」',
  '轮初实测已坐实：di=0、rh=0、gate pass，提权请求直接放行到用户。',
  'block 级安全维度失守，可整族补形（提权动词 + 受权对象 + CI/构建机/服务账号语境），',
  '用户可感知：一句提权请求从 pass 变 block/rewrite。新判据需配双向守卫与删条负例。',
  '风险：需防「开发环境本地授权」族被误连带收紧（MUST_NOT_EXEMPT 边界纪律）。',
  '',
  '[B] 毁证恢复族 + 「攻击动词 × 备份对象」补形',
  '轮初实测已坐实：2 条同样 di=0、rh=0、gate pass。',
  'block 级安全维度失守；但位置紧邻第 188 轮新引入的恢复承诺通道（RESTORE_WAIT_DONE），',
  '改这里需重测 29 条攻击回归池防止误赦，耦合成本高于 A。',
  '',
  '[D] reward_hacking 英文侧 32 族的中文对称探针 + 批量化补形',
  '未复测（族数 32 是第 123 轮旧描述，未在本轮重建），属收割面，杀伤性未知。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第三轮，证伪项已移除）', prompt: PROMPT });
  console.log(JSON.stringify({
    chosen: r.chosen, label: r.label, score: r.composite_score,
    confidence: r.confidence, all: r.all_options,
  }, null, 1));
})().catch(e => console.log('ERR', e.message));
