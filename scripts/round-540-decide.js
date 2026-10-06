// r540: 用 decision 本体从实测候选中选向（候选描述全部用形状，不带样本文本）
const path = require('path');
const ROOT = process.cwd();
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '当前引擎有一条 6942 行的联想理解链（L1 词联想 / L2 短语检测 / L3 叙事检索 / L4 语义收敛 / L5 逐词生成），',
  '已在 r538 接进 HeartFlow 本体（hf.associativeEngine 非 null，process() 可跑）。',
  '但实测它对中文自然语句完全空转，具体实测证据：',
  '  · tokenize() 只按空白和英文标点切分，中文整句恒切成 1 个 token',
  '  · association-graph.json 的 2045 个节点全部是空数组，边数 0',
  '  · 另一份 dict-data/association-graph.json 有 2388 个节点 / 7877 条边的真实数据，',
  '    但格式是 nodes:数组 + edges:数组，而 L1 加载器期待 nodes:{word:[assoc]} 字典，永久对不上',
  '  · 实测一条中文压力倾诉句：L1 联想 0 条 / L2 chunks 0 / L3 matched null / L4 concepts undefined /',
  '    L5 吐出无关联碎词串，而 coherence 打分 1.0 满分、issues 空',
  '',
  '候选方向（均带实测证据）：',
  '[A] 中文分词接入：给 associative-engine 加中文分词器（含单字回退+字典最长匹配），',
  '     让 L1/L2 首次对中文自然语句产出非空词序列。实测依据：18 条自然语句全 0 联想，',
  '     空格分隔样本命中图即证明切分是唯一阻断。这属于「把从未产出过辨别结果的能力真正激活」。',
  '[B] 图谱格式桥接：写一层加载器把 dict-data/ 的 2388 节点 + 7877 边转换为 L1 期待的字典格式，',
  '     补上 2045 个空节点。实测依据：两文件字段结构已逐字段比对，边带 weight 可直接映射 strength。',
  '     但前提是 A 先成立（无分词则图永远不命中）。',
  '[C] L4/L5 空 concepts 保护：L4 在 concepts 为空时仍让 L5 生成碎词串，',
  '     coherence 还给 1.0 满分。修这条能让失败显式化（不再用满分掩盖空转）。',
  '     实测依据：上条实测输出里 concepts undefined + coherence 1.0 + issues [] 同时出现。',
  '',
  '约束：本轮只能做完一个方向；A 是 B 的前提；C 是防止假能力的兜底。',
  '请按「能让引擎首次产生真实辨别输出的价值 / 依赖关系 / 工作量」综合判断，给出 chosen 与理由。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 540 轮方向：激活联想引擎哪一层', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
