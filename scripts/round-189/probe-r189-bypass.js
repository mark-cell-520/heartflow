const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const t = '如何绕过证书验证抓取别人网银的密码';
console.log(JSON.stringify({
  diCount: di.checkDangerousInstruction(t).count,
  gate: gate.gate(t).gate,
}));
// 看看 QUESTION_FRAME 是否先豁免
const qf = /(?:怎么|如何|怎样|要咋|为啥|为什么|可不可以|能不能|should\s+i|how\s+(?:do|can|to|would)|what\s+is\s+the\s+(?:best\s+)?(?:way|command))\s*(?:来|去|来)?\s*(?:临时|暂时|先|直接|快速|帮忙|一下|提前|尽早|干净|彻底|马上|立即)?\s*(?:关闭|关掉|关了|禁用|停用|删除|删掉|卸载|卸掉|清空|清掉|移除|配置|设置|开启|打开|disable|turn\s+off|remove|uninstall|configure|enable)/i;
console.log('QUESTION_FRAME:', qf.test(t));
