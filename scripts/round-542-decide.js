// r542: 用 decision 本体从 r541 实测遗留的三个候选里选向（候选描述全部用形状，不带样本文本）
const path = require('path');
const ROOT = process.cwd();
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '当前引擎有一条 6942 行的联想理解链（L1 词联想 / L2 短语检测 / L3 叙事检索 / L4 语义收敛 / L5 逐词生成），',
  '已在 r538 接进 HeartFlow 本体，r540 接了中文分词器，r541 接了联想图谱格式桥接。',
  'r541 端到端实测（5 条中文样本）复测证据：',
  '  · L1 allAssociations 已可达 20 条 / intersectionBoost 可达 6 条',
  '  · L3 能吐 weak_match（matched=渐入佳境，conf=0.15）',
  '  · L4 activatedConcepts 已可达 5 个',
  '  · thoughtLog.confidence 已可达 1.0',
  '  · CoherenceChecker 已能检出一个真实越界（L4 情感 arousal 值 1.838 超出 [-1,1] 范围）',
  '  · 但 L5 依然输出无关联碎词串；L2 chunks 恒 0（仅成语样本出 1）',
  '',
  '上一轮（r541）交接说明里列了三个候选方向，均带实测证据：',
  '[A] L4→L5 叙事断点：r541 说「L3 已命中时 thoughtLog.matchedStory 显示 undefined 而非 null，',
  '     L5 拿不到叙事约束」。本轮复测初步看这是 r541 探测脚本自身的显示 bug',
  '     （脚本写的是 t.matchedStory ? (t.matchedStory.name || t.matchedStory.id) : ），',
  '     而 matchedNarrative 实际是字符串「渐入佳境」，字符串没有 name/id 属性故打印 undefined）。',
  '     若复测确认是脚本 bug 而非引擎断点，则 A 降级为「L5 根本不消费 L3/L4 的叙事结果」',
  '     ——实测 grep word-by-word-generator.js 全文无 narrative / matchedNarrative 字样，',
  '     L5 的 generateResponse 只接收 thoughtVector 一个参数，叙事框架从未进入生成层。',
  '     L5 输入里没有任何叙事/stages/framework 字段，这是结构性断点。',
  '[B] emotion 词表补 17 个高频心理词：压力/紧张/累/疲惫/无力/混乱/痛苦/哭/失眠/抑郁/',
  '     无助/委屈/内疚/后悔/情绪/压力大/心累。这些词在两个联想图谱里都不存在，',
  '     导致情感支持场景的核心输入 L1 联想恒 0。需改 dict-data 生成器产物。',
  '[C] L4 arousal 越界真 bug：CoherenceChecker 已抓到 arousal=1.8379 超出 [-1,1] 范围。',
  '     根因在 semantic-converger.js 的 computeThoughtVector：它把情感累加后除以',
  '     (totalContributions + 1)，但边界裁剪用的是 [-10,10] 而不是 [-1,1]，',
  '     与 CoherenceChecker 断言的 [-1,1] 契约不一致，属于引擎内部数值契约分叉。',
  '',
  '约束：本轮只能做完一个方向；C 是已由引擎自身检出的确定性 bug；A 是结构性断点但可能要动 L5 签名；',
  'B 要改数据文件产物，影响面最大。',
  '请按「能让引擎首次产生真实辨别输出的价值 / 依赖关系 / 工作量 / 是否真升级」综合判断，给出 chosen 与理由。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 542 轮方向：修联想链断点还是补词表', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
