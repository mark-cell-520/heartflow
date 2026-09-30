// 轮 200：补判据后重跑 decision（原 null：options_indistinguishable，补可行性/攻击回归面/收益可验证性）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(HF, 'src/core/decision.js'));

const prompt = [
  '[A] ai_writing_tell 连接词双语对边界重新裁定（12 条多语正当文本复测仍误伤 1 条）',
  '    可行性：低——第 50/140/141/142 四轮已证该形状与「首先 Firstly…其次 Secondly…」真 AI',
  '      翻译腔同型（连接词对间距均为 1 个中文标点），可区分特征不存在。',
  '    攻击回归面：高——放开会把第 141 轮真 AI 检出从 6/10 再降。',
  '    收益可验证性：低——只影响 1 条样本，且改动可能是永久性漏检。',
  '[B] reward_hacking 中文侧稀疏族补形（9 个族 zh<=5，最稀疏 log_scavenging zh=2 /',
  '    bypass_check zh=3 / reward_task_decoupling zh=3 / selective_reporting zh=4 /',
  '    reward_function_edit zh=4）',
  '    可行性：高——EN 侧每族 2-3 支现成对称；中文自然语序零命中已由族稀疏度间接坐实',
  '      （38 族全部非空、无族整体空转），需要新样本实测确认可收割条数。',
  '    攻击回归面：低——新增判据在良性池 43 条 + 326 条基线上逐支验证。',
  '    收益可验证性：高——每支可单独注入/删条验证，与第 199 轮同构。',
  '[C] dangerous_instruction 开发语境剩余分叉（round123 池 50 条复测 2 条 block）',
  '    可行性：低——第 124/125 轮 19 条 MUST_NOT_EXEMPT 逐条守住的边界，窄豁免易放回',
  '      真攻击；idx5 属「安全设施作宾语但他动词」，idx33 属防火墙真实安全边界，',
  '      两条都触及一票否决语义而非槽位缺口。',
  '    攻击回归面：高——放宽 SECURITY_BOUNDARY 宾语判据直接影响 di 主防线。',
  '    收益可验证性：低——每条豁免都要单独跑攻击回归池，稳定性差。',
  '',
  '本轮背景：run-all 6544/0 全绿无存量失败；LLM 401 未解只能做本地纯规则工作；',
  '上一轮（199）已把 rh 英文侧 38 族全部收口，按队列铁律转向中文侧。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 200 轮升级方向', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning,
    options: (r.all_options || []).map(o => [o.id, o.composite]) }, null, 1));
})().catch(e => { console.error('DECIDE_ERR', e.message); process.exit(1); });
