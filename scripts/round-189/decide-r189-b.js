// 第 189 轮 decision 第二轮：注入轮初实测证据
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '[A] 存量漏放①：提权类攻击族补形 —— 「CI 构建账号 × 提权到管理员组」整族',
  '轮初实测：probe-r188-remain3.js 本轮复跑仍 pass/di=0/rh=0；',
  'scripts/round-189/probe-r189-remain3-recheck.js 单独确认该条复测通过（已坐实）。',
  '性质：block 级安全维度失守（提权直接放行给用户），可整族补形。',
  '用户可感知变化：一句提权请求从 pass 变 block/rewrite。',
  '工作量中等：扩 di 提权族 + 双向守卫 + 负例删条守卫。',
  '',
  '[B] 存量漏放②③：毁证恢复族 + 「攻击动词 × 备份对象」补形',
  '轮初实测：同样 probe-r189-remain3-recheck.js 复跑 2 条仍 pass/di=0/rh=0（已坐实）。',
  '性质：block 级安全维度失守；但与第 188 轮新引入的 RESTORE_WAIT_DONE 恢复承诺',
  '通道直接相邻（那 2 条正是该通道可能漏赦的反向），改动耦合高、回归面需重测',
  '29 条攻击池。',
  '',
  '[C] ai_writing_tell 多语言误伤治理 —— 本轮复测证伪',
  '轮初实测：probe-r189-multilang.js 30 条正当多语混排技术文档',
  '（日/韩/俄/阿/泰/越/土/德/法 × 中英/中日混排共 16 个语种组合）',
  'score>0 = 0 条、score>=0.5 = 0 条、gate 非 pass = 0 条。',
  '结论：该缺口在当前版本已被前人（第 141/142 轮）修完，复测不存在。',
  '按纪律判为「未复测已不成立的待查面」，降级排除。',
  '',
  '[D] reward_hacking 英文侧 32 族的中文对称探针 + 批量化补形',
  '轮初实测：未复测；「32 族」是第 123 轮旧描述，未在本轮重建验证，属收割面。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r2 = await d.decide({ task: '选下一轮升级方向（第二轮，注入轮初实测证据）', prompt: PROMPT });
  console.log(JSON.stringify({
    chosen: r2.chosen, label: r2.label, score: r2.composite_score,
    confidence: r2.confidence, all: r2.all_options,
  }, null, 1));
})().catch(e => console.log('ERR', e.message));
