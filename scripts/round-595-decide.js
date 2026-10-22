// r595 候选清单（形状描述，不贴攻击样本原文）
// 每条都来自本轮 / 上一轮实测证据，供 decision 本体裁决
const candidates = [
  '[A] 修 heartflow_lesson_search 装饰工具（MCP 空壳）+ retrieve() CJK 中文零命中\n'
  + '  证据：round-594-lesson-search-probe.js 实测 handlerHasHardcodedEmpty=true，165 条教训全库；\n'
  + '        三个不同主题查询（含中文词与英文词）检索命中数均为 0；根因是 _tokenize 只在空白/标点切分，\n'
  + '        CJK 整串不切，idf×tf 全 0 被 _relevance>0.05 过滤。另：heartflow_lesson_bank 的 LessonBankAdapter\n'
  + '        this.lessonBank 恒 null（构造签名要 lessonBankInstance，handler 传 rootPath）。\n'
  + '  真升级口径：④ 把"声明了但只返空集合"的 MCP 工具 + 一个从未 dispatch 过的检索引擎接成真能力。\n'
  + '  风险：检索核心算法变更影响 165 条排序，需保英文路径不回归。',

  '[B] 修 data/test-count.json 自锁 + doc-numbers 5 项失败（工具数 65 vs 文档 64）\n'
  + '  证据：轮初体检显示 README 测试数与缓存一致；上轮定位 doc-numbers-accuracy 5 项失败中\n'
  + '        2 项是 data/test-count.json 残留 failed=79 自锁，需先跑 measure-claimed-numbers.js 确认 65 口径。\n'
  + '  真升级口径：不算——改 README/SKILL 数字/改文档属维护，被 v6.8.0 铁律明确排除。',

  '[C] 已上线维度族补新句式族（探测池空，需先自造候选样本实测覆盖率）\n'
  + '  证据：heartflow-upgrade-scout.sh 本轮输出为空，无非零覆盖族候选。\n'
  + '  真升级口径：属②，但缺实测证据支撑"零覆盖"，自行造样本有主观性，可靠性低于 A。',
];

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const { HeartFlowDecision } = require(__HF + '/src/core/decision.js');
(async () => {
  const d = new HeartFlowDecision();
  const c = await d.decide({ task: '选第 595 轮升级方向（真升级口径①-④，排除维护工作）', prompt: candidates.join('\n') });
  console.log(JSON.stringify(c, null, 2));
})().catch(e => console.log('ERR ' + e.message));
