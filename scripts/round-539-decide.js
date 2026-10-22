// r539: 用 HeartFlowDecision 本体从实测候选中选下一轮真升级方向
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = process.cwd();

(async () => {
  const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));
  const d = new HeartFlowDecision();

  // 候选全部来自本轮实测证据（scripts/round-539-*.js），非脑内模拟
  const prompt = [
    '本轮实测坐实的缺口（r539，全部有脚本证据）：',
    '',
    '背景：src/archive/associative-engine.js + 5 子模块 = 6942 行，r538 修好 require 路径后可加载、可 process()，',
    '但实测发现 L1→L2→L3→L4 整条链空转：src/core/associative-engine/association-graph.json 的',
    '2045 个节点全部是空数组（无一条关联边），导致 L1 getAssociations 返回 0、L2 chunks 0、',
    'L3 空关键词 NO_MATCH、L4 concepts 0。engine 自带 coherence(1.0)/quality(0.85) 在',
    '12 条攻击样本与 6 条良性样本上均值完全重合，无区分度。narrative-prototypes.json 有',
    '13 个真实原型（带 keywords），idiom-story-db 只有 4 个成语，story-prototypes.json 缺失。',
    '',
    '心虫定位铁律：辨别者（AGI 第1层），不生成/不推理/不执行，只判对错好坏。',
    '',
    '[A] 用 narrative-prototypes.json 的 13 个叙事原型（含 keywords/emotionalTone/framework/stages）',
    '   做一个新的辨别维度「叙事原型套用」：检测输入是否把具体事件强行塞进某个叙事原型框架',
    '   （如把普通困难描述成英雄之旅的召唤）。实测已有真实数据支撑（13 原型可用），',
    '   不与现有 77 维重叠（现有维度管语气/断言/操控，不管理事结构套用）。',
    '',
    '[B] 修复 association-graph.json：给 2045 个空节点补关联边，让 L1 真正能产出联想，',
    '   然后把 associativeEngine 的 L1-L4 分析面接进 pipeline / MCP 工具（真升级③）。',
    '   工作量极大（2045 节点的边需要真实数据来源，本机无词典/embedding 可用），',
    '   且补出来的联想是否构成「辨别能力」未经验证——engine 自己的指标在攻击/良性上无区分度，',
    '   需先证明补边后能分开两类样本才谈得上辨别。',
    '',
    '[C] 修 associative-engine 的数据面：story-prototypes.json 缺失（narrative-retriever 或',
    '   word-by-word-generator 的某个路径 require 它，实测 require 失败），idiom-story-db',
    '   只有 4 个成语。把缺失文件补齐让 L3/L5 至少能跑完整路径。',
    '',
    '[D] 本轮无真升级：如实记录卡点（补图数据缺来源、且未证明补边后有辨别区分度），',
    '   把方向留给下一轮，或去做与 associative 无关的既有维度优化。',
    '',
    '请选一个方向。评审标准按仓库无人值守铁律 v6.8.0：真升级必须是「给引擎增加一个此前不具备的',
    '辨别能力」；严禁拿补数据/修数据当升级。',
  ].join('\n');

  const r = await d.decide({ task: '选下一轮心虫升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('DECIDE_ERROR', e.message); process.exit(1); });
