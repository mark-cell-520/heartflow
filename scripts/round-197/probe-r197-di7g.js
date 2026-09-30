const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const idx=require(path.join(HF,'src/index.js'));
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
console.log('di', di.checkDangerousInstruction(S).count);
const g=idx.discriminate(S);
console.log('gate', g.gate.action, JSON.stringify((g.findings||[]).map(f=>f.dimension)));
// 用整个 gate 主入口
const gate=require(path.join(HF,'src/gate.js'));
const out=gate.checkOutput(S);
console.log('checkOutput', out.gate.action, JSON.stringify((out.findings||[]).map(f=>[f.dimension,f.severity])));
