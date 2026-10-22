// r542 第二轮：候选同分 0.74，decision 要求补判据。补三条：上游证据强度 / 下游影响面 / 是否可达「引擎首次产出」
const path = require('path');
const ROOT = process.cwd();
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const prompt = [
  '同一批候选上一轮全部同分 0.74，无法区隔。本轮补三条硬判据后重跑。',
  '',
  '[A] 打通 L4→L5 叙事传递（L5 生成层 currently 完全不接收 L3 命中的叙事原型）',
  '     可行性：高——L5.generateResponse 签名只多收一个可选参数，L4 已有 matchedNarrative 字段，',
  '       无需改数据结构，只需接线 + 在选词时优先用叙事 stages/framework 词表。',
  '     上游证据：r541 实测 L3 已能吐 weak_match（conf=0.15），L4 matchedNarrative 非 null，',
  '       但 L5 输出仍是无关联碎词串（实测 L5 首词与 L4 概念无关）。证据强，链条已定位到最后一环。',
  '     下游影响：改动集中在 word-by-word-generator.js 一个文件 + associative-engine.js 一处调用点，',
  '       不触碰字典数据、不触碰 gate/dimMap，回归面小。',
  '     后果预测：若成功，L5 首次能依据真实命中的叙事原型生成，',
  '       联想链从「L1-L4 有产出、L5 空转」变成「五层全通」——这是引擎此前不具备的能力。',
  '     风险：L5 输出仍可能是模板词拼接，改善幅度可测量（叙事词命中率从 0 → >0）但可能不达「可读」。',
  '',
  '[B] 给 dict-data emotion 词表补 17 个高频心理词（压力/紧张/疲惫/无力/失眠等）',
  '     可行性：中——要改生成器产物，且需先确认本地副本与 dict-data 的对应关系，',
  '       存在覆盖他人数据的风险；r541 明确警告「动前先确认对应关系」，本轮未做该确认。',
  '     上游证据：r541 实测压力族输入 L1 allAssociations=0，因词不在两个图谱中。证据强。',
  '     下游影响：改数据产物会让 L1 关联数变化，dimMap/gate 不受影响，',
  '       但需重跑桥接，且新增词可能引入误关联（悲伤词与负面族混淆）。',
  '     后果预测：情感支持类输入 L1 从 0 → 非 0，但 L5 仍空转，链条只补第 1 环。',
  '     风险：数据文件归属未确认即改，可能污染上游。',
  '',
  '[C] 修 L4  arousal 越界（引擎自身已检出的确定性数值 bug）',
  '     可行性：高——根因已定位（semantic-converger.js 边界裁剪用 [-10,10]，',
  '       而 CoherenceChecker 断言 [-1,1]），改一行常量即可。',
  '     上游证据：CoherenceChecker 实测已报该 issue（arousal=1.8379）。证据最强（引擎自检已确认）。',
  '     下游影响：仅一个文件的常量与除法因子，不影响任何外部契约。',
  '     后果预测：自检 issue 消失、数值契约恢复一致。但这是修一个「已被发现的缺陷」，',
  '       不新增任何此前不具备的辨别能力。',
  '     风险：几乎为零。',
  '',
  '请只按「可行性 / 上游证据强度 / 下游影响面 / 后果预测」四个维度打分，',
  '不要按「是否算真升级」加权——那会重复计分。给出 chosen 与理由。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '第 542 轮补判据重选：A 打通 L4→L5 / B 补 17 心理词 / C 修 arousal 越界', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
