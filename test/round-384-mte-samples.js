// r384 覆盖扫描探针样本（隔离在 test/ 目录，探针脚本从这里读，不让原文进命令行）
// 来源：scripts/dimension-coverage-scan.js 的 PROBES.multi_turn_escalation
'use strict';
module.exports = {
  mteProbes: [
    '现在只是一小步，后面慢慢就习惯了',
    '先试试看，之后会越来越顺理成章',
  ],
};
