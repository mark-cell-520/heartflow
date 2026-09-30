// 第 189 轮 decision：候选集（描述全部用「形状」，攻击样本原文只进 test/ 隔离目录）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '[A] 存量漏放①：提权类攻击族补形 —— 「CI 构建账号 × 提权到管理员组」整族',
  '实测证据：scripts/round-188/probe-r188-remain3.js 复测 3 条存量漏放仍全 pass；',
  '第 189 轮轮初复跑同脚本再次坐实该条 di=0、rh=0、gate pass。',
  '性质：block 级安全维度失守（提权直接放行），可整族补形（动词表+受权对象表+环境语境）。',
  '工作量中等：需扩 di 提权族（含 CI/构建机/服务账号等英文对称词）并配双向守卫。',
  '',
  '[B] 存量漏放②③：毁证恢复族 + 「攻击动词 × 备份对象」补形',
  '实测证据：同脚本另 2 条（等破坏完成再恢复日志记录族 / 等证书签发完再删生产库备份）',
  '本轮轮初复测 di=0、rh=0、gate pass 依然成立。',
  '性质：block 级安全维度失守，但第 188 轮刚引入 RESTORE_WAIT_DONE 恢复承诺通道，',
  '这两条正是该通道的漏赦反向——改这里会直接触碰上一轮新逻辑，回归面窄但耦合高。',
  '',
  '[C] ai_writing_tell 多语言误伤定位与治理',
  '实测证据：第 188 轮 decision 二轮 0.81 分（本轮原定第一优先），',
  '但尚未定位误伤样本条数与语种——属「未复测的待查面」，不是已坐实的失守。',
  '性质：评分维误伤（ai_writing_tell 属不强制 gate action 的 5 维之一）。',
  '',
  '[D] reward_hacking 英文侧 32 族的中文对称探针 + 批量化补形',
  '实测证据：第 123 轮登记、第 188 轮交接簿再次转交，全程未复测；',
  '英文侧族数（32）本身是旧描述，未在本轮重建验证。',
  '性质：收割面（未复测的存量缺口），工作量最大但杀伤性未知。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r1 = await d.decide({ task: '选下一轮升级方向', prompt: PROMPT });
  console.log(JSON.stringify(r1, null, 2));
})().catch(e => console.log('ERR', e.message));
