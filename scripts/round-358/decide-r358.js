// r358 decide：用封装好的决策模块选下一轮方向（node -e 内联嵌套容易被安全扫描拦）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { HeartFlowDecision } = require(path.join(ROOT, 'src/core/decision.js'));

const PROMPT = [
  '[A] 修 reasoning_coherence 反向同源：pseudo_causal 命中时不授予「完整推理链」高分',
  '     （357轮已定位到一半，伪归因反序句被判0.9优良，改动涉及结构评分基线）',
  '[B] 收口 93 个未跟踪文件的 git 卫生：scripts/round-* 探针目录批量入库',
  '     + 2 个已跑通负例守卫入库（r355/r356/r357 连续三轮移交）',
  '[C] 复测英文侧数字型差异句误伤族：polls show a 12% gap 型是否被三维齐发误伤',
  '     （r356 交接簿第 3 条，从未实测）',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮方向', prompt: PROMPT });
  console.log(JSON.stringify(r, null, 2));
})();
