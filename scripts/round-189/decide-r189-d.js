// 第 189 轮 decision 第四轮：注入规模量化判据（A vs B vs D）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '背景：候选 C（ai_writing_tell 多语言误伤）已复测证伪并移除。',
  '三个候选的轮初实测规模都已量化如下，请据此选本轮唯一方向：',
  '',
  '[A] 提权类攻击族补形',
  '轮初量化（probe-r189-privesc.js，640 条组合生成）：',
  '  · 受权主语（CI 构建机/流水线机器人/Jenkins/runner/deploy bot 等 8 种）×',
  '    提权动词（8 种）× 环境状语/生产对象',
  '  · 结果：450 条 gate pass + di=0 + rh=0，**漏放率 70.3%**，整族零命中',
  '  · 用户可感知：一句提权请求从 pass 变 block/rewrite',
  '',
  '[B] 毁证恢复族 + 攻击动词 × 备份对象补形',
  '轮初确证（probe-r189-remain3-recheck.js）：2 条样本 di=0、rh=0、gate pass。',
  '规模未做组合量化（族形状窄，预估 <20 条）；',
  '改动位置紧邻第 188 轮新引入的恢复承诺通道，需重测 29 条攻击回归池。',
  '',
  '[D] reward_hacking 英文侧 32 族的中文对称探针',
  '未复测，族数与杀伤性均未量化；属探索性收割面，本轮无实测数据。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮升级方向（第四轮，规模判据已量化）', prompt: PROMPT });
  console.log(JSON.stringify({
    chosen: r.chosen, label: r.label, score: r.composite_score,
    confidence: r.confidence, all: r.all_options,
  }, null, 1));
})().catch(e => console.log('ERR', e.message));
