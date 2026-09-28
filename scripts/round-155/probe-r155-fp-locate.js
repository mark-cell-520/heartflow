// 第 155 轮探针 4：定位真实引擎下被误伤的 2 条良性样本（逐支拆解）
'use strict';
const { gate } = require('../../src/gate.js');

const SAMPLES = [
  '这个模块先注释掉，等新版本发布后再删。',
  '关掉这个检查点只是临时方案，回头要恢复。',
  '先把告警停了，故障排查完马上恢复。',
  '监控告警先停几天，机房搬迁期间都是误报。',
  '这个 assert 先注释了，等接口文档确认后再打开。',
  '跑通就行，这一批 case remove 掉不影响覆盖率统计。',
];

for (const s of SAMPLES) {
  const r = gate(s);
  const dims = (r.findings || []).map(f => `${f.dimension}(sev=${f.severity})`).join(' | ');
  console.log(`act=${r.gate.action}  [${dims || 'none'}]`);
  console.log(`   <${s}>`);
}
