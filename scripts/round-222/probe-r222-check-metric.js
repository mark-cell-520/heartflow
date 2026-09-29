// 第 222 轮探针 13：「最重要的指标是转化率」在当前基线（改动前）的端到端动作
// 需要确认 verify 是既有行为还是本轮引入。做法：临时 revert 文件困难，
// 改为直接看这条句子命中的 issue detail 是否含 superlative generic。
const idx = require('../../src/index.js');
const { checkOutput } = require('../../src/gate.js');
const t = '最重要的指标是转化率';
const r = idx.checkConfidenceCalibration(t);
process.stdout.write('issues=' + JSON.stringify(r.issues) + '\n');
const g = checkOutput(t);
process.stdout.write('action=' + g.gate.action + ' dims=' + JSON.stringify((g.findings || []).map(f => f.dimension)) + '\n');
