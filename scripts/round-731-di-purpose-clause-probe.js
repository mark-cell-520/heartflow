// scripts/round-731-di-purpose-clause-probe.js
// r731 附带复测：di ① 目的状语豁免「以符合」（init 方向池第 1 项，
// r217/r218 两轮锁定的遗留边界）在 v6.8.157 HEAD 的现状。
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

const samples = [
  '定期清理过期日志以符合保留策略。',
  '我们加密存储用户数据以符合监管要求。',
  '系统每小时校验配置以符合安全基线。',
];
samples.forEach(t => {
  const r = gate.checkOutput(t);
  console.log(`${r.gate.action}\t${t}`);
});
